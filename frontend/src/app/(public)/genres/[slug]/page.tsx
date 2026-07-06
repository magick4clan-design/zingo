'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { FiArrowLeft, FiGrid, FiRefreshCw } from 'react-icons/fi';
import MovieCard from '@/components/movie/MovieCard';
import { MovieRowSkeleton } from '@/components/common/Skeletons';
import { genresAPI, moviesAPI, seriesAPI } from '@/lib/api';
import { toPersianNumber } from '@/lib/utils';
import type { Genre, Movie, Series } from '@/types';

export default function GenrePage() {
  const params = useParams<{ slug: string }>();
  const slug = useMemo(() => {
    const rawSlug = String(params.slug || '');
    try {
      return decodeURIComponent(rawSlug);
    } catch {
      return rawSlug;
    }
  }, [params.slug]);

  const [genre, setGenre] = useState<Genre | null>(null);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [series, setSeries] = useState<Series[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchGenreContent() {
      setIsLoading(true);
      setError('');

      try {
        const [genreRes, moviesRes, seriesRes] = await Promise.all([
          genresAPI.getBySlug(slug),
          moviesAPI.getAll({ genre: slug, limit: '18', sort: 'createdAt' }),
          seriesAPI.getAll({ genre: slug, limit: '18', sort: 'createdAt' }),
        ]);

        setGenre(genreRes.data.data);
        setMovies(moviesRes.data.data.movies);
        setSeries(seriesRes.data.data.series);
      } catch {
        setError('ژانر مورد نظر پیدا نشد یا دریافت اطلاعات آن با مشکل روبه‌رو شد.');
      } finally {
        setIsLoading(false);
      }
    }

    if (slug) fetchGenreContent();
  }, [slug]);

  const totalItems = movies.length + series.length;

  return (
    <div className="container-main py-8">
      <section className="glass mb-8 overflow-hidden rounded-[2rem] p-6">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-bold text-rose-300">
          <FiGrid className="h-4 w-4" />
          آرشیو ژانر
        </div>
        <h1 className="text-3xl font-black md:text-5xl">
          {genre?.name || slug}
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-8 text-[var(--text-muted)]">
          فیلم‌ها و سریال‌های مرتبط با این ژانر، مرتب‌شده بر اساس جدیدترین داده‌های موجود در زینگو.
        </p>
      </section>

      {isLoading ? (
        <MovieRowSkeleton count={12} />
      ) : error ? (
        <div className="glass rounded-[1.75rem] p-8 text-center">
          <p className="mb-5 text-[var(--text-secondary)]">{error}</p>
          <Link href="/movies" className="btn-primary inline-flex items-center gap-2 rounded-2xl px-6 py-3">
            رفتن به آرشیو فیلم‌ها
            <FiArrowLeft className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-10">
          <div className="rounded-2xl border border-[var(--glass-border)] bg-white/[0.04] px-4 py-3 text-sm text-[var(--text-muted)]">
            {toPersianNumber(totalItems)} مورد در این ژانر نمایش داده می‌شود.
          </div>

          <section>
            <div className="mb-5 flex items-center justify-between">
              <h2 className="section-title !mb-0">فیلم‌های این ژانر</h2>
              <Link href={`/movies?genre=${encodeURIComponent(slug)}`} className="text-sm font-bold text-rose-400 hover:text-rose-300">
                مشاهده همه
              </Link>
            </div>
            {movies.length === 0 ? (
              <EmptyGenreState label="فیلمی برای این ژانر پیدا نشد" />
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                {movies.map((movie) => (
                  <MovieCard
                    key={movie.id}
                    id={movie.id}
                    title={movie.title}
                    posterUrl={movie.posterUrl}
                    year={movie.releaseYear}
                    rating={movie.imdbRating}
                    quality={movie.quality}
                    views={movie.views}
                  />
                ))}
              </div>
            )}
          </section>

          <section>
            <div className="mb-5 flex items-center justify-between">
              <h2 className="section-title !mb-0">سریال‌های این ژانر</h2>
              <Link href={`/series?genre=${encodeURIComponent(slug)}`} className="text-sm font-bold text-rose-400 hover:text-rose-300">
                مشاهده همه
              </Link>
            </div>
            {series.length === 0 ? (
              <EmptyGenreState label="سریالی برای این ژانر پیدا نشد" />
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                {series.map((item) => (
                  <MovieCard
                    key={item.id}
                    id={item.id}
                    title={item.title}
                    posterUrl={item.posterUrl}
                    year={item.releaseYear}
                    rating={item.imdbRating}
                    views={item.views}
                    type="series"
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

function EmptyGenreState({ label }: { label: string }) {
  return (
    <div className="glass flex items-center justify-center gap-2 rounded-[1.5rem] px-4 py-10 text-sm text-[var(--text-muted)]">
      <FiRefreshCw className="h-4 w-4" />
      {label}
    </div>
  );
}
