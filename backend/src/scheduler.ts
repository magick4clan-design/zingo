import cron from 'node-cron';
import { runScraper } from './scrapers/ingestor';
import { config } from './config';

const CRON_EVERY_12_HOURS = '0 */12 * * *';
const CRON_EVERY_6_HOURS = '0 */6 * * *';

const intervalHours = config.scraper.intervalHours || 12;
const cronExpression = intervalHours <= 6 ? CRON_EVERY_6_HOURS : CRON_EVERY_12_HOURS;

console.log(`\n⏰ Scheduler initialized`);
console.log(`   Cron expression: ${cronExpression}`);
console.log(`   Interval: every ${intervalHours} hours`);

// Run immediately on startup (with a short delay to let the server start)
setTimeout(async () => {
  console.log('\n🔄 Running initial scrape...');
  try {
    await runScraper();
  } catch (err: any) {
    console.error('Initial scrape failed:', err.message);
  }
}, 5000);

// Schedule recurring scrapes
cron.schedule(cronExpression, async () => {
  console.log(`\n⏰ Scheduled scrape triggered at ${new Date().toISOString()}`);
  try {
    await runScraper();
  } catch (err: any) {
    console.error('Scheduled scrape failed:', err.message);
  }
});

console.log('   Waiting 5 seconds before first run...\n');
