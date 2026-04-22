const express = require('express');
const prisma = require('../lib/prisma');
const router = express.Router();

// Health check endpoint
router.get('/', async (req, res) => {
  try {
    // Test Prisma connection
    await prisma.$queryRaw`SELECT 1`;
    console.log('[HEALTH] Database connection OK');
    
    // Test Session table
    const sessionCount = await prisma.$queryRawUnsafe('SELECT COUNT(*)::int FROM "Session"');
    console.log('[HEALTH] Session table accessible:', sessionCount);
    
    res.json({ 
      status: 'OK',
      database: 'connected',
      timestamp: new Date().toISOString(),
      sessionCount: Number(sessionCount[0].count)
    });
  } catch (err) {
    console.error('[HEALTH ERROR]', err.message);
    res.status(500).json({ 
      status: 'ERROR',
      database: 'failed',
      error: err.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;
