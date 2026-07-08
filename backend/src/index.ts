import path from 'path';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
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

const app = express();

app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(cors({ origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'], allowedHeaders: ['Content-Type', 'Authorization', 'Accept'] }));
app.use(compression());
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));

app.use('/api/auth', authRoutes);
app.use('/api/movies', movieRoutes);
app.use('/api/series', seriesRoutes);
app.use('/api/genres', genreRoutes);
app.use('/api/users', userRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/ads', adRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', name: 'Zingo API', version: '2.0.0', environment: config.nodeEnv });
});

app.get('/', (_req, res) => {
  res.json({
    name: 'Zingo API',
    version: '2.0.0',
    status: 'running',
    endpoints: {
      health: '/api/health',
      movies: '/api/movies',
      series: '/api/series',
      genres: '/api/genres',
      auth: '/api/auth',
    },
  });
});

app.use(errorHandler);

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
