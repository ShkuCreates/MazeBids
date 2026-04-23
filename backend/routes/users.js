const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { sendNotificationStatusUpdate } = require('../lib/discordBotSingleton');
const { createNotification } = require('../lib/notificationHelper');

// Simple in-memory cache for frequently accessed data
const profileCache = new Map();
const CACHE_TTL = 30000; // 30 seconds

// Get user profile (optimized with caching)
router.get('/profile', async (req, res) => {
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
  
  const cacheKey = `profile-${req.user.id}`;
  const cached = profileCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return res.json(cached.data);
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { 
        id: true, 
        username: true, 
        email: true, 
        avatar: true, 
        totalEarned: true, 
        totalSpent: true,
        notifications: true,
        createdAt: true,
        discordId: true,
        coins: true
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

    const profileData = { ...user, wonAuctions, auctionsWonCount: wonAuctions.length };
    
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

      // Create redemption and update user coins
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
        }),
        prisma.user.update({
          where: { id: req.user.id },
          data: { 
            coins: { increment: bonusCode.reward },
            totalEarned: { increment: bonusCode.reward }
          }
        }),
        prisma.transaction.create({
          data: {
            userId: req.user.id,
            amount: bonusCode.reward,
            type: 'EARN',
            description: `Bonus code: ${code.toUpperCase()}`
          }
        })
      ]);

      // Clear cache
      const cacheKey = `profile-${req.user.id}`;
      profileCache.delete(cacheKey);

      console.log('Redemption successful!');

      // Notify user of reward
      await createNotification(req.user.id, 'REWARD', `+${bonusCode.reward} coins from bonus code: ${code.toUpperCase()}`, { amount: bonusCode.reward });

      res.json({ 
        message: `Successfully redeemed! You earned ${bonusCode.reward} coins!`,
        reward: bonusCode.reward
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

// Get user transactions (paginated)
router.get('/transactions', async (req, res) => {
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
  try {
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;

    const transactions = await prisma.transaction.findMany({
      where: { userId: req.user.id },
      orderBy: { timestamp: 'desc' },
      take: limit,
      skip: offset,
    });

    // Calculate daily earned for progress bar
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const dailyEarned = await prisma.transaction.aggregate({
      where: {
        userId: req.user.id,
        type: 'EARN',
        timestamp: { gte: startOfDay },
      },
      _sum: { amount: true },
    });

    res.json({
      transactions,
      dailyEarned: dailyEarned._sum.amount || 0,
      dailyLimit: 5000,
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

module.exports = router;
