/**
 * API service for communicating with the SOAP backend.
 * Uses mock data when API is not available.
 */

const API_BASE_URL = 'http://localhost:3000/api/v1';

// Set this to true to use mock data instead of real API calls
const USE_MOCK = true;

let authToken: string | null = null;

export function setAuthToken(token: string) {
  authToken = token;
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.json();
}

// ── Mock Data ──────────────────────────────────────────

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
  topic: string;
  duration_minutes: number;
  self_rating: number;
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
    topic: 'Principios Fundamentais',
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
    disciplina_name: 'Portugues',
    topic: 'Concordancia Verbal',
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
    disciplina_name: 'Raciocinio Logico',
    topic: 'Proposicoes e Conectivos',
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
  {
    disciplina_id: 'd1',
    disciplina_name: 'Direito Constitucional',
    weight: 3,
    hours_planned: 20,
    hours_studied: 12.5,
    session_count: 10,
    avg_rating: 2.3,
    completed_blocks: 8,
    total_blocks: 14,
    progress_percent: 57,
  },
  {
    disciplina_id: 'd2',
    disciplina_name: 'Direito Administrativo',
    weight: 2,
    hours_planned: 16,
    hours_studied: 10,
    session_count: 8,
    avg_rating: 2.0,
    completed_blocks: 7,
    total_blocks: 12,
    progress_percent: 58,
  },
  {
    disciplina_id: 'd3',
    disciplina_name: 'Portugues',
    weight: 2,
    hours_planned: 14,
    hours_studied: 8,
    session_count: 7,
    avg_rating: 2.5,
    completed_blocks: 6,
    total_blocks: 10,
    progress_percent: 60,
  },
  {
    disciplina_id: 'd4',
    disciplina_name: 'Raciocinio Logico',
    weight: 1,
    hours_planned: 12,
    hours_studied: 5,
    session_count: 5,
    avg_rating: 1.8,
    completed_blocks: 3,
    total_blocks: 8,
    progress_percent: 38,
  },
  {
    disciplina_id: 'd5',
    disciplina_name: 'Informatica',
    weight: 1,
    hours_planned: 10,
    hours_studied: 4,
    session_count: 3,
    avg_rating: 2.7,
    completed_blocks: 2,
    total_blocks: 6,
    progress_percent: 33,
  },
  {
    disciplina_id: 'd6',
    disciplina_name: 'Legislacao Especifica',
    weight: 2,
    hours_planned: 8,
    hours_studied: 3,
    session_count: 2,
    avg_rating: 2.0,
    completed_blocks: 2,
    total_blocks: 6,
    progress_percent: 33,
  },
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

// ── API Functions ──────────────────────────────────────

export async function getTodayScheduleBlocks(): Promise<ScheduleBlockData[]> {
  if (USE_MOCK) return MOCK_SCHEDULE_BLOCKS;
  const result = await apiFetch<{ data: ScheduleBlockData[] }>('/schedules/today');
  return result.data;
}

export async function getProgressOverview(): Promise<ProgressOverviewData> {
  if (USE_MOCK) return MOCK_PROGRESS_OVERVIEW;
  const result = await apiFetch<{ data: ProgressOverviewData }>('/progress/overview');
  return result.data;
}

export async function getProgressByDisciplina(): Promise<DisciplinaProgressData[]> {
  if (USE_MOCK) return MOCK_DISCIPLINA_PROGRESS;
  const result = await apiFetch<{ data: DisciplinaProgressData[] }>('/progress/by-disciplina');
  return result.data;
}

export async function getWeeklyProgress(): Promise<WeeklyHistogramData[]> {
  if (USE_MOCK) return MOCK_WEEKLY;
  const result = await apiFetch<{ data: WeeklyHistogramData[] }>('/progress/weekly');
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
  const result = await apiFetch<{ data: StudySessionData }>('/sessions', {
    method: 'POST',
    body: JSON.stringify(session),
  });
  return result.data;
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
        { id: '1', disciplina_id: disciplinaId, topic: 'Principios Fundamentais', duration_minutes: 60, self_rating: 2, started_at: new Date(Date.now() - 86400000).toISOString(), completed_at: new Date(Date.now() - 86400000 + 3600000).toISOString() },
        { id: '2', disciplina_id: disciplinaId, topic: 'Direitos e Garantias', duration_minutes: 45, self_rating: 3, started_at: new Date(Date.now() - 172800000).toISOString(), completed_at: new Date(Date.now() - 172800000 + 2700000).toISOString() },
        { id: '3', disciplina_id: disciplinaId, topic: 'Organizacao do Estado', duration_minutes: 30, self_rating: 1, started_at: new Date(Date.now() - 259200000).toISOString(), completed_at: new Date(Date.now() - 259200000 + 1800000).toISOString() },
      ],
      topics: [
        { name: 'Principios Fundamentais', completed: true },
        { name: 'Direitos e Garantias', completed: true },
        { name: 'Organizacao do Estado', completed: false },
        { name: 'Organizacao dos Poderes', completed: false },
        { name: 'Controle de Constitucionalidade', completed: false },
      ],
    };
  }
  const result = await apiFetch<{ data: { disciplina: DisciplinaProgressData; sessions: StudySessionData[]; topics: { name: string; completed: boolean }[] } }>(`/progress/by-disciplina/${disciplinaId}`);
  return result.data;
}
