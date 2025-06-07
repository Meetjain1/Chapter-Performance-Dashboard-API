import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import redisClient, { redisReady } from '../services/redis';

// Configuration
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 30; // requests per window

// Common configuration for rate limiter
const rateLimiterConfig = {
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

// Create the appropriate rate limiter based on Redis availability
const createRateLimiter = async () => {
  try {
    const isRedisReady = await redisReady;
    
    if (isRedisReady && redisClient) {
      console.log('Using Redis-based rate limiter');
      return rateLimit({
        ...rateLimiterConfig,
        store: new RedisStore({
          sendCommand: async (...args: string[]) => {
            try {
              return await redisClient.sendCommand(args);
            } catch (error) {
              console.error('Redis command error:', error instanceof Error ? error.message : 'Unknown error');
              // Don't throw, let it fall back to memory store
              return null;
            }
          },
          prefix: 'rl:',
        })
      });
    } else {
      console.log('Using memory-based rate limiter');
      return rateLimit(rateLimiterConfig);
    }
  } catch (error) {
    console.error('Error creating rate limiter:', error instanceof Error ? error.message : 'Unknown error');
    console.log('Falling back to memory-based rate limiter');
    return rateLimit(rateLimiterConfig);
  }
};

// Initialize rate limiter
let rateLimiterInstance: any = null;
createRateLimiter().then(limiter => {
  rateLimiterInstance = limiter;
}).catch(error => {
  console.error('Failed to create rate limiter:', error);
  rateLimiterInstance = rateLimit(rateLimiterConfig);
});

// Export middleware that uses the appropriate rate limiter
export const rateLimiter = (req: Request, res: Response, next: NextFunction) => {
  if (!rateLimiterInstance) {
    // If rate limiter is not ready yet, allow the request
    console.log('Rate limiter not ready, allowing request');
    return next();
  }
  return rateLimiterInstance(req, res, next);
}; 