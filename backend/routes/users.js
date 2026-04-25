const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { sendNotificationStatusUpdate } = require('../lib/discordBotSingleton');
const { createNotification } = require('../lib/notificationHelper');
const { checkAndResetUserDaily, getUserDailyStats, manualDailyReset } = require('../lib/dailyReset');
const { getUserAchievements, checkAndUnlockAchievements, getUserActivity } = require('../lib/achievementHelper');
const { updateUserCoins } = require('../lib/coinHelper');

// Admin IDs from environment
const ADMIN_IDS = process.env.ADMIN_IDS ? process.env.ADMIN_IDS.split(',').map(id => id.trim()) : [];

// Simple in-memory cache for frequently accessed data
const profileCache = require('../lib/profileCache');
const CACHE_TTL = 5000; // 5 seconds

// Get user profile (optimized with caching + lazy daily reset check)
router.get('/profile', async (req, res) => {
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

  // Prevent caching of user-specific data
  res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');

  const cacheKey = `profile-${req.user.id}`;
  const cached = profileCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return res.json(cached.data);
  }

  try {
    // LAZY RESET: Check and reset daily fields if needed
    await checkAndResetUserDaily(req.user.id);

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        username: true,
        avatar: true,
        totalEarned: true,
        totalSpent: true,
        notifications: true,
        createdAt: true,
        discordId: true,
        coins: true,
        referralCode: true,
        referredById: true,
        // Daily tracking fields (auto-reset if new day)
        coinsEarnedToday: true,
        dailyCheckInClaimed: true,
        lastDailyReset: true
      }
    });

    if (!user) return res.status(404).json({ message: 'User not found' });

    const wonAuctions = await prisma.auction.findMany({
      where: { highestBidderId: user.id, status: 'ENDED' },
      select: {
        id: true,
        title: true,
        image: true,
        currentBid: true,
        status: true,
        endTime: true
      },
      orderBy: { endTime: 'desc' },
      take: 10
    });

    // Calculate daily stats
    const dailyEarnLimit = 5000;
    const dailyStats = {
      coinsEarnedToday: user.coinsEarnedToday,
      dailyCheckInClaimed: user.dailyCheckInClaimed,
      dailyEarnLimit,
      canClaimCheckIn: !user.dailyCheckInClaimed,
      canEarnMore: user.coinsEarnedToday < dailyEarnLimit,
      remainingDailyAllowance: Math.max(0, dailyEarnLimit - user.coinsEarnedToday)
    };

    const profileData = {
      ...user,
      wonAuctions,
      auctionsWonCount: wonAuctions.length,
      dailyStats
    };

    profileCache.set(cacheKey, { data: profileData, timestamp: Date.now() });

    res.json(profileData);
  } catch (err) {
    console.error('Profile fetch error:', err);
    res.status(500).json({ message: 'Failed to fetch profile' });
  }
});

// Update user profile
router.put('/profile', async (req, res) => {
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
  try {
    const { username, avatar } = req.body;
    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: { username, avatar }
    });
    
    // Clear cache
    const cacheKey = `profile-${req.user.id}`;
    profileCache.delete(cacheKey);
    
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update profile' });
  }
});

// Toggle notifications
router.post('/toggle-notifications', async (req, res) => {
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { notifications: true, discordId: true }
    });

    if (!user) return res.status(404).json({ message: 'User not found' });

    const newNotificationStatus = !user.notifications;
    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: { notifications: newNotificationStatus }
    });

    // Clear cache
    const cacheKey = `profile-${req.user.id}`;
    profileCache.delete(cacheKey);

    // Send Discord DM notification
    if (user.discordId) {
      try {
        await sendNotificationStatusUpdate(user.discordId, newNotificationStatus);
      } catch (dmError) {
        console.error('Failed to send notification DM:', dmError);
        // Don't fail the request if DM fails
      }
    }

    res.json({ notifications: updated.notifications });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update notification settings' });
  }
});

// Redeem bonus code
router.post('/redeem-code', async (req, res) => {
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
  try {
    const { code } = req.body;
    
    console.log('[Redeem] Redeem request:', { userId: req.user.id, code: code.toUpperCase() });
    
    if (!code) {
      return res.status(400).json({ message: 'Code is required' });
    }

    console.log('Attempting to redeem code:', code.toUpperCase());
    console.log('User ID:', req.user.id);

    // Check if BonusCode table exists by trying to query it
    try {
      const bonusCode = await prisma.bonusCode.findUnique({
        where: { code: code.toUpperCase() }
      });
      
      console.log('Bonus code found:', bonusCode);

      if (!bonusCode) {
        console.log('Bonus code not found');
        return res.status(404).json({ message: 'Invalid bonus code' });
      }

      if (bonusCode.usedCount >= bonusCode.maxUses) {
        console.log('Code fully used');
        return res.status(400).json({ message: 'This code has been fully used' });
      }

      // Check if user already redeemed this code
      const existingRedemption = await prisma.redemption.findUnique({
        where: {
          userId_bonusCodeId: {
            userId: req.user.id,
            bonusCodeId: bonusCode.id
          }
        }
      });

      if (existingRedemption) {
        console.log('User already redeemed this code');
        return res.status(400).json({ message: 'You have already redeemed this code' });
      }

      console.log('Proceeding with redemption...');

      // Create redemption and update bonus code usage
      await prisma.$transaction([
        prisma.redemption.create({
          data: {
            userId: req.user.id,
            bonusCodeId: bonusCode.id
          }
        }),
        prisma.bonusCode.update({
          where: { id: bonusCode.id },
          data: { usedCount: { increment: 1 } }
        })
      ]);

      // Update coins using centralized function
      const coinResult = await updateUserCoins(req.user.id, bonusCode.reward, `Bonus code: ${code.toUpperCase()}`);

      if (!coinResult.success) {
        console.error('[Redeem] Coin update failed:', coinResult.error);
        return res.status(500).json({ message: 'Failed to process reward' });
      }

      // Clear profile cache
      const cacheKey = `profile-${req.user.id}`;
      profileCache.delete(cacheKey);

      console.log('Redemption successful!');

      console.log('[Redeem] Code redeemed successfully:', { userId: req.user.id, reward: bonusCode.reward, newBalance: coinResult.newBalance });

      // Notify user of reward
      await createNotification(req.user.id, 'REWARD', `+${bonusCode.reward} coins from bonus code: ${code.toUpperCase()}`, { amount: bonusCode.reward });

      res.json({ 
        message: `Successfully redeemed! You earned ${bonusCode.reward} coins!`,
        reward: bonusCode.reward,
        coins: coinResult.newBalance
      });
    } catch (tableError) {
      console.error('Table access error:', tableError);
      // If table doesn't exist, we need to run migrations
      if (tableError.message.includes('does not exist') || tableError.message.includes('no such table')) {
        return res.status(500).json({ 
          message: 'Bonus codes table not found. Please run database migrations.' 
        });
      }
      throw tableError;
    }
  } catch (err) {
    console.error('Redeem code error:', err);
    res.status(500).json({ message: 'Failed to redeem code' });
  }
});

// Redeem a referral code from another user
router.post('/redeem-referral', async (req, res) => {
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
  
  const { code } = req.body;
  if (!code) return res.status(400).json({ message: 'Referral code is required' });

  try {
    // Cannot redeem your own referral code
    if (req.user.referralCode === code.toUpperCase()) {
      return res.status(400).json({ message: 'You cannot redeem your own referral code' });
    }

    // Check if user already used a referral code
    if (req.user.referredById) {
      return res.status(400).json({ message: 'You have already used a referral code' });
    }

    // Find the referrer
    const referrer = await prisma.user.findUnique({
      where: { referralCode: code.toUpperCase() }
    });

    if (!referrer) {
      return res.status(404).json({ message: 'Invalid referral code' });
    }

    const REFERRAL_REWARD = 100; // coins for both users

    // Update the referred user - set referredById and give coins
    await prisma.user.update({
      where: { id: req.user.id },
      data: { referredById: referrer.id }
    });

    // Give coins to the person redeeming
    const coinResult = await updateUserCoins(req.user.id, REFERRAL_REWARD, `Referral bonus: used code ${code.toUpperCase()}`);

    // Give coins to the referrer
    await updateUserCoins(referrer.id, REFERRAL_REWARD, `Referral bonus: ${req.user.username} used your code`);

    // Check if referrer has reached 5 referrals and give bonus
    const referrerUpdated = await prisma.user.findUnique({
      where: { id: referrer.id },
      select: { id: true, referralCount: true }
    });
    const newCount = (referrerUpdated.referralCount || 0) + 1;
    await prisma.user.update({
      where: { id: referrer.id },
      data: { referralCount: newCount }
    });
    if (newCount >= 5 && newCount % 5 === 0) {
      await updateUserCoins(referrer.id, 500, 'Referral milestone bonus: 5 referrals');
      await createNotification(referrer.id, 'REFERRAL_BONUS', 'You reached 5 referrals! +500 coins bonus!', { amount: 500 });
    }

    // Clear profile cache
    const cacheKey = `profile-${req.user.id}`;
    profileCache.delete(cacheKey);
    profileCache.delete(`profile-${referrer.id}`);

    // Create notifications
    try {
      await createNotification(req.user.id, 'REWARD', `+${REFERRAL_REWARD} coins for using referral code!`, { amount: REFERRAL_REWARD });
      await createNotification(referrer.id, 'REWARD', `+${REFERRAL_REWARD} coins! ${req.user.username} used your referral code!`, { amount: REFERRAL_REWARD });
    } catch (err) {
      console.error('Referral notification error:', err.message);
    }

    res.json({
      message: `Referral code redeemed! +${REFERRAL_REWARD} coins added!`,
      reward: REFERRAL_REWARD,
      coins: coinResult.newBalance
    });

  } catch (err) {
    console.error('[Referral] Redeem error:', err);
    res.status(500).json({ message: 'Failed to redeem referral code' });
  }
});

// Get user transactions (paginated) with lazy daily reset check
router.get('/transactions', async (req, res) => {
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
  try {
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;

    // LAZY RESET: Check and reset daily fields if needed
    await checkAndResetUserDaily(req.user.id);

    const transactions = await prisma.transaction.findMany({
      where: { userId: req.user.id },
      orderBy: { timestamp: 'desc' },
      take: limit,
      skip: offset,
    });

    // Get current daily stats (already reset if needed)
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        coinsEarnedToday: true,
        dailyCheckInClaimed: true
      }
    });

    res.json({
      transactions,
      dailyEarned: user?.coinsEarnedToday || 0,
      dailyLimit: 5000,
      dailyCheckInClaimed: user?.dailyCheckInClaimed || false
    });
  } catch (err) {
    console.error('Transactions fetch error:', err);
    res.status(500).json({ message: 'Failed to fetch transactions' });
  }
});

// Site stats endpoint (cached for 60 seconds)
const siteStatsCache = { data: null, timestamp: 0 };
const STATS_CACHE_TTL = 60000;

router.get('/site-stats', async (req, res) => {
  try {
    const now = Date.now();
    if (siteStatsCache.data && now - siteStatsCache.timestamp < STATS_CACHE_TTL) {
      return res.json(siteStatsCache.data);
    }
    
    const [userCount, auctionCount, stats] = await Promise.all([
      prisma.user.count(),
      prisma.auction.count(),
      prisma.user.aggregate({
        _sum: {
          totalEarned: true,
          totalSpent: true
        }
      })
    ]);

    const siteStats = {
      registeredUsers: userCount + 2847,
      auctionsHeld: auctionCount + 156,
      totalEarned: (stats._sum.totalEarned || 0) + 1247500,
      totalSpent: (stats._sum.totalSpent || 0) + 893200
    };

    siteStatsCache.data = siteStats;
    siteStatsCache.timestamp = now;
    
    res.json(siteStats);
  } catch (err) {
    console.error('Site stats error:', err);
    res.status(500).json({ message: 'Failed to fetch stats' });
  }
});

// Get user's daily stats (with auto-reset if needed)
router.get('/daily-stats', async (req, res) => {
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const dailyStats = await getUserDailyStats(req.user.id);

    if (!dailyStats) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(dailyStats);
  } catch (err) {
    console.error('Daily stats fetch error:', err);
    res.status(500).json({ message: 'Failed to fetch daily stats' });
  }
});

// GET /daily-progress - Get daily progress for Earn page (NO AUTO-RESET)
router.get('/daily-progress', async (req, res) => {
  // Prevent caching of user-specific data
  res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');

  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

  try {
    // Get user stats WITHOUT auto-reset to prevent progress loss on refresh
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        coinsEarnedToday: true,
        dailyCheckInClaimed: true,
        lastDailyReset: true,
        coins: true
      }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if it's actually a new day before resetting
    const now = new Date();
    const todayUTC = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
    const lastResetUTC = Date.UTC(user.lastDailyReset.getUTCFullYear(), user.lastDailyReset.getUTCMonth(), user.lastDailyReset.getUTCDate());

    const isActuallyNewDay = todayUTC > lastResetUTC;

    // Only reset if it's genuinely a new day
    if (isActuallyNewDay) {
      await prisma.user.update({
        where: { id: req.user.id },
        data: {
          coinsEarnedToday: 0,
          dailyCheckInClaimed: false,
          lastDailyReset: new Date()
        }
      });
      user.coinsEarnedToday = 0;
      user.dailyCheckInClaimed = false;
    }

    // Return stats
    res.json({
      earned: user.coinsEarnedToday || 0,
      claimed: user.dailyCheckInClaimed || false,
      canClaimCheckIn: !user.dailyCheckInClaimed,
      streak: 1, // Fixed value since no streak field in DB
      dailyLimit: 5000,
      remainingAllowance: Math.max(0, 5000 - (user.coinsEarnedToday || 0))
    });
  } catch (err) {
    console.error('Daily progress fetch error:', err);
    res.status(500).json({ message: 'Failed to fetch daily progress' });
  }
});

// POST /daily-claim - Claim daily check-in reward
router.post('/daily-claim', async (req, res) => {
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

  console.log('[Daily] Claim request:', { userId: req.user.id });

  try {
    // First, ensure daily reset is up to date and check if already claimed
    const dailyStats = await getUserDailyStats(req.user.id);
    
    if (!dailyStats) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if already claimed today
    if (dailyStats.dailyCheckInClaimed) {
      return res.status(400).json({ 
        message: 'Daily reward already claimed. Come back tomorrow!',
        alreadyClaimed: true,
        nextClaimIn: 'Tomorrow'
      });
    }

    // Calculate reward - always day 1 reward since streak field doesn't exist in DB
    const getDailyReward = (day) => {
      const rewards = [50, 75, 100, 125, 150, 175, 500];
      return rewards[day - 1] || 50;
    };

    // Get user's current coins
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { 
        coins: true,
        dailyCheckInClaimed: true
      }
    });

    // Use fixed streak of 1 (no streak field in DB yet)
    const currentStreak = 1;
    const reward = getDailyReward(currentStreak);

    // Mark daily check-in as claimed
    await prisma.user.update({
      where: { id: req.user.id },
      data: {
        dailyCheckInClaimed: true
      }
    });

    // Update coins using centralized function
    const coinResult = await updateUserCoins(req.user.id, reward, `Daily check-in reward (Day ${currentStreak})`);

    if (!coinResult.success) {
      console.error('[DailyClaim] Coin update failed:', coinResult.error);
      return res.status(500).json({ message: 'Failed to process reward' });
    }

    // Clear profile cache
    const cacheKey = `profile-${req.user.id}`;
    profileCache.delete(cacheKey);

    console.log(`[DailyClaim] User ${req.user.id} claimed ${reward} coins (Day ${currentStreak}), new balance: ${coinResult.newBalance}`);

    res.json({
      success: true,
      message: `Daily reward claimed! +${reward} coins!`,
      reward: reward,
      coins: coinResult.newBalance,
      streak: 1, // Fixed value since no streak field in DB
      dailyCheckInClaimed: true,
      coinsEarnedToday: coinResult.user.coinsEarnedToday
    });

  } catch (err) {
    console.error('Daily claim error:', err);
    res.status(500).json({ message: 'Failed to claim daily reward' });
  }
});

// Manual daily reset trigger (ADMIN ONLY - for testing/debugging)
router.post('/admin/trigger-daily-reset', async (req, res) => {
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
  if (req.user.role !== 'ADMIN') return res.status(403).json({ message: 'Admin access required' });

  try {
    console.log(`[Admin] Manual daily reset triggered by ${req.user.username}`);
    const result = await manualDailyReset();

    res.json({
      message: 'Daily reset completed successfully',
      result
    });
  } catch (err) {
    console.error('Manual daily reset error:', err);
    res.status(500).json({ message: 'Failed to trigger daily reset' });
  }
});

// Get daily reset status (ADMIN ONLY)
router.get('/admin/daily-reset-status', async (req, res) => {
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
  if (req.user.role !== 'ADMIN') return res.status(403).json({ message: 'Admin access required' });

  try {
    const now = new Date();
    const todayUTC = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());

    // Count users that need reset (last reset was before today)
    const usersNeedingReset = await prisma.user.count({
      where: {
        lastDailyReset: {
          lt: new Date(todayUTC)
        }
      }
    });

    const totalUsers = await prisma.user.count();

    res.json({
      currentTimeUTC: now.toISOString(),
      todayUTC: new Date(todayUTC).toISOString(),
      totalUsers,
      usersNeedingReset,
      usersUpToDate: totalUsers - usersNeedingReset,
      nextResetInMs: new Date(todayUTC + 24 * 60 * 60 * 1000).getTime() - now.getTime()
    });
  } catch (err) {
    console.error('Daily reset status error:', err);
    res.status(500).json({ message: 'Failed to fetch reset status' });
  }
});

// Get user achievements
router.get('/achievements', async (req, res) => {
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

  try {
    // Check and unlock any newly earned achievements
    await checkAndUnlockAchievements(req.user.id);

    // Get all achievements with progress
    const achievements = await getUserAchievements(req.user.id);

    res.json({ achievements });
  } catch (err) {
    console.error('Achievements fetch error:', err);
    res.status(500).json({ message: 'Failed to fetch achievements' });
  }
});

// Get user activity feed
router.get('/activity', async (req, res) => {
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const limit = parseInt(req.query.limit) || 20;
    const activities = await getUserActivity(req.user.id, limit);

    res.json({ activities });
  } catch (err) {
    console.error('Activity fetch error:', err);
    res.status(500).json({ message: 'Failed to fetch activity' });
  }
});

// SECRET ADMIN: Reset current user's coins to 0 (for testing only)
router.post('/admin/reset-my-coins', async (req, res) => {
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
  
  // Check if user's Discord ID is in ADMIN_IDS
  if (!ADMIN_IDS.includes(req.user.discordId)) {
    return res.status(403).json({ message: 'Forbidden - Admin only' });
  }

  try {
    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        coins: 0,
        totalEarned: 0,
        coinsEarnedToday: 0,
        dailyCheckInClaimed: false
      },
      select: {
        id: true,
        coins: true,
        totalEarned: true,
        dailyCheckInClaimed: true
      }
    });

    // Clear profile cache
    const cacheKey = `profile-${req.user.id}`;
    profileCache.delete(cacheKey);

    console.log(`[Admin] User ${req.user.id} reset their coins to 0`);

    res.json({
      success: true,
      message: 'Coins reset to 0 successfully',
      coins: updatedUser.coins,
      totalEarned: updatedUser.totalEarned
    });
  } catch (err) {
    console.error('Reset coins error:', err);
    res.status(500).json({ message: 'Failed to reset coins' });
  }
});

module.exports = router;
