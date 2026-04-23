const { SlashCommandBuilder } = require('discord.js');
const prisma = require('../../lib/prisma');
const config = require('../config');
const { successEmbed, errorEmbed } = require('../utils/embedBuilder');
const personalityService = require('../services/personalityService');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('streak')
    .setDescription('View your daily claim streak'),
  
  async execute(interaction) {
    await interaction.deferReply();
    
    const discordId = interaction.user.id;
    
    try {
      const user = await prisma.user.findUnique({ where: { discordId } });
      
      if (!user) {
        return await interaction.editReply({ 
          embeds: [errorEmbed('❌ Error', 'User not found. Please register on the website first.')] 
        });
      }
      
      const dailyReward = await prisma.dailyReward.findUnique({ where: { userId: user.id } });
      
      const streak = dailyReward?.streak || 0;
      const totalClaims = dailyReward?.totalClaims || 0;
      const lastClaim = dailyReward?.lastClaimedAt ? new Date(dailyReward.lastClaimedAt) : null;
      
      const now = new Date();
      const canClaim = !lastClaim || (now - lastClaim) / (1000 * 60 * 60) >= config.DAILY_COOLDOWN_HOURS;
      
      const currentBonus = Math.min(streak * config.DAILY_STREAK_BONUS, config.DAILY_STREAK_MAX_BONUS);
      const currentReward = config.DAILY_BASE_REWARD + currentBonus;
      
      const nextStreakBonus = Math.min((streak + 1) * config.DAILY_STREAK_BONUS, config.DAILY_STREAK_MAX_BONUS);
      const nextReward = config.DAILY_BASE_REWARD + nextStreakBonus;
      
      let status = canClaim ? '✅ Ready to claim!' : '⏰ Already claimed today';
      
      const embed = successEmbed(
        '🔥 Your Streak',
        `${personalityService.getStreakResponse()}\n\n` +
        `**Current Streak:** ${streak} day${streak !== 1 ? 's' : ''}\n` +
        `**Total Claims:** ${totalClaims}\n` +
        `**Current Reward:** ${currentReward} coins\n` +
        `**Next Reward:** ${nextReward} coins\n\n` +
        `**Status:** ${status}`
      );
      
      await interaction.editReply({ embeds: [embed] });
      
    } catch (err) {
      console.error('Streak command error:', err);
      await interaction.editReply({ 
        embeds: [errorEmbed('❌ Error', 'Failed to fetch streak data.')] 
      });
    }
  }
};
