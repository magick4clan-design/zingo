'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { FiStar, FiHeart, FiShare2, FiDownload, FiCalendar, FiChevronDown, FiChevronUp, FiList, FiMonitor, FiServer, FiCamera } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { seriesAPI, favoritesAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { toPersianNumber, getQualityColor, generateStarRating, truncateText } from '@/lib/utils';
import { DetailSkeleton } from '@/components/common/Skeletons';
import MovieCard from '@/components/movie/MovieCard';

interface EpisodeData {
  id: number;
  episodeNumber: number;
  title?: string;
  downloadLinks: Record<string, unknown>;
}

interface SeasonData {
  id: number;
  seasonNumber: number;
  title?: string;
  episodes: EpisodeData[];
}

type ScreenshotInput = string | { url?: string; caption?: string; alt?: string };
type ScreenshotView = { url: string; caption: string; alt: string };

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

export default function SeriesDetailPage() {
  const { id } = useParams();
  const [series, setSeries] = useState<Record<string, unknown> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedSeason, setExpandedSeason] = useState<number | null>(null);
  const [showFullDesc, setShowFullDesc] = useState(false);
  const [activeScreenshot, setActiveScreenshot] = useState(0);
  const [activeEpisodeServer, setActiveEpisodeServer] = useState<Record<string, string>>({});
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    async function fetchSeries() {
      try {
        const res = await seriesAPI.getById(Number(id));
        setSeries(res.data.data);
        if (res.data.data.seasons?.length > 0) {
          setExpandedSeason(res.data.data.seasons[0].id);
        }
      } catch (error) {
        console.error('Failed to fetch series:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchSeries();
  }, [id]);

  const toggleServer = (episodeId: number, server: string) => {
    setActiveEpisodeServer(prev => ({ ...prev, [String(episodeId)]: server }));
  };

  if (isLoading) return <div className="container-main py-6"><DetailSkeleton /></div>;

  if (!series) {
    return (
      <div className="container-main py-20 text-center">
        <p className="text-[var(--text-muted)]">سریال یافت نشد</p>
        <Link href="/series" className="btn-primary mt-4 inline-block">بازگشت</Link>
      </div>
    );
  }

  const seriesTitle = typeof series.title === 'string' ? series.title : '';
  const originalTitle = typeof series.originalTitle === 'string' ? series.originalTitle : '';
  const backdropUrl = typeof series.backdropUrl === 'string' ? series.backdropUrl : '';
  const posterUrl = typeof series.posterUrl === 'string' ? series.posterUrl : '';
  const description = typeof series.description === 'string' ? series.description : '';
  const releaseYear = typeof series.releaseYear === 'number' ? series.releaseYear : undefined;
  const imdbRating = typeof series.imdbRating === 'number' ? series.imdbRating : undefined;
  const country = typeof series.country === 'string' ? series.country : '';
  const views = typeof series.views === 'number' ? series.views : 0;
  const seriesId = typeof series.id === 'number' ? series.id : 0;
  const genres = Array.isArray(series.genres) ? series.genres as Array<{ genre: { slug: string; name: string } }> : [];
  const cast = Array.isArray(series.cast) ? series.cast as string[] : [];
  const seasons = Array.isArray(series.seasons) ? series.seasons as SeasonData[] : [];
  const similarItems = Array.isArray(series.similar) ? series.similar as Record<string, unknown>[] : [];
  const screenshots = ((series.screenshots as ScreenshotInput[] | undefined) || [])
    .map((screenshot) => normalizeScreenshot(screenshot, seriesTitle))
    .filter((screenshot): screenshot is ScreenshotView => Boolean(screenshot));
  const activeShot = screenshots[activeScreenshot] || screenshots[0];

  return (
    <div className="pb-10">
      {/* Hero */}
      <div className="relative h-[50vh] md:h-[60vh]">
        {backdropUrl ? (
          <Image src={backdropUrl} alt={seriesTitle} fill className="object-cover" priority />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-rose-900 to-blue-900" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-primary)] via-[var(--bg-primary)]/60 to-transparent" />
      </div>

      <div className="container-main -mt-48 relative z-10">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Poster */}
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="shrink-0">
            <div className="w-52 md:w-64 aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl mx-auto md:mx-0">
              <Image src={posterUrl} alt={seriesTitle} width={256} height={384} className="w-full h-full object-cover" />
            </div>
          </motion.div>

          {/* Info */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex-1">
            <h1 className="text-2xl md:text-4xl font-black mb-2">{seriesTitle}</h1>
            {originalTitle && <p className="text-[var(--text-muted)] mb-4">{originalTitle}</p>}

            {/* Genres */}
            <div className="flex flex-wrap gap-2 mb-4">
              {genres.map((g) => (
                <Link key={g.genre.slug} href={`/genres/${g.genre.slug}`} className="badge-primary">{g.genre.name}</Link>
              ))}
            </div>

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-4 mb-6 text-sm text-[var(--text-secondary)]">
              {releaseYear && <span className="flex items-center gap-1.5"><FiCalendar className="w-4 h-4" /> {toPersianNumber(releaseYear)}</span>}
              {imdbRating && (
                <span className="flex items-center gap-1.5 text-yellow-400">
                  <FiStar className="w-4 h-4 fill-current" /> {imdbRating.toFixed(1)} IMDB
                </span>
              )}
              {country && <span>{country}</span>}
              <span>{toPersianNumber(views)} بازدید</span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 mb-6">
              {isAuthenticated && (
                <button onClick={async () => { await favoritesAPI.toggle(undefined, seriesId); }} className="btn-ghost p-2.5 rounded-xl">
                  <FiHeart className="w-5 h-5" />
                </button>
              )}
              <button className="btn-ghost p-2.5 rounded-xl"><FiShare2 className="w-5 h-5" /></button>
            </div>

            {/* Description */}
            <div className="mb-6">
              <h3 className="font-bold mb-2">خلاصه داستان</h3>
              <p className="text-[var(--text-secondary)] text-sm leading-7">
                {showFullDesc ? description : truncateText(description, 300)}
              </p>
              {description.length > 300 && (
                <button onClick={() => setShowFullDesc(!showFullDesc)} className="text-rose-500 text-sm mt-2">
                  {showFullDesc ? 'بستن' : 'ادامه مطلب'}
                </button>
              )}
            </div>

            {/* Cast */}
            {cast.length > 0 && (
              <div className="text-sm">
                <span className="text-[var(--text-muted)]">بازیگران: </span>
                <span className="text-[var(--text-primary)]">{cast.join('، ')}</span>
              </div>
            )}
          </motion.div>
        </div>

        {/* Screenshots */}
        {screenshots.length > 0 && activeShot && (
          <section className="mt-10">
            <h2 className="section-title"><FiCamera className="inline w-5 h-5 ml-1" />تصاویر سریال</h2>
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

        {/* Seasons & Episodes */}
        {seasons.length > 0 && (
          <section className="mt-10">
            <h2 className="section-title"><FiList className="inline w-5 h-5 ml-1" />فصل‌ها و قسمت‌ها</h2>
            <div className="space-y-3">
              {seasons.map((season) => (
                <div key={season.id} className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl overflow-hidden">
                  <button
                    onClick={() => setExpandedSeason(expandedSeason === season.id ? null : season.id)}
                    className="w-full flex items-center justify-between p-4 hover:bg-[var(--bg-hover)] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-rose-500/10 flex items-center justify-center">
                        <span className="text-rose-500 font-bold">{toPersianNumber(season.seasonNumber)}</span>
                      </div>
                      <div className="text-right">
                        <h3 className="font-medium">{season.title || `فصل ${toPersianNumber(season.seasonNumber)}`}</h3>
                        <p className="text-xs text-[var(--text-muted)]">{toPersianNumber(season.episodes.length)} قسمت</p>
                      </div>
                    </div>
                    {expandedSeason === season.id ? <FiChevronUp className="w-5 h-5" /> : <FiChevronDown className="w-5 h-5" />}
                  </button>

                  <AnimatePresence>
                    {expandedSeason === season.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="border-t border-[var(--border-color)] p-4 space-y-3">
                          {season.episodes.map((ep) => {
                            const isMulti = isMultiServer(ep.downloadLinks);
                            const epKey = String(ep.id);
                            const activeServer = activeEpisodeServer[epKey] || (isMulti ? Object.keys(ep.downloadLinks)[0] : '');

                            return (
                              <div key={ep.id} className="p-4 rounded-xl bg-[var(--bg-hover)] hover:bg-[var(--bg-secondary)] transition-colors">
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="text-sm font-medium">
                                    قسمت {toPersianNumber(ep.episodeNumber)} {ep.title && `- ${ep.title}`}
                                  </h4>
                                </div>

                                {/* Multi-server tabs for episode */}
                                {isMulti && (
                                  <div className="flex items-center gap-1.5 mb-3 flex-wrap">
                                    {Object.keys(ep.downloadLinks).map((server) => (
                                      <button
                                        key={server}
                                        onClick={() => toggleServer(ep.id, server)}
                                        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all ${
                                          activeServer === server
                                            ? 'bg-rose-500 text-white'
                                            : 'bg-[var(--bg-primary)] text-[var(--text-secondary)] border border-[var(--border-color)] hover:border-rose-500/50'
                                        }`}
                                      >
                                        <FiServer className="w-3 h-3" />
                                        {server}
                                      </button>
                                    ))}
                                  </div>
                                )}

                                {/* Download links */}
                                <div className="flex flex-wrap gap-2">
                                  {isMulti && activeServer ? (
                                    Object.entries((ep.downloadLinks as Record<string, Record<string, string>>)[activeServer] || {}).map(([quality, url]) => (
                                      <a key={quality} href={url} target="_blank" rel="noopener noreferrer"
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--bg-primary)] border border-[var(--border-color)] hover:border-rose-500/50 transition-all ${getQualityColor(quality)}`}
                                      >
                                        <FiDownload className="w-3 h-3" /> {quality}
                                      </a>
                                    ))
                                  ) : !isMulti ? (
                                    Object.entries(ep.downloadLinks as Record<string, string>).map(([quality, url]) => (
                                      <a key={quality} href={url} target="_blank" rel="noopener noreferrer"
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--bg-primary)] border border-[var(--border-color)] hover:border-rose-500/50 transition-all ${getQualityColor(quality)}`}
                                      >
                                        <FiDownload className="w-3 h-3" /> {quality}
                                      </a>
                                    ))
                                  ) : null}
                                  {Object.keys(isMulti ? (ep.downloadLinks as Record<string, Record<string, string>>)[activeServer] || {} : ep.downloadLinks).length === 0 && (
                                    <span className="text-xs text-[var(--text-muted)]">لینک دانلود موجود نیست</span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Similar */}
        {similarItems.length > 0 && (
          <section className="mt-10">
            <h2 className="section-title"><FiMonitor className="inline w-5 h-5 ml-1" />سریال‌های مشابه</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {similarItems.map((s) => (
                <MovieCard key={String(s.id)} id={s.id as number} title={s.title as string} posterUrl={s.posterUrl as string} year={s.releaseYear as number} rating={s.imdbRating as number} type="series" />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
