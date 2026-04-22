const passport = require('passport');
const DiscordStrategy = require('passport-discord').Strategy;
const prisma = require('./prisma');

const crypto = require('crypto');

passport.serializeUser((user, done) => {
  console.log('[PASSPORT] Serializing user:', user.id);
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    console.log('[PASSPORT] Deserializing user:', id);
    const user = await prisma.user.findUnique({ where: { id } });
    console.log('[PASSPORT] User found:', !!user);
    done(null, user);
  } catch (err) {
    console.error('[PASSPORT] Deserialization error:', err);
    done(err, null);
  }
});

passport.use(new DiscordStrategy({
    clientID: process.env.DISCORD_CLIENT_ID,
    clientSecret: process.env.DISCORD_CLIENT_SECRET,
    callbackURL: process.env.DISCORD_REDIRECT_URI || process.env.DISCORD_CALLBACK_URL,
    scope: ['identify', 'guilds', 'guilds.join']
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      console.log('[DISCORD AUTH] User profile received:', profile.id, profile.username);
      
      let user = await prisma.user.findUnique({
        where: { discordId: profile.id }
      });
      console.log('[DISCORD AUTH] Existing user found:', !!user);

      if (!user) {
        console.log('[DISCORD AUTH] Creating new user...');
        user = await prisma.user.create({
          data: {
            discordId: profile.id,
            username: profile.username,
            avatar: profile.avatar ? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png` : null,
            coins: 100, // Welcome coins
            totalEarned: 100,
            referralCode: crypto.randomBytes(4).toString('hex').toUpperCase(),
            role: profile.id === process.env.ADMIN_DISCORD_ID ? 'ADMIN' : 'USER'
          }
        });
        console.log('[DISCORD AUTH] New user created:', user.id);

        // Log welcome transaction
        await prisma.transaction.create({
          data: {
            userId: user.id,
            amount: 100,
            type: 'EARN',
            description: 'Welcome Bonus'
          }
        });
      } else {
        // Update username/avatar if changed
        console.log('[DISCORD AUTH] Updating existing user...');
        const updateData = {
          username: profile.username,
          avatar: profile.avatar ? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png` : null,
          role: profile.id === process.env.ADMIN_DISCORD_ID ? 'ADMIN' : user.role
        };

        // Ensure user has a referral code if they were created before this update
        if (!user.referralCode) {
          updateData.referralCode = crypto.randomBytes(4).toString('hex').toUpperCase();
        }

        user = await prisma.user.update({
          where: { id: user.id },
          data: updateData
        });
      }

      console.log('[DISCORD AUTH] Auth successful for user:', user.id);
      return done(null, user);
    } catch (err) {
      console.error('[DISCORD AUTH ERROR]', err.message, err.code);
      return done(err, null);
    }
  }
));
