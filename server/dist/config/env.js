"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
// Load .env in non-production environments
if (process.env.NODE_ENV !== 'production') {
    dotenv_1.default.config();
}
let rawDatabaseUrl = process.env.DATABASE_URL || 'file:./dev.db';
if (process.env.RUNNING_IN_DOCKER === 'true') {
    rawDatabaseUrl = rawDatabaseUrl
        .replace('localhost', 'host.docker.internal')
        .replace('127.0.0.1', 'host.docker.internal');
}
const config = {
    port: process.env.PORT ? Number(process.env.PORT) : 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
    databaseUrl: rawDatabaseUrl,
    redisUrl: process.env.REDIS_URL || '',
    jwtAccessSecret: process.env.JWT_ACCESS_SECRET || 'change_me_access',
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'change_me_refresh',
    googleClientId: process.env.GOOGLE_CLIENT_ID || '',
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    googleRedirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/google/callback',
    frontendUrl: process.env.FRONTEND_URL || '',
    smtpHost: process.env.SMTP_HOST || 'smtp.ethereal.email',
    smtpPort: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587,
    smtpUser: process.env.SMTP_USER || '',
    smtpPass: process.env.SMTP_PASS || '',
};
exports.default = config;
