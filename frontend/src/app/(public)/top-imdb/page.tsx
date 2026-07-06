'use client';

import { useEffect, useState } from 'react';
import { MovieRowSkeleton } from '@/components/common/Skeletons';
import { moviesAPI } from '@/lib/api';
import { FiStar } from 'react-icons/fi';

export default function TopImdbPage() {
  const [movies, setMovies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    moviesAPI.getTopIMDB(30)
      .then((res) => setMovies(res.data.data))
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="container-main py-6">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-black"><FiStar className="inline w-7 h-7 ml-2" />برترین‌های IMDB</h1>
        <p className="text-[var(--text-muted)] text-sm mt-1">بالاترین امتیاز IMDB</p>
      </div>

      {isLoading ? (
        <MovieRowSkeleton count={12} />
      ) : (
        <div className="space-y-4">
          {movies.map((movie: Record<string, unknown>, index: number) => {
            const releaseYear = typeof movie.releaseYear === 'number' ? movie.releaseYear : undefined;
            const imdbRating = typeof movie.imdbRating === 'number' ? movie.imdbRating : undefined;
            const genres = Array.isArray(movie.genres) ? movie.genres as Record<string, unknown>[] : [];

            return (
              <div key={String(movie.id)} className="flex items-center gap-4 p-4 card">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shrink-0">
                  <span className="text-white font-black text-sm">{index + 1}</span>
                </div>
                <div className="w-16 h-20 rounded-lg overflow-hidden shrink-0 bg-[var(--bg-secondary)]">
                  <img src={movie.posterUrl as string} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold line-clamp-1">{movie.title as string}</h3>
                  <div className="flex items-center gap-3 mt-1 text-xs text-[var(--text-muted)]">
                    {releaseYear && <span>{releaseYear}</span>}
                    <span className="text-yellow-400"><FiStar className="inline w-3 h-3 ml-0.5 fill-current" /> {imdbRating?.toFixed(1)}</span>
                  </div>
                </div>
                <div className="hidden sm:flex items-center gap-2">
                  {genres.slice(0, 3).map((g: Record<string, unknown>) => {
                    const genre = g.genre as Record<string, unknown> | undefined;
                    return <span key={String(g.id)} className="badge text-[10px]">{genre?.name as string}</span>;
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
