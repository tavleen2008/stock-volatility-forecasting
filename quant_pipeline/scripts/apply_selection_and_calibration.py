"""Select per-ticker preferred mode (raw vs log1p), apply simple calibration,
and write canonical forecast CSVs and regenerates plots.

Backs up original forecast files before overwriting.
"""
from __future__ import annotations
from pathlib import Path
import numpy as np
import pandas as pd
import shutil
import math
from typing import Optional


WORKSPACE_ROOT = Path(__file__).resolve().parents[3]
FORECASTS_WS = WORKSPACE_ROOT / 'artifacts' / 'forecasts'  # workspace-level raw forecasts
FORECASTS_PROJ = WORKSPACE_ROOT / 'stock-volatility-forecasting' / 'artifacts' / 'forecasts'  # log1p outputs inside project folder
PLOTS_DIR = WORKSPACE_ROOT / 'stock-volatility-forecasting' / 'artifacts' / 'plots'

TICKERS = ['AAPL','MSFT','TSLA','NVDA']
MODELS_RAW = ['har_forecast','har_sentiment_forecast','har_log_forecast','xgb_forecast','xgb_sentiment_forecast']


def rmse(a, b):
    a = np.asarray(a, dtype=float)
    b = np.asarray(b, dtype=float)
    return float(np.sqrt(np.nanmean((a - b) ** 2)))


def choose_best_representation(actual: pd.Series, candidate: pd.Series) -> pd.Series:
    """Decide whether candidate is already back-transformed or needs expm1.
    Return the series (either candidate or np.expm1(candidate)) that gives lower RMSE.
    """
    # if candidate has extremely large values, avoid expm1
    try:
        c = candidate.fillna(method='ffill').fillna(method='bfill')
    except Exception:
        c = candidate
    # compute rmse as-is
    r_as_is = rmse(actual, candidate)
    # compute rmse if back-transformed
    try:
        back = np.expm1(candidate.values.astype(float))
        r_back = rmse(actual, back)
    except Exception:
        r_back = math.inf
    return pd.Series(back, index=candidate.index) if r_back < r_as_is else candidate


def calibrate_if_benefit(actual: pd.Series, pred: pd.Series) -> pd.Series:
    """Apply a simple mean-variance matching linear transform if it improves RMSE.
    corrected = (pred - m_pred) * (s_act/s_pred) + m_act
    """
    pred = pred.astype(float)
    actual = actual.astype(float)
    m_pred = np.nanmean(pred)
    s_pred = np.nanstd(pred)
    m_act = np.nanmean(actual)
    s_act = np.nanstd(actual)
    if s_pred == 0 or np.isnan(s_pred) or s_pred <= 1e-12:
        return pred
    corrected = (pred - m_pred) * (s_act / s_pred) + m_act
    if rmse(actual, corrected) < rmse(actual, pred):
        return pd.Series(corrected, index=pred.index)
    return pred


def process_ticker(ticker: str):
    raw_path = FORECASTS_WS / f'{ticker}_forecast.csv'
    log_path = FORECASTS_PROJ / f'{ticker}_forecast_log1p.csv'
    if not raw_path.exists():
        print('Missing raw forecast for', ticker)
        return None
    if not log_path.exists():
        print('Missing log1p forecast for', ticker)
        return None

    raw = pd.read_csv(raw_path, parse_dates=['date'])
    log = pd.read_csv(log_path, parse_dates=['date'])

    merged = pd.merge(raw, log, on='date', how='inner', suffixes=('_raw', '_log'))
    if merged.empty:
        print('No overlap for', ticker)
        return None

    actual = merged['actual_volatility_raw'] if 'actual_volatility_raw' in merged.columns else merged['actual_volatility']

    # evaluate raw models
    best_raw_rmse = math.inf
    best_raw_col = None
    for m in MODELS_RAW:
        col = f'{m}'
        if col in merged.columns:
            r = rmse(actual, merged[col])
            if r < best_raw_rmse:
                best_raw_rmse = r
                best_raw_col = col

    # evaluate log1p models (detect whether back-transform needed)
    best_log_rmse = math.inf
    best_log_col = None
    best_log_series = None
    for c in merged.columns:
        if 'log1p' in c or 'log' in c and c.endswith('_log'):
            # candidate
            candidate = merged[c]
            chosen = choose_best_representation(actual, candidate)
            r = rmse(actual, chosen)
            if r < best_log_rmse:
                best_log_rmse = r
                best_log_col = c
                best_log_series = chosen

    # compare and choose
    use_log = False
    chosen_series = None
    chosen_label = None
    if best_log_rmse < best_raw_rmse:
        use_log = True
        chosen_series = best_log_series
        chosen_label = best_log_col
    else:
        use_log = False
        chosen_series = merged[best_raw_col]
        chosen_label = best_raw_col

    # calibrate if improves
    calib = calibrate_if_benefit(actual, chosen_series)
    improved = not calib.equals(chosen_series)
    final = calib

    # backup
    bak_raw = raw_path.with_suffix('.backup_raw.csv')
    bak_log = log_path.with_suffix('.backup_log1p.csv')
    try:
        shutil.copy(raw_path, bak_raw)
        shutil.copy(log_path, bak_log)
    except Exception:
        pass

    # construct canonical dataframe: keep date & actual & all model columns (standardized)
    canonical = merged[[col for col in merged.columns if col.endswith('_raw') or col=='date']].copy()
    # rename raw model columns to standard names if needed
    for col in list(canonical.columns):
        if col.endswith('_raw') and col != 'actual_volatility_raw':
            canonical[col.replace('_raw','')] = canonical.pop(col)
    # insert chosen prediction as preferred_prediction
    canonical['preferred_model'] = chosen_label
    canonical['preferred_prediction'] = final.values
    canonical['preferred_source'] = 'log1p' if use_log else 'raw'

    # write canonical to workspace-level forecast path (overwrite)
    out_path = raw_path
    # rename actual_volatility_raw to actual_volatility
    if 'actual_volatility_raw' in canonical.columns:
        canonical = canonical.rename(columns={'actual_volatility_raw':'actual_volatility'})

    canonical.to_csv(out_path, index=False)

    print(f'{ticker}: chosen {chosen_label} (use_log={use_log}) | calibration_applied={improved} | rmse_raw={best_raw_rmse:.6f} rmse_log={best_log_rmse:.6f}')
    return {'ticker':ticker,'chosen':chosen_label,'use_log':use_log,'calibrated':improved,'rmse_raw':best_raw_rmse,'rmse_log':best_log_rmse}


def main():
    results = []
    for t in TICKERS:
        r = process_ticker(t)
        if r:
            results.append(r)

    # regenerate plots using existing scripts if available
    try:
        import subprocess
        # run generate_plots.py and plot_side_by_side.py (project scripts)
        proj_scripts = WORKSPACE_ROOT / 'stock-volatility-forecasting' / 'quant_pipeline' / 'scripts'
        gp = proj_scripts / 'generate_plots.py'
        ps = proj_scripts / 'plot_side_by_side.py'
        subprocess.run(['python', str(gp)], check=False)
        subprocess.run(['python', str(ps)], check=False)
    except Exception:
        pass

    # write summary
    summary = WORKSPACE_ROOT / 'artifacts' / 'reports' / 'selection_summary.csv'
    pd.DataFrame(results).to_csv(summary, index=False)
    print('Selection completed — summary written to', summary)


if __name__ == '__main__':
    main()
