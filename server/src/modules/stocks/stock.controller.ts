import { Request, Response } from 'express';
import { StockMetricsResponse } from './stock.schemas';
import { fetchStockMetrics, fetchStockDashboard } from './stock.service';

export const getStockMetrics= async (req: Request, res: Response) => {
    const {symbol}=req.params;
    if (!symbol) {
        return res.status(400).json({ message: 'Symbol is required' });
    }
    const metrics =await fetchStockMetrics(symbol);
    if(!metrics){
        return res.status(404).json({message: `Stock ${symbol} not found`});
    }
    res.json(metrics);
};

export const getStockDashboard = async (req: Request, res: Response) => {
    const { symbol } = req.params;
    if (!symbol) {
        return res.status(400).json({ message: 'Symbol is required' });
    }

    try {
        const dashboard = await fetchStockDashboard(symbol);
        res.json(dashboard);
    } catch (error) {
        console.error(`[Stock Controller] Error fetching dashboard for ${symbol}:`, error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};
