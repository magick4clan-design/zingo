import { Router } from 'express';
import { prisma } from '../services/prisma';
import { parseJsonFields, parseJsonFieldsArray } from '../services/helpers';

const router = Router();

function parseDownloadLinks(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  try { return JSON.parse(value); } catch { return {}; }
}

function parseSeriesJsonFields<T extends Record<string, unknown>>(series: T): T {
  const parsed = parseJsonFields(series, ['cast', 'screenshots']);
  const seasons = Array.isArray(parsed.seasons)
    ? parsed.seasons.map((season) => {
        if (!season || typeof season !== 'object') return season;
        const seasonRecord = season as Record<string, unknown>;
        const episodes = Array.isArray(seasonRecord.episodes)
          ? seasonRecord.episodes.map((episode) => {
              if (!episode || typeof episode !== 'object') return episode;
              const episodeRecord = episode as Record<string, unknown>;
              return { ...episodeRecord, downloadLinks: parseDownloadLinks(episodeRecord.downloadLinks) };
            })
          : seasonRecord.episodes;
        return { ...seasonRecord, episodes };
      })
    : parsed.seasons;
  return { ...parsed, seasons } as T;
}

function parseSeriesJsonFieldsArray<T extends Record<string, unknown>>(items: T[]): T[] {
  return items.map((item) => parseSeriesJsonFields(item));
}

router.get('/', async (req, res) => {
  try {
    const { page = '1', limit = '20', genre, search, sort = 'createdAt', order = 'desc', year, rating } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const where: Record<string, unknown> = { status: 'PUBLISHED' };
    if (genre) where.genres = { some: { genre: { slug: genre as string } } };
    if (search) where.OR = [{ title: { contains: search as string } }, { originalTitle: { contains: search as string } }];
    if (year) where.releaseYear = parseInt(year as string);
    if (rating) where.imdbRating = { gte: parseFloat(rating as string) };

    const orderBy: Record<string, string> = {};
    if (sort === 'rating') orderBy.imdbRating = order as string;
    else if (sort === 'views') orderBy.views = order as string;
    else if (sort === 'year') orderBy.releaseYear = order as string;
    else orderBy.createdAt = order as string;

    const [seriesList, total] = await Promise.all([
      prisma.series.findMany({
        where, orderBy, skip, take,
        include: { genres: { include: { genre: true } }, seasons: { include: { episodes: true } }, _count: { select: { favorites: true, comments: true } } },
      }),
      prisma.series.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        series: parseSeriesJsonFieldsArray(seriesList as unknown as Record<string, unknown>[]),
        pagination: { page: parseInt(page as string), limit: take, total, totalPages: Math.ceil(total / take) },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطا در دریافت سریال‌ها' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const seriesData = await prisma.series.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        genres: { include: { genre: true } },
        seasons: { include: { episodes: { orderBy: { episodeNumber: 'asc' } } }, orderBy: { seasonNumber: 'asc' } },
        comments: { include: { user: { select: { name: true, avatar: true } } }, orderBy: { createdAt: 'desc' }, take: 20 },
        _count: { select: { favorites: true, comments: true } },
      },
    });

    if (!seriesData) return res.status(404).json({ success: false, message: 'سریال یافت نشد' });

    await prisma.series.update({ where: { id: seriesData.id }, data: { views: { increment: 1 } } });

    const genreIds = seriesData.genres.map((g) => g.genreId);
    const similar = await prisma.series.findMany({
      where: { id: { not: seriesData.id }, status: 'PUBLISHED', genres: { some: { genreId: { in: genreIds } } } },
      take: 6,
      include: { genres: { include: { genre: true } } },
    });

    res.json({
      success: true,
      data: { ...parseSeriesJsonFields(seriesData as unknown as Record<string, unknown>), similar: parseJsonFieldsArray(similar as unknown as Record<string, unknown>[], ['cast', 'screenshots']) },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطا در دریافت سریال' });
  }
});

export { router as seriesRoutes };
