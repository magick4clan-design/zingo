"""Main entry point for the Zingo scraper."""
import os
import sys
import logging
from dotenv import load_dotenv

# Load environment variables from project root
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('scraper.log', encoding='utf-8'),
    ],
)
logger = logging.getLogger(__name__)


def main():
    """Run all scrapers manually."""
    logger.info("=" * 60)
    logger.info("🎬 Zingo Scraper - Manual Run")
    logger.info("=" * 60)

    from scrapers.animegate_scraper import AnimeGateScraper
    from scrapers.animex_scraper import AnimexScraper
    from scrapers.donyayeserial_scraper import DonyayeSerialScraper
    from api_client import ZingoAPIClient

    api = ZingoAPIClient()

    # Check API health
    if not api.health_check():
        logger.warning("⚠️  Backend API is not reachable. Data will be logged but not imported.")

    mode = sys.argv[1] if len(sys.argv) > 1 else 'all'
    pages = int(sys.argv[2]) if len(sys.argv) > 2 else 3

    if mode in ('all', 'animex'):
        logger.info("\n📺 Scraping Animex.click...")
        try:
            animex = AnimexScraper()
            items = animex.scrape_list(pages=pages)
            logger.info(f"  Found {len(items)} items from Animex")
            if items and api.health_check():
                series_items = [i for i in items if i.get('contentType') == 'series' or i.get('seasons')]
                movie_items = [i for i in items if i not in series_items]
                if movie_items:
                    api.import_movies(movie_items)
                if series_items:
                    api.import_series(series_items)
        except Exception as e:
            logger.error(f"  ❌ Animex scraper error: {e}")

    if mode in ('all', 'animegate'):
        logger.info("\n🌐 Scraping AnimeGate.net...")
        try:
            animegate = AnimeGateScraper()
            items = animegate.scrape_list(pages=pages)
            logger.info(f"  Found {len(items)} items from AnimeGate")
            if items and api.health_check():
                series_items = [i for i in items if i.get('contentType') == 'series' or i.get('seasons')]
                movie_items = [i for i in items if i not in series_items]
                if movie_items:
                    api.import_movies(movie_items)
                if series_items:
                    api.import_series(series_items)
        except Exception as e:
            logger.error(f"  ❌ AnimeGate scraper error: {e}")

    if mode in ('donyayeserial',) or (
        mode == 'all' and os.getenv('SCRAPER_ENABLE_DONYAYESERIAL', '').lower() in ('1', 'true', 'yes')
    ):
        logger.info("\n🎬 Scraping DonyayeSerial.com...")
        try:
            donyaye = DonyayeSerialScraper()
            items = donyaye.scrape_list(pages=pages)
            logger.info(f"  Found {len(items)} items from DonyayeSerial")

            if items and api.health_check():
                series_items = [i for i in items if i.get('contentType') == 'series' or i.get('seasons')]
                movie_items = [i for i in items if i not in series_items]

                if movie_items:
                    logger.info(f"  Importing {len(movie_items)} movies...")
                    api.import_movies(movie_items)
                if series_items:
                    logger.info(f"  Importing {len(series_items)} series...")
                    api.import_series(series_items)
        except Exception as e:
            logger.error(f"  ❌ DonyayeSerial scraper error: {e}")

    logger.info("\n✅ Scraping completed!")
    logger.info("=" * 60)


if __name__ == '__main__':
    main()
