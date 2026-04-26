const { SlashCommandBuilder } = require('discord.js');
const prisma = require('../../lib/prisma');
const { successEmbed, errorEmbed } = require('../utils/embedBuilder');
const config = require('../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('authinfo')
    .setDescription('Show how many users are in DB vs in server (Admin only)'),

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

      const dbUsers = await prisma.user.findMany({
        select: { discordId: true }
      });

      await guild.members.fetch();
      const guildMemberCount = guild.memberCount;

      let inServer = 0;
      let notInServer = 0;

      for (const user of dbUsers) {
        const member = guild.members.cache.get(user.discordId);
        if (member) {
          inServer++;
        } else {
          notInServer++;
        }
      }

      await interaction.editReply({
        embeds: [successEmbed('📊 Auth Info',
          `**Total Registered Users:** ${dbUsers.length}\n**Currently in Server:** ${inServer}\n**Not in Server:** ${notInServer}\n**Server Total Members:** ${guildMemberCount}\n\n*Use /auth to re-invite missing users.*` 
        )]
      });
    } catch (err) {
      console.error('[AuthInfo] Error:', err);
      await interaction.editReply({
        embeds: [errorEmbed('❌ Error', `Failed to fetch info: ${err.message}`)]
      });
    }
  }
};
