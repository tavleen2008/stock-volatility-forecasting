from contextlib import asynccontextmanager
from pathlib import Path
from cachetools import TTLCache
import pandas_market_calendars as mcal
from zoneinfo import ZoneInfo
from datetime import datetime, timedelta

import joblib
import pandas as pd

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from pydantic import field_validator

from ml.data.market_data_loader import (
    download_market_data,
    compute_realized_variance,
    compute_realized_volatility,
)

from ml.features.feature_builder import FeatureBuilder
from ml.models.har_model import HARModel

MODEL = None
SCALER = None

FEATURE_BUILDER = None

MARKET_CACHE = TTLCache(
    maxsize=100,
    ttl=300,
)

NYSE_CALENDAR = mcal.get_calendar("NYSE")

FEATURE_COLUMNS = [
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

def get_next_trading_day(current_date):
    """
    Returns the next NYSE trading session after current_date.
    """

    schedule = NYSE_CALENDAR.schedule(
        start_date=current_date,
        end_date=current_date + timedelta(days=14),
    )

    trading_days = schedule.index.date

    for trading_day in trading_days:
        if trading_day > current_date:
            return trading_day

    raise RuntimeError(
        "Unable to determine next trading day."
    )

def get_market_data(ticker: str):
    ticker = ticker.upper()
    if ticker in MARKET_CACHE:
        return MARKET_CACHE[ticker]

    df = download_market_data(
        ticker=ticker,
        start_date="2020-01-01",
        end_date=datetime.now(ZoneInfo("UTC")).strftime("%Y-%m-%d"),
        interval="1d",
    )

    MARKET_CACHE[ticker] = df

    return df

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

    @field_validator("ticker")
    @classmethod
    def validate_ticker(cls, value: str):

        value = value.strip().upper()

        if not value.isalnum():
            raise ValueError(
                "Ticker must contain only letters and numbers"
            )

        return value

@asynccontextmanager
async def lifespan(app: FastAPI):

    global MODEL
    global SCALER
    global FEATURE_BUILDER

    required_files = [
        "artifacts/models/har_model.joblib",
        "artifacts/models/har_scaler.joblib",
    ]

    for artifact in required_files:
        if not Path(artifact).exists():
            raise RuntimeError(
                f"Missing required artifact: {artifact}"
            )

    print("Loading HAR model...")

    MODEL = HARModel.load(
        "artifacts/models/har_model.joblib"
    )
    FEATURE_BUILDER = FeatureBuilder()

    SCALER = joblib.load(
        "artifacts/models/har_scaler.joblib"
    )
    warmup = pd.DataFrame(
        {
            col: [0.0]
            for col in FEATURE_COLUMNS
        }
    )

    warmup_scaled = pd.DataFrame(
        SCALER.transform(warmup),
        columns=FEATURE_COLUMNS,
    )

    MODEL.predict(warmup_scaled)

    print("HAR model loaded.")

    yield

    print("Shutting down...")

app = FastAPI(
    title="Volatility Forecast API",
    version="1.0.0",
    lifespan=lifespan,
)

@app.get("/")
async def root():
    return {
        "service": "Volatility Forecast API",
        "version": "1.0.0",
        "status": "online",
    }

@app.get("/health")
async def health():

    return {
        "status": "healthy",
        "model_loaded": MODEL is not None,
        "scaler_loaded": SCALER is not None,
        "feature_builder_loaded": FEATURE_BUILDER is not None,
        "timestamp": datetime.now(ZoneInfo("UTC")).isoformat(),
    }

@app.post(
    "/forecast",
    response_model=ForecastResponse,
)
async def forecast(
    request: ForecastRequest,
):
    try:

        ticker = request.ticker.upper()

        market_df = get_market_data(ticker)

        if market_df.empty:
            raise HTTPException(
                status_code=404,
                detail=f"No market data found for {ticker}",
            )

        market_df["realized_variance"] = (
            compute_realized_variance(
                market_df
            )
        )

        market_df["realized_volatility"] = (
            compute_realized_volatility(
                market_df["realized_variance"]
            )
        )

        features = FEATURE_BUILDER.build_features(
            market_df=market_df,
            sentiment_daily_df=pd.DataFrame(),
            forecast_horizon=1,
        )

        if features.empty:
            raise HTTPException(
                status_code=500,
                detail="Feature generation failed",
            )

        latest = features.iloc[-1:]

        X = latest[FEATURE_COLUMNS]

        X_scaled = pd.DataFrame(
            SCALER.transform(X),
            columns=FEATURE_COLUMNS,
            index=X.index,
        )

        prediction = float(
            MODEL.predict(X_scaled).iloc[0]
        )

        last_market_date = pd.to_datetime(
            market_df.index[-1]
        ).date()

        prediction_day = get_next_trading_day(
            last_market_date
        )

# ====================================================
# TODO
#
# confidence_score:
#   Derive from validation RMSE/R².
#
# prediction_interval:
#   Compute from model residual distribution.
#
# model_metrics:
#   Load from forecast_metrics.csv generated during training.
#
# sentiment_features:
#   Populate from FinBERT service.
#
# top_news:
#   Populate from NewsAPI/database pipeline.
#
# reason:
#   Generate dynamically from sentiment + forecast.
# ====================================================

        return ForecastResponse(
            ticker=ticker,
            generated_at=datetime.now(ZoneInfo("UTC")).isoformat(),
            data_available_until=(datetime.now(ZoneInfo("UTC")) + timedelta(days=7)).isoformat(),
            forecast_for=prediction_day.isoformat(),
            forecast_type="same_day_pre_market",
            forecast_volatility=round(prediction, 4),
            prediction_interval=PredictionInterval(
                lower=round(max(0.0, prediction * 0.90), 4),
                upper=round(prediction * 1.10, 4),
            ),
            model_used="HAR",
            confidence_score=0.82,
            model_metrics=ModelMetrics(
                rmse=0.1539,
                mae=0.1173,
                directional_accuracy=0.45,
            ),
            sentiment_features=SentimentFeatures(
                average_sentiment=0.41,
                sentiment_std=0.28,
                sentiment_shock=0.13,
                article_count=27,
            ),
            top_news=[
                NewsItem(
                    headline="Apple announces new AI-powered features",
                    sentiment_score=0.82,
                    sentiment_label="Positive",
                ),
                NewsItem(
                    headline="Analysts raise Apple earnings forecast",
                    sentiment_score=0.76,
                    sentiment_label="Positive",
                ),
                NewsItem(
                    headline="Supply chain concerns remain for Apple",
                    sentiment_score=-0.43,
                    sentiment_label="Negative",
                ),
            ],
            reason="FinBERT analysed 27 recent articles. Aggregate sentiment is positive (0.41). Positive sentiment combined with historical volatility patterns suggests moderate expected volatility for the upcoming trading session.",
            feature_count=len(FEATURE_COLUMNS),
        )

    except HTTPException:
        raise

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e),
        )

if __name__ == "__main__":

    import uvicorn

    uvicorn.run(
        "endpoint:app",
        host="0.0.0.0",
        port=8080,
        reload=True,
    )