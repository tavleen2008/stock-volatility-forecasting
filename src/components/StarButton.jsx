import React from 'react';
import { Star } from 'lucide-react';

/**
 * StarButton – a togglable watchlist star icon.
 *
 * Props:
 *   symbol    string   – stock symbol
 *   followed  Set      – the current Set<string> from useWatchlist
 *   toggle    fn       – toggle(symbol) from useWatchlist
 *   isGuest   boolean  – if true, show a disabled/tooltip star
 *   size      number   – icon size (default 16)
 *   className string   – extra Tailwind classes
 */
function StarButton({ symbol, followed, toggle, isGuest, size = 16, className = '' }) {
  const active = followed?.has(symbol);

  const handleClick = (e) => {
    e.stopPropagation(); // prevent row-click events from firing
    if (!isGuest) toggle(symbol);
  };

  return (
    <button
      title={isGuest ? 'Sign in to follow stocks' : active ? `Unfollow ${symbol}` : `Follow ${symbol}`}
      onClick={handleClick}
      className={`inline-flex items-center justify-center rounded-lg transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-400 ${
        isGuest ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer hover:scale-110 active:scale-95'
      } ${className}`}
      aria-label={active ? `Unfollow ${symbol}` : `Follow ${symbol}`}
      aria-pressed={active}
      disabled={isGuest}
    >
      <Star
        size={size}
        className={`transition-colors duration-200 ${
          active
            ? 'fill-yellow-400 text-yellow-400 drop-shadow-[0_0_6px_rgba(250,204,21,0.6)]'
            : 'fill-transparent text-gray-400 hover:text-yellow-400'
        }`}
      />
    </button>
  );
}

export default StarButton;
