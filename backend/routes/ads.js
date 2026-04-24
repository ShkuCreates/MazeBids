const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { createNotification } = require('../lib/notificationHelper');
const { updateUserCoins } = require('../lib/coinHelper');

// Get ads by placement
router.get('/placement/:placement', async (req, res) => {
  try {
    const { placement } = req.params;
    const ads = await prisma.ad.findMany({
      where: {
        placement: placement.toUpperCase(),
        status: 'ACTIVE',
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      }
    });
    res.json(ads);
  } catch (err) {
    console.error('Failed to fetch ads:', err.message);
    // Return empty array if column doesn't exist (schema sync issue)
    res.json([]);
  }
});

// Admin: Get all ads
router.get('/all', async (req, res) => {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Forbidden' });
  }
  try {
    const ads = await prisma.ad.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(ads);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch ads' });
  }
});

// Admin: Create ad
router.post('/', async (req, res) => {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Forbidden' });
  }
  const { title, type, contentUrl, targetUrl, placement, position, size, duration, reward, expiresAt } = req.body;
  
  // Input validation
  if (!title || !type || !contentUrl || !targetUrl || !placement) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  
  try {
    const rewardNum = reward ? parseInt(reward) : 0;
    const durationNum = duration ? parseInt(duration) : null;
    
    if (rewardNum < 0 || (durationNum && durationNum < 0)) {
      return res.status(400).json({ message: 'Duration and reward must be non-negative' });
    }
    
    const ad = await prisma.ad.create({
      data: {
        title,
        type,
        contentUrl,
        targetUrl,
        placement: placement.toUpperCase(),
        position: (position || 'TOP').toUpperCase(),
        size: (size || 'MEDIUM').toUpperCase(),
        duration: durationNum,
        reward: rewardNum,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        status: 'ACTIVE'
      }
    });
    res.json(ad);
  } catch (err) {
    console.error('Ad creation error:', err);
    res.status(500).json({ message: 'Failed to create ad' });
  }
});

// Admin: Update ad
router.put('/:id', async (req, res) => {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Forbidden' });
  }
  const { title, type, contentUrl, targetUrl, placement, duration, reward, expiresAt, status } = req.body;
  
  // Input validation
  if (title && !title.trim()) {
    return res.status(400).json({ message: 'Title cannot be empty' });
  }
  
  try {
    const rewardNum = reward ? parseInt(reward) : undefined;
    const durationNum = duration ? parseInt(duration) : undefined;
    
    if ((rewardNum !== undefined && rewardNum < 0) || (durationNum !== undefined && durationNum < 0)) {
      return res.status(400).json({ message: 'Duration and reward must be non-negative' });
    }
    
    const updateData = {};
    if (title) updateData.title = title;
    if (type) updateData.type = type;
    if (contentUrl) updateData.contentUrl = contentUrl;
    if (targetUrl) updateData.targetUrl = targetUrl;
    if (placement) updateData.placement = placement.toUpperCase();
    if (rewardNum !== undefined) updateData.reward = rewardNum;
    if (durationNum !== undefined) updateData.duration = durationNum;
    if (expiresAt) updateData.expiresAt = new Date(expiresAt);
    if (status) updateData.status = status;
    
    const ad = await prisma.ad.update({
      where: { id: req.params.id },
      data: updateData
    });
    res.json(ad);
  } catch (err) {
    console.error('Ad update error:', err);
    res.status(500).json({ message: 'Failed to update ad' });
  }
});

// Admin: Delete ad
router.delete('/:id', async (req, res) => {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Forbidden' });
  }
  try {
    await prisma.ad.delete({
      where: { id: req.params.id }
    });
    res.json({ message: 'Ad deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete ad' });
  }
});

// Claim ad reward
router.post('/:id/claim', async (req, res) => {
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
  
  console.log('[Ads] Claim request:', { userId: req.user.id, adId: req.params.id });
  
  try {
    const ad = await prisma.ad.findUnique({
      where: { id: req.params.id }
    });

    if (!ad || ad.status !== 'ACTIVE' || ad.reward <= 0) {
      return res.status(400).json({ message: 'This ad does not offer a reward' });
    }

    // Check daily limit
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { coinsEarnedToday: true }
    });

    const dailyTotal = user?.coinsEarnedToday || 0;
    if (dailyTotal + ad.reward > 5000) {
      return res.status(429).json({
        message: 'Daily earning limit reached',
        current: dailyTotal,
        limit: 5000
      });
    }

    // Check for cooldown (prevent double claims)
    const lastClaim = await prisma.transaction.findFirst({
      where: {
        userId: req.user.id,
        description: `Watched ad: ${ad.title}`
      },
      orderBy: { timestamp: 'desc' }
    });

    if (lastClaim) {
      const diff = (new Date() - lastClaim.timestamp) / 1000 / 60; // in minutes
      if (diff < 1) { // 1 minute cooldown
        return res.status(429).json({ message: 'Please wait before claiming again' });
      }
    }

    // Process reward using centralized coin helper
    const coinResult = await updateUserCoins(req.user.id, ad.reward, `Watched ad: ${ad.title}`);

    if (!coinResult.success) {
      console.error('[Ads] Coin update failed:', coinResult.error);
      return res.status(500).json({ message: 'Failed to process reward' });
    }

    // Notify user of coins earned
    await createNotification(req.user.id, 'COINS_EARNED', `+${ad.reward} coins earned from watching: ${ad.title}`, { amount: ad.reward });

    console.log('[Ads] Claim successful:', { userId: req.user.id, reward: ad.reward, newBalance: coinResult.newBalance });

    // Return updated balance for real-time sync
    res.json({ 
      message: `Successfully claimed ${ad.reward} coins!`,
      coins: coinResult.newBalance,
      dailyEarned: dailyTotal + ad.reward
    });
  } catch (err) {
    console.error('Ad claim error:', err);
    res.status(500).json({ message: 'Failed to claim ad reward' });
  }
});

module.exports = router;