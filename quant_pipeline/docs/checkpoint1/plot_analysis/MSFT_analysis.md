# MSFT Plot Analysis

## Plots referenced
- artifacts/plots/MSFT_actual_vs_forecasts.png
- artifacts/plots/MSFT_model_comparison.png
- artifacts/plots/MSFT_volatility_hist.png
- artifacts/plots/MSFT_residuals_har_forecast.png
- artifacts/plots/MSFT_residuals_xgb_forecast.png

## What This Plot Shows
- Same suite as AAPL: actual vs forecasts, model comparison, distribution and residuals.

## Why It Matters
- Check whether model behaviours generalize across tickers; MSFT shows similar smoothing and directional behavior.

## What We Observe
- Forecasts are smooth; HAR+Sentiment occasionally improves directionality.
- Residuals show modest bias; heteroskedasticity present but less extreme than high-volatility tickers.

## Strengths
- Stable baseline performance; metrics show small RMSE improvements possible with log-target transforms.

## Limitations
- Sentiment impact is inconsistent; careful interpretation required.

## Key Conclusions
- Present MSFT results to show consistent baseline behavior and to illustrate where sentiment helps with direction.

## Presentation Talking Points
- "MSFT demonstrates similar model dynamics as AAPL but with slightly lower volatility; the evaluation shows small gains from log-target transforms."

## Viva Questions
- Q: Why try log-transform on target? A: Stabilizes variance and can improve linear model fit for asymmetric distributions; we tested `log1p` and observed small gains for MSFT.
