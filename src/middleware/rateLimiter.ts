import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import redisClient, { redisReady } from '../services/redis';

// Configuration
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 30; // requests per window

// Common configuration for both limiters
const commonConfig = {
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req: Request) => req.path === '/healthz',
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: 'Too many requests, please try again later.',
      retryAfter: res.getHeader('Retry-After')
    });
  }
};

// Redis-backed rate limiter
const redisRateLimiter = rateLimit({
  ...commonConfig,
  store: new RedisStore({
    sendCommand: async (...args: string[]) => {
      try {
        const isReady = await redisReady;
        if (!isReady) {
          throw new Error('Redis not available');
        }
        return await redisClient.sendCommand(args);
      } catch (error) {
        console.error('Redis rate limiter error:', error instanceof Error ? error.message : 'Unknown error');
        throw error; // Let the rate limiter handle the fallback
      }
    },
    prefix: 'rl:',
  })
});

// Memory-based rate limiter (fallback)
const memoryRateLimiter = rateLimit(commonConfig);

// Middleware that chooses the appropriate rate limiter
export const rateLimiter = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const isRedisReady = await redisReady;
    if (isRedisReady) {
      return redisRateLimiter(req, res, next);
    } else {
      console.log('Using memory-based rate limiter (Redis not available)');
      return memoryRateLimiter(req, res, next);
    }
  } catch (error) {
    console.error('Rate limiter error:', error instanceof Error ? error.message : 'Unknown error');
    // On any error, fall back to memory-based rate limiting
    return memoryRateLimiter(req, res, next);
  }
}; 