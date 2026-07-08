import path from 'path';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import { PrismaClient } from '@prisma/client';
import { config } from './config';
import { authRoutes } from './routes/auth';
import { movieRoutes } from './routes/movies';
import { seriesRoutes } from './routes/series';
import { genreRoutes } from './routes/genres';
import { userRoutes } from './routes/users';
import { favoriteRoutes } from './routes/favorites';
import { commentRoutes } from './routes/comments';
import { adRoutes } from './routes/ads';
import { adminRoutes } from './routes/admin';
import { errorHandler } from './middleware/errorHandler';
import { syncFromHostinnegar, getSyncStatus } from './services/hostinnegarSync';
import './scheduler';

const prisma = new PrismaClient();
const app = express();

// ==================== Middleware ====================
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
}));
app.use(compression());
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ==================== Static Files ====================
app.use('/uploads', express.static('uploads'));

// ==================== API Routes ====================
app.use('/api/auth', authRoutes);
app.use('/api/movies', movieRoutes);
app.use('/api/series', seriesRoutes);
app.use('/api/genres', genreRoutes);
app.use('/api/users', userRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/ads', adRoutes);
app.use('/api/admin', adminRoutes);

// ==================== Health Check ====================
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    name: 'Zingo API',
    version: '1.0.0',
    environment: config.nodeEnv,
  });
});

// ==================== Root ====================
app.get('/', (_req, res) => {
  res.json({
    name: 'Zingo API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/api/health',
      movies: '/api/movies',
      series: '/api/series',
      genres: '/api/genres',
      auth: '/api/auth',
      sync: '/sync/start',
    },
  });
});

// ==================== Sync Trigger ====================
app.post('/sync/start', async (_req, res) => {
  const status = getSyncStatus();
  if (status.syncRunning) return res.json({ ok: false, msg: 'در حال اجراست' });
  res.json({ ok: true, msg: 'همگام‌سازی شروع شد' });
  syncFromHostinnegar(prisma).catch(err => console.error('Sync error:', err.message));
});

app.get('/sync/status', (_req, res) => {
  res.json(getSyncStatus());
});

// ==================== Error Handler ====================
app.use(errorHandler);

// ==================== Start Server ====================
app.listen(config.port, () => {
  console.log(`
  ╔══════════════════════════════════════╗
  ║   🎬 Zingo API Server Running      ║
  ║   🌐 http://localhost:${config.port}        ║
  ║   📊 Environment: ${config.nodeEnv.padEnd(17)}║
  ╚══════════════════════════════════════╝
  `);
});

export default app;
