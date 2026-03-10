import { Router, Request, Response } from 'express';

const router = Router();

router.post('/register', (_req: Request, res: Response) => {
  res.status(501).json({ error: 'Not implemented' });
});

router.post('/login', (_req: Request, res: Response) => {
  res.status(501).json({ error: 'Not implemented' });
});

router.post('/refresh', (_req: Request, res: Response) => {
  res.status(501).json({ error: 'Not implemented' });
});

router.get('/me', (_req: Request, res: Response) => {
  res.status(501).json({ error: 'Not implemented' });
});

export default router;
