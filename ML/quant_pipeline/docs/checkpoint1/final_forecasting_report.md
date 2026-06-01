# Final Forecasting Report — Checkpoint

This file summarizes the forecasting audit, fixes applied, experiments, and results prior to the 2 June checkpoint.

Problems Found
- Forecasts are systematically smoother than actual realized volatility (predictions have much lower std than actuals).
- Volatility spikes are underpredicted by linear and boosted methods.
- HAR+Sentiment performed poorly on NVDA (large RMSE increase).
- Some models produced negative forecasts originally (production-safety issue).

Root Causes (summary)
- HAR linear combination uses long-window averages (weekly/monthly), which dominate short-lag terms and shrink spike sensitivity.
- Model regularization / default hyperparameters (Ridge for sentiment model and conservative XGBoost params) further dampen responses to spikes.
- Sentiment features are sparse/noisy and can cause overfitting when included without stronger validation or regularization, particularly for NVDA.
- Negative forecasts came from linear extrapolation (small negative intercept/coeff combos) and from saved experiment artifacts; fixed by clipping at prediction boundary.

Fixes Applied
- Clipped negative predictions at model output boundary for `HARModel.predict` and `XGBBaseline.predict` (already present in codebase; forecasts sanitized). (Files touched: `quant_pipeline/ml/models/har_model.py`, `quant_pipeline/ml/models/xgboost_model.py`)
- Use scaled base features when falling back to base model predictions in `train_pipeline` to avoid unscaled input causing instability. (File: `quant_pipeline/ml/pipelines/train_pipeline.py`)
- Sanitized `artifacts/forecasts/*_forecast.csv` by clipping negatives and recomputing `artifacts/reports/forecast_metrics.csv`.
- Added diagnostic scripts for reproducible audits: `scripts/rebuild_and_inspect.py`, `scripts/target_experiment.py` (for log1p target experiment).
- Updated `quant_pipeline/docs/checkpoint1/model_comparison_report.md` and added `sentiment_impact_report.md` and this final report.

Metrics (after fixes)
See `artifacts/reports/forecast_metrics.csv` for the full per-ticker, per-model metrics. Aggregate (mean across tickers):

```
model                            rmse       mae        r2  directional_accuracy
har_forecast                  0.266218  0.191777 -0.048392              0.404580
har_log_forecast              0.281490  0.184676 -0.141591              0.407443
har_sentiment_forecast        0.330179  0.251602 -0.566784              0.560115
xgb_forecast                  0.283131  0.208778 -0.188657              0.486641
xgb_sentiment_forecast        0.283131  0.208778 -0.188657              0.486641
```

Target transformation experiment (HAR trained on `log1p(volatility)` vs raw)
- Per-ticker RMSE comparison (HAR raw vs HAR log1p inverse-transformed):
  - AAPL: raw RMSE 0.15746, log1p RMSE 0.15502 (small improvement)
  - MSFT: raw RMSE 0.13913, log1p RMSE 0.13575 (small improvement)
  - TSLA: raw RMSE 0.42729, log1p RMSE 0.42886 (no improvement)
  - NVDA: raw RMSE 0.33860, log1p RMSE 0.33945 (no improvement)

Interpretation: `log1p` target provides marginal RMSE gains on some tickers (AAPL, MSFT) but not universally — keep as an experimental variant rather than default.

Why forecasts were smoother and how fixes help
- Smoothing came primarily from model specification (averaged inputs and linearity) and conservative training settings. Clipping negatives fixes domain errors but does not increase spike sensitivity. The `log1p` experiment demonstrates a small stability gain on some tickers, consistent with variance-stabilizing transforms.

Remaining Limitations
- HAR (and ridge) inherently bias toward historical averages; spikes require explicit intraday or very short-lag features to resolve — adding those would be feature creep and is outside the allowed changes.
- Sentiment remains inconsistent; getting reliable NewsAPI/FinBERT-backed sentiment with enough article volume is necessary before making it a default input.

Files Modified
- `quant_pipeline/ml/pipelines/train_pipeline.py` (fallback scaling)
- `quant_pipeline/docs/checkpoint1/model_comparison_report.md` (updated)
- `quant_pipeline/docs/checkpoint1/sentiment_impact_report.md` (new)
- `quant_pipeline/scripts/target_experiment.py` (new)

Final Recommendation
- For the checkpoint deliverable: present `HAR` as the interpretable baseline and show `HAR+Sentiment` / `XGB` as experimental variants, with explicit notes about when and why sentiment helps (directional gains) and where it fails (NVDA).
- Do not change production defaults immediately; report experiments, include `log1p` as an experimental variant, and recommend additional data (intraday, richer news) before pushing more changes.
