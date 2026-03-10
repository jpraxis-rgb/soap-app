import { Router, Request, Response } from 'express';

const router = Router();

router.get('/topic/:topicId', (_req: Request, res: Response) => {
  res.status(501).json({ error: 'Not implemented' });
});

router.post('/generate', (_req: Request, res: Response) => {
  res.status(501).json({ error: 'Not implemented' });
});

router.get('/curation-queue', (_req: Request, res: Response) => {
  res.status(501).json({ error: 'Not implemented' });
});

router.put('/:id/approve', (_req: Request, res: Response) => {
  res.status(501).json({ error: 'Not implemented' });
});

router.put('/:id/reject', (_req: Request, res: Response) => {
  res.status(501).json({ error: 'Not implemented' });
});

export default router;
