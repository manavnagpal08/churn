"""Stateless, outcome-free customer preprocessing shared by training and inference."""
import numpy as np
import pandas as pd
from sklearn.base import BaseEstimator, TransformerMixin
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.impute import SimpleImputer

CATEGORIES = ['Gender','Senior Citizen','Partner','Dependents','Phone Service','Multiple Lines',
              'Internet Service','Online Security','Online Backup','Device Protection','Tech Support',
              'Streaming TV','Streaming Movies','Contract','Paperless Billing','Payment Method']
NUMBERS = ['Tenure Months','Monthly Charges','Total Charges']
DERIVED = ['Service Count','Support Count','Streaming Count','Automatic Payment','Contract Months',
           'Tenure Contract Ratio','Average Monthly Spend','Monthly Spend Gap','Monthly Spend Ratio',
           'Expected Total Spend','Total Spend Gap','Log Tenure','Log Total Charges','Family Account']

class ChurnFeatureBuilder(BaseEstimator, TransformerMixin):
    def __init__(self, engineered=True):
        self.engineered = engineered

    def fit(self, X, y=None):
        self.feature_names_in_ = np.array(CATEGORIES + NUMBERS, dtype=object)
        self.n_features_in_ = len(self.feature_names_in_)
        return self

    def transform(self, X):
        # An explicit input allowlist excludes labels and post-outcome fields, even if supplied.
        frame = pd.DataFrame(X).loc[:, CATEGORIES + NUMBERS].copy()
        for name in CATEGORIES:
            frame[name] = frame[name].astype('string').str.strip().fillna('Unknown').astype(str)
        for name in NUMBERS:
            frame[name] = pd.to_numeric(frame[name].replace(r'^\s*$', np.nan, regex=True), errors='coerce')
        frame['Total Charges'] = frame['Total Charges'].fillna(frame['Tenure Months'] * frame['Monthly Charges'])
        if not self.engineered:
            return frame
        tenure = frame['Tenure Months']; monthly = frame['Monthly Charges']; total = frame['Total Charges']
        services = ['Phone Service','Multiple Lines','Online Security','Online Backup','Device Protection','Tech Support','Streaming TV','Streaming Movies']
        frame['Service Count'] = frame[services].eq('Yes').sum(axis=1) + frame['Internet Service'].ne('No').astype(int)
        frame['Support Count'] = frame[['Online Security','Tech Support']].eq('Yes').sum(axis=1)
        frame['Streaming Count'] = frame[['Streaming TV','Streaming Movies']].eq('Yes').sum(axis=1)
        frame['Automatic Payment'] = frame['Payment Method'].str.contains('automatic',regex=False).astype(int)
        frame['Contract Months'] = frame['Contract'].map({'Month-to-month':1,'One year':12,'Two year':24}).astype(float)
        frame['Tenure Contract Ratio'] = tenure / frame['Contract Months']
        frame['Average Monthly Spend'] = total.div(tenure.replace(0,np.nan)).fillna(monthly)
        frame['Monthly Spend Gap'] = monthly - frame['Average Monthly Spend']
        frame['Monthly Spend Ratio'] = monthly / (frame['Average Monthly Spend'] + 1)
        frame['Expected Total Spend'] = tenure * monthly
        frame['Total Spend Gap'] = total - frame['Expected Total Spend']
        frame['Log Tenure'] = np.log1p(tenure.clip(lower=0))
        frame['Log Total Charges'] = np.log1p(total.clip(lower=0))
        frame['Family Account'] = frame[['Partner','Dependents']].eq('Yes').any(axis=1).astype(int)
        return frame.replace([np.inf,-np.inf],np.nan)

    def get_feature_names_out(self, input_features=None):
        return np.array(CATEGORIES + NUMBERS + (DERIVED if self.engineered else []),dtype=object)


def make_preprocessor(kind='engineered_onehot', scaled=False):
    engineered = kind.startswith('engineered')
    steps = [('features',ChurnFeatureBuilder(engineered=engineered))]
    if kind.endswith('native'):
        return Pipeline(steps)
    numeric = NUMBERS + (DERIVED if engineered else [])
    numeric_steps = [('imputer',SimpleImputer(strategy='median'))]
    if scaled:
        numeric_steps.append(('scaler',StandardScaler()))
    columns = ColumnTransformer([
        ('cat',OneHotEncoder(handle_unknown='ignore',sparse_output=False),CATEGORIES),
        ('num',Pipeline(numeric_steps),numeric),
    ],verbose_feature_names_out=True)
    return Pipeline(steps + [('columns',columns)])
