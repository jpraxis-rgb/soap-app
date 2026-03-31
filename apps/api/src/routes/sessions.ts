import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { validateBody } from '../middleware/validate.js';
import { db } from '../db/index.js';
import * as schema from '../db/schema.js';
import { studySessions } from '../db/schema.js';
import { eq, and, gte, lte, sql } from 'drizzle-orm';

const router = Router();

const createSessionSchema = z.object({
  schedule_block_id: z.string().uuid().optional(),
  scheduleBlockId: z.string().uuid().optional(),
  disciplina_id: z.string().uuid().optional(),
  disciplinaId: z.string().uuid().optional(),
  topic: z.string().min(1),
  duration_minutes: z.number().min(1).optional(),
  durationMinutes: z.number().min(1).optional(),
  self_rating: z.number().min(1).max(3).optional(),
  selfRating: z.number().min(1).max(3).optional(),
  notes: z.string().optional(),
  started_at: z.string().optional(),
  startedAt: z.string().optional(),
  completed_at: z.string().optional(),
  completedAt: z.string().optional(),
}).transform(data => ({
  schedule_block_id: data.schedule_block_id ?? data.scheduleBlockId,
  disciplina_id: data.disciplina_id ?? data.disciplinaId,
  topic: data.topic,
  duration_minutes: data.duration_minutes ?? data.durationMinutes,
  self_rating: data.self_rating ?? data.selfRating,
  notes: data.notes,
  started_at: data.started_at ?? data.startedAt,
  completed_at: data.completed_at ?? data.completedAt,
}));

// POST /sessions — log a study session
router.post('/', validateBody(createSessionSchema), async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const {
      schedule_block_id,
      disciplina_id,
      topic,
      duration_minutes,
      self_rating,
      notes,
      started_at,
      completed_at,
    } = req.body;

    if (!disciplina_id || !topic || !duration_minutes || self_rating == null || !started_at) {
      res.status(400).json({ error: 'Missing required fields: disciplina_id, topic, duration_minutes, self_rating, started_at' });
      return;
    }

    if (self_rating < 1 || self_rating > 3) {
      res.status(400).json({ error: 'self_rating must be between 1 and 3' });
      return;
    }

    // Insert the study session
    const [session] = await db
      .insert(schema.studySessions)
      .values({
        userId,
        scheduleBlockId: schedule_block_id || null,
        disciplinaId: disciplina_id,
        topic,
        durationMinutes: duration_minutes,
        selfRating: self_rating,
        notes: notes || null,
        startedAt: new Date(started_at),
        completedAt: completed_at ? new Date(completed_at) : new Date(),
      })
      .returning();

    // If linked to a schedule block, mark it as completed
    if (schedule_block_id) {
      await db
        .update(schema.scheduleBlocks)
        .set({ status: 'completed' })
        .where(
          and(
            eq(schema.scheduleBlocks.id, schedule_block_id),
            eq(schema.scheduleBlocks.userId, userId),
          ),
        );
    }

    res.status(201).json({ data: session });
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /sessions — list sessions with optional filters
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const { from, to, disciplina_id } = req.query;
    const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 200);
    const offset = Math.max(Number(req.query.offset) || 0, 0);

    const conditions = [eq(schema.studySessions.userId, userId)];

    if (from) {
      conditions.push(gte(schema.studySessions.startedAt, new Date(from as string)));
    }
    if (to) {
      conditions.push(lte(schema.studySessions.startedAt, new Date(to as string)));
    }
    if (disciplina_id) {
      conditions.push(eq(schema.studySessions.disciplinaId, disciplina_id as string));
    }

    const sessions = await db
      .select({
        id: schema.studySessions.id,
        disciplina_id: schema.studySessions.disciplinaId,
        disciplina_name: schema.disciplinas.name,
        topic: schema.studySessions.topic,
        duration_minutes: schema.studySessions.durationMinutes,
        self_rating: schema.studySessions.selfRating,
        notes: schema.studySessions.notes,
        started_at: schema.studySessions.startedAt,
        completed_at: schema.studySessions.completedAt,
      })
      .from(schema.studySessions)
      .leftJoin(schema.disciplinas, eq(schema.studySessions.disciplinaId, schema.disciplinas.id))
      .where(and(...conditions))
      .orderBy(schema.studySessions.startedAt)
      .limit(limit)
      .offset(offset);

    res.json({ data: sessions });
  } catch (error) {
    console.error('Error listing sessions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /sessions/stats — aggregated stats
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Total hours per disciplina
    const hoursPerDisciplina = await db
      .select({
        disciplinaId: schema.studySessions.disciplinaId,
        disciplinaName: schema.disciplinas.name,
        totalMinutes: sql<number>`COALESCE(SUM(${schema.studySessions.durationMinutes}), 0)`.as('total_minutes'),
        sessionCount: sql<number>`COUNT(${schema.studySessions.id})`.as('session_count'),
        avgRating: sql<number>`ROUND(AVG(${schema.studySessions.selfRating}), 1)`.as('avg_rating'),
      })
      .from(schema.studySessions)
      .leftJoin(schema.disciplinas, eq(schema.studySessions.disciplinaId, schema.disciplinas.id))
      .where(eq(schema.studySessions.userId, userId))
      .groupBy(schema.studySessions.disciplinaId, schema.disciplinas.name);

    // Total unique topics studied vs total topics in schedule
    const topicsStudied = await db
      .select({
        count: sql<number>`COUNT(DISTINCT ${schema.studySessions.topic})`.as('count'),
      })
      .from(schema.studySessions)
      .where(eq(schema.studySessions.userId, userId));

    const totalTopicsScheduled = await db
      .select({
        count: sql<number>`COUNT(DISTINCT ${schema.scheduleBlocks.topic})`.as('count'),
      })
      .from(schema.scheduleBlocks)
      .where(eq(schema.scheduleBlocks.userId, userId));

    const studied = Number(topicsStudied[0]?.count ?? 0);
    const scheduled = Number(totalTopicsScheduled[0]?.count ?? 0);
    const coveragePercent = scheduled > 0 ? Math.round((studied / scheduled) * 100) : 0;

    // Total hours
    const totalResult = await db
      .select({
        totalMinutes: sql<number>`COALESCE(SUM(${schema.studySessions.durationMinutes}), 0)`.as('total_minutes'),
        totalSessions: sql<number>`COUNT(${schema.studySessions.id})`.as('total_sessions'),
      })
      .from(schema.studySessions)
      .where(eq(schema.studySessions.userId, userId));

    res.json({
      data: {
        total_hours: Math.round((Number(totalResult[0]?.totalMinutes ?? 0) / 60) * 10) / 10,
        total_sessions: Number(totalResult[0]?.totalSessions ?? 0),
        coverage_percent: coveragePercent,
        topics_studied: studied,
        topics_scheduled: scheduled,
        by_disciplina: hoursPerDisciplina.map((d) => ({
          disciplina_id: d.disciplinaId,
          disciplina_name: d.disciplinaName,
          total_hours: Math.round((Number(d.totalMinutes) / 60) * 10) / 10,
          session_count: Number(d.sessionCount),
          avg_rating: Number(d.avgRating),
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PATCH /sessions/:id
 * Partially update a study session owned by the authenticated user.
 */
const updateSessionSchema = z.object({
  topic: z.string().min(1).optional(),
  duration_minutes: z.number().min(1).optional(),
  durationMinutes: z.number().min(1).optional(),
  self_rating: z.number().min(1).max(3).optional(),
  selfRating: z.number().min(1).max(3).optional(),
  notes: z.string().optional(),
  started_at: z.string().optional(),
  startedAt: z.string().optional(),
  completed_at: z.string().optional(),
  completedAt: z.string().optional(),
}).transform(data => ({
  topic: data.topic,
  duration_minutes: data.duration_minutes ?? data.durationMinutes,
  self_rating: data.self_rating ?? data.selfRating,
  notes: data.notes,
  started_at: data.started_at ?? data.startedAt,
  completed_at: data.completed_at ?? data.completedAt,
}));

router.patch('/:id', validateBody(updateSessionSchema), async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const sessionId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { topic, duration_minutes, self_rating, notes, started_at, completed_at } = req.body;

    const updateFields: Record<string, unknown> = {};
    if (topic !== undefined) updateFields.topic = topic;
    if (duration_minutes !== undefined) updateFields.durationMinutes = duration_minutes;
    if (self_rating !== undefined) updateFields.selfRating = self_rating;
    if (notes !== undefined) updateFields.notes = notes;
    if (started_at !== undefined) updateFields.startedAt = new Date(started_at);
    if (completed_at !== undefined) updateFields.completedAt = new Date(completed_at);

    if (Object.keys(updateFields).length === 0) {
      res.status(400).json({ error: 'No fields to update' });
      return;
    }

    const [session] = await db
      .update(studySessions)
      .set(updateFields)
      .where(and(eq(studySessions.id, sessionId), eq(studySessions.userId, userId)))
      .returning();

    if (!session) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    res.json({ data: session });
  } catch (error) {
    console.error('Error updating session:', error);
    res.status(500).json({ error: 'Failed to update session' });
  }
});

/**
 * DELETE /sessions/:id
 * Delete a study session owned by the authenticated user.
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const sessionId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const [deleted] = await db
      .delete(studySessions)
      .where(and(eq(studySessions.id, sessionId), eq(studySessions.userId, userId)))
      .returning();

    if (!deleted) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    res.json({ message: 'Session deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete session' });
  }
});

export default router;
