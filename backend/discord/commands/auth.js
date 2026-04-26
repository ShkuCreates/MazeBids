const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const prisma = require('../../lib/prisma');
const { successEmbed, errorEmbed } = require('../utils/embedBuilder');
const config = require('../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('auth')
    .setDescription('Re-invite all registered users back to the server (Admin only)'),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    if (!config.ADMIN_IDS.includes(interaction.user.id)) {
      return await interaction.editReply({
        embeds: [errorEmbed('❌ Access Denied', 'This command is for administrators only.')]
      });
    }

    try {
      const guild = interaction.guild;
      if (!guild) {
        return await interaction.editReply({
          embeds: [errorEmbed('❌ Error', 'This command must be used in a server.')]
        });
      }

      const users = await prisma.user.findMany({
        select: { discordId: true, username: true }
      });

      let added = 0;
      let alreadyIn = 0;
      let failed = 0;

      for (const user of users) {
        try {
          const member = await guild.members.fetch(user.discordId).catch(() => null);
          if (member) {
            alreadyIn++;
            continue;
          }

          await guild.members.add(user.discordId, {
            accessToken: null
          }).catch(() => null);

          added++;
        } catch (err) {
          failed++;
        }
      }

      await interaction.editReply({
        embeds: [successEmbed('✅ Auth Complete',
          `**Total Users in DB:** ${users.length}\n**Already in Server:** ${alreadyIn}\n**Re-added:** ${added}\n**Failed:** ${failed}\n\n*Note: Re-adding requires users to have authorized the bot with guilds.join scope.*` 
        )]
      });
    } catch (err) {
      console.error('[Auth] Error:', err);
      await interaction.editReply({
        embeds: [errorEmbed('❌ Error', `Failed to run auth: ${err.message}`)]
      });
    }
  }
};
