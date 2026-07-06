import axios, { AxiosInstance } from 'axios';
import * as cheerio from 'cheerio';

const STORAGE_HOST = 'https://csdl1.hollowofthealley.space';

export abstract class BaseScraper {
  protected baseUrl: string;
  protected client: AxiosInstance;
  protected storageClient: AxiosInstance;
  public name: string;
  private static storageDown = false;
  private static storageChecked = false;

  constructor(baseUrl: string, name: string) {
    this.baseUrl = baseUrl;
    this.name = name;
    this.client = axios.create({
      baseURL: baseUrl,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      timeout: 30000,
    });
    this.storageClient = axios.create({
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      timeout: 8000,
    });
  }

  static async checkStorage(): Promise<boolean> {
    if (BaseScraper.storageChecked) return !BaseScraper.storageDown;
    try {
      await axios.get(STORAGE_HOST, { timeout: 5000, validateStatus: () => true });
      BaseScraper.storageDown = false;
      console.log('✓ Storage server is reachable');
    } catch {
      BaseScraper.storageDown = true;
      console.log('⚠ Storage server is DOWN - using directory links as-is');
    }
    BaseScraper.storageChecked = true;
    return !BaseScraper.storageDown;
  }

  static get isStorageDown(): boolean {
    return BaseScraper.storageDown;
  }

  protected async fetchPage(url: string, retries = 3): Promise<cheerio.Root | null> {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await this.client.get(url);
        return cheerio.load(response.data);
      } catch (err) {
        const error = err as any;
        if (error.code === 'EPROTO' || error.code === 'ECONNRESET') {
          if (i === retries - 1) return null;
          await new Promise(r => setTimeout(r, 3000 * (i + 1)));
          continue;
        }
        if (i === retries - 1) return null;
        await new Promise(r => setTimeout(r, 2000 * (i + 1)));
      }
    }
    return null;
  }

  protected async fetchStorageListing(url: string): Promise<cheerio.Root | null> {
    if (BaseScraper.storageDown) return null;
    try {
      const response = await this.storageClient.get(url);
      return cheerio.load(response.data);
    } catch {
      BaseScraper.storageDown = true;
      return null;
    }
  }

  protected async resolveDirectLinks(dirUrl: string): Promise<Record<string, string>> {
    if (BaseScraper.storageDown) return {};

    const directLinks: Record<string, string> = {};
    const urlsToTry: string[] = [dirUrl];

    if (dirUrl.includes('?dir=anime/') && !dirUrl.includes('/N/')) {
      urlsToTry.push(dirUrl.replace('?dir=anime/', '?dir=anime/N/anime/'));
    }

    for (const url of urlsToTry) {
      const $ = await this.fetchStorageListing(url);
      if (!$) continue;

      $('a').each((_, el) => {
        const href = $(el).attr('href');
        const text = $(el).text().trim();
        if (href && (href.toLowerCase().endsWith('.mkv') || href.toLowerCase().endsWith('.mp4'))) {
          directLinks[text] = href.startsWith('http') ? href : `${STORAGE_HOST}${href.startsWith('/') ? '' : '/'}${href}`;
        }
      });
      if (Object.keys(directLinks).length > 0) break;
    }

    return directLinks;
  }

  protected extractQualityFromUrl(url: string): string {
    // Direct file URLs (ending in .mkv, .mp4, .zip) - extract quality from filename
    const fileMatch = url.match(/[^/]+\.(mkv|mp4|zip)$/i);
    if (fileMatch) {
      const filename = decodeURIComponent(fileMatch[0]);
      // Look for [1080], [720], [480], [4K], [x265] etc in filename
      const qualMatch = filename.match(/\[(1080[pi]?|720[pi]?|480[pi]?|4[Kk]|2160[pi]?)\]/i);
      if (qualMatch) {
        let q = qualMatch[1];
        if (q.toLowerCase() === '4k') q = '4K';
        if (/\[x265\]|\[hevc\]/i.test(filename)) q += ' x265';
        return q;
      }
      return 'original';
    }

    // Directory URLs (?dir=...) - extract quality from last path segment
    try {
      const u = new URL(url);
      const dir = u.searchParams.get('dir') || '';
      const parts = dir.split('/').filter(Boolean); // Remove empty segments
      const lastPart = decodeURIComponent(parts[parts.length - 1] || '');
      if (!lastPart) return 'original';

      // Normalize quality labels
      let quality = lastPart.toLowerCase();
      if (quality === '4k' || quality === '4k ') quality = '4K';
      if (quality.match(/^\d+$/)) quality += 'p';
      quality = quality.replace(/x265|hevc/gi, 'x265').replace(/x264/gi, 'x264');
      quality = quality.trim().replace(/\s+/g, ' ');

      // Only return if it looks like a quality label
      if (quality.match(/\d/) || quality === '4K') return quality;
      return 'original';
    } catch {
      return 'original';
    }
  }

  protected getText(element: cheerio.Cheerio | null, defaultText: string = ""): string {
    return element?.text().trim() || defaultText;
  }

  protected getAttr(element: cheerio.Cheerio | null, attr: string, defaultAttr: string = ""): string {
    return element?.attr(attr) || defaultAttr;
  }

  protected makeAbsoluteUrl(url: string): string {
    if (url.startsWith('http')) return url;
    if (url.startsWith('//')) return 'https:' + url;
    return `${this.baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
  }

  protected slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[\u0600-\u06FF]+/g, (match) => {
        const persian: { [key: string]: string } = {
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

  protected extractQuality(text: string): string {
    const patterns = [
      /4[Kk]/, /2160p/, /1080p/, /720p/, /480p/, /360p/,
      /BluRay/, /WEB-DL/, /WEBRip/, /HDRip/, /DVDRip/,
      /x265/, /x264/, /HEVC/, /Dubbed/i, /دوبله/i, /زیرنویس/i
    ];
    for (const pattern of patterns) {
      if (pattern.test(text)) return text.match(pattern)![0];
    }
    return 'unknown';
  }
}
