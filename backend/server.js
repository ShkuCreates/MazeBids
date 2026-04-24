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

// TEMPORARY: Create missing tables - REMOVE AFTER USE
app.get('/api/fix-tables', async (req, res) => {
  try {
    console.log('[DB FIX] Checking and creating missing tables...');
    
    // Check if Notification table exists
    const checkTable = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'Notification'
    `;
    
    if (checkTable.length === 0) {
      console.log('[DB FIX] Creating Notification table...');
      await prisma.$executeRawUnsafe(`
        CREATE TABLE "Notification" (
          id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
          "userId" TEXT NOT NULL,
          type TEXT NOT NULL,
          message TEXT NOT NULL,
          amount INTEGER,
          "relatedId" TEXT,
          "isRead" BOOLEAN DEFAULT false,
          "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE
        )
      `);
      
      // Create indexes
      await prisma.$executeRawUnsafe(`CREATE INDEX "Notification_userId_idx" ON "Notification"("userId")`);
      await prisma.$executeRawUnsafe(`CREATE INDEX "Notification_isRead_idx" ON "Notification"("isRead")`);
      await prisma.$executeRawUnsafe(`CREATE INDEX "Notification_type_idx" ON "Notification"(type)`);
      await prisma.$executeRawUnsafe(`CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt")`);
      
      console.log('[DB FIX] Notification table created!');
      res.json({ success: true, message: 'Notification table created! Refresh the page.' });
    } else {
      console.log('[DB FIX] Notification table already exists');
      res.json({ success: true, message: 'All tables exist!' });
    }
  } catch (err) {
    console.error('[DB FIX] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
