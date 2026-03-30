import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = __DEV__
  ? 'http://localhost:3000/api/v1'
  : (process.env.EXPO_PUBLIC_API_URL || 'https://soap-api-production-3290.up.railway.app/api/v1');

const TOKEN_KEY = '@soap/auth_token';
const REFRESH_TOKEN_KEY = '@soap/refresh_token';

// Set this to true to use mock data instead of real API calls
const USE_MOCK = false;

async function getAuthHeaders(): Promise<Record<string, string>> {
  const token = await AsyncStorage.getItem(TOKEN_KEY);
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }
  return {};
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const authHeaders = await getAuthHeaders();

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
        ...options.headers,
      },
    });
  } catch {
    throw new Error('Sem conexão. Verifique sua internet.');
  }

  if (response.status === 401) {
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      const newAuthHeaders = await getAuthHeaders();
      let retryResponse: Response;
      try {
        retryResponse = await fetch(`${API_BASE_URL}${endpoint}`, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            ...newAuthHeaders,
            ...options.headers,
          },
        });
      } catch {
        throw new Error('Sem conexão. Verifique sua internet.');
      }

      if (!retryResponse.ok) {
        const error = await retryResponse.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(error.error || 'Request failed');
      }
      return retryResponse.json();
    }

    throw new Error('Authentication required');
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }

  return response.json();
}

let refreshPromise: Promise<boolean> | null = null;

async function tryRefreshToken(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;
  refreshPromise = _doRefresh();
  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}

async function _doRefresh(): Promise<boolean> {
  try {
    const refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
    if (!refreshToken) return false;

    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) return false;

    const res = await response.json();
    const tokens = res.data || res;
    await AsyncStorage.setItem(TOKEN_KEY, tokens.token);
    await AsyncStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
    return true;
  } catch {
    return false;
  }
}

// ── Auth API ──────────────────────────────────────────

interface AuthResponse { user: unknown; token: string; refreshToken: string }

export const authApi = {
  register: async (email: string, password: string, name: string) => {
    const res = await request<{ data: AuthResponse }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
    return res.data;
  },

  login: async (email: string, password: string) => {
    const res = await request<{ data: AuthResponse }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    return res.data;
  },

  googleAuth: async (token: string) => {
    const res = await request<{ data: AuthResponse }>('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
    return res.data;
  },

  appleAuth: async (token: string) => {
    const res = await request<{ data: AuthResponse }>('/auth/apple', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
    return res.data;
  },

  getMe: async () => {
    const res = await request<{ data: unknown }>('/auth/me');
    return res.data;
  },
};

// ── Users API ─────────────────────────────────────────

export const usersApi = {
  updateProfile: (data: { name?: string; avatar_url?: string }) =>
    request<unknown>('/users/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  updateNotifications: (preferences: Record<string, boolean>) =>
    request<unknown>('/users/me/notifications', {
      method: 'PUT',
      body: JSON.stringify(preferences),
    }),

  switchConcurso: (concursoId: string) =>
    request<unknown>('/users/me/concurso', {
      method: 'PUT',
      body: JSON.stringify({ concurso_id: concursoId }),
    }),
};

// ── Subscriptions API ─────────────────────────────────

export const subscriptionsApi = {
  create: (tier: string) =>
    request<unknown>('/subscriptions/create', {
      method: 'POST',
      body: JSON.stringify({ tier }),
    }),

  cancel: () =>
    request<unknown>('/subscriptions/cancel', {
      method: 'POST',
    }),

  getCurrent: () =>
    request<{ tier: string; subscription: unknown }>('/subscriptions/current'),
};

// ── Editais API ──────────────────────────────────────

export function parseEdital(sourceUrl: string) {
  return request<{ data: { edital: any; disciplinas: any[]; warnings: string[] } }>('/editais/parse', {
    method: 'POST',
    body: JSON.stringify({ source_url: sourceUrl, source_type: 'url' }),
  }).then(res => res.data);
}

export function getEditais() {
  return request<{ data: unknown[] }>('/editais').then(res => res.data);
}

export function getEdital(id: string) {
  return request<{ data: unknown }>(`/editais/${id}`).then(res => res.data);
}

export function deleteEdital(id: string) {
  return request<void>(`/editais/${id}`, { method: 'DELETE' });
}

export function updateEditalDisciplinas(
  editalId: string,
  cargo: string,
  disciplinas: Array<{ name: string; weight: number | null; topics: string[]; orderIndex: number }>,
) {
  return request<{ data: unknown }>(`/editais/${editalId}`, {
    method: 'PUT',
    body: JSON.stringify({
      parsed_data: { cargo },
      disciplinas: disciplinas.map((d, i) => ({
        name: d.name,
        weight: d.weight,
        topics: { items: d.topics },
        order_index: d.orderIndex ?? i,
      })),
    }),
  });
}

// ── Edital Templates API ────────────────────────────

export interface EditalTemplate {
  id: string;
  name: string;
  banca: string;
  orgao: string;
  hasCargos: boolean;
  disciplinaCount: number;
  examDate: string | null;
  vagas: number | null;
  nivel: string | null;
  sourceUrl: string | null;
  createdAt: string;
  sortOrder: number;
}

export interface EditalTemplateDetail {
  id: string;
  name: string;
  banca: string;
  orgao: string;
  examDate: string | null;
  disciplinas: Array<{
    name: string;
    weight: number | null;
    topics: string[];
    category: 'geral' | 'especifico';
    orderIndex: number;
  }>;
  cargos: Array<{
    name: string;
    disciplinas: Array<{
      name: string;
      weight: number | null;
      topics: string[];
      category: 'geral' | 'especifico';
      orderIndex: number;
    }>;
  }> | null;
}

export function getEditalTemplates() {
  return request<{ data: EditalTemplate[] }>('/editais/templates').then(res => res.data);
}

export function getEditalTemplateDetail(id: string) {
  return request<{ data: EditalTemplateDetail }>(`/editais/templates/${id}`).then(res => res.data);
}

export function createEditalFromTemplate(templateId: string, cargoName?: string) {
  return request<{ data: { edital: any; disciplinas: any[]; warnings: string[] } }>('/editais/from-template', {
    method: 'POST',
    body: JSON.stringify({ template_id: templateId, cargo_name: cargoName }),
  }).then(res => res.data);
}

// ── Schedules API ────────────────────────────────────

export function generateSchedule(params: {
  edital_id: string;
  hours_per_week: number;
  available_days: number[];
  exam_date: string;
  day_configs?: Record<number, number>;
  disciplines_per_day?: number;
  custom_allocations?: Record<string, number>;
}) {
  return request<{ data: unknown }>('/schedules/generate', {
    method: 'POST',
    body: JSON.stringify(params),
  }).then(res => res.data);
}

// ── Token Storage ─────────────────────────────────────

export const tokenStorage = {
  getToken: () => AsyncStorage.getItem(TOKEN_KEY),
  setToken: (token: string) => AsyncStorage.setItem(TOKEN_KEY, token),
  getRefreshToken: () => AsyncStorage.getItem(REFRESH_TOKEN_KEY),
  setRefreshToken: (token: string) => AsyncStorage.setItem(REFRESH_TOKEN_KEY, token),
  clearTokens: async () => {
    await AsyncStorage.removeItem(TOKEN_KEY);
    await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
  },
};

// ── Mock Data (Sessions + Progress) ───────────────────

export interface ScheduleBlockData {
  id: string;
  disciplina_id: string;
  disciplina_name: string;
  topic: string;
  scheduled_date: string;
  start_time: string;
  duration_minutes: number;
  status: 'pending' | 'completed' | 'skipped';
  weight: number;
  has_content: boolean;
}

export interface StudySessionData {
  id: string;
  disciplina_id: string;
  disciplina_name?: string;
  topic: string;
  duration_minutes: number;
  self_rating: number;
  notes?: string;
  started_at: string;
  completed_at: string | null;
}

export interface ProgressOverviewData {
  hours_studied: number;
  hours_planned: number;
  total_sessions: number;
  completed_blocks: number;
  total_blocks: number;
  coverage_percent: number;
  streak_days: number;
}

export interface DisciplinaProgressData {
  disciplina_id: string;
  disciplina_name: string;
  weight: number;
  hours_planned: number;
  hours_studied: number;
  session_count: number;
  avg_rating: number;
  completed_blocks: number;
  total_blocks: number;
  progress_percent: number;
}

export interface WeeklyHistogramData {
  date: string;
  day_name: string;
  hours: number;
  sessions: number;
}

const MOCK_SCHEDULE_BLOCKS: ScheduleBlockData[] = [
  {
    id: '1',
    disciplina_id: 'd1',
    disciplina_name: 'Direito Constitucional',
    topic: 'Princípios Fundamentais',
    scheduled_date: new Date().toISOString().split('T')[0],
    start_time: '08:00',
    duration_minutes: 60,
    status: 'pending',
    weight: 3,
    has_content: true,
  },
  {
    id: '2',
    disciplina_id: 'd2',
    disciplina_name: 'Direito Administrativo',
    topic: 'Atos Administrativos',
    scheduled_date: new Date().toISOString().split('T')[0],
    start_time: '10:00',
    duration_minutes: 45,
    status: 'pending',
    weight: 2,
    has_content: true,
  },
  {
    id: '3',
    disciplina_id: 'd3',
    disciplina_name: 'Português',
    topic: 'Concordância Verbal',
    scheduled_date: new Date().toISOString().split('T')[0],
    start_time: '14:00',
    duration_minutes: 30,
    status: 'completed',
    weight: 2,
    has_content: false,
  },
  {
    id: '4',
    disciplina_id: 'd4',
    disciplina_name: 'Raciocínio Lógico',
    topic: 'Proposições e Conectivos',
    scheduled_date: new Date().toISOString().split('T')[0],
    start_time: '16:00',
    duration_minutes: 45,
    status: 'pending',
    weight: 1,
    has_content: true,
  },
];

const MOCK_PROGRESS_OVERVIEW: ProgressOverviewData = {
  hours_studied: 42.5,
  hours_planned: 80,
  total_sessions: 35,
  completed_blocks: 28,
  total_blocks: 52,
  coverage_percent: 54,
  streak_days: 5,
};

const MOCK_DISCIPLINA_PROGRESS: DisciplinaProgressData[] = [
  { disciplina_id: 'd1', disciplina_name: 'Direito Constitucional', weight: 3, hours_planned: 20, hours_studied: 12.5, session_count: 10, avg_rating: 2.3, completed_blocks: 8, total_blocks: 14, progress_percent: 57 },
  { disciplina_id: 'd2', disciplina_name: 'Direito Administrativo', weight: 2, hours_planned: 16, hours_studied: 10, session_count: 8, avg_rating: 2.0, completed_blocks: 7, total_blocks: 12, progress_percent: 58 },
  { disciplina_id: 'd3', disciplina_name: 'Português', weight: 2, hours_planned: 14, hours_studied: 8, session_count: 7, avg_rating: 2.5, completed_blocks: 6, total_blocks: 10, progress_percent: 60 },
  { disciplina_id: 'd4', disciplina_name: 'Raciocínio Lógico', weight: 1, hours_planned: 12, hours_studied: 5, session_count: 5, avg_rating: 1.8, completed_blocks: 3, total_blocks: 8, progress_percent: 38 },
  { disciplina_id: 'd5', disciplina_name: 'Informática', weight: 1, hours_planned: 10, hours_studied: 4, session_count: 3, avg_rating: 2.7, completed_blocks: 2, total_blocks: 6, progress_percent: 33 },
  { disciplina_id: 'd6', disciplina_name: 'Legislação Específica', weight: 2, hours_planned: 8, hours_studied: 3, session_count: 2, avg_rating: 2.0, completed_blocks: 2, total_blocks: 6, progress_percent: 33 },
];

const MOCK_WEEKLY: WeeklyHistogramData[] = (() => {
  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];
  const data: WeeklyHistogramData[] = [];
  const today = new Date();
  const hoursValues = [1.5, 2.0, 0, 1.0, 2.5, 1.5, 0.5];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    data.push({
      date: d.toISOString().split('T')[0],
      day_name: dayNames[d.getDay()],
      hours: hoursValues[6 - i],
      sessions: hoursValues[6 - i] > 0 ? Math.ceil(hoursValues[6 - i]) : 0,
    });
  }
  return data;
})();

// ── Sessions + Progress API ───────────────────────────

export async function getTodayScheduleBlocks(): Promise<ScheduleBlockData[]> {
  if (USE_MOCK) return MOCK_SCHEDULE_BLOCKS;
  const result = await request<{ data: ScheduleBlockData[] }>('/schedules/today');
  return result.data;
}

export async function getUpcomingScheduleBlocks(from: string, to: string): Promise<ScheduleBlockData[]> {
  if (USE_MOCK) return MOCK_SCHEDULE_BLOCKS;
  const result = await request<{ data: ScheduleBlockData[] }>(`/schedules?from=${from}&to=${to}`);
  return Array.isArray(result.data) ? result.data : [];
}

export async function getProgressOverview(): Promise<ProgressOverviewData> {
  if (USE_MOCK) return MOCK_PROGRESS_OVERVIEW;
  const result = await request<{ data: ProgressOverviewData }>('/progress/overview');
  return result.data;
}

export async function getProgressByDisciplina(): Promise<DisciplinaProgressData[]> {
  if (USE_MOCK) return MOCK_DISCIPLINA_PROGRESS;
  const result = await request<{ data: DisciplinaProgressData[] }>('/progress/by-disciplina');
  return result.data;
}

export async function getWeeklyProgress(): Promise<WeeklyHistogramData[]> {
  if (USE_MOCK) return MOCK_WEEKLY;
  const result = await request<{ data: WeeklyHistogramData[] }>('/progress/weekly');
  return result.data;
}

export async function logStudySession(session: {
  schedule_block_id?: string;
  disciplina_id: string;
  topic: string;
  duration_minutes: number;
  self_rating: number;
  notes?: string;
  started_at: string;
  completed_at?: string;
}): Promise<StudySessionData> {
  if (USE_MOCK) {
    return {
      id: Math.random().toString(36).slice(2),
      disciplina_id: session.disciplina_id,
      topic: session.topic,
      duration_minutes: session.duration_minutes,
      self_rating: session.self_rating,
      started_at: session.started_at,
      completed_at: new Date().toISOString(),
    };
  }
  const result = await request<{ data: StudySessionData }>('/sessions', {
    method: 'POST',
    body: JSON.stringify(session),
  });
  return result.data;
}

export async function updateStudySession(
  id: string,
  updates: Partial<Omit<StudySessionData, 'id' | 'disciplina_id' | 'disciplina_name'>>,
): Promise<StudySessionData> {
  const result = await request<{ data: StudySessionData }>(`/sessions/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
  return result.data;
}

export async function deleteStudySession(id: string): Promise<void> {
  await request<{ message: string }>(`/sessions/${id}`, {
    method: 'DELETE',
  });
}

export async function getDisciplinaDetail(disciplinaId: string): Promise<{
  disciplina: DisciplinaProgressData;
  sessions: StudySessionData[];
  topics: { name: string; completed: boolean }[];
}> {
  if (USE_MOCK) {
    const disciplina = MOCK_DISCIPLINA_PROGRESS.find(d => d.disciplina_id === disciplinaId) || MOCK_DISCIPLINA_PROGRESS[0];
    return {
      disciplina,
      sessions: [
        { id: '1', disciplina_id: disciplinaId, topic: 'Princípios Fundamentais', duration_minutes: 60, self_rating: 2, started_at: new Date(Date.now() - 86400000).toISOString(), completed_at: new Date(Date.now() - 86400000 + 3600000).toISOString() },
        { id: '2', disciplina_id: disciplinaId, topic: 'Direitos e Garantias', duration_minutes: 45, self_rating: 3, started_at: new Date(Date.now() - 172800000).toISOString(), completed_at: new Date(Date.now() - 172800000 + 2700000).toISOString() },
        { id: '3', disciplina_id: disciplinaId, topic: 'Organização do Estado', duration_minutes: 30, self_rating: 1, started_at: new Date(Date.now() - 259200000).toISOString(), completed_at: new Date(Date.now() - 259200000 + 1800000).toISOString() },
      ],
      topics: [
        { name: 'Princípios Fundamentais', completed: true },
        { name: 'Direitos e Garantias', completed: true },
        { name: 'Organização do Estado', completed: false },
        { name: 'Organização dos Poderes', completed: false },
        { name: 'Controle de Constitucionalidade', completed: false },
      ],
    };
  }
  const result = await request<{ data: { disciplina: DisciplinaProgressData; sessions: StudySessionData[]; topics: { name: string; completed: boolean }[] } }>(`/progress/by-disciplina/${disciplinaId}`);
  return result.data;
}

// ── Mock Data (Microlearning Content) ─────────────────

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

// ── Content / Microlearning API ───────────────────────

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

export interface TopicContent {
  name: string;
  status: 'complete' | 'in_progress' | 'new';
  formats: { summary?: string; flashcard?: string; quiz?: string; mind_map?: string };
}

export interface DisciplineContent {
  name: string;
  topicCount: number;
  completedCount: number;
  topics: TopicContent[];
}

export interface EditalContentMap {
  disciplines: DisciplineContent[];
}

export async function fetchContentByTopic(
  topicId: string,
  format?: string
): Promise<ContentItem[]> {
  if (USE_MOCK) {
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
  const result = await request<{ data: ContentItem[] }>(`/content/topic/${topicId}${format ? '?format=' + format : ''}`);
  return result.data;
}

export async function fetchCurationQueue(): Promise<ContentItem[]> {
  if (USE_MOCK) {
    return MOCK_CURATION_ITEMS as ContentItem[];
  }
  const result = await request<{ data: ContentItem[] }>('/content/curation-queue');
  return result.data;
}

export async function approveContent(id: string): Promise<ContentItem | null> {
  if (USE_MOCK) {
    const item = MOCK_CURATION_ITEMS.find((i) => i.id === id);
    if (item) {
      return { ...item, status: 'published', professor_name: 'Prof. Maria Santos' } as ContentItem;
    }
    return null;
  }
  const result = await request<{ data: ContentItem }>(`/content/${id}/approve`, { method: 'PUT' });
  return result.data;
}

export async function rejectContent(id: string): Promise<ContentItem | null> {
  if (USE_MOCK) {
    const item = MOCK_CURATION_ITEMS.find((i) => i.id === id);
    if (item) {
      return { ...item, status: 'rejected', professor_name: 'Prof. Maria Santos' } as ContentItem;
    }
    return null;
  }
  const result = await request<{ data: ContentItem }>(`/content/${id}/reject`, { method: 'PUT' });
  return result.data;
}

export async function fetchDueFlashcards(): Promise<ContentItem[]> {
  if (USE_MOCK) {
    return MOCK_FLASHCARDS as ContentItem[];
  }
  const result = await request<{ data: ContentItem[] }>('/srs/due');
  return result.data;
}

export async function submitFlashcardReview(
  contentItemId: string,
  rating: string
): Promise<void> {
  if (USE_MOCK) {
    return;
  }
  await request<void>('/srs/review', {
    method: 'POST',
    body: JSON.stringify({ contentItemId, rating }),
  });
}

export async function submitQuizAnswers(
  contentItemId: string,
  answers: Record<string, string>
): Promise<{ score: number; totalQuestions: number; answers: Record<string, unknown> }> {
  if (USE_MOCK) {
    return {
      score: 3,
      totalQuestions: 5,
      answers: {},
    };
  }
  const result = await request<{ data: { score: number; totalQuestions: number; answers: Record<string, unknown> } }>('/quiz/submit', {
    method: 'POST',
    body: JSON.stringify({ contentItemId, answers }),
  });
  return result.data;
}

export async function fetchContentForEdital(editalId: string): Promise<EditalContentMap> {
  const result = await request<{ data: EditalContentMap }>(`/content/for-edital/${editalId}`);
  return result.data;
}

export async function fetchContentForTopic(topic: string, disciplina: string, format?: string): Promise<ContentItem[]> {
  const params = new URLSearchParams({ topic, disciplina });
  if (format) params.set('format', format);
  const result = await request<{ data: ContentItem[] }>(`/content/for-topic?${params}`);
  return result.data;
}

export async function seedContentForEdital(editalId: string): Promise<void> {
  await request<unknown>(`/content/seed-for-edital/${editalId}`, { method: 'POST' });
}

export { MOCK_SUMMARIES, MOCK_FLASHCARDS, MOCK_QUIZZES, MOCK_MIND_MAPS };
