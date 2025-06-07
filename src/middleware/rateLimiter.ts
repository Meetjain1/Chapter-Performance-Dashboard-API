import { Request, Response, NextFunction } from 'express';
import redis from '../services/redis';

const WINDOW_SIZE_IN_SECONDS = 60; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 30; // 30 requests per minute

export const rateLimiter = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ip = req.ip;
    const key = `ratelimit:${ip}`;
    const now = Date.now();
    const windowStart = now - (WINDOW_SIZE_IN_SECONDS * 1000);

    // Use multi to ensure atomic operations
    const multi = redis.multi();
    
    // Remove old requests
    multi.zremrangebyscore(key, 0, windowStart);
    
    // Count requests in current window
    multi.zcard(key);
    
    // Add current request
    multi.zadd(key, now, `${now}`);
    
    // Set expiry
    multi.expire(key, WINDOW_SIZE_IN_SECONDS);

    const results = await multi.exec();
    
    if (!results) {
      throw new Error('Redis commands failed');
    }

    const requestCount = results[1][1] as number;

    if (requestCount >= MAX_REQUESTS_PER_WINDOW) {
      return res.status(429).json({
        error: 'Too Many Requests',
        message: `Rate limit exceeded. Try again in ${WINDOW_SIZE_IN_SECONDS} seconds.`
      });
    }

    next();
  } catch (error) {
    console.error('Rate limiter error:', error);
    // Allow the request to proceed if rate limiter fails
    next();
  }
}; 