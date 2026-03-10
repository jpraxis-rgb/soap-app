/**
 * Quiz scoring service for SOAP.
 *
 * Calculates scores for quiz attempts and provides performance metrics.
 */

export interface QuizAnswer {
  questionId: string;
  selectedOption: string;
  correctOption: string;
}

export interface QuizScoreResult {
  /** Number of correct answers */
  correct: number;
  /** Total number of questions */
  total: number;
  /** Score as a percentage (0-100) */
  percentage: number;
  /** Per-question results */
  details: Array<{
    questionId: string;
    isCorrect: boolean;
  }>;
}

/**
 * Calculate the score for a set of quiz answers.
 *
 * @param answers - Array of answers with selected and correct options
 * @returns Score result with correct count, total, and percentage
 */
export function calculateQuizScore(answers: QuizAnswer[]): QuizScoreResult {
  if (answers.length === 0) {
    return {
      correct: 0,
      total: 0,
      percentage: 0,
      details: [],
    };
  }

  const details = answers.map((answer) => ({
    questionId: answer.questionId,
    isCorrect: answer.selectedOption === answer.correctOption,
  }));

  const correct = details.filter((d) => d.isCorrect).length;
  const total = answers.length;
  const percentage = Math.round((correct / total) * 100);

  return {
    correct,
    total,
    percentage,
    details,
  };
}

/**
 * Determine performance level based on percentage score.
 */
export function getPerformanceLevel(percentage: number): 'excellent' | 'good' | 'average' | 'needs_improvement' {
  if (percentage >= 90) return 'excellent';
  if (percentage >= 70) return 'good';
  if (percentage >= 50) return 'average';
  return 'needs_improvement';
}
