import { eq } from 'drizzle-orm';
import { db } from '../../db/index.js';
import * as schema from '../../db/schema.js';
import { generateQuiz } from '../../services/gemini.js';

interface QuizQuestion {
  id: string;
  question: string;
  alternatives: Array<{ label: string; text: string }>;
  correctAnswer: string;
  explanation: string;
}

interface QuizBody {
  questions: QuizQuestion[];
}

export async function generateQuizForTopic(topic: string, disciplinaId: string) {
  const generated = await generateQuiz(topic, '');

  const [item] = await db
    .insert(schema.contentItems)
    .values({
      disciplinaId,
      topic,
      format: 'quiz',
      title: generated.title,
      body: generated.body as unknown as Record<string, unknown>,
      status: 'published',
    })
    .returning();

  return item;
}

export async function submitQuiz(
  userId: string,
  contentItemId: string,
  answers: Record<string, string>
) {
  // Get the quiz content
  const [quizItem] = await db
    .select()
    .from(schema.contentItems)
    .where(eq(schema.contentItems.id, contentItemId));

  if (!quizItem) {
    throw new Error('Quiz not found');
  }

  const body = quizItem.body as unknown as QuizBody;
  const questions = body.questions;

  let score = 0;
  const totalQuestions = questions.length;
  const detailed: Record<string, unknown> = {};

  for (const q of questions) {
    const userAnswer = answers[q.id];
    const correct = userAnswer === q.correctAnswer;
    if (correct) score++;

    detailed[q.id] = {
      userAnswer,
      correctAnswer: q.correctAnswer,
      correct,
      explanation: q.explanation,
    };
  }

  const [attempt] = await db
    .insert(schema.quizAttempts)
    .values({
      userId,
      contentItemId,
      answers: detailed,
      score,
      totalQuestions,
    })
    .returning();

  return attempt;
}

export async function getQuizResults(attemptId: string) {
  const [attempt] = await db
    .select()
    .from(schema.quizAttempts)
    .where(eq(schema.quizAttempts.id, attemptId));

  if (!attempt) {
    return null;
  }

  // Get the quiz content for full question data
  const [quizItem] = await db
    .select()
    .from(schema.contentItems)
    .where(eq(schema.contentItems.id, attempt.contentItemId!));

  return {
    attempt,
    questions: quizItem ? (quizItem.body as unknown as QuizBody).questions : [],
  };
}
