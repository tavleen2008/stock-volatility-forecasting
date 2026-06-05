"""Evaluation metrics for volatility forecasting."""

import logging

import numpy as np
import pandas as pd

logger = logging.getLogger(__name__)


def _validate_series(y_true: pd.Series, y_pred: pd.Series) -> None:
    if len(y_true) != len(y_pred):
        raise ValueError("y_true and y_pred must have equal length")
    if len(y_true) == 0:
        raise ValueError("y_true and y_pred cannot be empty")


def rmse(y_true: pd.Series, y_pred: pd.Series) -> float:
    _validate_series(y_true, y_pred)
    return float(np.sqrt(np.mean((y_true - y_pred) ** 2)))


def mae(y_true: pd.Series, y_pred: pd.Series) -> float:
    _validate_series(y_true, y_pred)
    return float(np.mean(np.abs(y_true - y_pred)))


def mape(y_true: pd.Series, y_pred: pd.Series, eps: float = 1e-8) -> float:
    _validate_series(y_true, y_pred)
    denom = y_true.abs().clip(lower=eps)
    return float(np.mean(np.abs((y_true - y_pred) / denom)) * 100.0)


def r2(y_true: pd.Series, y_pred: pd.Series) -> float:
    _validate_series(y_true, y_pred)
    ss_res = np.sum((y_true - y_pred) ** 2)
    ss_tot = np.sum((y_true - y_true.mean()) ** 2)
    return float(1 - ss_res / ss_tot) if ss_tot > 0 else 0.0


def directional_accuracy(y_true: pd.Series, y_pred: pd.Series) -> float:
    _validate_series(y_true, y_pred)
    true_dir = np.sign(y_true.diff().fillna(0.0))
    pred_dir = np.sign(y_pred.diff().fillna(0.0))
    return float((true_dir == pred_dir).mean())


def qlike_loss(y_true: pd.Series, y_pred: pd.Series, eps: float = 1e-8) -> float:
    _validate_series(y_true, y_pred)
    y_t = y_true.clip(lower=eps)
    # QLIKE is undefined for non-positive forecasts; clip forecasts before evaluation.
    y_p = y_pred.clip(lower=eps)
    return float(np.mean(np.log(y_p) + (y_t / y_p)))


def volatility_mse(y_true_vol: pd.Series, y_pred_vol: pd.Series) -> float:
    _validate_series(y_true_vol, y_pred_vol)
    return float(np.mean((y_true_vol - y_pred_vol) ** 2))


def variance_mse(y_true_var: pd.Series, y_pred_var: pd.Series) -> float:
    _validate_series(y_true_var, y_pred_var)
    return float(np.mean((y_true_var - y_pred_var) ** 2))


def metric_summary(y_true: pd.Series, y_pred: pd.Series) -> dict[str, float]:
    summary = {
        "rmse": rmse(y_true, y_pred),
        "mae": mae(y_true, y_pred),
        "mape": mape(y_true, y_pred),
        "r2": r2(y_true, y_pred),
        "directional_accuracy": directional_accuracy(y_true, y_pred),
        "qlike": qlike_loss(y_true, y_pred),
    }
    logger.info("Metric summary computed", extra={"rows": len(y_true)})
    return summary


if __name__ == "__main__":
    true = pd.Series([0.2, 0.25, 0.22, 0.3])
    pred = pd.Series([0.21, 0.23, 0.2, 0.31])
    print(metric_summary(true, pred))
