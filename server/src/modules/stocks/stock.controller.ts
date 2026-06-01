import { Request, Response } from 'express';
import { fetchStockMetrics, fetchStockDashboard, fetchTrackedStocksList, fetchStockHistory } from './stock.service';

/** GET /api/stocks — list of all tracked stocks with live quotes */
export const listStocks = async (_req: Request, res: Response) => {
    try {
        const stocks = await fetchTrackedStocksList();
        res.json({ stocks });
    } catch (error) {
        console.error('[Stock Controller] Error listing stocks:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

/** GET /api/stocks/:symbol — individual stock metrics */
export const getStockMetrics = async (req: Request, res: Response) => {
    const { symbol } = req.params;
    if (!symbol) return res.status(400).json({ message: 'Symbol is required' });

    const metrics = await fetchStockMetrics(symbol.toUpperCase());
    if (!metrics) return res.status(404).json({ message: `Stock ${symbol} not found` });

    res.json(metrics);
};

/** GET /api/stocks/:symbol/history?range=1mo */
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

/** GET /api/stocks/:symbol/dashboard — full dashboard payload */
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
