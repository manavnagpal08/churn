"""HTTP interface for the explainable churn model."""
import io
import os
import sys
import logging
import secrets
from contextlib import asynccontextmanager
from typing import Optional, List, Dict, Any

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

import pandas as pd
from fastapi import FastAPI, HTTPException, UploadFile, File, Query, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from models import CustomerInput, ModelTrainConfig, PredictionResponse, BatchPredictionResponse, PredictorSelectConfig
from pipeline import pipeline, ALL_MODEL_FEATURES, REQUEST_PREDICTOR

logger = logging.getLogger(__name__)
MAX_UPLOAD_BYTES = (4 if os.getenv('VERCEL') else 10) * 1024 * 1024

@asynccontextmanager
async def lifespan(app):
    # Failed initialization fails readiness instead of pretending to be online.
    pipeline.load_and_prepare_data()
    pipeline.train_model(**pipeline.current_config)
    pipeline.initialize_predictor()
    yield

app = FastAPI(title='CHURN//ZERO API', version='1.1.0', lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in os.getenv('CORS_ORIGINS', 'http://localhost:3000,http://127.0.0.1:3000').split(',') if origin.strip()],
    allow_credentials=False, allow_methods=['GET', 'POST'], allow_headers=['Content-Type', 'X-Admin-Token', 'X-Predictor'],
)


def require_model_admin(x_admin_token: Optional[str] = Header(None)):
    if os.getenv('VERCEL'):
        raise HTTPException(409, 'Reference-tree retraining is available in the local application. The hosted reference model is fixed for consistent results.')
    token = os.getenv('CHURN_ADMIN_TOKEN')
    if token and (not x_admin_token or not secrets.compare_digest(token, x_admin_token)):
        raise HTTPException(403, 'Model changes require an administrator token.')
    if os.getenv('CHURN_ENV') == 'production' and not token:
        raise HTTPException(503, 'Model changes are disabled until an administrator token is configured.')


def internal_error(exc):
    logger.exception('Request failed', exc_info=exc)
    return HTTPException(500, 'The operation could not be completed. Please retry or contact the application administrator.')


@app.get('/api/status')
def get_status():
    with pipeline._lock:
        hosted=bool(os.getenv('VERCEL'))
        return {'brand': 'CHURN//ZERO', 'tagline': 'Understand the risk. Decode the decision. Retain the customer.',
                'status': pipeline.current_status(), 'config': pipeline.current_config.copy(),
                'capabilities': {'hosted':hosted,'reference_training':not hosted,'predictor_scope':'browser' if hosted else 'server'}}


@app.get('/api/health')
def health():
    if not pipeline.status['model_trained']:
        raise HTTPException(503, 'Model is not ready.')
    return {'ready': True}


@app.get('/api/analytics/eda')
def get_eda_analytics():
    return pipeline.get_eda_analytics()


@app.post('/api/model/train', dependencies=[Depends(require_model_admin)])
def train_model(config: ModelTrainConfig):
    try:
        evaluation = pipeline.train_model(**config.model_dump())
        return {'message': 'Decision tree retrained successfully.', 'evaluation': evaluation, 'status': pipeline.status.copy()}
    except ValueError as exc:
        raise HTTPException(400, str(exc)) from exc


@app.get('/api/model/evaluation')
def get_model_evaluation():
    return pipeline.get_active_evaluation()


@app.post('/api/model/select')
def select_predictor(config: PredictorSelectConfig,x_admin_token: Optional[str] = Header(None)):
    try:
        if os.getenv('VERCEL'):
            available={'decision_tree',pipeline.predictor_report['selected']['algorithm']} if pipeline.predictor_report else {'decision_tree'}
            if config.algorithm not in available:
                raise ValueError('This predictor has no validated benchmark configuration.')
            token=REQUEST_PREDICTOR.set(config.algorithm)
            try:
                return {'evaluation':pipeline.get_active_evaluation(),'status':pipeline.current_status()}
            finally:
                REQUEST_PREDICTOR.reset(token)
        require_model_admin(x_admin_token)
        evaluation = pipeline.select_predictor(config.algorithm)
        return {'evaluation': evaluation, 'status': pipeline.current_status()}
    except ValueError as exc:
        raise HTTPException(422, str(exc)) from exc


@app.get('/api/model/comparison')
def compare_criteria():
    result = pipeline.compare_criteria()
    result['comparison_notes'] = {'academic_context': 'Both models use binary CART. Gini measures impurity; entropy measures Shannon information gain. The active prediction model is unchanged by comparison.'}
    return result


@app.get('/api/tree/structure')
def get_tree_structure():
    return pipeline.get_tree_structure()


@app.post('/api/predict/single', response_model=PredictionResponse)
def predict_single(customer: CustomerInput):
    return pipeline.predict_single_customer(customer.model_dump(by_alias=True))


@app.post('/api/predict/batch', response_model=BatchPredictionResponse)
def predict_batch_records(records: List[Dict[str, Any]]):
    try:
        return pipeline.predict_batch(pd.DataFrame(records))
    except ValueError as exc:
        raise HTTPException(422, str(exc)) from exc


@app.post('/api/predict/upload', response_model=BatchPredictionResponse)
async def upload_and_predict_batch(file: UploadFile = File(...)):
    filename = (file.filename or '').lower()
    if not filename.endswith(('.csv', '.xlsx')):
        raise HTTPException(400, 'Choose a CSV or XLSX file.')
    try:
        content = await file.read(MAX_UPLOAD_BYTES + 1)
    finally:
        await file.close()
    if len(content) > MAX_UPLOAD_BYTES:
        raise HTTPException(413, f'File exceeds the {MAX_UPLOAD_BYTES // (1024 * 1024)} MB upload limit.')
    try:
        import zipfile
        if filename.endswith('.xlsx'):
            with zipfile.ZipFile(io.BytesIO(content)) as archive:
                if sum(item.file_size for item in archive.infolist()) > 100 * 1024 * 1024:
                    raise ValueError('Expanded workbook exceeds 100 MB.')
            frame = pd.read_excel(io.BytesIO(content), nrows=10001)
        else:
            frame = pd.read_csv(io.BytesIO(content), nrows=10001)
        frame.columns = frame.columns.str.strip()
        # Scoring is synchronous CPU work; keep it off the event loop.
        from starlette.concurrency import run_in_threadpool
        return await run_in_threadpool(pipeline.predict_batch, frame)
    except Exception as exc:
        raise HTTPException(422, f'Unable to score file: {exc}') from exc


@app.get('/api/predict/template')
def batch_template():
    sample = CustomerInput().model_dump(by_alias=True)
    return csv_response(pd.DataFrame([sample]), 'churn_zero_batch_template.csv')


@app.get('/api/portfolio/customers')
def get_portfolio_customers(
    page: int = Query(1, ge=1), page_size: int = Query(25, ge=5, le=100),
    search: Optional[str] = Query(None, max_length=200), contract: Optional[str] = None,
    churn_filter: Optional[str] = None, sort_by: str = 'CustomerID', sort_dir: str = 'asc',
):
    return pipeline.get_portfolio_customers(page, page_size, search, contract, churn_filter, sort_by, sort_dir)


def csv_response(frame, filename):
    # Prevent spreadsheet formula execution from user-controlled text.
    safe = frame.copy()
    for column in safe.select_dtypes(include=['object', 'string']).columns:
        safe[column] = safe[column].map(lambda value: "'" + value if isinstance(value, str) and value.lstrip().startswith(('=', '+', '-', '@', '\t', '\r', '\n')) else value)
    return StreamingResponse(io.BytesIO(safe.to_csv(index=False).encode('utf-8-sig')),
        media_type='text/csv', headers={'Content-Disposition': f'attachment; filename={filename}'})


@app.get('/api/portfolio/export')
def export_portfolio_csv(contract: Optional[str] = None, churn_filter: Optional[str] = None,
                         search: Optional[str] = Query(None, max_length=200),
                         sort_by: str = 'CustomerID', sort_dir: str = 'asc'):
    with pipeline._lock:
        # Reuse the exact portfolio filtering and ordering logic.
        result = pipeline.get_portfolio_customers(page_size=len(pipeline.df_clean), search=search,
            contract=contract, churn_filter=churn_filter, sort_by=sort_by, sort_dir=sort_dir)
        ids = [row['CustomerID'] for row in result['customers']]
        frame = pipeline.df_clean.set_index('CustomerID').loc[ids].reset_index()
        columns = ['CustomerID', 'Gender', 'Senior Citizen', 'Partner', 'Dependents',
                   'Tenure Months', 'Contract', 'Internet Service', 'Payment Method',
                   'Monthly Charges', 'Total Charges', 'Churn Label']
        exported = frame[columns].copy()
        if len(frame):
            transformed = pipeline.predictor_input(frame)
            labels = pipeline.model_labels(pipeline.predictor, transformed)
            probabilities = pipeline.model_probabilities(pipeline.predictor, transformed)[:, 1]
        else:
            labels, probabilities = [], []
        exported['Predicted_Churn'] = ['Yes' if label == 1 else 'No' for label in labels]
        exported['Model_Churn_Probability'] = [round(float(prob), 4) for prob in probabilities]
        exported['Risk_Tier'] = ['High Risk' if prob >= .6 else 'Moderate Risk' if prob >= .3 else 'Low Risk' for prob in probabilities]
        exported['Prediction_Model'] = pipeline.model_name
        return csv_response(exported, 'churn_zero_portfolio_export.csv')


@app.middleware('http')
async def hosted_predictor_context(request,call_next):
    """Hosted selections are isolated per browser request, never global worker state."""
    token=None
    if os.getenv('VERCEL'):
        selected=request.headers.get('X-Predictor') or request.query_params.get('predictor')
        if selected:
            available={'decision_tree',pipeline.predictor_report['selected']['algorithm']} if pipeline.predictor_report else {'decision_tree'}
            if selected not in available:
                return JSONResponse(status_code=422,content={'detail':'Selected predictor is unavailable. Reload the workspace to use the current validated model.'})
            token=REQUEST_PREDICTOR.set(selected)
    try:
        response=await call_next(request)
        response.headers['X-Content-Type-Options']='nosniff'
        return response
    finally:
        if token is not None: REQUEST_PREDICTOR.reset(token)


frontend_dist = os.path.join(os.path.dirname(CURRENT_DIR), 'frontend', 'dist')
if os.path.isdir(frontend_dist):
    app.mount('/', StaticFiles(directory=frontend_dist, html=True), name='frontend')


if __name__ == '__main__':
    import uvicorn
    uvicorn.run('main:app', host='127.0.0.1', port=8000)
