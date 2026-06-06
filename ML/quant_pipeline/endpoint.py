"""
Volatility Forecast API — HAR-Sentiment Research Model
======================================================
Uses the log-log HAR specification (Corsi 2009) with Garman-Klass (1980)
realized variance, EWM-imputed FinBERT sentiment features, and ticker
fixed effects (within-transformation).

Model variants:
  - HAR-Full  (primary): 13 features (HAR extended + sentiment)
  - HAR-OLS   (fallback): 3 features (core HAR)
"""

from contextlib import asynccontextmanager
from functools import lru_cache
from pathlib import Path
from typing import List

from cachetools import TTLCache
import pandas_market_calendars as mcal
from zoneinfo import ZoneInfo
from datetime import datetime, timedelta

import psycopg2
import psycopg2.extras
from huggingface_hub import InferenceClient
from dotenv import load_dotenv
import os

load_dotenv()

import numpy as np
import pandas as pd

from fastapi import FastAPI, HTTPException

from ml.data.market_data_loader import download_market_data
from ml.features.har_features import (
    HAR_CORE, SENT_FEATURES, ALL_FEATURES,
    TARGET, TARGET_RAW,
    compute_har_features,
)
from ml.models.model_loader import MODELS, load_model as _load_model
from ml.nlp.sentiment_features import build_ewm_sentiment_features
from ml.schemas import (
    SentimentFeatures, NewsItem, PredictionInterval,
    ModelMetrics, ForecastRequest, ForecastResponse,
)

# ---------------------------------------------------------------------------
# Global state — populated during lifespan startup
# ---------------------------------------------------------------------------

# Global model artifacts (single model shared across all tickers)
LOADED_MODELS = {}       # HAR-Full artifacts  { model, scaler, fe_means, feature_cols }
LOADED_FALLBACK = {}     # HAR-OLS artifacts
FINBERT = None

# Global HF Inference client for batch FinBERT calls
_hf_client = InferenceClient(
    provider="hf-inference",
    api_key=os.getenv("HF_TOKEN"),
    model="ProsusAI/finbert",
)

MARKET_CACHE = TTLCache(maxsize=100, ttl=300)
NYSE_CALENDAR = mcal.get_calendar("NYSE")

DATABASE_URL = os.getenv("DATABASE_URL")

# EWM decay halflife for sentiment imputation (matches notebook)
DECAY_HALFLIFE = 3

# News lookback window aligned with HAR lag structure
NEWS_LOOKBACK_DAYS = 7




# ---------------------------------------------------------------------------
# FinBERT helpers
# ---------------------------------------------------------------------------

LABEL_MAP = {
    "positive": "POSITIVE",
    "negative": "NEGATIVE",
    "neutral": "NEUTRAL",
    "label_0": "NEGATIVE",
    "label_1": "NEUTRAL",
    "label_2": "POSITIVE",
}


def load_finbert():
    """Return a callable that queries HF Inference API for FinBERT."""
    token = os.getenv("HF_TOKEN")
    client = InferenceClient(
        provider="hf-inference",
        api_key=token,
        model="ProsusAI/finbert",
    )

    def _infer(text: str):
        try:
            return client.text_classification(text)
        except Exception as e:
            print(f"FinBERT API call failed: {e}. Fallback to neutral.")
            return [{"label": "NEUTRAL", "score": 1.0}]

    return _infer


def batch_finbert(texts: List[str]) -> List[dict]:
    """Batch FinBERT inference via HF Inference API."""
    try:
        return _hf_client.text_classification(texts)
    except Exception as e:
        print(f"FinBERT batch API call failed: {e}. Fallback neutral for all.")
        return [{"label": "NEUTRAL", "score": 1.0} for _ in texts]


@lru_cache(maxsize=256)
def _cached_finbert_inference(text: str) -> dict:
    """Run FinBERT on a single text snippet with LRU caching."""
    return FINBERT(text)[0]


# ---------------------------------------------------------------------------
# News fetch (PostgreSQL — same as old endpoint)
# ---------------------------------------------------------------------------

def fetch_latest_news(ticker: str, start_date: datetime, end_date: datetime):
    """Fetch news articles from the NewsArticle table."""
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
# Sentiment analysis (same structure as old endpoint for response packet)
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


def analyze_sentiment(articles):
    """Run FinBERT on articles and return aggregate sentiment stats + top news.

    This is used for the response packet (top_news, sentiment_features).
    """
    if not articles:
        return default_sentiment()

    texts = []
    article_map = []
    for article in articles:
        txt = (
            article.get("title")
            or article.get("description")
            or article.get("content")
            or ""
        )
        if not txt:
            continue
        txt = txt[:512]
        texts.append(txt)
        article_map.append(txt)

    if not texts:
        return default_sentiment()

    batch_preds = batch_finbert(texts)

    scores = []
    top_news = []
    for txt, pred in zip(article_map, batch_preds):
        try:
            label_raw = pred["label"].lower()
            sentiment = LABEL_MAP.get(label_raw, "NEUTRAL")
            confidence = float(pred["score"])
            if sentiment == "POSITIVE":
                score = confidence
            elif sentiment == "NEGATIVE":
                score = -confidence
            else:
                score = 0.0
            scores.append(score)
            top_news.append({
                "headline": txt[:150],
                "sentiment_score": round(score, 4),
                "sentiment_label": sentiment,
            })
        except Exception as e:
            try:
                pred = _cached_finbert_inference(txt)
                label_raw = pred["label"].lower()
                sentiment = LABEL_MAP.get(label_raw, "NEUTRAL")
                confidence = float(pred["score"])
                if sentiment == "POSITIVE":
                    score = confidence
                elif sentiment == "NEGATIVE":
                    score = -confidence
                else:
                    score = 0.0
                scores.append(score)
                top_news.append({
                    "headline": txt[:150],
                    "sentiment_score": round(score, 4),
                    "sentiment_label": sentiment,
                })
            except Exception as ee:
                print(f"Sentiment error (fallback): {ee}")

    if not scores:
        return default_sentiment()

    sentiment_series = pd.Series(scores)
    return {
        "average_sentiment": float(sentiment_series.mean()),
        "sentiment_std": float(sentiment_series.std() if len(scores) > 1 else 0.0),
        "sentiment_shock": float(sentiment_series.iloc[-1] - sentiment_series.mean()),
        "article_count": len(scores),
        "top_news": sorted(top_news, key=lambda n: abs(n["sentiment_score"]), reverse=True)[:5],
    }




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
    raise RuntimeError("Unable to determine next trading day.")


def get_trading_day_range(end_date, lookback_days: int = 7):
    """Return a (start, end) datetime pair aligned to NYSE sessions."""
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
    """Download OHLCV data via yfinance, with caching."""
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
# Confidence score
# ---------------------------------------------------------------------------

def compute_confidence_score(
    prediction: float,
    recent_volatilities: pd.Series,
    residual_std: float | None = None,
) -> float:
    """Derive a [0, 1] confidence score from recent volatility stability."""
    if recent_volatilities.empty or len(recent_volatilities) < 2:
        return 0.5

    rv_mean = float(recent_volatilities.mean())
    rv_std = float(recent_volatilities.std())

    if rv_mean > 0:
        cv = rv_std / rv_mean
        stability = max(0.0, 1.0 - cv)
    else:
        stability = 0.5

    if rv_mean > 0:
        deviation = abs(prediction - rv_mean) / rv_mean
        deviation_penalty = min(deviation, 1.0)
    else:
        deviation_penalty = 0.5

    confidence = 0.6 * stability + 0.4 * (1.0 - deviation_penalty)
    return round(max(0.0, min(1.0, confidence)), 4)




# ---------------------------------------------------------------------------
# Lifespan — load model artifacts
# ---------------------------------------------------------------------------

ARTIFACTS_DIR = Path("artifacts/models")

# Tickers that have a directory under ARTIFACTS_DIR
SUPPORTED_TICKERS = []



@asynccontextmanager
async def lifespan(app: FastAPI):
    global LOADED_MODELS, LOADED_FALLBACK, FINBERT, SUPPORTED_TICKERS

    if not ARTIFACTS_DIR.exists():
        raise RuntimeError(f"Missing artifacts directory: {ARTIFACTS_DIR}")

    # Collect supported tickers (directories that exist under ARTIFACTS_DIR)
    ticker_dirs = [d.name for d in ARTIFACTS_DIR.iterdir() if d.is_dir()]
    SUPPORTED_TICKERS.extend(ticker_dirs)
    print(f"Discovered {len(ticker_dirs)} ticker directories: {ticker_dirs}")

    # Load models once from root artifacts (general models, not per-ticker)
    full = _load_model("HAR-Full", ARTIFACTS_DIR)
    if full:
        LOADED_MODELS = full
        print(f"  ✓ HAR-Full loaded ({len(full['feature_cols'])} features)")
    else:
        print("  ⚠ HAR-Full not found")

    ols = _load_model("HAR-OLS", ARTIFACTS_DIR)
    if ols:
        LOADED_FALLBACK = ols
        print(f"  ✓ HAR-OLS (fallback) loaded ({len(ols['feature_cols'])} features)")

    if not LOADED_MODELS and not LOADED_FALLBACK:
        raise RuntimeError("No valid model artifacts found.")

    print(f"\nSupported tickers: {SUPPORTED_TICKERS}")

    # Warmup: verify models can predict
    for label, arts in [("HAR-Full", LOADED_MODELS), ("HAR-OLS", LOADED_FALLBACK)]:
        if not arts:
            continue
        feature_cols = arts["feature_cols"]
        dummy = np.zeros((1, len(feature_cols)))
        dummy_scaled = arts["scaler"].transform(dummy)
        _ = arts["model"].predict(dummy_scaled)
        print(f"{label} warmup validated.")

    # Load FinBERT
    print("Loading FinBERT...")
    FINBERT = load_finbert()
    _test_pred = FINBERT("test")
    print(f"FinBERT loaded (warmup label: {_test_pred[0]['label']}).")

    yield

    print("Shutting down...")


# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------

app = FastAPI(
    title="Volatility Forecast API",
    version="2.0.0",
    lifespan=lifespan,
)


@app.get("/")
async def root():
    return {
        "service": "Volatility Forecast API",
        "version": "2.0.0",
        "model": "HAR-Sentiment Research (log-log)",
        "status": "online",
    }


@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "models_loaded": bool(LOADED_MODELS),
        "fallback_models_loaded": bool(LOADED_FALLBACK),
        "supported_tickers": SUPPORTED_TICKERS,
        "finbert_loaded": FINBERT is not None,
        "primary_model": "HAR-Full",
        "fallback_model": "HAR-OLS",
        "timestamp": datetime.now(ZoneInfo("UTC")).isoformat(),
    }


# ---------------------------------------------------------------------------
# Forecast endpoint
# ---------------------------------------------------------------------------

@app.post("/forecast", response_model=ForecastResponse)
async def forecast(request: ForecastRequest):
    try:
        ticker = request.ticker.upper()

        # ----- Check ticker support -----
        if ticker not in SUPPORTED_TICKERS:
            raise HTTPException(
                status_code=404,
                detail=(
                    f"No model artifacts for {ticker}. "
                    f"Supported tickers: {SUPPORTED_TICKERS}"
                ),
            )

        # ----- Market data -----
        market_df = get_market_data(ticker)

        if market_df.empty:
            raise HTTPException(
                status_code=404,
                detail=f"No market data found for {ticker}",
            )

        # ----- Compute HAR features -----
        # Set date as index for compute_har_features (expects OHLCV with DatetimeIndex)
        ohlcv = market_df.copy()
        ohlcv["date"] = pd.to_datetime(ohlcv["date"])
        ohlcv = ohlcv.set_index("date").sort_index()

        har_features = compute_har_features(ohlcv)

        # Drop rows with NaN (need warm-up for rolling windows)
        har_features = har_features.dropna(
            subset=['log_rv_d', 'log_rv_w', 'log_rv_m', 'log_rv_target']
        )

        if har_features.empty:
            raise HTTPException(
                status_code=500,
                detail="Not enough data to compute HAR features (need 22+ days)",
            )

        # ----- News & Sentiment -----
        now = datetime.now(ZoneInfo("UTC"))
        news_start, news_end = get_trading_day_range(now, lookback_days=NEWS_LOOKBACK_DAYS)
        articles = fetch_latest_news(ticker, news_start, news_end)

        # Aggregate sentiment for response packet
        sentiment = analyze_sentiment(articles)

        # Build EWM-imputed sentiment features for model input
        def _score_fn(text: str) -> float:
            pred = _cached_finbert_inference(text)
            label = LABEL_MAP.get(pred["label"].lower(), "NEUTRAL")
            conf = float(pred["score"])
            return conf if label == "POSITIVE" else (-conf if label == "NEGATIVE" else 0.0)

        sent_features = build_ewm_sentiment_features(articles, sentiment, score_fn=_score_fn)

        # ----- Assemble feature row -----
        latest_har = har_features.iloc[-1]

        # Choose model: HAR-Full (primary) or HAR-OLS (fallback)
        using_full_model = bool(LOADED_MODELS)
        if using_full_model:
            arts = LOADED_MODELS
            feature_cols = arts["feature_cols"]  # ALL_FEATURES (13)
            model_used_label = "HAR-Full"
        elif LOADED_FALLBACK:
            arts = LOADED_FALLBACK
            feature_cols = arts["feature_cols"]  # HAR_CORE (3)
            model_used_label = "HAR-OLS"
        else:
            raise HTTPException(
                status_code=500,
                detail=f"No model loaded",
            )

        # Build feature vector
        feature_values = {}
        for col in feature_cols:
            if col in latest_har.index:
                feature_values[col] = float(latest_har[col])
            elif col in sent_features:
                feature_values[col] = sent_features[col]
            else:
                # Feature not found — use 0.0 (safe default)
                print(f"WARNING: Feature '{col}' not found, using 0.0")
                feature_values[col] = 0.0

        # Check for missing HAR features
        missing_har = [c for c in HAR_CORE if c not in latest_har.index]
        if missing_har:
            raise HTTPException(
                status_code=500,
                detail=f"Missing core HAR features: {missing_har}",
            )

        # ----- Apply ticker fixed effects (within-transformation) -----
        fe_means = arts["fe_means"]
        ticker_means = fe_means.get(ticker, {})

        # Demean features: subtract training-set ticker mean
        demeaned_values = []
        for col in feature_cols:
            raw_val = feature_values[col]
            col_mean = ticker_means.get(col, 0.0)
            demeaned_values.append(raw_val - col_mean)

        # Demean target mean (to add back after prediction)
        target_mean = ticker_means.get(TARGET, 0.0)

        # ----- Scale and predict -----
        # Scaler was fitted on plain numpy arrays — pass .values to suppress warning
        X = np.array(demeaned_values, dtype=float).reshape(1, -1)
        X_scaled = arts["scaler"].transform(X)

        # Predict in log-space (demeaned)
        prediction_dm = float(arts["model"].predict(X_scaled)[0])

        # Add back ticker target mean to get log-RV prediction
        log_rv_prediction = prediction_dm + target_mean

        # Convert to level-space (annualized variance)
        rv_prediction = float(np.exp(log_rv_prediction))

        # Annualized volatility for display
        prediction = float(np.sqrt(max(rv_prediction, 0.0)))

        # If the full model gives a bad prediction, fall back to OLS
        if using_full_model and (np.isnan(prediction) or prediction <= 0):
            if LOADED_FALLBACK:
                print(f"WARNING: HAR-Full prediction invalid, falling back to HAR-OLS")
                arts_fb = LOADED_FALLBACK
                fb_feature_cols = arts_fb["feature_cols"]
                fb_values = []
                fb_fe_means = arts_fb["fe_means"].get(ticker, {})
                for col in fb_feature_cols:
                    raw_val = float(latest_har.get(col, 0.0))
                    col_mean = fb_fe_means.get(col, 0.0)
                    fb_values.append(raw_val - col_mean)

                X_fb = np.array(fb_values, dtype=float).reshape(1, -1)
                X_fb_scaled = arts_fb["scaler"].transform(X_fb)
                pred_dm_fb = float(arts_fb["model"].predict(X_fb_scaled)[0])
                target_mean_fb = fb_fe_means.get(TARGET, 0.0)
                log_rv_fb = pred_dm_fb + target_mean_fb
                rv_fb = float(np.exp(log_rv_fb))
                prediction = float(np.sqrt(max(rv_fb, 0.0)))
                model_used_label = "HAR-OLS (full-fallback)"
                feature_cols = fb_feature_cols
                using_full_model = False

        # ----- Universal prediction floor -----
        if prediction <= 0 or np.isnan(prediction):
            # Fall back to recent realized volatility mean
            recent_rv = har_features['rv_target'].dropna().tail(20)
            recent_rv_mean = float(np.sqrt(recent_rv.mean())) if not recent_rv.empty else 0.01
            print(f"WARNING: prediction={prediction}, using recent RV mean={recent_rv_mean:.4f}")
            prediction = recent_rv_mean
            model_used_label = f"{model_used_label} (rv-floor)"

        # ----- Trading day -----
        last_market_date = har_features.index[-1].date() if hasattr(har_features.index[-1], 'date') else pd.to_datetime(har_features.index[-1]).date()
        prediction_day = get_next_trading_day(last_market_date)

        # ----- Confidence score -----
        recent_rv_series = har_features['rv_target'].dropna().tail(20).apply(lambda x: np.sqrt(max(x, 0)))
        confidence_score = compute_confidence_score(prediction, recent_rv_series)

        # ----- Compute model metrics from recent residuals -----
        if len(har_features) > 10:
            test_window = har_features.tail(min(60, len(har_features)))

            test_feat_vals = []
            for _, row in test_window.iterrows():
                row_feats = []
                for col in feature_cols:
                    if col in row.index:
                        val = float(row[col])
                    elif col in sent_features:
                        # Use current sentiment for all rows (approximation)
                        val = sent_features[col]
                    else:
                        val = 0.0
                    row_mean = ticker_means.get(col, 0.0) if using_full_model else arts.get("fe_means", {}).get(ticker, {}).get(col, 0.0)
                    row_feats.append(val - row_mean)
                test_feat_vals.append(row_feats)

            X_test = np.array(test_feat_vals)
            X_test_scaled = arts["scaler"].transform(X_test)
            test_preds_log = arts["model"].predict(X_test_scaled) + target_mean

            # Convert predictions and actuals to volatility space for metrics
            test_preds_vol = np.sqrt(np.maximum(np.exp(test_preds_log), 0))
            test_actuals_vol = np.sqrt(np.maximum(test_window['rv_target'].values, 0))

            residuals = test_actuals_vol - test_preds_vol
            rmse = float(np.sqrt(np.mean(residuals ** 2)))
            mae = float(np.mean(np.abs(residuals)))

            if len(test_actuals_vol) > 1:
                actual_dir = np.diff(test_actuals_vol) > 0
                pred_dir = np.diff(test_preds_vol) > 0
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
            f"HAR-Sentiment Research model (log-log specification) analysed "
            f"{sentiment['article_count']} recent articles over the past "
            f"{NEWS_LOOKBACK_DAYS} days. "
            f"Aggregate FinBERT sentiment is {sent_direction} ({avg_sent:.2f}). "
            f"Garman-Klass realized variance with {len(feature_cols)} features "
            f"(including ticker fixed effects) suggests "
            f"{'moderate' if prediction < float(recent_rv_series.mean()) * 1.2 else 'elevated'} "
            f"expected volatility for {prediction_day.isoformat()}."
        )

        # ----- Response -----
        return ForecastResponse(
            ticker=ticker,
            generated_at=datetime.now(ZoneInfo("UTC")).isoformat(),
            data_available_until=har_features.index[-1].isoformat()
            if hasattr(har_features.index[-1], "isoformat")
            else str(har_features.index[-1]),
            forecast_for=prediction_day.isoformat(),
            forecast_type="same_day_pre_market",
            forecast_volatility=round(prediction, 4),
            prediction_interval=PredictionInterval(
                lower=round(max(0.0, prediction * 0.90), 4),
                upper=round(prediction * 1.10, 4),
            ),
            model_used=model_used_label,
            feature_count=len(feature_cols),
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
