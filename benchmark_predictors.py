"""Select a stronger predictor using training CV, then evaluate only the winner."""
import json
import hashlib
import importlib.metadata as metadata
from pathlib import Path
import numpy as np
import sys
from xgboost import XGBClassifier
from threadpoolctl import threadpool_limits
from sklearn.base import clone
from sklearn.pipeline import Pipeline
from sklearn.model_selection import StratifiedKFold, cross_validate
from sklearn.ensemble import GradientBoostingClassifier, RandomForestClassifier
from sklearn.tree import DecisionTreeClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score
from backend.pipeline import ChurnMLPipeline, DATASET_PATH

if __name__ == '__main__':
    data = ChurnMLPipeline(); data.load_and_prepare_data()
    candidates = [('decision_tree', {'criterion':'gini', 'max_depth':4, 'min_samples_leaf':15, 'ccp_alpha':0.0}, DecisionTreeClassifier(max_depth=4, min_samples_leaf=15, random_state=42))]
    for depth in [2, 3]:
        for leaf in [20, 60]:
            for count, rate in [(150, .05), (300, .035)]:
                params = {'n_estimators': count, 'learning_rate': rate, 'max_depth': depth, 'min_samples_leaf': leaf, 'subsample': .85}
                candidates.append(('gradient_boosting', params, GradientBoostingClassifier(**params, random_state=42)))
    for leaf in [5, 15]:
        params = {'n_estimators':250, 'max_depth':12, 'min_samples_leaf':leaf, 'max_features':.7}
        candidates.append(('random_forest', params, RandomForestClassifier(**params, random_state=42, n_jobs=1)))
    for depth in [2, 3, 4]:
        for regularization in [3, 10]:
            params = {'n_estimators':300, 'learning_rate':.035, 'max_depth':depth,
                      'min_child_weight':8, 'reg_lambda':regularization, 'subsample':.85,
                      'colsample_bytree':.9, 'tree_method':'hist', 'n_jobs':2, 'eval_metric':'logloss'}
            candidates.append(('xgboost', params, XGBClassifier(**params, random_state=42)))
    results = []
    if '--resume' in sys.argv:
        results = json.loads(Path('backend/artifacts/predictor_report.json').read_text(encoding='utf-8'))['candidates']
    completed = len(results)
    cv = StratifiedKFold(5, shuffle=True, random_state=42)
    with threadpool_limits(limits=2):
        for index, (algorithm, params, model) in enumerate(candidates):
            if index < completed: continue
            estimator = Pipeline([('preprocessor', clone(data.preprocessor)), ('model', model)])
            scores = cross_validate(estimator, data.X_train, data.y_train, cv=cv, n_jobs=1,
                scoring={'accuracy':'accuracy','recall':'recall','f1':'f1','roc_auc':'roc_auc'}, error_score='raise')
            result = {'algorithm':algorithm, 'parameters':params,
                      **{key:float(np.mean(scores['test_'+key])) for key in ['accuracy','recall','f1','roc_auc']},
                      'accuracy_std':float(np.std(scores['test_accuracy']))}
            results.append(result)
            print(f'{index+1}/{len(candidates)} {algorithm}: CV accuracy {result["accuracy"]:.4f}, F1 {result["f1"]:.4f}', flush=True)
        # No test metrics are available to the selection rule.
        winner_index = max(range(len(results)), key=lambda index: (results[index]['accuracy'], results[index]['f1']))
        winner = candidates[winner_index][2]
        winner.fit(data.X_train_proc, data.y_train)
        def metrics(model):
            labels=model.predict(data.X_test_proc); probs=model.predict_proba(data.X_test_proc)[:,1]
            return {'accuracy':float(accuracy_score(data.y_test, labels)), 'precision':float(precision_score(data.y_test, labels)),
                    'recall':float(recall_score(data.y_test, labels)), 'f1':float(f1_score(data.y_test, labels)),
                    'roc_auc':float(roc_auc_score(data.y_test, probs)), 'samples':len(data.y_test)}
        baseline = clone(candidates[0][2]).fit(data.X_train_proc, data.y_train)
        report={'dataset_sha256':hashlib.sha256(Path(DATASET_PATH).read_bytes()).hexdigest(), 'folds':5,
                'selection_metric':'accuracy', 'selected':results[winner_index],
                'library_versions': {name:metadata.version(name) for name in ['scikit-learn','numpy','pandas','xgboost']}, 'candidates':results,
                'test_metrics':metrics(winner), 'baseline_test_metrics':metrics(baseline),
                'protocol':'Fixed 80/20 stratified split, seed 42. Candidates ranked only by five-fold CV on training data. Preprocessing refitted inside every fold. Same held-out set as prior experiments; not a new external validation cohort.'}
        Path('backend/artifacts/predictor_report.json').write_text(json.dumps(report, indent=2)+'\n', encoding='utf-8')
        print(json.dumps(report, indent=2), flush=True)
