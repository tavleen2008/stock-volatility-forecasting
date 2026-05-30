# `ml.pipelines.train_pipeline`

## Purpose

Runs the Checkpoint 1 demo end to end:

1. Download market data
2. Pull news articles
3. Score sentiment
4. Build HAR features
5. Train HAR and HAR+Sentiment models
6. Save forecasts, metrics, and plots

## Run

```bash
python -m ml.pipelines.train_pipeline
```

## Outputs

- `artifacts/forecasts/{ticker}_forecast.csv`
- `artifacts/plots/{ticker}_forecast.png`
- `artifacts/reports/forecast_metrics.csv`

## Demo Note

If NewsAPI or FinBERT is unavailable, the pipeline falls back to empty news input and a heuristic sentiment score so the forecast still runs.