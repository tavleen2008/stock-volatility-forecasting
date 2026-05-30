import Redis from 'ioredis';
import config from './env';

export const redis = new Redis(config.redisUrl || 'redis://localhost:6379');

redis.on('error', (err) => {
    console.error('Redis connection error:', err);
});

redis.on('connect', () => {
    console.log('Connected to Redis successfully');
});
