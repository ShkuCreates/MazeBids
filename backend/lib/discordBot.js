require('dotenv').config();
const { EmbedBuilder } = require('discord.js');
const prisma = require('./prisma');
const cron = require('node-cron');
const config = require('../discord/config');
const dmAlertService = require('../discord/services/dmAlertService');

const { client } = require('../discord');

client.on('error', (error) => console.error('Discord bot error:', error.message));

client.on('ready', () => {
  console.log(`Discord bot ready as ${client.user.tag}`);
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

    const coinsEmbed = new EmbedBuilder()
      .setTitle('🏆 Daily Top 5 Coin Holders 🏆')
      .setDescription(topCoins.map((u, i) => `${i+1}. **${u.username || `User ${u.discordId}`}** - ${u.coins} coins`).join('\n') || 'No data')
      .setColor('#8b5cf6')
      .setTimestamp();

    const winnersEmbed = new EmbedBuilder()
      .setTitle('🎉 Daily Top 5 Auction Winners 🎉')
      .setDescription(topWinners.map((u, i) => `${i+1}. **${u.username || `User ${u.discordId}`}** - ${u._count.wonAuctions} auctions won`).join('\n') || 'No data')
      .setColor('#10b981')
      .setTimestamp();

    await channel.send({ embeds: [coinsEmbed, winnersEmbed] });
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
    const channel = await client.channels.fetch(config.WINNER_ANNOUNCEMENT_CHANNEL_ID);
    
    const embed = new EmbedBuilder()
      .setTitle('🎉 Auction Winner Announced! 🎉')
      .setDescription(
        `**🏆 Winner:** ${winner.username}\n` +
        `**🎯 Product:** ${auction.title}\n` +
        `**💰 Winning Bid:** ${auction.currentBid} coins\n` +
        `**📝 Description:** ${auction.description}`
      )
      .setColor('#10b981')
      .setTimestamp()
      .setThumbnail(winner.avatar ? `https://cdn.discordapp.com/avatars/${winner.discordId}/${winner.avatar}.png` : null)
      .setFooter({ text: 'Congratulations to the winner!' });

    if (auction.image) {
      embed.setImage(auction.image);
    }

    await channel.send({ embeds: [embed] });
    console.log(`Winner announcement sent for auction ${auction.id} to channel ${config.WINNER_ANNOUNCEMENT_CHANNEL_ID}`);

    await notifyWinner(auction, winner);
  } catch (err) {
    console.error('Announce winner error:', err);
  }
}

async function notifyWinner(auction, winner) {
  try {
    const user = await client.users.fetch(winner.discordId);
    
    const winnerEmbed = new EmbedBuilder()
      .setTitle('🎉 Congratulations! You Won an Auction! 🎉')
      .setDescription(
        `**🎯 Product Won:** ${auction.title}\n` +
        `**💰 Your Winning Bid:** ${auction.currentBid} coins\n` +
        `**📝 Description:** ${auction.description}\n\n` +
        `🎊 **Amazing win! Your coins were well spent!**`
      )
      .setColor('#fbbf24')
      .setTimestamp()
      .setThumbnail(auction.image || null)
      .setFooter({ text: 'Thank you for participating in MazeBids!' });

    if (auction.image) {
      winnerEmbed.setImage(auction.image);
    }

    await user.send({ embeds: [winnerEmbed] });
    console.log(`Winner notification sent to ${winner.username} (${winner.discordId})`);
  } catch (err) {
    console.error(`Failed to send winner DM to ${winner.discordId}:`, err.message);
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

