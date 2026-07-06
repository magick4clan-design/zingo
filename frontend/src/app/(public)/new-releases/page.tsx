'use client';

import { useEffect, useState } from 'react';
import MovieCard from '@/components/movie/MovieCard';
import { MovieRowSkeleton } from '@/components/common/Skeletons';
import { moviesAPI, seriesAPI } from '@/lib/api';
import { FiClock, FiFilm, FiMonitor } from 'react-icons/fi';

export default function NewReleasesPage() {
  const [movies, setMovies] = useState([]);
  const [series, setSeries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      moviesAPI.getAll({ limit: '12', sort: 'createdAt', order: 'desc' }),
      seriesAPI.getAll({ limit: '12', sort: 'createdAt', order: 'desc' }),
    ])
      .then(([moviesRes, seriesRes]) => {
        setMovies(moviesRes.data.data.movies || []);
        setSeries(seriesRes.data.data.series || []);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="container-main py-6">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-black"><FiClock className="inline w-7 h-7 ml-2" />تازه‌ترین‌ها</h1>
        <p className="text-[var(--text-muted)] text-sm mt-1">آخرین فیلم‌ها و سریال‌های اضافه شده</p>
      </div>

      {isLoading ? (
        <MovieRowSkeleton count={6} />
      ) : (
        <>
          {movies.length > 0 && (
            <section className="mb-10">
              <h2 className="section-title"><FiFilm className="inline w-5 h-5 ml-1" />فیلم‌ها</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {movies.map((m: Record<string, unknown>) => (
                  <MovieCard key={String(m.id)} id={m.id as number} title={m.title as string} posterUrl={m.posterUrl as string} year={m.releaseYear as number} rating={m.imdbRating as number} />
                ))}
              </div>
            </section>
          )}
          {series.length > 0 && (
            <section className="mb-10">
              <h2 className="section-title"><FiMonitor className="inline w-5 h-5 ml-1" />سریال‌ها</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {series.map((s: Record<string, unknown>) => (
                  <MovieCard key={String(s.id)} id={s.id as number} title={s.title as string} posterUrl={s.posterUrl as string} year={s.releaseYear as number} rating={s.imdbRating as number} type="series" />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
