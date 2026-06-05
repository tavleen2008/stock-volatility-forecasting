import rateLimit, { MemoryStore } from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { redis } from '../config/redis';

// Wrapper store that gracefully falls back to MemoryStore if Redis is unavailable
class FallbackStore {
    private fallbackStore = new MemoryStore();
    private redisStore: RedisStore;
    private options?: any;
    private redisInitialized = false;

    constructor(prefix: string) {
        this.redisStore = new RedisStore({
            // @ts-expect-error - Known issue with rate-limit-redis types and ioredis
            sendCommand: (...args: string[]) => redis.call(...args),
            prefix,
        });
    }

    init(options: any) {
        this.options = options;
        this.fallbackStore.init?.(options);
        
        // Initialize RedisStore only if ready to avoid throwing during initialization
        if (redis.status === 'ready') {
            this.initRedis();
        }
        
        // If redis connects later, initialize then
        redis.on('ready', () => {
            this.initRedis();
        });
    }
    
    private initRedis() {
        if (!this.redisInitialized && this.options) {
            try {
                this.redisStore.init?.(this.options);
                this.redisInitialized = true;
            } catch (err) {
                // Ignore initialization errors
            }
        }
    }

    async get(key: string) {
        if (redis.status === 'ready') {
            try { return await this.redisStore.get?.(key); } catch (e) {}
        }
        return this.fallbackStore.get?.(key);
    }

    async increment(key: string) {
        if (redis.status === 'ready') {
            try { return await this.redisStore.increment(key); } catch (e) {}
        }
        return this.fallbackStore.increment(key);
    }

    async decrement(key: string) {
        if (redis.status === 'ready') {
            try { return await this.redisStore.decrement(key); } catch (e) {}
        }
        return this.fallbackStore.decrement(key);
    }

    async resetKey(key: string) {
        if (redis.status === 'ready') {
            try { return await this.redisStore.resetKey(key); } catch (e) {}
        }
        return this.fallbackStore.resetKey(key);
    }
}

const createStore = (prefix: string) => new FallbackStore(prefix) as any;

export const globalLimiter = rateLimit({
    store: createStore('rl:global:'),
    windowMs: 15 * 60 * 1000,
    max: 100, 
    standardHeaders: true, 
    legacyHeaders: false, 
    message: { error: 'Too many requests from this IP, please try again after 15 minutes' },
});

export const authLimiter = rateLimit({
    store: createStore('rl:auth:'),
    windowMs: 15 * 60 * 1000, 
    max: 10, 
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many authentication attempts, please try again after 15 minutes' },
});

export default globalLimiter;
