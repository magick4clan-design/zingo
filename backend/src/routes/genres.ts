import { Router } from 'express';
import { prisma } from '../services/prisma';

const router = Router();

// ==================== GET /api/genres ====================
router.get('/', async (_req, res) => {
  try {
    const genres = await prisma.genre.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { movies: true, series: true },
        },
      },
    });
    res.json({ success: true, data: genres });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطا در دریافت ژانرها' });
  }
});

// ==================== GET /api/genres/:slug ====================
router.get('/:slug', async (req, res) => {
  try {
    const genre = await prisma.genre.findUnique({
      where: { slug: req.params.slug },
    });
    if (!genre) {
      return res.status(404).json({ success: false, message: 'ژانر یافت نشد' });
    }
    res.json({ success: true, data: genre });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطا در دریافت ژانر' });
  }
});

export { router as genreRoutes };
