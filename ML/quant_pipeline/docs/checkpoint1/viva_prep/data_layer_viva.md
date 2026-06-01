# Data Layer Viva Prep

## Expected Faculty Questions
- How do you compute realized variance and realized volatility?
- How do you handle missing market data and timezone issues?

## Model Answers
- Realized variance: sum of squared intraday log returns when intraday available; fallback to squared daily log returns. Realized volatility: annualized sqrt(variance*252).
- Missing data: `yfinance` rows are timezone-normalized and `tz_localize(None)` applied; pipeline merges sentiment on floored dates and fills missing sentiment with zeros. Chronological splits enforce no leakage.

## Follow-up Questions
- Why annualize with 252? (Trading days convention)
- How would intraday aggregation change features? (We'd compute per-day RV via sum of intraday squared returns; more responsive to spikes.)

## Technical Deep-Dive Answers
- The pipeline uses `compute_realized_variance` that checks for intraday timestamps and groups by floor('D') when present; this prevents mixing intraday and daily contexts.
