import { Router, Request, Response } from 'express';
import { parseEdital, getEditalWithDisciplinas, updateEdital } from '../modules/editais/parser.js';

const router = Router();

/**
 * POST /editais/parse
 * Parse an edital from a URL or uploaded content.
 * Body: { source_url: string, source_type: 'url'|'pdf', raw_content?: string, concurso_id?: string }
 */
router.post('/parse', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { source_url, source_type, raw_content, concurso_id } = req.body;

    if (!source_url || !source_type) {
      res.status(400).json({ error: 'source_url and source_type are required' });
      return;
    }

    if (source_type !== 'url' && source_type !== 'pdf') {
      res.status(400).json({ error: 'source_type must be "url" or "pdf"' });
      return;
    }

    const result = await parseEdital({
      userId,
      sourceUrl: source_url,
      sourceType: source_type,
      rawContent: raw_content,
      concursoId: concurso_id,
    });

    res.status(201).json({ data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    res.status(500).json({ error: message });
  }
});

/**
 * GET /editais/:id
 * Get an edital with its disciplinas.
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const editalId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await getEditalWithDisciplinas(editalId);

    if (!result) {
      res.status(404).json({ error: 'Edital not found' });
      return;
    }

    if (result.edital.userId !== userId) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    res.json({ data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    res.status(500).json({ error: message });
  }
});

/**
 * PUT /editais/:id
 * Update an edital (user corrections to parsed data).
 * Body: { parsed_data?, exam_date?, status?, disciplinas? }
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { parsed_data, exam_date, status, disciplinas } = req.body;
    const editalId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    const result = await updateEdital(editalId, userId, {
      parsedData: parsed_data,
      examDate: exam_date ? new Date(exam_date) : undefined,
      status,
      disciplinas,
    });

    if (result && 'error' in result) {
      const statusCode = result.error === 'Unauthorized' ? 403 : 404;
      res.status(statusCode).json(result);
      return;
    }

    res.json({ data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    res.status(500).json({ error: message });
  }
});

export default router;
