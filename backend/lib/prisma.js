const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['error', 'warn'],
  errorFormat: 'pretty',
  datasources: {
    db: {
      url: process.env.DATABASE_URL + '?connection_limit=10&pool_timeout=20'
    }
  }
});

prisma.$on('error', (e) => {
  console.error('[PRISMA ERROR]', e.message);
});

module.exports = prisma;
