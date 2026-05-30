import dotenv from 'dotenv';

// Load .env in non-production environments
if (process.env.NODE_ENV !== 'production') {
    dotenv.config();
}

const config = {
    port: process.env.PORT ? Number(process.env.PORT) : 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
    databaseUrl: process.env.DATABASE_URL || 'file:./dev.db',
    redisUrl: process.env.REDIS_URL || '',
    jwtAccessSecret: process.env.JWT_ACCESS_SECRET || 'change_me_access',
    googleClientId: process.env.GOOGLE_CLIENT_ID || '',
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    googleRedirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/google/callback',
    frontendUrl: process.env.FRONTEND_URL || '',
};

export default config;
