import { GoogleGenerativeAI } from '@google/generative-ai';

// ── Edital Parser (Agent 1) ─────────────────────────────

export interface ParsedDisciplina {
  name: string;
  weight: number;
  topics: string[];
}

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

  async parseEditalContent(content: string): Promise<GeminiParseResult> {
    try {
      const model = this.genAI.getGenerativeModel({ model: this.modelName });
      const prompt = EXTRACTION_PROMPT + content;
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
        warnings: [`Gemini parsing failed: ${message}`],
      };
    }
  }

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

  private validateAndNormalize(raw: Partial<GeminiParseResult>): GeminiParseResult {
    const warnings: string[] = raw.warnings || [];
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

// ── Content Generation (Agent 3) ────────────────────────

interface SummaryBody {
  sections: Array<{ heading: string; content: string; keyPoints: string[] }>;
  keyTerms: Array<{ term: string; definition: string }>;
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

export async function generateSummary(topic: string, disciplina: string): Promise<{ title: string; body: SummaryBody }> {
  return {
    title: `Resumo: ${topic}`,
    body: {
      sections: [
        {
          heading: 'Conceito Fundamental',
          content: `${topic} é um tema central em ${disciplina}. Compreender seus fundamentos é essencial para a aprovação em concursos públicos.`,
          keyPoints: ['Princípio da legalidade aplica-se diretamente', 'Jurisprudência consolidada pelo STF', 'Aplicação prática em provas objetivas'],
        },
        {
          heading: 'Aspectos Relevantes',
          content: `Os aspectos mais cobrados em provas envolvem a interpretação sistemática do tema. É importante relacionar ${topic} com outros institutos da mesma disciplina.`,
          keyPoints: ['Relação com princípios constitucionais', 'Exceções previstas em lei', 'Casos práticos frequentes em provas'],
        },
        {
          heading: 'Pontos de Atenção',
          content: 'As bancas costumam explorar sutilezas e exceções. Fique atento às mudanças legislativas recentes e à jurisprudência atualizada.',
          keyPoints: ['Alterações legislativas recentes', 'Pegadinhas clássicas das bancas', 'Diferenças entre doutrina e jurisprudência'],
        },
      ],
      keyTerms: [
        { term: 'Princípio da Legalidade', definition: 'A administração pública só pode agir conforme a lei.' },
        { term: 'Supremacia do Interesse Público', definition: 'O interesse coletivo prevalece sobre o individual.' },
        { term: 'Autotutela', definition: 'A administração pode anular ou revogar seus próprios atos.' },
      ],
    },
  };
}

export async function generateFlashcards(topic: string, _disciplina: string): Promise<{ title: string; body: FlashcardBody }> {
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

export async function generateQuiz(topic: string, _disciplina: string): Promise<{ title: string; body: QuizBody }> {
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

export async function generateMindMap(topic: string, _disciplina: string): Promise<{ title: string; body: MindMapBody }> {
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
