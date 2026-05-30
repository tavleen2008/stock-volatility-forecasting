import glob
import pandas as pd
import joblib
import os

repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
print('Repo root:', repo_root)

forecast_files = glob.glob(os.path.join(repo_root, 'artifacts', 'forecasts', '*_forecast.csv'))
feature_files = glob.glob(os.path.join(repo_root, 'artifacts', 'features', '*.csv'))
model_files = glob.glob(os.path.join(repo_root, 'artifacts', 'models', '*.joblib'))

if not forecast_files:
    print('No forecast CSVs found at artifacts/forecasts')

for f in forecast_files:
    print('\n---', f)
    df = pd.read_csv(f, parse_dates=['date'])
    print('rows:', len(df))
    if 'actual' in df.columns and 'forecast' in df.columns:
        print('actual describe:\n', df['actual'].describe())
        print('forecast describe:\n', df['forecast'].describe())
        print('forecast unique values:', df['forecast'].nunique())
        print('forecast std:', df['forecast'].std())
        # check correlation
        try:
            print('corr(actual, forecast):', df['actual'].corr(df['forecast']))
        except Exception as e:
            print('corr error', e)
    else:
        print('columns:', df.columns.tolist())

if feature_files:
    for f in feature_files:
        print('\n=== features', f)
        feats = pd.read_csv(f, index_col=0, parse_dates=True, infer_datetime_format=True)
        print('shape', feats.shape)
        print('vars (smallest 10):\n', feats.var(numeric_only=True).sort_values().head(10))
else:
    print('\nNo feature CSVs found at artifacts/features')

if model_files:
    for m in model_files:
        print('\n### model', m)
        try:
            mdl = joblib.load(m)
            coef = getattr(mdl, 'coef_', None)
            intercept = getattr(mdl, 'intercept_', None)
            print('coef:', coef)
            print('intercept:', intercept)
        except Exception as e:
            print('failed to load model', e)
else:
    print('\nNo joblib models found at artifacts/models')

print('\nDiagnostics script finished')
