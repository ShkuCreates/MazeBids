const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');

const router = express.Router();

function regenerateSession(req) {
  return new Promise((resolve, reject) => {
    req.session.regenerate((err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

function loginUser(req, user) {
  return new Promise((resolve, reject) => {
    req.logIn(user, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

function saveSession(req) {
  return new Promise((resolve, reject) => {
    req.session.save((err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

router.get('/discord', (req, res, next) => {
  if (req.isAuthenticated && req.isAuthenticated()) {
    console.log('[AUTH] Existing authenticated session, skipping Discord re-auth');
    return res.redirect(`${process.env.FRONTEND_URL}/dashboard`);
  }

  return passport.authenticate('discord', {
    scope: ['identify', 'guilds', 'guilds.join']
  })(req, res, next);
});

router.get('/discord/callback',
  passport.authenticate('discord', {
    failureRedirect: `${process.env.FRONTEND_URL}/?error=auth_failed`
  }),
  (req, res) => {
    console.log('[AUTH] Discord callback - user authenticated:', req.user?.id);
    console.log('[AUTH] Session ID:', req.sessionID);

    // Session cookie is now working cross-site, so redirect directly to the app.
    res.redirect(`${process.env.FRONTEND_URL}/dashboard`);
  }
);

// New endpoint to verify token and create session
router.post('/verify-token', async (req, res) => {
  try {
    const { token } = req.body;
    const prisma = require('../lib/prisma');
    
    if (!token) {
      return res.status(400).json({ message: 'No token provided' });
    }
    
    console.log('[AUTH /verify-token] Verifying token...');
    
    // Verify the JWT
    const decoded = jwt.verify(
      token,
      process.env.SESSION_SECRET || 'mazebids-secret'
    );
    
    console.log('[AUTH /verify-token] Token verified for user:', decoded.userId);
    
    // Load user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await regenerateSession(req);
    await loginUser(req, user);
    req.session.user = { id: user.id };
    await saveSession(req);

    console.log('[AUTH /verify-token] Session saved:', req.sessionID);

    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');

    res.json({ 
      success: true, 
      message: 'Authenticated',
      userId: user.id,
      sessionId: req.sessionID
    });
  } catch (err) {
    console.error('[AUTH /verify-token] Error:', err.message);
    const isJwtError = err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError';
    res.status(isJwtError ? 401 : 500).json({
      message: isJwtError ? 'Invalid or expired token' : 'Session could not be saved'
    });
  }
});

router.get('/me', async (req, res) => {
  console.log('[AUTH /me] Incoming request');
  console.log('[AUTH /me] Session ID:', req.sessionID);
  console.log('[AUTH /me] Cookies:', req.headers.cookie);
  console.log('[AUTH /me] Session object:', JSON.stringify(req.session, null, 2));
  console.log('[AUTH /me] User from passport:', req.user?.id);
  console.log('[AUTH /me] Session user:', req.session.user?.id);
  console.log('[AUTH /me] Authenticated:', req.isAuthenticated());
  
  const userId = req.user?.id || req.session.user?.id;
  if (userId) {
    try {
      const prisma = require('../lib/prisma');
      const user = await prisma.user.findUnique({ 
        where: { id: userId },
        include: {
          referrals: true,
          redemptions: true
        }
      });
      if (user) {
        res.json(user);
        return;
      }
    } catch (err) {
      console.error('[AUTH /me] User lookup error:', err);
    }
  }
  
  res.status(401).json({ message: 'Not authenticated' });
});

router.post('/logout', (req, res) => {
  req.logout((err) => {
    if (err) return res.status(500).json({ message: 'Logout failed' });
    res.json({ message: 'Logged out' });
  });
});

module.exports = router;
