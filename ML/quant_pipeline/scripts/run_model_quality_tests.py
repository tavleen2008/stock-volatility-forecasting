"""Run the four-model quality tests (Metrics, Variance, Correlation, Sentiment impact)
using existing forecast CSV backups.
"""
from pathlib import Path
import pandas as pd
import numpy as np
import math

WORKSPACE = Path(__file__).resolve().parents[3]
RAW_DIR = WORKSPACE / 'artifacts' / 'forecasts'
LOG_DIR = WORKSPACE / 'stock-volatility-forecasting' / 'artifacts' / 'forecasts'
TICKERS = ['AAPL','MSFT','TSLA','NVDA']
MODELS = ['har_forecast','har_sentiment_forecast','xgb_forecast','xgb_sentiment_forecast']


def rmse(a,b):
    return float(np.sqrt(np.nanmean((np.asarray(a)-np.asarray(b))**2)))


def mae(a,b):
    return float(np.nanmean(np.abs(np.asarray(a)-np.asarray(b))))


def r2(a,b):
    a = np.asarray(a); b = np.asarray(b)
    ss_res = np.nansum((a-b)**2)
    ss_tot = np.nansum((a - np.nanmean(a))**2)
    return float(1 - ss_res/ss_tot) if ss_tot>0 else float('nan')


def directional_accuracy(a,b):
    da = np.sign(np.diff(a)) == np.sign(np.diff(b))
    return float(np.nanmean(da)) if len(da)>0 else float('nan')


def corr(a,b):
    try:
        return float(np.corrcoef(a,b)[0,1])
    except Exception:
        return float('nan')


def evaluate_df(df, actual_col='actual_volatility'):
    rows = []
    for m in MODELS:
        if m in df.columns:
            y = df[actual_col].values.astype(float)
            pred = df[m].values.astype(float)
            rows.append({
                'model':m,
                'rmse':rmse(y,pred),
                'mae':mae(y,pred),
                'r2':r2(y,pred),
                'directional_accuracy':directional_accuracy(y,pred),
                'std_actual':float(np.nanstd(y)),
                'std_pred':float(np.nanstd(pred)),
                'corr':corr(y,pred)
            })
    return pd.DataFrame(rows)


def load_backup(path:Path):
    # prefer backup file if present
    bak = path.with_suffix(path.suffix + '.backup_raw.csv')
    if bak.exists():
        try:
            return pd.read_csv(bak, parse_dates=['date'])
        except Exception:
            pass
    # otherwise read original
    return pd.read_csv(path, parse_dates=['date'])


def main():
    all_results = []
    for t in TICKERS:
        raw_path = RAW_DIR / f'{t}_forecast.csv'
        raw_backup = RAW_DIR / f'{t}_forecast.backup_raw.csv'
        log_path = LOG_DIR / f'{t}_forecast_log1p.csv'
        log_backup = LOG_DIR / f'{t}_forecast_log1p.backup_log1p.csv'

        if raw_backup.exists():
            raw_df = pd.read_csv(raw_backup, parse_dates=['date'])
        elif raw_path.exists():
            raw_df = pd.read_csv(raw_path, parse_dates=['date'])
        else:
            print('Missing raw for',t); continue

        if log_backup.exists():
            log_df = pd.read_csv(log_backup, parse_dates=['date'])
        elif log_path.exists():
            log_df = pd.read_csv(log_path, parse_dates=['date'])
        else:
            print('Missing log1p for',t); log_df = None

        print('\nTicker:',t)
        print('--- Raw mode tests ---')
        res_raw = evaluate_df(raw_df)
        print(res_raw.to_string(index=False))
        all_results.append({'ticker':t,'mode':'raw','summary':res_raw})

        if log_df is not None:
            # detect log1p columns -> prefer back-transform if needed
            # For simplicity many log1p files already contain back-transformed values; assume columns are named with _log1p
            # attempt to back-transform any column that endswith '_log1p'
            df = log_df.copy()
            for c in df.columns:
                if c.endswith('_log1p'):
                    try:
                        df[c.replace('_log1p','')] = np.expm1(df[c].astype(float))
                    except Exception:
                        # if expm1 fails, copy as-is
                        df[c.replace('_log1p','')] = df[c]
            print('--- Log1p mode tests (back-transformed where applicable) ---')
            res_log = evaluate_df(df)
            print(res_log.to_string(index=False))
            all_results.append({'ticker':t,'mode':'log1p','summary':res_log})

    # write a compact CSV summary for both modes
    rows = []
    for entry in all_results:
        t = entry['ticker']
        mode = entry['mode']
        for _,r in entry['summary'].iterrows():
            rows.append({'ticker':t, 'mode':mode, 'model':r['model'], 'rmse':r['rmse'], 'mae':r['mae'], 'r2':r['r2'], 'directional_accuracy':r['directional_accuracy'], 'std_actual':r['std_actual'], 'std_pred':r['std_pred'], 'corr':r['corr']})

    out = WORKSPACE / 'artifacts' / 'reports' / 'model_quality_tests.csv'
    pd.DataFrame(rows).to_csv(out, index=False)
    print('\nWrote summary to', out)


if __name__ == '__main__':
    main()
