import { Request, Response } from 'express';
import { ForecastService } from './forecast.service';


export const getLatestForecast = async (req: Request, res: Response) => {
    try {
        const symbol = req.params.symbol?.trim().toUpperCase();
        if (!symbol) return res.status(400).json({ message: 'Stock symbol is required' });

        const forecast = await ForecastService.getLatestForecast(symbol);
        if (!forecast) return res.status(404).json({ message: `Forecast not found for ${symbol}` });

        return res.json(forecast);
    } catch (error: any) {
        console.error(`[Forecast Controller] Error fetching latest forecast:`, error);
        return res.status(500).json({ message: error?.message || 'Internal server error' });
    }
};

export const getForecastHistory = async (req: Request, res: Response) => {
    try {
        const symbol = req.params.symbol?.trim().toUpperCase();
        const range = (req.query.range as any) || '1mo';

        if (!symbol) return res.status(400).json({ message: 'Stock symbol is required' });

        const history = await ForecastService.getForecastHistory(symbol, range);
        if (!history || history.length === 0) return res.status(404).json({ message: `Forecast history not found for ${symbol}` });

        return res.json(history);
    } catch (error: any) {
        console.error(`[Forecast Controller] Error fetching history:`, error);
        return res.status(500).json({ message: error?.message || 'Internal server error' });
    }
};

export const getForecastSummary = async (req: Request, res: Response) => {
    try {
        const symbol = req.params.symbol?.trim().toUpperCase();
        if (!symbol) return res.status(400).json({ message: 'Stock symbol is required' });

        const summary = await ForecastService.getForecastSummary(symbol);
        if (!summary) return res.status(404).json({ message: `Forecast summary not found for ${symbol}` });

        return res.json({ summary });
    } catch (error: any) {
        console.error(`[Forecast Controller] Error fetching forecast summary:`, error);
        return res.status(500).json({ message: error?.message || 'Internal server error' });
    }
};


export const getForecastAccuracy = async (req: Request, res: Response) => {
    try {
        const symbol = req.params.symbol?.trim().toUpperCase();
        const range = (req.query.range as any) || '1mo';

        if (!symbol) return res.status(400).json({ message: 'Stock symbol is required' });

        const accuracyData = await ForecastService.getForecastAccuracy(symbol, range);
        if (!accuracyData) return res.status(404).json({ message: `Data not found for ${symbol}` });

        return res.json(accuracyData);
    } catch (error: any) {
        console.error(`[Forecast Controller] Error fetching accuracy:`, error);
        return res.status(500).json({ message: error?.message || 'Internal server error' });
    }
};

export const getForecastNewsImpact = async (req: Request, res: Response) => {
    try {
        const symbol = req.params.symbol?.trim().toUpperCase();
        if (!symbol) return res.status(400).json({ message: 'Stock symbol is required' });

        const newsImpact = await ForecastService.getForecastNewsImpact(symbol);
        if (!newsImpact) return res.status(404).json({ message: `News impact not found for ${symbol}` });

        return res.json(newsImpact);
    } catch (error: any) {
        console.error(`[Forecast Controller] Error fetching news impact:`, error);
        return res.status(500).json({ message: error?.message || 'Internal server error' });
    }
};

export const getForecastScreener = async (req: Request, res: Response) => {
    try {
        const filters = {
            minVolatility: req.query.minVolatility ? parseFloat(req.query.minVolatility as string) : undefined,
            sentiment: req.query.sentiment as string || 'all',
            minConfidence: req.query.minConfidence ? parseFloat(req.query.minConfidence as string) : undefined,
        };

        const screenerResults = await ForecastService.getForecastScreener(filters);
        return res.json(screenerResults);
    } catch (error: any) {
        console.error(`[Forecast Controller] Error fetching screener:`, error);
        return res.status(500).json({ message: error?.message || 'Internal server error' });
    }
};

export const getForecastOpportunities = async (req: Request, res: Response) => {
    try {
        const opportunities = await ForecastService.getForecastOpportunities();
        return res.json(opportunities);
    } catch (error: any) {
        console.error(`[Forecast Controller] Error fetching opportunities:`, error);
        return res.status(500).json({ message: error?.message || 'Internal server error' });
    }
};
