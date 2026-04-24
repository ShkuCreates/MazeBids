/**
 * Coin Helper - Centralized Coin Management
 * 
 * SINGLE SOURCE OF TRUTH for all coin operations
 * All coin updates MUST go through this function
 * 
 * Features:
 * - Atomic transactions to prevent race conditions
 * - Consistent tracking of coins, totalEarned, totalSpent, coinsEarnedToday
 * - Automatic transaction record creation
 * - Returns updated balance
 */

const { prisma } = require('./prisma');
const { checkAndResetUserDaily } = require('./dailyReset');

/**
 * Update user coins - CENTRALIZED FUNCTION
 * 
 * @param {string} userId - User ID
 * @param {number} amount - Amount to add (positive) or subtract (negative)
 * @param {string} source - Source description (e.g., 'game', 'ad', 'daily-reward', 'bid')
 * @param {Object} options - Optional parameters
 * @param {boolean} options.skipDailyTracking - Skip coinsEarnedToday update (default: false)
 * @param {boolean} options.skipTransaction - Skip transaction record creation (default: false)
 * @returns {Promise<Object>} - { success: boolean, newBalance: number, error?: string }
 */
async function updateUserCoins(userId, amount, source, options = {}) {
  const { skipDailyTracking = false, skipTransaction = false } = options;

  // Validate inputs
  if (!userId) {
    return { success: false, error: 'User ID is required' };
  }
  if (typeof amount !== 'number' || isNaN(amount)) {
    return { success: false, error: 'Amount must be a number' };
  }
  if (amount === 0) {
    return { success: false, error: 'Amount cannot be zero' };
  }
  if (!source) {
    return { success: false, error: 'Source is required' };
  }

  try {
    // For earning (positive amount), ensure daily reset is up to date
    if (amount > 0 && !skipDailyTracking) {
      await checkAndResetUserDaily(userId);
    }

    // Determine transaction type
    const transactionType = amount > 0 ? 'EARN' : 'SPEND';
    const absoluteAmount = Math.abs(amount);

    // Prepare user update data
    const userData = {
      coins: amount > 0 ? { increment: absoluteAmount } : { decrement: absoluteAmount }
    };

    // Update totalEarned for earnings
    if (amount > 0) {
      userData.totalEarned = { increment: absoluteAmount };
    }

    // Update totalSpent for spending
    if (amount < 0) {
      userData.totalSpent = { increment: absoluteAmount };
    }

    // Update coinsEarnedToday for earnings (unless skipped)
    if (amount > 0 && !skipDailyTracking) {
      userData.coinsEarnedToday = { increment: absoluteAmount };
    }

    // Execute transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update user coins
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: userData,
        select: {
          id: true,
          coins: true,
          totalEarned: true,
          totalSpent: true,
          coinsEarnedToday: true
        }
      });

      // Create transaction record (unless skipped)
      if (!skipTransaction) {
        await tx.transaction.create({
          data: {
            userId,
            amount: absoluteAmount,
            type: transactionType,
            description: source
          }
        });
      }

      return updatedUser;
    });

    console.log(`[CoinHelper] ✅ Updated ${userId}: ${amount > 0 ? '+' : ''}${amount} coins (${source}), new balance: ${result.coins}`);

    return {
      success: true,
      newBalance: result.coins,
      user: result
    };

  } catch (error) {
    console.error(`[CoinHelper] ❌ Failed to update coins for ${userId}:`, error);

    // Handle specific errors
    if (error.code === 'P2025') {
      return { success: false, error: 'User not found' };
    }
    if (error.code === 'P2034') {
      return { success: false, error: 'Transaction conflict - please try again' };
    }

    return { success: false, error: error.message };
  }
}

/**
 * Get user's current coin balance
 * 
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - { coins: number, totalEarned: number, totalSpent: number }
 */
async function getUserBalance(userId) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        coins: true,
        totalEarned: true,
        totalSpent: true,
        coinsEarnedToday: true
      }
    });

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    return {
      success: true,
      ...user
    };
  } catch (error) {
    console.error(`[CoinHelper] Failed to get balance for ${userId}:`, error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  updateUserCoins,
  getUserBalance
};
