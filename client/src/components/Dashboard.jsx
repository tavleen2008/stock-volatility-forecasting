import React, { useState, useEffect, useCallback } from 'react';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Activity, RefreshCw, ExternalLink, Newspaper } from 'lucide-react';
import { stocksApi, newsApi } from '../utils/api';
import StockComparison from './StockComparison';

import { TRACKED_SYMBOLS } from '../utils/constants';

/* ── Sentiment helper (shared with NewsFeed) ──── */
const BULL = ['surge','rally','gain','soar','rise','beat','record','high','profit','bullish','strong','upgrade'];
const BEAR = ['drop','fall','decline','crash','loss','miss','low','weak','bearish','downgrade','cut','layoff','warning','risk'];
const getSentiment = (t = '') => {
  const l = t.toLowerCase();
  const b = BULL.filter(w => l.includes(w)).length;
  const r = BEAR.filter(w => l.includes(w)).length;
  return b > r ? 'bullish' : r > b ? 'bearish' : 'neutral';
};
const timeAgo = (d) => {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60_000), h = Math.floor(diff / 3_600_000);
  return m < 60 ? `${m}m ago` : h < 24 ? `${h}h ago` : `${Math.floor(diff/86_400_000)}d ago`;
};

const RANGE_OPTIONS = ['1d', '5d', '1mo', '3mo', '1y'];

function StatCard({ label, value, sub, subColor, icon: Icon, isDarkMode }) {
  return (
    <div className={`border rounded-2xl p-5 card-hover shadow-sm transition-colors duration-300 ${
      isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-gray-200 text-gray-900'
    }`}>
      <div className="flex justify-between items-start mb-4">
        <span className={`text-xs uppercase tracking-widest font-semibold ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>{label}</span>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isDarkMode ? 'bg-slate-800' : 'bg-green-50'}`}>
          <Icon size={18} className="text-green-500" />
        </div>
      </div>
      <div className="text-2xl font-bold mb-1">{value}</div>
      {sub && <div className={`text-xs font-medium ${subColor || (isDarkMode ? 'text-slate-400' : 'text-gray-500')}`}>{sub}</div>}
    </div>
  );
}

/* ── Latest Headlines strip (shown on Dashboard) ─────────────────── */
function LatestHeadlines({ isDarkMode }) {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Grab a sample from all symbols, merge, take latest 6
        const results = await Promise.allSettled(
          TRACKED_SYMBOLS.map((s) => newsApi.bySymbol(s))
        );
        if (cancelled) return;
        const seen = new Set();
        const merged = results
          .filter((r) => r.status === 'fulfilled' && Array.isArray(r.value))
          .flatMap((r) => r.value)
          .filter((a) => { if (seen.has(a.articleUrl)) return false; seen.add(a.articleUrl); return true; })
          .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
          .slice(0, 6);
        setArticles(merged);
      } catch (_) { /* silently ignore — news is non-critical */ }
      finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, []);

  const sentColor = (s) => s === 'bullish'
    ? (isDarkMode ? 'text-emerald-400' : 'text-emerald-600')
    : s === 'bearish'
      ? (isDarkMode ? 'text-rose-400' : 'text-red-600')
      : (isDarkMode ? 'text-slate-500' : 'text-gray-400');

  const sentDot = (s) => s === 'bullish' ? 'bg-emerald-500' : s === 'bearish' ? 'bg-red-500' : 'bg-slate-400';

  if (loading || articles.length === 0) return null;

  return (
    <div className={`border rounded-2xl p-5 shadow-sm ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}>
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <Newspaper size={16} className="text-green-500" />
          <h3 className={`text-base font-semibold m-0 ${isDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>
            Latest Headlines
          </h3>
        </div>
        <a
          href="/news"
          onClick={(e) => { e.preventDefault(); window.history.pushState({}, '', '/news'); window.dispatchEvent(new PopStateEvent('popstate')); }}
          className={`text-xs font-semibold flex items-center gap-1 hover:underline ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}
        >
          View all <ExternalLink size={11} />
        </a>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {articles.map((a) => {
          const s = getSentiment(`${a.title} ${a.description || ''}`);
          return (
            <a
              key={a.articleUrl}
              href={a.articleUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`group flex gap-3 p-3 rounded-xl border transition-all no-underline ${
                isDarkMode
                  ? 'border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                  : 'border-gray-100 hover:border-green-200 hover:bg-green-50/40'
              }`}
            >
              <div className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${sentDot(s)}`} />
              <div className="min-w-0">
                <p className={`text-xs font-semibold leading-snug line-clamp-2 mb-1 group-hover:text-green-600 transition-colors ${
                  isDarkMode ? 'text-slate-200 group-hover:text-green-400' : 'text-gray-800'
                }`}>
                  {a.title}
                </p>
                <div className="flex items-center gap-2">
                  <span className={`font-mono text-xs px-1.5 py-0.5 rounded ${
                    isDarkMode ? 'bg-green-950/60 text-green-400' : 'bg-green-100 text-green-700'
                  }`}>{a.symbol}</span>
                  <span className={`text-xs ${sentColor(s)} font-medium`}>
                    {s === 'bullish' ? '↑' : s === 'bearish' ? '↓' : '→'} {s}
                  </span>
                  <span className={`text-xs ml-auto ${isDarkMode ? 'text-slate-600' : 'text-gray-400'}`}>
                    {timeAgo(a.publishedAt)}
                  </span>
                </div>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}


function Dashboard({ isDarkMode = false }) {
  const [stocks, setStocks]               = useState([]);
  const [history, setHistory]             = useState([]);
  const [selectedSymbol, setSelectedSymbol] = useState(TRACKED_SYMBOLS[0]);
  const [range, setRange]                 = useState('1mo');
  const [loading, setLoading]             = useState(true);
  const [histLoading, setHistLoading]     = useState(false);
  const [error, setError]                 = useState(null);

  const loadStocks = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const data = await stocksApi.list();
      setStocks(data.stocks || []);
    } catch (e) { setError(e.message); }
    finally     { setLoading(false); }
  }, []);

  const loadHistory = useCallback(async () => {
    setHistLoading(true);
    try {
      const data = await stocksApi.history(selectedSymbol, range);
      setHistory(data.history || []);
    } catch (e) { console.error('History fetch failed:', e.message); }
    finally     { setHistLoading(false); }
  }, [selectedSymbol, range]);

  useEffect(() => { loadStocks();  }, [loadStocks]);
  useEffect(() => { loadHistory(); }, [loadHistory]);

  const gainers   = stocks.filter((s) => s.changePercent > 0);
  const losers    = stocks.filter((s) => s.changePercent < 0);
  const topGainer = stocks.reduce((best, s) => (!best || s.changePercent > best.changePercent ? s : best), null);
  const totalVol  = stocks.reduce((sum, s) => sum + (s.volume || 0), 0);

  return (
    <div className="flex flex-col gap-6 animate-fade-in">

      {/* ── Header ── */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className={`text-3xl font-bold mb-0.5 ${isDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>Today's Markets</h1>
          <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>Live data · {TRACKED_SYMBOLS.join(' · ')}</p>
        </div>
        <button
          onClick={loadStocks}
          disabled={loading}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm shadow-sm transition-all disabled:opacity-50 ${
            isDarkMode
              ? 'border-slate-800 bg-slate-900 text-slate-300 hover:border-green-400 hover:text-green-400'
              : 'border-gray-200 bg-white text-gray-600 hover:border-green-400 hover:text-green-600'
          }`}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* ── Error banner ── */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
          ⚠ Could not reach server: {error}
        </div>
      )}

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Volume"
          value={totalVol > 0 ? `${(totalVol / 1e9).toFixed(1)}B` : '—'}
          sub={loading ? 'Loading…' : `${stocks.length} stocks tracked`}
          icon={Activity}
          isDarkMode={isDarkMode}
        />
        <StatCard
          label="Gainers / Losers"
          value={loading ? '—' : `${gainers.length} / ${losers.length}`}
          sub="Up / Down today"
          subColor={isDarkMode ? 'text-emerald-400' : 'text-emerald-650'}
          icon={TrendingUp}
          isDarkMode={isDarkMode}
        />
        <StatCard
          label="Top Gainer"
          value={topGainer ? topGainer.symbol : '—'}
          sub={topGainer ? `+${topGainer.changePercent.toFixed(2)}%` : ''}
          subColor={isDarkMode ? 'text-emerald-400' : 'text-emerald-650'}
          icon={DollarSign}
          isDarkMode={isDarkMode}
        />
        <StatCard
          label="Market Status"
          value={<span className="text-green-500">OPEN</span>}
          sub="Regular Trading Hours"
          icon={Activity}
          isDarkMode={isDarkMode}
        />
      </div>

      {/* ── Stock Comparison Chart ── */}
      <StockComparison isDarkMode={isDarkMode} />

      {/* ── Charts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Price chart */}
        <div className={`border rounded-2xl p-5 shadow-sm ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}>
          <div className="flex justify-between items-center mb-5 flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <h3 className={`text-base font-semibold m-0 ${isDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>Price Performance</h3>
              <select
                value={selectedSymbol}
                onChange={(e) => setSelectedSymbol(e.target.value)}
                className={`text-xs px-2.5 py-1.5 rounded-lg border cursor-pointer focus:outline-none focus:border-green-400 ${
                  isDarkMode
                    ? 'bg-slate-800 border-slate-700 text-slate-200'
                    : 'bg-white border-gray-200 text-gray-700'
                }`}
              >
                {(stocks.length ? stocks : [{ symbol: 'AAPL' }]).map((s) => (
                  <option key={s.symbol} value={s.symbol}>{s.symbol}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-1">
              {RANGE_OPTIONS.map((r) => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={`flex-1 sm:flex-initial px-4 py-1.5 text-xs font-semibold rounded-lg border cursor-pointer text-center transition-all
                      ${range === r
                      ? 'bg-green-600 border-green-600 text-white shadow-sm'
                      : (isDarkMode
                        ? 'border-slate-700 text-slate-400 hover:border-green-500 hover:text-green-400'
                        : 'border-gray-200 text-gray-500 hover:border-green-300 hover:text-green-600')}`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {histLoading ? (
            <div className={`flex items-center justify-center h-[280px] text-sm ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>Loading chart…</div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={history}>
                <defs>
                  <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#006d35" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#006d35" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#334155' : '#f1f5f9'} />
                <XAxis dataKey="date" stroke="#94a3b8" tick={{ fontSize: 11 }} tickCount={6} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} domain={['auto', 'auto']} />
                <Tooltip
                  contentStyle={isDarkMode
                    ? { backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '10px', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }
                    : { backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }
                  }
                  labelStyle={{ color: isDarkMode ? '#f1f5f9' : '#0f172a', fontWeight: 600 }}
                  formatter={(v) => [`$${Number(v).toFixed(2)}`, 'Price']}
                />
                <Area type="monotone" dataKey="close" stroke="#006d35" strokeWidth={2} fillOpacity={1} fill="url(#colorPrice)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Volume chart */}
        <div className={`border rounded-2xl p-5 shadow-sm ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}>
          <h3 className={`text-base font-semibold mb-5 m-0 ${isDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>
            Trading Volume — {selectedSymbol}
          </h3>
          {histLoading ? (
            <div className={`flex items-center justify-center h-[280px] text-sm ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>Loading chart…</div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={history}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#334155' : '#f1f5f9'} />
                <XAxis dataKey="date" stroke="#94a3b8" tick={{ fontSize: 11 }} tickCount={6} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1e6).toFixed(0)}M`} />
                <Tooltip
                  contentStyle={isDarkMode
                    ? { backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '10px', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }
                    : { backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }
                  }
                  labelStyle={{ color: isDarkMode ? '#f1f5f9' : '#0f172a', fontWeight: 600 }}
                  formatter={(v) => [`${(v / 1e6).toFixed(1)}M`, 'Volume']}
                />
                <Bar dataKey="volume" fill="#006d35" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── Top Movers table ── */}
      <div className={`border rounded-2xl p-5 shadow-sm ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}>
        <div className="mb-4 flex justify-between items-baseline">
          <h3 className={`text-base font-semibold m-0 ${isDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>Top Movers</h3>
          <span className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>Live prices</span>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className={`h-12 rounded-xl animate-pulse ${isDarkMode ? 'bg-slate-800' : 'bg-gray-100'}`} />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className={`border-b ${isDarkMode ? 'border-slate-850' : 'border-gray-100'}`}>
                  {['Symbol', 'Name', 'Price', 'Change', '% Change', 'Volume'].map((h) => (
                    <th
                      key={h}
                      className={`text-left px-4 py-3 font-semibold uppercase text-xs tracking-wider first:rounded-tl-lg last:rounded-tr-lg ${
                        isDarkMode
                          ? 'bg-slate-800/50 text-slate-400'
                          : 'bg-gray-50 text-gray-500'
                      }`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stocks.map((stock, idx) => (
                  <tr
                    key={stock.symbol}
                    onClick={() => setSelectedSymbol(stock.symbol)}
                    className={`border-b cursor-pointer transition-colors duration-150 ${
                      isDarkMode
                        ? `border-slate-800/50 hover:bg-slate-800/60 ${selectedSymbol === stock.symbol ? 'bg-slate-800/80' : ''}`
                        : `border-gray-50 hover:bg-green-50/50 ${selectedSymbol === stock.symbol ? 'bg-green-50/70' : ''}`
                    }`}
                  >
                    <td className="px-4 py-3.5">
                      <span className={`font-bold font-mono px-2 py-0.5 rounded-md text-xs ${
                        isDarkMode ? 'bg-green-950/80 text-green-400' : 'bg-green-100 text-green-700'
                      }`}>{stock.symbol}</span>
                    </td>
                    <td className={`px-4 py-3.5 text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>{stock.name}</td>
                    <td className={`px-4 py-3.5 font-semibold ${isDarkMode ? 'text-slate-100' : 'text-gray-950'}`}>${stock.price?.toFixed(2)}</td>
                    <td className={`px-4 py-3.5 flex items-center gap-1.5 font-medium ${stock.change >= 0 ? 'text-emerald-555' : 'text-red-500'}`}>
                      {stock.change >= 0 ? <TrendingUp size={14} className="text-emerald-500" /> : <TrendingDown size={14} className="text-red-500" />}
                      <span className={stock.change >= 0 ? 'text-emerald-550' : 'text-red-500'}>
                        {stock.change >= 0 ? '+' : ''}${stock.change?.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-semibold">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                        stock.changePercent >= 0
                          ? (isDarkMode ? 'bg-emerald-950/60 text-emerald-400' : 'bg-emerald-50 text-emerald-700')
                          : (isDarkMode ? 'bg-rose-950/60 text-rose-400' : 'bg-red-50 text-red-600')
                      }`}>
                        {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent?.toFixed(2)}%
                      </span>
                    </td>
                    <td className={`px-4 py-3.5 text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                      {stock.volume ? `${(stock.volume / 1e6).toFixed(1)}M` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {/* ── Latest Headlines ── */}
      <LatestHeadlines isDarkMode={isDarkMode} />

    </div>
  );
}

export default Dashboard;
