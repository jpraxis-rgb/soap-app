import { Router, Request, Response } from 'express';

const router = Router();

router.post('/generate', (_req: Request, res: Response) => {
  res.status(501).json({ error: 'Not implemented' });
});

router.get('/:id', (_req: Request, res: Response) => {
  res.status(501).json({ error: 'Not implemented' });
});

router.put('/:id/recalculate', (_req: Request, res: Response) => {
  res.status(501).json({ error: 'Not implemented' });
});

export default router;
