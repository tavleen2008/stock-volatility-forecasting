const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const SESSION_KEY = 'sentivvo_current_session';
const TOKEN_KEY = 'svf_access_token';

export const authService = {
  /** Login with email + password against the real backend */
  login: async (email, password) => {
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.message };

      // Store token + user
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(SESSION_KEY, JSON.stringify(data.user));
      return { success: true, user: data.user };
    } catch {
      return { success: false, error: 'Network error — is the server running?' };
    }
  },

  /** Send OTP verification email (step 1 of local registration) */
  sendCode: async (name, email, password) => {
    try {
      const res = await fetch(`${API_URL}/api/auth/send-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.message };
      return { success: true };
    } catch {
      return { success: false, error: 'Network error — is the server running?' };
    }
  },

  /** Resend OTP verification code */
  resendCode: async (email) => {
    try {
      const res = await fetch(`${API_URL}/api/auth/register/resend-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.message };
      return { success: true, message: data.message };
    } catch {
      return { success: false, error: 'Network error.' };
    }
  },

  /** Verify OTP + finalize registration (step 2) */
  verifyAndRegister: async (email, code) => {
    try {
      const res = await fetch(`${API_URL}/api/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.message };

      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(SESSION_KEY, JSON.stringify(data.user));
      return { success: true, user: data.user };
    } catch {
      return { success: false, error: 'Network error.' };
    }
  },

  /** Redirect browser to Google OAuth */
  googleAuth: () => {
    window.location.href = `${API_URL}/api/auth/google`;
    return { success: true };
  },

  /** Store a token received from OAuth callback */
  setTokenFromOAuth: (token, user) => {
    localStorage.setItem(TOKEN_KEY, token);
    if (user) localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  },

  /** Guest login — no backend call, stores demo session */
  guestLogin: () => {
    const guest = { email: 'guest@sentivvo.com', name: 'Guest Analyst', avatarUrl: null, provider: 'guest' };
    localStorage.setItem(SESSION_KEY, JSON.stringify(guest));
    return { success: true, user: guest };
  },

  /** Get the current user from localStorage */
  getCurrentUser: () => {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  /** Get the stored JWT token */
  getToken: () => localStorage.getItem(TOKEN_KEY),

  /** Clear all session data */
  logout: async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    try {
      await fetch(`${API_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
    } catch { /* ignore */ }
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(SESSION_KEY);
  },
};
