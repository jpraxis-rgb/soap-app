import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Parsed disciplina from Gemini extraction.
 */
export interface ParsedDisciplina {
  name: string;
  weight: number;
  topics: string[];
}

/**
 * Result returned by the Gemini edital parser.
 */
export interface GeminiParseResult {
  disciplinas: ParsedDisciplina[];
  banca: string | null;
  orgao: string | null;
  exam_date: string | null;
  confidence: number;
  warnings: string[];
}

const EXTRACTION_PROMPT = `Você é um especialista em concursos públicos brasileiros.
Analise o conteúdo do edital abaixo e extraia as seguintes informações em formato JSON:

1. "disciplinas": lista de disciplinas/matérias com:
   - "name": nome da disciplina
   - "weight": peso relativo (número de 1 a 10, baseado na quantidade de questões ou peso indicado no edital)
   - "topics": lista de tópicos/assuntos da disciplina

2. "banca": nome da banca organizadora (ex: CESPE/CEBRASPE, FCC, FGV, VUNESP, etc.)

3. "orgao": órgão/instituição do concurso

4. "exam_date": data da prova no formato YYYY-MM-DD, se mencionada (null se não encontrada)

5. "confidence": um número de 0.0 a 1.0 indicando sua confiança na extração

6. "warnings": lista de avisos sobre dados que podem estar incompletos ou ambíguos

Responda APENAS com o JSON válido, sem markdown ou texto adicional.
Se não conseguir extrair alguma informação, use null para campos string e array vazio para listas.
Se os pesos não forem claros no edital, distribua proporcionalmente baseado no número de tópicos.

CONTEÚDO DO EDITAL:
`;

/**
 * Gemini API service for parsing edital content.
 * Designed to be easily mockable for testing.
 */
export class GeminiService {
  private genAI: GoogleGenerativeAI;
  private modelName: string;

  constructor(apiKey?: string, modelName?: string) {
    const key = apiKey || process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error('GEMINI_API_KEY is required. Set it via environment variable or constructor parameter.');
    }
    this.genAI = new GoogleGenerativeAI(key);
    this.modelName = modelName || 'gemini-1.5-flash';
  }

  /**
   * Parse edital content (text extracted from URL or PDF) using Gemini.
   */
  async parseEditalContent(content: string): Promise<GeminiParseResult> {
    try {
      const model = this.genAI.getGenerativeModel({ model: this.modelName });
      const prompt = EXTRACTION_PROMPT + content;

      const result = await model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      // Clean up potential markdown code blocks from response
      const cleanedText = text
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();

      const parsed = JSON.parse(cleanedText) as GeminiParseResult;

      return this.validateAndNormalize(parsed);
    } catch (error) {
      // Return partial/empty result on failure instead of throwing
      const message = error instanceof Error ? error.message : 'Unknown error';
      return {
        disciplinas: [],
        banca: null,
        orgao: null,
        exam_date: null,
        confidence: 0,
        warnings: [`Gemini parsing failed: ${message}`],
      };
    }
  }

  /**
   * Parse content from a URL by instructing Gemini to fetch and analyze it.
   */
  async parseEditalFromUrl(url: string): Promise<GeminiParseResult> {
    try {
      const model = this.genAI.getGenerativeModel({ model: this.modelName });
      const prompt = `Acesse o seguinte URL de edital de concurso público e extraia as informações.
Se não conseguir acessar o URL diretamente, analise a URL para identificar o concurso e forneça informações baseadas no seu conhecimento.

URL: ${url}

${EXTRACTION_PROMPT}`;

      const result = await model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      const cleanedText = text
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();

      const parsed = JSON.parse(cleanedText) as GeminiParseResult;

      return this.validateAndNormalize(parsed);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return {
        disciplinas: [],
        banca: null,
        orgao: null,
        exam_date: null,
        confidence: 0,
        warnings: [`Gemini URL parsing failed: ${message}`],
      };
    }
  }

  /**
   * Validate and normalize the Gemini response to ensure consistent structure.
   */
  private validateAndNormalize(raw: Partial<GeminiParseResult>): GeminiParseResult {
    const warnings: string[] = raw.warnings || [];

    // Ensure disciplinas is an array
    const disciplinas: ParsedDisciplina[] = [];
    if (Array.isArray(raw.disciplinas)) {
      for (const d of raw.disciplinas) {
        if (d && typeof d.name === 'string' && d.name.trim()) {
          disciplinas.push({
            name: d.name.trim(),
            weight: typeof d.weight === 'number' && d.weight > 0 ? d.weight : 1,
            topics: Array.isArray(d.topics)
              ? d.topics.filter((t: unknown) => typeof t === 'string' && (t as string).trim())
              : [],
          });
        }
      }
    }

    if (disciplinas.length === 0) {
      warnings.push('No disciplinas were extracted from the edital');
    }

    // Validate exam_date format if provided
    let examDate = raw.exam_date || null;
    if (examDate && !/^\d{4}-\d{2}-\d{2}$/.test(examDate)) {
      warnings.push(`Invalid exam_date format: ${examDate}`);
      examDate = null;
    }

    return {
      disciplinas,
      banca: typeof raw.banca === 'string' ? raw.banca.trim() || null : null,
      orgao: typeof raw.orgao === 'string' ? raw.orgao.trim() || null : null,
      exam_date: examDate,
      confidence: typeof raw.confidence === 'number' ? Math.min(1, Math.max(0, raw.confidence)) : 0.5,
      warnings,
    };
  }
}

/**
 * Singleton instance using environment variable for API key.
 * Use GeminiService constructor directly for testing with mocks.
 */
let _instance: GeminiService | null = null;

export function getGeminiService(): GeminiService {
  if (!_instance) {
    _instance = new GeminiService();
  }
  return _instance;
}

/**
 * Reset the singleton (useful for testing).
 */
export function resetGeminiService(): void {
  _instance = null;
}
