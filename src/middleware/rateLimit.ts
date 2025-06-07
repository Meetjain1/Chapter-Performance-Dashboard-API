import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import redisClient from '../services/redis';

// Configuration
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 30; // requests per window

// Helper for Redis sendCommand
const getRedisStore = () => {
  if (!redisClient) return undefined;
  return new RedisStore({
    // Type assertion to satisfy SendCommandFn
    sendCommand: (...args: string[]) =>
      redisClient.call(...args).then((res) => (res === null ? undefined : res)) as Promise<unknown>,
  });
};

// Create rate limiter instance with appropriate store
const limiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  store: getRedisStore(),
  skipFailedRequests: true, // Don't count failed requests
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: 'Too many requests. Please try again later.'
    });
  }
});

// Export the middleware
export const rateLimiter = limiter; 