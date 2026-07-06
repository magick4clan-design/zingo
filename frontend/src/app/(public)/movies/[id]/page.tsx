'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { FiStar, FiClock, FiHeart, FiShare2, FiDownload, FiCalendar, FiGlobe, FiPlay, FiFilm, FiCamera, FiArrowDown, FiServer } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { moviesAPI, favoritesAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { formatDuration, formatNumber, toPersianNumber, getQualityColor, generateStarRating, truncateText } from '@/lib/utils';
import { DetailSkeleton } from '@/components/common/Skeletons';
import MovieCard from '@/components/movie/MovieCard';

type ScreenshotInput = string | { url?: string; caption?: string; alt?: string };
type ScreenshotView = { url: string; caption: string; alt: string };

interface MovieDetail {
  id: number;
  title: string;
  slug: string;
  originalTitle?: string;
  posterUrl: string;
  backdropUrl?: string;
  description: string;
  releaseYear?: number;
  duration?: number;
  imdbRating?: number;
  quality?: string;
  country?: string;
  language?: string;
  director?: string;
  cast: string[];
  screenshots: ScreenshotInput[];
  trailerUrl?: string;
  downloadLinks: Record<string, unknown>;
  source: string;
  views: number;
  genres: { genre: { id: number; name: string; slug: string } }[];
  comments: unknown[];
  _count: { favorites: number; comments: number };
  similar: Record<string, unknown>[];
}

type DownloadLinksMap = Record<string, Record<string, string>>;

function normalizeScreenshot(input: ScreenshotInput, title: string): ScreenshotView | null {
  if (typeof input === 'string') {
    return input ? { url: input, caption: '', alt: title } : null;
  }

  if (!input?.url) return null;
  return {
    url: input.url,
    caption: input.caption || '',
    alt: input.alt || input.caption || title,
  };
}

function isMultiServer(links: Record<string, unknown>): boolean {
  const firstKey = Object.keys(links)[0];
  if (!firstKey) return false;
  return typeof links[firstKey] === 'object' && links[firstKey] !== null && !Array.isArray(links[firstKey]);
}

export default function MovieDetailPage() {
  const { id } = useParams();
  const [movie, setMovie] = useState<MovieDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeScreenshot, setActiveScreenshot] = useState(0);
  const [showFullDesc, setShowFullDesc] = useState(false);
  const [activeServer, setActiveServer] = useState<string>('');
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    async function fetchMovie() {
      try {
        const res = await moviesAPI.getById(Number(id));
        setMovie(res.data.data);
        const links = res.data.data.downloadLinks;
        if (links && Object.keys(links).length > 0) {
          if (isMultiServer(links)) {
            setActiveServer(Object.keys(links as DownloadLinksMap)[0]);
          }
        }
      } catch (error) {
        console.error('Failed to fetch movie:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchMovie();
  }, [id]);

  const toggleFavorite = async () => {
    if (!isAuthenticated) return;
    try {
      await favoritesAPI.toggle(movie!.id);
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  if (isLoading) {
    return <div className="container-main py-6"><DetailSkeleton /></div>;
  }

  if (!movie) {
    return (
      <div className="container-main py-20 text-center">
        <p className="text-[var(--text-muted)]">فیلم یافت نشد</p>
        <Link href="/movies" className="btn-primary mt-4 inline-block">بازگشت</Link>
      </div>
    );
  }

  const ratingStars = generateStarRating(movie.imdbRating || 0);
  const multiServer = movie.downloadLinks && isMultiServer(movie.downloadLinks);
  const downloadLinksMap = multiServer ? movie.downloadLinks as DownloadLinksMap : null;
  const simpleLinks = !multiServer ? movie.downloadLinks as Record<string, string> : null;
  const screenshots = movie.screenshots
    .map((screenshot) => normalizeScreenshot(screenshot, movie.title))
    .filter((screenshot): screenshot is ScreenshotView => Boolean(screenshot));
  const activeShot = screenshots[activeScreenshot] || screenshots[0];

  return (
    <div className="pb-10">
      {/* Hero Backdrop */}
      <div className="relative h-[50vh] md:h-[60vh]">
        {movie.backdropUrl ? (
          <Image src={movie.backdropUrl} alt={movie.title} fill className="object-cover" priority />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-rose-900 to-blue-900" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-primary)] via-[var(--bg-primary)]/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-l from-transparent to-[var(--bg-primary)]/40" />
      </div>

      {/* Content */}
      <div className="container-main -mt-48 relative z-10">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Poster */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="shrink-0"
          >
            <div className="w-52 md:w-64 aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl mx-auto md:mx-0">
              <Image
                src={movie.posterUrl}
                alt={movie.title}
                width={256}
                height={384}
                className="w-full h-full object-cover"
              />
            </div>
          </motion.div>

          {/* Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex-1"
          >
            {/* Title */}
            <h1 className="text-2xl md:text-4xl font-black mb-2">{movie.title}</h1>
            {movie.originalTitle && (
              <p className="text-[var(--text-muted)] mb-4">{movie.originalTitle}</p>
            )}

            {/* Genres */}
            <div className="flex flex-wrap gap-2 mb-4">
              {movie.genres.map((g) => (
                <Link
                  key={g.genre.slug}
                  href={`/genres/${g.genre.slug}`}
                  className="badge-primary"
                >
                  {g.genre.name}
                </Link>
              ))}
            </div>

            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-4 mb-6 text-sm text-[var(--text-secondary)]">
              {movie.releaseYear && (
                <span className="flex items-center gap-1.5">
                  <FiCalendar className="w-4 h-4" /> {toPersianNumber(movie.releaseYear)}
                </span>
              )}
              {movie.duration && (
                <span className="flex items-center gap-1.5">
                  <FiClock className="w-4 h-4" /> {formatDuration(movie.duration)}
                </span>
              )}
              {movie.imdbRating && movie.imdbRating > 0 && (
                <span className="flex items-center gap-1.5 text-yellow-400">
                  <FiStar className="w-4 h-4 fill-current" />
                  {movie.imdbRating.toFixed(1)} IMDB
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <FiGlobe className="w-4 h-4" /> {toPersianNumber(movie.views)} بازدید
              </span>
              {movie._count && (
                <span>{toPersianNumber(movie._count.favorites)} علاقه‌مندی</span>
              )}
              {movie.country && (
                <span className="flex items-center gap-1.5">
                  <FiGlobe className="w-4 h-4" /> {movie.country}
                </span>
              )}
              {movie.language && (
                <span className="flex items-center gap-1.5">
                  <FiFilm className="w-4 h-4" /> {movie.language}
                </span>
              )}
            </div>

            {/* Star Rating */}
            {movie.imdbRating && (
              <div className="flex items-center gap-1 mb-6">
                {Array.from({ length: ratingStars.full }).map((_, i) => (
                  <FiStar key={`f-${i}`} className="w-5 h-5 text-yellow-400 fill-current" />
                ))}
                {ratingStars.half && <FiStar className="w-5 h-5 text-yellow-400 fill-current opacity-50" />}
                {Array.from({ length: ratingStars.empty }).map((_, i) => (
                  <FiStar key={`e-${i}`} className="w-5 h-5 text-gray-600" />
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3 mb-6">
              <a href="#download" className="btn-primary flex items-center gap-2">
                <FiDownload className="w-5 h-5" /> دانلود
              </a>
              {movie.trailerUrl && (
                <a href={movie.trailerUrl} target="_blank" className="btn-secondary flex items-center gap-2">
                  <FiPlay className="w-5 h-5" /> تریلر
                </a>
              )}
              {isAuthenticated && (
                <button onClick={toggleFavorite} className="btn-ghost p-2.5 rounded-xl">
                  <FiHeart className="w-5 h-5" />
                </button>
              )}
              <button className="btn-ghost p-2.5 rounded-xl">
                <FiShare2 className="w-5 h-5" />
              </button>
            </div>

            {/* Description */}
            <div className="mb-6">
              <h3 className="font-bold mb-2">خلاصه داستان</h3>
              <p className="text-[var(--text-secondary)] text-sm leading-7">
                {showFullDesc ? movie.description : truncateText(movie.description, 300)}
              </p>
              {movie.description.length > 300 && (
                <button
                  onClick={() => setShowFullDesc(!showFullDesc)}
                  className="text-rose-500 text-sm mt-2"
                >
                  {showFullDesc ? 'بستن' : 'ادامه مطلب'}
                </button>
              )}
            </div>

            {/* Director & Cast */}
            {movie.director && (
              <div className="mb-2 text-sm">
                <span className="text-[var(--text-muted)]">کارگردان: </span>
                <span className="text-[var(--text-primary)]">{movie.director}</span>
              </div>
            )}
            {movie.cast.length > 0 && (
              <div className="text-sm">
                <span className="text-[var(--text-muted)]">بازیگران: </span>
                <span className="text-[var(--text-primary)]">{movie.cast.join('، ')}</span>
              </div>
            )}
          </motion.div>
        </div>

        {/* Screenshots */}
        {screenshots.length > 0 && activeShot && (
          <section className="mt-10">
            <h2 className="section-title"><FiCamera className="inline w-5 h-5 ml-1" />تصاویر فیلم</h2>
            <div className="relative rounded-2xl overflow-hidden aspect-video bg-[var(--bg-secondary)]">
              <Image
                src={activeShot.url}
                alt={activeShot.alt}
                fill
                className="object-cover"
              />
            </div>
            {activeShot.caption && (
              <p className="mt-3 text-sm text-[var(--text-muted)] leading-6">{activeShot.caption}</p>
            )}
            <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
              {screenshots.map((img, i) => (
                <button
                  key={img.url}
                  onClick={() => setActiveScreenshot(i)}
                  className={`shrink-0 w-24 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                    activeScreenshot === i ? 'border-rose-500' : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <Image src={img.url} alt={img.alt} width={96} height={64} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Download Section - Multi Server */}
        <section id="download" className="mt-10">
          <h2 className="section-title"><FiArrowDown className="inline w-5 h-5 ml-1" />لینک‌های دانلود</h2>

          {multiServer && downloadLinksMap ? (
            <div className="space-y-4">
              {/* Server Tabs */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {Object.keys(downloadLinksMap).map((server) => (
                  <button
                    key={server}
                    onClick={() => setActiveServer(server)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                      activeServer === server
                        ? 'bg-rose-500 text-white'
                        : 'bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:border-rose-500/50'
                    }`}
                  >
                    <FiServer className="w-4 h-4" />
                    {server}
                  </button>
                ))}
              </div>

              {/* Quality Links for Active Server */}
              {downloadLinksMap[activeServer] && (
                <div className="space-y-3">
                  {Object.entries(downloadLinksMap[activeServer]).map(([quality, url]) => (
                    <a
                      key={quality}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-rose-500/50 transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-rose-500/10 flex items-center justify-center">
                          <FiDownload className="w-5 h-5 text-rose-500" />
                        </div>
                        <div>
                          <span className={`font-medium text-sm ${getQualityColor(quality)}`}>{quality}</span>
                          <p className="text-xs text-[var(--text-muted)]">{activeServer}</p>
                        </div>
                      </div>
                      <span className="text-xs text-[var(--text-muted)] group-hover:text-rose-500 transition-colors">
                        دانلود
                      </span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          ) : simpleLinks && Object.keys(simpleLinks).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(simpleLinks).map(([quality, url]) => (
                <a
                  key={quality}
                  href={url as string}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-rose-500/50 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-rose-500/10 flex items-center justify-center">
                      <FiDownload className="w-5 h-5 text-rose-500" />
                    </div>
                    <span className={`font-medium text-sm ${getQualityColor(quality)}`}>{quality}</span>
                  </div>
                  <span className="text-xs text-[var(--text-muted)] group-hover:text-rose-500 transition-colors">
                    دانلود
                  </span>
                </a>
              ))}
            </div>
          ) : (
            <p className="text-[var(--text-muted)] text-sm p-4 bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)]">
              لینک دانلود فعلاً موجود نیست. به‌زودی اضافه خواهد شد.
            </p>
          )}
        </section>

        {/* Similar Movies */}
        {movie.similar && movie.similar.length > 0 && (
          <section className="mt-10">
            <h2 className="section-title"><FiFilm className="inline w-5 h-5 ml-1" />محتوای مشابه</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {movie.similar.map((s: Record<string, unknown>) => (
                <MovieCard
                  key={String(s.id)}
                  id={s.id as number}
                  title={s.title as string}
                  posterUrl={s.posterUrl as string}
                  year={s.releaseYear as number}
                  rating={s.imdbRating as number}
                  type="movie"
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
