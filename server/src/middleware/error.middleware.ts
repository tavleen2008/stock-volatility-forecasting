import { Request, Response, NextFunction } from 'express';

export default function errorMiddleware(err: any, _req: Request, res: Response, _next: NextFunction) {
    const status = err.status || 500;
    res.status(status).json({ success: false, message: err.message || 'Server error' });
}
