import { Request, Response, NextFunction } from 'express';
import { ForecastService } from './forecast.service';

export const runForecast = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const symbol: string =
            (req.params.symbol ?? (req.body as any)?.symbol ?? 'AAPL').toUpperCase();
        const forecast = await ForecastService.predict(symbol);
        res.json({ forecast });
    } catch (error) {
        next(error);
    }
};
