import { Request, Response, NextFunction } from 'express';
import { StockService } from './stock.service';

export const getStocks = async (_req: Request, res: Response, next: NextFunction) => {
    try {
        const stocks = await StockService.list();
        res.json({ stocks });
    } catch (error) {
        next(error);
    }
};

export const getStockQuote = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { symbol } = req.params;
        const quote = await StockService.getQuote(symbol);
        res.json({ quote });
    } catch (error) {
        next(error);
    }
};

export const getStockHistory = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { symbol } = req.params;
        const range = (req.query.range as string) || '1mo';
        const history = await StockService.getHistory(symbol, range);
        res.json({ symbol: symbol.toUpperCase(), range, history });
    } catch (error) {
        next(error);
    }
};
