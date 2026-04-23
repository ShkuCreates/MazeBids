require('dotenv').config();

module.exports = {
  MAIN_GUILD_ID: process.env.MAZEBIDS_GUILD_ID || '1430842081865371821',
  WELCOME_CHANNEL_ID: process.env.WELCOME_CHANNEL_ID || '1496049411258581052',
  LEADERBOARD_CHANNEL_ID: process.env.LEADERBOARD_CHANNEL_ID || '1496048643969650759',
  WINNER_ANNOUNCEMENT_CHANNEL_ID: process.env.WINNER_ANNOUNCEMENT_CHANNEL_ID || '1496049007204503644',
  AUCTION_CHANNEL_ID: process.env.AUCTION_CHANNEL_ID || '1496049007204503644',
  
  DAILY_BASE_REWARD: 100,
  DAILY_STREAK_BONUS: 10,
  DAILY_STREAK_MAX_BONUS: 200,
  DAILY_COOLDOWN_HOURS: 24,
  
  CHAT_REWARD_MIN: 1,
  CHAT_REWARD_MAX: 5,
  CHAT_COOLDOWN_SECONDS: 45,
  CHAT_SPAM_THRESHOLD: 3,
  
  COMMAND_COOLDOWNS: {
    daily: 86400000,
    streak: 60000,
    recommend: 30000,
    economy: 5000,
    history: 10000,
    leaderboard: 30000
  },
  
  COUNTDOWN_TRIGGERS: [60, 30, 10],
  
  WEBHOOK_SECRET: process.env.WEBHOOK_SECRET || 'maze-webhook-secret',
  
  WELCOMES: [
    'Welcome to MazeBids! 🚀',
    'Hey {user}, great to have you! 🎉',
    'New adventurer {user} has arrived! 🗺️',
    'Welcome aboard {user}! ⚡',
    'Hello {user}, let the bids begin! 💰',
    'Yo {user}, ready to win big? 🏆'
  ],
  
  STATUSES: [
    { name: 'MazeBids Auctions', type: 0 },
    { name: 'your bids', type: 2 },
    { name: 'fast auctions', type: 3 },
    { name: 'to earn coins', type: 5 },
    { name: 'top bidders', type: 2 },
    { name: 'MazeBids.com', type: 0 },
    { name: 'live auctions', type: 1 },
    { name: 'coin grind', type: 0 },
    { name: 'Discord auctions', type: 2 }
  ],
  
  PERSONALITY: {
    winning: [
      '🏆 You crushed it. That item is yours.',
      '🎉 Absolute domination! You won!',
      '💪 Skills! That auction is yours.',
      '🔥 What a win! You owned that!',
      '⚡ Lightning fast! You secured the bag!'
    ],
    losing: [
      '💀 Outbid again… tough luck.',
      '😤 They got you this time. Fight back!',
      '🥀 Close one, but not yours. Try again!',
      '😢 Sniped! Stay sharp next time.',
      '🎯 Almost! Better luck next bid.'
    ],
    daily: [
      '💰 Free coins? Don’t mind if I do.',
      '🎁 Daily rewards loaded. Enjoy!',
      '💸 Coins incoming! You’re welcome.',
      '🤑 Cha-ching! Your daily is here.',
      '🎲 Daily roll complete. Coins secured!'
    ],
    streak: [
      '🔥 Streak on fire! Keep it going!',
      '⚡ Consistency pays off!',
      '🚀 You’re on a roll! Don’t stop!',
      '💪 Streak master! Impressive.',
      '🌟 Unstoppable! Keep claiming!'
    ],
    outbid: [
      '⚠️ You’ve been outbid! React fast!',
      '🚨 Alert! Someone topped your bid.',
      '😱 Sniped! Time to counter!',
      '💥 Your bid was crushed. Strike back!',
      '🎯 They challenged you. Show them who’s boss!'
    ],
    recommend: [
      '🎯 Check this out - might be your next win!',
      '🔥 Hot auction alert! Don’t miss it.',
      '💎 Found something special for you.',
      '⭐ This one’s got your name on it.',
      '🚀 Rising auction! Jump in now!'
    ]
  }
};
