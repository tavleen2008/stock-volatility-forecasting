import glob
import pandas as pd
import numpy as np

forecast_files = glob.glob('artifacts/forecasts/*_forecast.csv')
if not forecast_files:
    print('No forecast files found')

for f in forecast_files:
    print('\n====', f)
    df = pd.read_csv(f)
    print('columns:', df.columns.tolist())
    # Identify date column
    date_col = 'date' if 'date' in df.columns else None
    if date_col:
        try:
            df['date_parsed'] = pd.to_datetime(df['date'])
        except Exception:
            print('date column not parseable, sample:', df['date'].head().tolist())
    # Identify actual and forecast columns
    possible_forecast_cols = [c for c in df.columns if 'forecast' in c or 'pred' in c.lower()]
    possible_actuals = [c for c in df.columns if 'actual' in c or 'realized' in c.lower()]
    print('possible_actuals', possible_actuals)
    print('possible_forecasts', possible_forecast_cols)
    for col in possible_actuals + possible_forecast_cols:
        if col in df.columns:
            print('\n--', col)
            print(df[col].head(10).to_string(index=False))
            print(df[col].describe())
            print('unique count:', df[col].nunique())
            print('std:', df[col].std())
    # correlation
    for act in possible_actuals:
        for pred in possible_forecast_cols:
            if act in df.columns and pred in df.columns:
                print('\nCorrelation', act, pred, df[act].corr(df[pred]))

print('\nDone')
