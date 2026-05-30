export const AUTH_CONSTANTS = {
    ACCESS_TOKEN_EXPIRES_IN: '15m',
    REFRESH_TOKEN_EXPIRES_IN: '7d',
    REFRESH_TOKEN_REDIS_TTL: 7 * 24 * 60 * 60, // 7 days in seconds
} as const;
