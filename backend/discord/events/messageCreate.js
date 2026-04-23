const prisma = require('../../lib/prisma');
const config = require('../config');
const { antiSpam } = require('../utils/cooldownManager');
const { processChatReward } = require('../services/chatRewardService');

async function execute(message) {
  if (message.author.bot) return;
  if (message.guild.id !== config.MAIN_GUILD_ID) return;
  
  const discordId = message.author.id;
  
  if (antiSpam.isSpam(discordId, message.content)) {
    return;
  }
  
  antiSpam.cleanup(discordId);
  
  const reward = await processChatReward(discordId, message.author.username);
  
  if (reward && reward > 0) {
    try {
      await message.react('💰');
    } catch (err) {
      console.error('Reaction error:', err);
    }
  }
}

module.exports = { name: 'messageCreate', execute };
