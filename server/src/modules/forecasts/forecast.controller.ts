import { Request, Response } from 'express';
import { ForecastService } from './forecast.service';

export const runForecast = (_req: Request, res: Response) => {
    res.json({ forecast: null });
};

export const getForecastBySymbol = async (req: Request, res: Response) => {
    try {
        const symbol = req.params.symbol?.trim().toUpperCase();
        if (!symbol) {
            return res.status(400).json({ message: 'Stock symbol is required' });
        }

        const forecast = await ForecastService.getVolatilityForecast(symbol);
        if (!forecast) {
            return res.status(404).json({ message: `Volatility forecast for symbol ${symbol} not found or symbol is invalid` });
        }

        return res.json({ forecast });
    } catch (error: any) {
        console.error(`[Forecast Controller] Error:`, error);
        return res.status(500).json({ message: error?.message || 'Internal server error while fetching forecast' });
    }
};
