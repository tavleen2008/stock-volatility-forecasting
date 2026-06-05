"""Train a time-series stacking ensemble (linear) combining HAR and XGB forecasts.

Per ticker: uses backup raw forecasts as inputs (har_forecast, xgb_forecast).
Performs rolling-origin out-of-fold predictions, fits final linear weights, and
adopts the ensembled forecast if it improves RMSE over the best base model.
"""
from __future__ import annotations
from pathlib import Path
import numpy as np
import pandas as pd
import math

WORKSPACE = Path(__file__).resolve().parents[3]
RAW_DIR = WORKSPACE / 'artifacts' / 'forecasts'
OUT_REPORT = WORKSPACE / 'artifacts' / 'reports' / 'stacking_summary.csv'
TICKERS = ['AAPL','MSFT','TSLA','NVDA']


def rmse(a,b):
    a = np.asarray(a, dtype=float)
    b = np.asarray(b, dtype=float)
    return float(np.sqrt(np.nanmean((a-b)**2)))


def fit_linear(X, y, l2=1e-6):
    # closed-form ridge regression: (X^T X + l2 I)^{-1} X^T y
    X = np.asarray(X, dtype=float)
    y = np.asarray(y, dtype=float)
    XtX = X.T.dot(X)
    n = XtX.shape[0]
    XtX += l2 * np.eye(n)
    Xty = X.T.dot(y)
    coef = np.linalg.solve(XtX, Xty)
    return coef


def rolling_oof_weights(df, features, target, n_splits=5):
    # Split dates into n_splits sequential blocks and do expanding training
    n = len(df)
    if n < 20:
        n_splits = 3
    idx_splits = np.array_split(np.arange(n), n_splits)
    oof = np.full(n, np.nan)
    coefs = []
    for i in range(1, len(idx_splits)):
        train_idx = np.concatenate(idx_splits[:i])
        test_idx = idx_splits[i]
        X_train = features.iloc[train_idx].values
        y_train = target.iloc[train_idx].values
        X_test = features.iloc[test_idx].values
        if len(train_idx) < max(10, features.shape[1]*3):
            # skip small fold
            continue
        coef = fit_linear(X_train, y_train)
        coefs.append(coef)
        preds = X_test.dot(coef)
        oof[test_idx] = preds
    # average coefs
    if coefs:
        avg_coef = np.mean(np.vstack(coefs), axis=0)
    else:
        avg_coef = np.zeros(features.shape[1])
    return oof, avg_coef


def process_ticker(ticker: str):
    bak = RAW_DIR / f'{ticker}_forecast.backup_raw.csv'
    if not bak.exists():
        print('backup missing for', ticker); return None
    df = pd.read_csv(bak, parse_dates=['date'])
    if 'actual_volatility' not in df.columns:
        print('no actual in', ticker); return None
    # require har and xgb
    if 'har_forecast' not in df.columns or 'xgb_forecast' not in df.columns:
        print('missing model columns for', ticker); return None
    df = df[['date','actual_volatility','har_forecast','xgb_forecast']].dropna()
    if df.empty:
        print('no data for', ticker); return None
    features = df[['har_forecast','xgb_forecast']]
    target = df['actual_volatility']
    # get OOF ensemble preds and average coefficients
    oof, avg_coef = rolling_oof_weights(df, features, target, n_splits=5)
    # if OOF has NaNs (small data), fallback to simple inverse-rmse weights
    if np.isnan(oof).all():
        # compute base rmse
        rmse_h = rmse(target.values, features['har_forecast'].values)
        rmse_x = rmse(target.values, features['xgb_forecast'].values)
        w_h = (1/rmse_h) if rmse_h>0 else 0
        w_x = (1/rmse_x) if rmse_x>0 else 0
        s = w_h + w_x
        if s==0:
            weights = np.array([0.5,0.5])
        else:
            weights = np.array([w_h/s, w_x/s])
        oof = features.values.dot(weights)
        avg_coef = weights

    # evaluate
    rmse_h = rmse(target.values, features['har_forecast'].values)
    rmse_x = rmse(target.values, features['xgb_forecast'].values)
    rmse_ens = rmse(target.values, oof)
    best_base = min(rmse_h, rmse_x)
    improvement = best_base - rmse_ens

    # fit final coefs on full data
    final_coef = fit_linear(features.values, target.values)
    final_preds = features.values.dot(final_coef)

    adopt = rmse(target.values, final_preds) < best_base - 1e-8

    # write canonical if adopt
    out_path = RAW_DIR / f'{ticker}_forecast.csv'
    canonical = df.copy()
    canonical['ensemble_stack_linear'] = final_preds
    canonical['preferred_model_stack'] = 'stack_linear'
    canonical['preferred_prediction_stack'] = final_preds
    if adopt:
        # backup original
        out_bak = RAW_DIR / f'{ticker}_forecast.pre_stack_backup.csv'
        try:
            if out_path.exists():
                out_path.rename(out_bak)
        except Exception:
            pass
        # join other columns from original backup
        orig = pd.read_csv(bak, parse_dates=['date'])
        merged = pd.merge(orig, canonical[['date','ensemble_stack_linear','preferred_model_stack','preferred_prediction_stack']], on='date', how='left')
        merged.to_csv(out_path, index=False)

    return {'ticker':ticker,'rmse_har':rmse_h,'rmse_xgb':rmse_x,'rmse_ens_oof':rmse_ens,'final_rmse':rmse(target.values, final_preds),'adopt':bool(adopt),'final_coef':final_coef.tolist(),'improvement':float(improvement)}


def main():
    rows = []
    for t in TICKERS:
        print('Processing', t)
        r = process_ticker(t)
        if r:
            rows.append(r)
            print(r)
    pd.DataFrame(rows).to_csv(OUT_REPORT, index=False)
    print('Wrote stacking summary to', OUT_REPORT)


if __name__ == '__main__':
    main()
