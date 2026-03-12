import { eq } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { editais, disciplinas, concursos, editalTemplates } from '../../db/schema.js';
import { GeminiService, getGeminiService, isGeminiAvailable } from '../../services/gemini.js';
import type { GeminiParseResult } from '../../services/gemini.js';
import { EditalStatus } from '@soap/shared';

export interface ParseEditalInput {
  userId: string;
  sourceUrl: string;
  sourceType: 'url' | 'pdf';
  rawContent?: string;
  concursoId?: string;
}

export interface ParseEditalResult {
  edital: {
    id: string;
    status: string;
    sourceUrl: string;
    sourceType: string;
    parsedData: Record<string, unknown> | null;
    examDate: Date | null;
  };
  disciplinas: Array<{
    id: string;
    name: string | null;
    weight: number | null;
    topics: unknown;
    orderIndex: number;
  }>;
  warnings: string[];
}

/**
 * Parse an edital using Gemini and store the results.
 */
export async function parseEdital(
  input: ParseEditalInput,
  geminiService?: GeminiService,
): Promise<ParseEditalResult> {
  // Check Gemini availability before attempting parse
  if (!geminiService && !isGeminiAvailable()) {
    throw new Error('GEMINI_API_KEY not configured. Set a valid API key in .env to parse editais.');
  }

  const service = geminiService || getGeminiService();

  // Parse with Gemini
  let parseResult: GeminiParseResult;
  if (input.rawContent) {
    parseResult = await service.parseEditalContent(input.rawContent);
  } else {
    parseResult = await service.parseEditalFromUrl(input.sourceUrl);
  }

  // Find or create concurso if banca/orgao were extracted
  let concursoId = input.concursoId || null;
  if (!concursoId && (parseResult.banca || parseResult.orgao)) {
    const [newConcurso] = await db
      .insert(concursos)
      .values({
        name: parseResult.orgao || 'Unknown',
        banca: parseResult.banca || 'Unknown',
        orgao: parseResult.orgao || 'Unknown',
        year: new Date().getFullYear(),
      })
      .returning();
    concursoId = newConcurso.id;
  }

  // Determine exam date
  let examDate: Date | null = null;
  if (parseResult.exam_date) {
    examDate = new Date(parseResult.exam_date);
    if (isNaN(examDate.getTime())) {
      examDate = null;
    }
  }

  // Determine status based on confidence
  const status = parseResult.disciplinas.length > 0
    ? EditalStatus.PARSED
    : EditalStatus.PENDING;

  // Insert edital
  const [edital] = await db
    .insert(editais)
    .values({
      userId: input.userId,
      concursoId: concursoId,
      sourceUrl: input.sourceUrl,
      sourceType: input.sourceType,
      rawContent: input.rawContent || null,
      parsedData: {
        banca: parseResult.banca,
        orgao: parseResult.orgao,
        cargo: parseResult.cargo,
        cargos: parseResult.cargos,
        confidence: parseResult.confidence,
        warnings: parseResult.warnings,
        raw_disciplinas: parseResult.disciplinas,
      },
      status,
      examDate: examDate,
    })
    .returning();

  // Insert disciplinas
  const insertedDisciplinas = [];
  for (let i = 0; i < parseResult.disciplinas.length; i++) {
    const d = parseResult.disciplinas[i];
    const [inserted] = await db
      .insert(disciplinas)
      .values({
        editalId: edital.id,
        name: d.name,
        weight: d.weight != null ? Math.max(1, Math.min(10, d.weight)) : null,
        topics: { items: d.topics },
        orderIndex: i,
      })
      .returning();
    insertedDisciplinas.push(inserted);
  }

  return {
    edital: {
      id: edital.id,
      status: edital.status,
      sourceUrl: edital.sourceUrl,
      sourceType: edital.sourceType,
      parsedData: edital.parsedData as Record<string, unknown> | null,
      examDate: edital.examDate,
    },
    disciplinas: insertedDisciplinas.map((d) => ({
      id: d.id,
      name: d.name,
      weight: d.weight,
      topics: d.topics,
      orderIndex: d.orderIndex,
    })),
    warnings: parseResult.warnings,
  };
}

/**
 * Get an edital with its disciplinas.
 */
export async function getEditalWithDisciplinas(editalId: string) {
  const [edital] = await db
    .select()
    .from(editais)
    .where(eq(editais.id, editalId));

  if (!edital) {
    return null;
  }

  const editalDisciplinas = await db
    .select()
    .from(disciplinas)
    .where(eq(disciplinas.editalId, editalId));

  return {
    edital,
    disciplinas: editalDisciplinas,
  };
}

/**
 * Create an edital from a pre-parsed template.
 */
export async function createEditalFromTemplate(
  userId: string,
  templateId: string,
  cargoName?: string,
): Promise<ParseEditalResult> {
  const [template] = await db
    .select()
    .from(editalTemplates)
    .where(eq(editalTemplates.id, templateId));

  if (!template) {
    throw new Error('Template not found');
  }

  const templateDisciplinas = template.disciplinas as Array<{
    name: string;
    weight: number | null;
    topics: string[];
    category: 'geral' | 'especifico';
    orderIndex: number;
  }>;

  const templateCargos = template.cargos as Array<{
    name: string;
    disciplinas: Array<{
      name: string;
      weight: number | null;
      topics: string[];
      category: 'geral' | 'especifico';
      orderIndex: number;
    }>;
  }> | null;

  // Determine which disciplinas to use
  let finalDisciplinas = templateDisciplinas;
  let selectedCargo = cargoName || '';

  if (cargoName && templateCargos) {
    const cargo = templateCargos.find(c => c.name === cargoName);
    if (!cargo) {
      throw new Error(`Cargo "${cargoName}" not found in template`);
    }
    selectedCargo = cargo.name;
    // Merge shared (geral) disciplinas + cargo-specific disciplinas
    const cargoDiscs = cargo.disciplinas.map((d, i) => ({
      ...d,
      orderIndex: templateDisciplinas.length + i,
    }));
    finalDisciplinas = [...templateDisciplinas, ...cargoDiscs];
  }

  // Insert edital
  const [edital] = await db
    .insert(editais)
    .values({
      userId,
      concursoId: template.concursoId,
      sourceUrl: `template://${templateId}`,
      sourceType: 'template',
      rawContent: null,
      parsedData: {
        banca: template.banca,
        orgao: template.orgao,
        cargo: selectedCargo,
        cargos: templateCargos,
        confidence: 1.0,
        warnings: [],
        raw_disciplinas: finalDisciplinas,
      },
      status: EditalStatus.PARSED,
      examDate: template.examDate,
    })
    .returning();

  // Insert disciplinas
  const insertedDisciplinas = [];
  for (let i = 0; i < finalDisciplinas.length; i++) {
    const d = finalDisciplinas[i];
    const [inserted] = await db
      .insert(disciplinas)
      .values({
        editalId: edital.id,
        name: d.name,
        weight: d.weight != null ? Math.max(1, Math.min(10, d.weight)) : null,
        topics: { items: d.topics },
        orderIndex: i,
      })
      .returning();
    insertedDisciplinas.push(inserted);
  }

  return {
    edital: {
      id: edital.id,
      status: edital.status,
      sourceUrl: edital.sourceUrl,
      sourceType: edital.sourceType,
      parsedData: edital.parsedData as Record<string, unknown> | null,
      examDate: edital.examDate,
    },
    disciplinas: insertedDisciplinas.map((d) => ({
      id: d.id,
      name: d.name,
      weight: d.weight,
      topics: d.topics,
      orderIndex: d.orderIndex,
    })),
    warnings: [],
  };
}

/**
 * Update an edital (user corrections to parsed data).
 */
export async function updateEdital(
  editalId: string,
  userId: string,
  updates: {
    parsedData?: Record<string, unknown>;
    examDate?: Date | null;
    status?: string;
    disciplinas?: Array<{
      id?: string;
      name: string;
      weight: number | null;
      topics?: { items: string[] };
      orderIndex: number;
    }>;
  },
) {
  // Verify ownership
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

  // Update edital fields
  const editalUpdates: Record<string, unknown> = {};
  if (updates.parsedData !== undefined) {
    editalUpdates.parsedData = updates.parsedData;
  }
  if (updates.examDate !== undefined) {
    editalUpdates.examDate = updates.examDate;
  }
  if (updates.status !== undefined) {
    editalUpdates.status = updates.status;
  }

  if (Object.keys(editalUpdates).length > 0) {
    await db
      .update(editais)
      .set(editalUpdates)
      .where(eq(editais.id, editalId));
  }

  // Update disciplinas if provided
  if (updates.disciplinas) {
    // Delete existing disciplinas for this edital
    await db
      .delete(disciplinas)
      .where(eq(disciplinas.editalId, editalId));

    // Insert new disciplinas
    for (let i = 0; i < updates.disciplinas.length; i++) {
      const d = updates.disciplinas[i];
      await db
        .insert(disciplinas)
        .values({
          editalId: editalId,
          name: d.name,
          weight: d.weight != null ? Math.max(1, Math.min(10, d.weight)) : null,
          topics: d.topics || null,
          orderIndex: d.orderIndex ?? (d as any).order_index ?? i,
        });
    }
  }

  return getEditalWithDisciplinas(editalId);
}
