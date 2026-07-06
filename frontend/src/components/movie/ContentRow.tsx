'use client';

import Link from 'next/link';
import { FiChevronLeft } from 'react-icons/fi';
import MovieCard from './MovieCard';

interface ContentRowProps {
  title: React.ReactNode;
  href?: string;
  items: Array<{
    id: number;
    title: string;
    posterUrl: string;
    year?: number;
    rating?: number;
    quality?: string;
    views?: number;
  }>;
  type?: 'movie' | 'series';
}

export default function ContentRow({ title, href, items, type = 'movie' }: ContentRowProps) {
  if (!items || items.length === 0) return null;

  return (
    <section className="mb-10 rounded-[1.75rem] border border-[var(--glass-border)] bg-white/[0.025] p-4 shadow-[0_18px_50px_rgba(0,0,0,0.08)] backdrop-blur-sm">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="section-title !mb-0 flex items-center gap-2">{title}</h2>
        {href && (
          <Link
            href={href}
            className="flex items-center gap-1 rounded-full border border-rose-500/20 bg-rose-500/10 px-3 py-1.5 text-xs font-bold text-rose-400 transition-all hover:bg-rose-500/15"
          >
            مشاهده همه
            <FiChevronLeft className="h-4 w-4" />
          </Link>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {items.slice(0, 12).map((item) => (
          <MovieCard key={item.id} {...item} type={type} />
        ))}
      </div>
    </section>
  );
}
