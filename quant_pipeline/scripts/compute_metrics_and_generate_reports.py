"""Compute final metrics (including correlation) and generate checkpoint docs.
"""
from pathlib import Path
import pandas as pd
import numpy as np

ROOT = Path(__file__).resolve().parents[2]
FORECAST_DIR = ROOT.parent / 'artifacts' / 'forecasts'
REPORTS_DIR = ROOT.parent / 'artifacts' / 'reports'
OUT_DOCS = ROOT.parent / 'docs' / 'checkpoint1'
OUT_DOCS.mkdir(parents=True, exist_ok=True)

metrics_csv = REPORTS_DIR / 'forecast_metrics.csv'
if metrics_csv.exists():
    metrics = pd.read_csv(metrics_csv)
else:
    metrics = pd.DataFrame()

rows = []
for f in sorted((ROOT.parent / 'artifacts' / 'forecasts').glob('*_forecast*.csv')):
    df = pd.read_csv(f)
    if 'actual_volatility' not in df.columns:
        continue
    actual = pd.to_numeric(df['actual_volatility'], errors='coerce')
    ticker = f.stem.split('_')[0]
    for col in [c for c in df.columns if c not in ['date','actual_volatility']]:
        pred = pd.to_numeric(df[col], errors='coerce')
        # align lengths
        mask = ~actual.isna() & ~pred.isna()
        if mask.sum() == 0:
            corr = float('nan')
        else:
            corr = float(np.corrcoef(actual[mask], pred[mask])[0,1])
        rows.append({'ticker': ticker, 'model_col': col, 'correlation': corr})

corr_df = pd.DataFrame(rows)
# merge with metrics table by matching model names where possible
# prepare a mapping from col names to model labels
mapping = {
    'har_forecast':'HAR',
    'har_sentiment_forecast':'HAR+Sentiment',
    'har_log_forecast':'HAR_LogVar',
    'xgb_forecast':'XGB',
    'xgb_sentiment_forecast':'XGB+Sentiment',
    'har_forecast_log1p':'HAR_log1p',
    'har_sentiment_forecast_log1p':'HAR+Sent_log1p',
    'xgb_forecast_log1p':'XGB_log1p',
    'xgb_sentiment_forecast_log1p':'XGB+Sent_log1p',
}

def col_to_model(col):
    return mapping.get(col, col)

corr_df['model'] = corr_df['model_col'].apply(col_to_model)
# aggregate correlation per ticker+model (take mean if duplicates)
corr_agg = corr_df.groupby(['ticker','model'], as_index=False)['correlation'].mean()

if not metrics.empty:
    merged = metrics.merge(corr_agg, on=['ticker','model'], how='left')
else:
    merged = corr_agg.copy()

# write updated report
merged.to_csv(REPORTS_DIR / 'forecast_metrics_with_corr.csv', index=False)

# generate human-readable model comparison report
out_md = OUT_DOCS / 'model_comparison_report.md'
with out_md.open('w', encoding='utf8') as f:
    f.write('# Model Comparison Report\n\n')
    if not merged.empty:
        for t in merged['ticker'].unique():
            f.write(f'## {t}\n\n')
            sub = merged[merged['ticker']==t].sort_values('rmse' if 'rmse' in merged.columns else 'correlation')
            for _,row in sub.iterrows():
                f.write(f"- {row['model']}: RMSE={row.get('rmse', 'n/a')}, MAE={row.get('mae', 'n/a')}, R2={row.get('r2','n/a')}, DirAcc={row.get('directional_accuracy','n/a')}, Corr={row.get('correlation', 'n/a')}\n")
            f.write('\n')
    else:
        f.write('No metrics available.\n')

print('Wrote', out_md)
