import { Request, Response } from 'express';

export const fetchNews = (_req: Request, res: Response) => {
    res.json({ articles: [] });
};
