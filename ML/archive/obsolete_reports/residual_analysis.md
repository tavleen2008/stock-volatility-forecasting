# Residual Analysis

## Model-Level Residual Summary
|Model|Mean|Std|Min|Max|Skewness|Kurtosis|
|---|---|---|---|---|---|---|
|HAR|-0.008167|0.266125|-0.441520|1.652879|2.027315|7.421193|
|HAR + Sentiment|-0.008167|0.266125|-0.441520|1.652879|2.027315|7.421193|
|XGBoost|-0.011868|0.282875|-0.625781|1.670874|1.534424|5.514821|
|XGBoost + Sentiment|-0.011868|0.282875|-0.625781|1.670874|1.534424|5.514821|

## Interpretation
- Residuals are centered near zero when mean residual is close to zero.
- Lower standard deviation indicates tighter forecasts.
- Higher skewness or kurtosis indicates asymmetry or heavy tails in the forecast error distribution.

## Practical Reading
The finalized models show the expected pattern: HAR is the most stable baseline, while boosted-tree forecasts are more variable but can better adapt to spikes.