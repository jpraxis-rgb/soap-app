import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { validateBody } from '../middleware/validate.js';
import crypto from 'crypto';
import {
  registerUser,
  loginUser,
  googleAuth,
  getGoogleRedirectUrl,
  googleAuthCallback,
  appleAuth,
  refreshToken as refreshTokenService,
  getMe,
} from '../modules/auth/index.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const googleSchema = z.object({
  token: z.string().min(1, 'Google token is required'),
});

router.post('/register', validateBody(registerSchema), async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;
    const result = await registerUser(email, password, name);
    res.status(201).json({ data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Registration failed';
    const status = message === 'Email already registered' ? 409 : 500;
    res.status(status).json({ error: message });
  }
});

router.post('/login', validateBody(loginSchema), async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const result = await loginUser(email, password);
    res.json({ data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Login failed';
    res.status(401).json({ error: message });
  }
});

router.post('/google', validateBody(googleSchema), async (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    const result = await googleAuth(token);
    res.json({ data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Google auth failed';
    const status = message.includes('not configured') ? 503 : 401;
    res.status(status).json({ error: message });
  }
});

// ── Google OAuth2 redirect flow (web) ──────────────────────

router.get('/google/redirect', (_req: Request, res: Response) => {
  try {
    const state = crypto.randomBytes(16).toString('hex');
    const url = getGoogleRedirectUrl(state);
    res.redirect(url);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Google redirect failed';
    res.status(503).json({ error: message });
  }
});

router.get('/google/callback', async (req: Request, res: Response) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8081';

  try {
    const { code } = req.query;
    if (!code || typeof code !== 'string') {
      throw new Error('Missing authorization code');
    }

    const result = await googleAuthCallback(code);
    const payload = Buffer.from(JSON.stringify(result)).toString('base64');
    res.redirect(`${frontendUrl}/auth-callback.html?google_auth=${encodeURIComponent(payload)}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Google callback failed';
    const errPayload = Buffer.from(JSON.stringify({ error: message })).toString('base64');
    res.redirect(`${frontendUrl}/auth-callback.html?google_auth_error=${encodeURIComponent(errPayload)}`);
  }
});

router.post('/apple', async (req: Request, res: Response) => {
  try {
    const { token } = req.body;

    if (!token) {
      res.status(400).json({ error: 'Apple token is required' });
      return;
    }

    const result = await appleAuth(token);
    res.json({ data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Apple auth failed';
    res.status(500).json({ error: message });
  }
});

router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({ error: 'Refresh token is required' });
      return;
    }

    const result = await refreshTokenService(refreshToken);
    res.json({ data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Token refresh failed';
    res.status(401).json({ error: message });
  }
});

router.get('/me', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = await getMe(req.user!.id);
    res.json({ data: user });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get user';
    res.status(500).json({ error: message });
  }
});

export default router;
