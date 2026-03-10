/**
 * API service helpers with mock data fallback.
 * When the API is available, these functions will make real HTTP requests.
 * For now, they return structured mock data for development.
 */

const API_BASE = 'http://localhost:3000/api/v1';

// ── Mock Data ─────────────────────────────────────────────

const MOCK_SUMMARIES = [
  {
    id: 'summary-1',
    disciplina_id: 'disc-1',
    topic: 'Princípios da Administração Pública',
    format: 'summary',
    title: 'Resumo: Princípios da Administração Pública',
    body: {
      sections: [
        {
          heading: 'Conceito Fundamental',
          content:
            'Os princípios da administração pública são os pilares que orientam toda a atuação estatal. Expressos no art. 37 da Constituição Federal, formam o acrônimo LIMPE: Legalidade, Impessoalidade, Moralidade, Publicidade e Eficiência.',
          keyPoints: [
            'Art. 37, CF/88 — princípios expressos',
            'LIMPE: Legalidade, Impessoalidade, Moralidade, Publicidade e Eficiência',
            'Eficiência incluída pela EC 19/1998',
          ],
        },
        {
          heading: 'Princípios em Espécie',
          content:
            'Cada princípio possui conteúdo próprio e aplicação específica. A legalidade vincula o administrador à lei. A impessoalidade veda favorecimentos. A moralidade exige conduta ética. A publicidade garante transparência. A eficiência busca resultados ótimos.',
          keyPoints: [
            'Legalidade: só pode fazer o que a lei autoriza',
            'Impessoalidade: vedação ao nepotismo (Súmula Vinculante 13)',
            'Eficiência: gestão por resultados',
          ],
        },
        {
          heading: 'Pontos de Atenção para Provas',
          content:
            'As bancas frequentemente cobram a distinção entre princípios expressos e implícitos. Princípios implícitos incluem: supremacia do interesse público, autotutela, razoabilidade, proporcionalidade e motivação.',
          keyPoints: [
            'Autotutela: Súmula 473 do STF',
            'Razoabilidade e proporcionalidade são implícitos',
            'Motivação é obrigatória para atos que afetem direitos',
          ],
        },
      ],
      keyTerms: [
        {
          term: 'Princípio da Legalidade',
          definition:
            'A administração pública só pode agir quando a lei expressamente autoriza ou determina.',
        },
        {
          term: 'Autotutela',
          definition:
            'Poder da administração de anular atos ilegais e revogar atos inconvenientes sem necessidade de provocar o Judiciário.',
        },
        {
          term: 'Supremacia do Interesse Público',
          definition:
            'O interesse coletivo prevalece sobre o interesse particular, respeitados os direitos fundamentais.',
        },
      ],
    },
    status: 'published',
    professor_id: 'prof-1',
    professor_name: 'Prof. Maria Santos',
    created_at: '2026-03-08T10:00:00Z',
  },
];

const MOCK_FLASHCARDS = [
  {
    id: 'flashcard-1',
    disciplina_id: 'disc-1',
    topic: 'Princípios da Administração Pública',
    format: 'flashcard',
    title: 'Flashcards: Princípios Administrativos',
    body: {
      cards: [
        {
          front: 'Quais são os princípios expressos da administração pública (art. 37, CF)?',
          back: 'LIMPE: Legalidade, Impessoalidade, Moralidade, Publicidade e Eficiência.',
          hint: 'Pense no acrônimo de 5 letras',
        },
        {
          front: 'O que estabelece a Súmula Vinculante 13 do STF?',
          back: 'Veda a prática de nepotismo no âmbito dos três Poderes, proibindo a nomeação de cônjuge, companheiro ou parente até o terceiro grau.',
        },
        {
          front: 'Qual a diferença entre anulação e revogação de atos administrativos?',
          back: 'Anulação: ato ilegal, efeitos ex tunc (retroativos). Revogação: ato legal mas inconveniente, efeitos ex nunc (prospectivos).',
        },
        {
          front: 'O que é o princípio da autotutela?',
          back: 'É o poder da administração de controlar seus próprios atos, podendo anulá-los quando ilegais ou revogá-los por conveniência (Súmula 473, STF).',
          hint: 'Súmula 473',
        },
        {
          front: 'A Emenda Constitucional 19/1998 incluiu qual princípio?',
          back: 'O princípio da eficiência, que determina que a administração pública deve buscar os melhores resultados com os recursos disponíveis.',
        },
        {
          front: 'O que é o princípio da motivação?',
          back: 'Exige que a administração fundamente seus atos, indicando os fatos e fundamentos jurídicos. É princípio implícito na CF.',
        },
      ],
    },
    status: 'published',
    professor_id: 'prof-1',
    professor_name: 'Prof. Maria Santos',
    created_at: '2026-03-08T10:00:00Z',
  },
];

const MOCK_QUIZZES = [
  {
    id: 'quiz-1',
    disciplina_id: 'disc-1',
    topic: 'Princípios da Administração Pública',
    format: 'quiz',
    title: 'Quiz: Princípios Administrativos',
    body: {
      questions: [
        {
          id: 'q1',
          question:
            'Assinale a alternativa que apresenta corretamente os princípios expressos da administração pública:',
          alternatives: [
            { label: 'A', text: 'Legalidade, Impessoalidade, Moralidade, Publicidade e Eficiência' },
            { label: 'B', text: 'Legalidade, Igualdade, Moralidade, Proporcionalidade e Eficiência' },
            { label: 'C', text: 'Legitimidade, Impessoalidade, Motivação, Publicidade e Economicidade' },
            { label: 'D', text: 'Legalidade, Impessoalidade, Moralidade, Proporcionalidade e Eficácia' },
          ],
          correctAnswer: 'A',
          explanation:
            'O art. 37 da CF/88 estabelece expressamente os princípios LIMPE: Legalidade, Impessoalidade, Moralidade, Publicidade e Eficiência.',
        },
        {
          id: 'q2',
          question: 'Sobre o princípio da autotutela, é CORRETO afirmar:',
          alternatives: [
            { label: 'A', text: 'Permite apenas a anulação de atos administrativos.' },
            { label: 'B', text: 'A administração pode anular atos ilegais e revogar atos inconvenientes.' },
            { label: 'C', text: 'Depende de autorização judicial para ser exercido.' },
            { label: 'D', text: 'Aplica-se exclusivamente ao Poder Executivo.' },
          ],
          correctAnswer: 'B',
          explanation:
            'Conforme Súmula 473 do STF, a administração pode anular seus atos ilegais (vinculado) e revogar atos inconvenientes ou inoportunos (discricionário).',
        },
        {
          id: 'q3',
          question: 'O princípio da eficiência foi incluído na Constituição Federal por meio de:',
          alternatives: [
            { label: 'A', text: 'Emenda Constitucional nº 45/2004' },
            { label: 'B', text: 'Emenda Constitucional nº 19/1998' },
            { label: 'C', text: 'Lei nº 8.112/1990' },
            { label: 'D', text: 'Já constava no texto original de 1988' },
          ],
          correctAnswer: 'B',
          explanation:
            'A EC 19/1998 (Reforma Administrativa) incluiu expressamente o princípio da eficiência no art. 37 da CF.',
        },
        {
          id: 'q4',
          question: 'A Súmula Vinculante 13 do STF trata de qual tema?',
          alternatives: [
            { label: 'A', text: 'Licitações e contratos administrativos' },
            { label: 'B', text: 'Vedação ao nepotismo na administração pública' },
            { label: 'C', text: 'Responsabilidade civil do Estado' },
            { label: 'D', text: 'Improbidade administrativa' },
          ],
          correctAnswer: 'B',
          explanation:
            'A SV 13 veda a prática de nepotismo, como decorrência dos princípios da moralidade e da impessoalidade.',
        },
        {
          id: 'q5',
          question:
            'Quanto à distinção entre princípios expressos e implícitos, é INCORRETO afirmar:',
          alternatives: [
            { label: 'A', text: 'A razoabilidade é um princípio implícito.' },
            { label: 'B', text: 'A supremacia do interesse público é princípio expresso no art. 37.' },
            { label: 'C', text: 'A motivação é considerada princípio implícito.' },
            { label: 'D', text: 'A proporcionalidade não está expressa no art. 37 da CF.' },
          ],
          correctAnswer: 'B',
          explanation:
            'A supremacia do interesse público é um princípio implícito, reconhecido pela doutrina e jurisprudência, mas não consta expressamente no art. 37 da CF.',
        },
      ],
    },
    status: 'published',
    professor_id: 'prof-1',
    professor_name: 'Prof. Maria Santos',
    created_at: '2026-03-08T10:00:00Z',
  },
];

const MOCK_MIND_MAPS = [
  {
    id: 'mindmap-1',
    disciplina_id: 'disc-1',
    topic: 'Princípios da Administração Pública',
    format: 'mind_map',
    title: 'Mapa Mental: Princípios Administrativos',
    body: {
      centralNode: 'Princípios da\nAdministração Pública',
      branches: [
        {
          label: 'Expressos (LIMPE)',
          color: '#7C5CFC',
          children: [
            { label: 'Legalidade' },
            { label: 'Impessoalidade' },
            { label: 'Moralidade' },
            { label: 'Publicidade' },
            { label: 'Eficiência' },
          ],
        },
        {
          label: 'Implícitos',
          color: '#FF6B9D',
          children: [
            { label: 'Supremacia do\nInteresse Público' },
            { label: 'Autotutela' },
            { label: 'Razoabilidade' },
          ],
        },
        {
          label: 'Súmulas',
          color: '#00D4AA',
          children: [
            { label: 'SV 13 - Nepotismo' },
            { label: 'S. 473 - Autotutela' },
          ],
        },
        {
          label: 'Base Legal',
          color: '#FFB347',
          children: [
            { label: 'Art. 37, CF/88' },
            { label: 'EC 19/1998' },
            { label: 'Lei 9.784/99' },
          ],
        },
      ],
    },
    status: 'published',
    professor_id: 'prof-1',
    professor_name: 'Prof. Maria Santos',
    created_at: '2026-03-08T10:00:00Z',
  },
];

const MOCK_CURATION_ITEMS = [
  {
    id: 'curation-1',
    disciplina_id: 'disc-1',
    topic: 'Atos Administrativos',
    format: 'summary',
    title: 'Resumo: Atos Administrativos',
    body: { sections: [{ heading: 'Conceito', content: 'Ato administrativo é toda manifestação unilateral de vontade da administração pública...', keyPoints: ['Unilateralidade', 'Regime jurídico de direito público'] }] },
    status: 'review',
    professor_id: null,
    professor_name: null,
    created_at: '2026-03-09T08:00:00Z',
  },
  {
    id: 'curation-2',
    disciplina_id: 'disc-1',
    topic: 'Atos Administrativos',
    format: 'flashcard',
    title: 'Flashcards: Atos Administrativos',
    body: { cards: [{ front: 'O que é ato administrativo?', back: 'Manifestação unilateral de vontade da administração pública.' }] },
    status: 'review',
    professor_id: null,
    professor_name: null,
    created_at: '2026-03-09T08:00:00Z',
  },
  {
    id: 'curation-3',
    disciplina_id: 'disc-2',
    topic: 'Direitos Fundamentais',
    format: 'quiz',
    title: 'Quiz: Direitos Fundamentais',
    body: { questions: [{ id: 'q1', question: 'Teste', alternatives: [], correctAnswer: 'A', explanation: '' }] },
    status: 'review',
    professor_id: null,
    professor_name: null,
    created_at: '2026-03-09T09:00:00Z',
  },
];

// ── API Functions ─────────────────────────────────────────

export interface ContentItem {
  id: string;
  disciplina_id: string;
  topic: string;
  format: string;
  title: string;
  body: Record<string, unknown>;
  status: string;
  professor_id: string | null;
  professor_name: string | null;
  created_at: string;
}

export async function fetchContentByTopic(
  _topicId: string,
  format?: string
): Promise<ContentItem[]> {
  // In production: fetch(`${API_BASE}/content/topic/${topicId}?format=${format}`)
  const allItems = [
    ...MOCK_SUMMARIES,
    ...MOCK_FLASHCARDS,
    ...MOCK_QUIZZES,
    ...MOCK_MIND_MAPS,
  ] as ContentItem[];

  if (format) {
    return allItems.filter((item) => item.format === format);
  }
  return allItems;
}

export async function fetchCurationQueue(): Promise<ContentItem[]> {
  // In production: fetch(`${API_BASE}/content/curation-queue`)
  return MOCK_CURATION_ITEMS as ContentItem[];
}

export async function approveContent(id: string): Promise<ContentItem | null> {
  // In production: PUT to API
  const item = MOCK_CURATION_ITEMS.find((i) => i.id === id);
  if (item) {
    return { ...item, status: 'published', professor_name: 'Prof. Maria Santos' } as ContentItem;
  }
  return null;
}

export async function rejectContent(id: string): Promise<ContentItem | null> {
  const item = MOCK_CURATION_ITEMS.find((i) => i.id === id);
  if (item) {
    return { ...item, status: 'rejected', professor_name: 'Prof. Maria Santos' } as ContentItem;
  }
  return null;
}

export async function fetchDueFlashcards(): Promise<ContentItem[]> {
  // In production: fetch(`${API_BASE}/srs/due`)
  return MOCK_FLASHCARDS as ContentItem[];
}

export async function submitFlashcardReview(
  _contentItemId: string,
  _rating: string
): Promise<void> {
  // In production: POST to /srs/review
}

export async function submitQuizAnswers(
  _contentItemId: string,
  _answers: Record<string, string>
): Promise<{ score: number; totalQuestions: number; answers: Record<string, unknown> }> {
  // In production: POST to /quiz/submit
  return {
    score: 3,
    totalQuestions: 5,
    answers: {},
  };
}

export { MOCK_SUMMARIES, MOCK_FLASHCARDS, MOCK_QUIZZES, MOCK_MIND_MAPS };
