# Feature Engineering Viva Prep

## Expected Faculty Questions
- Which features are used in HAR and XGB?
- How do you prevent lookahead and leakage?

## Model Answers
- Core features: `rv_t`, `rv_t_minus1`, `rv_daily`, `rv_weekly`, `rv_monthly`, `rv_2day_std`, `rv_3day_std`, `overnight_return`, `abs_return`, `realized_quarticity`. Sentiment features included as optional.
- Prevent leakage via `shift(1)` and building `future_realized_*` targets with `shift(-horizon)`. Chronological train/val/test split ensures no future rows in train.

## Follow-up Questions
- How do you handle NaNs from rolling windows? (Drop rows after replacing infs and NaNs; min_periods=1 used for short-window stats.)

## Technical Deep-Dive Answers
- Variance-domain and volatility-domain features are kept clearly distinct; log-variance features added for linear stability. All rolling means use proper `shift` to avoid including current-day data.
