import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  real,
  boolean,
  timestamp,
  date,
  jsonb,
} from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  avatarUrl: text('avatar_url'),
  authProvider: varchar('auth_provider', { length: 50 }).notNull(),
  subscriptionTier: varchar('subscription_tier', { length: 20 }).notNull().default('free'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const concursos = pgTable('concursos', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }),
  banca: varchar('banca', { length: 100 }),
  orgao: varchar('orgao', { length: 255 }),
  year: integer('year'),
  isActive: boolean('is_active').default(true),
  metadata: jsonb('metadata'),
});

export const editais = pgTable('editais', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id),
  concursoId: uuid('concurso_id').references(() => concursos.id),
  sourceUrl: text('source_url').notNull(),
  sourceType: varchar('source_type', { length: 10 }).notNull(),
  rawContent: text('raw_content'),
  parsedData: jsonb('parsed_data'),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  examDate: timestamp('exam_date'),
});

export const disciplinas = pgTable('disciplinas', {
  id: uuid('id').primaryKey().defaultRandom(),
  editalId: uuid('edital_id').references(() => editais.id),
  name: varchar('name', { length: 255 }),
  weight: real('weight').notNull(),
  topics: jsonb('topics'),
  orderIndex: integer('order_index').notNull(),
});

export const scheduleBlocks = pgTable('schedule_blocks', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id),
  editalId: uuid('edital_id').references(() => editais.id),
  disciplinaId: uuid('disciplina_id').references(() => disciplinas.id),
  topic: varchar('topic', { length: 500 }).notNull(),
  scheduledDate: date('scheduled_date').notNull(),
  startTime: varchar('start_time', { length: 10 }).notNull(),
  durationMinutes: integer('duration_minutes').notNull(),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
});

export const studySessions = pgTable('study_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id),
  scheduleBlockId: uuid('schedule_block_id').references(() => scheduleBlocks.id),
  disciplinaId: uuid('disciplina_id').references(() => disciplinas.id),
  topic: varchar('topic', { length: 500 }).notNull(),
  durationMinutes: integer('duration_minutes').notNull(),
  selfRating: integer('self_rating').notNull(),
  notes: text('notes'),
  startedAt: timestamp('started_at').notNull(),
  completedAt: timestamp('completed_at'),
});

export const contentItems = pgTable('content_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  disciplinaId: uuid('disciplina_id').references(() => disciplinas.id),
  topic: varchar('topic', { length: 500 }).notNull(),
  format: varchar('format', { length: 20 }).notNull(),
  title: varchar('title', { length: 500 }).notNull(),
  body: jsonb('body').notNull(),
  status: varchar('status', { length: 20 }).notNull().default('draft'),
  professorId: varchar('professor_id', { length: 255 }),
  professorName: varchar('professor_name', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow(),
});

export const flashcardReviews = pgTable('flashcard_reviews', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id),
  contentItemId: uuid('content_item_id').references(() => contentItems.id),
  rating: varchar('rating', { length: 10 }).notNull(),
  intervalDays: integer('interval_days').notNull(),
  easeFactor: real('ease_factor').notNull(),
  nextReviewAt: timestamp('next_review_at').notNull(),
  reviewedAt: timestamp('reviewed_at').notNull().defaultNow(),
});

export const quizAttempts = pgTable('quiz_attempts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id),
  contentItemId: uuid('content_item_id').references(() => contentItems.id),
  answers: jsonb('answers').notNull(),
  score: integer('score').notNull(),
  totalQuestions: integer('total_questions').notNull(),
  completedAt: timestamp('completed_at').notNull().defaultNow(),
});

export const subscriptions = pgTable('subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id),
  tier: varchar('tier', { length: 20 }).notNull(),
  status: varchar('status', { length: 20 }).notNull().default('active'),
  paymentProvider: varchar('payment_provider', { length: 50 }),
  externalId: varchar('external_id', { length: 255 }),
  startedAt: timestamp('started_at').notNull().defaultNow(),
  expiresAt: timestamp('expires_at'),
  cancelledAt: timestamp('cancelled_at'),
});
