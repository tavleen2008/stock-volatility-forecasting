const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const TOKEN_KEY = 'svf_access_token';

async function request(path, options = {}) {
  const token = localStorage.getItem(TOKEN_KEY);
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(body.message || `HTTP ${res.status}`);
  }
  return res.json();
}

export const stocksApi = {
  list: () => request('/api/stocks'),
  quote: (symbol) => request(`/api/stocks/${symbol}`),
  history: (symbol, range = '1mo') =>
    request(`/api/stocks/${symbol}/history?range=${range}`),
};

export const forecastApi = {
  get: (symbol) => request(`/api/forecasts/${symbol}`),
};

export const newsApi = {
  list: (q) => request(`/api/news${q ? `?q=${encodeURIComponent(q)}` : ''}`),
};

export const authApi = {
  me: (token) =>
    request('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    }),
};
