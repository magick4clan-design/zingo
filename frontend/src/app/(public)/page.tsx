'use client';

import { useEffect, useState } from 'react';
import HeroSlider from '@/components/movie/HeroSlider';
import ContentRow from '@/components/movie/ContentRow';
import { HeroSkeleton, MovieRowSkeleton } from '@/components/common/Skeletons';
import { moviesAPI, seriesAPI } from '@/lib/api';
import { FiClock, FiTrendingUp, FiStar, FiMonitor, FiFilm } from 'react-icons/fi';

interface HomeMovie {
  id: number;
  title: string;
  posterUrl: string;
  backdropUrl?: string;
  description: string;
  year?: number;
  rating?: number;
  quality?: string;
  views?: number;
}

type HomeHeroItem = HomeMovie & { type: 'movie' | 'series'; backdropUrl: string };

export default function HomePage() {
  const [heroItems, setHeroItems] = useState<HomeHeroItem[]>([]);
  const [newMovies, setNewMovies] = useState<HomeMovie[]>([]);
  const [popularMovies, setPopularMovies] = useState<HomeMovie[]>([]);
  const [topIMDB, setTopIMDB] = useState<HomeMovie[]>([]);
  const [newSeries, setNewSeries] = useState<HomeMovie[]>([]);
  const [popularSeries, setPopularSeries] = useState<HomeMovie[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [moviesRes, topImdbRes, seriesRes] = await Promise.all([
          moviesAPI.getAll({ page: '0', limit: '30' }),
          moviesAPI.getTopIMDB(30),
          seriesAPI.getAll({ page: '0', limit: '30' }),
        ]);

        const movies = moviesRes.data.data.movies || [];
        const imdbMovies = topImdbRes.data.data || [];
        const series = seriesRes.data.data.series || [];

        setNewMovies(movies);
        setPopularMovies(movies.slice(0, 12));
        setHeroItems(
          movies
            .filter((m: HomeMovie) => m.backdropUrl)
            .slice(0, 5)
            .map((m: HomeMovie) => ({ ...m, backdropUrl: m.backdropUrl as string, type: 'movie' as const }))
        );
        setTopIMDB(imdbMovies);
        setNewSeries(series);
        setPopularSeries(series);
      } catch (error) {
        console.error('Failed to fetch home data:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="container-main py-4 space-y-10">
        <HeroSkeleton />
        <MovieRowSkeleton />
        <MovieRowSkeleton />
      </div>
    );
  }

  return (
    <>
      {/* Hero Slider */}
      <section className="container-main py-4">
        <HeroSlider items={heroItems} />
      </section>

      {/* New Movies */}
      <section className="container-main">
        <ContentRow title={<><FiClock className="inline w-5 h-5 ml-1" />جدیدترین فیلم‌ها</>} href="/movies?sort=createdAt" items={newMovies} type="movie" />
      </section>

      {/* Popular Movies */}
      <section className="container-main">
        <ContentRow title={<><FiTrendingUp className="inline w-5 h-5 ml-1" />محبوب‌ترین فیلم‌ها</>} href="/movies?sort=views" items={popularMovies} type="movie" />
      </section>

      {/* Top IMDB */}
      <section className="container-main">
        <ContentRow title={<><FiStar className="inline w-5 h-5 ml-1" />برترین‌های IMDB</>} href="/top-imdb" items={topIMDB} type="movie" />
      </section>

      {/* New Series */}
      <section className="container-main">
        <ContentRow title={<><FiMonitor className="inline w-5 h-5 ml-1" />جدیدترین سریال‌ها</>} href="/series?sort=createdAt" items={newSeries} type="series" />
      </section>

      {/* Popular Series */}
      <section className="container-main">
        <ContentRow title={<><FiFilm className="inline w-5 h-5 ml-1" />محبوب‌ترین سریال‌ها</>} href="/series?sort=views" items={popularSeries} type="series" />
      </section>

    </>
  );
}
