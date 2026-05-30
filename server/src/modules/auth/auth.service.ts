import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

import { prisma } from '../../config/prisma';
import config from '../../config/env';
import { AUTH_CONSTANTS } from './auth.constants';
import { RegisterInput, LoginInput, VerifyEmailInput, ResendCodeInput } from './auth.schemas';
import { redis } from '../../config/redis';
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

    await redis.set(`pending_user:${data.email}`, JSON.stringify(pendingUser), 'EX', CODE_EXPIRY_SECONDS);

    // Send the email
    await sendVerificationEmail(data.email, code);
};

export const verifyCodeAndRegister = async (data: VerifyEmailInput) => {
    const pendingUserStr = await redis.get(`pending_user:${data.email}`);
    if (!pendingUserStr) {
        throw new Error('Verification code expired or invalid email');
    }

    const pendingUser = JSON.parse(pendingUserStr);
    
    if (pendingUser.code !== data.code) {
        throw new Error('Invalid verification code');
    }

    // Code is valid, create the user
    const user = await prisma.user.create({
        data: {
            email: pendingUser.email,
            password: pendingUser.password,
            name: pendingUser.name || null,
            provider: 'LOCAL',
            isVerified: true,
        },
    });

    // Clean up Redis
    await redis.del(`pending_user:${data.email}`);

    return user;
};

export const resendVerificationCode = async (data: ResendCodeInput) => {
    const pendingUserStr = await redis.get(`pending_user:${data.email}`);
    if (!pendingUserStr) {
        throw new Error('No pending registration found for this email. Please register again.');
    }

    const pendingUser = JSON.parse(pendingUserStr);
    const code = generateOTP();
    pendingUser.code = code;

    // Update Redis with new code and reset expiry
    await redis.set(`pending_user:${data.email}`, JSON.stringify(pendingUser), 'EX', CODE_EXPIRY_SECONDS);

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

export const createJwtToken = (user: User) => {
    return jwt.sign(
        {
            sub: user.id,
            email: user.email,
            provider: user.provider,
            name: user.name,
        },
        config.jwtAccessSecret,
        {
            expiresIn: AUTH_CONSTANTS.JWT_EXPIRES_IN,
        }
    );
};
