"""Compare HAR trained on volatility vs log1p(volatility) targets."""
from ml.data.data_config import DataConfig
from ml.data.market_data_loader import download_market_data, compute_realized_variance, compute_realized_volatility
from ml.features.feature_builder import FeatureBuilder
from ml.models.har_model import HARModel
from ml.evaluation.metrics import metric_summary
import numpy as np
import pandas as pd

config = DataConfig()
fb = FeatureBuilder()

results = []
for ticker in config.tickers:
    print('\n===', ticker)
    market_df = download_market_data(ticker, str(config.start_date), str(config.end_date), interval='1d')
    if market_df.empty:
        print('no market data')
        continue
    market_df['realized_variance'] = compute_realized_variance(market_df)
    market_df['realized_volatility'] = compute_realized_volatility(market_df['realized_variance'])
    # pass empty sentiment frame with expected columns to avoid merge KeyError
    empty_sent = pd.DataFrame(columns=['date','mean_sentiment','std_sentiment','positive_count','negative_count','neutral_count','rolling_sentiment_mean','rolling_sentiment_std','sentiment_shock'])
    features = fb.build_features(market_df, empty_sent, config.forecast_horizon)
    train, val, test = fb.train_validation_test_split(features)
    base_feats = ['rv_t','rv_t_minus1','rv_daily','rv_weekly','rv_monthly']
    X_train = train[base_feats]
    X_test = test[base_feats]
    y_train = train['future_realized_volatility']
    y_test = test['future_realized_volatility']
    # fit on raw volatility
    h_raw = HARModel(use_sentiment=False, estimator='linear', feature_columns=base_feats)
    h_raw.fit(X_train, y_train)
    p_raw = h_raw.predict(X_test)
    m_raw = metric_summary(y_test, p_raw)
    # fit on log1p target
    y_train_log1p = np.log1p(y_train.clip(lower=0.0))
    h_log = HARModel(use_sentiment=False, estimator='linear', feature_columns=base_feats)
    h_log.fit(X_train, y_train_log1p)
    p_log = h_log.predict(X_test)
    # back-transform
    p_log_bt = pd.Series(np.expm1(p_log.clip(lower=np.log1p(1e-12))), index=p_log.index)
    m_log = metric_summary(y_test, p_log_bt)
    print('raw RMSE', m_raw['rmse'], 'log1p RMSE', m_log['rmse'])
    results.append({'ticker':ticker, 'raw_rmse':m_raw['rmse'], 'log1p_rmse':m_log['rmse'], 'raw':m_raw, 'log1p':m_log})

print('\nSummary:')
for r in results:
    print(r['ticker'], 'raw RMSE', r['raw_rmse'], 'log1p RMSE', r['log1p_rmse'])

