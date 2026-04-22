require('dotenv').config();
const cluster = require('cluster');
const os = require('os');
const express = require('express');
const http = require('http');
const { Server: IOServer } = require('socket.io');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const passport = require('passport');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const { apiLimiter } = require('./middleware/rateLimit');
const connectRedis = require('connect-redis');
const RedisStore = connectRedis(session);
const Redis = require('redis');

// Worker config
const numCPUs = os.cpus().length;
const isProduction = process.env.NODE_ENV === 'production';
const PORT = process.env.PORT || 5000;

// Redis client for sessions
const redisClient = Redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  retry_strategy: (options) => Math.min(options.attempt * 100, 3000)
});
redisClient.connect().catch(console.error);

if (cluster.isMaster) {
  console.log(`Master ${process.pid} is running`);
  console.log(`Forking ${numCPUs} workers`);

  // Fork workers
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died. Forking new one...`);
    cluster.fork();
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    redisClient.quit();
    process.exit(0);
  });
} else {
  // Worker processes
  console.log(`Worker ${process.pid} started`);

  const app = express();
  app.set('trust proxy', 1);

  // Enhanced middleware stack
  app.use(helmet());
  app.use(morgan('combined'));
  app.use(compression());
  app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true
  }));
  app.use(express.json({ limit: '10mb' }));
  app.use(cookieParser());

  // Redis session store
  app.use(session({
    store: new RedisStore({ client: redisClient }),
    secret: process.env.SESSION_SECRET || 'mazebids-secret',
    proxy: true,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: isProduction,
      sameSite: 'lax',
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000
    }
  }));

  // Passport
  require('./lib/passport');
  app.use(passport.initialize());
  app.use(passport.session());

  // Rate limiting
  app.use('/api/', apiLimiter);

  const server = http.createServer(app);
  const io = new IOServer(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true
    },
    // Sticky sessions for socket.io clustering
    adapter: require('socket.io-redis')({
      host: 'localhost',
      port: 6379
    })
  });

  // Socket logic
  require('./lib/socket')(io);

  // Routes
  app.get('/', (req, res) => res.send('Mazebids API is live with clustering!'));
  app.use('/api/health', require('./routes/health'));
  app.use('/api/auth', require('./routes/auth'));
  app.use('/api/auctions', require('./routes/auctions'));
  app.use('/api/users', require('./routes/users'));
  app.use('/api/tasks', require('./routes/tasks'));
  app.use('/api/ads', require('./routes/ads'));

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Worker ${process.pid} listening on port ${PORT}`);
  });
}

