import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import redisClient, { redisReady } from '../services/redis';

// Create a memory store as fallback
const memoryStore = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute
  message: 'Too many requests from this IP, please try again after a minute',
  standardHeaders: true,
  legacyHeaders: false
});

// Create Redis store with fallback to memory store
export const rateLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: async (...args: string[]) => {
      try {
        await redisReady;
        return await redisClient.sendCommand(args);
      } catch (error) {
        console.error('Rate limiter Redis error:', error);
        // Fall back to memory store
        return memoryStore;
      }
    },
    prefix: 'rate-limit:'
  }),
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute
  message: 'Too many requests from this IP, please try again after a minute',
  standardHeaders: true,
  legacyHeaders: false
}); 