"""Diagnostics for HAR Log pipeline.

Prints raw vol, log target, model predictions, and inverse-transformed predictions.
"""
from pathlib import Path
import numpy as np
import pandas as pd
import logging

from ml.data.data_config import DataConfig
from ml.data.market_data_loader import compute_realized_variance, compute_realized_volatility, download_market_data
from ml.features.feature_builder import FeatureBuilder
from ml.models.har_model import HARModel

logging.basicConfig(level=logging.INFO)

def run():
    config = DataConfig()
    fb = FeatureBuilder()
    eps = 1e-12
    ann = 252

    for ticker in config.tickers:
        print(f"\n--- Ticker: {ticker} ---")
        market_df = download_market_data(ticker, str(config.start_date), str(config.end_date), interval="1d")
        if market_df.empty:
            print("No market data")
            continue
        market_df['realized_variance'] = compute_realized_variance(market_df)
        market_df['realized_volatility'] = compute_realized_volatility(market_df['realized_variance'])

        # provide an empty sentiment frame with expected columns to avoid merge errors
        sent_cols = [
            "date",
            "mean_sentiment",
            "std_sentiment",
            "positive_count",
            "negative_count",
            "neutral_count",
            "rolling_sentiment_mean",
            "rolling_sentiment_std",
            "sentiment_shock",
        ]
        sentiment = pd.DataFrame(columns=sent_cols)
        features = fb.build_features(market_df, sentiment, config.forecast_horizon)
        train, val, test = fb.train_validation_test_split(features)

        # Raw volatility (test target)
        y = test['future_realized_volatility']
        print("Raw Volatility")
        print('mean', float(y.mean()))
        print('min', float(y.min()))
        print('max', float(y.max()))

        # Log target as implemented (log of variance)
        log_vars = ["rv_var_t", "rv_var_t_minus1", "rv_var_daily", "rv_var_weekly", "rv_var_monthly"]
        x_train_log = np.log(train[log_vars].clip(lower=eps))
        x_test_log = np.log(test[log_vars].clip(lower=eps))
        y_train_log = np.log(train['future_realized_variance'].clip(lower=eps))

        print('\nLog Target (variance domain)')
        print('mean', float(y_train_log.mean()))
        print('min', float(y_train_log.min()))
        print('max', float(y_train_log.max()))

        # Fit HAR model on log variance
        model = HARModel(use_sentiment=False, estimator='linear', feature_columns=log_vars, clip_predictions=False)
        model.fit(x_train_log, y_train_log)
        pred_log = model.predict(x_test_log)

        print('\nModel Predictions (pred_log)')
        print('mean', float(pred_log.mean()))
        print('min', float(pred_log.min()))
        print('max', float(pred_log.max()))

        # Inverse transform: variance = exp(pred_log) -> vol = sqrt(var * ann)
        pred_var = np.exp(pred_log.clip(lower=np.log(eps)))
        pred = pd.Series(np.sqrt(pred_var * ann), index=pred_log.index)

        print('\nInverse Transformed Predictions (volatility)')
        print('mean', float(pred.mean()))
        print('min', float(pred.min()))
        print('max', float(pred.max()))

        # Also print a quick sample table
        sample = pd.DataFrame({
            'date': test['date'].values[:5],
            'actual_vol': y.values[:5],
            'pred_vol': pred.values[:5],
            'pred_log': pred_log.values[:5]
        })
        print('\nSample rows (first 5)')
        print(sample.to_string(index=False))

if __name__ == '__main__':
    run()
