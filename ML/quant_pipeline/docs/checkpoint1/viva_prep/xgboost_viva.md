# XGBoost Viva Prep

## Expected Faculty Questions
- Why include XGBoost if HAR is primary?
- How do you avoid overfitting with boosted trees?

## Model Answers
- XGBoost acts as a nonlinear benchmark to test whether nonlinear interactions or threshold effects improve forecasts.
- Avoid overfitting with early stopping, conservative hyperparameters, and using hold-out test metrics. In this checkpoint we used conservative defaults and a joblib-persisted tuned model if available.

## Follow-up Questions
- How do you interpret feature importance? (Use built-in importance or SHAP for deeper interpretability.)

## Technical Deep-Dive Answers
- Missing values are not expected in scaled inputs; the fallback `HistGradientBoostingRegressor` handles missing values differently — we ensure scaled and aligned inputs before training.
