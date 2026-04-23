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
    // Use raw query to avoid Prisma schema mismatch during migration
    const users = await prisma.$queryRaw`SELECT id, "discordId", username, avatar, coins, "totalEarned", "totalSpent", role, notifications, "createdAt", "updatedAt", "referralCode", "referredById" FROM "User" WHERE id = ${id}`;
    const user = users[0] || null;
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
      
      // Use raw query to find user (avoids schema mismatch)
      const existingUsers = await prisma.$queryRaw`SELECT id, "discordId", username, avatar, coins, "totalEarned", "totalSpent", role, notifications, "referralCode" FROM "User" WHERE "discordId" = ${profile.id}`;
      let user = existingUsers[0] || null;
      
      console.log('[DISCORD AUTH] Existing user found:', !!user);

      if (!user) {
        console.log('[DISCORD AUTH] Creating new user...');
        
        // Create user with raw SQL
        const referralCode = crypto.randomBytes(4).toString('hex').toUpperCase();
        const role = profile.id === process.env.ADMIN_DISCORD_ID ? 'ADMIN' : 'USER';
        const avatar = profile.avatar ? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png` : null;
        
        const newUsers = await prisma.$queryRaw`
          INSERT INTO "User" (id, "discordId", username, avatar, coins, "totalEarned", "totalSpent", role, notifications, "referralCode", "referredById", "createdAt", "updatedAt")
          VALUES (gen_random_uuid(), ${profile.id}, ${profile.username}, ${avatar}, 100, 100, 0, ${role}, false, ${referralCode}, null, NOW(), NOW())
          RETURNING id, "discordId", username, avatar, coins, "totalEarned", "totalSpent", role, notifications, "referralCode"
        `;
        
        user = newUsers[0];
        console.log('[DISCORD AUTH] New user created:', user.id);

        // Log welcome transaction
        await prisma.$queryRaw`
          INSERT INTO "Transaction" (id, "userId", amount, type, description, timestamp)
          VALUES (gen_random_uuid(), ${user.id}, 100, 'EARN', 'Welcome Bonus', NOW())
        `;
      } else {
        // Update username/avatar if changed
        console.log('[DISCORD AUTH] Updating existing user...');
        const avatar = profile.avatar ? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png` : null;
        const role = profile.id === process.env.ADMIN_DISCORD_ID ? 'ADMIN' : user.role;
        
        // Ensure referral code exists
        let referralCode = user.referralCode;
        if (!referralCode) {
          referralCode = crypto.randomBytes(4).toString('hex').toUpperCase();
        }
        
        await prisma.$queryRaw`
          UPDATE "User" 
          SET username = ${profile.username}, 
              avatar = ${avatar}, 
              role = ${role}, 
              "referralCode" = ${referralCode},
              "updatedAt" = NOW()
          WHERE id = ${user.id}
        `;
        
        // Refresh user data
        const updatedUsers = await prisma.$queryRaw`SELECT id, "discordId", username, avatar, coins, "totalEarned", "totalSpent", role, notifications, "referralCode" FROM "User" WHERE id = ${user.id}`;
        user = updatedUsers[0];
      }

      console.log('[DISCORD AUTH] Auth successful for user:', user.id);
      return done(null, user);
    } catch (err) {
      console.error('[DISCORD AUTH ERROR]', err.message, err.code);
      return done(err, null);
    }
  }
));
