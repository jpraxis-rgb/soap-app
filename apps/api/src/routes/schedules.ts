import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { eq, and, asc, gte, lte } from 'drizzle-orm';
import { db } from '../db/index.js';
import { scheduleBlocks } from '../db/schema.js';
import { validateBody } from '../middleware/validate.js';
import { generateSchedule, recalculateExistingSchedule } from '../modules/schedules/engine.js';

const router = Router();

const generateScheduleSchema = z.object({
  edital_id: z.string().uuid().optional(),
  editalId: z.string().uuid().optional(),
  hours_per_week: z.number().min(1).max(80).optional(),
  hoursPerWeek: z.number().min(1).max(80).optional(),
  available_days: z.array(z.number().min(0).max(6)).optional(),
  availableDays: z.array(z.number().min(0).max(6)).optional(),
  exam_date: z.string().optional(),
  examDate: z.string().optional(),
}).transform(data => ({
  edital_id: data.edital_id ?? data.editalId,
  hours_per_week: data.hours_per_week ?? data.hoursPerWeek,
  available_days: data.available_days ?? data.availableDays,
  exam_date: data.exam_date ?? data.examDate,
})).refine(data => data.edital_id, { message: 'edital_id is required' })
  .refine(data => data.hours_per_week, { message: 'hours_per_week is required' })
  .refine(data => data.available_days && data.available_days.length > 0, { message: 'available_days must be a non-empty array' })
  .refine(data => data.exam_date, { message: 'exam_date is required' });

/**
 * GET /schedules
 * List schedule blocks for the authenticated user with optional filtering.
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { edital_id, from, to, status } = req.query;

    const conditions = [eq(scheduleBlocks.userId, userId)];
    if (edital_id) conditions.push(eq(scheduleBlocks.editalId, edital_id as string));
    if (status) conditions.push(eq(scheduleBlocks.status, status as string));
    if (from) conditions.push(gte(scheduleBlocks.scheduledDate, from as string));
    if (to) conditions.push(lte(scheduleBlocks.scheduledDate, to as string));

    const blocks = await db
      .select()
      .from(scheduleBlocks)
      .where(and(...conditions))
      .orderBy(asc(scheduleBlocks.scheduledDate), asc(scheduleBlocks.startTime));

    res.json(blocks);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch schedule blocks' });
  }
});

/**
 * POST /schedules/generate
 * Generate a study schedule for an edital.
 */
router.post('/generate', validateBody(generateScheduleSchema), async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { edital_id, hours_per_week, available_days, exam_date } = req.body;

    const result = await generateSchedule({
      userId,
      editalId: edital_id,
      hoursPerWeek: hours_per_week,
      availableDays: available_days,
      examDate: exam_date,
    });

    if ('error' in result) {
      const statusCode = result.error === 'Unauthorized' ? 403
        : result.error === 'Edital not found' ? 404
        : 400;
      res.status(statusCode).json(result);
      return;
    }

    res.status(201).json({ data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    res.status(500).json({ error: message });
  }
});

/**
 * GET /schedules/:id
 * Get a schedule block by ID.
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const blockId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const [block] = await db
      .select()
      .from(scheduleBlocks)
      .where(eq(scheduleBlocks.id, blockId));

    if (!block) {
      res.status(404).json({ error: 'Schedule block not found' });
      return;
    }

    if (block.userId !== userId) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    res.json({ data: block });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    res.status(500).json({ error: message });
  }
});

/**
 * PUT /schedules/:id/recalculate
 * Recalculate schedule blocks for an edital, considering completed sessions.
 * The :id here is the edital_id.
 */
router.put('/:id/recalculate', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const editalId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await recalculateExistingSchedule(editalId, userId);

    if ('error' in result) {
      const statusCode = result.error === 'Unauthorized' ? 403
        : result.error === 'Edital not found' ? 404
        : 400;
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
 * DELETE /schedules/:id
 * Delete a schedule block owned by the authenticated user.
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const blockId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const [deleted] = await db
      .delete(scheduleBlocks)
      .where(and(eq(scheduleBlocks.id, blockId), eq(scheduleBlocks.userId, userId)))
      .returning();

    if (!deleted) {
      res.status(404).json({ error: 'Schedule block not found' });
      return;
    }

    res.json({ message: 'Schedule block deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete schedule block' });
  }
});

export default router;
