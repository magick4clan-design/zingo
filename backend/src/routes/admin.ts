import { Router } from 'express';
import { prisma } from '../services/prisma';
import { AuthRequest, authenticate, isAdmin } from '../middleware/auth';

const router = Router();

// All admin routes require authentication + admin role
router.use(authenticate, isAdmin);

// ==================== GET /api/admin/dashboard ====================
router.get('/dashboard', async (_req, res) => {
  try {
    const [movieCount, seriesCount, userCount, adCount, movieViews, seriesViews] = await Promise.all([
      prisma.movie.count({ where: { status: 'PUBLISHED' } }),
      prisma.series.count({ where: { status: 'PUBLISHED' } }),
      prisma.user.count(),
      prisma.ad.count({ where: { isActive: true } }),
      prisma.movie.aggregate({ _sum: { views: true } }),
      prisma.series.aggregate({ _sum: { views: true } }),
    ]);

    const recentMovies = await prisma.movie.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, title: true, posterUrl: true, views: true, createdAt: true },
    });

    const recentSeries = await prisma.series.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, title: true, posterUrl: true, views: true, createdAt: true },
    });

    const recentScrapLogs = await prisma.scrapLog.findMany({
      orderBy: { startedAt: 'desc' },
      take: 10,
    });

    res.json({
      success: true,
      data: {
        stats: {
          movieCount,
          seriesCount,
          userCount,
          adCount,
          totalViews: (movieViews._sum.views || 0) + (seriesViews._sum.views || 0),
        },
        recentMovies,
        recentSeries,
        recentScrapLogs,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطا در دریافت اطلاعات داشبورد' });
  }
});

// ==================== GET /api/admin/movies ====================
router.get('/movies', async (req, res) => {
  try {
    const { page = '1', limit = '20', status } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const where: Record<string, unknown> = {};
    if (status) where.status = status;

    const [movies, total] = await Promise.all([
      prisma.movie.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: { genres: { include: { genre: true } } },
      }),
      prisma.movie.count({ where }),
    ]);

    res.json({
      success: true,
      data: { movies, pagination: { page: +page, limit: take, total, totalPages: Math.ceil(total / take) } },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطا در دریافت فیلم‌ها' });
  }
});

// ==================== PUT /api/admin/movies/:id ====================
router.put('/movies/:id', async (req, res) => {
  try {
    const { title, originalTitle, posterUrl, backdropUrl, description, releaseYear, duration, imdbRating, imdbId, quality, country, language, director, cast, screenshots, trailerUrl, downloadLinks, source, sourceUrl, status } = req.body;
    const movie = await prisma.movie.update({
      where: { id: parseInt(req.params.id) },
      data: {
        ...(title !== undefined && { title }),
        ...(originalTitle !== undefined && { originalTitle }),
        ...(posterUrl !== undefined && { posterUrl }),
        ...(backdropUrl !== undefined && { backdropUrl }),
        ...(description !== undefined && { description }),
        ...(releaseYear !== undefined && { releaseYear }),
        ...(duration !== undefined && { duration }),
        ...(imdbRating !== undefined && { imdbRating }),
        ...(imdbId !== undefined && { imdbId }),
        ...(quality !== undefined && { quality }),
        ...(country !== undefined && { country }),
        ...(language !== undefined && { language }),
        ...(director !== undefined && { director }),
        ...(cast !== undefined && { cast: typeof cast === 'string' ? cast : JSON.stringify(cast) }),
        ...(screenshots !== undefined && { screenshots: typeof screenshots === 'string' ? screenshots : JSON.stringify(screenshots) }),
        ...(trailerUrl !== undefined && { trailerUrl }),
        ...(downloadLinks !== undefined && { downloadLinks: typeof downloadLinks === 'string' ? downloadLinks : JSON.stringify(downloadLinks) }),
        ...(source !== undefined && { source }),
        ...(sourceUrl !== undefined && { sourceUrl }),
        ...(status !== undefined && { status }),
      },
    });
    res.json({ success: true, data: movie });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطا در بروزرسانی فیلم' });
  }
});

// ==================== DELETE /api/admin/movies/:id ====================
router.delete('/movies/:id', async (req, res) => {
  try {
    await prisma.movie.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true, message: 'فیلم حذف شد' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطا در حذف فیلم' });
  }
});

// ==================== GET /api/admin/series ====================
router.get('/series', async (req, res) => {
  try {
    const { page = '1', limit = '20', status } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const where: Record<string, unknown> = {};
    if (status) where.status = status;

    const [seriesList, total] = await Promise.all([
      prisma.series.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: { genres: { include: { genre: true } } },
      }),
      prisma.series.count({ where }),
    ]);

    res.json({
      success: true,
      data: { series: seriesList, pagination: { page: +page, limit: take, total, totalPages: Math.ceil(total / take) } },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطا در دریافت سریال‌ها' });
  }
});

// ==================== PUT /api/admin/series/:id ====================
router.put('/series/:id', async (req, res) => {
  try {
    const { title, originalTitle, posterUrl, backdropUrl, description, releaseYear, imdbRating, imdbId, country, language, network, cast, screenshots, trailerUrl, source, sourceUrl, status } = req.body;
    const seriesData = await prisma.series.update({
      where: { id: parseInt(req.params.id) },
      data: {
        ...(title !== undefined && { title }),
        ...(originalTitle !== undefined && { originalTitle }),
        ...(posterUrl !== undefined && { posterUrl }),
        ...(backdropUrl !== undefined && { backdropUrl }),
        ...(description !== undefined && { description }),
        ...(releaseYear !== undefined && { releaseYear }),
        ...(imdbRating !== undefined && { imdbRating }),
        ...(imdbId !== undefined && { imdbId }),
        ...(country !== undefined && { country }),
        ...(language !== undefined && { language }),
        ...(network !== undefined && { network }),
        ...(cast !== undefined && { cast: typeof cast === 'string' ? cast : JSON.stringify(cast) }),
        ...(screenshots !== undefined && { screenshots: typeof screenshots === 'string' ? screenshots : JSON.stringify(screenshots) }),
        ...(trailerUrl !== undefined && { trailerUrl }),
        ...(source !== undefined && { source }),
        ...(sourceUrl !== undefined && { sourceUrl }),
        ...(status !== undefined && { status }),
      },
    });
    res.json({ success: true, data: seriesData });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطا در بروزرسانی سریال' });
  }
});

// ==================== DELETE /api/admin/series/:id ====================
router.delete('/series/:id', async (req, res) => {
  try {
    await prisma.series.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true, message: 'سریال حذف شد' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطا در حذف سریال' });
  }
});

// ==================== GET /api/admin/users ====================
router.get('/users', async (req, res) => {
  try {
    const { page = '1', limit = '20' } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        select: { id: true, email: true, name: true, role: true, isVerified: true, createdAt: true },
      }),
      prisma.user.count(),
    ]);

    res.json({
      success: true,
      data: { users, pagination: { page: +page, limit: take, total, totalPages: Math.ceil(total / take) } },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطا در دریافت کاربران' });
  }
});

// ==================== GET /api/admin/ads ====================
router.get('/ads', async (_req, res) => {
  try {
    const ads = await prisma.ad.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: ads });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطا در دریافت تبلیغات' });
  }
});

// ==================== POST /api/admin/ads ====================
router.post('/ads', async (req, res) => {
  try {
    const { title, type, imageUrl, linkUrl, position, priority, isActive, startDate, endDate } = req.body;
    if (!title || !type || !imageUrl || !linkUrl) {
      return res.status(400).json({ success: false, message: 'فیلدهای title, type, imageUrl, linkUrl الزامی هستند' });
    }
    const ad = await prisma.ad.create({
      data: {
        title, type, imageUrl, linkUrl,
        ...(position !== undefined && { position }),
        ...(priority !== undefined && { priority }),
        ...(isActive !== undefined && { isActive }),
        ...(startDate !== undefined && { startDate }),
        ...(endDate !== undefined && { endDate }),
      },
    });
    res.status(201).json({ success: true, data: ad });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطا در ایجاد تبلیغ' });
  }
});

// ==================== PUT /api/admin/ads/:id ====================
router.put('/ads/:id', async (req, res) => {
  try {
    const { title, type, imageUrl, linkUrl, position, priority, isActive, startDate, endDate } = req.body;
    const ad = await prisma.ad.update({
      where: { id: parseInt(req.params.id) },
      data: {
        ...(title !== undefined && { title }),
        ...(type !== undefined && { type }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(linkUrl !== undefined && { linkUrl }),
        ...(position !== undefined && { position }),
        ...(priority !== undefined && { priority }),
        ...(isActive !== undefined && { isActive }),
        ...(startDate !== undefined && { startDate }),
        ...(endDate !== undefined && { endDate }),
      },
    });
    res.json({ success: true, data: ad });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطا در بروزرسانی تبلیغ' });
  }
});

// ==================== DELETE /api/admin/ads/:id ====================
router.delete('/ads/:id', async (req, res) => {
  try {
    await prisma.ad.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true, message: 'تبلیغ حذف شد' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطا در حذف تبلیغ' });
  }
});

// ==================== GET /api/admin/genres ====================
router.get('/genres', async (_req, res) => {
  try {
    const genres = await prisma.genre.findMany({ orderBy: { name: 'asc' } });
    res.json({ success: true, data: genres });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطا در دریافت ژانرها' });
  }
});

// ==================== POST /api/admin/genres ====================
router.post('/genres', async (req, res) => {
  try {
    const { name, slug } = req.body;
    if (!name || !slug) {
      return res.status(400).json({ success: false, message: 'فیلدهای name و slug الزامی هستند' });
    }
    const genre = await prisma.genre.create({ data: { name, slug } });
    res.status(201).json({ success: true, data: genre });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطا در ایجاد ژانر' });
  }
});

// ==================== DELETE /api/admin/genres/:id ====================
router.delete('/genres/:id', async (req, res) => {
  try {
    await prisma.genre.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true, message: 'ژانر حذف شد' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطا در حذف ژانر' });
  }
});

// ==================== GET /api/admin/comments ====================
router.get('/comments', async (_req, res) => {
  try {
    const comments = await prisma.comment.findMany({
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true } }, movie: { select: { title: true } }, series: { select: { title: true } } },
    });
    res.json({ success: true, data: comments });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطا در دریافت کامنت‌ها' });
  }
});

// ==================== DELETE /api/admin/comments/:id ====================
router.delete('/comments/:id', async (req, res) => {
  try {
    await prisma.comment.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true, message: 'کامنت حذف شد' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطا در حذف کامنت' });
  }
});

export { router as adminRoutes };
