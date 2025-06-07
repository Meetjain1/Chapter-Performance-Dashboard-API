import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import redisClient from '../services/redis';

// Configuration
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 30; // requests per window

// Create rate limiter instance with appropriate store
const limiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  // Use Redis store if client is available, otherwise use memory store
  store: redisClient ? new RedisStore({
    sendCommand: (...args: string[]) => redisClient.call(...args),
  }) : undefined,
  skipFailedRequests: true, // Don't count failed requests
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: 'Too many requests. Please try again later.'
    });
  }
});

// Export the middleware
export const rateLimiter = limiter; 