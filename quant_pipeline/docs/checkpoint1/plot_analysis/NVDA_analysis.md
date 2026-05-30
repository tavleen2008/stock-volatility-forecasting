# NVDA Plot Analysis

## Plots referenced
- artifacts/plots/NVDA_actual_vs_forecasts.png
- artifacts/plots/NVDA_model_comparison.png
- artifacts/plots/NVDA_volatility_hist.png
- artifacts/plots/NVDA_residuals_har_forecast.png
- artifacts/plots/NVDA_residuals_xgb_forecast.png

## What This Plot Shows
- NVDA often exhibits larger swings; this file highlights why HAR+Sentiment failed for this ticker in our experiments.

## Why It Matters
- NVDA is a case-study in sentiment instability; presenters should highlight this as a cautionary example.

## What We Observe
- HAR+Sentiment produces larger errors (visible in model comparison and residuals).
- Residuals show bigger tails; sentiment did not reliably capture explanatory signals.

## Strengths
- The model suite still provides useful baseline forecasts; XGB performs comparably to HAR in this dataset.

## Limitations
- Sentiment is sparse; with default empty NewsAPI key many sentiment columns default to zero — in real runs supply a populated news dataset.

## Key Conclusions
- Avoid presenting HAR+Sentiment for NVDA as a superior model; show this as an experimental failure and discuss causes (data sparsity, noisy features).

## Presentation Talking Points
- "NVDA shows how noisy features can degrade linear models; this is why we recommend cautious use of sentiment inputs and further validation."

## Viva Questions
- Q: Why did HAR+Sentiment degrade performance? A: Overfitting to weak/noisy sentiment features and unstable coefficient allocation under ridge allowed increased variance without improving predictive magnitude.
