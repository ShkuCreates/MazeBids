require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const prisma = require('./prisma');
const cron = require('node-cron');

// Singleton - Master process only
if (process.env.NODE_ENV !== 'production' && !process.env.pm_id) {
  console.log('Discord bot starting in master/single process...');
} else {
  console.log('Discord bot skipped in worker (singleton)');
  module.exports = { client: null };
  return;
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildInvites
  ]
});

// ... all your bot code here (copy from discordBot.js without login retries) ...

async function initBot() {
  try {
    await client.login(process.env.DISCORD_TOKEN);
    console.log('✅ Discord bot logged in (singleton)');
  } catch (err) {
    console.error('Bot login failed:', err.message);
  }
}

initBot();

module.exports = { client, /* exports */ };

