import YahooFinance from "yahoo-finance2";
import { StockMetricsResponse } from "./stock.schemas";
import { redis } from "../../config/redis";
const yahooFinance = new YahooFinance();
export const fetchStockMetrics = async (symbol: string): Promise<StockMetricsResponse | null> => {
    const cacheKey = `stock:metrics:${symbol}`;

    try {
    
        const cached = await redis.get(cacheKey);
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

       
        await redis.setex(cacheKey, 60, JSON.stringify(metrics));

        return metrics;
    } catch (error) {
        console.error(`[Stock Service] Error fetching metrics for ${symbol}:`, error);
        return null;
    }
}

import { fetchNewsForSymbolFromDb } from "../news/news.service";
import { StockDashboardResponse } from "./stock.types";

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

    return {
        symbol,
        metrics,
        news: news || [],
        forecast: mockForecast
    };
}