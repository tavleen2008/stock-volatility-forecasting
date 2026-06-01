"""Move non-canonical plots to artifacts/archive/plots_old to reduce clutter.
Keep canonical plots:
 - *_forecast_regen.png
 - *_forecast_log1p_fixed.png
 - *_actual_vs_forecasts.png
 - *_model_comparison.png
 - *_volatility_hist.png
 - *_residuals_*.png (keep residuals)
"""
from pathlib import Path
import shutil

ROOT = Path(__file__).resolve().parents[2]
PLOTS = ROOT / 'artifacts' / 'plots'
ARCH = ROOT / 'artifacts' / 'archive' / 'plots_old'
ARCH.mkdir(parents=True, exist_ok=True)

keep_patterns = ['*_forecast_regen.png', '*_forecast_log1p_fixed.png', '*_actual_vs_forecasts.png', '*_model_comparison.png', '*_volatility_hist.png', '*_residuals_*.png']

moved = []
for p in PLOTS.glob('*.png'):
    name = p.name
    keep = False
    for pat in keep_patterns:
        if p.match(pat):
            keep = True
            break
    if not keep:
        dest = ARCH / name
        try:
            shutil.move(str(p), str(dest))
            moved.append(name)
        except Exception:
            pass

print(f"Moved {len(moved)} plot files to {ARCH}")
