const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');

// Get user profile and stats
router.get('/profile', async (req, res) => {
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        transactions: {
          orderBy: { timestamp: 'desc' },
          take: 20
        },
        wonAuctions: true,
        _count: {
          select: {
            bids: true,
            wonAuctions: true
          }
        }
      }
    });

    // Try to get server roles from Discord if bot is available
    let discordRoles = ["Member"];
    try {
      const bot = require('../lib/discordBot');
      const client = bot.client;
      
      // Ensure client is ready and guilds manager exists
      if (client && client.isReady() && client.guilds) {
        const guildId = process.env.DISCORD_GUILD_ID;
        if (guildId) {
          const guild = await client.guilds.fetch(guildId).catch(() => null);
          if (guild) {
            const member = await guild.members.fetch(user.discordId).catch(() => null);
            if (member) {
              // Get all roles (excluding @everyone)
              const roles = member.roles.cache
                .filter(r => r.name !== '@everyone')
                .sort((a, b) => b.position - a.position)
                .map(r => r.name);
              
              if (roles.length > 0) {
                discordRoles = roles;
              }
            } else {
              console.warn(`User ${user.discordId} not found in guild ${guildId}`);
            }
          } else {
            console.warn(`Guild ${guildId} not found`);
          }
        } else {
          console.warn("DISCORD_GUILD_ID not set in environment");
        }
      } else {
        console.warn("Discord client is not ready or guilds manager missing");
      }
    } catch (err) {
      console.warn("Could not fetch Discord roles:", err.message);
    }

    res.json({
      ...user,
      discordRoles,
      auctionsWonCount: user._count.wonAuctions,
      totalBids: user._count.bids
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch profile' });
  }
});

// Redeem Code from Website
router.post('/redeem-code', async (req, res) => {
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
  const { code } = req.body;

  if (!code) return res.status(400).json({ message: 'Code is required' });

  try {
    const bonusCode = await prisma.bonusCode.findUnique({
      where: { code: code.toUpperCase() },
      include: { redemptions: true }
    });

    if (!bonusCode) {
      return res.status(404).json({ message: 'Invalid bonus code' });
    }

    if (bonusCode.usedCount >= bonusCode.maxUses) {
      return res.status(400).json({ message: 'This code has expired' });
    }

    const alreadyRedeemed = await prisma.redemption.findUnique({
      where: {
        userId_bonusCodeId: {
          userId: req.user.id,
          bonusCodeId: bonusCode.id
        }
      }
    });

    if (alreadyRedeemed) {
      return res.status(400).json({ message: 'You have already redeemed this code' });
    }

    // Process redemption
    await prisma.$transaction([
      prisma.redemption.create({
        data: { userId: req.user.id, bonusCodeId: bonusCode.id }
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
          description: `Redeemed bonus code: ${bonusCode.code}`
        }
      })
    ]);

    res.json({ 
      message: 'Code redeemed successfully!', 
      reward: bonusCode.reward 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to redeem code' });
  }
});

// site-stats route logic remains same but ensuring it's not accidentally deleted
// Site Statistics for Dashboard
router.get('/site-stats', async (req, res) => {
  try {
    const userCount = await prisma.user.count();
    const auctionCount = await prisma.auction.count();
    const stats = await prisma.user.aggregate({
      _sum: {
        totalEarned: true,
        totalSpent: true
      }
    });

    // Real stats + impressive hypothetical boosts to encourage joining
    res.json({
      registeredUsers: userCount + 1245, 
      totalEarned: (stats._sum.totalEarned || 0) + 1500000, 
      totalSpent: (stats._sum.totalSpent || 0) + 850000, 
      auctionsHeld: auctionCount + 3247 
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch site stats' });
  }
});

// Redeem Referral Code
router.post('/redeem-referral', async (req, res) => {
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
  const { code } = req.body;

  if (!code) return res.status(400).json({ message: 'Referral code is required' });

  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    if (user.referredById) {
      return res.status(400).json({ message: 'You have already redeemed a referral code' });
    }

    const referrer = await prisma.user.findUnique({
      where: { referralCode: code.toUpperCase() }
    });

    if (!referrer) {
      return res.status(404).json({ message: 'Invalid referral code' });
    }

    if (referrer.id === user.id) {
      return res.status(400).json({ message: 'You cannot redeem your own referral code' });
    }

    // Process referral
    await prisma.$transaction([
      // Update referred user
      prisma.user.update({
        where: { id: user.id },
        data: { 
          referredById: referrer.id,
          coins: { increment: 300 },
          totalEarned: { increment: 300 }
        }
      }),
      // Update referrer
      prisma.user.update({
        where: { id: referrer.id },
        data: { 
          coins: { increment: 300 },
          totalEarned: { increment: 300 }
        }
      }),
      // Log transactions
      prisma.transaction.create({
        data: {
          userId: user.id,
          amount: 300,
          type: 'EARN',
          description: `Referral bonus from ${referrer.username}`
        }
      }),
      prisma.transaction.create({
        data: {
          userId: referrer.id,
          amount: 300,
          type: 'EARN',
          description: `Referral bonus for inviting ${user.username}`
        }
      })
    ]);

    res.json({ message: 'Referral code redeemed! Both of you received 300 coins.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to redeem referral code' });
  }
});

// Leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    const topUsers = await prisma.user.findMany({
      orderBy: { coins: 'desc' },
      take: 10,
      select: { username: true, avatar: true, coins: true }
    });
    res.json(topUsers);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch leaderboard' });
  }
});

// Toggle notifications
router.post('/toggle-notifications', async (req, res) => {
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: { notifications: !user.notifications }
    });

    // Send confirmation DM via Discord
    try {
      const { sendNotificationStatusUpdate } = require('../lib/discordBot');
      await sendNotificationStatusUpdate(user.discordId, updatedUser.notifications);
    } catch (dmErr) {
      console.error('Failed to send notification status update DM:', dmErr.message);
    }

    res.json({ notifications: updatedUser.notifications });
  } catch (err) {
    res.status(500).json({ message: 'Failed to toggle notifications' });
  }
});

module.exports = router;
