const prisma = require('../../lib/prisma');
const config = require('../config');
const { buildEmbed } = require('../utils/embedBuilder');

const countdownMessages = new Map();

async function checkAuctionCountdowns() {
  if (!global.discordClient) return;
  
  const now = new Date();
  const auctions = await prisma.auction.findMany({
    where: {
      status: 'ACTIVE',
      endTime: { gt: now }
    },
    include: { highestBidder: true }
  });
  
  for (const auction of auctions) {
    const timeLeft = Math.floor((new Date(auction.endTime) - now) / 1000);
    
    for (const trigger of config.COUNTDOWN_TRIGGERS) {
      if (timeLeft === trigger) {
        await sendCountdown(auction, timeLeft);
      }
    }
  }
}

async function sendCountdown(auction, seconds) {
  try {
    const channel = await global.discordClient.channels.fetch(config.AUCTION_CHANNEL_ID);
    
    const existing = countdownMessages.get(auction.id);
    const embed = buildEmbed({
      title: '🔥 Auction Ending Soon!',
      description: `**${auction.title}**\n\n⏱️ Ends in **${seconds} seconds**!\n💰 Current bid: ${auction.currentBid} coins`,
      color: seconds <= 10 ? '#ef4444' : seconds <= 30 ? '#f59e0b' : '#3b82f6',
      image: auction.image,
      footer: 'Place your final bids now!'
    });
    
    if (existing) {
      await existing.edit({ embeds: [embed] });
    } else {
      const message = await channel.send({ embeds: [embed] });
      countdownMessages.set(auction.id, message);
    }
    
    if (seconds === 10) {
      setTimeout(() => countdownMessages.delete(auction.id), 15000);
    }
  } catch (err) {
    console.error('Countdown error:', err);
  }
}

function startCountdownChecker() {
  setInterval(checkAuctionCountdowns, 1000);
}

module.exports = { startCountdownChecker, checkAuctionCountdowns };
