import { BaseScraper } from './baseScraper';
import * as cheerio from 'cheerio';

export interface ScrapedContent {
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
  status?: string;
  airDay?: string;
  downloadLinks: Record<string, Record<string, string>>;
  source: string;
  sourceUrl: string;
  screenshots: string[];
  type: 'movie' | 'series';
}

export class AnimexScraper extends BaseScraper {
  constructor() {
    super('https://animex.click', 'animex');
  }

  async getListings(page: number = 1): Promise<string[]> {
    const urls: string[] = [];
    
    // animex.click uses /movie/, /serial/, /anime/ for listings
    // and /movie/page/2/, /serial/page/3/ for pagination
    const pages = [
      page === 1 ? `${this.baseUrl}/movie/` : `${this.baseUrl}/movie/page/${page}/`,
      page === 1 ? `${this.baseUrl}/serial/` : `${this.baseUrl}/serial/page/${page}/`,
      page === 1 ? `${this.baseUrl}/anime/` : `${this.baseUrl}/anime/page/${page}/`,
    ];

    for (const pageUrl of pages) {
      const $ = await this.fetchPage(pageUrl);
      if (!$) continue;

      $('a[href]').each((_, el) => {
        const href = this.getAttr($(el), 'href');
        if (!href) return;

        // Match anime/movie/serial links
        if (href.match(/animex\.(click|cc)\/(anime|movie|serial)\//)) {
          const normalizedUrl = href.replace('animex.cc', 'animex.click');
          urls.push(normalizedUrl);
        }
      });
    }

    return [...new Set(urls)];
  }

  async scrapeContent(url: string): Promise<ScrapedContent | null> {
    const $ = await this.fetchPage(url);
    if (!$) return null;

    const pageTitle = this.getText($('title'));
    const title = pageTitle.replace(/–\s*انیمکس$/i, '').replace(/\s*-\s*انیمکس$/i, '').trim();
    if (!title) return null;

    const posterUrl = this.getAttr($('img.postimgf, .post-thumbnail img, .entry-content img').first(), 'src')
      || this.getAttr($('img').first(), 'src') || '';

    const data: ScrapedContent = {
      title,
      posterUrl,
      description: '',
      genreNames: [],
      downloadLinks: {},
      source: this.name,
      sourceUrl: url,
      screenshots: [],
      type: 'movie'
    };

    // --- Metadata from the info table ---
    const bodyHtml = $.html();
    
    // Country
    const countryMatch = bodyHtml.match(/محصول\s*:?\s*([\w\u0600-\u06FF\s]+?)(?:\s*<|\s*\n)/i);
    if (countryMatch) data.country = countryMatch[1].trim();

    // Quality display
    const qualityMatch = bodyHtml.match(/کیفیت\s*(?:نمایش|دانلود)?\s*:?\s*([\w\s-]+?)(?:\s*<|\s*\n)/i);
    if (qualityMatch) data.quality = qualityMatch[1].trim();

    // Content type (سریالی / فیلم)
    const typeMatch = bodyHtml.match(/نوع\s*(?:انیمه|فیلم)\s*:?\s*([\w\u0600-\u06FF\s]+?)(?:\s*<|\s*\n)/i);
    if (typeMatch) {
      data.contentType = typeMatch[1].trim();
      data.type = typeMatch[1].includes('سریال') ? 'series' : 'movie';
    }

    // Episode count
    const epMatch = bodyHtml.match(/قسمت\s*(\d+)/i);
    if (epMatch) data.episodeCount = parseInt(epMatch[1]);

    // Season count
    const seasonMatch = bodyHtml.match(/فصل\s*(\d+)/i);
    if (seasonMatch) data.seasonCount = parseInt(seasonMatch[1]);

    // Year
    const yearMatch = bodyHtml.match(/سال\s*(?:پخش|انتشار)\s*:?\s*(\d{4})/i) || bodyHtml.match(/\b(20\d{2})\b/);
    if (yearMatch) data.releaseYear = parseInt(yearMatch[1]);

    // Air day
    const dayMatch = bodyHtml.match(/روز\s*پخش\s*(?:هفتگی)?\s*:?\s*([\w\u0600-\u06FF]+)/i);
    if (dayMatch) data.airDay = dayMatch[1].trim();

    // Status
    const statusMatch = bodyHtml.match(/وضعیت\s*:?\s*([\w\u0600-\u06FF\s]+?)(?:\s*<|\s*\n)/i);
    if (statusMatch) data.status = statusMatch[1].trim();

    // IMDB rating
    const imdbMatch = bodyHtml.match(/IMDB\s*[:\s]*(\d+\.?\d*)/i) || bodyHtml.match(/امتیاز\s*[:\s]*(\d+\.?\d*)/i);
    if (imdbMatch) {
      const r = parseFloat(imdbMatch[1]);
      if (r > 0 && r <= 10) data.imdbRating = r;
    }

    // Genres
    const seenGenres = new Set<string>();
    $('a').each((_, el) => {
      const href = this.getAttr($(el), 'href');
      const text = this.getText($(el)).trim();
      if (href && href.includes('/category/') && text.length > 1 && text.length < 30 && !seenGenres.has(text)) {
        seenGenres.add(text);
        data.genreNames.push(text);
      }
    });

    // --- Download Links ---
    // Strategy: find pairs of "پخش آنلاین" + "دانلود" links
    // The download link href contains the quality in the URL path
    // Download hosts (all variations of storage servers)
    const dlHosts = ['csdl1', 'ndl1', 'ndl2', 'ndl3', 'ndl4', 'ndl5', 'ndl6', 'ndl7', 'ndl8', 'ndl9',
                     'dl.hollowofthealley', 'dl2.hollowofthealley', 'dl2a.hollowofthealley', 'dl6.hollowofthealley'];
    const hostSelector = dlHosts.map(h => `a[href*="${h}"]`).join(', ');

    interface DlEntry { url: string; quality: string; serverHost: string; isDirect: boolean }
    const entries: DlEntry[] = [];
    const seenUrls = new Set<string>();

    $(hostSelector).each((_, el) => {
      const href = this.getAttr($(el), 'href');
      if (!href || seenUrls.has(href)) return;
      seenUrls.add(href);

      // Skip subtitle links
      if (href.includes('subsource.net') || href.includes('subsource')) return;
      // Skip stream links
      if (href.includes('animexstream.fun') || href.includes('animexstream')) return;

      let serverHost = 'unknown';
      try {
        const fullUrl = href.startsWith('http') ? href : `https://${href}`;
        serverHost = new URL(fullUrl).hostname.replace('.hollowofthealley.space', '');
      } catch {}

      const quality = this.extractQualityFromUrl(href);
      const isDirect = !!href.match(/\.(mkv|mp4|zip)$/i) || href.includes('/N/');

      entries.push({ url: href, quality, serverHost, isDirect });
    });

    // Group by server host + directory key (to separate seasons/episode ranges)
    // Directory key = common path prefix that groups same-season links
    const groupMap = new Map<string, Record<string, string>>();

    for (const entry of entries) {
      let groupKey = entry.serverHost;
      // For directory URLs, use the parent directory as group key
      try {
        const u = new URL(entry.url);
        const dir = u.searchParams.get('dir') || '';
        if (dir) {
          const parts = dir.split('/').filter(Boolean);
          if (parts.length > 1) {
            // Use everything except the last segment as the group key
            const parentDir = parts.slice(0, -1).join('/');
            groupKey = `${entry.serverHost}/${parentDir}`;
          }
        }
      } catch {}

      if (!groupMap.has(groupKey)) groupMap.set(groupKey, {});
      const linkGroup = groupMap.get(groupKey)!;
      linkGroup[entry.quality] = entry.url;
    }

    // Assign server names
    let serverIdx = 1;
    for (const [groupKey, links] of groupMap) {
      data.downloadLinks[`server${serverIdx}`] = links;
      serverIdx++;
    }

    // Fallback: if no download links found, try generic "دانلود" anchor search
    if (Object.keys(data.downloadLinks).length === 0) {
      $('a').each((_, el) => {
        const href = this.getAttr($(el), 'href');
        const text = this.getText($(el)).trim();
        if (href && text === 'دانلود' && !href.includes('subsource.net') && !href.includes('animexstream.fun')) {
          const quality = this.extractQualityFromUrl(href);
          const serverName = `server${Object.keys(data.downloadLinks).length + 1}`;
          if (!data.downloadLinks[serverName]) data.downloadLinks[serverName] = {};
          data.downloadLinks[serverName][quality] = href;
        }
      });
    }

    // --- Screenshots ---
    const seenScreenshots = new Set<string>();
    $('img').each((_, el) => {
      const src = this.getAttr($(el), 'src');
      if (src && (src.includes('screenshot') || src.includes('/ss/') || src.includes('wp-content/uploads'))
        && !src.includes('logo') && !src.includes('avatar') && !src.includes('poster')
        && !seenScreenshots.has(src) && data.screenshots.length < 8) {
        seenScreenshots.add(src);
        data.screenshots.push(src);
      }
    });

    // --- Description from entry-content ---
    const entryContent = $('.entry-content, .post-content').html() || '';
    // Remove the download section and keep the description
    const descHtml = entryContent.replace(/<table[\s\S]*?<\/table>/gi, '').replace(/<div[^>]*class="[^"]*download[^"]*"[\s\S]*?<\/div>/gi, '');
    const descText = cheerio.load(descHtml)('body').text().trim();
    data.description = descText.substring(0, 2000);

    return data;
  }
}
