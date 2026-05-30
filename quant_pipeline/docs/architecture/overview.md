# Architecture Overview

## System Flow

```text
TICKERS: AAPL, MSFT, TSLA, NVDA
-> Market Data Loader (yfinance)
-> News Data Loader (NewsAPI)
-> FinBERT Sentiment Service
-> Feature Builder
-> HAR Forecasting Model (Checkpoint 1)
-> Evaluation Metrics
```

## Layering

1. Data layer: ingestion, persistence, and schema definitions.
2. NLP layer: sentiment inference and aggregation.
3. Feature layer: leakage-safe supervised features.
4. Model layer: forecasting estimators.
5. Evaluation layer: quantitative performance measures.

## Patterns

1. Repository style persistence behavior via data loaders and ORM.
2. Service layer for FinBERT inference orchestration.
3. Clean separation between data access and modeling logic.

## Checkpoint Strategy

1. Checkpoint 1: demoable end-to-end HAR pipeline.
2. Checkpoint 2: model comparison + MLflow evidence.
3. Final phase: deep models + monitoring stack.
