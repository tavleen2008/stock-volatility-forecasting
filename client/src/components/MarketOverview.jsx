import React, { useState, useCallback, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts';
import {
  TrendingUp, TrendingDown, Activity, RefreshCw,
  AlertTriangle, BarChart2, DollarSign, Zap, Globe2,
} from 'lucide-react';
import { stocksApi } from '../utils/api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

async function fetchMood() {
  try {
    const res = await fetch(`${API_URL}/api/market/mood`, { credentials: 'include' });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

function fmt(n) {
  const v = Number(n);
  if (!isFinite(v)) return '-';
  return `$${v.toFixed(2)}`;
}

function fmtLarge(n) {
  const v = Number(n);
  if (!isFinite(v) || v <= 0) return '-';
  if (v >= 1e12) return `$${(v / 1e12).toFixed(2)}T`;
  if (v >= 1e9)  return `$${(v / 1e9).toFixed(2)}B`;
  if (v >= 1e6)  return `$${(v / 1e6).toFixed(2)}M`;
  return `$${v.toLocaleString()}`;
}

function fmtVol(n) {
  const v = Number(n);
  if (!isFinite(v)) return '-';
  if (v >= 1e6) return `${(v / 1e6).toFixed(1)}M`;
  if (v >= 1e3) return `${(v / 1e3).toFixed(0)}K`;
  return String(v);
}

function MetricCard({ label, value, sub, textColor, icon: Icon, isDarkMode }) {
  return (
    <div className={`border rounded-2xl p-5 shadow-sm transition-colors duration-300 ${
      isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-gray-200 text-gray-900'
    }`}>
      <div className="flex justify-between items-start mb-3">
        <span className={`text-xs uppercase tracking-widest font-semibold ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>{label}</span>
        {Icon && (
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isDarkMode ? 'bg-slate-800' : 'bg-green-50'}`}>
            <Icon size={15} className="text-green-500" />
          </div>
        )}
      </div>
      <div className={`text-2xl font-bold ${textColor || (isDarkMode ? 'text-slate-100' : 'text-gray-900')}`}>{value}</div>
      {sub && <div className={`text-xs mt-1.5 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>{sub}</div>}
    </div>
  );
}

function MoodGauge({ score, label, isDarkMode }) {
  const clamped = Math.max(-1, Math.min(1, score ?? 0));
  const angle   = (clamped + 1) / 2 * 180;
  const rad     = (angle - 90) * (Math.PI / 180);
  const cx = 90, cy = 90, r = 68;
  const nx = cx + r * Math.cos(rad);
  const ny = cy + r * Math.sin(rad);
  const color = label === 'Bullish' ? '#10b981' : label === 'Bearish' ? '#ef4444' : '#f59e0b';

  return (
    <svg viewBox="0 0 180 110" className="w-full max-w-[200px] mx-auto block">
      <path d="M 22 90 A 68 68 0 0 1 158 90" fill="none" stroke={isDarkMode ? '#334155' : '#e2e8f0'} strokeWidth="14" strokeLinecap="round" />
      <path
        d={`M 22 90 A 68 68 0 ${angle > 90 ? 1 : 0} 1 ${nx.toFixed(1)} ${ny.toFixed(1)}`}
        fill="none" stroke={color} strokeWidth="14" strokeLinecap="round"
      />
      <circle cx={nx.toFixed(1)} cy={ny.toFixed(1)} r="6" fill={color} />
      <text x="90" y="108" textAnchor="middle" fontSize="13" fontWeight="700" fill={color}>{label ?? 'Neutral'}</text>
    </svg>
  );
}

export default function MarketOverview({ isDarkMode = false }) {
  const [stocks,  setStocks]  = useState([]);
  const [mood,    setMood]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [sr, mr] = await Promise.allSettled([stocksApi.list(), fetchMood()]);
      if (sr.status === 'fulfilled') setStocks(sr.value.stocks || []);
      else setError('Could not load stock data from the server.');
      if (mr.status === 'fulfilled') setMood(mr.value);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const sorted     = [...stocks].sort((a, b) => (b.changePercent ?? 0) - (a.changePercent ?? 0));
  const topGainers = sorted.filter(s => (s.changePercent ?? 0) > 0).slice(0, 5);
  const topLosers  = [...stocks].sort((a, b) => (a.changePercent ?? 0) - (b.changePercent ?? 0)).filter(s => (s.changePercent ?? 0) < 0).slice(0, 5);
  const chartData  = sorted.map(s => ({ name: s.symbol, change: +(s.changePercent ?? 0).toFixed(2) }));

  const volTone = mood?.market_volatility_index > 40 ? 'text-red-400' : mood?.market_volatility_index > 20 ? 'text-amber-400' : 'text-emerald-400';

  return (
    <div className="flex flex-col gap-6 animate-fade-in">

      {/* Header */}
      <div className="flex flex-wrap justify-between items-start gap-4">
        <div>
          <h1 className={`text-3xl font-bold mb-0.5 ${isDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>Market Overview</h1>
          <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>Live performance across tracked securities</p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm shadow-sm transition-all disabled:opacity-50 ${
            isDarkMode
              ? 'border-slate-800 bg-slate-900 text-slate-300 hover:border-green-400 hover:text-green-400'
              : 'border-gray-200 bg-white text-gray-600 hover:border-green-400 hover:text-green-600'
          }`}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm flex items-center gap-2">
          <AlertTriangle size={16} /> {error}
        </div>
      )}

      {/* Loading skeleton */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className={`h-28 rounded-2xl animate-pulse ${isDarkMode ? 'bg-slate-800' : 'bg-gray-100'}`} />
          ))}
        </div>
      ) : (
        <>
          {/* Metric cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard
              label="Tracked Stocks"
              value={stocks.length}
              sub="Live quotes"
              icon={BarChart2}
              isDarkMode={isDarkMode}
            />
            <MetricCard
              label="Advancing"
              value={stocks.filter(s => (s.changePercent ?? 0) > 0).length}
              sub={`of ${stocks.length} stocks`}
              textColor="text-emerald-500"
              icon={TrendingUp}
              isDarkMode={isDarkMode}
            />
            <MetricCard
              label="Declining"
              value={stocks.filter(s => (s.changePercent ?? 0) < 0).length}
              sub={`of ${stocks.length} stocks`}
              textColor="text-red-500"
              icon={TrendingDown}
              isDarkMode={isDarkMode}
            />
            {mood && (
              <MetricCard
                label="Volatility Index"
                value={`${mood.market_volatility_index ?? '-'}%`}
                sub={`${mood.analyzed_stocks_count} stocks analysed`}
                textColor={volTone}
                icon={Activity}
                isDarkMode={isDarkMode}
              />
            )}
          </div>

          {/* Mood gauge + bar chart */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Gauge */}
            <div className={`border rounded-2xl p-5 shadow-sm ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}>
              <h3 className={`text-base font-semibold mb-4 m-0 flex items-center gap-2 ${isDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>
                <Zap size={16} className="text-green-500" /> Market Mood
              </h3>
              {mood ? (
                <>
                  <MoodGauge score={mood.market_sentiment_score} label={mood.market_sentiment_label} isDarkMode={isDarkMode} />
                  <p className={`text-center text-xs mt-3 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                    Sentiment score: <strong className={isDarkMode ? 'text-slate-200' : 'text-gray-800'}>{mood.market_sentiment_score?.toFixed(3)}</strong>
                  </p>
                </>
              ) : (
                <div className={`text-center text-sm py-8 ${isDarkMode ? 'text-slate-400' : 'text-gray-400'}`}>
                  Mood data requires ML backend
                </div>
              )}
            </div>

            {/* Bar chart */}
            <div className={`lg:col-span-2 border rounded-2xl p-5 shadow-sm ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}>
              <h3 className={`text-base font-semibold mb-5 m-0 ${isDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>Daily % Change — All Stocks</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData} barCategoryGap="30%">
                  <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#334155' : '#f1f5f9'} />
                  <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} tickFormatter={v => `${v}%`} />
                  <Tooltip
                    formatter={v => [`${v}%`, 'Change']}
                    contentStyle={isDarkMode
                      ? { backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '10px' }
                      : { backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px' }}
                  />
                  <Bar dataKey="change" radius={[6, 6, 0, 0]}>
                    {chartData.map((d, i) => (
                      <Cell key={i} fill={d.change >= 0 ? '#10b981' : '#ef4444'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Gainers & Losers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Gainers */}
            <div className={`border rounded-2xl p-5 shadow-sm ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}>
              <h3 className={`text-base font-semibold mb-4 m-0 flex items-center gap-2 ${isDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>
                <TrendingUp size={16} className="text-emerald-500" /> Top Gainers
              </h3>
              {topGainers.length === 0
                ? <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-400'}`}>No gainers today</p>
                : (
                  <div className="flex flex-col gap-2">
                    {topGainers.map(s => (
                      <div key={s.symbol} className={`flex justify-between items-center px-3 py-2.5 rounded-xl ${isDarkMode ? 'bg-emerald-950/30' : 'bg-emerald-50'}`}>
                        <div>
                          <span className={`font-bold text-sm font-mono ${isDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>{s.symbol}</span>
                          <div className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>{fmt(s.price)}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-sm text-emerald-500">+{(s.changePercent ?? 0).toFixed(2)}%</div>
                          <div className="text-xs text-emerald-500">+{fmt(s.change)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              }
            </div>

            {/* Losers */}
            <div className={`border rounded-2xl p-5 shadow-sm ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}>
              <h3 className={`text-base font-semibold mb-4 m-0 flex items-center gap-2 ${isDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>
                <TrendingDown size={16} className="text-red-500" /> Top Losers
              </h3>
              {topLosers.length === 0
                ? <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-400'}`}>No losers today</p>
                : (
                  <div className="flex flex-col gap-2">
                    {topLosers.map(s => (
                      <div key={s.symbol} className={`flex justify-between items-center px-3 py-2.5 rounded-xl ${isDarkMode ? 'bg-red-950/30' : 'bg-red-50'}`}>
                        <div>
                          <span className={`font-bold text-sm font-mono ${isDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>{s.symbol}</span>
                          <div className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>{fmt(s.price)}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-sm text-red-500">{(s.changePercent ?? 0).toFixed(2)}%</div>
                          <div className="text-xs text-red-500">{fmt(s.change)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              }
            </div>
          </div>

          {/* Full stocks table */}
          <div className={`border rounded-2xl shadow-sm overflow-hidden ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}>
            <div className={`px-5 py-4 border-b flex items-center gap-2 ${isDarkMode ? 'border-slate-800' : 'border-gray-100'}`}>
              <Globe2 size={16} className="text-green-500" />
              <h3 className={`text-base font-semibold m-0 ${isDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>All Tracked Stocks</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className={`border-b ${isDarkMode ? 'border-slate-800' : 'border-gray-100'}`}>
                    {['Symbol', 'Price', 'Change', '% Change', 'Volume', 'Market Cap'].map(h => (
                      <th key={h} className={`text-left px-4 py-3 text-xs uppercase tracking-wider font-semibold ${
                        isDarkMode ? 'bg-slate-800/50 text-slate-400' : 'bg-gray-50 text-gray-500'
                      }`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((s, i) => (
                    <tr key={s.symbol} className={`border-b transition-colors ${
                      isDarkMode ? 'border-slate-800/50 hover:bg-slate-800/30' : 'border-gray-50 hover:bg-gray-50'
                    }`}>
                      <td className="px-4 py-3.5 font-bold font-mono text-green-600">{s.symbol}</td>
                      <td className={`px-4 py-3.5 font-semibold ${isDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>{fmt(s.price)}</td>
                      <td className={`px-4 py-3.5 font-semibold ${(s.change ?? 0) >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                        {(s.change ?? 0) >= 0 ? '+' : ''}{fmt(s.change)}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                          (s.changePercent ?? 0) >= 0
                            ? (isDarkMode ? 'bg-emerald-950/50 text-emerald-400' : 'bg-emerald-50 text-emerald-700')
                            : (isDarkMode ? 'bg-red-950/50 text-red-400' : 'bg-red-50 text-red-700')
                        }`}>
                          {(s.changePercent ?? 0) >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                          {(s.changePercent ?? 0) >= 0 ? '+' : ''}{(s.changePercent ?? 0).toFixed(2)}%
                        </span>
                      </td>
                      <td className={`px-4 py-3.5 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>{fmtVol(s.volume)}</td>
                      <td className={`px-4 py-3.5 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>{fmtLarge(s.marketCap)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
