import { Request, Response, NextFunction } from 'express';

export const authMiddleware = (req: Request, _res: Response, next: NextFunction) => {
    // placeholder: check req.headers.authorization
    req['user'] = null;
    next();
};

export default authMiddleware;
