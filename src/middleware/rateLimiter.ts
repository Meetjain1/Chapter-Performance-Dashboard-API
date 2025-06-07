import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import redisClient from '../services/redis';

// This file was causing build errors. It is being replaced with a correct implementation.
// The primary rate limiting logic should be centralized in one place.

const limiter = rateLimit({
  store: new RedisStore({
    // @ts-expect-error - The ioredis client works but the types are not perfectly compatible.
    sendCommand: (...args: string[]) => redisClient.call(...args),
  }),
  windowMs: 60 * 1000, // 1 minute
  max: 30, // Limit each IP to 30 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: 'Too many requests from this IP, please try again after a minute',
});

export default limiter; 