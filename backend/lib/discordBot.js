require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder, REST, Routes, ApplicationCommandOptionType, PermissionFlagsBits, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js');
const prisma = require('./prisma');
const cron = require('node-cron');

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

client.on('error', (error) => console.error('Discord bot error:', error.message));

// Bot ready event - set up status rotation, register commands, and log ready
client.on('ready', async () => {
  console.log(`Discord bot ready as ${client.user.tag}`);
  
  // Register slash commands
  const commands = [
    {
      name: 'leaderboard',
      description: 'Show the current top 5 coin holders'
    },
    {
      name: 'add',
      description: 'Add coins to a user (Admin only)',
      options: [
        {
          name: 'user',
          description: 'The user to add coins to',
          type: ApplicationCommandOptionType.User,
          required: true
        },
        {
          name: 'amount',
          description: 'Amount of coins to add',
          type: ApplicationCommandOptionType.Integer,
          required: true
        }
      ]
    },
    {
      name: 'remove',
      description: 'Remove coins from a user (Admin only)',
      options: [
        {
          name: 'user',
          description: 'The user to remove coins from',
          type: ApplicationCommandOptionType.User,
          required: true
        },
        {
          name: 'amount',
          description: 'Amount of coins to remove',
          type: ApplicationCommandOptionType.Integer,
          required: true
        }
      ]
    },
    {
      name: 'bonuscode',
      description: 'Create a bonus code (Admin only)',
      options: [
        {
          name: 'code',
          description: 'The bonus code',
          type: ApplicationCommandOptionType.String,
          required: true
        },
        {
          name: 'reward',
          description: 'Reward amount in coins',
          type: ApplicationCommandOptionType.Integer,
          required: true
        },
        {
          name: 'uses',
          description: 'Maximum uses (default: 1)',
          type: ApplicationCommandOptionType.Integer,
          required: false
        }
      ]
    }
  ];

  try {
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    
    await rest.put(
      Routes.applicationGuildCommands(client.user.id, MAIN_GUILD_ID),
      { body: commands }
    );
    
    console.log('Successfully registered slash commands!');
  } catch (error) {
    console.error('Error registering slash commands:', error);
  }
  
  // Status rotation - only start after bot is ready
  setInterval(() => {
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    client.user.setActivity(status.name, { type: status.type });
  }, 120000);
});

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
    
    // Get top 5 coin holders
    const topCoins = await prisma.user.findMany({
      select: { username: true, coins: true, discordId: true },
      orderBy: { coins: 'desc' },
      take: 5
    });

    // Get top 5 auction winners (count of won auctions)
    const topWinners = await prisma.user.findMany({
      select: { 
        username: true, 
        discordId: true,
        _count: {
          select: { wonAuctions: true }
        }
      },
      where: {
        wonAuctions: {
          some: {}
        }
      },
      orderBy: {
        wonAuctions: {
          _count: 'desc'
        }
      },
      take: 5
    });

    // Create embed for coin leaderboard
    const coinsEmbed = new EmbedBuilder()
      .setTitle('🏆 Daily Top 5 Coin Holders 🏆')
      .setDescription(topCoins.map((u, i) => `${i+1}. **${u.username || `User ${u.discordId}`}** - ${u.coins} coins`).join('\n') || 'No data')
      .setColor('#8b5cf6')
      .setTimestamp();

    // Create embed for auction winners leaderboard
    const winnersEmbed = new EmbedBuilder()
      .setTitle('🎉 Daily Top 5 Auction Winners 🎉')
      .setDescription(topWinners.map((u, i) => `${i+1}. **${u.username || `User ${u.discordId}`}** - ${u._count.wonAuctions} auctions won`).join('\n') || 'No data')
      .setColor('#10b981')
      .setTimestamp();

    // Send both embeds
    await channel.send({ embeds: [coinsEmbed, winnersEmbed] });
  } catch (err) {
    console.error('Leaderboard cron error:', err);
  }
}, { timezone: 'Asia/Kolkata' });

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

  // Admin commands
  if (commandName === 'add') {
    const targetUser = interaction.options.getUser('user');
    const amount = interaction.options.getInteger('amount');

    // Check if user is admin
    const member = await interaction.guild.members.fetch(interaction.user.id);
    if (!member.permissions.has('Administrator')) {
      return await interaction.reply({ content: '❌ This command is for administrators only!', ephemeral: true });
    }

    try {
      const user = await prisma.user.findUnique({
        where: { discordId: targetUser.id }
      });

      if (!user) {
        return await interaction.reply({ content: '❌ User not found in database!', ephemeral: true });
      }

      await prisma.user.update({
        where: { id: user.id },
        data: { coins: { increment: amount } }
      });

      await interaction.reply({ content: `✅ Added ${amount} coins to ${targetUser.username}!` });
    } catch (err) {
      console.error('Add coins error:', err);
      await interaction.reply({ content: '❌ Failed to add coins!', ephemeral: true });
    }
  }

  if (commandName === 'remove') {
    const targetUser = interaction.options.getUser('user');
    const amount = interaction.options.getInteger('amount');

    // Check if user is admin
    const member = await interaction.guild.members.fetch(interaction.user.id);
    if (!member.permissions.has('Administrator')) {
      return await interaction.reply({ content: '❌ This command is for administrators only!', ephemeral: true });
    }

    try {
      const user = await prisma.user.findUnique({
        where: { discordId: targetUser.id }
      });

      if (!user) {
        return await interaction.reply({ content: '❌ User not found in database!', ephemeral: true });
      }

      await prisma.user.update({
        where: { id: user.id },
        data: { coins: { decrement: amount } }
      });

      await interaction.reply({ content: `✅ Removed ${amount} coins from ${targetUser.username}!` });
    } catch (err) {
      console.error('Remove coins error:', err);
      await interaction.reply({ content: '❌ Failed to remove coins!', ephemeral: true });
    }
  }

  if (commandName === 'bonuscode') {
    const code = interaction.options.getString('code');
    const reward = interaction.options.getInteger('reward');
    const uses = interaction.options.getInteger('uses') || 1;

    // Check if user is admin
    const member = await interaction.guild.members.fetch(interaction.user.id);
    if (!member.permissions.has('Administrator')) {
      return await interaction.reply({ content: '❌ This command is for administrators only!', ephemeral: true });
    }

    try {
      await prisma.bonusCode.create({
        data: {
          code: code.toUpperCase(),
          reward,
          maxUses: uses
        }
      });

      await interaction.reply({ content: `✅ Bonus code created!\n**Code:** ${code.toUpperCase()}\n**Reward:** ${reward} coins\n**Uses:** ${uses}` });
    } catch (err) {
      console.error('Bonus code error:', err);
      await interaction.reply({ content: '❌ Failed to create bonus code!', ephemeral: true });
    }
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

async function loginWithRetry(retries = 5) {
  const token = process.env.DISCORD_TOKEN;
  
  if (!token) {
    console.error('[DISCORD] DISCORD_TOKEN environment variable is not set!');
    console.error('[DISCORD] Please add DISCORD_TOKEN to your Render environment variables');
    process.exit(1);
  }

  // Log token format for debugging (first 10 chars, last 10 chars)
  const tokenPreview = token.length > 20 
    ? `${token.substring(0, 10)}...${token.substring(token.length - 10)}`
    : 'token too short (invalid)';
  console.log(`[DISCORD] Attempting login with token: ${tokenPreview} (length: ${token.length})`);

  for (let i = 0; i < retries; i++) {
    try {
      await client.login(token);
      console.log('[DISCORD] Bot logged in successfully');
      return;
    } catch (err) {
      const isLastAttempt = i === retries - 1;
      const backoffDelay = 5000 * (i + 1); // Exponential backoff: 5s, 10s, 15s, etc.
      
      console.error(`[DISCORD] Login attempt ${i + 1}/${retries} failed: ${err.message}`);
      
      if (err.message.includes('invalid token')) {
        console.error('[DISCORD] ERROR: The token is invalid. Please:');
        console.error('[DISCORD] 1. Go to Discord Developer Portal: https://discord.com/developers/applications');
        console.error('[DISCORD] 2. Select your MazeBids app');
        console.error('[DISCORD] 3. Go to "Bot" section and click "Reset Token"');
        console.error('[DISCORD] 4. Copy the new token and update DISCORD_TOKEN in Render');
        console.error('[DISCORD] 5. Make sure there are no extra spaces in the token');
        if (isLastAttempt) process.exit(1);
      }
      
      if (!isLastAttempt) {
        console.log(`[DISCORD] Retrying in ${backoffDelay / 1000}s...`);
        await new Promise(r => setTimeout(r, backoffDelay));
      }
    }
  }
  
  console.error('[DISCORD] All login attempts failed - giving up');
  process.exit(1);
}

loginWithRetry();

module.exports = { client, sendAuctionNotification, announceWinner, sendNotificationStatusUpdate };

