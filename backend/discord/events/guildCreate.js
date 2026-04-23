const config = require('../config');

async function execute(guild) {
  if (guild.id !== config.MAIN_GUILD_ID) {
    try {
      console.log(`Unauthorized guild ${guild.name} (${guild.id}). Leaving...`);
      await guild.leave();
    } catch (err) {
      console.error('Guild leave error:', err);
    }
  }
}

module.exports = { name: 'guildCreate', execute };
