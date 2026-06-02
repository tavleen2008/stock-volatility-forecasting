import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

import { prisma } from '../../config/prisma';
import config from '../../config/env';
import { AUTH_CONSTANTS } from './auth.constants';
import { RegisterInput, LoginInput, VerifyEmailInput, ResendCodeInput } from './auth.schemas';
import { safeGet, safeSet, safeDel } from '../../config/redis';
import { sendVerificationEmail } from '../../utils/email.service';

export type User = NonNullable<Awaited<ReturnType<typeof prisma.user.findUnique>>>;

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();
const CODE_EXPIRY_SECONDS = 15 * 60; // 15 minutes

export const sendVerificationCode = async (data: RegisterInput) => {
    const existingUser = await prisma.user.findUnique({
        where: { email: data.email },
    });

    if (existingUser) {
        throw new Error('User already exists');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const code = generateOTP();

    // Store pending user data in Redis
    const pendingUser = {
        email: data.email,
        password: hashedPassword,
        name: data.name || '',
        code,
    };

    await safeSet(`pending_user:${data.email}`, JSON.stringify(pendingUser), 'EX', CODE_EXPIRY_SECONDS);

    // Send the email
    await sendVerificationEmail(data.email, code);
};

export const verifyCodeAndRegister = async (data: VerifyEmailInput) => {
    const pendingUserStr = await safeGet(`pending_user:${data.email}`);
    if (!pendingUserStr) {
        throw new Error('Verification code expired or invalid email');
    }

    const pendingUser = JSON.parse(pendingUserStr);
    
    if (pendingUser.code !== data.code) {
        throw new Error('Invalid verification code');
    }

    const user = await prisma.user.create({
        data: {
            email: pendingUser.email,
            password: pendingUser.password,
            name: pendingUser.name || null,
            provider: 'LOCAL',
            isVerified: true,
        },
    });

    await safeDel(`pending_user:${data.email}`);

    return user;
};

export const resendVerificationCode = async (data: ResendCodeInput) => {
    const pendingUserStr = await safeGet(`pending_user:${data.email}`);
    if (!pendingUserStr) {
        throw new Error('No pending registration found for this email. Please register again.');
    }

    const pendingUser = JSON.parse(pendingUserStr);
    const code = generateOTP();
    pendingUser.code = code;

    // Update Redis with new code and reset expiry
    await safeSet(`pending_user:${data.email}`, JSON.stringify(pendingUser), 'EX', CODE_EXPIRY_SECONDS);

    // Send the new email
    await sendVerificationEmail(data.email, code);
};

export const loginUser = async (data: LoginInput) => {
    const user = await prisma.user.findUnique({
        where: { email: data.email },
    });

    if (!user || user.provider !== 'LOCAL' || !user.password) {
        throw new Error('Invalid credentials');
    }

    if (!user.isVerified) {
        throw new Error('Please verify your email before logging in.');
    }

    const isValidPassword = await bcrypt.compare(data.password, user.password);

    if (!isValidPassword) {
        throw new Error('Invalid credentials');
    }

    return user;
};

export const generateTokens = async (user: User) => {
    const payload = {
        sub: user.id,
        email: user.email,
        provider: user.provider,
        name: user.name,
    };

    const accessToken = jwt.sign(payload, config.jwtAccessSecret, {
        expiresIn: AUTH_CONSTANTS.ACCESS_TOKEN_EXPIRES_IN,
    });

    const refreshToken = jwt.sign(payload, config.jwtRefreshSecret, {
        expiresIn: AUTH_CONSTANTS.REFRESH_TOKEN_EXPIRES_IN,
    });

    await safeSet(
        `refresh_token:${user.id}`, 
        refreshToken, 
        'EX', 
        AUTH_CONSTANTS.REFRESH_TOKEN_REDIS_TTL
    );

    return { accessToken, refreshToken };
};

export const verifyAndRefresh = async (token: string) => {
    try {
        const decoded = jwt.verify(token, config.jwtRefreshSecret) as { sub: string };
        const userId = decoded.sub;

        // Check if token exists in Redis (meaning it hasn't been revoked/logged out)
        const storedToken = await safeGet(`refresh_token:${userId}`);
        if (!storedToken || storedToken !== token) {
            throw new Error('Invalid refresh token');
        }

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            throw new Error('User not found');
        }

        return generateTokens(user);
    } catch (error) {
        throw new Error('Invalid or expired refresh token');
    }
};

export const revokeRefreshToken = async (token: string) => {
    try {
        // Decode without verifying expiration so we can still revoke expired tokens
        const decoded = jwt.decode(token) as { sub: string } | null;
        if (decoded?.sub) {
            await safeDel(`refresh_token:${decoded.sub}`);
        }
    } catch (error) {
        throw new Error('Failed to revoke refresh token');
    }
};
