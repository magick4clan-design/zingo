"""Scraper for donyayeserial.com - Movies and TV Series."""
import logging
import re
import time
from typing import List, Dict, Optional
from bs4 import BeautifulSoup
from .base_scraper import BaseScraper

logger = logging.getLogger(__name__)


class DonyayeSerialScraper(BaseScraper):
    """Scraper for donyayeserial.com website."""

    def __init__(self):
        super().__init__("https://donyayeserial.com")
        self.name = "donyayeserial"

    def get_listings(self, page: int = 1, category: str = "") -> List[str]:
        """Get list of content URLs from listing pages."""
        urls = []
        if category:
            url = f"{self.base_url}/{category}/page/{page}/"
        else:
            url = f"{self.base_url}/page/{page}/"

        soup = self.fetch_page(url)
        if not soup:
            return urls

        # WordPress article/post links
        articles = soup.select('article a, .post-title a, h2 a, .entry-title a, .post h2 a')
        for article in articles:
            href = self.get_attr(article, 'href')
            if href and '/category/' not in href and '/tag/' not in href and '/page/' not in href:
                urls.append(self.make_absolute_url(href))

        # Remove duplicates
        seen = set()
        unique_urls = []
        for url in urls:
            if url not in seen:
                seen.add(url)
                unique_urls.append(url)

        return unique_urls

    def determine_type(self, url: str, soup: BeautifulSoup) -> str:
        """Determine if content is a movie or series."""
        text = soup.get_text().lower()
        url_lower = url.lower()

        # Series indicators
        series_keywords = ['سریال', 'فصل', 'قسمت', 'season', 'episode', 'سری']
        for keyword in series_keywords:
            if keyword in text or keyword in url_lower:
                return 'series'

        # Category-based
        cat_elem = soup.select_one('.cat-links a, .post-categories a')
        if cat_elem:
            cat_text = self.get_text(cat_elem).lower()
            if 'serial' in cat_text or 'سریال' in cat_text:
                return 'series'

        return 'movie'

    def scrape_content(self, url: str) -> Optional[Dict]:
        """Scrape a single movie or series page."""
        soup = self.fetch_page(url)
        if not soup:
            return None

        content_type = self.determine_type(url, soup)

        if content_type == 'series':
            return self._scrape_series(url, soup)
        else:
            return self._scrape_movie(url, soup)

    def _scrape_movie(self, url: str, soup: BeautifulSoup) -> Optional[Dict]:
        """Scrape a movie page."""
        data = {
            "source": self.name,
            "sourceUrl": url,
            "contentType": "movie",
        }

        # Title
        title_elem = soup.select_one('h1.post-title, h1.entry-title, h1')
        data["title"] = self.get_text(title_elem)

        if not data["title"]:
            logger.warning(f"No title found for {url}")
            return None

        data["slug"] = self.slugify(data["title"])

        # Original title
        title_text = self.get_text(title_elem)
        if '(' in title_text and ')' in title_text:
            data["originalTitle"] = title_text[title_text.index('(') + 1:title_text.index(')')]

        # Poster
        poster_elem = soup.select_one('img.wp-post-image, .post img, .entry-content img:first-of-type')
        poster = self.image_record(poster_elem, data["title"])
        if poster:
            data["posterUrl"] = poster["url"]

        # Backdrop (larger image)
        backdrop_elem = soup.select_one('.entry-content img.size-large, .post img[width="700"]')
        backdrop = self.image_record(backdrop_elem, data["title"])
        if backdrop:
            data["backdropUrl"] = backdrop["url"]

        # Description
        desc_elem = soup.select_one('.entry-content, .post-content, article .content')
        if desc_elem:
            # Get text only from first paragraph or two
            paragraphs = desc_elem.select('p')
            data["description"] = self.clean_text(' '.join([self.get_text(p) for p in paragraphs[:3]]), 2500)

        # Screenshots
        screenshots = []
        img_elems = soup.select('.entry-content img, .post-content img')
        for img in img_elems[1:8]:
            record = self.image_record(img, data["title"])
            if record:
                screenshots.append(record)
        data["screenshots"] = self.dedupe_records(screenshots)

        # Download links. Direct URLs are imported only when explicitly allowed.
        download_links = {}
        link_elems = soup.select('.entry-content a, .post-content a, .download-links a, a[download]')
        for link in link_elems:
            href = self.get_attr(link, 'href')
            text = self.get_text(link)
            if href and ('download' in text.lower() or 'لینک' in text or 'دانلود' in text
                         or '.mp4' in href or '.mkv' in href or 'mediafire' in href or 'mega' in href):
                quality = self._extract_quality(text)
                if quality not in download_links:
                    self.maybe_add_download_link(download_links, quality, href)

        data["downloadLinks"] = download_links

        # IMDB rating
        imdb_elem = soup.select_one('[class*="imdb"], [class*="rating"], [class*="score"]')
        if imdb_elem:
            rating_text = self.get_text(imdb_elem)
            try:
                rating_match = re.search(r'(\d+\.?\d*)', rating_text)
                if rating_match:
                    data["imdbRating"] = float(rating_match.group(1))
            except (ValueError, AttributeError):
                pass

        # Release year
        year_match = re.search(r'\b(19|20)\d{2}\b', title_text)
        if year_match:
            data["releaseYear"] = int(year_match.group())

        # Genre
        category_elems = soup.select('.cat-links a, .post-categories a, .entry-terms a')
        if category_elems:
            data["genreNames"] = [self.get_text(cat) for cat in category_elems]

        # Country and language
        if desc_elem:
            desc_text = self.get_text(desc_elem)
            countries = ['آمریکا', 'انگلیس', 'کره', 'ژاپن', 'ترکیه', 'فرانسه', 'آلمان']
            for country in countries:
                if country in desc_text:
                    data["country"] = country
                    break

            if 'زبان' in desc_text:
                data["language"] = 'فارسی'

        return data

    def _scrape_series(self, url: str, soup: BeautifulSoup) -> Optional[Dict]:
        """Scrape a series page with seasons and episodes."""
        data = self._scrape_movie(url, soup)
        if not data:
            return None
        data["contentType"] = "series"

        # Parse seasons and episodes from the page
        seasons = []

        # Look for season headings or sections
        season_sections = soup.select(
            'h2:contains("فصل"), h3:contains("فصل"), h2:contains("season"), '
            'h3:contains("season"), div[class*="season"], [id*="season"]'
        )

        if not season_sections:
            # Try to find season info in link text
            link_elems = soup.select('.entry-content a, .post-content a')
            season_data: Dict[int, list] = {}

            for link in link_elems:
                href = self.get_attr(link, 'href')
                text = self.get_text(link)

                season_match = re.search(r'فصل\s*(\d+)|season\s*(\d+)', text, re.IGNORECASE)
                episode_match = re.search(r'قسمت\s*(\d+)|episode\s*(\d+)', text, re.IGNORECASE)

                if season_match and href:
                    season_num = int(season_match.group(1) or season_match.group(2))
                    ep_num = int(episode_match.group(1) or episode_match.group(2)) if episode_match else 0

                    if season_num not in season_data:
                        season_data[season_num] = []

                    quality = self._extract_quality(text)
                    episode_links: Dict[str, str] = {}
                    self.maybe_add_download_link(episode_links, quality, href)
                    season_data[season_num].append({
                        "episodeNumber": ep_num,
                        "title": text,
                        "downloadLinks": episode_links,
                    })

            if season_data:
                for season_num, episodes in sorted(season_data.items()):
                    seasons.append({
                        "seasonNumber": season_num,
                        "title": f"فصل {season_num}",
                        "episodes": episodes,
                    })

        data["seasons"] = seasons
        return data

    def scrape_list(self, pages: int = 5, categories: List[str] = None) -> List[Dict]:
        """Scrape multiple pages and return all content."""
        all_items = []
        all_urls = set()
        cats = categories or ["film", "series"]

        for category in cats:
            for page in range(1, pages + 1):
                logger.info(f"Scraping {category} page {page} of {self.name}...")
                urls = self.get_listings(page, category)
                new_urls = [u for u in urls if u not in all_urls]
                all_urls.update(new_urls)

                for url in new_urls:
                    item = self.scrape_content(url)
                    if item:
                        all_items.append(item)
                    time.sleep(1.5)

                if not urls:
                    break
                time.sleep(2)

        logger.info(f"Scraped {len(all_items)} items from {self.name}")
        return all_items

    def _extract_quality(self, text: str) -> str:
        """Extract quality string from download link text."""
        quality_patterns = [
            r'4[Kk]', r'2160p', r'1080p', r'720p', r'480p', r'360p',
            r'BluRay', r'WEB-DL', r'WEBRip', r'HDRip', r'DVDRip',
            r'x265', r'x264', r'HEVC', r'Dubbed', 'دوبله', 'زیرنویس',
        ]
        for pattern in quality_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return match.group()
        return 'unknown'


if __name__ == '__main__':
    logging.basicConfig(level=logging.INFO)
    scraper = DonyayeSerialScraper()
    items = scraper.scrape_list(pages=2)
    for item in items:
        print(f"  - [{item.get('source', 'N/A')}] {item['title']} ({item.get('releaseYear', 'N/A')})")
