require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const passport = require('passport');
const prisma = require('./lib/prisma');
const PrismaSessionStore = require('./lib/sessionStore');
// Debug: Log environment variables
console.log('[ENV] NODE_ENV:', process.env.NODE_ENV);
console.log('[ENV] PORT:', process.env.PORT);
console.log('[ENV] DATABASE_URL exists:', !!process.env.DATABASE_URL);
console.log('[ENV] DISCORD_CLIENT_ID exists:', !!process.env.DISCORD_CLIENT_ID);
console.log('[ENV] FRONTEND_URL:', process.env.FRONTEND_URL);

const app = express();
app.set('trust proxy', 1);
const isProduction = process.env.NODE_ENV === 'production';
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
app.use(require('./middleware/compression'));
app.use(express.json());
app.use(cookieParser());
app.use(session({
  store: new PrismaSessionStore(prisma),
  secret: process.env.SESSION_SECRET || 'mazebids-secret',
  proxy: true,
  resave: false,
  saveUninitialized: false, // Avoid creating anonymous DB sessions on every request
  cookie: {
    secure: isProduction,
    sameSite: 'lax',
    httpOnly: true,
    maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
  }
}));

// Passport initialization
require('./lib/passport');
app.use(passport.initialize());
app.use(passport.session());

// Initialize Discord bot (singleton)
require('./lib/discordBotSingleton');

// Initialize daily reset cron jobs
const { initCronJobs, stopCronJobs } = require('./lib/cronJobs');
initCronJobs();

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('[Server] SIGTERM received, shutting down gracefully...');
  stopCronJobs();
  server.close(() => {
    console.log('[Server] Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('[Server] SIGINT received, shutting down gracefully...');
  stopCronJobs();
  server.close(() => {
    console.log('[Server] Server closed');
    process.exit(0);
  });
});

// Start automator after 30 second delay
// Temporarily disabled while circuit breaker resets
// setTimeout(() => {
//   require('./lib/automator').startLifecycleAutomator();
// }, 30000);

// Socket.io logic
require('./lib/socket')(io);

// Routes
app.get('/', (req, res) => res.send('Mazebids API is live!'));
app.use('/api/health', require('./routes/health'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/auctions', require('./routes/auctions'));
app.use('/api/users', require('./routes/users'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/ads', require('./routes/ads'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/webhook', require('./discord').webhookService);
app.use('/api/admin', require('./routes/admin'));

// TEMPORARY: Manual migration endpoint - REMOVE AFTER USE
app.get('/api/run-migration', async (req, res) => {
  const { spawn } = require('child_process');
  try {
    console.log('[MIGRATION] Starting database push...');
    
    const result = await new Promise((resolve, reject) => {
      const proc = spawn('npx', ['prisma', 'db', 'push', '--accept-data-loss'], {
        cwd: process.cwd(),
        env: process.env,
        stdio: 'pipe'
      });
      
      let output = '';
      let errorOutput = '';
      
      proc.stdout.on('data', (data) => {
        output += data.toString();
        console.log('[MIGRATION]', data.toString());
      });
      
      proc.stderr.on('data', (data) => {
        errorOutput += data.toString();
        console.error('[MIGRATION ERROR]', data.toString());
      });
      
      proc.on('close', (code) => {
        if (code === 0) {
          resolve({ success: true, output });
        } else {
          reject(new Error(errorOutput || `Exit code ${code}`));
        }
      });
      
      // Timeout after 5 minutes
      setTimeout(() => {
        proc.kill();
        reject(new Error('Migration timeout'));
      }, 300000);
    });
    
    console.log('[MIGRATION] Completed successfully!');
    res.json({ success: true, message: 'Database schema updated! Restart server to apply changes.', output: result.output });
  } catch (err) {
    console.error('[MIGRATION] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
