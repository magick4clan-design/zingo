import { Router } from 'express';
import { prisma } from '../services/prisma';
import { AuthRequest, authenticate } from '../middleware/auth';
import { z } from 'zod';

const router = Router();

const commentSchema = z.object({
  text: z.string().min(3, 'متن کامنت باید حداقل ۳ کاراکتر باشد'),
  movieId: z.number().optional(),
  seriesId: z.number().optional(),
});

// ==================== GET /api/comments/:targetType/:targetId ====================
router.get('/:targetType/:targetId', async (req, res) => {
  try {
    const { targetType, targetId } = req.params;

    if (targetType !== 'movie' && targetType !== 'series') {
      return res.status(400).json({ success: false, message: 'targetType باید movie یا series باشد' });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const where = targetType === 'movie'
      ? { movieId: parseInt(targetId) }
      : { seriesId: parseInt(targetId) };

    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: { user: { select: { name: true, avatar: true } } },
      }),
      prisma.comment.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        comments,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطا در دریافت کامنت‌ها' });
  }
});

// ==================== POST /api/comments ====================
router.post('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const body = commentSchema.parse(req.body);

    if (!body.movieId && !body.seriesId) {
      return res.status(400).json({ success: false, message: 'شناسه فیلم یا سریال الزامی است' });
    }

    const comment = await prisma.comment.create({
      data: {
        userId: req.user!.id,
        movieId: body.movieId,
        seriesId: body.seriesId,
        text: body.text,
      },
      include: { user: { select: { name: true, avatar: true } } },
    });

    res.status(201).json({ success: true, data: comment });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: error.errors[0].message });
    }
    res.status(500).json({ success: false, message: 'خطا در ثبت کامنت' });
  }
});

export { router as commentRoutes };
