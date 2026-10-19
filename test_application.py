"""Regression checks for model explanations, validation and working API flows."""
import io
import os
import unittest
from unittest.mock import patch
from concurrent.futures import ThreadPoolExecutor
import pandas as pd
from fastapi.testclient import TestClient
from backend.main import app, pipeline
from models import CustomerInput
from pipeline import ALL_MODEL_FEATURES, LEAKAGE_AND_METADATA_COLUMNS

class ApplicationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.context = TestClient(app)
        cls.client = cls.context.__enter__()

    @classmethod
    def tearDownClass(cls):
        cls.context.__exit__(None, None, None)

    def test_readiness_and_real_metrics(self):
        self.assertTrue(self.client.get('/api/health').json()['ready'])
        evaluation = self.client.get('/api/model/evaluation').json()
        self.assertEqual(evaluation['test_metrics']['samples'], 1409)
        matrix = evaluation['confusion_matrix']
        self.assertEqual(sum(matrix[k] for k in ['tn', 'fp', 'fn', 'tp']), 1409)
        self.assertAlmostEqual((matrix['tn'] + matrix['tp']) / 1409,
                               evaluation['test_metrics']['accuracy'], places=4)

    def test_no_target_or_metadata_leakage(self):
        self.assertFalse(set(ALL_MODEL_FEATURES) & set(LEAKAGE_AND_METADATA_COLUMNS + ['Churn Label', 'Target']))
        self.assertFalse(set(pipeline.X_train.index) & set(pipeline.X_test.index))

    def test_every_tree_node_has_valid_counts(self):
        root = self.client.get('/api/tree/structure').json()['root']
        def verify(node):
            self.assertEqual(node['retained_count'] + node['churn_count'], node['samples'])
            self.assertAlmostEqual(node['churn_count'] / node['samples'], node['churn_prob'], places=3)
            if node.get('children'):
                self.assertEqual(sum(child['samples'] for child in node['children']), node['samples'])
                for child in node['children']: verify(child)
        verify(root)
        self.assertEqual(root['samples'], 5634)

    def test_single_batch_probability_and_path_agree(self):
        for index in [0, 23, 100, 400]:
            record = pipeline.df_clean.iloc[index][ALL_MODEL_FEATURES].to_dict()
            single = self.client.post('/api/predict/single', json=record)
            self.assertEqual(single.status_code, 200, single.text)
            result = single.json()
            batch = self.client.post('/api/predict/batch', json=[record]).json()
            self.assertEqual(result['churn_probability'], batch['predictions'][0]['Churn Probability'])
            if result['algorithm'] == 'decision_tree':
                self.assertAlmostEqual(result['decision_path'][-1]['churn_probability'], result['churn_probability'], places=4)
                self.assertGreater(result['decision_path'][0]['churn_probability'], 0)
            else:
                self.assertEqual(result['decision_path'], [])
                self.assertTrue(result['feature_contributions'])
                score = result['baseline_score'] + sum(item['contribution'] for item in result['feature_contributions'])
                from scipy.special import expit
                probability = float(expit(score)) if result['contribution_units'] == 'log_odds' else score
                self.assertAlmostEqual(probability, result['churn_probability'], places=4)

    def test_invalid_and_inconsistent_input_rejected(self):
        sample = CustomerInput().model_dump(by_alias=True)
        for field, value in [('Contract', 'made-up'), ('Monthly Charges', -5), ('Total Charges', -1), ('Phone Service', 'No')]:
            record = {**sample, field: value}
            self.assertEqual(self.client.post('/api/predict/single', json=record).status_code, 422)
            self.assertEqual(self.client.post('/api/predict/batch', json=[record]).status_code, 422)

    def test_explicit_zero_total_is_preserved(self):
        sample = {**CustomerInput().model_dump(by_alias=True), 'Total Charges': 0}
        one = self.client.post('/api/predict/single', json=sample).json()
        batch = self.client.post('/api/predict/batch', json=[sample]).json()
        self.assertEqual(batch['predictions'][0]['Total Charges'], 0)
        self.assertEqual(one['churn_probability'], batch['predictions'][0]['Churn Probability'])

    def test_comparison_is_read_only_even_with_concurrent_predictions(self):
        model, config = pipeline.model, pipeline.current_config.copy()
        sample = CustomerInput().model_dump(by_alias=True)
        def query(index):
            if index == 0: return self.client.get('/api/model/comparison').status_code
            return self.client.post('/api/predict/single', json=sample).status_code
        with ThreadPoolExecutor(max_workers=4) as executor:
            self.assertEqual(list(executor.map(query, range(8))), [200]*8)
        self.assertIs(model, pipeline.model)
        self.assertEqual(config, pipeline.current_config)

    def test_batch_returns_all_rows_instead_of_truncating(self):
        sample = CustomerInput().model_dump(by_alias=True)
        result = self.client.post('/api/predict/batch', json=[sample] * 501)
        self.assertEqual(result.status_code, 200, result.text)
        self.assertEqual(len(result.json()['predictions']), 501)
        self.assertEqual(self.client.post('/api/predict/batch', json=[]).status_code, 422)

    def test_template_upload_and_file_validation(self):
        template = self.client.get('/api/predict/template')
        for filename in ['customers.csv']:
            result = self.client.post('/api/predict/upload', files={'file': (filename, template.content, 'text/csv')})
            self.assertEqual(result.status_code, 200, result.text)
        frame = pd.read_csv(io.BytesIO(template.content))
        workbook = io.BytesIO(); frame.to_excel(workbook, index=False)
        self.assertEqual(self.client.post('/api/predict/upload', files={'file': ('batch.xlsx', workbook.getvalue())}).status_code, 200)
        self.assertEqual(self.client.post('/api/predict/upload', files={'file': ('bad.txt', b'bad')}).status_code, 400)
        self.assertEqual(self.client.post('/api/predict/upload', files={'file': ('bad.csv', b'x\n1')}).status_code, 422)

    def test_portfolio_search_is_literal_and_export_matches(self):
        self.assertEqual(self.client.get('/api/portfolio/customers', params={'search': '['}).status_code, 200)
        for search in ['Los Angeles', 'does-not-exist']:
            filters = {'search': search, 'sort_by': 'Monthly Charges', 'sort_dir': 'desc'}
            portfolio = self.client.get('/api/portfolio/customers', params={**filters, 'page_size': 100}).json()
            exported = self.client.get('/api/portfolio/export', params=filters)
            self.assertEqual(exported.status_code, 200, exported.text)
            csv = pd.read_csv(io.BytesIO(exported.content))
            self.assertEqual(len(csv), portfolio['total_count'])
            self.assertEqual(csv['CustomerID'].tolist()[:100], [row['CustomerID'] for row in portfolio['customers']])

    def test_built_frontend_is_served(self):
        response = self.client.get('/')
        self.assertEqual(response.status_code, 200)
        self.assertIn('id="root"', response.text)
        self.assertIn('text/html', response.headers['content-type'])

    def test_retraining_updates_real_active_model(self):
        original = pipeline.current_config.copy()
        with patch.dict(os.environ, {'CHURN_ENV': 'production', 'CHURN_ADMIN_TOKEN': 'test-secret'}):
            result = self.client.post('/api/model/train', headers={'X-Admin-Token': 'test-secret'},
                                      json={'criterion': 'entropy', 'max_depth': 3, 'min_samples_leaf': 40})
            self.assertEqual(result.status_code, 200, result.text)
            self.assertEqual(self.client.get('/api/tree/structure').json()['config']['criterion'], 'entropy')
            status = self.client.get('/api/status').json()['status']
            self.assertEqual(status['reference_tree_accuracy'], result.json()['evaluation']['test_metrics']['accuracy'])
            self.assertEqual(status['accuracy'], self.client.get('/api/model/evaluation').json()['test_metrics']['accuracy'])
        pipeline.train_model(**original)

    def test_model_mutation_authorization(self):
        with patch.dict(os.environ, {'CHURN_ENV': 'production', 'CHURN_ADMIN_TOKEN': 'test-secret'}):
            self.assertEqual(self.client.post('/api/model/train', json={}).status_code, 403)
            self.assertEqual(self.client.post('/api/model/train', headers={'X-Admin-Token': 'wrong'}, json={}).status_code, 403)
            self.assertEqual(self.client.post('/api/model/train', headers={'X-Admin-Token': 'test-secret'}, json={'criterion': 'invalid'}).status_code, 422)

    def test_active_predictor_is_selected_by_training_cv(self):
        report = pipeline.predictor_report
        self.assertIsNotNone(report)
        best = max(report['candidates'], key=lambda row: (row['accuracy'], row['f1']))
        self.assertEqual(report['selected'], best)
        self.assertEqual(pipeline.active_algorithm, report['selected']['algorithm'])
        measured = self.client.get('/api/model/evaluation').json()
        self.assertAlmostEqual(measured['test_metrics']['accuracy'], report['test_metrics']['accuracy'], places=4)

    def test_predictor_switching_and_reference_independence(self):
        selected = pipeline.predictor_report['selected']['algorithm']
        with patch.dict(os.environ, {'CHURN_ENV': 'production', 'CHURN_ADMIN_TOKEN': 'test-secret'}):
            self.assertEqual(self.client.post('/api/model/select', json={'algorithm':'decision_tree'}).status_code,403)
            headers={'X-Admin-Token':'test-secret'}
            response=self.client.post('/api/model/select', headers=headers, json={'algorithm':'decision_tree'})
            self.assertEqual(response.status_code,200,response.text)
            predicted=self.client.post('/api/predict/single', json=CustomerInput().model_dump(by_alias=True)).json()
            self.assertEqual(predicted['algorithm'],'decision_tree')
            self.assertTrue(predicted['decision_path'])
            response=self.client.post('/api/model/select', headers=headers, json={'algorithm':selected})
            self.assertEqual(response.status_code,200,response.text)
            reference=pipeline.model
            self.assertIsNot(reference,pipeline.predictor)
            self.assertEqual(pipeline.active_algorithm,selected)
            self.assertEqual(self.client.post('/api/model/select', headers=headers, json={'algorithm':'made-up'}).status_code,422)

    def test_preprocessing_allowlist_and_zero_tenure(self):
        from preprocessing import ChurnFeatureBuilder,CATEGORIES,NUMBERS,DERIVED
        sample=CustomerInput().model_dump(by_alias=True)
        sample.update({'Tenure Months':0,'Monthly Charges':45,'Total Charges':0,'Churn Score':100,'Churn Label':'Yes'})
        processed=ChurnFeatureBuilder().fit_transform(pd.DataFrame([sample]))
        self.assertEqual(set(processed.columns),set(CATEGORIES+NUMBERS+DERIVED))
        self.assertEqual(processed.iloc[0]['Total Charges'],0)
        self.assertEqual(processed.iloc[0]['Average Monthly Spend'],45)
        self.assertTrue(processed.select_dtypes(include='number').notna().all().all())
        changed={**sample,'Churn Score':0,'Churn Label':'No'}
        pd.testing.assert_frame_equal(processed,ChurnFeatureBuilder().fit_transform(pd.DataFrame([changed])))

    def test_preprocessing_imputation_is_fit_on_training_only(self):
        from preprocessing import make_preprocessor
        sample=CustomerInput().model_dump(by_alias=True)
        training=pd.DataFrame([{**sample,'Monthly Charges':20},{**sample,'Monthly Charges':40}])
        prep=make_preprocessor('raw_onehot'); prep.fit(training)
        test=pd.DataFrame([{**sample,'Monthly Charges':None},{**sample,'Monthly Charges':10000}])
        transformed=prep.transform(test)
        column=list(prep.get_feature_names_out()).index('num__Monthly Charges')
        self.assertEqual(transformed[0,column],30)
        self.assertEqual(transformed[1,column],10000)

    def test_hosted_model_selection_is_isolated(self):
        original=pipeline._active_algorithm
        selected=pipeline.predictor_report['selected']['algorithm']
        sample=CustomerInput().model_dump(by_alias=True)
        with patch.dict(os.environ,{'VERCEL':'1'}):
            response=self.client.post('/api/model/select',json={'algorithm':'decision_tree'})
            self.assertEqual(response.status_code,200,response.text)
            self.assertEqual(pipeline._active_algorithm,original)
            self.assertEqual(self.client.get('/api/status').json()['status']['active_algorithm'],original)
            def predict(algorithm):
                response=self.client.post('/api/predict/single',headers={'X-Predictor':algorithm},json=sample)
                self.assertEqual(response.status_code,200,response.text)
                return response.json()['algorithm']
            with ThreadPoolExecutor(max_workers=4) as executor:
                expected=['decision_tree',selected]*3
                self.assertEqual(list(executor.map(predict,expected)),expected)
            exported=self.client.get('/api/portfolio/export',params={'search':'0002-ORFBO','predictor':'decision_tree'})
            self.assertEqual(exported.status_code,200,exported.text)
            self.assertEqual(pd.read_csv(io.BytesIO(exported.content)).iloc[0]['Prediction_Model'],'CART decision tree')
            self.assertEqual(self.client.post('/api/model/train',json={}).status_code,409)
            self.assertEqual(self.client.get('/api/status',headers={'X-Predictor':'made-up'}).status_code,422)

if __name__ == '__main__':
    unittest.main(verbosity=2)
