import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { validateBody } from '../middleware/validate.js';
import { SubscriptionTier } from '@soap/shared';
import {
  createSubscription,
  cancelSubscription,
  getCurrentSubscription,
} from '../modules/subscriptions/index.js';

const router = Router();

const createSubscriptionSchema = z.object({
  tier: z.enum(['free', 'premium', 'pro']),
});

router.post('/create', validateBody(createSubscriptionSchema), async (req: Request, res: Response) => {
  try {
    const { tier } = req.body;
    const subscription = await createSubscription(req.user!.id, tier as SubscriptionTier);
    res.status(201).json({ data: subscription });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create subscription';
    res.status(500).json({ error: message });
  }
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
