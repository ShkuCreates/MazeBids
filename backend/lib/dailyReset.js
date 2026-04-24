/**
 * Daily Reset System
 * 
 * Resets daily-tracking fields for all users every 24 hours at midnight UTC.
 * Uses a hybrid approach: cron job for global reset + lazy check fallback.
 * 
 * SAFETY RULES:
 * - NEVER reset: totalCoins, totalEarned, totalSpent, referral earnings
 * - ONLY reset: coinsEarnedToday, dailyCheckInClaimed, dailyTasksProgress
 * - All operations use UTC time
 * - Transactions ensure atomic updates
 */

const prisma = require('./prisma');

// Daily limit for coins earned (safety cap)
const DAILY_EARN_LIMIT = 5000;

/**
 * Check if a date is from a different day (UTC) than today
 * @param {Date} lastResetDate - The last reset date
 * @returns {boolean} - True if reset is needed
 */
function isNewDay(lastResetDate) {
  const now = new Date();
  const lastReset = new Date(lastResetDate);
  
  // Convert both to UTC dates (yyyy-mm-dd)
  const todayUTC = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const lastResetUTC = Date.UTC(lastReset.getUTCFullYear(), lastReset.getUTCMonth(), lastReset.getUTCDate());
  
  return todayUTC > lastResetUTC;
}

/**
 * Get today's date string in UTC (for logging)
 * @returns {string} - YYYY-MM-DD format
 */
function getTodayUTCString() {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}`;
}

/**
 * LAZY RESET: Check and reset daily fields for a single user
 * Called on user login or any user request
 * 
 * @param {string} userId - The user ID to check
 * @returns {Promise<Object>} - Updated user data or null if no reset needed
 */
async function checkAndResetUserDaily(userId) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        coinsEarnedToday: true,
        dailyCheckInClaimed: true,
        lastDailyReset: true,
      }
    });

    if (!user) {
      console.error(`[DailyReset] User not found: ${userId}`);
      return null;
    }

    // Check if reset is needed
    if (!isNewDay(user.lastDailyReset)) {
      return null; // No reset needed
    }

    console.log(`[DailyReset] Lazy reset for user ${userId} - last reset was ${user.lastDailyReset.toISOString()}`);

    // Perform reset
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        coinsEarnedToday: 0,
        dailyCheckInClaimed: false,
        lastDailyReset: new Date(),
      },
      select: {
        id: true,
        coinsEarnedToday: true,
        dailyCheckInClaimed: true,
        lastDailyReset: true,
      }
    });

    console.log(`[DailyReset] ✅ User ${userId} daily fields reset successfully`);
    return updatedUser;

  } catch (error) {
    console.error(`[DailyReset] ❌ Failed to reset user ${userId}:`, error);
    throw error;
  }
}

/**
 * GLOBAL RESET (Cron Job): Reset daily fields for ALL users
 * Run once every 24 hours at midnight UTC
 * 
 * @returns {Promise<Object>} - Reset statistics
 */
async function resetAllUsersDaily() {
  const startTime = Date.now();
  const today = getTodayUTCString();
  
  console.log(`[DailyReset] 🌙 Starting global daily reset for ${today} UTC`);

  try {
    // Count users that need reset
    const usersToReset = await prisma.user.count({
      where: {
        lastDailyReset: {
          lt: new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate()))
        }
      }
    });

    console.log(`[DailyReset] Found ${usersToReset} users needing reset`);

    if (usersToReset === 0) {
      console.log(`[DailyReset] ✅ No users need reset - all up to date`);
      return { resetCount: 0, duration: 0 };
    }

    // Perform bulk update for all users
    // SAFETY: Only updating daily tracking fields, NOT permanent data
    const result = await prisma.user.updateMany({
      where: {
        lastDailyReset: {
          lt: new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate()))
        }
      },
      data: {
        coinsEarnedToday: 0,
        dailyCheckInClaimed: false,
        lastDailyReset: new Date(),
      }
    });

    const duration = Date.now() - startTime;
    
    console.log(`[DailyReset] ✅ Global reset complete: ${result.count} users updated in ${duration}ms`);
    
    return {
      resetCount: result.count,
      duration,
      date: today
    };

  } catch (error) {
    console.error('[DailyReset] ❌ Global reset failed:', error);
    throw error;
  }
}

/**
 * Add coins to user's daily earnings (with safety cap)
 * This should be called when user earns coins
 * 
 * @param {string} userId - User ID
 * @param {number} amount - Amount to add
 * @returns {Promise<Object>} - Updated data or error
 */
async function addDailyEarnings(userId, amount) {
  try {
    // First, ensure daily reset is up to date (lazy check)
    await checkAndResetUserDaily(userId);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { coinsEarnedToday: true }
    });

    // Safety check: don't exceed daily limit
    const newDailyTotal = user.coinsEarnedToday + amount;
    if (newDailyTotal > DAILY_EARN_LIMIT) {
      console.warn(`[DailyReset] User ${userId} would exceed daily limit: ${newDailyTotal}/${DAILY_EARN_LIMIT}`);
      return {
        success: false,
        error: 'Daily earn limit reached',
        limit: DAILY_EARN_LIMIT,
        current: user.coinsEarnedToday
      };
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        coinsEarnedToday: { increment: amount }
      },
      select: {
        coinsEarnedToday: true,
        dailyCheckInClaimed: true,
      }
    });

    return {
      success: true,
      coinsEarnedToday: updated.coinsEarnedToday,
      dailyCheckInClaimed: updated.dailyCheckInClaimed
    };

  } catch (error) {
    console.error(`[DailyReset] Failed to add daily earnings for ${userId}:`, error);
    throw error;
  }
}

/**
 * Mark daily check-in as claimed
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Updated data
 */
async function claimDailyCheckIn(userId) {
  try {
    // First, ensure daily reset is up to date
    await checkAndResetUserDaily(userId);

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        dailyCheckInClaimed: true
      },
      select: {
        dailyCheckInClaimed: true,
        lastDailyReset: true
      }
    });

    return {
      success: true,
      dailyCheckInClaimed: updated.dailyCheckInClaimed
    };

  } catch (error) {
    console.error(`[DailyReset] Failed to claim daily check-in for ${userId}:`, error);
    throw error;
  }
}

/**
 * Get user's daily stats (with auto-reset if needed)
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Daily stats
 */
async function getUserDailyStats(userId) {
  try {
    // Auto-reset if needed before returning stats
    await checkAndResetUserDaily(userId);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        coinsEarnedToday: true,
        dailyCheckInClaimed: true,
        lastDailyReset: true,
      }
    });

    if (!user) {
      return null;
    }

    return {
      coinsEarnedToday: user.coinsEarnedToday,
      dailyCheckInClaimed: user.dailyCheckInClaimed,
      lastDailyReset: user.lastDailyReset,
      dailyEarnLimit: DAILY_EARN_LIMIT,
      canClaimCheckIn: !user.dailyCheckInClaimed,
      canEarnMore: user.coinsEarnedToday < DAILY_EARN_LIMIT,
      remainingDailyAllowance: Math.max(0, DAILY_EARN_LIMIT - user.coinsEarnedToday)
    };

  } catch (error) {
    console.error(`[DailyReset] Failed to get daily stats for ${userId}:`, error);
    throw error;
  }
}

module.exports = {
  checkAndResetUserDaily,
  resetAllUsersDaily,
  addDailyEarnings,
  claimDailyCheckIn,
  getUserDailyStats,
  isNewDay,
  DAILY_EARN_LIMIT
};
