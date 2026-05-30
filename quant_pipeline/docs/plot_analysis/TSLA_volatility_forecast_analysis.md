## TSLA — Actual vs Forecast Volatility

**What this plot shows**
- Actual realized volatility vs model forecasts.

**Conclusions (from diagnostics)**
- HAR tracks the mean well but misses spike magnitudes (avg forecast ≈0.431 vs actual ≈1.75 during spikes).
- Consider nonlinear models (XGBoost, LSTM) or spike-specific features to capture heavy tails.

**Presentation Talking Points**
- TSLA exhibits the largest spike behavior; discuss future work: GARCH, extreme-value features, or regime-switching.

---
