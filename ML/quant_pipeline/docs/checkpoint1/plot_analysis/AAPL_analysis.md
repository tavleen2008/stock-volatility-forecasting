# AAPL Plot Analysis

## Plots referenced
- artifacts/plots/AAPL_actual_vs_forecasts.png
- artifacts/plots/AAPL_model_comparison.png
- artifacts/plots/AAPL_volatility_hist.png
- artifacts/plots/AAPL_residuals_har_forecast.png
- artifacts/plots/AAPL_residuals_xgb_forecast.png

## What These Plots Show
- Actual vs forecasts: time series comparison of realized volatility and model forecasts (HAR, HAR+Sentiment, HAR Log, XGB variants).
- Model comparison: overlays forecasts to visually compare magnitude and timing.
- Volatility histogram: distribution of realized volatility values (shows tail behaviour).
- Residual plots: prediction errors for HAR and XGB (diagnose heteroskedasticity and bias).

## Why It Matters
- Visual confirmation of model fit, spike capture, and bias helps validate numerical metrics.
- Residual patterns reveal systematic under/over-prediction and heteroskedastic errors.

## What We Observe
- Forecasts are generally smoother than realized volatility; large spikes are underpredicted.
- HAR and HAR Log track baseline variation but damp extreme moves.
- Residuals show heavier tails on positive errors (models underpredict spikes).

## Strengths
- HAR provides a stable, interpretable baseline; XGB gives similar magnitude but not clearly better spike capture.
- Directional moves are captured reasonably well when averaged.

## Limitations
- Spike underprediction is persistent; residual distribution is heavy-tailed.
- HAR+Sentiment improves directional accuracy but increases RMSE on some windows (trade-off visible in model comparison plot).

## Key Conclusions
- Use HAR as primary explainable baseline for presentation.
- Use model comparison plot to highlight directional improvements from sentiment (AAPL shows improved DA).

## Presentation Talking Points
- "The HAR baseline is robust and interpretable. We see it underestimates rare spikes, which is expected from a model relying on averaged lag features."
- "Sentiment helps directionally for AAPL but comes with higher magnitude error — evidence of a trade-off that we'll highlight." 

## Viva Questions
- Q: Why are spikes underpredicted? A: HAR uses lagged averages which smooth short-term shocks; without intraday data or short-lag returns, spikes are difficult to predict.
- Q: How would you improve spike capture? A: Add intraday realized variance features, very short-lag returns, or a regime-switching model — out-of-scope for this checkpoint.
