export const TRACKED_SYMBOLS = ['AAPL', 'NVDA', 'TSLA', 'MSFT'];

export const INITIAL_HOLDINGS = [
  { id: 1, symbol: 'AAPL', name: 'Apple Inc.', shares: 50, buyPrice: 150.00 },
  { id: 2, symbol: 'MSFT', name: 'Microsoft Corp.', shares: 30, buyPrice: 280.00 },
  { id: 3, symbol: 'NVDA', name: 'NVIDIA Corp.', shares: 40, buyPrice: 110.00 },
  { id: 4, symbol: 'TSLA', name: 'Tesla Inc.', shares: 25, buyPrice: 180.00 },
];

export const TOKEN_KEY = 'svf_access_token';
export const SESSION_KEY = 'sentivvo_current_session';

export const BULLISH_WORDS = [
  'surge', 'rally', 'gain', 'soar', 'rise', 'beat', 'record', 'high', 'profit',
  'bullish', 'strong', 'upgrade', 'growth', 'positive', 'outperform', 'buy', 'breakthrough',
  'exceed', 'optimistic'
];

export const BEARISH_WORDS = [
  'drop', 'fall', 'slide', 'decline', 'plunge', 'dip', 'miss', 'loss',
  'bearish', 'weak', 'downgrade', 'slump', 'negative', 'underperform', 'sell', 'warning',
  'risk', 'concern', 'regulatory', 'lawsuit', 'fail'
];
