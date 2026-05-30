import { Request, Response, NextFunction } from 'express';
import * as authService from './auth.service';
import config from '../../config/env';
import type { User } from './auth.service';

/**
 * Strips internal/sensitive fields from the User object before sending to client.
 * Since only Google OAuth is supported, there are no password fields to strip.
 */
const sanitizeUser = (user: User) => {
    const { ...rest } = user;
    return rest;
};

export const googleCallback = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = req.user as User | undefined;
        if (!user) {
            return res.status(401).json({ message: 'Authentication failed' });
        }

        const token = authService.createJwtToken(user);

        if (config.frontendUrl) {
            const redirectUrl = `${config.frontendUrl.replace(/\/$/, '')}/auth/success?token=${encodeURIComponent(
                token
            )}`;
            return res.redirect(redirectUrl);
        }

        return res.json({
            user: sanitizeUser(user),
            token,
        });
    } catch (error) {
        return next(error);
    }
};

export const me = async (req: Request, res: Response) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Not authenticated' });
    }

    return res.json({ user: sanitizeUser(req.user as User) });
};
