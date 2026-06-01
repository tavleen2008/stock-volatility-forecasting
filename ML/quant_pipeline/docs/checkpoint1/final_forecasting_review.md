Final Forecasting Review

Summary
- Models evaluated: HAR, HAR+Sentiment, HAR (log1p), XGBoost, XGBoost+Sentiment, stacking ensemble (HAR+XGB).
- Overall finding: HAR variants remain strong baselines. The log1p target improves RMSE modestly for AAPL and MSFT. XGBoost complements HAR in ensembles but is not uniformly superior alone.

What is working well?
- HAR captures low-frequency components (weekly/monthly) reliably.
- Pipelines are stable: data ingestion, feature building, training, forecasting, and plotting are reproducible and documented.
- Safety hardening: negative forecasts clipped; back-transform and unit checks added.

What is not working well?
- Models underpredict spikes (over-smoothing); predicted std << actual std across tickers.
- Directional accuracy is below the 55% target for most tickers.
- Sentiment features are noisy and help inconsistently (helps directional accuracy in some cases but often increases RMSE).

Why volatility spikes remain difficult
- Spikes are rare, heavy-tailed, and often driven by exogenous events not present in price-history features.
- HAR (linear) pools information over lags and therefore smooths; tree models partially capture non-linearity but require richer, informative features to anticipate jumps.

Which model handles regime changes best?
- The stacking ensemble (HAR + XGBoost with rolling stacking) improved RMSE modestly and is more robust across tickers — this suggests complementary strengths: HAR for baseline structure, XGB for local deviations.

Does sentiment improve forecasts?
- Mixed: finite-sample effects and sparse or noisy FinBERT signal mean sentiment helps some tickers (improves directional accuracy) but not consistently reduce RMSE. Treat sentiment as exploratory augmentation.

Is HAR still useful?
- Yes. HAR provides a stable, interpretable baseline and remains the single best standalone model for average RMSE.

Is XGBoost superior?
- Not uniformly. XGBoost alone rarely beats HAR on average RMSE, but combining XGBoost with HAR in an ensemble produces small but useful improvements.

Limitations
- Forecast variance too low (over-smoothing)
- Directional accuracy below practical trading thresholds
- Sentiment pipeline requires stronger signal or different aggregation to be reliably useful

Recommended immediate actions (presentation-mode only)
- Do not change models or add features. Focus on documentation, explanation, and showing both raw and log1p results per ticker.
- Emphasize stacking ensemble improvements and explain why spikes are inherently hard to predict.
