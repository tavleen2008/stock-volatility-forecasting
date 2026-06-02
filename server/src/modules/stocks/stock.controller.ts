import { Request, Response } from 'express';
import { fetchStockMetrics, fetchStockDashboard, fetchTrackedStocksList, fetchStockHistory, fetchStockOverview, fetchStockProfile } from './stock.service';

export const listStocks = async (_req: Request, res: Response) => {
    try {
        const stocks = await fetchTrackedStocksList();
        res.json({ stocks });
    } catch (error) {
        console.error('[Stock Controller] Error listing stocks:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

export const getStockMetrics = async (req: Request, res: Response) => {
    const { symbol } = req.params;
    if (!symbol) return res.status(400).json({ message: 'Symbol is required' });

    const metrics = await fetchStockMetrics(symbol.toUpperCase());
    if (!metrics) return res.status(404).json({ message: `Stock ${symbol} not found` });

    res.json(metrics);
};

export const getStockHistory = async (req: Request, res: Response) => {
    const { symbol } = req.params;
    const range = (req.query.range as string) || '1mo';
    if (!symbol) return res.status(400).json({ message: 'Symbol is required' });

    try {
        const history = await fetchStockHistory(symbol.toUpperCase(), range);
        res.json({ symbol: symbol.toUpperCase(), range, history });
    } catch (error) {
        console.error(`[Stock Controller] Error fetching history for ${symbol}:`, error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

export const getStockDashboard = async (req: Request, res: Response) => {
    const { symbol } = req.params;
    if (!symbol) return res.status(400).json({ message: 'Symbol is required' });

    try {
        const dashboard = await fetchStockDashboard(symbol.toUpperCase());
        res.json(dashboard);
    } catch (error) {
        console.error(`[Stock Controller] Error fetching dashboard for ${symbol}:`, error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

/** GET /api/stocks/:symbol/overview — extended quote with P/E, beta, 52-wk, dividends etc. */
export const getStockOverview = async (req: Request, res: Response) => {
    const { symbol } = req.params;
    if (!symbol) return res.status(400).json({ message: 'Symbol is required' });

    try {
        const overview = await fetchStockOverview(symbol.toUpperCase());
        if (!overview) return res.status(404).json({ message: `Stock ${symbol} not found` });
        res.json(overview);
    } catch (error) {
        console.error(`[Stock Controller] Error fetching overview for ${symbol}:`, error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

/** GET /api/stocks/:symbol/profile — company description, sector, industry, employees */
export const getStockProfile = async (req: Request, res: Response) => {
    const { symbol } = req.params;
    if (!symbol) return res.status(400).json({ message: 'Symbol is required' });

    try {
        const profile = await fetchStockProfile(symbol.toUpperCase());
        if (!profile) return res.status(404).json({ message: `Profile for ${symbol} not found` });
        res.json(profile);
    } catch (error) {
        console.error(`[Stock Controller] Error fetching profile for ${symbol}:`, error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};
