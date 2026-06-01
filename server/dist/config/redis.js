"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.safeDel = exports.safeSet = exports.safeSetex = exports.safeGet = exports.redis = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const env_1 = __importDefault(require("./env"));
// Create Redis with lazyConnect so it doesn't crash on import if Redis is down
exports.redis = new ioredis_1.default(env_1.default.redisUrl || 'redis://localhost:6379', {
    lazyConnect: true,
    enableOfflineQueue: false,
    retryStrategy: (times) => {
        if (times > 3) {
            console.warn('[Redis] Could not connect after 3 retries. Redis features (caching, sessions) will be degraded.');
            return null; // stop retrying
        }
        return Math.min(times * 500, 2000);
    },
    maxRetriesPerRequest: 1,
});
exports.redis.on('error', (err) => {
    // Just log — don't crash
    if (err.code !== 'ECONNREFUSED') {
        console.error('[Redis] Error:', err.message);
    }
});
exports.redis.on('connect', () => {
    console.log('[Redis] Connected successfully');
});
// Attempt connection (non-blocking)
exports.redis.connect().catch(() => {
    console.warn('[Redis] Not available — caching and rate-limiting will be skipped.');
});
const memoryFallback = new Map();
/** Safe Redis get — returns null on error instead of throwing */
const safeGet = async (key) => {
    try {
        if (exports.redis.status !== 'ready') {
            const entry = memoryFallback.get(key);
            if (entry) {
                if (entry.expiresAt > Date.now()) {
                    return entry.value;
                }
                memoryFallback.delete(key);
            }
            return null;
        }
        return await exports.redis.get(key);
    }
    catch {
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
exports.safeGet = safeGet;
/** Safe Redis setex — no-ops on error instead of throwing */
const safeSetex = async (key, ttl, value) => {
    try {
        memoryFallback.set(key, { value, expiresAt: Date.now() + ttl * 1000 });
        if (exports.redis.status === 'ready') {
            await exports.redis.setex(key, ttl, value);
        }
    }
    catch {
        /* ignore */
    }
};
exports.safeSetex = safeSetex;
/** Safe Redis set — no-ops on error */
const safeSet = async (key, value, mode, ttl) => {
    try {
        const expiresAt = mode === 'EX' && ttl ? Date.now() + (ttl * 1000) : Infinity;
        memoryFallback.set(key, { value, expiresAt });
        if (exports.redis.status === 'ready') {
            if (mode === 'EX' && ttl) {
                await exports.redis.set(key, value, 'EX', ttl);
            }
            else {
                await exports.redis.set(key, value);
            }
        }
    }
    catch {
        /* ignore */
    }
};
exports.safeSet = safeSet;
/** Safe Redis del — no-ops on error */
const safeDel = async (key) => {
    try {
        memoryFallback.delete(key);
        if (exports.redis.status === 'ready') {
            await exports.redis.del(key);
        }
    }
    catch {
        /* ignore */
    }
};
exports.safeDel = safeDel;
