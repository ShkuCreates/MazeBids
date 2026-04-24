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
  const traceId = req.body.traceId || "no-trace";

  console.log("========== AD CLAIM START ==========");
  console.log("TRACE:", traceId);
  console.log("BODY:", req.body);
  console.log("USER:", req.user);

  if (!req.user) {
    console.log("NO USER");
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    console.log("FETCHING AD:", req.params.id);
    const ad = await prisma.ad.findUnique({
      where: { id: req.params.id }
    });

    if (!ad) {
      console.log("AD NOT FOUND");
      return res.status(404).json({ message: 'Ad not found' });
    }

    console.log("AD REWARD:", ad.reward);

    console.log("FETCHING USER BEFORE UPDATE");
    const before = await prisma.user.findUnique({
      where: { id: req.user.id }
    });
    console.log("COINS BEFORE:", before?.coins);

    console.log("CALLING updateUserCoins");
    const coinResult = await updateUserCoins(req.user.id, ad.reward, `Watched ad: ${ad.title}`);
    console.log("UPDATED RESULT:", coinResult);

    const after = await prisma.user.findUnique({
      where: { id: req.user.id }
    });
    console.log("COINS AFTER DB CHECK:", after?.coins);

    console.log("========== AD CLAIM END ==========");

    res.json({
      message: `Successfully claimed ${ad.reward} coins!`,
      coins: coinResult.newBalance
    });
  } catch (err) {
    console.error('[Ads] Claim error:', err);
    res.status(500).json({ message: 'Failed to claim ad reward' });
  }
});

module.exports = router;