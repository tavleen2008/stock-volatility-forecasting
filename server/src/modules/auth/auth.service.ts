import jwt from 'jsonwebtoken';

import { prisma } from '../../config/prisma';
import config from '../../config/env';
import { AUTH_CONSTANTS } from './auth.constants';

export type User = NonNullable<Awaited<ReturnType<typeof prisma.user.findUnique>>>;

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
