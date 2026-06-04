"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPassword = exports.forgotPassword = exports.revokeRefreshToken = exports.verifyAndRefresh = exports.generateTokens = exports.loginUser = exports.resendVerificationCode = exports.verifyCodeAndRegister = exports.sendVerificationCode = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma_1 = require("../../config/prisma");
const env_1 = __importDefault(require("../../config/env"));
const auth_constants_1 = require("./auth.constants");
const redis_1 = require("../../config/redis");
const email_service_1 = require("../../utils/email.service");
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();
const CODE_EXPIRY_SECONDS = 15 * 60; // 15 minutes
const sendVerificationCode = async (data) => {
    const existingUser = await prisma_1.prisma.user.findUnique({
        where: { email: data.email },
    });
    if (existingUser) {
        throw new Error('User already exists');
    }
    const hashedPassword = await bcryptjs_1.default.hash(data.password, 10);
    const code = generateOTP();
    // Store pending user data in Redis
    const pendingUser = {
        email: data.email,
        password: hashedPassword,
        name: data.name || '',
        code,
    };
    await (0, redis_1.safeSet)(`pending_user:${data.email}`, JSON.stringify(pendingUser), 'EX', CODE_EXPIRY_SECONDS);
    // Send the email
    await (0, email_service_1.sendVerificationEmail)(data.email, code);
};
exports.sendVerificationCode = sendVerificationCode;
const verifyCodeAndRegister = async (data) => {
    const pendingUserStr = await (0, redis_1.safeGet)(`pending_user:${data.email}`);
    if (!pendingUserStr) {
        throw new Error('Verification code expired or invalid email');
    }
    const pendingUser = JSON.parse(pendingUserStr);
    if (pendingUser.code !== data.code) {
        throw new Error('Invalid verification code');
    }
    const user = await prisma_1.prisma.user.create({
        data: {
            email: pendingUser.email,
            password: pendingUser.password,
            name: pendingUser.name || null,
            provider: 'LOCAL',
            isVerified: true,
        },
    });
    await (0, redis_1.safeDel)(`pending_user:${data.email}`);
    return user;
};
exports.verifyCodeAndRegister = verifyCodeAndRegister;
const resendVerificationCode = async (data) => {
    const pendingUserStr = await (0, redis_1.safeGet)(`pending_user:${data.email}`);
    if (!pendingUserStr) {
        throw new Error('No pending registration found for this email. Please register again.');
    }
    const pendingUser = JSON.parse(pendingUserStr);
    const code = generateOTP();
    pendingUser.code = code;
    // Update Redis with new code and reset expiry
    await (0, redis_1.safeSet)(`pending_user:${data.email}`, JSON.stringify(pendingUser), 'EX', CODE_EXPIRY_SECONDS);
    // Send the new email
    await (0, email_service_1.sendVerificationEmail)(data.email, code);
};
exports.resendVerificationCode = resendVerificationCode;
const loginUser = async (data) => {
    const user = await prisma_1.prisma.user.findUnique({
        where: { email: data.email },
    });
    if (!user || user.provider !== 'LOCAL' || !user.password) {
        throw new Error('Invalid credentials');
    }
    if (!user.isVerified) {
        throw new Error('Please verify your email before logging in.');
    }
    const isValidPassword = await bcryptjs_1.default.compare(data.password, user.password);
    if (!isValidPassword) {
        throw new Error('Invalid credentials');
    }
    return user;
};
exports.loginUser = loginUser;
const generateTokens = async (user) => {
    const payload = {
        sub: user.id,
        email: user.email,
        provider: user.provider,
        name: user.name,
    };
    const accessToken = jsonwebtoken_1.default.sign(payload, env_1.default.jwtAccessSecret, {
        expiresIn: auth_constants_1.AUTH_CONSTANTS.ACCESS_TOKEN_EXPIRES_IN,
    });
    const refreshToken = jsonwebtoken_1.default.sign(payload, env_1.default.jwtRefreshSecret, {
        expiresIn: auth_constants_1.AUTH_CONSTANTS.REFRESH_TOKEN_EXPIRES_IN,
    });
    await (0, redis_1.safeSet)(`refresh_token:${user.id}`, refreshToken, 'EX', auth_constants_1.AUTH_CONSTANTS.REFRESH_TOKEN_REDIS_TTL);
    return { accessToken, refreshToken };
};
exports.generateTokens = generateTokens;
const verifyAndRefresh = async (token) => {
    try {
        const decoded = jsonwebtoken_1.default.verify(token, env_1.default.jwtRefreshSecret);
        const userId = decoded.sub;
        // Check if token exists in Redis (meaning it hasn't been revoked/logged out)
        const storedToken = await (0, redis_1.safeGet)(`refresh_token:${userId}`);
        if (!storedToken || storedToken !== token) {
            throw new Error('Invalid refresh token');
        }
        const user = await prisma_1.prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            throw new Error('User not found');
        }
        return (0, exports.generateTokens)(user);
    }
    catch (error) {
        throw new Error('Invalid or expired refresh token');
    }
};
exports.verifyAndRefresh = verifyAndRefresh;
const revokeRefreshToken = async (token) => {
    try {
        // Decode without verifying expiration so we can still revoke expired tokens
        const decoded = jsonwebtoken_1.default.decode(token);
        if (decoded?.sub) {
            await (0, redis_1.safeDel)(`refresh_token:${decoded.sub}`);
        }
    }
    catch (error) {
        throw new Error('Failed to revoke refresh token');
    }
};
exports.revokeRefreshToken = revokeRefreshToken;
const forgotPassword = async (data) => {
    const user = await prisma_1.prisma.user.findUnique({
        where: { email: data.email },
    });
    if (!user || user.provider !== 'LOCAL') {
        // We do not throw an error if the user does not exist to prevent email enumeration attacks
        // Just return silently
        return;
    }
    const code = generateOTP();
    // Store reset code in Redis
    const resetData = {
        email: data.email,
        code,
    };
    await (0, redis_1.safeSet)(`password_reset:${data.email}`, JSON.stringify(resetData), 'EX', CODE_EXPIRY_SECONDS);
    // As requested, log to console instead of sending email for now
    console.log(`\n================================`);
    console.log(`🔑 PASSWORD RESET CODE FOR ${data.email}`);
    console.log(`CODE: ${code}`);
    console.log(`================================\n`);
};
exports.forgotPassword = forgotPassword;
const resetPassword = async (data) => {
    const resetDataStr = await (0, redis_1.safeGet)(`password_reset:${data.email}`);
    if (!resetDataStr) {
        throw new Error('Reset code expired or invalid email');
    }
    const resetData = JSON.parse(resetDataStr);
    if (resetData.code !== data.code) {
        throw new Error('Invalid reset code');
    }
    const hashedPassword = await bcryptjs_1.default.hash(data.newPassword, 10);
    await prisma_1.prisma.user.update({
        where: { email: data.email },
        data: { password: hashedPassword },
    });
    // Delete the reset code
    await (0, redis_1.safeDel)(`password_reset:${data.email}`);
    // Also revoke all refresh tokens so they are logged out of all devices
    const user = await prisma_1.prisma.user.findUnique({ where: { email: data.email } });
    if (user) {
        await (0, redis_1.safeDel)(`refresh_token:${user.id}`);
    }
};
exports.resetPassword = resetPassword;
