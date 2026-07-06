'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import MovieCard from '@/components/movie/MovieCard';
import { MovieRowSkeleton } from '@/components/common/Skeletons';
import { moviesAPI, seriesAPI } from '@/lib/api';
import { toPersianNumber } from '@/lib/utils';
import { FiFilm, FiMonitor } from 'react-icons/fi';

function SearchPageContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const [movies, setMovies] = useState([]);
  const [series, setSeries] = useState([]);
  const [isLoading, setIsLoading] = useState(!!query);
  const [activeTab, setActiveTab] = useState<'all' | 'movies' | 'series'>('all');

  useEffect(() => {
    if (!query) return;
    setIsLoading(true);
    Promise.all([
      moviesAPI.getAll({ search: query, limit: '12' }),
      seriesAPI.getAll({ search: query, limit: '12' }),
    ])
      .then(([moviesRes, seriesRes]) => {
        setMovies(moviesRes.data.data.movies || []);
        setSeries(seriesRes.data.data.series || []);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [query]);

  return (
    <div className="container-main py-6">
      <h1 className="text-2xl font-black mb-2">جستجو</h1>
      {query && <p className="text-[var(--text-muted)] text-sm mb-6">نتایج جستجو برای: &quot;{query}&quot;</p>}

      {/* Tabs */}
      <div className="flex items-center gap-4 mb-8 border-b border-[var(--border-color)]">
        {(['all', 'movies', 'series'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 text-sm font-medium transition-all ${activeTab === tab ? 'tab-active' : 'tab-inactive'}`}
          >
            {tab === 'all' ? 'همه' : tab === 'movies' ? 'فیلم‌ها' : 'سریال‌ها'}
            {tab === 'all' && ` (${toPersianNumber(movies.length + series.length)})`}
          </button>
        ))}
      </div>

      {isLoading ? (
        <MovieRowSkeleton count={6} />
      ) : !query ? (
        <div className="text-center py-20">
          <p className="text-[var(--text-muted)]">عبارتی برای جستجو وارد کنید</p>
        </div>
      ) : (
        <>
          {(activeTab === 'all' || activeTab === 'movies') && movies.length > 0 && (
            <section className="mb-10">
              <h2 className="section-title"><FiFilm className="inline w-5 h-5 ml-1" />فیلم‌ها ({toPersianNumber(movies.length)})</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {movies.map((m: Record<string, unknown>) => (
                  <MovieCard key={String(m.id)} id={m.id as number} title={m.title as string} posterUrl={m.posterUrl as string} year={m.releaseYear as number} rating={m.imdbRating as number} />
                ))}
              </div>
            </section>
          )}
          {(activeTab === 'all' || activeTab === 'series') && series.length > 0 && (
            <section className="mb-10">
              <h2 className="section-title"><FiMonitor className="inline w-5 h-5 ml-1" />سریال‌ها ({toPersianNumber(series.length)})</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {series.map((s: Record<string, unknown>) => (
                  <MovieCard key={String(s.id)} id={s.id as number} title={s.title as string} posterUrl={s.posterUrl as string} year={s.releaseYear as number} rating={s.imdbRating as number} type="series" />
                ))}
              </div>
            </section>
          )}
          {movies.length === 0 && series.length === 0 && (
            <div className="text-center py-20">
              <p className="text-[var(--text-muted)]">نتیجه‌ای یافت نشد</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="container-main py-6"><MovieRowSkeleton count={6} /></div>}>
      <SearchPageContent />
    </Suspense>
  );
}
