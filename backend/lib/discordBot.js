require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder, REST, Routes, ApplicationCommandOptionType, PermissionFlagsBits, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js');
const prisma = require('./prisma');
const cron = require('node-cron');
const crypto = require('crypto');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildInvites
  ]
});

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
  { name: 'MazeBids Auctions', type: 0 }, // Playing
  { name: 'your bids', type: 2 }, // Listening
  { name: 'fast auctions', type: 3 }, // Watching
  { name: 'to earn coins', type: 5 }, // Competing
  { name: 'top bidders', type: 2 }, // Listening
  { name: 'MazeBids.com', type: 0 },
  { name: 'live auctions', type: 1 }, // Streaming
  { name: 'coin grind', type: 0 },
  { name: 'Discord auctions', type: 2 }
];

client.on('error', (error) => console.error('Discord bot WebSocket error:', error.message));

// 1. Prevent invite to wrong server
client.on('guildCreate', async (guild) => {
  if (guild.id !== MAIN_GUILD_ID) {
    try {
      console.log(`Bot invited to unauthorized server: ${guild.name} (${guild.id}). Leaving...`);
      
      // Find inviter (approximation - recent audit log)
      const auditLogs = await guild.fetchAuditLogs({ type: 'BOT_ADD', limit: 1 });
      const entry = auditLogs.entries.first();
      const inviter = entry?.executor;

      if (inviter) {
        try {
          await inviter.send("You Can't invite me to other servers. Sorry! 😔 Use only in MazeBids main server.");
        } catch (dmErr) {
          console.log('Could not DM inviter');
        }
      }

      await guild.leave();
    } catch (err) {
      console.error('Error handling unauthorized guild:', err);
    }
  }
});

// 2. Welcome message
client.on('guildMemberAdd', async (member) => {
  if (member.guild.id !== MAIN_GUILD_ID) return;

  try {
    const channel = await client.channels.fetch(WELCOME_CHANNEL_ID);
    const welcome = welcomes[Math.floor(Math.random() * welcomes.length)].replace('{user}', `<@${member.id}>`);
    await channel.send(welcome);
  } catch (err) {
    console.error('Welcome message error:', err);
  }
});

// 3. Daily leaderboard at 10PM IST (16:30 UTC)
cron.schedule('30 16 * * *', async () => {
  try {
    const channel = await client.channels.fetch(LEADERBOARD_CHANNEL_ID);
    
    // Top coins
    const topCoins = await prisma.user.findMany({
      select: { username: true, coins: true, discordId: true },
      orderBy: { coins: 'desc' },
      take: 5
    });

    // Top auction winners (count wonAuctions)
    const topWinners = await prisma.user.findMany({
      select: { username: true, discordId: true },
      orderBy: { wonAuctions: { _count: 'desc' } },
      take: 5
    });

    // Top consistent (most transactions)
    const topConsistent = await prisma.user.findMany({
      select: { username: true, discordId: true },
      orderBy: { transactions: { _count: 'desc' } },
      take: 5
    });

    const embed = new EmbedBuilder()
      .setTitle('🏆 Daily MazeBids Leaderboard 🏆')
      .setDescription('**Select a category below:**')
      .setColor('#8b5cf6')
      .setTimestamp();

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('leaderboard_select')
      .setPlaceholder('Choose leaderboard type...')
      .addOptions([
        new StringSelectMenuOptionBuilder()
          .setLabel('Top Coins Holders')
          .setValue('coins'),
        new StringSelectMenuOptionBuilder()
          .setLabel('Top Auction Winners')
          .setValue('winners'),
        new StringSelectMenuOptionBuilder()
          .setLabel('Most Consistent Users')
          .setValue('consistent')
      ]);

    const row = new ActionRowBuilder().addComponents(selectMenu);

    await channel.send({ embeds: [embed], components: [row] });
  } catch (err) {
    console.error('Leaderboard cron error:', err);
  }
}, { timezone: 'Asia/Kolkata' });

// 4. Status rotation every 2 min
setInterval(() => {
  const status = statuses[Math.floor(Math.random() * statuses.length)];
  client.user.setActivity(status.name, { type: status.type });
}, 120000);

// Existing auto-role
client.on('guildMemberAdd', async (member) => {
  const roleId = '1496042141015736422';
  try {
    const role = member.guild.roles.cache.get(roleId);
    if (role) {
      await member.roles.add(role);
    }
  } catch (error) {
    console.error('Auto-role error:', error);
  }
});

// Existing slash commands & other logic (add /leaderboard here too)
const commands = [
  // existing commands...
  {
    name: 'leaderboard',
    description: 'View daily leaderboards',
  }
];

// Rest of existing code: registerCommands, interactionCreate, sendAuctionNotification, announceWinner, loginWithRetry...

// ... (append existing slash command handling, exports, etc.)

module.exports = { client, sendAuctionNotification, announceWinner, sendNotificationStatusUpdate };

