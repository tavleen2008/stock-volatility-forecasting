"""Database-driven news ingestion and sentiment pipeline.

Usage: called via run_db_news_pipeline.py wrapper to ensure package imports work.
"""
from __future__ import annotations

import os
import sys
import textwrap
from pathlib import Path
import logging
import pandas as pd

logger = logging.getLogger(__name__)


def _write_md(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content)


def discover_database(database_url: str) -> dict:
    try:
        from sqlalchemy import create_engine, inspect, text
    except Exception as e:
        raise RuntimeError(f"SQLAlchemy not available: {e}") from e

    engine = create_engine(database_url)
    inspector = inspect(engine)

    schemas = inspector.get_schema_names()
    discovery = {"schemas": {}}
    for schema in schemas:
        try:
            tables = inspector.get_table_names(schema=schema)
        except Exception:
            tables = []
        discovery["schemas"][schema] = {"tables": {}}
        for table in tables:
            cols = inspector.get_columns(table_name=table, schema=schema)
            # attempt row count
            try:
                with engine.connect() as conn:
                    row = conn.execute(text(f"SELECT count(*) AS cnt FROM \"{schema}\".\"{table}\""))
                    cnt = int(row.fetchone()[0])
            except Exception:
                cnt = -1
            discovery["schemas"][schema]["tables"][table] = {"row_count": cnt, "columns": cols}
    return discovery


def find_news_tables(discovery: dict) -> list[tuple[str, str, dict]]:
    candidates = []
    keywords = ["headline", "title", "summary", "content", "body", "ticker", "symbol", "published", "timestamp", "pub_date", "source"]
    for schema, sdata in discovery.get("schemas", {}).items():
        for table, tdata in sdata.get("tables", {}).items():
            col_names = [c["name"].lower() for c in tdata.get("columns", [])]
            score = sum(1 for k in keywords if any(k in cn for cn in col_names))
            if score >= 3:
                candidates.append((schema, table, {"columns": col_names, "score": score, "row_count": tdata.get("row_count")}))
    return sorted(candidates, key=lambda x: (-x[2]["score"], - (x[2]["row_count"] or 0)))


def load_news_from_db(database_url: str, schema: str, table: str, sample_limit: int | None = None) -> pd.DataFrame:
    from sqlalchemy import create_engine, text
    engine = create_engine(database_url)
    sel = f'SELECT * FROM "{schema}"."{table}"'
    if sample_limit:
        sel += f" LIMIT {sample_limit}"
    df = pd.read_sql(text(sel), con=engine)
    return df


def normalize_news_df(raw: pd.DataFrame) -> pd.DataFrame:
    # normalize common fields: date, ticker, headline, content, source
    df = raw.copy()
    cols = {c.lower(): c for c in df.columns}
    # find date column
    date_col = None
    for cand in ("published", "pub_date", "timestamp", "created_at", "date"):
        if cand in cols:
            date_col = cols[cand]
            break
    if date_col is None:
        # fallback to first datetime-like column
        for c in df.columns:
            if pd.api.types.is_datetime64_any_dtype(df[c]):
                date_col = c
                break
    if date_col:
        df["date"] = pd.to_datetime(df[date_col], errors="coerce")
    else:
        df["date"] = pd.NaT

    # ticker
    ticker_col = None
    for cand in ("ticker", "symbol", "tickers"):
        if cand in cols:
            ticker_col = cols[cand]
            break
    if ticker_col:
        df["ticker"] = df[ticker_col].astype(str).str.upper()
    else:
        df["ticker"] = None

    # headline
    headline_col = None
    for cand in ("headline", "title"):
        if cand in cols:
            headline_col = cols[cand]
            break
    df["headline"] = df[headline_col] if headline_col else None

    # content/summary
    content_col = None
    for cand in ("content", "summary", "body"):
        if cand in cols:
            content_col = cols[cand]
            break
    df["content"] = df[content_col] if content_col else None

    # source
    source_col = None
    for cand in ("source", "source_name"):
        if cand in cols:
            source_col = cols[cand]
            break
    df["source"] = df[source_col] if source_col else None

    out = df[["date", "ticker", "headline", "content", "source"]].copy()
    # clean
    out["headline"] = out["headline"].astype(str).replace({"nan": None})
    out["content"] = out["content"].astype(str).replace({"nan": None})
    return out


def basic_quality_checks(df: pd.DataFrame) -> dict:
    res = {}
    res["rows"] = len(df)
    res["null_headlines"] = int(df["headline"].isna().sum())
    res["null_content"] = int(df["content"].isna().sum())
    res["null_ticker"] = int(df["ticker"].isna().sum())
    res["duplicate_headline_pubdate"] = int(df.duplicated(subset=["headline", "date"]).sum())
    res["missing_timestamps"] = int(df["date"].isna().sum())
    return res


def run_main() -> None:
    out_dir = Path("outputs") / "reports"
    out_dir.mkdir(parents=True, exist_ok=True)

    DATABASE_URL = os.getenv("DATABASE_URL")
    if not DATABASE_URL:
        msg = "DATABASE_URL not set in environment; cannot proceed."
        logger.error(msg)
        _write_md(out_dir / "database_schema_audit.md", msg)
        return

    # Step 1: discovery
    try:
        discovery = discover_database(DATABASE_URL)
    except Exception as e:
        _write_md(out_dir / "database_schema_audit.md", f"Database discovery failed: {e}")
        return

    # build markdown
    md = ["# Database Schema Audit\n"]
    for schema, sdata in discovery.get("schemas", {}).items():
        md.append(f"## Schema: {schema}\n")
        for table, tdata in sdata.get("tables", {}).items():
            md.append(f"- Table: {table} — rows: {tdata.get('row_count')} — columns: {len(tdata.get('columns', []))}")
            for col in tdata.get("columns", []):
                md.append(f"  - {col.get('name')}: {col.get('type')}")
    _write_md(out_dir / "database_schema_audit.md", "\n".join(md))

    # Step 2: find news tables
    candidates = find_news_tables(discovery)
    if not candidates:
        _write_md(out_dir / "news_table_report.md", "No candidate news tables found.")
        return

    # pick top candidate
    schema, table, meta = candidates[0]
    rpt = [f"Selected news table: {schema}.{table}", "", "Detected columns:", ""]
    rpt.extend([f"- {c}" for c in meta.get("columns", [])])
    _write_md(out_dir / "news_table_report.md", "\n".join(rpt))

    # Step 3 & 4: load and quality check
    raw = load_news_from_db(DATABASE_URL, schema, table)
    normalized = normalize_news_df(raw)
    quality = basic_quality_checks(normalized)
    qmd = ["# News Quality Report", "", f"Rows inspected: {quality['rows']}", f"Null headlines: {quality['null_headlines']}", f"Null content: {quality['null_content']}", f"Null tickers: {quality['null_ticker']}", f"Duplicate headline+date: {quality['duplicate_headline_pubdate']}", f"Missing timestamps: {quality['missing_timestamps']}"]
    _write_md(out_dir / "news_quality_report.md", "\n".join(qmd))

    # Save loaded news
    saved_news = Path("outputs") / "data" / f"news_{schema}_{table}.csv"
    saved_news.parent.mkdir(parents=True, exist_ok=True)
    normalized.to_csv(saved_news, index=False)

    # Step 5: sentiment pipeline — try using local FinBERT service if available
    sentiment_csv = Path("outputs") / "data" / "sentiment_scores.csv"
    try:
        from ml.nlp.finbert_sentiment import FinBertSentimentService
        svc = FinBertSentimentService()
        enriched = svc.enrich_news_frame(normalized.rename(columns={"date": "timestamp"}))
        # ensure output has expected columns
        if "sentiment_score" in enriched.columns or "label" in enriched.columns:
            enriched.to_csv(sentiment_csv, index=False)
            # aggregate daily
            daily = svc.aggregate_daily_sentiment_frame(enriched)
            daily_csv = Path("outputs") / "data" / "daily_sentiment_features.csv"
            daily.to_csv(daily_csv, index=False)
            _write_md(out_dir / "sentiment_feature_validation.md", daily.describe(include="all").to_string())
        else:
            _write_md(out_dir / "sentiment_feature_validation.md", "FinBERT enrichment did not return sentiment columns.")
    except Exception as e:
        _write_md(out_dir / "sentiment_feature_validation.md", f"Sentiment processing skipped: {e}")

    # Final summary
    final = ["# DB News Pipeline Summary", "", f"Database URL: {DATABASE_URL}", f"Selected news table: {schema}.{table}", f"Articles loaded: {len(normalized)}"]
    _write_md(out_dir / "sentiment_integration_audit.md", "\n".join(final))


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    run_main()
