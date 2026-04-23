const { SlashCommandBuilder } = require('discord.js');
const prisma = require('../../lib/prisma');
const config = require('../config');
const { successEmbed, errorEmbed, infoEmbed } = require('../utils/embedBuilder');
const { checkCooldown, setCooldown } = require('../utils/cooldownManager');
const personalityService = require('../services/personalityService');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('daily')
    .setDescription('Claim your daily coin reward'),
  
  async execute(interaction) {
    await interaction.deferReply();
    
    const discordId = interaction.user.id;
    const cooldownCheck = await checkCooldown(discordId, 'daily', config.COMMAND_COOLDOWNS.daily);
    
    if (!cooldownCheck.canUse) {
      const hours = Math.floor(cooldownCheck.remaining / 3600);
      const minutes = Math.floor((cooldownCheck.remaining % 3600) / 60);
      return await interaction.editReply({ 
        embeds: [errorEmbed('⏰ Cooldown Active', `Come back in ${hours}h ${minutes}m!`)] 
      });
    }
    
    try {
      const user = await prisma.user.findUnique({ where: { discordId } });
      
      if (!user) {
        return await interaction.editReply({ 
          embeds: [errorEmbed('❌ Error', 'User not found. Please register on the website first.')] 
        });
      }
      
      const dailyReward = await prisma.dailyReward.findUnique({ where: { userId: user.id } });
      const now = new Date();
      const lastClaim = dailyReward ? new Date(dailyReward.lastClaimedAt) : new Date(0);
      const hoursSinceClaim = (now - lastClaim) / (1000 * 60 * 60);
      
      if (hoursSinceClaim < config.DAILY_COOLDOWN_HOURS) {
        const hoursLeft = Math.ceil(config.DAILY_COOLDOWN_HOURS - hoursSinceClaim);
        return await interaction.editReply({ 
          embeds: [errorEmbed('⏰ Already Claimed', `You already claimed today. Come back in ${hoursLeft}h!`)] 
        });
      }
      
      let streak = dailyReward ? dailyReward.streak : 0;
      const hoursMissed = hoursSinceClaim - config.DAILY_COOLDOWN_HOURS;
      
      if (hoursMissed > 24) {
        streak = 0;
      } else {
        streak += 1;
      }
      
      const streakBonus = Math.min(streak * config.DAILY_STREAK_BONUS, config.DAILY_STREAK_MAX_BONUS);
      const totalReward = config.DAILY_BASE_REWARD + streakBonus;
      
      await prisma.$transaction([
        prisma.user.update({
          where: { id: user.id },
          data: { 
            coins: { increment: totalReward },
            totalEarned: { increment: totalReward }
          }
        }),
        prisma.transaction.create({
          data: {
            userId: user.id,
            amount: totalReward,
            type: 'EARN',
            description: 'Daily reward claim'
          }
        }),
        prisma.dailyReward.upsert({
          where: { userId: user.id },
          update: {
            lastClaimedAt: now,
            streak,
            totalClaims: { increment: 1 }
          },
          create: {
            userId: user.id,
            lastClaimedAt: now,
            streak,
            totalClaims: 1
          }
        })
      ]);
      
      const nextStreakBonus = Math.min((streak + 1) * config.DAILY_STREAK_BONUS, config.DAILY_STREAK_MAX_BONUS);
      const nextReward = config.DAILY_BASE_REWARD + nextStreakBonus;
      
      const embed = successEmbed(
        '💰 Daily Claimed!',
        `${personalityService.getDailyResponse()}\n\n` +
        `**Coins Earned:** ${totalReward}\n` +
        `**Current Streak:** 🔥 ${streak} day${streak !== 1 ? 's' : ''}\n` +
        `**Streak Bonus:** +${streakBonus} coins\n\n` +
        `*Next reward: ${nextReward} coins (in 24h)*`
      );
      
      await setCooldown(discordId, 'daily', config.COMMAND_COOLDOWNS.daily);
      await interaction.editReply({ embeds: [embed] });
      
    } catch (err) {
      console.error('Daily command error:', err);
      await interaction.editReply({ 
        embeds: [errorEmbed('❌ Error', 'Failed to claim daily reward.')] 
      });
    }
  }
};
