import { Request, Response } from 'express';

export const runForecast = (_req: Request, res: Response) => {
    res.json({ forecast: null });
};
