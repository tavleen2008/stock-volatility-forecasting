Model Comparison Report — Checkpoint 1

This report summarizes the primary forecast-quality metrics for the evaluated model variants across four tickers. Metrics are taken from `artifacts/reports/model_quality_tests.csv`.

Models evaluated: HAR, HAR + Sentiment, HAR (log1p), XGBoost, XGBoost + Sentiment.

Per-ticker summary (RMSE / MAE / R² / Directional Accuracy):

AAPL
- HAR (raw): 0.157683 / 0.117242 / -0.069 / 44.06%
- HAR+Sent (raw): 0.173453 / 0.128835 / -0.294 / 62.84%
- HAR (log1p): 0.155289 / 0.114222 / -0.037 / 42.91%
- XGB (raw): 0.163668 / 0.120452 / -0.152 / 49.81%

MSFT
- HAR (raw): 0.140161 / 0.106159 / -0.139 / 37.55%
- HAR+Sent (raw): 0.140258 / 0.108532 / -0.141 / 64.75%
- HAR (log1p): 0.136302 / 0.102711 / -0.077 / 38.31%
- XGB (raw): 0.152911 / 0.116210 / -0.356 / 42.91%

TSLA
- HAR (raw): 0.431325 / 0.296484 / -0.024 / 39.46%
- HAR+Sent (raw): 0.434835 / 0.309422 / -0.041 / 62.45%
- HAR (log1p): 0.432087 / 0.287479 / -0.028 / 40.23%
- XGB (raw): 0.458449 / 0.330049 / -0.157 / 51.72%

NVDA
- HAR (raw): 0.335702 / 0.247222 / 0.039 / 39.85%
- HAR+Sent (raw): 0.572170 / 0.459619 / -1.792 / 33.33%
- HAR (log1p): 0.336805 / 0.242855 / 0.033 / 42.53%
- XGB (raw): 0.357497 / 0.268399 / -0.090 / 49.43%

Aggregate (average RMSE across tickers):
- HAR (log1p): 0.26512
- HAR (raw): 0.26622
- XGB (log1p): 0.27937
- XGB (raw): 0.28313

Best models:
- Best overall (avg RMSE): HAR (log1p)
- Best per-stock by RMSE: AAPL=HAR(log1p), MSFT=HAR(log1p), TSLA=HAR(raw), NVDA=HAR(raw)

Notes:
- Sentiment is inconsistent: it increases directional accuracy for some tickers (e.g., MSFT) but often increases RMSE (NVDA). Use sentiment as an optional augmentation for analysis rather than canonical forecasting output.
- Directional-accuracy target (>55%) is not met consistently; stacking improved results modestly (see `artifacts/reports/stacking_summary.csv`).
