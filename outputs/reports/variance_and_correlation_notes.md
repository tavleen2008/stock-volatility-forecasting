# Variance and Correlation Notes

## Over/Under smoothing rule
- StdRatio < 0.8: over-smoothed
- 0.8 <= StdRatio <= 1.2: reasonably calibrated
- StdRatio > 1.2: under-smoothed

## Aggregate smoothing state
- HAR: 0.276 -> Over-smoothed
- HAR + Sentiment: 0.276 -> Over-smoothed
- XGBoost: 0.482 -> Over-smoothed
- XGBoost + Sentiment: 0.482 -> Over-smoothed