"""Strongly typed data and experiment configuration."""

from datetime import date
import logging

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

logger = logging.getLogger(__name__)
DEMO_TICKERS = ["AAPL", "MSFT", "TSLA", "NVDA"]


class DataConfig(BaseSettings):
    """Runtime configuration loaded from environment variables.

    Attributes:
        tickers: List of symbols for training.
        start_date: Inclusive market/news start date.
        end_date: Inclusive market/news end date.
        news_api_key: API token for NewsAPI.
        database_url: SQLAlchemy PostgreSQL URL.
        mlflow_tracking_uri: MLflow tracking server URI.
        experiment_name: MLflow experiment name.
        forecast_horizon: Number of days ahead to forecast.
        random_seed: Random seed for reproducibility.
        finbert_model_name: FinBERT HuggingFace model ID.
    """

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    tickers: list[str] = Field(default_factory=lambda: DEMO_TICKERS.copy())
    start_date: date = Field(default=date(2018, 1, 1))
    end_date: date = Field(default=date(2025, 1, 1))
    news_api_key: str = Field(default="")
    database_url: str = Field(default="postgresql+psycopg://postgres:postgres@localhost:5432/volatility")
    mlflow_tracking_uri: str = Field(default="http://127.0.0.1:5000")
    experiment_name: str = Field(default="news-sentiment-volatility")
    forecast_horizon: int = Field(default=1, ge=1, le=30)
    random_seed: int = Field(default=42)
    finbert_model_name: str = Field(default="ProsusAI/finbert")
    # When true and real sentiment is missing/constant, inject small synthetic sentiment noise for testing
    synthetic_sentiment: bool = Field(default=False)

    @field_validator("tickers", mode="before")
    @classmethod
    def parse_tickers(cls, value: str | list[str]) -> list[str]:
        """Parse comma-separated ticker values from env.

        Args:
            value: Raw value from env/config.

        Returns:
            list[str]: Normalized uppercase ticker list.
        """

        if isinstance(value, list):
            parsed = [item.strip().upper() for item in value if item.strip()]
            if not parsed:
                raise ValueError("tickers cannot be empty")
            return parsed
        if isinstance(value, str):
            parsed = [item.strip().upper() for item in value.split(",") if item.strip()]
            if not parsed:
                raise ValueError("tickers cannot be empty")
            return parsed
        raise TypeError("tickers must be a list[str] or comma-separated str")


if __name__ == "__main__":
    config = DataConfig()
    logger.info(
        "Loaded data config",
        extra={
            "tickers": config.tickers,
            "start_date": str(config.start_date),
            "end_date": str(config.end_date),
            "forecast_horizon": config.forecast_horizon,
        },
    )
