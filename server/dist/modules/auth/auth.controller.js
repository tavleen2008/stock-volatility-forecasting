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
exports.me = exports.verifyEmail = exports.googleCallback = exports.login = exports.register = void 0;
const passport_1 = __importDefault(require("../../config/passport"));
const authService = __importStar(require("./auth.service"));
const prisma_1 = require("../../config/prisma");
const env_1 = __importDefault(require("../../config/env"));
const sanitizeUser = (user) => {
    const { passwordHash, ...rest } = user;
    return rest;
};
const register = async (req, res, next) => {
    try {
        const { email, password, name } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }
        const existingUser = await authService.findUserByEmail(email);
        if (existingUser) {
            return res.status(409).json({ message: 'Email is already registered' });
        }
        const user = await authService.createLocalUser({ email, password, name });
        const token = authService.createJwtToken(user);
        const emailVerificationToken = authService.createEmailVerificationToken(user);
        return res.status(201).json({
            user: sanitizeUser(user),
            token,
            emailVerificationToken,
            message: 'Account created. Verify your email using the verification token.',
        });
    }
    catch (error) {
        return next(error);
    }
};
exports.register = register;
const login = (req, res, next) => {
    passport_1.default.authenticate('local', { session: false }, (err, user, info) => {
        if (err) {
            return next(err);
        }
        if (!user) {
            return res.status(401).json({ message: info?.message || 'Invalid credentials' });
        }
        const token = authService.createJwtToken(user);
        return res.json({
            user: sanitizeUser(user),
            token,
        });
    })(req, res, next);
};
exports.login = login;
const googleCallback = async (req, res, next) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ message: 'Authentication failed' });
        }
        const token = authService.createJwtToken(user);
        if (env_1.default.frontendUrl) {
            const redirectUrl = `${env_1.default.frontendUrl.replace(/\/$/, '')}/auth/success?token=${encodeURIComponent(token)}`;
            return res.redirect(redirectUrl);
        }
        return res.json({
            user: sanitizeUser(user),
            token,
        });
    }
    catch (error) {
        return next(error);
    }
};
exports.googleCallback = googleCallback;
const verifyEmail = async (req, res, next) => {
    try {
        const token = String(req.query.token || '');
        if (!token) {
            return res.status(400).json({ message: 'Verification token is required' });
        }
        const payload = authService.verifyEmailToken(token);
        const user = await prisma_1.prisma.user.findUnique({ where: { id: payload.sub } });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        const updated = await prisma_1.prisma.user.update({
            where: { id: user.id },
            data: {
                isVerified: true,
            },
        });
        return res.json({ message: 'Email verified', user: sanitizeUser(updated) });
    }
    catch (error) {
        return res.status(400).json({ message: 'Invalid or expired token' });
    }
};
exports.verifyEmail = verifyEmail;
const me = async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Not authenticated' });
    }
    return res.json({ user: sanitizeUser(req.user) });
};
exports.me = me;
