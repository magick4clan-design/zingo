import { AnimexScraper } from './animexScraper';
import { DonyayeSerialScraper } from './donyayeSerialScraper';
import { BaseScraper } from './baseScraper';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DELAY_BETWEEN_PAGES_MS = 1500;
const DELAY_BETWEEN_ITEMS_MS = 800;

interface FullContent {
  title: string;
  originalTitle?: string;
  posterUrl: string;
  backdropUrl?: string;
  description: string;
  releaseYear?: number;
  imdbRating?: number;
  genreNames: string[];
  country?: string;
  quality?: string;
  contentType?: string;
  episodeCount?: number;
  seasonCount?: number;
  downloadLinks: Record<string, Record<string, string>>;
  source: string;
  sourceUrl: string;
  screenshots: string[];
  type: 'movie' | 'series';
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[\u0600-\u06FF]+/g, (match) => {
      const persian: Record<string, string> = {
        'آ': 'a', 'ا': 'a', 'ب': 'b', 'پ': 'p', 'ت': 't',
        'ث': 's', 'ج': 'j', 'چ': 'ch', 'ح': 'h', 'خ': 'kh',
        'د': 'd', 'ذ': 'z', 'ر': 'r', 'ز': 'z', 'ژ': 'zh',
        'س': 's', 'ش': 'sh', 'ص': 's', 'ض': 'z', 'ط': 't',
        'ظ': 'z', 'ع': 'a', 'غ': 'gh', 'ف': 'f', 'ق': 'gh',
        'ک': 'k', 'گ': 'g', 'ل': 'l', 'م': 'm', 'ن': 'n',
        'و': 'v', 'ه': 'h', 'ی': 'y'
      };
      return match.split('').map(c => persian[c] || c).join('');
    })
    .replace(/[\s\W-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'untitled';
}

async function getOrCreateGenre(name: string) {
  const slug = name.toLowerCase().replace(/[\s/]+/g, '-').replace(/[^a-z0-9-]/g, '');
  return await prisma.genre.upsert({
    where: { slug },
    create: { name, slug },
    update: {},
  });
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function getAllUrls(scraper: AnimexScraper | DonyayeSerialScraper): Promise<string[]> {
  const allUrls: string[] = [];
  let emptyCount = 0;

  for (let page = 1; page <= 500; page++) {
    const urls = await scraper.getListings(page);
    if (urls.length === 0) {
      emptyCount++;
      if (emptyCount >= 2) break;
      continue;
    }
    emptyCount = 0;
    allUrls.push(...urls);
    process.stdout.write(`    Page ${page}: ${urls.length} items\r`);
    await sleep(DELAY_BETWEEN_PAGES_MS);
  }

  return [...new Set(allUrls)];
}

async function upsertContent(content: FullContent, sourceUrl: string): Promise<'created' | 'updated' | 'skipped'> {
  const slug = slugify(content.title);
  const uniqueGenres = [...new Set(content.genreNames.map(g => g.trim()).filter(Boolean))];
  const genreRecords = await Promise.all(uniqueGenres.map(getOrCreateGenre));
  const dlJson = JSON.stringify(content.downloadLinks);
  const scJson = JSON.stringify(content.screenshots || []);

  const existing = await prisma.movie.findUnique({ where: { slug } });

  if (existing) {
    await prisma.movie.update({
      where: { slug },
      data: {
        title: content.title,
        originalTitle: content.originalTitle || existing.originalTitle,
        posterUrl: content.posterUrl || existing.posterUrl,
        description: content.description?.substring(0, 2000) || existing.description,
        releaseYear: content.releaseYear || existing.releaseYear,
        imdbRating: content.imdbRating || existing.imdbRating,
        quality: content.quality || existing.quality,
        country: content.country || existing.country,
        downloadLinks: dlJson,
        screenshots: scJson,
        source: content.source,
      }
    });
    return 'updated';
  }

  const movie = await prisma.movie.create({
    data: {
      title: content.title,
      slug,
      originalTitle: content.originalTitle,
      posterUrl: content.posterUrl || 'https://via.placeholder.com/300x450',
      description: content.description?.substring(0, 2000) || '',
      releaseYear: content.releaseYear,
      imdbRating: content.imdbRating,
      quality: content.quality,
      country: content.country,
      downloadLinks: dlJson,
      screenshots: scJson,
      source: content.source,
      sourceUrl,
      cast: '[]',
    }
  });

  const seenGenreIds = new Set<number>();
  for (const g of genreRecords) {
    if (!seenGenreIds.has(g.id)) {
      seenGenreIds.add(g.id);
      try {
        await prisma.movieGenre.create({
          data: { movieId: movie.id, genreId: g.id }
        });
      } catch {}
    }
  }
  return 'created';
}

export async function runScraper(): Promise<{ created: number; updated: number; failed: number; total: number }> {
  const startedAt = new Date();
  let totalCreated = 0;
  let totalUpdated = 0;
  let totalFailed = 0;
  let totalUrls = 0;

  console.log('\n========================================');
  console.log(`🚀 Scraper started at ${startedAt.toISOString()}`);
  console.log('========================================');

  await BaseScraper.checkStorage();

  const scrapers: Array<{ scraper: AnimexScraper | DonyayeSerialScraper; name: string }> = [
    { scraper: new AnimexScraper(), name: 'animex' },
    { scraper: new DonyayeSerialScraper(), name: 'donyayeserial' },
  ];

  for (const { scraper, name } of scrapers) {
    console.log(`\n========== ${name.toUpperCase()} ==========`);
    try {
      console.log(`  Fetching page 1...`);
      const page1Urls = await scraper.getListings(1);
      console.log(`  Page 1: ${page1Urls.length} URLs found`);

      if (page1Urls.length === 0) {
        console.log(`  ⚠ No URLs found on page 1. Site may be unreachable.`);
        continue;
      }

      const urls = [...new Set(page1Urls)];
      totalUrls += urls.length;
      console.log(`  Total: ${urls.length} unique URLs\n`);

      let processed = 0;
      for (const url of urls) {
        processed++;
        try {
          const raw = await scraper.scrapeContent(url);
          if (!raw || !raw.title) {
            continue;
          }
          const content = raw as FullContent;
          const result = await upsertContent(content, url);
          if (result === 'created') {
            totalCreated++;
            process.stdout.write(`  [${processed}/${urls.length}] ✓ ${content.title.substring(0, 50)}\n`);
          } else {
            totalUpdated++;
          }
          await sleep(DELAY_BETWEEN_ITEMS_MS);
        } catch (err: any) {
          totalFailed++;
          if (processed <= 5 || processed % 20 === 0) {
            console.error(`  [${processed}/${urls.length}] ✗ ${err.message?.substring(0, 80)}`);
          }
        }
      }
      console.log(`  Done: ${urls.length} URLs processed`);
    } catch (err: any) {
      console.error(`Scraper ${name} failed: ${err.message}`);
    }
  }

  const totalMovies = await prisma.movie.count();
  const finishedAt = new Date();
  const duration = Math.round((finishedAt.getTime() - startedAt.getTime()) / 1000);

  console.log(`\n========================================`);
  console.log(`✅ Scraper completed in ${Math.floor(duration / 60)}m ${duration % 60}s`);
  console.log(`   Created: ${totalCreated} | Updated: ${totalUpdated} | Failed: ${totalFailed}`);
  console.log(`   URLs scraped: ${totalUrls} | Total in DB: ${totalMovies}`);
  console.log(`========================================`);

  try {
    await prisma.scrapLog.create({
      data: {
        source: 'all',
        status: totalFailed > 0 ? 'partial_success' : 'success',
        message: `Created: ${totalCreated}, Updated: ${totalUpdated}, Failed: ${totalFailed}, Duration: ${duration}s`,
        itemsScraped: totalCreated + totalUpdated,
        startedAt,
        finishedAt,
      },
    });
  } catch {}

  return { created: totalCreated, updated: totalUpdated, failed: totalFailed, total: totalUrls };
}

if (require.main === module) {
  runScraper()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
}
