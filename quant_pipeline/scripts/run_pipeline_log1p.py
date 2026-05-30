"""Run training/forecasting with `log1p(realized_volatility)` as the target.

This script trains the same model set as the main pipeline but fits models on
`y = log1p(future_realized_volatility)` and back-transforms predictions with
`expm1`. Outputs are written to artifacts/forecasts/*_forecast_log1p.csv,
artifacts/plots/*_forecast_log1p.png and artifacts/reports/forecast_metrics_log1p.csv.
"""
from pathlib import Path
import logging
import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler

from ml.data.data_config import DataConfig
from ml.data.market_data_loader import compute_realized_variance, compute_realized_volatility, download_market_data
from ml.features.feature_builder import FeatureBuilder
from ml.models.har_model import HARModel
from ml.models.xgboost_model import XGBBaseline
from ml.evaluation.metrics import metric_summary

logger = logging.getLogger(__name__)


def run_log1p_pipeline():
    config = DataConfig()
    fb = FeatureBuilder()

    report_rows = []

    for ticker in config.tickers:
        market_df = download_market_data(ticker, str(config.start_date), str(config.end_date), interval="1d")
        if market_df.empty:
            logger.warning("No market data", extra={"ticker": ticker})
            continue

        market_df["realized_variance"] = compute_realized_variance(market_df)
        market_df["realized_volatility"] = compute_realized_volatility(market_df["realized_variance"])

        # empty sentiment frame with expected columns
        sent_cols = [
            "date",
            "mean_sentiment",
            "std_sentiment",
            "positive_count",
            "negative_count",
            "neutral_count",
            "rolling_sentiment_mean",
            "rolling_sentiment_std",
            "sentiment_shock",
        ]
        sentiment = pd.DataFrame(columns=sent_cols)

        features = fb.build_features(market_df, sentiment, config.forecast_horizon)
        if features.empty:
            logger.warning("No features built", extra={"ticker": ticker})
            continue

        train, val, test = fb.train_validation_test_split(features)

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

        # scalers fit on train only
        base_scaler = StandardScaler()
        x_train_base = train[base_features]
        x_test_base = test[base_features]
        x_train_base_scaled = pd.DataFrame(base_scaler.fit_transform(x_train_base), columns=base_features, index=x_train_base.index)
        x_test_base_scaled = pd.DataFrame(base_scaler.transform(x_test_base), columns=base_features, index=x_test_base.index)

        sent_scaler = StandardScaler()
        x_train_sent = train[base_features + sentiment_features]
        x_test_sent = test[base_features + sentiment_features]
        x_train_sent_scaled = pd.DataFrame(sent_scaler.fit_transform(x_train_sent), columns=x_train_sent.columns, index=x_train_sent.index)
        x_test_sent_scaled = pd.DataFrame(sent_scaler.transform(x_test_sent), columns=x_test_sent.columns, index=x_test_sent.index)

        # prepare log1p target
        eps = 1e-12
        y_train_raw = train[target_col].clip(lower=0.0)
        y_test_raw = test[target_col].clip(lower=0.0)
        y_train = np.log1p(y_train_raw)

        # --- HAR (linear) trained on log1p target
        har = HARModel(use_sentiment=False, estimator="linear", feature_columns=base_features)
        har.fit(x_train_base_scaled, y_train)
        pred_log = har.predict(x_test_base_scaled)
        # back-transform
        pred_vol = pd.Series(np.expm1(pred_log.clip(lower=np.log1p(eps))), index=pred_log.index)
        pred_vol = pred_vol.clip(lower=0.0)
        har_metrics = metric_summary(y_test_raw, pred_vol)

        # --- HAR + Sentiment
        # decide whether to use sentiment (here sentiment frame empty, so fallback to base predictions)
        sent_model = HARModel(use_sentiment=True, estimator="ridge", ridge_alpha=1.0, feature_columns=base_features + sentiment_features)
        try:
            sent_var = x_train_sent[sentiment_features].var(numeric_only=True)
            if sent_var.isnull().all() or (sent_var.fillna(0.0) <= 1e-12).all():
                sent_pred_vol = pred_vol.copy()
            else:
                sent_model.fit(x_train_sent_scaled, y_train)
                sent_log = sent_model.predict(x_test_sent_scaled)
                sent_pred_vol = pd.Series(np.expm1(sent_log.clip(lower=np.log1p(eps))), index=sent_log.index).clip(lower=0.0)
        except Exception:
            sent_pred_vol = pred_vol.copy()
        sent_metrics = metric_summary(y_test_raw, sent_pred_vol)

        # --- HAR Log (existing log-variance HAR trained on log-realized-variance)
        ann = 252
        log_vars = ["rv_var_t", "rv_var_t_minus1", "rv_var_daily", "rv_var_weekly", "rv_var_monthly"]
        x_train_log = np.log(train[log_vars].clip(lower=eps))
        x_test_log = np.log(test[log_vars].clip(lower=eps))
        y_train_var_log = np.log(train["future_realized_variance"].clip(lower=eps))
        log_model = HARModel(use_sentiment=False, estimator="linear", feature_columns=log_vars)
        log_model.fit(x_train_log, y_train_var_log)
        pred_logvar = log_model.predict(x_test_log)
        pred_var = np.exp(pred_logvar.clip(lower=np.log(eps)))
        pred_vol_from_log = pd.Series(np.sqrt(pred_var * ann), index=pred_var.index).clip(lower=0.0)
        log_metrics = metric_summary(y_test_raw, pred_vol_from_log)

        # --- XGBoost baseline on log1p target
        xgb = XGBBaseline()
        try:
            xgb.fit(x_train_base_scaled, y_train)
            xgb_log = xgb.predict(x_test_base_scaled)
            xgb_pred_vol = pd.Series(np.expm1(xgb_log.clip(lower=np.log1p(eps))), index=xgb_log.index).clip(lower=0.0)
            xgb_metrics = metric_summary(y_test_raw, xgb_pred_vol)
        except Exception:
            xgb_pred_vol = pd.Series([float('nan')] * len(y_test_raw), index=x_test_base_scaled.index)
            xgb_metrics = {"rmse": float('nan'), "mae": float('nan'), "mape": float('nan'), "r2": float('nan'), "directional_accuracy": float('nan'), "qlike": float('nan')}

        # XGB + sentiment (fallback to xgb_pred_vol)
        try:
            if x_train_sent_scaled.shape[1] > x_train_base_scaled.shape[1]:
                xgb_sent = XGBBaseline()
                xgb_sent.fit(x_train_sent_scaled, y_train)
                xgb_sent_log = xgb_sent.predict(x_test_sent_scaled)
                xgb_sent_vol = pd.Series(np.expm1(xgb_sent_log.clip(lower=np.log1p(eps))), index=xgb_sent_log.index).clip(lower=0.0)
            else:
                xgb_sent_vol = xgb_pred_vol.copy()
        except Exception:
            xgb_sent_vol = xgb_pred_vol.copy()
        xgb_sent_metrics = metric_summary(y_test_raw, xgb_sent_vol)

        # write forecasts (log1p suffix)
        forecast_dir = Path("artifacts") / "forecasts"
        plot_dir = Path("artifacts") / "plots"
        report_dir = Path("artifacts") / "reports"
        forecast_dir.mkdir(parents=True, exist_ok=True)
        plot_dir.mkdir(parents=True, exist_ok=True)
        report_dir.mkdir(parents=True, exist_ok=True)

        forecast_frame = pd.DataFrame({
            "date": test["date"].astype(str),
            "actual_volatility": y_test_raw.values,
            "har_forecast_log1p": pred_vol.reindex(y_test_raw.index).values,
            "har_sentiment_forecast_log1p": sent_pred_vol.reindex(y_test_raw.index).values,
            "har_log_forecast": pred_vol_from_log.reindex(y_test_raw.index).values,
            "xgb_forecast_log1p": xgb_pred_vol.reindex(y_test_raw.index).values,
            "xgb_sentiment_forecast_log1p": xgb_sent_vol.reindex(y_test_raw.index).values,
        })
        forecast_csv = forecast_dir / f"{ticker}_forecast_log1p.csv"
        forecast_frame.to_csv(forecast_csv, index=False)

        # plotting: reuse simple plotting from train pipeline
        import matplotlib.pyplot as plt
        from matplotlib.dates import AutoDateLocator, DateFormatter

        x_axis = pd.to_datetime(test["date"]).values
        preds_df = pd.DataFrame({
            "har_log1p": pred_vol.values,
            "har_sent1p": sent_pred_vol.values,
            "har_log_forecast": pred_vol_from_log.values,
            "xgb_log1p": xgb_pred_vol.values,
            "xgb_sent_log1p": xgb_sent_vol.values,
        }, index=x_axis)
        fig, ax = plt.subplots(figsize=(11, 5))
        ax.plot(x_axis, y_test_raw.values, label="Actual volatility", linewidth=2)
        for col in preds_df.columns:
            ax.plot(preds_df.index, preds_df[col].values, label=col, linewidth=1.5)
        ax.set_title(f"{ticker} realized vs forecast volatility (log1p target)")
        ax.set_xlabel("Date")
        ax.set_ylabel("Realized volatility")
        locator = AutoDateLocator()
        formatter = DateFormatter("%Y-%m-%d")
        ax.xaxis.set_major_locator(locator)
        ax.xaxis.set_major_formatter(formatter)
        fig.autofmt_xdate(rotation=30)
        ax.legend()
        fig.tight_layout()
        plot_path = plot_dir / f"{ticker}_forecast_log1p.png"
        fig.savefig(plot_path, dpi=160)
        plt.close(fig)

        # collect report rows using same model labels as original but with _log1p suffix where applicable
        report_rows.append({"ticker": ticker, "model": "HAR_log1p", **har_metrics})
        report_rows.append({"ticker": ticker, "model": "HAR+Sent_log1p", **sent_metrics})
        report_rows.append({"ticker": ticker, "model": "HAR_LogVar", **log_metrics})
        report_rows.append({"ticker": ticker, "model": "XGB_log1p", **xgb_metrics})
        report_rows.append({"ticker": ticker, "model": "XGB+Sent_log1p", **xgb_sent_metrics})

        logger.info("Completed ticker", extra={"ticker": ticker, "forecast_csv": str(forecast_csv), "plot": str(plot_path)})

    report = pd.DataFrame(report_rows)
    if not report.empty:
        report.to_csv(Path("artifacts") / "reports" / "forecast_metrics_log1p.csv", index=False)
        print(report.sort_values(["ticker", "model"]).to_string(index=False))
    else:
        print("No forecasts produced in log1p run")


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    run_log1p_pipeline()
