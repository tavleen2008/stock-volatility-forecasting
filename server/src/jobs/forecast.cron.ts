import cron from 'node-cron';
import { prisma } from '../config/prisma';
import { TRACKED_SYMBOLS } from '../modules/stocks/stock.constants';
import { mlClient } from '../modules/forecasts/ml.client';
import { safeDel, safeSetex } from '../config/redis';

export const startForecastJob = () => {

    // Run every hour at the top of the hour (e.g., 9:00, 10:00, 11:00)
    cron.schedule('0 * * * *', async () => {
        console.log('[CRON] Starting hourly forecast generation...');
        try {
            for (const { symbol } of TRACKED_SYMBOLS) {
                try {
                    const forecastData = await mlClient.getLatestForecast(symbol);
                    
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
                    
                    await safeSetex(`forecast:latest:${symbol}`, 3600, JSON.stringify(forecastData));
                    
                    console.log(`[CRON] Saved and cached forecast for ${symbol}`);
                } catch (err: any) {
                    console.error(`[CRON] Error saving forecast for ${symbol}:`, err?.message);
                }
            }
            
            console.log('[CRON] Forecast generation complete. Invalidating aggregate caches...');
            // We delete these aggregate caches so they rebuild using the freshly warmed 'latest' data on next request
            await safeDel('forecast:opportunities');
            await safeDel('market:mood');
            
            console.log('[CRON] Daily forecast generation complete.');
        } catch (error) {
            console.error('[CRON] Error in forecast job:', error);
        }
    });
};
