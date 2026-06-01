from __future__ import annotations

from pathlib import Path
import sys
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from ml.evaluation.metrics import qlike_loss


if __name__ == "__main__":
    y_true = pd.Series([0.2, 0.4, 0.6])
    y_pred = pd.Series([0.0, 0.0, 0.0])
    clipped = y_pred.clip(lower=1e-6)
    print("qlike_raw:", qlike_loss(y_true, y_pred))
    print("qlike_clipped_input:", qlike_loss(y_true, clipped))
