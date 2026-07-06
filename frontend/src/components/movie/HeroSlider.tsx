'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { FiChevronLeft, FiChevronRight, FiStar, FiPlay, FiTrendingUp, FiCalendar } from 'react-icons/fi';
import { formatNumber, toPersianNumber } from '@/lib/utils';

interface HeroItem {
  id: number;
  title: string;
  backdropUrl: string;
  description: string;
  year?: number;
  rating?: number;
  quality?: string;
  type: 'movie' | 'series';
}

export default function HeroSlider({ items }: { items: HeroItem[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  const next = useCallback(() => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % items.length);
  }, [items.length]);

  const prev = useCallback(() => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
  }, [items.length]);

  useEffect(() => {
    const timer = setInterval(next, 8000);
    return () => clearInterval(timer);
  }, [next]);

  if (!items || items.length === 0) {
    return (
      <div className="glass flex h-[58vh] w-full items-center justify-center rounded-[2rem] md:h-[72vh]">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-rose-500/15 text-rose-400">
            <FiTrendingUp className="h-7 w-7" />
          </div>
          <p className="text-[var(--text-muted)]">موردی برای نمایش وجود ندارد</p>
        </div>
      </div>
    );
  }

  const current = items[currentIndex];

  const variants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({
      x: dir < 0 ? 300 : -300,
      opacity: 0,
    }),
  };

  return (
    <div className="relative h-[62vh] w-full overflow-hidden rounded-[2rem] border border-[var(--glass-border)] shadow-[var(--glass-shadow)] md:h-[76vh]">
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={currentIndex}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          className="absolute inset-0"
        >
          {/* Background */}
          <div className="relative w-full h-full">
            {current.backdropUrl ? (
              <Image
                src={current.backdropUrl}
                alt={current.title}
                fill
                className="object-cover"
                priority
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-rose-900 to-blue-900" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-primary)] via-[var(--bg-primary)]/20 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-l from-transparent via-[var(--bg-primary)]/15 to-[var(--bg-primary)]/85" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_35%,rgba(244,63,94,0.22),transparent_28rem)]" />
          </div>

          {/* Content */}
          <div className="absolute bottom-0 left-0 right-0 p-5 md:p-10">
            <div className="container-main">
              <motion.div
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                {/* Type badge */}
                <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold text-white shadow-lg backdrop-blur-xl">
                  <span className="h-2 w-2 rounded-full bg-rose-400 shadow-[0_0_18px_rgba(251,113,133,0.9)]" />
                  {current.type === 'movie' ? 'فیلم' : 'سریال'}
                </span>

                <h1 className="mb-4 max-w-3xl text-3xl font-black leading-tight text-white drop-shadow-2xl md:text-6xl">
                  {current.title}
                </h1>

                {/* Meta */}
                <div className="mb-5 flex flex-wrap items-center gap-2">
                  {current.year && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/25 px-3 py-1.5 text-sm text-white/80 backdrop-blur-md">
                      <FiCalendar className="h-4 w-4" />
                      {toPersianNumber(current.year)}
                    </span>
                  )}
                  {current.rating && (
                    <div className="inline-flex items-center gap-1 rounded-full border border-yellow-400/20 bg-black/25 px-3 py-1.5 text-sm text-yellow-400 backdrop-blur-md">
                      <FiStar className="w-4 h-4 fill-current" />
                      {current.rating.toFixed(1)}
                    </div>
                  )}
                  {current.quality && (
                    <span className="rounded-full border border-white/10 bg-white/15 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-md">
                      {current.quality}
                    </span>
                  )}
                </div>

                {/* Description */}
                <p className="mb-6 max-w-2xl text-sm leading-8 text-white/82 md:text-base">
                  {current.description}
                </p>

                {/* CTA */}
                <div className="flex items-center gap-3">
                  <Link
                    href={`/${current.type === 'movie' ? 'movies' : 'series'}/${current.id}`}
                    className="btn-primary flex items-center gap-2 rounded-2xl px-7 py-3"
                  >
                    <FiPlay className="w-5 h-5 fill-current" />
                    مشاهده و دانلود
                  </Link>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Arrows */}
      <button
        onClick={prev}
        className="glass absolute right-4 top-1/2 z-10 hidden -translate-y-1/2 rounded-full p-3 text-white/70 transition-all hover:scale-105 hover:text-white md:block"
      >
        <FiChevronRight className="w-6 h-6" />
      </button>
      <button
        onClick={next}
        className="glass absolute left-4 top-1/2 z-10 hidden -translate-y-1/2 rounded-full p-3 text-white/70 transition-all hover:scale-105 hover:text-white md:block"
      >
        <FiChevronLeft className="w-6 h-6" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-5 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-2 backdrop-blur-xl">
        {items.map((_, i) => (
          <button
            key={i}
            onClick={() => {
              setDirection(i > currentIndex ? 1 : -1);
              setCurrentIndex(i);
            }}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === currentIndex ? 'w-8 bg-rose-500' : 'w-4 bg-white/30 hover:bg-white/50'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
