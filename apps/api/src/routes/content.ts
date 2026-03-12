import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { db } from '../db/index.js';
import * as schema from '../db/schema.js';
import { validateBody } from '../middleware/validate.js';
import { requireTier } from '../middleware/auth.js';
import {
  generateContentBatch,
  getContentByTopic,
  getCurationQueue,
  approveContent,
  rejectContent,
  getContentForEdital,
  getContentForTopic,
} from '../modules/content/content.service.js';

const router = Router();

const generateContentSchema = z.object({
  topic: z.string().min(1),
  disciplina_id: z.string().uuid().optional(),
  disciplinaId: z.string().uuid().optional(),
  disciplinaName: z.string().optional(),
}).transform(data => ({
  topic: data.topic,
  disciplinaId: data.disciplina_id ?? data.disciplinaId,
  disciplinaName: data.disciplinaName,
}));

// GET /content/for-edital/:editalId
router.get('/for-edital/:editalId', async (req: Request, res: Response) => {
  try {
    const editalId = String(req.params.editalId);
    const result = await getContentForEdital(editalId);
    if (!result) {
      res.status(404).json({ error: 'Edital not found' });
      return;
    }
    res.json({ data: result });
  } catch (error) {
    console.error('Content for-edital error:', error);
    res.status(500).json({ error: 'Failed to fetch content for edital' });
  }
});

// GET /content/for-topic
router.get('/for-topic', async (req: Request, res: Response) => {
  try {
    const { topic, disciplina, format } = req.query;
    if (!topic || !disciplina) {
      res.status(400).json({ error: 'topic and disciplina are required' });
      return;
    }
    const items = await getContentForTopic(
      topic as string,
      disciplina as string,
      format as string | undefined
    );
    res.json({ data: items });
  } catch (error) {
    console.error('Content for-topic error:', error);
    res.status(500).json({ error: 'Failed to fetch content for topic' });
  }
});

// POST /content/seed-for-edital/:editalId — generate content for all topics in a custom edital
router.post('/seed-for-edital/:editalId', async (req: Request, res: Response) => {
  try {
    const editalId = String(req.params.editalId);
    // Get edital and its disciplinas
    const [edital] = await db.select().from(schema.editais).where(eq(schema.editais.id, editalId));
    if (!edital) {
      res.status(404).json({ error: 'Edital not found' });
      return;
    }
    const editalDisciplinas = await db.select().from(schema.disciplinas)
      .where(eq(schema.disciplinas.editalId, editalId));

    // Respond immediately, process in background
    res.json({ data: { message: 'Content generation started', status: 'processing' } });

    // Background generation
    (async () => {
      for (const disc of editalDisciplinas) {
        const rawTopics = disc.topics;
        const topics: string[] = Array.isArray(rawTopics)
          ? rawTopics as string[]
          : (rawTopics && typeof rawTopics === 'object' && 'items' in (rawTopics as Record<string, unknown>))
            ? ((rawTopics as Record<string, unknown>).items as string[])
            : [];
        for (const topicName of topics) {
          try {
            // Check if content already exists
            const existing = await db.select({ id: schema.contentItems.id })
              .from(schema.contentItems)
              .where(and(
                eq(schema.contentItems.topic, topicName as string),
                eq(schema.contentItems.disciplinaName, disc.name),
                eq(schema.contentItems.status, 'published'),
              ));
            if (existing.length >= 4) continue;

            await generateContentBatch(topicName as string, disc.id, disc.name, {
              autoPublish: true,
              source: 'ai_auto',
            });
          } catch (err) {
            console.error(`Failed to generate content for ${disc.name} > ${topicName}:`, err);
          }
        }
      }
      console.log(`Content generation complete for edital ${editalId}`);
    })();
  } catch (error) {
    console.error('Seed for-edital error:', error);
    res.status(500).json({ error: 'Failed to start content generation' });
  }
});

// GET /content/topic/:topicId — returns published content by format
router.get('/topic/:topicId', async (req: Request, res: Response) => {
  try {
    const topicId = String(req.params.topicId);
    const { format } = req.query;

    const formatStr = typeof format === 'string' ? format : undefined;
    const items = await getContentByTopic(topicId, formatStr);
    res.json({ data: items });
  } catch (error) {
    console.error('Content topic error:', error);
    res.status(500).json({ error: 'Failed to fetch content' });
  }
});

// POST /content/generate — triggers content generation for a topic (all formats)
router.post('/generate', validateBody(generateContentSchema), async (req: Request, res: Response) => {
  try {
    const { topic, disciplinaId, disciplinaName } = req.body;

    const items = await generateContentBatch(
      topic,
      disciplinaId,
      disciplinaName || 'Disciplina'
    );
    res.json({ data: items });
  } catch (error) {
    console.error('Content generate error:', error);
    res.status(500).json({ error: 'Failed to generate content' });
  }
});

// GET /content/curation-queue — professor's pending review items (mentor tier required)
router.get('/curation-queue', requireTier('mentor'), async (_req: Request, res: Response) => {
  try {
    const items = await getCurationQueue();
    res.json({ data: items });
  } catch (error) {
    console.error('Curation queue error:', error);
    res.status(500).json({ error: 'Failed to fetch curation queue' });
  }
});

// PUT /content/:id/approve — professor approves content (mentor tier required)
router.put('/:id/approve', requireTier('mentor'), async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const professorId = req.user!.id;
    const professorName = String(req.body.professorName || 'Professor');

    const item = await approveContent(id, professorId, professorName);

    if (!item) {
      res.status(404).json({ error: 'Content item not found' });
      return;
    }

    res.json({ data: item });
  } catch (error) {
    console.error('Approve error:', error);
    res.status(500).json({ error: 'Failed to approve content' });
  }
});

// PUT /content/:id/reject — professor rejects content with comment (mentor tier required)
router.put('/:id/reject', requireTier('mentor'), async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const professorId = req.user!.id;
    const professorName = String(req.body.professorName || 'Professor');

    const item = await rejectContent(id, professorId, professorName);

    if (!item) {
      res.status(404).json({ error: 'Content item not found' });
      return;
    }

    res.json({ data: item });
  } catch (error) {
    console.error('Reject error:', error);
    res.status(500).json({ error: 'Failed to reject content' });
  }
});

export default router;
