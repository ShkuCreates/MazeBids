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

    console.log('[GenBonus] User ID:', interaction.user.id);
    console.log('[GenBonus] ADMIN_IDS:', config.ADMIN_IDS);
    console.log('[GenBonus] Is admin:', config.ADMIN_IDS.includes(interaction.user.id));

    if (!config.ADMIN_IDS.includes(interaction.user.id)) {
      console.log('[GenBonus] Access denied - user not in ADMIN_IDS');
      return await interaction.editReply({
        embeds: [errorEmbed('❌ Access Denied', 'This command is for administrators only.')]
      });
    }

    const customCode = interaction.options.getString('code');
    const reward = interaction.options.getInteger('reward');
    const uses = interaction.options.getInteger('uses') || 1;

    // Auto-generate code if not provided
    const code = customCode && customCode.trim()
      ? customCode.trim().toUpperCase()
      : crypto.randomBytes(4).toString('hex').toUpperCase();

    try {
      console.log('[GenBonus] Creating code:', code, 'reward:', reward, 'uses:', uses);

      await prisma.bonusCode.create({
        data: {
          code,
          reward,
          maxUses: uses
        }
      });

      console.log('[GenBonus] Code created successfully');

      await interaction.editReply({
        embeds: [successEmbed('✅ Bonus Code Created',
          `**Code:** \`${code}\`\n**Reward:** ${reward} coins\n**Uses:** ${uses}\n**Type:** ${customCode ? 'Custom' : 'Auto-generated'}`)]
      });
    } catch (err) {
      console.error('[GenBonus] Error creating code:', err);
      const errorMessage = err.code === 'P2002'
        ? 'That code already exists. Please use a different code.'
        : err.message || 'Unknown error';
      await interaction.editReply({
        embeds: [errorEmbed('❌ Error', `Failed to create bonus code: ${errorMessage}`)]
      });
    }
  }
};
