import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import redisClient, { redisReady } from '../services/redis';

// Configuration
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute

export const rateLimiter = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  
  try {
    const isAllowed = await checkRateLimit(ip);
    
    if (!isAllowed) {
      res.status(429).json({
        error: 'Too many requests. Please try again later.'
      });
      return;
    }
    
    next();
  } catch (error) {
    console.error('Rate limiter error:', error);
    // Allow request to proceed if rate limiter fails
    next();
  }
}; 