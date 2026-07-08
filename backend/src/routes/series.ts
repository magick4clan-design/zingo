import { Router } from 'express';
import * as proxy from '../services/hostinnegarProxy';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { page = '1', limit = '20', genre, search, sort = 'createdAt', order = 'desc', year, rating } = req.query;
    const p = parseInt(page as string);
    const l = parseInt(limit as string);

    let series;
    if (search) {
      series = await proxy.searchContent(search as string);
      series = series.filter((s: any) => s.seasons !== undefined);
    } else if (sort === 'rating' || sort === 'imdb') {
      series = await proxy.getTopRatedSeries(p, l);
    } else if (sort === 'views') {
      series = await proxy.getUpdatedSeries(p, l);
    } else {
      series = await proxy.getNewSeries(p, l);
    }

    if (year) {
      series = series.filter((s: any) => s.releaseYear === parseInt(year as string));
    }
    if (rating) {
      series = series.filter((s: any) => s.imdbRating && s.imdbRating >= parseFloat(rating as string));
    }
    if (genre) {
      series = series.filter((s: any) => 
        s.genres?.some((g: any) => g.genre?.slug === genre || g.genre?.name === genre)
      );
    }

    res.json({
      success: true,
      data: {
        series: series.slice(0, l),
        pagination: { page: p, limit: l, total: series.length, totalPages: Math.ceil(series.length / l) },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطا در دریافت سریال‌ها' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const serie = await proxy.getSerieById(parseInt(req.params.id));
    if (!serie) {
      return res.status(404).json({ success: false, message: 'سریال یافت نشد' });
    }
    const seasons = await proxy.getSeasons(parseInt(req.params.id));
    res.json({ success: true, data: { ...serie, seasons } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطا در دریافت سریال' });
  }
});

export { router as seriesRoutes };
