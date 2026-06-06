import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Legend,
} from 'recharts';
import {
  TrendingUp, TrendingDown, RefreshCw, Plus, X, BarChart2,
} from 'lucide-react';
import { stocksApi } from '../utils/api';
import { TRACKED_SYMBOLS } from '../utils/constants';
import StarButton from './StarButton';
import { useWatchlist } from '../hooks/useWatchlist';

/* ─── Colour palette for up to 6 lines ─────────────────────────── */
const PALETTE = ['#22c55e', '#3b82f6', '#f59e0b', '#ec4899', '#a855f7', '#06b6d4'];

const RANGE_OPTIONS = [
  { label: '5D',  value: '5d'  },
  { label: '1M',  value: '1mo' },
  { label: '3M',  value: '3mo' },
  { label: '1Y',  value: '1y'  },
];

/* ─── Tooltip ────────────────────────────────────────────────────── */
function CompareTooltip({ active, payload, label, isDarkMode }) {
  if (!active || !payload?.length) return null;
  const bg     = isDarkMode ? '#1e293b' : '#ffffff';
  const border = isDarkMode ? '#334155' : '#e2e8f0';

  return (
    <div style={{
      background: bg, border: `1px solid ${border}`,
      borderRadius: 12, padding: '10px 14px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
      minWidth: 160,
    }}>
      <p style={{ margin: '0 0 8px', fontWeight: 600, fontSize: 12,
        color: isDarkMode ? '#f1f5f9' : '#0f172a' }}>
        {label}
      </p>
      {payload.map((p) => (
        <div key={p.dataKey} style={{ display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', gap: 12, marginBottom: 4 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6,
            fontSize: 12, color: isDarkMode ? '#94a3b8' : '#64748b' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%',
              background: p.color, display: 'inline-block' }} />
            {p.dataKey}
          </span>
          <span style={{ fontSize: 12, fontWeight: 700,
            color: p.value >= 0
              ? (isDarkMode ? '#4ade80' : '#16a34a')
              : (isDarkMode ? '#f87171' : '#dc2626') }}>
            {p.value >= 0 ? '+' : ''}{Number(p.value).toFixed(2)}%
          </span>
        </div>
      ))}
    </div>
  );
}

/* ─── Symbol chip (toggle on/off) ────────────────────────────────── */
function SymbolChip({ symbol, color, active, onToggle, isDarkMode }) {
  return (
    <button
      onClick={() => onToggle(symbol)}
      style={active ? { background: color, borderColor: color } : { borderColor: undefined }}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold
        cursor-pointer transition-all duration-200 select-none ${
        active
          ? 'text-white shadow-sm'
          : isDarkMode
            ? 'border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-500'
            : 'border-gray-200 bg-white text-gray-500 hover:border-gray-400'
      }`}
    >
      <span
        className="w-2 h-2 rounded-full flex-shrink-0"
        style={{ background: active ? '#fff' : color }}
      />
      {symbol}
    </button>
  );
}

/* ─── Performance badge ──────────────────────────────────────────── */
function PerfBadge({ symbol, seriesData, color, isDarkMode }) {
  if (!seriesData || seriesData.length === 0) return null;
  // Last non-null value for this symbol
  const lastPoint = [...seriesData].reverse().find(d => d[symbol] != null);
  const val = lastPoint ? lastPoint[symbol] : 0;
  const isPos = val >= 0;

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${
      isDarkMode ? 'border-slate-800 bg-slate-800/60' : 'border-gray-100 bg-gray-50'
    }`}>
      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
      <span className={`text-xs font-semibold ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
        {symbol}
      </span>
      <span className={`text-xs font-bold ml-auto ${
        isPos
          ? isDarkMode ? 'text-emerald-400' : 'text-emerald-600'
          : isDarkMode ? 'text-rose-400' : 'text-red-600'
      }`}>
        {isPos ? <TrendingUp size={11} className="inline mr-0.5" /> : <TrendingDown size={11} className="inline mr-0.5" />}
        {isPos ? '+' : ''}{val.toFixed(2)}%
      </span>
    </div>
  );
}

/* ─── Main component ─────────────────────────────────────────────── */
function StockComparison({ isDarkMode = false }) {
  const [selected, setSelected]  = useState(['AAPL', 'NVDA']); // default 2 active
  const [range, setRange]        = useState('1mo');
  const [seriesMap, setSeriesMap] = useState({});  // { AAPL: [{date, close},...], ... }
  const [loading, setLoading]    = useState({});
  const [error, setError]        = useState(null);
  const [customInput, setCustomInput] = useState('');
  const [customSymbols, setCustomSymbols] = useState([]); // extra user-added symbols
  const inputRef = useRef(null);
  const { followed, toggle: toggleFollow, isGuest } = useWatchlist();

  const allSymbols = [...new Set([...TRACKED_SYMBOLS, ...customSymbols])];

  /* Fetch history for a single symbol, normalise to % return */
  const fetchOne = useCallback(async (sym) => {
    setLoading(prev => ({ ...prev, [sym]: true }));
    try {
      const data = await stocksApi.history(sym, range);
      const hist = data.history || [];
      setSeriesMap(prev => ({ ...prev, [sym]: hist }));
    } catch (e) {
      console.warn(`Comparison: failed to fetch ${sym}:`, e.message);
    } finally {
      setLoading(prev => ({ ...prev, [sym]: false }));
    }
  }, [range]);

  /* Re-fetch all selected when range changes */
  useEffect(() => {
    setError(null);
    setSeriesMap({});  // clear stale data so bad cached entries don't persist
    selected.forEach(sym => fetchOne(sym));
  }, [range]); // eslint-disable-line

  /* Fetch newly selected symbols */
  useEffect(() => {
    selected.forEach(sym => {
      if (!seriesMap[sym] || seriesMap[sym].length === 0) fetchOne(sym);
    });
  }, [selected]); // eslint-disable-line

  /* ── Merge all selected series into one array keyed by date ── */
  const chartData = (() => {
    if (selected.length === 0) return [];

    // Collect all dates across all selected symbols
    const allDates = new Set();
    selected.forEach(sym => {
      (seriesMap[sym] || []).forEach(d => allDates.add(d.date));
    });
    const sortedDates = [...allDates].sort();

    return sortedDates.map(date => {
      const row = { date };
      selected.forEach(sym => {
        const hist = seriesMap[sym] || [];
        // Use the first bar that has a valid (non-zero) close as the base
        const firstValid = hist.find(d => d.close > 0);
        const baseClose  = firstValid?.close ?? 0;
        const point = hist.find(d => d.date === date);
        if (baseClose > 0 && point && point.close > 0) {
          row[sym] = +( ((point.close - baseClose) / baseClose) * 100 ).toFixed(3);
        } else {
          row[sym] = null;
        }
      });
      return row;
    });
  })();

  const isAnyLoading = selected.some(s => loading[s]);

  /* Toggle a symbol on/off */
  const toggleSymbol = (sym) => {
    setSelected(prev =>
      prev.includes(sym)
        ? prev.length > 1 ? prev.filter(s => s !== sym) : prev // keep at least 1
        : prev.length < 6 ? [...prev, sym] : prev              // max 6 lines
    );
    // Ensure data is fetched
    if (!seriesMap[sym]) fetchOne(sym);
  };

  /* Add custom ticker */
  const addCustom = () => {
    const sym = customInput.trim().toUpperCase();
    if (!sym || allSymbols.includes(sym)) { setCustomInput(''); return; }
    setCustomSymbols(prev => [...prev, sym]);
    setSelected(prev => prev.length < 6 ? [...prev, sym] : prev);
    fetchOne(sym);
    setCustomInput('');
  };

  /* Remove custom ticker */
  const removeCustom = (sym) => {
    setCustomSymbols(prev => prev.filter(s => s !== sym));
    setSelected(prev => prev.filter(s => s !== sym));
    setSeriesMap(prev => { const n = { ...prev }; delete n[sym]; return n; });
  };

  const card   = isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200';
  const sub    = isDarkMode ? 'text-slate-400' : 'text-gray-500';
  const gridStroke = isDarkMode ? '#1e293b' : '#f1f5f9';

  return (
    <div className={`border rounded-2xl p-5 shadow-sm ${card}`}>

      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <BarChart2 size={16} className="text-green-500" />
            <h3 className={`text-base font-semibold m-0 ${isDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>
              Stock Comparison
            </h3>
            {isAnyLoading && (
              <RefreshCw size={13} className="text-green-500 animate-spin" />
            )}
          </div>
          <p className={`text-xs ${sub}`}>
            Normalised to % return from first data point — select up to 6 symbols
          </p>
        </div>

        {/* Range buttons */}
        <div className="flex gap-1">
          {RANGE_OPTIONS.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => setRange(value)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border cursor-pointer transition-all ${
                range === value
                  ? 'bg-green-600 border-green-600 text-white shadow-sm'
                  : isDarkMode
                    ? 'border-slate-700 text-slate-400 hover:border-green-500 hover:text-green-400'
                    : 'border-gray-200 text-gray-500 hover:border-green-300 hover:text-green-600'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Symbol selector row ── */}
      <div className="flex flex-wrap items-center gap-2 mb-5">
        {allSymbols.map((sym, i) => (
          <div key={sym} className="flex items-center gap-1">
            <StarButton
              symbol={sym}
              followed={followed}
              toggle={toggleFollow}
              isGuest={isGuest}
              size={13}
            />
            <SymbolChip
              symbol={sym}
              color={PALETTE[allSymbols.indexOf(sym) % PALETTE.length]}
              active={selected.includes(sym)}
              onToggle={toggleSymbol}
              isDarkMode={isDarkMode}
            />
            {customSymbols.includes(sym) && (
              <button
                onClick={() => removeCustom(sym)}
                className={`p-0.5 rounded-full transition-colors ${
                  isDarkMode ? 'text-slate-600 hover:text-rose-400' : 'text-gray-300 hover:text-red-500'
                }`}
              >
                <X size={12} />
              </button>
            )}
          </div>
        ))}

       
      </div>

      {/* ── Performance badges ── */}
      {chartData.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-5">
          {selected.map((sym, i) => (
            <PerfBadge
              key={sym}
              symbol={sym}
              seriesData={chartData}
              color={PALETTE[allSymbols.indexOf(sym) % PALETTE.length]}
              isDarkMode={isDarkMode}
            />
          ))}
        </div>
      )}

      {/* ── Chart ── */}
      {selected.length === 0 ? (
        <div className={`flex items-center justify-center h-72 text-sm ${sub}`}>
          Select at least one symbol above
        </div>
      ) : isAnyLoading && chartData.length === 0 ? (
        <div className={`rounded-xl animate-pulse`} style={{ height: 260, background: isDarkMode ? '#1e293b' : '#f1f5f9' }} />
      ) : (
        <div style={{ width: '100%', height: 260 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
            <XAxis
              dataKey="date"
              stroke="#94a3b8"
              tick={{ fontSize: 10 }}
              tickCount={6}
              interval="preserveStartEnd"
            />
            <YAxis
              stroke="#94a3b8"
              tick={{ fontSize: 11 }}
              tickFormatter={v => `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`}
              domain={['auto', 'auto']}
              width={58}
            />
            <Tooltip content={<CompareTooltip isDarkMode={isDarkMode} />} />
            <ReferenceLine y={0} stroke={isDarkMode ? '#475569' : '#cbd5e1'} strokeDasharray="4 2" />
            {selected.map((sym) => (
              <Line
                key={sym}
                type="monotone"
                dataKey={sym}
                stroke={PALETTE[allSymbols.indexOf(sym) % PALETTE.length]}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
        </div>
      )}

      {/* ── Legend ── */}
      <div className={`flex flex-wrap gap-4 mt-3 text-xs ${sub}`}>
        {selected.map((sym) => (
          <span key={sym} className="flex items-center gap-1.5">
            <span
              className="w-5 h-0.5 rounded-full inline-block"
              style={{ background: PALETTE[allSymbols.indexOf(sym) % PALETTE.length] }}
            />
            {sym}
          </span>
        ))}
      </div>
    </div>
  );
}

export default StockComparison;
