require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const passport = require('passport');
const prisma = require('./lib/prisma');

// Debug: Log environment variables
console.log('[ENV] NODE_ENV:', process.env.NODE_ENV);
console.log('[ENV] PORT:', process.env.PORT);
console.log('[ENV] DATABASE_URL exists:', !!process.env.DATABASE_URL);
console.log('[ENV] DISCORD_CLIENT_ID exists:', !!process.env.DISCORD_CLIENT_ID);
console.log('[ENV] FRONTEND_URL:', process.env.FRONTEND_URL);

const app = express();
app.set('trust proxy', 1);
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());
app.use(session({
  secret: process.env.SESSION_SECRET || 'mazebids-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // Only HTTPS in production
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    httpOnly: true,
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    domain: process.env.NODE_ENV === 'production' ? undefined : 'localhost' // Let browser set domain in production
  }
}));

// Passport initialization
require('./lib/passport');
app.use(passport.initialize());
app.use(passport.session());

// Start automator after 30 second delay
// Temporarily disabled while circuit breaker resets
// setTimeout(() => {
//   require('./lib/automator').startLifecycleAutomator();
// }, 30000);

// Socket.io logic
require('./lib/socket')(io);

// Routes
app.get('/', (req, res) => res.send('Mazebids API is live!'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/auctions', require('./routes/auctions'));
app.use('/api/users', require('./routes/users'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/ads', require('./routes/ads'));

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
