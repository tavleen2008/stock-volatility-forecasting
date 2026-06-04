import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  Briefcase,
  Building2,
  Gauge,
  Globe2,
  Layers,
  RefreshCw,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { forecastApi, newsApi, stocksApi } from '../utils/api';
import { INITIAL_HOLDINGS, TRACKED_SYMBOLS } from '../utils/constants';

const BULL = ['surge', 'rally', 'gain', 'soar', 'rise', 'beat', 'record', 'high', 'profit', 'bullish', 'strong', 'upgrade'];
const BEAR = ['drop', 'fall', 'decline', 'crash', 'loss', 'miss', 'low', 'weak', 'bearish', 'downgrade', 'cut', 'layoff', 'warning', 'risk'];

const TABS = [
  { key: 'snapshot', label: 'Snapshot', path: '/dashboard/snapshot', icon: ShieldCheck },
  { key: 'overview', label: 'Overview', path: '/dashboard/snapshot/s', icon: Activity },
  { key: 'description', label: 'Description', path: '/dashboard/snapshot/des', icon: Building2 },
  { key: 'rank', label: 'Percentile Rank', path: '/dashboard/snapshot/rank', icon: Gauge },
  { key: 'exposure', label: 'Exposure', path: '/dashboard/snapshot/fxp', icon: Layers },
  { key: 'holdings', label: 'Holdings', path: '/dashboard/snapshot/hds', icon: Briefcase },
];

const PIE_COLORS = ['#0f766e', '#2563eb', '#f59e0b', '#db2777', '#7c3aed', '#16a34a'];

function getTabFromPath(path) {
  if (path.includes('/snapshot/des')) return 'description';
  if (path.includes('/snapshot/rank')) return 'rank';
  if (path.includes('/snapshot/fxp')) return 'exposure';
  if (path.includes('/snapshot/hds')) return 'holdings';
  if (path.includes('/snapshot/s')) return 'overview';
  return 'snapshot';
}

function scoreSentiment(text = '') {
  const lower = text.toLowerCase();
  const bull = BULL.filter((word) => lower.includes(word)).length;
  const bear = BEAR.filter((word) => lower.includes(word)).length;
  return bull - bear;
}

function percentileRank(items, symbol, getter) {
  const values = items
    .map((item) => ({ symbol: item.symbol, value: Number(getter(item)) }))
    .filter((item) => Number.isFinite(item.value));
  const current = values.find((item) => item.symbol === symbol);
  if (!current || values.length <= 1) return null;
  const belowOrEqual = values.filter((item) => item.value <= current.value).length;
  return Math.round((belowOrEqual / values.length) * 100);
}

function formatMoney(value) {
  if (!Number.isFinite(Number(value))) return '-';
  return `$${Number(value).toFixed(2)}`;
}

function formatLarge(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return '-';
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  return `$${n.toLocaleString()}`;
}

function Card({ children, isDarkMode, className = '' }) {
  return (
    <div className={`border rounded-2xl p-5 shadow-sm ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} ${className}`}>
      {children}
    </div>
  );
}

function MetricCard({ label, value, sub, icon: Icon, tone = 'default', isDarkMode }) {
  const toneColor = {
    good: isDarkMode ? 'text-emerald-400' : 'text-emerald-600',
    warn: isDarkMode ? 'text-amber-400' : 'text-amber-600',
    bad: isDarkMode ? 'text-red-400' : 'text-red-600',
    default: isDarkMode ? 'text-slate-100' : 'text-gray-900',
  }[tone];

  return (
    <Card isDarkMode={isDarkMode}>
      <div className="flex justify-between items-start mb-3">
        <span className={`text-xs uppercase tracking-widest font-semibold ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>{label}</span>
        {Icon && (
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isDarkMode ? 'bg-slate-800' : 'bg-green-50'}`}>
            <Icon size={17} className="text-green-500" />
          </div>
        )}
      </div>
      <div className={`text-2xl font-bold ${toneColor}`}>{value}</div>
      {sub && <div className={`text-xs mt-1.5 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>{sub}</div>}
    </Card>
  );
}

function SecurityAnalysis({ isDarkMode = false }) {
  const navigate = useNavigate();
  const location = useLocation();
  const activeTab = useMemo(() => getTabFromPath(location.pathname), [location.pathname]);

  const [symbol, setSymbol] = useState(TRACKED_SYMBOLS[0]);
  const [stocks, setStocks] = useState([]);
  const [overview, setOverview] = useState(null);
  const [profile, setProfile] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadAnalysis = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [stockListRes, overviewRes, profileRes, forecastRes, newsRes] = await Promise.allSettled([
        stocksApi.list(),
        stocksApi.overview(symbol),
        stocksApi.profile(symbol),
        forecastApi.get(symbol),
        newsApi.bySymbol(symbol),
      ]);

      if (stockListRes.status === 'fulfilled') setStocks(stockListRes.value.stocks || []);
      if (overviewRes.status === 'fulfilled') setOverview(overviewRes.value);
      else setOverview(null);
      if (profileRes.status === 'fulfilled') setProfile(profileRes.value);
      else setProfile(null);
      if (forecastRes.status === 'fulfilled') setForecast(forecastRes.value.forecast || forecastRes.value);
      else setForecast(null);
      if (newsRes.status === 'fulfilled') setNews(Array.isArray(newsRes.value) ? newsRes.value : []);
      else setNews([]);

      const failed = [stockListRes, overviewRes, profileRes, forecastRes, newsRes].filter((res) => res.status === 'rejected');
      if (failed.length >= 4) setError(failed[0].reason?.message || 'Security analysis data is unavailable.');
    } finally {
      setLoading(false);
    }
  }, [symbol]);

  useEffect(() => { loadAnalysis(); }, [loadAnalysis]);

  const selectedStock = useMemo(
    () => stocks.find((stock) => stock.symbol === symbol) || {},
    [stocks, symbol]
  );

  const holding = useMemo(
    () => INITIAL_HOLDINGS.find((item) => item.symbol === symbol),
    [symbol]
  );

  const portfolioRows = useMemo(() => INITIAL_HOLDINGS.map((item) => {
    const quote = stocks.find((stock) => stock.symbol === item.symbol);
    const currentPrice = quote?.price ?? item.buyPrice;
    const value = currentPrice * item.shares;
    const cost = item.buyPrice * item.shares;
    return {
      ...item,
      currentPrice,
      value,
      gain: value - cost,
      gainPercent: cost > 0 ? ((value - cost) / cost) * 100 : 0,
      changePercent: quote?.changePercent ?? 0,
    };
  }), [stocks]);

  const totalPortfolioValue = portfolioRows.reduce((sum, item) => sum + item.value, 0);
  const holdingRow = portfolioRows.find((item) => item.symbol === symbol);
  const holdingWeight = holdingRow && totalPortfolioValue > 0 ? (holdingRow.value / totalPortfolioValue) * 100 : 0;

  const sentimentScore = useMemo(
    () => news.reduce((sum, item) => sum + scoreSentiment(`${item.title || ''} ${item.description || ''}`), 0),
    [news]
  );

  const rankRows = useMemo(() => {
    const enriched = stocks.map((stock) => {
      const portfolioItem = portfolioRows.find((item) => item.symbol === stock.symbol);
      return {
        ...stock,
        holdingWeight: portfolioItem && totalPortfolioValue > 0 ? (portfolioItem.value / totalPortfolioValue) * 100 : 0,
      };
    });

    return [
      { label: 'Daily Return', value: percentileRank(enriched, symbol, (item) => item.changePercent), metric: `${selectedStock.changePercent != null ? selectedStock.changePercent.toFixed(2) : '-'}%` },
      { label: 'Trading Volume', value: percentileRank(enriched, symbol, (item) => item.volume), metric: selectedStock.volume ? `${(selectedStock.volume / 1e6).toFixed(1)}M` : '-' },
      { label: 'Portfolio Weight', value: percentileRank(enriched, symbol, (item) => item.holdingWeight), metric: `${holdingWeight.toFixed(1)}%` },
      { label: 'Forecast Volatility', value: forecast?.historicalVolatility ? Math.min(99, Math.round(Number(forecast.historicalVolatility))) : null, metric: forecast?.historicalVolatility ? `${forecast.historicalVolatility}%` : '-' },
    ];
  }, [forecast, holdingWeight, portfolioRows, selectedStock, stocks, symbol, totalPortfolioValue]);

  const riskScore = useMemo(() => {
    const vol = Number(forecast?.historicalVolatility) || 35;
    const dailyMove = Math.abs(Number(selectedStock.changePercent) || 0) * 8;
    const sentimentRisk = sentimentScore < 0 ? Math.abs(sentimentScore) * 8 : 0;
    const concentrationRisk = holdingWeight > 30 ? 18 : holdingWeight > 20 ? 10 : 4;
    return Math.max(5, Math.min(99, Math.round(vol + dailyMove + sentimentRisk + concentrationRisk)));
  }, [forecast, holdingWeight, selectedStock, sentimentScore]);

  const riskLevel = riskScore >= 70 ? 'high' : riskScore >= 40 ? 'medium' : 'low';
  const riskTone = riskLevel === 'high' ? 'bad' : riskLevel === 'medium' ? 'warn' : 'good';
  const exposureRows = [
    { name: 'Selected Security', value: holdingWeight || 0 },
    { name: 'Other Holdings', value: Math.max(0, 100 - holdingWeight) },
  ];
  const tab = TABS.find((item) => item.key === activeTab) || TABS[0];

  const navigateTab = (item) => {
    navigate(item.path);
  };

  const field = (source, keys) => {
    for (const key of keys) {
      if (source?.[key] != null && source[key] !== '') return source[key];
    }
    return null;
  };

  const companyName = field(profile, ['longName', 'shortName', 'name', 'companyName']) || field(overview, ['longName', 'shortName', 'name', 'companyName']) || selectedStock.name || symbol;
  const sector = field(profile, ['sector']) || field(overview, ['sector']) || 'Not available';
  const industry = field(profile, ['industry']) || field(overview, ['industry']) || 'Not available';
  const description = field(profile, ['description', 'longBusinessSummary']) || 'Company description is not available from the current data source.';
  const price = selectedStock.price ?? forecast?.currentPrice;

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="flex flex-wrap justify-between items-start gap-4">
        <div>
          <h1 className={`text-3xl font-bold mb-0.5 ${isDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>Security Analysis</h1>
          <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>{tab.label} analysis for {symbol}</p>
        </div>

        <div className="flex gap-2">
          <select
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            className={`min-w-28 rounded-xl border px-3 py-2.5 text-sm font-semibold outline-none transition-colors ${
              isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-gray-200 text-gray-800'
            }`}
          >
            {TRACKED_SYMBOLS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <button
            onClick={loadAnalysis}
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

      <div className="flex flex-wrap gap-2">
        {TABS.map((item) => {
          const Icon = item.icon;
          const active = activeTab === item.key;
          return (
            <button
              key={item.key}
              onClick={() => navigateTab(item)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-semibold transition-all ${
                active
                  ? 'bg-green-600 border-green-600 text-white shadow-sm shadow-green-500/20'
                  : isDarkMode
                    ? 'border-slate-800 bg-slate-900 text-slate-300 hover:border-green-500 hover:text-green-400'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-green-300 hover:text-green-700'
              }`}
            >
              <Icon size={14} /> {item.label}
            </button>
          );
        })}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm flex items-center gap-2">
          <AlertTriangle size={16} /> {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, index) => (
            <div key={index} className={`h-28 rounded-2xl animate-pulse ${isDarkMode ? 'bg-slate-800' : 'bg-gray-100'}`} />
          ))}
        </div>
      ) : (
        <>
          {(activeTab === 'snapshot' || activeTab === 'overview') && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard label="Current Price" value={formatMoney(price)} sub={companyName} icon={TrendingUp} isDarkMode={isDarkMode} />
                <MetricCard
                  label="Daily Move"
                  value={`${selectedStock.changePercent != null && selectedStock.changePercent >= 0 ? '+' : ''}${selectedStock.changePercent?.toFixed?.(2) ?? '-'}%`}
                  sub={selectedStock.change != null ? `${selectedStock.change >= 0 ? '+' : ''}${formatMoney(selectedStock.change)}` : 'Live quote'}
                  icon={selectedStock.changePercent >= 0 ? TrendingUp : TrendingDown}
                  tone={selectedStock.changePercent >= 0 ? 'good' : 'bad'}
                  isDarkMode={isDarkMode}
                />
                <MetricCard label="Risk Score" value={`${riskScore}/100`} sub={`${riskLevel.toUpperCase()} risk`} icon={Gauge} tone={riskTone} isDarkMode={isDarkMode} />
                <MetricCard label="Forecast Volatility" value={forecast?.historicalVolatility ? `${forecast.historicalVolatility}%` : '-'} sub={forecast?.riskLevel ? `${forecast.riskLevel} forecast risk` : 'Forecast endpoint'} icon={Activity} tone={riskTone} isDarkMode={isDarkMode} />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <Card isDarkMode={isDarkMode} className="lg:col-span-2">
                  <h3 className={`text-base font-semibold mb-4 m-0 ${isDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>Overview</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {[
                      ['Market Cap', formatLarge(field(overview, ['marketCap', 'marketCapitalization']))],
                      ['P/E Ratio', field(overview, ['peRatio', 'trailingPE', 'priceEarningsRatio']) ?? '-'],
                      ['Beta', field(overview, ['beta']) ?? '-'],
                      ['52W High', formatMoney(field(overview, ['week52High', 'fiftyTwoWeekHigh']))],
                      ['52W Low', formatMoney(field(overview, ['week52Low', 'fiftyTwoWeekLow']))],
                      ['Volume', selectedStock.volume ? `${(selectedStock.volume / 1e6).toFixed(1)}M` : '-'],
                    ].map(([label, value]) => (
                      <div key={label} className={`rounded-xl px-4 py-3 ${isDarkMode ? 'bg-white/5' : 'bg-gray-50'}`}>
                        <div className={`text-xs mb-1 ${isDarkMode ? 'text-slate-500' : 'text-gray-500'}`}>{label}</div>
                        <div className={`text-sm font-bold ${isDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>{value}</div>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card isDarkMode={isDarkMode}>
                  <h3 className={`text-base font-semibold mb-4 m-0 ${isDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>News Sentiment</h3>
                  <div className={`text-4xl font-bold mb-2 ${sentimentScore > 0 ? 'text-emerald-500' : sentimentScore < 0 ? 'text-red-500' : isDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>
                    {sentimentScore > 0 ? 'Bullish' : sentimentScore < 0 ? 'Bearish' : 'Neutral'}
                  </div>
                  <p className={`text-sm m-0 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                    Based on {news.length} recent headline{news.length === 1 ? '' : 's'} available for {symbol}.
                  </p>
                </Card>
              </div>
            </>
          )}

          {activeTab === 'description' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Card isDarkMode={isDarkMode} className="lg:col-span-2">
                <h3 className={`text-xl font-bold mb-2 ${isDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>{companyName}</h3>
                <p className={`text-sm leading-7 ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>{description}</p>
              </Card>
              <Card isDarkMode={isDarkMode}>
                <h3 className={`text-base font-semibold mb-4 m-0 ${isDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>Profile</h3>
                {[
                  ['Sector', sector],
                  ['Industry', industry],
                  ['Exchange', field(profile, ['exchange']) || field(overview, ['exchange']) || 'Not available'],
                  ['Country', field(profile, ['country']) || 'Not available'],
                  ['Employees', field(profile, ['employees', 'fullTimeEmployees']) || 'Not available'],
                  ['Website', field(profile, ['website']) || 'Not available'],
                ].map(([label, value]) => (
                  <div key={label} className={`flex justify-between gap-4 py-2 border-b last:border-b-0 ${isDarkMode ? 'border-slate-800' : 'border-gray-100'}`}>
                    <span className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-gray-500'}`}>{label}</span>
                    <span className={`text-xs font-semibold text-right ${isDarkMode ? 'text-slate-200' : 'text-gray-800'}`}>{value}</span>
                  </div>
                ))}
              </Card>
            </div>
          )}

          {activeTab === 'rank' && (
            <Card isDarkMode={isDarkMode}>
              <h3 className={`text-base font-semibold mb-5 m-0 ${isDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>Percentile Rank vs Tracked Stocks</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={rankRows}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#334155' : '#f1f5f9'} />
                  <XAxis dataKey="label" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} domain={[0, 100]} />
                  <Tooltip formatter={(value) => [`${value ?? '-'}th percentile`, 'Rank']} />
                  <Bar dataKey="value" fill="#006d35" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-4">
                {rankRows.map((row) => (
                  <div key={row.label} className={`rounded-xl px-4 py-3 ${isDarkMode ? 'bg-white/5' : 'bg-gray-50'}`}>
                    <div className={`text-xs mb-1 ${isDarkMode ? 'text-slate-500' : 'text-gray-500'}`}>{row.label}</div>
                    <div className={`text-lg font-bold ${isDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>{row.value != null ? `${row.value}th` : '-'}</div>
                    <div className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>{row.metric}</div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {activeTab === 'exposure' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Card isDarkMode={isDarkMode}>
                <h3 className={`text-base font-semibold mb-4 m-0 ${isDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>Portfolio Exposure</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={exposureRows} dataKey="value" innerRadius={55} outerRadius={85} paddingAngle={3}>
                      {exposureRows.map((_, index) => <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(value) => [`${Number(value).toFixed(1)}%`, 'Weight']} />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
              <Card isDarkMode={isDarkMode} className="lg:col-span-2">
                <h3 className={`text-base font-semibold mb-4 m-0 ${isDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>Exposure Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    ['Portfolio Weight', `${holdingWeight.toFixed(1)}%`],
                    ['Sector', sector],
                    ['Industry', industry],
                    ['Country', field(profile, ['country']) || 'Not available'],
                    ['Risk Contribution', `${Math.min(99, Math.round((holdingWeight * riskScore) / 30))}/100`],
                    ['Concentration Flag', holdingWeight > 25 ? 'Elevated' : holdingWeight > 0 ? 'Normal' : 'No holding'],
                  ].map(([label, value]) => (
                    <div key={label} className={`rounded-xl px-4 py-3 ${isDarkMode ? 'bg-white/5' : 'bg-gray-50'}`}>
                      <div className={`text-xs mb-1 ${isDarkMode ? 'text-slate-500' : 'text-gray-500'}`}>{label}</div>
                      <div className={`text-sm font-bold ${isDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>{value}</div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {activeTab === 'holdings' && (
            <Card isDarkMode={isDarkMode}>
              <div className="flex items-center gap-2 mb-4">
                <Briefcase size={17} className="text-green-500" />
                <h3 className={`text-base font-semibold m-0 ${isDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>Holding Detail</h3>
              </div>
              {holding ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className={`border-b ${isDarkMode ? 'border-slate-800' : 'border-gray-100'}`}>
                        {['Symbol', 'Company', 'Shares', 'Buy Price', 'Current', 'Value', 'Gain / Loss', 'Portfolio Weight'].map((head) => (
                          <th key={head} className={`text-left px-4 py-3 font-semibold uppercase text-xs tracking-wider ${isDarkMode ? 'bg-slate-800/50 text-slate-400' : 'bg-gray-50 text-gray-500'}`}>{head}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr className={`border-b ${isDarkMode ? 'border-slate-800/50' : 'border-gray-50'}`}>
                        <td className="px-4 py-3.5 font-bold font-mono text-green-600">{holdingRow.symbol}</td>
                        <td className={`px-4 py-3.5 ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>{holdingRow.name}</td>
                        <td className={`px-4 py-3.5 ${isDarkMode ? 'text-slate-200' : 'text-gray-800'}`}>{holdingRow.shares}</td>
                        <td className={`px-4 py-3.5 ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>{formatMoney(holdingRow.buyPrice)}</td>
                        <td className={`px-4 py-3.5 font-semibold ${isDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>{formatMoney(holdingRow.currentPrice)}</td>
                        <td className={`px-4 py-3.5 font-semibold ${isDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>{formatMoney(holdingRow.value)}</td>
                        <td className={`px-4 py-3.5 font-semibold ${holdingRow.gain >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                          {holdingRow.gain >= 0 ? '+' : ''}{formatMoney(holdingRow.gain)} ({holdingRow.gainPercent.toFixed(2)}%)
                        </td>
                        <td className={`px-4 py-3.5 font-semibold ${isDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>{holdingWeight.toFixed(1)}%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className={`rounded-xl px-4 py-8 text-center ${isDarkMode ? 'bg-white/5 text-slate-400' : 'bg-gray-50 text-gray-500'}`}>
                  {symbol} is not currently present in the local portfolio holdings.
                </div>
              )}
            </Card>
          )}

          <Card isDarkMode={isDarkMode}>
            <div className="flex flex-wrap items-center gap-3">
              <Globe2 size={16} className="text-green-500" />
              <span className={`text-sm font-semibold ${isDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>{symbol}</span>
              <span className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>{companyName}</span>
              <span className={`text-xs px-2 py-1 rounded-lg ${isDarkMode ? 'bg-slate-800 text-slate-300' : 'bg-gray-100 text-gray-600'}`}>{sector}</span>
              <span className={`text-xs px-2 py-1 rounded-lg ${isDarkMode ? 'bg-slate-800 text-slate-300' : 'bg-gray-100 text-gray-600'}`}>{industry}</span>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

export default SecurityAnalysis;
