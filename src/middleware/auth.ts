import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';

export interface AuthRequest extends Request {
  user?: {
    email: string;
    isAdmin: boolean;
  };
}

export const auth = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.header('Authorization');
    console.log('Auth middleware - Authorization header:', authHeader);
    
    if (!authHeader?.startsWith('Bearer ')) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    console.log('Auth middleware - Token:', token);
    
    const decoded = jwt.verify(token, JWT_SECRET) as { email: string; isAdmin: boolean };
    console.log('Auth middleware - Decoded token:', decoded);
    
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
};

export const adminAuth = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    console.log('Admin auth middleware called');
    const authHeader = req.header('Authorization');
    console.log('Admin auth - Authorization header:', authHeader);

    if (!authHeader?.startsWith('Bearer ')) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    console.log('Admin auth - Token:', token);
    
    const decoded = jwt.verify(token, JWT_SECRET) as { email: string; isAdmin: boolean };
    console.log('Admin auth - Decoded token:', decoded);
    
    if (!decoded.isAdmin) {
      res.status(403).json({ error: 'Admin access required.' });
      return;
    }

    req.user = decoded;
    next();
  } catch (error) {
    console.error('Admin auth error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
};

export const isAdmin = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }
    
    const decoded = jwt.verify(token, JWT_SECRET) as { email: string; isAdmin: boolean };
    
    if (!decoded.isAdmin) {
      res.status(403).json({ error: 'Admin access required' });
      return;
    }
    
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
}; 