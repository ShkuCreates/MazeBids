/**
 * Cron Job Scheduler
 * 
 * Manages scheduled background tasks:
 * 1. Daily reset at midnight UTC
 * 2. Other periodic maintenance tasks
 */

const { resetAllUsersDaily } = require('./dailyReset');

// Simple cron implementation using setTimeout
// For production, consider using node-cron package

let dailyResetJob = null;
let isRunning = false;

/**
 * Calculate milliseconds until next midnight UTC
 * @returns {number} - Milliseconds until midnight
 */
function getMsUntilMidnightUTC() {
  const now = new Date();
  const midnight = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1, // Next day
    0, 0, 0 // 00:00:00
  ));
  return midnight.getTime() - now.getTime();
}

/**
 * Run the daily reset job
 */
async function runDailyReset() {
  if (isRunning) {
    console.log('[Cron] Daily reset already running, skipping...');
    return;
  }

  isRunning = true;
  console.log('[Cron] ⏰ Running scheduled daily reset...');

  try {
    const result = await resetAllUsersDaily();
    console.log(`[Cron] ✅ Daily reset complete: ${result.resetCount} users reset`);
  } catch (error) {
    console.error('[Cron] ❌ Daily reset failed:', error);
    // In production, you might want to send alerts here
  } finally {
    isRunning = false;
    // Schedule next run
    scheduleDailyReset();
  }
}

/**
 * Schedule the next daily reset
 */
function scheduleDailyReset() {
  // Clear any existing job
  if (dailyResetJob) {
    clearTimeout(dailyResetJob);
  }

  const msUntilMidnight = getMsUntilMidnightUTC();
  const hoursUntil = Math.floor(msUntilMidnight / (1000 * 60 * 60));
  const minutesUntil = Math.floor((msUntilMidnight % (1000 * 60 * 60)) / (1000 * 60));

  console.log(`[Cron] 🌙 Scheduled daily reset in ${hoursUntil}h ${minutesUntil}m (midnight UTC)`);

  dailyResetJob = setTimeout(runDailyReset, msUntilMidnight);
}

/**
 * Initialize all cron jobs
 */
function initCronJobs() {
  console.log('[Cron] 🚀 Initializing cron jobs...');
  
  // Schedule daily reset
  scheduleDailyReset();

  // Optional: Run reset immediately on startup (for testing or if server was down)
  // Uncomment the line below if you want to check/reset on startup
  // runDailyReset();

  console.log('[Cron] ✅ Cron jobs initialized');
}

/**
 * Stop all cron jobs (for graceful shutdown)
 */
function stopCronJobs() {
  console.log('[Cron] 🛑 Stopping cron jobs...');
  
  if (dailyResetJob) {
    clearTimeout(dailyResetJob);
    dailyResetJob = null;
  }

  console.log('[Cron] ✅ Cron jobs stopped');
}

/**
 * Manually trigger daily reset (for admin/debugging)
 */
async function manualDailyReset() {
  console.log('[Cron] 🔄 Manual daily reset triggered');
  return await runDailyReset();
}

module.exports = {
  initCronJobs,
  stopCronJobs,
  manualDailyReset,
  runDailyReset
};
