from ml.data.data_config import DataConfig
from ml.data.market_data_loader import download_market_data, compute_realized_variance, compute_realized_volatility
from ml.data.news_data_loader import NewsDataLoader
from ml.nlp.finbert_sentiment import FinBertSentimentService
from ml.features.feature_builder import FeatureBuilder
from ml.models.har_model import HARModel

import pandas as pd
import numpy as np

config = DataConfig()
fb = FeatureBuilder()
news_loader = NewsDataLoader(config.news_api_key)
sent_service = FinBertSentimentService(model_name=config.finbert_model_name)

for ticker in config.tickers:
    print('\n===== Ticker', ticker)
    market_df = download_market_data(ticker, str(config.start_date), str(config.end_date), interval='1d')
    if market_df.empty:
        print('no market data')
        continue
    market_df['realized_variance'] = compute_realized_variance(market_df)
    market_df['realized_volatility'] = compute_realized_volatility(market_df['realized_variance'])
    try:
        news_df = news_loader.fetch_news(ticker, str(config.start_date), str(config.end_date))
    except Exception:
        news_df = pd.DataFrame()
    enriched = sent_service.enrich_news_frame(news_df)
    sentiment = sent_service.aggregate_daily_sentiment_frame(enriched)
    features = fb.build_features(market_df, sentiment, config.forecast_horizon)
    print('features shape', features.shape)
    # check naive diagnostics
    for c in ['rv_daily','rv_weekly','rv_monthly']:
        print('\ncol', c)
        if c in features.columns:
            s = features[c]
            print('head:', s.head(5).tolist())
            print('describe:', s.describe().to_dict())
            print('nunique', s.nunique(), 'std', s.std())
        else:
            print('missing')
    train, val, test = fb.train_validation_test_split(features)
    target_col = 'future_realized_volatility'
    x_train_base = train[['rv_daily','rv_weekly','rv_monthly']]
    x_test_base = test[['rv_daily','rv_weekly','rv_monthly']]
    x_train_sent = train[['rv_daily','rv_weekly','rv_monthly','mean_sentiment','std_sentiment','positive_count','negative_count','neutral_count','rolling_sentiment_mean','rolling_sentiment_std','sentiment_shock']]
    x_test_sent = test[['rv_daily','rv_weekly','rv_monthly','mean_sentiment','std_sentiment','positive_count','negative_count','neutral_count','rolling_sentiment_mean','rolling_sentiment_std','sentiment_shock']]
    y_train = train[target_col]
    y_test = test[target_col]
    print('\ntrain/test sizes', len(x_train_base), len(x_test_base))
    # fit models
    base = HARModel(use_sentiment=False, estimator='linear')
    sent = HARModel(use_sentiment=True, estimator='ridge', ridge_alpha=1.0)
    base.fit(x_train_base, y_train)
    sent.fit(x_train_sent, y_train)
    print('\nBase model coef:', getattr(base.model,'coef_',None))
    print('Base intercept:', getattr(base.model,'intercept_',None))
    print('\nSent model coef:', getattr(sent.model,'coef_',None))
    print('Sent intercept:', getattr(sent.model,'intercept_',None))
    base_pred = base.predict(x_test_base)
    sent_pred = sent.predict(x_test_sent)
    print('\nSample predictions base:', base_pred.head(10).tolist())
    print('base mean/std', base_pred.mean(), base_pred.std())
    print('test mean/std', y_test.mean(), y_test.std())
    print('corr base', y_test.corr(base_pred))
    print('\nSample predictions sent:', sent_pred.head(10).tolist())
    print('sent mean/std', sent_pred.mean(), sent_pred.std())
    print('corr sent', y_test.corr(sent_pred))

print('\nDone')
