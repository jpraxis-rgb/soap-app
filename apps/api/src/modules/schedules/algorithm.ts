/**
 * Schedule generation algorithm for SOAP.
 *
 * Core logic:
 * 1. Allocate total hours proportional to each disciplina's weight
 * 2. Within each disciplina, distribute hours evenly across topics
 * 3. Spread study blocks across available days, respecting exam_date deadline
 * 4. Each block is a manageable study session (30-90 minutes)
 *
 * For recalculation, completed sessions are subtracted from the remaining
 * allocation, and the remaining time is redistributed.
 */

export interface DisciplinaInput {
  id: string;
  name: string;
  weight: number;
  topics: string[];
}

export interface ScheduleConfig {
  hoursPerWeek: number;
  availableDays: number[]; // 0=Sunday, 1=Monday, ..., 6=Saturday
  examDate: Date;
  startDate?: Date; // Defaults to today
}

export interface GeneratedBlock {
  disciplinaId: string;
  topic: string;
  scheduledDate: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  durationMinutes: number;
}

export interface CompletedSession {
  disciplinaId: string;
  topic: string;
  durationMinutes: number;
}

/**
 * Minimum block duration in minutes.
 */
const MIN_BLOCK_MINUTES = 30;

/**
 * Maximum block duration in minutes.
 */
const MAX_BLOCK_MINUTES = 90;

/**
 * Default block duration in minutes.
 */
const DEFAULT_BLOCK_MINUTES = 45;

/**
 * Generate schedule blocks for a set of disciplinas.
 *
 * @param disciplinas - List of disciplinas with weights and topics
 * @param config - Schedule configuration (hours per week, available days, exam date)
 * @returns Array of generated schedule blocks
 */
export function generateScheduleBlocks(
  disciplinas: DisciplinaInput[],
  config: ScheduleConfig,
): GeneratedBlock[] {
  // Validate inputs
  if (disciplinas.length === 0) {
    return [];
  }

  if (config.hoursPerWeek <= 0) {
    return [];
  }

  if (config.availableDays.length === 0) {
    return [];
  }

  const startDate = config.startDate || new Date();
  const start = normalizeDate(startDate);
  const examDate = normalizeDate(config.examDate);

  // If exam date is in the past, return empty
  if (examDate <= start) {
    return [];
  }

  // Calculate total available days
  const availableDates = getAvailableDates(start, examDate, config.availableDays);
  if (availableDates.length === 0) {
    return [];
  }

  // Calculate total available hours until exam
  const totalWeeks = Math.max(1, Math.ceil(
    (examDate.getTime() - start.getTime()) / (7 * 24 * 60 * 60 * 1000),
  ));
  const totalAvailableMinutes = totalWeeks * config.hoursPerWeek * 60;

  // Calculate weight-proportional allocation for each disciplina
  const totalWeight = disciplinas.reduce((sum, d) => sum + d.weight, 0);
  if (totalWeight === 0) {
    return [];
  }

  // Build the list of topic blocks to schedule
  const topicBlocks: Array<{ disciplinaId: string; topic: string; minutes: number }> = [];

  for (const disciplina of disciplinas) {
    const proportion = disciplina.weight / totalWeight;
    const disciplinaMinutes = Math.round(totalAvailableMinutes * proportion);

    // Get topics (use disciplina name as fallback if no topics)
    const topics = disciplina.topics.length > 0
      ? disciplina.topics
      : [disciplina.name];

    // Distribute minutes evenly across topics
    const minutesPerTopic = Math.max(MIN_BLOCK_MINUTES, Math.round(disciplinaMinutes / topics.length));

    for (const topic of topics) {
      // Split large allocations into manageable blocks
      let remaining = minutesPerTopic;
      while (remaining >= MIN_BLOCK_MINUTES) {
        const blockDuration = Math.min(remaining, MAX_BLOCK_MINUTES);
        topicBlocks.push({
          disciplinaId: disciplina.id,
          topic,
          minutes: blockDuration,
        });
        remaining -= blockDuration;
      }
      // If there's a remainder smaller than MIN_BLOCK, add it to the last block if possible
      if (remaining > 0 && topicBlocks.length > 0) {
        const lastBlock = topicBlocks[topicBlocks.length - 1];
        if (lastBlock.disciplinaId === disciplina.id && lastBlock.topic === topic) {
          lastBlock.minutes = Math.min(lastBlock.minutes + remaining, MAX_BLOCK_MINUTES);
        }
      }
    }
  }

  if (topicBlocks.length === 0) {
    return [];
  }

  // Distribute blocks across available dates
  // Use round-robin across dates to ensure even spread
  const blocks: GeneratedBlock[] = [];
  const blocksPerDay = Math.max(1, Math.ceil(topicBlocks.length / availableDates.length));
  // Max blocks per day: don't exceed hours_per_week / available_days_per_week
  const maxDailyMinutes = Math.round((config.hoursPerWeek * 60) / config.availableDays.length);

  let dateIndex = 0;
  let dailyMinutes = 0;
  let startHour = 8; // Start at 8:00 AM
  let startMinute = 0;

  for (const block of topicBlocks) {
    if (dateIndex >= availableDates.length) {
      // Wrap around if we have more blocks than dates
      dateIndex = 0;
    }

    // Check if adding this block exceeds daily limit
    if (dailyMinutes + block.minutes > maxDailyMinutes && dailyMinutes > 0) {
      // Move to next date
      dateIndex++;
      if (dateIndex >= availableDates.length) {
        dateIndex = 0;
      }
      dailyMinutes = 0;
      startHour = 8;
      startMinute = 0;
    }

    const date = availableDates[dateIndex];
    const startTimeStr = `${String(startHour).padStart(2, '0')}:${String(startMinute).padStart(2, '0')}`;

    blocks.push({
      disciplinaId: block.disciplinaId,
      topic: block.topic,
      scheduledDate: formatDate(date),
      startTime: startTimeStr,
      durationMinutes: block.minutes,
    });

    // Advance time for next block on same day
    const totalMinutesAdvance = block.minutes + 15; // 15 min break between blocks
    startMinute += totalMinutesAdvance;
    startHour += Math.floor(startMinute / 60);
    startMinute = startMinute % 60;

    dailyMinutes += block.minutes;

    // If we've exceeded daily time or it's past 22:00, move to next date
    if (dailyMinutes >= maxDailyMinutes || startHour >= 22) {
      dateIndex++;
      dailyMinutes = 0;
      startHour = 8;
      startMinute = 0;
    }
  }

  return blocks;
}

/**
 * Recalculate schedule taking completed sessions into account.
 * Subtracts completed time from each disciplina/topic allocation and
 * redistributes remaining blocks.
 */
export function recalculateSchedule(
  disciplinas: DisciplinaInput[],
  config: ScheduleConfig,
  completedSessions: CompletedSession[],
): GeneratedBlock[] {
  if (disciplinas.length === 0 || config.hoursPerWeek <= 0) {
    return [];
  }

  // Calculate completed minutes per disciplina/topic
  const completedMap = new Map<string, number>();
  for (const session of completedSessions) {
    const key = `${session.disciplinaId}::${session.topic}`;
    completedMap.set(key, (completedMap.get(key) || 0) + session.durationMinutes);
  }

  // Also track completed minutes per disciplina (total)
  const disciplinaCompletedMap = new Map<string, number>();
  for (const session of completedSessions) {
    disciplinaCompletedMap.set(
      session.disciplinaId,
      (disciplinaCompletedMap.get(session.disciplinaId) || 0) + session.durationMinutes,
    );
  }

  // Adjust weights based on completion: reduce weight for disciplinas that have more done
  const totalWeight = disciplinas.reduce((sum, d) => sum + d.weight, 0);
  const startDate = config.startDate || new Date();
  const start = normalizeDate(startDate);
  const examDate = normalizeDate(config.examDate);

  if (examDate <= start) {
    return [];
  }

  const totalWeeks = Math.max(1, Math.ceil(
    (examDate.getTime() - start.getTime()) / (7 * 24 * 60 * 60 * 1000),
  ));
  const totalAvailableMinutes = totalWeeks * config.hoursPerWeek * 60;

  // Calculate what each disciplina "should" have and subtract completed
  const adjustedDisciplinas: DisciplinaInput[] = [];

  for (const disciplina of disciplinas) {
    const proportion = disciplina.weight / totalWeight;
    const targetMinutes = Math.round(totalAvailableMinutes * proportion);
    const completedMinutes = disciplinaCompletedMap.get(disciplina.id) || 0;
    const remainingMinutes = Math.max(0, targetMinutes - completedMinutes);

    if (remainingMinutes >= MIN_BLOCK_MINUTES) {
      // Recalculate effective weight based on remaining work
      const effectiveWeight = (remainingMinutes / totalAvailableMinutes) * totalWeight;

      // Filter out fully-covered topics
      const remainingTopics = disciplina.topics.filter((topic) => {
        const key = `${disciplina.id}::${topic}`;
        const topicCompleted = completedMap.get(key) || 0;
        const topicTarget = targetMinutes / Math.max(1, disciplina.topics.length);
        return topicCompleted < topicTarget;
      });

      adjustedDisciplinas.push({
        ...disciplina,
        weight: effectiveWeight > 0 ? effectiveWeight : disciplina.weight * 0.1,
        topics: remainingTopics.length > 0 ? remainingTopics : disciplina.topics,
      });
    }
  }

  if (adjustedDisciplinas.length === 0) {
    return [];
  }

  // Use today as the new start date for recalculation
  const newConfig: ScheduleConfig = {
    ...config,
    startDate: new Date(),
  };

  return generateScheduleBlocks(adjustedDisciplinas, newConfig);
}

// ── Helper functions ──────────────────────────────────

/**
 * Normalize a date to midnight UTC.
 */
function normalizeDate(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Get all available dates between start and exam date.
 */
function getAvailableDates(start: Date, examDate: Date, availableDays: number[]): Date[] {
  const dates: Date[] = [];
  const current = new Date(start);
  // Start from the day after today
  current.setDate(current.getDate() + 1);

  while (current < examDate) {
    if (availableDays.includes(current.getDay())) {
      dates.push(new Date(current));
    }
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

/**
 * Format a date as YYYY-MM-DD.
 */
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
