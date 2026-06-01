# Final Evaluation Report

## Metrics Summary
|Model|RMSE|MAE|MAPE|R2|Correlation|DirectionalAccuracy|QLIKE|
|---|---|---|---|---|---|---|---|
|HAR|0.266218|0.191777|3883893.933466|-0.048392|0.071144|0.404580|-0.362660|
|HAR + Sentiment|0.266218|0.191777|3883893.933466|-0.048392|0.071144|0.404580|-0.362660|
|XGBoost|0.283131|0.208778|2990042.914028|-0.188657|0.061842|0.486641|-0.280857|
|XGBoost + Sentiment|0.283131|0.208778|2990042.914028|-0.188657|0.061842|0.486641|-0.280857|

## Best Model
Best overall model: **HAR**
Best sentiment model: **HAR + Sentiment**
Best interpretable model: **HAR**

## Worst Model
Worst overall model by composite rank: **XGBoost + Sentiment**

## Sentiment Impact
Sentiment-enabled models were numerically identical to their base counterparts in this run because no NewsAPI key was configured, so the sentiment feature block remained constant/empty.

## Residual Analysis
|Model|Mean|Std|Skewness|Kurtosis|
|---|---|---|---|---|
|HAR|-0.008167|0.266125|2.027315|7.421193|
|HAR + Sentiment|-0.008167|0.266125|2.027315|7.421193|
|XGBoost|-0.011868|0.282875|1.534424|5.514821|
|XGBoost + Sentiment|-0.011868|0.282875|1.534424|5.514821|

## Variance Analysis
|Model|ActualStd|ForecastStd|StdRatio|
|---|---|---|---|
|HAR|0.263615|0.068049|0.276184|
|HAR + Sentiment|0.263615|0.068049|0.276184|
|XGBoost|0.263615|0.127179|0.481868|
|XGBoost + Sentiment|0.263615|0.127179|0.481868|

## Key Findings
- Most important feature: **abs_return** (0.1817)
- Least important feature: **std_sentiment** (0.0000)
- Sentiment contribution across the feature-importance analysis: **0.0000%**

## Limitations
- Sentiment features were unavailable in this run because no NewsAPI key was configured, so sentiment-specific lift could not be measured.
- XGBoost fell back to the sklearn histogram gradient boosting implementation because `xgboost` was not installed in the environment.

## Recommended Presentation Conclusions
- Use **HAR** as the headline performer.
- Emphasize that HAR remains the most interpretable and stable baseline.
- State clearly that sentiment was neutral in this run, so any sentiment gains must be validated after enabling the news pipeline.