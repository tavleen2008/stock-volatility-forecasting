"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stockMetricsResponseSchema = void 0;
const zod_1 = require("zod");
exports.stockMetricsResponseSchema = zod_1.z.object({
    symbol: zod_1.z.string(),
    currentPrice: zod_1.z.number(),
    dayHigh: zod_1.z.number(),
    dayLow: zod_1.z.number(),
    openPrice: zod_1.z.number(),
    previousClose: zod_1.z.number(),
    volume: zod_1.z.number().int().nonnegative(),
    marketCap: zod_1.z.number().nonnegative().nullable(),
    currency: zod_1.z.string(),
    exchange: zod_1.z.string().optional(),
    updatedAt: zod_1.z.string().datetime()
});
