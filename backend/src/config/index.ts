import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || process.env.BACKEND_PORT || '5000'),
  databaseUrl: process.env.DATABASE_URL || 'file:./dev.db',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:3000,http://localhost:3001')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  email: {
    resendApiKey: process.env.RESEND_API_KEY || '',
    from: process.env.EMAIL_FROM || 'Zingo <onboarding@resend.dev>',
    enabled: process.env.EMAIL_ENABLED === 'true',
    verificationCodeTtlMinutes: parseInt(process.env.EMAIL_VERIFICATION_CODE_TTL_MINUTES || '10'),
    resendCooldownSeconds: parseInt(process.env.EMAIL_RESEND_COOLDOWN_SECONDS || '60'),
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001',
  },
  scraper: {
    apiKey: process.env.SCRAPER_API_KEY || 'your-scraper-api-key',
    intervalHours: parseInt(process.env.SCRAPER_INTERVAL_HOURS || '12'),
    allowDirectDownloadLinks: process.env.SCRAPER_ALLOW_DIRECT_DOWNLOAD_LINKS === 'true',
    allowedDownloadHosts: (process.env.SCRAPER_ALLOWED_DOWNLOAD_HOSTS || '')
      .split(',')
      .map((host) => host.trim().toLowerCase())
      .filter(Boolean),
  },
  upload: {
    dir: process.env.UPLOAD_DIR || 'uploads',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'),
  },
};
