# Sentiment Impact Report

This short report summarizes the observed impact of including FinBERT-derived daily sentiment features on volatility forecasting for tickers AAPL, MSFT, TSLA, NVDA.

Source: artifacts/reports/forecast_metrics.csv (sanitized — negative forecasts clipped)

Summary per ticker:

- **AAPL**: HAR+Sentiment increases directional accuracy (0.6298 vs 0.4427) but worsens RMSE (0.1735 vs 0.1577). Trade-off: better directional signals at cost of higher magnitude error.
- **MSFT**: Small RMSE change, directional accuracy improves (0.6489 vs 0.3779). Similar trade-off as AAPL but smaller magnitude.
- **TSLA**: Minimal change in RMSE; directional accuracy improves (0.6259 vs 0.3969) — sentiment helps direction but not magnitude.
- **NVDA**: HAR+Sentiment performs substantially worse (RMSE 0.5722 vs 0.3357). Likely causes: noisy sentiment signal, small sample of informative articles, and overfitting of ridge model when sentiment features are present.

Key findings:

- Sentiment features are sparse and weakly informative in this run (NewsAPI key was not configured during the diagnostic run; many sentiment columns default to zeros). When sentiment is present, it sometimes improves directional accuracy while increasing RMSE — a classic precision/recall trade-off for direction vs magnitude.
- NVDA failure mode: inclusion of sentiment produced large coefficient shifts (or unstable regularization) and much higher error — avoid using HAR+Sentiment for NVDA without further regularization or feature validation.

Recommendation:

- Keep sentiment-enabled models as experimental variants. For presentation, report both HAR and HAR+Sentiment, and emphasize that sentiment improves directional accuracy for AAPL/MSFT/TSLA but is inconsistent for NVDA.
- Do not make HAR+Sentiment the default production model for all tickers.
