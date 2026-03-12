/**
 * Schedule generation algorithm for SOAP — Cyclic Distribution.
 *
 * Core logic:
 * 1. ALLOCATE hours per discipline (custom, equal, or weight-proportional)
 * 2. BUILD topic queues for each discipline
 * 3. CYCLIC ROSTER rotates disciplines across study days
 * 4. SCHEDULE DAYS respects per-day hours from config
 * 5. Each day has exactly `disciplinesPerDay` different subjects
 *
 * For recalculation, completed sessions are subtracted and remaining
 * time is redistributed using the same cyclic approach.
 */

export interface DisciplinaInput {
  id: string;
  name: string;
  weight: number | null;
  topics: string[];
}

export interface ScheduleConfig {
  hoursPerWeek: number;
  availableDays: number[]; // 0=Sunday, 1=Monday, ..., 6=Saturday
  examDate: Date;
  startDate?: Date;
  dayHours?: Record<number, number>; // JS day → hours (per-day config)
  disciplinesPerDay?: number; // default 3
  customAllocations?: Record<string, number>; // disciplinaId → hours
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

const MIN_BLOCK_MINUTES = 30;
const MAX_BLOCK_MINUTES = 90;

/**
 * Generate schedule blocks using cyclic distribution.
 */
export function generateScheduleBlocks(
  disciplinas: DisciplinaInput[],
  config: ScheduleConfig,
): GeneratedBlock[] {
  if (disciplinas.length === 0) return [];

  const startDate = config.startDate || new Date();
  const start = normalizeDate(startDate);
  const examDate = normalizeDate(config.examDate);

  if (examDate <= start) return [];

  const availableDates = getAvailableDates(start, examDate, config.availableDays);
  if (availableDates.length === 0) return [];

  const disciplinesPerDay = Math.min(
    config.disciplinesPerDay || 3,
    disciplinas.length,
  );

  // Calculate total available minutes
  const totalWeeks = Math.max(1, Math.ceil(
    (examDate.getTime() - start.getTime()) / (7 * 24 * 60 * 60 * 1000),
  ));
  const totalAvailableMinutes = totalWeeks * config.hoursPerWeek * 60;

  // 1. ALLOCATE — compute minutes per discipline
  const allocations = computeAllocations(disciplinas, totalAvailableMinutes, config.customAllocations);

  // 2. BUILD TOPIC QUEUES
  const topicQueues = buildTopicQueues(disciplinas, allocations);

  // 3. Determine start time base from preferred_time
  const baseHour = getBaseHour(config);

  // 4. CYCLIC ROSTER — sort disciplines by allocation desc
  const sortedDisciplinas = [...disciplinas].sort((a, b) => {
    const allocA = allocations.get(a.id) || 0;
    const allocB = allocations.get(b.id) || 0;
    return allocB - allocA;
  });

  let rosterPointer = 0;
  const blocks: GeneratedBlock[] = [];

  // 5. SCHEDULE DAYS
  for (const date of availableDates) {
    const dayOfWeek = date.getDay();
    const dailyMinutes = getDailyMinutes(dayOfWeek, config);
    if (dailyMinutes <= 0) continue;

    // Pick next N disciplines from the rotating roster
    const pickedDisciplinas: DisciplinaInput[] = [];
    for (let i = 0; i < disciplinesPerDay; i++) {
      const idx = (rosterPointer + i) % sortedDisciplinas.length;
      pickedDisciplinas.push(sortedDisciplinas[idx]);
    }
    rosterPointer = (rosterPointer + disciplinesPerDay) % sortedDisciplinas.length;

    // Split daily minutes proportionally among picked disciplines
    const pickedTotalAlloc = pickedDisciplinas.reduce(
      (sum, d) => sum + (allocations.get(d.id) || 1),
      0,
    );

    let currentHour = baseHour;
    let currentMinute = 0;

    for (const disciplina of pickedDisciplinas) {
      const queue = topicQueues.get(disciplina.id);
      if (!queue || queue.length === 0) continue;

      const share = pickedTotalAlloc > 0
        ? Math.round((dailyMinutes * (allocations.get(disciplina.id) || 1)) / pickedTotalAlloc)
        : Math.round(dailyMinutes / disciplinesPerDay);

      if (share < MIN_BLOCK_MINUTES) continue;

      // Create blocks from the topic queue
      let remaining = share;
      while (remaining >= MIN_BLOCK_MINUTES && queue.length > 0) {
        const topicEntry = queue[0];
        const blockDuration = Math.min(remaining, MAX_BLOCK_MINUTES, topicEntry.remainingMinutes);

        if (blockDuration < MIN_BLOCK_MINUTES) {
          // If remaining in this topic is too small, merge with next or skip
          if (remaining >= MIN_BLOCK_MINUTES) {
            // Use minimum block with this topic
            const finalDuration = Math.min(remaining, MAX_BLOCK_MINUTES);
            blocks.push({
              disciplinaId: disciplina.id,
              topic: topicEntry.topic,
              scheduledDate: formatDate(date),
              startTime: formatTime(currentHour, currentMinute),
              durationMinutes: finalDuration,
            });
            const adv = finalDuration + 10;
            currentMinute += adv;
            currentHour += Math.floor(currentMinute / 60);
            currentMinute = currentMinute % 60;
            remaining -= finalDuration;
          }
          queue.shift();
          continue;
        }

        blocks.push({
          disciplinaId: disciplina.id,
          topic: topicEntry.topic,
          scheduledDate: formatDate(date),
          startTime: formatTime(currentHour, currentMinute),
          durationMinutes: blockDuration,
        });

        topicEntry.remainingMinutes -= blockDuration;
        if (topicEntry.remainingMinutes < MIN_BLOCK_MINUTES) {
          queue.shift();
        }

        const advance = blockDuration + 10;
        currentMinute += advance;
        currentHour += Math.floor(currentMinute / 60);
        currentMinute = currentMinute % 60;
        remaining -= blockDuration;

        if (currentHour >= 22) break;
      }
    }
  }

  return blocks;
}

/**
 * Compute allocation (total minutes) per discipline.
 */
function computeAllocations(
  disciplinas: DisciplinaInput[],
  totalMinutes: number,
  customAllocations?: Record<string, number>,
): Map<string, number> {
  const allocations = new Map<string, number>();

  // If custom allocations provided, use them first
  if (customAllocations) {
    let remainingMinutes = totalMinutes;
    const unallocated: DisciplinaInput[] = [];

    for (const d of disciplinas) {
      if (customAllocations[d.id] != null) {
        const minutes = customAllocations[d.id] * 60;
        allocations.set(d.id, minutes);
        remainingMinutes -= minutes;
      } else {
        unallocated.push(d);
      }
    }

    // Distribute remaining among unallocated
    if (unallocated.length > 0 && remainingMinutes > 0) {
      const perDisc = remainingMinutes / unallocated.length;
      for (const d of unallocated) {
        allocations.set(d.id, perDisc);
      }
    }
    return allocations;
  }

  // Check if all weights are null
  const allNullWeights = disciplinas.every(d => d.weight == null);

  if (allNullWeights) {
    // Equal distribution
    const perDisc = totalMinutes / disciplinas.length;
    for (const d of disciplinas) {
      allocations.set(d.id, perDisc);
    }
  } else {
    // Weight-proportional (null weight treated as 1)
    const totalWeight = disciplinas.reduce((sum, d) => sum + (d.weight ?? 1), 0);
    for (const d of disciplinas) {
      const w = d.weight ?? 1;
      allocations.set(d.id, Math.round((w / totalWeight) * totalMinutes));
    }
  }

  return allocations;
}

/**
 * Build ordered topic queues for each discipline.
 */
function buildTopicQueues(
  disciplinas: DisciplinaInput[],
  allocations: Map<string, number>,
): Map<string, Array<{ topic: string; remainingMinutes: number }>> {
  const queues = new Map<string, Array<{ topic: string; remainingMinutes: number }>>();

  for (const d of disciplinas) {
    const totalMinutes = allocations.get(d.id) || 0;
    const topics = d.topics.length > 0 ? d.topics : [d.name];
    const minutesPerTopic = Math.max(MIN_BLOCK_MINUTES, Math.round(totalMinutes / topics.length));

    queues.set(
      d.id,
      topics.map(topic => ({ topic, remainingMinutes: minutesPerTopic })),
    );
  }

  return queues;
}

/**
 * Get daily minutes for a given day of week from config.
 */
function getDailyMinutes(dayOfWeek: number, config: ScheduleConfig): number {
  if (config.dayHours && config.dayHours[dayOfWeek] != null) {
    return config.dayHours[dayOfWeek] * 60;
  }
  // Fallback: distribute hours_per_week evenly across available days
  if (config.availableDays.length === 0) return 0;
  return Math.round((config.hoursPerWeek * 60) / config.availableDays.length);
}

/**
 * Get base start hour from config (preferred time).
 */
function getBaseHour(config: ScheduleConfig): number {
  // Infer from dayHours or use default
  // We don't have preferred_time in ScheduleConfig here, so use 8 AM default
  return 8;
}

/**
 * Performance multiplier based on average self-rating.
 */
export function performanceMultiplier(avgRating: number): number {
  if (avgRating <= 1) return 1.5;
  if (avgRating <= 1.5) return 1.3;
  if (avgRating <= 2) return 1.0;
  if (avgRating <= 2.5) return 0.85;
  return 0.7;
}

/**
 * Recalculate schedule using the same cyclic approach, subtracting completed sessions.
 */
export function recalculateSchedule(
  disciplinas: DisciplinaInput[],
  config: ScheduleConfig,
  completedSessions: CompletedSession[],
  performanceData?: Map<string, number>,
): GeneratedBlock[] {
  if (disciplinas.length === 0 || config.hoursPerWeek <= 0) return [];

  const startDate = config.startDate || new Date();
  const start = normalizeDate(startDate);
  const examDate = normalizeDate(config.examDate);
  if (examDate <= start) return [];

  const totalWeeks = Math.max(1, Math.ceil(
    (examDate.getTime() - start.getTime()) / (7 * 24 * 60 * 60 * 1000),
  ));
  const totalAvailableMinutes = totalWeeks * config.hoursPerWeek * 60;

  // Calculate completed minutes per disciplina
  const disciplinaCompletedMap = new Map<string, number>();
  for (const session of completedSessions) {
    disciplinaCompletedMap.set(
      session.disciplinaId,
      (disciplinaCompletedMap.get(session.disciplinaId) || 0) + session.durationMinutes,
    );
  }

  // Track completed per topic
  const completedPerTopic = new Map<string, number>();
  for (const session of completedSessions) {
    const key = `${session.disciplinaId}::${session.topic}`;
    completedPerTopic.set(key, (completedPerTopic.get(key) || 0) + session.durationMinutes);
  }

  // Compute original allocations
  const allNullWeights = disciplinas.every(d => d.weight == null);
  const totalWeight = allNullWeights
    ? disciplinas.length
    : disciplinas.reduce((sum, d) => sum + (d.weight ?? 1), 0);

  const adjustedDisciplinas: DisciplinaInput[] = [];

  for (const disciplina of disciplinas) {
    const w = allNullWeights ? 1 : (disciplina.weight ?? 1);
    const targetMinutes = Math.round((w / totalWeight) * totalAvailableMinutes);
    const completedMinutes = disciplinaCompletedMap.get(disciplina.id) || 0;
    const remainingMinutes = Math.max(0, targetMinutes - completedMinutes);

    if (remainingMinutes >= MIN_BLOCK_MINUTES) {
      let effectiveWeight = w * (remainingMinutes / targetMinutes);

      const rating = performanceData?.get(disciplina.id);
      if (rating !== undefined) {
        effectiveWeight *= performanceMultiplier(rating);
      }

      // Filter out fully-covered topics
      const remainingTopics = disciplina.topics.filter((topic) => {
        const key = `${disciplina.id}::${topic}`;
        const topicCompleted = completedPerTopic.get(key) || 0;
        const topicTarget = targetMinutes / Math.max(1, disciplina.topics.length);
        return topicCompleted < topicTarget;
      });

      adjustedDisciplinas.push({
        ...disciplina,
        weight: effectiveWeight > 0 ? effectiveWeight : 0.1,
        topics: remainingTopics.length > 0 ? remainingTopics : disciplina.topics,
      });
    }
  }

  if (adjustedDisciplinas.length === 0) return [];

  const newConfig: ScheduleConfig = {
    ...config,
    startDate: new Date(),
  };

  return generateScheduleBlocks(adjustedDisciplinas, newConfig);
}

// ── Helper functions ──────────────────────────────────

function normalizeDate(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getAvailableDates(start: Date, examDate: Date, availableDays: number[]): Date[] {
  const dates: Date[] = [];
  const current = new Date(start);
  current.setDate(current.getDate() + 1);

  while (current < examDate) {
    if (availableDays.includes(current.getDay())) {
      dates.push(new Date(current));
    }
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatTime(hour: number, minute: number): string {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}
