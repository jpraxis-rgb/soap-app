import { Router, Request, Response } from 'express';
import { SubscriptionTier } from '@soap/shared';
import {
  createSubscription,
  cancelSubscription,
  getCurrentSubscription,
  handleWebhook,
} from '../modules/subscriptions/index.js';

const router = Router();

router.post('/create', async (req: Request, res: Response) => {
  try {
    const { tier } = req.body;

    if (!tier || !Object.values(SubscriptionTier).includes(tier)) {
      res.status(400).json({ error: 'Valid subscription tier is required' });
      return;
    }

    const subscription = await createSubscription(req.user!.id, tier as SubscriptionTier);
    res.status(201).json(subscription);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create subscription';
    res.status(500).json({ error: message });
  }
});

router.post('/cancel', async (req: Request, res: Response) => {
  try {
    const subscription = await cancelSubscription(req.user!.id);
    res.json(subscription);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to cancel subscription';
    const status = message === 'No active subscription found' ? 404 : 500;
    res.status(status).json({ error: message });
  }
});

router.get('/current', async (req: Request, res: Response) => {
  try {
    const result = await getCurrentSubscription(req.user!.id);
    res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get subscription';
    res.status(500).json({ error: message });
  }
});

router.post('/webhook', async (req: Request, res: Response) => {
  try {
    const result = await handleWebhook(req.body);
    res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Webhook processing failed';
    res.status(500).json({ error: message });
  }
});

export default router;
