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
      Routes.applicationCommands(client.user.id),
      { body: [] }
    );

    console.log(`[DISCORD] Registering ${commands.length} slash commands globally...`);
    await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: commandData }
    );
    
    console.log('Successfully registered slash commands!');

const statuses = [
  { name: '🎯 Live Auctions', type: 3 },
  { name: '💰 MazeBids.online', type: 0 },
  { name: '🏆 Top Bidders', type: 3 },
  { name: '🎮 Earn Free Coins', type: 0 },
  { name: '⚡ Real-time Bidding', type: 3 },
  { name: '🎁 Win Amazing Prizes', type: 0 },
  { name: '🔥 Hot Auctions Live', type: 3 },
  { name: '✨ mazebids.online', type: 0 },
];

let statusIndex = 0;
const updateStatus = () => {
  const current = statuses[statusIndex % statuses.length];
  client.user.setPresence({
    activities: [{ name: current.name, type: current.type }],
    status: 'online'
  });
  statusIndex++;
};

updateStatus();
setInterval(updateStatus, 3000);
  } catch (error) {
    console.error('Error registering slash commands:', error);
  }

  const { startCountdownChecker } = require('../services/countdownService');
  startCountdownChecker();
}

module.exports = { name: 'ready', execute };
