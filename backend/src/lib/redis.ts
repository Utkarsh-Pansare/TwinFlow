import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

// Create a Redis client that won't crash the app if unavailable
let redis: Redis;

try {
    redis = new Redis(redisUrl, {
        retryStrategy: (times) => {
            if (times > 3) {
                console.warn('Redis: Max retries reached, running without cache');
                return null; // stop retrying
            }
            const delay = Math.min(times * 50, 2000);
            return delay;
        },
        maxRetriesPerRequest: 3,
        connectTimeout: 5000,
        lazyConnect: true,
    });

    redis.on('connect', () => {
        console.log('Redis client connected');
    });

    redis.on('error', (err) => {
        console.warn('Redis error (cache disabled):', err.message);
    });
} catch (err) {
    console.warn('Redis unavailable, running without cache');
    redis = new Redis({ lazyConnect: true });
}

export { redis };

export const getCacheKey = (namespace: string, identifier: string): string => {
    return `${namespace}:${identifier}`;
};

export const getCacheTTL = (): number => {
    return parseInt(process.env.REDIS_CACHE_TTL || '300', 10);
};

export default redis;
