"""
Model artifact loader for the HAR-Sentiment Research endpoint.

Discovers and loads *_model.joblib, *_scaler.joblib, *_fe_means.joblib
from a root artifacts directory. Models are general (not per-ticker).
"""

from pathlib import Path

import joblib

from ml.features.har_features import (
    HAR_CORE,
    HAR_EXTENDED,
    SENT_FEATURES,
    ALL_FEATURES,
)

# ---------------------------------------------------------------------------
# Model variant → feature column mapping
# ---------------------------------------------------------------------------

MODELS = {
    'HAR-OLS':  HAR_CORE,
    'HAR+':     HAR_EXTENDED,
    'HAR-Sent': HAR_CORE + SENT_FEATURES,
    'HAR-Full': ALL_FEATURES,
}

# Ordered list of filename stem substrings to try per variant
_VARIANT_STEMS = {
    'HAR-Full': ['har_full', 'har_sentiment', 'har_sent'],
    'HAR-OLS':  ['har_ols'],
    'HAR+':     ['har+', 'har_plus'],
    'HAR-Sent': ['har_sent', 'har_sentiment'],
}


def load_model(model_variant: str, artifacts_dir: Path) -> dict | None:
    """
    Discover and load a general (non-per-ticker) model artifact triplet.

    Scans `artifacts_dir` for `*_model.joblib` files, matches by variant
    stem, then loads the corresponding `*_scaler.joblib` and
    `*_fe_means.joblib`.

    Parameters
    ----------
    model_variant : str
        One of 'HAR-Full', 'HAR-OLS', 'HAR+', 'HAR-Sent'.
    artifacts_dir : Path
        Root directory containing the model artifacts.

    Returns
    -------
    dict with keys: model, scaler, fe_means, feature_cols
    None if no matching triplet is found.
    """
    preferred_stems = _VARIANT_STEMS.get(
        model_variant,
        [model_variant.lower().replace('-', '_')]
    )

    # Index all model files at root level by stem
    root_models = {
        p.name.replace('_model.joblib', ''): p
        for p in artifacts_dir.glob('*_model.joblib')
    }

    for stem in preferred_stems:
        matched_stem = next((k for k in root_models if stem in k), None)
        if matched_stem is None:
            continue

        model_path    = root_models[matched_stem]
        scaler_path   = artifacts_dir / f"{matched_stem}_scaler.joblib"
        fe_means_path = artifacts_dir / f"{matched_stem}_fe_means.joblib"

        if not scaler_path.exists() or not fe_means_path.exists():
            continue

        return {
            "model":        joblib.load(model_path),
            "scaler":       joblib.load(scaler_path),
            "fe_means":     joblib.load(fe_means_path),
            "feature_cols": MODELS[model_variant],
        }

    return None
