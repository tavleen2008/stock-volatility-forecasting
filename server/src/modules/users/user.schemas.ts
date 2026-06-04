import { z } from 'zod';

export const changePasswordSchema = z.object({
    oldPassword: z.string().min(1, 'Old password is required'),
    newPassword: z.string().min(6, 'New password must be at least 6 characters long'),
});

export const followStockSchema = z.object({
    params: z.object({
        symbol: z.string().min(1, 'Stock symbol is required').toUpperCase(),
    })
});

export const updateProfileSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters long').optional(),
});

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
