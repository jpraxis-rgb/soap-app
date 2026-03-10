import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

declare global {
  namespace Express {
    interface Request {
      user?: { id: string; email: string };
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid authorization header' });
    return;
  }

  const token = authHeader.split(' ')[1];
  const payload = jwt.decode(token) as { id?: string; email?: string } | null;

  if (!payload || !payload.id || !payload.email) {
    res.status(401).json({ error: 'Invalid token' });
    return;
  }

  req.user = { id: payload.id, email: payload.email };
  next();
}
