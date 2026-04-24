const { SlashCommandBuilder } = require('discord.js');
const prisma = require('../../lib/prisma');
const { successEmbed, errorEmbed } = require('../utils/embedBuilder');
const config = require('../config');
const { updateUserCoins } = require('../../lib/coinHelper');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('add')
    .setDescription('Add coins to a user (Admin only)')
    .addUserOption(option => 
      option.setName('user')
        .setDescription('The user to add coins to')
        .setRequired(true))
    .addIntegerOption(option => 
      option.setName('amount')
        .setDescription('Amount of coins to add')
        .setRequired(true)),
  
  async execute(interaction) {
    await interaction.deferReply();
    
    if (!config.ADMIN_IDS.includes(interaction.user.id)) {
      return await interaction.editReply({ 
        embeds: [errorEmbed('❌ Access Denied', 'This command is for administrators only.')] 
      });
    }
    
    const targetUser = interaction.options.getUser('user');
    const amount = interaction.options.getInteger('amount');

    try {
      const user = await prisma.user.findUnique({
        where: { discordId: targetUser.id }
      });

      if (!user) {
        return await interaction.editReply({
          embeds: [errorEmbed('❌ Error', 'User not found in database!')]
        });
      }

      // Update coins using centralized function
      const coinResult = await updateUserCoins(user.id, amount, `Admin adjustment by ${interaction.user.username}`);

      if (!coinResult.success) {
        return await interaction.editReply({
          embeds: [errorEmbed('❌ Error', `Failed to add coins: ${coinResult.error}`)]
        });
      }

      await interaction.editReply({
        embeds: [successEmbed('✅ Coins Added', `Added ${amount} coins to ${targetUser.username}!`)]
      });
    } catch (err) {
      console.error('Add coins error:', err);
      await interaction.editReply({ 
        embeds: [errorEmbed('❌ Error', 'Failed to add coins!')] 
      });
    }
  }
};
