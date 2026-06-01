# Sentiment Model Integration Audit

## AAPL

**X_train base columns:**

rv_t, rv_t_minus1, rv_daily, rv_weekly, rv_monthly, rv_2day_std, rv_3day_std, overnight_return, abs_return, realized_quarticity

**X_train sentiment columns:**

rv_t, rv_t_minus1, rv_daily, rv_weekly, rv_monthly, rv_2day_std, rv_3day_std, overnight_return, abs_return, realized_quarticity, mean_sentiment, std_sentiment, positive_count, negative_count, neutral_count, rolling_sentiment_mean, rolling_sentiment_std, sentiment_shock

**Sentiment feature stats (train):**

- mean_sentiment: mean=0.000000, std=0.000000, min=0.000000, max=0.000000, nulls=0, nunique=1
- std_sentiment: mean=0.000000, std=0.000000, min=0.000000, max=0.000000, nulls=0, nunique=1
- positive_count: mean=0.000000, std=0.000000, min=0.000000, max=0.000000, nulls=0, nunique=1
- negative_count: mean=0.000000, std=0.000000, min=0.000000, max=0.000000, nulls=0, nunique=1
- neutral_count: mean=0.000000, std=0.000000, min=0.000000, max=0.000000, nulls=0, nunique=1
- rolling_sentiment_mean: mean=0.000000, std=0.000000, min=0.000000, max=0.000000, nulls=0, nunique=1
- rolling_sentiment_std: mean=0.000000, std=0.000000, min=0.000000, max=0.000000, nulls=0, nunique=1
- sentiment_shock: mean=0.000000, std=0.000000, min=0.000000, max=0.000000, nulls=0, nunique=1

- `np.allclose(har, har_sent)`: True
- `np.allclose(xgb, xgb_sent)`: True
- `max(abs(har - har_sent))`: 0.0
- `max(abs(xgb - xgb_sent))`: 0.0

---

## MSFT

**X_train base columns:**

rv_t, rv_t_minus1, rv_daily, rv_weekly, rv_monthly, rv_2day_std, rv_3day_std, overnight_return, abs_return, realized_quarticity

**X_train sentiment columns:**

rv_t, rv_t_minus1, rv_daily, rv_weekly, rv_monthly, rv_2day_std, rv_3day_std, overnight_return, abs_return, realized_quarticity, mean_sentiment, std_sentiment, positive_count, negative_count, neutral_count, rolling_sentiment_mean, rolling_sentiment_std, sentiment_shock

**Sentiment feature stats (train):**

- mean_sentiment: mean=0.000000, std=0.000000, min=0.000000, max=0.000000, nulls=0, nunique=1
- std_sentiment: mean=0.000000, std=0.000000, min=0.000000, max=0.000000, nulls=0, nunique=1
- positive_count: mean=0.000000, std=0.000000, min=0.000000, max=0.000000, nulls=0, nunique=1
- negative_count: mean=0.000000, std=0.000000, min=0.000000, max=0.000000, nulls=0, nunique=1
- neutral_count: mean=0.000000, std=0.000000, min=0.000000, max=0.000000, nulls=0, nunique=1
- rolling_sentiment_mean: mean=0.000000, std=0.000000, min=0.000000, max=0.000000, nulls=0, nunique=1
- rolling_sentiment_std: mean=0.000000, std=0.000000, min=0.000000, max=0.000000, nulls=0, nunique=1
- sentiment_shock: mean=0.000000, std=0.000000, min=0.000000, max=0.000000, nulls=0, nunique=1

- `np.allclose(har, har_sent)`: True
- `np.allclose(xgb, xgb_sent)`: True
- `max(abs(har - har_sent))`: 0.0
- `max(abs(xgb - xgb_sent))`: 0.0

---

## NVDA

**X_train base columns:**

rv_t, rv_t_minus1, rv_daily, rv_weekly, rv_monthly, rv_2day_std, rv_3day_std, overnight_return, abs_return, realized_quarticity

**X_train sentiment columns:**

rv_t, rv_t_minus1, rv_daily, rv_weekly, rv_monthly, rv_2day_std, rv_3day_std, overnight_return, abs_return, realized_quarticity, mean_sentiment, std_sentiment, positive_count, negative_count, neutral_count, rolling_sentiment_mean, rolling_sentiment_std, sentiment_shock

**Sentiment feature stats (train):**

- mean_sentiment: mean=0.000000, std=0.000000, min=0.000000, max=0.000000, nulls=0, nunique=1
- std_sentiment: mean=0.000000, std=0.000000, min=0.000000, max=0.000000, nulls=0, nunique=1
- positive_count: mean=0.000000, std=0.000000, min=0.000000, max=0.000000, nulls=0, nunique=1
- negative_count: mean=0.000000, std=0.000000, min=0.000000, max=0.000000, nulls=0, nunique=1
- neutral_count: mean=0.000000, std=0.000000, min=0.000000, max=0.000000, nulls=0, nunique=1
- rolling_sentiment_mean: mean=0.000000, std=0.000000, min=0.000000, max=0.000000, nulls=0, nunique=1
- rolling_sentiment_std: mean=0.000000, std=0.000000, min=0.000000, max=0.000000, nulls=0, nunique=1
- sentiment_shock: mean=0.000000, std=0.000000, min=0.000000, max=0.000000, nulls=0, nunique=1

- `np.allclose(har, har_sent)`: True
- `np.allclose(xgb, xgb_sent)`: True
- `max(abs(har - har_sent))`: 0.0
- `max(abs(xgb - xgb_sent))`: 0.0

---

## TSLA

**X_train base columns:**

rv_t, rv_t_minus1, rv_daily, rv_weekly, rv_monthly, rv_2day_std, rv_3day_std, overnight_return, abs_return, realized_quarticity

**X_train sentiment columns:**

rv_t, rv_t_minus1, rv_daily, rv_weekly, rv_monthly, rv_2day_std, rv_3day_std, overnight_return, abs_return, realized_quarticity, mean_sentiment, std_sentiment, positive_count, negative_count, neutral_count, rolling_sentiment_mean, rolling_sentiment_std, sentiment_shock

**Sentiment feature stats (train):**

- mean_sentiment: mean=0.000000, std=0.000000, min=0.000000, max=0.000000, nulls=0, nunique=1
- std_sentiment: mean=0.000000, std=0.000000, min=0.000000, max=0.000000, nulls=0, nunique=1
- positive_count: mean=0.000000, std=0.000000, min=0.000000, max=0.000000, nulls=0, nunique=1
- negative_count: mean=0.000000, std=0.000000, min=0.000000, max=0.000000, nulls=0, nunique=1
- neutral_count: mean=0.000000, std=0.000000, min=0.000000, max=0.000000, nulls=0, nunique=1
- rolling_sentiment_mean: mean=0.000000, std=0.000000, min=0.000000, max=0.000000, nulls=0, nunique=1
- rolling_sentiment_std: mean=0.000000, std=0.000000, min=0.000000, max=0.000000, nulls=0, nunique=1
- sentiment_shock: mean=0.000000, std=0.000000, min=0.000000, max=0.000000, nulls=0, nunique=1

- `np.allclose(har, har_sent)`: True
- `np.allclose(xgb, xgb_sent)`: True
- `max(abs(har - har_sent))`: 0.0
- `max(abs(xgb - xgb_sent))`: 0.0

---

