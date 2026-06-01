import { Request, Response, NextFunction } from 'express';

export const validateMiddleware = (schema: any) => (req: Request, res: Response, next: NextFunction) => {
    // placeholder for validation logic
    next();
};

export default validateMiddleware;
