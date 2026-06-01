"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchStockDashboard = exports.fetchStockHistory = exports.fetchTrackedStocksList = exports.fetchStockMetrics = void 0;
const yahoo_finance2_1 = __importDefault(require("yahoo-finance2"));
const redis_1 = require("../../config/redis");
const news_service_1 = require("../news/news.service");
const yahooFinance = new yahoo_finance2_1.default();
// The tracked universe shown on the dashboard
const TRACKED_SYMBOLS = [
    { symbol: 'AAPL', name: 'Apple Inc.' },
    { symbol: 'NVDA', name: 'NVIDIA Corporation' },
    { symbol: 'TSLA', name: 'Tesla, Inc.' },
    { symbol: 'MSFT', name: 'Microsoft Corporation' },
    { symbol: 'GOOGL', name: 'Alphabet Inc.' },
    { symbol: 'AMZN', name: 'Amazon.com, Inc.' },
    { symbol: 'META', name: 'Meta Platforms, Inc.' },
    { symbol: 'JPM', name: 'JPMorgan Chase & Co.' },
];
// ────────────────────────────────────────────────────
//  Individual stock metrics
// ────────────────────────────────────────────────────
const fetchStockMetrics = async (symbol) => {
    const cacheKey = `stock:metrics:${symbol}`;
    try {
        const cached = await (0, redis_1.safeGet)(cacheKey);
        if (cached) {
            console.log(`[Stock Service] Cache HIT for ${symbol} metrics`);
            return JSON.parse(cached);
        }
        console.log(`[Stock Service] Cache MISS for ${symbol} metrics. Fetching live...`);
        const result = await yahooFinance.quote(symbol);
        if (!result)
            return null;
        const metrics = {
            symbol: result.symbol,
            currentPrice: result.regularMarketPrice || 0,
            dayHigh: result.regularMarketDayHigh || 0,
            dayLow: result.regularMarketDayLow || 0,
            openPrice: result.regularMarketOpen || 0,
            previousClose: result.regularMarketPreviousClose || 0,
            volume: result.regularMarketVolume || 0,
            marketCap: result.marketCap || null,
            currency: result.currency || "USD",
            exchange: result.exchange || undefined,
            updatedAt: new Date().toISOString()
        };
        await (0, redis_1.safeSetex)(cacheKey, 60, JSON.stringify(metrics));
        return metrics;
    }
    catch (error) {
        console.error(`[Stock Service] Error fetching metrics for ${symbol}:`, error);
        return null;
    }
};
exports.fetchStockMetrics = fetchStockMetrics;
// ────────────────────────────────────────────────────
//  Tracked stocks list (for dashboard table)
// ────────────────────────────────────────────────────
const fetchTrackedStocksList = async () => {
    const cacheKey = 'stock:list';
    try {
        const cached = await (0, redis_1.safeGet)(cacheKey);
        if (cached)
            return JSON.parse(cached);
        const results = await Promise.allSettled(TRACKED_SYMBOLS.map(async ({ symbol, name }) => {
            try {
                const q = await yahooFinance.quote(symbol);
                const price = q.regularMarketPrice ?? 0;
                const prevClose = q.regularMarketPreviousClose ?? price;
                const change = +(price - prevClose).toFixed(2);
                const changePercent = prevClose ? +((change / prevClose) * 100).toFixed(2) : 0;
                return {
                    symbol,
                    name: q.longName || q.shortName || name,
                    price,
                    change,
                    changePercent,
                    volume: q.regularMarketVolume ?? 0,
                    marketCap: q.marketCap ?? null,
                };
            }
            catch {
                return { symbol, name, price: 0, change: 0, changePercent: 0, volume: 0, marketCap: null };
            }
        }));
        const stocks = results
            .filter((r) => r.status === 'fulfilled')
            .map(r => r.value);
        await (0, redis_1.safeSetex)(cacheKey, 60, JSON.stringify(stocks));
        return stocks;
    }
    catch (error) {
        console.error('[Stock Service] Error fetching tracked stocks list:', error);
        return [];
    }
};
exports.fetchTrackedStocksList = fetchTrackedStocksList;
// ────────────────────────────────────────────────────
//  Historical price data (for charts)
// ────────────────────────────────────────────────────
const RANGE_TO_PARAMS = {
    '1d': { period1: daysAgo(2), interval: '1d' },
    '5d': { period1: daysAgo(5), interval: '1d' },
    '1mo': { period1: daysAgo(31), interval: '1d' },
    '3mo': { period1: daysAgo(92), interval: '1d' },
    '1y': { period1: daysAgo(366), interval: '1wk' },
};
function daysAgo(n) {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d.toISOString().split('T')[0];
}
const fetchStockHistory = async (symbol, range = '1mo') => {
    const cacheKey = `stock:history:${symbol}:${range}`;
    try {
        const cached = await (0, redis_1.safeGet)(cacheKey);
        if (cached)
            return JSON.parse(cached);
        const params = RANGE_TO_PARAMS[range] || RANGE_TO_PARAMS['1mo'];
        const result = await yahooFinance.historical(symbol, {
            period1: params.period1,
            interval: params.interval,
        });
        const history = result.map((d) => ({
            date: d.date instanceof Date ? d.date.toISOString().split('T')[0] : String(d.date),
            open: +(d.open ?? 0).toFixed(2),
            high: +(d.high ?? 0).toFixed(2),
            low: +(d.low ?? 0).toFixed(2),
            close: +(d.close ?? 0).toFixed(2),
            volume: d.volume ?? 0,
        }));
        await (0, redis_1.safeSetex)(cacheKey, 300, JSON.stringify(history)); // 5-min cache
        return history;
    }
    catch (error) {
        console.error(`[Stock Service] Error fetching history for ${symbol}:`, error);
        return [];
    }
};
exports.fetchStockHistory = fetchStockHistory;
// ────────────────────────────────────────────────────
//  Full dashboard (metrics + news + mock forecast)
// ────────────────────────────────────────────────────
const fetchStockDashboard = async (symbol) => {
    const [metrics, news] = await Promise.all([
        (0, exports.fetchStockMetrics)(symbol),
        (0, news_service_1.fetchNewsForSymbolFromDb)(symbol, 5, 1)
    ]);
    const mockForecast = {
        prediction: "UP",
        confidence: 85.5,
        targetPrice: metrics ? +(metrics.currentPrice * 1.05).toFixed(2) : 0
    };
    return { symbol, metrics, news: news || [], forecast: mockForecast };
};
exports.fetchStockDashboard = fetchStockDashboard;
