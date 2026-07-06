import { Router } from 'express';
import { prisma } from '../services/prisma';
import { authenticate, isAdmin } from '../middleware/auth';
import { config } from '../config';

const router = Router();

const FALLBACK_POSTER_URL = 'https://placehold.co/500x750/111827/ffffff?text=Zingo';

type JsonMap = Record<string, unknown>;

interface ImageRecord {
  url: string;
  caption: string;
  alt: string;
}

interface NormalizedContent {
  title: string;
  slug: string;
  originalTitle?: string;
  posterUrl: string;
  backdropUrl?: string;
  description: string;
  releaseYear?: number;
  duration?: number;
  imdbRating?: number;
  imdbId?: string;
  quality?: string;
  country?: string;
  language?: string;
  director?: string;
  network?: string;
  cast: string[];
  screenshots: ImageRecord[];
  trailerUrl?: string;
  downloadLinks: JsonMap;
  source: string;
  sourceUrl?: string;
  genreNames: string[];
  seasons: NormalizedSeason[];
}

interface NormalizedSeason {
  seasonNumber: number;
  title?: string;
  episodes: NormalizedEpisode[];
}

interface NormalizedEpisode {
  episodeNumber: number;
  title?: string;
  downloadLinks: JsonMap;
}

function asRecord(value: unknown): JsonMap {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as JsonMap : {};
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function cleanText(value: unknown, maxLength = 0): string {
  if (value === null || value === undefined) return '';
  const text = String(value).replace(/\s+/g, ' ').trim();
  return maxLength > 0 && text.length > maxLength ? text.slice(0, maxLength).trim() : text;
}

function asString(value: unknown, maxLength = 0): string | undefined {
  const text = cleanText(value, maxLength);
  return text || undefined;
}

function asNumber(value: unknown, min?: number, max?: number): number | undefined {
  if (value === null || value === undefined || value === '') return undefined;
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return undefined;
  if (min !== undefined && numberValue < min) return undefined;
  if (max !== undefined && numberValue > max) return undefined;
  return numberValue;
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function normalizeUrl(value: unknown): string | undefined {
  const url = asString(value, 1200);
  if (!url || !isHttpUrl(url)) return undefined;
  return url;
}

function slugify(value: string): string {
  const slug = value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90);
  return slug || `content-${Date.now()}`;
}

function normalizeList(value: unknown): string[] {
  const values = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? value.split(/[,،|،\n]/)
      : [];

  const seen = new Set<string>();
  const result: string[] = [];

  for (const item of values) {
    const text = cleanText(item, 120);
    if (!text || seen.has(text)) continue;
    seen.add(text);
    result.push(text);
  }

  return result.slice(0, 30);
}

function normalizeImages(value: unknown, title: string): ImageRecord[] {
  const images: ImageRecord[] = [];
  const seen = new Set<string>();

  for (const item of asArray(value)) {
    const record = asRecord(item);
    const rawUrl = typeof item === 'string' ? item : record.url;
    const url = normalizeUrl(rawUrl);
    if (!url || seen.has(url)) continue;

    seen.add(url);
    const caption = cleanText(record.caption || record.title || record.alt || title, 220);
    images.push({
      url,
      caption,
      alt: cleanText(record.alt || caption || title, 220),
    });
  }

  return images.slice(0, 12);
}

function canPublishDownloadUrl(value: string): boolean {
  if (!config.scraper.allowDirectDownloadLinks || config.scraper.allowedDownloadHosts.length === 0) {
    return false;
  }

  try {
    const hostname = new URL(value).hostname.toLowerCase();
    return config.scraper.allowedDownloadHosts.some((host) => hostname === host || hostname.endsWith(`.${host}`));
  } catch {
    return false;
  }
}

function sanitizeDownloadLinks(value: unknown): JsonMap {
  const input = asRecord(value);
  const output: JsonMap = {};

  for (const [label, rawValue] of Object.entries(input)) {
    const safeLabel = cleanText(label, 120);
    if (!safeLabel) continue;

    if (typeof rawValue === 'string') {
      const url = normalizeUrl(rawValue);
      if (url && canPublishDownloadUrl(url)) {
        output[safeLabel] = url;
      }
      continue;
    }

    if (rawValue && typeof rawValue === 'object' && !Array.isArray(rawValue)) {
      const nested = sanitizeDownloadLinks(rawValue);
      if (Object.keys(nested).length > 0) {
        output[safeLabel] = nested;
      }
    }
  }

  return output;
}

function normalizeContent(item: unknown): NormalizedContent | null {
  const record = asRecord(item);
  const title = asString(record.title, 300);
  if (!title) return null;

  const posterUrl = normalizeUrl(record.posterUrl) || FALLBACK_POSTER_URL;
  const genreNames = [
    ...normalizeList(record.genreNames),
    ...normalizeList(record.genres),
    ...normalizeList(record.genreSlugs),
  ];

  return {
    title,
    slug: slugify(asString(record.slug, 120) || title),
    originalTitle: asString(record.originalTitle, 300),
    posterUrl,
    backdropUrl: normalizeUrl(record.backdropUrl),
    description: asString(record.description, 4000) || '',
    releaseYear: asNumber(record.releaseYear, 1888, 2100),
    duration: asNumber(record.duration, 1, 1000),
    imdbRating: asNumber(record.imdbRating, 0, 10),
    imdbId: asString(record.imdbId, 80),
    quality: asString(record.quality, 160),
    country: asString(record.country, 160),
    language: asString(record.language, 160),
    director: asString(record.director, 260),
    network: asString(record.network, 260),
    cast: normalizeList(record.cast),
    screenshots: normalizeImages(record.screenshots, title),
    trailerUrl: normalizeUrl(record.trailerUrl),
    downloadLinks: sanitizeDownloadLinks(record.downloadLinks),
    source: asString(record.source, 120) || 'unknown',
    sourceUrl: normalizeUrl(record.sourceUrl),
    genreNames,
    seasons: normalizeSeasons(record.seasons),
  };
}

function normalizeSeasons(value: unknown): NormalizedSeason[] {
  return asArray(value).map((season, seasonIndex) => {
    const record = asRecord(season);
    const seasonNumber = Math.floor(asNumber(record.seasonNumber, 1, 200) || seasonIndex + 1);
    return {
      seasonNumber,
      title: asString(record.title, 180),
      episodes: normalizeEpisodes(record.episodes),
    };
  }).filter((season) => season.episodes.length > 0);
}

function normalizeEpisodes(value: unknown): NormalizedEpisode[] {
  return asArray(value).map((episode, episodeIndex) => {
    const record = asRecord(episode);
    const episodeNumber = Math.floor(asNumber(record.episodeNumber, 1, 10000) || episodeIndex + 1);
    return {
      episodeNumber,
      title: asString(record.title, 220),
      downloadLinks: sanitizeDownloadLinks(record.downloadLinks),
    };
  });
}

async function makeUniqueSlug(baseSlug: string, type: 'movie' | 'series', currentId?: number): Promise<string> {
  let slug = baseSlug;
  let suffix = 2;

  while (true) {
    const existing = type === 'movie'
      ? await prisma.movie.findUnique({ where: { slug } })
      : await prisma.series.findUnique({ where: { slug } });

    if (!existing || existing.id === currentId) return slug;
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }
}

async function upsertGenreByName(name: string) {
  const cleanName = cleanText(name, 120);
  if (!cleanName) return null;

  const slug = slugify(cleanName);
  const existing = await prisma.genre.findFirst({
    where: {
      OR: [
        { slug },
        { name: cleanName },
      ],
    },
  });

  if (existing) return existing;

  return prisma.genre.create({
    data: {
      name: cleanName,
      slug,
    },
  });
}

async function syncMovieGenres(movieId: number, genreNames: string[]) {
  if (genreNames.length === 0) return;

  await prisma.movieGenre.deleteMany({ where: { movieId } });
  for (const genreName of genreNames) {
    const genre = await upsertGenreByName(genreName);
    if (!genre) continue;
    await prisma.movieGenre.upsert({
      where: { movieId_genreId: { movieId, genreId: genre.id } },
      update: {},
      create: { movieId, genreId: genre.id },
    });
  }
}

async function syncSeriesGenres(seriesId: number, genreNames: string[]) {
  if (genreNames.length === 0) return;

  await prisma.seriesGenre.deleteMany({ where: { seriesId } });
  for (const genreName of genreNames) {
    const genre = await upsertGenreByName(genreName);
    if (!genre) continue;
    await prisma.seriesGenre.upsert({
      where: { seriesId_genreId: { seriesId, genreId: genre.id } },
      update: {},
      create: { seriesId, genreId: genre.id },
    });
  }
}

function movieWriteData(item: NormalizedContent) {
  return {
    title: item.title,
    originalTitle: item.originalTitle,
    posterUrl: item.posterUrl,
    backdropUrl: item.backdropUrl,
    description: item.description,
    releaseYear: item.releaseYear,
    duration: item.duration,
    imdbRating: item.imdbRating,
    imdbId: item.imdbId,
    quality: item.quality,
    country: item.country,
    language: item.language,
    director: item.director,
    cast: JSON.stringify(item.cast),
    screenshots: JSON.stringify(item.screenshots),
    trailerUrl: item.trailerUrl,
    downloadLinks: JSON.stringify(item.downloadLinks),
  };
}

function seriesWriteData(item: NormalizedContent) {
  return {
    title: item.title,
    originalTitle: item.originalTitle,
    posterUrl: item.posterUrl,
    backdropUrl: item.backdropUrl,
    description: item.description,
    releaseYear: item.releaseYear,
    imdbRating: item.imdbRating,
    imdbId: item.imdbId,
    country: item.country,
    language: item.language,
    network: item.network,
    cast: JSON.stringify(item.cast),
    screenshots: JSON.stringify(item.screenshots),
    trailerUrl: item.trailerUrl,
  };
}

async function importMovie(item: NormalizedContent): Promise<void> {
  if (item.sourceUrl) {
    await prisma.series.deleteMany({ where: { sourceUrl: item.sourceUrl } });
  }

  const existing = item.sourceUrl
    ? await prisma.movie.findFirst({ where: { sourceUrl: item.sourceUrl } })
    : await prisma.movie.findFirst({ where: { slug: item.slug } });

  if (existing) {
    await prisma.movie.update({
      where: { id: existing.id },
      data: movieWriteData(item),
    });
    await syncMovieGenres(existing.id, item.genreNames);
    return;
  }

  const slug = await makeUniqueSlug(item.slug, 'movie');
  const movie = await prisma.movie.create({
    data: {
      ...movieWriteData(item),
      slug,
      source: item.source,
      sourceUrl: item.sourceUrl,
    },
  });
  await syncMovieGenres(movie.id, item.genreNames);
}

async function upsertSeason(seriesId: number, season: NormalizedSeason) {
  const existingSeason = await prisma.season.findFirst({
    where: { seriesId, seasonNumber: season.seasonNumber },
  });

  const seasonRecord = existingSeason
    ? await prisma.season.update({
        where: { id: existingSeason.id },
        data: { title: season.title },
      })
    : await prisma.season.create({
        data: {
          seriesId,
          seasonNumber: season.seasonNumber,
          title: season.title,
        },
      });

  for (const episode of season.episodes) {
    const existingEpisode = await prisma.episode.findFirst({
      where: { seasonId: seasonRecord.id, episodeNumber: episode.episodeNumber },
    });

    if (existingEpisode) {
      await prisma.episode.update({
        where: { id: existingEpisode.id },
        data: {
          title: episode.title,
          downloadLinks: JSON.stringify(episode.downloadLinks),
        },
      });
    } else {
      await prisma.episode.create({
        data: {
          seasonId: seasonRecord.id,
          episodeNumber: episode.episodeNumber,
          title: episode.title,
          downloadLinks: JSON.stringify(episode.downloadLinks),
        },
      });
    }
  }
}

async function importSeries(item: NormalizedContent): Promise<void> {
  if (item.sourceUrl) {
    await prisma.movie.deleteMany({ where: { sourceUrl: item.sourceUrl } });
  }

  const existing = item.sourceUrl
    ? await prisma.series.findFirst({ where: { sourceUrl: item.sourceUrl } })
    : await prisma.series.findFirst({ where: { slug: item.slug } });

  if (existing) {
    await prisma.series.update({
      where: { id: existing.id },
      data: seriesWriteData(item),
    });
    await syncSeriesGenres(existing.id, item.genreNames);
    for (const season of item.seasons) {
      await upsertSeason(existing.id, season);
    }
    return;
  }

  const slug = await makeUniqueSlug(item.slug, 'series');
  const series = await prisma.series.create({
    data: {
      ...seriesWriteData(item),
      slug,
      source: item.source,
      sourceUrl: item.sourceUrl,
    },
  });
  await syncSeriesGenres(series.id, item.genreNames);
  for (const season of item.seasons) {
    await upsertSeason(series.id, season);
  }
}

// ==================== GET /api/scraper/logs ====================
router.get('/logs', authenticate, isAdmin, async (_req, res) => {
  try {
    const logs = await prisma.scrapLog.findMany({
      orderBy: { startedAt: 'desc' },
      take: 50,
    });
    res.json({ success: true, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطا در دریافت لاگ‌ها' });
  }
});

// ==================== POST /api/scraper/import ====================
router.post('/import', async (req, res) => {
  const startedAt = new Date();

  try {
    const body = asRecord(req.body);
    const apiKey = asString(body.apiKey);
    if (!apiKey || apiKey !== config.scraper.apiKey) {
      return res.status(401).json({ success: false, message: 'کلید اسکرپر نامعتبر است' });
    }

    const type = asString(body.type);
    const data = asArray(body.data);
    if ((type !== 'movie' && type !== 'series') || data.length === 0) {
      return res.status(400).json({ success: false, message: 'داده import نامعتبر است' });
    }

    let importedCount = 0;
    let skippedCount = 0;
    let source = 'unknown';

    for (const rawItem of data) {
      const item = normalizeContent(rawItem);
      if (!item) {
        skippedCount += 1;
        continue;
      }

      source = item.source;
      if (type === 'movie') {
        await importMovie(item);
      } else {
        await importSeries(item);
      }
      importedCount += 1;
    }

    await prisma.scrapLog.create({
      data: {
        source,
        status: skippedCount > 0 ? 'partial_success' : 'success',
        message: skippedCount > 0 ? `${skippedCount} مورد به دلیل داده ناقص رد شد` : undefined,
        itemsScraped: importedCount,
        startedAt,
        finishedAt: new Date(),
      },
    });

    res.json({
      success: true,
      message: `تعداد ${importedCount} مورد با موفقیت وارد شد`,
      data: { importedCount, skippedCount },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown import error';
    console.error('Scraper import failed:', error);

    await prisma.scrapLog.create({
      data: {
        source: 'unknown',
        status: 'failed',
        message,
        itemsScraped: 0,
        startedAt,
        finishedAt: new Date(),
      },
    }).catch(() => undefined);

    res.status(500).json({ success: false, message: 'خطا در وارد کردن داده' });
  }
});

// ==================== POST /api/scraper/run ====================
router.post('/run', async (req, res) => {
  const apiKey = asString(req.body?.apiKey);
  if (!apiKey || apiKey !== config.scraper.apiKey) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  try {
    const { runScraper } = await import('../scrapers/ingestor');
    runScraper().catch(console.error);
    res.json({ success: true, message: 'Scraper started in background' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to start scraper' });
  }
});

export { router as scraperRoutes };
