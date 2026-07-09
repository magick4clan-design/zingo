'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { FiFilter, FiX, FiMonitor } from 'react-icons/fi';
import MovieCard from '@/components/movie/MovieCard';
import { MovieRowSkeleton } from '@/components/common/Skeletons';
import { seriesAPI, genresAPI } from '@/lib/api';
import { toPersianNumber } from '@/lib/utils';

function SeriesPageContent() {
  const searchParams = useSearchParams();
  const [series, setSeries] = useState([]);
  const [genres, setGenres] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState(searchParams.get('genre') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'createdAt');

  useEffect(() => {
    async function fetchSeries() {
      setIsLoading(true);
      try {
        const params: Record<string, string> = {
          page: String(pagination.page - 1),
          limit: '30',
          sort: sortBy,
        };
        if (selectedGenre) params.genre = selectedGenre;

        const res = await seriesAPI.getAll(params);
        setSeries(res.data.data.series);
      } catch (error) {
        console.error('Failed to fetch series:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchSeries();
  }, [pagination.page, sortBy, selectedGenre]);

  useEffect(() => {
    genresAPI.getAll().then((res) => setGenres(res.data.data)).catch(console.error);
  }, []);

  return (
    <div className="container-main py-8">
      {/* Page Header */}
      <div className="glass mb-8 flex flex-col gap-5 rounded-[1.75rem] p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-rose-500/10 px-3 py-1 text-xs font-bold text-rose-400">
            <FiMonitor className="h-4 w-4" />
            آرشیو سریال و انیمه
          </div>
          <h1 className="text-2xl md:text-3xl font-black">سریال‌ها</h1>
          <p className="text-[var(--text-muted)] text-sm mt-1">
            بهترین سریال‌های خارجی و کره‌ای
          </p>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="input-field !w-full !py-2 !px-3 text-sm sm:!w-auto"
          >
            <option value="createdAt">جدیدترین</option>
            <option value="views">محبوب‌ترین</option>
            <option value="rating">بالاترین امتیاز</option>
          </select>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`rounded-2xl border p-2.5 transition-all ${
              showFilters ? 'border-rose-500/40 bg-rose-500/15 text-rose-400' : 'border-[var(--glass-border)] bg-white/10 text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <FiFilter className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="glass mb-6 rounded-[1.5rem] p-4 animate-slide-down">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-sm">فیلتر بر اساس ژانر</h3>
            {selectedGenre && (
              <button onClick={() => setSelectedGenre('')} className="text-xs text-rose-500 hover:text-rose-400 flex items-center gap-1">
                <FiX className="w-3 h-3" /> حذف فیلتر
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedGenre('')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${!selectedGenre ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' : 'bg-white/10 text-[var(--text-secondary)] hover:bg-white/15'}`}
            >
              همه
            </button>
            {genres.map((genre: { slug: string; name: string }) => (
              <button
                key={genre.slug}
                onClick={() => setSelectedGenre(genre.slug)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${selectedGenre === genre.slug ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' : 'bg-white/10 text-[var(--text-secondary)] hover:bg-white/15'}`}
              >
                {genre.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <p className="mb-6 rounded-2xl border border-[var(--glass-border)] bg-white/[0.04] px-4 py-3 text-sm text-[var(--text-muted)]">{toPersianNumber(pagination.total)} سریال یافت شد</p>

      {isLoading ? (
        <MovieRowSkeleton count={12} />
      ) : series.length === 0 ? (
        <div className="glass flex flex-col items-center justify-center rounded-[1.75rem] py-20">
          <div className="w-20 h-20 rounded-3xl bg-rose-500/10 text-rose-400 flex items-center justify-center mb-4">
            <span className="text-4xl"><FiMonitor className="w-10 h-10" /></span>
          </div>
          <p className="text-[var(--text-muted)]">سریالی یافت نشد</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {series.map((s: Record<string, unknown>) => (
            <MovieCard
              key={String(s.id)}
              id={s.id as number}
              title={s.title as string}
              posterUrl={s.posterUrl as string}
              year={s.releaseYear as number}
              rating={s.imdbRating as number}
              views={s.views as number}
              type="series"
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-10">
          {Array.from({ length: Math.min(pagination.totalPages, 10) }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => setPagination((prev) => ({ ...prev, page }))}
              className={`w-10 h-10 rounded-xl text-sm font-medium transition-all ${
                pagination.page === page ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' : 'border border-[var(--glass-border)] bg-white/10 text-[var(--text-secondary)] hover:bg-white/15'
              }`}
            >
              {toPersianNumber(page)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SeriesPage() {
  return (
    <Suspense fallback={<div className="container-main py-6"><MovieRowSkeleton count={12} /></div>}>
      <SeriesPageContent />
    </Suspense>
  );
}
