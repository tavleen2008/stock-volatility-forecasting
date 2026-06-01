"""Checkpoint 1 forecast runner.

Run:
    python -m ml.pipelines.train_pipeline
"""

from pathlib import Path
import logging

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from matplotlib.dates import AutoDateLocator, DateFormatter
from sklearn.preprocessing import StandardScaler

from ml.data.data_config import DataConfig
from ml.data.market_data_loader import compute_realized_variance, compute_realized_volatility, download_market_data
from ml.data.news_data_loader import NewsDataLoader
from ml.evaluation.metrics import metric_summary
from ml.features.feature_builder import FeatureBuilder
from ml.models.har_model import HARModel
from ml.models.xgboost_model import XGBBaseline
from ml.nlp.finbert_sentiment import FinBertSentimentService
import joblib
from pathlib import Path as _Path

logger = logging.getLogger(__name__)


def _set_seed(seed: int) -> None:
    np.random.seed(seed)


def _forecast_plot(y_true: pd.Series, y_pred: pd.Series, output_path: Path, title: str) -> str:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    fig, ax = plt.subplots(figsize=(11, 5))
    # ensure x-axis is datetime
    x_true = pd.to_datetime(y_true.index)
    # y_pred may be a Series or DataFrame of multiple predictions
    ax.plot(x_true, y_true.values, label="Actual volatility", linewidth=2)
    if isinstance(y_pred, pd.DataFrame):
        for col in y_pred.columns:
            ax.plot(pd.to_datetime(y_pred.index), y_pred[col].values, label=col, linewidth=1.5)
    else:
        x_pred = pd.to_datetime(y_pred.index)
        ax.plot(x_pred, y_pred.values, label="Forecast volatility", linewidth=2)

    ax.set_title(title)
    ax.set_xlabel("Date")
    ax.set_ylabel("Realized volatility")

    # format x-axis for dates
    locator = AutoDateLocator()
    formatter = DateFormatter("%Y-%m-%d")
    ax.xaxis.set_major_locator(locator)
    ax.xaxis.set_major_formatter(formatter)
    fig.autofmt_xdate(rotation=30)
    ax.legend()
    fig.tight_layout()
    fig.savefig(output_path, dpi=160)
    plt.close(fig)
    return str(output_path)


def _daily_sentiment(news_df: pd.DataFrame, sentiment_service: FinBertSentimentService) -> pd.DataFrame:
    enriched = sentiment_service.enrich_news_frame(news_df)
    return sentiment_service.aggregate_daily_sentiment_frame(enriched)


def main() -> None:
    """Run the checkpoint 1 forecasting demo."""

    config = DataConfig()
    _set_seed(config.random_seed)

    feature_builder = FeatureBuilder()
    sentiment_service = FinBertSentimentService(model_name=config.finbert_model_name)
    news_loader = NewsDataLoader(config.news_api_key)

    report_rows: list[dict[str, float | str]] = []

    for ticker in config.tickers:
        market_df = download_market_data(ticker, str(config.start_date), str(config.end_date), interval="1d")
        if market_df.empty:
            logger.warning("Skipping ticker with no market data", extra={"ticker": ticker})
            continue

        market_df["realized_variance"] = compute_realized_variance(market_df)
        market_df["realized_volatility"] = compute_realized_volatility(market_df["realized_variance"])

        # Prefer DB-derived daily sentiment if available (produced by run_db_news_pipeline.py)
        db_daily_path = Path("outputs") / "data" / "daily_sentiment_features.csv"
        if db_daily_path.exists():
            try:
                sentiment_daily = pd.read_csv(db_daily_path)
                sentiment_daily["date"] = pd.to_datetime(sentiment_daily["date"]).dt.floor("D")
                logger.info("Loaded daily sentiment from DB-derived CSV", extra={"path": str(db_daily_path), "ticker": ticker})
            except Exception:
                logger.exception("Failed to read DB-derived daily sentiment CSV; falling back to NewsAPI", extra={"path": str(db_daily_path)})
                try:
                    news_df = news_loader.fetch_news(ticker, str(config.start_date), str(config.end_date))
                except Exception:
                    news_df = pd.DataFrame(columns=["headline", "snippet", "ticker", "source", "timestamp", "url"])
                sentiment_daily = _daily_sentiment(news_df, sentiment_service)
        else:
            try:
                news_df = news_loader.fetch_news(ticker, str(config.start_date), str(config.end_date))
            except Exception:
                news_df = pd.DataFrame(columns=["headline", "snippet", "ticker", "source", "timestamp", "url"])
            sentiment_daily = _daily_sentiment(news_df, sentiment_service)
        features = feature_builder.build_features(
            market_df=market_df,
            sentiment_daily_df=sentiment_daily,
            forecast_horizon=config.forecast_horizon,
        )
        if features.empty:
            logger.warning("Skipping ticker with no usable features", extra={"ticker": ticker})
            continue

        train, val, test = feature_builder.train_validation_test_split(features)
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

        base_model = HARModel(use_sentiment=False, estimator="linear", feature_columns=base_features)
        sentiment_model = HARModel(use_sentiment=True, estimator="ridge", ridge_alpha=1.0, feature_columns=base_features + sentiment_features)

        x_train_base = train[base_features]
        x_test_base = test[base_features]
        x_train_sent = train[base_features + sentiment_features]
        x_test_sent = test[base_features + sentiment_features]

        # Scale numeric features (fit on train only)
        base_scaler = StandardScaler()
        x_train_base_scaled = pd.DataFrame(base_scaler.fit_transform(x_train_base), columns=base_features, index=x_train_base.index)
        x_test_base_scaled = pd.DataFrame(base_scaler.transform(x_test_base), columns=base_features, index=x_test_base.index)

        sent_scaler = StandardScaler()
        # If sentiment is missing/constant and synthetic_sentiment is enabled, inject small noise for testing
        sent_cols = [c for c in x_train_sent.columns if c.startswith("mean_sentiment") or c in [
            "std_sentiment",
            "positive_count",
            "negative_count",
            "neutral_count",
            "rolling_sentiment_mean",
            "rolling_sentiment_std",
            "sentiment_shock",
        ]]
        # quick check for constant columns
        try:
            sent_var = x_train_sent[sent_cols].var(numeric_only=True)
        except Exception:
            sent_var = pd.Series([0.0] * len(sent_cols), index=sent_cols)

        if (sent_var.fillna(0.0) <= 1e-12).all() and config.synthetic_sentiment:
            # inject tiny random noise centered at 0 for testing
            rng = np.random.RandomState(config.random_seed)
            for col in sent_cols:
                x_train_sent[col] = rng.normal(loc=0.0, scale=0.01, size=len(x_train_sent))
                x_test_sent[col] = rng.normal(loc=0.0, scale=0.01, size=len(x_test_sent))

        x_train_sent_scaled = pd.DataFrame(sent_scaler.fit_transform(x_train_sent), columns=x_train_sent.columns, index=x_train_sent.index)
        x_test_sent_scaled = pd.DataFrame(sent_scaler.transform(x_test_sent), columns=x_test_sent.columns, index=x_test_sent.index)

        y_train = train[target_col]
        y_test = test[target_col]

        base_model.fit(x_train_base_scaled, y_train)

        # Guard: if sentiment columns are constant (no news or all zeros), skip sentiment training
        sent_cols = [c for c in x_train_sent.columns if c.startswith("mean_sentiment") or c in [
            "std_sentiment",
            "positive_count",
            "negative_count",
            "neutral_count",
            "rolling_sentiment_mean",
            "rolling_sentiment_std",
            "sentiment_shock",
        ]]
        # Track whether HAR+Sentiment model was actually trained/used
        har_sent_trained = False
        try:
            sent_var = x_train_sent[sent_cols].var(numeric_only=True)
            if sent_var.isnull().all() or (sent_var.fillna(0.0) <= 1e-12).all():
                logger.info("Sentiment features constant or missing; skipping sentiment model", extra={"ticker": ticker})
                # Use the base model predictions on the properly scaled base features
                sentiment_pred = base_model.predict(x_test_base_scaled).reindex(y_test.index)
                har_sent_trained = False
            else:
                sentiment_model.fit(x_train_sent_scaled, y_train)
                sentiment_pred = sentiment_model.predict(x_test_sent_scaled).reindex(y_test.index)
                har_sent_trained = True
        except Exception:
            # on any unexpected error, fallback to base predictions
            logger.exception("Sentiment model training failed; falling back to base model predictions", extra={"ticker": ticker})
            sentiment_pred = base_model.predict(x_test_base_scaled).reindex(y_test.index)
            har_sent_trained = False

        base_pred = base_model.predict(x_test_base_scaled).reindex(y_test.index)

        base_metrics = metric_summary(y_test[base_pred.notna()], base_pred.dropna())
        sentiment_metrics = metric_summary(y_test[sentiment_pred.notna()], sentiment_pred.dropna())

        # --- Log-variance HAR model: predict log(realized_variance), back-transform to volatility
        eps = 1e-12
        ann = 252
        # prepare log features (using variance-domain rv_* which are in realized_variance units)
        log_vars = ["rv_var_t", "rv_var_t_minus1", "rv_var_daily", "rv_var_weekly", "rv_var_monthly"]
        # x_train_base contains volatility-domain features; extract variance-domain columns from original train/test
        x_train_log = np.log(train[log_vars].clip(lower=eps))
        x_test_log = np.log(test[log_vars].clip(lower=eps))
        y_train_log = np.log(train["future_realized_variance"].clip(lower=eps))

        log_model = HARModel(use_sentiment=False, estimator="linear", feature_columns=log_vars, clip_predictions=False)
        log_model.fit(x_train_log, y_train_log)
        pred_log = log_model.predict(x_test_log)
        # back-transform: variance = exp(pred_log), volatility = sqrt(variance * ann)
        pred_var = np.exp(pred_log.clip(lower=np.log(eps)))
        pred_vol_from_log = pd.Series(np.sqrt(pred_var * ann), index=pred_log.index, name="har_log_forecast")

        log_metrics = metric_summary(y_test[pred_vol_from_log.notna()], pred_vol_from_log.dropna())

        # --- Boosted-tree baseline (XGBoost if installed; sklearn fallback)
        # Train on the same scaled base features; also train a boosted model with sentiment when available
        # --- Use tuned XGBoost model if available, else train a fresh baseline
        xgb_model = XGBBaseline()
        best_model_path = _Path("artifacts") / "models" / f"{ticker}_xgb_best.joblib"
        if best_model_path.exists():
            try:
                loaded = joblib.load(best_model_path)
                # Attempt to predict using raw base features (the saved pipeline contains its own scaler)
                try:
                    xgb_pred = pd.Series(loaded.predict(x_test_base), index=y_test.index)
                except Exception:
                    # fallback to scaled features if pipeline expects scaled input
                    xgb_pred = pd.Series(loaded.predict(x_test_base_scaled), index=y_test.index)
            except Exception:
                logger.exception("Failed loading saved tuned model; training fallback will be used")
                try:
                    xgb_model.fit(x_train_base_scaled, y_train)
                    xgb_pred = xgb_model.predict(x_test_base_scaled).reindex(y_test.index)
                except Exception:
                    logger.exception("XGBoost baseline training failed; skipping")
                    xgb_pred = pd.Series([float('nan')] * len(y_test), index=y_test.index)
        else:
            try:
                xgb_model.fit(x_train_base_scaled, y_train)
                xgb_pred = xgb_model.predict(x_test_base_scaled).reindex(y_test.index)
            except Exception:
                logger.exception("XGBoost baseline training failed; skipping")
                xgb_pred = pd.Series([float('nan')] * len(y_test), index=y_test.index)

        # XGBoost with sentiment when available
        # For sentiment-enabled boosted model, try loading a sentiment-specific tuned model
        sent_model_path = _Path("artifacts") / "models" / f"{ticker}_xgb_best_sent.joblib"
        # Track whether XGB+Sentiment model was actually trained/used
        xgb_sent_trained = False
        if sent_model_path.exists():
            try:
                loaded_sent = joblib.load(sent_model_path)
                try:
                    xgb_sent_pred = pd.Series(loaded_sent.predict(x_test_sent), index=y_test.index)
                except Exception:
                    xgb_sent_pred = pd.Series(loaded_sent.predict(x_test_sent_scaled), index=y_test.index)
                xgb_sent_trained = True
            except Exception:
                logger.exception("Failed loading saved tuned sentiment model; training fallback will be used")
                if x_train_sent_scaled.shape[1] > x_train_base_scaled.shape[1]:
                    try:
                        xgb_sent_model = XGBBaseline()
                        xgb_sent_model.fit(x_train_sent_scaled, y_train)
                        xgb_sent_pred = xgb_sent_model.predict(x_test_sent_scaled).reindex(y_test.index)
                        xgb_sent_trained = True
                    except Exception:
                        logger.exception("XGBoost+Sent baseline training failed; skipping")
                        xgb_sent_pred = xgb_pred.copy()
                        xgb_sent_trained = False
                else:
                    xgb_sent_pred = xgb_pred.copy()
                    xgb_sent_trained = False
        else:
            if x_train_sent_scaled.shape[1] > x_train_base_scaled.shape[1]:
                xgb_sent_model = XGBBaseline()
                try:
                    xgb_sent_model.fit(x_train_sent_scaled, y_train)
                    xgb_sent_pred = xgb_sent_model.predict(x_test_sent_scaled).reindex(y_test.index)
                    xgb_sent_trained = True
                except Exception:
                    logger.exception("XGBoost+Sent baseline training failed; skipping")
                    xgb_sent_pred = xgb_pred.copy()
                    xgb_sent_trained = False
            else:
                xgb_sent_pred = xgb_pred.copy()
                xgb_sent_trained = False

        xgb_metrics = metric_summary(y_test[xgb_pred.notna()], xgb_pred.dropna())
        xgb_sent_metrics = metric_summary(y_test[xgb_sent_pred.notna()], xgb_sent_pred.dropna())

        base_pred = base_pred.clip(lower=0.0)
        sentiment_pred = sentiment_pred.clip(lower=0.0)
        pred_vol_from_log = pred_vol_from_log.clip(lower=0.0)
        xgb_pred = xgb_pred.clip(lower=0.0)
        xgb_sent_pred = xgb_sent_pred.clip(lower=0.0)

        base_metrics = metric_summary(y_test[base_pred.notna()], base_pred.dropna())
        sentiment_metrics = metric_summary(y_test[sentiment_pred.notna()], sentiment_pred.dropna())
        log_metrics = metric_summary(y_test[pred_vol_from_log.notna()], pred_vol_from_log.dropna())
        xgb_metrics = metric_summary(y_test[xgb_pred.notna()], xgb_pred.dropna())
        xgb_sent_metrics = metric_summary(y_test[xgb_sent_pred.notna()], xgb_sent_pred.dropna())

        forecast_dir = Path("artifacts") / "forecasts"
        plot_dir = Path("artifacts") / "plots"
        report_dir = Path("artifacts") / "reports"
        forecast_dir.mkdir(parents=True, exist_ok=True)
        plot_dir.mkdir(parents=True, exist_ok=True)
        report_dir.mkdir(parents=True, exist_ok=True)

        forecast_frame = pd.DataFrame(
            {
                # export the actual datetime index from the test split
                "date": test["date"].astype(str),
                "actual_volatility": y_test.values,
                "har_forecast": base_pred.values,
                "har_sentiment_forecast": sentiment_pred.values,
                "har_log_forecast": pred_vol_from_log.reindex(y_test.index).values,
                "xgb_forecast": xgb_pred.reindex(y_test.index).values,
                "xgb_sentiment_forecast": xgb_sent_pred.reindex(y_test.index).values,
                # flags showing whether sentiment-enabled models were actually trained/used
                "har_sentiment_trained": har_sent_trained,
                "xgb_sentiment_trained": xgb_sent_trained,
            }
        )
        forecast_csv = forecast_dir / f"{ticker}_forecast.csv"
        forecast_frame.to_csv(forecast_csv, index=False)

        plot_path = plot_dir / f"{ticker}_forecast.png"
        # use test['date'] as x-axis for plotting
        x_axis = pd.to_datetime(test["date"]).values
        # build a DataFrame of predictions for plotting convenience
        # Exclude `har_log_forecast` from plotted series per checkpoint request
        preds_df = pd.DataFrame({
            "har_forecast": base_pred.values,
            "har_sentiment_forecast": sentiment_pred.values,
            "xgb_forecast": xgb_pred.reindex(y_test.index).values,
            "xgb_sentiment_forecast": xgb_sent_pred.reindex(y_test.index).values,
        }, index=x_axis)
        _forecast_plot(pd.Series(y_test.values, index=x_axis), preds_df, plot_path, f"{ticker} realized vs forecast volatility")

        report_rows.append({"ticker": ticker, "model": "HAR", "sentiment_trained": False, **base_metrics})
        report_rows.append({"ticker": ticker, "model": "HAR+Sentiment", "sentiment_trained": har_sent_trained, **sentiment_metrics})
        report_rows.append({"ticker": ticker, "model": "XGB", "sentiment_trained": False, **xgb_metrics})
        report_rows.append({"ticker": ticker, "model": "XGB+Sentiment", "sentiment_trained": xgb_sent_trained, **xgb_sent_metrics})

        logger.info("Forecast completed", extra={"ticker": ticker, "forecast_csv": str(forecast_csv), "plot": str(plot_path)})

    report = pd.DataFrame(report_rows)
    if not report.empty:
        report.to_csv(Path("artifacts") / "reports" / "forecast_metrics.csv", index=False)
        print(report.sort_values(["ticker", "model"]).to_string(index=False))
    else:
        print("No forecasts were produced. Check your data window and API access.")


if __name__ == "__main__":
    main()
