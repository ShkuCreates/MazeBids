require('dotenv').config();
const cluster = require('cluster');
const express = require('express');
const http = require('http');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const { apiLimiter } = require('./middleware/rateLimit');
const { Server } = require('socket.io');
const passport = require('passport');
const prisma = require('./lib/prisma');
const PrismaSessionStore = require('./lib/sessionStore');

const numCPUs = parseInt(process.env.WEB_CONCURRENCY) || 1;
const PORT = process.env.PORT || 5000;
const isProduction = process.env.NODE_ENV === 'production';

if (cluster.isMaster) {
  console.log(`Master ${process.pid} started, forking ${numCPUs} workers`);
  
  // Initialize Discord bot (singleton - ONLY in Master)
  console.log('[STARTUP] Initializing Discord bot in Master process...');
  require('./lib/discordBotSingleton');

  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }
  cluster.on('exit', (worker) => {
    console.log(`Worker ${worker.process.pid} died`);
    cluster.fork();
  });
} else {
  console.log(`Worker ${process.pid} started`);

  const app = express();
  app.set('trust proxy', 1);

  app.use(helmet());
  app.use(morgan('combined'));
  app.use(compression());
  app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true
  }));
  app.use(require('./middleware/compression'));
  app.use(express.json());
  app.use(cookieParser());

// Session store using Prisma (low memory, persistent)
  console.log('[SESSION] Initializing Prisma DB Session Store');
  const sessionStore = new PrismaSessionStore(prisma);

  app.use(session({
    store: sessionStore,
    secret: process.env.SESSION_SECRET || 'mazebids-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: isProduction,
      sameSite: 'lax',
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000
    }
  }));

  require('./lib/passport');
  app.use(passport.initialize());
  app.use(passport.session());

  app.use('/api/', apiLimiter);

  const server = http.createServer(app);
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  require('./lib/socket')(io);

  app.get('/', (req, res) => res.send('Mazebids API live!'));
  app.use('/api/health', require('./routes/health'));
  app.use('/api/auth', require('./routes/auth'));
  app.use('/api/auctions', require('./routes/auctions'));
  app.use('/api/users', require('./routes/users'));
  app.use('/api/tasks', require('./routes/tasks'));
  app.use('/api/coins', require('./routes/coinRoutes'));
  app.use('/api/ads', require('./routes/ads'));
  app.use('/api/notifications', require('./routes/notifications'));
  app.use('/api/webhook', require('./discord').webhookService);

  console.log(`[STARTUP] Worker ${process.pid} preparing to listen on port ${PORT}...`);
  
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[STARTUP] ✅ Worker ${process.pid} is listening on port ${PORT}`);
    console.log(`[STARTUP] API ready at http://0.0.0.0:${PORT}`);
    console.log('[SESSION] Using Prisma DB session store');
  });

  // Handle server errors
  server.on('error', (err) => {
    console.error(`[SERVER ERROR] ${err.code}: ${err.message}`);
    process.exit(1);
  });
}

