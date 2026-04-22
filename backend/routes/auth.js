const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');

const router = express.Router();

router.get('/discord', passport.authenticate('discord', {
  scope: ['identify', 'guilds', 'guilds.join']
}));

router.get('/discord/callback',
  passport.authenticate('discord', {
    failureRedirect: `${process.env.FRONTEND_URL}/?error=auth_failed`
  }),
  (req, res) => {
    console.log('[AUTH] Discord callback - user authenticated:', req.user?.id);
    console.log('[AUTH] Session ID:', req.sessionID);
    
    // Create a JWT token for the user to use on frontend
    const token = jwt.sign(
      { userId: req.user.id },
      process.env.SESSION_SECRET || 'mazebids-secret',
      { expiresIn: '15m' }
    );
    
    console.log('[AUTH] Created auth token for user:', req.user.id);
    
    // Redirect to frontend with token
    res.redirect(`${process.env.FRONTEND_URL}/dashboard?auth_token=${token}`);
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
    
    // Set passport user data in session BEFORE sending response
    req.session.passport = { user: user.id };
    
    // Save session explicitly and wait for it to complete
    req.session.save((err) => {
      if (err) {
        console.error('[AUTH /verify-token] Session save error:', err);
        return res.status(500).json({ message: 'Session save failed' });
      }
      
      console.log('[AUTH /verify-token] Session saved:', req.sessionID);
      
      req.session.user = { id: user.id };
      
      // Force set session cookie
      res.cookie('connect.sid', req.sessionID, {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000
      });
      
      console.log('[AUTH /verify-token] Session cookie explicitly set');
      
      // Set additional cookie header to ensure browser stores it
      res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');
      
      res.json({ 
        success: true, 
        message: 'Authenticated',
        userId: user.id,
        sessionId: req.sessionID
      });
    });
  } catch (err) {
    console.error('[AUTH /verify-token] Error:', err.message);
    res.status(401).json({ message: 'Invalid or expired token' });
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
          redeemedCodes: true
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
