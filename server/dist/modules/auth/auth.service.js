"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.findOrCreateGoogleUser = exports.verifyEmailToken = exports.createEmailVerificationToken = exports.createJwtToken = exports.createLocalUser = exports.findUserByEmail = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = require("../../config/prisma");
const env_1 = __importDefault(require("../../config/env"));
const findUserByEmail = async (email) => {
    return prisma_1.prisma.user.findUnique({
        where: {
            email,
        },
    });
};
exports.findUserByEmail = findUserByEmail;
const createLocalUser = async ({ email, name, password }) => {
    const passwordHash = await bcryptjs_1.default.hash(password, 12);
    return prisma_1.prisma.user.create({
        data: {
            email,
            name,
            passwordHash,
            provider: 'LOCAL',
            isVerified: false,
        },
    });
};
exports.createLocalUser = createLocalUser;
const createJwtToken = (user) => {
    return jsonwebtoken_1.default.sign({
        sub: user.id,
        email: user.email,
        provider: user.provider,
        name: user.name,
    }, env_1.default.jwtAccessSecret, {
        expiresIn: '7d',
    });
};
exports.createJwtToken = createJwtToken;
const createEmailVerificationToken = (user) => {
    return jsonwebtoken_1.default.sign({
        sub: user.id,
        email: user.email,
    }, env_1.default.jwtAccessSecret, {
        expiresIn: '1d',
    });
};
exports.createEmailVerificationToken = createEmailVerificationToken;
const verifyEmailToken = (token) => {
    return jsonwebtoken_1.default.verify(token, env_1.default.jwtAccessSecret);
};
exports.verifyEmailToken = verifyEmailToken;
const findOrCreateGoogleUser = async ({ providerId, email, name, avatarUrl }) => {
    const existingByProvider = await prisma_1.prisma.user.findFirst({
        where: {
            providerId,
            provider: 'GOOGLE',
        },
    });
    if (existingByProvider) {
        return existingByProvider;
    }
    const existingByEmail = await prisma_1.prisma.user.findUnique({
        where: {
            email,
        },
    });
    if (existingByEmail) {
        return prisma_1.prisma.user.update({
            where: {
                email,
            },
            data: {
                provider: 'GOOGLE',
                providerId,
                avatarUrl,
                isVerified: true,
                name: existingByEmail.name || name,
            },
        });
    }
    return prisma_1.prisma.user.create({
        data: {
            email,
            provider: 'GOOGLE',
            providerId,
            name,
            avatarUrl,
            isVerified: true,
        },
    });
};
exports.findOrCreateGoogleUser = findOrCreateGoogleUser;
