import { eq, and, gte, sql } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { editais, disciplinas, scheduleBlocks, studySessions } from '../../db/schema.js';
import {
  generateScheduleBlocks,
  recalculateSchedule,
  type DisciplinaInput,
  type ScheduleConfig,
  type CompletedSession,
} from './algorithm.js';

export interface GenerateScheduleInput {
  userId: string;
  editalId: string;
  hoursPerWeek: number;
  availableDays: number[];
  examDate?: string; // ISO date string, defaults to 12 weeks from now
}

export interface GenerateScheduleResult {
  blocks: Array<{
    id: string;
    disciplinaId: string | null;
    topic: string;
    scheduledDate: string;
    startTime: string;
    durationMinutes: number;
    status: string;
  }>;
  summary: {
    totalBlocks: number;
    totalMinutes: number;
    disciplinaCoverage: Record<string, number>;
  };
}

/**
 * Generate a study schedule for a given edital.
 */
export async function generateSchedule(
  input: GenerateScheduleInput,
): Promise<GenerateScheduleResult | { error: string }> {
  // Validate edital exists and belongs to user
  const [edital] = await db
    .select()
    .from(editais)
    .where(eq(editais.id, input.editalId));

  if (!edital) {
    return { error: 'Edital not found' };
  }

  if (edital.userId !== input.userId) {
    return { error: 'Unauthorized' };
  }

  // Get disciplinas for this edital
  const editalDisciplinas = await db
    .select()
    .from(disciplinas)
    .where(eq(disciplinas.editalId, input.editalId));

  if (editalDisciplinas.length === 0) {
    return { error: 'No disciplinas found for this edital. Please parse the edital first.' };
  }

  // Convert to algorithm input format
  const disciplinaInputs: DisciplinaInput[] = editalDisciplinas.map((d) => ({
    id: d.id,
    name: d.name || 'Unknown',
    weight: d.weight,
    topics: extractTopics(d.topics),
  }));

  // Default exam date to 12 weeks from now if not provided or in the past
  const fallbackDate = new Date(Date.now() + 12 * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  let examDateStr = fallbackDate;
  if (input.examDate && input.examDate.trim()) {
    const parsed = new Date(input.examDate);
    if (!isNaN(parsed.getTime()) && parsed > new Date()) {
      examDateStr = input.examDate;
    } else {
      console.log(`[Schedule] Exam date "${input.examDate}" is in the past or invalid, using fallback: ${fallbackDate}`);
    }
  }

  // Convert mobile day indices (0=Mon..6=Sun) to JS day-of-week (0=Sun..6=Sat)
  const jsDays = input.availableDays.map(d => (d + 1) % 7);

  const config: ScheduleConfig = {
    hoursPerWeek: input.hoursPerWeek,
    availableDays: jsDays,
    examDate: new Date(examDateStr),
  };

  console.log('[Schedule] Generating:', { disciplinas: disciplinaInputs.length, examDate: examDateStr, jsDays, hoursPerWeek: input.hoursPerWeek });

  // Generate blocks using the algorithm
  const generatedBlocks = generateScheduleBlocks(disciplinaInputs, config);

  console.log(`[Schedule] Algorithm produced ${generatedBlocks.length} blocks`);

  if (generatedBlocks.length === 0) {
    return { error: 'Could not generate schedule. Check your parameters (exam date, available hours).' };
  }

  // Delete existing schedule blocks for this edital/user
  await db
    .delete(scheduleBlocks)
    .where(
      and(
        eq(scheduleBlocks.userId, input.userId),
        eq(scheduleBlocks.editalId, input.editalId),
      ),
    );

  // Batch insert blocks (chunks of 50 to avoid query size limits)
  const blockValues = generatedBlocks.map((block) => ({
    userId: input.userId,
    editalId: input.editalId,
    disciplinaId: block.disciplinaId,
    topic: block.topic.length > 490 ? block.topic.slice(0, 490) + '...' : block.topic,
    scheduledDate: block.scheduledDate,
    startTime: block.startTime,
    durationMinutes: block.durationMinutes,
  }));

  const insertedBlocks = [];
  const BATCH_SIZE = 50;
  for (let i = 0; i < blockValues.length; i += BATCH_SIZE) {
    const batch = blockValues.slice(i, i + BATCH_SIZE);
    const inserted = await db
      .insert(scheduleBlocks)
      .values(batch)
      .returning();
    insertedBlocks.push(...inserted);
  }

  console.log(`[Schedule] Inserted ${insertedBlocks.length} blocks to DB`);

  // Build summary
  const disciplinaCoverage: Record<string, number> = {};
  let totalMinutes = 0;
  for (const block of insertedBlocks) {
    const dName = editalDisciplinas.find((d) => d.id === block.disciplinaId)?.name || 'Unknown';
    disciplinaCoverage[dName] = (disciplinaCoverage[dName] || 0) + block.durationMinutes;
    totalMinutes += block.durationMinutes;
  }

  return {
    blocks: insertedBlocks.map((b) => ({
      id: b.id,
      disciplinaId: b.disciplinaId,
      topic: b.topic,
      scheduledDate: b.scheduledDate,
      startTime: b.startTime,
      durationMinutes: b.durationMinutes,
      status: b.status,
    })),
    summary: {
      totalBlocks: insertedBlocks.length,
      totalMinutes,
      disciplinaCoverage,
    },
  };
}

/**
 * Recalculate schedule considering completed sessions.
 */
export async function recalculateExistingSchedule(
  editalId: string,
  userId: string,
): Promise<GenerateScheduleResult | { error: string }> {
  // Validate edital
  const [edital] = await db
    .select()
    .from(editais)
    .where(eq(editais.id, editalId));

  if (!edital) {
    return { error: 'Edital not found' };
  }

  if (edital.userId !== userId) {
    return { error: 'Unauthorized' };
  }

  // Get disciplinas
  const editalDisciplinas = await db
    .select()
    .from(disciplinas)
    .where(eq(disciplinas.editalId, editalId));

  if (editalDisciplinas.length === 0) {
    return { error: 'No disciplinas found for this edital' };
  }

  // Get existing schedule blocks to extract config
  const existingBlocks = await db
    .select()
    .from(scheduleBlocks)
    .where(
      and(
        eq(scheduleBlocks.userId, userId),
        eq(scheduleBlocks.editalId, editalId),
      ),
    );

  if (existingBlocks.length === 0) {
    return { error: 'No existing schedule found. Generate a schedule first.' };
  }

  // Get completed study sessions for this edital
  const sessions = await db
    .select()
    .from(studySessions)
    .where(eq(studySessions.userId, userId));

  // Filter sessions that belong to this edital's disciplinas
  const editalDisciplinaIds = new Set(editalDisciplinas.map((d) => d.id));
  const completedSessions: CompletedSession[] = sessions
    .filter((s) => s.disciplinaId && editalDisciplinaIds.has(s.disciplinaId))
    .map((s) => ({
      disciplinaId: s.disciplinaId!,
      topic: s.topic,
      durationMinutes: s.durationMinutes,
    }));

  // Infer config from existing blocks
  const scheduledDates = existingBlocks.map((b) => new Date(b.scheduledDate));
  const availableDaysSet = new Set(scheduledDates.map((d) => d.getDay()));
  const totalMinutesPerWeek = existingBlocks.reduce((sum, b) => sum + b.durationMinutes, 0);
  const weeks = Math.max(1, Math.ceil(existingBlocks.length / (availableDaysSet.size * 3)));
  const hoursPerWeek = totalMinutesPerWeek / weeks / 60;

  // Use edital exam date or last scheduled date + 1 week
  const examDate = edital.examDate
    || new Date(Math.max(...scheduledDates.map((d) => d.getTime())) + 7 * 24 * 60 * 60 * 1000);

  const disciplinaInputs: DisciplinaInput[] = editalDisciplinas.map((d) => ({
    id: d.id,
    name: d.name || 'Unknown',
    weight: d.weight,
    topics: extractTopics(d.topics),
  }));

  const config: ScheduleConfig = {
    hoursPerWeek: hoursPerWeek || 10,
    availableDays: Array.from(availableDaysSet),
    examDate: new Date(examDate),
  };

  // Get avg self-rating per disciplina
  const ratingResults = await db
    .select({
      disciplinaId: studySessions.disciplinaId,
      avgRating: sql<number>`avg(${studySessions.selfRating})`,
    })
    .from(studySessions)
    .where(eq(studySessions.userId, userId))
    .groupBy(studySessions.disciplinaId);

  const performanceData = new Map<string, number>();
  for (const r of ratingResults) {
    if (r.disciplinaId && r.avgRating) {
      performanceData.set(r.disciplinaId, Number(r.avgRating));
    }
  }

  const newBlocks = recalculateSchedule(disciplinaInputs, config, completedSessions, performanceData);

  // Delete future pending blocks (date >= today, keep completed/skipped and past pending)
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  await db
    .delete(scheduleBlocks)
    .where(
      and(
        eq(scheduleBlocks.userId, userId),
        eq(scheduleBlocks.editalId, editalId),
        eq(scheduleBlocks.status, 'pending'),
        gte(scheduleBlocks.scheduledDate, today),
      ),
    );

  // Insert new blocks
  const insertedBlocks = [];
  for (const block of newBlocks) {
    const [inserted] = await db
      .insert(scheduleBlocks)
      .values({
        userId,
        editalId,
        disciplinaId: block.disciplinaId,
        topic: block.topic,
        scheduledDate: block.scheduledDate,
        startTime: block.startTime,
        durationMinutes: block.durationMinutes,
      })
      .returning();
    insertedBlocks.push(inserted);
  }

  // Build summary
  const disciplinaCoverage: Record<string, number> = {};
  let totalMinutes = 0;
  for (const block of insertedBlocks) {
    const dName = editalDisciplinas.find((d) => d.id === block.disciplinaId)?.name || 'Unknown';
    disciplinaCoverage[dName] = (disciplinaCoverage[dName] || 0) + block.durationMinutes;
    totalMinutes += block.durationMinutes;
  }

  return {
    blocks: insertedBlocks.map((b) => ({
      id: b.id,
      disciplinaId: b.disciplinaId,
      topic: b.topic,
      scheduledDate: b.scheduledDate,
      startTime: b.startTime,
      durationMinutes: b.durationMinutes,
      status: b.status,
    })),
    summary: {
      totalBlocks: insertedBlocks.length,
      totalMinutes,
      disciplinaCoverage,
    },
  };
}

// ── Helpers ──────────────────────────────────────────

/**
 * Extract topics array from the jsonb topics field.
 */
function extractTopics(topics: unknown): string[] {
  if (!topics) return [];

  if (typeof topics === 'object' && topics !== null) {
    const obj = topics as Record<string, unknown>;
    if (Array.isArray(obj.items)) {
      return obj.items.filter((t): t is string => typeof t === 'string');
    }
  }

  if (Array.isArray(topics)) {
    return topics.filter((t): t is string => typeof t === 'string');
  }

  return [];
}
