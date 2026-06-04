"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.screenerQuerySchema = exports.symbolAndRangeSchema = exports.symbolParamSchema = void 0;
const zod_1 = require("zod");
const time_constants_1 = require("../../shared/constants/time.constants");
exports.symbolParamSchema = zod_1.z.object({
    params: zod_1.z.object({
        symbol: zod_1.z.string().min(1, 'Stock symbol is required').toUpperCase(),
    })
});
exports.symbolAndRangeSchema = zod_1.z.object({
    params: zod_1.z.object({
        symbol: zod_1.z.string().min(1, 'Stock symbol is required').toUpperCase(),
    }),
    query: zod_1.z.object({
        range: zod_1.z.enum(time_constants_1.TIME_RANGES).optional().default('1mo'),
    })
});
exports.screenerQuerySchema = zod_1.z.object({
    query: zod_1.z.object({
        minVolatility: zod_1.z.string().optional().transform(val => (val ? parseFloat(val) : undefined)),
        sentiment: zod_1.z.enum(['positive', 'negative', 'neutral', 'all']).optional().default('all'),
        minConfidence: zod_1.z.string().optional().transform(val => (val ? parseFloat(val) : undefined)),
    })
});
