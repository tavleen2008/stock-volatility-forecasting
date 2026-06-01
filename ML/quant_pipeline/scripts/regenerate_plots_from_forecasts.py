"""Regenerate clean plots from forecast CSVs and archive temporary/backup files.

Runs in-place: moves backup files to `artifacts/archive/` and rewrites plots in `artifacts/plots/`.
"""
import shutil
from pathlib import Path
import pandas as pd
import matplotlib.pyplot as plt
from matplotlib.dates import AutoDateLocator, DateFormatter

# Resolve workspace-level artifacts if present, else fall back to package-level
pkg_root = Path(__file__).resolve().parents[2]
ws_root = Path(__file__).resolve().parents[3]
if (ws_root / "artifacts").exists():
    ROOT = ws_root
else:
    ROOT = pkg_root

FORECAST_DIR = ROOT / "artifacts" / "forecasts"
PLOT_DIR = ROOT / "artifacts" / "plots"
ARCHIVE_DIR = ROOT / "artifacts" / "archive"

ARCHIVE_DIR.mkdir(parents=True, exist_ok=True)
(PLOT_DIR / "archived").mkdir(parents=True, exist_ok=True)

# patterns to archive in forecasts dir
archive_patterns = ["*.backup_raw.csv", "*.orig_backup.csv", "*.pre_stack_backup.csv"]

moved = []
for pat in archive_patterns:
    for p in FORECAST_DIR.glob(pat):
        dest = ARCHIVE_DIR / p.name
        try:
            shutil.move(str(p), str(dest))
            moved.append(str(p))
        except Exception:
            pass

# Archive non-fixed log1p plots if a *_fixed counterpart exists
for p in PLOT_DIR.glob("*_forecast_log1p.png"):
    fixed = p.with_name(p.stem + "_fixed.png")
    # stem of file e.g. AAPL_forecast_log1p -> fixed would be AAPL_forecast_log1p_fixed.png
    fixed = PLOT_DIR / (p.stem + "_fixed.png")
    if fixed.exists():
        dest = PLOT_DIR / "archived" / p.name
        try:
            shutil.move(str(p), str(dest))
            moved.append(str(p))
        except Exception:
            pass

# Archive debug/fix scripts if present at repo scripts/ or root
possible_debug = [ROOT / "debug_log_pred.py", ROOT / "fix_har_log_forecasts.py", ROOT / "stock-volatility-forecasting" / "quant_pipeline" / "scripts" / "debug_log_pred.py", ROOT / "stock-volatility-forecasting" / "quant_pipeline" / "scripts" / "fix_har_log_forecasts.py"]
for p in possible_debug:
    if p.exists():
        dest = ARCHIVE_DIR / p.name
        try:
            shutil.move(str(p), str(dest))
            moved.append(str(p))
        except Exception:
            pass

print(f"Archived {len(moved)} files.")

# Now regenerate clean plots from each forecast CSV
for csv_path in sorted(FORECAST_DIR.glob("*_forecast*.csv")):
    try:
        df = pd.read_csv(csv_path)
    except Exception:
        continue
    if 'date' not in df.columns or 'actual_volatility' not in df.columns:
        continue
    df['date'] = pd.to_datetime(df['date'])
    df = df.sort_values('date')
    df = df.set_index('date')

    # identify forecast columns (exclude actual_volatility and har_log_forecast for plotting)
    forecast_cols = [c for c in df.columns if c not in ('actual_volatility', 'har_log_forecast')]
    if not forecast_cols:
        continue

    ticker = csv_path.stem.split('_')[0]
    # plot
    fig, ax = plt.subplots(figsize=(11, 5))
    ax.plot(df.index, df['actual_volatility'].values, label='Actual', linewidth=2, color='tab:blue')
    colors = ['tab:orange', 'tab:green', 'tab:red', 'tab:purple', 'tab:olive']
    for i, col in enumerate(forecast_cols):
        ax.plot(df.index, df[col].values, label=col, linewidth=1.5, color=colors[i % len(colors)])

    ax.set_title(f"{ticker} realized vs forecast volatility (regenerated)")
    ax.set_xlabel('Date')
    ax.set_ylabel('Realized volatility')
    locator = AutoDateLocator()
    formatter = DateFormatter("%Y-%m-%d")
    ax.xaxis.set_major_locator(locator)
    ax.xaxis.set_major_formatter(formatter)
    fig.autofmt_xdate(rotation=30)
    ax.legend()
    fig.tight_layout()

    out = PLOT_DIR / f"{ticker}_forecast_regen.png"
    fig.savefig(out, dpi=160)
    plt.close(fig)

print("Regenerated plots saved to artifacts/plots/*.png")
