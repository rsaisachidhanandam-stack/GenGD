import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getDatabase } from '../db/database';
import { User } from '../types';

export const JWT_SECRET = process.env.JWT_SECRET || 'syncsafe-super-secret-key-2026';

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    res.status(401).json({ error: 'Authentication required. Missing Bearer token.' });
    return;
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: string; email: string };
    const db = getDatabase();
    const user = db.prepare('SELECT id, email, name, created_at FROM users WHERE id = ?').get(payload.userId) as User | undefined;

    if (!user) {
      res.status(401).json({ error: 'User associated with token no longer exists.' });
      return;
    }

    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token.' });
    return;
  }
}
