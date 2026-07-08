import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import authRoutes from './routes/auth';
import editaisRoutes from './routes/editais';
import schedulesRoutes from './routes/schedules';
import sessionsRoutes from './routes/sessions';
import contentRoutes from './routes/content';
import subscriptionsRoutes from './routes/subscriptions';
import usersRoutes from './routes/users';
import progressRoutes from './routes/progress';
import srsRoutes from './modules/srs/srs.routes';
import quizRoutes from './modules/quiz/quiz.routes';
import { authMiddleware } from './middleware/auth';
import { handleWebhook } from './modules/subscriptions/index.js';
import { generalLimiter, authLimiter } from './middleware/rate-limit';
import type { NextFunction } from 'express';
import multer from 'multer';
import { randomUUID } from 'node:crypto';

export const app = express();

// Trust proxy (Railway, Render, etc. use reverse proxies)
app.set('trust proxy', 1);

// Security
app.use(helmet());

// CORS configuration.
// If CORS_ORIGINS is set (comma-separated), enforce it as a strict allowlist.
// Otherwise fall back to reflecting the origin — auth is Bearer-token only (no
// cookies), so this is acceptable for local/dev, but production should set
// CORS_ORIGINS to the deployed web origin(s).
const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean)
  : null;

app.use(cors({
  origin: allowedOrigins
    ? (origin, callback) => {
        // Allow same-origin / non-browser requests (no Origin header, e.g. mobile, curl).
        if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
        return callback(new Error('Not allowed by CORS'));
      }
    : true,
  credentials: false,
}));
app.use(express.json({ limit: '1mb' }));
app.use(generalLimiter);

// Static content assets (mental-map JPEGs etc.) — public; served from src in dev,
// from dist in prod (see build script that copies src/content → dist/content).
// Override Helmet's default Cross-Origin-Resource-Policy so the web app on a
// different origin (Vercel) can load these images.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.use(
  '/content-assets',
  (_req, res, next) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    next();
  },
  express.static(path.join(__dirname, 'content', 'disciplines'), { maxAge: '7d' }),
);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Public routes
app.use('/api/v1/auth', authLimiter, authRoutes);

// Public webhook endpoint (payment providers can't send JWTs)
app.post('/api/v1/subscriptions/webhook', async (req, res) => {
  try {
    const result = await handleWebhook(req.body);
    res.json({ data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Webhook processing failed';
    res.status(500).json({ error: message });
  }
});

// Editais: templates are public, everything else requires auth
app.use('/api/v1/editais', (req, res, next) => {
  if (req.path.startsWith('/templates')) return next();
  authMiddleware(req, res, next);
}, editaisRoutes);
app.use('/api/v1/schedules', authMiddleware, schedulesRoutes);
app.use('/api/v1/sessions', authMiddleware, sessionsRoutes);
app.use('/api/v1/content', authMiddleware, contentRoutes);
app.use('/api/v1/subscriptions', authMiddleware, subscriptionsRoutes);
app.use('/api/v1/users', authMiddleware, usersRoutes);
app.use('/api/v1/progress', authMiddleware, progressRoutes);
app.use('/api/v1/srs', authMiddleware, srsRoutes);
app.use('/api/v1/quiz', authMiddleware, quizRoutes);

// JSON 404 for unknown API routes (instead of Express' default HTML page).
app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Centralized error handler. Keeps internal details (stack traces, DB/Gemini
// messages) out of client responses; logs them server-side with a request id.
// Must be the LAST middleware and take 4 args so Express treats it as a handler.
app.use((err: unknown, _req: express.Request, res: express.Response, _next: NextFunction) => {
  const requestId = randomUUID();

  // Multer (upload) errors → 4xx with a safe message.
  if (err instanceof multer.MulterError) {
    const status = err.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
    console.error(`[${requestId}] Upload error:`, err.code, err.message);
    res.status(status).json({ error: 'File upload failed', code: err.code, requestId });
    return;
  }
  if (err instanceof Error && err.message === 'Not allowed by CORS') {
    res.status(403).json({ error: 'Origin not allowed', requestId });
    return;
  }

  console.error(`[${requestId}] Unhandled error:`, err instanceof Error ? err.stack : err);
  const body: Record<string, unknown> = { error: 'Internal server error', requestId };
  if (process.env.NODE_ENV !== 'production' && err instanceof Error) {
    body.detail = err.message;
  }
  res.status(500).json(body);
});
