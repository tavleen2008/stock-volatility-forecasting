from pathlib import Path

import joblib
import pandas as pd
from sklearn.preprocessing import StandardScaler

from ml.data.data_config import DataConfig
from ml.data.market_data_loader import (
download_market_data,
compute_realized_variance,
compute_realized_volatility,
)
from ml.features.feature_builder import FeatureBuilder
from ml.models.har_model import HARModel

def main():

    config = DataConfig()

    ticker = config.tickers[0]

    market_df = download_market_data(
        ticker,
        str(config.start_date),
        str(config.end_date),
        interval="1d",
    )

    market_df["realized_variance"] = compute_realized_variance(
        market_df
    )

    market_df["realized_volatility"] = compute_realized_volatility(
        market_df["realized_variance"]
    )

    features = FeatureBuilder().build_features(
        market_df=market_df,
        sentiment_daily_df=pd.DataFrame(),
        forecast_horizon=config.forecast_horizon,
    )

    train, _, _ = FeatureBuilder().train_validation_test_split(
        features
    )

    feature_columns = [
        "rv_t",
        "rv_t_minus1",
        "rv_daily",
        "rv_weekly",
        "rv_monthly",
        "rv_2day_std",
        "rv_3day_std",
        "overnight_return",
        "abs_return",
        "realized_quarticity",
    ]

    X = train[feature_columns]

    y = train["future_realized_volatility"]

    scaler = StandardScaler()

    X_scaled = pd.DataFrame(
        scaler.fit_transform(X),
        columns=feature_columns,
        index=X.index,
    )

    model = HARModel(
        use_sentiment=False,
        estimator="linear",
        feature_columns=feature_columns,
    )

    model.fit(X_scaled, y)

    Path("artifacts/models").mkdir(
        parents=True,
        exist_ok=True,
    )

    model.save(
        "artifacts/models/har_model.joblib"
    )

    joblib.dump(
        scaler,
        "artifacts/models/har_scaler.joblib"
    )

    print("HAR model exported")
    
if "__name__" == "__main__":
    main()
