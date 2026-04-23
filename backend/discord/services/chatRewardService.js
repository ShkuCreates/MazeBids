const prisma = require('../../lib/prisma');
const config = require('../config');
const { antiSpam } = require('../utils/cooldownManager');

async function processChatReward(discordId, username) {
  try {
    const user = await prisma.user.findUnique({ where: { discordId } });
    
    if (!user) return null;
    
    const chatReward = await prisma.chatReward.findUnique({ where: { userId: user.id } });
    const now = new Date();
    
    if (chatReward) {
      const secondsSinceReward = (now - new Date(chatReward.lastRewardAt)) / 1000;
      
      if (secondsSinceReward < config.CHAT_COOLDOWN_SECONDS) {
        return null;
      }
    }
    
    const rewardAmount = Math.floor(Math.random() * (config.CHAT_REWARD_MAX - config.CHAT_REWARD_MIN + 1)) + config.CHAT_REWARD_MIN;
    
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { 
          coins: { increment: rewardAmount },
          totalEarned: { increment: rewardAmount }
        }
      }),
      prisma.transaction.create({
        data: {
          userId: user.id,
          amount: rewardAmount,
          type: 'EARN',
          description: 'Chat activity reward'
        }
      }),
      prisma.chatReward.upsert({
        where: { userId: user.id },
        update: {
          lastRewardAt: now,
          messageCount: { increment: 1 }
        },
        create: {
          userId: user.id,
          lastRewardAt: now,
          messageCount: 1
        }
      })
    ]);
    
    return rewardAmount;
  } catch (err) {
    console.error('Chat reward error:', err);
    return null;
  }
}

async function canEarnReward(discordId) {
  try {
    const user = await prisma.user.findUnique({ where: { discordId } });
    if (!user) return false;
    
    const chatReward = await prisma.chatReward.findUnique({ where: { userId: user.id } });
    if (!chatReward) return true;
    
    const secondsSinceReward = (new Date() - new Date(chatReward.lastRewardAt)) / 1000;
    return secondsSinceReward >= config.CHAT_COOLDOWN_SECONDS;
  } catch (err) {
    return false;
  }
}

module.exports = { processChatReward, canEarnReward };
