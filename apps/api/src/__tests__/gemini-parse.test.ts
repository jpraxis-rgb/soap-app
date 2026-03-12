import { describe, it, expect, vi } from 'vitest';
import type { GeminiParseResult, ParsedDisciplina } from '../services/gemini.js';

/**
 * Since validateAndNormalize is a private method on GeminiService,
 * we test the same validation logic by extracting the normalization rules
 * into standalone functions that mirror the implementation.
 *
 * These tests verify the contract that parseEditalContent upholds:
 * - Weight clamping to [1, 10]
 * - Confidence clamping to [0, 1]
 * - Date format validation
 * - Missing field defaults
 * - Empty/malformed input handling
 */

// Re-implement the normalization logic for testing (mirrors GeminiService.validateAndNormalize)
function validateAndNormalize(raw: Partial<GeminiParseResult>): GeminiParseResult {
  const warnings: string[] = raw.warnings ? [...raw.warnings] : [];

  const disciplinas: ParsedDisciplina[] = [];
  if (Array.isArray(raw.disciplinas)) {
    for (const d of raw.disciplinas) {
      if (d && typeof d.name === 'string' && d.name.trim()) {
        disciplinas.push({
          name: d.name.trim(),
          weight: typeof d.weight === 'number' ? Math.max(1, Math.min(10, d.weight)) : 1,
          topics: Array.isArray(d.topics)
            ? d.topics.filter((t: unknown) => typeof t === 'string' && (t as string).trim())
            : [],
        });
      }
    }
  }

  // Normalize cargos array
  const cargos: Array<{ name: string; disciplinas: ParsedDisciplina[] }> = [];
  if (Array.isArray(raw.cargos)) {
    for (const c of raw.cargos) {
      if (c && typeof c.name === 'string' && c.name.trim()) {
        cargos.push({
          name: c.name.trim(),
          disciplinas: Array.isArray(c.disciplinas)
            ? c.disciplinas.filter((d: any) => d && typeof d.name === 'string' && d.name.trim()).map((d: any) => ({
                name: d.name.trim(),
                weight: typeof d.weight === 'number' ? Math.max(1, Math.min(10, d.weight)) : 1,
                topics: Array.isArray(d.topics) ? d.topics.filter((t: unknown) => typeof t === 'string' && (t as string).trim()) : [],
              }))
            : [],
        });
      }
    }
  }

  if (disciplinas.length === 0 && cargos.every((c) => c.disciplinas.length === 0)) {
    warnings.push('No disciplinas were extracted from the edital');
  }

  let examDate = raw.exam_date || null;
  if (examDate && !/^\d{4}-\d{2}-\d{2}$/.test(examDate)) {
    warnings.push(`Invalid exam_date format: ${examDate}`);
    examDate = null;
  }

  // Backward compat: derive cargo from first entry in cargos if not set
  let cargo = typeof raw.cargo === 'string' ? raw.cargo.trim() || null : null;
  if (!cargo && cargos.length > 0) {
    cargo = cargos[0].name;
  }

  return {
    disciplinas,
    cargos,
    banca: typeof raw.banca === 'string' ? raw.banca.trim() || null : null,
    orgao: typeof raw.orgao === 'string' ? raw.orgao.trim() || null : null,
    cargo,
    exam_date: examDate,
    confidence: typeof raw.confidence === 'number' ? Math.min(1, Math.max(0, raw.confidence)) : 0.5,
    warnings,
  };
}

// ── Empty Disciplinas ───────────────────────────────────

describe('Gemini Parse — Empty Disciplinas', () => {
  it('handles empty disciplinas array gracefully', () => {
    const result = validateAndNormalize({ disciplinas: [] });
    expect(result.disciplinas).toEqual([]);
    expect(result.warnings).toContain('No disciplinas were extracted from the edital');
  });

  it('handles missing disciplinas field', () => {
    const result = validateAndNormalize({});
    expect(result.disciplinas).toEqual([]);
    expect(result.warnings).toContain('No disciplinas were extracted from the edital');
  });

  it('handles null disciplinas', () => {
    const result = validateAndNormalize({ disciplinas: null as any });
    expect(result.disciplinas).toEqual([]);
  });
});

// ── Weight Normalization ────────────────────────────────

describe('Gemini Parse — Weight Normalization', () => {
  it('clamps weight below 1 to 1', () => {
    const result = validateAndNormalize({
      disciplinas: [{ name: 'Math', weight: -5, topics: [] }],
    });
    expect(result.disciplinas[0].weight).toBe(1);
  });

  it('clamps weight of 0 to 1', () => {
    const result = validateAndNormalize({
      disciplinas: [{ name: 'Math', weight: 0, topics: [] }],
    });
    expect(result.disciplinas[0].weight).toBe(1);
  });

  it('clamps weight above 10 to 10', () => {
    const result = validateAndNormalize({
      disciplinas: [{ name: 'Math', weight: 25, topics: [] }],
    });
    expect(result.disciplinas[0].weight).toBe(10);
  });

  it('keeps valid weights unchanged', () => {
    const result = validateAndNormalize({
      disciplinas: [{ name: 'Math', weight: 7, topics: [] }],
    });
    expect(result.disciplinas[0].weight).toBe(7);
  });

  it('defaults missing weight to 1', () => {
    const result = validateAndNormalize({
      disciplinas: [{ name: 'Math', topics: [] } as any],
    });
    expect(result.disciplinas[0].weight).toBe(1);
  });

  it('defaults non-numeric weight to 1', () => {
    const result = validateAndNormalize({
      disciplinas: [{ name: 'Math', weight: 'high' as any, topics: [] }],
    });
    expect(result.disciplinas[0].weight).toBe(1);
  });
});

// ── Date Validation ─────────────────────────────────────

describe('Gemini Parse — Date Validation', () => {
  it('accepts valid YYYY-MM-DD date', () => {
    const result = validateAndNormalize({ exam_date: '2026-06-15' });
    expect(result.exam_date).toBe('2026-06-15');
  });

  it('rejects date in wrong format (DD/MM/YYYY)', () => {
    const result = validateAndNormalize({ exam_date: '15/06/2026' });
    expect(result.exam_date).toBeNull();
    expect(result.warnings.some((w) => w.includes('Invalid exam_date format'))).toBe(true);
  });

  it('rejects partial date', () => {
    const result = validateAndNormalize({ exam_date: '2026-06' });
    expect(result.exam_date).toBeNull();
  });

  it('handles null exam_date', () => {
    const result = validateAndNormalize({ exam_date: null });
    expect(result.exam_date).toBeNull();
  });

  it('handles empty string exam_date', () => {
    const result = validateAndNormalize({ exam_date: '' });
    expect(result.exam_date).toBeNull();
  });

  it('rejects date with text', () => {
    const result = validateAndNormalize({ exam_date: 'June 15, 2026' });
    expect(result.exam_date).toBeNull();
  });
});

// ── Missing Fields / Defaults ───────────────────────────

describe('Gemini Parse — Defaults', () => {
  it('defaults banca to null when missing', () => {
    const result = validateAndNormalize({});
    expect(result.banca).toBeNull();
  });

  it('defaults orgao to null when missing', () => {
    const result = validateAndNormalize({});
    expect(result.orgao).toBeNull();
  });

  it('trims whitespace-only banca to null', () => {
    const result = validateAndNormalize({ banca: '   ' });
    expect(result.banca).toBeNull();
  });

  it('defaults confidence to 0.5 when missing', () => {
    const result = validateAndNormalize({});
    expect(result.confidence).toBe(0.5);
  });

  it('clamps confidence below 0 to 0', () => {
    const result = validateAndNormalize({ confidence: -0.5 });
    expect(result.confidence).toBe(0);
  });

  it('clamps confidence above 1 to 1', () => {
    const result = validateAndNormalize({ confidence: 1.5 });
    expect(result.confidence).toBe(1);
  });

  it('defaults warnings to empty array', () => {
    const result = validateAndNormalize({ disciplinas: [{ name: 'Math', weight: 5, topics: ['Algebra'] }] });
    // Should not contain the "no disciplinas" warning since we have one
    expect(result.warnings.filter((w) => w.includes('No disciplinas'))).toHaveLength(0);
  });

  it('preserves existing warnings', () => {
    const result = validateAndNormalize({
      warnings: ['Some LLM warning'],
      disciplinas: [{ name: 'Math', weight: 5, topics: [] }],
    });
    expect(result.warnings).toContain('Some LLM warning');
  });
});

// ── Malformed LLM Output ────────────────────────────────

describe('Gemini Parse — Malformed Input', () => {
  it('filters out disciplinas with empty name', () => {
    const result = validateAndNormalize({
      disciplinas: [
        { name: '', weight: 5, topics: ['Topic A'] },
        { name: 'Valid', weight: 3, topics: ['Topic B'] },
      ],
    });
    expect(result.disciplinas).toHaveLength(1);
    expect(result.disciplinas[0].name).toBe('Valid');
  });

  it('filters out disciplinas with whitespace-only name', () => {
    const result = validateAndNormalize({
      disciplinas: [
        { name: '   ', weight: 5, topics: [] },
      ],
    });
    expect(result.disciplinas).toHaveLength(0);
  });

  it('filters out null entries in disciplinas array', () => {
    const result = validateAndNormalize({
      disciplinas: [null, undefined, { name: 'Valid', weight: 5, topics: [] }] as any,
    });
    expect(result.disciplinas).toHaveLength(1);
  });

  it('filters non-string topics', () => {
    const result = validateAndNormalize({
      disciplinas: [
        { name: 'Math', weight: 5, topics: ['Valid', 123, null, '', 'Also Valid'] as any },
      ],
    });
    expect(result.disciplinas[0].topics).toEqual(['Valid', 'Also Valid']);
  });

  it('handles missing topics array', () => {
    const result = validateAndNormalize({
      disciplinas: [{ name: 'Math', weight: 5 } as any],
    });
    expect(result.disciplinas[0].topics).toEqual([]);
  });

  it('trims disciplina names', () => {
    const result = validateAndNormalize({
      disciplinas: [{ name: '  Direito Constitucional  ', weight: 5, topics: [] }],
    });
    expect(result.disciplinas[0].name).toBe('Direito Constitucional');
  });

  it('handles non-number banca gracefully', () => {
    const result = validateAndNormalize({ banca: 123 as any });
    expect(result.banca).toBeNull();
  });

  it('handles completely empty input', () => {
    const result = validateAndNormalize({});
    expect(result.disciplinas).toEqual([]);
    expect(result.banca).toBeNull();
    expect(result.orgao).toBeNull();
    expect(result.exam_date).toBeNull();
    expect(result.confidence).toBe(0.5);
    expect(result.warnings).toContain('No disciplinas were extracted from the edital');
  });
});
