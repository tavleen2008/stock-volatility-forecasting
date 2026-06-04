"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPasswordSchema = exports.forgotPasswordSchema = exports.resendCodeSchema = exports.verifyEmailSchema = exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
exports.registerSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email address'),
    password: zod_1.z.string().min(6, 'Password must be at least 6 characters long'),
    name: zod_1.z.string().min(2, 'Name must be at least 2 characters long').optional(),
});
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email address'),
    password: zod_1.z.string().min(1, 'Password is required'),
});
exports.verifyEmailSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email address'),
    code: zod_1.z.string().length(6, 'Verification code must be 6 digits'),
});
exports.resendCodeSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email address'),
});
exports.forgotPasswordSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email address'),
});
exports.resetPasswordSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email address'),
    code: zod_1.z.string().length(6, 'Verification code must be 6 digits'),
    newPassword: zod_1.z.string().min(6, 'Password must be at least 6 characters long'),
});
