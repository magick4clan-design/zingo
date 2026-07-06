import { Router } from 'express';
import { prisma } from '../services/prisma';
import { AuthRequest, authenticate } from '../middleware/auth';

const router = Router();

// ==================== GET /api/favorites ====================
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const favorites = await prisma.favorite.findMany({
      where: { userId: req.user!.id },
      include: {
        movie: { include: { genres: { include: { genre: true } } } },
        series: { include: { genres: { include: { genre: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: favorites });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطا در دریافت علاقه‌مندی‌ها' });
  }
});

// ==================== POST /api/favorites ====================
router.post('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const { movieId, seriesId } = req.body;

    if (!movieId && !seriesId) {
      return res.status(400).json({ success: false, message: 'شناسه فیلم یا سریال الزامی است' });
    }

    if (movieId && seriesId) {
      return res.status(400).json({ success: false, message: 'فقط یکی از movieId یا seriesId باید ارسال شود' });
    }

    const existing = await prisma.favorite.findFirst({
      where: {
        userId: req.user!.id,
        ...(movieId ? { movieId } : {}),
        ...(seriesId ? { seriesId } : {}),
      },
    });

    if (existing) {
      // Remove from favorites
      await prisma.favorite.delete({ where: { id: existing.id } });
      return res.json({ success: true, message: 'از علاقه‌مندی‌ها حذف شد', data: false });
    }

    const favorite = await prisma.favorite.create({
      data: {
        userId: req.user!.id,
        movieId: movieId || null,
        seriesId: seriesId || null,
      },
    });

    res.status(201).json({ success: true, message: 'به علاقه‌مندی‌ها اضافه شد', data: favorite });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطا در افزودن به علاقه‌مندی‌ها' });
  }
});

export { router as favoriteRoutes };
