import { Request, Response } from 'express';

export const getStocks = (_req: Request, res: Response) => {
    res.json({ stocks: [] });
};
