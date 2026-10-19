"""Read-only deployment smoke checks plus transient prediction requests."""
import csv
import io
import json
import math
import sys
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import httpx


def verify(base):
    expected=json.loads((Path(__file__).parent/'backend/artifacts/preprocessed_training_report.json').read_text())
    with httpx.Client(base_url=base.rstrip('/'),timeout=90,follow_redirects=True) as client:
        def get(path,**kwargs):
            response=client.get(path,**kwargs);response.raise_for_status();return response
        assert 'CHURN//ZERO' in get('/').text
        assert get('/api/health').json()['ready']
        status=get('/api/status').json();assert status['capabilities']['hosted']
        selected=expected['selected']['algorithm']
        assert status['status']['active_algorithm']==selected
        evaluation=get('/api/model/evaluation').json()
        assert evaluation['predictor_report']['bundle_sha256']==expected['bundle_sha256']
        assert abs(evaluation['test_metrics']['accuracy']-expected['test_metrics']['accuracy'])<.0001
        response=client.post('/api/predict/single',json={});response.raise_for_status();prediction=response.json()
        assert prediction['algorithm']==selected
        score=prediction['baseline_score']+sum(value['contribution'] for value in prediction['feature_contributions'])
        assert abs(1/(1+math.exp(-score))-prediction['churn_probability'])<.0001
        template=get('/api/predict/template').content
        response=client.post('/api/predict/upload',files={'file':('customers.csv',template,'text/csv')});response.raise_for_status()
        assert response.json()['total_records']>0
        portfolio=get('/api/portfolio/customers',params={'search':'0002-ORFBO'}).json()
        rows=list(csv.DictReader(io.StringIO(get('/api/portfolio/export',params={'search':'0002-ORFBO'}).text)))
        assert len(rows)==portfolio['total_count'] and len(rows)>0
        def predict(algorithm):
            response=client.post('/api/predict/single',headers={'X-Predictor':algorithm},json={});response.raise_for_status();return response.json()['algorithm']
        with ThreadPoolExecutor(max_workers=2) as executor:
            assert list(executor.map(predict,['decision_tree',selected]))==['decision_tree',selected]
        response=client.post('/api/model/select',json={'algorithm':'decision_tree'});response.raise_for_status()
        assert response.json()['evaluation']['algorithm']=='decision_tree'
        assert get('/api/status').json()['status']['active_algorithm']==selected
        tree_rows=list(csv.DictReader(io.StringIO(get('/api/portfolio/export',params={'search':'0002-ORFBO','predictor':'decision_tree'}).text)))
        assert tree_rows[0]['Prediction_Model']=='CART decision tree'
        assert client.post('/api/model/train',json={}).status_code==409
        assert client.post('/api/predict/single',json={'Contract':'invalid'}).status_code==422
        print(json.dumps({'url':base,'algorithm':selected,'test_accuracy':evaluation['test_metrics']['accuracy'],'checks':'frontend, readiness, artifact identity, measured metrics, additive explanation, CSV upload, portfolio/export, isolated models, hosted training guard, input validation'},indent=2))

if __name__=='__main__':
    verify(sys.argv[1])
