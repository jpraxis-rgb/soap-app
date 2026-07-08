import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import * as schema from '../db/schema.js';
import { SubscriptionTier } from '@soap/shared';

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

const JWT_SECRET = (() => {
  const value = process.env.JWT_SECRET;
  if (value && value.length > 0) return value;
  if (IS_PRODUCTION) {
    throw new Error('[AUTH] JWT_SECRET is not set. Refusing to start in production without it.');
  }
  console.warn('[AUTH] WARNING: JWT_SECRET not set, using insecure dev fallback. Set JWT_SECRET before deploying.');
  return 'dev-secret-change-me';
})();

const JWT_ALGORITHM = 'HS256' as const;

declare global {
  namespace Express {
    interface Request {
      user?: { id: string; email: string };
    }
  }
}

// Dev-mode demo user ID (stable UUID so DB relations work across restarts)
const DEV_USER_ID = '00000000-0000-0000-0000-000000000001';
const DEV_USER_EMAIL = 'demo@soap-app.dev';
// The demo-user auth shortcut must be opted into EXPLICITLY and can never be on
// in production. Previously this keyed off the *absence* of a strong JWT_SECRET,
// which meant one misconfigured deploy would silently disable authentication for
// the entire API.
const IS_DEV = process.env.ENABLE_DEV_AUTH === 'true' && !IS_PRODUCTION;

/** Ensure a demo user row exists in the DB (idempotent). */
let devUserEnsured = false;
async function ensureDevUser() {
  if (devUserEnsured) return;
  try {
    const [existing] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, DEV_USER_ID));
    if (!existing) {
      await db.insert(schema.users).values({
        id: DEV_USER_ID,
        email: DEV_USER_EMAIL,
        name: 'Demo User',
        passwordHash: 'dev-no-password',
        authProvider: 'dev',
        subscriptionTier: SubscriptionTier.MENTOR,
      });
      console.log('[AUTH] Created dev demo user');
    }
    devUserEnsured = true;
  } catch (err) {
    // Table might not exist yet (no migrations); skip silently
    console.warn('[AUTH] Could not ensure dev user:', err instanceof Error ? err.stack : err);
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  // In dev mode without JWT_SECRET, auto-authenticate as demo user
  if (IS_DEV) {
    ensureDevUser().then(() => {
      req.user = { id: DEV_USER_ID, email: DEV_USER_EMAIL };
      next();
    }).catch(() => {
      // Even if DB insert fails, still set user so routes work
      req.user = { id: DEV_USER_ID, email: DEV_USER_EMAIL };
      next();
    });
    return;
  }

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid authorization header' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, JWT_SECRET, { algorithms: [JWT_ALGORITHM] }) as { id?: string; email?: string };

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

// Ordering derived from the canonical SubscriptionTier enum in @soap/shared.
// Keep this in lockstep with that enum — divergent tier names previously caused
// paying users to be treated as free for gated features.
const TIER_HIERARCHY: Record<string, number> = {
  [SubscriptionTier.FREE]: 0,
  [SubscriptionTier.REGISTRO]: 1,
  [SubscriptionTier.MICROLEARNING]: 2,
  [SubscriptionTier.MENTOR]: 3,
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
