import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import redisClient, { redisReady } from '../services/redis';

// Redis-backed rate limiter
const redisRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    // @ts-ignore
    sendCommand: async (...args: string[]) => {
      await redisReady;
      return await redisClient.sendCommand(args);
    },
    prefix: 'rl:',
  }),
  skip: (req) => req.path === '/healthz',
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many requests, please try again later.',
      retryAfter: res.getHeader('Retry-After')
    });
  }
});

// Memory store rate limiter (fallback)
const memoryRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === '/healthz',
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many requests, please try again later.',
      retryAfter: res.getHeader('Retry-After')
    });
  }
});

// Middleware to choose the correct rate limiter
export const rateLimiter = async (req, res, next) => {
  try {
    await redisReady;
    return redisRateLimiter(req, res, next);
  } catch (err) {
    console.error('Falling back to memory rate limiter:', err);
    return memoryRateLimiter(req, res, next);
  }
}; 