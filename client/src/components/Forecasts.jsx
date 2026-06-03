import React, { useState, useEffect, useCallback } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, ReferenceLine,
} from 'recharts';
import { AlertTriangle, RefreshCw, TrendingUp, TrendingDown, Activity, BarChart2 } from 'lucide-react';
import { forecastApi } from '../utils/api';

import { TRACKED_SYMBOLS } from '../utils/constants';

const getSignalConfig = (isDarkMode) => ({
  bullish: {
    label: 'Bullish',
    icon: '↑',
    textColor: isDarkMode ? 'text-emerald-450' : 'text-emerald-700',
    bg: isDarkMode ? 'bg-emerald-950/40 border-emerald-900/50' : 'bg-emerald-50 border-emerald-200',
    dot: 'bg-emerald-500',
  },
  bearish: {
    label: 'Bearish',
    icon: '↓',
    textColor: isDarkMode ? 'text-red-400' : 'text-red-700',
    bg: isDarkMode ? 'bg-red-950/40 border-red-900/50' : 'bg-red-50 border-red-200',
    dot: 'bg-red-500',
  },
  neutral: {
    label: 'Neutral',
    icon: '→',
    textColor: isDarkMode ? 'text-slate-400' : 'text-gray-600',
    bg: isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-gray-50 border-gray-200',
    dot: 'bg-slate-400',
  },
});

const getRiskStyle = (isDarkMode) => ({
  low:    { color: isDarkMode ? 'text-emerald-400' : 'text-emerald-600', bg: isDarkMode ? 'bg-emerald-950/50 text-emerald-400' : 'bg-emerald-50 text-emerald-700' },
  medium: { color: isDarkMode ? 'text-amber-400' : 'text-amber-600',   bg: isDarkMode ? 'bg-amber-950/50 text-amber-400' : 'bg-amber-50 text-amber-700' },
  high:   { color: isDarkMode ? 'text-red-400' : 'text-red-600',     bg: isDarkMode ? 'bg-red-950/50 text-red-400' : 'bg-red-50 text-red-700' },
});

function MetricCard({ label, value, sub, textColor, icon: Icon, isDarkMode }) {
  return (
    <div className={`border rounded-2xl p-5 card-hover shadow-sm transition-colors duration-300 ${
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
      <div className={`text-2xl font-bold ${textColor || (isDarkMode ? 'text-slate-100' : 'text-gray-905')}`}>{value}</div>
      {sub && <div className={`text-xs mt-1.5 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>{sub}</div>}
    </div>
  );
}

function Forecasts({ isDarkMode = false }) {
  const [symbol, setSymbol]           = useState('AAPL');
  const [inputSymbol, setInputSymbol] = useState('AAPL');
  const [forecast, setForecast]       = useState(null);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState(null);

  const loadForecast = useCallback(async (sym) => {
    setLoading(true); setError(null); setForecast(null);
    try {
      const data = await forecastApi.get(sym);
      setForecast(data.forecast);
    } catch (e) { setError(e.message); }
    finally     { setLoading(false); }
  }, []);

  useEffect(() => { loadForecast(symbol); }, [symbol, loadForecast]);

  const handleSearch = (e) => {
    e.preventDefault();
    const sym = inputSymbol.trim().toUpperCase();
    if (sym) { setSymbol(sym); }
  };

  const sig  = forecast ? (getSignalConfig(isDarkMode)[forecast.signal] || getSignalConfig(isDarkMode).neutral) : null;
  const risk = forecast ? (getRiskStyle(isDarkMode)[forecast.riskLevel] || getRiskStyle(isDarkMode).medium) : null;

  return (
    <div className="flex flex-col gap-6 animate-fade-in">

      {/* Header */}
      <div className="flex flex-wrap justify-between items-start gap-4">
        <div>
          <h1 className={`text-3xl font-bold mb-0.5 ${isDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>Volatility Forecast</h1>
          <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>Historical vol · RSI · SMA signals · Expected price range</p>
        </div>

        {/* Symbol search */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 shadow-sm transition-colors ${
            isDarkMode ? 'border-slate-800 bg-slate-900' : 'bg-white border-gray-200'
          }`}>
            <input
              value={inputSymbol}
              onChange={(e) => setInputSymbol(e.target.value.toUpperCase())}
              placeholder="Ticker (e.g. TSLA)"
              className={`bg-transparent border-none outline-none text-sm w-28 ${
                isDarkMode ? 'text-slate-100 placeholder-slate-500' : 'text-gray-900 placeholder-gray-405'
              }`}
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-semibold shadow-sm shadow-green-500/20 transition-all"
          >
            Analyse
          </button>
        </form>
      </div>

      {/* Quick-pick chips */}
      <div className="flex flex-wrap gap-2">
        {TRACKED_SYMBOLS.map((s) => (
          <button
            key={s}
            onClick={() => { setSymbol(s); setInputSymbol(s); }}
            className={`flex-1 sm:flex-initial px-5 py-2 text-xs font-semibold rounded-xl border cursor-pointer text-center transition-all duration-200
              ${symbol === s
                ? 'bg-green-600 border-green-600 text-white shadow-sm shadow-green-500/20'
                : (isDarkMode
                  ? 'border-slate-800 text-slate-300 bg-slate-900 hover:border-green-500 hover:text-green-400'
                  : 'border-gray-200 text-gray-600 bg-white hover:border-green-300 hover:text-green-700')}`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className={`h-28 rounded-2xl animate-pulse ${isDarkMode ? 'bg-slate-800' : 'bg-gray-100'}`} />
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm flex items-center gap-2">
          <AlertTriangle size={16} /> {error}
        </div>
      )}

      {forecast && !loading && (
        <>
          {/* Signal banner */}
          <div className={`rounded-2xl px-6 py-5 border ${sig.bg} flex flex-wrap items-center gap-5`}>
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${sig.dot}`} />
              <span className={`text-xl font-bold ${sig.textColor}`}>
                {sig.icon} {sig.label}
              </span>
            </div>
            <div className={`text-sm font-medium ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
              {forecast.symbol} · <span className={`font-bold ${isDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>${forecast.currentPrice?.toFixed(2)}</span>
            </div>
            <div className="ml-auto">
              <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${risk.bg}`}>
                {forecast.riskLevel?.toUpperCase()} RISK
              </span>
            </div>
          </div>

          {/* Key metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard
              label="Historical Volatility"
              value={`${forecast.historicalVolatility}%`}
              sub="Annualised (3 months)"
              textColor={risk.color}
              icon={Activity}
              isDarkMode={isDarkMode}
            />
            <MetricCard
              label="RSI (14)"
              value={forecast.rsi}
              sub={forecast.rsi < 35 ? 'Oversold zone' : forecast.rsi > 65 ? 'Overbought zone' : 'Neutral zone'}
              textColor={forecast.rsi < 35 ? 'text-emerald-400' : forecast.rsi > 65 ? 'text-red-500' : (isDarkMode ? 'text-slate-100' : 'text-gray-900')}
              icon={BarChart2}
              isDarkMode={isDarkMode}
            />
            <MetricCard
              label="5-Day Trend"
              value={`${forecast.trend >= 0 ? '+' : ''}${forecast.trend}%`}
              sub="Recent momentum"
              textColor={forecast.trend >= 0 ? 'text-emerald-400' : 'text-red-500'}
              icon={forecast.trend >= 0 ? TrendingUp : TrendingDown}
              isDarkMode={isDarkMode}
            />
            <MetricCard
              label="SMA 20 / 50"
              value={`$${forecast.sma20}`}
              sub={forecast.currentPrice > forecast.sma20 ? `vs SMA50 $${forecast.sma50} ↑ Above` : `vs SMA50 $${forecast.sma50} ↓ Below`}
              icon={Activity}
              isDarkMode={isDarkMode}
            />
          </div>

          {/* Expected ranges */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: '5-Day Expected Range (±1 SD)',  range: forecast.expectedRange5d },
              { label: '30-Day Expected Range (±1 SD)', range: forecast.expectedRange30d },
            ].map(({ label, range }) => (
              <div key={label} className={`border rounded-2xl p-5 shadow-sm ${
                isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'
              }`}>
                <h3 className={`text-sm font-semibold mb-4 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>{label}</h3>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-xs text-red-500 font-medium mb-1">Bear Case</div>
                    <div className="text-xl font-bold text-red-500">${range?.low}</div>
                  </div>
                  <div className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full h-2 rounded-full bg-gradient-to-r from-red-400 via-amber-300 to-emerald-400 opacity-70" />
                    <div className={`text-xs mt-1 ${isDarkMode ? 'text-slate-400' : 'text-gray-400'}`}>
                      Current: <strong className={isDarkMode ? 'text-slate-200' : 'text-gray-700'}>${forecast.currentPrice?.toFixed(2)}</strong>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-emerald-500 font-medium mb-1">Bull Case</div>
                    <div className="text-xl font-bold text-emerald-500">${range?.high}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Price chart */}
          <div className={`border rounded-2xl p-5 shadow-sm ${
            isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'
          }`}>
            <h3 className={`text-base font-semibold mb-5 m-0 ${isDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>
              3-Month Price History — {forecast.symbol}
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={forecast.chartData}>
                <defs>
                  <linearGradient id="fcGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#006d35" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#006d35" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#334155' : '#f1f5f9'} />
                <XAxis dataKey="date" stroke="#94a3b8" tick={{ fontSize: 11 }} tickCount={8} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} domain={['auto', 'auto']} />
                <Tooltip
                  contentStyle={isDarkMode
                    ? { backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '10px', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }
                    : { backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }
                  }
                  labelStyle={{ color: isDarkMode ? '#f1f5f9' : '#0f172a', fontWeight: 600 }}
                  formatter={(v) => [`$${Number(v).toFixed(2)}`, 'Price']}
                />
                <ReferenceLine y={forecast.sma20} stroke="#f59e0b" strokeDasharray="4 2" label={{ value: 'SMA20', fill: '#f59e0b', fontSize: 10 }} />
                <ReferenceLine y={forecast.sma50} stroke="#64748b" strokeDasharray="4 2" label={{ value: 'SMA50', fill: '#64748b', fontSize: 10 }} />
                <Area type="monotone" dataKey="price" stroke="#006d35" strokeWidth={2} fillOpacity={1} fill="url(#fcGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
            <div className={`flex gap-6 mt-3 text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
              <span><span className="text-amber-400 font-bold">── </span>SMA 20</span>
              <span><span className="text-slate-400 font-bold">── </span>SMA 50</span>
              <span><span className="text-green-500 font-bold">── </span>Price</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Forecasts;
