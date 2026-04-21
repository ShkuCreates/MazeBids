require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder, REST, Routes, ApplicationCommandOptionType, PermissionFlagsBits } = require('discord.js');
const prisma = require('./prisma');
const crypto = require('crypto');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers
  ]
});

// Prevent process crash on WebSocket errors
client.on('error', (error) => {
  console.error('Discord bot WebSocket error:', error.message);
});

// Automatically assign role when a user joins the server
client.on('guildMemberAdd', async (member) => {
  const roleId = '1496042141015736422';
  try {
    const role = member.guild.roles.cache.get(roleId);
    if (role) {
      await member.roles.add(role);
      console.log(`Automatically assigned role to new member: ${member.user.tag}`);
    } else {
      console.warn(`Role with ID ${roleId} not found in the server.`);
    }
  } catch (error) {
    console.error(`Failed to assign auto-role to ${member.user.tag}:`, error.message);
  }
});

process.on('unhandledRejection', (error) => {
  if (error.message?.includes('handshake')) {
    console.error('Handled Discord handshake error:', error.message);
  } else {
    console.error('Unhandled Rejection:', error);
  }
});

// Slash Command Definitions
const commands = [
  {
    name: 'add',
    description: 'Admin: Add coins to a user account',
    options: [
      {
        name: 'user',
        description: 'The user to add coins to',
        type: ApplicationCommandOptionType.User,
        required: true,
      },
      {
        name: 'amount',
        description: 'The amount of coins to add',
        type: ApplicationCommandOptionType.Integer,
        required: true,
      },
    ],
    default_member_permissions: PermissionFlagsBits.Administrator.toString(),
  },
  {
    name: 'remove',
    description: 'Admin: Remove coins from a user account',
    options: [
      {
        name: 'user',
        description: 'The user to remove coins from',
        type: ApplicationCommandOptionType.User,
        required: true,
      },
      {
        name: 'amount',
        description: 'The amount of coins to remove',
        type: ApplicationCommandOptionType.Integer,
        required: true,
      },
    ],
    default_member_permissions: PermissionFlagsBits.Administrator.toString(),
  },
  {
    name: 'genbonus',
    description: 'Admin: Generate a bonus code for the website',
    options: [
      {
        name: 'amount',
        description: 'The amount of coins each user gets',
        type: ApplicationCommandOptionType.Integer,
        required: true,
      },
      {
        name: 'uses',
        description: 'How many times the code can be redeemed',
        type: ApplicationCommandOptionType.Integer,
        required: true,
      },
    ],
    default_member_permissions: PermissionFlagsBits.Administrator.toString(),
  },
];

const registerCommands = async () => {
  try {
    const clientId = process.env.DISCORD_CLIENT_ID;
    const guildId = process.env.DISCORD_GUILD_ID;
    
    if (!clientId) {
      console.error('DISCORD_CLIENT_ID is missing from .env');
      return;
    }

    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_BOT_TOKEN);
    
    if (guildId) {
      console.log(`Refreshing guild (/) commands for guild: ${guildId}`);
      await rest.put(
        Routes.applicationGuildCommands(clientId, guildId),
        { body: commands },
      );
      console.log('Successfully reloaded guild (/) commands.');
    } else {
      console.log(`Refreshing global (/) commands for client: ${clientId}`);
      await rest.put(
        Routes.applicationCommands(clientId),
        { body: commands },
      );
      console.log('Successfully reloaded global (/) commands.');
    }
  } catch (error) {
    console.error('Error registering commands:', error);
  }
};

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
  client.user.setActivity('Dming People', { type: 0 }); // type 0 is PLAYING
  registerCommands();
});

// Handle Slash Commands
client.on('interactionCreate', async interaction => {
  console.log(`Interaction received: ${interaction.commandName} from ${interaction.user.tag}`);

  if (!interaction.isChatInputCommand()) return;

  const logoUrl = client.user.displayAvatarURL(); // Use bot's avatar as logo

  // --- /add ---
  if (interaction.commandName === 'add') {
    try {
      await interaction.deferReply();
      const targetUser = interaction.options.getUser('user');
      const amount = interaction.options.getInteger('amount');

      const user = await prisma.user.findUnique({ where: { discordId: targetUser.id } });
      if (!user) {
        return interaction.editReply({ content: `❌ User <@${targetUser.id}> not found. They must login once first.` });
      }

      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: { 
          coins: { increment: amount },
          totalEarned: { increment: amount }
        }
      });

      await prisma.transaction.create({
        data: { userId: user.id, amount, type: 'EARN', description: `Added via Discord by admin ${interaction.user.tag}` }
      });

      const successEmbed = new EmbedBuilder()
        .setTitle('✧ COIN DEPOSIT SUCCESSFUL ✧')
        .setThumbnail(logoUrl)
        .setDescription(`Successfully added **${amount}** coins to <@${targetUser.id}>'s account.`)
        .addFields(
          { name: '✦ New Balance', value: `\`${updatedUser.coins} Coins\``, inline: true },
          { name: '✦ Admin', value: `<@${interaction.user.id}>`, inline: true }
        )
        .setColor('#10b981')
        .setTimestamp();

      await interaction.editReply({ content: `✅ Successfully added coins to <@${targetUser.id}> account`, embeds: [successEmbed] });
    } catch (error) {
      console.error('Error in /add:', error);
      await interaction.editReply({ content: `❌ An error occurred: ${error.message}` });
    }
  }

  // --- /remove ---
  if (interaction.commandName === 'remove') {
    try {
      await interaction.deferReply();
      const targetUser = interaction.options.getUser('user');
      const amount = interaction.options.getInteger('amount');

      const user = await prisma.user.findUnique({ where: { discordId: targetUser.id } });
      if (!user) {
        return interaction.editReply({ content: `❌ User <@${targetUser.id}> not found. They must login once first.` });
      }

      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: { 
          coins: { decrement: amount },
          totalSpent: { increment: amount }
        }
      });

      await prisma.transaction.create({
        data: { userId: user.id, amount: -amount, type: 'SPEND', description: `Removed via Discord by admin ${interaction.user.tag}` }
      });

      const successEmbed = new EmbedBuilder()
        .setTitle('✧ COIN REMOVAL SUCCESSFUL ✧')
        .setThumbnail(logoUrl)
        .setDescription(`Successfully removed **${amount}** coins from <@${targetUser.id}>'s account.`)
        .addFields(
          { name: '✦ New Balance', value: `\`${updatedUser.coins} Coins\``, inline: true },
          { name: '✦ Admin', value: `<@${interaction.user.id}>`, inline: true }
        )
        .setColor('#ef4444')
        .setTimestamp();

      await interaction.editReply({ content: `✅ Successfully removed coins from <@${targetUser.id}> account`, embeds: [successEmbed] });
    } catch (error) {
      console.error('Error in /remove:', error);
      await interaction.editReply({ content: `❌ An error occurred: ${error.message}` });
    }
  }

  // --- /genbonus ---
  if (interaction.commandName === 'genbonus') {
    try {
      await interaction.deferReply({ ephemeral: true });
      const amount = interaction.options.getInteger('amount');
      const uses = interaction.options.getInteger('uses');
      const code = crypto.randomBytes(4).toString('hex').toUpperCase();

      await prisma.bonusCode.create({
        data: {
          code,
          reward: amount,
          maxUses: uses
        }
      });

      const embed = new EmbedBuilder()
        .setTitle('✧ BONUS CODE GENERATED ✧')
        .setThumbnail(logoUrl)
        .setDescription(`A new bonus code has been created for the website!`)
        .addFields(
          { name: '✦ Code', value: `\`${code}\``, inline: false },
          { name: '✦ Reward', value: `\`${amount} Coins\``, inline: true },
          { name: '✦ Max Uses', value: `\`${uses}\``, inline: true }
        )
        .setColor('#8b5cf6')
        .setTimestamp();

      await interaction.editReply({ content: `✅ Code generated successfully! Share it with your users to redeem on the website.`, embeds: [embed] });
    } catch (error) {
      console.error('Error in /genbonus:', error);
      await interaction.editReply({ content: `❌ An error occurred: ${error.message}` });
    }
  }

  // --- /redeem ---
  if (interaction.commandName === 'redeem') {
    try {
      await interaction.deferReply({ ephemeral: true });
      const codeInput = interaction.options.getString('code').toUpperCase();
      
      const user = await prisma.user.findUnique({ 
        where: { discordId: interaction.user.id },
        include: { redemptions: true }
      });

      if (!user) {
        return interaction.editReply({ content: `❌ You must login to the website first to redeem codes.` });
      }

      const bonusCode = await prisma.bonusCode.findUnique({
        where: { code: codeInput },
        include: { redemptions: true }
      });

      if (!bonusCode) {
        return interaction.editReply({ content: `❌ Invalid bonus code.` });
      }

      if (bonusCode.usedCount >= bonusCode.maxUses) {
        return interaction.editReply({ content: `❌ This code has already reached its maximum usage limit.` });
      }

      const alreadyRedeemed = bonusCode.redemptions.some(r => r.userId === user.id);
      if (alreadyRedeemed) {
        return interaction.editReply({ content: `❌ You have already redeemed this code.` });
      }

      // Perform redemption
      await prisma.$transaction([
        prisma.redemption.create({
          data: { userId: user.id, bonusCodeId: bonusCode.id }
        }),
        prisma.bonusCode.update({
          where: { id: bonusCode.id },
          data: { usedCount: { increment: 1 } }
        }),
        prisma.user.update({
          where: { id: user.id },
          data: { 
            coins: { increment: bonusCode.reward },
            totalEarned: { increment: bonusCode.reward }
          }
        }),
        prisma.transaction.create({
          data: { userId: user.id, amount: bonusCode.reward, type: 'EARN', description: `Redeemed bonus code: ${bonusCode.code}` }
        })
      ]);

      const successEmbed = new EmbedBuilder()
        .setTitle('✧ CODE REDEEMED ✧')
        .setThumbnail(logoUrl)
        .setDescription(`Congratulations! You've successfully redeemed a bonus code.`)
        .addFields(
          { name: '✦ Reward', value: `\`${bonusCode.reward} Coins\``, inline: true },
          { name: '✦ Code', value: `\`${bonusCode.code}\``, inline: true }
        )
        .setColor('#10b981')
        .setTimestamp();

      await interaction.editReply({ embeds: [successEmbed] });
    } catch (error) {
      console.error('Error in /redeem:', error);
      await interaction.editReply({ content: `❌ An error occurred: ${error.message}` });
    }
  }
});

const sendAuctionNotification = async (userDiscordId, auction) => {
  try {
    const user = await client.users.fetch(userDiscordId);
    if (!user) return;

    const logoUrl = client.user.displayAvatarURL();

    const embed = new EmbedBuilder()
      .setTitle('◈ AUCTION ALERT ◈')
      .setThumbnail(logoUrl)
      .setDescription(`Hey there! A new auction is starting soon. Don't miss out on your chance to win!`)
      .addFields(
        { name: '✦ Item', value: auction.title, inline: false },
        { name: '✦ Product', value: auction.product || 'Digital Product', inline: true },
        { name: '✦ Starting Bid', value: `\`${auction.startingBid} Coins\``, inline: true },
        { name: '✦ Link', value: `[View Auction](${process.env.FRONTEND_URL}/auctions)`, inline: false }
      )
      .setColor('#8b5cf6')
      .setFooter({ text: 'Mazebids • Fast & Secure Auctions', iconURL: logoUrl })
      .setTimestamp();

    if (auction.image) embed.setImage(auction.image);

    await user.send({
      embeds: [embed],
    });
    console.log(`Notification sent to ${userDiscordId}`);
  } catch (error) {
    console.error(`Failed to send DM to ${userDiscordId}:`, error.message);
  }
};

const announceWinner = async (auction, winner) => {
  try {
    const logoUrl = client.user.displayAvatarURL();

    // 1. DM the winner
    try {
      const user = await client.users.fetch(winner.discordId);
      if (user) {
        const dmEmbed = new EmbedBuilder()
          .setTitle('✦ YOU WON THE AUCTION! ✦')
          .setThumbnail(logoUrl)
          .setDescription(`Congratulations! You are the winner of **${auction.title}**!`)
          .addFields(
            { name: '✦ Item', value: auction.title, inline: true },
            { name: '✦ Winning Bid', value: `\`${auction.currentBid} Coins\``, inline: true },
            { name: '✦ Product', value: auction.product || 'N/A', inline: false }
          )
          .setColor('#10b981')
          .setFooter({ text: 'Mazebids • Claim your prize now!', iconURL: logoUrl })
          .setTimestamp();

        if (auction.image) dmEmbed.setImage(auction.image);

        await user.send({
          content: `✧ Congratulations <@${winner.discordId}>! You won the auction for **${auction.title}**!`,
          embeds: [dmEmbed]
        });
        console.log(`Winner DM sent to ${winner.discordId}`);
      }
    } catch (dmErr) {
      console.error(`Failed to send winner DM to ${winner.discordId}:`, dmErr.message);
    }

    // 2. Announce in channel
    const channelId = process.env.DISCORD_ANNOUNCEMENT_CHANNEL_ID;
    if (!channelId) {
      console.warn('DISCORD_ANNOUNCEMENT_CHANNEL_ID not set, skipping winner announcement');
      return;
    }

    const channel = await client.channels.fetch(channelId);
    if (!channel) return;

    const embed = new EmbedBuilder()
      .setTitle('✧ AUCTION WINNER ✧')
      .setThumbnail(logoUrl)
      .setDescription(`Congratulations to <@${winner.discordId}> for winning the auction!`)
      .addFields(
        { name: '✦ Item', value: auction.title, inline: true },
        { name: '✦ Winning Bid', value: `\`${auction.currentBid} Coins\``, inline: true },
        { name: '✦ Product', value: auction.product || 'N/A', inline: false }
      )
      .setColor('#8b5cf6')
      .setFooter({ text: 'Mazebids • Fast & Secure Auctions', iconURL: logoUrl })
      .setTimestamp();

    if (auction.image) embed.setImage(auction.image);

    await channel.send({ 
      content: `✧ Congratulations <@${winner.discordId}>! You won **${auction.title}**!`,
      embeds: [embed] 
    });
  } catch (error) {
    console.error('Failed to announce winner:', error.message);
  }
};

const loginWithRetry = async (retries = 5, delay = 5000) => {
  for (let i = 0; i < retries; i++) {
    try {
      await client.login(process.env.DISCORD_BOT_TOKEN);
      return;
    } catch (err) {
      console.error(`Discord bot login attempt ${i + 1} failed:`, err.message);
      if (i < retries - 1) {
        console.log(`Retrying in ${delay / 1000}s...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        console.error('Max login retries reached. Bot features will be limited.');
      }
    }
  }
};

if (process.env.DISCORD_BOT_TOKEN) {
  loginWithRetry();
} else {
  console.warn('DISCORD_BOT_TOKEN not found in .env. Bot features will be disabled.');
}

const sendNotificationStatusUpdate = async (userDiscordId, enabled) => {
  try {
    const user = await client.users.fetch(userDiscordId);
    if (!user) return;

    const logoUrl = client.user.displayAvatarURL();

    const embed = new EmbedBuilder()
      .setTitle(enabled ? '✧ NOTIFICATIONS ENABLED ✧' : '✧ NOTIFICATIONS DISABLED ✧')
      .setThumbnail(logoUrl)
      .setDescription(enabled 
        ? "You've successfully enabled Discord notifications! You'll now receive a DM whenever a new auction starts." 
        : "You've disabled Discord notifications. You will no longer receive DMs for new auctions.")
      .setColor(enabled ? '#10b981' : '#ef4444')
      .setFooter({ text: 'Mazebids • Fast & Secure Auctions', iconURL: logoUrl })
      .setTimestamp();

    await user.send({
      embeds: [embed],
    });
    console.log(`Notification status update sent to ${userDiscordId}`);
  } catch (error) {
    console.error(`Failed to send DM to ${userDiscordId}:`, error.message);
  }
};

module.exports = { client, sendAuctionNotification, announceWinner, sendNotificationStatusUpdate };
