import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { eq, and, desc, inArray, asc } from 'drizzle-orm';
import { db } from '../db/index.js';
import { editais, disciplinas, editalTemplates } from '../db/schema.js';
import { validateBody } from '../middleware/validate.js';
import { parseEdital, getEditalWithDisciplinas, updateEdital, createEditalFromTemplate } from '../modules/editais/parser.js';
import { uploadPdf } from '../middleware/upload.js';
import { extractTextFromPdf } from '../services/pdf-extract.js';

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
  disciplinas: data.disciplinas?.map((d, i) => ({
    ...d,
    order_index: d.order_index ?? d.orderIndex ?? i,
  })),
}));

const fromTemplateSchema = z.object({
  template_id: z.string().uuid().optional(),
  templateId: z.string().uuid().optional(),
  cargo_name: z.string().optional(),
  cargoName: z.string().optional(),
}).transform(data => ({
  template_id: data.template_id ?? data.templateId,
  cargo_name: data.cargo_name ?? data.cargoName,
})).refine(data => data.template_id, {
  message: 'template_id is required',
});

/**
 * GET /editais/templates
 * List all active edital templates (lightweight).
 */
router.get('/templates', async (_req: Request, res: Response) => {
  try {
    const templates = await db
      .select()
      .from(editalTemplates)
      .where(eq(editalTemplates.isActive, true))
      .orderBy(asc(editalTemplates.sortOrder));

    const lightweight = templates.map(t => {
      const discs = t.disciplinas as Array<{ name: string }>;
      const cargos = t.cargos as Array<{ name: string }> | null;
      return {
        id: t.id,
        name: t.name,
        banca: t.banca,
        orgao: t.orgao,
        hasCargos: cargos != null && cargos.length > 0,
        disciplinaCount: discs.length,
        examDate: t.examDate,
        createdAt: t.createdAt,
        sortOrder: t.sortOrder,
      };
    });

    res.json(lightweight);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

/**
 * GET /editais/templates/:id
 * Get full template detail with disciplinas and cargos.
 */
router.get('/templates/:id', async (req: Request, res: Response) => {
  try {
    const templateId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const [template] = await db
      .select()
      .from(editalTemplates)
      .where(eq(editalTemplates.id, templateId));

    if (!template) {
      res.status(404).json({ error: 'Template not found' });
      return;
    }

    res.json({ data: template });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch template' });
  }
});

/**
 * POST /editais/from-template
 * Create an edital from a pre-parsed template.
 */
router.post('/from-template', validateBody(fromTemplateSchema), async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { template_id, cargo_name } = req.body;

    const result = await createEditalFromTemplate(userId, template_id!, cargo_name);

    res.status(201).json({ data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    res.status(500).json({ error: message });
  }
});

/**
 * GET /editais
 * List all editais for the authenticated user.
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const userEditais = await db
      .select()
      .from(editais)
      .where(eq(editais.userId, userId))
      .orderBy(desc(editais.updatedAt));

    if (userEditais.length === 0) {
      res.json([]);
      return;
    }

    const editalIds = userEditais.map((e) => e.id);
    const allDisciplinas = await db
      .select()
      .from(disciplinas)
      .where(inArray(disciplinas.editalId, editalIds))
      .orderBy(asc(disciplinas.orderIndex));

    const disciplinasByEdital = new Map<string, typeof allDisciplinas>();
    for (const d of allDisciplinas) {
      const list = disciplinasByEdital.get(d.editalId!) ?? [];
      list.push(d);
      disciplinasByEdital.set(d.editalId!, list);
    }

    const enriched = userEditais.map((e) => ({
      ...e,
      disciplinas: disciplinasByEdital.get(e.id) ?? [],
    }));

    res.json(enriched);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch editais' });
  }
});

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
 * POST /editais/parse-pdf
 * Parse an edital from an uploaded PDF file.
 */
router.post('/parse-pdf', uploadPdf, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    if (!req.file) {
      res.status(400).json({ error: 'PDF file is required' });
      return;
    }

    const text = await extractTextFromPdf(req.file.buffer);
    if (!text.trim()) {
      res.status(400).json({ error: 'Could not extract text from PDF' });
      return;
    }

    const result = await parseEdital({
      userId,
      sourceUrl: `upload://${req.file.originalname}`,
      sourceType: 'pdf',
      rawContent: text,
    });

    res.status(201).json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to parse PDF edital';
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

/**
 * DELETE /editais/:id
 * Delete an edital owned by the authenticated user.
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const editalId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const [deleted] = await db
      .delete(editais)
      .where(and(eq(editais.id, editalId), eq(editais.userId, userId)))
      .returning();

    if (!deleted) {
      res.status(404).json({ error: 'Edital not found' });
      return;
    }

    res.json({ message: 'Edital deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete edital' });
  }
});

export default router;
