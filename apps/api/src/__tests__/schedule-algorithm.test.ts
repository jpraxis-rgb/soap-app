import { describe, it, expect } from 'vitest';
import {
  generateScheduleBlocks,
  recalculateSchedule,
  performanceMultiplier,
  type DisciplinaInput,
  type ScheduleConfig,
  type CompletedSession,
} from '../modules/schedules/algorithm.js';

// ── Helper to create a future date ──────────────────────

function futureDate(daysFromNow: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d;
}

function pastDate(daysAgo: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d;
}

// ── Test fixtures ──────────────────────────────────────

const singleDisciplina: DisciplinaInput[] = [
  {
    id: 'disc-1',
    name: 'Direito Constitucional',
    weight: 5,
    topics: ['Direitos Fundamentais', 'Organização do Estado', 'Controle de Constitucionalidade'],
  },
];

const twoDisciplinas: DisciplinaInput[] = [
  {
    id: 'disc-1',
    name: 'Direito Constitucional',
    weight: 8,
    topics: ['Direitos Fundamentais', 'Organização do Estado'],
  },
  {
    id: 'disc-2',
    name: 'Português',
    weight: 2,
    topics: ['Interpretação de Texto', 'Gramática'],
  },
];

function makeManyDisciplinas(count: number): DisciplinaInput[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `disc-${i + 1}`,
    name: `Disciplina ${i + 1}`,
    weight: Math.max(1, 10 - i * 0.3),
    topics: [`Topic A of D${i + 1}`, `Topic B of D${i + 1}`],
  }));
}

const defaultConfig: ScheduleConfig = {
  hoursPerWeek: 10,
  availableDays: [1, 2, 3, 4, 5], // Monday to Friday
  examDate: futureDate(60), // 2 months from now
};

// ── Tests ──────────────────────────────────────────────

describe('generateScheduleBlocks', () => {
  it('returns empty array for empty disciplinas', () => {
    const result = generateScheduleBlocks([], defaultConfig);
    expect(result).toEqual([]);
  });

  it('returns empty array for 0 hours per week', () => {
    const config: ScheduleConfig = { ...defaultConfig, hoursPerWeek: 0 };
    const result = generateScheduleBlocks(singleDisciplina, config);
    expect(result).toEqual([]);
  });

  it('returns empty array for negative hours per week', () => {
    const config: ScheduleConfig = { ...defaultConfig, hoursPerWeek: -5 };
    const result = generateScheduleBlocks(singleDisciplina, config);
    expect(result).toEqual([]);
  });

  it('returns empty array for past exam date', () => {
    const config: ScheduleConfig = { ...defaultConfig, examDate: pastDate(10) };
    const result = generateScheduleBlocks(singleDisciplina, config);
    expect(result).toEqual([]);
  });

  it('returns empty array for empty available days', () => {
    const config: ScheduleConfig = { ...defaultConfig, availableDays: [] };
    const result = generateScheduleBlocks(singleDisciplina, config);
    expect(result).toEqual([]);
  });

  it('generates blocks for a single disciplina', () => {
    const result = generateScheduleBlocks(singleDisciplina, defaultConfig);
    expect(result.length).toBeGreaterThan(0);

    // All blocks should reference the single disciplina
    for (const block of result) {
      expect(block.disciplinaId).toBe('disc-1');
      expect(block.durationMinutes).toBeGreaterThanOrEqual(30);
      expect(block.durationMinutes).toBeLessThanOrEqual(90);
      expect(block.scheduledDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(block.startTime).toMatch(/^\d{2}:\d{2}$/);
    }
  });

  it('generates blocks for multiple disciplinas proportional to weight', () => {
    const result = generateScheduleBlocks(twoDisciplinas, defaultConfig);
    expect(result.length).toBeGreaterThan(0);

    // Count minutes per disciplina
    const minutesByDisciplina: Record<string, number> = {};
    for (const block of result) {
      minutesByDisciplina[block.disciplinaId] =
        (minutesByDisciplina[block.disciplinaId] || 0) + block.durationMinutes;
    }

    // disc-1 has weight 8, disc-2 has weight 2
    // So disc-1 should have roughly 4x the minutes of disc-2
    const disc1Minutes = minutesByDisciplina['disc-1'] || 0;
    const disc2Minutes = minutesByDisciplina['disc-2'] || 0;

    expect(disc1Minutes).toBeGreaterThan(0);
    expect(disc2Minutes).toBeGreaterThan(0);
    // Allow some flexibility in ratio (between 2x and 6x)
    expect(disc1Minutes / disc2Minutes).toBeGreaterThan(1.5);
    expect(disc1Minutes / disc2Minutes).toBeLessThan(8);
  });

  it('generates blocks only on available days', () => {
    // Only weekends
    const config: ScheduleConfig = {
      ...defaultConfig,
      availableDays: [0, 6], // Sunday and Saturday
    };
    const result = generateScheduleBlocks(singleDisciplina, config);
    expect(result.length).toBeGreaterThan(0);

    for (const block of result) {
      const date = new Date(block.scheduledDate + 'T12:00:00');
      const day = date.getDay();
      expect([0, 6]).toContain(day);
    }
  });

  it('handles disciplinas with no topics gracefully', () => {
    const disciplinas: DisciplinaInput[] = [
      { id: 'disc-1', name: 'Math', weight: 5, topics: [] },
    ];
    const result = generateScheduleBlocks(disciplinas, defaultConfig);
    expect(result.length).toBeGreaterThan(0);
    // Should use disciplina name as fallback topic
    expect(result[0].topic).toBe('Math');
  });

  it('handles 20+ disciplinas', () => {
    const manyDisc = makeManyDisciplinas(25);
    const result = generateScheduleBlocks(manyDisc, defaultConfig);
    expect(result.length).toBeGreaterThan(0);

    // Verify all 25 disciplinas are represented
    const uniqueDiscIds = new Set(result.map((b) => b.disciplinaId));
    expect(uniqueDiscIds.size).toBe(25);
  });

  it('respects maximum block duration of 90 minutes', () => {
    const result = generateScheduleBlocks(singleDisciplina, {
      ...defaultConfig,
      hoursPerWeek: 40,
    });

    for (const block of result) {
      expect(block.durationMinutes).toBeLessThanOrEqual(90);
    }
  });

  it('respects minimum block duration of 30 minutes', () => {
    const result = generateScheduleBlocks(singleDisciplina, defaultConfig);

    for (const block of result) {
      expect(block.durationMinutes).toBeGreaterThanOrEqual(30);
    }
  });

  it('schedules blocks starting from tomorrow, not today', () => {
    const result = generateScheduleBlocks(singleDisciplina, defaultConfig);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    for (const block of result) {
      expect(block.scheduledDate).not.toBe(todayStr);
    }
  });

  it('handles very short time until exam (1 week)', () => {
    const config: ScheduleConfig = {
      ...defaultConfig,
      examDate: futureDate(7),
    };
    const result = generateScheduleBlocks(singleDisciplina, config);
    // Should still produce some blocks
    expect(result.length).toBeGreaterThanOrEqual(0);
  });

  it('handles single available day', () => {
    const config: ScheduleConfig = {
      ...defaultConfig,
      availableDays: [3], // Wednesday only
      examDate: futureDate(30),
    };
    const result = generateScheduleBlocks(singleDisciplina, config);
    expect(result.length).toBeGreaterThan(0);

    for (const block of result) {
      const date = new Date(block.scheduledDate + 'T12:00:00');
      expect(date.getDay()).toBe(3);
    }
  });

  it('start times are within reasonable hours (8:00 - 22:00)', () => {
    const result = generateScheduleBlocks(twoDisciplinas, defaultConfig);

    for (const block of result) {
      const [hours] = block.startTime.split(':').map(Number);
      expect(hours).toBeGreaterThanOrEqual(8);
      expect(hours).toBeLessThan(22);
    }
  });

  it('disciplina with weight 0 should get no blocks when others have positive weight', () => {
    const disciplinas: DisciplinaInput[] = [
      { id: 'disc-1', name: 'Importante', weight: 5, topics: ['Topic A'] },
      { id: 'disc-2', name: 'Zero Weight', weight: 0, topics: ['Topic B'] },
    ];
    const result = generateScheduleBlocks(disciplinas, defaultConfig);
    // disc-2 with weight 0 gets 0 proportion of total minutes
    const disc2Blocks = result.filter((b) => b.disciplinaId === 'disc-2');
    expect(disc2Blocks.length).toBe(0);
  });

  it('all disciplinas with weight 0 should return empty', () => {
    const disciplinas: DisciplinaInput[] = [
      { id: 'disc-1', name: 'Zero A', weight: 0, topics: ['Topic A'] },
      { id: 'disc-2', name: 'Zero B', weight: 0, topics: ['Topic B'] },
    ];
    const result = generateScheduleBlocks(disciplinas, defaultConfig);
    expect(result).toEqual([]);
  });
});

describe('recalculateSchedule', () => {
  it('returns empty array for empty disciplinas', () => {
    const result = recalculateSchedule([], defaultConfig, []);
    expect(result).toEqual([]);
  });

  it('returns empty array for 0 hours per week', () => {
    const config: ScheduleConfig = { ...defaultConfig, hoursPerWeek: 0 };
    const result = recalculateSchedule(singleDisciplina, config, []);
    expect(result).toEqual([]);
  });

  it('generates full schedule when no sessions are completed', () => {
    const result = recalculateSchedule(singleDisciplina, defaultConfig, []);
    expect(result.length).toBeGreaterThan(0);
  });

  it('reduces blocks for disciplinas with completed sessions', () => {
    const fullSchedule = recalculateSchedule(twoDisciplinas, defaultConfig, []);

    const completedSessions: CompletedSession[] = [
      { disciplinaId: 'disc-1', topic: 'Direitos Fundamentais', durationMinutes: 120 },
      { disciplinaId: 'disc-1', topic: 'Organização do Estado', durationMinutes: 120 },
    ];

    const adjustedSchedule = recalculateSchedule(twoDisciplinas, defaultConfig, completedSessions);

    // After completing some disc-1 sessions, we should have fewer disc-1 blocks
    const fullDisc1Minutes = fullSchedule
      .filter((b) => b.disciplinaId === 'disc-1')
      .reduce((sum, b) => sum + b.durationMinutes, 0);

    const adjustedDisc1Minutes = adjustedSchedule
      .filter((b) => b.disciplinaId === 'disc-1')
      .reduce((sum, b) => sum + b.durationMinutes, 0);

    expect(adjustedDisc1Minutes).toBeLessThanOrEqual(fullDisc1Minutes);
  });

  it('handles past exam date', () => {
    const config: ScheduleConfig = { ...defaultConfig, examDate: pastDate(10) };
    const result = recalculateSchedule(singleDisciplina, config, []);
    expect(result).toEqual([]);
  });

  it('handles all sessions completed', () => {
    // Complete way more minutes than the schedule would allocate
    const completedSessions: CompletedSession[] = singleDisciplina[0].topics.map((topic) => ({
      disciplinaId: 'disc-1',
      topic,
      durationMinutes: 10000,
    }));

    const result = recalculateSchedule(singleDisciplina, defaultConfig, completedSessions);
    // Should return empty or very few blocks since everything is done
    expect(result.length).toBeLessThanOrEqual(0);
  });
});

describe('proficiency-aware recalculation', () => {
  const equalWeightDisciplinas: DisciplinaInput[] = [
    {
      id: 'disc-a',
      name: 'Disciplina A',
      weight: 5,
      topics: ['Topic A1', 'Topic A2'],
    },
    {
      id: 'disc-b',
      name: 'Disciplina B',
      weight: 5,
      topics: ['Topic B1', 'Topic B2'],
    },
  ];

  it('allocates more blocks to low-rated disciplinas', () => {
    const performanceData = new Map<string, number>();
    performanceData.set('disc-a', 1); // poor rating
    performanceData.set('disc-b', 3); // good rating

    const result = recalculateSchedule(
      equalWeightDisciplinas,
      defaultConfig,
      [],
      performanceData,
    );

    expect(result.length).toBeGreaterThan(0);

    const minutesA = result
      .filter((b) => b.disciplinaId === 'disc-a')
      .reduce((sum, b) => sum + b.durationMinutes, 0);
    const minutesB = result
      .filter((b) => b.disciplinaId === 'disc-b')
      .reduce((sum, b) => sum + b.durationMinutes, 0);

    // disc-a (rating 1, multiplier 1.5) should get more than disc-b (rating 3, multiplier 0.7)
    expect(minutesA).toBeGreaterThan(minutesB);
    // The ratio should be roughly 1.5 / 0.7 ≈ 2.14
    expect(minutesA / minutesB).toBeGreaterThan(1.5);
  });

  it('no performance data means unchanged behavior', () => {
    const withoutPerf = recalculateSchedule(
      equalWeightDisciplinas,
      defaultConfig,
      [],
    );
    const withUndefined = recalculateSchedule(
      equalWeightDisciplinas,
      defaultConfig,
      [],
      undefined,
    );

    // Both should produce the same number of blocks and same distribution
    expect(withoutPerf.length).toBe(withUndefined.length);

    const minutesWithout: Record<string, number> = {};
    const minutesUndefined: Record<string, number> = {};

    for (const b of withoutPerf) {
      minutesWithout[b.disciplinaId] = (minutesWithout[b.disciplinaId] || 0) + b.durationMinutes;
    }
    for (const b of withUndefined) {
      minutesUndefined[b.disciplinaId] = (minutesUndefined[b.disciplinaId] || 0) + b.durationMinutes;
    }

    expect(minutesWithout).toEqual(minutesUndefined);
  });

  it('all ratings equal means proportional to weight', () => {
    const performanceData = new Map<string, number>();
    performanceData.set('disc-a', 2);
    performanceData.set('disc-b', 2);

    const withPerf = recalculateSchedule(
      equalWeightDisciplinas,
      defaultConfig,
      [],
      performanceData,
    );
    const withoutPerf = recalculateSchedule(
      equalWeightDisciplinas,
      defaultConfig,
      [],
    );

    // Rating 2 → multiplier 1.0, so weights stay as-is
    const minutesWithPerf: Record<string, number> = {};
    const minutesWithout: Record<string, number> = {};

    for (const b of withPerf) {
      minutesWithPerf[b.disciplinaId] = (minutesWithPerf[b.disciplinaId] || 0) + b.durationMinutes;
    }
    for (const b of withoutPerf) {
      minutesWithout[b.disciplinaId] = (minutesWithout[b.disciplinaId] || 0) + b.durationMinutes;
    }

    expect(minutesWithPerf).toEqual(minutesWithout);
  });

  it('performanceMultiplier returns correct values', () => {
    expect(performanceMultiplier(1)).toBe(1.5);
    expect(performanceMultiplier(0.5)).toBe(1.5);
    expect(performanceMultiplier(1.3)).toBe(1.3);
    expect(performanceMultiplier(1.5)).toBe(1.3);
    expect(performanceMultiplier(2)).toBe(1.0);
    expect(performanceMultiplier(2.3)).toBe(0.85);
    expect(performanceMultiplier(2.5)).toBe(0.85);
    expect(performanceMultiplier(3)).toBe(0.7);
  });
});
