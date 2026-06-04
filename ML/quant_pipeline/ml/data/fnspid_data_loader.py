from pathlib import Path
import logging
from tqdm import tqdm
from datasets import load_dataset_builder, DownloadMode


# Silence noisy HTTP request logs from httpx (used by huggingface_hub)
logging.getLogger("httpx").setLevel(logging.WARNING)
import pandas as pd
from datasets import load_dataset, load_dataset_builder

logger = logging.getLogger(__name__)

def load_fnspid(ticker: str, start_date: str, end_date: str) -> pd.DataFrame:
    """Load the FNSPID dataset from Hugging Face and filter for a ticker and date range.

    Parameters
    ----------
    ticker: str
        Stock ticker symbol (e.g., "AAPL").
    start_date: str
        ISO‑format start date (inclusive).
    end_date: str
        ISO‑format end date (inclusive).

    Returns
    -------
    pd.DataFrame
        DataFrame with at least the columns used elsewhere:
        ``headline, snippet, ticker, source, timestamp, url`` and optionally a
        sentiment column (any column containing the word ``sentiment``).
    """
    try:
        # Load the full dataset; the Hugging Face library will cache it locally.
        # Use streaming mode to avoid downloading the full 5‑GB CSV files.
        ds = load_dataset("Zihan1004/FNSPID", split="train", streaming=True)
    except Exception as e:
        logger.exception("Failed to load FNSPID dataset from Hugging Face")
        raise

    # Get total number of records for progress ETA using dataset builder (metadata only)
    builder = load_dataset_builder("Zihan1004/FNSPID")
    # Ensure dataset metadata is loaded (this does not download the full data)
    builder.download_and_prepare(download_mode=DownloadMode.REUSE_CACHE_IF_EXISTS)
    total_rows = builder.info.splits["train"].num_examples

    # Filter by ticker and date range.
    start = pd.to_datetime(start_date)
    end = pd.to_datetime(end_date)
    # Filter records for the requested ticker and date range.
    # Use tqdm with total to show ETA
    filtered_records = []
    for record in tqdm(ds, desc=f"Streaming FNSPID [{ticker}]", total=total_rows, unit="record"):
        # Ensure required fields exist
        if record.get("ticker") != ticker:
            continue
        # Parse timestamp
        ts = pd.to_datetime(record.get("timestamp"), errors="coerce")
        if pd.isna(ts):
            continue
        if start <= ts <= end:
            filtered_records.append(record)
    # Build DataFrame from the filtered list (may be empty)
    df = pd.DataFrame(filtered_records)

    # Ensure timestamp column exists and is datetime.
    if "timestamp" not in df.columns:
        raise KeyError("FNSPID dataset missing 'timestamp' column")
    if not pd.api.types.is_datetime64_any_dtype(df["timestamp"]):
        df["timestamp"] = pd.to_datetime(df["timestamp"], errors="coerce")

    # The records have already been filtered by ticker and date during streaming.
    filtered = df.copy()
    logger.debug(
        "FNSPID records loaded",
        extra={"ticker": ticker, "rows": len(filtered), "date_range": f"{start_date}..{end_date}"},
    )
    return filtered
