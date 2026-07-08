import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { syncFromHostinnegar } from './services/hostinnegarSync';
import { config } from './config';

const prisma = new PrismaClient();

const CRON_EVERY_6_HOURS = '0 */6 * * *';

console.log(`\n⏰ Scheduler initialized`);
console.log(`   Cron: ${CRON_EVERY_6_HOURS} (every 6 hours)`);

setTimeout(async () => {
  console.log('\n🔄 Running initial sync from hostinnegar.com...');
  try {
    await syncFromHostinnegar(prisma);
  } catch (err: any) {
    console.error('Initial sync failed:', err.message);
  }
}, 5000);

cron.schedule(CRON_EVERY_6_HOURS, async () => {
  console.log(`\n⏰ Scheduled sync at ${new Date().toISOString()}`);
  try {
    await syncFromHostinnegar(prisma);
  } catch (err: any) {
    console.error('Scheduled sync failed:', err.message);
  }
});

console.log('   Waiting 5 seconds before first run...\n');
