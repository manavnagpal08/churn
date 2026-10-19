"""Audited preprocessing and a fixed, training-only model selection protocol."""
import sys, json, hashlib, time, datetime
from pathlib import Path
import importlib.metadata as metadata
import numpy as np
import pandas as pd
from threadpoolctl import threadpool_limits
from concurrent.futures import ThreadPoolExecutor
from sklearn.pipeline import Pipeline
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.model_selection import StratifiedKFold, cross_validate
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score, balanced_accuracy_score, average_precision_score
from catboost import CatBoostClassifier
import joblib

ROOT=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT/'backend'))
from pipeline import ChurnMLPipeline, DATASET_PATH, ALL_MODEL_FEATURES, LEAKAGE_AND_METADATA_COLUMNS
from preprocessing import make_preprocessor, CATEGORIES

if __name__=='__main__':
    data=ChurnMLPipeline(); data.load_and_prepare_data()
    raw=data.df_raw
    numeric=raw[['Tenure Months','Monthly Charges','Total Charges']].apply(lambda column:pd.to_numeric(column,errors='coerce'))
    audit={'dataset_sha256':hashlib.sha256(Path(DATASET_PATH).read_bytes()).hexdigest(),
        'rows':len(raw),'columns':len(raw.columns),'customer_id_duplicates':int(raw['CustomerID'].duplicated().sum()),
        'full_row_duplicates':int(raw.duplicated().sum()),'feature_duplicates':int(raw[ALL_MODEL_FEATURES].duplicated().sum()),
        'missing_raw':{name:int(count) for name,count in raw.isna().sum().items() if count},
        'blank_total_charges':int(raw['Total Charges'].astype(str).str.strip().eq('').sum()),
        'numeric_ranges':{name:{'min':float(column.min()),'max':float(column.max()),'median':float(column.median())} for name,column in numeric.items()},
        'category_levels':{name:sorted(raw[name].dropna().astype(str).unique().tolist()) for name in CATEGORIES},
        'excluded_columns':LEAKAGE_AND_METADATA_COLUMNS+['Churn Label','Target'],
        'class_counts':{str(name):int(count) for name,count in data.y_train.value_counts().add(data.y_test.value_counts(),fill_value=0).items()},
        'split':{'training':len(data.X_train),'test':len(data.X_test),'overlap':len(set(data.X_train.index)&set(data.X_test.index))}}
    (ROOT/'backend/artifacts').mkdir(parents=True,exist_ok=True)
    (ROOT/'backend/artifacts/preprocessing_audit.json').write_text(json.dumps(audit,indent=2)+'\n',encoding='utf-8')
    candidates=[]
    def add(algorithm,parameters,kind,scaled=False):
        if algorithm=='gradient_boosting': model=GradientBoostingClassifier(**parameters,random_state=42)
        elif algorithm=='logistic_regression': model=LogisticRegression(**parameters,random_state=42,max_iter=3000)
        else: model=CatBoostClassifier(**parameters,cat_features=CATEGORIES,random_seed=42,thread_count=2,verbose=False,allow_writing_files=False)
        candidates.append({'algorithm':algorithm,'parameters':parameters,'preprocessing_kind':kind,'scaled':scaled,
                           'estimator':Pipeline([('preprocessor',make_preprocessor(kind,scaled)),('model',model)])})
    add('gradient_boosting',{'n_estimators':300,'learning_rate':.035,'max_depth':2,'min_samples_leaf':20,'subsample':.85},'raw_onehot')
    for kind in ['raw_onehot','engineered_onehot']:
        for strength in [.1,1,10]: add('logistic_regression',{'C':strength},kind,True)
    for depth in [2,3]:
        for leaf in [20,60]:
            add('gradient_boosting',{'n_estimators':300,'learning_rate':.035,'max_depth':depth,'min_samples_leaf':leaf,'subsample':.85},'engineered_onehot')
    for kind in ['raw_native','engineered_native']:
        for depth in [4,6]:
            for regularization in [3,10]:
                add('catboost',{'iterations':600,'depth':depth,'learning_rate':.035,'l2_leaf_reg':regularization,'loss_function':'Logloss'},kind)
    for iterations in [300,600,1000]:
        add('catboost',{'iterations':iterations,'depth':5,'learning_rate':.04,'l2_leaf_reg':5,'loss_function':'Logloss'},'engineered_native')
    cv=StratifiedKFold(5,shuffle=True,random_state=42)
    results=[]; started=time.monotonic()
    versions={name:metadata.version(name) for name in ['scikit-learn','numpy','pandas','catboost','xgboost']}
    fingerprint=hashlib.sha256(Path(DATASET_PATH).read_bytes()).hexdigest()
    progress=ROOT/'backend/artifacts/training_progress.json'
    if '--resume' in sys.argv and progress.exists():
        checkpoint=json.loads(progress.read_text(encoding='utf-8'))
        if checkpoint.get('dataset_sha256') != fingerprint or checkpoint.get('library_versions') != versions:
            raise ValueError('Resume requires the same dataset and recorded library versions. Start a fresh run without --resume.')
        results=checkpoint['candidates']
        for index,previous in enumerate(results):
            for key in ['algorithm','parameters','preprocessing_kind','scaled']:
                if previous[key] != candidates[index][key]: raise ValueError('Resume configuration does not match the recorded experiment.')
    completed=len(results)
    with threadpool_limits(limits=2,user_api='blas'):
        for index,candidate in enumerate(candidates):
            if index < completed: continue
            if candidate['algorithm'] == 'catboost':
                scores={f'test_{name}':[] for name in ['accuracy','recall','precision','f1','roc_auc','balanced_accuracy','average_precision']}
                def score_fold(item):
                    fold,(fit_index,validation_index)=item
                    print(f'  candidate {index+1}, CatBoost fold {fold}/5',flush=True)
                    fresh=Pipeline([('preprocessor',make_preprocessor(candidate['preprocessing_kind'],candidate['scaled'])),
                        ('model',CatBoostClassifier(**candidate['estimator'].named_steps['model'].get_params()))])
                    fresh.fit(data.X_train.iloc[fit_index],data.y_train.iloc[fit_index])
                    actual=data.y_train.iloc[validation_index]
                    labels=fresh.predict(data.X_train.iloc[validation_index],thread_count=2).ravel()
                    probs=fresh.predict_proba(data.X_train.iloc[validation_index],thread_count=2)[:,1]
                    values={name:float(function(actual,labels)) for name,function in [('accuracy',accuracy_score),('recall',recall_score),('precision',precision_score),('f1',f1_score),('balanced_accuracy',balanced_accuracy_score)]}
                    values['roc_auc']=float(roc_auc_score(actual,probs))
                    values['average_precision']=float(average_precision_score(actual,probs))
                    return values
                with ThreadPoolExecutor(max_workers=3) as executor:
                    for values in executor.map(score_fold,enumerate(cv.split(data.X_train,data.y_train),start=1)):
                        for name,value in values.items(): scores['test_'+name].append(value)
            else:
                scores=cross_validate(candidate['estimator'],data.X_train,data.y_train,cv=cv,n_jobs=1,
                    scoring={'accuracy':'accuracy','recall':'recall','precision':'precision','f1':'f1','roc_auc':'roc_auc','balanced_accuracy':'balanced_accuracy','average_precision':'average_precision'},error_score='raise')
            result={key:value for key,value in candidate.items() if key!='estimator'}
            result.update({key:float(np.mean(scores['test_'+key])) for key in ['accuracy','recall','precision','f1','roc_auc','balanced_accuracy','average_precision']})
            result['accuracy_std']=float(np.std(scores['test_accuracy']))
            results.append(result)
            print(f'{index+1}/{len(candidates)} {result["algorithm"]} {result["preprocessing_kind"]}: CV accuracy={result["accuracy"]:.4f}, recall={result["recall"]:.4f}, AUC={result["roc_auc"]:.4f}',flush=True)
            (ROOT/'backend/artifacts/training_progress.json').write_text(json.dumps({'completed':len(results),'total':len(candidates),'candidates':results,'dataset_sha256':fingerprint,'library_versions':versions},indent=2),encoding='utf-8')
        winner_index=max(range(len(results)),key=lambda index:(results[index]['accuracy'],results[index]['f1']))
        winner=candidates[winner_index]['estimator']; winner.fit(data.X_train,data.y_train)
        def metrics(estimator):
            options={'thread_count':2} if type(estimator.named_steps['model']).__name__=='CatBoostClassifier' else {}
            labels=estimator.predict(data.X_test,**options).ravel(); probs=estimator.predict_proba(data.X_test,**options)[:,1]
            return {'accuracy':float(accuracy_score(data.y_test,labels)), 'precision':float(precision_score(data.y_test,labels)),
                    'recall':float(recall_score(data.y_test,labels)), 'f1':float(f1_score(data.y_test,labels)),
                    'roc_auc':float(roc_auc_score(data.y_test,probs)), 'balanced_accuracy':float(balanced_accuracy_score(data.y_test,labels)),
                    'average_precision':float(average_precision_score(data.y_test,probs)), 'samples':len(data.y_test)}
        # Selection is complete before test predictions are computed.
        report={'trained_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'dataset_sha256':hashlib.sha256(Path(DATASET_PATH).read_bytes()).hexdigest(),
                'folds':5,'selection_metric':'accuracy','selected':results[winner_index],'candidates':results,
                'library_versions':{name:metadata.version(name) for name in ['scikit-learn','numpy','pandas','catboost','xgboost']},
                'test_metrics':metrics(winner),'baseline_test_metrics':data.train_model()['test_metrics'],
                'previous_predictor_test_metrics':json.loads((ROOT/'backend/artifacts/predictor_report.json').read_text(encoding='utf-8'))['test_metrics'],
                'preprocessing_audit':json.loads((ROOT/'backend/artifacts/preprocessing_audit.json').read_text(encoding='utf-8')),
                'target_accuracy':.9, 'protocol':'Fixed 80/20 stratified split, seed 42. All selection uses five-fold training CV. Derived features use only 19 pre-outcome inputs. Imputation, encoding and scaling refit inside every fold. Test cohort has been examined in prior experiments; no claim of new external validation.'}
        bundle={'model':winner.named_steps['model'],'preprocessor':winner.named_steps['preprocessor'],
                'dataset_sha256':report['dataset_sha256'],'selected':report['selected'],'library_versions':report['library_versions']}
        artifact=ROOT/'backend/artifacts/predictor_bundle.joblib'; joblib.dump(bundle,artifact,compress=3)
        report['bundle_sha256']=hashlib.sha256(artifact.read_bytes()).hexdigest()
        report['elapsed_seconds']=round(time.monotonic()-started,1)
        (ROOT/'backend/artifacts/preprocessed_training_report.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
        print(json.dumps({'selected':report['selected'],'held_out':report['test_metrics'],'seconds':report['elapsed_seconds']},indent=2),flush=True)
