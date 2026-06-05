from __future__ import annotations

from pathlib import Path
import numpy as np
import pandas as pd
from ml.data.data_config import DataConfig
from ml.features.feature_builder import FeatureBuilder
from ml.data.market_data_loader import download_market_data, compute_realized_variance, compute_realized_volatility
from ml.data.news_data_loader import NewsDataLoader
from ml.models.har_model import HARModel
from ml.models.xgboost_model import XGBBaseline
from ml.evaluation.metrics import metric_summary
from sklearn.preprocessing import StandardScaler


def inspect():
    config = DataConfig()
    fb = FeatureBuilder()
    news_loader = NewsDataLoader(config.news_api_key)

    for ticker in config.tickers:
        print(f"\n--- {ticker} ---")
        market_df = download_market_data(ticker, str(config.start_date), str(config.end_date), interval="1d")
        if market_df.empty:
            print("no market data")
            continue
        market_df["realized_variance"] = compute_realized_variance(market_df)
        market_df["realized_volatility"] = compute_realized_volatility(market_df["realized_variance"])
        try:
            news_df = news_loader.fetch_news(ticker, str(config.start_date), str(config.end_date))
        except Exception:
            news_df = pd.DataFrame(columns=["headline", "snippet", "ticker", "source", "timestamp", "url"])

        # provide an empty sentiment frame with a `date` column to avoid merge KeyError
        empty_sent = pd.DataFrame({"date": pd.Series(dtype="datetime64[ns]")})
        features = fb.build_features(market_df=market_df, sentiment_daily_df=empty_sent, forecast_horizon=config.forecast_horizon)
        train, val, test = fb.train_validation_test_split(features)
        print(f"train size: {len(train)}, test size: {len(test)}, eval rows: {len(test)}")

        target_col = "future_realized_volatility"
        base_features = [
            "rv_t",
            "rv_t_minus1",
            "rv_daily",
            "rv_weekly",
            "rv_monthly",
            "rv_2day_std",
            "rv_3day_std",
            "overnight_return",
            "abs_return",
            "realized_quarticity",
        ]
        sentiment_features = [
            "mean_sentiment",
            "std_sentiment",
            "positive_count",
            "negative_count",
            "neutral_count",
            "rolling_sentiment_mean",
            "rolling_sentiment_std",
            "sentiment_shock",
        ]

        x_train_base = train[base_features]
        x_test_base = test[base_features]
        x_train_sent = train[base_features + sentiment_features]
        x_test_sent = test[base_features + sentiment_features]

        base_scaler = StandardScaler()
        x_train_base_scaled = pd.DataFrame(base_scaler.fit_transform(x_train_base), columns=base_features, index=x_train_base.index)
        x_test_base_scaled = pd.DataFrame(base_scaler.transform(x_test_base), columns=base_features, index=x_test_base.index)

        sent_scaler = StandardScaler()
        x_train_sent_scaled = pd.DataFrame(sent_scaler.fit_transform(x_train_sent), columns=x_train_sent.columns, index=x_train_sent.index)
        x_test_sent_scaled = pd.DataFrame(sent_scaler.transform(x_test_sent), columns=x_test_sent.columns, index=x_test_sent.index)

        y_train = train[target_col]
        y_test = test[target_col]

        base_model = HARModel(use_sentiment=False, estimator="linear", feature_columns=base_features)
        sentiment_model = HARModel(use_sentiment=True, estimator="ridge", ridge_alpha=1.0, feature_columns=base_features + sentiment_features)
        xgb_model = XGBBaseline()

        base_model.fit(x_train_base_scaled, y_train)
        base_pred = base_model.predict(x_test_base_scaled).reindex(y_test.index)
        sentiment_model.fit(x_train_sent_scaled, y_train)
        sentiment_pred = sentiment_model.predict(x_test_sent_scaled).reindex(y_test.index)

        xgb_model.fit(x_train_base_scaled, y_train)
        xgb_pred = xgb_model.predict(x_test_base_scaled).reindex(y_test.index)
        xgb_model.fit(x_train_sent_scaled, y_train)
        xgb_sent_pred = xgb_model.predict(x_test_sent_scaled).reindex(y_test.index)

        print("y_test array:\n", y_test.values)
        print("har_pred array:\n", base_pred.values)
        print("har_sent_pred array:\n", sentiment_pred.values)
        print("xgb_pred array:\n", xgb_pred.values)
        print("xgb_sent_pred array:\n", xgb_sent_pred.values)

        print("Compute RMSE on y_test vs har_pred:")
        print(metric_summary(y_test[base_pred.notna()], base_pred.dropna()))
        print("Compute RMSE on y_test vs har_sent_pred:")
        print(metric_summary(y_test[sentiment_pred.notna()], sentiment_pred.dropna()))


if __name__ == "__main__":
    inspect()
