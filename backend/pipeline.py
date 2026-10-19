import os
import sys
import datetime
import numpy as np
import pandas as pd
from typing import Dict, Any, List, Optional, Tuple
import joblib
import json
import hashlib
import threading
from functools import wraps
from contextvars import ContextVar

from sklearn.model_selection import train_test_split, GridSearchCV, StratifiedKFold
from sklearn.pipeline import Pipeline
from sklearn.base import clone
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import GradientBoostingClassifier, RandomForestClassifier
from scipy.special import expit
from xgboost import XGBClassifier, DMatrix
from sklearn.preprocessing import OneHotEncoder
from sklearn.linear_model import LogisticRegression
from sklearn.compose import ColumnTransformer
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, confusion_matrix, classification_report, roc_curve
)

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
BASE_DIR = os.path.dirname(CURRENT_DIR)
if CURRENT_DIR not in sys.path:
    sys.path.insert(0,CURRENT_DIR)

if os.path.exists(os.path.join(CURRENT_DIR, "Telco_customer_churn.xlsx")):
    DATASET_PATH = os.path.join(CURRENT_DIR, "Telco_customer_churn.xlsx")
else:
    DATASET_PATH = os.path.join(BASE_DIR, "Telco_customer_churn.xlsx")

ARTIFACTS_DIR = os.path.join(CURRENT_DIR, "artifacts")
REQUEST_PREDICTOR = ContextVar('request_predictor', default=None)

def synchronized(method):
    @wraps(method)
    def wrapper(self, *args, **kwargs):
        with self._lock:
            return method(self, *args, **kwargs)
    return wrapper

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
        self._lock = threading.RLock()
        self.selection_report = None
        self.df_raw: Optional[pd.DataFrame] = None
        self.df_clean: Optional[pd.DataFrame] = None
        self.preprocessor: Optional[ColumnTransformer] = None
        self.model: Optional[DecisionTreeClassifier] = None
        self.ensemble_model = None
        self.ensemble_preprocessor = None
        self.ensemble_feature_names = []
        self.active_algorithm = 'decision_tree'
        self.predictor_report = None
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
            "max_depth": 4,
            "min_samples_leaf": 15,
            "ccp_alpha": 0.0
        }
        report_path = os.path.join(ARTIFACTS_DIR, 'selection_report.json')
        if os.path.exists(report_path):
            with open(report_path, encoding='utf-8') as report_file:
                report = json.load(report_file)
            with open(DATASET_PATH, 'rb') as dataset_file:
                fingerprint = hashlib.sha256(dataset_file.read()).hexdigest()
            if report.get('dataset_sha256') == fingerprint:
                self.selection_report = report
        
        # Precomputed evaluations
        self.eval_cache: Dict[str, Any] = {}
        self.status = {
            "dataset_loaded": False,
            "total_records": 0,
            "model_trained": False,
            "active_criterion": "gini",
            "last_trained_at": None,
            "accuracy": None,
            "active_algorithm": "decision_tree",
            "model_name": "CART decision tree"
        }

    @property
    def predictor(self):
        return self.ensemble_model if self.active_algorithm != 'decision_tree' else self.model

    @property
    def active_algorithm(self):
        return REQUEST_PREDICTOR.get() or self._active_algorithm

    @active_algorithm.setter
    def active_algorithm(self, algorithm):
        self._active_algorithm = algorithm

    @property
    def model_name(self):
        return {'decision_tree':'CART decision tree','gradient_boosting':'Gradient boosted trees',
                'random_forest':'Random forest','xgboost':'XGBoost','catboost':'CatBoost',
                'logistic_regression':'Logistic regression'}[self.active_algorithm]

    def predictor_input(self, frame):
        processor = self.ensemble_preprocessor if self.active_algorithm != 'decision_tree' and self.ensemble_preprocessor is not None else self.preprocessor
        return processor.transform(frame[ALL_MODEL_FEATURES])

    @staticmethod
    def model_labels(model, features):
        options = {'thread_count': 2} if type(model).__name__ == 'CatBoostClassifier' else {}
        return np.asarray(model.predict(features, **options)).ravel()

    @staticmethod
    def model_probabilities(model, features):
        options = {'thread_count': 2} if type(model).__name__ == 'CatBoostClassifier' else {}
        return model.predict_proba(features, **options)

    @synchronized
    def current_status(self):
        status = self.status.copy()
        if self.active_algorithm != status['active_algorithm']:
            status['accuracy'] = self._evaluate_model(self.predictor)['test_metrics']['accuracy']
        status.update(active_algorithm=self.active_algorithm, model_name=self.model_name)
        return status

    @synchronized
    def initialize_predictor(self):
        report_path = os.path.join(ARTIFACTS_DIR, 'preprocessed_training_report.json')
        if not os.path.exists(report_path):
            report_path = os.path.join(ARTIFACTS_DIR, 'predictor_report.json')
        if not os.path.exists(report_path):
            return
        with open(report_path, encoding='utf-8') as source:
            report = json.load(source)
        with open(DATASET_PATH, 'rb') as source:
            fingerprint = hashlib.sha256(source.read()).hexdigest()
        if report.get('dataset_sha256') != fingerprint:
            return
        self.predictor_report = report
        bundle_path = os.path.join(ARTIFACTS_DIR, 'predictor_bundle.joblib')
        if os.getenv('VERCEL') and report.get('bundle_sha256') and not os.path.exists(bundle_path):
            raise FileNotFoundError('The validated fitted predictor is missing from this deployment.')
        if report.get('bundle_sha256') and os.path.exists(bundle_path):
            with open(bundle_path, 'rb') as source:
                bundle_hash = hashlib.sha256(source.read()).hexdigest()
            if bundle_hash != report['bundle_sha256']:
                raise ValueError('The fitted model artifact does not match its validation report.')
            bundle = joblib.load(bundle_path)
            if bundle['dataset_sha256'] != fingerprint or bundle['selected'] != report['selected']:
                raise ValueError('The fitted model artifact has inconsistent provenance.')
            self.ensemble_model = bundle['model']
            self.ensemble_preprocessor = bundle['preprocessor']
            self.ensemble_feature_names = list(self.ensemble_preprocessor.get_feature_names_out())
        self.select_predictor(report['selected']['algorithm'])

    @synchronized
    def select_predictor(self, algorithm):
        if algorithm == 'decision_tree':
            self.active_algorithm = algorithm
            name = 'CART decision tree'
        else:
            if not self.predictor_report or algorithm != self.predictor_report['selected']['algorithm']:
                raise ValueError('This predictor has no validated benchmark configuration.')
            if self.ensemble_model is None:
                constructors = {'xgboost': XGBClassifier, 'gradient_boosting': GradientBoostingClassifier,
                                'random_forest': RandomForestClassifier,'logistic_regression':LogisticRegression}
                selected = self.predictor_report['selected']
                inputs = self.X_train_proc
                if selected.get('preprocessing_kind'):
                    from preprocessing import make_preprocessor,CATEGORIES
                    self.ensemble_preprocessor = make_preprocessor(selected['preprocessing_kind'],selected.get('scaled',False))
                    inputs = self.ensemble_preprocessor.fit_transform(self.X_train)
                    self.ensemble_feature_names = list(self.ensemble_preprocessor.get_feature_names_out())
                if algorithm == 'catboost':
                    from catboost import CatBoostClassifier
                    candidate = CatBoostClassifier(**selected['parameters'],cat_features=CATEGORIES,random_seed=42,
                        verbose=False,allow_writing_files=False,thread_count=2)
                else:
                    candidate = constructors[algorithm](**selected['parameters'], random_state=42, **({'max_iter':3000} if algorithm == 'logistic_regression' else {}))
                candidate.fit(inputs, self.y_train)
                self.ensemble_model = candidate
            self.active_algorithm = algorithm
            name = self.model_name
        evaluation = self._evaluate_model(self.predictor)
        self.status.update(active_algorithm=algorithm, model_name=name,
                           accuracy=evaluation['test_metrics']['accuracy'],
                           last_trained_at=(self.predictor_report.get('trained_at') if algorithm != 'decision_tree' and self.predictor_report else None) or datetime.datetime.now(datetime.timezone.utc).isoformat())
        return evaluation

    @synchronized
    def get_active_evaluation(self):
        return self._evaluate_model(self.predictor)

    @synchronized
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

    @synchronized
    def train_model(self, criterion: str = "gini", max_depth: Optional[int] = 4,
                    min_samples_leaf: int = 15, ccp_alpha: float = 0.0) -> Dict[str, Any]:
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
        
        # Save fitted model & preprocessor to artifacts (safe against read-only serverless filesystems)
        try:
            artifact_path = os.path.join(ARTIFACTS_DIR, f"dt_model_{criterion}.joblib")
            os.makedirs(os.path.dirname(artifact_path), exist_ok=True)
            joblib.dump({"model": model, "preprocessor": self.preprocessor, "config": self.current_config}, artifact_path)
        except Exception as save_err:
            print(f"[Pipeline] Notice: Artifact caching skipped in read-only environment: {save_err}")
        
        # Evaluate performance on test and train
        evaluation = self._evaluate_model(model)
        
        self.status["model_trained"] = True
        self.status["active_criterion"] = criterion
        self.status["last_trained_at"] = datetime.datetime.now().isoformat()
        self.status['reference_tree_accuracy'] = evaluation['test_metrics']['accuracy']
        if self.active_algorithm == 'decision_tree':
            self.status["accuracy"] = evaluation["test_metrics"]["accuracy"]
        
        cache_key = f"{criterion}_{max_depth}_{min_samples_leaf}_{ccp_alpha}"
        self.eval_cache[cache_key] = evaluation
        return evaluation

    @synchronized
    def optimize_model(self):
        """Select hyperparameters on training folds; never rank using test results."""
        if self.df_clean is None:
            self.load_and_prepare_data()
        estimator = Pipeline([
            ('preprocessor', clone(self.preprocessor)),
            ('tree', DecisionTreeClassifier(random_state=42)),
        ])
        search = GridSearchCV(
            estimator,
            {'tree__criterion': ['gini', 'entropy'],
             'tree__max_depth': [3, 4, 5, 6, 7, 8],
             'tree__min_samples_leaf': [10, 20, 40, 80],
             'tree__ccp_alpha': [0.0, 0.001, 0.003]},
            scoring={'accuracy': 'accuracy', 'f1': 'f1', 'roc_auc': 'roc_auc'},
            refit='accuracy', cv=StratifiedKFold(5, shuffle=True, random_state=42),
            n_jobs=1, error_score='raise',
        )
        search.fit(self.X_train, self.y_train)
        config = {key.removeprefix('tree__'): value for key, value in search.best_params_.items()}
        baseline = Pipeline([('preprocessor', clone(self.preprocessor)),
                             ('tree', DecisionTreeClassifier(max_depth=4, min_samples_leaf=15, random_state=42))])
        from sklearn.model_selection import cross_val_score
        baseline_score = cross_val_score(baseline, self.X_train, self.y_train,
            cv=StratifiedKFold(5, shuffle=True, random_state=42), scoring='accuracy').mean()
        if baseline_score > search.best_score_:
            config = {'criterion': 'gini', 'max_depth': 4, 'min_samples_leaf': 15, 'ccp_alpha': 0.0}
        with open(DATASET_PATH, 'rb') as dataset_file:
            fingerprint = hashlib.sha256(dataset_file.read()).hexdigest()
        self.selection_report = {
            'dataset_sha256': fingerprint, 'selected_config': config,
            'selection_metric': 'accuracy', 'folds': 5, 'candidates': len(search.cv_results_['params']),
            'baseline_cv_accuracy': float(baseline_score),
            'selected_cv_accuracy': float(max(baseline_score, search.best_score_)),
            'selected_cv_std': float(search.cv_results_['std_test_accuracy'][search.best_index_]),
            'protocol': '80/20 stratified split, seed 42. Preprocessing fitted within each training fold. Test set excluded from selection.',
        }
        os.makedirs(ARTIFACTS_DIR, exist_ok=True)
        with open(os.path.join(ARTIFACTS_DIR, 'selection_report.json'), 'w', encoding='utf-8') as report_file:
            json.dump(self.selection_report, report_file, indent=2)
        candidate_result = self.train_model(**config)
        self.selection_report['candidate_test_metrics'] = candidate_result['test_metrics']
        baseline_result = self.train_model(criterion='gini', max_depth=4, min_samples_leaf=15, ccp_alpha=0.0)
        self.selection_report['baseline_test_metrics'] = baseline_result['test_metrics']
        with open(os.path.join(ARTIFACTS_DIR, 'selection_report.json'), 'w', encoding='utf-8') as report_file:
            json.dump(self.selection_report, report_file, indent=2)
        return candidate_result

    def _node_distribution(self, tree, node_id):
        # sklearn >=1.4 stores proportions; older versions store counts.
        values = np.asarray(tree.value[node_id][0], dtype=float)
        proportions = values / values.sum()
        samples = int(tree.n_node_samples[node_id])
        churn_count = int(round(proportions[1] * samples))
        return samples - churn_count, churn_count, float(proportions[1])

    @synchronized
    def compare_criteria(self):
        evaluations = {}
        for criterion in ('gini', 'entropy'):
            config = {**self.current_config, 'criterion': criterion}
            candidate = DecisionTreeClassifier(**config, random_state=42)
            candidate.fit(self.X_train_proc, self.y_train)
            evaluations[criterion] = self._evaluate_model(candidate)
        return evaluations

    def _evaluate_model(self, model: DecisionTreeClassifier) -> Dict[str, Any]:
        train_input, test_input = self.X_train_proc, self.X_test_proc
        if model is self.ensemble_model and self.ensemble_preprocessor is not None:
            train_input = self.ensemble_preprocessor.transform(self.X_train)
            test_input = self.ensemble_preprocessor.transform(self.X_test)
        # Predictions on Train
        y_train_pred = self.model_labels(model, train_input)
        y_train_prob = self.model_probabilities(model, train_input)[:, 1]
        
        train_acc = float(accuracy_score(self.y_train, y_train_pred))
        train_prec = float(precision_score(self.y_train, y_train_pred, zero_division=0))
        train_rec = float(recall_score(self.y_train, y_train_pred, zero_division=0))
        train_f1 = float(f1_score(self.y_train, y_train_pred, zero_division=0))
        train_auc = float(roc_auc_score(self.y_train, y_train_prob))
        
        # Predictions on Held-out Test
        y_test_pred = self.model_labels(model, test_input)
        y_test_prob = self.model_probabilities(model, test_input)[:, 1]
        
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
        is_tree = isinstance(model, DecisionTreeClassifier)
        is_xgboost = isinstance(model, XGBClassifier)
        is_catboost = type(model).__name__ == 'CatBoostClassifier'
        is_linear = isinstance(model, LogisticRegression)
        algorithm = 'decision_tree' if is_tree else 'catboost' if is_catboost else 'logistic_regression' if is_linear else 'xgboost' if is_xgboost else 'gradient_boosting' if isinstance(model, GradientBoostingClassifier) else 'random_forest'
        names = {'decision_tree':'CART decision tree','xgboost':'XGBoost','gradient_boosting':'Gradient boosted trees','random_forest':'Random forest','catboost':'CatBoost','logistic_regression':'Logistic regression'}
        if is_catboost:
            leaf_counts = model.get_tree_leaf_counts()
            tree_meta = {'total_nodes':int(sum(2 * leaf_counts - 1)), 'leaf_nodes':int(sum(leaf_counts)),
                         'max_depth':int(max(np.log2(leaf_counts))), 'criterion':'log_loss', 'estimators':int(model.tree_count_)}
        elif is_linear:
            tree_meta = {'total_nodes':0,'leaf_nodes':0,'max_depth':0,'criterion':'log_loss','estimators':1}
        elif is_xgboost:
            frames = model.get_booster().trees_to_dataframe()
            def depth(node):
                return max((depth(child) + 1 for child in node.get('children', [])), default=0)
            tree_meta = {'total_nodes': len(frames), 'leaf_nodes': int((frames.Feature == 'Leaf').sum()),
                         'max_depth': max(depth(json.loads(tree)) for tree in model.get_booster().get_dump(dump_format='json')),
                         'criterion': 'log_loss', 'estimators': int(frames.Tree.nunique())}
        else:
            trees = [model] if is_tree else list(np.asarray(model.estimators_, dtype=object).ravel())
            tree_meta = {
                "total_nodes": sum(int(tree.tree_.node_count) for tree in trees),
                "leaf_nodes": sum(int(tree.tree_.n_leaves) for tree in trees),
                "max_depth": max(int(tree.tree_.max_depth) for tree in trees),
                "criterion": model.criterion, "estimators": len(trees),
            }
        parameters = {key: (None if isinstance(value, float) and not np.isfinite(value) else value)
                      for key, value in model.get_params().items()}
        
        return {
            "config": {key: model.get_params().get(key, self.current_config[key]) for key in self.current_config},
            "selection_report": self.selection_report,
            "predictor_report": self.predictor_report,
            "algorithm": algorithm, "model_name": names[algorithm],
            "predictor_config": parameters,
            "importance_method": 'coefficient_magnitude' if is_linear else 'prediction_values_change' if is_catboost else 'split_quality',
            "majority_baseline_accuracy": round(float((self.y_test == 0).mean()), 4),
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
            
        if isinstance(m, LogisticRegression):
            importances = np.abs(m.coef_[0])
        else:
            importances = np.asarray(m.feature_importances_,dtype=float)
        total = importances.sum()
        importances = importances / total if total else importances
        names = self.ensemble_feature_names if m is self.ensemble_model and self.ensemble_feature_names else self.feature_names_out
        raw_list = []
        for name, val in zip(names, importances):
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

    @synchronized
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
            retained_count, churn_count, actual_prob = self._node_distribution(tree_, node_id)
            total_in_node = retained_count + churn_count
            churn_prob = round(actual_prob, 4)
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
            "config": self.current_config.copy(),
            "metadata": {
                "criterion": self.model.criterion,
                "max_depth": int(self.model.tree_.max_depth),
                "total_nodes": int(self.model.tree_.node_count),
                "leaf_nodes": int(self.model.tree_.n_leaves),
                "total_samples": total_samples
            }
        }

    @synchronized
    def predict_single_customer(self, customer_dict: Dict[str, Any]) -> Dict[str, Any]:
        if self.model is None:
            self.train_model(self.current_config["criterion"])
            
        # Ensure numeric Total Charges is derived if missing or None
        tenure = int(customer_dict.get("Tenure Months", 0))
        monthly = float(customer_dict.get("Monthly Charges", 0.0))
        total_charges = customer_dict.get("Total Charges")
        if total_charges is None or str(total_charges).strip() == "":
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

        if self.active_algorithm != 'decision_tree':
            return self._predict_ensemble(self.predictor_input(df_single), row_dict)
        
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
            retained_count, churn_count, actual_prob = self._node_distribution(tree_, node_id)
            tot = retained_count + churn_count
            node_churn_prob = round(actual_prob, 4)
            
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
            "model_name": 'CART decision tree',
            "algorithm": 'decision_tree',
            "explanation_method": 'exact_tree_path',
            "model_max_depth": int(self.model.tree_.max_depth),
            "timestamp": datetime.datetime.now().isoformat()
        }

    def _predict_ensemble(self, transformed, row_dict):
        """Path-difference attribution, exactly additive in model-score space (not SHAP)."""
        model = self.predictor
        probability = float(self.model_probabilities(model, transformed)[0, 1])
        label = int(self.model_labels(model, transformed)[0])
        names = self.ensemble_feature_names or self.feature_names_out
        contributions = np.zeros(len(names))
        boosted = isinstance(model, GradientBoostingClassifier)
        is_xgboost = isinstance(model, XGBClassifier)
        is_catboost = type(model).__name__ == 'CatBoostClassifier'
        is_linear = isinstance(model, LogisticRegression)
        trees = [] if is_xgboost or is_catboost or is_linear else list(np.asarray(model.estimators_, dtype=object).ravel())
        if boosted:
            initial_probability = float(model.init_.predict_proba(transformed)[0, 1])
            base = float(np.log(initial_probability / (1 - initial_probability)))
        else:
            base = 0.0
        if is_xgboost:
            shap_values = model.get_booster().predict(DMatrix(transformed), pred_contribs=True)[0]
            base = float(shap_values[-1])
            contributions = shap_values[:-1].astype(float)
        if is_catboost:
            from catboost import Pool
            shap_values = model.get_feature_importance(Pool(transformed,cat_features=model.get_cat_feature_indices()),type='ShapValues',thread_count=2)[0]
            base = float(shap_values[-1])
            contributions = shap_values[:-1].astype(float)
        if is_linear:
            base = float(model.intercept_[0])
            contributions = np.asarray(transformed)[0] * model.coef_[0]
        for estimator in trees:
            tree = estimator.tree_
            if boosted:
                values = tree.value[:, 0, 0] * model.learning_rate
            else:
                values = tree.value[:, 0, 1] / tree.value[:, 0, :].sum(axis=1) / len(trees)
            base += float(values[0])
            path = estimator.decision_path(transformed).indices
            for parent, child in zip(path[:-1], path[1:]):
                contributions[tree.feature[parent]] += values[child] - values[parent]
        grouped = {}
        for raw, value in zip(names, contributions):
            name = raw[5:].split('_', 1)[0] if raw.startswith('cat__') else raw[5:] if raw.startswith('num__') else raw
            grouped[name] = grouped.get(name, 0.0) + float(value)
        available_values = row_dict
        if self.ensemble_preprocessor is not None:
            available_values = self.ensemble_preprocessor.named_steps['features'].transform(pd.DataFrame([row_dict])).iloc[0].to_dict()
        items = [{'feature': name, 'value': available_values.get(name,'Derived'), 'contribution': value}
                 for name, value in sorted(grouped.items(), key=lambda item: abs(item[1]), reverse=True)
                 if abs(value) > 1e-12]
        score = base + float(contributions.sum())
        log_odds = boosted or is_xgboost or is_catboost or is_linear
        reconstructed = float(expit(score)) if log_odds else score
        if not np.isclose(reconstructed, probability, atol=2e-6):
            raise RuntimeError('Prediction attribution failed its reconstruction check.')
        high, moderate = probability >= .6, probability >= .3
        return {
            'prediction': 'Likely to churn' if label else 'Not likely to churn',
            'churn_label': label, 'churn_probability': round(probability, 4),
            'risk_level': 'High Risk' if high else 'Moderate Risk' if moderate else 'Low Risk',
            'risk_color': 'red' if high else 'yellow' if moderate else 'neutral',
            'decision_path': [], 'key_drivers': [],
            'algorithm': self.active_algorithm, 'model_name': self.model_name,
            'model_criterion': 'log_loss' if is_xgboost or is_catboost or is_linear else model.criterion,
            'model_max_depth': model.get_params().get('max_depth',model.get_params().get('depth')),
            'feature_contributions': items, 'baseline_score': base, 'prediction_score': score,
            'baseline_probability': float(expit(base)) if log_odds else base,
            'explanation_method': 'tree_shap' if is_xgboost or is_catboost else 'linear' if is_linear else 'path_difference',
            'contribution_units': 'log_odds' if log_odds else 'probability',
            'timestamp': datetime.datetime.now(datetime.timezone.utc).isoformat(),
        }

    @synchronized
    def predict_batch(self, df_input: pd.DataFrame) -> Dict[str, Any]:
        if self.model is None:
            self.train_model(self.current_config["criterion"])
            
        df = df_input.copy()
        
        # Check required columns
        missing = [col for col in ALL_MODEL_FEATURES if col not in df.columns]
        if missing:
            raise ValueError(f"Uploaded dataset missing required columns: {missing}")
            
        if not 1 <= len(df) <= 10000:
            raise ValueError('Provide between 1 and 10,000 records.')
        from models import CustomerInput
        validated = []
        for position, (_, row) in enumerate(df.iterrows(), start=1):
            data = {key: (None if pd.isna(value) else value.strip() if isinstance(value, str) else value)
                    for key, value in row[ALL_MODEL_FEATURES].items()}
            if data['Total Charges'] == '':
                data['Total Charges'] = None
            try:
                validated.append(CustomerInput.model_validate(data).model_dump(by_alias=True))
            except ValueError as exc:
                raise ValueError(f'Row {position}: {exc}') from exc
        df[ALL_MODEL_FEATURES] = pd.DataFrame(validated, index=df.index)[ALL_MODEL_FEATURES]
        df['Total Charges'] = df['Total Charges'].fillna(df['Tenure Months'] * df['Monthly Charges'])
            
        X_proc = self.predictor_input(df)
        preds = self.model_labels(self.predictor, X_proc)
        probs = self.model_probabilities(self.predictor, X_proc)[:, 1]
        
        total = len(df)
        churn_count = int(np.sum(preds == 1))
        retained_count = total - churn_count
        churn_rate = round(float(churn_count) / total * 100 if total > 0 else 0.0, 2)
        
        results = []
        for idx in range(total):
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
            clean_item['Prediction Model'] = self.model_name
            if "Churn Label" in row:
                clean_item["Historical Churn"] = str(row["Churn Label"])
            results.append(clean_item)
            
        return {
            "total_records": total,
            "churn_count": churn_count,
            "retained_count": retained_count,
            "predicted_churn_rate": churn_rate,
            "model_name": self.model_name,
            "predictions": results
        }

    @synchronized
    def get_eda_analytics(self) -> Dict[str, Any]:
        """
        Computes accurate exploratory data analytics directly from the Telco dataset.
        """
        if self.df_clean is None:
            self.load_and_prepare_data()
            
        df = self.df_clean.copy()
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
                df['CustomerID'].str.lower().str.contains(s, na=False, regex=False) |
                df['City'].str.lower().str.contains(s, na=False, regex=False) |
                df['Payment Method'].str.lower().str.contains(s, na=False, regex=False)
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
