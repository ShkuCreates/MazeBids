require('dotenv').config();
const cluster = require('cluster');
const os = require('os');
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
const redis = require('redis');
const RedisStore = require('connect-redis').default;

const numCPUs = os.cpus().length;
const PORT = process.env.PORT || 5000;
const isProduction = process.env.NODE_ENV === 'production';

if (cluster.isMaster) {
  console.log(`Master ${process.pid} started, forking ${numCPUs} workers`);
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }
  cluster.on('exit', (worker) => {
    console.log(`Worker ${worker.process.pid} died`);
    cluster.fork();
  });
} else {
  console.log(`Worker ${process.pid} started`);

  // Initialize Redis client
  const redisClient = redis.createClient({
    url: process.env.REDIS_URL || `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`,
    legacyMode: false
  });

  redisClient.connect().catch(err => {
    console.error('[REDIS] Connection failed:', err.message);
    process.exit(1);
  });

  redisClient.on('error', (err) => {
    console.error('[REDIS] Error:', err);
  });

  redisClient.on('connect', () => {
    console.log('[REDIS] Connected to Redis');
  });

  const app = express();
  app.set('trust proxy', 1);

  app.use(helmet());
  app.use(morgan('combined'));
  app.use(compression());
  app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true
  }));
  app.use(express.json({ limit: '10mb' }));
  app.use(cookieParser());

  // Redis-backed session store for clustered workers
  app.use(session({
    store: new RedisStore({ client: redisClient }),
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

  // Initialize Discord bot (singleton - only in master process)
  if (cluster.isMaster) {
    require('./lib/discordBotSingleton');
  }

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
  app.use('/api/ads', require('./routes/ads'));

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Worker ${process.pid} listening on ${PORT}`);
  });
}

