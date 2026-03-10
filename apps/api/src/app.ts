import express from 'express';
import cors from 'cors';
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

export const app = express();

// CORS configuration
const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',')
  : ['http://localhost:3000', 'http://localhost:8081', 'http://localhost:19006'];

app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? allowedOrigins
    : true, // Allow all origins in development
}));
app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Public routes
app.use('/api/v1/auth', authRoutes);

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

// Protected routes
app.use('/api/v1/editais', authMiddleware, editaisRoutes);
app.use('/api/v1/schedules', authMiddleware, schedulesRoutes);
app.use('/api/v1/sessions', authMiddleware, sessionsRoutes);
app.use('/api/v1/content', authMiddleware, contentRoutes);
app.use('/api/v1/subscriptions', authMiddleware, subscriptionsRoutes);
app.use('/api/v1/users', authMiddleware, usersRoutes);
app.use('/api/v1/progress', authMiddleware, progressRoutes);
app.use('/api/v1/srs', authMiddleware, srsRoutes);
app.use('/api/v1/quiz', authMiddleware, quizRoutes);
