import { Router } from 'express';
import * as proxy from '../services/hostinnegarProxy';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { page = '0', limit = '30', search, sort = 'createdAt' } = req.query;
    const p = parseInt(page as string);

    let series;
    if (search) {
      series = await proxy.searchContent(search as string);
      series = series.filter((s: any) => s.seasons !== undefined);
    } else if (sort === 'rating' || sort === 'imdb') {
      series = await proxy.getTopRatedSeries(p);
    } else if (sort === 'views') {
      series = await proxy.getUpdatedSeries(p);
    } else {
      series = await proxy.getSeries(p);
    }

    res.json({ success: true, data: { series, pagination: { page: p, limit: 30, total: series.length, totalPages: 999 } } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطا در دریافت سریال‌ها' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const serie = await proxy.getSerieById(parseInt(req.params.id));
    if (!serie) return res.status(404).json({ success: false, message: 'سریال یافت نشد' });
    const seasons = await proxy.getSeasons(parseInt(req.params.id));
    res.json({ success: true, data: { ...serie, seasons } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطا' });
  }
});

export { router as seriesRoutes };
