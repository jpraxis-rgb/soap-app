import { eq, and } from 'drizzle-orm';
import { db } from '../../db/index.js';
import * as schema from '../../db/schema.js';
import { generateAllFormats } from '../../services/gemini.js';

export async function generateContentBatch(
  topic: string,
  disciplinaId: string,
  disciplinaName: string
) {
  const generated = await generateAllFormats(topic, disciplinaName);

  const items = [
    {
      disciplinaId,
      topic,
      format: 'summary' as const,
      title: generated.summary.title,
      body: generated.summary.body as unknown as Record<string, unknown>,
      status: 'review' as const,
    },
    {
      disciplinaId,
      topic,
      format: 'flashcard' as const,
      title: generated.flashcards.title,
      body: generated.flashcards.body as unknown as Record<string, unknown>,
      status: 'review' as const,
    },
    {
      disciplinaId,
      topic,
      format: 'quiz' as const,
      title: generated.quiz.title,
      body: generated.quiz.body as unknown as Record<string, unknown>,
      status: 'review' as const,
    },
    {
      disciplinaId,
      topic,
      format: 'mind_map' as const,
      title: generated.mindMap.title,
      body: generated.mindMap.body as unknown as Record<string, unknown>,
      status: 'review' as const,
    },
  ];

  const inserted = await db.insert(schema.contentItems).values(items).returning();
  return inserted;
}

export async function getContentByTopic(topicId: string, format?: string) {
  const conditions = [
    eq(schema.contentItems.topic, topicId),
    eq(schema.contentItems.status, 'published'),
  ];

  if (format) {
    conditions.push(eq(schema.contentItems.format, format));
  }

  const items = await db
    .select()
    .from(schema.contentItems)
    .where(and(...conditions));

  return items;
}

export async function getCurationQueue() {
  const items = await db
    .select()
    .from(schema.contentItems)
    .where(eq(schema.contentItems.status, 'review'));

  return items;
}

export async function approveContent(id: string, professorId: string, professorName: string) {
  const [updated] = await db
    .update(schema.contentItems)
    .set({
      status: 'published',
      professorId,
      professorName,
    })
    .where(eq(schema.contentItems.id, id))
    .returning();

  return updated;
}

export async function rejectContent(id: string, professorId: string, professorName: string) {
  const [updated] = await db
    .update(schema.contentItems)
    .set({
      status: 'rejected',
      professorId,
      professorName,
    })
    .where(eq(schema.contentItems.id, id))
    .returning();

  return updated;
}
