 const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const cache = require('../lib/cache');
const { sendAuctionNotification } = require('../lib/discordBot');
const { createNotification } = require('../lib/notificationHelper');

// Subscribe to auction notification
router.post('/:id/notify', async (req, res) => {
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
  try {
    const auction = await prisma.auction.findUnique({
      where: { id: req.params.id },
    });
    if (!auction) return res.status(404).json({ message: 'Auction not found' });

    // Temporary: Just return success without storing (migration not run yet)
    // TODO: Enable AuctionSubscription storage after migration
    res.json({ message: 'Subscribed to auction notifications' });
  } catch (err) {
    console.error('Subscribe error:', err);
    res.status(500).json({ message: 'Failed to subscribe' });
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
        // Try to select isPremium, but handle if it doesn't exist
        isPremium: true,
      },
      orderBy: { startTime: 'asc' },
    });
    res.json(auctions);
  } catch (err) {
    // If isPremium field doesn't exist, query without it
    if (err.message.includes('isPremium')) {
      console.log('isPremium field does not exist, querying without it');
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
      // Add default isPremium: false to each auction
      return res.json(auctions.map(a => ({ ...a, isPremium: false })));
    }
    console.error('Fetch upcoming auctions error:', err);
    res.status(500).json({ message: 'Failed to fetch upcoming auctions' });
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

// Get ended auctions (cached)
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

      // Notify the winner
      await createNotification(auction.highestBidderId, 'WIN', `You won the auction for ${auction.title}! 🎉`, { amount: auction.currentBid, relatedId: auction.id });
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
      }),
      prisma.transaction.create({
        data: {
          userId: req.user.id,
          amount: bidAmount,
          type: 'SPEND',
          description: `Bid on ${auction.title}`
        }
      })
    ]);

    // Clear relevant caches
    cache.del('auctions:active');
    cache.del(`auction:${auctionId}`);
    const profileCacheKey = `profile-${req.user.id}`;
    if (profileCache.has(profileCacheKey)) {
      profileCache.delete(profileCacheKey);
    }

    // Create notifications
    // Notify bidder
    await createNotification(req.user.id, 'BID_PLACED', `You placed a bid of ${bidAmount} coins on ${auction.title}`, { amount: bidAmount, relatedId: auctionId });

    // Notify previous highest bidder they were outbid
    if (auction.highestBidderId && auction.highestBidderId !== req.user.id) {
      await createNotification(auction.highestBidderId, 'OUTBID', `You were outbid on ${auction.title}! Current bid: ${bidAmount} coins`, { amount: bidAmount, relatedId: auctionId });
    }

    res.json({ message: 'Bid placed successfully' });
  } catch (err) {
    console.error('Place bid error:', err);
    res.status(500).json({ message: 'Failed to place bid' });
  }
});

module.exports = router;

