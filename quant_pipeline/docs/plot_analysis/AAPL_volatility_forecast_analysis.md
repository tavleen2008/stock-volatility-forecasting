## AAPL — Actual vs Forecast Volatility

**What this plot shows**
- Actual realized volatility vs model forecasts (HAR, HAR+Sentiment, HAR_log, XGB).

**Why this plot matters**
- Visual check for bias, lag, and spike-capture ability.

**How to interpret it**
- Lines close together: good fit. Large lags or flat forecasts: underfitting.

**Good signs**
- Forecasts that follow trend and increase during volatility spikes.

**Bad signs**
- Constant or near-constant forecasts; missed spikes where actual >> forecast.

**Conclusions (from diagnostics)**
- HAR shows low correlation (≈0.037) with test volatility and underpredicts 95th-percentile spikes (avg forecast ≈0.173 vs actual ≈0.611).
- Log-variance HAR captures relative changes better but underpredicts absolute spike magnitudes after back-transform.
- Sentiment features were constant (no NewsAPI key) and did not improve forecasts.

**Presentation Talking Points**
- 30s: HAR is a simple, interpretable baseline that captures baseline volatility but struggles with extreme spikes; log-variance helps relative dynamics.
- 1m: Explain unit consistency fix — features were variance-domain while targets were volatility; we harmonized units and re-ran diagnostics, improving coefficient stability.

**Viva Qs**
- Why underprediction persists? (Answer: HAR is linear and averages past vol; extreme spikes are heavy-tailed and require nonlinear features or models.)

---
