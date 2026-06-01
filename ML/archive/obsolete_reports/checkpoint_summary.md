# Checkpoint Summary

## 1. Project Objective
Forecast stock volatility for AAPL, MSFT, TSLA, and NVDA using HAR, HAR + Sentiment, XGBoost, and XGBoost + Sentiment.

## 2. Methodology
Download market data, engineer HAR-style lag features and sentiment features, train the finalized model set, and evaluate using RMSE, MAE, MAPE, R², correlation, directional accuracy, and QLIKE.

## 3. Models Used
- HAR
- HAR + Sentiment
- XGBoost
- XGBoost + Sentiment

## 4. Results
|Ticker|Model|RMSE|MAE|Correlation|DirectionalAccuracy|QLIKE|
|---|---|---|---|---|---|---|
|AAPL|HAR|0.157683|0.117242|0.036929|0.442748|-0.802053|
|MSFT|HAR|0.140161|0.106159|-0.004408|0.377863|-0.881417|
|NVDA|HAR|0.335702|0.247222|0.214272|0.400763|0.031425|
|TSLA|HAR|0.431325|0.296484|0.037782|0.396947|0.201405|

## 5. Best-Performing Model
Best overall model: **HAR**

## 6. Did Sentiment Improve Forecasting?
No measurable improvement in this run because the news pipeline had no NewsAPI key configured, so sentiment features were constant and the sentiment models matched the base models.

## 7. Future Improvements
- Enable the news API and rerun the same evaluation to measure sentiment lift.
- Compare the finalized pipeline against an out-of-sample holdout with a longer date window.
- Re-check XGBoost once the native package is available.