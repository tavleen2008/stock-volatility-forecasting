import { z } from 'zod';
import { TIME_RANGES } from '../../shared/constants/time.constants';

export const symbolParamSchema = z.object({
    params: z.object({
        symbol: z.string().min(1, 'Stock symbol is required').toUpperCase(),
    })
});

export const symbolAndRangeSchema = z.object({
    params: z.object({
        symbol: z.string().min(1, 'Stock symbol is required').toUpperCase(),
    }),
    query: z.object({
        range: z.enum(TIME_RANGES).optional().default('1mo'),
    })
});

export const screenerQuerySchema = z.object({
    query: z.object({
        minVolatility: z.string().optional().transform(val => (val ? parseFloat(val) : undefined)),
        sentiment: z.enum(['positive', 'negative', 'neutral', 'all']).optional().default('all'),
        minConfidence: z.string().optional().transform(val => (val ? parseFloat(val) : undefined)),
    })
});
