import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config/env';
import { prisma } from '../config/prisma';

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Missing authorization header' });
    }

    const token = authHeader.substring(7);

    try {
        const payload = jwt.verify(token, config.jwtAccessSecret) as { sub: string; email: string };
        const user = await prisma.user.findUnique({ where: { id: payload.sub } });

        if (!user) {
            return res.status(401).json({ message: 'Invalid token user' });
        }

        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
};

export default authMiddleware;
