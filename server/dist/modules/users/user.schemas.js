"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProfileSchema = exports.followStockSchema = exports.changePasswordSchema = void 0;
const zod_1 = require("zod");
exports.changePasswordSchema = zod_1.z.object({
    oldPassword: zod_1.z.string().min(1, 'Old password is required'),
    newPassword: zod_1.z.string().min(6, 'New password must be at least 6 characters long'),
});
exports.followStockSchema = zod_1.z.object({
    params: zod_1.z.object({
        symbol: zod_1.z.string().min(1, 'Stock symbol is required').toUpperCase(),
    })
});
exports.updateProfileSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'Name must be at least 2 characters long').optional(),
});
