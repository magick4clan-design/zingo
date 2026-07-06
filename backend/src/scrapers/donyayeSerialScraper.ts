import { BaseScraper } from './baseScraper';
import * as cheerio from 'cheerio';

export interface ScrapedEpisode {
  episodeNumber: number;
  title: string;
  downloadLinks: Record<string, string>;
}

export interface ScrapedSeason {
  seasonNumber: number;
  title: string;
  episodes: ScrapedEpisode[];
}

export interface ScrapedContent {
  title: string;
  originalTitle?: string;
  posterUrl: string;
  description: string;
  releaseYear?: number;
  imdbRating?: number;
  genreNames: string[];
  downloadLinks: Record<string, Record<string, string>>;
  seasons?: ScrapedSeason[];
  source: string;
  sourceUrl: string;
  screenshots: string[];
  type: 'movie' | 'series';
}

export class DonyayeSerialScraper extends BaseScraper {
  constructor() {
    super('https://donyayeserial.com', 'donyayeserial');
  }

  async getListings(page: number = 1): Promise<string[]> {
    const urls: string[] = [];
    const $ = await this.fetchPage(`${this.baseUrl}/page/${page}/`);
    if (!$) return urls;

    $('article h2 a').each((_, el) => {
      const href = this.getAttr($(el), 'href');
      if (href && !href.includes('/category/') && !href.includes('/tag/') && !href.includes('/page/')) {
        urls.push(this.makeAbsoluteUrl(href));
      }
    });

    return [...new Set(urls)];
  }

  async scrapeContent(url: string): Promise<ScrapedContent | null> {
    const $ = await this.fetchPage(url);
    if (!$) return null;

    const title = this.getText($('h1'));
    if (!title) return null;

    const isSeries = url.includes('/series/') || title.includes('سریال') || title.includes('فصل');

    let originalTitle: string | undefined;
    const engMatch = title.match(/\(([A-Za-z\s\d:.-]+)\)/);
    if (engMatch) {
      originalTitle = engMatch[1].trim();
    }

    const posterUrl = this.getAttr($('img.attachment-indexFilm, img.wp-post-image').first(), 'src') || '';
    const description = this.getText($('.entry-content, .post-content'), '').substring(0, 2000);

    const data: ScrapedContent = {
      title,
      originalTitle,
      posterUrl,
      description,
      genreNames: [],
      downloadLinks: {},
      screenshots: [],
      source: this.name,
      sourceUrl: url,
      type: isSeries ? 'series' : 'movie'
    };

    $('.cat-links a').each((_, el) => {
      data.genreNames.push(this.getText($(el)));
    });

    const bodyText = $('body').text();
    const imdbMatch = bodyText.match(/IMDB[:\s]*(\d+\.?\d*)/i) || bodyText.match(/امتیاز[:\s]*(\d+\.?\d*)/);
    if (imdbMatch) {
      const rating = parseFloat(imdbMatch[1]);
      if (!isNaN(rating) && rating > 0 && rating <= 10) {
        data.imdbRating = rating;
      }
    }

    const yearMatch = title.match(/\b(19|20)\d{2}\b/);
    if (yearMatch) {
      data.releaseYear = parseInt(yearMatch[0]);
    }

    if (true) { // Always try to find download links
      const dlHosts = ['donyayeserial', 'dl.donyayeserial', 'dl1.donyayeserial', 'dl2.donyayeserial'];
      const hostSelector = dlHosts.map(h => `a[href*="${h}"]`).join(', ');

      $(hostSelector).each((_, el) => {
        const href = this.getAttr($(el), 'href');
        const text = this.getText($(el));
        if (!href) return;

        // More robust check for download links
        if (text.includes('دانلود') || href.includes('/dl/') || href.includes('/download/')) {
          const quality = this.extractQualityFromUrl(href);
          if (!data.downloadLinks['server1']) data.downloadLinks['server1'] = {};
          data.downloadLinks['server1'][quality] = href;
        }
      });
    }

    $('.entry-content img, .gallery img').each((i, el) => {
      if (i >= 8) return false;
      const src = this.getAttr($(el), 'src');
      if (src && !src.includes('logo')) {
        data.screenshots.push(this.makeAbsoluteUrl(src));
      }
    });

    return data;
  }
}
