"""Time-series hyperparameter tuning for boosted baseline per ticker.
Saves best model per ticker to artifacts/models/{TICKER}_xgb_best.joblib
"""
from __future__ import annotations

import logging
import os
from pathlib import Path
import joblib
import numpy as np
import pandas as pd

from sklearn.model_selection import TimeSeriesSplit, RandomizedSearchCV
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import make_scorer
from sklearn.model_selection import cross_val_score

from ml.data.data_config import DataConfig
from ml.data.market_data_loader import download_market_data, compute_realized_variance, compute_realized_volatility
from ml.features.feature_builder import FeatureBuilder
from ml.models.xgboost_model import XGBBaseline

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

config = DataConfig()
fb = FeatureBuilder()

# scoring using negative RMSE
from sklearn.metrics import mean_squared_error

def neg_rmse(y_true, y_pred):
    return -np.sqrt(mean_squared_error(y_true, y_pred))

neg_rmse_scorer = make_scorer(neg_rmse, greater_is_better=True)

# param distributions for XGBoost and HistGB fallback
param_dist_xgb = {
    'model__n_estimators': [100, 200, 400],
    'model__max_depth': [2, 3, 4, 6],
    'model__learning_rate': [0.01, 0.03, 0.05, 0.1],
    'model__subsample': [0.6, 0.8, 1.0],
    'model__colsample_bytree': [0.6, 0.8, 1.0],
}

param_dist_histgb = {
    'model__max_iter': [100, 200, 400],
    'model__max_depth': [None, 3, 5],
    'model__learning_rate': [0.01, 0.05, 0.1],
}

out_dir = Path('artifacts') / 'models'
out_dir.mkdir(parents=True, exist_ok=True)

for ticker in config.tickers:
    print('\n' + '='*60)
    print('Tuning', ticker)
    print('='*60)

    market_df = download_market_data(ticker, str(config.start_date), str(config.end_date), interval='1d')
    if market_df.empty:
        print('No market data for', ticker)
        continue
    market_df['realized_variance'] = compute_realized_variance(market_df)
    market_df['realized_volatility'] = compute_realized_volatility(market_df['realized_variance'])

    # sentiment not required for tuning baseline — pass an empty DataFrame with 'date' to avoid merge KeyError
    empty_sentiment = pd.DataFrame(columns=['date'])
    features = fb.build_features(market_df, empty_sentiment, config.forecast_horizon)
    if features.empty:
        print('No features for', ticker)
        continue

    train, val, test = fb.train_validation_test_split(features)

    base_features = [
        'rv_t', 'rv_t_minus1', 'rv_daily', 'rv_weekly', 'rv_monthly',
        'rv_2day_std', 'rv_3day_std', 'overnight_return', 'abs_return', 'realized_quarticity'
    ]

    X_train = train[base_features]
    y_train = train['future_realized_volatility']

    # pipeline: scaler + model
    xgb_wrapper = XGBBaseline()

    from sklearn.base import BaseEstimator, RegressorMixin
    # Make wrapper compatible with sklearn API by exposing model attribute
    model = xgb_wrapper.model

    pipeline = Pipeline([
        ('scaler', StandardScaler()),
        ('model', model)
    ])

    tscv = TimeSeriesSplit(n_splits=5)

    # choose param grid based on actual model class name
    model_name = type(model).__name__
    if model_name == 'XGBRegressor':
        param_dist = param_dist_xgb
    else:
        # sklearn HistGradientBoostingRegressor params
        # map XGB names to sklearn counterparts
        param_dist = param_dist_histgb

    search = RandomizedSearchCV(
        pipeline,
        param_distributions=param_dist,
        n_iter=12,
        cv=tscv,
        scoring=neg_rmse_scorer,
        random_state=42,
        n_jobs=1,
        verbose=1,
    )

    print('Starting RandomizedSearchCV...')
    search.fit(X_train, y_train)
    print('Best score (neg RMSE):', search.best_score_)
    print('Best params:', search.best_params_)

    # Save the best pipeline
    out_path = out_dir / f"{ticker}_xgb_best.joblib"
    joblib.dump(search.best_estimator_, out_path)
    print('Saved best model to', out_path)

print('\nTuning complete')
