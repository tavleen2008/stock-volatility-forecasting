# log1p Target Comparison

Comparison of RMSE before (raw target) and after (log1p target back-transformed).

## AAPL

| Model | RMSE before | RMSE after | Delta |
|---|---:|---:|---:|
| HAR | 0.157683 | 0.155289 | -0.002394 |
| HAR+Sent | 0.173453 | 0.155289 | -0.018164 |
| XGB | 0.163668 | 0.162940 | -0.000728 |
| XGB+Sent | 0.163668 | 0.162940 | -0.000728 |

## MSFT

| Model | RMSE before | RMSE after | Delta |
|---|---:|---:|---:|
| HAR | 0.140161 | 0.136302 | -0.003860 |
| HAR+Sent | 0.140258 | 0.136302 | -0.003957 |
| XGB | 0.152911 | 0.148073 | -0.004838 |
| XGB+Sent | 0.152911 | 0.148073 | -0.004838 |

## NVDA

| Model | RMSE before | RMSE after | Delta |
|---|---:|---:|---:|
| HAR | 0.335702 | 0.336805 | +0.001103 |
| HAR+Sent | 0.572170 | 0.336805 | -0.235366 |
| XGB | 0.357497 | 0.357434 | -0.000063 |
| XGB+Sent | 0.357497 | 0.357434 | -0.000063 |

## TSLA

| Model | RMSE before | RMSE after | Delta |
|---|---:|---:|---:|
| HAR | 0.431325 | 0.432087 | +0.000762 |
| HAR+Sent | 0.434835 | 0.432087 | -0.002748 |
| XGB | 0.458449 | 0.449017 | -0.009433 |
| XGB+Sent | 0.458449 | 0.449017 | -0.009433 |

Summary: `log1p` provided small RMSE improvements for AAPL and MSFT, negligible effects for XGB overall, and mixed results for NVDA/TSLA.
