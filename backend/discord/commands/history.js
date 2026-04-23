const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const prisma = require('../../lib/prisma');
const { successEmbed, errorEmbed } = require('../utils/embedBuilder');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('history')
    .setDescription('View your transaction history'),
  
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
      
      const transactions = await prisma.transaction.findMany({
        where: { userId: user.id },
        orderBy: { timestamp: 'desc' },
        take: 10
      });
      
      if (transactions.length === 0) {
        return await interaction.editReply({ 
          embeds: [errorEmbed('📭 No History', 'You have no transactions yet.')] 
        });
      }
      
      const historyText = transactions.map((t, i) => {
        const icon = t.type === 'EARN' ? '💰' : '💸';
        const sign = t.type === 'EARN' ? '+' : '-';
        const time = new Date(t.timestamp).toLocaleDateString();
        return `${i + 1}. ${icon} ${sign}${t.amount} - ${t.description} (${time})`;
      }).join('\n');
      
      const embed = successEmbed(
        '📜 Transaction History',
        `**Last 10 Transactions:**\n\n${historyText}`
      );
      
      await interaction.editReply({ embeds: [embed] });
      
    } catch (err) {
      console.error('History command error:', err);
      await interaction.editReply({ 
        embeds: [errorEmbed('❌ Error', 'Failed to fetch transaction history.')] 
      });
    }
  }
};
