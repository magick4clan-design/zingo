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
import { scraperRoutes } from './routes/scraper';
import { errorHandler } from './middleware/errorHandler';
import './scheduler';

const app = express();

// ==================== Middleware ====================
app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) {
      callback(null, true);
      return;
    }

    if (config.corsOrigins.includes('*') || config.corsOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(compression());
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ==================== Static Files ====================
app.use('/uploads', express.static('uploads'));

// ==================== Routes ====================
app.use('/api/auth', authRoutes);
app.use('/api/movies', movieRoutes);
app.use('/api/series', seriesRoutes);
app.use('/api/genres', genreRoutes);
app.use('/api/users', userRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/ads', adRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/scraper', scraperRoutes);

// ==================== Health Check ====================
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    name: 'Zingo API',
    version: '1.0.0',
    environment: config.nodeEnv,
  });
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
