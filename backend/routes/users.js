const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');

// Get user profile
router.get('/profile', async (req, res) => {
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
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
        discordId: true
      }
    });

    if (!user) return res.status(404).json({ message: 'User not found' });

    // Count won auctions
    const auctionsWonCount = await prisma.auction.count({
      where: { highestBidderId: user.id }
    });

    res.json({ ...user, auctionsWonCount });
  } catch (err) {
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
      select: { notifications: true }
    });

    if (!user) return res.status(404).json({ message: 'User not found' });

    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: { notifications: !user.notifications }
    });

    res.json({ notifications: updated.notifications });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update notification settings' });
  }
});

// Site stats endpoint
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

    res.json({
      registeredUsers: userCount,
      auctionsHeld: auctionCount,
      totalEarned: stats._sum.totalEarned || 0,
      totalSpent: stats._sum.totalSpent || 0
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch stats' });
  }
});

module.exports = router;
