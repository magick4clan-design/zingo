import path from 'path';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import { PrismaClient } from '@prisma/client';
import { config } from './config';
import { authRoutes } from './routes/auth';
import { movieRoutes } from './routes/movies';
import { seriesRoutes } from './routes/series';
import { genreRoutes } from './routes/genres';
import { userRoutes } from './routes/users';
import { favoriteRoutes } from './routes/favorites';
import { commentRoutes } from './routes/comments';
import { adRoutes } from './routes/ads';
import { adminRoutes } from './routes/admin';
import { scraperRoutes } from './routes/scraper';
import { errorHandler } from './middleware/errorHandler';
import './scheduler';

const prisma = new PrismaClient();
const app = express();

// ==================== Middleware ====================
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) {
      callback(null, true);
      return;
    }

    if (config.corsOrigins.includes('*') || config.corsOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(null, true);
  },
  credentials: true,
}));
app.use(compression());
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ==================== Static Files ====================
app.use('/uploads', express.static('uploads'));

// ==================== API Routes ====================
app.use('/api/auth', authRoutes);
app.use('/api/movies', movieRoutes);
app.use('/api/series', seriesRoutes);
app.use('/api/genres', genreRoutes);
app.use('/api/users', userRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/ads', adRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/scraper', scraperRoutes);

// ==================== Health Check ====================
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    name: 'Zingo API',
    version: '1.0.0',
    environment: config.nodeEnv,
  });
});

// ==================== Root ====================
app.get('/', (_req, res) => {
  res.json({
    name: 'Zingo API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/api/health',
      movies: '/api/movies',
      series: '/api/series',
      genres: '/api/genres',
      auth: '/api/auth',
      scraper: '/scraper',
    },
  });
});

// ==================== Fast Scrape with Status ====================
let scrapeProgress = { phase: 'idle', total: 0, done: 0, current: '', errors: 0 };

app.get('/scrape/start', async (_req, res) => {
  if (scraperRunning) return res.json({ ok: false, msg: 'در حال اجراست' });
  scraperRunning = true;
  scrapeProgress = { phase: 'شروع', total: 0, done: 0, current: '', errors: 0 };
  res.json({ ok: true, msg: 'اسکرپر شروع شد' });

  (async () => {
    try {
      const axios = (await import('axios')).default;
      const cheerio = (await import('cheerio')).default;
      const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

      const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
      const allUrls: string[] = [];

      // === Phase 1: Collect URLs ===
      scrapeProgress.phase = 'جمع‌آوری لینک‌ها';
      
      for (const [type, baseUrl] of [
        ['movie', 'https://animex.click/movie/'],
        ['serial', 'https://animex.click/serial/'],
        ['anime', 'https://animex.click/anime/'],
      ] as [string, string][]) {
        for (let page = 1; page <= 50; page++) {
          const url = page === 1 ? baseUrl : `${baseUrl}page/${page}/`;
          try {
            const r = await axios.get(url, { timeout: 10000, headers: { 'User-Agent': UA } });
            const $ = cheerio.load(r.data);
            const links: string[] = [];
          $('a[href]').each(function(this: any, _: any, el: any) {
            const href = $(el).attr('href') || '';
            if (href.match(/animex\.(click|cc)\/(anime|movie|serial)\//)) {
              links.push(href.replace('animex.cc', 'animex.click'));
            }
          });
            const unique = [...new Set(links)];
            if (unique.length === 0) break;
            allUrls.push(...unique);
            scrapeProgress.current = `${type} صفحه ${page}: ${unique.length} لینک`;
            await sleep(300);
          } catch { break; }
        }
      }

      // DonYayeSerial
      for (let page = 1; page <= 30; page++) {
        try {
          const r = await axios.get(`https://donyayeserial.com/page/${page}/`, { timeout: 10000, headers: { 'User-Agent': UA } });
          const $ = cheerio.load(r.data);
          const links: string[] = [];
          $('a[href]').each(function(this: any, _: any, el: any) {
            const href = $(el).attr('href') || '';
            if (href.match(/donyayeserial\.com\/(series|movie|film)\//)) {
              links.push(href.startsWith('http') ? href : `https://donyayeserial.com${href}`);
            }
          });
          const unique = [...new Set(links)];
          if (unique.length === 0) break;
          allUrls.push(...unique);
          scrapeProgress.current = `donyayeserial صفحه ${page}: ${unique.length} لینک`;
          await sleep(300);
        } catch { break; }
      }

      const uniqueUrls = [...new Set(allUrls)];
      scrapeProgress.total = uniqueUrls.length;
      scrapeProgress.phase = 'اسکرپ محتوا';

      // === Phase 2: Scrape content ===
      for (const url of uniqueUrls) {
        try {
          scrapeProgress.current = url.substring(url.lastIndexOf('/') + 1, url.lastIndexOf('/') + 40) || url.substring(0, 40);
          
          let $: any;
          if (url.includes('animex')) {
            const r = await axios.get(url, { timeout: 10000, headers: { 'User-Agent': UA } });
            $ = cheerio.load(r.data);
          } else {
            const r = await axios.get(url, { timeout: 10000, headers: { 'User-Agent': UA } });
            $ = cheerio.load(r.data);
          }

          // Extract title
          let title = '';
          for (const sel of ['h1.entry-title', 'h1.title', 'h1']) {
            title = $(sel).text().trim();
            if (title) break;
          }
          if (!title) { const m = $('title').text(); title = m.replace(/–.*$/i, '').trim(); }
          title = title.replace(/^دانلود\s+(سریال|فیلم|انیمه)\s+/i, '').trim();
          if (!title) { scrapeProgress.errors++; scrapeProgress.done++; continue; }

          // Type
          const type = (url.includes('/series/') || url.includes('/serial/')) ? 'series' : 'movie';

          // Poster
          const poster = $('meta[property="og:image"]').attr('content') || $('img').first().attr('src') || '';

          // Description
          const description = ($('meta[name="description"]').attr('content') || '').substring(0, 2000);

          // Year
          const yearMatch = $('body').html()?.match(/\(?(\d{4})\)?/);
          const year = yearMatch ? parseInt(yearMatch[1]) : null;

          // IMDB
          const imdbMatch = $('body').text().match(/IMDB[:\s]*(\d+\.?\d*)/i);
          const imdb = imdbMatch ? parseFloat(imdbMatch[1]) : null;

          // Genres
          const genres: string[] = [];
          $('a[href*="/genre/"], a[href*="/tag/"]').each(function(this: any, _: any, el: any) {
            const g = $(el).text().trim();
            if (g && g.length > 1 && g.length < 30) genres.push(g);
          });

          // Download links
          const dlLinks: Record<string, string> = {};
          if (url.includes('animex')) {
            const dlHosts = ['csdl1', 'ndl1', 'ndl2', 'ndl3', 'ndl4', 'ndl5', 'ndl6', 'ndl7', 'dl.hollowofthealley', 'dl2.hollowofthealley'];
            const hostSelector = dlHosts.map((h: string) => `a[href*="${h}"]`).join(', ');
            $(hostSelector).each(function(this: any, _: any, el: any) {
              const href = $(el).attr('href');
              if (!href || href.includes('subsource') || href.includes('animexstream')) return;
              const q = extractQ(href);
              if (!dlLinks[q]) dlLinks[q] = href;
            });
          } else {
            $('a[href]').each(function(this: any, _: any, el: any) {
              const href = $(el).attr('href');
              if (href && (href.includes('iran-gamecenter') || href.includes('.mkv') || href.includes('.mp4') || href.includes('download'))) {
                if (!href.includes('donyayeserial.com')) {
                  const q = extractQ(href);
                  if (!dlLinks[q]) dlLinks[q] = href;
                }
              }
            });
          }

          // Save to DB
          const slug = slugify(title);
          const dlJson = JSON.stringify(dlLinks);

          if (type === 'series') {
            const existing = await prisma.series.findUnique({ where: { slug } });
            if (!existing) {
              await prisma.series.create({
                data: {
                  title, slug, posterUrl: poster || 'https://via.placeholder.com/300x450',
                  description, releaseYear: year, imdbRating: imdb,
                  source: url.includes('animex') ? 'animex' : 'donyayeserial',
                  sourceUrl: url, cast: '[]', screenshots: '[]',
                }
              });
            }
          } else {
            const existing = await prisma.movie.findUnique({ where: { slug } });
            if (!existing) {
              await prisma.movie.create({
                data: {
                  title, slug, posterUrl: poster || 'https://via.placeholder.com/300x450',
                  description, releaseYear: year, imdbRating: imdb,
                  downloadLinks: dlJson, country: 'کشور',
                  source: url.includes('animex') ? 'animex' : 'donyayeserial',
                  sourceUrl: url, cast: '[]', screenshots: '[]',
                }
              });
            }
          }

          scrapeProgress.done++;
          await sleep(150);
        } catch {
          scrapeProgress.errors++;
          scrapeProgress.done++;
        }
      }

      scrapeProgress.phase = 'تمام شد';
    } catch (err: any) {
      console.error('Scraper error:', err.message);
    }
    scraperRunning = false;
  })();
});

app.get('/scrape/status', (_req, res) => {
  res.json(scrapeProgress);
});

// Helper functions
function slugify(text: string): string {
  const persian: Record<string, string> = {'آ':'a','ا':'a','ب':'b','پ':'p','ت':'t','ث':'s','ج':'j','چ':'ch','ح':'h','خ':'kh','د':'d','ذ':'z','ر':'r','ز':'z','ژ':'zh','س':'s','ش':'sh','ص':'s','ض':'z','ط':'t','ظ':'z','ع':'a','غ':'gh','ف':'f','ق':'gh','ک':'k','گ':'g','ل':'l','م':'m','ن':'n','و':'v','ه':'h','ی':'y'};
  return text.toLowerCase().trim()
    .replace(/[\u0600-\u06FF]+/g, c => persian[c] || c)
    .replace(/[\s\W-]+/g, '-').replace(/^-+|-+$/g, '') || 'untitled';
}

function extractQ(url: string): string {
  const decoded = decodeURIComponent(url);
  const m = decoded.match(/\/(\d{3,4}[p]?)\s*(?:x265|x264)?\s*\/?$/i) || decoded.match(/\[(\d{3,4}[p]?)\]/i);
  if (m) return m[1].toLowerCase();
  if (decoded.includes('1080')) return '1080p';
  if (decoded.includes('720')) return '720p';
  if (decoded.includes('480')) return '480p';
  return 'unknown';
}

// ==================== Debug Scraper ====================
app.get('/scraper/debug', async (_req, res) => {
  try {
    const { AnimexScraper } = await import('./scrapers/animexScraper');
    const scraper = new AnimexScraper();
    
    // Test getListings
    const listings = await scraper.getListings(1);
    
    // Test scrapeContent on first URL
    let firstItem = null;
    if (listings.length > 0) {
      try {
        firstItem = await scraper.scrapeContent(listings[0]);
      } catch (e: any) {
        firstItem = { error: e.message };
      }
    }

    res.json({
      listingsCount: listings.length,
      firstFewUrls: listings.slice(0, 5),
      firstItem: firstItem ? { title: firstItem.title, type: firstItem.type, hasDownloadLinks: Object.keys(firstItem.downloadLinks || {}).length > 0 } : null,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
app.get('/scraper/test', async (_req, res) => {
  const axios = (await import('axios')).default;
  const tests: Array<{ name: string; url: string; status: string; code?: number; linksFound?: number }> = [];

  for (const site of [
    { name: 'animex /movie/', url: 'https://animex.click/movie/' },
    { name: 'animex /serial/', url: 'https://animex.click/serial/' },
    { name: 'animex /anime/', url: 'https://animex.click/anime/' },
    { name: 'donyayeserial', url: 'https://donyayeserial.com/page/1/' },
  ]) {
    try {
      const r = await axios.get(site.url, {
        timeout: 15000,
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
        maxRedirects: 5,
      });
      // Count content links
      const cheerio = await import('cheerio');
      const $ = cheerio.load(r.data);
      let linksFound = 0;
      $('a[href]').each((_, el) => {
        const href = $(el).attr('href') || '';
        if (href.match(/animex\.(click|cc)\/(anime|movie|serial)\//) ||
            href.match(/donyayeserial\.com\/(series|movie|film)\//)) {
          linksFound++;
        }
      });
      tests.push({ name: site.name, url: site.url, status: 'OK', code: r.status, linksFound });
    } catch (err: any) {
      tests.push({ name: site.name, url: site.url, status: err.message?.substring(0, 80) || 'error', code: err.response?.status });
    }
  }

  const movieCount = await prisma.movie.count();
  const seriesCount = await prisma.series.count();
  const lastLog = await prisma.scrapLog.findFirst({ orderBy: { startedAt: 'desc' } });

  res.json({
    sites: tests,
    db: { movies: movieCount, series: seriesCount },
    lastScrape: lastLog,
    scraperRunning,
  });
});

// ==================== Scraper Admin Panel ====================
let scraperRunning = false;

app.get('/scraper', async (_req, res) => {
  const movieCount = await prisma.movie.count();
  const seriesCount = await prisma.series.count();
  const genreCount = await prisma.genre.count();
  const logs = await prisma.scrapLog.findMany({ orderBy: { startedAt: 'desc' }, take: 5 });

  res.send(`<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Zingo Scraper Panel</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui; background: #0f172a; color: #e2e8f0; min-height: 100vh; padding: 2rem; }
    .card { background: #1e293b; border-radius: 1rem; padding: 1.5rem; margin-bottom: 1rem; border: 1px solid #334155; }
    h1 { color: #f43f5e; margin-bottom: 1.5rem; }
    h2 { color: #94a3b8; font-size: 0.9rem; margin-bottom: 0.75rem; }
    .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 1.5rem; }
    .stat { text-align: center; }
    .stat .num { font-size: 2rem; font-weight: bold; color: #f43f5e; }
    .stat .label { color: #64748b; font-size: 0.85rem; }
    button { background: linear-gradient(135deg, #f43f5e, #fb923c); color: white; border: none; padding: 0.75rem 2rem; border-radius: 0.75rem; font-size: 1rem; cursor: pointer; width: 100%; font-weight: bold; }
    button:hover { opacity: 0.9; }
    button:disabled { opacity: 0.5; cursor: not-allowed; }
    .status { padding: 0.5rem 1rem; border-radius: 0.5rem; font-size: 0.85rem; margin-top: 1rem; }
    .running { background: #166534; color: #86efac; }
    .idle { background: #1e3a5f; color: #93c5fd; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 0.5rem; text-align: right; border-bottom: 1px solid #334155; font-size: 0.85rem; }
    th { color: #64748b; }
    .success { color: #4ade80; }
    .failed { color: #f87171; }
    #result { margin-top: 1rem; white-space: pre-wrap; font-family: monospace; font-size: 0.8rem; color: #94a3b8; max-height: 300px; overflow-y: auto; background: #0f172a; padding: 1rem; border-radius: 0.5rem; display: none; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Zingo Scraper Panel</h1>
    <div class="stats">
      <div class="stat"><div class="num">${movieCount}</div><div class="label">فیلم</div></div>
      <div class="stat"><div class="num">${seriesCount}</div><div class="label">سریال</div></div>
      <div class="stat"><div class="num">${genreCount}</div><div class="label">ژانر</div></div>
    </div>
    <button onclick="startScraper()" id="btn">شروع اسکرپ</button>
    <div class="status idle" id="status">آماده</div>
    <div id="result"></div>
  </div>
  <div class="card">
    <h2>آخرین لاگ‌ها</h2>
    <table>
      <tr><th>منبع</th><th>وضعیت</th><th>تعداد</th><th>زمان</th></tr>
      ${logs.map(l => '<tr><td>' + l.source + '</td><td class="' + (l.status === 'success' ? 'success' : 'failed') + '">' + l.status + '</td><td>' + l.itemsScraped + '</td><td>' + new Date(l.startedAt).toLocaleString('fa-IR') + '</td></tr>').join('')}
      ${logs.length === 0 ? '<tr><td colspan="4" style="color:#64748b">لاگی موجود نیست</td></tr>' : ''}
    </table>
  </div>
  <script>
    async function startScraper() {
      const btn = document.getElementById('btn');
      const status = document.getElementById('status');
      const result = document.getElementById('result');
      btn.disabled = true;
      status.textContent = 'در حال اجرا...';
      status.className = 'status running';
      result.style.display = 'block';
      result.textContent = 'شروع اسکرپ...\\n';
      try {
        const res = await fetch('/scraper/trigger', { method: 'POST' });
        const data = await res.json();
        result.textContent += JSON.stringify(data, null, 2) + '\\n';
        status.textContent = data.message || 'اسکرپر شروع شد';
        let checkCount = 0;
        const interval = setInterval(async () => {
          checkCount++;
          try {
            const r = await fetch('/scraper/status');
            const s = await r.json();
            result.textContent += new Date().toLocaleTimeString() + ' - فیلم‌ها: ' + s.movieCount + ' | سریال‌ها: ' + s.seriesCount + '\\n';
            result.scrollTop = result.scrollHeight;
            if (checkCount >= 30) { clearInterval(interval); btn.disabled = false; status.textContent = 'تمام شد'; status.className = 'status idle'; }
          } catch(e) {}
        }, 10000);
      } catch(e) {
        result.textContent += 'خطا: ' + e.message + '\\n';
        btn.disabled = false;
        status.textContent = 'خطا';
        status.className = 'status failed';
      }
    }
  </script>
</body>
</html>`);
});

app.post('/scraper/trigger', async (_req, res) => {
  if (scraperRunning) {
    return res.json({ success: false, message: 'اسکرپر در حال اجراست' });
  }
  scraperRunning = true;
  try {
    const { runScraper } = await import('./scrapers/ingestor');
    runScraper().finally(() => { scraperRunning = false; });
    res.json({ success: true, message: 'اسکرپر شروع شد! هر 10 ثانیه وضعیت آپدیت میشه.' });
  } catch (error) {
    scraperRunning = false;
    res.status(500).json({ success: false, message: 'خطا در شروع اسکرپر' });
  }
});

app.get('/scraper/status', async (_req, res) => {
  const movieCount = await prisma.movie.count();
  const seriesCount = await prisma.series.count();
  const genreCount = await prisma.genre.count();
  const lastLog = await prisma.scrapLog.findFirst({ orderBy: { startedAt: 'desc' } });
  res.json({ movieCount, seriesCount, genreCount, scraperRunning, lastLog });
});

// ==================== Error Handler ====================
app.use(errorHandler);

// ==================== Start Server ====================
app.listen(config.port, () => {
  console.log(`
  ╔══════════════════════════════════════╗
  ║   🎬 Zingo API Server Running      ║
  ║   🌐 http://localhost:${config.port}        ║
  ║   📊 Environment: ${config.nodeEnv.padEnd(17)}║
  ╚══════════════════════════════════════╝
  `);
});

export default app;
