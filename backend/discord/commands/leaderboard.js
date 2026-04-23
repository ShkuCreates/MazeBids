const { SlashCommandBuilder } = require('discord.js');
const prisma = require('../../lib/prisma');
const { successEmbed, errorEmbed } = require('../utils/embedBuilder');
const { checkCooldown, setCooldown } = require('../utils/cooldownManager');
const config = require('../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Show the current top 5 coin holders'),
  
  async execute(interaction) {
    await interaction.deferReply();
    
    const discordId = interaction.user.id;
    const cooldownCheck = await checkCooldown(discordId, 'leaderboard', config.COMMAND_COOLDOWNS.leaderboard);
    
    if (!cooldownCheck.canUse) {
      return await interaction.editReply({ 
        embeds: [errorEmbed('⏰ Cooldown Active', `Wait ${cooldownCheck.remaining}s before trying again.`)] 
      });
    }
    
    try {
      const topCoins = await prisma.user.findMany({
        select: { username: true, coins: true },
        orderBy: { coins: 'desc' },
        take: 5
      });

      const embed = successEmbed(
        '🏆 Current Leaderboard',
        topCoins.map((u, i) => `${i + 1}. ${u.username || 'Anonymous'} - ${u.coins} coins`).join('\n')
      );

      await setCooldown(discordId, 'leaderboard', config.COMMAND_COOLDOWNS.leaderboard);
      await interaction.editReply({ embeds: [embed] });
      
    } catch (err) {
      console.error('Leaderboard command error:', err);
      await interaction.editReply({ 
        embeds: [errorEmbed('❌ Error', 'Failed to fetch leaderboard.')] 
      });
    }
  }
};
