import { eq, and, asc } from 'drizzle-orm';
import { db } from '../../db/index.js';
import * as schema from '../../db/schema.js';
import { generateAllFormats } from '../../services/gemini.js';

export async function generateContentBatch(
  topic: string,
  disciplinaId: string | null,
  disciplinaName: string,
  options?: { autoPublish?: boolean; templateId?: string; source?: string }
) {
  const generated = await generateAllFormats(topic, disciplinaName);

  const status = options?.autoPublish ? 'published' as const : 'review' as const;
  const baseFields = {
    disciplinaId,
    topic,
    status,
    ...(options?.templateId ? { templateId: options.templateId } : {}),
    ...(disciplinaName ? { disciplinaName } : {}),
    ...(options?.source ? { source: options.source } : {}),
  };

  const items = [
    {
      ...baseFields,
      format: 'summary' as const,
      title: generated.summary.title,
      body: generated.summary.body as unknown as Record<string, unknown>,
    },
    {
      ...baseFields,
      format: 'flashcard' as const,
      title: generated.flashcards.title,
      body: generated.flashcards.body as unknown as Record<string, unknown>,
    },
    {
      ...baseFields,
      format: 'quiz' as const,
      title: generated.quiz.title,
      body: generated.quiz.body as unknown as Record<string, unknown>,
    },
    {
      ...baseFields,
      format: 'mind_map' as const,
      title: generated.mindMap.title,
      body: generated.mindMap.body as unknown as Record<string, unknown>,
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

export async function getContentForEdital(editalId: string) {
  // 1. Get the edital from DB
  const [edital] = await db.select().from(schema.editais).where(eq(schema.editais.id, editalId));
  if (!edital) return null;

  // 2. Get disciplinas from DB for this edital
  const editalDisciplinas = await db.select().from(schema.disciplinas)
    .where(eq(schema.disciplinas.editalId, editalId))
    .orderBy(asc(schema.disciplinas.orderIndex));

  // 3. For each disciplina, get all topics and check content availability
  const disciplines = await Promise.all(editalDisciplinas.map(async (disc) => {
    const rawTopics = disc.topics;
    const topics: string[] = Array.isArray(rawTopics)
      ? rawTopics as string[]
      : (rawTopics && typeof rawTopics === 'object' && 'items' in (rawTopics as Record<string, unknown>))
        ? ((rawTopics as Record<string, unknown>).items as string[])
        : [];

    // Get content items matching disciplina name + published
    const contentItems = await db.select().from(schema.contentItems)
      .where(and(
        eq(schema.contentItems.disciplinaName, disc.name),
        eq(schema.contentItems.status, 'published'),
      ));

    // Build topic content map
    const topicList = topics.map((topicName: string) => {
      const topicItems = contentItems.filter(ci => ci.topic === topicName);
      const formats: Record<string, string> = {};
      for (const item of topicItems) {
        formats[item.format] = item.id;
      }
      const hasAllFormats = ['summary', 'flashcard', 'quiz', 'mind_map'].every(f => formats[f]);
      return {
        name: topicName,
        status: hasAllFormats ? 'complete' as const : topicItems.length > 0 ? 'in_progress' as const : 'new' as const,
        formats,
      };
    });

    const completedCount = topicList.filter((t) => t.status === 'complete').length;

    return {
      name: disc.name,
      topicCount: topics.length,
      completedCount,
      topics: topicList,
    };
  }));

  return { disciplines };
}

export async function getContentForTopic(topic: string, disciplinaName: string, format?: string) {
  const conditions = [
    eq(schema.contentItems.topic, topic),
    eq(schema.contentItems.disciplinaName, disciplinaName),
    eq(schema.contentItems.status, 'published'),
  ];
  if (format) {
    conditions.push(eq(schema.contentItems.format, format));
  }
  return db.select().from(schema.contentItems).where(and(...conditions));
}
