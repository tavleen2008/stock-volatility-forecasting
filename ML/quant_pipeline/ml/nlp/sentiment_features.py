"""
EWM-imputed sentiment feature builder for HAR-Full inference.

Mirrors the notebook's `impute_sentiment()` logic for a single
inference window (not a full time-series).
"""

from typing import Callable

import pandas as pd

# EWM decay halflife for sentiment imputation (matches notebook)
DECAY_HALFLIFE = 3


def build_ewm_sentiment_features(
    articles: list,
    sentiment_result: dict,
    score_fn: Callable[[str], float],
) -> dict:
    """
    Build the 6 EWM-imputed sentiment features expected by HAR-Full.

    Parameters
    ----------
    articles : list
        Raw article dicts from the DB (must have 'publishedAt' and a text field).
    sentiment_result : dict
        Output of `analyze_sentiment()` — used to detect the no-news case quickly.
    score_fn : Callable[[str], float]
        Function that maps a text snippet to a directional score in [-1, 1].
        Typically wraps `_cached_finbert_inference` from the endpoint.

    Returns
    -------
    dict with keys:
        has_news, sent_imputed, disp_imputed,
        sent_roll5_mean, sent_roll22_mean, sent_shock
    """
    default = {
        'has_news':         0.0,
        'sent_imputed':     0.0,
        'disp_imputed':     0.0,
        'sent_roll5_mean':  0.0,
        'sent_roll22_mean': 0.0,
        'sent_shock':       0.0,
    }

    if not articles or sentiment_result.get("article_count", 0) == 0:
        return default

    # Score each article and group by date
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
            score = score_fn(text[:512])
            published_at = article.get("publishedAt")
            dt = (
                pd.to_datetime(published_at, utc=True)
                if published_at is not None
                else pd.Timestamp.now(tz="UTC")
            )
            rows.append({"date": dt.floor("D"), "score": score})
        except Exception:
            continue

    if not rows:
        return default

    df = pd.DataFrame(rows)
    df["date"] = pd.to_datetime(df["date"], utc=True).dt.tz_localize(None)

    # Daily aggregation
    daily = (
        df.groupby("date")
        .agg(
            mean_sent=("score", "mean"),
            std_sent=("score", lambda x: x.std() if len(x) > 1 else 0.0),
        )
        .reset_index()
        .sort_values("date")
    )

    daily["has_news"] = 1.0
    daily["sent_imputed"] = daily["mean_sent"]          # on news days, use actual value
    daily["disp_imputed"] = daily["std_sent"].fillna(0.0)

    # Rolling features (lag-1 to prevent leakage)
    sent_lag = daily["sent_imputed"].shift(1)
    daily["sent_roll5_mean"]  = sent_lag.rolling(5,  min_periods=1).mean()
    daily["sent_roll22_mean"] = sent_lag.rolling(22, min_periods=1).mean()
    daily["sent_shock"]       = daily["sent_imputed"] - daily["sent_roll5_mean"]

    latest = daily.iloc[-1]
    return {
        'has_news':         float(latest.get('has_news',         0.0)),
        'sent_imputed':     float(latest.get('sent_imputed',     0.0)),
        'disp_imputed':     float(latest.get('disp_imputed',     0.0)),
        'sent_roll5_mean':  float(latest.get('sent_roll5_mean',  0.0)),
        'sent_roll22_mean': float(latest.get('sent_roll22_mean', 0.0)),
        'sent_shock':       float(latest.get('sent_shock',       0.0)),
    }
