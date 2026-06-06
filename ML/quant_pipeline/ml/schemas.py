"""
Pydantic response/request schemas for the HAR-Sentiment volatility endpoint.
"""

from pydantic import BaseModel, Field, field_validator


class SentimentFeatures(BaseModel):
    average_sentiment: float
    sentiment_std: float
    sentiment_shock: float
    article_count: int


class NewsItem(BaseModel):
    headline: str
    sentiment_score: float
    sentiment_label: str


class PredictionInterval(BaseModel):
    lower: float
    upper: float


class ModelMetrics(BaseModel):
    rmse: float
    mae: float
    directional_accuracy: float


class ForecastRequest(BaseModel):
    ticker: str = Field(
        ...,
        min_length=1,
        max_length=10,
        description="Ticker symbol, e.g. AAPL",
    )

    @field_validator("ticker")
    @classmethod
    def validate_ticker(cls, value: str) -> str:
        value = value.strip().upper()
        if not value.isalnum():
            raise ValueError("Ticker must contain only letters and numbers")
        return value


class ForecastResponse(BaseModel):
    ticker: str
    generated_at: str
    data_available_until: str
    forecast_for: str
    forecast_type: str
    forecast_volatility: float
    prediction_interval: PredictionInterval
    model_used: str
    feature_count: int
    confidence_score: float
    model_metrics: ModelMetrics
    sentiment_features: SentimentFeatures
    top_news: list[NewsItem]
    reason: str
