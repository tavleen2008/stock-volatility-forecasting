"""Validate forecast CSVs and regenerate plots for inconsistent series.

Outputs per-ticker markdown in docs/checkpoint1/plot_validation/ summarizing stats and flags.
"""
from pathlib import Path
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from matplotlib.dates import AutoDateLocator, DateFormatter

pkg_root = Path(__file__).resolve().parents[2]
repo_root = Path(__file__).resolve().parents[3]
# prefer workspace-level artifacts under repo_root
if (repo_root / 'artifacts' / 'forecasts').exists():
    FORECAST_DIR = repo_root / 'artifacts' / 'forecasts'
    PLOT_DIR = repo_root / 'artifacts' / 'plots'
else:
    FORECAST_DIR = pkg_root / 'artifacts' / 'forecasts'
    PLOT_DIR = pkg_root / 'artifacts' / 'plots'

DOC_DIR = repo_root / 'docs' / 'checkpoint1' / 'plot_validation'
DOC_DIR.mkdir(parents=True, exist_ok=True)
PLOT_DIR.mkdir(parents=True, exist_ok=True)

THRESH_MEAN_RATIO = 5.0  # flag if forecast mean > this * actual mean
THRESH_STD_MIN = 1e-6    # flag if forecast std < this (constant series)

report_rows = []

for csv in sorted(FORECAST_DIR.glob('*_forecast*.csv')):
    df = pd.read_csv(csv)
    if 'date' not in df.columns or 'actual_volatility' not in df.columns:
        continue
    df['date'] = pd.to_datetime(df['date'])
    df = df.sort_values('date').reset_index(drop=True)
    actual = df['actual_volatility'].astype(float)
    actual_stats = {'mean': float(actual.mean()), 'std': float(actual.std()), 'min': float(actual.min()), 'max': float(actual.max())}

    forecast_cols = [c for c in df.columns if c not in ['date','actual_volatility']]
    flags = {}
    stats = {}
    for col in forecast_cols:
        series = pd.to_numeric(df[col], errors='coerce')
        s = series.dropna()
        if s.empty:
            stats[col] = {'mean': np.nan, 'std': np.nan, 'min': np.nan, 'max': np.nan}
            flags[col] = 'missing'
            continue
        m = float(s.mean()); sd = float(s.std()); mn = float(s.min()); mx = float(s.max())
        stats[col] = {'mean': m, 'std': sd, 'min': mn, 'max': mx}
        # flags
        f = []
        if sd < THRESH_STD_MIN:
            f.append('constant')
        if m > THRESH_MEAN_RATIO * max(actual_stats['mean'], 1e-12):
            f.append('scale_mismatch')
        if mn < -1e-8:
            f.append('negative')
        flags[col] = ','.join(f) if f else 'ok'

    # write per-ticker markdown
    ticker = csv.stem.split('_')[0]
    md = DOC_DIR / f'{ticker}_plot_validation.md'
    with md.open('w', encoding='utf8') as f:
        f.write(f"# Plot validation report: {ticker}\n\n")
        f.write(f"Source CSV: {csv.name}\n\n")
        f.write("## Actual volatility stats\n\n")
        f.write(str(actual_stats) + "\n\n")
        f.write("## Forecast stats and flags\n\n")
        for col in forecast_cols:
            f.write(f"- {col}: stats={stats[col]}, flag={flags[col]}\n")

    report_rows.append({'ticker': ticker, 'csv': csv.name, 'actual_mean': actual_stats['mean'], 'actual_std': actual_stats['std'], 'flags': ';'.join([f for f in flags.values() if f!='ok'])})

    # if any flag other than ok, regenerate a clean plot from CSV
    if any(v!='ok' for v in flags.values()):
        fig, ax = plt.subplots(figsize=(11,5))
        ax.plot(df['date'], actual.values, label='Actual', linewidth=2)
        for col in forecast_cols:
            ax.plot(df['date'], pd.to_numeric(df[col], errors='coerce'), label=col, linewidth=1.5)
        ax.set_title(f'{ticker} Actual vs Forecasts (validated)')
        ax.set_xlabel('Date'); ax.set_ylabel('Realized volatility')
        locator = AutoDateLocator(); formatter = DateFormatter('%Y-%m-%d')
        ax.xaxis.set_major_locator(locator); ax.xaxis.set_major_formatter(formatter)
        fig.autofmt_xdate(rotation=30); ax.legend(); fig.tight_layout()
        out = PLOT_DIR / f'{ticker}_forecast_validated.png'
        fig.savefig(out, dpi=160); plt.close(fig)

# summary
summary_df = pd.DataFrame(report_rows)
summary_path = DOC_DIR / 'validation_summary.csv'
summary_df.to_csv(summary_path, index=False)
print('Validation completed. Reports at', DOC_DIR)
