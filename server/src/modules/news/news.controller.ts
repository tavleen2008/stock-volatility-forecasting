import { Request, Response, NextFunction } from 'express';
import { NewsService } from './news.service';

export const fetchNews = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const query = (req.query.q as string) || undefined;
        const articles = await NewsService.collect(query);
        res.json({ articles });
    } catch (error) {
        next(error);
    }
};
