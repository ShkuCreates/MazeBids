const { REST, Routes } = require('discord.js');
const config = require('../config');
const commands = require('../commands/index');
console.log('[DISCORD] Commands loaded:', commands.length);

async function execute(client) {
  console.log(`Discord bot ready as ${client.user.tag}`);
  
  global.discordClient = client;
  
  const commandData = commands.map(cmd => cmd.data.toJSON());
  console.log('[DISCORD] Registering commands:', commandData.map(c => c.name));
  
  try {
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    
    console.log('Clearing existing slash commands...');
    await rest.put(
      Routes.applicationGuildCommands(client.user.id, config.MAIN_GUILD_ID),
      { body: [] }
    );

    console.log(`[DISCORD] Registering ${commands.length} slash commands...`);
    await rest.put(
      Routes.applicationGuildCommands(client.user.id, config.MAIN_GUILD_ID),
      { body: commandData }
    );
    
    console.log('Successfully registered slash commands!');
    client.user.setActivity('MazeBids.com | /daily', { type: 3 });
  } catch (error) {
    console.error('Error registering slash commands:', error);
  }
  
  setInterval(() => {
    const status = config.STATUSES[Math.floor(Math.random() * config.STATUSES.length)];
    client.user.setActivity(status.name, { type: status.type });
  }, 120000);
  
  const { startCountdownChecker } = require('../services/countdownService');
  startCountdownChecker();
}

module.exports = { name: 'ready', execute };
