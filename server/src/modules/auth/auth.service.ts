import jwt from 'jsonwebtoken';

import { prisma } from '../../config/prisma';
import config from '../../config/env';

export type User = NonNullable<Awaited<ReturnType<typeof prisma.user.findUnique>>>;

export interface GoogleUserPayload {
    providerId: string;
    email: string;
    name?: string;
    avatarUrl?: string;
}

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
            expiresIn: '7d',
        }
    );
};

export const findOrCreateGoogleUser = async ({ providerId, email, name, avatarUrl }: GoogleUserPayload) => {
    const existingByProvider = await prisma.user.findFirst({
        where: {
            providerId,
            provider: 'GOOGLE',
        },
    });

    if (existingByProvider) {
        return existingByProvider;
    }

    const existingByEmail = await prisma.user.findUnique({
        where: {
            email,
        },
    });

    if (existingByEmail) {
        return prisma.user.update({
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

    return prisma.user.create({
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
