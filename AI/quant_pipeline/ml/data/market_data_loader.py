"""Market data ingestion and volatility transformations."""

from datetime import datetime
import logging

import numpy as np
import pandas as pd
import yfinance as yf
from sqlalchemy import select
from sqlalchemy.orm import Session

from ml.data.schemas import MarketData

logger = logging.getLogger(__name__)


def download_market_data(ticker: str, start_date: str, end_date: str, interval: str = "1d") -> pd.DataFrame:
    """Download OHLCV data from yfinance.

    Args:
        ticker: Security ticker.
        start_date: Inclusive start date in YYYY-MM-DD format.
        end_date: Exclusive end date in YYYY-MM-DD format.
        interval: Data interval, e.g. 1d or 1h.

    Returns:
        pd.DataFrame: Normalized market dataframe.
    """

    try:
        frame = yf.download(
            tickers=ticker,
            start=start_date,
            end=end_date,
            interval=interval,
            auto_adjust=False,
            progress=False,
        )
    except Exception as exc:
        logger.exception("Failed to download market data", extra={"ticker": ticker})
        raise ValueError(f"Market data download failed for {ticker}") from exc

    if frame.empty:
        logger.warning("No market data returned", extra={"ticker": ticker})
        return pd.DataFrame(columns=["ticker", "date", "open", "high", "low", "close", "adj_close", "volume"])

    # yfinance may return MultiIndex columns when downloading multiple
    # tickers or depending on the version. Flatten them to a single level
    # by taking the first non-empty element from the tuple column.
    if hasattr(frame.columns, "nlevels") and getattr(frame.columns, "nlevels", 1) > 1:
        def _flatten(col):
            if isinstance(col, tuple):
                for part in col:
                    if part:
                        return part
                return col[0]
            return col

        frame.columns = [_flatten(c) for c in frame.columns]

    frame = frame.reset_index().rename(
        columns={
            "Date": "date",
            "Datetime": "date",
            "Open": "open",
            "High": "high",
            "Low": "low",
            "Close": "close",
            "Adj Close": "adj_close",
            "Volume": "volume",
        }
    )
    frame["date"] = pd.to_datetime(frame["date"]).dt.tz_localize(None)
    frame["ticker"] = ticker
    if "adj_close" not in frame.columns:
        frame["adj_close"] = frame["close"]
    logger.info("Downloaded market data", extra={"ticker": ticker, "rows": len(frame)})
    return frame[["ticker", "date", "open", "high", "low", "close", "adj_close", "volume"]].sort_values("date")


def compute_realized_variance(market_df: pd.DataFrame) -> pd.Series:
    """Compute realized variance.

    Priority:
        1. Intraday realized variance from sum of squared intraday returns per day.
        2. Fallback to daily squared returns when only daily bars are available.

    Args:
        market_df: Market dataframe with date and close columns.

    Returns:
        pd.Series: Realized variance indexed like market_df.
    """

    required = {"date", "close"}
    if not required.issubset(set(market_df.columns)):
        missing = required.difference(set(market_df.columns))
        raise ValueError(f"market_df missing required columns: {sorted(missing)}")

    data = market_df.copy()
    data["date"] = pd.to_datetime(data["date"])
    data["log_return"] = np.log(data["close"] / data["close"].shift(1))

    if data["date"].dt.time.nunique() > 1:
        by_day = data.groupby(data["date"].dt.floor("D"))["log_return"].transform(lambda x: np.square(x).sum())
        return by_day.fillna(0.0)

    return np.square(data["log_return"]).fillna(0.0)


def compute_realized_volatility(realized_variance: pd.Series, annualization_factor: int = 252) -> pd.Series:
    """Compute annualized realized volatility from variance."""

    return np.sqrt(realized_variance.clip(lower=0.0) * annualization_factor)


def write_raw_market_data(session: Session, market_df: pd.DataFrame) -> None:
    """Persist raw market rows into PostgreSQL."""

    try:
        for row in market_df.itertuples(index=False):
            existing = session.execute(
                select(MarketData).where(MarketData.ticker == row.ticker, MarketData.date == row.date)
            ).scalar_one_or_none()
            if existing:
                existing.open = float(row.open)
                existing.high = float(row.high)
                existing.low = float(row.low)
                existing.close = float(row.close)
                existing.adj_close = float(row.adj_close)
                existing.volume = float(row.volume)
            else:
                session.add(
                    MarketData(
                        ticker=row.ticker,
                        date=row.date if isinstance(row.date, datetime) else pd.to_datetime(row.date).to_pydatetime(),
                        open=float(row.open),
                        high=float(row.high),
                        low=float(row.low),
                        close=float(row.close),
                        adj_close=float(row.adj_close),
                        volume=float(row.volume),
                    )
                )
        logger.info("Raw market data upsert completed", extra={"rows": len(market_df)})
    except Exception as exc:
        logger.exception("Failed to persist raw market data")
        raise RuntimeError("write_raw_market_data failed") from exc


def write_processed_market_data(session: Session, market_df: pd.DataFrame) -> None:
    """Persist processed realized variance and volatility values."""

    try:
        for row in market_df.itertuples(index=False):
            existing = session.execute(
                select(MarketData).where(MarketData.ticker == row.ticker, MarketData.date == row.date)
            ).scalar_one_or_none()
            if existing:
                existing.realized_variance = float(row.realized_variance)
                existing.realized_volatility = float(row.realized_volatility)
        logger.info("Processed market data update completed", extra={"rows": len(market_df)})
    except Exception as exc:
        logger.exception("Failed to persist processed market data")
        raise RuntimeError("write_processed_market_data failed") from exc


if __name__ == "__main__":
    sample = download_market_data("AAPL", "2024-01-01", "2025-01-01")
    sample["realized_variance"] = compute_realized_variance(sample)
    sample["realized_volatility"] = compute_realized_volatility(sample["realized_variance"])
    logger.info("Market data loader example completed", extra={"rows": len(sample)})
    print(sample.tail(3))
