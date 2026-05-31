import YahooFinance from "yahoo-finance2";
import { StockMetricsResponse } from "./stock.schemas";
import { stockMetricsResponseSchema } from "./stock.schemas";

const yahooFinance = new YahooFinance();

export const fetchStockMetrics = async (symbol: string): Promise<StockMetricsResponse | null> => {
    try {
    
        const result: any = await yahooFinance.quote(symbol);
        
        if (!result) return null;

        
        return {
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
    } catch (error) {
        console.error(`[Stock Service] Error fetching metrics for ${symbol}:`, error);
        return null;
    }
}