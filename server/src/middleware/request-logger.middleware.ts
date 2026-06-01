import { Request, Response, NextFunction } from 'express';

export const requestLogger = (req: Request, _res: Response, next: NextFunction) => {
    // lightweight request logging
    console.log(`${req.method} ${req.originalUrl}`);
    next();
};

export default requestLogger;
