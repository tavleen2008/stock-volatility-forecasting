import { z } from 'zod';

export const symbolParamSchema = z.object({
    params: z.object({
        symbol: z.string().min(1, 'Stock symbol is required').toUpperCase(),
    })
});

export const symbolAndDaysSchema = z.object({
    params: z.object({
        symbol: z.string().min(1, 'Stock symbol is required').toUpperCase(),
    }),
    query: z.object({
        days: z.string().regex(/^\d+$/, 'Days must be a positive integer').optional().default('30'),
    })
});

export const screenerQuerySchema = z.object({
    query: z.object({
        minVolatility: z.string().optional().transform(val => (val ? parseFloat(val) : undefined)),
        sentiment: z.enum(['positive', 'negative', 'neutral', 'all']).optional().default('all'),
        minConfidence: z.string().optional().transform(val => (val ? parseFloat(val) : undefined)),
    })
});
