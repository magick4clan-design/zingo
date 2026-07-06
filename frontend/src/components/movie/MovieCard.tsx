'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FiStar, FiEye, FiPlay } from 'react-icons/fi';
import { formatNumber, getQualityColor, toPersianNumber } from '@/lib/utils';

interface MovieCardProps {
  id: number;
  title: string;
  posterUrl: string;
  year?: number;
  rating?: number;
  quality?: string;
  views?: number;
  type?: 'movie' | 'series';
}

export default function MovieCard({ id, title, posterUrl, year, rating, quality, views, type = 'movie' }: MovieCardProps) {
  const href = type === 'series' ? `/series/${id}` : `/movies/${id}`;

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Link href={href} className="group block">
        <div className="card group/card">
          <div className="relative aspect-[2/3] overflow-hidden bg-[var(--bg-secondary)]">
            <Image
              src={posterUrl || '/placeholder.jpg'}
              alt={title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            />

            <div className="poster-gradient absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-white/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

            {quality && (
              <div className={`absolute right-2 top-2 rounded-xl border border-white/10 bg-black/55 px-2 py-1 text-xs font-bold shadow-lg backdrop-blur-md ${getQualityColor(quality)}`}>
                {quality}
              </div>
            )}

            {rating && rating > 0 && (
              <div className="absolute left-2 top-2 flex items-center gap-1 rounded-xl border border-white/10 bg-black/55 px-2 py-1 text-xs font-bold text-yellow-400 shadow-lg backdrop-blur-md">
                <FiStar className="h-3 w-3 fill-current" />
                {rating.toFixed(1)}
              </div>
            )}

            <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-rose-500/90 text-white shadow-2xl shadow-rose-500/40 backdrop-blur-md">
                <FiPlay className="mr-0.5 h-6 w-6 fill-current" />
              </div>
            </div>
          </div>

          <div className="space-y-2 p-3">
            <h3 className="line-clamp-2 min-h-[3rem] text-sm font-semibold leading-6 text-[var(--text-primary)] transition-colors group-hover:text-rose-500">
              {title}
            </h3>

            <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
              {year ? <span>{toPersianNumber(year)}</span> : <span />}
              {views !== undefined && (
                <span className="flex items-center gap-1">
                  <FiEye className="h-3 w-3" />
                  {formatNumber(views)}
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
