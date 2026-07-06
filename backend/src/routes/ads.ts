import { Router } from 'express';
import { prisma } from '../services/prisma';

const router = Router();

// ==================== GET /api/ads ====================
router.get('/', async (req, res) => {
  try {
    const { type, position, active = 'true' } = req.query;

    const where: Record<string, unknown> = {};
    if (type) where.type = type;
    if (position) where.position = position;
    if (active !== 'all') where.isActive = active === 'true';

    const ads = await prisma.ad.findMany({
      where,
      orderBy: { priority: 'desc' },
    });

    res.json({ success: true, data: ads });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطا در دریافت تبلیغات' });
  }
});

// ==================== GET /api/ads/:id ====================
router.get('/:id', async (req, res) => {
  try {
    const ad = await prisma.ad.findUnique({ where: { id: parseInt(req.params.id) } });
    if (!ad) {
      return res.status(404).json({ success: false, message: 'تبلیغ یافت نشد' });
    }

    // Increment impression
    await prisma.ad.update({
      where: { id: ad.id },
      data: { impressions: { increment: 1 } },
    });

    res.json({ success: true, data: ad });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطا در دریافت تبلیغ' });
  }
});

// ==================== POST /api/ads/:id/click ====================
router.post('/:id/click', async (req, res) => {
  try {
    await prisma.ad.update({
      where: { id: parseInt(req.params.id) },
      data: { clicks: { increment: 1 } },
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطا در ثبت کلیک' });
  }
});

export { router as adRoutes };
