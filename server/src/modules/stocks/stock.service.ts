import YahooFinance from "yahoo-finance2";
import { StockMetricsResponse, StockDashboardResponse } from "./stock.types";
import { safeGet, safeSetex } from "../../config/redis";
import { fetchNewsForSymbolFromDb } from "../news/news.service";
import { TRACKED_SYMBOLS } from "./stock.constants";

const yahooFinance = new YahooFinance();


export const fetchStockMetrics = async (symbol: string): Promise<StockMetricsResponse | null> => {
    const cacheKey = `stock:metrics:${symbol}`;

    try {
        const cached = await safeGet(cacheKey);
        if (cached) {
            console.log(`[Stock Service] Cache HIT for ${symbol} metrics`);
            return JSON.parse(cached);
        }

        console.log(`[Stock Service] Cache MISS for ${symbol} metrics. Fetching live...`);

        const result: any = await yahooFinance.quote(symbol);
        if (!result) return null;

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

        await safeSetex(cacheKey, 60, JSON.stringify(metrics));
        return metrics;
    } catch (error) {
        console.error(`[Stock Service] Error fetching metrics for ${symbol}:`, error);
        return null;
    }
};

export const fetchTrackedStocksList = async () => {
    const cacheKey = 'stock:list';
    try {
        const cached = await safeGet(cacheKey);
        if (cached) return JSON.parse(cached);

        const results = await Promise.allSettled(
            TRACKED_SYMBOLS.map(async ({ symbol, name }) => {
                try {
                    const q: any = await yahooFinance.quote(symbol);
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
                } catch {
                    return { symbol, name, price: 0, change: 0, changePercent: 0, volume: 0, marketCap: null };
                }
            })
        );

        const stocks = results
            .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled')
            .map(r => r.value);

        await safeSetex(cacheKey, 60, JSON.stringify(stocks));
        return stocks;
    } catch (error) {
        console.error('[Stock Service] Error fetching tracked stocks list:', error);
        return [];
    }
};

const RANGE_TO_PARAMS: Record<string, { period1: string; interval: '1d' | '1wk' | '1mo' }> = {
    '1d':  { period1: daysAgo(2),  interval: '1d' },
    '5d':  { period1: daysAgo(5),  interval: '1d' },
    '1mo': { period1: daysAgo(31), interval: '1d' },
    '3mo': { period1: daysAgo(92), interval: '1d' },
    '1y':  { period1: daysAgo(366), interval: '1wk' },
};

function daysAgo(n: number): string {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d.toISOString().split('T')[0];
}

export const fetchStockHistory = async (symbol: string, range: string = '1mo') => {
    const cacheKey = `stock:history:${symbol}:${range}`;
    try {
        const cached = await safeGet(cacheKey);
        if (cached) return JSON.parse(cached);

        const params = RANGE_TO_PARAMS[range] || RANGE_TO_PARAMS['1mo'];
        const result: any = await yahooFinance.chart(symbol, {
            period1: params.period1,
            interval: params.interval,
        });

        const quotes = result.quotes || [];

        const history = quotes.map((d: any) => ({
            date: d.date instanceof Date ? d.date.toISOString().split('T')[0] : String(d.date),
            open: +(d.open ?? 0).toFixed(2),
            high: +(d.high ?? 0).toFixed(2),
            low:  +(d.low  ?? 0).toFixed(2),
            close: +(d.close ?? 0).toFixed(2),
            volume: d.volume ?? 0,
        }));

        await safeSetex(cacheKey, 300, JSON.stringify(history)); // 5-min cache
        return history;
    } catch (error) {
        console.error(`[Stock Service] Error fetching history for ${symbol}:`, error);
        return [];
    }
};

export const fetchStockDashboard = async (symbol: string): Promise<StockDashboardResponse> => {
    const [metrics, news] = await Promise.all([
        fetchStockMetrics(symbol),
        fetchNewsForSymbolFromDb(symbol, 5, 1)
    ]);

    const mockForecast = {
        prediction: "UP" as const,
        confidence: 85.5,
        targetPrice: metrics ? +(metrics.currentPrice * 1.05).toFixed(2) : 0
    };

    return { symbol, metrics, news: news || [], forecast: mockForecast };
};