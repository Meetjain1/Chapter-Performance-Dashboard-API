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
          // @ts-ignore - The sendCommand function is compatible, but the types are complex.
          sendCommand: async (...args: string[]) => {
            // This check is for TypeScript; in practice, redisClient will be defined here.
            if (!redisClient) {
              throw new Error('Attempted to use Redis rate limiter but client is not initialized.');
            }
            try {
              // The underlying redis client will throw if the connection is lost
              return await redisClient.sendCommand(args);
            } catch (error) {
              console.error('Redis command error in rate-limiter:', error instanceof Error ? error.message : 'Unknown error');
              // Re-throw the error. express-rate-limit will catch it and call next(err) for the current request.
              throw error;
            }
          },
          prefix: 'rl:',
        })
      });
    } else {
      console.log('Using memory-based rate limiter because Redis is not available.');
      return rateLimit(rateLimiterConfig);
    }
  } catch (error) {
    console.error('Error creating rate limiter:', error instanceof Error ? error.message : 'Unknown error');
    console.log('Falling back to memory-based rate limiter due to an error during initialization.');
    return rateLimit(rateLimiterConfig);
  }
};

// Initialize rate limiter
let rateLimiterInstance: any = null;
createRateLimiter().then(limiter => {
  rateLimiterInstance = limiter;
  console.log('Rate limiter initialized successfully.');
}).catch(error => {
  console.error('Failed to create rate limiter, falling back to memory store:', error);
  rateLimiterInstance = rateLimit(rateLimiterConfig);
});

// Export middleware that uses the appropriate rate limiter
export const rateLimiter = (req: Request, res: Response, next: NextFunction) => {
  if (!rateLimiterInstance) {
    // This can happen if the async createRateLimiter is still running.
    // We fall back to a basic memory limiter to handle requests during this brief startup period.
    console.warn('Rate limiter not yet initialized, using temporary limiter for this request.');
    return rateLimit(rateLimiterConfig)(req, res, next);
  }
  return rateLimiterInstance(req, res, next);
}; 