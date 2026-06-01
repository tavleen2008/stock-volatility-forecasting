"""Generate side-by-side plots comparing raw forecasts vs log1p-target forecasts.

For each ticker with both `*_forecast.csv` and `*_forecast_log1p.csv` in
`artifacts/forecasts`, create an image showing raw forecasts (left) and
log1p back-transformed forecasts (right).
"""
from pathlib import Path
import pandas as pd
import matplotlib.pyplot as plt
from matplotlib.dates import AutoDateLocator, DateFormatter
try:
    import seaborn as sns
    sns.set_theme(style='whitegrid', palette='tab10')
    HAS_SEABORN = True
except Exception:
    HAS_SEABORN = False

# ensure light background for figures
plt.rcParams.update({'figure.facecolor':'white','axes.facecolor':'white','axes.edgecolor':'#333333','grid.color':'#e6e6e6'})


def plot_ticker_side_by_side(ticker: str, forecast_dir: Path, plot_dir: Path) -> Path:
    raw_path = forecast_dir / f"{ticker}_forecast.csv"
    log_path = forecast_dir / f"{ticker}_forecast_log1p.csv"
    if not raw_path.exists() or not log_path.exists():
        return None

    raw = pd.read_csv(raw_path)
    log = pd.read_csv(log_path)

    # parse dates
    raw['date'] = pd.to_datetime(raw['date'])
    log['date'] = pd.to_datetime(log['date'])

    # align on date (inner join)
    merged = pd.merge(raw, log, on='date', suffixes=('_raw', '_log1p'))

    x = merged['date']
    actual = merged['actual_volatility_raw']

    fig, axes = plt.subplots(1, 2, figsize=(16, 5), sharey=True)

    # Left: raw forecasts
    ax = axes[0]
    ax.plot(x, actual, label='Actual', linewidth=2, color='tab:blue')
    for col in ['har_forecast', 'har_sentiment_forecast', 'xgb_forecast', 'xgb_sentiment_forecast']:
        if f'{col}_raw' in merged.columns:
            ax.plot(x, merged[f'{col}_raw'], label=col, linewidth=1)
    ax.set_title(f'{ticker} — Raw forecasts')
    ax.set_xlabel('Date')
    ax.set_ylabel('Realized volatility')
    ax.legend(loc='upper left', fontsize='small')

    # Right: log1p back-transformed forecasts
    ax = axes[1]
    ax.plot(x, actual, label='Actual', linewidth=2, color='tab:blue')
    # map of log1p column names to labels
    mapping = {
        'har_forecast_log1p': 'har_log1p',
        'har_sentiment_forecast_log1p': 'har_sent1p',
        'xgb_forecast_log1p': 'xgb_log1p',
        'xgb_sentiment_forecast_log1p': 'xgb_sent_log1p',
    }
    for col, label in mapping.items():
        if col in merged.columns:
            ax.plot(x, merged[col], label=label, linewidth=1)
    ax.set_title(f'{ticker} — log1p-target forecasts')
    ax.set_xlabel('Date')
    ax.xaxis.set_major_locator(AutoDateLocator())
    ax.xaxis.set_major_formatter(DateFormatter('%Y-%m-%d'))
    ax.legend(loc='upper left', fontsize='small')

    fig.autofmt_xdate(rotation=30)
    fig.tight_layout()
    plot_dir.mkdir(parents=True, exist_ok=True)
    out_path = plot_dir / f"{ticker}_side_by_side.png"
    fig.savefig(out_path, dpi=160)
    plt.close(fig)
    return out_path


def main():
    base = Path(__file__).resolve().parents[2]
    # raw forecasts live in the workspace-level artifacts folder
    raw_forecast_dir = base.parent / 'artifacts' / 'forecasts'
    # log1p forecasts were written into the project-local artifacts folder
    log_forecast_dir = base / 'artifacts' / 'forecasts'
    plot_dir = base / 'artifacts' / 'plots'
    tickers = ['AAPL', 'MSFT', 'TSLA', 'NVDA']

    outputs = []
    for t in sorted(set(tickers)):
        raw_path = raw_forecast_dir / f'{t}_forecast.csv'
        log_path = log_forecast_dir / f'{t}_forecast_log1p.csv'
        if raw_path.exists() and log_path.exists():
            # plot_ticker_side_by_side expects a single folder; create a tiny merge-friendly temp view
            temp_dir = base / 'artifacts' / '_tmp_side_by_side'
            temp_dir.mkdir(parents=True, exist_ok=True)
            tmp_raw = temp_dir / raw_path.name
            tmp_log = temp_dir / log_path.name
            tmp_raw.write_bytes(raw_path.read_bytes())
            tmp_log.write_bytes(log_path.read_bytes())
            out = plot_ticker_side_by_side(t, temp_dir, plot_dir)
            if out:
                outputs.append(str(out))

    if outputs:
        print('Generated side-by-side plots:')
        for o in outputs:
            print(o)
    else:
        print('No side-by-side plots generated (missing files)')


if __name__ == '__main__':
    main()
