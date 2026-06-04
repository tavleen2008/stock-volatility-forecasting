"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchStockProfile = exports.fetchStockOverview = exports.fetchStockDashboard = exports.fetchStockHistory = exports.fetchTrackedStocksList = exports.fetchStockMetrics = void 0;
const yahoo_finance2_1 = __importDefault(require("yahoo-finance2"));
const redis_1 = require("../../config/redis");
const news_service_1 = require("../news/news.service");
const stock_constants_1 = require("./stock.constants");
const time_constants_1 = require("../../shared/constants/time.constants");
const yahooFinance = new yahoo_finance2_1.default();
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
const fetchTrackedStocksList = async () => {
    const cacheKey = 'stock:list';
    try {
        const cached = await (0, redis_1.safeGet)(cacheKey);
        if (cached)
            return JSON.parse(cached);
        const results = await Promise.allSettled(stock_constants_1.TRACKED_SYMBOLS.map(async ({ symbol, name }) => {
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
const fetchStockHistory = async (symbol, range = '1mo') => {
    const cacheKey = `stock:history:${symbol}:${range}`;
    try {
        const cached = await (0, redis_1.safeGet)(cacheKey);
        if (cached)
            return JSON.parse(cached);
        const params = (0, time_constants_1.getRangeParams)(range);
        const result = await yahooFinance.chart(symbol, {
            period1: params.period1,
            interval: params.interval,
        });
        const quotes = result.quotes || [];
        const history = quotes.map((d) => ({
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
// ────────────────────────────────────────────────────
//  Extended stock overview (for Security Analysis → Overview)
//  Exposes P/E, EPS, beta, 52-wk range, dividend yield, etc.
// ────────────────────────────────────────────────────
const fetchStockOverview = async (symbol) => {
    const cacheKey = `stock:overview:${symbol}`;
    try {
        const cached = await (0, redis_1.safeGet)(cacheKey);
        if (cached)
            return JSON.parse(cached);
        const result = await yahooFinance.quote(symbol);
        if (!result)
            return null;
        const overview = {
            symbol: result.symbol,
            shortName: result.shortName || result.longName || symbol,
            longName: result.longName || result.shortName || symbol,
            currentPrice: result.regularMarketPrice || 0,
            previousClose: result.regularMarketPreviousClose || 0,
            openPrice: result.regularMarketOpen || 0,
            dayHigh: result.regularMarketDayHigh || 0,
            dayLow: result.regularMarketDayLow || 0,
            volume: result.regularMarketVolume || 0,
            avgVolume: result.averageDailyVolume3Month || result.averageDailyVolume10Day || 0,
            marketCap: result.marketCap || null,
            trailingPE: result.trailingPE || null,
            forwardPE: result.forwardPE || null,
            epsTrailing: result.epsTrailingTwelveMonths || null,
            epsForward: result.epsForward || null,
            beta: result.beta || null,
            fiftyTwoWeekHigh: result.fiftyTwoWeekHigh || null,
            fiftyTwoWeekLow: result.fiftyTwoWeekLow || null,
            fiftyDayAverage: result.fiftyDayAverage || null,
            twoHundredDayAverage: result.twoHundredDayAverage || null,
            dividendYield: result.dividendYield || null,
            dividendRate: result.dividendRate || null,
            exDividendDate: result.exDividendDate || null,
            earningsDate: result.earningsTimestamp || null,
            priceToBook: result.priceToBook || null,
            bookValue: result.bookValue || null,
            currency: result.currency || "USD",
            exchange: result.fullExchangeName || result.exchange || "",
            quoteType: result.quoteType || "EQUITY",
            change: result.regularMarketChange || 0,
            changePercent: result.regularMarketChangePercent || 0,
            updatedAt: new Date().toISOString(),
        };
        await (0, redis_1.safeSetex)(cacheKey, 120, JSON.stringify(overview)); // 2-min cache
        return overview;
    }
    catch (error) {
        console.error(`[Stock Service] Error fetching overview for ${symbol}:`, error);
        return null;
    }
};
exports.fetchStockOverview = fetchStockOverview;
// ────────────────────────────────────────────────────
//  Company profile (for Security Analysis → Description)
//  Uses quoteSummary assetProfile module
// ────────────────────────────────────────────────────
const fetchStockProfile = async (symbol) => {
    const cacheKey = `stock:profile:${symbol}`;
    try {
        const cached = await (0, redis_1.safeGet)(cacheKey);
        if (cached)
            return JSON.parse(cached);
        const result = await yahooFinance.quoteSummary(symbol, {
            modules: ['assetProfile', 'summaryDetail', 'price'],
        });
        if (!result)
            return null;
        const ap = result.assetProfile || {};
        const sd = result.summaryDetail || {};
        const pr = result.price || {};
        const profile = {
            symbol,
            longName: pr.longName || pr.shortName || symbol,
            shortName: pr.shortName || symbol,
            sector: ap.sector || null,
            industry: ap.industry || null,
            website: ap.website || null,
            country: ap.country || null,
            city: ap.city || null,
            state: ap.state || null,
            address: ap.address1 || null,
            fullTimeEmployees: ap.fullTimeEmployees || null,
            longBusinessSummary: ap.longBusinessSummary || null,
            // Extra from summaryDetail
            marketCap: sd.marketCap || pr.marketCap || null,
            currency: pr.currency || "USD",
            exchange: pr.exchangeName || "",
            updatedAt: new Date().toISOString(),
        };
        await (0, redis_1.safeSetex)(cacheKey, 600, JSON.stringify(profile)); // 10-min cache (rarely changes)
        return profile;
    }
    catch (error) {
        console.error(`[Stock Service] Error fetching profile for ${symbol}:`, error);
        return null;
    }
};
exports.fetchStockProfile = fetchStockProfile;
