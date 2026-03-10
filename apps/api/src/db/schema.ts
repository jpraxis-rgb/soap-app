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
  passwordHash: text('password_hash'),
  authProvider: varchar('auth_provider', { length: 50 }).notNull(),
  subscriptionTier: varchar('subscription_tier', { length: 20 }).notNull().default('free'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull().$onUpdateFn(() => new Date()),
});

export const concursos = pgTable('concursos', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  banca: varchar('banca', { length: 100 }).notNull(),
  orgao: varchar('orgao', { length: 255 }).notNull(),
  year: integer('year'),
  isActive: boolean('is_active').default(true),
  metadata: jsonb('metadata'),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdateFn(() => new Date()),
});

export const editais = pgTable('editais', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  concursoId: uuid('concurso_id').references(() => concursos.id, { onDelete: 'cascade' }),
  sourceUrl: text('source_url').notNull(),
  sourceType: varchar('source_type', { length: 10 }).notNull(),
  rawContent: text('raw_content'),
  parsedData: jsonb('parsed_data'),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  examDate: timestamp('exam_date'),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdateFn(() => new Date()),
});

export const disciplinas = pgTable('disciplinas', {
  id: uuid('id').primaryKey().defaultRandom(),
  editalId: uuid('edital_id').references(() => editais.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  weight: real('weight').notNull(),
  topics: jsonb('topics'),
  orderIndex: integer('order_index').notNull(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdateFn(() => new Date()),
});

export const scheduleBlocks = pgTable('schedule_blocks', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  editalId: uuid('edital_id').references(() => editais.id, { onDelete: 'cascade' }),
  disciplinaId: uuid('disciplina_id').references(() => disciplinas.id, { onDelete: 'cascade' }),
  topic: varchar('topic', { length: 500 }).notNull(),
  scheduledDate: date('scheduled_date').notNull(),
  startTime: varchar('start_time', { length: 10 }).notNull(),
  durationMinutes: integer('duration_minutes').notNull(),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdateFn(() => new Date()),
});

export const studySessions = pgTable('study_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  scheduleBlockId: uuid('schedule_block_id').references(() => scheduleBlocks.id, { onDelete: 'cascade' }),
  disciplinaId: uuid('disciplina_id').references(() => disciplinas.id, { onDelete: 'cascade' }),
  topic: varchar('topic', { length: 500 }).notNull(),
  durationMinutes: integer('duration_minutes').notNull(),
  selfRating: integer('self_rating').notNull(),
  notes: text('notes'),
  startedAt: timestamp('started_at').notNull(),
  completedAt: timestamp('completed_at'),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdateFn(() => new Date()),
});

export const contentItems = pgTable('content_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  disciplinaId: uuid('disciplina_id').references(() => disciplinas.id, { onDelete: 'cascade' }),
  topic: varchar('topic', { length: 500 }).notNull(),
  format: varchar('format', { length: 20 }).notNull(),
  title: varchar('title', { length: 500 }).notNull(),
  body: jsonb('body').notNull(),
  status: varchar('status', { length: 20 }).notNull().default('review'),
  professorId: varchar('professor_id', { length: 255 }),
  professorName: varchar('professor_name', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdateFn(() => new Date()),
});

export const flashcardReviews = pgTable('flashcard_reviews', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  contentItemId: uuid('content_item_id').references(() => contentItems.id, { onDelete: 'cascade' }),
  rating: varchar('rating', { length: 10 }).notNull(),
  intervalDays: integer('interval_days').notNull(),
  easeFactor: real('ease_factor').notNull(),
  nextReviewAt: timestamp('next_review_at').notNull(),
  reviewedAt: timestamp('reviewed_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdateFn(() => new Date()),
});

export const quizAttempts = pgTable('quiz_attempts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  contentItemId: uuid('content_item_id').references(() => contentItems.id, { onDelete: 'cascade' }),
  answers: jsonb('answers').notNull(),
  score: integer('score').notNull(),
  totalQuestions: integer('total_questions').notNull(),
  completedAt: timestamp('completed_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdateFn(() => new Date()),
});

export const subscriptions = pgTable('subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  tier: varchar('tier', { length: 20 }).notNull(),
  status: varchar('status', { length: 20 }).notNull().default('active'),
  paymentProvider: varchar('payment_provider', { length: 50 }),
  externalId: varchar('external_id', { length: 255 }),
  startedAt: timestamp('started_at').notNull().defaultNow(),
  expiresAt: timestamp('expires_at'),
  cancelledAt: timestamp('cancelled_at'),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdateFn(() => new Date()),
});
