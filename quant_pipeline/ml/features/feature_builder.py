"""Unified feature engineering pipeline."""

import logging

import numpy as np
import pandas as pd

logger = logging.getLogger(__name__)


class FeatureBuilder:
    """Build market + sentiment features and forecasting targets."""

    def build_features(
        self,
        market_df: pd.DataFrame,
        sentiment_daily_df: pd.DataFrame,
        forecast_horizon: int,
    ) -> pd.DataFrame:
        """Build model-ready feature matrix.

        Args:
            market_df: Market rows including realized variance/volatility.
            sentiment_daily_df: Daily sentiment aggregates.
            forecast_horizon: Forward horizon in days.

        Returns:
            pd.DataFrame: Cleaned feature dataframe.
        """

        required = {"date", "close", "realized_variance", "realized_volatility"}
        if not required.issubset(set(market_df.columns)):
            missing = required.difference(set(market_df.columns))
            raise ValueError(f"market_df missing required columns: {sorted(missing)}")
        if forecast_horizon < 1:
            raise ValueError("forecast_horizon must be >= 1")

        frame = market_df.copy().sort_values("date")
        frame["returns"] = frame["close"].pct_change()
        frame["log_returns"] = np.log(frame["close"] / frame["close"].shift(1))

        frame["rv_daily"] = frame["realized_variance"].shift(1)
        frame["rv_weekly"] = frame["realized_variance"].shift(1).rolling(5).mean()
        frame["rv_monthly"] = frame["realized_variance"].shift(1).rolling(22).mean()

        sentiment = sentiment_daily_df.copy()
        if not sentiment.empty:
            sentiment["date"] = pd.to_datetime(sentiment["date"]).dt.floor("D")
        frame["date"] = pd.to_datetime(frame["date"]).dt.floor("D")
        frame = frame.merge(sentiment, on="date", how="left")

        sentiment_cols = [
            "mean_sentiment",
            "std_sentiment",
            "positive_count",
            "negative_count",
            "neutral_count",
            "rolling_sentiment_mean",
            "rolling_sentiment_std",
            "sentiment_shock",
        ]
        for col in sentiment_cols:
            if col not in frame.columns:
                frame[col] = 0.0
            frame[col] = frame[col].fillna(0.0)

        frame["future_realized_variance"] = frame["realized_variance"].shift(-forecast_horizon)
        frame["future_realized_volatility"] = frame["realized_volatility"].shift(-forecast_horizon)

        output = frame.replace([np.inf, -np.inf], np.nan).dropna().reset_index(drop=True)
        logger.info("Feature build completed", extra={"rows": len(output), "horizon": forecast_horizon})
        return output

    def train_validation_test_split(
        self,
        feature_df: pd.DataFrame,
        train_ratio: float = 0.7,
        val_ratio: float = 0.15,
        test_ratio: float = 0.15,
    ) -> tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
        """Chronologically split data with no leakage."""

        if not np.isclose(train_ratio + val_ratio + test_ratio, 1.0):
            raise ValueError("train_ratio + val_ratio + test_ratio must equal 1.0")
        if feature_df.empty:
            raise ValueError("feature_df is empty")

        data = feature_df.sort_values("date").reset_index(drop=True)
        n = len(data)
        train_end = int(n * train_ratio)
        val_end = train_end + int(n * val_ratio)

        train = data.iloc[:train_end].copy()
        val = data.iloc[train_end:val_end].copy()
        test = data.iloc[val_end:].copy()
        logger.info("Chronological split completed", extra={"train": len(train), "val": len(val), "test": len(test)})
        return train, val, test


if __name__ == "__main__":
    print("FeatureBuilder().build_features(market_df, sentiment_df, forecast_horizon=1)")
