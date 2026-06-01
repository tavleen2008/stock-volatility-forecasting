"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.newsQuerySchema = void 0;
const zod_1 = require("zod");
exports.newsQuerySchema = zod_1.z.object({
    symbol: zod_1.z.string().optional(),
    limit: zod_1.z.coerce.number().int().positive().default(10),
    page: zod_1.z.coerce.number().int().positive().default(1),
});
