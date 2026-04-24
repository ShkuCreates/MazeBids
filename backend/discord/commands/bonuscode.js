const { SlashCommandBuilder } = require('discord.js');
const prisma = require('../../lib/prisma');
const { successEmbed, errorEmbed } = require('../utils/embedBuilder');
const config = require('../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('genbonus')
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
    
    console.log('[GenBonus] User ID:', interaction.user.id);
    console.log('[GenBonus] ADMIN_IDS:', config.ADMIN_IDS);
    console.log('[GenBonus] Is admin:', config.ADMIN_IDS.includes(interaction.user.id));
    
    if (!config.ADMIN_IDS.includes(interaction.user.id)) {
      console.log('[GenBonus] Access denied - user not in ADMIN_IDS');
      return await interaction.editReply({ 
        embeds: [errorEmbed('❌ Access Denied', 'This command is for administrators only.')] 
      });
    }
    
    const code = interaction.options.getString('code');
    const reward = interaction.options.getInteger('reward');
    const uses = interaction.options.getInteger('uses') || 1;

    try {
      console.log('[GenBonus] Creating code:', code.toUpperCase(), 'reward:', reward, 'uses:', uses);
      
      await prisma.bonusCode.create({
        data: {
          code: code.toUpperCase(),
          reward,
          maxUses: uses
        }
      });

      console.log('[GenBonus] Code created successfully');
      
      await interaction.editReply({ 
        embeds: [successEmbed('✅ Bonus Code Created', 
          `**Code:** ${code.toUpperCase()}\n**Reward:** ${reward} coins\n**Uses:** ${uses}`)] 
      });
    } catch (err) {
      console.error('[GenBonus] Error creating code:', err);
      const errorMessage = err.message || 'Unknown error';
      await interaction.editReply({ 
        embeds: [errorEmbed('❌ Error', `Failed to create bonus code: ${errorMessage}`)] 
      });
    }
  }
};
