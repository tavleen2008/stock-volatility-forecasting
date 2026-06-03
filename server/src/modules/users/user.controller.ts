import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as userService from './user.service';
import { changePasswordSchema, followStockSchema, updateProfileSchema } from './user.schemas';

export const getUsers = (_req: Request, res: Response) => {
    res.json({ users: [] });
};

export const updateProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req.user as any).id;
        const data = updateProfileSchema.parse(req.body);
        
        const updatedUser = await userService.updateProfile(userId, data);
        
        return res.status(200).json({ 
            message: 'Profile updated successfully',
            user: updatedUser 
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ message: 'Validation failed', errors: (error as any).errors });
        }
        return next(error);
    }
};

export const changePassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req.user as any).id;
        const data = changePasswordSchema.parse(req.body);
        
        await userService.changePassword(userId, data);
        
        return res.status(200).json({ message: 'Password changed successfully' });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ message: 'Validation failed', errors: (error as any).errors });
        }
        if (error instanceof Error && (error.message === 'Incorrect old password' || error.message === 'Account does not support password change')) {
            return res.status(400).json({ message: error.message });
        }
        return next(error);
    }
};

export const followStock = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req.user as any).id;
        const { params } = followStockSchema.parse(req);
        
        const followedStocks = await userService.followStock(userId, params.symbol);
        
        return res.status(200).json({ 
            message: `Successfully followed ${params.symbol}`,
            followedStocks
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ message: 'Validation failed', errors: (error as any).errors });
        }
        return next(error);
    }
};

export const unfollowStock = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req.user as any).id;
        const { params } = followStockSchema.parse(req);
        
        const followedStocks = await userService.unfollowStock(userId, params.symbol);
        
        return res.status(200).json({ 
            message: `Successfully unfollowed ${params.symbol}`,
            followedStocks
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ message: 'Validation failed', errors: (error as any).errors });
        }
        return next(error);
    }
};
