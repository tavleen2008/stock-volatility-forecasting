# FinBERT Viva Prep

## Expected Faculty Questions
- How is sentiment derived and aggregated?
- What are the fallbacks when FinBERT is unavailable?

## Model Answers
- Article-level sentiment via FinBERT pipeline producing `sentiment_score` and label; daily aggregation computes mean, std, counts, rolling mean/std and `sentiment_shock`.
- Fallback: heuristic token-based scoring producing a signed score in [-1,1]; pipeline warns when NewsAPI key missing and fills sentiment with zeros.

## Follow-up Questions
- How sensitive are results to the rolling window? (We use a 5-day rolling window; sensitivity analysis can be added.)
- How to validate sentiment quality? (Manual labeling, comparing to event dates and price reactions, ablation tests.)

## Technical Deep-Dive Answers
- The aggregation uses `rolling(window=5)` to compute `rolling_sentiment_mean` and `std`, then `sentiment_shock = mean - rolling_mean`. This captures short-lived sentiment spikes.
