"""XGBoost baseline wrapper with sklearn fallback."""
from __future__ import annotations

import logging
from typing import Optional

import pandas as pd

logger = logging.getLogger(__name__)

try:
    from xgboost import XGBRegressor  # type: ignore
    _HAS_XGB = True
except Exception:
    _HAS_XGB = False

from sklearn.ensemble import HistGradientBoostingRegressor


class XGBBaseline:
    """Train a boosted-tree regressor. Tries XGBoost first, otherwise falls back to sklearn's HistGradientBoostingRegressor.

    Parameters
    ----------
    params: Optional[dict]
        Model hyperparameters to pass to the underlying estimator.
    clip_predictions: bool
        If True, clip negative predictions to zero. Disable when the model is trained in a transformed domain (e.g. log or log1p).
    """

    def __init__(self, params: Optional[dict] = None, clip_predictions: bool = True):
        # Use stronger defaults to improve baseline performance
        self.params = params or {"n_estimators": 400, "learning_rate": 0.1, "max_depth": 5}
        self.clip_predictions = clip_predictions
        if _HAS_XGB:
            self.model = XGBRegressor(**self.params)
            logger.info("Using XGBoost for baseline")
        else:
            self.model = HistGradientBoostingRegressor(max_iter=self.params.get("n_estimators", 200), learning_rate=self.params.get("learning_rate", 0.05))
            logger.info("XGBoost not available; using sklearn.HistGradientBoostingRegressor fallback")

    def fit(self, X: pd.DataFrame, y: pd.Series) -> None:
        self.model.fit(X, y)
        logger.info("Boosted model fitted", extra={"rows": len(X)})

    def predict(self, X: pd.DataFrame) -> pd.Series:
        preds = self.model.predict(X)
        if self.clip_predictions:
            import numpy as _np
            preds = _np.maximum(preds, 0.0)
        return pd.Series(preds, index=X.index)


if __name__ == "__main__":
    print("XGBBaseline wrapper")
