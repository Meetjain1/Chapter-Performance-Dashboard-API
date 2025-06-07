import { Request, Response, NextFunction } from 'express';
import { checkRateLimit } from '../services/redisService';

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