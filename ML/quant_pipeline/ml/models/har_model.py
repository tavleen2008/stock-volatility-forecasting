"""HAR and HAR+Sentiment linear/ridge models."""

from pathlib import Path
from typing import Literal
import logging

import joblib
import pandas as pd
from sklearn.linear_model import LinearRegression, Ridge

logger = logging.getLogger(__name__)


class HARModel:
    """Heterogeneous AutoRegressive model with optional sentiment features."""

    def __init__(
        self,
        use_sentiment: bool = False,
        estimator: Literal["linear", "ridge"] = "linear",
        ridge_alpha: float = 1.0,
        feature_columns: list[str] | None = None,
        clip_predictions: bool = True,
    ) -> None:
        self.use_sentiment = use_sentiment
        self.estimator_name = estimator
        self.ridge_alpha = ridge_alpha
        self.clip_predictions = clip_predictions
        # Copy to avoid mutating the caller's list when sentiment cols are appended below
        self.feature_columns = list(feature_columns) if feature_columns is not None else ["rv_daily", "rv_weekly", "rv_monthly"]
        self.sentiment_columns = [
            "mean_sentiment",
            "std_sentiment",
            "positive_count",
            "negative_count",
            "neutral_count",
            "rolling_sentiment_mean",
            "rolling_sentiment_std",
            "sentiment_shock",
        ]
        if use_sentiment:
            self.feature_columns += self.sentiment_columns
        self.model = LinearRegression() if estimator == "linear" else Ridge(alpha=ridge_alpha)

    def fit(self, x_train: pd.DataFrame, y_train: pd.Series, **kwargs: object) -> None:
        missing = [col for col in self.feature_columns if col not in x_train.columns]
        if missing:
            raise ValueError(f"Missing HAR feature columns in x_train: {missing}")
        self.model.fit(x_train[self.feature_columns], y_train)
        logger.info("HAR model fitted", extra={"rows": len(x_train), "use_sentiment": self.use_sentiment})

    def predict(self, x_test: pd.DataFrame, **kwargs: object) -> pd.Series:
        missing = [col for col in self.feature_columns if col not in x_test.columns]
        if missing:
            raise ValueError(f"Missing HAR feature columns in x_test: {missing}")
        pred = self.model.predict(x_test[self.feature_columns])
        logger.info("HAR prediction completed", extra={"rows": len(x_test)})
        # Optionally clip negative predictions at zero (safe for volatility-domain outputs)
        if self.clip_predictions:
            import numpy as _np
            pred = _np.maximum(pred, 0.0)
        return pd.Series(pred, index=x_test.index, name="prediction")

    def save(self, path: str | Path) -> None:
        Path(path).parent.mkdir(parents=True, exist_ok=True)
        joblib.dump(
            {
                "model": self.model,
                "use_sentiment": self.use_sentiment,
                "estimator": self.estimator_name,
                "ridge_alpha": self.ridge_alpha,
                "feature_columns": self.feature_columns,
                "clip_predictions": self.clip_predictions,
            },
            path,
        )
        logger.info("HAR model saved", extra={"path": str(path)})

    @classmethod
    def load(cls, path: str | Path) -> "HARModel":
        payload = joblib.load(path)
        model = cls(
            use_sentiment=payload["use_sentiment"],
            estimator=payload["estimator"],
            ridge_alpha=payload["ridge_alpha"],
            clip_predictions=payload.get("clip_predictions", True),
        )
        model.model = payload["model"]
        model.feature_columns = payload["feature_columns"]
        logger.info("HAR model loaded", extra={"path": str(path)})
        return model


if __name__ == "__main__":
    print("Example: HARModel(use_sentiment=True).fit(x_train, y_train)")
