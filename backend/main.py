import io
import os
import sys

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

import pandas as pd
from fastapi import FastAPI, HTTPException, UploadFile, File, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from typing import Optional, List, Dict, Any

from models import CustomerInput, ModelTrainConfig, PredictionResponse, BatchPredictionResponse
from pipeline import pipeline, ALL_MODEL_FEATURES

app = FastAPI(
    title="CHURN//ZERO API",
    description="Customer Churn Prediction & Decision Tree Intelligence Platform",
    version="1.0.0"
)

# Enable CORS for frontend Vite dev server (and production host)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    print("[CHURN//ZERO] Initializing data pipeline and baseline Decision Tree...")
    try:
        pipeline.load_and_prepare_data()
        pipeline.train_model(criterion="gini", max_depth=5, min_samples_leaf=20)
        print("[CHURN//ZERO] Pipeline ready! Baseline Gini Decision Tree trained successfully.")
    except Exception as e:
        print(f"[CHURN//ZERO] Startup initialization warning: {e}")

@app.get("/api/status")
def get_status():
    try:
        if not pipeline.status["dataset_loaded"]:
            pipeline.load_and_prepare_data()
        if not pipeline.status["model_trained"]:
            pipeline.train_model()
    except Exception as e:
        print(f"[Lazy Init Warning]: {e}")
        
    return {
        "brand": "CHURN//ZERO",
        "tagline": "Understand the risk. Decode the decision. Retain the customer.",
        "status": pipeline.status,
        "config": pipeline.current_config
    }

@app.get("/api/analytics/eda")
def get_eda_analytics():
    try:
        return pipeline.get_eda_analytics()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/model/train")
def train_model(config: ModelTrainConfig):
    try:
        eval_result = pipeline.train_model(
            criterion=config.criterion,
            max_depth=config.max_depth,
            min_samples_leaf=config.min_samples_leaf,
            ccp_alpha=config.ccp_alpha
        )
        return {
            "message": f"Decision Tree ({config.criterion.upper()}) retrained successfully.",
            "evaluation": eval_result,
            "status": pipeline.status
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/model/evaluation")
def get_model_evaluation():
    try:
        if pipeline.model is None:
            pipeline.train_model()
        cache_key = f"{pipeline.current_config['criterion']}_{pipeline.current_config['max_depth']}_{pipeline.current_config['min_samples_leaf']}_{pipeline.current_config['ccp_alpha']}"
        if cache_key in pipeline.eval_cache:
            return pipeline.eval_cache[cache_key]
        return pipeline._evaluate_model(pipeline.model)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/model/comparison")
def compare_criteria():
    """
    Evaluates both CART Gini and Entropy criteria on the identical train/test split.
    Accurately demonstrates CART Gini vs Entropy/Information-Gain formulation.
    """
    try:
        depth = pipeline.current_config.get("max_depth", 5)
        leaf = pipeline.current_config.get("min_samples_leaf", 20)
        alpha = pipeline.current_config.get("ccp_alpha", 0.0)
        
        # Save current active criterion
        active_crit = pipeline.current_config["criterion"]
        
        # Train and evaluate Gini
        gini_eval = pipeline.train_model("gini", max_depth=depth, min_samples_leaf=leaf, ccp_alpha=alpha)
        # Train and evaluate Entropy
        entropy_eval = pipeline.train_model("entropy", max_depth=depth, min_samples_leaf=leaf, ccp_alpha=alpha)
        
        # Restore user's active criterion
        if active_crit != "entropy":
            pipeline.train_model("gini", max_depth=depth, min_samples_leaf=leaf, ccp_alpha=alpha)
            
        return {
            "gini": gini_eval,
            "entropy": entropy_eval,
            "comparison_notes": {
                "academic_context": "Both configurations use CART's binary recursive partitioning framework implemented in scikit-learn. The 'entropy' criterion measures Information Gain via Shannon entropy (-sum(p*log2(p))), similar to ID3/C4.5 split criteria, whereas 'gini' measures Gini Impurity (1 - sum(p^2))."
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/tree/structure")
def get_tree_structure():
    try:
        return pipeline.get_tree_structure()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/predict/single", response_model=PredictionResponse)
def predict_single(customer: CustomerInput):
    try:
        data_dict = customer.dict(by_alias=True)
        res = pipeline.predict_single_customer(data_dict)
        return res
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/predict/batch", response_model=BatchPredictionResponse)
def predict_batch_records(records: List[Dict[str, Any]]):
    try:
        df_input = pd.DataFrame(records)
        return pipeline.predict_batch(df_input)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/predict/upload")
async def upload_and_predict_batch(file: UploadFile = File(...)):
    filename = file.filename.lower()
    content = await file.read()
    
    try:
        if filename.endswith(".csv"):
            df_upload = pd.read_csv(io.BytesIO(content))
        elif filename.endswith((".xlsx", ".xls")):
            df_upload = pd.read_excel(io.BytesIO(content))
        else:
            raise HTTPException(status_code=400, detail="Only CSV or Excel (.xlsx, .xls) files are supported.")
            
        # Schema validation: Ensure model features exist
        missing = [f for f in ALL_MODEL_FEATURES if f not in df_upload.columns]
        if missing:
            raise HTTPException(
                status_code=422,
                detail=f"Uploaded file missing required features: {missing}. Schema must match the Telco dataset features."
            )
            
        results = pipeline.predict_batch(df_upload)
        return results
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"File processing error: {str(e)}")

@app.get("/api/portfolio/customers")
def get_portfolio_customers(
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=5, le=100),
    search: Optional[str] = Query(None),
    contract: Optional[str] = Query(None),
    churn_filter: Optional[str] = Query(None),
    sort_by: str = Query("CustomerID"),
    sort_dir: str = Query("asc")
):
    try:
        return pipeline.get_portfolio_customers(
            page=page,
            page_size=page_size,
            search=search,
            contract=contract,
            churn_filter=churn_filter,
            sort_by=sort_by,
            sort_dir=sort_dir
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/portfolio/export")
def export_portfolio_csv(
    contract: Optional[str] = Query(None),
    churn_filter: Optional[str] = Query(None)
):
    try:
        df = pipeline.df_clean.copy()
        if contract and contract != "All":
            df = df[df['Contract'] == contract]
        if churn_filter and churn_filter != "All":
            if churn_filter.lower() in ["churn", "yes", "1"]:
                df = df[df['Target'] == 1]
            elif churn_filter.lower() in ["retained", "no", "0"]:
                df = df[df['Target'] == 0]
                
        # Generate model predictions for the exported set
        X_proc = pipeline.preprocessor.transform(df[ALL_MODEL_FEATURES])
        preds = pipeline.model.predict(X_proc)
        probs = pipeline.model.predict_proba(X_proc)[:, 1]
        
        df_export = df[['CustomerID', 'Gender', 'Senior Citizen', 'Partner', 'Dependents',
                        'Tenure Months', 'Contract', 'Internet Service', 'Payment Method',
                        'Monthly Charges', 'Total Charges', 'Churn Label']].copy()
        df_export['Predicted_Churn'] = ["Yes" if p == 1 else "No" for p in preds]
        df_export['Model_Churn_Probability'] = [round(float(p), 4) for p in probs]
        df_export['Risk_Tier'] = ["High Risk" if p >= 0.6 else ("Moderate Risk" if p >= 0.3 else "Low Risk") for p in probs]
        
        stream = io.StringIO()
        df_export.to_csv(stream, index=False)
        stream.seek(0)
        
        return StreamingResponse(
            io.BytesIO(stream.getvalue().encode()),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=churn_zero_portfolio_export.csv"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
