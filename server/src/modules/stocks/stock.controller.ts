import { Request, Response } from 'express';
import { StockMetricsResponse } from './stock.schemas';
import { fetchStockMetrics } from './stock.service';

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
