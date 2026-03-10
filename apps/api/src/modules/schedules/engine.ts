import { eq, and } from 'drizzle-orm';
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
  examDate: string; // ISO date string
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

  const config: ScheduleConfig = {
    hoursPerWeek: input.hoursPerWeek,
    availableDays: input.availableDays,
    examDate: new Date(input.examDate),
  };

  // Generate blocks using the algorithm
  const generatedBlocks = generateScheduleBlocks(disciplinaInputs, config);

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

  // Insert new blocks
  const insertedBlocks = [];
  for (const block of generatedBlocks) {
    const [inserted] = await db
      .insert(scheduleBlocks)
      .values({
        userId: input.userId,
        editalId: input.editalId,
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
  const hoursPerWeek = Math.round(totalMinutesPerWeek / weeks / 60);

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

  const newBlocks = recalculateSchedule(disciplinaInputs, config, completedSessions);

  // Delete old pending blocks (keep completed/skipped)
  const pendingBlocks = existingBlocks.filter((b) => b.status === 'pending');
  for (const block of pendingBlocks) {
    await db
      .delete(scheduleBlocks)
      .where(eq(scheduleBlocks.id, block.id));
  }

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
