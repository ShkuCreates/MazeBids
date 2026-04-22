const express = require('express');
const passport = require('passport');

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
    console.log('[AUTH] Session data:', req.session);
    // Session is now established by passport, redirect to dashboard
    res.redirect(`${process.env.FRONTEND_URL}/dashboard?login_success=true`);
  }
);

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
