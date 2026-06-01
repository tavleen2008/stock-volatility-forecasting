from __future__ import annotations

from pathlib import Path
import sys
import numpy as np
import pandas as pd


ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

def _qlike(actual: pd.Series, pred: pd.Series, eps: float = 1e-6) -> float:
    actual_clipped = actual.clip(lower=eps)
    pred_clipped = pred.clip(lower=eps)
    return float(np.mean(np.log(pred_clipped) + (actual_clipped / pred_clipped)))


def recompute() -> pd.DataFrame:
    forecast_path = Path("artifacts") / "reports" / "forecast_metrics.csv"
    forecasts_dir = Path("artifacts") / "forecasts"
    if not forecast_path.exists():
        raise FileNotFoundError(f"Missing metrics file: {forecast_path}")
    df = pd.read_csv(forecast_path)

    qlike_map: dict[tuple[str, str], float] = {}
    for csv_path in sorted(forecasts_dir.glob("*_forecast.csv")):
        forecast_df = pd.read_csv(csv_path)
        actual = forecast_df["actual_volatility"].astype(float)
        col_map = {
            "HAR": "har_forecast",
            "HAR+Sentiment": "har_sentiment_forecast",
            "XGB": "xgb_forecast",
            "XGB+Sentiment": "xgb_sentiment_forecast",
        }
        ticker = csv_path.stem.replace("_forecast", "")
        for model, col in col_map.items():
            if col not in forecast_df.columns:
                continue
            pred = forecast_df[col].astype(float)
            qlike_map[(ticker, model)] = _qlike(actual, pred)

    df["qlike"] = [qlike_map.get((row.ticker, row.model), row.qlike) for row in df.itertuples(index=False)]
    df.to_csv(forecast_path, index=False)
    return df


if __name__ == "__main__":
    print(recompute().to_string(index=False))
