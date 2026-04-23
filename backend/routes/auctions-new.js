const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const cache = require('../lib/cache');
const { sendAuctionNotification, announceWinner, sendNotificationStatusUpdate } = require('../lib/discordBot');
const { createNotification } = require('../lib/notificationHelper');

// Subscribe to auction notification
router.post('/:id/notify', async (req, res) => {
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
  try {
    const auction = await prisma.auction.findUnique({
      where: { id: req.params.id },
    });
    if (!auction) return res.status(404).json({ message: 'Auction not found' });

    // Store subscription if model exists
    try {
      await prisma.auctionSubscription.upsert({
        where: { userId_auctionId: { userId: req.user.id, auctionId: req.params.id } },
        update: { createdAt: new Date() },
        create: { userId: req.user.id, auctionId: req.params.id }
      });
    } catch (err) {
      // Model might not exist yet
      console.log('AuctionSubscription model not available');
    }

    res.json({ message: 'Subscribed to auction notifications' });
  } catch (err) {
    console.error('Subscribe error:', err);
    res.status(500).json({ message: 'Failed to subscribe' });
  }
});

// Get all active auctions (optimized with caching and reduced payload)
router.get('/', async (req, res) => {
  try {
    const cacheKey = 'auctions:active';
    let auctions = cache.get(cacheKey);

    if (!auctions) {
      auctions = await prisma.auction.findMany({
        where: {
          status: { in: ['ACTIVE', 'UPCOMING'] }
        },
        select: {
          id: true,
          title: true,
          description: true,
          product: true,
          image: true,
          startTime: true,
          endTime: true,
          status: true,
          startingBid: true,
          currentBid: true,
          minBidIncrement: true,
          highestBidderId: true,
          highestBidder: {
            select: { username: true, avatar: true }
          }
        },
        orderBy: { startTime: 'asc' }
      });
      cache.set(cacheKey, auctions, 15); // 15s cache for real-time feel
    }

    res.json(auctions);
  } catch (err) {
    console.error('Fetch auctions error:', err);
    res.status(500).json({ message: 'Failed to fetch auctions' });
  }
});

// Get ended auctions (cached) - REAL DATA ONLY
router.get('/ended', async (req, res) => {
  try {
    const cacheKey = 'auctions:ended';
    let auctions = cache.get(cacheKey);

    if (!auctions) {
      auctions = await prisma.auction.findMany({
        where: {
          status: 'ENDED'
        },
        select: {
          id: true,
          title: true,
          image: true,
          currentBid: true,
          endTime: true,
          highestBidder: {
            select: { username: true, avatar: true }
          }
        },
        orderBy: { endTime: 'desc' },
        take: 20
      });
      cache.set(cacheKey, auctions, 60); // 60s cache
    }

    res.json(auctions);
  } catch (err) {
    console.error('Fetch ended auctions error:', err);
    res.status(500).json({ message: 'Failed to fetch ended auctions' });
  }
});

// Get single auction (cached)
router.get('/:id', async (req, res) => {
  try {
    const cacheKey = `auction:${req.params.id}`;
    let auction = cache.get(cacheKey);

    if (!auction) {
      auction = await prisma.auction.findUnique({
        where: { id: req.params.id },
        select: {
          id: true,
          title: true,
          description: true,
          product: true,
          image: true,
          startTime: true,
          endTime: true,
          status: true,
          startingBid: true,
          currentBid: true,
          minBidIncrement: true,
          highestBidderId: true,
          highestBidder: {
            select: { username: true, avatar: true }
          },
          bids: {
            select: {
              amount: true,
              timestamp: true,
              user: { select: { username: true } }
            },
            orderBy: { timestamp: 'desc' },
            take: 10
          }
        }
      });
      if (!auction) return res.status(404).json({ message: 'Auction not found' });
      cache.set(cacheKey, auction, 10); // 10s cache for real-time updates
    }

    res.json(auction);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch auction' });
  }
});

// Get recent wins
router.get('/recent-wins', async (req, res) => {
  try {
    const auctions = await prisma.auction.findMany({
      where: {
        status: 'ENDED',
        highestBidderId: { not: null }
      },
      include: {
        highestBidder: {
          select: { username: true, avatar: true }
        }
      },
      orderBy: { updatedAt: 'desc' },
      take: 10,
    });
    res.json(auctions);
  } catch (err) {
    console.error('Fetch recent wins error:', err);
    res.status(500).json({ message: 'Failed to fetch recent wins' });
  }
});

// Get upcoming auctions
router.get('/upcoming', async (req, res) => {
  try {
    const auctions = await prisma.auction.findMany({
      where: {
        status: 'UPCOMING',
        startTime: { gt: new Date() }
      },
      select: {
        id: true,
        title: true,
        image: true,
        startTime: true,
        isPremium: true,
      },
      orderBy: { startTime: 'asc' },
    });
    res.json(auctions);
  } catch (err) {
    // If isPremium field doesn't exist, query without it
    if (err.message.includes('isPremium')) {
      const auctions = await prisma.auction.findMany({
        where: {
          status: 'UPCOMING',
          startTime: { gt: new Date() }
        },
        select: {
          id: true,
          title: true,
          image: true,
          startTime: true,
        },
        orderBy: { startTime: 'asc' },
      });
      return res.json(auctions.map(a => ({ ...a, isPremium: false })));
    }
    console.error('Fetch upcoming auctions error:', err);
    res.status(500).json({ message: 'Failed to fetch upcoming auctions' });
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

    // Notify users with notifications enabled
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
    cache.del('auctions:ended');

    // Announce winner in Discord
    if (auction.highestBidderId && auction.highestBidder) {
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
  if (!amount || amount < 0) {
    return res.status(400).json({ message: 'Invalid bid amount' });
  }

  try {
    const auction = await prisma.auction.findUnique({
      where: { id: req.params.id }
    });

    if (!auction) return res.status(404).json({ message: 'Auction not found' });
    if (auction.status !== 'ACTIVE') return res.status(400).json({ message: 'Auction is not active' });

    // Check bid amount
    if (amount < auction.currentBid + auction.minBidIncrement) {
      return res.status(400).json({ 
        message: `Bid must be at least ${auction.currentBid + auction.minBidIncrement}` 
      });
    }

    // Check user has enough coins
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user || user.coins < amount) {
      return res.status(400).json({ message: 'Insufficient coins' });
    }

    // Record bid
    const bid = await prisma.bid.create({
      data: {
        amount,
        userId: req.user.id,
        auctionId: req.params.id
      }
    });

    // Update auction
    const updatedAuction = await prisma.auction.update({
      where: { id: req.params.id },
      data: {
        currentBid: amount,
        highestBidderId: req.user.id
      },
      include: { highestBidder: true }
    });

    // Spend coins
    await prisma.user.update({
      where: { id: req.user.id },
      data: { 
        coins: { decrement: amount },
        totalSpent: { increment: amount }
      }
    });

    // Clear caches
    cache.del('auctions:active');
    cache.del(`auction:${req.params.id}`);

    res.json(updatedAuction);
  } catch (err) {
    console.error('Bid error:', err);
    res.status(500).json({ message: 'Failed to place bid' });
  }
});

module.exports = router;
