import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import * as schema from '../db/schema.js';
import { SubscriptionTier } from '@soap/shared';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

if (!process.env.JWT_SECRET) {
  console.warn('[AUTH] WARNING: JWT_SECRET not set, using insecure default. Set JWT_SECRET in production.');
}

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

const TIER_HIERARCHY: Record<string, number> = {
  free: 0,
  premium: 1,
  pro: 2,
  mentor: 3,
};

/**
 * Middleware that requires a minimum subscription tier.
 * Must be used after authMiddleware.
 */
export function requireTier(minTier: string) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user?.id) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const [user] = await db
      .select({ subscriptionTier: schema.users.subscriptionTier })
      .from(schema.users)
      .where(eq(schema.users.id, req.user.id));

    if (!user) {
      res.status(401).json({ error: 'User not found' });
      return;
    }

    const userTierLevel = TIER_HIERARCHY[user.subscriptionTier] ?? 0;
    const requiredTierLevel = TIER_HIERARCHY[minTier] ?? 0;

    if (userTierLevel < requiredTierLevel) {
      res.status(403).json({ error: `This feature requires the '${minTier}' tier or higher` });
      return;
    }

    next();
  };
}
