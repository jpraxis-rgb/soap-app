import { Router, Request, Response } from 'express';
import { db } from '../db/index.js';
import * as schema from '../db/schema.js';
import { eq, and, gte, desc, sql } from 'drizzle-orm';

const router = Router();

// GET /progress/overview — total coverage %, hours studied vs planned
router.get('/overview', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Total hours studied
    const studiedResult = await db
      .select({
        totalMinutes: sql<number>`COALESCE(SUM(${schema.studySessions.durationMinutes}), 0)`.as('total_minutes'),
        totalSessions: sql<number>`COUNT(${schema.studySessions.id})`.as('total_sessions'),
      })
      .from(schema.studySessions)
      .where(eq(schema.studySessions.userId, userId));

    // Total hours planned
    const plannedResult = await db
      .select({
        totalMinutes: sql<number>`COALESCE(SUM(${schema.scheduleBlocks.durationMinutes}), 0)`.as('total_minutes'),
        totalBlocks: sql<number>`COUNT(${schema.scheduleBlocks.id})`.as('total_blocks'),
      })
      .from(schema.scheduleBlocks)
      .where(eq(schema.scheduleBlocks.userId, userId));

    // Completed blocks vs total blocks
    const completedResult = await db
      .select({
        count: sql<number>`COUNT(${schema.scheduleBlocks.id})`.as('count'),
      })
      .from(schema.scheduleBlocks)
      .where(
        and(
          eq(schema.scheduleBlocks.userId, userId),
          eq(schema.scheduleBlocks.status, 'completed'),
        ),
      );

    const studiedMinutes = Number(studiedResult[0]?.totalMinutes ?? 0);
    const plannedMinutes = Number(plannedResult[0]?.totalMinutes ?? 0);
    const totalBlocks = Number(plannedResult[0]?.totalBlocks ?? 0);
    const completedBlocks = Number(completedResult[0]?.count ?? 0);
    const coveragePercent = totalBlocks > 0 ? Math.round((completedBlocks / totalBlocks) * 100) : 0;

    // Calculate streak (consecutive days with sessions)
    const recentSessions = await db
      .select({
        sessionDate: sql<string>`DATE(${schema.studySessions.startedAt})`.as('session_date'),
      })
      .from(schema.studySessions)
      .where(eq(schema.studySessions.userId, userId))
      .groupBy(sql`DATE(${schema.studySessions.startedAt})`)
      .orderBy(sql`DATE(${schema.studySessions.startedAt}) DESC`);

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < recentSessions.length; i++) {
      const sessionDate = new Date(recentSessions[i].sessionDate);
      sessionDate.setHours(0, 0, 0, 0);

      const expectedDate = new Date(today);
      expectedDate.setDate(expectedDate.getDate() - i);

      if (sessionDate.getTime() === expectedDate.getTime()) {
        streak++;
      } else {
        break;
      }
    }

    res.json({
      data: {
        hours_studied: Math.round((studiedMinutes / 60) * 10) / 10,
        hours_planned: Math.round((plannedMinutes / 60) * 10) / 10,
        total_sessions: Number(studiedResult[0]?.totalSessions ?? 0),
        completed_blocks: completedBlocks,
        total_blocks: totalBlocks,
        coverage_percent: coveragePercent,
        streak_days: streak,
      },
    });
  } catch (error) {
    console.error('Error fetching progress overview:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /progress/by-disciplina — per-disciplina breakdown
router.get('/by-disciplina', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Get all disciplinas the user has scheduled
    const disciplinaStats = await db
      .select({
        disciplinaId: schema.disciplinas.id,
        disciplinaName: schema.disciplinas.name,
        weight: schema.disciplinas.weight,
        plannedMinutes: sql<number>`COALESCE(SUM(${schema.scheduleBlocks.durationMinutes}), 0)`.as('planned_minutes'),
        totalBlocks: sql<number>`COUNT(${schema.scheduleBlocks.id})`.as('total_blocks'),
        completedBlocks: sql<number>`SUM(CASE WHEN ${schema.scheduleBlocks.status} = 'completed' THEN 1 ELSE 0 END)`.as('completed_blocks'),
      })
      .from(schema.scheduleBlocks)
      .innerJoin(schema.disciplinas, eq(schema.scheduleBlocks.disciplinaId, schema.disciplinas.id))
      .where(eq(schema.scheduleBlocks.userId, userId))
      .groupBy(schema.disciplinas.id, schema.disciplinas.name, schema.disciplinas.weight);

    // Get studied hours per disciplina
    const studiedByDisciplina = await db
      .select({
        disciplinaId: schema.studySessions.disciplinaId,
        studiedMinutes: sql<number>`COALESCE(SUM(${schema.studySessions.durationMinutes}), 0)`.as('studied_minutes'),
        sessionCount: sql<number>`COUNT(${schema.studySessions.id})`.as('session_count'),
        avgRating: sql<number>`ROUND(AVG(${schema.studySessions.selfRating}), 1)`.as('avg_rating'),
      })
      .from(schema.studySessions)
      .where(eq(schema.studySessions.userId, userId))
      .groupBy(schema.studySessions.disciplinaId);

    const studiedMap = new Map(
      studiedByDisciplina.map((s) => [s.disciplinaId, s]),
    );

    const breakdown = disciplinaStats.map((d) => {
      const studied = studiedMap.get(d.disciplinaId);
      const completed = Number(d.completedBlocks);
      const total = Number(d.totalBlocks);

      return {
        disciplina_id: d.disciplinaId,
        disciplina_name: d.disciplinaName,
        weight: d.weight,
        hours_planned: Math.round((Number(d.plannedMinutes) / 60) * 10) / 10,
        hours_studied: studied ? Math.round((Number(studied.studiedMinutes) / 60) * 10) / 10 : 0,
        session_count: studied ? Number(studied.sessionCount) : 0,
        avg_rating: studied ? Number(studied.avgRating) : 0,
        completed_blocks: completed,
        total_blocks: total,
        progress_percent: total > 0 ? Math.round((completed / total) * 100) : 0,
      };
    });

    res.json({ data: breakdown });
  } catch (error) {
    console.error('Error fetching disciplina breakdown:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /progress/by-disciplina/:id — detail for a single disciplina
router.get('/by-disciplina/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const disciplinaId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    // Get disciplina stats (same pattern as the list, filtered to one)
    const [stats] = await db
      .select({
        disciplinaId: schema.disciplinas.id,
        disciplinaName: schema.disciplinas.name,
        weight: schema.disciplinas.weight,
        topics: schema.disciplinas.topics,
        plannedMinutes: sql<number>`COALESCE(SUM(${schema.scheduleBlocks.durationMinutes}), 0)`.as('planned_minutes'),
        totalBlocks: sql<number>`COUNT(${schema.scheduleBlocks.id})`.as('total_blocks'),
        completedBlocks: sql<number>`SUM(CASE WHEN ${schema.scheduleBlocks.status} = 'completed' THEN 1 ELSE 0 END)`.as('completed_blocks'),
      })
      .from(schema.disciplinas)
      .leftJoin(
        schema.scheduleBlocks,
        and(
          eq(schema.scheduleBlocks.disciplinaId, schema.disciplinas.id),
          eq(schema.scheduleBlocks.userId, userId),
        ),
      )
      .where(eq(schema.disciplinas.id, disciplinaId))
      .groupBy(schema.disciplinas.id, schema.disciplinas.name, schema.disciplinas.weight, schema.disciplinas.topics);

    if (!stats) {
      res.status(404).json({ error: 'Disciplina not found' });
      return;
    }

    // Get studied hours for this disciplina
    const [studied] = await db
      .select({
        studiedMinutes: sql<number>`COALESCE(SUM(${schema.studySessions.durationMinutes}), 0)`.as('studied_minutes'),
        sessionCount: sql<number>`COUNT(${schema.studySessions.id})`.as('session_count'),
        avgRating: sql<number>`ROUND(COALESCE(AVG(${schema.studySessions.selfRating}), 0), 1)`.as('avg_rating'),
      })
      .from(schema.studySessions)
      .where(
        and(
          eq(schema.studySessions.userId, userId),
          eq(schema.studySessions.disciplinaId, disciplinaId),
        ),
      );

    const completed = Number(stats.completedBlocks);
    const total = Number(stats.totalBlocks);

    const disciplina = {
      disciplina_id: stats.disciplinaId,
      disciplina_name: stats.disciplinaName,
      weight: stats.weight,
      hours_planned: Math.round((Number(stats.plannedMinutes) / 60) * 10) / 10,
      hours_studied: studied ? Math.round((Number(studied.studiedMinutes) / 60) * 10) / 10 : 0,
      session_count: studied ? Number(studied.sessionCount) : 0,
      avg_rating: studied ? Number(studied.avgRating) : 0,
      completed_blocks: completed,
      total_blocks: total,
      progress_percent: total > 0 ? Math.round((completed / total) * 100) : 0,
    };

    // Get recent sessions for this disciplina
    const recentSessions = await db
      .select({
        id: schema.studySessions.id,
        topic: schema.studySessions.topic,
        duration_minutes: schema.studySessions.durationMinutes,
        self_rating: schema.studySessions.selfRating,
        notes: schema.studySessions.notes,
        started_at: schema.studySessions.startedAt,
        completed_at: schema.studySessions.completedAt,
      })
      .from(schema.studySessions)
      .where(
        and(
          eq(schema.studySessions.userId, userId),
          eq(schema.studySessions.disciplinaId, disciplinaId),
        ),
      )
      .orderBy(desc(schema.studySessions.startedAt))
      .limit(20);

    // Cross-reference topics with completed sessions
    const completedTopics = await db
      .select({ topic: schema.studySessions.topic })
      .from(schema.studySessions)
      .where(
        and(
          eq(schema.studySessions.userId, userId),
          eq(schema.studySessions.disciplinaId, disciplinaId),
        ),
      )
      .groupBy(schema.studySessions.topic);

    const completedTopicSet = new Set(completedTopics.map((t) => t.topic));

    const topicsList = Array.isArray(stats.topics)
      ? (stats.topics as string[]).map((name: string) => ({
          name,
          completed: completedTopicSet.has(name),
        }))
      : [];

    res.json({
      data: {
        disciplina,
        sessions: recentSessions,
        topics: topicsList,
      },
    });
  } catch (error) {
    console.error('Error fetching disciplina detail:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /progress/weekly — last 7 days histogram data
router.get('/weekly', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const dailyData = await db
      .select({
        date: sql<string>`DATE(${schema.studySessions.startedAt})`.as('session_date'),
        totalMinutes: sql<number>`COALESCE(SUM(${schema.studySessions.durationMinutes}), 0)`.as('total_minutes'),
        sessionCount: sql<number>`COUNT(${schema.studySessions.id})`.as('session_count'),
      })
      .from(schema.studySessions)
      .where(
        and(
          eq(schema.studySessions.userId, userId),
          gte(schema.studySessions.startedAt, sevenDaysAgo),
        ),
      )
      .groupBy(sql`DATE(${schema.studySessions.startedAt})`)
      .orderBy(sql`DATE(${schema.studySessions.startedAt})`);

    // Build full 7-day array (including days with no sessions)
    const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const dataMap = new Map(dailyData.map((d) => [d.date, d]));

    const histogram = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(sevenDaysAgo);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      const entry = dataMap.get(dateStr);

      histogram.push({
        date: dateStr,
        day_name: dayNames[date.getDay()],
        hours: entry ? Math.round((Number(entry.totalMinutes) / 60) * 10) / 10 : 0,
        sessions: entry ? Number(entry.sessionCount) : 0,
      });
    }

    res.json({ data: histogram });
  } catch (error) {
    console.error('Error fetching weekly data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
