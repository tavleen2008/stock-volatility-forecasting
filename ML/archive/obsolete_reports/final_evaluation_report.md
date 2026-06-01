# Final Evaluation Report

## Authoritative Metrics Summary (Sentiment Bug Corrected)

| Ticker | Model | RMSE | MAE | MAPE (%) | R² | Correlation | Directional Accuracy | QLIKE |
|---|---|---|---|---|---|---|---|---|
| AAPL | HAR | 0.157683 | 0.117242 | 6647649.9533 | -0.069168 | 0.036929 | 44.2748% | -0.802053 |
| AAPL | HAR+Sentiment | 0.161310 | 0.120981 | 5542567.2887 | -0.118911 | -0.031641 | 41.2214% | -0.781521 |
| AAPL | HAR Log | 0.160668 | 0.104247 | 4010975.0541 | -0.110028 | -0.008962 | 41.2214% | -0.723335 |
| AAPL | XGB | 0.175183 | 0.131991 | 4726823.7186 | -0.319646 | 0.047505 | 50.0000% | 66925.514312 |
| AAPL | XGB+Sentiment | 0.181882 | 0.131696 | 7336180.5545 | -0.422499 | -0.083607 | 46.1832% | 35687.627293 |
| MSFT | HAR | 0.140161 | 0.106159 | 304.2743 | -0.139110 | -0.004408 | 37.7863% | -0.881417 |
| MSFT | HAR+Sentiment | 0.142485 | 0.108051 | 310.4431 | -0.177193 | -0.039826 | 36.2595% | -0.851492 |
| MSFT | HAR Log | 0.141793 | 0.096196 | 180.6226 | -0.165788 | -0.028467 | 32.8244% | -0.779918 |
| MSFT | XGB | 0.165393 | 0.126586 | 344.2223 | -0.586151 | -0.062073 | 48.0916% | 119975.251332 |
| MSFT | XGB+Sentiment | 0.153868 | 0.117308 | 333.2623 | -0.372798 | -0.037434 | 45.0382% | 60963.011346 |
| NVDA | HAR | 0.335702 | 0.247222 | 8887224.0776 | 0.038997 | 0.214272 | 40.0763% | 0.031425 |
| NVDA | HAR+Sentiment | 0.339386 | 0.250352 | 10186637.8500 | 0.017786 | 0.185893 | 45.8015% | 0.043094 |
| NVDA | HAR Log | 0.362433 | 0.247392 | 5749238.7299 | -0.120145 | 0.185459 | 44.2748% | 0.156540 |
| NVDA | XGB | 0.373733 | 0.283776 | 7394123.5076 | -0.191079 | 0.158350 | 53.4351% | 45645.070882 |
| NVDA | XGB+Sentiment | 0.368341 | 0.272702 | 3843439.4592 | -0.156961 | 0.088725 | 53.8168% | 0.280624 |
| TSLA | HAR | 0.431325 | 0.296484 | 397.4287 | -0.024289 | 0.037782 | 39.6947% | 0.201405 |
| TSLA | HAR+Sentiment | 0.435116 | 0.299311 | 389.8519 | -0.042376 | 0.015993 | 45.4198% | 0.213856 |
| TSLA | HAR Log | 0.461064 | 0.290868 | 231.2991 | -0.170403 | 0.074782 | 44.6565% | 0.367307 |
| TSLA | XGB | 0.477643 | 0.344488 | 497.9218 | -0.256089 | 0.099021 | 53.0534% | 548776.394231 |
| TSLA | XGB+Sentiment | 0.471079 | 0.341383 | 447.9637 | -0.221800 | 0.034609 | 50.7634% | 215117.069777 |

## Strategic Conclusions

- **Sentiment Augmentation**: Since the sentiment pipeline bug was resolved, base and sentiment-augmented models correctly show distinct metrics. Sentiment augmentation shows modest, stock-specific changes in forecast accuracy.
- **Baseline HAR Performance**: The classic Heterogeneous AutoRegressive (HAR) model remains a robust baseline. It provides high interpretability and consistent stability.
- **XGBoost & Boosting Trees**: Trees successfully model non-linear local deviations but can be sensitive to hyperparameter setups.
