"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ForecastService = void 0;
const ml_client_1 = require("./ml.client");
const prisma_1 = require("../../config/prisma");
const stock_service_1 = require("../stocks/stock.service");
const time_constants_1 = require("../../shared/constants/time.constants");
const redis_1 = require("../../config/redis");
exports.ForecastService = {
    getLatestForecast: async (symbol) => {
        const cacheKey = `forecast:latest:${symbol}`;
        const cached = await (0, redis_1.safeGet)(cacheKey);
        if (cached)
            return JSON.parse(cached);
        const dbForecast = await prisma_1.prisma.forecast.findFirst({
            where: { symbol },
            orderBy: { forecastDate: 'desc' },
        });
        let result;
        if (dbForecast) {
            result = dbForecast.fullPayload;
        }
        else {
            result = await ml_client_1.mlClient.getLatestForecast(symbol);
        }
        await (0, redis_1.safeSetex)(cacheKey, 3600, JSON.stringify(result));
        return result;
    },
    getForecastHistory: async (symbol, range) => {
        const params = (0, time_constants_1.getRangeParams)(range);
        const fromDate = new Date(params.period1);
        const dbHistory = await prisma_1.prisma.forecast.findMany({
            where: {
                symbol,
                forecastDate: {
                    gte: fromDate,
                }
            },
            orderBy: { forecastDate: 'asc' },
        });
        if (dbHistory.length > 0) {
            const dailyMap = new Map();
            for (const item of dbHistory) {
                const dateStr = item.forecastDate.toISOString().split('T')[0];
                // Since orderBy is ascending, the last item we set for a date will naturally be the latest time of that day
                dailyMap.set(dateStr, item);
            }
            const filteredHistory = Array.from(dailyMap.values());
            return filteredHistory.map(item => {
                const payload = item.fullPayload;
                return {
                    date: item.forecastDate.toISOString().split('T')[0],
                    predicted_volatility: item.forecastVolatility,
                    // Note: actual_volatility would ideally come from the stock history DB, 
                    // but we'll include it from the payload if it exists
                    actual_volatility: payload.actual_volatility || item.forecastVolatility,
                    average_sentiment: item.sentimentScore
                };
            });
        }
        // If DB is empty, return empty history
        return [];
    },
    getForecastSummary: async (symbol) => {
        const forecast = await exports.ForecastService.getLatestForecast(symbol);
        if (!forecast)
            return null;
        // Generate a simple LLM-friendly summary
        return {
            symbol: forecast.ticker,
            summary_text: `As of ${forecast.generated_at}, the forecast for ${forecast.ticker} is a predicted volatility of ${(forecast.forecast_volatility * 100).toFixed(1)}%. The overall sentiment is ${forecast.sentiment_features.average_sentiment > 0 ? 'Positive' : 'Negative'} based on ${forecast.sentiment_features.article_count} recent articles.`,
            confidence: forecast.confidence_score,
            reasoning: forecast.reason
        };
    },
    getForecastAccuracy: async (symbol, range) => {
        const forecastHistory = await exports.ForecastService.getForecastHistory(symbol, range);
        const realHistory = await (0, stock_service_1.fetchStockHistory)(symbol, range);
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
            range,
            accuracy_score: parseFloat(accuracy_score.toFixed(2)),
            mean_absolute_error: parseFloat(mae.toFixed(4)),
            data: alignedData,
        };
    },
    getForecastNewsImpact: async (symbol) => {
        const forecast = await exports.ForecastService.getLatestForecast(symbol);
        if (!forecast)
            return null;
        const sortedNews = (forecast.top_news || []).sort((a, b) => {
            return Math.abs(b.sentiment_score) - Math.abs(a.sentiment_score);
        });
        return {
            symbol: forecast.ticker,
            sentiment_features: forecast.sentiment_features,
            top_news: sortedNews
        };
    },
    getForecastScreener: async (filters) => {
        const cacheKey = `forecast:screener:${JSON.stringify(filters)}`;
        const cached = await (0, redis_1.safeGet)(cacheKey);
        if (cached)
            return JSON.parse(cached);
        const { TRACKED_SYMBOLS } = await Promise.resolve().then(() => __importStar(require('../stocks/stock.constants')));
        const symbols = TRACKED_SYMBOLS.map(s => s.symbol);
        let allForecasts = [];
        for (const sym of symbols) {
            const forecast = await exports.ForecastService.getLatestForecast(sym);
            if (forecast)
                allForecasts.push(forecast);
        }
        const filtered = allForecasts.filter(f => {
            if (filters.minVolatility && f.forecast_volatility < filters.minVolatility)
                return false;
            if (filters.minConfidence && f.confidence_score < filters.minConfidence)
                return false;
            if (filters.sentiment && filters.sentiment !== 'all') {
                const isPositive = f.sentiment_features.average_sentiment > 0;
                if (filters.sentiment === 'positive' && !isPositive)
                    return false;
                if (filters.sentiment === 'negative' && isPositive)
                    return false;
            }
            return true;
        });
        await (0, redis_1.safeSetex)(cacheKey, 3600, JSON.stringify(filtered));
        return filtered;
    },
    getForecastOpportunities: async () => {
        const cacheKey = `forecast:opportunities`;
        const cached = await (0, redis_1.safeGet)(cacheKey);
        if (cached)
            return JSON.parse(cached);
        const { TRACKED_SYMBOLS } = await Promise.resolve().then(() => __importStar(require('../stocks/stock.constants')));
        const symbols = TRACKED_SYMBOLS.map(s => s.symbol);
        let allForecasts = [];
        for (const sym of symbols) {
            const forecast = await exports.ForecastService.getLatestForecast(sym);
            if (forecast)
                allForecasts.push(forecast);
        }
        const scored = allForecasts.map(f => ({
            ...f,
            opportunity_score: f.forecast_volatility * f.confidence_score
        }));
        scored.sort((a, b) => b.opportunity_score - a.opportunity_score);
        const result = scored.slice(0, 5);
        await (0, redis_1.safeSetex)(cacheKey, 3600, JSON.stringify(result));
        return result;
    }
};
