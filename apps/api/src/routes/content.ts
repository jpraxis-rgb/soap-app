import { Router, Request, Response } from 'express';
import {
  generateContentBatch,
  getContentByTopic,
  getCurationQueue,
  approveContent,
  rejectContent,
} from '../modules/content/content.service.js';

const router = Router();

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
router.post('/generate', async (req: Request, res: Response) => {
  try {
    const { topic, disciplinaId, disciplinaName } = req.body;

    if (!topic || !disciplinaId) {
      res.status(400).json({ error: 'topic and disciplinaId are required' });
      return;
    }

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

// GET /content/curation-queue — professor's pending review items
router.get('/curation-queue', async (_req: Request, res: Response) => {
  try {
    const items = await getCurationQueue();
    res.json({ data: items });
  } catch (error) {
    console.error('Curation queue error:', error);
    res.status(500).json({ error: 'Failed to fetch curation queue' });
  }
});

// PUT /content/:id/approve — professor approves content
router.put('/:id/approve', async (req: Request, res: Response) => {
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

// PUT /content/:id/reject — professor rejects content with comment
router.put('/:id/reject', async (req: Request, res: Response) => {
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
