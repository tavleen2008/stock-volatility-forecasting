"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const forecast_service_1 = require("../forecasts/forecast.service");
const stock_constants_1 = require("../stocks/stock.constants");
const redis_1 = require("../../config/redis");
const router = (0, express_1.Router)();
router.get('/mood', async (req, res) => {
    try {
        const cacheKey = 'market:mood';
        const cached = await (0, redis_1.safeGet)(cacheKey);
        if (cached)
            return res.json(JSON.parse(cached));
        const symbols = stock_constants_1.TRACKED_SYMBOLS.map(s => s.symbol);
        let totalVolatility = 0;
        let totalSentiment = 0;
        let count = 0;
        for (const sym of symbols) {
            const forecast = await forecast_service_1.ForecastService.getLatestForecast(sym);
            if (forecast) {
                totalVolatility += forecast.forecast_volatility;
                totalSentiment += forecast.sentiment_features.average_sentiment;
                count++;
            }
        }
        const avgVol = count > 0 ? (totalVolatility / count) : 0;
        const avgSent = count > 0 ? (totalSentiment / count) : 0;
        const payload = {
            market_volatility_index: parseFloat((avgVol * 100).toFixed(2)),
            market_sentiment_score: parseFloat(avgSent.toFixed(2)),
            market_sentiment_label: avgSent > 0.1 ? "Bullish" : (avgSent < -0.1 ? "Bearish" : "Neutral"),
            analyzed_stocks_count: count
        };
        await (0, redis_1.safeSetex)(cacheKey, 3600, JSON.stringify(payload));
        return res.json(payload);
    }
    catch (error) {
        console.error(`[Market Controller] Error fetching mood:`, error);
        return res.status(500).json({ message: error?.message || 'Internal server error' });
    }
});
exports.default = router;
