import { Request, Response, NextFunction } from 'express';

export const rateLimit = (_req: Request, _res: Response, next: NextFunction) => {
    // placeholder for rate limiting
    next();
};

export default rateLimit;
