"""Recompute HAR Log (variance-domain) forecasts without clipping and update forecast CSVs.

For each ticker forecast CSV (both *_forecast.csv and *_forecast_log1p.csv),
- download market data
- build features
- split into train/val/test
- fit HARModel on log(realized_variance) with clip_predictions=False
- back-transform to volatility
- overwrite `har_log_forecast` column in CSV and save backup
- regenerate the corresponding plot using the regenerated plotting logic
"""
from pathlib import Path
import shutil
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from matplotlib.dates import AutoDateLocator, DateFormatter

from ml.data.data_config import DataConfig
from ml.data.market_data_loader import download_market_data, compute_realized_variance, compute_realized_volatility
from ml.features.feature_builder import FeatureBuilder
from ml.models.har_model import HARModel

ROOT = Path(__file__).resolve().parents[2]
FORECAST_DIR = ROOT / 'artifacts' / 'forecasts'
PLOT_DIR = ROOT / 'artifacts' / 'plots'
ARCH = ROOT / 'artifacts' / 'archive' / 'repair_backups'
ARCH.mkdir(parents=True, exist_ok=True)

config = DataConfig()
fb = FeatureBuilder()

eps = 1e-12
ann = 252

for ticker in config.tickers:
    print(f"\nRepairing HAR Log for {ticker}")
    # download market data
    market = download_market_data(ticker, str(config.start_date), str(config.end_date), interval='1d')
    if market.empty:
        print('No market data; skipping')
        continue
    market['realized_variance'] = compute_realized_variance(market)
    market['realized_volatility'] = compute_realized_volatility(market['realized_variance'])

    # build features (empty sentiment)
    sent_cols = ['date','mean_sentiment','std_sentiment','positive_count','negative_count','neutral_count','rolling_sentiment_mean','rolling_sentiment_std','sentiment_shock']
    sentiment = pd.DataFrame(columns=sent_cols)
    features = fb.build_features(market, sentiment, config.forecast_horizon)
    train, val, test = fb.train_validation_test_split(features)

    # prepare log-variance features
    log_vars = ['rv_var_t','rv_var_t_minus1','rv_var_daily','rv_var_weekly','rv_var_monthly']
    x_train_log = np.log(train[log_vars].clip(lower=eps))
    x_test_log = np.log(test[log_vars].clip(lower=eps))
    y_train_log = np.log(train['future_realized_variance'].clip(lower=eps))

    # fit HAR on log variance without clipping
    model = HARModel(use_sentiment=False, estimator='linear', feature_columns=log_vars, clip_predictions=False)
    model.fit(x_train_log, y_train_log)
    pred_log = model.predict(x_test_log)
    pred_var = np.exp(pred_log.clip(lower=np.log(eps)))
    pred_vol = pd.Series(np.sqrt(pred_var * ann), index=pred_log.index, name='har_log_forecast')
    # enforce non-negative volatility (safety guard)
    pred_vol = pred_vol.clip(lower=0.0)

    # Update CSVs if present
    for pattern in [f'{ticker}_forecast.csv', f'{ticker}_forecast_log1p.csv', f'{ticker}_forecast_log1p.backup_log1p.csv']:
        path = FORECAST_DIR / pattern
        if not path.exists():
            continue
        # backup
        bak = ARCH / (path.name + '.bak')
        shutil.copy2(path, bak)
        try:
            df = pd.read_csv(path)
            # align by date index
            df_dates = pd.to_datetime(df['date'])
            # create a series indexed by dates from pred_vol (which uses test index as datetime)
            s_pred = pred_vol.copy()
            # pred_vol.index may be datetime-like already; convert
            s_pred.index = pd.to_datetime(s_pred.index)
            # map predictions onto df by matching dates
            # Create a column of NaNs, then fill where dates match
            new_col = pd.Series([float('nan')] * len(df), index=df.index)
            date_to_idx = {d:i for i,d in enumerate(df_dates)}
            for i,d in enumerate(df_dates):
                if d in s_pred.index:
                    new_col.iat[i] = float(s_pred.loc[d])
            df['har_log_forecast'] = new_col.values
            df.to_csv(path, index=False)
            print('Updated', path)
        except Exception as e:
            print('Failed updating', path, e)

    # regenerate plot from updated *_forecast_log1p.csv if exists, else *_forecast.csv
    csv_path = None
    if (FORECAST_DIR / f'{ticker}_forecast_log1p.csv').exists():
        csv_path = FORECAST_DIR / f'{ticker}_forecast_log1p.csv'
    elif (FORECAST_DIR / f'{ticker}_forecast.csv').exists():
        csv_path = FORECAST_DIR / f'{ticker}_forecast.csv'
    if csv_path:
        df = pd.read_csv(csv_path)
        df['date'] = pd.to_datetime(df['date'])
        df = df.sort_values('date').set_index('date')
        # build preds df
        forecast_cols = [c for c in df.columns if c != 'actual_volatility']
        preds_df = df[forecast_cols]
        # plot
        fig, ax = plt.subplots(figsize=(11,5))
        ax.plot(df.index, df['actual_volatility'].values, label='Actual', linewidth=2)
        for col in preds_df.columns:
            ax.plot(preds_df.index, preds_df[col].values, label=col, linewidth=1.5)
        ax.set_title(f'{ticker} realized vs forecast volatility (repaired)')
        ax.set_xlabel('Date')
        ax.set_ylabel('Realized volatility')
        locator = AutoDateLocator()
        formatter = DateFormatter('%Y-%m-%d')
        ax.xaxis.set_major_locator(locator)
        ax.xaxis.set_major_formatter(formatter)
        fig.autofmt_xdate(rotation=30)
        ax.legend()
        out = PLOT_DIR / f'{ticker}_forecast_repaired.png'
        fig.tight_layout(); fig.savefig(out, dpi=160); plt.close(fig)
        print('Wrote plot', out)

print('\nRepair completed')
