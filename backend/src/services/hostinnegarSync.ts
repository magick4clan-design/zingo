import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const API_BASE = 'https://hostinnegar.com';
const API_KEY = '4F5A9C3D9A86FA54EACEDDD635185';
const REQUEST_DELAY = 150;

let syncRunning = false;
let syncProgress = {
  phase: 'idle',
  moviesTotal: 0,
  moviesSynced: 0,
  seriesTotal: 0,
  seriesSynced: 0,
  errors: 0,
};

export function getSyncStatus() {
  return { ...syncProgress, syncRunning };
}

function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}

async function fetchPage(endpoint: string, page: number): Promise<any[]> {
  const url = `${API_BASE}${endpoint}${page}/${API_KEY}/`;
  try {
    const { data } = await axios.get(url, {
      timeout: 20000,
      headers: { Accept: 'application/json' },
    });
    if (Array.isArray(data)) return data;
    if (data?.data && Array.isArray(data.data)) return data.data;
    return [];
  } catch {
    return [];
  }
}

async function fetchAllPages(endpoint: string, label: string): Promise<any[]> {
  const all: any[] = [];
  let page = 0;
  let empty = 0;
  while (empty < 3 && page < 200) {
    const items = await fetchPage(endpoint, page);
    if (items.length === 0) {
      empty++;
    } else {
      empty = 0;
      all.push(...items);
    }
    syncProgress.phase = `${label} صفحه ${page} (${all.length} آیتم)`;
    page++;
    await sleep(REQUEST_DELAY);
  }
  return all;
}

function toSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[\u0600-\u06FF]+/g, (c: string) => {
      const map: Record<string, string> = { 'آ': 'a', 'ا': 'a', 'ب': 'b', 'پ': 'p', 'ت': 't', 'ث': 's', 'ج': 'j', 'چ': 'ch', 'ح': 'h', 'خ': 'kh', 'د': 'd', 'ذ': 'z', 'ر': 'r', 'ز': 'z', 'ژ': 'zh', 'س': 's', 'ش': 'sh', 'ص': 's', 'ض': 'z', 'ط': 't', 'ظ': 'z', 'ع': 'a', 'غ': 'gh', 'ف': 'f', 'ق': 'gh', 'ک': 'k', 'گ': 'g', 'ل': 'l', 'م': 'm', 'ن': 'n', 'و': 'v', 'ه': 'h', 'ی': 'y' };
      return map[c] || c;
    })
    .replace(/[\s\W-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'untitled';
}

function mapDownloadLinks(item: any): string {
  if (item.downloadas && typeof item.downloadas === 'string' && item.downloadas.startsWith('http')) {
    return JSON.stringify({ server1: item.downloadas });
  }
  return JSON.stringify({});
}

function mapEpisodeDownloadLinks(ep: any): string {
  if (ep.sources && Array.isArray(ep.sources)) {
    const links: Record<string, string> = {};
    for (const src of ep.sources) {
      if (src.url) {
        const key = src.quality || src.type || `server${src.id}`;
        links[key] = src.url;
      }
    }
    return JSON.stringify(links);
  }
  return JSON.stringify({});
}

function mapCountries(item: any): string | null {
  if (Array.isArray(item.country) && item.country.length > 0) {
    return item.country.map((c: any) => c.title || c).join(', ');
  }
  return null;
}

async function ensureGenres(
  prisma: PrismaClient,
  genres: { id: number; title: string }[]
): Promise<number[]> {
  const ids: number[] = [];
  for (const g of genres) {
    const slug = toSlug(g.title);
    const genre = await prisma.genre.upsert({
      where: { slug },
      update: { name: g.title },
      create: { name: g.title, slug },
    });
    ids.push(genre.id);
  }
  return ids;
}

async function syncMovies(prisma: PrismaClient): Promise<number> {
  const endpoint = '/api/movie/by/filtres/0/created/';
  const allMovies: any[] = [];
  let page = 0;
  let empty = 0;

  while (empty < 3 && page < 500) {
    const items = await fetchPage(endpoint, page);
    if (items.length === 0) {
      empty++;
    } else {
      empty = 0;
      allMovies.push(...items);
      syncProgress.moviesTotal = allMovies.length;
    }
    syncProgress.phase = `فیلم‌ها صفحه ${page} (${allMovies.length} آیتم)`;
    page++;
    await sleep(REQUEST_DELAY);
  }

  for (const item of allMovies) {
    try {
      const slug = toSlug(item.title || `movie-${item.id}`);
      const genreIds = await ensureGenres(prisma, item.genres || []);

      await prisma.movie.upsert({
        where: { slug },
        update: {
          title: item.title || 'Untitled',
          posterUrl: item.image || '',
          backdropUrl: item.cover || null,
          description: item.description || '',
          releaseYear: item.year || null,
          imdbRating: item.imdb || null,
          country: mapCountries(item),
          downloadLinks: mapDownloadLinks(item),
          source: 'hostinnegar',
          status: 'PUBLISHED',
          genres: {
            deleteMany: {},
            create: genreIds.map(gid => ({ genreId: gid })),
          },
        },
        create: {
          title: item.title || 'Untitled',
          slug,
          posterUrl: item.image || '',
          backdropUrl: item.cover || null,
          description: item.description || '',
          releaseYear: item.year || null,
          imdbRating: item.imdb || null,
          country: mapCountries(item),
          downloadLinks: mapDownloadLinks(item),
          source: 'hostinnegar',
          sourceUrl: `${API_BASE}/movie/${item.id}`,
          status: 'PUBLISHED',
          genres: {
            create: genreIds.map(gid => ({ genreId: gid })),
          },
        },
      });

      syncProgress.moviesSynced++;
    } catch {
      syncProgress.errors++;
    }
  }

  return allMovies.length;
}

async function syncSeries(prisma: PrismaClient): Promise<number> {
  const endpoint = '/api/serie/by/filtres/0/created/';
  const allSeries: any[] = [];
  let page = 0;
  let empty = 0;

  while (empty < 3 && page < 500) {
    const items = await fetchPage(endpoint, page);
    if (items.length === 0) {
      empty++;
    } else {
      empty = 0;
      allSeries.push(...items);
      syncProgress.seriesTotal = allSeries.length;
    }
    syncProgress.phase = `سریال‌ها صفحه ${page} (${allSeries.length} آیتم)`;
    page++;
    await sleep(REQUEST_DELAY);
  }

  for (const item of allSeries) {
    try {
      const slug = toSlug(item.title || `serie-${item.id}`);
      const genreIds = await ensureGenres(prisma, item.genres || []);

      const serie = await prisma.series.upsert({
        where: { slug },
        update: {
          title: item.title || 'Untitled',
          posterUrl: item.image || '',
          backdropUrl: item.cover || null,
          description: item.description || '',
          releaseYear: item.year || null,
          imdbRating: item.imdb || null,
          country: mapCountries(item),
          source: 'hostinnegar',
          status: 'PUBLISHED',
          genres: {
            deleteMany: {},
            create: genreIds.map(gid => ({ genreId: gid })),
          },
        },
        create: {
          title: item.title || 'Untitled',
          slug,
          posterUrl: item.image || '',
          backdropUrl: item.cover || null,
          description: item.description || '',
          releaseYear: item.year || null,
          imdbRating: item.imdb || null,
          country: mapCountries(item),
          source: 'hostinnegar',
          sourceUrl: `${API_BASE}/serie/${item.id}`,
          status: 'PUBLISHED',
          genres: {
            create: genreIds.map(gid => ({ genreId: gid })),
          },
        },
      });

      await syncSeasons(prisma, serie.id, item.id);
      syncProgress.seriesSynced++;
    } catch {
      syncProgress.errors++;
    }
  }

  return allSeries.length;
}

async function syncSeasons(prisma: PrismaClient, dbSeriesId: number, externalId: number): Promise<void> {
  const url = `${API_BASE}/api/season/by/serie/${externalId}/${API_KEY}/`;
  try {
    const { data } = await axios.get(url, {
      timeout: 15000,
      headers: { Accept: 'application/json' },
    });

    const seasons = Array.isArray(data) ? data : [];
    if (seasons.length === 0) return;

    await prisma.season.deleteMany({ where: { seriesId: dbSeriesId } });

    for (const season of seasons) {
      const created = await prisma.season.create({
        data: {
          seriesId: dbSeriesId,
          seasonNumber: season.id || 1,
          title: season.title || null,
        },
      });

      if (season.episodes && Array.isArray(season.episodes)) {
        for (const ep of season.episodes) {
          await prisma.episode.create({
            data: {
              seasonId: created.id,
              episodeNumber: ep.id || 1,
              title: ep.title || null,
              downloadLinks: mapEpisodeDownloadLinks(ep),
            },
          });
        }
      }
    }
  } catch {
    // Silent fail for seasons
  }
}

export async function syncFromHostinnegar(prisma: PrismaClient): Promise<void> {
  if (syncRunning) return;
  syncRunning = true;
  syncProgress = {
    phase: 'شروع همگام‌سازی',
    moviesTotal: 0,
    moviesSynced: 0,
    seriesTotal: 0,
    seriesSynced: 0,
    errors: 0,
  };

  try {
    console.log('\n🔄 Starting hostinnegar.com sync...');
    syncProgress.phase = 'همگام‌سازی فیلم‌ها';
    const movieCount = await syncMovies(prisma);
    console.log(`   ✅ Movies synced: ${movieCount}`);

    syncProgress.phase = 'همگام‌سازی سریال‌ها';
    const seriesCount = await syncSeries(prisma);
    console.log(`   ✅ Series synced: ${seriesCount}`);

    await prisma.scrapLog.create({
      data: {
        source: 'hostinnegar',
        status: 'success',
        message: `Synced ${movieCount} movies, ${seriesCount} series`,
        itemsScraped: movieCount + seriesCount,
        startedAt: new Date(),
        finishedAt: new Date(),
      },
    });

    syncProgress.phase = 'تمام شد';
    console.log(`   🎉 Sync complete! Movies: ${movieCount}, Series: ${seriesCount}, Errors: ${syncProgress.errors}\n`);
  } catch (err: any) {
    console.error('Sync error:', err.message);
    syncProgress.phase = 'خطا';
  }

  syncRunning = false;
}
