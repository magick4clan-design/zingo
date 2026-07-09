import { Router } from 'express';
import * as proxy from '../services/hostinnegarProxy';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { page = '0', limit = '30', search, sort = 'createdAt' } = req.query;
    const p = parseInt(page as string);

    let movies;
    if (search) {
      movies = await proxy.searchContent(search as string);
      movies = movies.filter((m: any) => !m.seasons);
    } else if (sort === 'rating' || sort === 'imdb') {
      movies = await proxy.getTopRatedMovies(p);
    } else {
      movies = await proxy.getMovies(p);
    }

    res.json({ success: true, data: { movies, pagination: { page: p, limit: 30, total: movies.length, totalPages: 999 } } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطا در دریافت فیلم‌ها' });
  }
});

router.get('/top-imdb', async (req, res) => {
  try {
    const movies = await proxy.getTopRatedMovies(0);
    res.json({ success: true, data: movies });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطا' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const movie = await proxy.getMovieById(parseInt(req.params.id));
    if (!movie) return res.status(404).json({ success: false, message: 'فیلم یافت نشد' });
    res.json({ success: true, data: movie });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطا' });
  }
});

export { router as movieRoutes };
