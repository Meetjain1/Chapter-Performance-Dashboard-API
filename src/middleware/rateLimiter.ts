import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import redisClient, { redisReady } from '../services/redis';

export const rateLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: async (...args: string[]) => {
      await redisReady;
      return redisClient.sendCommand(args);
    },
    prefix: 'rate-limit:'
  }),
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute
  message: 'Too many requests from this IP, please try again after a minute',
  standardHeaders: true,
  legacyHeaders: false
}); 