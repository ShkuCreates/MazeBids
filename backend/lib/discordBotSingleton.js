require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const prisma = require('./prisma');
const cron = require('node-cron');

// Config
const MAIN_GUILD_ID = process.env.MAZEBIDS_GUILD_ID || '1430842081865371821';
const WELCOME_CHANNEL_ID = process.env.WELCOME_CHANNEL_ID || '1496049411258581052';
const LEADERBOARD_CHANNEL_ID = process.env.LEADERBOARD_CHANNEL_ID || '1496048643969650759';

// Random welcomes
const welcomes = [
  'Welcome to MazeBids! 🚀',
  'Hey {user}, great to have you! 🎉',
  'New adventurer {user} has arrived! 🗺️',
  'Welcome aboard {user}! ⚡',
  'Hello {user}, let the bids begin! 💰',
  'Yo {user}, ready to win big? 🏆'
];

// Random statuses
const statuses = [
  { name: 'MazeBids Auctions', type: 0 },
  { name: 'your bids', type: 2 },
  { name: 'fast auctions', type: 3 },
  { name: 'to earn coins', type: 5 },
  { name: 'top bidders', type: 2 },
  { name: 'MazeBids.com', type: 0 },
  { name: 'live auctions', type: 1 },
  { name: 'coin grind', type: 0 },
  { name: 'Discord auctions', type: 2 }
];

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildInvites
  ]
});

client.on('error', (error) => console.error('Discord bot error:', error.message));

// Prevent invite to wrong server
client.on('guildCreate', async (guild) => {
  if (guild.id !== MAIN_GUILD_ID) {
    try {
      console.log(`Unauthorized guild ${guild.name} (${guild.id}). Leaving...`);
      await guild.leave();
    } catch (err) {
      console.error('Guild leave error:', err);
    }
  }
});

// Welcome message
client.on('guildMemberAdd', async (member) => {
  if (member.guild.id !== MAIN_GUILD_ID) return;
  try {
    const channel = await client.channels.fetch(WELCOME_CHANNEL_ID);
    const welcome = welcomes[Math.floor(Math.random() * welcomes.length)].replace('{user}', `<@${member.id}>`);
    await channel.send(welcome);
    // Auto-role
    const roleId = '1496042141015736422';
    const role = member.guild.roles.cache.get(roleId);
    if (role) await member.roles.add(role);
  } catch (err) {
    console.error('Welcome/auto-role error:', err);
  }
});

// Daily leaderboard 10PM IST
cron.schedule('30 16 * * *', async () => {
  try {
    const channel = await client.channels.fetch(LEADERBOARD_CHANNEL_ID);
    const topCoins = await prisma.user.findMany({
      select: { username: true, coins: true, discordId: true },
      orderBy: { coins: 'desc' },
      take: 5
    });

    const embed = new EmbedBuilder()
      .setTitle('🏆 Daily Top 5 Coin Holders 🏆')
      .setDescription(topCoins.map((u, i) => `${i+1}. **${u.username || `User ${u.discordId}`}** - ${u.coins} coins`).join('\n') || 'No data')
      .setColor('#8b5cf6')
      .setTimestamp();

    await channel.send({ embeds: [embed] });
  } catch (err) {
    console.error('Leaderboard cron error:', err);
  }
}, { timezone: 'Asia/Kolkata' });

// Status rotation
setInterval(() => {
  const status = statuses[Math.floor(Math.random() * statuses.length)];
  client.user.setActivity(status.name, { type: status.type });
}, 120000);

// Slash commands
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const { commandName } = interaction;

  if (commandName === 'leaderboard') {
    const topCoins = await prisma.user.findMany({
      select: { username: true, coins: true },
      orderBy: { coins: 'desc' },
      take: 5
    });

    const embed = new EmbedBuilder()
      .setTitle('🏆 Current Leaderboard 🏆')
      .setDescription(topCoins.map((u, i) => `${i+1}. ${u.username || 'Anonymous'} - ${u.coins} coins`).join('\n'))
      .setColor('#00d4ff')
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
});

async function sendAuctionNotification(discordId, auction) {
  try {
    const user = await client.users.fetch(discordId);
    await user.send(`🔔 New auction: **${auction.title}** started!\nCurrent bid: ${auction.currentBid} coins`);
  } catch (err) {
    console.error(`Notify ${discordId} failed:`, err.message);
  }
}

async function announceWinner(auction, winner) {
  try {
    const channel = await client.channels.fetch(LEADERBOARD_CHANNEL_ID);
    const embed = new EmbedBuilder()
      .setTitle('🎉 Auction Won! 🎉')
      .setDescription(`**${winner.username}** won **${auction.title}** with ${auction.currentBid} coins!`)
      .setColor('#10b981')
      .setTimestamp();

    await channel.send({ embeds: [embed] });
  } catch (err) {
    console.error('Announce winner error:', err);
  }
}

async function sendNotificationStatusUpdate(discordId, enabled) {
  try {
    const user = await client.users.fetch(discordId);
    const status = enabled ? 'enabled' : 'disabled';
    await user.send(`✅ Auction notifications **${status}**`);
  } catch (err) {
    console.error(`Status update DM failed:`, err.message);
  }
}

async function initBot() {
  try {
    if (!process.env.DISCORD_TOKEN) {
      console.warn('⚠️ DISCORD_TOKEN not set. Discord bot will not connect.');
      return;
    }
    await client.login(process.env.DISCORD_TOKEN);
    console.log('✅ Discord bot logged in');
  } catch (err) {
    console.error('Bot login failed:', err.message);
  }
}

initBot();

module.exports = { client, sendAuctionNotification, announceWinner, sendNotificationStatusUpdate };

