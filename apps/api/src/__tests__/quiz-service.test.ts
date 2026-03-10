import { describe, it, expect } from 'vitest';
import {
  calculateQuizScore,
  getPerformanceLevel,
  type QuizAnswer,
} from '../modules/quiz/scoring.js';

// ── Score Calculation ───────────────────────────────────

describe('calculateQuizScore', () => {
  it('returns zero score for empty answers', () => {
    const result = calculateQuizScore([]);
    expect(result.correct).toBe(0);
    expect(result.total).toBe(0);
    expect(result.percentage).toBe(0);
    expect(result.details).toEqual([]);
  });

  it('calculates correct score for all correct answers', () => {
    const answers: QuizAnswer[] = [
      { questionId: 'q1', selectedOption: 'a', correctOption: 'a' },
      { questionId: 'q2', selectedOption: 'b', correctOption: 'b' },
      { questionId: 'q3', selectedOption: 'c', correctOption: 'c' },
    ];
    const result = calculateQuizScore(answers);

    expect(result.correct).toBe(3);
    expect(result.total).toBe(3);
    expect(result.percentage).toBe(100);
    expect(result.details.every((d) => d.isCorrect)).toBe(true);
  });

  it('calculates correct score for all wrong answers', () => {
    const answers: QuizAnswer[] = [
      { questionId: 'q1', selectedOption: 'a', correctOption: 'b' },
      { questionId: 'q2', selectedOption: 'b', correctOption: 'c' },
      { questionId: 'q3', selectedOption: 'c', correctOption: 'a' },
    ];
    const result = calculateQuizScore(answers);

    expect(result.correct).toBe(0);
    expect(result.total).toBe(3);
    expect(result.percentage).toBe(0);
    expect(result.details.every((d) => !d.isCorrect)).toBe(true);
  });

  it('calculates mixed score correctly', () => {
    const answers: QuizAnswer[] = [
      { questionId: 'q1', selectedOption: 'a', correctOption: 'a' },
      { questionId: 'q2', selectedOption: 'b', correctOption: 'c' },
      { questionId: 'q3', selectedOption: 'c', correctOption: 'c' },
      { questionId: 'q4', selectedOption: 'd', correctOption: 'a' },
    ];
    const result = calculateQuizScore(answers);

    expect(result.correct).toBe(2);
    expect(result.total).toBe(4);
    expect(result.percentage).toBe(50);
  });

  it('rounds percentage to nearest integer', () => {
    const answers: QuizAnswer[] = [
      { questionId: 'q1', selectedOption: 'a', correctOption: 'a' },
      { questionId: 'q2', selectedOption: 'b', correctOption: 'c' },
      { questionId: 'q3', selectedOption: 'c', correctOption: 'c' },
    ];
    const result = calculateQuizScore(answers);

    // 2/3 = 66.666...% → 67%
    expect(result.percentage).toBe(67);
  });

  it('returns correct details per question', () => {
    const answers: QuizAnswer[] = [
      { questionId: 'q1', selectedOption: 'a', correctOption: 'a' },
      { questionId: 'q2', selectedOption: 'b', correctOption: 'c' },
    ];
    const result = calculateQuizScore(answers);

    expect(result.details).toEqual([
      { questionId: 'q1', isCorrect: true },
      { questionId: 'q2', isCorrect: false },
    ]);
  });

  it('handles single question quiz', () => {
    const answers: QuizAnswer[] = [
      { questionId: 'q1', selectedOption: 'a', correctOption: 'a' },
    ];
    const result = calculateQuizScore(answers);

    expect(result.correct).toBe(1);
    expect(result.total).toBe(1);
    expect(result.percentage).toBe(100);
  });

  it('handles large number of questions', () => {
    const answers: QuizAnswer[] = Array.from({ length: 100 }, (_, i) => ({
      questionId: `q${i}`,
      selectedOption: i < 73 ? 'a' : 'b',
      correctOption: 'a',
    }));
    const result = calculateQuizScore(answers);

    expect(result.correct).toBe(73);
    expect(result.total).toBe(100);
    expect(result.percentage).toBe(73);
  });
});

// ── Performance Level ───────────────────────────────────

describe('getPerformanceLevel', () => {
  it('returns excellent for >= 90%', () => {
    expect(getPerformanceLevel(90)).toBe('excellent');
    expect(getPerformanceLevel(95)).toBe('excellent');
    expect(getPerformanceLevel(100)).toBe('excellent');
  });

  it('returns good for >= 70% and < 90%', () => {
    expect(getPerformanceLevel(70)).toBe('good');
    expect(getPerformanceLevel(80)).toBe('good');
    expect(getPerformanceLevel(89)).toBe('good');
  });

  it('returns average for >= 50% and < 70%', () => {
    expect(getPerformanceLevel(50)).toBe('average');
    expect(getPerformanceLevel(60)).toBe('average');
    expect(getPerformanceLevel(69)).toBe('average');
  });

  it('returns needs_improvement for < 50%', () => {
    expect(getPerformanceLevel(0)).toBe('needs_improvement');
    expect(getPerformanceLevel(25)).toBe('needs_improvement');
    expect(getPerformanceLevel(49)).toBe('needs_improvement');
  });
});
