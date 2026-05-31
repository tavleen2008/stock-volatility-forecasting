import React, { useState, useEffect, useCallback } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart as PieChartComponent, Pie, Cell,
} from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, PieChart, Plus, Trash2, RefreshCw } from 'lucide-react';
import { stocksApi } from '../utils/api';

const INITIAL_HOLDINGS = [
  { id: 1, symbol: 'AAPL', name: 'Apple Inc.',       shares: 50,  buyPrice: 150.00 },
  { id: 2, symbol: 'MSFT', name: 'Microsoft Corp.',  shares: 30,  buyPrice: 280.00 },
  { id: 3, symbol: 'NVDA', name: 'NVIDIA Corp.',     shares: 40,  buyPrice: 110.00 },
  { id: 4, symbol: 'TSLA', name: 'Tesla Inc.',       shares: 25,  buyPrice: 180.00 },
];

const COLORS = ['#22c55e', '#10b981', '#f59e0b', '#ef4444'];

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
    { label: 'Portfolio Value',   value: `$${totalValue.toFixed(2)}`,   sub: `${holdings.length} holdings`,                   icon: DollarSign,  color: '' },
    { label: 'Total Gain / Loss', value: `${totalGain >= 0 ? '+' : ''}$${totalGain.toFixed(2)}`, sub: `${gainPct.toFixed(2)}% return`, icon: TrendingUp, color: totalGain >= 0 ? 'text-emerald-600' : 'text-red-500' },
    { label: 'Best Performer',    value: bestHolder?.symbol ?? '—',     sub: bestHolder ? `+${bestHolder.gainPercent.toFixed(2)}%` : '', icon: TrendingUp,  color: 'text-emerald-600' },
    { label: 'Diversification',   value: holdings.length,               sub: 'Different stocks',                               icon: PieChart,    color: '' },
  ];

  return (
    <div className="flex flex-col gap-6 animate-fade-in">

      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-0.5">My Portfolio</h1>
          <p className="text-sm text-gray-500">AAPL · MSFT · NVDA · TSLA</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadQuotes}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-600 hover:border-green-400 hover:text-green-600 shadow-sm transition-all disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-semibold shadow-sm shadow-green-500/20 transition-all">
            <Plus size={16} /> Add Stock
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
        {summaryCards.map(({ label, value, sub, color, icon: Icon }) => (
          <div key={label} className="bg-white border border-gray-200 rounded-2xl p-5 card-hover shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <span className="text-xs uppercase tracking-widest font-semibold text-gray-500">{label}</span>
              <div className="w-9 h-9 bg-green-50 rounded-xl flex items-center justify-center">
                <Icon size={18} className="text-green-600" />
              </div>
            </div>
            <div className={`text-2xl font-bold mb-1 ${color || 'text-gray-900'}`}>{value}</div>
            {sub && <div className={`text-xs ${color || 'text-gray-500'}`}>{sub}</div>}
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <h3 className="text-base font-semibold text-gray-900 mb-5 m-0">30-Day Performance (est.)</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="day" stroke="#94a3b8" tick={{ fontSize: 10 }} tickCount={8} />
              <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
                labelStyle={{ color: '#0f172a', fontWeight: 600 }}
                formatter={(v) => [`$${Number(v).toFixed(2)}`, 'Value']}
              />
              <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <h3 className="text-base font-semibold text-gray-900 mb-5 m-0">Distribution</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChartComponent>
              <Pie data={enriched} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ symbol }) => symbol} labelLine={false}>
                {enriched.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip
                formatter={(v) => `$${Number(v).toFixed(2)}`}
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px' }}
              />
            </PieChartComponent>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Holdings table */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
        <div className="mb-4 flex justify-between items-baseline">
          <h3 className="text-base font-semibold text-gray-900 m-0">Your Holdings</h3>
          <span className="text-xs text-gray-400">{loading ? 'Fetching live prices…' : 'Live prices'}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {['Symbol', 'Company', 'Shares', 'Buy Price', 'Current', 'Today', 'Value', 'Gain/Loss', ''].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-semibold uppercase text-xs tracking-wider text-gray-500 bg-gray-50">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {enriched.map((s) => (
                <tr key={s.id} className="border-b border-gray-50 hover:bg-green-50/50 transition-colors">
                  <td className="px-4 py-3.5">
                    <span className="font-bold font-mono text-green-700 bg-green-100 px-2 py-0.5 rounded-md text-xs">{s.symbol}</span>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-gray-500">{s.name}</td>
                  <td className="px-4 py-3.5 text-gray-700 font-medium">{s.shares}</td>
                  <td className="px-4 py-3.5 text-gray-500">${s.buyPrice.toFixed(2)}</td>
                  <td className="px-4 py-3.5 font-semibold text-gray-900">
                    {loading ? <span className="inline-block w-16 h-4 rounded bg-gray-200 animate-pulse" /> : `$${s.currentPrice.toFixed(2)}`}
                  </td>
                  <td className={`px-4 py-3.5 text-xs font-semibold ${s.changePercent >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${s.changePercent >= 0 ? 'bg-emerald-50' : 'bg-red-50'}`}>
                      {s.changePercent != null ? `${s.changePercent >= 0 ? '+' : ''}${s.changePercent.toFixed(2)}%` : '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 font-semibold text-gray-900">${s.value.toFixed(2)}</td>
                  <td className={`px-4 py-3.5 font-semibold ${s.gain >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                    <div className="flex items-center gap-1">
                      {s.gain >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                      ${s.gain.toFixed(2)} ({s.gainPercent.toFixed(2)}%)
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <button onClick={() => removeHolding(s.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all">
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
