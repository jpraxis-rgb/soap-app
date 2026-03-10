import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { validateBody } from '../middleware/validate.js';
import { parseEdital, getEditalWithDisciplinas, updateEdital } from '../modules/editais/parser.js';

const router = Router();

const parseEditalSchema = z.object({
  source_url: z.string().url().optional(),
  sourceUrl: z.string().url().optional(),
  source_type: z.enum(['url', 'pdf']).optional(),
  sourceType: z.enum(['url', 'pdf']).optional(),
  raw_content: z.string().optional(),
  rawContent: z.string().optional(),
  concurso_id: z.string().uuid().optional(),
  concursoId: z.string().uuid().optional(),
}).transform(data => ({
  source_url: data.source_url ?? data.sourceUrl,
  source_type: data.source_type ?? data.sourceType,
  raw_content: data.raw_content ?? data.rawContent,
  concurso_id: data.concurso_id ?? data.concursoId,
})).refine(data => data.source_url || data.raw_content, {
  message: 'Either source_url or raw_content must be provided',
});

const updateEditalSchema = z.object({
  parsed_data: z.record(z.string(), z.unknown()).optional(),
  parsedData: z.record(z.string(), z.unknown()).optional(),
  exam_date: z.string().optional(),
  examDate: z.string().optional(),
  status: z.string().optional(),
  disciplinas: z.array(z.object({
    name: z.string(),
    weight: z.number(),
    topics: z.unknown().optional(),
    order_index: z.number().optional(),
    orderIndex: z.number().optional(),
  })).optional(),
}).transform(data => ({
  parsed_data: data.parsed_data ?? data.parsedData,
  exam_date: data.exam_date ?? data.examDate,
  status: data.status,
  disciplinas: data.disciplinas,
}));

/**
 * POST /editais/parse
 * Parse an edital from a URL or uploaded content.
 */
router.post('/parse', validateBody(parseEditalSchema), async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { source_url, source_type, raw_content, concurso_id } = req.body;

    const result = await parseEdital({
      userId,
      sourceUrl: source_url,
      sourceType: source_type ?? 'url',
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
 */
router.put('/:id', validateBody(updateEditalSchema), async (req: Request, res: Response) => {
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
