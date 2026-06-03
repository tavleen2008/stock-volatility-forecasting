import { Router, Request, Response } from 'express';
import { ForecastService } from '../forecasts/forecast.service';
import { TRACKED_SYMBOLS } from '../stocks/stock.constants';

const router = Router();

router.get('/mood', async (req: Request, res: Response) => {
    try {
        const symbols = TRACKED_SYMBOLS.map(s => s.symbol);
        let totalVolatility = 0;
        let totalSentiment = 0;
        let count = 0;

        for (const sym of symbols) {
            const forecast = await ForecastService.getLatestForecast(sym);
            if (forecast) {
                totalVolatility += forecast.forecast_volatility;
                totalSentiment += forecast.sentiment_features.average_sentiment;
                count++;
            }
        }

        const avgVol = count > 0 ? (totalVolatility / count) : 0;
        const avgSent = count > 0 ? (totalSentiment / count) : 0;

        return res.json({
            market_volatility_index: parseFloat((avgVol * 100).toFixed(2)),
            market_sentiment_score: parseFloat(avgSent.toFixed(2)),
            market_sentiment_label: avgSent > 0.1 ? "Bullish" : (avgSent < -0.1 ? "Bearish" : "Neutral"),
            analyzed_stocks_count: count
        });
    } catch (error: any) {
        console.error(`[Market Controller] Error fetching mood:`, error);
        return res.status(500).json({ message: error?.message || 'Internal server error' });
    }
});

export default router;
