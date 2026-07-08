import { Router } from 'express';
import * as proxy from '../services/hostinnegarProxy';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { page = '1', limit = '20', genre, search, sort = 'createdAt', order = 'desc', year, rating } = req.query;
    const p = parseInt(page as string);
    const l = parseInt(limit as string);

    let movies;
    if (search) {
      movies = await proxy.searchContent(search as string);
    } else if (sort === 'rating' || sort === 'imdb') {
      movies = await proxy.getTopRatedMovies(p, l);
    } else {
      movies = await proxy.getNewMovies(p, l);
    }

    if (year) {
      movies = movies.filter((m: any) => m.releaseYear === parseInt(year as string));
    }
    if (rating) {
      movies = movies.filter((m: any) => m.imdbRating && m.imdbRating >= parseFloat(rating as string));
    }
    if (genre) {
      movies = movies.filter((m: any) => 
        m.genres?.some((g: any) => g.genre?.slug === genre || g.genre?.name === genre)
      );
    }

    res.json({
      success: true,
      data: {
        movies: movies.slice(0, l),
        pagination: { page: p, limit: l, total: movies.length, totalPages: Math.ceil(movies.length / l) },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطا در دریافت فیلم‌ها' });
  }
});

router.get('/top-imdb', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string || '10');
    const movies = await proxy.getTopRatedMovies(1, limit);
    res.json({ success: true, data: movies.slice(0, limit) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطا در دریافت برترین فیلم‌ها' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const movie = await proxy.getMovieById(parseInt(req.params.id));
    if (!movie) {
      return res.status(404).json({ success: false, message: 'فیلم یافت نشد' });
    }
    res.json({ success: true, data: movie });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطا در دریافت فیلم' });
  }
});

export { router as movieRoutes };
