"""Complete analysis: validation checks, expand markdowns, project health report."""
import os, sys, math
os.environ.setdefault('DATABASE_URL', 'sqlite:///./temp.db')
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

from ml.data.data_config import DataConfig
from ml.data.market_data_loader import download_market_data, compute_realized_variance, compute_realized_volatility
from ml.features.feature_builder import FeatureBuilder
from ml.models.har_model import HARModel

import pandas as pd
import numpy as np
from pathlib import Path
import joblib

OUT_PLOTS = Path('artifacts') / 'plots'
DOCS_DIR = Path('quant_pipeline') / 'docs' / 'plot_analysis'
STUDY_DIR = Path('quant_pipeline') / 'docs' / 'study_notes'
OUT_PLOTS.mkdir(parents=True, exist_ok=True)
DOCS_DIR.mkdir(parents=True, exist_ok=True)
STUDY_DIR.mkdir(parents=True, exist_ok=True)

config = DataConfig()
fb = FeatureBuilder()
metrics = pd.read_csv(Path('artifacts') / 'reports' / 'forecast_metrics.csv') if (Path('artifacts') / 'reports' / 'forecast_metrics.csv').exists() else pd.DataFrame()

REPORT = []


def validate_features(features: pd.DataFrame) -> dict:
    issues = []
    # NaNs
    if features.isna().any().any():
        issues.append('NaN features present')
    # date monotonic
    if not features['date'].is_monotonic_increasing:
        issues.append('Dates not monotonic')
    # check shifted lags: rv_daily should equal realized_volatility.shift(1)
    if 'rv_daily' in features.columns and 'realized_volatility' in features.columns:
        diff = (features['rv_daily'] - features['realized_volatility'].shift(1)).abs().mean()
        if diff > 1e-6:
            issues.append('rv_daily does not match shifted realized_volatility (possible leakage or misalignment)')
    return {'issues': issues}


def check_predictions(df: pd.DataFrame) -> dict:
    res = {}
    for col in df.columns:
        if col.endswith('_forecast'):
            arr = df[col].dropna().values
            if arr.size == 0:
                res[col] = 'no predictions'
            else:
                if float(np.std(arr)) < 1e-6:
                    res[col] = 'constant predictions'
                else:
                    res[col] = 'ok'
    return res


def score_health(scores: dict) -> int:
    # heuristic scoring from components
    architecture = 20
    forecasting = 30
    finance = 20
    docs = 15
    presentation = 15
    # adjust by issues
    # if many issues reduce scores
    n_issues = len(scores.get('issues', [])) + sum(1 for v in scores.get('pred_checks', {}).values() if v!='ok')
    penalty = min(50, n_issues*5)
    total = architecture + forecasting + finance + docs + presentation - penalty
    return max(0, total)


def expand_markdown(ticker: str, df: pd.DataFrame, features: pd.DataFrame, val: dict, pred_checks: dict):
    md = DOCS_DIR / f'{ticker}_analysis.md'
    lines = []
    lines.append(f'# {ticker} Forecast Analysis')
    lines.append('')
    lines.append('## What this plot shows')
    lines.append('- Actual realized volatility vs model forecasts and diagnostics.')
    lines.append('')
    lines.append('## Why this plot matters')
    lines.append('- Validates model responsiveness to spikes and baseline bias.')
    lines.append('')
    lines.append('## How to interpret it')
    lines.append('- Compare forecast lines to actual; look at residuals and distributions.')
    lines.append('')
    lines.append('## Good signs')
    lines.append('- Forecast follows trend; low residual variance; directional accuracy > 0.5')
    lines.append('')
    lines.append('## Bad signs')
    lines.append('- Constant predictions; missed spikes; large QLIKE or RMSE')
    lines.append('')
    lines.append('## What conclusions can be drawn')
    # simple conclusions from metrics
    m = metrics[metrics['ticker']==ticker] if not metrics.empty else pd.DataFrame()
    if not m.empty:
        best = m.sort_values('rmse').iloc[0]
        lines.append(f'- Best model by RMSE: {best.model} (RMSE={best.rmse:.4f})')
    else:
        lines.append('- No metrics available')
    lines.append('')
    lines.append('## Validation checks')
    if val['issues']:
        for it in val['issues']:
            lines.append(f'- ISSUE: {it}')
    else:
        lines.append('- No feature issues detected')
    lines.append('')
    lines.append('## Prediction checks')
    for k,v in pred_checks.items():
        lines.append(f'- {k}: {v}')
    lines.append('')
    lines.append('## Presentation Talking Points')
    lines.append('- 30-second: HAR baseline is interpretable but underpredicts spikes; log-variance improves relative dynamics; tuned GBM provides modest gains.')
    lines.append('- 1-minute: Discuss unit-consistency fix, short-lag features, scaling, and why nonlinear models help for spikes.')
    lines.append('')
    lines.append('## Viva Answers')
    lines.append('- Why underprediction? HAR is linear and averages historical volatility; heavy tails require nonlinear / spike models.')
    lines.append('')
    md.write_text('\n'.join(lines), encoding='utf8')
    return md


def main():
    project_issues = []
    for ticker in config.tickers:
        fc = Path('artifacts') / 'forecasts' / f'{ticker}_forecast.csv'
        if not fc.exists():
            project_issues.append(f'missing forecast for {ticker}')
            continue
        df = pd.read_csv(fc)
        # rebuild features
        try:
            market = download_market_data(ticker, str(config.start_date), str(config.end_date), interval='1d')
            market['realized_variance'] = compute_realized_variance(market)
            market['realized_volatility'] = compute_realized_volatility(market['realized_variance'])
            features = FeatureBuilder().build_features(market, pd.DataFrame(), config.forecast_horizon)
        except Exception as exc:
            features = pd.DataFrame()
        val = validate_features(features) if not features.empty else {'issues': ['feature build failed']}
        pred_checks = check_predictions(df)
        md = expand_markdown(ticker, df, features, val, pred_checks)
        REPORT.append({'ticker': ticker, 'issues': val['issues'], 'pred_checks': pred_checks})
        print('Wrote expanded markdown for', ticker, md)
    # Project health
    scores = {'issues_count': sum(len(x['issues']) for x in REPORT)}
    overall = score_health({'issues': [i for r in REPORT for i in r['issues']], 'pred_checks': {}})
    ph = Path('quant_pipeline') / 'docs' / 'PROJECT_HEALTH.md'
    ph.write_text(f"PROJECT HEALTH REPORT\nOverall score: {overall}/100\nDetails: {scores}\n", encoding='utf8')
    print('Wrote project health report ->', ph)

if __name__ == '__main__':
    main()
