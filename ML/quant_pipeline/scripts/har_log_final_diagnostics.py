"""Diagnostics: print actual mean, log target mean, pred mean, inverse pred mean for log1p and log-variance HAR models."""
from pathlib import Path
import numpy as np
import pandas as pd
from ml.data.data_config import DataConfig
from ml.data.market_data_loader import compute_realized_variance, compute_realized_volatility, download_market_data
from ml.features.feature_builder import FeatureBuilder
from ml.models.har_model import HARModel

config = DataConfig()
fb = FeatureBuilder()

for ticker in config.tickers:
    print('---', ticker)
    market_df = download_market_data(ticker, str(config.start_date), str(config.end_date), interval='1d')
    market_df['realized_variance'] = compute_realized_variance(market_df)
    market_df['realized_volatility'] = compute_realized_volatility(market_df['realized_variance'])
    # empty sentiment frame with expected columns
    sent_cols = [
        'date',
        'mean_sentiment',
        'std_sentiment',
        'positive_count',
        'negative_count',
        'neutral_count',
        'rolling_sentiment_mean',
        'rolling_sentiment_std',
        'sentiment_shock',
    ]
    sentiment = pd.DataFrame(columns=sent_cols)
    features = fb.build_features(market_df, sentiment, config.forecast_horizon)
    if features.empty:
        print('no features')
        continue
    train, val, test = fb.train_validation_test_split(features)
    # log1p target
    y = test['future_realized_volatility'].clip(lower=0.0)
    y_log1p = np.log1p(y)
    # train HAR on log1p
    base_features = [
        'rv_t','rv_t_minus1','rv_daily','rv_weekly','rv_monthly','rv_2day_std','rv_3day_std','overnight_return','abs_return','realized_quarticity'
    ]
    from sklearn.preprocessing import StandardScaler
    scaler = StandardScaler()
    x_train = train[base_features]
    x_test = test[base_features]
    x_train_s = pd.DataFrame(scaler.fit_transform(x_train), columns=base_features, index=x_train.index)
    x_test_s = pd.DataFrame(scaler.transform(x_test), columns=base_features, index=x_test.index)
    y_train = np.log1p(train['future_realized_volatility'].clip(lower=0.0))
    har = HARModel(use_sentiment=False, estimator='linear', feature_columns=base_features, clip_predictions=False)
    har.fit(x_train_s, y_train)
    pred_log = har.predict(x_test_s)
    pred_vol = pd.Series(np.expm1(pred_log), index=pred_log.index)
    print('log1p domain:')
    print('Actual Mean', float(y.mean()))
    print('Log Target Mean', float(y_log1p.mean()))
    print('Prediction Mean', float(pred_log.mean()))
    print('Inverse Prediction Mean', float(pred_vol.mean()))

    # log-variance HAR
    eps = 1e-12
    ann = 252
    log_vars = ['rv_var_t','rv_var_t_minus1','rv_var_daily','rv_var_weekly','rv_var_monthly']
    x_train_log = np.log(train[log_vars].clip(lower=eps))
    x_test_log = np.log(test[log_vars].clip(lower=eps))
    y_train_log = np.log(train['future_realized_variance'].clip(lower=eps))
    log_model = HARModel(use_sentiment=False, estimator='linear', feature_columns=log_vars, clip_predictions=False)
    log_model.fit(x_train_log, y_train_log)
    pred_logvar = log_model.predict(x_test_log)
    pred_var = np.exp(pred_logvar)
    pred_vol_from_log = pd.Series(np.sqrt(pred_var * ann), index=pred_logvar.index)
    print('log-variance domain:')
    print('Actual Mean', float(y.mean()))
    print('Log Target Mean', float(y_train_log.mean()))
    print('Prediction Mean', float(pred_logvar.mean()))
    print('Inverse Prediction Mean', float(pred_vol_from_log.mean()))

print('Diagnostics complete')
