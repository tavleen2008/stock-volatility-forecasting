import { BULLISH_WORDS, BEARISH_WORDS } from './constants';

/**
 * Perform client-side lexical sentiment analysis based on keyword lists.
 * @param {string} text - Title or description text
 * @returns {'bullish' | 'bearish' | 'neutral'}
 */
export function getSentiment(text = '') {
  const lower = text.toLowerCase();
  const bullScore = BULLISH_WORDS.filter((w) => lower.includes(w)).length;
  const bearScore = BEARISH_WORDS.filter((w) => lower.includes(w)).length;
  if (bullScore > bearScore) return 'bullish';
  if (bearScore > bullScore) return 'bearish';
  return 'neutral';
}

/**
 * Format a timestamp into a relative "time ago" string.
 * @param {string | Date} dateStr - The source timestamp
 * @returns {string} Relative time representation (e.g. "5m ago", "2h ago", "3d ago")
 */
export function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}
