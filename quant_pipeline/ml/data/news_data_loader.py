"""News ingestion with retry and persistence."""

import json
import logging
import time
from datetime import datetime
from typing import Any

import pandas as pd
import requests
from sqlalchemy import select
from sqlalchemy.orm import Session
from tenacity import retry, retry_if_exception_type, stop_after_attempt, wait_exponential

from ml.data.schemas import NewsArticle


class JsonFormatter(logging.Formatter):
    """Simple JSON formatter for structured logs."""

    def format(self, record: logging.LogRecord) -> str:
        payload: dict[str, Any] = {
            "ts": datetime.utcnow().isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "msg": record.getMessage(),
        }
        return json.dumps(payload)


def get_logger(name: str) -> logging.Logger:
    """Create configured structured logger."""

    logger = logging.getLogger(name)
    if logger.handlers:
        return logger
    logger.setLevel(logging.INFO)
    handler = logging.StreamHandler()
    handler.setFormatter(JsonFormatter())
    logger.addHandler(handler)
    logger.propagate = False
    return logger


logger = get_logger(__name__)


class NewsDataLoader:
    """Load and persist financial news from NewsAPI."""

    BASE_URL = "https://newsapi.org/v2/everything"

    def __init__(self, api_key: str, rate_limit_seconds: float = 1.0) -> None:
        self.api_key = api_key
        self.rate_limit_seconds = rate_limit_seconds

    @retry(
        retry=retry_if_exception_type(requests.RequestException),
        wait=wait_exponential(multiplier=1, min=1, max=30),
        stop=stop_after_attempt(5),
        reraise=True,
    )
    def _request(self, params: dict[str, Any]) -> dict[str, Any]:
        try:
            response = requests.get(self.BASE_URL, params=params, timeout=30)
            response.raise_for_status()
            return response.json()
        except requests.RequestException:
            logger.exception("NewsAPI request failed")
            raise

    def fetch_news(self, ticker: str, start_date: str, end_date: str, page_size: int = 100) -> pd.DataFrame:
        """Fetch and normalize financial news.

        Args:
            ticker: Ticker or query token.
            start_date: Inclusive start date in YYYY-MM-DD.
            end_date: Inclusive end date in YYYY-MM-DD.
            page_size: Page size requested from NewsAPI.

        Returns:
            pd.DataFrame: Normalized article rows.
        """

        if not self.api_key:
            logger.warning("No NewsAPI key configured; returning empty news frame", extra={"ticker": ticker})
            return pd.DataFrame(columns=["headline", "snippet", "ticker", "source", "timestamp", "url"])

        params = {
            "q": ticker,
            "from": start_date,
            "to": end_date,
            "sortBy": "publishedAt",
            "language": "en",
            "pageSize": page_size,
            "apiKey": self.api_key,
        }

        logger.info("fetch_news_request", extra={"ticker": ticker, "start": start_date, "end": end_date})
        payload = self._request(params=params)
        time.sleep(self.rate_limit_seconds)

        rows = payload.get("articles", [])
        normalized: list[dict[str, Any]] = []
        for article in rows:
            source = (article.get("source") or {}).get("name", "unknown")
            normalized.append(
                {
                    "headline": article.get("title") or "",
                    "snippet": (article.get("description") or "") + " " + (article.get("content") or ""),
                    "ticker": ticker,
                    "source": source,
                    "timestamp": pd.to_datetime(article.get("publishedAt"), utc=True).tz_convert(None),
                    "url": article.get("url") or "",
                }
            )

        frame = pd.DataFrame(normalized)
        if frame.empty:
            return pd.DataFrame(columns=["headline", "snippet", "ticker", "source", "timestamp", "url"])

        frame = frame.sort_values("timestamp").drop_duplicates(subset=["url"], keep="last").reset_index(drop=True)
        logger.info("fetch_news_success", extra={"ticker": ticker, "rows": len(frame)})
        return frame

    def write_news(self, session: Session, news_df: pd.DataFrame) -> None:
        """Persist raw news records to PostgreSQL."""

        try:
            for row in news_df.itertuples(index=False):
                existing = session.execute(select(NewsArticle).where(NewsArticle.url == row.url)).scalar_one_or_none()
                if existing:
                    existing.headline = row.headline
                    existing.snippet = row.snippet
                    existing.ticker = row.ticker
                    existing.source = row.source
                    existing.published_at = row.timestamp
                else:
                    session.add(
                        NewsArticle(
                            headline=row.headline,
                            snippet=row.snippet,
                            ticker=row.ticker,
                            source=row.source,
                            url=row.url,
                            published_at=row.timestamp,
                        )
                    )
            logger.info("News upsert completed", extra={"rows": len(news_df)})
        except Exception as exc:
            logger.exception("Failed to persist news records")
            raise RuntimeError("write_news failed") from exc


if __name__ == "__main__":
    print("Use NewsDataLoader(api_key).fetch_news(...) in pipeline code.")
