import { TOKEN_KEY, SESSION_KEY } from './constants';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

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
  /** Get volatility forecast for a symbol with technical calculations + ML fallback */
  get: async (symbol) => {
    let history = [];
    let currentPrice = 0;

    try {
      const historyRes = await stocksApi.history(symbol, '3mo');
      history = historyRes.history || [];
      const quoteRes = await stocksApi.quote(symbol);
      currentPrice = quoteRes.currentPrice || 0;
    } catch (err) {
      console.error('Error fetching stock data for technical forecast:', err);
    }

    const prices = history.map((h) => h.close);

    const calculateSMA = (data, period) => {
      if (data.length < period)
        return data.length > 0 ? +(data.reduce((a, b) => a + b, 0) / data.length).toFixed(2) : 0;
      const slice = data.slice(-period);
      return +(slice.reduce((sum, val) => sum + val, 0) / period).toFixed(2);
    };

    const sma20 = calculateSMA(prices, 20);
    const sma50 = calculateSMA(prices, 50);

    let trend = 0;
    if (prices.length >= 6 && currentPrice > 0) {
      const price5DaysAgo = prices[prices.length - 6];
      trend = +(((currentPrice - price5DaysAgo) / price5DaysAgo) * 100).toFixed(2);
    }

    const calculateRSI = (data, period = 14) => {
      if (data.length <= period) return 50;
      let gains = 0;
      let losses = 0;
      for (let i = 1; i <= period; i++) {
        const diff = data[i] - data[i - 1];
        if (diff > 0) gains += diff;
        else losses -= diff;
      }
      let avgGain = gains / period;
      let avgLoss = losses / period;

      for (let i = period + 1; i < data.length; i++) {
        const diff = data[i] - data[i - 1];
        avgGain = (avgGain * (period - 1) + (diff > 0 ? diff : 0)) / period;
        avgLoss = (avgLoss * (period - 1) + (diff < 0 ? -diff : 0)) / period;
      }
      if (avgLoss === 0) return 100;
      const rs = avgGain / avgLoss;
      return +(100 - 100 / (1 + rs)).toFixed(1);
    };

    const rsi = calculateRSI(prices, 14);

    const calculateVolatility = (data) => {
      if (data.length < 2) return 25.0;
      const logReturns = [];
      for (let i = 1; i < data.length; i++) {
        const ratio = data[i] / (data[i - 1] || 1);
        logReturns.push(Math.log(ratio > 0 ? ratio : 1.0));
      }
      const mean = logReturns.reduce((sum, r) => sum + r, 0) / logReturns.length;
      const variance = logReturns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / (logReturns.length - 1);
      const dailyVol = Math.sqrt(variance);
      const annVol = dailyVol * Math.sqrt(252) * 100;
      return +(annVol).toFixed(2);
    };

    const historicalVolatility = calculateVolatility(prices);

    let riskLevel = 'medium';
    if (historicalVolatility < 20) riskLevel = 'low';
    else if (historicalVolatility > 40) riskLevel = 'high';

    let signal = 'neutral';
    if (rsi < 35) signal = 'bullish';
    else if (rsi > 65) signal = 'bearish';
    else if (sma20 > sma50 && trend > 0) signal = 'bullish';
    else if (sma20 < sma50 && trend < 0) signal = 'bearish';

    const dailyVolFraction = (historicalVolatility / 100) / Math.sqrt(252);
    const vol5d = dailyVolFraction * Math.sqrt(5);
    const expectedRange5d = {
      low: +(currentPrice * Math.exp(-vol5d)).toFixed(2),
      high: +(currentPrice * Math.exp(vol5d)).toFixed(2),
    };

    const vol30d = dailyVolFraction * Math.sqrt(30);
    const expectedRange30d = {
      low: +(currentPrice * Math.exp(-vol30d)).toFixed(2),
      high: +(currentPrice * Math.exp(vol30d)).toFixed(2),
    };

    const chartData = history.map((h) => ({
      date: h.date,
      price: h.close,
    }));

    let mlForecast = null;
    try {
      const response = await request(`/api/forecasts/${symbol}/latest`);
      mlForecast = response?.forecast || response;
    } catch {
      try {
        const response = await request(`/api/forecasts/${symbol}`);
        mlForecast = response?.forecast || response;
      } catch {
        // Silent catch
      }
    }

    const merged = {
      symbol,
      currentPrice,
      riskLevel,
      signal,
      historicalVolatility,
      rsi,
      trend,
      sma20,
      sma50,
      expectedRange5d,
      expectedRange30d,
      chartData,
      ...mlForecast,
      reason: mlForecast?.reason || `Yahoo Finance technical indicators suggest a ${signal} outlook for ${symbol} with ${riskLevel} volatility risk.`,
    };

    return {
      forecast: merged,
      ...merged,
    };
  },

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
