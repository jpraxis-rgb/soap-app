import { Router, Request, Response } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { scheduleBlocks } from '../db/schema.js';
import { generateSchedule, recalculateExistingSchedule } from '../modules/schedules/engine.js';

const router = Router();

/**
 * POST /schedules/generate
 * Generate a study schedule for an edital.
 * Body: { edital_id, hours_per_week, available_days: number[], exam_date: string }
 */
router.post('/generate', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { edital_id, hours_per_week, available_days, exam_date } = req.body;

    if (!edital_id || !hours_per_week || !available_days || !exam_date) {
      res.status(400).json({
        error: 'edital_id, hours_per_week, available_days, and exam_date are required',
      });
      return;
    }

    if (!Array.isArray(available_days) || available_days.length === 0) {
      res.status(400).json({ error: 'available_days must be a non-empty array of day numbers (0-6)' });
      return;
    }

    if (typeof hours_per_week !== 'number' || hours_per_week <= 0) {
      res.status(400).json({ error: 'hours_per_week must be a positive number' });
      return;
    }

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

export default router;
