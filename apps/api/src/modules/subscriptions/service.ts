import { eq, and, desc } from 'drizzle-orm';
import { db } from '../../db/index.js';
import * as schema from '../../db/schema.js';
import { SubscriptionTier } from '@soap/shared';

export async function createSubscription(userId: string, tier: SubscriptionTier) {
  // Update user's subscription tier
  await db.update(schema.users)
    .set({ subscriptionTier: tier, updatedAt: new Date() })
    .where(eq(schema.users.id, userId));

  // Create subscription record
  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + 1);

  const [subscription] = await db.insert(schema.subscriptions).values({
    userId,
    tier,
    status: 'active',
    startedAt: new Date(),
    expiresAt,
  }).returning();

  return subscription;
}

export async function cancelSubscription(userId: string) {
  // Find active subscription
  const [subscription] = await db.select()
    .from(schema.subscriptions)
    .where(and(
      eq(schema.subscriptions.userId, userId),
      eq(schema.subscriptions.status, 'active'),
    ))
    .orderBy(desc(schema.subscriptions.startedAt))
    .limit(1);

  if (!subscription) {
    throw new Error('No active subscription found');
  }

  // Mark as cancelled but let it run until expires_at
  const [updated] = await db.update(schema.subscriptions)
    .set({
      status: 'cancelled',
      cancelledAt: new Date(),
    })
    .where(eq(schema.subscriptions.id, subscription.id))
    .returning();

  // If no expiry date, downgrade immediately
  if (!subscription.expiresAt || subscription.expiresAt <= new Date()) {
    await db.update(schema.users)
      .set({ subscriptionTier: SubscriptionTier.FREE, updatedAt: new Date() })
      .where(eq(schema.users.id, userId));
  }

  return updated;
}

export async function getCurrentSubscription(userId: string) {
  const [user] = await db.select()
    .from(schema.users)
    .where(eq(schema.users.id, userId))
    .limit(1);

  if (!user) {
    throw new Error('User not found');
  }

  const [subscription] = await db.select()
    .from(schema.subscriptions)
    .where(and(
      eq(schema.subscriptions.userId, userId),
      eq(schema.subscriptions.status, 'active'),
    ))
    .orderBy(desc(schema.subscriptions.startedAt))
    .limit(1);

  return {
    tier: user.subscriptionTier,
    subscription: subscription || null,
  };
}

export async function handleWebhook(payload: Record<string, unknown>) {
  // Stub for future payment provider webhook handling
  // e.g., Stripe, RevenueCat, etc.
  console.log('Webhook received:', payload);
  return { received: true };
}
