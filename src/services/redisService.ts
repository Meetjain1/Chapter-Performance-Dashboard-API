import Redis from 'ioredis';
import { PaginatedChapterResponse } from '../models/Chapter';

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3
});

redis.on('error', (error) => {
  console.error('Redis Error:', error);
});

redis.on('connect', () => {
  console.log('Redis Client Connected');
});

redis.on('ready', () => {
  console.log('Redis is ready');
});

// Cache TTL in seconds (1 hour)
const CACHE_TTL = 3600;
// Rate limit window in seconds (1 minute)
const RATE_LIMIT_WINDOW = 60;
// Maximum requests per window
const MAX_REQUESTS = 30;

export const cacheKey = (filters: any): string => {
  const sortedFilters = Object.keys(filters)
    .sort()
    .reduce((acc: any, key) => {
      acc[key] = filters[key];
      return acc;
    }, {});
  return `chapters:${JSON.stringify(sortedFilters)}`;
};

export const getCache = async (key: string): Promise<PaginatedChapterResponse | null> => {
  try {
    const cached = await redis.get(key);
    if (cached) {
      console.log(`Cache hit for key: ${key}`);
      return JSON.parse(cached);
    }
    console.log(`Cache miss for key: ${key}`);
    return null;
  } catch (error) {
    console.error('Redis getCache error:', error);
    return null;
  }
};

export const setCache = async (key: string, data: PaginatedChapterResponse): Promise<void> => {
  try {
    await redis.setex(key, CACHE_TTL, JSON.stringify(data));
    console.log(`Cache set for key: ${key}`);
  } catch (error) {
    console.error('Redis setCache error:', error);
  }
};

export const invalidateCache = async (): Promise<void> => {
  try {
    const keys = await redis.keys('chapters:*');
    if (keys.length) {
      await redis.del(...keys);
      console.log(`Invalidated ${keys.length} cache keys`);
    }
  } catch (error) {
    console.error('Redis invalidateCache error:', error);
  }
};

export const checkRateLimit = async (ip: string): Promise<boolean> => {
  const key = `ratelimit:${ip}`;
  try {
    const multi = redis.multi();
    multi.incr(key);
    multi.ttl(key);
    
    const [requests, ttl] = await multi.exec() as [any, any];
    const requestCount = requests[1];
    
    if (ttl[1] === -1) {
      await redis.expire(key, RATE_LIMIT_WINDOW);
    }
    
    const isAllowed = requestCount <= MAX_REQUESTS;
    if (!isAllowed) {
      console.log(`Rate limit exceeded for IP: ${ip}`);
    }
    
    return isAllowed;
  } catch (error) {
    console.error('Redis checkRateLimit error:', error);
    return true; // Allow request if Redis fails
  }
};

export default redis; 