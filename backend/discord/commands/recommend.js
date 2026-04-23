const { SlashCommandBuilder } = require('discord.js');
const prisma = require('../../lib/prisma');
const config = require('../config');
const { successEmbed, errorEmbed } = require('../utils/embedBuilder');
const { checkCooldown, setCooldown } = require('../utils/cooldownManager');
const personalityService = require('../services/personalityService');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('recommend')
    .setDescription('Get a smart auction recommendation'),
  
  async execute(interaction) {
    await interaction.deferReply();
    
    const discordId = interaction.user.id;
    const cooldownCheck = await checkCooldown(discordId, 'recommend', config.COMMAND_COOLDOWNS.recommend);
    
    if (!cooldownCheck.canUse) {
      return await interaction.editReply({ 
        embeds: [errorEmbed('⏰ Cooldown Active', `Wait ${cooldownCheck.remaining}s before trying again.`)] 
      });
    }
    
    try {
      const user = await prisma.user.findUnique({ 
        where: { discordId },
        include: { bids: true }
      });
      
      const now = new Date();
      
      let auction = null;
      
      const activeAuctions = await prisma.auction.findMany({
        where: {
          status: 'ACTIVE',
          endTime: { gt: now }
        },
        include: { highestBidder: true },
        orderBy: { endTime: 'asc' }
      });
      
      if (activeAuctions.length === 0) {
        return await interaction.editReply({ 
          embeds: [errorEmbed('😔 No Active Auctions', 'Check back later for active auctions!')] 
        });
      }
      
      if (user && user.bids.length > 0) {
        const bidAuctionIds = user.bids.map(b => b.auctionId);
        auction = activeAuctions.find(a => !bidAuctionIds.includes(a.id));
      }
      
      if (!auction) {
        auction = activeAuctions[Math.floor(Math.random() * activeAuctions.length)];
      }
      
      const timeLeft = Math.floor((new Date(auction.endTime) - now) / 1000);
      const minutes = Math.floor(timeLeft / 60);
      const seconds = timeLeft % 60;
      
      const embed = successEmbed(
        '🎯 Recommended Auction',
        `${personalityService.getRecommendResponse()}\n\n` +
        `**${auction.title}**\n` +
        `💰 Current Bid: ${auction.currentBid} coins\n` +
        `⏱️ Time Left: ${minutes}m ${seconds}s\n` +
        `📦 ${auction.product}\n\n` +
        `*Join the auction on MazeBids.com!*`
      );
      
      if (auction.image) {
        embed.setImage(auction.image);
      }
      
      await setCooldown(discordId, 'recommend', config.COMMAND_COOLDOWNS.recommend);
      await interaction.editReply({ embeds: [embed] });
      
    } catch (err) {
      console.error('Recommend command error:', err);
      await interaction.editReply({ 
        embeds: [errorEmbed('❌ Error', 'Failed to get recommendation.')] 
      });
    }
  }
};
