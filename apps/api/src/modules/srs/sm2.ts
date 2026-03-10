/**
 * SM-2 Spaced Repetition Algorithm for SOAP flashcard reviews.
 *
 * Based on the SuperMemo SM-2 algorithm with these adaptations:
 * - Ease factor clamped to [1.3, 3.5]
 * - Maximum interval capped at 180 days
 * - Learning phase with fixed intervals before graduating to review phase
 *
 * Rating scale:
 *   again (0) - Complete blackout, reset to learning
 *   hard  (1) - Serious difficulty, penalize ease
 *   good  (2) - Correct with effort
 *   easy  (3) - Perfect recall, bonus ease
 */

export type SrsRating = 'again' | 'hard' | 'good' | 'easy';

export interface SrsCard {
  /** Current interval in days */
  intervalDays: number;
  /** Ease factor (multiplier for next interval) */
  easeFactor: number;
  /** Number of consecutive correct reviews (0 = learning phase) */
  repetitions: number;
  /** Whether the card has graduated from learning to review phase */
  phase: 'learning' | 'review';
}

export interface SrsReviewResult {
  intervalDays: number;
  easeFactor: number;
  repetitions: number;
  phase: 'learning' | 'review';
  nextReviewDate: Date;
}

/** Minimum ease factor */
const MIN_EASE = 1.3;

/** Maximum ease factor */
const MAX_EASE = 3.5;

/** Maximum interval in days */
const MAX_INTERVAL_DAYS = 180;

/** Fixed intervals for learning phase steps (in days) */
const LEARNING_STEPS = [0, 1, 3];

/** Default ease factor for new cards */
export const DEFAULT_EASE = 2.5;

/**
 * Map string rating to a numeric quality value (0-3).
 */
function ratingToQuality(rating: SrsRating): number {
  switch (rating) {
    case 'again': return 0;
    case 'hard': return 1;
    case 'good': return 2;
    case 'easy': return 3;
  }
}

/**
 * Clamp ease factor within bounds.
 */
export function clampEase(ease: number): number {
  return Math.max(MIN_EASE, Math.min(MAX_EASE, ease));
}

/**
 * Clamp interval within bounds.
 */
export function clampInterval(days: number): number {
  return Math.max(0, Math.min(MAX_INTERVAL_DAYS, Math.round(days)));
}

/**
 * Calculate the new ease factor after a review.
 *
 * SM-2 formula:
 *   EF' = EF + (0.1 - (3 - q) * (0.08 + (3 - q) * 0.02))
 *
 * Where q is quality 0-3 (mapped from our 4-point scale).
 */
export function calculateNewEase(currentEase: number, rating: SrsRating): number {
  const q = ratingToQuality(rating);
  const delta = 0.1 - (3 - q) * (0.08 + (3 - q) * 0.02);
  return clampEase(currentEase + delta);
}

/**
 * Process a review and return the updated card state.
 */
export function reviewCard(card: SrsCard, rating: SrsRating, now?: Date): SrsReviewResult {
  const reviewDate = now || new Date();

  // "again" always resets to learning phase
  if (rating === 'again') {
    const newEase = calculateNewEase(card.easeFactor, rating);
    return {
      intervalDays: 0,
      easeFactor: newEase,
      repetitions: 0,
      phase: 'learning',
      nextReviewDate: reviewDate, // Review again immediately (same day)
    };
  }

  // Learning phase: step through fixed intervals
  if (card.phase === 'learning') {
    const step = Math.min(card.repetitions, LEARNING_STEPS.length - 1);
    const nextStep = step + 1;

    // Graduate to review phase after completing all learning steps
    if (nextStep >= LEARNING_STEPS.length) {
      const newEase = calculateNewEase(card.easeFactor, rating);
      const graduationInterval = rating === 'easy' ? 4 : 1;
      return {
        intervalDays: graduationInterval,
        easeFactor: newEase,
        repetitions: card.repetitions + 1,
        phase: 'review',
        nextReviewDate: addDays(reviewDate, graduationInterval),
      };
    }

    // Still in learning phase
    const intervalDays = LEARNING_STEPS[nextStep];
    return {
      intervalDays,
      easeFactor: card.easeFactor, // Don't change ease during learning
      repetitions: card.repetitions + 1,
      phase: 'learning',
      nextReviewDate: addDays(reviewDate, intervalDays),
    };
  }

  // Review phase: apply SM-2 interval calculation
  const newEase = calculateNewEase(card.easeFactor, rating);

  let newInterval: number;
  if (card.repetitions === 0 || card.intervalDays === 0) {
    newInterval = 1;
  } else if (card.intervalDays === 1) {
    newInterval = 6;
  } else {
    newInterval = Math.round(card.intervalDays * newEase);
  }

  // Apply bonuses/penalties
  if (rating === 'hard') {
    newInterval = Math.round(newInterval * 0.8);
  } else if (rating === 'easy') {
    newInterval = Math.round(newInterval * 1.3);
  }

  newInterval = clampInterval(newInterval);

  return {
    intervalDays: newInterval,
    easeFactor: newEase,
    repetitions: card.repetitions + 1,
    phase: 'review',
    nextReviewDate: addDays(reviewDate, newInterval),
  };
}

/**
 * Create a new card with default values.
 */
export function newCard(): SrsCard {
  return {
    intervalDays: 0,
    easeFactor: DEFAULT_EASE,
    repetitions: 0,
    phase: 'learning',
  };
}

/**
 * Add days to a date.
 */
function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}
