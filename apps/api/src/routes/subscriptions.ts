import { Router, Request, Response } from 'express';
import {
  cancelSubscription,
  getCurrentSubscription,
} from '../modules/subscriptions/index.js';

const router = Router();

// Client-driven subscription creation is DISABLED for beta. There is no payment
// integration yet, so the previous endpoint let any user grant themselves a paid
// tier for free. Everyone stays on the free tier until real billing + verified
// provider webhooks are wired up (webhook endpoint lives in app.ts). Re-enable a
// payment-gated flow here — never trust a client-supplied tier.
router.post('/create', async (_req: Request, res: Response) => {
  res.status(501).json({ error: 'Subscriptions are not available during the beta.' });
});

router.post('/cancel', async (req: Request, res: Response) => {
  try {
    const subscription = await cancelSubscription(req.user!.id);
    res.json({ data: subscription });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to cancel subscription';
    const status = message === 'No active subscription found' ? 404 : 500;
    res.status(status).json({ error: message });
  }
});

router.get('/current', async (req: Request, res: Response) => {
  try {
    const result = await getCurrentSubscription(req.user!.id);
    res.json({ data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get subscription';
    res.status(500).json({ error: message });
  }
});

// Note: webhook endpoint is now public, registered in app.ts before authMiddleware

export default router;
