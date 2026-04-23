require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const prisma = require('../lib/prisma');
const events = require('./events');
const config = require('./config');
const webhookService = require('./services/webhookService');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildInvites,
    GatewayIntentBits.MessageContent
  ]
});

client.on('error', (error) => console.error('Discord bot error:', error.message));

for (const event of events) {
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args));
  } else {
    client.on(event.name, (...args) => event.execute(...args));
  }
}

async function loginWithRetry(retries = 5) {
  const token = process.env.DISCORD_TOKEN;
  
  if (!token) {
    console.error('[DISCORD] DISCORD_TOKEN environment variable is not set!');
    console.error('[DISCORD] Please add DISCORD_TOKEN to your environment variables');
    process.exit(1);
  }

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
      const backoffDelay = 5000 * (i + 1);
      
      console.error(`[DISCORD] Login attempt ${i + 1}/${retries} failed: ${err.message}`);
      
      if (err.message.includes('invalid token')) {
        console.error('[DISCORD] ERROR: The token is invalid. Please:');
        console.error('[DISCORD] 1. Go to Discord Developer Portal: https://discord.com/developers/applications');
        console.error('[DISCORD] 2. Select your MazeBids app');
        console.error('[DISCORD] 3. Go to "Bot" section and click "Reset Token"');
        console.error('[DISCORD] 4. Copy the new token and update DISCORD_TOKEN');
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

module.exports = { client, webhookService };
