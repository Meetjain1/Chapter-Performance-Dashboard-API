import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import redisClient, { redisReady } from '../services/redis';
import { MemoryStore } from 'express-rate-limit';

// Create a memory store as fallback
const memoryStore = new MemoryStore();

// Create Redis store with fallback to memory store
export const rateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    // @ts-ignore - Type mismatch is expected here but functionality works
    sendCommand: async (...args: string[]) => {
      try {
        await redisReady;
        return await redisClient.sendCommand(args);
      } catch (error) {
        console.error('Rate limiter Redis error, falling back to memory store:', error);
        // Use memory store as fallback
        const [command, key] = args;
        
        // Convert the key to a string since MemoryStore expects string keys
        const keyStr = String(key);
        
        switch (command) {
          case 'incr':
            return memoryStore.increment(keyStr);
          case 'get':
            return memoryStore.get(keyStr);
          case 'set':
            const value = args[2];
            const hits = parseInt(value) || 1;
            const resetTime = Date.now() + 60000; // 1 minute from now
            return memoryStore.resetKey(keyStr, { hits, resetTime });
          default:
            return undefined;
        }
      }
    },
    prefix: 'rl:', // Rate limiter key prefix
  }),
  skip: (req) => {
    // Skip rate limiting for health check endpoint
    return req.path === '/health';
  },
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many requests, please try again later.',
      retryAfter: res.getHeader('Retry-After')
    });
  }
}); 