const { SlashCommandBuilder } = require('discord.js');
const prisma = require('../../lib/prisma');
const { successEmbed, errorEmbed } = require('../utils/embedBuilder');
const config = require('../config');

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
        .setRequired(false)),
  
  async execute(interaction) {
    await interaction.deferReply();
    
    if (!config.ADMIN_IDS.includes(interaction.user.id)) {
      return await interaction.editReply({ 
        embeds: [errorEmbed('❌ Access Denied', 'This command is for administrators only.')] 
      });
    }
    
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
