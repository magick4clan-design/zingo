"""Scheduler for automatic scraping."""
import os
import logging
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger

logger = logging.getLogger(__name__)


def create_scheduler(scraper_func, interval_hours: int = 12):
    """Create and configure the scheduler."""
    scheduler = BackgroundScheduler()
    scheduler.add_job(
        scraper_func,
        trigger=IntervalTrigger(hours=interval_hours),
        id='main_scraper',
        name='Zingo Content Scraper',
        replace_existing=True,
    )
    return scheduler


def _split_items(items):
    series_items = [item for item in items if item.get('contentType') == 'series' or item.get('seasons')]
    movie_items = [item for item in items if item not in series_items]
    return movie_items, series_items


def _import_items(api, items):
    movie_items, series_items = _split_items(items)
    if movie_items:
        api.import_movies(movie_items)
    if series_items:
        api.import_series(series_items)


def run_scheduled_scrape():
    """Main function that runs all scrapers."""
    from dotenv import load_dotenv
    load_dotenv()

    from scrapers.animegate_scraper import AnimeGateScraper
    from scrapers.animex_scraper import AnimexScraper
    from scrapers.donyayeserial_scraper import DonyayeSerialScraper
    from api_client import ZingoAPIClient

    logger.info("=" * 50)
    logger.info("Starting scheduled scrape...")
    logger.info("=" * 50)

    api = ZingoAPIClient()
    scheduled_pages = int(os.getenv('SCRAPER_SCHEDULE_PAGES', '2'))

    if not api.health_check():
        logger.error("Backend API is not reachable. Skipping scrape.")
        return

    # Scrape Animex
    try:
        animex = AnimexScraper()
        items = animex.scrape_list(pages=scheduled_pages)
        if items:
            _import_items(api, items)
    except Exception as e:
        logger.error(f"Animex scraper failed: {e}")

    # Scrape AnimeGate
    try:
        animegate = AnimeGateScraper()
        items = animegate.scrape_list(pages=scheduled_pages)
        if items:
            _import_items(api, items)
    except Exception as e:
        logger.error(f"AnimeGate scraper failed: {e}")

    # Scrape DonyayeSerial only when explicitly enabled because it is often filtered.
    if os.getenv('SCRAPER_ENABLE_DONYAYESERIAL', '').lower() not in ('1', 'true', 'yes'):
        logger.info("DonyayeSerial scraper is disabled. Set SCRAPER_ENABLE_DONYAYESERIAL=true to enable it.")
        logger.info("Scheduled scrape completed.")
        return

    try:
        donyaye = DonyayeSerialScraper()
        items = donyaye.scrape_list(pages=scheduled_pages)
        if items:
            _import_items(api, items)
    except Exception as e:
        logger.error(f"DonyayeSerial scraper failed: {e}")

    logger.info("Scheduled scrape completed.")


if __name__ == '__main__':
    load_dotenv = __import__('dotenv').load_dotenv
    load_dotenv()

    interval = int(os.getenv('SCRAPER_INTERVAL_HOURS', '12'))
    scheduler = create_scheduler(run_scheduled_scrape, interval)

    logger.info(f"Starting scheduler (interval: every {interval} hours)")
    scheduler.start()

    # Run once immediately on start
    run_scheduled_scrape()

    try:
        import time
        while True:
            time.sleep(3600)
    except (KeyboardInterrupt, SystemExit):
        scheduler.shutdown()
        logger.info("Scheduler stopped.")
