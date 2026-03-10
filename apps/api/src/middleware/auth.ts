import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import * as schema from '../db/schema.js';
import { SubscriptionTier } from '@soap/shared';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

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

  try {
    const payload = jwt.verify(token, JWT_SECRET) as { id?: string; email?: string };

    if (!payload || !payload.id || !payload.email) {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }

    req.user = { id: payload.id, email: payload.email };
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function requireTier(...tiers: SubscriptionTier[]) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    try {
      const [user] = await db.select()
        .from(schema.users)
        .where(eq(schema.users.id, req.user.id))
        .limit(1);

      if (!user) {
        res.status(401).json({ error: 'User not found' });
        return;
      }

      const userTier = user.subscriptionTier as SubscriptionTier;
      if (!tiers.includes(userTier)) {
        res.status(403).json({
          error: 'Insufficient subscription tier',
          required: tiers,
          current: userTier,
        });
        return;
      }

      next();
    } catch {
      res.status(500).json({ error: 'Internal server error' });
    }
  };
}
