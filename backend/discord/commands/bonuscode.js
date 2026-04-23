const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const prisma = require('../../lib/prisma');
const { successEmbed, errorEmbed } = require('../utils/embedBuilder');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('bonuscode')
    .setDescription('Create a bonus code (Admin only)')
    .addStringOption(option => 
      option.setName('code')
        .setDescription('The bonus code')
        .setRequired(true))
    .addIntegerOption(option => 
      option.setName('reward')
        .setDescription('Reward amount in coins')
        .setRequired(true))
    .addIntegerOption(option => 
      option.setName('uses')
        .setDescription('Maximum uses (default: 1)')
        .setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  
  async execute(interaction) {
    await interaction.deferReply();
    
    const code = interaction.options.getString('code');
    const reward = interaction.options.getInteger('reward');
    const uses = interaction.options.getInteger('uses') || 1;

    try {
      await prisma.bonusCode.create({
        data: {
          code: code.toUpperCase(),
          reward,
          maxUses: uses
        }
      });

      await interaction.editReply({ 
        embeds: [successEmbed('✅ Bonus Code Created', 
          `**Code:** ${code.toUpperCase()}\n**Reward:** ${reward} coins\n**Uses:** ${uses}`)] 
      });
    } catch (err) {
      console.error('Bonus code error:', err);
      await interaction.editReply({ 
        embeds: [errorEmbed('❌ Error', 'Failed to create bonus code!')] 
      });
    }
  }
};
