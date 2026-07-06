"""Base Scraper class for all scrapers."""
import os
import requests
from bs4 import BeautifulSoup
from typing import List, Dict, Optional, Any
import time
import logging
import re
from urllib.parse import urljoin, urlparse

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class BaseScraper:
    """Base class with common scraping functionality."""

    def __init__(self, base_url: str):
        self.base_url = base_url
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'fa-IR,fa;q=0.9,en-US;q=0.8,en;q=0.7',
        })
        self.session.timeout = 30

    def fetch_page(self, url: str, retries: int = 3) -> Optional[BeautifulSoup]:
        """Fetch a page and return BeautifulSoup object."""
        for attempt in range(retries):
            try:
                response = self.session.get(url, timeout=30)
                response.raise_for_status()
                if not response.encoding:
                    response.encoding = response.apparent_encoding
                return BeautifulSoup(response.text, 'lxml')
            except requests.RequestException as e:
                logger.warning(f"Attempt {attempt + 1} failed for {url}: {e}")
                if attempt < retries - 1:
                    time.sleep(2 ** attempt)
                else:
                    logger.error(f"All attempts failed for {url}: {e}")
                    return None
        return None

    def get_text(self, element, default: str = "") -> str:
        """Safely extract text from a BeautifulSoup element."""
        if element:
            return self.clean_text(element.get_text(" ", strip=True))
        return default

    def get_attr(self, element, attr: str, default: str = "") -> str:
        """Safely extract an attribute from a BeautifulSoup element."""
        if element and element.has_attr(attr):
            return element[attr]
        return default

    def make_absolute_url(self, url: str) -> str:
        """Convert relative URL to absolute URL."""
        if not url:
            return ""
        return urljoin(self.base_url + "/", url.strip())

    def clean_text(self, text: Any, max_length: int = 0) -> str:
        """Normalize whitespace and trim noisy text."""
        if text is None:
            return ""
        cleaned = re.sub(r"\s+", " ", str(text)).strip()
        if max_length and len(cleaned) > max_length:
            return cleaned[:max_length].rstrip()
        return cleaned

    def extract_image_url(self, img) -> str:
        """Extract the best available URL from a lazy-loaded image tag."""
        if not img:
            return ""

        for attr in ("data-src", "data-lazy-src", "data-original", "data-full", "src"):
            value = self.get_attr(img, attr)
            if value and not value.startswith("data:"):
                return self.make_absolute_url(value)

        srcset = self.get_attr(img, "srcset")
        if srcset:
            candidates = [part.strip().split(" ")[0] for part in srcset.split(",") if part.strip()]
            if candidates:
                return self.make_absolute_url(candidates[-1])

        return ""

    def extract_image_caption(self, img, fallback: str = "") -> str:
        """Extract a useful caption from figcaption, nearby text, title, or alt."""
        if not img:
            return fallback

        figure = img.find_parent("figure")
        if figure:
            caption = self.get_text(figure.select_one("figcaption"))
            if caption:
                return caption

        for attr in ("title", "alt"):
            value = self.get_attr(img, attr)
            if value:
                return self.clean_text(value, 180)

        parent = img.find_parent(["div", "p", "li"])
        if parent:
            caption = self.clean_text(parent.get_text(" ", strip=True), 180)
            if caption and len(caption.split()) <= 24:
                return caption

        return fallback

    def image_record(self, img, fallback_caption: str = "") -> Optional[Dict[str, str]]:
        """Return a normalized image record suitable for API import."""
        url = self.extract_image_url(img)
        if not url:
            return None
        caption = self.extract_image_caption(img, fallback_caption)
        alt = self.clean_text(self.get_attr(img, "alt") or caption, 180)
        return {
            "url": url,
            "caption": caption,
            "alt": alt,
        }

    def dedupe_records(self, records: List[Dict[str, str]], key: str = "url") -> List[Dict[str, str]]:
        """Dedupe a list of dict records while preserving order."""
        seen = set()
        unique = []
        for record in records:
            value = record.get(key)
            if value and value not in seen:
                seen.add(value)
                unique.append(record)
        return unique

    def direct_downloads_enabled(self) -> bool:
        """Only publish direct media/download URLs when explicitly allowed."""
        return os.getenv("SCRAPER_ALLOW_DIRECT_DOWNLOAD_LINKS", "").lower() == "true"

    def allowed_download_hosts(self) -> List[str]:
        """Return the host allowlist for direct download URLs."""
        raw_hosts = os.getenv("SCRAPER_ALLOWED_DOWNLOAD_HOSTS", "")
        return [host.strip().lower() for host in raw_hosts.split(",") if host.strip()]

    def is_allowed_download_url(self, url: str) -> bool:
        """Check whether a URL is allowed to be imported as a direct download link."""
        if not url or not self.direct_downloads_enabled():
            return False

        allowed_hosts = self.allowed_download_hosts()
        if not allowed_hosts:
            return False

        try:
            hostname = urlparse(url).hostname or ""
        except ValueError:
            return False

        hostname = hostname.lower()
        return any(hostname == host or hostname.endswith("." + host) for host in allowed_hosts)

    def maybe_add_download_link(self, links: Dict[str, str], quality: str, url: str) -> None:
        """Add a download link only if the URL passes the explicit allowlist."""
        absolute_url = self.make_absolute_url(url)
        if self.is_allowed_download_url(absolute_url):
            links[quality or "unknown"] = absolute_url

    def slugify(self, text: str) -> str:
        """Create URL-friendly slug from text."""
        # Basic slugify - remove special chars, replace spaces with dashes
        slug = text.lower().strip()
        # Persian to English mapping for common chars
        replacements = {
            'آ': 'a', 'ا': 'a', 'ب': 'b', 'پ': 'p', 'ت': 't',
            'ث': 's', 'ج': 'j', 'چ': 'ch', 'ح': 'h', 'خ': 'kh',
            'د': 'd', 'ذ': 'z', 'ر': 'r', 'ز': 'z', 'ژ': 'zh',
            'س': 's', 'ش': 'sh', 'ص': 's', 'ض': 'z', 'ط': 't',
            'ظ': 'z', 'ع': 'a', 'غ': 'gh', 'ف': 'f', 'ق': 'gh',
            'ک': 'k', 'گ': 'g', 'ل': 'l', 'م': 'm', 'ن': 'n',
            'و': 'v', 'ه': 'h', 'ی': 'y', ' ': '-', '-': '-',
        }
        for persian, english in replacements.items():
            slug = slug.replace(persian, english)
        # Remove non-alphanumeric chars except dashes
        slug = ''.join(c if c.isalnum() or c == '-' else '' for c in slug)
        slug = '-'.join(slug.split('-')[:10])  # Limit length
        return slug if slug else 'untitled'

    def import_to_api(self, api_url: str, api_key: str, data_type: str, items: List[Dict]) -> bool:
        """Send scraped data to the backend API."""
        if not items:
            return False

        try:
            response = requests.post(
                f"{api_url}/import",
                json={
                    "apiKey": api_key,
                    "type": data_type,
                    "data": items,
                },
                timeout=60,
            )
            if response.status_code in (200, 201):
                result = response.json()
                logger.info(f"Imported {result.get('data', {}).get('importedCount', 0)} items")
                return True
            else:
                logger.error(f"API returned {response.status_code}: {response.text}")
                return False
        except requests.RequestException as e:
            logger.error(f"Failed to import data: {e}")
            return False
