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
router.post('/verify-token', (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ message: 'No token provided' });
    }
    
    console.log('[AUTH] Verifying token...');
    
    // Verify the JWT
    const decoded = jwt.verify(
      token,
      process.env.SESSION_SECRET || 'mazebids-secret'
    );
    
    console.log('[AUTH] Token verified for user:', decoded.userId);
    
    // Manually set user in session (simulating passport login)
    req.session.passport = { user: decoded.userId };
    
    console.log('[AUTH] Session established after token verification');
    
    res.json({ 
      success: true, 
      message: 'Authenticated',
      userId: decoded.userId
    });
  } catch (err) {
    console.error('[AUTH] Token verification failed:', err.message);
    res.status(401).json({ message: 'Invalid or expired token' });
  }
});

router.get('/me', (req, res) => {
  console.log('[AUTH /me] Session ID:', req.sessionID);
  console.log('[AUTH /me] User:', req.user?.id);
  console.log('[AUTH /me] Authenticated:', req.isAuthenticated());
  if (req.user) {
    res.json(req.user);
  } else {
    res.status(401).json({ message: 'Not authenticated' });
  }
});

router.post('/logout', (req, res) => {
  req.logout((err) => {
    if (err) return res.status(500).json({ message: 'Logout failed' });
    res.json({ message: 'Logged out' });
  });
});

module.exports = router;
