import cron from 'node-cron';
import { prisma } from '../config/prisma';
import { TRACKED_SYMBOLS } from '../modules/stocks/stock.constants';
import { mockMlClient } from '../modules/forecasts/mock.ml.client';

export const startForecastJob = () => {

    // Run every hour at the top of the hour (e.g., 9:00, 10:00, 11:00)
    cron.schedule('0 * * * *', async () => {
        console.log('[CRON] Starting hourly forecast generation...');
        try {
            for (const { symbol } of TRACKED_SYMBOLS) {
                try {
                    const forecastData = await mockMlClient.getLatestForecast(symbol);
                    
                    await prisma.forecast.create({
                        data: {
                            symbol: forecastData.ticker,
                            forecastDate: new Date(forecastData.forecast_for),
                            forecastVolatility: forecastData.forecast_volatility,
                            confidenceScore: forecastData.confidence_score,
                            sentimentScore: forecastData.sentiment_features.average_sentiment,
                            fullPayload: forecastData as any,
                        }
                    });
                    
                    console.log(`[CRON] Saved forecast for ${symbol}`);
                } catch (err: any) {
                    console.error(`[CRON] Error saving forecast for ${symbol}:`, err?.message);
                }
            }
            console.log('[CRON] Daily forecast generation complete.');
        } catch (error) {
            console.error('[CRON] Error in forecast job:', error);
        }
    });
};
