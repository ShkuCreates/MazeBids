const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['error', 'warn'],
  errorFormat: 'pretty',
});

// Add connection timeout handling
prisma.$on('error', (e) => {
  console.error('[PRISMA ERROR]', e.message);
});

module.exports = prisma;
