import { describe, it, expect } from 'vitest';
import {
  reviewCard,
  newCard,
  calculateNewEase,
  clampEase,
  clampInterval,
  DEFAULT_EASE,
  type SrsCard,
  type SrsRating,
} from '../modules/srs/sm2.js';

// ── Helper ──────────────────────────────────────────────

function makeReviewCard(overrides: Partial<SrsCard> = {}): SrsCard {
  return {
    intervalDays: 10,
    easeFactor: DEFAULT_EASE,
    repetitions: 5,
    phase: 'review',
    ...overrides,
  };
}

const fixedNow = new Date('2026-03-10T12:00:00Z');

// ── SM-2 Rating Tests ───────────────────────────────────

describe('SM-2 Algorithm — Ratings', () => {
  it('again rating resets to learning phase with interval 0', () => {
    const card = makeReviewCard();
    const result = reviewCard(card, 'again', fixedNow);

    expect(result.phase).toBe('learning');
    expect(result.intervalDays).toBe(0);
    expect(result.repetitions).toBe(0);
    expect(result.nextReviewDate).toEqual(fixedNow);
  });

  it('hard rating reduces interval compared to good', () => {
    const card = makeReviewCard();
    const hardResult = reviewCard(card, 'hard', fixedNow);
    const goodResult = reviewCard(card, 'good', fixedNow);

    expect(hardResult.intervalDays).toBeLessThan(goodResult.intervalDays);
  });

  it('good rating increases interval using ease factor', () => {
    const card = makeReviewCard({ intervalDays: 10 });
    const result = reviewCard(card, 'good', fixedNow);

    // Should multiply previous interval by ~ease factor
    expect(result.intervalDays).toBeGreaterThan(card.intervalDays);
    expect(result.phase).toBe('review');
    expect(result.repetitions).toBe(card.repetitions + 1);
  });

  it('easy rating gives larger interval than good', () => {
    const card = makeReviewCard();
    const easyResult = reviewCard(card, 'easy', fixedNow);
    const goodResult = reviewCard(card, 'good', fixedNow);

    expect(easyResult.intervalDays).toBeGreaterThan(goodResult.intervalDays);
  });

  it('again after multiple successes resets repetitions to 0', () => {
    const card = makeReviewCard({ repetitions: 20, intervalDays: 90 });
    const result = reviewCard(card, 'again', fixedNow);

    expect(result.repetitions).toBe(0);
    expect(result.phase).toBe('learning');
  });
});

// ── Ease Factor Tests ───────────────────────────────────

describe('SM-2 Algorithm — Ease Factor', () => {
  it('ease factor is clamped to minimum 1.3', () => {
    // Repeatedly failing should not drop below 1.3
    let ease = DEFAULT_EASE;
    for (let i = 0; i < 50; i++) {
      ease = calculateNewEase(ease, 'again');
    }
    expect(ease).toBeGreaterThanOrEqual(1.3);
  });

  it('ease factor is clamped to maximum 3.5', () => {
    let ease = DEFAULT_EASE;
    for (let i = 0; i < 100; i++) {
      ease = calculateNewEase(ease, 'easy');
    }
    expect(ease).toBeLessThanOrEqual(3.5);
  });

  it('clampEase enforces bounds', () => {
    expect(clampEase(0.5)).toBe(1.3);
    expect(clampEase(1.3)).toBe(1.3);
    expect(clampEase(2.5)).toBe(2.5);
    expect(clampEase(3.5)).toBe(3.5);
    expect(clampEase(10.0)).toBe(3.5);
  });

  it('again decreases ease factor', () => {
    const newEase = calculateNewEase(DEFAULT_EASE, 'again');
    expect(newEase).toBeLessThan(DEFAULT_EASE);
  });

  it('hard decreases ease factor', () => {
    const newEase = calculateNewEase(DEFAULT_EASE, 'hard');
    expect(newEase).toBeLessThan(DEFAULT_EASE);
  });

  it('good slightly adjusts ease factor', () => {
    const newEase = calculateNewEase(DEFAULT_EASE, 'good');
    // good should not change ease drastically
    expect(Math.abs(newEase - DEFAULT_EASE)).toBeLessThan(0.2);
  });

  it('easy increases ease factor', () => {
    const newEase = calculateNewEase(DEFAULT_EASE, 'easy');
    expect(newEase).toBeGreaterThan(DEFAULT_EASE);
  });
});

// ── Interval Cap Tests ──────────────────────────────────

describe('SM-2 Algorithm — Interval Cap', () => {
  it('interval is capped at 180 days', () => {
    // A card with a very high ease and long interval
    const card = makeReviewCard({ intervalDays: 170, easeFactor: 3.5 });
    const result = reviewCard(card, 'easy', fixedNow);

    expect(result.intervalDays).toBeLessThanOrEqual(180);
  });

  it('clampInterval enforces 0 to 180 range', () => {
    expect(clampInterval(-5)).toBe(0);
    expect(clampInterval(0)).toBe(0);
    expect(clampInterval(90)).toBe(90);
    expect(clampInterval(180)).toBe(180);
    expect(clampInterval(500)).toBe(180);
  });

  it('repeated easy reviews do not exceed 180 days', () => {
    let card: SrsCard = newCard();
    // Graduate from learning
    let result = reviewCard(card, 'good', fixedNow);
    result = reviewCard({ ...result, phase: result.phase }, 'good', fixedNow);
    result = reviewCard({ ...result, phase: result.phase }, 'good', fixedNow);

    // Now keep reviewing as easy
    for (let i = 0; i < 30; i++) {
      result = reviewCard(
        {
          intervalDays: result.intervalDays,
          easeFactor: result.easeFactor,
          repetitions: result.repetitions,
          phase: result.phase,
        },
        'easy',
        fixedNow,
      );
      expect(result.intervalDays).toBeLessThanOrEqual(180);
    }
  });
});

// ── Learning → Review Graduation ────────────────────────

describe('SM-2 Algorithm — Graduation', () => {
  it('new card starts in learning phase', () => {
    const card = newCard();
    expect(card.phase).toBe('learning');
    expect(card.repetitions).toBe(0);
    expect(card.easeFactor).toBe(DEFAULT_EASE);
  });

  it('progresses through learning steps before graduating', () => {
    let card: SrsCard = newCard();

    // Step 0 → 1 (interval should be the first learning step)
    const step1 = reviewCard(card, 'good', fixedNow);
    expect(step1.phase).toBe('learning');
    expect(step1.repetitions).toBe(1);

    // Step 1 → 2
    const step2 = reviewCard(
      { intervalDays: step1.intervalDays, easeFactor: step1.easeFactor, repetitions: step1.repetitions, phase: step1.phase },
      'good',
      fixedNow,
    );
    expect(step2.phase).toBe('learning');
    expect(step2.repetitions).toBe(2);

    // Step 2 → graduate to review
    const graduated = reviewCard(
      { intervalDays: step2.intervalDays, easeFactor: step2.easeFactor, repetitions: step2.repetitions, phase: step2.phase },
      'good',
      fixedNow,
    );
    expect(graduated.phase).toBe('review');
    expect(graduated.repetitions).toBe(3);
    expect(graduated.intervalDays).toBeGreaterThan(0);
  });

  it('easy rating during learning graduates with longer interval', () => {
    let card: SrsCard = newCard();

    // Go through learning steps
    let result = reviewCard(card, 'good', fixedNow);
    result = reviewCard(
      { intervalDays: result.intervalDays, easeFactor: result.easeFactor, repetitions: result.repetitions, phase: result.phase },
      'good',
      fixedNow,
    );

    // Graduate with easy
    const graduatedEasy = reviewCard(
      { intervalDays: result.intervalDays, easeFactor: result.easeFactor, repetitions: result.repetitions, phase: result.phase },
      'easy',
      fixedNow,
    );

    // Graduate with good (for comparison)
    const graduatedGood = reviewCard(
      { intervalDays: result.intervalDays, easeFactor: result.easeFactor, repetitions: result.repetitions, phase: result.phase },
      'good',
      fixedNow,
    );

    expect(graduatedEasy.intervalDays).toBeGreaterThan(graduatedGood.intervalDays);
  });

  it('again during learning resets to step 0', () => {
    let card: SrsCard = newCard();
    // Advance one step
    const step1 = reviewCard(card, 'good', fixedNow);
    expect(step1.repetitions).toBe(1);

    // Fail — should reset
    const reset = reviewCard(
      { intervalDays: step1.intervalDays, easeFactor: step1.easeFactor, repetitions: step1.repetitions, phase: step1.phase },
      'again',
      fixedNow,
    );
    expect(reset.phase).toBe('learning');
    expect(reset.repetitions).toBe(0);
    expect(reset.intervalDays).toBe(0);
  });
});

// ── Next Review Date ────────────────────────────────────

describe('SM-2 Algorithm — Next Review Date', () => {
  it('nextReviewDate advances by interval days', () => {
    const card = makeReviewCard({ intervalDays: 10 });
    const result = reviewCard(card, 'good', fixedNow);

    const expectedDate = new Date(fixedNow);
    expectedDate.setDate(expectedDate.getDate() + result.intervalDays);

    expect(result.nextReviewDate.toISOString()).toBe(expectedDate.toISOString());
  });

  it('again rating sets nextReviewDate to now (same day)', () => {
    const card = makeReviewCard();
    const result = reviewCard(card, 'again', fixedNow);

    expect(result.nextReviewDate).toEqual(fixedNow);
  });
});
