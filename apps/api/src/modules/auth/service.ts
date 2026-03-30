import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { eq } from 'drizzle-orm';
import { db } from '../../db/index.js';
import * as schema from '../../db/schema.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-change-me';

if (!process.env.JWT_SECRET) {
  console.warn('[AUTH] WARNING: JWT_SECRET not set, using insecure default. Set JWT_SECRET in production.');
}
if (!process.env.JWT_REFRESH_SECRET) {
  console.warn('[AUTH] WARNING: JWT_REFRESH_SECRET not set, using insecure default. Set JWT_REFRESH_SECRET in production.');
}

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
if (!GOOGLE_CLIENT_ID) {
  console.warn('[AUTH] WARNING: GOOGLE_CLIENT_ID not set. Google auth will fail in production.');
}
const googleOAuth2Client = new OAuth2Client(GOOGLE_CLIENT_ID);

// Use seconds: 7 days = 604800, 30 days = 2592000
const JWT_EXPIRES_IN = 604800;
const JWT_REFRESH_EXPIRES_IN = 2592000;

interface TokenPayload {
  id: string;
  email: string;
}

function signToken(payload: TokenPayload, expiresIn: number = JWT_EXPIRES_IN): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

function signRefreshToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRES_IN });
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
}

export function verifyRefreshToken(token: string): TokenPayload {
  return jwt.verify(token, JWT_REFRESH_SECRET) as TokenPayload;
}

export async function registerUser(email: string, password: string, name: string) {
  // Check if user exists
  const existing = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
  if (existing.length > 0) {
    throw new Error('Email already registered');
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const [user] = await db.insert(schema.users).values({
    email,
    name,
    authProvider: 'email',
    passwordHash,
  }).returning();

  const token = signToken({ id: user.id, email: user.email });
  const refreshTokenValue = signRefreshToken({ id: user.id, email: user.email });

  return {
    user: sanitizeUser(user),
    token,
    refreshToken: refreshTokenValue,
  };
}

export async function loginUser(email: string, password: string) {
  const [user] = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
  if (!user) {
    throw new Error('Invalid email or password');
  }

  if (!user.passwordHash) {
    throw new Error('Invalid email or password');
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw new Error('Invalid email or password');
  }

  const token = signToken({ id: user.id, email: user.email });
  const refreshTokenValue = signRefreshToken({ id: user.id, email: user.email });

  return {
    user: sanitizeUser(user),
    token,
    refreshToken: refreshTokenValue,
  };
}

export async function googleAuth(googleIdToken: string) {
  if (!GOOGLE_CLIENT_ID) {
    throw new Error('Google auth is not configured');
  }

  const ticket = await googleOAuth2Client.verifyIdToken({
    idToken: googleIdToken,
    audience: GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();
  if (!payload || !payload.email) {
    throw new Error('Invalid Google token: no email in payload');
  }

  const { email, name, picture, email_verified } = payload;

  if (!email_verified) {
    throw new Error('Google email not verified');
  }

  let [user] = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);

  if (!user) {
    [user] = await db.insert(schema.users).values({
      email,
      name: name || email.split('@')[0],
      authProvider: 'google',
      avatarUrl: picture || null,
    }).returning();
  } else if (!user.avatarUrl && picture) {
    [user] = await db.update(schema.users)
      .set({ avatarUrl: picture, updatedAt: new Date() })
      .where(eq(schema.users.id, user.id))
      .returning();
  }

  const token = signToken({ id: user.id, email: user.email });
  const refreshTokenValue = signRefreshToken({ id: user.id, email: user.email });

  return {
    user: sanitizeUser(user),
    token,
    refreshToken: refreshTokenValue,
  };
}

export async function appleAuth(appleToken: string) {
  // Stub: In production, verify appleToken with Apple's API
  const mockEmail = `apple_${appleToken.substring(0, 8)}@example.com`;
  const mockName = 'Apple User';

  let [user] = await db.select().from(schema.users).where(eq(schema.users.email, mockEmail)).limit(1);

  if (!user) {
    [user] = await db.insert(schema.users).values({
      email: mockEmail,
      name: mockName,
      authProvider: 'apple',
    }).returning();
  }

  const token = signToken({ id: user.id, email: user.email });
  const refreshTokenValue = signRefreshToken({ id: user.id, email: user.email });

  return {
    user: sanitizeUser(user),
    token,
    refreshToken: refreshTokenValue,
  };
}

export async function refreshToken(token: string) {
  const payload = verifyRefreshToken(token);
  const [user] = await db.select().from(schema.users).where(eq(schema.users.id, payload.id)).limit(1);
  if (!user) {
    throw new Error('User not found');
  }

  const newToken = signToken({ id: user.id, email: user.email });
  const newRefreshToken = signRefreshToken({ id: user.id, email: user.email });

  return {
    token: newToken,
    refreshToken: newRefreshToken,
  };
}

export async function getMe(userId: string) {
  const [user] = await db.select().from(schema.users).where(eq(schema.users.id, userId)).limit(1);
  if (!user) {
    throw new Error('User not found');
  }
  return sanitizeUser(user);
}

export async function updateProfile(userId: string, data: { name?: string; avatar_url?: string }) {
  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  if (data.name !== undefined) updateData.name = data.name;
  if (data.avatar_url !== undefined) updateData.avatarUrl = data.avatar_url;

  const [user] = await db.update(schema.users)
    .set(updateData)
    .where(eq(schema.users.id, userId))
    .returning();

  if (!user) {
    throw new Error('User not found');
  }
  return sanitizeUser(user);
}

function sanitizeUser(user: typeof schema.users.$inferSelect) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatar_url: user.avatarUrl,
    auth_provider: user.authProvider,
    subscription_tier: user.subscriptionTier,
    created_at: user.createdAt,
    updated_at: user.updatedAt,
  };
}
