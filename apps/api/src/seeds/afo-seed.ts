import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { and, eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import * as schema from '../db/schema.js';
import { parseResumo, parseFlashcards, parseQuiz } from '../content/parser.js';
import {
  DISCIPLINA_NAME,
  DISCIPLINA_SLUG,
  TOPICS,
  type TopicManifest,
} from '../content/disciplines/administracao-financeira-orcamentaria/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DISCIPLINE_DIR = path.resolve(__dirname, '../content/disciplines/administracao-financeira-orcamentaria');

function buildImageUrls(topic: TopicManifest): string[] {
  const base = `/content-assets/${DISCIPLINA_SLUG}/${topic.folder}`;
  if (topic.imageCount <= 1) return [`${base}/mapa-mental.jpeg`];
  return Array.from({ length: topic.imageCount }, (_, i) => `${base}/mapa-mental-${i + 1}.jpeg`);
}

export async function seedAdministracaoFinanceiraOrcamentaria(): Promise<{ inserted: number; topics: number }> {
  let inserted = 0;

  for (const topic of TOPICS) {
    const topicDir = path.join(DISCIPLINE_DIR, topic.folder);

    const [resumoMd, flashMd, quizMd] = await Promise.all([
      readFile(path.join(topicDir, 'resumo.md'), 'utf8'),
      readFile(path.join(topicDir, 'flashcards.md'), 'utf8'),
      readFile(path.join(topicDir, 'quiz.md'), 'utf8'),
    ]);

    const resumo = parseResumo(resumoMd);
    const flash = parseFlashcards(flashMd);
    const quiz = parseQuiz(quizMd);

    for (const [label, parsed] of [
      ['resumo', resumo],
      ['flashcards', flash],
      ['quiz', quiz],
    ] as const) {
      if (parsed.frontmatter.topic !== topic.topicName) {
        throw new Error(
          `Frontmatter mismatch in ${topic.folder}/${label}.md — expected "${topic.topicName}", got "${parsed.frontmatter.topic}"`,
        );
      }
    }

    const professorName = resumo.frontmatter.professorName;
    const imageUrls = buildImageUrls(topic);

    const rows = [
      {
        disciplinaId: null as string | null,
        templateId: null as string | null,
        disciplinaName: DISCIPLINA_NAME,
        topic: topic.topicName,
        format: 'summary' as const,
        title: resumo.title,
        body: resumo.body as unknown as Record<string, unknown>,
        status: 'published' as const,
        source: 'seed' as const,
        professorName,
      },
      {
        disciplinaId: null as string | null,
        templateId: null as string | null,
        disciplinaName: DISCIPLINA_NAME,
        topic: topic.topicName,
        format: 'flashcard' as const,
        title: flash.title,
        body: flash.body as unknown as Record<string, unknown>,
        status: 'published' as const,
        source: 'seed' as const,
        professorName,
      },
      {
        disciplinaId: null as string | null,
        templateId: null as string | null,
        disciplinaName: DISCIPLINA_NAME,
        topic: topic.topicName,
        format: 'quiz' as const,
        title: quiz.title,
        body: quiz.body as unknown as Record<string, unknown>,
        status: 'published' as const,
        source: 'seed' as const,
        professorName,
      },
      {
        disciplinaId: null as string | null,
        templateId: null as string | null,
        disciplinaName: DISCIPLINA_NAME,
        topic: topic.topicName,
        format: 'mind_map' as const,
        title: `Mapa Mental: ${topic.topicName}`,
        body: {
          centralNode: topic.topicName,
          branches: [],
          imageUrls,
        } as unknown as Record<string, unknown>,
        status: 'published' as const,
        source: 'seed' as const,
        professorName,
      },
    ];

    await db.transaction(async (tx) => {
      await tx
        .delete(schema.contentItems)
        .where(
          and(
            eq(schema.contentItems.disciplinaName, DISCIPLINA_NAME),
            eq(schema.contentItems.topic, topic.topicName),
          ),
        );
      await tx.insert(schema.contentItems).values(rows);
    });

    inserted += rows.length;
    console.log(`  ✓ ${topic.topicName} (${rows.length} items)`);
  }

  return { inserted, topics: TOPICS.length };
}

const invokedDirectly = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedDirectly) {
  seedAdministracaoFinanceiraOrcamentaria()
    .then((r) => {
      console.log(`✅ Administração Financeira e Orçamentária: ${r.inserted} items across ${r.topics} topics`);
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ Seed failed:', err);
      process.exit(1);
    });
}
