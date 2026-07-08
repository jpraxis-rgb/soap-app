import { eq, and, sql } from 'drizzle-orm';
import { db } from '../../db/index.js';
import * as schema from '../../db/schema.js';

/**
 * SM-2 Spaced Repetition Algorithm
 *
 * EaseFactor starts at 2.5, minimum 1.3, maximum 3.5
 * Again: interval=1, ef -= 0.2
 * Hard: interval * 1.2, ef -= 0.15
 * Good: interval * ef
 * Easy: interval * ef * 1.3, ef += 0.15
 *
 * Intervals are capped at MAX_INTERVAL_DAYS (180 days).
 */

const MAX_EASE_FACTOR = 3.5;
const MIN_EASE_FACTOR = 1.3;
const MAX_INTERVAL_DAYS = 180;

interface SM2Result {
  intervalDays: number;
  easeFactor: number;
  nextReviewAt: Date;
}

export function calculateSM2(
  rating: string,
  currentInterval: number,
  currentEaseFactor: number
): SM2Result {
  let interval: number;
  let ef = currentEaseFactor;

  switch (rating) {
    case 'again':
      interval = 1;
      ef = Math.max(MIN_EASE_FACTOR, ef - 0.2);
      break;
    case 'hard':
      interval = Math.max(1, Math.round(currentInterval * 1.2));
      ef = Math.max(MIN_EASE_FACTOR, ef - 0.15);
      break;
    case 'good':
      interval = currentInterval === 0
        ? 1
        : Math.round(currentInterval * ef);
      break;
    case 'easy':
      interval = currentInterval === 0
        ? 4
        : Math.round(currentInterval * ef * 1.3);
      ef = Math.min(MAX_EASE_FACTOR, ef + 0.15);
      break;
    default:
      interval = 1;
      break;
  }

  // Cap interval at maximum
  interval = Math.min(interval, MAX_INTERVAL_DAYS);

  // Ensure ease factor stays within bounds
  ef = Math.min(MAX_EASE_FACTOR, Math.max(MIN_EASE_FACTOR, ef));

  const nextReviewAt = new Date();
  nextReviewAt.setDate(nextReviewAt.getDate() + interval);

  return { intervalDays: interval, easeFactor: ef, nextReviewAt };
}

export async function recordReview(
  userId: string,
  contentItemId: string,
  rating: string
) {
  // Find previous review for this card by this user
  const previousReviews = await db
    .select()
    .from(schema.flashcardReviews)
    .where(
      and(
        eq(schema.flashcardReviews.userId, userId),
        eq(schema.flashcardReviews.contentItemId, contentItemId)
      )
    );

  // Use the most recent review's values, or defaults
  const lastReview = previousReviews.length > 0
    ? previousReviews.sort((a, b) =>
        new Date(b.reviewedAt).getTime() - new Date(a.reviewedAt).getTime()
      )[0]
    : null;

  const currentInterval = lastReview ? lastReview.intervalDays : 0;
  const currentEF = lastReview ? lastReview.easeFactor : 2.5;

  const sm2Result = calculateSM2(rating, currentInterval, currentEF);

  const [review] = await db
    .insert(schema.flashcardReviews)
    .values({
      userId,
      contentItemId,
      rating,
      intervalDays: sm2Result.intervalDays,
      easeFactor: sm2Result.easeFactor,
      nextReviewAt: sm2Result.nextReviewAt,
    })
    .returning();

  return review;
}

export async function getDueFlashcards(userId: string) {
  const now = new Date();

  // Get all flashcard content items that are published
  const flashcardItems = await db
    .select()
    .from(schema.contentItems)
    .where(
      and(
        eq(schema.contentItems.format, 'flashcard'),
        eq(schema.contentItems.status, 'published')
      )
    );

  // Consider only the LATEST review per content item. recordReview inserts a
  // new row on every review, so matching ANY past row with nextReviewAt <= now
  // would resurface cards that have already been advanced into the future.
  const latestReviews = await db
    .select({
      contentItemId: sql<string>`DISTINCT ON (${schema.flashcardReviews.contentItemId}) ${schema.flashcardReviews.contentItemId}`,
      nextReviewAt: schema.flashcardReviews.nextReviewAt,
    })
    .from(schema.flashcardReviews)
    .where(eq(schema.flashcardReviews.userId, userId))
    .orderBy(
      schema.flashcardReviews.contentItemId,
      sql`${schema.flashcardReviews.reviewedAt} DESC`,
    );

  // Cards whose latest review is due (nextReviewAt <= now).
  const dueReviewedIds = new Set(
    latestReviews
      .filter((r) => r.nextReviewAt != null && new Date(r.nextReviewAt) <= now)
      .map((r) => r.contentItemId),
  );

  // Every card this user has ever reviewed (by latest row).
  const allReviewedIds = new Set(latestReviews.map((r) => r.contentItemId));

  // Combine: latest review due + never reviewed.
  const dueItems = flashcardItems.filter(
    item => dueReviewedIds.has(item.id) || !allReviewedIds.has(item.id)
  );

  return dueItems;
}
