# Final Model Comparison Report

This report presents the comparative metrics of the five baseline model configurations across AAPL, MSFT, NVDA, and TSLA.

## AAPL Comparison

| Model | RMSE Rank | R² | Correlation | QLIKE |
|---|---|---|---|---|
| HAR | #1 (0.157683) | -0.069168 | 0.036929 | -0.802053 |
| HAR Log | #2 (0.160668) | -0.110028 | -0.008962 | -0.723335 |
| HAR+Sentiment | #3 (0.161310) | -0.118911 | -0.031641 | -0.781521 |
| XGB | #4 (0.175183) | -0.319646 | 0.047505 | 66925.514312 |
| XGB+Sentiment | #5 (0.181882) | -0.422499 | -0.083607 | 35687.627293 |

## MSFT Comparison

| Model | RMSE Rank | R² | Correlation | QLIKE |
|---|---|---|---|---|
| HAR | #1 (0.140161) | -0.139110 | -0.004408 | -0.881417 |
| HAR Log | #2 (0.141793) | -0.165788 | -0.028467 | -0.779918 |
| HAR+Sentiment | #3 (0.142485) | -0.177193 | -0.039826 | -0.851492 |
| XGB+Sentiment | #4 (0.153868) | -0.372798 | -0.037434 | 60963.011346 |
| XGB | #5 (0.165393) | -0.586151 | -0.062073 | 119975.251332 |

## NVDA Comparison

| Model | RMSE Rank | R² | Correlation | QLIKE |
|---|---|---|---|---|
| HAR | #1 (0.335702) | 0.038997 | 0.214272 | 0.031425 |
| HAR+Sentiment | #2 (0.339386) | 0.017786 | 0.185893 | 0.043094 |
| HAR Log | #3 (0.362433) | -0.120145 | 0.185459 | 0.156540 |
| XGB+Sentiment | #4 (0.368341) | -0.156961 | 0.088725 | 0.280624 |
| XGB | #5 (0.373733) | -0.191079 | 0.158350 | 45645.070882 |

## TSLA Comparison

| Model | RMSE Rank | R² | Correlation | QLIKE |
|---|---|---|---|---|
| HAR | #1 (0.431325) | -0.024289 | 0.037782 | 0.201405 |
| HAR+Sentiment | #2 (0.435116) | -0.042376 | 0.015993 | 0.213856 |
| HAR Log | #3 (0.461064) | -0.170403 | 0.074782 | 0.367307 |
| XGB+Sentiment | #4 (0.471079) | -0.221800 | 0.034609 | 215117.069777 |
| XGB | #5 (0.477643) | -0.256089 | 0.099021 | 548776.394231 |

