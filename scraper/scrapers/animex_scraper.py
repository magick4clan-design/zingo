"""Scraper for animex.click - Anime, Movies, Korean Series."""
import logging
import re
import time
from typing import List, Dict, Optional
from bs4 import BeautifulSoup
from .base_scraper import BaseScraper

logger = logging.getLogger(__name__)


class AnimexScraper(BaseScraper):
    """Scraper for animex.click website."""

    def __init__(self):
        super().__init__("https://animex.click")
        self.name = "animex"

    def get_listings(self, page: int = 1) -> List[str]:
        """Get list of content URLs from listing pages."""
        urls = []
        soup = self.fetch_page(f"{self.base_url}/page/{page}/")
        if not soup:
            return urls

        # Animex cards are article.anime elements; the first anchor is the detail page.
        articles = soup.select('article.anime, article[class*="type-anime"]')
        for article in articles:
            link = article.select_one('a[href*="/anime/"], a[href*="/movie/"], a[href]')
            href = self.get_attr(link, 'href')
            if href and '/category/' not in href and '/tag/' not in href and '/genre/' not in href:
                urls.append(self.make_absolute_url(href))

        # Remove duplicates while preserving order
        seen = set()
        unique_urls = []
        for url in urls:
            if url not in seen:
                seen.add(url)
                unique_urls.append(url)

        return unique_urls

    def scrape_movie(self, url: str) -> Optional[Dict]:
        """Scrape a single movie/anime page."""
        soup = self.fetch_page(url)
        if not soup:
            return None

        main_post = soup.select_one('#primary article.type-anime, #primary article.anime, article.type-anime')
        content_root = main_post or soup.select_one('#primary') or soup

        data = {
            "source": self.name,
            "sourceUrl": url,
        }

        # Title
        title_elem = content_root.select_one('.singletitle, .single-title, h1.post-title, h1.entry-title')
        data["title"] = self.get_text(title_elem)

        if not data["title"]:
            og_title = soup.select_one('meta[property="og:title"], meta[name="twitter:title"]')
            data["title"] = self.clean_text(self.get_attr(og_title, "content").replace("– انیمکس", ""))

        if not data["title"]:
            logger.warning(f"No title found for {url}")
            return None

        data["slug"] = self.slugify(data["title"])

        # Original / alternate title
        alt_title = self.get_text(content_root.select_one('.singletitletwo, .original-title'))
        if alt_title:
            data["originalTitle"] = alt_title.split('|')[0].strip()

        # Poster
        poster_elem = content_root.select_one('img.postimgf, img.wp-post-image, img.attachment-post-thumbnail')
        poster = self.image_record(poster_elem, data["title"])
        if poster:
            data["posterUrl"] = poster["url"]
            data["backdropUrl"] = poster["url"]

        # Description
        desc_parts = []
        desc_root = content_root.select_one('.contenctpost, .contentpost, .entry-content, .post-content') or content_root
        for p in desc_root.select('p'):
            text = self.get_text(p)
            if len(text) >= 8 and not any(noise in text for noise in ("دیدگاه", "نظرات کاربران", "ورود / ثبت نام")):
                desc_parts.append(text)
            if len(desc_parts) >= 3:
                break
        data["description"] = self.clean_text(" ".join(desc_parts), 2500)

        # Screenshots / images in content
        screenshots = []
        poster_url = data.get("posterUrl")
        for img in content_root.select('figure img, .entry-content img, .post-content img, .screenshots img, [class*="gallery"] img'):
            record = self.image_record(img, data["title"])
            if record and record["url"] != poster_url and "logo" not in " ".join(img.get("class", [])).lower():
                screenshots.append(record)
            if len(screenshots) >= 8:
                break
        data["screenshots"] = self.dedupe_records(screenshots)

        data["downloadLinks"] = self._extract_download_links(content_root)

        # IMDB rating - look for rating text
        page_text = self.get_text(content_root)
        rating_match = re.search(r'(\d+(?:\.\d+)?)\s*/\s*10', page_text)
        if rating_match:
            data["imdbRating"] = float(rating_match.group(1))

        # Release year from title or content
        year_match = re.search(r'سال پخش\s*:\s*((?:19|20)\d{2})|\b((?:19|20)\d{2})\b', page_text)
        if year_match:
            data["releaseYear"] = int(year_match.group(1) or year_match.group(2))

        quality_match = re.search(r'کیفیت نمایش\s*:\s*([A-Za-z0-9\-\s]+)', page_text)
        if quality_match:
            data["quality"] = self.clean_text(quality_match.group(1), 80)

        country_match = re.search(r'محصول\s*:\s*([^\s|]+)', page_text)
        if country_match:
            data["country"] = self.clean_text(country_match.group(1), 80)

        network_match = re.search(r'\b([A-Za-z0-9 ._-]+)\s+مدت زمان', page_text)
        if network_match:
            data["network"] = self.clean_text(network_match.group(1), 120)

        # Genre / category
        data["genreNames"] = self._extract_genres(page_text)

        if self._is_series(content_root, page_text, url):
            data["contentType"] = "series"
            data["seasons"] = self._extract_seasons(page_text)
        else:
            data["contentType"] = "movie"

        return data

    def scrape_list(self, pages: int = 5) -> List[Dict]:
        """Scrape multiple pages and return all content."""
        all_items = []
        all_urls = set()

        for page in range(1, pages + 1):
            logger.info(f"Scraping page {page} of {self.name}...")
            urls = self.get_listings(page)
            new_urls = [u for u in urls if u not in all_urls]
            all_urls.update(new_urls)

            for url in new_urls:
                # Determine type based on URL/category
                item = self.scrape_movie(url)
                if item:
                    all_items.append(item)
                time.sleep(1)  # Be respectful

            if not urls:
                logger.info(f"No more content on page {page}, stopping.")
                break
            time.sleep(2)

        logger.info(f"Scraped {len(all_items)} items from {self.name}")
        return all_items

    def _extract_quality(self, text: str) -> str:
        """Extract quality string from download link text."""
        quality_patterns = [
            r'4[Kk]', r'2160p', r'1080p', r'720p', r'480p', r'360p',
            r'BluRay', r'WEB-DL', r'WEBRip', r'HDRip', r'DVDRip',
            r'x265', r'x264', r'HEVC',
        ]
        for pattern in quality_patterns:
            match = re.search(pattern, text)
            if match:
                return match.group()
        return 'unknown'

    def _extract_download_links(self, root) -> Dict[str, str]:
        """Extract direct links only when they match the explicit allowlist."""
        links: Dict[str, str] = {}
        for item in root.select('.dlitems, [class*="download"] li, .download-links a'):
            item_text = self.get_text(item)
            quality = self._extract_quality(item_text)
            for link in item.select('a[href]') if hasattr(item, "select") else [item]:
                href = self.get_attr(link, 'href')
                text = self.get_text(link)
                if href and 'پخش آنلاین' not in text and ('دانلود' in text or 'download' in text.lower()):
                    self.maybe_add_download_link(links, quality, href)
        return links

    def _is_series(self, root, page_text: str, url: str = "") -> bool:
        """Determine whether an Animex content item is a series."""
        normalized_url = url.lower()
        if "/serial/" in normalized_url or "/korean/" in normalized_url:
            return True
        if "/movie/" in normalized_url:
            return False

        class_text = " ".join(root.get("class", [])) if root else ""
        if "Typea-movie" in class_text:
            return False
        if "Typea-serie" in class_text:
            return True
        return (
            "نوع انیمه : سریالی" in page_text
            or re.search(r'\bS\d+\b|\bEP\d+\b|فصل\s+\d+|قسمت\s+\d+', page_text, re.IGNORECASE) is not None
        )

    def _extract_seasons(self, page_text: str) -> List[Dict]:
        """Create season/episode metadata from Animex summary text."""
        season_match = re.search(r'فصل\s*(\d+)|\bS(\d+)\b', page_text, re.IGNORECASE)
        episode_match = re.search(r'قسمت\s*(\d+)|\bEP(\d+)\b', page_text, re.IGNORECASE)
        season_num = int(season_match.group(1) or season_match.group(2)) if season_match else 1
        episode_count = int(episode_match.group(1) or episode_match.group(2)) if episode_match else 0

        episodes = []
        for episode_num in range(1, min(episode_count, 200) + 1):
            episodes.append({
                "episodeNumber": episode_num,
                "title": f"قسمت {episode_num}",
                "downloadLinks": {},
            })

        return [{
            "seasonNumber": season_num,
            "title": f"فصل {season_num}",
            "episodes": episodes,
        }]

    def _extract_genres(self, page_text: str) -> List[str]:
        """Extract known Persian genre names from the detail block."""
        known_genres = [
            "اکشن", "انیمیشن", "برنامه تلویزیونی", "بیوگرافی", "تاریخی", "ترسناک",
            "جنایی", "جنگی", "جوانان", "خانوادگی", "درام", "رازآلود", "سیاسی",
            "عاشقانه", "علمی-تخیلی", "فانتزی", "کمدی", "کوتاه", "ماجراجویی",
            "ماورا طبیعی", "مدرسه ای", "مستند", "ملودرام", "موزیک",
            "هنرهای رزمی", "هیجانی", "ورزشی", "وسترن", "پسرانه", "روانشناختی",
        ]
        info_match = re.search(r'مدت زمان\s*:.*?\|\s*(.*?)\s*\|\s*محصول', page_text)
        genre_text = info_match.group(1) if info_match else page_text
        return [genre for genre in known_genres if genre in genre_text][:8]


if __name__ == '__main__':
    logging.basicConfig(level=logging.INFO)
    scraper = AnimexScraper()
    items = scraper.scrape_list(pages=2)
    for item in items:
        print(f"  - {item['title']} ({item.get('releaseYear', 'N/A')})")
