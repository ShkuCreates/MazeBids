const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const prisma = require('../../lib/prisma');
const { successEmbed, errorEmbed } = require('../utils/embedBuilder');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('economy')
    .setDescription('View economy insights (Admin only)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  
  async execute(interaction) {
    await interaction.deferReply();
    
    try {
      const member = await interaction.guild.members.fetch(interaction.user.id);
      if (!member.permissions.has('Administrator')) {
        return await interaction.editReply({ 
          embeds: [errorEmbed('❌ Access Denied', 'This command is for administrators only.')] 
        });
      }
      
      const [
        totalCoinsResult,
        totalEarnedResult,
        totalSpentResult,
        activeUsersCount,
        totalUsersCount
      ] = await Promise.all([
        prisma.user.aggregate({ _sum: { coins: true } }),
        prisma.user.aggregate({ _sum: { totalEarned: true } }),
        prisma.user.aggregate({ _sum: { totalSpent: true } }),
        prisma.user.count({ where: { coins: { gt: 0 } } }),
        prisma.user.count()
      ]);
      
      const totalCoins = totalCoinsResult._sum.coins || 0;
      const totalEarned = totalEarnedResult._sum.totalEarned || 0;
      const totalSpent = totalSpentResult._sum.totalSpent || 0;
      
      const embed = successEmbed(
        '📊 Economy Insights',
        `**Total Coins in Circulation:** ${totalCoins.toLocaleString()}\n` +
        `**Total Coins Earned:** ${totalEarned.toLocaleString()}\n` +
        `**Total Coins Spent:** ${totalSpent.toLocaleString()}\n` +
        `**Active Users:** ${activeUsersCount}\n` +
        `**Total Users:** ${totalUsersCount}\n\n` +
        `*Circulation Rate: ${totalSpent > 0 ? ((totalCoins / totalEarned) * 100).toFixed(2) : 0}%*`
      );
      
      await interaction.editReply({ embeds: [embed] });
      
    } catch (err) {
      console.error('Economy command error:', err);
      await interaction.editReply({ 
        embeds: [errorEmbed('❌ Error', 'Failed to fetch economy data.')] 
      });
    }
  }
};
