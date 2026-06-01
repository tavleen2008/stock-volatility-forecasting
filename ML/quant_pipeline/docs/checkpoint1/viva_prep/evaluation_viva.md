# Evaluation Viva Prep

## Expected Faculty Questions
- Which metrics and why?
- How do you ensure no lookahead bias in evaluation?

## Model Answers
- Metrics: RMSE, MAE, R², Directional Accuracy, QLIKE. RMSE/MAE capture magnitude error, R² relative fit, Directional Accuracy for directional signal usefulness.
- No lookahead: features are shifted, targets built with `shift(-horizon)`, and chronological train/val/test splits are used.

## Follow-up Questions
- Why use QLIKE? (QLIKE is robust when comparing volatility forecasts because it penalizes underestimation asymmetrically.)

## Technical Deep-Dive Answers
- Metric computation uses sanitized forecasts where negative predictions are clipped; QLIKE uses clipped lower bound to avoid log of zero.
