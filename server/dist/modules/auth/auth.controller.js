"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logout = exports.refresh = exports.login = exports.resendCode = exports.verifyRegistration = exports.sendVerificationCode = exports.me = exports.googleCallback = void 0;
const zod_1 = require("zod");
const authService = __importStar(require("./auth.service"));
const env_1 = __importDefault(require("../../config/env"));
const auth_schemas_1 = require("./auth.schemas");
/**
 * Strips internal/sensitive fields from the User object before sending to client.
 */
const sanitizeUser = (user) => {
    const { password, ...rest } = user;
    return rest;
};
/**
 * Helper to set the refresh token as an HttpOnly cookie
 */
const setRefreshTokenCookie = (res, refreshToken) => {
    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: env_1.default.nodeEnv === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    });
};
const googleCallback = async (req, res, next) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ message: 'Authentication failed' });
        }
        const { accessToken, refreshToken } = await authService.generateTokens(user);
        // We can't easily set cookies on a redirect if the frontend is on a different domain,
        // but for local dev with same domain it works. For production OAuth, usually you redirect
        // with a short-lived one-time code to exchange for tokens on the frontend.
        // For simplicity here, we'll set the cookie and redirect with access token.
        setRefreshTokenCookie(res, refreshToken);
        if (env_1.default.frontendUrl) {
            const redirectUrl = `${env_1.default.frontendUrl.replace(/\/$/, '')}/auth/success?token=${encodeURIComponent(accessToken)}`;
            return res.redirect(redirectUrl);
        }
        return res.json({
            user: sanitizeUser(user),
            token: accessToken,
        });
    }
    catch (error) {
        return next(error);
    }
};
exports.googleCallback = googleCallback;
const me = async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Not authenticated' });
    }
    return res.json({ user: sanitizeUser(req.user) });
};
exports.me = me;
const sendVerificationCode = async (req, res, next) => {
    try {
        const data = auth_schemas_1.registerSchema.parse(req.body);
        await authService.sendVerificationCode(data);
        return res.status(200).json({
            message: 'Verification code sent successfully. Please check your email.',
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ message: 'Validation failed', errors: error.errors });
        }
        if (error instanceof Error && error.message === 'User already exists') {
            return res.status(409).json({ message: error.message });
        }
        return next(error);
    }
};
exports.sendVerificationCode = sendVerificationCode;
const verifyRegistration = async (req, res, next) => {
    try {
        const data = auth_schemas_1.verifyEmailSchema.parse(req.body);
        const user = await authService.verifyCodeAndRegister(data);
        const { accessToken, refreshToken } = await authService.generateTokens(user);
        setRefreshTokenCookie(res, refreshToken);
        return res.status(201).json({
            message: 'User verified and registered successfully.',
            user: sanitizeUser(user),
            token: accessToken,
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ message: 'Validation failed', errors: error.errors });
        }
        if (error instanceof Error && (error.message === 'Invalid verification code' || error.message === 'Verification code expired or invalid email')) {
            return res.status(400).json({ message: error.message });
        }
        return next(error);
    }
};
exports.verifyRegistration = verifyRegistration;
const resendCode = async (req, res, next) => {
    try {
        const data = auth_schemas_1.resendCodeSchema.parse(req.body);
        await authService.resendVerificationCode(data);
        return res.status(200).json({
            message: 'A new verification code has been sent to your email.',
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ message: 'Validation failed', errors: error.errors });
        }
        if (error instanceof Error && error.message.includes('No pending registration')) {
            return res.status(404).json({ message: error.message });
        }
        return next(error);
    }
};
exports.resendCode = resendCode;
const login = async (req, res, next) => {
    try {
        const data = auth_schemas_1.loginSchema.parse(req.body);
        const user = await authService.loginUser(data);
        const { accessToken, refreshToken } = await authService.generateTokens(user);
        setRefreshTokenCookie(res, refreshToken);
        return res.json({
            user: sanitizeUser(user),
            token: accessToken,
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ message: 'Validation failed', errors: error.errors });
        }
        if (error instanceof Error && error.message === 'Invalid credentials') {
            return res.status(401).json({ message: error.message });
        }
        if (error instanceof Error && error.message === 'Please verify your email before logging in.') {
            return res.status(403).json({ message: error.message });
        }
        return next(error);
    }
};
exports.login = login;
const refresh = async (req, res, next) => {
    try {
        const { refreshToken } = req.cookies;
        if (!refreshToken) {
            return res.status(401).json({ message: 'No refresh token provided' });
        }
        const tokens = await authService.verifyAndRefresh(refreshToken);
        setRefreshTokenCookie(res, tokens.refreshToken);
        return res.json({
            token: tokens.accessToken,
        });
    }
    catch (error) {
        // Clear cookie if refresh fails
        res.clearCookie('refreshToken');
        return res.status(401).json({ message: 'Invalid or expired refresh token' });
    }
};
exports.refresh = refresh;
const logout = async (req, res, next) => {
    try {
        const { refreshToken } = req.cookies;
        if (refreshToken) {
            await authService.revokeRefreshToken(refreshToken);
        }
        res.clearCookie('refreshToken');
        return res.status(200).json({ message: 'Logged out successfully' });
    }
    catch (error) {
        return next(error);
    }
};
exports.logout = logout;
