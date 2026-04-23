const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const prisma = require('../../lib/prisma');
const { successEmbed, errorEmbed } = require('../utils/embedBuilder');

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
          data: { coins: { increment: amount }, totalEarned: { increment: amount } }
        }),
        prisma.transaction.create({
          data: {
            userId: user.id,
            amount,
            type: 'EARN',
            description: `Admin adjustment by ${interaction.user.username}`
          }
        })
      ]);

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
