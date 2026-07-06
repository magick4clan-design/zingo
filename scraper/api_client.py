"""API client for sending scraped data to backend."""
import os
import requests
import logging
from typing import List, Dict

logger = logging.getLogger(__name__)


class ZingoAPIClient:
    """Client for Zingo backend API."""

    def __init__(self, api_url: str = None, api_key: str = None):
        self.api_url = self._normalize_api_url(api_url or os.getenv('BACKEND_URL', 'http://localhost:5001/api'))
        self.api_key = api_key or os.getenv('SCRAPER_API_KEY', 'your-scraper-api-key')

    def _normalize_api_url(self, url: str) -> str:
        """Accept either the backend origin or the /api base URL."""
        clean_url = (url or 'http://localhost:5001/api').rstrip('/')
        return clean_url if clean_url.endswith('/api') else f'{clean_url}/api'

    def import_movies(self, movies: List[Dict]) -> bool:
        """Import scraped movies to the backend."""
        if not movies:
            logger.warning("No movies to import")
            return False

        logger.info(f"Importing {len(movies)} movies to API...")
        try:
            response = requests.post(
                f"{self.api_url}/scraper/import",
                json={
                    "apiKey": self.api_key,
                    "type": "movie",
                    "data": movies,
                },
                timeout=120,
            )
            if response.status_code in (200, 201):
                result = response.json()
                count = result.get('data', {}).get('importedCount', 0)
                logger.info(f"Successfully imported {count} movies")
                return True
            else:
                logger.error(f"API error {response.status_code}: {response.text}")
                return False
        except requests.RequestException as e:
            logger.error(f"Failed to connect to API: {e}")
            return False

    def import_series(self, series: List[Dict]) -> bool:
        """Import scraped series to the backend."""
        if not series:
            logger.warning("No series to import")
            return False

        logger.info(f"Importing {len(series)} series to API...")
        try:
            response = requests.post(
                f"{self.api_url}/scraper/import",
                json={
                    "apiKey": self.api_key,
                    "type": "series",
                    "data": series,
                },
                timeout=120,
            )
            if response.status_code in (200, 201):
                result = response.json()
                count = result.get('data', {}).get('importedCount', 0)
                logger.info(f"Successfully imported {count} series")
                return True
            else:
                logger.error(f"API error {response.status_code}: {response.text}")
                return False
        except requests.RequestException as e:
            logger.error(f"Failed to connect to API: {e}")
            return False

    def health_check(self) -> bool:
        """Check if the API is reachable."""
        try:
            response = requests.get(f"{self.api_url}/health", timeout=10)
            return response.status_code == 200
        except requests.RequestException:
            return False
