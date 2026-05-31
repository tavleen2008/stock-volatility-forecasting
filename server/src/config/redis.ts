import Redis from 'ioredis';
import config from './env';

// ---------------------------------------------------------------------------
// Minimal in-memory store that mirrors the three Redis operations used in
// this codebase (get / set / del) so the server works without a Redis instance
// ---------------------------------------------------------------------------
class MemoryStore {
    private store = new Map<string, { value: string; expiresAt: number | null }>();

    async get(key: string): Promise<string | null> {
        const item = this.store.get(key);
        if (!item) return null;
        if (item.expiresAt !== null && Date.now() > item.expiresAt) {
            this.store.delete(key);
            return null;
        }
        return item.value;
    }

    // Matches the ioredis signature: set(key, value, 'EX', ttlSeconds)
    async set(key: string, value: string, exFlag?: string, ttlSeconds?: number): Promise<'OK'> {
        const expiresAt =
            exFlag === 'EX' && ttlSeconds ? Date.now() + ttlSeconds * 1000 : null;
        this.store.set(key, { value, expiresAt });
        return 'OK';
    }

    async del(key: string): Promise<number> {
        const existed = this.store.has(key);
        this.store.delete(key);
        return existed ? 1 : 0;
    }

    // ioredis EventEmitter shim — allows `.on('error', …)` calls without crashing
    on(_event: string, _cb: (...args: any[]) => void): this {
        return this;
    }
}

// ---------------------------------------------------------------------------
// Export a single `redis` object — real Redis when URL is configured, 
// in-memory otherwise
// ---------------------------------------------------------------------------
let redisClient: Redis | MemoryStore;

if (config.redisUrl) {
    const client = new Redis(config.redisUrl);
    client.on('error', (err) => console.error('[Redis] Connection error:', err.message));
    client.on('connect', () => console.log('✓ Connected to Redis'));
    redisClient = client;
} else {
    console.warn(
        '⚠  REDIS_URL not configured — using in-memory store.\n' +
        '   Auth tokens and OTP codes will not persist across server restarts.'
    );
    redisClient = new MemoryStore();
}

export const redis = redisClient as unknown as Redis;
