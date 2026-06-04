import React, { useState, useEffect, useCallback } from 'react';
import { Filter, Loader2, TrendingUp, TrendingDown, ExternalLink, ShieldCheck, Zap, MessageSquare } from 'lucide-react';
import { forecastApi } from '../utils/api';

function Screener({ isDarkMode = false }) {
  const [sentiment, setSentiment] = useState('all');
  const [minVol, setMinVol] = useState(10); // in percent, default 10%
  const [minConf, setMinConf] = useState(50); // in percent, default 50%
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const runScreener = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Map percentages to decimals for the backend API
      const filters = {
        sentiment,
        minVolatility: minVol / 100,
        minConfidence: minConf / 100,
      };
      const data = await forecastApi.screener(filters);
      setResults(data || []);
    } catch (err) {
      console.error('Screener fetch failed:', err.message);
      setError(err.message || 'Failed to screen stocks');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [sentiment, minVol, minConf]);

  // Run initial query on mount
  useEffect(() => {
    runScreener();
  }, []);

  const cardBg   = isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-gray-200 text-gray-900';
  const labelCls = `block text-xs font-semibold uppercase tracking-widest mb-1.5 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`;
  const inputCls = `w-full px-3 py-2 rounded-xl border text-sm outline-none transition-all focus:ring-2 focus:ring-green-400/30 ${
    isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-100 focus:border-green-500' : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-green-500'
  }`;

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Title */}
      <div>
        <h1 className={`text-3xl font-bold mb-0.5 ${isDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>Stock Screener</h1>
        <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
          Screen and filter stocks using AI volatility forecasts, prediction confidence, and news sentiment
        </p>
      </div>

      {/* Filter Controls Card */}
      <div className={`border rounded-2xl p-5 shadow-sm ${cardBg}`}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
          {/* Sentiment Dropdown */}
          <div>
            <label htmlFor="sentiment-select" className={labelCls}>Sentiment Profile</label>
            <select
              id="sentiment-select"
              value={sentiment}
              onChange={(e) => setSentiment(e.target.value)}
              className={inputCls}
            >
              <option value="all">All Profiles</option>
              <option value="positive">Positive / Bullish</option>
              <option value="negative">Negative / Bearish</option>
            </select>
          </div>

          {/* Min Volatility Slider */}
          <div>
            <div className="flex justify-between items-baseline mb-1.5">
              <label htmlFor="vol-slider" className="text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-400">
                Min Volatility
              </label>
              <span className="text-xs font-bold text-green-500">{minVol}%</span>
            </div>
            <input
              id="vol-slider"
              type="range"
              min="0"
              max="100"
              value={minVol}
              onChange={(e) => setMinVol(Number(e.target.value))}
              className="w-full accent-green-600 cursor-pointer"
            />
          </div>

          {/* Min Confidence Slider */}
          <div>
            <div className="flex justify-between items-baseline mb-1.5">
              <label htmlFor="conf-slider" className="text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-400">
                Min Confidence
              </label>
              <span className="text-xs font-bold text-green-500">{minConf}%</span>
            </div>
            <input
              id="conf-slider"
              type="range"
              min="0"
              max="100"
              value={minConf}
              onChange={(e) => setMinConf(Number(e.target.value))}
              className="w-full accent-green-600 cursor-pointer"
            />
          </div>
        </div>

        {/* Action Button row */}
        <div className="flex justify-between items-center mt-5 pt-4 border-t border-slate-800/10 dark:border-slate-800/50">
          <span className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>
            Filters match stocks dynamically in real-time
          </span>
          <button
            onClick={runScreener}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-semibold shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? <Loader2 size={15} className="animate-spin" /> : <Filter size={15} />}
            {loading ? 'Screening…' : 'Screen Stocks'}
          </button>
        </div>
      </div>

      {/* Results Section */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
          ⚠ Screener error: {error}
        </div>
      )}

      <div className={`border rounded-2xl p-5 shadow-sm ${cardBg}`}>
        <div className="mb-4 flex justify-between items-baseline">
          <h3 className={`text-base font-semibold m-0 ${isDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>
            Matching Candidates ({results.length})
          </h3>
          <span className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>Ranked by filter match</span>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className={`h-12 rounded-xl animate-pulse ${isDarkMode ? 'bg-slate-800' : 'bg-gray-100'}`} />
            ))}
          </div>
        ) : results.length === 0 ? (
          <div className={`flex flex-col items-center justify-center p-12 text-center text-sm ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>
            No stocks matched your screen filters. Try reducing the minimum volatility or confidence thresholds.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className={`border-b ${isDarkMode ? 'border-slate-850' : 'border-gray-100'}`}>
                  {['Symbol', 'ML Predicted Volatility', 'Confidence Score', 'Opportunity Score', 'Sentiment Climate', 'Articles'].map((h) => (
                    <th
                      key={h}
                      className={`text-left px-4 py-3 font-semibold uppercase text-xs tracking-wider ${isDarkMode ? 'bg-slate-800/50 text-slate-400' : 'bg-gray-50 text-gray-500'}`}
                    >
                      {h}
                    </th>
                  ))}
                  <th className={`text-right px-4 py-3 font-semibold uppercase text-xs tracking-wider ${isDarkMode ? 'bg-slate-800/50 text-slate-400' : 'bg-gray-50 text-gray-500'}`}>Action</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r, idx) => {
                  const isPos = r.sentiment_features?.average_sentiment > 0.05;
                  const isNeg = r.sentiment_features?.average_sentiment < -0.05;

                  const oppScore = r.forecast_volatility * r.confidence_score;

                  return (
                    <tr
                      key={r.ticker || r.symbol || idx}
                      className={`border-b transition-colors duration-150 ${isDarkMode ? 'border-slate-805/50 hover:bg-slate-800/30' : 'border-gray-50 hover:bg-green-50/20'}`}
                    >
                      <td className="px-4 py-3.5 font-bold font-mono">
                        <span className={`px-2 py-0.5 rounded-md text-xs ${isDarkMode ? 'bg-green-950/80 text-green-400' : 'bg-green-100 text-green-700'}`}>
                          {r.ticker || r.symbol}
                        </span>
                      </td>
                      <td className={`px-4 py-3.5 font-semibold ${isDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>
                        {r.forecast_volatility != null ? `${(r.forecast_volatility * 100).toFixed(2)}%` : '—'}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <ShieldCheck size={14} className="text-emerald-500" />
                          <span className="font-semibold">{r.confidence_score != null ? `${(r.confidence_score * 100).toFixed(1)}%` : '—'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <Zap size={14} className="text-amber-500" />
                          <span className="font-bold text-green-600 dark:text-green-400">
                            {oppScore != null ? (oppScore * 100).toFixed(1) : '—'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          isPos
                            ? (isDarkMode ? 'bg-emerald-950/60 text-emerald-400' : 'bg-emerald-50 text-emerald-700')
                            : isNeg
                              ? (isDarkMode ? 'bg-rose-950/60 text-rose-400' : 'bg-red-50 text-red-600')
                              : (isDarkMode ? 'bg-slate-800 text-slate-400' : 'bg-gray-100 text-gray-500')
                        }`}>
                          {isPos ? <TrendingUp size={12} /> : isNeg ? <TrendingDown size={12} /> : null}
                          {isPos ? 'Bullish' : isNeg ? 'Bearish' : 'Neutral'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-405 font-medium">
                          <MessageSquare size={13} />
                          {r.sentiment_features?.article_count || 0} articles
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <button
                          onClick={() => {
                            // Navigate to volatility tab
                            window.history.pushState({}, '', '/dashboard/forecasts');
                            // Dispath router event
                            window.dispatchEvent(new PopStateEvent('popstate'));
                          }}
                          className={`text-xs font-semibold inline-flex items-center gap-1 hover:underline ${isDarkMode ? 'text-green-400' : 'text-green-650'}`}
                        >
                          Analyse <ExternalLink size={12} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Screener;
