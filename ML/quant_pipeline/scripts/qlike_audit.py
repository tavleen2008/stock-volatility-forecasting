from __future__ import annotations

from pathlib import Path
import sys
import pandas as pd
import numpy as np


ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))


def _fmt(v: float) -> str:
    return f"{v:.10g}"


def _qlike(actual: pd.Series, pred: pd.Series, eps: float = 1e-6) -> float:
    actual_clipped = actual.clip(lower=eps)
    pred_clipped = pred.clip(lower=eps)
    return float(np.mean(np.log(pred_clipped) + (actual_clipped / pred_clipped)))


def audit() -> str:
    forecast_dir = Path("artifacts") / "forecasts"
    report_lines: list[str] = ["# QLIKE Debug Report", ""]

    if not forecast_dir.exists():
        report_lines.append(f"Forecast directory not found: {forecast_dir}")
        return "\n".join(report_lines)

    files = sorted(forecast_dir.glob("*_forecast.csv"))
    if not files:
        report_lines.append("No forecast CSV files found.")
        return "\n".join(report_lines)

    for path in files:
        df = pd.read_csv(path)
        report_lines.append(f"## {path.name}")
        if "actual_volatility" not in df.columns:
            report_lines.append("Missing actual_volatility column.")
            continue

        model_cols = [
            "har_forecast",
            "har_sentiment_forecast",
            "har_log_forecast",
            "xgb_forecast",
            "xgb_sentiment_forecast",
        ]

        actual = df["actual_volatility"].astype(float)
        report_lines.append(f"- min(actual): {_fmt(actual.min())}")
        report_lines.append(f"- max(actual): {_fmt(actual.max())}")

        for col in model_cols:
            if col not in df.columns:
                continue
            pred = df[col].astype(float)
            clipped = pred.clip(lower=1e-6)
            report_lines.append(f"### {col}")
            report_lines.append(f"- min(prediction): {_fmt(pred.min())}")
            report_lines.append(f"- max(prediction): {_fmt(pred.max())}")
            report_lines.append(f"- min(clipped_prediction): {_fmt(clipped.min())}")
            report_lines.append(f"- max(clipped_prediction): {_fmt(clipped.max())}")
            report_lines.append(f"- strictly_positive_before_clip: {bool((pred > 0).all())}")
            report_lines.append(f"- strictly_positive_after_clip: {bool((clipped > 0).all())}")
            report_lines.append(f"- same_scale_as_actual: {bool((actual.min() > 0 and actual.max() < 10 and clipped.min() > 0 and clipped.max() < 10))}")
            try:
                ql_clipped = _qlike(actual, pred)
                report_lines.append(f"- qlike_clipped: {_fmt(ql_clipped)}")
            except Exception as exc:
                report_lines.append(f"- qlike_error: {exc}")

        report_lines.append("")

    out_path = Path("outputs") / "reports" / "qlike_debug_report.md"
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text("\n".join(report_lines), encoding="utf-8")
    return str(out_path)


if __name__ == "__main__":
    print(audit())
