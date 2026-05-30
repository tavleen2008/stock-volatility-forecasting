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
    jwtSecret: process.env.JWT_SECRET || 'change_me',
};

export default config;
