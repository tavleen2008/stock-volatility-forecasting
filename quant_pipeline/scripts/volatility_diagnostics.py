from ml.data.data_config import DataConfig
from ml.data.market_data_loader import download_market_data, compute_realized_variance, compute_realized_volatility
from ml.features.feature_builder import FeatureBuilder
from ml.nlp.finbert_sentiment import FinBertSentimentService
from ml.models.har_model import HARModel
from ml.evaluation.metrics import rmse

import numpy as np
import pandas as pd
import os

config = DataConfig()
fb = FeatureBuilder()
sent_service = FinBertSentimentService(model_name=config.finbert_model_name)

np.set_printoptions(precision=6, suppress=True)

SENT_COLS = [
    "mean_sentiment",
    "std_sentiment",
    "positive_count",
    "negative_count",
    "neutral_count",
    "rolling_sentiment_mean",
    "rolling_sentiment_std",
    "sentiment_shock",
]


def fit_and_report(ticker: str):
    print('\n' + '='*80)
    print(f'Diagnostics for {ticker}')
    print('='*80)

    market_df = download_market_data(ticker, str(config.start_date), str(config.end_date), interval='1d')
    if market_df.empty:
        print('No market data for', ticker)
        return
    market_df['realized_variance'] = compute_realized_variance(market_df)
    market_df['realized_volatility'] = compute_realized_volatility(market_df['realized_variance'])

    # fetch news and aggregate daily sentiment (may be empty)
    try:
        news_df = sent_service.enrich_news_frame(pd.DataFrame()) if not config.news_api_key else sent_service.enrich_news_frame(pd.DataFrame())
    except Exception:
        news_df = pd.DataFrame()
    # We don't rely on NewsAPI for this diagnostic; sentiment features likely zero
    sentiment_daily = sent_service.aggregate_daily_sentiment_frame(news_df)

    features = fb.build_features(market_df, sentiment_daily, config.forecast_horizon)
    if features.empty:
        print('No features after building for', ticker)
        return

    train, val, test = fb.train_validation_test_split(features)
    target_col_vol = 'future_realized_volatility'
    target_col_var = 'future_realized_variance'

    base_features = [
        'rv_t', 'rv_t_minus1', 'rv_daily', 'rv_weekly', 'rv_monthly',
        'rv_2day_std', 'rv_3day_std', 'overnight_return', 'abs_return', 'realized_quarticity'
    ]
    X_train_base = train[base_features]
    X_test_base = test[base_features]

    # sentiment features
    X_train_sent = train[['rv_daily','rv_weekly','rv_monthly'] + [c for c in SENT_COLS if c in train.columns]]
    X_test_sent = test[['rv_daily','rv_weekly','rv_monthly'] + [c for c in SENT_COLS if c in test.columns]]

    y_train_vol = train[target_col_vol]
    y_test_vol = test[target_col_vol]

    y_train_var = train[target_col_var]
    y_test_var = test[target_col_var]

    print('\nSample sizes: train=%d, test=%d' % (len(X_train_base), len(X_test_base)))

    # Fit HAR (volatility target) - note features are variance-based
    base = HARModel(use_sentiment=False, estimator='linear', feature_columns=base_features)
    base.fit(X_train_base, y_train_vol)
    base_pred = base.predict(X_test_base).reindex(y_test_vol.index)

    # Fit HAR+Sentiment (if sentiment cols non-constant)
    sent_cols_present = [c for c in SENT_COLS if c in X_train_sent.columns]
    sentiment_constant = True
    if sent_cols_present:
        sent_var = X_train_sent[sent_cols_present].var(numeric_only=True)
        if not sent_var.isnull().all() and (sent_var.fillna(0.0) > 1e-12).any():
            sentiment_constant = False
    if sentiment_constant:
        print('\nSentiment features absent or constant; skipping HAR+Sentiment fit and using base predictions as fallback')
        sent_pred = base_pred.copy()
        sent_coef = None
        sent_intercept = None
    else:
        sent_model = HARModel(use_sentiment=True, estimator='ridge', ridge_alpha=1.0, feature_columns=base_features + sent_cols_present)
        sent_model.fit(X_train_sent, y_train_vol)
        sent_pred = sent_model.predict(X_test_sent).reindex(y_test_vol.index)
        sent_coef = sent_model.model.coef_
        sent_intercept = sent_model.model.intercept_

    # Fit log-variance HAR: predict log(future_realized_variance)
    eps = 1e-12
    # For log-variance HAR use recent variance lags only
    log_vars = ['rv_t', 'rv_t_minus1', 'rv_daily', 'rv_weekly', 'rv_monthly']
    x_train_log = np.log(X_train_base[log_vars].clip(lower=eps))
    x_test_log = np.log(X_test_base[log_vars].clip(lower=eps))
    # Make sure y_train_var has positive values
    y_train_log = np.log(y_train_var.clip(lower=eps))
    log_model = HARModel(use_sentiment=False, estimator='linear')
    log_model.fit(x_train_log, y_train_log)
    pred_log = log_model.predict(x_test_log)
    # back-transform to variance and then to volatility (annualized)
    ann = 252
    pred_var = np.exp(pred_log.clip(lower=np.log(eps)))
    pred_vol_from_log = pd.Series(np.sqrt(pred_var * ann), index=pred_log.index)

    # Print coefficients and intercepts
    print('\n--- Model coefficients ---')
    print('HAR coef:', getattr(base.model, 'coef_', None))
    print('HAR intercept:', getattr(base.model, 'intercept_', None))
    print('\nHAR+Sent coef:', sent_coef)
    print('HAR+Sent intercept:', sent_intercept)
    print('\nHAR_log coef (on log-variance features):', getattr(log_model.model, 'coef_', None))
    print('HAR_log intercept:', getattr(log_model.model, 'intercept_', None))

    # Print feature magnitudes and signs
    print('\nFeature means (train):')
    print(X_train_base.mean())

    # Prediction stats
    def stats(name, y_pred, y_test):
        print(f"\n-- {name} --")
        print('y_pred mean/std: ', float(np.mean(y_pred)), float(np.std(y_pred)))
        print('y_test mean/std: ', float(np.mean(y_test)), float(np.std(y_test)))
        print('corr(y_pred,y_test):', float(pd.Series(y_test).corr(pd.Series(y_pred))))

    stats('HAR', base_pred.values, y_test_vol.values)
    stats('HAR+Sentiment', sent_pred.values, y_test_vol.values)
    stats('HAR_log (back-transformed to vol)', pred_vol_from_log.values, y_test_vol.values)

    # Spike analysis: define spikes on actual test set
    thresh = np.percentile(y_test_vol.values, 95)
    spikes_mask = y_test_vol.values > thresh
    num_spikes = int(spikes_mask.sum())
    print('\nSpike threshold (95th pct):', float(thresh), 'num spikes:', num_spikes)
    def spike_stats(preds, name):
        if num_spikes == 0:
            print(f'No spikes for {ticker}')
            return
        avg_pred_during_spikes = float(np.mean(preds[spikes_mask]))
        avg_actual_during_spikes = float(np.mean(y_test_vol.values[spikes_mask]))
        print(f'{name} avg forecast during spikes: {avg_pred_during_spikes:.6f}; actual avg during spikes: {avg_actual_during_spikes:.6f}')

    spike_stats(base_pred.values, 'HAR')
    spike_stats(sent_pred.values, 'HAR+Sentiment')
    spike_stats(pred_vol_from_log.values, 'HAR_log')

    # Explain briefly
    print('\nExplanation:')
    print('- If coefficients are small and intercept large, model predicts near-mean.')
    print('- If features are variance-scale (~1e-3) while target is volatility (~1e-1 to 1), coefficients must be large; otherwise predictions will be small variance around intercept.')
    print('- Log-variance model maps multiplicative dynamics into additive space; back-transform helps capture relative spikes but may still underpredict absolute spike magnitudes without richer features or nonlinear models.')


if __name__ == '__main__':
    for t in config.tickers:
        fit_and_report(t)
    print('\nDiagnostics complete')
