const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const TOKEN_KEY = 'svf_access_token';
const SESSION_KEY = 'sentivvo_current_session';

/**
 * Attempts a single token refresh if the access token has expired.
 * Returns true if a new token was obtained, false otherwise.
 */
async function tryRefreshToken() {
  try {
    const res = await fetch(`${API_URL}/api/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });
    if (!res.ok) return false;
    const { token } = await res.json();
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

async function request(path, options = {}, retried = false) {
  const token = localStorage.getItem(TOKEN_KEY);
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const res = await fetch(`${API_URL}${path}`, { ...options, headers, credentials: 'include' });

  // On 401, attempt one silent token refresh then retry
  if (res.status === 401 && !retried) {
    const refreshed = await tryRefreshToken();
    if (refreshed) return request(path, options, true);
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(body.message || `HTTP ${res.status}`);
  }
  return res.json();
}

export const stocksApi = {
  /** List all tracked stocks with live quotes */
  list: () => request('/api/stocks'),

  /** Single stock quote / metrics (alias endpoint) */
  quote: (symbol) => request(`/api/stocks/${symbol}`),

  /** OHLCV history for charting */
  history: (symbol, range = '1mo') =>
    request(`/api/stocks/${symbol}/history?range=${range}`),

  /** Full dashboard payload: metrics + news + forecast combined */
  dashboard: (symbol) => request(`/api/stocks/${symbol}/dashboard`),

  /** Explicit metrics endpoint */
  metrics: (symbol) => request(`/api/stocks/${symbol}/metrics`),

  /** Extended overview: P/E, EPS, beta, 52-wk, dividends etc. */
  overview: (symbol) => request(`/api/stocks/${symbol}/overview`),

  /** Company profile: sector, industry, description, employees */
  profile: (symbol) => request(`/api/stocks/${symbol}/profile`),
};

export const forecastApi = {
  /** Get existing volatility forecast for a symbol */
  get: (symbol) => request(`/api/forecasts/${symbol}`),

  /** Trigger a brand-new forecast calculation (POST /api/forecasts/) */
  run: (payload = {}) =>
    request('/api/forecasts/', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};

export const newsApi = {
  /** List news articles, optionally filtered by query string */
  list: (q) => request(`/api/news${q ? `?q=${encodeURIComponent(q)}` : ''}`),

  /** Fetch news for a specific stock symbol using the /:symbol route */
  bySymbol: (symbol) => request(`/api/news/${symbol.toUpperCase()}`),
};

export const authApi = {
  /** Validate current access token and fetch latest user profile */
  me: () => request('/api/auth/me'),

  /** Manually trigger a token refresh */
  refresh: () =>
    fetch(`${API_URL}/api/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    }).then((r) => r.json()),

  /** Resend OTP verification code for email registration */
  resendCode: (email) =>
    request('/api/auth/register/resend-code', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),
};
