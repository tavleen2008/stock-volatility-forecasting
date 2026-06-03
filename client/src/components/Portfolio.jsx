import React, { useState, useEffect, useCallback } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart as PieChartComponent, Pie, Cell,
} from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, PieChart, Trash2, RefreshCw } from 'lucide-react';
import { stocksApi } from '../utils/api';

import { TRACKED_SYMBOLS, INITIAL_HOLDINGS } from '../utils/constants';

const LIGHT_COLORS = ['#0f766e', '#2563eb', '#f59e0b', '#db2777', '#7c3aed', '#16a34a'];
const DARK_COLORS  = ['#22d3ee', '#a78bfa', '#fbbf24', '#fb7185', '#34d399', '#60a5fa'];

function PortfolioPieLabel({ cx, cy, midAngle, outerRadius, percent, payload, fill, isDarkMode }) {
  if (!payload?.symbol || percent < 0.06) return null;

  const RADIAN = Math.PI / 180;
  const radius = outerRadius + 22;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill={fill}
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      fontSize={12}
      fontWeight={700}
      style={{ filter: isDarkMode ? 'drop-shadow(0 2px 8px rgba(0,0,0,0.45))' : 'none' }}
    >
      {payload.symbol}
    </text>
  );
}

function Portfolio({ isDarkMode = false }) {
  const [liveQuotes, setLiveQuotes]       = useState({});
  const [holdings, setHoldings]           = useState(INITIAL_HOLDINGS);
  const [performanceData, setPerformanceData] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState(null);

  const loadQuotes = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const data = await stocksApi.list();
      const map = {};
      for (const q of data.stocks || []) map[q.symbol] = q;
      setLiveQuotes(map);
    } catch (e) { setError(e.message); }
    finally     { setLoading(false); }
  }, []);

  useEffect(() => { loadQuotes(); }, [loadQuotes]);

  const enriched = holdings.map((h) => {
    const q = liveQuotes[h.symbol];
    const currentPrice = q?.price ?? h.buyPrice;
    const value    = currentPrice * h.shares;
    const costBasis = h.buyPrice * h.shares;
    const gain     = value - costBasis;
    const gainPct  = (gain / costBasis) * 100;
    return { ...h, currentPrice, value, gain, gainPercent: gainPct, change: q?.change, changePercent: q?.changePercent };
  });

  const totalValue = enriched.reduce((s, h) => s + h.value, 0);
  const totalGain  = enriched.reduce((s, h) => s + h.gain, 0);
  const totalCost  = enriched.reduce((s, h) => s + h.buyPrice * h.shares, 0);
  const gainPct    = totalCost > 0 ? (totalGain / totalCost) * 100 : 0;
  const bestHolder = [...enriched].sort((a, b) => b.gainPercent - a.gainPercent)[0];

  useEffect(() => {
    if (totalValue === 0) return;
    const data = Array.from({ length: 30 }, (_, i) => ({
      day: `D${i + 1}`,
      value: totalValue * (1 + (Math.sin(i / 4) * 0.03) + (i / 30) * 0.05 + (Math.random() - 0.5) * 0.02),
    }));
    setPerformanceData(data);
  }, [totalValue]);

  const removeHolding = (id) => setHoldings((prev) => prev.filter((h) => h.id !== id));

  const summaryCards = [
    { label: 'Portfolio Value',   value: `$${totalValue.toFixed(2)}`,   sub: `${holdings.length} holdings`,                   icon: DollarSign,  isAlert: false, isNeg: false },
    { label: 'Total Gain / Loss', value: `${totalGain >= 0 ? '+' : ''}$${totalGain.toFixed(2)}`, sub: `${gainPct.toFixed(2)}% return`, icon: TrendingUp, isAlert: true, isNeg: totalGain < 0 },
    { label: 'Best Performer',    value: bestHolder?.symbol ?? '—',     sub: bestHolder ? `+${bestHolder.gainPercent.toFixed(2)}%` : '', icon: TrendingUp,  isAlert: true, isNeg: false },
    { label: 'Diversification',   value: holdings.length,               sub: 'Different stocks',                               icon: PieChart,    isAlert: false, isNeg: false },
  ];

  const pieColors = isDarkMode ? DARK_COLORS : LIGHT_COLORS;

  return (
    <div className="flex flex-col gap-6 animate-fade-in">

      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h1 className={`text-3xl font-bold mb-0.5 ${isDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>My Portfolio</h1>
          <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>{TRACKED_SYMBOLS.join(' · ')}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadQuotes}
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
      </div>

      {error && (
        <div className="bg-amber-50 border border-amber-200 text-amber-700 rounded-xl px-4 py-3 text-sm">
          ⚠ Live prices unavailable: {error}. Showing cost-basis values.
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map(({ label, value, sub, isAlert, isNeg, icon: Icon }) => {
          let valColor = isDarkMode ? 'text-slate-100' : 'text-gray-900';
          let subColor = isDarkMode ? 'text-slate-400' : 'text-gray-500';

          if (isAlert) {
            if (isNeg) {
              valColor = 'text-red-500';
              subColor = 'text-red-500';
            } else {
              valColor = isDarkMode ? 'text-emerald-400' : 'text-emerald-600';
              subColor = isDarkMode ? 'text-emerald-450' : 'text-emerald-600';
            }
          }

          return (
            <div key={label} className={`border rounded-2xl p-5 card-hover shadow-sm transition-colors duration-300 ${
              isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'
            }`}>
              <div className="flex justify-between items-start mb-4">
                <span className={`text-xs uppercase tracking-widest font-semibold ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>{label}</span>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isDarkMode ? 'bg-slate-800' : 'bg-green-50'}`}>
                  <Icon size={18} className="text-green-500" />
                </div>
              </div>
              <div className={`text-2xl font-bold mb-1 ${valColor}`}>{value}</div>
              {sub && <div className={`text-xs font-medium ${subColor}`}>{sub}</div>}
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className={`lg:col-span-2 border rounded-2xl p-5 shadow-sm ${
          isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'
        }`}>
          <h3 className={`text-base font-semibold mb-5 m-0 ${isDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>30-Day Performance (est.)</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#334155' : '#f1f5f9'} />
              <XAxis dataKey="day" stroke="#94a3b8" tick={{ fontSize: 10 }} tickCount={8} />
              <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={isDarkMode
                  ? { backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '10px', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }
                  : { backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }
                }
                labelStyle={{ color: isDarkMode ? '#f1f5f9' : '#0f172a', fontWeight: 600 }}
                formatter={(v) => [`$${Number(v).toFixed(2)}`, 'Value']}
              />
              <Line type="monotone" dataKey="value" stroke="#006d35" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className={`border rounded-2xl p-5 shadow-sm ${
          isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'
        }`}>
          <h3 className={`text-base font-semibold mb-5 m-0 ${isDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>Distribution</h3>
          <ResponsiveContainer width="100%" height={230}>
            <PieChartComponent>
              <Pie
                data={enriched}
                cx="50%"
                cy="50%"
                innerRadius={54}
                outerRadius={88}
                paddingAngle={3}
                cornerRadius={6}
                dataKey="value"
                label={(props) => (
                  <PortfolioPieLabel
                    {...props}
                    fill={pieColors[props.index % pieColors.length]}
                    isDarkMode={isDarkMode}
                  />
                )}
                labelLine={false}
                stroke={isDarkMode ? '#24262d' : '#ffffff'}
                strokeWidth={3}
              >
                {enriched.map((_, i) => (
                  <Cell key={i} fill={pieColors[i % pieColors.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(v, _, item) => [`$${Number(v).toFixed(2)}`, item?.payload?.symbol || 'Value']}
                contentStyle={isDarkMode
                  ? { backgroundColor: '#25272f', border: '1px solid rgba(255,255,255,0.10)', borderRadius: '12px', boxShadow: '0 18px 40px rgba(0,0,0,0.35)' }
                  : { backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 12px 30px rgba(15,23,42,0.12)' }
                }
                itemStyle={{ color: isDarkMode ? '#f8fafc' : '#111827' }}
                labelStyle={{ color: isDarkMode ? '#cbd5e1' : '#475569' }}
              />
            </PieChartComponent>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-2">
            {enriched.map((item, i) => (
              <div
                key={item.symbol}
                className={`flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-xs ${
                  isDarkMode ? 'bg-white/5 text-slate-300' : 'bg-gray-50 text-gray-600'
                }`}
              >
                <span className="flex items-center gap-2 min-w-0">
                  <span
                    className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                    style={{ background: pieColors[i % pieColors.length] }}
                  />
                  <span className="font-bold truncate">{item.symbol}</span>
                </span>
                <span className={`font-mono ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                  {totalValue > 0 ? `${((item.value / totalValue) * 100).toFixed(0)}%` : '0%'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Holdings table */}
      <div className={`border rounded-2xl p-5 shadow-sm ${
        isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'
      }`}>
        <div className="mb-4 flex justify-between items-baseline">
          <h3 className={`text-base font-semibold m-0 ${isDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>Your Holdings</h3>
          <span className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>{loading ? 'Fetching live prices…' : 'Live prices'}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className={`border-b ${isDarkMode ? 'border-slate-800' : 'border-gray-100'}`}>
                {['Symbol', 'Company', 'Shares', 'Buy Price', 'Current', 'Today', 'Value', 'Gain/Loss', ''].map((h) => (
                  <th key={h} className={`text-left px-4 py-3 font-semibold uppercase text-xs tracking-wider ${
                    isDarkMode ? 'bg-slate-800/50 text-slate-400' : 'bg-gray-50 text-gray-500'
                  }`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {enriched.map((s) => (
                <tr key={s.id} className={`border-b transition-colors ${
                  isDarkMode
                    ? 'border-slate-800/50 hover:bg-slate-800/60'
                    : 'border-gray-50 hover:bg-green-50/50'
                }`}>
                  <td className="px-4 py-3.5">
                    <span className={`font-bold font-mono px-2 py-0.5 rounded-md text-xs ${
                      isDarkMode ? 'bg-green-950/80 text-green-400' : 'bg-green-100 text-green-700'
                    }`}>{s.symbol}</span>
                  </td>
                  <td className={`px-4 py-3.5 text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>{s.name}</td>
                  <td className={`px-4 py-3.5 font-medium ${isDarkMode ? 'text-slate-200' : 'text-gray-700'}`}>{s.shares}</td>
                  <td className={`px-4 py-3.5 text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>${s.buyPrice.toFixed(2)}</td>
                  <td className={`px-4 py-3.5 font-semibold ${isDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>
                    {loading ? (
                      <span className={`inline-block w-16 h-4 rounded animate-pulse ${isDarkMode ? 'bg-slate-800' : 'bg-gray-200'}`} />
                    ) : (
                      `$${s.currentPrice.toFixed(2)}`
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-xs font-semibold">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                      s.changePercent >= 0
                        ? (isDarkMode ? 'bg-emerald-950/60 text-emerald-400' : 'bg-emerald-50 text-emerald-700')
                        : (isDarkMode ? 'bg-rose-950/60 text-rose-400' : 'bg-red-50 text-red-650')
                    }`}>
                      {s.changePercent != null ? `${s.changePercent >= 0 ? '+' : ''}${s.changePercent.toFixed(2)}%` : '—'}
                    </span>
                  </td>
                  <td className={`px-4 py-3.5 font-semibold ${isDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>${s.value.toFixed(2)}</td>
                  <td className={`px-4 py-3.5 font-semibold ${
                    s.gain >= 0
                      ? (isDarkMode ? 'text-emerald-400' : 'text-emerald-600')
                      : (isDarkMode ? 'text-rose-455' : 'text-red-500')
                  }`}>
                    <div className="flex items-center gap-1">
                      {s.gain >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                      ${s.gain.toFixed(2)} ({s.gainPercent.toFixed(2)}%)
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <button onClick={() => removeHolding(s.id)} className={`p-1.5 rounded-lg transition-all ${
                      isDarkMode
                        ? 'text-slate-500 hover:text-red-400 hover:bg-slate-800'
                        : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                    }`}>
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Portfolio;
