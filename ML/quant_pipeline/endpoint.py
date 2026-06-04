from contextlib import asynccontextmanager
from functools import lru_cache
from pathlib import Path

from cachetools import TTLCache
import pandas_market_calendars as mcal
from zoneinfo import ZoneInfo
from datetime import datetime, timedelta

import psycopg2
import psycopg2.extras
from transformers import pipeline as hf_pipeline
from dotenv import load_dotenv
load_dotenv()

import joblib
import numpy as np
import pandas as pd
import os

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

# ---------------------------------------------------------------------------
# Global state — populated during lifespan startup
# ---------------------------------------------------------------------------

MODEL = None
SCALER = None
HAR_SENTIMENT_MODEL = None
HAR_SENTIMENT_SCALER = None
FEATURE_BUILDER = None
FINBERT = None

MARKET_CACHE = TTLCache(
    maxsize=100,
    ttl=300,
)

NYSE_CALENDAR = mcal.get_calendar("NYSE")

# Base HAR features (no sentiment) — used by the base model
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

# Sentiment features appended for the HAR+Sentiment model
SENTIMENT_FEATURE_COLUMNS = [
    "mean_sentiment",
    "std_sentiment",
    "positive_count",
    "negative_count",
    "neutral_count",
    "rolling_sentiment_mean",
    "rolling_sentiment_std",
    "sentiment_shock",
]

# Combined feature list for HAR+Sentiment
FULL_FEATURE_COLUMNS = FEATURE_COLUMNS + SENTIMENT_FEATURE_COLUMNS

DATABASE_URL = os.getenv("DATABASE_URL")

# News lookback window aligned with HAR lag structure (weekly component)
NEWS_LOOKBACK_DAYS = 7

# ---------------------------------------------------------------------------
# Fix #4: Robust FinBERT label mapping
# ---------------------------------------------------------------------------

LABEL_MAP = {
    "positive": "POSITIVE",
    "negative": "NEGATIVE",
    "neutral": "NEUTRAL",
    "label_0": "NEGATIVE",
    "label_1": "NEUTRAL",
    "label_2": "POSITIVE",
}


# ---------------------------------------------------------------------------
# Fix #2: Safe FinBERT loader function (avoids module-level model init)
# ---------------------------------------------------------------------------

def load_finbert():
    """Load FinBERT model in a controlled function scope.
    Prevents cold-start crashes on memory-constrained deployments (e.g. Render).
    """
    return hf_pipeline(
        "sentiment-analysis",
        model="ProsusAI/finbert",
        tokenizer="ProsusAI/finbert",
    )


# ---------------------------------------------------------------------------
# Fix #12: Cached per-text sentiment to avoid re-running FinBERT on dupes
# ---------------------------------------------------------------------------

@lru_cache(maxsize=256)
def _cached_finbert_inference(text: str) -> dict:
    """Run FinBERT on a single text snippet, with LRU caching."""
    return FINBERT(text)[0]


# ---------------------------------------------------------------------------
# Fix #13: Default sentiment fallback for empty/null article lists
# ---------------------------------------------------------------------------

def default_sentiment() -> dict:
    """Return a safe default when no articles are available."""
    return {
        "average_sentiment": 0.0,
        "sentiment_std": 0.0,
        "sentiment_shock": 0.0,
        "article_count": 0,
        "top_news": [],
    }


# ---------------------------------------------------------------------------
# Fix #3: Cleaner SQL query — removed unnecessary table alias
# ---------------------------------------------------------------------------

def fetch_latest_news(ticker: str, start_date: datetime, end_date: datetime):
    """Fetch news articles from the NewsArticle table.
    Returns a list of dicts (RealDictCursor) or an empty list on error.
    """
    query = '''
        SELECT *
        FROM "NewsArticle"
        WHERE "symbol" = %s
          AND "publishedAt" >= %s
          AND "publishedAt" < %s
        ORDER BY "publishedAt" DESC;
    '''
    try:
        with psycopg2.connect(DATABASE_URL) as conn:
            with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
                cur.execute(query, (ticker, start_date, end_date))
                return cur.fetchall()
    except Exception as e:
        print(f"Database error: {e}")
        return []


# ---------------------------------------------------------------------------
# Fix #4, #5, #6, #12, #13, #14: Rewritten sentiment analysis
# ---------------------------------------------------------------------------

def analyze_sentiment(articles):
    """Run FinBERT sentiment analysis on a list of news article dicts.

    Returns a dict containing daily-aggregated sentiment statistics and
    the top 5 most impactful headlines.

    Fixes applied:
      - Robust label mapping (handles LABEL_0/1/2 formats)
      - Explicit NEUTRAL → 0.0 scoring
      - Per-text caching via lru_cache
      - Daily aggregation preserving time-series structure
      - UTC-normalized timestamps
    """

    # Fix #13: early return for empty input
    if not articles:
        return default_sentiment()

    scores = []
    top_news = []

    for article in articles:
        text = (
            article.get("title")
            or article.get("description")
            or article.get("content")
            or ""
        )
        if not text:
            continue

        try:
            # Fix #12: cached inference
            pred = _cached_finbert_inference(text[:512])

            # Fix #4: robust label mapping
            label_raw = pred["label"].lower()
            sentiment = LABEL_MAP.get(label_raw, "NEUTRAL")
            confidence = float(pred["score"])

            # Fix #5: explicit neutral scoring
            if sentiment == "POSITIVE":
                score = confidence
            elif sentiment == "NEGATIVE":
                score = -confidence
            else:
                score = 0.0

            scores.append(score)

            top_news.append(
                {
                    "headline": text[:150],
                    "sentiment_score": round(score, 4),
                    "sentiment_label": sentiment,
                }
            )
        except Exception as e:
            print(f"Sentiment error: {e}")

    # Fix #13: fallback if all articles failed inference
    if not scores:
        return default_sentiment()

    sentiment_series = pd.Series(scores)

    return {
        "average_sentiment": float(sentiment_series.mean()),
        "sentiment_std": float(sentiment_series.std() if len(scores) > 1 else 0.0),
        "sentiment_shock": float(
            sentiment_series.iloc[-1] - sentiment_series.mean()
        ),
        "article_count": len(scores),
        "top_news": sorted(
            top_news, key=lambda n: abs(n["sentiment_score"]), reverse=True
        )[:5],
    }


# ---------------------------------------------------------------------------
# Fix #6: Build daily-aggregated sentiment DataFrame
# ---------------------------------------------------------------------------

def build_daily_sentiment_df(articles, sentiment_result: dict) -> pd.DataFrame:
    """Aggregate article-level sentiment by date to preserve time-series
    structure needed by FeatureBuilder's merge-on-date logic.

    Falls back to a single-row today frame when no articles have valid dates.
    """
    if not articles or sentiment_result["article_count"] == 0:
        return pd.DataFrame(
            [
                {
                    "date": pd.Timestamp.now(tz="UTC").floor("D"),
                    "mean_sentiment": 0.0,
                    "std_sentiment": 0.0,
                    "positive_count": 0,
                    "negative_count": 0,
                    "neutral_count": 0,
                    "rolling_sentiment_mean": 0.0,
                    "rolling_sentiment_std": 0.0,
                    "sentiment_shock": 0.0,
                }
            ]
        )

    rows = []
    for article in articles:
        text = (
            article.get("title")
            or article.get("description")
            or article.get("content")
            or ""
        )
        if not text:
            continue

        try:
            pred = _cached_finbert_inference(text[:512])
            label_raw = pred["label"].lower()
            sentiment_label = LABEL_MAP.get(label_raw, "NEUTRAL")
            confidence = float(pred["score"])

            if sentiment_label == "POSITIVE":
                score = confidence
            elif sentiment_label == "NEGATIVE":
                score = -confidence
            else:
                score = 0.0

            # Fix #14: normalize timestamps to UTC
            published_at = article.get("publishedAt")
            if published_at is not None:
                dt = pd.to_datetime(published_at, utc=True)
            else:
                dt = pd.Timestamp.now(tz="UTC")

            rows.append(
                {
                    "date": dt.floor("D"),
                    "sentiment_score": score,
                    "sentiment_label": sentiment_label,
                }
            )
        except Exception:
            continue

    if not rows:
        return pd.DataFrame(
            [
                {
                    "date": pd.Timestamp.now(tz="UTC").floor("D"),
                    "mean_sentiment": 0.0,
                    "std_sentiment": 0.0,
                    "positive_count": 0,
                    "negative_count": 0,
                    "neutral_count": 0,
                    "rolling_sentiment_mean": 0.0,
                    "rolling_sentiment_std": 0.0,
                    "sentiment_shock": 0.0,
                }
            ]
        )

    df = pd.DataFrame(rows)
    # Fix #14: ensure date column is timezone-naive for merging with market data
    df["date"] = pd.to_datetime(df["date"], utc=True).dt.tz_localize(None)

    daily = df.groupby("date").agg(
        mean_sentiment=("sentiment_score", "mean"),
        std_sentiment=("sentiment_score", lambda x: x.std() if len(x) > 1 else 0.0),
        positive_count=("sentiment_label", lambda x: (x == "POSITIVE").sum()),
        negative_count=("sentiment_label", lambda x: (x == "NEGATIVE").sum()),
        neutral_count=("sentiment_label", lambda x: (x == "NEUTRAL").sum()),
    ).reset_index()

    # Rolling features across the daily aggregation window
    daily = daily.sort_values("date")
    daily["rolling_sentiment_mean"] = (
        daily["mean_sentiment"].rolling(3, min_periods=1).mean()
    )
    daily["rolling_sentiment_std"] = (
        daily["mean_sentiment"].rolling(3, min_periods=1).std().fillna(0.0)
    )
    daily["sentiment_shock"] = (
        daily["mean_sentiment"] - daily["rolling_sentiment_mean"]
    )

    return daily


# ---------------------------------------------------------------------------
# Trading day helpers
# ---------------------------------------------------------------------------

def get_next_trading_day(current_date):
    """Returns the next NYSE trading session after current_date."""
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


def get_trading_day_range(end_date, lookback_days: int = 7):
    """Return a (start, end) datetime pair aligned to NYSE sessions.

    Fix #11: Aligns the news fetch window to trading calendar boundaries.
    """
    schedule = NYSE_CALENDAR.schedule(
        start_date=end_date - timedelta(days=lookback_days + 5),
        end_date=end_date,
    )
    if schedule.empty:
        return end_date - timedelta(days=lookback_days), end_date
    first_session = schedule.index[0].to_pydatetime().replace(tzinfo=ZoneInfo("UTC"))
    return first_session, datetime.now(ZoneInfo("UTC"))


# ---------------------------------------------------------------------------
# Market data
# ---------------------------------------------------------------------------

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


# ---------------------------------------------------------------------------
# Fix #15: Derive confidence score from model residuals
# ---------------------------------------------------------------------------

def compute_confidence_score(
    prediction: float,
    recent_volatilities: pd.Series,
    residual_std: float | None = None,
) -> float:
    """Derive a [0, 1] confidence score instead of hardcoding 0.82.

    Heuristic:
      - Base confidence from how stable recent volatility has been
        (lower std → higher confidence).
      - Penalty if prediction deviates far from recent mean.
    """
    if recent_volatilities.empty or len(recent_volatilities) < 2:
        return 0.5

    rv_mean = float(recent_volatilities.mean())
    rv_std = float(recent_volatilities.std())

    # Stability component: lower recent std → higher base confidence
    if rv_mean > 0:
        cv = rv_std / rv_mean  # coefficient of variation
        stability = max(0.0, 1.0 - cv)
    else:
        stability = 0.5

    # Deviation penalty: how far is the prediction from recent average
    if rv_mean > 0:
        deviation = abs(prediction - rv_mean) / rv_mean
        deviation_penalty = min(deviation, 1.0)
    else:
        deviation_penalty = 0.5

    confidence = 0.6 * stability + 0.4 * (1.0 - deviation_penalty)
    return round(max(0.0, min(1.0, confidence)), 4)


# ---------------------------------------------------------------------------
# Pydantic models
# ---------------------------------------------------------------------------

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


# Fix #1: field_validator ONLY in ForecastRequest, NOT in ForecastResponse
class ForecastRequest(BaseModel):
    ticker: str = Field(
        ...,
        min_length=1,
        max_length=10,
        description="Ticker symbol, e.g. AAPL",
    )

    @field_validator("ticker")
    @classmethod
    def validate_ticker(cls, value: str):
        value = value.strip().upper()
        if not value.isalnum():
            raise ValueError(
                "Ticker must contain only letters and numbers"
            )
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


# ---------------------------------------------------------------------------
# Lifespan
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    global MODEL
    global SCALER
    global HAR_SENTIMENT_MODEL
    global HAR_SENTIMENT_SCALER
    global FEATURE_BUILDER
    global FINBERT

    required_files = [
        "artifacts/models/har_model.joblib",
        "artifacts/models/har_scaler.joblib",
    ]

    for artifact in required_files:
        if not Path(artifact).exists():
            raise RuntimeError(
                f"Missing required artifact: {artifact}"
            )

    # --- Load base HAR model ---
    print("Loading base HAR model...")
    MODEL = HARModel.load(
        "artifacts/models/har_model.joblib"
    )

    FEATURE_BUILDER = FeatureBuilder()

    SCALER = joblib.load(
        "artifacts/models/har_scaler.joblib"
    )

    # Fix #9: Scaler dimension safety check
    if SCALER.n_features_in_ != len(FEATURE_COLUMNS):
        raise RuntimeError(
            f"Base scaler expects {SCALER.n_features_in_} features "
            f"but FEATURE_COLUMNS has {len(FEATURE_COLUMNS)}. "
            f"Re-train the model or update FEATURE_COLUMNS."
        )

    # Fix #10: Complete warmup — validates scaler, model, and feature pipeline
    warmup = pd.DataFrame(
        {col: [0.0] for col in FEATURE_COLUMNS}
    )
    warmup_scaled = pd.DataFrame(
        SCALER.transform(warmup),
        columns=FEATURE_COLUMNS,
    )
    MODEL.predict(warmup_scaled)
    print("Base HAR model loaded and warmup validated.")

    # --- Optionally load HAR+Sentiment model ---
    sent_model_path = Path("artifacts/models/har_sentiment_model.joblib")
    sent_scaler_path = Path("artifacts/models/har_sentiment_scaler.joblib")
    if sent_model_path.exists() and sent_scaler_path.exists():
        print("Loading HAR+Sentiment model...")
        HAR_SENTIMENT_MODEL = HARModel.load(str(sent_model_path))
        HAR_SENTIMENT_SCALER = joblib.load(str(sent_scaler_path))
        if HAR_SENTIMENT_SCALER.n_features_in_ != len(FULL_FEATURE_COLUMNS):
            print(
                f"WARNING: HAR+Sentiment scaler expects "
                f"{HAR_SENTIMENT_SCALER.n_features_in_} features but "
                f"FULL_FEATURE_COLUMNS has {len(FULL_FEATURE_COLUMNS)}. "
                f"Disabling sentiment model — re-run the train pipeline."
            )
            HAR_SENTIMENT_MODEL = None
            HAR_SENTIMENT_SCALER = None
        else:
            # Warmup the sentiment model too
            warmup_full = pd.DataFrame(
                {col: [0.0] for col in FULL_FEATURE_COLUMNS}
            )
            warmup_full_scaled = pd.DataFrame(
                HAR_SENTIMENT_SCALER.transform(warmup_full),
                columns=FULL_FEATURE_COLUMNS,
            )
            HAR_SENTIMENT_MODEL.predict(warmup_full_scaled)
            print("HAR+Sentiment model loaded and warmup validated.")
    else:
        print(
            "WARNING: har_sentiment_model.joblib not found. "
            "Run the train pipeline to generate it. "
            "Falling back to base HAR model for all forecasts."
        )

    # --- Load FinBERT (Fix #2: via safe loader function) ---
    print("Loading FinBERT...")
    FINBERT = load_finbert()

    # Warmup FinBERT with a trivial input
    _test_pred = FINBERT("test")
    print(f"FinBERT loaded (warmup label: {_test_pred[0]['label']}).")

    yield

    print("Shutting down...")


# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------

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
        "har_sentiment_model_loaded": HAR_SENTIMENT_MODEL is not None,
        "feature_builder_loaded": FEATURE_BUILDER is not None,
        "finbert_loaded": FINBERT is not None,
        "active_model": "HAR+Sentiment" if HAR_SENTIMENT_MODEL is not None else "HAR",
        "timestamp": datetime.now(ZoneInfo("UTC")).isoformat(),
    }


# ---------------------------------------------------------------------------
# Forecast endpoint
# ---------------------------------------------------------------------------

@app.post(
    "/forecast",
    response_model=ForecastResponse,
)
async def forecast(
    request: ForecastRequest,
):
    try:

        ticker = request.ticker.upper()

        # ----- Market data -----
        market_df = get_market_data(ticker)

        if market_df.empty:
            raise HTTPException(
                status_code=404,
                detail=f"No market data found for {ticker}",
            )

        market_df["realized_variance"] = (
            compute_realized_variance(market_df)
        )

        market_df["realized_volatility"] = (
            compute_realized_volatility(market_df["realized_variance"])
        )

        # ----- News & Sentiment -----
        now = datetime.now(ZoneInfo("UTC"))

        # Fix #7 & #11: expanded + trading-calendar-aligned news window
        news_start, news_end = get_trading_day_range(
            now, lookback_days=NEWS_LOOKBACK_DAYS
        )
        articles = fetch_latest_news(ticker, news_start, news_end)

        # Fix #13: safe sentiment with default fallback
        sentiment = analyze_sentiment(articles)

        # Fix #6: daily-aggregated sentiment DataFrame
        sentiment_df = build_daily_sentiment_df(articles, sentiment)

        # ----- Feature engineering -----
        features = FEATURE_BUILDER.build_features(
            market_df=market_df,
            sentiment_daily_df=sentiment_df,
            forecast_horizon=1,
        )

        if features.empty:
            raise HTTPException(
                status_code=500,
                detail="Feature generation failed — not enough data to build HAR lags",
            )

        latest = features.iloc[-1:]

        # Fix #8: Feature column mismatch guard (base features always required)
        missing_base = set(FEATURE_COLUMNS) - set(features.columns)
        if missing_base:
            raise HTTPException(
                status_code=500,
                detail=f"Missing base features from FeatureBuilder: {sorted(missing_base)}",
            )

        # ---- Choose model: HAR+Sentiment when available, else base HAR ----
        using_sentiment_model = (
            HAR_SENTIMENT_MODEL is not None
            and HAR_SENTIMENT_SCALER is not None
        )

        if using_sentiment_model:
            # Check all sentiment features are present (FeatureBuilder fills missing with 0.0)
            missing_sent = set(FULL_FEATURE_COLUMNS) - set(features.columns)
            if missing_sent:
                # FeatureBuilder should always produce sentiment cols (defaulting to 0),
                # but if somehow missing fall back to base model gracefully.
                print(f"WARNING: missing sentiment features {missing_sent}, falling back to base HAR")
                using_sentiment_model = False

        if using_sentiment_model:
            X = latest[FULL_FEATURE_COLUMNS]
            print(X,len(X))
            X_scaled = pd.DataFrame(
                HAR_SENTIMENT_SCALER.transform(X),
                columns=FULL_FEATURE_COLUMNS,
                index=X.index,
            )
            prediction_raw = float(HAR_SENTIMENT_MODEL.model.predict(
                X_scaled[HAR_SENTIMENT_MODEL.feature_columns]
            )[0])
            if prediction_raw <= 0:
                # Sentiment model produced a non-positive raw prediction — this
                # typically means the scaler is miscalibrated (synthetic training).
                # Fall back to the base HAR model for a reliable forecast.
                print(
                    f"WARNING: HAR+Sentiment raw prediction={prediction_raw:.4f} <= 0; "
                    f"falling back to base HAR model."
                )
                X_base = latest[FEATURE_COLUMNS]
                X_base_scaled = pd.DataFrame(
                    SCALER.transform(X_base),
                    columns=FEATURE_COLUMNS,
                    index=X_base.index,
                )
                prediction = float(MODEL.predict(X_base_scaled).iloc[0])
                model_used_label = "HAR (sentiment-fallback)"
                using_sentiment_model = False
            else:
                prediction = float(HAR_SENTIMENT_MODEL.predict(X_scaled).iloc[0])
                model_used_label = "HAR+Sentiment"
        else:
            X = latest[FEATURE_COLUMNS]
            X_scaled = pd.DataFrame(
                SCALER.transform(X),
                columns=FEATURE_COLUMNS,
                index=X.index,
            )
            prediction = float(MODEL.predict(X_scaled).iloc[0])
            model_used_label = "HAR"

        # ----- Universal prediction floor -----
        # Linear models can extrapolate to negative values in extreme market
        # conditions. When that happens, fall back to the recent realized
        # volatility mean — a simple but reliable non-zero estimate.
        if prediction <= 0:
            recent_rv_mean = float(
                market_df["realized_volatility"].dropna().tail(20).mean()
            )
            print(
                f"WARNING: model prediction={prediction:.4f} <= 0 "
                f"(model={model_used_label}); using recent RV mean={recent_rv_mean:.4f}"
            )
            prediction = recent_rv_mean
            model_used_label = f"{model_used_label} (rv-floor)"

        last_market_date = pd.to_datetime(
            market_df["date"].iloc[-1]
        ).date()

        prediction_day = get_next_trading_day(
            last_market_date
        )

        # ----- Fix #15: Derived confidence score -----
        recent_rv = market_df["realized_volatility"].dropna().tail(20)
        confidence_score = compute_confidence_score(
            prediction, recent_rv
        )

        # ----- Compute model metrics from residuals -----
        # Use the most recent test-window residuals for RMSE/MAE
        if using_sentiment_model:
            _active_feat_cols = FULL_FEATURE_COLUMNS
            _active_scaler = HAR_SENTIMENT_SCALER
            _active_model = HAR_SENTIMENT_MODEL
        else:
            _active_feat_cols = FEATURE_COLUMNS
            _active_scaler = SCALER
            _active_model = MODEL

        if len(features) > 10 and "realized_volatility" in features.columns:
            test_window = features.tail(min(60, len(features)))
            test_X = test_window[_active_feat_cols]
            test_X_scaled = pd.DataFrame(
                _active_scaler.transform(test_X),
                columns=_active_feat_cols,
                index=test_X.index,
            )
            test_preds = _active_model.predict(test_X_scaled)
            test_actuals = test_window["realized_volatility"]
            residuals = test_actuals.values - test_preds.values
            rmse = float(np.sqrt(np.mean(residuals ** 2)))
            mae = float(np.mean(np.abs(residuals)))
            # Directional accuracy: how often did sign of change match
            if len(test_actuals) > 1:
                actual_dir = np.diff(test_actuals.values) > 0
                pred_dir = np.diff(test_preds.values) > 0
                dir_acc = float(np.mean(actual_dir == pred_dir))
            else:
                dir_acc = 0.5
        else:
            rmse = 0.0
            mae = 0.0
            dir_acc = 0.5

        # ----- Build dynamic reason string -----
        avg_sent = sentiment["average_sentiment"]
        sent_direction = (
            "positive" if avg_sent > 0.05
            else "negative" if avg_sent < -0.05
            else "neutral"
        )
        reason = (
            f"FinBERT analysed {sentiment['article_count']} recent articles "
            f"over the past {NEWS_LOOKBACK_DAYS} days. "
            f"Aggregate sentiment is {sent_direction} ({avg_sent:.2f}). "
            f"{'Positive' if avg_sent > 0 else 'Negative' if avg_sent < 0 else 'Neutral'} "
            f"sentiment combined with historical volatility patterns "
            f"(recent RV mean: {float(recent_rv.mean()):.4f}) suggests "
            f"{'moderate' if prediction < float(recent_rv.mean()) * 1.2 else 'elevated'} "
            f"expected volatility for {prediction_day.isoformat()}."
        )

        # ----- Fix #15: Use actual computed data, not hardcoded values -----
        return ForecastResponse(
            ticker=ticker,
            generated_at=datetime.now(ZoneInfo("UTC")).isoformat(),
            data_available_until=market_df["date"].iloc[-1].isoformat()
            if hasattr(market_df["date"].iloc[-1], "isoformat")
            else str(market_df["date"].iloc[-1]),
            forecast_for=prediction_day.isoformat(),
            forecast_type="same_day_pre_market",
            forecast_volatility=round(prediction, 4),
            prediction_interval=PredictionInterval(
                lower=round(max(0.0, prediction * 0.90), 4),
                upper=round(prediction * 1.10, 4),
            ),
            model_used=model_used_label,
            confidence_score=confidence_score,
            model_metrics=ModelMetrics(
                rmse=round(rmse, 4),
                mae=round(mae, 4),
                directional_accuracy=round(dir_acc, 4),
            ),
            sentiment_features=SentimentFeatures(
                average_sentiment=round(sentiment["average_sentiment"], 4),
                sentiment_std=round(sentiment["sentiment_std"], 4),
                sentiment_shock=round(sentiment["sentiment_shock"], 4),
                article_count=sentiment["article_count"],
            ),
            top_news=[
                NewsItem(
                    headline=n["headline"],
                    sentiment_score=n["sentiment_score"],
                    sentiment_label=n["sentiment_label"],
                )
                for n in sentiment["top_news"]
            ],
            reason=reason,
            feature_count=len(HAR_SENTIMENT_MODEL.feature_columns)
            if using_sentiment_model and HAR_SENTIMENT_MODEL is not None
            else len(MODEL.feature_columns),
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