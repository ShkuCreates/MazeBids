const { SlashCommandBuilder } = require('discord.js');
const crypto = require('crypto');
const prisma = require('../../lib/prisma');
const { successEmbed, errorEmbed } = require('../utils/embedBuilder');
const config = require('../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('genbonus')
    .setDescription('Create a bonus code (Admin only)')
    .addIntegerOption(option =>
      option.setName('reward')
        .setDescription('Reward amount in coins')
        .setRequired(true))
    .addIntegerOption(option =>
      option.setName('uses')
        .setDescription('Maximum uses (default: 1)')
        .setRequired(false))
    .addStringOption(option =>
      option.setName('code')
        .setDescription('Custom code (optional - auto-generated if not provided)')
        .setRequired(false)),

  async execute(interaction) {
    await interaction.deferReply();

    if (!config.ADMIN_IDS.includes(interaction.user.id)) {
      return await interaction.editReply({
        embeds: [errorEmbed('❌ Access Denied', 'This command is for administrators only.')]
      });
    }

    const reward = interaction.options.getInteger('reward');
    const uses = interaction.options.getInteger('uses') || 1;
    const customCode = interaction.options.getString('code');

    if (!reward || reward <= 0) {
      return await interaction.editReply({
        embeds: [errorEmbed('❌ Error', 'Reward must be a positive number.')]
      });
    }

    const code = customCode && customCode.trim()
      ? customCode.trim().toUpperCase()
      : crypto.randomBytes(4).toString('hex').toUpperCase();

    try {
      await prisma.bonusCode.create({
        data: { code, reward, maxUses: uses }
      });

      await interaction.editReply({
        embeds: [successEmbed('✅ Bonus Code Created',
          `**Code:** \`${code}\`\n**Reward:** ${reward} coins\n**Max Uses:** ${uses}\n**Type:** ${customCode ? 'Custom' : 'Auto-generated'}`)]
      });
    } catch (err) {
      const errorMessage = err.code === 'P2002'
        ? 'That code already exists. Use a different code.'
        : err.message || 'Unknown error';
      await interaction.editReply({
        embeds: [errorEmbed('❌ Error', `Failed to create bonus code: ${errorMessage}`)]
      });
    }
  }
};
