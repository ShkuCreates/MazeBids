const express = require('express');
const prisma = require('../../lib/prisma');
const config = require('../config');
const dmAlertService = require('./dmAlertService');

const router = express.Router();

function verifyWebhook(req, res, next) {
  const signature = req.headers['x-webhook-secret'];
  if (signature !== config.WEBHOOK_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

router.post('/auction-created', verifyWebhook, async (req, res) => {
  try {
    const { auction } = req.body;
    
    if (global.discordClient && config.AUCTION_CHANNEL_ID) {
      const channel = await global.discordClient.channels.fetch(config.AUCTION_CHANNEL_ID);
      const { buildEmbed } = require('../utils/embedBuilder');
      
      const embed = buildEmbed({
        title: '🚀 New Auction Started!',
        description: `**${auction.title}**\n\nStarting Bid: ${auction.startingBid} coins\nEnds: <t:${Math.floor(new Date(auction.endTime).getTime() / 1000)}:R>`,
        color: '#3b82f6',
        image: auction.image,
        footer: 'Place your bids now!'
      });
      
      await channel.send({ embeds: [embed] });
    }
    
    res.json({ success: true });
  } catch (err) {
    console.error('Webhook auction-created error:', err);
    res.status(500).json({ error: 'Internal error' });
  }
});

router.post('/bid-placed', verifyWebhook, async (req, res) => {
  try {
    const { auction, bidder, previousBidder } = req.body;
    
    if (previousBidder && previousBidder.discordId !== bidder.discordId) {
      await dmAlertService.sendOutbidAlert(previousBidder, auction, bidder.bidAmount);
    }
    
    res.json({ success: true });
  } catch (err) {
    console.error('Webhook bid-placed error:', err);
    res.status(500).json({ error: 'Internal error' });
  }
});

router.post('/auction-ended', verifyWebhook, async (req, res) => {
  try {
    const { auction, winner } = req.body;
    
    if (winner) {
      await dmAlertService.sendWinAlert(winner, auction);
    }
    
    res.json({ success: true });
  } catch (err) {
    console.error('Webhook auction-ended error:', err);
    res.status(500).json({ error: 'Internal error' });
  }
});

router.post('/coins-updated', verifyWebhook, async (req, res) => {
  try {
    const { user, amount, type } = req.body;
    
    if (type === 'bonus') {
      await dmAlertService.sendBonusReward(user, amount, 'Bonus reward');
    }
    
    res.json({ success: true });
  } catch (err) {
    console.error('Webhook coins-updated error:', err);
    res.status(500).json({ error: 'Internal error' });
  }
});

module.exports = router;
