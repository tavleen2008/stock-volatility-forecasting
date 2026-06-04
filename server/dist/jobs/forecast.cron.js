"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startForecastJob = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const prisma_1 = require("../config/prisma");
const stock_constants_1 = require("../modules/stocks/stock.constants");
const ml_client_1 = require("../modules/forecasts/ml.client");
const redis_1 = require("../config/redis");
const startForecastJob = () => {
    // Run every hour at the top of the hour (e.g., 9:00, 10:00, 11:00)
    node_cron_1.default.schedule('0 * * * *', async () => {
        console.log('[CRON] Starting hourly forecast generation...');
        try {
            for (const { symbol } of stock_constants_1.TRACKED_SYMBOLS) {
                try {
                    const forecastData = await ml_client_1.mlClient.getLatestForecast(symbol);
                    await prisma_1.prisma.forecast.create({
                        data: {
                            symbol: forecastData.ticker,
                            forecastDate: new Date(forecastData.forecast_for),
                            forecastVolatility: forecastData.forecast_volatility,
                            confidenceScore: forecastData.confidence_score,
                            sentimentScore: forecastData.sentiment_features.average_sentiment,
                            fullPayload: forecastData,
                        }
                    });
                    await (0, redis_1.safeSetex)(`forecast:latest:${symbol}`, 3600, JSON.stringify(forecastData));
                    console.log(`[CRON] Saved and cached forecast for ${symbol}`);
                }
                catch (err) {
                    console.error(`[CRON] Error saving forecast for ${symbol}:`, err?.message);
                }
            }
            console.log('[CRON] Forecast generation complete. Invalidating aggregate caches...');
            // We delete these aggregate caches so they rebuild using the freshly warmed 'latest' data on next request
            await (0, redis_1.safeDel)('forecast:opportunities');
            await (0, redis_1.safeDel)('market:mood');
            console.log('[CRON] Daily forecast generation complete.');
        }
        catch (error) {
            console.error('[CRON] Error in forecast job:', error);
        }
    });
};
exports.startForecastJob = startForecastJob;
