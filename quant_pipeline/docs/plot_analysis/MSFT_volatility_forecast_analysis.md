## MSFT — Actual vs Forecast Volatility

**What this plot shows**
- Actual realized volatility vs model forecasts (HAR, HAR+Sentiment, HAR_log, XGB).

**Why this plot matters**
- Visual check for bias, lag, and spike-capture ability.

**Conclusions (from diagnostics)**
- HAR correlation with test volatility is near zero; log-HAR improves relative alignment slightly.
- Sentiment absent; no impact.

**Presentation Talking Points**
- Emphasize unit-consistency fix and why log-variance modeling helps capture multiplicative dynamics.

---
