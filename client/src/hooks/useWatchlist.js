import { useState, useEffect, useCallback } from 'react';
import { TOKEN_KEY } from '../utils/constants';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/**
 * Manages the user's followed / watchlisted stocks.
 *
 * Returns:
 *   followed   – Set<string> of followed symbols (e.g. new Set(['AAPL','TSLA']))
 *   toggle     – (symbol: string) => Promise<void>  follow ↔ unfollow
 *   isGuest    – boolean (guests cannot follow stocks)
 */
export function useWatchlist() {
  const [followed, setFollowed] = useState(() => new Set());
  const [isGuest, setIsGuest] = useState(false);

  /* ── Load watchlist from /api/auth/me on mount ─────────────────── */
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setIsGuest(true);
      return;
    }

    fetch(`${API_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      credentials: 'include',
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const symbols = data?.user?.followedStocks ?? data?.followedStocks ?? [];
        setFollowed(new Set(symbols.map((s) => (typeof s === 'string' ? s : s.symbol))));
      })
      .catch(() => {});
  }, []);

  /* ── Toggle follow / unfollow ───────────────────────────────────── */
  const toggle = useCallback(async (symbol) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token || isGuest) return;

    const isFollowed = followed.has(symbol);
    const method = isFollowed ? 'DELETE' : 'POST';

    // Optimistic update
    setFollowed((prev) => {
      const next = new Set(prev);
      if (isFollowed) next.delete(symbol);
      else next.add(symbol);
      return next;
    });

    try {
      const res = await fetch(`${API_URL}/api/users/follow/${symbol}`, {
        method,
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Follow request failed');
    } catch {
      // Roll back on failure
      setFollowed((prev) => {
        const next = new Set(prev);
        if (isFollowed) next.add(symbol);
        else next.delete(symbol);
        return next;
      });
    }
  }, [followed, isGuest]);

  return { followed, toggle, isGuest };
}
