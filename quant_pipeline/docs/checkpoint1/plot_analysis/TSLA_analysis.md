# TSLA Plot Analysis

## Plots referenced
- artifacts/plots/TSLA_actual_vs_forecasts.png
- artifacts/plots/TSLA_model_comparison.png
- artifacts/plots/TSLA_volatility_hist.png
- artifacts/plots/TSLA_residuals_har_forecast.png
- artifacts/plots/TSLA_residuals_xgb_forecast.png

## What This Plot Shows
- High-volatility ticker behaviour and model responses.

## Why It Matters
- TSLA's larger volatility showcases model limitations in extreme regimes.

## What We Observe
- Model predictions track broad swings but fail to capture highest spikes in magnitude.
- Residuals are more dispersed; XGB shows slightly better tail responsiveness but not consistently.

## Strengths
- Directional accuracy improves with sentiment in TSLA, but RMSE stays similar.

## Limitations
- Without intraday variance or stronger short-lag features, spikes remain underpredicted.

## Key Conclusions
- Use TSLA as an example of where model selection and feature engineering matter most for spike capture.

## Presentation Talking Points
- "TSLA demonstrates the persistent challenge in capturing episodic volatility. This motivates future data collection (intraday) rather than model churn."

## Viva Questions
- Q: Are residuals stationary? A: The residual variance varies; formal tests can be added, but plots indicate heteroskedasticity.
