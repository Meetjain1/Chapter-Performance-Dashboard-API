import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import redisClient, { redisReady } from '../services/redis';
import { RedisReply } from '@node-redis/client/dist/lib/commands';

// Create a memory store as fallback
const memoryStore = new Map();

// Create Redis store with fallback to memory store
export const rateLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: async (...args: string[]): Promise<RedisReply> => {
      try {
        await redisReady;
        return await redisClient.sendCommand(args);
      } catch (error) {
        console.error('Rate limiter Redis error:', error);
        // Use memory store as fallback
        const key = args[1] || '';
        if (args[0] === 'incr') {
          const current = (memoryStore.get(key) || 0) + 1;
          memoryStore.set(key, current);
          return current as RedisReply;
        }
        if (args[0] === 'pexpire') {
          memoryStore.set(key, 0);
          return 1 as RedisReply;
        }
        return null as RedisReply;
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