require('dotenv').config();
const { EmbedBuilder } = require('discord.js');
const prisma = require('./prisma');
const cron = require('node-cron');
const config = require('../discord/config');
const dmAlertService = require('../discord/services/dmAlertService');

const { client } = require('../discord');

client.on('error', (error) => console.error('Discord bot error:', error.message));

client.on('ready', () => {
  console.log(`[DISCORD] Ready as ${client.user.tag}`);

  const statuses = [
    { type: 'WATCHING', text: '🎯 Live Auctions' },
    { type: 'PLAYING', text: '💰 MazeBids.online' },
    { type: 'WATCHING', text: '🏆 Top Bidders' },
    { type: 'PLAYING', text: '🎮 Earn Free Coins' },
    { type: 'WATCHING', text: '⚡ Real-time Bidding' },
    { type: 'PLAYING', text: '🎁 Win Amazing Prizes' },
    { type: 'WATCHING', text: '🔥 Hot Auctions Live' },
    { type: 'PLAYING', text: '✨ mazebids.online' },
  ];

  let statusIndex = 0;

  const updateStatus = () => {
    const current = statuses[statusIndex % statuses.length];
    client.user.setPresence({
      activities: [{
        name: current.text,
        type: current.type === 'WATCHING' ? 3 : 0
      }],
      status: 'online'
    });
    statusIndex++;
  };

  updateStatus();
  setInterval(updateStatus, 3000);
});

client.on('guildCreate', async (guild) => {
  if (guild.id !== config.MAIN_GUILD_ID) {
    try {
      console.log(`Unauthorized guild ${guild.name} (${guild.id}). Leaving...`);
      await guild.leave();
    } catch (err) {
      console.error('Guild leave error:', err);
    }
  }
});

client.on('guildMemberAdd', async (member) => {
  if (member.guild.id !== config.MAIN_GUILD_ID) return;
  try {
    const channel = await client.channels.fetch(config.WELCOME_CHANNEL_ID);
    const welcome = config.WELCOMES[Math.floor(Math.random() * config.WELCOMES.length)].replace('{user}', `<@${member.id}>`);
    await channel.send(welcome);
    const roleId = '1496042141015736422';
    const role = member.guild.roles.cache.get(roleId);
    if (role) await member.roles.add(role);
  } catch (err) {
    console.error('Welcome/auto-role error:', err);
  }
});

cron.schedule('30 16 * * *', async () => {
  try {
    const channel = await client.channels.fetch(config.LEADERBOARD_CHANNEL_ID);
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
    const channel = await client.channels.fetch(config.LEADERBOARD_CHANNEL_ID);
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

module.exports = { client, sendAuctionNotification, announceWinner, sendNotificationStatusUpdate };

