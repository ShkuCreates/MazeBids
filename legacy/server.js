const express = require('express');
const session = require('express-session');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Mock data
let auctions = [];
let subscribers = new Set();
let usersData = {};

// Middleware
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(cookieParser());
app.use(express.json());
app.use(express.static('.'));

// Session - 24h persistent login
app.use(session({
  secret: 'mazebids-secret-2024',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false,
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000
  }
}));

// User data
app.use((req, res, next) => {
  if (req.session.user) {
    const userId = req.session.user.id;
    if (!usersData[userId]) {
      usersData[userId] = {
        coins: 1000,
        completedTasks: [],
        notifications: true
      };
    }
    req.userData = usersData[userId];
  }
  next();
});

// Static pages
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/auctions.html', (req, res) => res.sendFile(path.join(__dirname, 'auctions.html')));
app.get('/earn.html', (req, res) => res.sendFile(path.join(__dirname, 'earn.html')));

// === DISCORD OAUTH ===
const DISCORD_CLIENT_ID = '1496112888224415804';
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET || 'your_discord_bot_secret_here_change_me';
const DISCORD_TOKEN_URL = 'https://discord.com/api/oauth2/token';
const DISCORD_USER_URL = 'https://discord.com/api/users/@me';

// Discord OAuth redirect
app.get('/auth/discord', (req, res) => {
  req.session.returnTo = req.query.return_to || '/';
  const clientId = DISCORD_CLIENT_ID;
  const redirectUri = 'http://localhost:3000/auth/discord/callback';
  const scopes = 'identify';
  const authUrl = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scopes}`;
  res.redirect(authUrl);
});

app.get('/auth/discord/callback', async (req, res) => {
  const code = req.query.code;
  const error = req.query.error;
  
  if (error) {
    console.log('Discord OAuth error:', error);
    return res.redirect('/?error=' + error);
  }
  
  if (!code) {
    console.log('No auth code');
    return res.redirect('/?error=no_code');
  }

  try {
    // Get token
    const tokenRes = await fetch(DISCORD_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: DISCORD_CLIENT_ID,
        client_secret: DISCORD_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code,
        redirect_uri: 'http://localhost:3000/auth/discord/callback'
      })
    });

    const tokenData = await tokenRes.json();
    if (tokenData.error) {
      console.log('Token error:', tokenData);
      return res.redirect('/?error=token_failed');
    }

    // Get user info
    const userRes = await fetch(DISCORD_USER_URL, {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });
    const user = await userRes.json();

    req.session.user = user;
    req.session.accessToken = tokenData.access_token;
    
    const returnTo = req.session.returnTo || '/';
    res.redirect(returnTo + '?login=success');
  } catch (err) {
    console.error('OAuth error:', err);
    res.redirect('/?error=server_error');
  }
});

// APIs
app.get('/api/user', (req, res) => {
  if (req.session.user) {
    res.json({ user: req.session.user });
  } else {
    res.status(401).json({ error: 'Not logged in' });
  }
});

app.get('/api/user-data', (req, res) => {
  if (req.userData) {
    res.json(req.userData);
  } else {
    res.status(401).json({ error: 'Login required' });
  }
});

app.post('/api/earn-coins', (req, res) => {
  if (!req.userData) return res.status(401).json({ error: 'Login required' });
  const { taskId, coins } = req.body;
  if (req.userData.completedTasks.includes(taskId)) {
    return res.json({ success: false, error: 'Already completed' });
  }
  if (coins < 1 || coins > 100) {
    return res.json({ success: false, error: 'Invalid coin amount' });
  }
  req.userData.coins += coins;
  req.userData.completedTasks.push(taskId);
  res.json({ success: true, coins: req.userData.coins, message: 'Coins earned!' });
});

app.post('/api/place-bid', (req, res) => {
  if (!req.userData) return res.status(401).json({ error: 'Login required' });
  
  const { auctionId, bidAmount } = req.body;
  const auction = auctions.find(a => a.id === auctionId);
  
  if (!auction) {
    return res.status(404).json({ error: 'Auction not found' });
  }
  
  if (req.userData.coins < bidAmount) {
    return res.json({ success: false, error: 'Insufficient coins' });
  }
  
  if (bidAmount <= (auction.currentBid || auction.startingBid || 0)) {
    return res.json({ success: false, error: 'Bid must be higher than current bid' });
  }
  
  // Refund previous bidder
  if (auction.currentBidder && auction.currentBidder !== req.session.user.id) {
    const prevBidder = usersData[auction.currentBidder];
    if (prevBidder) {
      prevBidder.coins += auction.currentBid;
    }
  }
  
  // Deduct coins from current bidder
  req.userData.coins -= bidAmount;
  auction.currentBid = bidAmount;
  auction.currentBidder = req.session.user.id;
  auction.bidderName = req.session.user.username;
  
  res.json({ success: true, coins: req.userData.coins, auction });
});

app.post('/api/subscribe-notify', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Login required' });
  }
  subscribers.add(req.session.user.id);
  res.json({ success: true, message: 'Subscribed to auction notifications!' });
});

app.get('/api/auctions', (req, res) => res.json(auctions));

app.post('/api/auctions', (req, res) => {
  const isAdmin = req.session.user?.id === '1496112888224415804';
  if (!isAdmin) return res.status(403).json({ error: 'Admin only' });
  req.body.id = Date.now().toString();
  auctions.unshift(req.body);
  res.json(req.body);
});

app.delete('/api/auctions/:id', (req, res) => {
  const isAdmin = req.session.user?.id === '1496112888224415804';
  if (!isAdmin) return res.status(403).json({ error: 'Admin only' });
  auctions = auctions.filter(a => a.id !== req.params.id);
  res.json({ success: true });
});

app.get('/auth/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/'));
});

app.listen(PORT, () => console.log(`MazeBids: http://localhost:${PORT}`));

