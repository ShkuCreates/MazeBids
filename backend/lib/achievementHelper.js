/**
 * Achievement Helper
 * 
 * Manages user achievements:
 * - Check and unlock achievements based on user stats
 * - Seed default achievements
 * - Get user achievements with progress
 */

const prisma = require('./prisma');

// Default achievements configuration
const DEFAULT_ACHIEVEMENTS = [
  {
    key: 'first-bid',
    title: 'First Bid',
    description: 'Place your first bid in an auction',
    icon: 'Gavel',
    requirement: 1,
    type: 'BIDS',
    reward: 50
  },
  {
    key: 'bid-master',
    title: 'Bid Master',
    description: 'Place 10 bids in auctions',
    icon: 'Target',
    requirement: 10,
    type: 'BIDS',
    reward: 100
  },
  {
    key: 'auction-winner',
    title: 'Winner',
    description: 'Win your first auction',
    icon: 'Trophy',
    requirement: 1,
    type: 'WINS',
    reward: 200
  },
  {
    key: 'champion',
    title: 'Champion',
    description: 'Win 10 auctions',
    icon: 'Crown',
    requirement: 10,
    type: 'WINS',
    reward: 500
  },
  {
    key: 'coin-starter',
    title: 'Coin Starter',
    description: 'Earn 100 coins total',
    icon: 'Coins',
    requirement: 100,
    type: 'COINS',
    reward: 50
  },
  {
    key: 'coin-collector',
    title: 'Coin Collector',
    description: 'Earn 1,000 coins total',
    icon: 'Coins',
    requirement: 1000,
    type: 'COINS',
    reward: 100
  },
  {
    key: 'coin-master',
    title: 'Coin Master',
    description: 'Earn 10,000 coins total',
    icon: 'Coins',
    requirement: 10000,
    type: 'COINS',
    reward: 500
  },
  {
    key: 'wealthy',
    title: 'Wealthy',
    description: 'Have 5,000 coins in your wallet',
    icon: 'Wallet',
    requirement: 5000,
    type: 'BALANCE',
    reward: 200
  },
  {
    key: 'big-spender',
    title: 'Big Spender',
    description: 'Spend 5,000 coins in auctions',
    icon: 'TrendingUp',
    requirement: 5000,
    type: 'SPENT',
    reward: 300
  },
  {
    key: 'daily-streak-3',
    title: 'Daily Streak',
    description: 'Claim daily reward 3 days in a row',
    icon: 'Flame',
    requirement: 3,
    type: 'STREAK',
    reward: 100
  },
  {
    key: 'daily-streak-7',
    title: 'Weekly Warrior',
    description: 'Claim daily reward 7 days in a row',
    icon: 'Flame',
    requirement: 7,
    type: 'STREAK',
    reward: 300
  },
  {
    key: 'referral-1',
    title: 'First Referral',
    description: 'Refer 1 friend to join',
    icon: 'Users',
    requirement: 1,
    type: 'REFERRALS',
    reward: 100
  },
  {
    key: 'referral-5',
    title: 'Referral Master',
    description: 'Refer 5 friends to join',
    icon: 'Users',
    requirement: 5,
    type: 'REFERRALS',
    reward: 500
  }
];

/**
 * Seed default achievements into the database
 */
async function seedAchievements() {
  console.log('[Achievements] Seeding default achievements...');
  
  for (const achievement of DEFAULT_ACHIEVEMENTS) {
    await prisma.achievement.upsert({
      where: { key: achievement.key },
      update: achievement,
      create: achievement
    });
  }
  
  console.log('[Achievements] ✅ Seeded successfully');
}

/**
 * Get user's achievements with progress
 * @param {string} userId 
 */
async function getUserAchievements(userId) {
  const achievements = await prisma.achievement.findMany({
    include: {
      users: {
        where: { userId },
        select: {
          unlockedAt: true,
          progress: true
        }
      }
    }
  });

  // Get user stats for progress calculation
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      bids: true,
      wonAuctions: { where: { status: 'ENDED' } },
      referrals: true,
      dailyReward: true
    }
  });

  if (!user) return [];

  // Calculate current stats
  const stats = {
    bids: user.bids.length,
    wins: user.wonAuctions.length,
    totalEarned: user.totalEarned,
    balance: user.coins,
    totalSpent: user.totalSpent,
    streak: user.dailyReward?.streak || 0,
    referrals: user.referrals.length
  };

  // Map achievements with progress
  return achievements.map(achievement => {
    const userAchievement = achievement.users[0];
    const isUnlocked = !!userAchievement;
    
    // Calculate current progress based on type
    let currentProgress = 0;
    switch (achievement.type) {
      case 'BIDS':
        currentProgress = stats.bids;
        break;
      case 'WINS':
        currentProgress = stats.wins;
        break;
      case 'COINS':
        currentProgress = stats.totalEarned;
        break;
      case 'BALANCE':
        currentProgress = stats.balance;
        break;
      case 'SPENT':
        currentProgress = stats.totalSpent;
        break;
      case 'STREAK':
        currentProgress = stats.streak;
        break;
      case 'REFERRALS':
        currentProgress = stats.referrals;
        break;
    }

    return {
      id: achievement.id,
      key: achievement.key,
      title: achievement.title,
      description: achievement.description,
      icon: achievement.icon,
      requirement: achievement.requirement,
      type: achievement.type,
      reward: achievement.reward,
      unlocked: isUnlocked,
      unlockedAt: userAchievement?.unlockedAt || null,
      progress: Math.min(currentProgress, achievement.requirement),
      currentValue: currentProgress
    };
  });
}

/**
 * Check and unlock achievements for a user
 * @param {string} userId 
 * @returns {Array} - Newly unlocked achievements
 */
async function checkAndUnlockAchievements(userId) {
  const achievements = await getUserAchievements(userId);
  const newlyUnlocked = [];

  for (const achievement of achievements) {
    // Skip already unlocked
    if (achievement.unlocked) continue;

    // Check if requirements met
    const shouldUnlock = achievement.progress >= achievement.requirement;

    if (shouldUnlock) {
      // Unlock the achievement
      const unlocked = await prisma.userAchievement.create({
        data: {
          userId,
          achievementId: achievement.id,
          progress: achievement.requirement
        },
        include: {
          achievement: true
        }
      });

      newlyUnlocked.push({
        ...unlocked.achievement,
        unlockedAt: unlocked.unlockedAt
      });

      console.log(`[Achievements] ✅ User ${userId} unlocked: ${achievement.title}`);
    }
  }

  return newlyUnlocked;
}

/**
 * Get user activity feed (bids, wins, earnings)
 * @param {string} userId 
 * @param {number} limit 
 */
async function getUserActivity(userId, limit = 20) {
  // Get recent bids
  const bids = await prisma.bid.findMany({
    where: { userId },
    include: { auction: true },
    orderBy: { timestamp: 'desc' },
    take: limit
  });

  // Get won auctions
  const wins = await prisma.auction.findMany({
    where: { 
      highestBidderId: userId,
      status: 'ENDED'
    },
    orderBy: { endTime: 'desc' },
    take: limit
  });

  // Get transactions
  const transactions = await prisma.transaction.findMany({
    where: { userId },
    orderBy: { timestamp: 'desc' },
    take: limit
  });

  // Combine and format activities
  const activities = [
    ...bids.map(bid => ({
      type: 'bid',
      amount: bid.amount,
      item: bid.auction?.title || 'Unknown Auction',
      time: bid.timestamp,
      auctionId: bid.auctionId
    })),
    ...wins.map(win => ({
      type: 'win',
      amount: win.currentBid,
      item: win.title,
      time: win.endTime,
      auctionId: win.id
    })),
    ...transactions.map(txn => ({
      type: txn.type === 'EARN' ? 'earn' : 'spend',
      amount: txn.amount,
      source: txn.description,
      time: txn.timestamp
    }))
  ];

  // Sort by time (newest first) and limit
  return activities
    .sort((a, b) => new Date(b.time) - new Date(a.time))
    .slice(0, limit);
}

module.exports = {
  seedAchievements,
  getUserAchievements,
  checkAndUnlockAchievements,
  getUserActivity,
  DEFAULT_ACHIEVEMENTS
};
