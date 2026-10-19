import os
import datetime
import numpy as np
import pandas as pd
from typing import Dict, Any, List, Optional, Tuple
import joblib

from sklearn.model_selection import train_test_split
from sklearn.tree import DecisionTreeClassifier
from sklearn.preprocessing import OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, confusion_matrix, classification_report, roc_curve
)

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
BASE_DIR = os.path.dirname(CURRENT_DIR)

if os.path.exists(os.path.join(CURRENT_DIR, "Telco_customer_churn.xlsx")):
    DATASET_PATH = os.path.join(CURRENT_DIR, "Telco_customer_churn.xlsx")
else:
    DATASET_PATH = os.path.join(BASE_DIR, "Telco_customer_churn.xlsx")

ARTIFACTS_DIR = os.path.join(CURRENT_DIR, "artifacts")
os.makedirs(ARTIFACTS_DIR, exist_ok=True)

CATEGORICAL_FEATURES = [
    'Gender', 'Senior Citizen', 'Partner', 'Dependents',
    'Phone Service', 'Multiple Lines', 'Internet Service', 'Online Security',
    'Online Backup', 'Device Protection', 'Tech Support', 'Streaming TV',
    'Streaming Movies', 'Contract', 'Paperless Billing', 'Payment Method'
]

NUMERIC_FEATURES = [
    'Tenure Months', 'Monthly Charges', 'Total Charges'
]

ALL_MODEL_FEATURES = CATEGORICAL_FEATURES + NUMERIC_FEATURES

LEAKAGE_AND_METADATA_COLUMNS = [
    'CustomerID', 'Count', 'Country', 'State', 'City', 'Zip Code',
    'Lat Long', 'Latitude', 'Longitude', 'Churn Value', 'Churn Score',
    'Churn Reason', 'CLTV'
]

class ChurnMLPipeline:
    def __init__(self):
        self.df_raw: Optional[pd.DataFrame] = None
        self.df_clean: Optional[pd.DataFrame] = None
        self.preprocessor: Optional[ColumnTransformer] = None
        self.model: Optional[DecisionTreeClassifier] = None
        self.feature_names_out: List[str] = []
        
        # Training / Test sets
        self.X_train: Optional[pd.DataFrame] = None
        self.X_test: Optional[pd.DataFrame] = None
        self.y_train: Optional[pd.Series] = None
        self.y_test: Optional[pd.Series] = None
        self.X_train_proc: Optional[np.ndarray] = None
        self.X_test_proc: Optional[np.ndarray] = None
        
        # Current active config
        self.current_config = {
            "criterion": "gini",
            "max_depth": 5,
            "min_samples_leaf": 20,
            "ccp_alpha": 0.0
        }
        
        # Precomputed evaluations
        self.eval_cache: Dict[str, Any] = {}
        self.status = {
            "dataset_loaded": False,
            "total_records": 0,
            "model_trained": False,
            "active_criterion": "gini",
            "last_trained_at": None,
            "accuracy": None
        }

    def load_and_prepare_data(self) -> pd.DataFrame:
        if not os.path.exists(DATASET_PATH):
            raise FileNotFoundError(f"Mandatory dataset not found at: {DATASET_PATH}")
            
        print(f"[Pipeline] Loading dataset from {DATASET_PATH}...")
        self.df_raw = pd.read_excel(DATASET_PATH)
        df = self.df_raw.copy()
        
        # Verify mandatory target column
        if 'Churn Label' not in df.columns:
            raise ValueError("Target column 'Churn Label' not found in dataset")
            
        # Clean Total Charges: spaces and empty strings converted to numeric, fill 0.0 for tenure 0
        df['Total Charges'] = pd.to_numeric(
            df['Total Charges'].replace(' ', np.nan),
            errors='coerce'
        ).fillna(0.0)
        
        # Ensure Numeric types
        df['Tenure Months'] = pd.to_numeric(df['Tenure Months'], errors='coerce').fillna(0).astype(int)
        df['Monthly Charges'] = pd.to_numeric(df['Monthly Charges'], errors='coerce').fillna(0.0)
        
        # Clean Categorical columns
        for col in CATEGORICAL_FEATURES:
            if col in df.columns:
                df[col] = df[col].astype(str).str.strip()
            else:
                raise ValueError(f"Required feature '{col}' missing from Telco dataset")
                
        # Target encoding
        df['Target'] = (df['Churn Label'] == 'Yes').astype(int)
        
        self.df_clean = df
        self.status["dataset_loaded"] = True
        self.status["total_records"] = len(df)
        
        # Split train and test strictly with random_state=42 and stratified target
        X = df[ALL_MODEL_FEATURES].copy()
        y = df['Target'].copy()
        
        self.X_train, self.X_test, self.y_train, self.y_test = train_test_split(
            X, y, test_size=0.20, random_state=42, stratify=y
        )
        
        # Build preprocessor: OneHotEncoder for categoricals, passthrough for numerics
        self.preprocessor = ColumnTransformer(
            transformers=[
                ('cat', OneHotEncoder(sparse_output=False, handle_unknown='ignore'), CATEGORICAL_FEATURES),
                ('num', 'passthrough', NUMERIC_FEATURES)
            ]
        )
        
        # Fit ONLY on training data to prevent data leakage!
        self.X_train_proc = self.preprocessor.fit_transform(self.X_train)
        self.X_test_proc = self.preprocessor.transform(self.X_test)
        self.feature_names_out = list(self.preprocessor.get_feature_names_out())
        
        print(f"[Pipeline] Data loaded: {len(df)} rows. Train: {len(self.X_train)}, Test: {len(self.X_test)}. Preprocessed features: {len(self.feature_names_out)}")
        return self.df_clean

    def train_model(self, criterion: str = "gini", max_depth: Optional[int] = 5,
                    min_samples_leaf: int = 20, ccp_alpha: float = 0.0) -> Dict[str, Any]:
        if self.df_clean is None:
            self.load_and_prepare_data()
            
        criterion = criterion.lower()
        if criterion not in ["gini", "entropy"]:
            raise ValueError("Criterion must be either 'gini' or 'entropy'")
            
        self.current_config = {
            "criterion": criterion,
            "max_depth": max_depth,
            "min_samples_leaf": min_samples_leaf,
            "ccp_alpha": ccp_alpha
        }
        
        model = DecisionTreeClassifier(
            criterion=criterion,
            max_depth=max_depth,
            min_samples_leaf=min_samples_leaf,
            ccp_alpha=ccp_alpha,
            random_state=42
        )
        
        # Fit model on training data
        model.fit(self.X_train_proc, self.y_train)
        self.model = model
        
        # Save fitted model & preprocessor to artifacts
        artifact_path = os.path.join(ARTIFACTS_DIR, f"dt_model_{criterion}.joblib")
        joblib.dump({"model": model, "preprocessor": self.preprocessor, "config": self.current_config}, artifact_path)
        
        # Evaluate performance on test and train
        evaluation = self._evaluate_model(model)
        
        self.status["model_trained"] = True
        self.status["active_criterion"] = criterion
        self.status["last_trained_at"] = datetime.datetime.now().isoformat()
        self.status["accuracy"] = evaluation["test_metrics"]["accuracy"]
        
        cache_key = f"{criterion}_{max_depth}_{min_samples_leaf}_{ccp_alpha}"
        self.eval_cache[cache_key] = evaluation
        return evaluation

    def _evaluate_model(self, model: DecisionTreeClassifier) -> Dict[str, Any]:
        # Predictions on Train
        y_train_pred = model.predict(self.X_train_proc)
        y_train_prob = model.predict_proba(self.X_train_proc)[:, 1]
        
        train_acc = float(accuracy_score(self.y_train, y_train_pred))
        train_prec = float(precision_score(self.y_train, y_train_pred, zero_division=0))
        train_rec = float(recall_score(self.y_train, y_train_pred, zero_division=0))
        train_f1 = float(f1_score(self.y_train, y_train_pred, zero_division=0))
        train_auc = float(roc_auc_score(self.y_train, y_train_prob))
        
        # Predictions on Held-out Test
        y_test_pred = model.predict(self.X_test_proc)
        y_test_prob = model.predict_proba(self.X_test_proc)[:, 1]
        
        test_acc = float(accuracy_score(self.y_test, y_test_pred))
        test_prec = float(precision_score(self.y_test, y_test_pred, zero_division=0))
        test_rec = float(recall_score(self.y_test, y_test_pred, zero_division=0))
        test_f1 = float(f1_score(self.y_test, y_test_pred, zero_division=0))
        test_auc = float(roc_auc_score(self.y_test, y_test_prob))
        
        # Confusion matrix: [[TN, FP], [FN, TP]]
        cm = confusion_matrix(self.y_test, y_test_pred)
        tn, fp, fn, tp = int(cm[0, 0]), int(cm[0, 1]), int(cm[1, 0]), int(cm[1, 1])
        
        # Classification report breakdown
        clf_report = classification_report(self.y_test, y_test_pred, output_dict=True, zero_division=0)
        
        # ROC Curve
        fpr, tpr, thresholds = roc_curve(self.y_test, y_test_prob)
        # Sample points to keep payload manageable and smooth
        step = max(1, len(fpr) // 50)
        roc_points = [
            {
                "fpr": round(float(fpr[i]), 4),
                "tpr": round(float(tpr[i]), 4),
                "threshold": round(float(thresholds[i]), 4) if np.isfinite(thresholds[i]) else 1.0
            }
            for i in range(0, len(fpr), step)
        ]
        if roc_points[-1]["fpr"] != 1.0:
            roc_points.append({"fpr": 1.0, "tpr": 1.0, "threshold": 0.0})
            
        # Feature importances
        importances = self.get_feature_importances(model)
        
        # Tree complexity
        tree_meta = {
            "total_nodes": int(model.tree_.node_count),
            "leaf_nodes": int(model.tree_.n_leaves),
            "max_depth": int(model.tree_.max_depth),
            "criterion": model.criterion
        }
        
        return {
            "config": self.current_config,
            "train_metrics": {
                "accuracy": round(train_acc, 4),
                "precision": round(train_prec, 4),
                "recall": round(train_rec, 4),
                "f1": round(train_f1, 4),
                "roc_auc": round(train_auc, 4),
                "samples": len(self.y_train)
            },
            "test_metrics": {
                "accuracy": round(test_acc, 4),
                "precision": round(test_prec, 4),
                "recall": round(test_rec, 4),
                "f1": round(test_f1, 4),
                "roc_auc": round(test_auc, 4),
                "samples": len(self.y_test)
            },
            "confusion_matrix": {
                "tn": tn,
                "fp": fp,
                "fn": fn,
                "tp": tp,
                "total": tn + fp + fn + tp
            },
            "classification_report": clf_report,
            "roc_curve": roc_points,
            "feature_importances": importances,
            "tree_metadata": tree_meta
        }

    def get_feature_importances(self, model: Optional[DecisionTreeClassifier] = None) -> List[Dict[str, Any]]:
        m = model or self.model
        if m is None:
            return []
            
        importances = m.feature_importances_
        raw_list = []
        for name, val in zip(self.feature_names_out, importances):
            if val > 0.0001:
                clean_name = self._clean_feature_name(name)
                raw_list.append({
                    "raw_feature": name,
                    "feature_name": clean_name,
                    "importance": round(float(val), 4),
                    "importance_pct": round(float(val) * 100, 2)
                })
                
        # Sort descending by importance
        raw_list.sort(key=lambda x: x["importance"], reverse=True)
        return raw_list

    def _clean_feature_name(self, raw_name: str) -> str:
        if raw_name.startswith("cat__"):
            parts = raw_name[5:].split("_", 1)
            if len(parts) == 2:
                col, cat = parts[0], parts[1]
                return f"{col}: {cat}"
            return raw_name[5:]
        elif raw_name.startswith("num__"):
            return raw_name[5:]
        return raw_name

    def _format_rule_condition(self, raw_feature: str, threshold: float, is_left: bool) -> str:
        """
        In scikit-learn CART, the left child corresponds to feature <= threshold.
        Right child corresponds to feature > threshold.
        """
        if raw_feature.startswith("cat__"):
            parts = raw_feature[5:].split("_", 1)
            col = parts[0] if len(parts) > 0 else raw_feature
            cat = parts[1] if len(parts) > 1 else ""
            if threshold <= 0.5:
                # Binary one-hot split at 0.5
                if is_left:
                    # <= 0.5 means the one-hot bit is 0, so NOT this category
                    return f"{col} is NOT '{cat}'"
                else:
                    # > 0.5 means the one-hot bit is 1, so IS this category
                    return f"{col} is '{cat}'"
            else:
                return f"{col} == '{cat}'"
        elif raw_feature.startswith("num__"):
            col = raw_feature[5:]
            op = "<=" if is_left else ">"
            if "Charge" in col:
                return f"{col} {op} ${threshold:.2f}"
            else:
                return f"{col} {op} {threshold:.1f}"
        return f"{raw_feature} {'<=' if is_left else '>'} {threshold:.2f}"

    def get_tree_structure(self) -> Dict[str, Any]:
        """
        Serializes the trained DecisionTreeClassifier into a complete interactive hierarchical tree.
        """
        if self.model is None:
            self.train_model(self.current_config["criterion"])
            
        tree_ = self.model.tree_
        feature_names = self.feature_names_out
        criterion_name = self.model.criterion.capitalize()
        total_samples = int(tree_.n_node_samples[0])
        
        def recurse(node_id: int, depth: int, branch_rule: str = "Root") -> Dict[str, Any]:
            node_id = int(node_id)
            depth = int(depth)
            is_leaf = bool(tree_.children_left[node_id] == tree_.children_right[node_id])
            samples = int(tree_.n_node_samples[node_id])
            impurity = round(float(tree_.impurity[node_id]), 4)
            val = tree_.value[node_id][0]
            retained_count = int(val[0])
            churn_count = int(val[1])
            total_in_node = retained_count + churn_count
            churn_prob = round(float(churn_count) / total_in_node if total_in_node > 0 else 0.0, 4)
            pred_class = "Churn" if churn_count > retained_count else "Retained"
            
            node_data = {
                "id": int(node_id),
                "depth": int(depth),
                "is_leaf": bool(is_leaf),
                "branch_rule": branch_rule,
                "samples": samples,
                "samples_pct": round(float(samples) / total_samples * 100, 1),
                "retained_count": retained_count,
                "churn_count": churn_count,
                "churn_prob": churn_prob,
                "predicted_class": pred_class,
                "impurity": impurity,
                "impurity_type": criterion_name
            }
            
            if is_leaf:
                node_data["name"] = f"Leaf {node_id} ({pred_class})"
                node_data["rule"] = "Terminal classification"
                return node_data
            else:
                feat_idx = int(tree_.feature[node_id])
                raw_feature = str(feature_names[feat_idx])
                threshold = float(tree_.threshold[node_id])
                clean_name = self._clean_feature_name(raw_feature)
                
                left_rule = self._format_rule_condition(raw_feature, threshold, is_left=True)
                right_rule = self._format_rule_condition(raw_feature, threshold, is_left=False)
                
                node_data["name"] = clean_name
                node_data["feature_raw"] = raw_feature
                node_data["threshold"] = round(threshold, 2)
                node_data["split_condition"] = f"{clean_name} <= {threshold:.2f}"
                node_data["left_rule"] = left_rule
                node_data["right_rule"] = right_rule
                
                left_child = recurse(int(tree_.children_left[node_id]), depth + 1, left_rule)
                right_child = recurse(int(tree_.children_right[node_id]), depth + 1, right_rule)
                node_data["children"] = [left_child, right_child]
                return node_data
                
        tree_hierarchy = recurse(0, 0, "All Customers")
        return {
            "root": tree_hierarchy,
            "metadata": {
                "criterion": self.model.criterion,
                "max_depth": int(self.model.tree_.max_depth),
                "total_nodes": int(self.model.tree_.node_count),
                "leaf_nodes": int(self.model.tree_.n_leaves),
                "total_samples": total_samples
            }
        }

    def predict_single_customer(self, customer_dict: Dict[str, Any]) -> Dict[str, Any]:
        if self.model is None:
            self.train_model(self.current_config["criterion"])
            
        # Ensure numeric Total Charges is derived if missing or None
        tenure = int(customer_dict.get("Tenure Months", 0))
        monthly = float(customer_dict.get("Monthly Charges", 0.0))
        total_charges = customer_dict.get("Total Charges")
        if total_charges is None or str(total_charges).strip() == "" or float(total_charges) == 0.0:
            total_charges = float(tenure * monthly)
        else:
            total_charges = float(total_charges)
            
        row_dict = {
            'Gender': str(customer_dict.get('Gender', 'Female')),
            'Senior Citizen': str(customer_dict.get('Senior Citizen', 'No')),
            'Partner': str(customer_dict.get('Partner', 'No')),
            'Dependents': str(customer_dict.get('Dependents', 'No')),
            'Tenure Months': tenure,
            'Phone Service': str(customer_dict.get('Phone Service', 'Yes')),
            'Multiple Lines': str(customer_dict.get('Multiple Lines', 'No')),
            'Internet Service': str(customer_dict.get('Internet Service', 'DSL')),
            'Online Security': str(customer_dict.get('Online Security', 'No')),
            'Online Backup': str(customer_dict.get('Online Backup', 'No')),
            'Device Protection': str(customer_dict.get('Device Protection', 'No')),
            'Tech Support': str(customer_dict.get('Tech Support', 'No')),
            'Streaming TV': str(customer_dict.get('Streaming TV', 'No')),
            'Streaming Movies': str(customer_dict.get('Streaming Movies', 'No')),
            'Contract': str(customer_dict.get('Contract', 'Month-to-month')),
            'Paperless Billing': str(customer_dict.get('Paperless Billing', 'Yes')),
            'Payment Method': str(customer_dict.get('Payment Method', 'Electronic check')),
            'Monthly Charges': monthly,
            'Total Charges': total_charges
        }
        
        df_single = pd.DataFrame([row_dict])
        X_single_proc = self.preprocessor.transform(df_single)
        
        # Predict probability & class
        prob_churn = float(self.model.predict_proba(X_single_proc)[0, 1])
        pred_label = int(self.model.predict(X_single_proc)[0])
        
        # Risk tier definition (product-defined operational bands)
        if prob_churn >= 0.60:
            risk_level = "High Risk"
            risk_color = "red"
        elif prob_churn >= 0.30:
            risk_level = "Moderate Risk"
            risk_color = "yellow"
        else:
            risk_level = "Low Risk"
            risk_color = "neutral"
            
        prediction_text = "Likely to churn" if pred_label == 1 else "Not likely to churn"
        
        # Trace exact decision path through the tree
        tree_ = self.model.tree_
        indicator = self.model.decision_path(X_single_proc)
        node_indices = indicator.indices.tolist()
        
        decision_path: List[Dict[str, Any]] = []
        key_drivers: List[str] = []
        
        for i in range(len(node_indices)):
            node_id = node_indices[i]
            is_leaf = (i == len(node_indices) - 1)
            
            samples = int(tree_.n_node_samples[node_id])
            impurity = round(float(tree_.impurity[node_id]), 4)
            val = tree_.value[node_id][0]
            retained_count, churn_count = int(val[0]), int(val[1])
            tot = retained_count + churn_count
            node_churn_prob = round(float(churn_count) / tot if tot > 0 else 0.0, 4)
            
            if not is_leaf:
                next_node_id = node_indices[i + 1]
                feat_idx = tree_.feature[node_id]
                raw_feature = self.feature_names_out[feat_idx]
                threshold = float(tree_.threshold[node_id])
                
                # Check whether left (<=) or right (>) child was chosen
                went_left = (next_node_id == tree_.children_left[node_id])
                rule_evaluated = self._format_rule_condition(raw_feature, threshold, is_left=went_left)
                clean_name = self._clean_feature_name(raw_feature)
                
                # Extract actual customer value
                user_val = None
                if raw_feature.startswith("cat__"):
                    parts = raw_feature[5:].split("_", 1)
                    col = parts[0]
                    user_val = row_dict.get(col, "N/A")
                elif raw_feature.startswith("num__"):
                    col = raw_feature[5:]
                    user_val = row_dict.get(col, "N/A")
                    
                step_info = {
                    "node_id": node_id,
                    "feature": raw_feature,
                    "feature_name_clean": clean_name,
                    "rule_condition": rule_evaluated,
                    "user_value": user_val,
                    "satisfied": True,
                    "samples": samples,
                    "impurity": impurity,
                    "churn_probability": node_churn_prob,
                    "is_leaf": False
                }
                decision_path.append(step_info)
                key_drivers.append(rule_evaluated)
            else:
                # Terminal leaf node
                decision_path.append({
                    "node_id": node_id,
                    "feature": None,
                    "feature_name_clean": f"Leaf Node #{node_id}",
                    "rule_condition": f"Terminal Leaf: {retained_count} retained vs {churn_count} churned in training cohort",
                    "user_value": f"{prediction_text} (Cohort Churn Rate: {node_churn_prob * 100:.1f}%)",
                    "satisfied": True,
                    "samples": samples,
                    "impurity": impurity,
                    "churn_probability": node_churn_prob,
                    "is_leaf": True
                })
                
        return {
            "prediction": prediction_text,
            "churn_label": pred_label,
            "churn_probability": round(prob_churn, 4),
            "risk_level": risk_level,
            "risk_color": risk_color,
            "decision_path": decision_path,
            "key_drivers": key_drivers,
            "model_criterion": self.model.criterion,
            "model_max_depth": int(self.model.tree_.max_depth),
            "timestamp": datetime.datetime.now().isoformat()
        }

    def predict_batch(self, df_input: pd.DataFrame) -> Dict[str, Any]:
        if self.model is None:
            self.train_model(self.current_config["criterion"])
            
        df = df_input.copy()
        
        # Check required columns
        missing = [col for col in ALL_MODEL_FEATURES if col not in df.columns]
        if missing:
            raise ValueError(f"Uploaded dataset missing required columns: {missing}")
            
        # Clean Total Charges
        df['Total Charges'] = pd.to_numeric(
            df['Total Charges'].replace(' ', np.nan),
            errors='coerce'
        ).fillna(df['Tenure Months'] * df['Monthly Charges'])
        
        # Clean numeric
        df['Tenure Months'] = pd.to_numeric(df['Tenure Months'], errors='coerce').fillna(0).astype(int)
        df['Monthly Charges'] = pd.to_numeric(df['Monthly Charges'], errors='coerce').fillna(0.0)
        
        for col in CATEGORICAL_FEATURES:
            df[col] = df[col].astype(str).str.strip()
            
        X_proc = self.preprocessor.transform(df[ALL_MODEL_FEATURES])
        preds = self.model.predict(X_proc)
        probs = self.model.predict_proba(X_proc)[:, 1]
        
        total = len(df)
        churn_count = int(np.sum(preds == 1))
        retained_count = total - churn_count
        churn_rate = round(float(churn_count) / total * 100 if total > 0 else 0.0, 2)
        
        results = []
        for idx in range(min(total, 500)):  # return up to 500 rows for preview
            row = df.iloc[idx].to_dict()
            prob = float(probs[idx])
            pred = int(preds[idx])
            risk = "High Risk" if prob >= 0.60 else ("Moderate Risk" if prob >= 0.30 else "Low Risk")
            
            clean_item = {
                "CustomerID": str(row.get("CustomerID", f"CUST-{idx+1:04d}")),
                "Gender": row.get("Gender"),
                "Contract": row.get("Contract"),
                "Tenure Months": int(row.get("Tenure Months", 0)),
                "Monthly Charges": float(row.get("Monthly Charges", 0.0)),
                "Total Charges": float(row.get("Total Charges", 0.0)),
                "Internet Service": row.get("Internet Service"),
                "Payment Method": row.get("Payment Method"),
                "Predicted Label": "Churn" if pred == 1 else "Retained",
                "Churn Probability": round(prob, 4),
                "Risk Tier": risk
            }
            if "Churn Label" in row:
                clean_item["Historical Churn"] = str(row["Churn Label"])
            results.append(clean_item)
            
        return {
            "total_records": total,
            "churn_count": churn_count,
            "retained_count": retained_count,
            "predicted_churn_rate": churn_rate,
            "predictions": results
        }

    def get_eda_analytics(self) -> Dict[str, Any]:
        """
        Computes accurate exploratory data analytics directly from the Telco dataset.
        """
        if self.df_clean is None:
            self.load_and_prepare_data()
            
        df = self.df_clean
        total = len(df)
        churned = int(df['Target'].sum())
        retained = total - churned
        churn_rate = round(churned / total * 100, 2)
        
        # 1. Churn by Contract
        contract_group = df.groupby('Contract')['Target'].agg(['count', 'sum']).reset_index()
        contract_group['churn_rate'] = (contract_group['sum'] / contract_group['count'] * 100).round(2)
        contract_data = [
            {"contract": row['Contract'], "total": int(row['count']), "churned": int(row['sum']), "churn_rate": float(row['churn_rate'])}
            for _, row in contract_group.iterrows()
        ]
        
        # 2. Churn by Tenure Groups (0-12, 13-24, 25-36, 37-48, 49-60, 61-72)
        bins = [-1, 12, 24, 36, 48, 60, 72]
        labels = ['0-12 Mo', '13-24 Mo', '25-36 Mo', '37-48 Mo', '49-60 Mo', '61-72 Mo']
        df['Tenure_Bin'] = pd.cut(df['Tenure Months'], bins=bins, labels=labels)
        tenure_group = df.groupby('Tenure_Bin', observed=False)['Target'].agg(['count', 'sum']).reset_index()
        tenure_group['churn_rate'] = (tenure_group['sum'] / tenure_group['count'] * 100).round(2)
        tenure_data = [
            {"tenure_group": str(row['Tenure_Bin']), "total": int(row['count']), "churned": int(row['sum']), "churn_rate": float(row['churn_rate'])}
            for _, row in tenure_group.iterrows()
        ]
        
        # 3. Churn by Internet Service
        internet_group = df.groupby('Internet Service')['Target'].agg(['count', 'sum']).reset_index()
        internet_group['churn_rate'] = (internet_group['sum'] / internet_group['count'] * 100).round(2)
        internet_data = [
            {"internet_service": row['Internet Service'], "total": int(row['count']), "churned": int(row['sum']), "churn_rate": float(row['churn_rate'])}
            for _, row in internet_group.iterrows()
        ]
        
        # 4. Churn by Payment Method
        payment_group = df.groupby('Payment Method')['Target'].agg(['count', 'sum']).reset_index()
        payment_group['churn_rate'] = (payment_group['sum'] / payment_group['count'] * 100).round(2)
        payment_data = [
            {"payment_method": row['Payment Method'], "total": int(row['count']), "churned": int(row['sum']), "churn_rate": float(row['churn_rate'])}
            for _, row in payment_group.iterrows()
        ]
        
        # 5. Churn by Monthly Charges Tier
        mbins = [0, 35, 70, 90, 150]
        mlabels = ['< $35', '$35 - $70', '$70 - $90', '> $90']
        df['Monthly_Bin'] = pd.cut(df['Monthly Charges'], bins=mbins, labels=mlabels)
        monthly_group = df.groupby('Monthly_Bin', observed=False)['Target'].agg(['count', 'sum']).reset_index()
        monthly_group['churn_rate'] = (monthly_group['sum'] / monthly_group['count'] * 100).round(2)
        monthly_data = [
            {"charge_tier": str(row['Monthly_Bin']), "total": int(row['count']), "churned": int(row['sum']), "churn_rate": float(row['churn_rate'])}
            for _, row in monthly_group.iterrows()
        ]
        
        # 6. Support Service Adoption (Tech Support vs Online Security vs Churn)
        tech_support_group = df.groupby('Tech Support')['Target'].agg(['count', 'sum']).reset_index()
        tech_support_group['churn_rate'] = (tech_support_group['sum'] / tech_support_group['count'] * 100).round(2)
        tech_data = [
            {"support_status": row['Tech Support'], "total": int(row['count']), "churned": int(row['sum']), "churn_rate": float(row['churn_rate'])}
            for _, row in tech_support_group.iterrows()
        ]
        
        # 7. Demographics (Senior Citizen, Partner, Dependents)
        senior_group = df.groupby('Senior Citizen')['Target'].agg(['count', 'sum']).reset_index()
        senior_group['churn_rate'] = (senior_group['sum'] / senior_group['count'] * 100).round(2)
        senior_data = [
            {"senior_citizen": row['Senior Citizen'], "total": int(row['count']), "churned": int(row['sum']), "churn_rate": float(row['churn_rate'])}
            for _, row in senior_group.iterrows()
        ]
        
        partner_group = df.groupby('Partner')['Target'].agg(['count', 'sum']).reset_index()
        partner_group['churn_rate'] = (partner_group['sum'] / partner_group['count'] * 100).round(2)
        partner_data = [
            {"partner": row['Partner'], "total": int(row['count']), "churned": int(row['sum']), "churn_rate": float(row['churn_rate'])}
            for _, row in partner_group.iterrows()
        ]
        
        return {
            "summary": {
                "total_customers": total,
                "churned_customers": churned,
                "retained_customers": retained,
                "churn_rate_pct": churn_rate
            },
            "contract_breakdown": contract_data,
            "tenure_breakdown": tenure_data,
            "internet_breakdown": internet_data,
            "payment_breakdown": payment_data,
            "monthly_charges_breakdown": monthly_data,
            "tech_support_breakdown": tech_data,
            "senior_breakdown": senior_data,
            "partner_breakdown": partner_data
        }

    def get_portfolio_customers(
        self,
        page: int = 1,
        page_size: int = 25,
        search: Optional[str] = None,
        contract: Optional[str] = None,
        churn_filter: Optional[str] = None,
        sort_by: str = "CustomerID",
        sort_dir: str = "asc"
    ) -> Dict[str, Any]:
        if self.df_clean is None:
            self.load_and_prepare_data()
            
        df = self.df_clean.copy()
        
        # Search across CustomerID, City, Payment Method
        if search:
            s = search.strip().lower()
            df = df[
                df['CustomerID'].str.lower().str.contains(s, na=False) |
                df['City'].str.lower().str.contains(s, na=False) |
                df['Payment Method'].str.lower().str.contains(s, na=False)
            ]
            
        if contract and contract != "All":
            df = df[df['Contract'] == contract]
            
        if churn_filter and churn_filter != "All":
            if churn_filter.lower() in ["churn", "yes", "1"]:
                df = df[df['Target'] == 1]
            elif churn_filter.lower() in ["retained", "no", "0"]:
                df = df[df['Target'] == 0]
                
        # Sorting
        if sort_by in df.columns:
            ascending = (sort_dir.lower() == "asc")
            df = df.sort_values(by=sort_by, ascending=ascending)
            
        total_matched = len(df)
        total_pages = max(1, (total_matched + page_size - 1) // page_size)
        page = max(1, min(page, total_pages))
        
        start_idx = (page - 1) * page_size
        end_idx = start_idx + page_size
        page_df = df.iloc[start_idx:end_idx]
        
        records = []
        for _, row in page_df.iterrows():
            records.append({
                "CustomerID": str(row.get("CustomerID", "")),
                "Gender": str(row.get("Gender", "")),
                "Senior Citizen": str(row.get("Senior Citizen", "")),
                "Partner": str(row.get("Partner", "")),
                "Dependents": str(row.get("Dependents", "")),
                "Tenure Months": int(row.get("Tenure Months", 0)),
                "Contract": str(row.get("Contract", "")),
                "Internet Service": str(row.get("Internet Service", "")),
                "Monthly Charges": float(row.get("Monthly Charges", 0.0)),
                "Total Charges": float(row.get("Total Charges", 0.0)),
                "Payment Method": str(row.get("Payment Method", "")),
                "Paperless Billing": str(row.get("Paperless Billing", "")),
                "Tech Support": str(row.get("Tech Support", "")),
                "Churn Label": str(row.get("Churn Label", "No")),
                "City": str(row.get("City", ""))
            })
            
        return {
            "total_count": total_matched,
            "page": page,
            "page_size": page_size,
            "total_pages": total_pages,
            "customers": records
        }

# Global Pipeline Instance
pipeline = ChurnMLPipeline()
