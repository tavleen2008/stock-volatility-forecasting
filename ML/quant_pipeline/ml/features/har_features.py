"""
HAR feature engineering — log-log specification (Corsi 2009) with
Garman-Klass (1980) realized variance estimator.

Extracted from HAR_Sentiment_Research_final.ipynb.
"""

import numpy as np
import pandas as pd

# ---------------------------------------------------------------------------
# HAR windows
# ---------------------------------------------------------------------------

WIN_DAILY = 1
WIN_WEEKLY = 5
WIN_MONTHLY = 22

# ---------------------------------------------------------------------------
# Feature column names
# ---------------------------------------------------------------------------

# Core HAR — log-log specification
HAR_CORE = ['log_rv_d', 'log_rv_w', 'log_rv_m']

# Extended HAR
HAR_EXTENDED = HAR_CORE + [
    'log_rv_lag2',      # second autoregressive lag
    'log_jump_proxy',   # Andersen et al. (2007) jump component
    'log_abs_ret',      # signed return information
    'overnight_ret',    # overnight information shock
]

# Sentiment features
SENT_FEATURES = [
    'has_news',             # information state flag
    'sent_imputed',         # FinBERT directional score (EWM-imputed)
    'disp_imputed',         # analyst disagreement proxy
    'sent_roll5_mean',      # weekly sentiment component
    'sent_roll22_mean',     # monthly sentiment component
    'sent_shock',           # sentiment surprise
]

# Full feature set used by HAR-Full
ALL_FEATURES = HAR_EXTENDED + SENT_FEATURES

TARGET = 'log_rv_target'
TARGET_RAW = 'rv_target'


# ---------------------------------------------------------------------------
# Garman-Klass realized variance estimator
# ---------------------------------------------------------------------------

def garman_klass_rv(open_, high, low, close, annualize: bool = True) -> pd.Series:
    """
    Garman-Klass (1980) daily realized variance estimator.

    σ²_GK = 0.5 * [ln(H/L)]² - (2ln2 - 1) * [ln(C/O)]²

    Annualizes by multiplying by 252 (trading days per year).
    """
    log_hl = np.log(high / low)
    log_co = np.log(close / open_)
    gk = 0.5 * log_hl ** 2 - (2 * np.log(2) - 1) * log_co ** 2
    gk = gk.clip(lower=0)   # numerical safety
    if annualize:
        gk = gk * 252
    return gk


# ---------------------------------------------------------------------------
# HAR feature computation
# ---------------------------------------------------------------------------

def compute_har_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Compute the full set of HAR features from an OHLCV dataframe.

    ALL features are derived from rv.shift(1) or further lags,
    guaranteeing no look-ahead leakage.

    Parameters
    ----------
    df : pd.DataFrame
        DataFrame with columns: open, high, low, close and a DatetimeIndex.

    Returns
    -------
    pd.DataFrame
        Columns: log_rv_d, log_rv_w, log_rv_m, log_rv_lag2,
                 log_jump_proxy, log_abs_ret, overnight_ret,
                 rv_target, log_rv_target
    """
    df = df.copy().sort_index()

    rv = garman_klass_rv(df['open'], df['high'], df['low'], df['close'])

    log_c = np.log(df['close'])
    log_o = np.log(df['open'])

    # Lagged RV components (all shift(1) — no look-ahead)
    rv_lag1 = rv.shift(1)
    rv_lag2 = rv.shift(2)

    rv_w = rv_lag1.rolling(WIN_WEEKLY,  min_periods=WIN_WEEKLY).mean()
    rv_m = rv_lag1.rolling(WIN_MONTHLY, min_periods=WIN_MONTHLY).mean()

    # Log-log specification (Corsi 2009)
    eps = 1e-8
    out = pd.DataFrame(index=df.index)
    out['log_rv_d']    = np.log(rv_lag1.clip(lower=eps))
    out['log_rv_w']    = np.log(rv_w.clip(lower=eps))
    out['log_rv_m']    = np.log(rv_m.clip(lower=eps))
    out['log_rv_lag2'] = np.log(rv_lag2.clip(lower=eps))

    # Jump proxy (Andersen, Bollerslev, Diebold 2007)
    rv_jump_proxy = (rv_lag1 - rv_w).clip(lower=0)
    out['log_jump_proxy'] = np.log(rv_jump_proxy.clip(lower=eps))

    # Return-based features
    ret_lag1 = log_c.diff().shift(1)
    out['log_abs_ret']  = np.log(ret_lag1.abs().clip(lower=eps))
    out['overnight_ret'] = log_o - log_c.shift(1)

    # Target (current-day RV — no leakage when used as y in training)
    out['rv_target']     = rv
    out['log_rv_target'] = np.log(rv.clip(lower=eps))

    return out
