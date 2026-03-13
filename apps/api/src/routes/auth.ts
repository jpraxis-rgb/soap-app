import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { validateBody } from '../middleware/validate.js';
import {
  registerUser,
  loginUser,
  googleAuth,
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

router.post('/register', validateBody(registerSchema), async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;
    const result = await registerUser(email, password, name);
    res.status(201).json({ data: result });
  } catch (error) {
    console.error('Error registering user:', error);
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
    console.error('Error logging in:', error);
    const message = error instanceof Error ? error.message : 'Login failed';
    res.status(401).json({ error: message });
  }
});

router.post('/google', async (req: Request, res: Response) => {
  try {
    const { token } = req.body;

    if (!token) {
      res.status(400).json({ error: 'Google token is required' });
      return;
    }

    const result = await googleAuth(token);
    res.json({ data: result });
  } catch (error) {
    console.error('Error with Google auth:', error);
    const message = error instanceof Error ? error.message : 'Google auth failed';
    res.status(500).json({ error: message });
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
    console.error('Error with Apple auth:', error);
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
    console.error('Error refreshing token:', error);
    const message = error instanceof Error ? error.message : 'Token refresh failed';
    res.status(401).json({ error: message });
  }
});

router.get('/me', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = await getMe(req.user!.id);
    res.json({ data: user });
  } catch (error) {
    console.error('Error getting user:', error);
    const message = error instanceof Error ? error.message : 'Failed to get user';
    res.status(500).json({ error: message });
  }
});

export default router;
