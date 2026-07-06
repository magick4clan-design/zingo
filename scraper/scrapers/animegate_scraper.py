"""Scraper for animegate.net - anime and donghua metadata."""
import logging
import re
import time
from typing import Dict, List, Optional

from .base_scraper import BaseScraper

logger = logging.getLogger(__name__)


class AnimeGateScraper(BaseScraper):
    """Scraper for AnimeGate pages."""

    def __init__(self):
        super().__init__("https://animegate.net")
        self.name = "animegate"

    def get_listings(self, page: int = 1, path: str = "anime") -> List[str]:
        """Get detail URLs from AnimeGate listing pages."""
        url = f"{self.base_url}/{path}"
        if page > 1:
            url = f"{url}?page={page}"

        soup = self.fetch_page(url)
        if not soup:
            return []

        urls: List[str] = []
        for link in soup.select('li.post-anime-loop a[href*="/anime/"], a.loop-link[href*="/anime/"]'):
            href = self.get_attr(link, "href")
            if not href:
                continue
            if any(part in href for part in (
                "/anime/genre/",
                "/anime/type/",
                "/anime/status/",
                "/anime/season/",
                "/anime/year/",
                "/anime/source/",
                "/anime/schedule",
                "/anime/previous-seasons/",
            )):
                continue
            urls.append(self.make_absolute_url(href))

        return list(dict.fromkeys(urls))

    def scrape_content(self, url: str) -> Optional[Dict]:
        """Scrape a single AnimeGate detail page."""
        soup = self.fetch_page(url)
        if not soup:
            return None

        title = self.get_text(soup.select_one("h1.box-title"))
        if not title:
            meta_title = soup.select_one('meta[name="twitter:title"], meta[property="og:title"]')
            title = self.clean_text(self.get_attr(meta_title, "content").replace("دانلود انیمه", ""))

        if not title:
            logger.warning("No title found for %s", url)
            return None

        details_text = self.get_text(soup.select_one(".box-info-details"))
        description = self._extract_box_body(soup, "خلاصه داستان")
        other_titles = self._extract_other_titles(soup)
        original_title = other_titles.get("نام انگلیسی") or self.get_text(soup.select_one("h2.value.en"))
        persian_title = other_titles.get("نام فارسی")

        poster_url = self._extract_poster(soup, title)
        content_type = self._determine_type(details_text)
        episode_count = self._extract_int(details_text, r"تعداد قسمت\s*:\s*(\d+)")

        data: Dict = {
            "source": self.name,
            "sourceUrl": url,
            "title": title,
            "slug": self.slugify(title),
            "originalTitle": original_title or persian_title,
            "posterUrl": poster_url,
            "backdropUrl": poster_url,
            "description": description,
            "releaseYear": self._extract_int(details_text, r"سال ساخت میلادی\s*:\s*(\d{4})"),
            "duration": self._extract_duration(details_text),
            "imdbRating": self._extract_rating(soup),
            "quality": self.get_text(soup.select_one(".best-quality .item-value")),
            "language": "فارسی" if "هاردساب" in self.get_text(soup) else None,
            "network": self._extract_detail_value(details_text, "استودیو سازنده"),
            "genreNames": self._extract_genres(soup, details_text),
            "screenshots": self._extract_media_images(soup, title, poster_url),
            "downloadLinks": self._extract_download_links(url),
            "contentType": content_type,
        }

        if content_type == "series":
            data["seasons"] = [{
                "seasonNumber": 1,
                "title": "فصل 1",
                "episodes": [
                    {
                        "episodeNumber": episode_number,
                        "title": f"قسمت {episode_number}",
                        "downloadLinks": {},
                    }
                    for episode_number in range(1, min(episode_count or 0, 300) + 1)
                ],
            }]

        return data

    def scrape_list(self, pages: int = 3, paths: Optional[List[str]] = None) -> List[Dict]:
        """Scrape multiple AnimeGate listing pages."""
        all_items: List[Dict] = []
        seen_urls = set()
        listing_paths = paths or ["anime"]

        for path in listing_paths:
            for page in range(1, pages + 1):
                logger.info("Scraping %s page %s of %s...", path, page, self.name)
                urls = self.get_listings(page=page, path=path)
                new_urls = [item_url for item_url in urls if item_url not in seen_urls]
                seen_urls.update(new_urls)

                for item_url in new_urls:
                    item = self.scrape_content(item_url)
                    if item:
                        all_items.append(item)
                    time.sleep(0.8)

                if not urls:
                    break
                time.sleep(1.5)

        logger.info("Scraped %s items from %s", len(all_items), self.name)
        return all_items

    def _extract_box_body(self, soup, heading: str) -> str:
        """Extract the body text under a box-info-data heading."""
        for box in soup.select(".box-info-data"):
            heading_text = self.get_text(box.select_one("h4"))
            if heading in heading_text:
                return self.clean_text(self.get_text(box.select_one(".box-info-body")), 3500)
        return ""

    def _extract_other_titles(self, soup) -> Dict[str, str]:
        """Extract alternate titles from the details section."""
        values: Dict[str, str] = {}
        for item in soup.select(".other-titles .item"):
            label = self.get_text(item.select_one(".label")).rstrip(":")
            value = self.get_text(item.select_one(".value, h2"))
            if label and value:
                values[label] = value
        return values

    def _extract_poster(self, soup, title: str) -> str:
        """Extract the detail poster URL."""
        poster = self.image_record(soup.select_one(".box-img img, meta[property='og:image']"), title)
        if poster:
            return poster["url"]

        og_image = soup.select_one('meta[property="og:image"], meta[name="twitter:images0"]')
        return self.make_absolute_url(self.get_attr(og_image, "content"))

    def _extract_genres(self, soup, details_text: str) -> List[str]:
        """Extract genres from links or the fallback detail text."""
        genres = [self.get_text(link) for link in soup.select(".box-genres a")]
        if genres:
            return list(dict.fromkeys([genre for genre in genres if genre]))

        detail_genres = self._extract_detail_value(details_text, "ژانر ها")
        return [self.clean_text(item) for item in re.split(r"[,،]", detail_genres) if self.clean_text(item)]

    def _extract_media_images(self, soup, title: str, poster_url: str) -> List[Dict[str, str]]:
        """Extract screenshots/media images when present."""
        images: List[Dict[str, str]] = []
        for img in soup.select(".box-media img, .media img, .gallery img, #media img"):
            record = self.image_record(img, title)
            if record and record["url"] != poster_url:
                images.append(record)
        return self.dedupe_records(images)[:10]

    def _extract_download_links(self, url: str) -> Dict[str, str]:
        """Fetch AnimeGate download endpoint and keep only explicitly allowed direct URLs."""
        anime_id_match = re.search(r"-(\d+)(?:/)?$", url)
        if not anime_id_match:
            return {}

        links: Dict[str, str] = {}
        anime_id = anime_id_match.group(1)
        headers = {
            "Referer": url,
            "X-Requested-With": "XMLHttpRequest",
            "Accept": "application/json, text/plain, */*",
        }

        # Some pages expose download groups by index. Empty responses are normal for pages
        # that require client-side state, login, or have no published public links.
        for index in range(1, 10):
            try:
                response = self.session.get(
                    f"{self.base_url}/anime/download-links/{anime_id}",
                    params={"index": index, "page": 1},
                    headers=headers,
                    timeout=20,
                )
                if response.status_code != 200:
                    continue
                payload = response.json()
            except Exception:
                continue

            for item in payload.get("data", []) or []:
                quality = self.clean_text(item.get("quality") or item.get("label") or f"index-{index}", 120)
                link = self.clean_text(item.get("link"), 1200)
                self.maybe_add_download_link(links, quality, link)

        return links

    def _determine_type(self, details_text: str) -> str:
        """Classify AnimeGate content for the local schema."""
        anime_type = self._extract_detail_value(details_text, "نوع")
        return "movie" if "سینمایی" in anime_type else "series"

    def _extract_rating(self, soup) -> Optional[float]:
        """Extract the MyAnimeList/AnimeGate rating."""
        text = self.get_text(soup.select_one(".box-rating")) or self.get_text(soup)
        match = re.search(r"MyAnimeList\s*Score\s*:\s*(\d+(?:\.\d+)?)", text)
        if not match:
            match = re.search(r"AnimeGate\s*Score\s*:\s*(\d+(?:\.\d+)?)", text)
        return float(match.group(1)) if match else None

    def _extract_detail_value(self, details_text: str, label: str) -> str:
        """Extract a labeled value from flattened AnimeGate detail text."""
        labels = [
            "نوع", "فصل", "وضعیت", "سال ساخت میلادی", "پخش از", "منبع",
            "تهیه‌کنندگان", "تعداد قسمت", "زمان پخش (ژاپن)", "زمان هر قسمت",
            "رده سنی", "استودیو سازنده", "ژانر ها",
        ]
        next_labels = "|".join(re.escape(item) for item in labels if item != label)
        pattern = rf"{re.escape(label)}\s*:\s*(.*?)(?=\s+(?:{next_labels})\s*:|$)"
        match = re.search(pattern, details_text)
        return self.clean_text(match.group(1), 500) if match else ""

    def _extract_int(self, text: str, pattern: str) -> Optional[int]:
        match = re.search(pattern, text)
        return int(match.group(1)) if match else None

    def _extract_duration(self, details_text: str) -> Optional[int]:
        value = self._extract_detail_value(details_text, "زمان هر قسمت")
        if not value or "نامشخص" in value:
            return None

        hours = 0
        minutes = 0
        hour_match = re.search(r"(\d+)\s*ساعت", value)
        minute_match = re.search(r"(\d+)\s*دقیقه", value)
        if hour_match:
            hours = int(hour_match.group(1))
        if minute_match:
            minutes = int(minute_match.group(1))

        total = hours * 60 + minutes
        return total or None


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    scraper = AnimeGateScraper()
    for scraped in scraper.scrape_list(pages=1)[:5]:
        print(scraped["title"], scraped.get("contentType"), scraped.get("releaseYear"))
