const { EmbedBuilder } = require('discord.js');
const prisma = require('../../lib/prisma');
const { buildEmbed } = require('../utils/embedBuilder');
const personalityService = require('./personalityService');

async function sendDM(discordId, embed) {
  try {
    const user = await global.discordClient.users.fetch(discordId);
    await user.send({ embeds: [embed] });
    return true;
  } catch (err) {
    console.error(`DM failed for ${discordId}:`, err.message);
    return false;
  }
}

async function sendOutbidAlert(user, auction, newBid) {
  const dbUser = await prisma.user.findUnique({
    where: { discordId: user.discordId }
  });
  
  if (!dbUser?.notifications) return false;
  
  const embed = buildEmbed({
    title: '⚠️ You’ve Been Outbid!',
    description: `${personalityService.getOutbidResponse()}\n\n**Auction:** ${auction.title}\n**New Bid:** ${newBid} coins\n**Your Bid:** ${auction.currentBid} coins`,
    color: '#f59e0b',
    thumbnail: auction.image,
    footer: 'React fast to reclaim your spot!'
  });
  
  return await sendDM(user.discordId, embed);
}

async function sendWinAlert(user, auction) {
  const dbUser = await prisma.user.findUnique({
    where: { discordId: user.discordId }
  });
  
  if (!dbUser?.notifications) return false;
  
  const embed = buildEmbed({
    title: '🎉 Congratulations! You Won!',
    description: `${personalityService.getWinningResponse()}\n\n**Product:** ${auction.title}\n**Winning Bid:** ${auction.currentBid} coins`,
    color: '#10b981',
    image: auction.image,
    footer: 'Amazing win! Your coins were well spent!'
  });
  
  return await sendDM(user.discordId, embed);
}

async function sendBonusReward(user, amount, reason) {
  const dbUser = await prisma.user.findUnique({
    where: { discordId: user.discordId }
  });
  
  if (!dbUser?.notifications) return false;
  
  const embed = buildEmbed({
    title: '🎁 Bonus Reward!',
    description: `You received **${amount} coins**!\n\n**Reason:** ${reason}`,
    color: '#8b5cf6',
    footer: 'Keep earning!'
  });
  
  return await sendDM(user.discordId, embed);
}

async function sendDailyReminder(user) {
  const dbUser = await prisma.user.findUnique({
    where: { discordId: user.discordId }
  });
  
  if (!dbUser?.notifications) return false;
  
  const embed = buildEmbed({
    title: '💰 Daily Reward Available!',
    description: `${personalityService.getDailyResponse()}\n\nUse `/daily` to claim your coins!`,
    color: '#fbbf24',
    footer: 'Don\'t miss out on your streak!'
  });
  
  return await sendDM(user.discordId, embed);
}

module.exports = {
  sendDM,
  sendOutbidAlert,
  sendWinAlert,
  sendBonusReward,
  sendDailyReminder
};
