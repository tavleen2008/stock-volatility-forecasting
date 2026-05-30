# Executive Summary — Checkpoint

**Project Goal**
- Forecast short-horizon realized volatility for tickers AAPL, MSFT, TSLA, NVDA using a robust, explainable pipeline combining HAR baselines and an XGBoost benchmark. Evaluate sentiment contribution via FinBERT-derived daily aggregates.

**Data Sources**
- Market data: `yfinance` OHLCV (daily); compute realized variance/volatility within pipeline.
- News/sentiment: FinBERT pipeline (heuristic fallback if transformers unavailable); aggregated to daily features.

**FinBERT Sentiment Pipeline**
- Article-level sentiment inferred via FinBERT or heuristic fallback; aggregated to daily `mean_sentiment`, `rolling_sentiment_mean`, `sentiment_shock`, and counts.
- Guardrails: if sentiment features are constant or missing, sentiment model training is skipped.

**HAR Methodology**
- Classical HAR using daily, weekly (5-business-day mean), and monthly (22-business-day mean) realized volatility features plus short-lag features (t, t-1, t-2), rolling std, overnight/absolute returns, and realized quarticity.
- Also implement a log-variance HAR variant trained on log(realized_variance) and back-transformed to volatility.

**XGBoost Methodology**
- XGBoost (or `HistGradientBoostingRegressor` fallback) trained on the same feature set; used as a nonlinear benchmark with safety clipping to ensure non-negative forecasts.

**Key Results**
- Baseline HAR yields the best average RMSE across tickers; HAR+Sentiment improves directional accuracy but increases RMSE on average.
- `log1p` target transformation yields small RMSE gains for AAPL and MSFT but not for TSLA/NVDA.
- NVDA demonstrates a failure mode where HAR+Sentiment drastically increases RMSE — caused by noisy or sparse sentiment inputs.

**Impact of Sentiment**
- Sentiment helps directional accuracy selectively (AAPL, MSFT, TSLA) but is inconsistent. For NVDA it harms performance.
- Recommendation: report sentiment models as experimental; require more robust news coverage and validation before production adoption.

**Limitations**
- Spike capture is limited by feature set and daily data frequency; intraday realized variance or additional short-lag return features would be necessary for meaningful improvement.
- Sentiment quality depends on news volume and FinBERT availability.

**Future Work (post-checkpoint)**
- Collect intraday data to compute high-frequency realized variance as spike-sensitive inputs.
- Improve sentiment pipeline (more sources, robust FinBERT runs, careful feature selection and regularization).

