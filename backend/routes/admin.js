/**
 * Admin API Routes
 * 
 * Provides admin panel with real data and management functions.
 * All routes require ADMIN role.
 */

const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { sendDirectMessage } = require('../lib/discordBotSingleton');
const { updateUserCoins } = require('../lib/coinHelper');

// Middleware to check admin role
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

// Apply admin check to all routes
router.use(requireAdmin);

/**
 * GET /api/admin/dashboard-stats
 * Get real dashboard statistics
 */
router.get('/dashboard-stats', async (req, res) => {
  try {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Get all stats in parallel
    const [
      totalUsers,
      activeUsers,
      totalCoins,
      totalEarned,
      totalSpent,
      activeAuctions,
      endedAuctions,
      todayBids,
      weekBids,
      todayTransactions,
      recentUsers,
      recentBids
    ] = await Promise.all([
      // Total users
      prisma.user.count(),

      // Active users (logged in within last 24 hours)
      prisma.user.count({
        where: {
          updatedAt: {
            gte: new Date(now.getTime() - 24 * 60 * 60 * 1000)
          }
        }
      }),

      // Total coins in circulation
      prisma.user.aggregate({
        _sum: { coins: true }
      }),

      // Total earned
      prisma.user.aggregate({
        _sum: { totalEarned: true }
      }),

      // Total spent
      prisma.user.aggregate({
        _sum: { totalSpent: true }
      }),

      // Active auctions
      prisma.auction.count({
        where: { status: 'ACTIVE' }
      }),

      // Ended auctions
      prisma.auction.count({
        where: { status: 'ENDED' }
      }),

      // Today's bids
      prisma.bid.count({
        where: {
          timestamp: { gte: startOfDay }
        }
      }),

      // Week's bids
      prisma.bid.count({
        where: {
          timestamp: { gte: startOfWeek }
        }
      }),

      // Today's transactions
      prisma.transaction.findMany({
        where: {
          timestamp: { gte: startOfDay }
        },
        select: {
          type: true,
          amount: true
        }
      }),

      // Recent users (last 7 days by day)
      prisma.$queryRaw`
        SELECT DATE("createdAt") as date, COUNT(*) as count
        FROM "User"
        WHERE "createdAt" >= ${startOfWeek}
        GROUP BY DATE("createdAt")
        ORDER BY date ASC
      `,

      // Recent bids (last 7 days by day)
      prisma.$queryRaw`
        SELECT DATE("timestamp") as date, COUNT(*) as count
        FROM "Bid"
        WHERE "timestamp" >= ${startOfWeek}
        GROUP BY DATE("timestamp")
        ORDER BY date ASC
      `
    ]);

    // Calculate daily earned/spent from today's transactions
    const todayEarned = todayTransactions
      .filter(t => t.type === 'EARN')
      .reduce((sum, t) => sum + t.amount, 0);
    const todaySpent = todayTransactions
      .filter(t => t.type === 'SPEND')
      .reduce((sum, t) => sum + t.amount, 0);

    // Format data for charts
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dailyBidsData = days.map((day, index) => {
      const date = new Date(startOfWeek.getTime() + index * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      const bidsForDay = recentBids.find((b) => b.date?.toISOString?.()?.split('T')[0] === dateStr);
      const usersForDay = recentUsers.find((u) => u.date?.toISOString?.()?.split('T')[0] === dateStr);
      return {
        day,
        bids: parseInt(bidsForDay?.count || 0),
        users: parseInt(usersForDay?.count || 0)
      };
    });

    // Calculate inflation rate (simplified: % change in circulation)
    const inflationRate = totalEarned._sum.totalEarned > 0 
      ? ((totalEarned._sum.totalEarned - totalSpent._sum.totalSpent) / totalEarned._sum.totalEarned * 100).toFixed(2)
      : 0;

    res.json({
      stats: {
        totalUsers,
        activeUsers,
        totalCoins: totalCoins._sum.coins || 0,
        totalEarned: totalEarned._sum.totalEarned || 0,
        totalSpent: totalSpent._sum.totalSpent || 0,
        activeAuctions,
        endedAuctions,
        todayBids,
        weekBids,
        todayEarned,
        todaySpent,
        inflationRate: parseFloat(inflationRate)
      },
      dailyBidsData,
      coinsData: dailyBidsData.map(d => ({
        day: d.day,
        earned: Math.round(todayEarned / 7), // Average
        spent: Math.round(todaySpent / 7) // Average
      }))
    });
  } catch (err) {
    console.error('[Admin] Dashboard stats error:', err);
    res.status(500).json({ message: 'Failed to fetch dashboard stats' });
  }
});

/**
 * GET /api/admin/users
 * Get all users with pagination and search
 */
router.get('/users', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || '';
    const skip = (page - 1) * limit;

    const where = search ? {
      OR: [
        { username: { contains: search, mode: 'insensitive' } },
        { discordId: { contains: search } }
      ]
    } : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          username: true,
          discordId: true,
          coins: true,
          totalEarned: true,
          totalSpent: true,
          role: true,
          notifications: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              bids: true,
              wonAuctions: true
            }
          }
        }
      }),
      prisma.user.count({ where })
    ]);

    // Format users for frontend
    const formattedUsers = users.map(user => ({
      id: user.id,
      username: user.username,
      discordId: user.discordId,
      coins: user.coins,
      totalEarned: user.totalEarned,
      totalSpent: user.totalSpent,
      status: user.role === 'BANNED' ? 'banned' : 'active',
      role: user.role,
      notifications: user.notifications,
      joinDate: user.createdAt,
      lastActive: user.updatedAt,
      totalBids: user._count.bids,
      auctionsWon: user._count.wonAuctions
    }));

    res.json({
      users: formattedUsers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error('[Admin] Users fetch error:', err);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

/**
 * POST /api/admin/users/:id/ban
 * Ban/unban a user
 */
router.post('/users/:id/ban', async (req, res) => {
  try {
    const { id } = req.params;
    const { banned, reason } = req.body;

    const user = await prisma.user.update({
      where: { id },
      data: {
        role: banned ? 'BANNED' : 'USER'
      }
    });

    // Send Discord notification if user has notifications enabled
    if (user.notifications && user.discordId) {
      try {
        const message = banned 
          ? `⚠️ **Account Status Update**\n\nYour account has been banned.\nReason: ${reason || 'Violation of platform rules'}\n\nContact support if you believe this is a mistake.`
          : `✅ **Account Status Update**\n\nYour account has been unbanned.\n\nWelcome back!`;
        
        await sendDirectMessage(user.discordId, message);
      } catch (dmErr) {
        console.error('[Admin] Failed to send ban notification DM:', dmErr);
      }
    }

    res.json({ 
      message: banned ? 'User banned successfully' : 'User unbanned successfully',
      user: {
        id: user.id,
        status: user.role === 'BANNED' ? 'banned' : 'active'
      }
    });
  } catch (err) {
    console.error('[Admin] Ban user error:', err);
    res.status(500).json({ message: 'Failed to update user status' });
  }
});

/**
 * POST /api/admin/users/:id/coins
 * Add/remove coins from user
 */
router.post('/users/:id/coins', async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, reason } = req.body;

    if (!amount || isNaN(amount)) {
      return res.status(400).json({ message: 'Invalid amount' });
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: { coins: true, discordId: true, notifications: true, username: true }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update coins using centralized function
    const coinResult = await updateUserCoins(id, amount, reason || `Admin ${amount > 0 ? 'added' : 'removed'} coins: ${Math.abs(amount)}`);

    if (!coinResult.success) {
      return res.status(500).json({ message: 'Failed to update user coins', error: coinResult.error });
    }

    // Send Discord notification
    if (user.notifications && user.discordId) {
      try {
        const message = amount > 0
          ? `💰 **Coins Added!**\n\n${amount} coins have been added to your account.\nNew Balance: ${coinResult.newBalance} coins\nReason: ${reason || 'Admin adjustment'}`
          : `⚠️ **Coins Removed**\n\n${Math.abs(amount)} coins have been removed from your account.\nNew Balance: ${coinResult.newBalance} coins\nReason: ${reason || 'Admin adjustment'}`;

        await sendDirectMessage(user.discordId, message);
      } catch (dmErr) {
        console.error('[Admin] Failed to send coin notification DM:', dmErr);
      }
    }

    res.json({
      message: `Successfully ${amount > 0 ? 'added' : 'removed'} ${Math.abs(amount)} coins`,
      newBalance: coinResult.newBalance,
      user: coinResult.user
    });
  } catch (err) {
    console.error('[Admin] Coin update error:', err);
    res.status(500).json({ message: 'Failed to update user coins' });
  }
});

/**
 * GET /api/admin/economy
 * Get economy statistics
 */
router.get('/economy', async (req, res) => {
  try {
    const [
      totalCoins,
      totalEarned,
      totalSpent,
      totalTransactions,
      todaysTransactions,
      userCount,
      avgCoinsPerUser
    ] = await Promise.all([
      prisma.user.aggregate({
        _sum: { coins: true }
      }),
      prisma.user.aggregate({
        _sum: { totalEarned: true }
      }),
      prisma.user.aggregate({
        _sum: { totalSpent: true }
      }),
      prisma.transaction.count(),
      prisma.transaction.findMany({
        where: {
          timestamp: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        },
        select: {
          type: true,
          amount: true
        }
      }),
      prisma.user.count(),
      prisma.user.aggregate({
        _avg: { coins: true }
      })
    ]);

    const todayEarned = todaysTransactions
      .filter(t => t.type === 'EARN')
      .reduce((sum, t) => sum + t.amount, 0);
    const todaySpent = todaysTransactions
      .filter(t => t.type === 'SPEND')
      .reduce((sum, t) => sum + t.amount, 0);

    // Calculate inflation rate
    const totalGenerated = totalEarned._sum.totalEarned || 0;
    const totalOutflow = totalSpent._sum.totalSpent || 0;
    const inflationRate = totalGenerated > 0 
      ? ((totalGenerated - totalOutflow) / totalGenerated * 100).toFixed(2)
      : 0;

    res.json({
      totalGenerated,
      totalSpent: totalOutflow,
      inCirculation: totalCoins._sum.coins || 0,
      totalTransactions,
      inflationRate: parseFloat(inflationRate),
      todayEarned,
      todaySpent,
      userCount,
      avgCoinsPerUser: Math.round(avgCoinsPerUser._avg.coins || 0)
    });
  } catch (err) {
    console.error('[Admin] Economy stats error:', err);
    res.status(500).json({ message: 'Failed to fetch economy stats' });
  }
});

/**
 * POST /api/admin/economy/reset
 * RESET ALL USERS' COINS TO 0 - DANGER OPERATION
 */
router.post('/economy/reset', async (req, res) => {
  try {
    const { confirmReset } = req.body;

    // Safety check
    if (!confirmReset || confirmReset !== 'RESET_ALL_COINS_CONFIRMED') {
      return res.status(400).json({ 
        message: 'Confirmation required. Send confirmReset: "RESET_ALL_COINS_CONFIRMED"' 
      });
    }

    console.log('[ADMIN] ⚠️ ECONOMY RESET INITIATED');

    // Get count before reset
    const userCount = await prisma.user.count();

    // Reset all users' coins in a transaction
    await prisma.$transaction(async (tx) => {
      // Reset all users - coins and daily tracking
      await tx.user.updateMany({
        data: {
          coins: 0,
          totalEarned: 0,
          totalSpent: 0,
          coinsEarnedToday: 0,
          dailyCheckInClaimed: false
        }
      });
      
      // Clear all transactions for clean slate
      await tx.transaction.deleteMany({});
    });

    console.log(`[ADMIN] ✅ Reset complete: ${userCount} users affected`);

    // Get FRESH economy stats immediately after reset
    const [
      totalCoins,
      totalEarned,
      totalSpent,
      activeAuctions,
      userCountAfter
    ] = await Promise.all([
      prisma.user.aggregate({ _sum: { coins: true } }),
      prisma.user.aggregate({ _sum: { totalEarned: true } }),
      prisma.user.aggregate({ _sum: { totalSpent: true } }),
      prisma.auction.count({ where: { status: 'ACTIVE' } }),
      prisma.user.count()
    ]);

    // Broadcast reset event to all connected clients via socket.io
    const { getIo } = require('../lib/notificationHelper');
    const io = getIo();
    if (io) {
      io.emit('economy-reset', { 
        message: 'Economy has been reset',
        resetAt: new Date().toISOString(),
        usersAffected: userCount
      });
      console.log('[ADMIN] Broadcasted economy-reset event to all clients');
    }

    res.json({
      success: true,
      message: 'Economy reset complete',
      usersAffected: userCount,
      resetAt: new Date().toISOString(),
      freshStats: {
        totalCoins: totalCoins._sum.coins || 0,
        totalEarned: totalEarned._sum.totalEarned || 0,
        totalSpent: totalSpent._sum.totalSpent || 0,
        inCirculation: totalCoins._sum.coins || 0,
        activeAuctions,
        userCount: userCountAfter
      }
    });
  } catch (err) {
    console.error('[Admin] Economy reset error:', err);
    res.status(500).json({ message: 'Failed to reset economy', error: err.message });
  }
});

/**
 * GET /api/admin/auctions
 * Get all auctions with stats
 */
router.get('/auctions', async (req, res) => {
  try {
    const auctions = await prisma.auction.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { bids: true }
        },
        highestBidder: {
          select: { username: true }
        }
      }
    });

    const stats = {
      total: auctions.length,
      active: auctions.filter(a => a.status === 'ACTIVE').length,
      ended: auctions.filter(a => a.status === 'ENDED').length,
      upcoming: auctions.filter(a => a.status === 'UPCOMING').length,
      totalBids: auctions.reduce((sum, a) => sum + a._count.bids, 0),
      totalValue: auctions.reduce((sum, a) => sum + a.currentBid, 0)
    };

    res.json({
      auctions: auctions.map(a => ({
        id: a.id,
        title: a.title,
        status: a.status,
        currentBid: a.currentBid,
        startingBid: a.startingBid,
        bidCount: a._count.bids,
        highestBidder: a.highestBidder?.username || null,
        startTime: a.startTime,
        endTime: a.endTime,
        createdAt: a.createdAt
      })),
      stats
    });
  } catch (err) {
    console.error('[Admin] Auctions fetch error:', err);
    res.status(500).json({ message: 'Failed to fetch auctions' });
  }
});

module.exports = router;
