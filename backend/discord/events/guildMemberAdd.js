const config = require('../config');

async function execute(member) {
  if (member.guild.id !== config.MAIN_GUILD_ID) return;
  
  try {
    const channel = await member.client.channels.fetch(config.WELCOME_CHANNEL_ID);
    const welcome = config.WELCOMES[Math.floor(Math.random() * config.WELCOMES.length)].replace('{user}', `<@${member.id}>`);
    await channel.send(welcome);
    
    const roleId = '1496042141015736422';
    const role = member.guild.roles.cache.get(roleId);
    if (role) await member.roles.add(role);
  } catch (err) {
    console.error('Welcome/auto-role error:', err);
  }
}

module.exports = { name: 'guildMemberAdd', execute };
