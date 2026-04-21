const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { sendAuctionNotification } = require('../lib/discordBot');

// Get all active auctions
router.get('/', async (req, res) => {
  try {
    const auctions = await prisma.auction.findMany({
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
    res.json(auctions);
  } catch (err) {
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
  
  try {
    const auction = await prisma.auction.create({
      data: {
        title,
        description,
        product,
        image,
        startTime: new Date(),
        endTime: new Date(endTime),
        startingBid: parseInt(startingBid) || 0,
        currentBid: parseInt(startingBid) || 0,
        minBidIncrement: parseInt(minBidIncrement) || 100,
        status: 'ACTIVE'
      }
    });

    // Notify users who have notifications enabled
    const usersToNotify = await prisma.user.findMany({
      where: { notifications: true }
    });

    // Send notifications in background to avoid blocking response
    usersToNotify.forEach(user => {
      sendAuctionNotification(user.discordId, auction).catch(err => {
        console.error(`Failed to notify user ${user.discordId}:`, err.message);
      });
    });

    res.json(auction);
  } catch (err) {
    console.error('Auction creation error:', err);
    res.status(500).json({ 
      message: 'Failed to create auction',
      error: err.message 
    });
  }
});

// Admin: Delete auction
router.delete('/:id', async (req, res) => {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Forbidden' });
  }
  try {
    // Delete associated bids first
    await prisma.bid.deleteMany({ where: { auctionId: req.params.id } });
    await prisma.auction.delete({ where: { id: req.params.id } });
    res.json({ message: 'Auction deleted' });
  } catch (err) {
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
      data: { 
        status: 'ENDED',
        endTime: new Date() 
      },
      include: { highestBidder: true }
    });

    if (auction.highestBidder) {
      const { announceWinner } = require('../lib/discordBot');
      await announceWinner(auction, auction.highestBidder);
    }

    res.json(auction);
  } catch (err) {
    res.status(500).json({ message: 'Failed to end auction' });
  }
});

// Place a bid
router.post('/:id/bid', async (req, res) => {
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
  const { amount } = req.body;
  const auctionId = req.params.id;

  try {
    const auction = await prisma.auction.findUnique({ where: { id: auctionId } });
    if (!auction || auction.status !== 'ACTIVE') {
      return res.status(400).json({ message: 'Auction not active' });
    }

    if (amount <= auction.currentBid) {
      return res.status(400).json({ message: 'Bid too low' });
    }

    // Use transaction to ensure consistency
    await prisma.$transaction([
      prisma.auction.update({
        where: { id: auctionId },
        data: { currentBid: amount, highestBidderId: req.user.id }
      }),
      // Deduct coins from user
      prisma.user.update({
        where: { id: req.user.id },
        data: { 
          coins: { decrement: amount },
          totalSpent: { increment: amount }
        }
      }),
      prisma.bid.create({
        data: { amount, auctionId, userId: req.user.id }
      })
    ]);

    res.json({ message: 'Bid placed successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to place bid' });
  }
});

module.exports = router;
