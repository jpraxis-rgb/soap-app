import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { eq } from 'drizzle-orm';
import { db } from '../../db/index.js';
import * as schema from '../../db/schema.js';

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

/**
 * Resolve a required secret. In production a missing secret is fatal — we throw
 * on boot rather than silently falling back to a value that is public in source
 * (which would allow anyone to forge tokens). In non-production we allow a clearly
 * labelled dev fallback so local development still works.
 */
function requireSecret(name: 'JWT_SECRET' | 'JWT_REFRESH_SECRET', devFallback: string): string {
  const value = process.env[name];
  if (value && value.length > 0) return value;
  if (IS_PRODUCTION) {
    throw new Error(`[AUTH] ${name} is not set. Refusing to start in production without it.`);
  }
  console.warn(`[AUTH] WARNING: ${name} not set, using insecure dev fallback. Set ${name} before deploying.`);
  return devFallback;
}

const JWT_SECRET = requireSecret('JWT_SECRET', 'dev-secret-change-me');
const JWT_REFRESH_SECRET = requireSecret('JWT_REFRESH_SECRET', 'dev-refresh-secret-change-me');

// Pin the signing algorithm so a token can never be verified under an unexpected
// algorithm (defense-in-depth against algorithm-confusion attacks).
const JWT_ALGORITHM = 'HS256' as const;

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
if (!GOOGLE_CLIENT_ID) {
  console.warn('[AUTH] WARNING: GOOGLE_CLIENT_ID not set. Google auth will fail in production.');
}
if (!GOOGLE_CLIENT_SECRET) {
  console.warn('[AUTH] WARNING: GOOGLE_CLIENT_SECRET not set. Google web OAuth redirect flow will not work.');
}
const GOOGLE_REDIRECT_URI = `${process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api/v1'}/auth/google/callback`;
const googleOAuth2Client = new OAuth2Client(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI);

// Use seconds: access token 1 day = 86400, refresh 30 days = 2592000.
// A shorter access-token lifetime limits the blast radius of a leaked token;
// the client transparently refreshes via the 30-day refresh token.
const JWT_EXPIRES_IN = 86400;
const JWT_REFRESH_EXPIRES_IN = 2592000;

interface TokenPayload {
  id: string;
  email: string;
}

function signToken(payload: TokenPayload, expiresIn: number = JWT_EXPIRES_IN): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn, algorithm: JWT_ALGORITHM });
}

function signRefreshToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRES_IN, algorithm: JWT_ALGORITHM });
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, JWT_SECRET, { algorithms: [JWT_ALGORITHM] }) as TokenPayload;
}

export function verifyRefreshToken(token: string): TokenPayload {
  return jwt.verify(token, JWT_REFRESH_SECRET, { algorithms: [JWT_ALGORITHM] }) as TokenPayload;
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

export async function googleAuth(googleToken: string) {
  if (!GOOGLE_CLIENT_ID) {
    throw new Error('Google auth is not configured');
  }

  let email: string | undefined;
  let name: string | undefined;
  let picture: string | undefined;
  let email_verified: boolean | undefined;

  // Try verifying as an ID token first (native mobile flow)
  try {
    const ticket = await googleOAuth2Client.verifyIdToken({
      idToken: googleToken,
      audience: GOOGLE_CLIENT_ID,
    });
    const idPayload = ticket.getPayload();
    if (idPayload?.email) {
      email = idPayload.email;
      name = idPayload.name;
      picture = idPayload.picture;
      email_verified = idPayload.email_verified;
    }
  } catch {
    // Not a valid ID token — try as an OAuth2 access token (web flow)
  }

  // Fallback: treat as an OAuth2 access token (web flow). Before trusting the
  // email, verify the token was issued for *our* client via the tokeninfo
  // endpoint — otherwise an access token minted by any other Google OAuth app
  // could be replayed here to impersonate its owner (confused-deputy).
  if (!email) {
    try {
      const tokenInfoRes = await fetch(
        `https://oauth2.googleapis.com/tokeninfo?access_token=${encodeURIComponent(googleToken)}`,
      );
      if (!tokenInfoRes.ok) {
        throw new Error('Failed to verify Google token');
      }
      const tokenInfo = await tokenInfoRes.json() as { aud?: string; azp?: string };
      const audience = tokenInfo.aud || tokenInfo.azp;
      if (audience !== GOOGLE_CLIENT_ID) {
        throw new Error('Google token was not issued for this application');
      }

      const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${googleToken}` },
      });
      if (!res.ok) {
        throw new Error('Failed to verify Google token');
      }
      const userInfo = await res.json() as {
        email?: string;
        name?: string;
        picture?: string;
        email_verified?: boolean;
      };
      email = userInfo.email;
      name = userInfo.name;
      picture = userInfo.picture;
      email_verified = userInfo.email_verified;
    } catch (fetchErr) {
      throw new Error(fetchErr instanceof Error ? fetchErr.message : 'Invalid Google token');
    }
  }

  if (!email) {
    throw new Error('Invalid Google token: no email in payload');
  }

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

// ── Google OAuth2 redirect flow (for web — avoids JS origin requirement) ──

export function getGoogleRedirectUrl(state: string): string {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    throw new Error('Google OAuth redirect is not configured (missing GOOGLE_CLIENT_SECRET)');
  }
  return googleOAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['openid', 'email', 'profile'],
    state,
    prompt: 'select_account',
  });
}

export async function googleAuthCallback(code: string) {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    throw new Error('Google OAuth redirect is not configured');
  }

  const { tokens } = await googleOAuth2Client.getToken(code);
  googleOAuth2Client.setCredentials(tokens);

  const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  if (!res.ok) {
    throw new Error('Failed to fetch Google user info');
  }
  const userInfo = await res.json() as {
    email?: string;
    name?: string;
    picture?: string;
    email_verified?: boolean;
  };

  const { email, name, picture, email_verified } = userInfo;

  if (!email) {
    throw new Error('No email returned from Google');
  }
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

/** Raised by appleAuth so the route can translate it to HTTP 501. */
export class NotImplementedError extends Error {}

export async function appleAuth(_appleToken: string): Promise<never> {
  // Apple Sign-In requires verifying the identity token against Apple's public
  // JWKS (signature, aud, iss, exp, nonce). Until that is implemented we must NOT
  // issue sessions — the previous stub granted a valid session for any string,
  // which is a full authentication bypass.
  throw new NotImplementedError('Apple sign-in is not available yet.');
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
