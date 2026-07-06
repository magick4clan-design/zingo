'use client';

import { useEffect, useState } from 'react';
import { favoritesAPI } from '@/lib/api';
import MovieCard from '@/components/movie/MovieCard';
import { MovieRowSkeleton } from '@/components/common/Skeletons';
import { FiHeart } from 'react-icons/fi';

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    favoritesAPI.getAll()
      .then((res) => setFavorites(res.data.data || []))
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="container-main py-6">
      <h1 className="text-2xl font-black mb-8">علاقه‌مندی‌ها</h1>

      {isLoading ? (
        <MovieRowSkeleton count={6} />
      ) : favorites.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-20 h-20 rounded-2xl bg-[var(--bg-secondary)] flex items-center justify-center mb-4">
            <span className="text-4xl"><FiHeart className="w-10 h-10" /></span>
          </div>
          <p className="text-[var(--text-muted)]">هنوز علاقه‌مندی‌ای اضافه نکرده‌اید</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {favorites.map((fav: Record<string, unknown>) => {
            const item = (fav.movie || fav.series) as Record<string, unknown> | undefined;
            if (!item) return null;
            return (
              <MovieCard
                key={fav.id as number}
                id={item.id as number}
                title={item.title as string}
                posterUrl={item.posterUrl as string}
                year={item.releaseYear as number}
                rating={item.imdbRating as number}
                type={fav.movie ? 'movie' : 'series'}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
