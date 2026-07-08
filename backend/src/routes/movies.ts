import { Router } from 'express';
import { prisma } from '../services/prisma';
import { parseJsonFields, parseJsonFieldsArray } from '../services/helpers';

const router = Router();

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

    const [movies, total] = await Promise.all([
      prisma.movie.findMany({
        where, orderBy, skip, take,
        include: { genres: { include: { genre: true } }, _count: { select: { favorites: true, comments: true } } },
      }),
      prisma.movie.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        movies: parseJsonFieldsArray(movies as unknown as Record<string, unknown>[], ['cast', 'screenshots', 'downloadLinks']),
        pagination: { page: parseInt(page as string), limit: take, total, totalPages: Math.ceil(total / take) },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطا در دریافت فیلم‌ها' });
  }
});

router.get('/top-imdb', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string || '10');
    const movies = await prisma.movie.findMany({
      where: { status: 'PUBLISHED', imdbRating: { not: null } },
      orderBy: { imdbRating: 'desc' },
      take: limit,
      include: { genres: { include: { genre: true } } },
    });
    res.json({ success: true, data: parseJsonFieldsArray(movies as unknown as Record<string, unknown>[], ['cast', 'screenshots', 'downloadLinks']) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطا در دریافت برترین فیلم‌ها' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const movie = await prisma.movie.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        genres: { include: { genre: true } },
        comments: { include: { user: { select: { name: true, avatar: true } } }, orderBy: { createdAt: 'desc' }, take: 20 },
        _count: { select: { favorites: true, comments: true } },
      },
    });

    if (!movie) return res.status(404).json({ success: false, message: 'فیلم یافت نشد' });

    await prisma.movie.update({ where: { id: movie.id }, data: { views: { increment: 1 } } });

    const genreIds = movie.genres.map((g) => g.genreId);
    const similar = await prisma.movie.findMany({
      where: { id: { not: movie.id }, status: 'PUBLISHED', genres: { some: { genreId: { in: genreIds } } } },
      take: 6,
      include: { genres: { include: { genre: true } } },
    });

    res.json({
      success: true,
      data: { ...parseJsonFields(movie as unknown as Record<string, unknown>, ['cast', 'screenshots', 'downloadLinks']), similar: parseJsonFieldsArray(similar as unknown as Record<string, unknown>[], ['cast', 'screenshots', 'downloadLinks']) },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطا در دریافت فیلم' });
  }
});

export { router as movieRoutes };
