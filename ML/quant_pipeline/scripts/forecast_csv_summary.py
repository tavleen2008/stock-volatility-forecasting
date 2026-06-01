"""Print summary statistics comparing actual volatility and har_log_forecast from forecast CSVs."""
from pathlib import Path
import pandas as pd

ROOT = Path(__file__).resolve().parents[2]
FORECAST_DIR = ROOT / 'artifacts' / 'forecasts'

for csv in sorted(FORECAST_DIR.glob('*_forecast*.csv')):
    df = pd.read_csv(csv)
    if 'har_log_forecast' not in df.columns:
        continue
    actual = df['actual_volatility'].dropna()
    pred = df['har_log_forecast'].dropna()
    print('\n---', csv.name, '---')
    print('actual.mean', float(actual.mean()), 'actual.std', float(actual.std()))
    print('har_log_forecast.mean', float(pred.mean()), 'har_log_forecast.std', float(pred.std()))
    # check for extreme values
    print('har_log_forecast.min', float(pred.min()), 'max', float(pred.max()))
