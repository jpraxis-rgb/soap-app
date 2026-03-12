import { eq, and } from 'drizzle-orm';
import { db } from '../db/index.js';
import * as schema from '../db/schema.js';
import { generateAllFormats } from '../services/gemini.js';

interface TemplateDisciplina {
  name: string;
  weight: number | null;
  topics: string[];
  category: string;
  orderIndex: number;
}

interface TemplateCargo {
  name: string;
  disciplinas: TemplateDisciplina[];
}

function createSemaphore(limit: number) {
  let running = 0;
  const queue: Array<() => void> = [];

  return async function <T>(fn: () => Promise<T>): Promise<T> {
    if (running >= limit) {
      await new Promise<void>((resolve) => queue.push(resolve));
    }
    running++;
    try {
      return await fn();
    } finally {
      running--;
      if (queue.length > 0) {
        const next = queue.shift()!;
        next();
      }
    }
  };
}

export async function seedContent(): Promise<{ inserted: number; skipped: number }> {
  let inserted = 0;
  let skipped = 0;

  const templates = await db.select().from(schema.editalTemplates);
  const semaphore = createSemaphore(5);

  for (const template of templates) {
    const allDisciplinas: TemplateDisciplina[] = [];

    // Collect top-level disciplinas
    const topLevel = template.disciplinas as TemplateDisciplina[];
    if (Array.isArray(topLevel)) {
      allDisciplinas.push(...topLevel);
    }

    // Collect cargo-specific disciplinas
    const cargos = template.cargos as TemplateCargo[] | null;
    if (Array.isArray(cargos)) {
      for (const cargo of cargos) {
        if (Array.isArray(cargo.disciplinas)) {
          allDisciplinas.push(...cargo.disciplinas);
        }
      }
    }

    const promises: Promise<void>[] = [];

    for (const disc of allDisciplinas) {
      if (!Array.isArray(disc.topics)) continue;

      for (const topic of disc.topics) {
        promises.push(
          semaphore(async () => {
            // Idempotent check: see if 4 content items already exist
            const existing = await db
              .select({ id: schema.contentItems.id })
              .from(schema.contentItems)
              .where(
                and(
                  eq(schema.contentItems.templateId, template.id),
                  eq(schema.contentItems.topic, topic),
                  eq(schema.contentItems.disciplinaName, disc.name),
                ),
              );

            if (existing.length >= 4) {
              // Always update summary with latest discipline-specific content
              const [summary] = await db
                .select({ id: schema.contentItems.id })
                .from(schema.contentItems)
                .where(
                  and(
                    eq(schema.contentItems.templateId, template.id),
                    eq(schema.contentItems.topic, topic),
                    eq(schema.contentItems.disciplinaName, disc.name),
                    eq(schema.contentItems.format, 'summary'),
                  ),
                )
                .limit(1);

              if (summary) {
                const generated = await generateAllFormats(topic, disc.name);
                await db.update(schema.contentItems)
                  .set({ body: generated.summary.body as unknown as Record<string, unknown> })
                  .where(eq(schema.contentItems.id, summary.id));
                inserted++;
              }

              skipped++;
              return;
            }

            console.log(`Seeding content for ${template.name}: ${disc.name} > ${topic}`);

            const generated = await generateAllFormats(topic, disc.name);

            const items = [
              {
                disciplinaId: null as string | null,
                topic,
                format: 'summary' as const,
                title: generated.summary.title,
                body: generated.summary.body as unknown as Record<string, unknown>,
                status: 'published' as const,
                source: 'seed' as const,
                templateId: template.id,
                disciplinaName: disc.name,
              },
              {
                disciplinaId: null as string | null,
                topic,
                format: 'flashcard' as const,
                title: generated.flashcards.title,
                body: generated.flashcards.body as unknown as Record<string, unknown>,
                status: 'published' as const,
                source: 'seed' as const,
                templateId: template.id,
                disciplinaName: disc.name,
              },
              {
                disciplinaId: null as string | null,
                topic,
                format: 'quiz' as const,
                title: generated.quiz.title,
                body: generated.quiz.body as unknown as Record<string, unknown>,
                status: 'published' as const,
                source: 'seed' as const,
                templateId: template.id,
                disciplinaName: disc.name,
              },
              {
                disciplinaId: null as string | null,
                topic,
                format: 'mind_map' as const,
                title: generated.mindMap.title,
                body: generated.mindMap.body as unknown as Record<string, unknown>,
                status: 'published' as const,
                source: 'seed' as const,
                templateId: template.id,
                disciplinaName: disc.name,
              },
            ];

            await db.insert(schema.contentItems).values(items);
            inserted += 4;
          }),
        );
      }
    }

    await Promise.all(promises);
  }

  return { inserted, skipped };
}
