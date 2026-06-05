import Redis from 'ioredis';
import config from './env';

// Create Redis with lazyConnect so it doesn't crash on import if Redis is down
export const redis = new Redis(config.redisUrl || 'redis://localhost:6379', {
    lazyConnect: true,
    enableOfflineQueue: false,
    retryStrategy: (times: number) => {
        if (times > 3) {
            console.warn('[Redis] Could not connect after 3 retries. Redis features (caching, sessions) will be degraded.');
            return null; // stop retrying
        }
        return Math.min(times * 500, 2000);
    },
    maxRetriesPerRequest: 1,
});

redis.on('error', (err) => {
    // Just log — don't crash
    if ((err as any).code !== 'ECONNREFUSED') {
        console.error('[Redis] Error:', err.message);
    }
});

redis.on('connect', () => {
    console.log('[Redis] Connected successfully');
});

// Attempt connection (non-blocking)
redis.connect().catch(() => {
    console.warn('[Redis] Not available — caching and rate-limiting will be skipped.');
});

const memoryFallback = new Map<string, { value: string; expiresAt: number }>();

/** Safe Redis get — returns null on error instead of throwing */
export const safeGet = async (key: string): Promise<string | null> => {
    try {
        if (redis.status !== 'ready') {
            const entry = memoryFallback.get(key);
            if (entry) {
                if (entry.expiresAt > Date.now()) {
                    return entry.value;
                }
                memoryFallback.delete(key);
            }
            return null;
        }
        return await redis.get(key);
    } catch {
        const entry = memoryFallback.get(key);
        if (entry) {
            if (entry.expiresAt > Date.now()) {
                return entry.value;
            }
            memoryFallback.delete(key);
        }
        return null;
    }
};

/** Safe Redis setex — no-ops on error instead of throwing */
export const safeSetex = async (key: string, ttl: number, value: string): Promise<void> => {
    try {
        memoryFallback.set(key, { value, expiresAt: Date.now() + ttl * 1000 });
        if (redis.status === 'ready') {
            await redis.setex(key, ttl, value);
        }
    } catch {
        /* ignore */
    }
};

/** Safe Redis set — no-ops on error */
export const safeSet = async (key: string, value: string, mode?: 'EX', ttl?: number): Promise<void> => {
    try {
        const expiresAt = mode === 'EX' && ttl ? Date.now() + (ttl * 1000) : Infinity;
        memoryFallback.set(key, { value, expiresAt });
        if (redis.status === 'ready') {
            if (mode === 'EX' && ttl) {
                await redis.set(key, value, 'EX', ttl);
            } else {
                await redis.set(key, value);
            }
        }
    } catch {
        /* ignore */
    }
};

/** Safe Redis del — no-ops on error */
export const safeDel = async (key: string): Promise<void> => {
    try {
        memoryFallback.delete(key);
        if (redis.status === 'ready') {
            await redis.del(key);
        }
    } catch {
        /* ignore */
    }
};
