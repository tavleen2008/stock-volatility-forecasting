"""Checkpoint 1 forecast runner.

Run:
    python -m ml.pipelines.train_pipeline
"""

from pathlib import Path
import logging

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd

from ml.data.data_config import DataConfig
from ml.data.market_data_loader import compute_realized_variance, compute_realized_volatility, download_market_data
from ml.data.news_data_loader import NewsDataLoader
from ml.evaluation.metrics import metric_summary
from ml.features.feature_builder import FeatureBuilder
from ml.models.har_model import HARModel
from ml.nlp.finbert_sentiment import FinBertSentimentService

logger = logging.getLogger(__name__)


def _set_seed(seed: int) -> None:
    np.random.seed(seed)


def _forecast_plot(y_true: pd.Series, y_pred: pd.Series, output_path: Path, title: str) -> str:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    fig, ax = plt.subplots(figsize=(11, 5))
    ax.plot(y_true.index, y_true.values, label="Actual volatility", linewidth=2)
    ax.plot(y_pred.index, y_pred.values, label="Forecast volatility", linewidth=2)
    ax.set_title(title)
    ax.set_xlabel("Date")
    ax.set_ylabel("Realized volatility")
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

        base_model = HARModel(use_sentiment=False, estimator="linear")
        sentiment_model = HARModel(use_sentiment=True, estimator="ridge", ridge_alpha=1.0)

        x_train_base = train[["rv_daily", "rv_weekly", "rv_monthly"]]
        x_test_base = test[["rv_daily", "rv_weekly", "rv_monthly"]]
        x_train_sent = train[[
            "rv_daily",
            "rv_weekly",
            "rv_monthly",
            "mean_sentiment",
            "std_sentiment",
            "positive_count",
            "negative_count",
            "neutral_count",
            "rolling_sentiment_mean",
            "rolling_sentiment_std",
            "sentiment_shock",
        ]]
        x_test_sent = test[[
            "rv_daily",
            "rv_weekly",
            "rv_monthly",
            "mean_sentiment",
            "std_sentiment",
            "positive_count",
            "negative_count",
            "neutral_count",
            "rolling_sentiment_mean",
            "rolling_sentiment_std",
            "sentiment_shock",
        ]]

        y_train = train[target_col]
        y_test = test[target_col]

        base_model.fit(x_train_base, y_train)
        sentiment_model.fit(x_train_sent, y_train)

        base_pred = base_model.predict(x_test_base).reindex(y_test.index)
        sentiment_pred = sentiment_model.predict(x_test_sent).reindex(y_test.index)

        base_metrics = metric_summary(y_test[base_pred.notna()], base_pred.dropna())
        sentiment_metrics = metric_summary(y_test[sentiment_pred.notna()], sentiment_pred.dropna())

        forecast_dir = Path("artifacts") / "forecasts"
        plot_dir = Path("artifacts") / "plots"
        report_dir = Path("artifacts") / "reports"
        forecast_dir.mkdir(parents=True, exist_ok=True)
        plot_dir.mkdir(parents=True, exist_ok=True)
        report_dir.mkdir(parents=True, exist_ok=True)

        forecast_frame = pd.DataFrame(
            {
                "date": y_test.index,
                "actual_volatility": y_test.values,
                "har_forecast": base_pred.values,
                "har_sentiment_forecast": sentiment_pred.values,
            }
        )
        forecast_csv = forecast_dir / f"{ticker}_forecast.csv"
        forecast_frame.to_csv(forecast_csv, index=False)

        plot_path = plot_dir / f"{ticker}_forecast.png"
        _forecast_plot(y_test, sentiment_pred, plot_path, f"{ticker} realized vs forecast volatility")

        report_rows.append({"ticker": ticker, "model": "HAR", **base_metrics})
        report_rows.append({"ticker": ticker, "model": "HAR+Sentiment", **sentiment_metrics})

        logger.info("Forecast completed", extra={"ticker": ticker, "forecast_csv": str(forecast_csv), "plot": str(plot_path)})

    report = pd.DataFrame(report_rows)
    if not report.empty:
        report.to_csv(Path("artifacts") / "reports" / "forecast_metrics.csv", index=False)
        print(report.sort_values(["ticker", "model"]).to_string(index=False))
    else:
        print("No forecasts were produced. Check your data window and API access.")


if __name__ == "__main__":
    main()
