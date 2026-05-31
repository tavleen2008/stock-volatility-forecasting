import {z} from 'zod';

export const newsQuerySchema = z.object({
    symbol: z.string().optional(),
    limit: z.coerce.number().int().positive().default(10),
    page: z.coerce.number().int().positive().default(1),
});
