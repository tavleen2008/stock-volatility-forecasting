import React, { useState, useEffect, useCallback } from 'react';
import {
  Newspaper, RefreshCw, ExternalLink, ChevronLeft, ChevronRight,
  TrendingUp, TrendingDown, Minus, Clock, Radio,
} from 'lucide-react';
import { newsApi } from '../utils/api';
import { TRACKED_SYMBOLS } from '../utils/constants';

/* ─── Sentiment detection ──────────────────────────────────────────── */
const BULLISH_WORDS = [
  'surge', 'surges', 'rally', 'rallies', 'gain', 'gains', 'soar', 'soars',
  'rise', 'rises', 'beat', 'beats', 'record', 'high', 'profit', 'bullish',
  'upgrade', 'strong', 'growth', 'positive', 'outperform', 'buy', 'breakthrough',
];
const BEARISH_WORDS = [
  'drop', 'drops', 'fall', 'falls', 'decline', 'declines', 'crash', 'crashes',
  'loss', 'losses', 'miss', 'misses', 'low', 'weak', 'bearish', 'downgrade',
  'cut', 'layoff', 'layoffs', 'warning', 'risk', 'sell', 'recession', 'concern',
];

function getSentiment(text = '') {
  const lower = text.toLowerCase();
  const bullScore = BULLISH_WORDS.filter((w) => lower.includes(w)).length;
  const bearScore = BEARISH_WORDS.filter((w) => lower.includes(w)).length;
  if (bullScore > bearScore) return 'bullish';
  if (bearScore > bullScore) return 'bearish';
  return 'neutral';
}

/* ─── Time-ago formatter ────────────────────────────────────────────── */
function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

/* ─── Skeleton card ──────────────────────────────────────────────────── */
function SkeletonCard({ isDarkMode }) {
  const bg   = isDarkMode ? 'bg-slate-800' : 'bg-gray-200';
  const card = isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200';
  return (
    <div className={`border rounded-2xl p-5 animate-pulse ${card}`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className={`h-3 rounded-full w-20 ${bg}`} />
        <div className={`h-3 rounded-full w-14 ${bg}`} />
      </div>
      <div className={`h-4 rounded-full w-full mb-2 ${bg}`} />
      <div className={`h-4 rounded-full w-4/5 mb-4 ${bg}`} />
      <div className={`h-3 rounded-full w-2/3 ${bg}`} />
    </div>
  );
}

/* ─── Sentiment badge ────────────────────────────────────────────────── */
function SentimentBadge({ sentiment, isDarkMode }) {
  const cfg = {
    bullish: {
      icon: <TrendingUp size={12} />,
      label: 'Bullish',
      cls: isDarkMode
        ? 'bg-emerald-950/60 text-emerald-400 border-emerald-900/40'
        : 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    bearish: {
      icon: <TrendingDown size={12} />,
      label: 'Bearish',
      cls: isDarkMode
        ? 'bg-rose-950/60 text-rose-400 border-rose-900/40'
        : 'bg-red-50 text-red-700 border-red-200',
    },
    neutral: {
      icon: <Minus size={12} />,
      label: 'Neutral',
      cls: isDarkMode
        ? 'bg-slate-800 text-slate-400 border-slate-700'
        : 'bg-gray-100 text-gray-600 border-gray-200',
    },
  };
  const { icon, label, cls } = cfg[sentiment] || cfg.neutral;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${cls}`}>
      {icon}{label}
    </span>
  );
}

/* ─── Single news card ───────────────────────────────────────────────── */
function NewsCard({ article, isDarkMode }) {
  const sentiment = getSentiment(`${article.title} ${article.description || ''}`);
  const card = isDarkMode
    ? 'bg-slate-900 border-slate-800 hover:border-slate-700'
    : 'bg-white border-gray-200 hover:border-green-300';

  return (
    <a
      href={article.articleUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`group block border rounded-2xl p-5 card-hover shadow-sm transition-all duration-200 no-underline ${card}`}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-3 mb-2.5">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Symbol chip */}
          <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded-md ${
            isDarkMode ? 'bg-green-950/70 text-green-400' : 'bg-green-100 text-green-700'
          }`}>
            {article.symbol}
          </span>

          {/* Source */}
          {article.source && (
            <span className={`text-xs font-medium ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>
              {article.source}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <SentimentBadge sentiment={sentiment} isDarkMode={isDarkMode} />
        </div>
      </div>

      {/* Title */}
      <h3 className={`text-sm font-semibold leading-snug mb-2 group-hover:text-green-600 transition-colors line-clamp-2 ${
        isDarkMode ? 'text-slate-100 group-hover:text-green-400' : 'text-gray-900'
      }`}>
        {article.title}
      </h3>

      {/* Description */}
      {article.description && (
        <p className={`text-xs leading-relaxed mb-3 line-clamp-2 ${
          isDarkMode ? 'text-slate-400' : 'text-gray-500'
        }`}>
          {article.description}
        </p>
      )}

      {/* Footer */}
      <div className={`flex items-center justify-between text-xs ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>
        <span className="flex items-center gap-1">
          <Clock size={11} />
          {timeAgo(article.publishedAt)}
        </span>
        <span className={`flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity font-medium ${
          isDarkMode ? 'text-green-400' : 'text-green-600'
        }`}>
          Read more <ExternalLink size={11} />
        </span>
      </div>
    </a>
  );
}

/* ─── Main NewsFeed component ────────────────────────────────────────── */
const PAGE_SIZE = 9;

function NewsFeed({ isDarkMode = false }) {
  const [activeSymbol, setActiveSymbol] = useState('all');
  const [articles, setArticles]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [page, setPage]                 = useState(1);

  const load = useCallback(async (sym) => {
    setLoading(true);
    setError(null);
    try {
      let data;
      if (sym === 'all') {
        // Load news for all tracked symbols in parallel and merge
        const results = await Promise.allSettled(
          TRACKED_SYMBOLS.map((s) => newsApi.bySymbol(s))
        );
        const merged = results
          .filter((r) => r.status === 'fulfilled' && Array.isArray(r.value))
          .flatMap((r) => r.value);
        // Sort merged by publishedAt desc, deduplicate by articleUrl
        const seen = new Set();
        data = merged
          .filter((a) => { if (seen.has(a.articleUrl)) return false; seen.add(a.articleUrl); return true; })
          .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
      } else {
        data = await newsApi.bySymbol(sym);
        if (!Array.isArray(data)) data = [];
      }
      setArticles(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setPage(1);
    load(activeSymbol);
  }, [activeSymbol, load]);

  /* Sentiment counts */
  const bullCount = articles.filter(
    (a) => getSentiment(`${a.title} ${a.description || ''}`) === 'bullish'
  ).length;
  const bearCount = articles.filter(
    (a) => getSentiment(`${a.title} ${a.description || ''}`) === 'bearish'
  ).length;
  const neutralCount = articles.length - bullCount - bearCount;

  /* Pagination */
  const totalPages   = Math.max(1, Math.ceil(articles.length / PAGE_SIZE));
  const pageArticles = articles.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const card    = isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200';
  const subText = isDarkMode ? 'text-slate-400' : 'text-gray-500';

  return (
    <div className="flex flex-col gap-6 animate-fade-in">

      {/* ── Header ── */}
      <div className="flex flex-wrap justify-between items-start gap-4">
        <div>
          <h1 className={`text-3xl font-bold mb-0.5 ${isDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>
            Market News
          </h1>
          <p className={`text-sm ${subText}`}>
            Latest headlines · {TRACKED_SYMBOLS.join(' · ')}
          </p>
        </div>

        <button
          onClick={() => load(activeSymbol)}
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

      {/* ── Sentiment summary bar ── */}
      {!loading && articles.length > 0 && (
        <div className={`border rounded-2xl px-6 py-4 flex flex-wrap items-center gap-6 ${card}`}>
          <div className="flex items-center gap-2">
            <Radio size={14} className="text-green-500" />
            <span className={`text-xs font-semibold uppercase tracking-wider ${subText}`}>
              Sentiment Overview
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className={`flex items-center gap-1.5 text-sm font-semibold ${
              isDarkMode ? 'text-emerald-400' : 'text-emerald-700'
            }`}>
              <TrendingUp size={14} /> {bullCount} Bullish
            </span>
            <span className={`flex items-center gap-1.5 text-sm font-semibold ${
              isDarkMode ? 'text-rose-400' : 'text-red-600'
            }`}>
              <TrendingDown size={14} /> {bearCount} Bearish
            </span>
            <span className={`flex items-center gap-1.5 text-sm font-semibold ${subText}`}>
              <Minus size={14} /> {neutralCount} Neutral
            </span>
          </div>
          {/* Visual bar */}
          <div className="ml-auto hidden sm:flex w-40 h-2 rounded-full overflow-hidden gap-0.5">
            {articles.length > 0 && (
              <>
                <div
                  className="bg-emerald-500 rounded-full"
                  style={{ width: `${(bullCount / articles.length) * 100}%` }}
                />
                <div
                  className="bg-red-500 rounded-full"
                  style={{ width: `${(bearCount / articles.length) * 100}%` }}
                />
                <div
                  className="bg-slate-400 rounded-full flex-1"
                />
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Symbol filter chips ── */}
      <div className="flex flex-wrap gap-2">
        {['all', ...TRACKED_SYMBOLS].map((sym) => (
          <button
            key={sym}
            onClick={() => setActiveSymbol(sym)}
            className={`px-5 py-2 text-xs font-semibold rounded-xl border cursor-pointer transition-all duration-200 ${
              activeSymbol === sym
                ? 'bg-green-600 border-green-600 text-white shadow-sm shadow-green-500/20'
                : isDarkMode
                  ? 'border-slate-800 text-slate-300 bg-slate-900 hover:border-green-500 hover:text-green-400'
                  : 'border-gray-200 text-gray-600 bg-white hover:border-green-300 hover:text-green-700'
            }`}
          >
            {sym === 'all' ? '📰 All News' : sym}
          </button>
        ))}
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm flex items-center gap-2">
          ⚠ {error === 'Not Found'
            ? `No news stored yet for ${activeSymbol}. The hourly cron job collects it — check back soon, or add a NEWS_API_KEY to your .env.`
            : `Could not load news: ${error}`
          }
        </div>
      )}

      {/* ── Empty state ── */}
      {!loading && !error && articles.length === 0 && (
        <div className={`border rounded-2xl p-12 flex flex-col items-center justify-center gap-3 ${card}`}>
          <Newspaper size={40} className={isDarkMode ? 'text-slate-700' : 'text-gray-300'} />
          <p className={`text-sm font-medium ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>
            No articles found for <strong>{activeSymbol}</strong>
          </p>
          <p className={`text-xs ${isDarkMode ? 'text-slate-600' : 'text-gray-300'}`}>
            The hourly cron will collect news once a <code>NEWS_API_KEY</code> is set in your server <code>.env</code>
          </p>
        </div>
      )}

      {/* ── Skeleton loading ── */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(PAGE_SIZE)].map((_, i) => (
            <SkeletonCard key={i} isDarkMode={isDarkMode} />
          ))}
        </div>
      )}

      {/* ── News grid ── */}
      {!loading && pageArticles.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {pageArticles.map((article) => (
            <NewsCard key={article.id || article.articleUrl} article={article} isDarkMode={isDarkMode} />
          ))}
        </div>
      )}

      {/* ── Pagination ── */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl border text-sm font-medium transition-all disabled:opacity-40 ${
              isDarkMode
                ? 'border-slate-800 bg-slate-900 text-slate-300 hover:border-green-500 hover:text-green-400'
                : 'border-gray-200 bg-white text-gray-600 hover:border-green-400 hover:text-green-600'
            }`}
          >
            <ChevronLeft size={15} /> Prev
          </button>

          <span className={`text-sm font-medium ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
            Page {page} of {totalPages}
            <span className={`ml-2 text-xs ${isDarkMode ? 'text-slate-600' : 'text-gray-300'}`}>
              ({articles.length} articles)
            </span>
          </span>

          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl border text-sm font-medium transition-all disabled:opacity-40 ${
              isDarkMode
                ? 'border-slate-800 bg-slate-900 text-slate-300 hover:border-green-500 hover:text-green-400'
                : 'border-gray-200 bg-white text-gray-600 hover:border-green-400 hover:text-green-600'
            }`}
          >
            Next <ChevronRight size={15} />
          </button>
        </div>
      )}
    </div>
  );
}

export default NewsFeed;
