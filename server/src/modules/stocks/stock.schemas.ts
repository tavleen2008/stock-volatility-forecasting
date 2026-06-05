import { z } from "zod";

export const stockMetricsResponseSchema = z.object({
symbol: z.string(),
currentPrice: z.number(),
dayHigh: z.number(),
dayLow: z.number(),
openPrice: z.number(),
previousClose: z.number(),
volume: z.number().int().nonnegative(),
marketCap: z.number().nonnegative().nullable(),
currency: z.string(),
exchange: z.string().optional(),
updatedAt: z.string().datetime()
});

