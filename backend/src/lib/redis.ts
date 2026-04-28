import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

export const redis = new Redis(redisUrl, {
    retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
    },
    maxRetriesPerRequest: null,
});

redis.on('connect', () => {
    console.log('Redis client connected');
});

redis.on('error', (err) => {
    console.error('Redis error:', err);
});

export const getCacheKey = (namespace: string, identifier: string): string => {
    return `${namespace}:${identifier}`;
};

export const getCacheTTL = (): number => {
    return parseInt(process.env.REDIS_CACHE_TTL || '300', 10);
};

export default redis;
