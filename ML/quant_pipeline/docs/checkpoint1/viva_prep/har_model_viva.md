# HAR Model Viva Prep

## Expected Faculty Questions
- What is the HAR specification and why is it appropriate?
- How are coefficients interpreted financially?

## Model Answers
- HAR uses daily, weekly (5-day mean), monthly (22-day mean) realized volatility to capture heterogeneous trader horizons. Coefficients represent sensitivity of next-day volatility to each horizon.
- Intercept captures baseline volatility; positive coefficients imply positive persistence. Large weekly/monthly coefficients indicate mean-reversion scale.

## Follow-up Questions
- Why use log-variance HAR? (Stabilizes heavy tails and keeps predictions positive upon back-transform.)

## Technical Deep-Dive Answers
- We fit linear or Ridge regression. Coefficients may be inspected via `model.coef_`; evidence shows weekly/monthly features often dominate, explaining smoother forecasts.
