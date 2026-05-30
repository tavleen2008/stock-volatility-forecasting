# HAR Model — Study Notes

## Purpose
Provide a simple, interpretable baseline for volatility forecasting using lagged heterogeneous returns/volatility.

## Theory
HAR models decompose volatility into components at different horizons (daily, weekly, monthly) and linearly combine them.

## Mathematics
- Model: vol_{t+1} = a + b_d * vol_t + b_w * vol_{t-1..t-4 avg} + b_m * vol_{t-22..} + eps

## Line-by-line explanation
- `HARModel.fit` expects feature columns matching the chosen lags; model uses `LinearRegression` or `Ridge`.

## Interview / Viva Questions
- Q: Why does HAR underpredict spikes? A: HAR is linear and relies on historical averages; spikes are heavy-tailed and may need nonlinear models or spike-specific features.

## Common Mistakes
- Unit mismatch between variance-domain features and volatility targets; always ensure consistent units.

## Expected Faculty Questions
- Q: How did you validate no leakage? A: Chronological train/val/test split; features use shifted lags; future targets use negative shifts.

---
