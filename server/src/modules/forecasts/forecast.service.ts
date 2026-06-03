import { mockMlClient } from './mock.ml.client';
import { prisma } from '../../config/prisma';
import { fetchStockHistory } from '../stocks/stock.service';

export const ForecastService = {
    getLatestForecast: async (symbol: string) => {

        const dbForecast = await prisma.forecast.findFirst({
            where: { symbol },
            orderBy: { forecastDate: 'desc' },
        });

        if (dbForecast) {
            return dbForecast.fullPayload as any;
        }

        return await mockMlClient.getLatestForecast(symbol);
    },

    getForecastHistory: async (symbol: string, days: number) => {
        const fromDate = new Date();
        fromDate.setDate(fromDate.getDate() - days);

        const dbHistory = await prisma.forecast.findMany({
            where: {
                symbol,
                forecastDate: {
                    gte: fromDate,
                }
            },
            orderBy: { forecastDate: 'asc' }, // usually charts want ascending date order
        });

        if (dbHistory.length > 0) {
            // Filter to keep only the latest prediction for each day
            const dailyMap = new Map();
            for (const item of dbHistory) {
                const dateStr = item.forecastDate.toISOString().split('T')[0];
                // Since orderBy is ascending, the last item we set for a date will naturally be the latest time of that day
                dailyMap.set(dateStr, item);
            }
            
            const filteredHistory = Array.from(dailyMap.values());

            return filteredHistory.map(item => {
                const payload = item.fullPayload as any;
                return {
                    date: item.forecastDate.toISOString().split('T')[0],
                    predicted_volatility: item.forecastVolatility,
                    // Note: actual_volatility would ideally come from the stock history DB, 
                    // but we'll include it from the payload if it exists
                    actual_volatility: payload.forecast_volatility, 
                    average_sentiment: item.sentimentScore
                };
            });
        }

        // Fallback to generating mock history if DB is empty
        return await mockMlClient.getHistory(symbol, days);
    },

    getForecastSummary: async (symbol: string) => {
        const forecast = await ForecastService.getLatestForecast(symbol);
        if (!forecast) return null;

        // Generate a simple LLM-friendly summary
        return {
            symbol: forecast.ticker,
            summary_text: `As of ${forecast.generated_at}, the forecast for ${forecast.ticker} is a predicted volatility of ${(forecast.forecast_volatility * 100).toFixed(1)}%. The overall sentiment is ${forecast.sentiment_features.average_sentiment > 0 ? 'Positive' : 'Negative'} based on ${forecast.sentiment_features.article_count} recent articles.`,
            confidence: forecast.confidence_score,
            reasoning: forecast.reason
        };
    },

    getForecastAccuracy: async (symbol: string, days: number) => {
        const forecastHistory = await ForecastService.getForecastHistory(symbol, days);
        const range = days <= 5 ? '5d' : days <= 30 ? '1mo' : days <= 90 ? '3mo' : '1y';
        const realHistory = await fetchStockHistory(symbol, range);

        // Map real history by date for easy lookup
        const realHistoryMap = new Map();
        for (const item of realHistory) {
            realHistoryMap.set(item.date, item);
        }

        let totalError = 0;
        let count = 0;

        const alignedData = forecastHistory.map(forecast => {
            const realData = realHistoryMap.get(forecast.date);
            
            if (forecast.actual_volatility != null && forecast.predicted_volatility != null) {
                totalError += Math.abs(forecast.predicted_volatility - forecast.actual_volatility);
                count++;
            }

            return {
                date: forecast.date,
                predicted_volatility: forecast.predicted_volatility,
                actual_volatility: forecast.actual_volatility,
                average_sentiment: forecast.average_sentiment,
                real_historical_data: realData || null, // OHLCV
            };
        });

        const mae = count > 0 ? (totalError / count) : 0;
        const accuracy_score = count > 0 ? Math.max(0, 100 - (mae * 100)) : 0;

        return {
            symbol,
            days,
            accuracy_score: parseFloat(accuracy_score.toFixed(2)),
            mean_absolute_error: parseFloat(mae.toFixed(4)),
            data: alignedData,
        };
    },

    getForecastNewsImpact: async (symbol: string) => {
        const forecast = await ForecastService.getLatestForecast(symbol);
        if (!forecast) return null;

        const sortedNews = (forecast.top_news || []).sort((a: any, b: any) => {
            return Math.abs(b.sentiment_score) - Math.abs(a.sentiment_score);
        });

        return {
            symbol: forecast.ticker,
            sentiment_features: forecast.sentiment_features,
            top_news: sortedNews
        };
    },

    getForecastScreener: async (filters: any) => {
        const { TRACKED_SYMBOLS } = await import('../stocks/stock.constants');
        const symbols = TRACKED_SYMBOLS.map(s => s.symbol);
        
        let allForecasts = [];
        for (const sym of symbols) {
            const forecast = await ForecastService.getLatestForecast(sym);
            if (forecast) allForecasts.push(forecast);
        }

        return allForecasts.filter(f => {
            if (filters.minVolatility && f.forecast_volatility < filters.minVolatility) return false;
            if (filters.minConfidence && f.confidence_score < filters.minConfidence) return false;
            
            if (filters.sentiment && filters.sentiment !== 'all') {
                const isPositive = f.sentiment_features.average_sentiment > 0;
                if (filters.sentiment === 'positive' && !isPositive) return false;
                if (filters.sentiment === 'negative' && isPositive) return false;
            }
            return true;
        });
    },

    getForecastOpportunities: async () => {
        const { TRACKED_SYMBOLS } = await import('../stocks/stock.constants');
        const symbols = TRACKED_SYMBOLS.map(s => s.symbol);
        
        let allForecasts = [];
        for (const sym of symbols) {
            const forecast = await ForecastService.getLatestForecast(sym);
            if (forecast) allForecasts.push(forecast);
        }

        const scored = allForecasts.map(f => ({
            ...f,
            opportunity_score: f.forecast_volatility * f.confidence_score
        }));

        scored.sort((a, b) => b.opportunity_score - a.opportunity_score);

        return scored.slice(0, 5);
    }
};
