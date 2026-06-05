"""Training pipeline that uses the FNSPID dataset for news sentiment.

This script mirrors the original `train_pipeline.py` but replaces the NewsAPI
fetcher with an offline Hugging‑Face FNSPID loader. It trains two HAR models per
ticker (base and sentiment‑augmented) and persists them under
`artifacts/models/<ticker>/`.

Usage:
    python -m ml.pipelines.train_pipeline_fnspid

Environment variables:
    USE_FNSPID=true    – Enables the FNSPID data source (default is False).
    SYNTHETIC_SENTIMENT=true – Keep existing synthetic fallback behavior.
"""

import logging
import os
from pathlib import Path
try:
    import numpy as np
    import pandas as pd
    from sklearn.preprocessing import StandardScaler
    import joblib
except Exception as e:
    raise ImportError(f"Core library import failed: {e}")

from ml.data.data_config import DataConfig
from ml.data.market_data_loader import (
    compute_realized_variance,
    compute_realized_volatility,
    download_market_data,
)
from ml.data.fnspid_data_loader import load_fnspid
from ml.features.feature_builder import FeatureBuilder
from ml.models.har_model import HARModel
from ml.evaluation.metrics import metric_summary

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)
logger.debug("Logger initialized for train_pipeline_fnspid")


def _set_seed(seed: int) -> None:
    np.random.seed(seed)


def _forecast_plot(y_true: pd.Series, y_pred: pd.DataFrame, output_path: Path, title: str) -> str:
    """Create a line plot of actual vs. forecasts and save to ``output_path``.
    ``y_pred`` must contain columns ``har_forecast`` and ``har_sentiment_forecast``.
    """
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    from matplotlib.dates import AutoDateLocator, DateFormatter

    output_path.parent.mkdir(parents=True, exist_ok=True)
    fig, ax = plt.subplots(figsize=(11, 5))
    x_true = pd.to_datetime(y_true.index)
    ax.plot(x_true, y_true.values, label="Actual volatility", linewidth=2)
    for col in y_pred.columns:
        ax.plot(pd.to_datetime(y_pred.index), y_pred[col].values, label=col, linewidth=1.5)
    ax.set_title(title)
    ax.set_xlabel("Date")
    ax.set_ylabel("Realized volatility")
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


def _daily_sentiment_from_fnspid(df: pd.DataFrame) -> pd.DataFrame:
    """Derive daily sentiment from a FNSPID slice.
    The dataset may already contain a sentiment column. We look for the first
    column whose name includes the substring ``sentiment`` (case‑insensitive).
    If found, we aggregate it daily (mean). If not, we return an empty DataFrame
    so the downstream pipeline can decide whether to fallback to synthetic
    sentiment.
    """
    sentiment_cols = [c for c in df.columns if "sentiment" in c.lower()]
    if not sentiment_cols:
        logger.info("FNSPID record has no sentiment column; will rely on synthetic fallback if enabled.")
        return pd.DataFrame(columns=["date", "mean_sentiment"])
    # Use the first matching column
    col = sentiment_cols[0]
    df["date"] = pd.to_datetime(df["timestamp"]).dt.floor("D")
    daily = (
        df.groupby("date")[col]
        .mean()
        .reset_index()
        .rename(columns={col: "mean_sentiment"})
    )
    return daily


def main() -> None:
    """Run the training pipeline for the latest three‑year window.
    The pipeline iterates over all tickers defined in ``DataConfig`` and:
    * loads market data,
    * loads news either from FNSPID (if ``USE_FNSPID``) or from NewsAPI,
    * builds features,
    * trains a base HAR model and an optional HAR‑sentiment model,
    * persists the models per ticker, and
    * generates forecast CSVs and plots.
    """
    config = DataConfig()
    # Ensure synthetic sentiment fallback is enabled when requested
    if not config.synthetic_sentiment:
        os.environ["SYNTHETIC_SENTIMENT"] = "true"
        config = DataConfig()
    _set_seed(config.random_seed)

    # Override dates to use the most recent 3‑year window
    end_date = pd.to_datetime(str(config.end_date))
    start_date = end_date - pd.DateOffset(years=3)
    logger.info(
        "Using 3‑year training window",
        extra={"start_date": str(start_date.date()), "end_date": str(end_date.date())},
    )

    feature_builder = FeatureBuilder()
    

    report_rows: list[dict] = []

    for ticker in config.tickers:
        # ------------------- Market data -------------------
        market_df = download_market_data(
            ticker, str(start_date.date()), str(end_date.date()), interval="1d"
        )
        logger.debug(f"Ticker {ticker}: market data rows={len(market_df)}")
        if market_df.empty:
            logger.warning("Skipping ticker with no market data", extra={"ticker": ticker})
            continue
        market_df["realized_variance"] = compute_realized_variance(market_df)
        market_df["realized_volatility"] = compute_realized_volatility(
            market_df["realized_variance"]
        )

        # ------------------- News / Sentiment -------------------
        news_df = load_fnspid(ticker, str(start_date.date()), str(end_date.date()))
        logger.debug(f"FNSPID loaded rows={len(news_df)} for ticker {ticker}")

        # If the dataset already provides a sentiment column, use it directly.
        sentiment_daily = _daily_sentiment_from_fnspid(news_df)
        logger.debug(f"Ticker {ticker}: sentiment_daily rows={len(sentiment_daily)} (empty={sentiment_daily.empty})")
        if sentiment_daily.empty:
            # No sentiment column in FNSPID data; create empty sentiment dataframe
            logger.debug("FNSPID dataset has no sentiment column; using empty sentiment dataframe")
            sentiment_daily = pd.DataFrame(columns=["date", "mean_sentiment"])

        # ------------------- Feature building -------------------
        features = feature_builder.build_features(
            market_df=market_df,
            sentiment_daily_df=sentiment_daily,
            forecast_horizon=config.forecast_horizon,
        )
        logger.debug(f"Ticker {ticker}: built features shape={features.shape}, columns={features.columns.tolist()}")
        if features.empty:
            logger.warning("Skipping ticker with no usable features", extra={"ticker": ticker})
            continue
        # Remove duplicate columns, just in case.
        if features.columns.duplicated().any():
            dup = features.columns[features.columns.duplicated(keep=False)].tolist()
            logger.warning(
                "Duplicate feature columns detected and removed",
                extra={"ticker": ticker, "cols": dup},
            )
            features = features.loc[:, ~features.columns.duplicated()]

        train, val, test = feature_builder.train_validation_test_split(features)
        target_col = "future_realized_volatility"

        # ------------------- Feature sets -------------------
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
        all_sent_cols = base_features + sentiment_features

        # Build dedicated DataFrames to avoid pandas CoW surprises.
        x_train_base = pd.DataFrame({c: train[c].values for c in base_features}, index=train.index)
        x_test_base = pd.DataFrame({c: test[c].values for c in base_features}, index=test.index)
        x_train_sent = pd.DataFrame({c: train[c].values for c in all_sent_cols}, index=train.index)
        x_test_sent = pd.DataFrame({c: test[c].values for c in all_sent_cols}, index=test.index)

        # ------------------- Scaling -------------------
        base_scaler = StandardScaler()
        x_train_base_scaled = pd.DataFrame(
            base_scaler.fit_transform(x_train_base), columns=base_features, index=x_train_base.index
        )
        x_test_base_scaled = pd.DataFrame(
            base_scaler.transform(x_test_base), columns=base_features, index=x_test_base.index
        )
        sent_scaler = StandardScaler()
        x_train_sent_scaled = pd.DataFrame(
            sent_scaler.fit_transform(x_train_sent), columns=all_sent_cols, index=x_train_sent.index
        )
        x_test_sent_scaled = pd.DataFrame(
            sent_scaler.transform(x_test_sent), columns=all_sent_cols, index=x_test_sent.index
        )

        y_train = train[target_col]
        y_test = test[target_col]

        # ------------------- Model training -------------------
        base_model = HARModel(use_sentiment=False, estimator="linear", feature_columns=base_features)
        sentiment_model = HARModel(
            use_sentiment=True, estimator="ridge", ridge_alpha=1.0, feature_columns=base_features
        )
        logger.debug(f"Ticker {ticker}: Initialized HAR base and sentiment models")

        # Train base model
        base_model.fit(x_train_base_scaled, y_train)
        logger.debug(f"Ticker {ticker}: Base HAR model trained")

        # Determine if sentiment columns are constant / missing
        sent_cols = [c for c in x_train_sent.columns if c.startswith("mean_sentiment") or c in sentiment_features]
        har_sent_trained = False
        try:
            sent_var = x_train_sent[sent_cols].var(numeric_only=True)
            if sent_var.isnull().all() or (sent_var.fillna(0.0) <= 1e-12).all() and config.synthetic_sentiment:
                # Synthetic fallback – inject tiny noise so scaler / ridge can fit.
                rng = np.random.RandomState(config.random_seed)
                for col in sent_cols:
                    x_train_sent[col] = rng.normal(loc=0.0, scale=0.01, size=len(x_train_sent))
                    x_test_sent[col] = rng.normal(loc=0.0, scale=0.01, size=len(x_test_sent))
                # Re‑scale after injection
                x_train_sent_scaled = pd.DataFrame(
                    sent_scaler.fit_transform(x_train_sent), columns=all_sent_cols, index=x_train_sent.index
                )
                x_test_sent_scaled = pd.DataFrame(
                    sent_scaler.transform(x_test_sent), columns=all_sent_cols, index=x_test_sent.index
                )
                sentiment_model.fit(x_train_sent_scaled, y_train)
                har_sent_trained = True
            else:
                sentiment_model.fit(x_train_sent_scaled, y_train)
                har_sent_trained = True
        except Exception:
            logger.exception("Sentiment model training failed; falling back to base predictions", extra={"ticker": ticker})
            har_sent_trained = False

        # ------------------- Predictions -------------------
        base_pred = base_model.predict(x_test_base_scaled).reindex(y_test.index)
        if har_sent_trained:
            sentiment_pred = sentiment_model.predict(x_test_sent_scaled).reindex(y_test.index)
            logger.debug(f"Ticker {ticker}: Sentiment HAR model predicted")
        else:
            sentiment_pred = base_pred.copy()
            logger.debug(f"Ticker {ticker}: Sentiment model not trained, using base predictions")

        # Clip negative forecasts
        base_pred = base_pred.clip(lower=0.0)
        sentiment_pred = sentiment_pred.clip(lower=0.0)

        # ------------------- Persistence -------------------
        models_dir = Path("artifacts") / "models" / ticker
        models_dir.mkdir(parents=True, exist_ok=True)
        base_model.save(models_dir / "har_model.joblib")
        joblib.dump(base_scaler, models_dir / "har_scaler.joblib")
        logger.info("Saved base HAR model", extra={"ticker": ticker})
        if har_sent_trained:
            sentiment_model.save(models_dir / "har_sentiment_model.joblib")
            joblib.dump(sent_scaler, models_dir / "har_sentiment_scaler.joblib")
            logger.info("Saved HAR+Sentiment model", extra={"ticker": ticker})
        else:
            logger.warning(
                "HAR+Sentiment model not trained for ticker; no file saved",
                extra={"ticker": ticker},
            )
            logger.debug(f"Ticker {ticker}: Model persistence completed")

        # ------------------- Evaluation -------------------
        base_metrics = metric_summary(y_test[base_pred.notna()], base_pred.dropna())
        sentiment_metrics = metric_summary(
            y_test[sentiment_pred.notna()], sentiment_pred.dropna()
        )

        # ------------------- Reporting & Plotting -------------------
        forecast_dir = Path("artifacts") / "forecasts"
        plot_dir = Path("artifacts") / "plots"
        report_dir = Path("artifacts") / "reports"
        forecast_dir.mkdir(parents=True, exist_ok=True)
        plot_dir.mkdir(parents=True, exist_ok=True)
        report_dir.mkdir(parents=True, exist_ok=True)

        forecast_frame = pd.DataFrame(
            {
                "date": test["date"].astype(str),
                "actual_volatility": y_test.values,
                "har_forecast": base_pred.values,
                "har_sentiment_forecast": sentiment_pred.values,
                "har_sentiment_trained": har_sent_trained,
            }
        )
        forecast_csv = forecast_dir / f"{ticker}_forecast.csv"
        forecast_frame.to_csv(forecast_csv, index=False)

        # Plot only the two HAR forecasts
        preds_df = pd.DataFrame(
            {
                "har_forecast": base_pred.values,
                "har_sentiment_forecast": sentiment_pred.values,
            },
            index=pd.to_datetime(test["date"]).values,
        )
        plot_path = plot_dir / f"{ticker}_forecast.png"
        _forecast_plot(
            pd.Series(y_test.values, index=pd.to_datetime(test["date"]).values),
            preds_df,
            plot_path,
            f"{ticker} realized vs forecast volatility",
        )

        report_rows.append({"ticker": ticker, "model": "HAR", "sentiment_trained": False, **base_metrics})
        report_rows.append({"ticker": ticker, "model": "HAR+Sentiment", "sentiment_trained": har_sent_trained, **sentiment_metrics})

        logger.info(
            "Forecast completed",
            extra={"ticker": ticker, "forecast_csv": str(forecast_csv), "plot": str(plot_path)},
        )

    # ------------------- Global report -------------------
    report = pd.DataFrame(report_rows)
    if not report.empty:
        report_path = Path("artifacts") / "reports" / "forecast_metrics.csv"
        report.to_csv(report_path, index=False)
        print(report.sort_values(["ticker", "model"]).to_string(index=False))
    else:
        print("No forecasts were produced. Check your data window and API access.")


if __name__ == "__main__":
    main()
