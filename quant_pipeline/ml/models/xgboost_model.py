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
    """Train a boosted-tree regressor. Tries XGBoost first, otherwise falls back to sklearn's HistGradientBoostingRegressor."""

    def __init__(self, params: Optional[dict] = None):
        self.params = params or {"n_estimators": 200, "learning_rate": 0.05, "max_depth": 3}
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
        # Ensure no negative volatility predictions (clip to zero)
        import numpy as _np
        preds = _np.maximum(preds, 0.0)
        return pd.Series(preds, index=X.index)


if __name__ == "__main__":
    print("XGBBaseline wrapper")
