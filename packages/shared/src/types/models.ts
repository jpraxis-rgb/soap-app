import {
  SubscriptionTier,
  ContentFormat,
  ContentStatus,
  EditalStatus,
  ScheduleBlockStatus,
  FlashcardRating,
} from './enums';

// ── Users ──────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  auth_provider: string;
  subscription_tier: SubscriptionTier;
  created_at: Date;
  updated_at: Date;
}

export interface InsertUser {
  email: string;
  name: string;
  avatar_url?: string | null;
  auth_provider: string;
  subscription_tier?: SubscriptionTier;
}

// ── Concursos ──────────────────────────────────────────

export interface Concurso {
  id: string;
  name: string;
  banca: string;
  orgao: string;
  year: number;
  is_active: boolean;
  metadata: Record<string, unknown> | null;
}

export interface InsertConcurso {
  name: string;
  banca: string;
  orgao: string;
  year: number;
  is_active?: boolean;
  metadata?: Record<string, unknown> | null;
}

// ── Editais ────────────────────────────────────────────

export interface Edital {
  id: string;
  user_id: string;
  concurso_id: string;
  source_url: string;
  source_type: 'url' | 'pdf';
  raw_content: string | null;
  parsed_data: Record<string, unknown> | null;
  status: EditalStatus;
  exam_date: Date | null;
}

export interface InsertEdital {
  user_id: string;
  concurso_id: string;
  source_url: string;
  source_type: 'url' | 'pdf';
  raw_content?: string | null;
  parsed_data?: Record<string, unknown> | null;
  status?: EditalStatus;
  exam_date?: Date | null;
}

// ── Disciplinas ────────────────────────────────────────

export interface Disciplina {
  id: string;
  edital_id: string;
  name: string;
  weight: number;
  topics: Record<string, unknown> | null;
  prova_type?: 'objetiva' | 'discursiva' | 'mista' | null;
  order_index: number;
}

export interface InsertDisciplina {
  edital_id: string;
  name: string;
  weight: number;
  topics?: Record<string, unknown> | null;
  prova_type?: 'objetiva' | 'discursiva' | 'mista' | null;
  order_index: number;
}

// ── Schedule Blocks ────────────────────────────────────

export interface ScheduleBlock {
  id: string;
  user_id: string;
  edital_id: string;
  disciplina_id: string;
  topic: string;
  scheduled_date: Date;
  start_time: string;
  duration_minutes: number;
  status: ScheduleBlockStatus;
}

export interface InsertScheduleBlock {
  user_id: string;
  edital_id: string;
  disciplina_id: string;
  topic: string;
  scheduled_date: Date;
  start_time: string;
  duration_minutes: number;
  status?: ScheduleBlockStatus;
}

// ── Study Sessions ─────────────────────────────────────

export interface StudySession {
  id: string;
  user_id: string;
  schedule_block_id: string | null;
  disciplina_id: string;
  topic: string;
  duration_minutes: number;
  self_rating: number;
  notes: string | null;
  started_at: Date;
  completed_at: Date | null;
}

export interface InsertStudySession {
  user_id: string;
  schedule_block_id?: string | null;
  disciplina_id: string;
  topic: string;
  duration_minutes: number;
  self_rating: number;
  notes?: string | null;
  started_at: Date;
  completed_at?: Date | null;
}

// ── Content Items ──────────────────────────────────────

export interface ContentItem {
  id: string;
  disciplina_id: string;
  topic: string;
  format: ContentFormat;
  title: string;
  body: Record<string, unknown>;
  status: ContentStatus;
  professor_id: string | null;
  professor_name: string | null;
  created_at: Date;
}

export interface InsertContentItem {
  disciplina_id: string;
  topic: string;
  format: ContentFormat;
  title: string;
  body: Record<string, unknown>;
  status?: ContentStatus;
  professor_id?: string | null;
  professor_name?: string | null;
}

// ── Flashcard Reviews ──────────────────────────────────

export interface FlashcardReview {
  id: string;
  user_id: string;
  content_item_id: string;
  rating: FlashcardRating;
  interval_days: number;
  ease_factor: number;
  next_review_at: Date;
  reviewed_at: Date;
}

export interface InsertFlashcardReview {
  user_id: string;
  content_item_id: string;
  rating: FlashcardRating;
  interval_days: number;
  ease_factor: number;
  next_review_at: Date;
  reviewed_at?: Date;
}

// ── Quiz Attempts ──────────────────────────────────────

export interface QuizAttempt {
  id: string;
  user_id: string;
  content_item_id: string;
  answers: Record<string, unknown>;
  score: number;
  total_questions: number;
  completed_at: Date;
}

export interface InsertQuizAttempt {
  user_id: string;
  content_item_id: string;
  answers: Record<string, unknown>;
  score: number;
  total_questions: number;
}

// ── Subscriptions ──────────────────────────────────────

export interface Subscription {
  id: string;
  user_id: string;
  tier: SubscriptionTier;
  status: 'active' | 'cancelled' | 'expired';
  payment_provider: string | null;
  external_id: string | null;
  started_at: Date;
  expires_at: Date | null;
  cancelled_at: Date | null;
}

export interface InsertSubscription {
  user_id: string;
  tier: SubscriptionTier;
  status?: 'active' | 'cancelled' | 'expired';
  payment_provider?: string | null;
  external_id?: string | null;
  started_at?: Date;
  expires_at?: Date | null;
  cancelled_at?: Date | null;
}
