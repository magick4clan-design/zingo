import { AnimexScraper } from './animexScraper';
import { DonyayeSerialScraper } from './donyayeSerialScraper';
import { BaseScraper } from './baseScraper';
import * as fs from 'fs';
import * as path from 'path';

const OUTPUT_FILE = path.join(__dirname, 'scraped_data.json');

async function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}

async function main() {
  console.log('🚀 Starting full scrape...\n');
  await BaseScraper.checkStorage();

  const allData: any[] = [];

  // ===== ANIMEX =====
  console.log('========== ANIMEX ==========');
  const animex = new AnimexScraper();
  
  for (const pageType of ['movie', 'serial', 'anime']) {
    console.log(`\n  Scraping /${pageType}/ ...`);
    let page = 1;
    let emptyCount = 0;

    while (page <= 500 && emptyCount < 2) {
      const url = page === 1 
        ? `https://animex.click/${pageType}/` 
        : `https://animex.click/${pageType}/page/${page}/`;
      
      try {
        const $ = await (animex as any).fetchPage(url);
        if (!$) { emptyCount++; page++; continue; }

        const pageUrls: string[] = [];
        $('a[href]').each((_: any, el: any) => {
          const href = $(el).attr('href');
          if (href && href.match(/animex\.(click|cc)\/(anime|movie|serial)\//)) {
            pageUrls.push(href.replace('animex.cc', 'animex.click'));
          }
        });

        const unique = [...new Set(pageUrls)];
        if (unique.length === 0) { emptyCount++; page++; continue; }
        
        emptyCount = 0;
        console.log(`    Page ${page}: ${unique.length} URLs`);

        for (const itemUrl of unique) {
          try {
            const item = await animex.scrapeContent(itemUrl);
            if (item && item.title) {
              allData.push({
                source: 'animex',
                type: item.type,
                title: item.title,
                url: itemUrl,
                poster: item.posterUrl,
                description: item.description,
                year: item.releaseYear,
                imdb: item.imdbRating,
                genres: item.genreNames,
                country: item.country,
                downloadLinks: item.downloadLinks,
                screenshots: item.screenshots,
              });
            }
            await sleep(800);
          } catch {}
        }
        page++;
        await sleep(1500);
      } catch {
        emptyCount++;
        page++;
      }
    }
  }

  // ===== DONYAYESERIAL =====
  console.log('\n========== DONYAYESERIAL ==========');
  const donyaye = new DonyayeSerialScraper();
  
  for (let page = 1; page <= 50; page++) {
    console.log(`  Page ${page}...`);
    try {
      const urls = await donyaye.getListings(page);
      if (urls.length === 0) break;
      console.log(`    Found ${urls.length} URLs`);

      for (const itemUrl of urls) {
        try {
          const item = await donyaye.scrapeContent(itemUrl);
          if (item && item.title) {
            allData.push({
              source: 'donyayeserial',
              type: item.type,
              title: item.title,
              url: itemUrl,
              poster: item.posterUrl,
              description: item.description,
              year: item.releaseYear,
              imdb: item.imdbRating,
              genres: item.genreNames,
              downloadLinks: item.downloadLinks,
              screenshots: item.screenshots,
            });
          }
          await sleep(1000);
        } catch {}
      }
      await sleep(2000);
    } catch {
      break;
    }
  }

  // ===== SAVE =====
  console.log(`\n========================================`);
  console.log(`Total items scraped: ${allData.length}`);
  console.log(`Saving to ${OUTPUT_FILE}...`);
  
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(allData, null, 2), 'utf-8');
  console.log(`✅ Done! File saved.`);
  console.log(`========================================`);
}

main().catch(console.error);
