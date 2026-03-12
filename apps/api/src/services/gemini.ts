import { GoogleGenerativeAI } from '@google/generative-ai';

// ── Edital Parser (Agent 1) ─────────────────────────────

export interface ParsedDisciplina {
  name: string;
  weight: number | null;
  topics: string[];
  prova_type?: 'objetiva' | 'discursiva' | 'mista' | null;
}

export interface GeminiParseResult {
  disciplinas: ParsedDisciplina[]; // shared disciplinas or single-cargo
  cargos: Array<{ name: string; disciplinas: ParsedDisciplina[] }>; // per-cargo breakdown
  banca: string | null;
  orgao: string | null;
  cargo: string | null; // keep for backward compat, first cargo name
  exam_date: string | null;
  confidence: number;
  warnings: string[];
}

const EXTRACTION_PROMPT = `Você é um especialista em concursos públicos brasileiros.
Analise o conteúdo do edital abaixo e extraia as seguintes informações em formato JSON:

1. "cargos": lista de TODOS os cargos/funções encontrados no edital. Para cada cargo, inclua:
   - "name": nome do cargo (ex: "Analista Judiciário", "Técnico Administrativo")
   - "disciplinas": lista de disciplinas ESPECÍFICAS daquele cargo, cada uma com:
     - "name": nome da disciplina
     - "weight": peso relativo (número de 1 a 10) SOMENTE se o edital mencionar explicitamente peso, número de questões, valor de pontos ou pontuação por disciplina. Se o edital NÃO especificar peso/questões/pontos para a disciplina, use null.
     - "topics": lista de tópicos/assuntos da disciplina
     - "prova_type": "objetiva", "discursiva", "mista", ou null

2. "disciplinas": disciplinas COMUNS a todos os cargos (conhecimentos básicos/gerais).
   Se o edital não separa por cargo, coloque todas as disciplinas aqui e deixe os arrays de disciplinas dos cargos vazios.
   Cada disciplina com: "name", "weight", "topics", "prova_type" (mesma estrutura acima).

3. "banca": nome da banca organizadora (ex: CESPE/CEBRASPE, FCC, FGV, VUNESP, etc.)

4. "orgao": órgão/instituição do concurso

5. "cargo": nome do primeiro cargo encontrado (para compatibilidade). Se houver múltiplos, use o primeiro.

6. "exam_date": data da prova no formato YYYY-MM-DD, se mencionada (null se não encontrada)

7. "confidence": um número de 0.0 a 1.0 indicando sua confiança na extração

8. "warnings": lista de avisos sobre dados que podem estar incompletos ou ambíguos

Exemplo de estrutura JSON esperada:
{
  "disciplinas": [
    {
      "name": "Língua Portuguesa",
      "weight": 7,
      "topics": ["Interpretação de Texto", "Gramática"],
      "prova_type": "objetiva"
    }
  ],
  "cargos": [
    {
      "name": "Analista Judiciário",
      "disciplinas": [
        {
          "name": "Direito Constitucional",
          "weight": 8,
          "topics": ["Princípios Fundamentais", "Direitos e Garantias Fundamentais"],
          "prova_type": "objetiva"
        }
      ]
    },
    {
      "name": "Técnico Administrativo",
      "disciplinas": [
        {
          "name": "Noções de Administração",
          "weight": 6,
          "topics": ["Organização", "Gestão de Pessoas"],
          "prova_type": "objetiva"
        }
      ]
    }
  ],
  "banca": "CESPE/CEBRASPE",
  "orgao": "Tribunal Regional Federal",
  "cargo": "Analista Judiciário",
  "exam_date": "2026-06-15",
  "confidence": 0.85,
  "warnings": []
}

IMPORTANTE sobre disciplinas em concursos brasileiros:
- "Conhecimentos Gerais", "Conhecimentos Básicos" e "Conhecimentos Específicos" são CATEGORIAS, NÃO disciplinas. Nunca os liste como disciplinas.
- As disciplinas reais estão DENTRO dessas categorias (ex: "Língua Portuguesa", "Direito Constitucional", "Raciocínio Lógico", etc.)
- Cada disciplina deve ter seus próprios tópicos detalhados conforme listados no edital.
- Não agrupe múltiplas disciplinas sob um único nome genérico.

Responda APENAS com o JSON válido, sem markdown ou texto adicional.
Se não conseguir extrair alguma informação, use null para campos string e array vazio para listas.
IMPORTANTE sobre pesos: Somente atribua peso (weight) quando o edital EXPLICITAMENTE mencionar peso, número de questões ou pontuação por disciplina. Se o edital não mencionar, use null. NÃO invente pesos.
Se o edital tiver apenas um cargo, coloque-o no array "cargos" com suas disciplinas específicas.

CONTEÚDO DO EDITAL:
`;

// Models to try in order of preference (free tier availability varies)
const MODEL_FALLBACKS = [
  'gemini-2.5-flash-lite',
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-flash',
];

export class GeminiService {
  private genAI: GoogleGenerativeAI;
  private modelName: string | null;

  constructor(apiKey?: string, modelName?: string) {
    const key = apiKey || process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error('GEMINI_API_KEY is required. Set it via environment variable or constructor parameter.');
    }
    this.genAI = new GoogleGenerativeAI(key);
    this.modelName = modelName || null; // null = try fallbacks
  }

  async parseEditalContent(content: string): Promise<GeminiParseResult> {
    // For very large PDFs (>500k chars), keep first 10k + last 300k where disciplines usually are.
    const maxChars = 500000;
    let truncated = content;
    if (content.length > maxChars) {
      const head = content.substring(0, 10000);
      const tail = content.substring(content.length - 300000);
      truncated = head + '\n\n[...]\n\n' + tail;
    }
    const prompt = EXTRACTION_PROMPT + truncated;

    const modelsToTry = this.modelName ? [this.modelName] : MODEL_FALLBACKS;
    const errors: string[] = [];

    for (const modelName of modelsToTry) {
      try {
        console.log(`[Gemini] Trying model: ${modelName}`);
        const model = this.genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();
        const cleanedText = text
          .replace(/^```json\s*/i, '')
          .replace(/^```\s*/i, '')
          .replace(/\s*```$/i, '')
          .trim();
        const parsed = JSON.parse(cleanedText) as GeminiParseResult;
        console.log(`[Gemini] Success with model: ${modelName}`);
        return this.validateAndNormalize(parsed);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        const isRateLimit = message.includes('429') || message.includes('quota');
        const isNotFound = message.includes('404');
        console.log(`[Gemini] ${modelName} failed: ${isRateLimit ? 'rate limited' : isNotFound ? 'not found' : message.substring(0, 100)}`);
        errors.push(`${modelName}: ${message.substring(0, 150)}`);
        // Continue to next model
      }
    }

    return {
      disciplinas: [],
      cargos: [],
      banca: null,
      orgao: null,
      cargo: null,
      exam_date: null,
      confidence: 0,
      warnings: [`All Gemini models failed. Errors: ${errors.join(' | ')}`],
    };
  }

  async parseEditalFromUrl(url: string): Promise<GeminiParseResult> {
    // First, try to fetch the URL content via HTTP
    try {
      const response = await fetch(url);
      if (response.ok) {
        const contentType = response.headers.get('content-type') || '';
        // If it's a PDF, extract text with pdf-parse
        if (contentType.includes('application/pdf') || url.toLowerCase().endsWith('.pdf')) {
          const { extractTextFromPdf } = await import('./pdf-extract.js');
          const buffer = Buffer.from(await response.arrayBuffer());
          const textContent = await extractTextFromPdf(buffer);
          if (textContent && textContent.trim().length > 100) {
            return this.parseEditalContent(textContent);
          }
        } else {
          const textContent = await response.text();
          if (textContent && textContent.trim().length > 0) {
            return this.parseEditalContent(textContent);
          }
        }
      }
    } catch (fetchError) {
      console.error('[GEMINI] PDF fetch/extract failed, falling back to URL inference:', fetchError instanceof Error ? fetchError.message : fetchError);
    }

    // Fallback: ask Gemini to infer from the URL
    try {
      const modelsToTry = this.modelName ? [this.modelName] : MODEL_FALLBACKS;
      const model = this.genAI.getGenerativeModel({ model: modelsToTry[0] });
      const prompt = `A seguinte URL aponta para um edital de concurso público. Não é possível acessar o conteúdo diretamente.
Analise a URL para identificar o concurso e forneça informações baseadas no seu conhecimento.

URL: ${url}

${EXTRACTION_PROMPT}`;

      const result = await model.generateContent(prompt);
      const geminiResponse = result.response;
      const text = geminiResponse.text();
      const cleanedText = text
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();
      const parsed = JSON.parse(cleanedText) as GeminiParseResult;
      const normalized = this.validateAndNormalize(parsed);
      normalized.warnings.push('Content was inferred from URL, not fetched directly. Verify the extracted data.');
      return normalized;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return {
        disciplinas: [],
        cargos: [],
        banca: null,
        orgao: null,
        cargo: null,
        exam_date: null,
        confidence: 0,
        warnings: [`Gemini URL parsing failed: ${message}`],
      };
    }
  }

  private normalizeDisciplinas(raw: unknown[]): ParsedDisciplina[] {
    const validProvaTypes = ['objetiva', 'discursiva', 'mista'];
    const result: ParsedDisciplina[] = [];
    for (const d of raw) {
      if (d && typeof (d as Record<string, unknown>).name === 'string' && ((d as Record<string, unknown>).name as string).trim()) {
        const item = d as Record<string, unknown>;
        const provaType = typeof item.prova_type === 'string' && validProvaTypes.includes(item.prova_type)
          ? item.prova_type as 'objetiva' | 'discursiva' | 'mista'
          : null;
        result.push({
          name: (item.name as string).trim(),
          weight: typeof item.weight === 'number' ? Math.max(1, Math.min(10, item.weight)) : null,
          topics: Array.isArray(item.topics)
            ? (item.topics as unknown[]).filter((t: unknown) => typeof t === 'string' && (t as string).trim()) as string[]
            : [],
          prova_type: provaType,
        });
      }
    }
    return result;
  }

  private validateAndNormalize(raw: Partial<GeminiParseResult>): GeminiParseResult {
    const warnings: string[] = raw.warnings || [];

    // Normalize top-level disciplinas
    const disciplinas = Array.isArray(raw.disciplinas)
      ? this.normalizeDisciplinas(raw.disciplinas)
      : [];

    // Normalize cargos array
    const cargos: Array<{ name: string; disciplinas: ParsedDisciplina[] }> = [];
    if (Array.isArray(raw.cargos)) {
      for (const c of raw.cargos) {
        if (c && typeof c.name === 'string' && c.name.trim()) {
          cargos.push({
            name: c.name.trim(),
            disciplinas: Array.isArray(c.disciplinas)
              ? this.normalizeDisciplinas(c.disciplinas)
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
}

let _instance: GeminiService | null = null;

export function getGeminiService(): GeminiService {
  if (!_instance) {
    _instance = new GeminiService();
  }
  return _instance;
}

export function resetGeminiService(): void {
  _instance = null;
}

import { getStubSummaryContent } from './discipline-content.js';

// ── Content Generation (Agent 3) ────────────────────────

interface SummaryBody {
  sections: Array<{ heading: string; content: string; keyPoints: string[] }>;
  keyTerms: Array<{ term: string; definition: string }>;
  sources: Array<{ title: string; author?: string; type: string }>;
}

interface FlashcardBody {
  cards: Array<{ front: string; back: string; hint?: string }>;
}

interface QuizBody {
  questions: Array<{
    id: string;
    question: string;
    alternatives: Array<{ label: string; text: string }>;
    correctAnswer: string;
    explanation: string;
  }>;
}

interface MindMapBody {
  centralNode: string;
  branches: Array<{ label: string; color: string; children: Array<{ label: string }> }>;
}

export function isGeminiAvailable(): boolean {
  const key = process.env.GEMINI_API_KEY;
  return !!key && key !== 'placeholder';
}

async function generateWithGemini<T>(prompt: string): Promise<T> {
  const service = getGeminiService();
  const modelsToTry = service['modelName'] ? [service['modelName']] : MODEL_FALLBACKS;
  const model = service['genAI'].getGenerativeModel({ model: modelsToTry[0] });
  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const cleanedText = text
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
  return JSON.parse(cleanedText) as T;
}

export async function generateSummary(topic: string, disciplina: string): Promise<{ title: string; body: SummaryBody }> {
  if (isGeminiAvailable()) {
    try {
      const prompt = `Você é um professor especialista em ${disciplina} para concursos públicos brasileiros.
Gere um resumo detalhado sobre "${topic}" no contexto de ${disciplina}.

Responda APENAS com JSON válido no formato:
{
  "title": "Resumo: ${topic}",
  "body": {
    "sections": [
      { "heading": "título da seção", "content": "texto do conteúdo", "keyPoints": ["ponto 1", "ponto 2"] }
    ],
    "keyTerms": [
      { "term": "termo", "definition": "definição" }
    ],
    "sources": [
      { "title": "título da fonte", "author": "autor (opcional)", "type": "lei|doutrina|jurisprudência|artigo" }
    ]
  }
}

Inclua pelo menos 3 seções, 3 termos-chave e 2-3 fontes relevantes (legislação, doutrina ou jurisprudência). Sem markdown, apenas JSON.`;
      return await generateWithGemini<{ title: string; body: SummaryBody }>(prompt);
    } catch (error) {
      console.warn('[GEMINI] Summary generation failed, using stub:', error instanceof Error ? error.message : error);
    }
  }

  // Stub fallback — discipline-specific content
  const stub = getStubSummaryContent(topic, disciplina);
  return {
    title: `Resumo: ${topic}`,
    body: stub,
  };
}

export async function generateFlashcards(topic: string, disciplina: string): Promise<{ title: string; body: FlashcardBody }> {
  if (isGeminiAvailable()) {
    try {
      const prompt = `Você é um professor especialista em ${disciplina} para concursos públicos brasileiros.
Gere flashcards sobre "${topic}" no contexto de ${disciplina}.

Responda APENAS com JSON válido no formato:
{
  "title": "Flashcards: ${topic}",
  "body": {
    "cards": [
      { "front": "pergunta", "back": "resposta", "hint": "dica opcional" }
    ]
  }
}

Gere pelo menos 5 flashcards. Sem markdown, apenas JSON.`;
      return await generateWithGemini<{ title: string; body: FlashcardBody }>(prompt);
    } catch (error) {
      console.warn('[GEMINI] Flashcard generation failed, using stub:', error instanceof Error ? error.message : error);
    }
  }

  // Stub fallback
  return {
    title: `Flashcards: ${topic}`,
    body: {
      cards: [
        { front: `Qual é o conceito de ${topic}?`, back: `${topic} refere-se ao conjunto de normas e princípios que regulam a atuação da administração pública neste contexto específico.`, hint: 'Pense nos princípios fundamentais' },
        { front: `Quais são os princípios aplicáveis a ${topic}?`, back: 'Legalidade, Impessoalidade, Moralidade, Publicidade e Eficiência (LIMPE).' },
        { front: `Qual a diferença entre anulação e revogação no contexto de ${topic}?`, back: 'Anulação: ato ilegal, efeitos ex tunc. Revogação: ato legal mas inconveniente, efeitos ex nunc.' },
        { front: `O que diz a Súmula 473 do STF sobre ${topic}?`, back: 'A administração pode anular seus próprios atos quando eivados de vícios que os tornam ilegais, ou revogá-los por conveniência e oportunidade.' },
        { front: `Quais são as exceções ao princípio da legalidade em ${topic}?`, back: 'Medidas provisórias, estado de defesa e estado de sítio são situações excepcionais previstas constitucionalmente.', hint: 'São situações de excepcionalidade constitucional' },
      ],
    },
  };
}

export async function generateQuiz(topic: string, disciplina: string): Promise<{ title: string; body: QuizBody }> {
  if (isGeminiAvailable()) {
    try {
      const prompt = `Você é um professor especialista em ${disciplina} para concursos públicos brasileiros.
Gere um quiz sobre "${topic}" no contexto de ${disciplina}.

Responda APENAS com JSON válido no formato:
{
  "title": "Quiz: ${topic}",
  "body": {
    "questions": [
      {
        "id": "q1",
        "question": "texto da pergunta",
        "alternatives": [
          { "label": "A", "text": "alternativa A" },
          { "label": "B", "text": "alternativa B" },
          { "label": "C", "text": "alternativa C" },
          { "label": "D", "text": "alternativa D" }
        ],
        "correctAnswer": "B",
        "explanation": "explicação da resposta"
      }
    ]
  }
}

Gere 5 questões no estilo de concursos públicos. Sem markdown, apenas JSON.`;
      return await generateWithGemini<{ title: string; body: QuizBody }>(prompt);
    } catch (error) {
      console.warn('[GEMINI] Quiz generation failed, using stub:', error instanceof Error ? error.message : error);
    }
  }

  // Stub fallback
  return {
    title: `Quiz: ${topic}`,
    body: {
      questions: [
        { id: 'q1', question: `Sobre ${topic}, assinale a alternativa correta:`, alternatives: [{ label: 'A', text: 'O princípio da legalidade impede qualquer atuação discricionária.' }, { label: 'B', text: 'A administração pode agir de ofício para anular atos ilegais.' }, { label: 'C', text: 'A revogação de atos administrativos tem efeitos retroativos.' }, { label: 'D', text: 'Atos vinculados permitem juízo de conveniência e oportunidade.' }], correctAnswer: 'B', explanation: 'Conforme a Súmula 473 do STF, a administração pode anular seus próprios atos de ofício quando eivados de vícios de ilegalidade.' },
        { id: 'q2', question: `Em relação aos princípios aplicáveis a ${topic}, é INCORRETO afirmar:`, alternatives: [{ label: 'A', text: 'O princípio da moralidade exige conduta ética dos agentes públicos.' }, { label: 'B', text: 'O princípio da eficiência foi introduzido pela EC 19/1998.' }, { label: 'C', text: 'O princípio da publicidade admite exceções para segurança nacional.' }, { label: 'D', text: 'O princípio da impessoalidade proíbe qualquer forma de delegação.' }], correctAnswer: 'D', explanation: 'O princípio da impessoalidade não proíbe delegação. Ele determina que a atuação administrativa não deve beneficiar ou prejudicar pessoas específicas.' },
        { id: 'q3', question: `Quanto à aplicação prática de ${topic}, pode-se afirmar que:`, alternatives: [{ label: 'A', text: 'Os atos administrativos são sempre autoexecutórios.' }, { label: 'B', text: 'A motivação é obrigatória apenas para atos vinculados.' }, { label: 'C', text: 'Os atos discricionários estão sujeitos a controle judicial de legalidade.' }, { label: 'D', text: 'A competência administrativa é sempre delegável.' }], correctAnswer: 'C', explanation: 'Os atos discricionários, embora envolvam juízo de mérito, estão sujeitos ao controle judicial no que tange à legalidade.' },
        { id: 'q4', question: `No contexto de ${topic}, o controle exercido pelo Poder Judiciário:`, alternatives: [{ label: 'A', text: 'Pode revogar atos administrativos por conveniência.' }, { label: 'B', text: 'Limita-se à análise de legalidade e legitimidade.' }, { label: 'C', text: 'É vedado sobre atos de natureza política.' }, { label: 'D', text: 'Substitui integralmente o controle administrativo.' }], correctAnswer: 'B', explanation: 'O controle judicial dos atos administrativos limita-se à análise de legalidade e legitimidade.' },
        { id: 'q5', question: `Assinale a alternativa que apresenta uma característica CORRETA sobre ${topic}:`, alternatives: [{ label: 'A', text: 'A presunção de legitimidade é absoluta.' }, { label: 'B', text: 'A imperatividade está presente em todos os atos.' }, { label: 'C', text: 'A tipicidade garante segurança jurídica ao administrado.' }, { label: 'D', text: 'A autoexecutoriedade dispensa fundamentação legal.' }], correctAnswer: 'C', explanation: 'A tipicidade é o atributo que garante que cada ato administrativo corresponde a uma figura previamente definida em lei.' },
      ],
    },
  };
}

export async function generateMindMap(topic: string, disciplina: string): Promise<{ title: string; body: MindMapBody }> {
  if (isGeminiAvailable()) {
    try {
      const prompt = `Você é um professor especialista em ${disciplina} para concursos públicos brasileiros.
Gere um mapa mental sobre "${topic}" no contexto de ${disciplina}.

Responda APENAS com JSON válido no formato:
{
  "title": "Mapa Mental: ${topic}",
  "body": {
    "centralNode": "${topic}",
    "branches": [
      { "label": "rótulo", "color": "#hexcolor", "children": [{ "label": "filho" }] }
    ]
  }
}

Use as cores: #7C5CFC, #FF6B9D, #00D4AA, #FFB347. Gere pelo menos 4 ramos. Sem markdown, apenas JSON.`;
      return await generateWithGemini<{ title: string; body: MindMapBody }>(prompt);
    } catch (error) {
      console.warn('[GEMINI] MindMap generation failed, using stub:', error instanceof Error ? error.message : error);
    }
  }

  // Stub fallback
  return {
    title: `Mapa Mental: ${topic}`,
    body: {
      centralNode: topic,
      branches: [
        { label: 'Conceitos', color: '#7C5CFC', children: [{ label: 'Definição Legal' }, { label: 'Natureza Jurídica' }, { label: 'Classificação' }] },
        { label: 'Princípios', color: '#FF6B9D', children: [{ label: 'Legalidade' }, { label: 'Moralidade' }, { label: 'Eficiência' }] },
        { label: 'Aplicação', color: '#00D4AA', children: [{ label: 'Jurisprudência' }, { label: 'Casos Práticos' }, { label: 'Exceções' }] },
        { label: 'Controle', color: '#FFB347', children: [{ label: 'Judicial' }, { label: 'Administrativo' }, { label: 'Legislativo' }] },
      ],
    },
  };
}

export async function generateAllFormats(topic: string, disciplina: string) {
  const [summary, flashcards, quiz, mindMap] = await Promise.all([
    generateSummary(topic, disciplina),
    generateFlashcards(topic, disciplina),
    generateQuiz(topic, disciplina),
    generateMindMap(topic, disciplina),
  ]);
  return { summary, flashcards, quiz, mindMap };
}
