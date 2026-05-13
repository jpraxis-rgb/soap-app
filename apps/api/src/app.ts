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

export const app = express();

// Trust proxy (Railway, Render, etc. use reverse proxies)
app.set('trust proxy', 1);

// Security
app.use(helmet());

// CORS configuration
const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',')
  : ['http://localhost:3000', 'http://localhost:8081', 'http://localhost:19006'];

app.use(cors({
  origin: true, // Allow all origins for beta
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
