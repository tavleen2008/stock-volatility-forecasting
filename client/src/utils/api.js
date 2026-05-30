const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const TOKEN_KEY = 'svf_access_token';

/**
 * Thin fetch wrapper that:
 * - Prepends the API base URL
 * - Automatically attaches Authorization: Bearer <token> if a token is stored
 * - Parses JSON responses
 *
 * @param {string} path  - API path, e.g. '/api/auth/me'
 * @param {RequestInit} options - standard fetch options
 * @returns {Promise<any>} parsed JSON body
 */
export async function apiFetch(path, options = {}) {
  const token = localStorage.getItem(TOKEN_KEY);

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err = new Error(body.message || `HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }

  return res.json();
}
