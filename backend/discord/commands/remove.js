const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const prisma = require('../../lib/prisma');
const { successEmbed, errorEmbed } = require('../utils/embedBuilder');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('remove')
    .setDescription('Remove coins from a user (Admin only)')
    .addUserOption(option => 
      option.setName('user')
        .setDescription('The user to remove coins from')
        .setRequired(true))
    .addIntegerOption(option => 
      option.setName('amount')
        .setDescription('Amount of coins to remove')
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  
  async execute(interaction) {
    await interaction.deferReply();
    
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

      await prisma.$transaction([
        prisma.user.update({
          where: { id: user.id },
          data: { coins: { decrement: amount }, totalSpent: { increment: amount } }
        }),
        prisma.transaction.create({
          data: {
            userId: user.id,
            amount,
            type: 'SPEND',
            description: `Admin adjustment by ${interaction.user.username}`
          }
        })
      ]);

      await interaction.editReply({ 
        embeds: [successEmbed('✅ Coins Removed', `Removed ${amount} coins from ${targetUser.username}!`)] 
      });
    } catch (err) {
      console.error('Remove coins error:', err);
      await interaction.editReply({ 
        embeds: [errorEmbed('❌ Error', 'Failed to remove coins!')] 
      });
    }
  }
};
