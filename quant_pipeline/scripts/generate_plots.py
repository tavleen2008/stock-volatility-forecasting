"""Generate diagnostic and comparison plots for each ticker.

Saves plots to `artifacts/plots` and markdown summaries to `quant_pipeline/docs/plot_analysis`.
"""
from __future__ import annotations
import os, sys
# Use a local sqlite DB for plotting scripts to avoid requiring PostgreSQL
os.environ.setdefault('DATABASE_URL', 'sqlite:///./temp.db')
# project root is two levels up from this script (stock-volatility-forecasting)
from pathlib import Path as _Path
# PACKAGE_ROOT points to the `quant_pipeline` package directory so `ml` imports resolve
PACKAGE_ROOT = _Path(__file__).resolve().parents[1]
REPO_ROOT = PACKAGE_ROOT.parent
if str(PACKAGE_ROOT) not in sys.path:
    sys.path.insert(0, str(PACKAGE_ROOT))

from ml.data.data_config import DataConfig
from ml.data.market_data_loader import download_market_data, compute_realized_variance, compute_realized_volatility
from ml.features.feature_builder import FeatureBuilder
from ml.models.har_model import HARModel
from ml.models.xgboost_model import XGBBaseline

import joblib
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from pathlib import Path

try:
    import seaborn as sns
    sns.set_theme(style='whitegrid', palette='tab10')
    HAS_SEABORN = True
except Exception:
    HAS_SEABORN = False

# ensure matplotlib figures use a light, presentation-friendly background
plt.rcParams.update({
    'figure.facecolor': 'white',
    'axes.facecolor': 'white',
    'axes.edgecolor': '#333333',
    'axes.grid': True,
    'grid.color': '#e6e6e6',
    'legend.frameon': False,
})

config = DataConfig()
fb = FeatureBuilder()

OUT_PLOTS = REPO_ROOT / 'artifacts' / 'plots'
DOCS_DIR = PACKAGE_ROOT / 'docs' / 'plot_analysis'
OUT_PLOTS.mkdir(parents=True, exist_ok=True)
DOCS_DIR.mkdir(parents=True, exist_ok=True)

METRICS_PATH = REPO_ROOT / 'artifacts' / 'reports' / 'forecast_metrics.csv'
METRICS = pd.read_csv(METRICS_PATH) if METRICS_PATH.exists() else pd.DataFrame()

MODELS = ['har_forecast', 'har_sentiment_forecast', 'har_log_forecast', 'xgb_forecast', 'xgb_sentiment_forecast']


def plot_actual_vs_forecasts(df: pd.DataFrame, ticker: str):
    plt.figure(figsize=(12,5))
    plt.plot(pd.to_datetime(df['date']), df['actual_volatility'], label='Actual', linewidth=2, color='tab:blue')
    for m in MODELS:
        if m in df.columns:
            plt.plot(pd.to_datetime(df['date']), df[m], label=m)
    plt.title(f'{ticker} Actual vs Forecast Volatility')
    plt.xlabel('Date')
    plt.ylabel('Realized volatility')
    plt.legend()
    out = OUT_PLOTS / f'{ticker}_actual_vs_forecasts.png'
    plt.tight_layout()
    plt.savefig(out, dpi=150)
    plt.close()
    return out


def plot_residuals(df: pd.DataFrame, ticker: str):
    y = df['actual_volatility']
    for m in MODELS:
        if m in df.columns:
            res = y - df[m]
            plt.figure(figsize=(6,4))
            if HAS_SEABORN:
                sns.histplot(res.dropna(), bins=50, kde=True, color='C1')
            else:
                plt.hist(res.dropna(), bins=50, density=True, alpha=0.7, color='#7f7f7f')
            plt.title(f'{ticker} Residuals: {m}')
            plt.xlabel('Residual (actual - pred)')
            out = OUT_PLOTS / f'{ticker}_residuals_{m}.png'
            plt.tight_layout()
            plt.savefig(out, dpi=140)
            plt.close()


def plot_volatility_distribution(df: pd.DataFrame, ticker: str):
    plt.figure(figsize=(6,4))
    if HAS_SEABORN:
        sns.histplot(df['actual_volatility'].dropna(), bins=60, kde=True, color='C2')
    else:
        plt.hist(df['actual_volatility'].dropna(), bins=60, density=True, alpha=0.7, color='#555555')
    plt.title(f'{ticker} Volatility Distribution')
    out = OUT_PLOTS / f'{ticker}_volatility_hist.png'
    plt.tight_layout()
    plt.savefig(out, dpi=140)
    plt.close()
    return out


def plot_feature_correlation(ticker: str, features: pd.DataFrame):
    corr = features.corr()
    plt.figure(figsize=(10,8))
    if HAS_SEABORN:
        sns.heatmap(corr, cmap='vlag', center=0, annot=False)
    else:
        plt.imshow(corr, cmap='vlag', aspect='auto')
        plt.colorbar()
        plt.xticks(range(len(corr.columns)), corr.columns, rotation=90)
        plt.yticks(range(len(corr.index)), corr.index)
    plt.title(f'{ticker} Feature Correlation')
    out = OUT_PLOTS / f'{ticker}_feature_correlation.png'
    plt.tight_layout()
    plt.savefig(out, dpi=140)
    plt.close()
    return out


def plot_model_comparison(metrics_df: pd.DataFrame, ticker: str):
    df = metrics_df[metrics_df['ticker'] == ticker]
    if df.empty:
        return None
    metrics = ['rmse','mae','mape','r2','qlike']
    fig, axes = plt.subplots(1, len(metrics), figsize=(5*len(metrics),4))
    for ax, metric in zip(axes, metrics):
        if HAS_SEABORN:
            sns.barplot(x='model', y=metric, data=df, ax=ax)
        else:
            # fallback to matplotlib
            models = df['model'].values
            vals = df[metric].values
            ax.bar(models, vals)
        ax.set_title(metric)
        ax.tick_params(axis='x', rotation=45)
    out = OUT_PLOTS / f'{ticker}_model_comparison.png'
    plt.tight_layout()
    plt.savefig(out, dpi=140)
    plt.close()
    return out


def feature_importance(ticker: str, features: pd.DataFrame, train: pd.DataFrame, y_train: pd.Series):
    # HAR coefficients
    har = HARModel(use_sentiment=False, estimator='ridge', feature_columns=[c for c in train.columns if c not in ['date','future_realized_volatility','future_realized_variance','log_future_realized_variance']])
    try:
        har.fit(train[har.feature_columns], y_train)
        coef = pd.Series(har.model.coef_, index=har.feature_columns).sort_values(key=abs, ascending=False)
        plt.figure(figsize=(8,4))
        coef.abs().plot(kind='bar')
        plt.title(f'{ticker} HAR feature coefficient magnitudes')
        out = OUT_PLOTS / f'{ticker}_har_feature_importance.png'
        plt.tight_layout(); plt.savefig(out, dpi=140); plt.close()
    except Exception:
        out = None

    # XGBoost feature importances (load tuned model if present)
    xgb_path = Path('artifacts') / 'models' / f'{ticker}_xgb_best.joblib'
    xgb_out = None
    if xgb_path.exists():
        try:
            loaded = joblib.load(xgb_path)
            # handle pipeline or estimator directly
            model = None
            feature_names = None
            # If it's a sklearn Pipeline, extract the final estimator
            try:
                if hasattr(loaded, 'named_steps'):
                    model = list(loaded.named_steps.values())[-1]
                else:
                    model = loaded
                if hasattr(model, 'feature_importances_'):
                    fi = pd.Series(model.feature_importances_, index=train.columns).sort_values(ascending=False)
                    plt.figure(figsize=(8,4))
                    fi.plot(kind='bar')
                    plt.title(f'{ticker} XGB feature importances')
                    xgb_out = OUT_PLOTS / f'{ticker}_xgb_feature_importance.png'
                    plt.tight_layout(); plt.savefig(xgb_out, dpi=140); plt.close()
                elif _HAS_SEABORN := False:  # placeholder for XGBoost booster
                    pass
            except Exception:
                xgb_out = None
        except Exception:
            xgb_out = None
    return out, xgb_out


def plot_sentiment_vs_volatility(df: pd.DataFrame, ticker: str):
    if 'mean_sentiment' not in df.columns:
        return None
    if df['mean_sentiment'].nunique() <= 1:
        # constant sentiment — still produce a small note plot
        plt.figure(figsize=(6,4))
        plt.text(0.5, 0.5, 'Sentiment constant or unavailable', ha='center', va='center')
        plt.title(f'{ticker} Sentiment vs Future Volatility')
        out = OUT_PLOTS / f'{ticker}_sentiment_vs_vol.png'
        plt.tight_layout(); plt.savefig(out, dpi=140); plt.close()
        return out
    plt.figure(figsize=(6,4))
    plt.scatter(df['mean_sentiment'], df['actual_volatility'], alpha=0.6)
    plt.xlabel('Mean sentiment')
    plt.ylabel('Future realized volatility')
    plt.title(f'{ticker} Sentiment vs Future Volatility')
    out = OUT_PLOTS / f'{ticker}_sentiment_vs_vol.png'
    plt.tight_layout(); plt.savefig(out, dpi=140); plt.close()
    return out


def generate_markdown(ticker: str, plots: dict[str, Path], brief: str):
    md = DOCS_DIR / f'{ticker}_analysis.md'
    with md.open('w', encoding='utf8') as f:
        f.write(f"# {ticker} Forecast Analysis\n\n")
        f.write(brief + "\n\n")
        for name, p in plots.items():
            if p and Path(p).exists():
                rel = os.path.relpath(p, DOCS_DIR)
                f.write(f"## {name}\n\n")
                f.write(f"![{name}]({rel})\n\n")
    return md


def main():
    for ticker in config.tickers:
        fc_path = Path('artifacts') / 'forecasts' / f'{ticker}_forecast.csv'
        if not fc_path.exists():
            print('Forecast CSV missing for', ticker)
            continue
        df = pd.read_csv(fc_path)
        # basic plots
        p1 = plot_actual_vs_forecasts(df, ticker)
        plot_residuals(df, ticker)
        p2 = plot_volatility_distribution(df, ticker)
        p_sent = plot_sentiment_vs_volatility(df, ticker)

        # rebuild features for correlations and feature importance
        market = download_market_data(ticker, str(config.start_date), str(config.end_date), interval='1d')
        try:
            # ensure expected columns & types; support DatetimeIndex or 'Date' column
            if not isinstance(market, pd.DataFrame):
                market = pd.DataFrame(market)
            if 'date' not in market.columns:
                # try to reset index (yfinance often returns DatetimeIndex)
                market = market.reset_index()
                if 'Date' in market.columns and 'date' not in market.columns:
                    market = market.rename(columns={'Date': 'date'})
            if 'date' in market.columns:
                market['date'] = pd.to_datetime(market['date'])

            market['realized_variance'] = compute_realized_variance(market)
            market['realized_volatility'] = compute_realized_volatility(market['realized_variance'])
            # build features with the existing FeatureBuilder instance
            features = fb.build_features(market, pd.DataFrame(), config.forecast_horizon)
        except Exception as exc:
            print('Failed building features for', ticker, exc)
            features = pd.DataFrame()

        p3 = None
        p4 = None
        if not features.empty:
            # correlation heatmap
            cols = [c for c in features.columns if c not in ['date']]
            p3 = plot_feature_correlation(ticker, features[cols])
            # split to train/test for feature importance
            train, val, test = FeatureBuilder().train_validation_test_split(features)
            try:
                y_train = train['future_realized_volatility']
                out_har, out_xgb = feature_importance(ticker, features, train, y_train)
                p4 = out_har
            except Exception:
                p4 = None
        else:
            # if features empty, still try to compute feature importance from forecast CSV if it contains feature columns
            possible_feat_cols = [c for c in df.columns if c not in ['date','actual_volatility'] + MODELS]
            if possible_feat_cols:
                try:
                    temp_train = df[possible_feat_cols].copy()
                    temp_y = df['actual_volatility']
                    out_har, out_xgb = feature_importance(ticker, temp_train, temp_train, temp_y)
                    p4 = out_har
                except Exception:
                    p4 = None

        p5 = plot_model_comparison(METRICS, ticker) if not METRICS.empty else None

        brief = f"Auto-generated analysis for {ticker}."
        plots = {'Actual vs Forecasts': p1, 'Volatility Distribution': p2, 'Sentiment vs Volatility': p_sent, 'Feature Correlation': p3, 'HAR Feature Importance': p4, 'Model Comparison': p5}
        md = generate_markdown(ticker, plots, brief)
        print('Generated analysis for', ticker, '->', md)

if __name__ == '__main__':
    main()
