import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as authService from './auth.service';
import config from '../../config/env';
import type { User } from './auth.service';
import { registerSchema, loginSchema, verifyEmailSchema, resendCodeSchema } from './auth.schemas';

/**
 * Strips internal/sensitive fields from the User object before sending to client.
 * Also removes password field for local users.
 */
const sanitizeUser = (user: User) => {
    const { password, ...rest } = user as any;
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

export const sendVerificationCode = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = registerSchema.parse(req.body);
        await authService.sendVerificationCode(data);
        
        return res.status(200).json({
            message: 'Verification code sent successfully. Please check your email.',
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ message: 'Validation failed', errors: (error as any).errors });
        }
        if (error instanceof Error && error.message === 'User already exists') {
            return res.status(409).json({ message: error.message });
        }
        return next(error);
    }
};

export const verifyRegistration = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = verifyEmailSchema.parse(req.body);
        const user = await authService.verifyCodeAndRegister(data);
        const token = authService.createJwtToken(user);
        
        return res.status(201).json({
            message: 'User verified and registered successfully.',
            user: sanitizeUser(user),
            token,
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ message: 'Validation failed', errors: (error as any).errors });
        }
        if (error instanceof Error && (error.message === 'Invalid verification code' || error.message === 'Verification code expired or invalid email')) {
            return res.status(400).json({ message: error.message });
        }
        return next(error);
    }
};

export const resendCode = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = resendCodeSchema.parse(req.body);
        await authService.resendVerificationCode(data);
        
        return res.status(200).json({
            message: 'A new verification code has been sent to your email.',
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ message: 'Validation failed', errors: (error as any).errors });
        }
        if (error instanceof Error && error.message.includes('No pending registration')) {
            return res.status(404).json({ message: error.message });
        }
        return next(error);
    }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = loginSchema.parse(req.body);
        const user = await authService.loginUser(data);
        const token = authService.createJwtToken(user);
        
        return res.json({
            user: sanitizeUser(user),
            token,
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ message: 'Validation failed', errors: (error as any).errors });
        }
        if (error instanceof Error && error.message === 'Invalid credentials') {
            return res.status(401).json({ message: error.message });
        }
        if (error instanceof Error && error.message === 'Please verify your email before logging in.') {
            return res.status(403).json({ message: error.message });
        }
        return next(error);
    }
};
