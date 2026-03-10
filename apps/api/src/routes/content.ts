import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { validateBody } from '../middleware/validate.js';
import { requireTier } from '../middleware/auth.js';
import {
  generateContentBatch,
  getContentByTopic,
  getCurationQueue,
  approveContent,
  rejectContent,
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
