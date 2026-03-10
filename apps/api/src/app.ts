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
import { authMiddleware } from './middleware/auth';

export const app = express();

app.use(cors());
app.use(express.json());

// Public routes
app.use('/api/v1/auth', authRoutes);

// Protected routes
app.use('/api/v1/editais', authMiddleware, editaisRoutes);
app.use('/api/v1/schedules', authMiddleware, schedulesRoutes);
app.use('/api/v1/sessions', authMiddleware, sessionsRoutes);
app.use('/api/v1/content', authMiddleware, contentRoutes);
app.use('/api/v1/subscriptions', authMiddleware, subscriptionsRoutes);
app.use('/api/v1/users', authMiddleware, usersRoutes);
app.use('/api/v1/progress', authMiddleware, progressRoutes);
