import 'dotenv/config';
import cron from 'node-cron';
import { runDailyDigest } from './scheduler/daily-digest.js';

const schedule = process.env.DIGEST_SCHEDULE || '35 8 * * 1-5'; // Default: Mon-Fri 8:35am

console.log('🤖 Smol News Agent starting...');
console.log(`📅 Scheduled for: ${schedule}`);
console.log('━'.repeat(50));

// Schedule the daily digest
cron.schedule(schedule, async () => {
  console.log(`\n⏰ Triggered at ${new Date().toLocaleString()}`);
  try {
    await runDailyDigest();
  } catch (error) {
    console.error('Failed to run digest:', error);
  }
}, {
  timezone: 'America/Los_Angeles', // Adjust to your timezone
});

console.log('✓ Agent is running. Press Ctrl+C to stop.');

// Keep the process alive
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down...');
  process.exit(0);
});
