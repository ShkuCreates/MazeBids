 const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const cache = require('../lib/cache');
const { sendAuctionNotification } = require('../lib/discordBot');

// Get all active auctions
router.get('/', async (req, res) => {
  try {
    const cacheKey = 'auctions:active';
    let auctions = cache.get(cacheKey);

    if (!auctions) {
      auctions = await prisma.auction.findMany({
        where: {
          status: { in: ['ACTIVE', 'UPCOMING'] }
        },
        include: {
          highestBidder: {
            select: { username: true, avatar: true }
          }
        },
        orderBy: { startTime: 'asc' }
      });
      cache.set(cacheKey, auctions, 30); // 30s cache
    }

    res.json(auctions);
  } catch (err) {
    console.error('Fetch auctions error:', err);
    res.status(500).json({ message: 'Failed to fetch auctions' });
  }
});

// Get single auction
router.get('/:id', async (req, res) => {
  try {
    const auction = await prisma.auction.findUnique({
      where: { id: req.params.id },
      include: {
        highestBidder: {
          select: { username: true, avatar: true }
        },
        bids: {
          include: { user: { select: { username: true } } },
          orderBy: { timestamp: 'desc' },
          take: 10
        }
      }
    });
    if (!auction) return res.status(404).json({ message: 'Auction not found' });
    res.json(auction);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch auction' });
  }
});

// Admin: Create auction
router.post('/', async (req, res) => {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Forbidden' });
  }
  const { title, description, product, image, endTime, startingBid, minBidIncrement } = req.body;
  
  // Input validation
  if (!title || !description || !product || !image) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  
  const endDate = new Date(endTime);
  if (isNaN(endDate.getTime()) || endDate <= new Date()) {
    return res.status(400).json({ message: 'End time must be a valid future date' });
  }
  
  const bid = parseInt(startingBid) || 0;
  const increment = parseInt(minBidIncrement) || 100;
  if (bid < 0 || increment < 0) {
    return res.status(400).json({ message: 'Bid amounts must be non-negative' });
  }
  
  try {
    const auction = await prisma.auction.create({
      data: {
        title,
        description,
        product,
        image,
        startTime: new Date(),
        endTime: endDate,
        startingBid: bid,
        currentBid: bid,
        minBidIncrement: increment,
        status: 'ACTIVE'
      }
    });

    // Clear cache
    cache.del('auctions:active');

    const usersToNotify = await prisma.user.findMany({
      where: { notifications: true }
    });

    usersToNotify.forEach(user => {
      sendAuctionNotification(user.discordId, auction).catch(err => {
        console.error(`Failed to notify user ${user.discordId}:`, err.message);
      });
    });

    res.json(auction);
  } catch (err) {
    console.error('Auction creation error:', err);
    res.status(500).json({ message: 'Failed to create auction', error: err.message });
  }
});

// Admin: Delete auction
router.delete('/:id', async (req, res) => {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Forbidden' });
  }
  try {
    await prisma.bid.deleteMany({ where: { auctionId: req.params.id } });
    await prisma.auction.delete({ where: { id: req.params.id } });
    cache.del('auctions:active');
    res.json({ message: 'Auction deleted' });
  } catch (err) {
    console.error('Auction deletion error:', err);
    res.status(500).json({ message: 'Failed to delete auction' });
  }
});

// Admin: End auction early
router.post('/:id/end', async (req, res) => {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Forbidden' });
  }
  try {
    const auction = await prisma.auction.update({
      where: { id: req.params.id },
      data: { status: 'ENDED', endTime: new Date() },
      include: { highestBidder: true }
    });

    cache.del('auctions:active');

    if (auction.highestBidder) {
      const { announceWinner } = require('../lib/discordBot');
      await announceWinner(auction, auction.highestBidder);
    }

    res.json(auction);
  } catch (err) {
    console.error('Auction end error:', err);
    res.status(500).json({ message: 'Failed to end auction' });
  }
});

// Place bid
router.post('/:id/bid', async (req, res) => {
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
  const { amount } = req.body;
  const auctionId = req.params.id;

  // Input validation
  const bidAmount = parseInt(amount);
  if (isNaN(bidAmount) || bidAmount <= 0) {
    return res.status(400).json({ message: 'Invalid bid amount' });
  }

  try {
    const auction = await prisma.auction.findUnique({ where: { id: auctionId } });
    if (!auction || auction.status !== 'ACTIVE') {
      return res.status(400).json({ message: 'Auction not active' });
    }

    // Check minimum bid increment
    const minimumBid = auction.currentBid + auction.minBidIncrement;
    if (bidAmount < minimumBid) {
      return res.status(400).json({ message: `Bid must be at least ${minimumBid}` });
    }

    // Check user has enough coins
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user || user.coins < bidAmount) {
      return res.status(400).json({ message: 'Insufficient coins' });
    }

    await prisma.$transaction([
      prisma.auction.update({
        where: { id: auctionId },
        data: { currentBid: bidAmount, highestBidderId: req.user.id }
      }),
      prisma.user.update({
        where: { id: req.user.id },
        data: { coins: { decrement: bidAmount }, totalSpent: { increment: bidAmount } }
      }),
      prisma.bid.create({
        data: { amount: bidAmount, auctionId, userId: req.user.id }
      })
    ]);

    cache.del('auctions:active');
    res.json({ message: 'Bid placed successfully' });
  } catch (err) {
    console.error('Place bid error:', err);
    res.status(500).json({ message: 'Failed to place bid' });
  }
});

module.exports = router;

