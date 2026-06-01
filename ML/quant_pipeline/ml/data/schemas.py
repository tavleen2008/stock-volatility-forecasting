"""SQLAlchemy ORM schemas for market, news, and sentiment outputs."""

from datetime import datetime
import logging

from sqlalchemy import DateTime, Float, ForeignKey, Index, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ml.data.database import Base

logger = logging.getLogger(__name__)


class MarketData(Base):
    """OHLCV market data table."""

    __tablename__ = "market_data"
    __table_args__ = (UniqueConstraint("ticker", "date", name="uq_market_data_ticker_date"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    ticker: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    date: Mapped[datetime] = mapped_column(DateTime, nullable=False, index=True)
    open: Mapped[float] = mapped_column(Float, nullable=False)
    high: Mapped[float] = mapped_column(Float, nullable=False)
    low: Mapped[float] = mapped_column(Float, nullable=False)
    close: Mapped[float] = mapped_column(Float, nullable=False)
    adj_close: Mapped[float] = mapped_column(Float, nullable=False)
    volume: Mapped[float] = mapped_column(Float, nullable=False)
    realized_variance: Mapped[float | None] = mapped_column(Float, nullable=True)
    realized_volatility: Mapped[float | None] = mapped_column(Float, nullable=True)


class NewsArticle(Base):
    """Raw financial news article table."""

    __tablename__ = "news_article"
    __table_args__ = (UniqueConstraint("url", name="uq_news_article_url"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    headline: Mapped[str] = mapped_column(String(500), nullable=False)
    snippet: Mapped[str] = mapped_column(Text, nullable=True)
    ticker: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    source: Mapped[str] = mapped_column(String(200), nullable=False)
    url: Mapped[str] = mapped_column(String(1000), nullable=False)
    published_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, index=True)

    sentiment: Mapped[list["SentimentResult"]] = relationship(back_populates="article")


class SentimentResult(Base):
    """FinBERT sentiment inference outputs per article."""

    __tablename__ = "sentiment_result"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    article_id: Mapped[int] = mapped_column(ForeignKey("news_article.id"), nullable=False, index=True)
    sentiment_label: Mapped[str] = mapped_column(String(20), nullable=False)
    sentiment_score: Mapped[float] = mapped_column(Float, nullable=False)
    positive_probability: Mapped[float] = mapped_column(Float, nullable=False)
    neutral_probability: Mapped[float] = mapped_column(Float, nullable=False)
    negative_probability: Mapped[float] = mapped_column(Float, nullable=False)

    article: Mapped[NewsArticle] = relationship(back_populates="sentiment")


Index("ix_news_ticker_published", NewsArticle.ticker, NewsArticle.published_at)
Index("ix_market_ticker_date", MarketData.ticker, MarketData.date)


if __name__ == "__main__":
    logger.info("Loaded ORM schemas: MarketData, NewsArticle, SentimentResult")
