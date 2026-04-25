const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { createNotification } = require('../lib/notificationHelper');
const { checkAndResetUserDaily, addDailyEarnings } = require('../lib/dailyReset');
const { updateUserCoins } = require('../lib/coinHelper');

// Get available tasks
router.get('/', async (req, res) => {
  try {
    const tasks = await prisma.task.findMany();
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch tasks' });
  }
});

// Complete a task (game, ad, etc.)
router.post('/complete', async (req, res) => {
  const traceId = req.body.traceId || "no-trace";
  const claimId = req.body.claimId || `${traceId}-${Date.now()}`;

  // Prevent caching of reward responses
  res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');

  try {
    console.log("========== CLAIM START ==========");
    console.log("TRACE:", traceId);
    console.log("CLAIM ID:", claimId);
    console.log("BODY:", req.body);
    console.log("USER:", req.user);

    const userId = req.user?.id;
    if (!userId) {
      console.log("NO USER");
      return res.status(401).json({ error: "No user" });
    }

    const { reward } = req.body;
    if (!reward) {
      console.log("NO REWARD");
      return res.status(400).json({ error: "No reward" });
    }

    // IDEMPOTENCY CHECK: Verify claim not already processed
    const existingClaim = await prisma.transaction.findFirst({
      where: {
        userId,
        description: { contains: claimId }
      }
    });

    if (existingClaim) {
      console.log("DUPLICATE CLAIM - SKIPPING", { claimId, existingClaimId: existingClaim.id });
      return res.json({
        success: true,
        alreadyClaimed: true,
        coins: existingClaim.amount
      });
    }

    console.log("FETCHING USER BEFORE UPDATE");

    const before = await prisma.user.findUnique({
      where: { id: userId }
    });

    console.log("COINS BEFORE:", before?.coins);

    console.log("CALLING updateUserCoins");

    const updated = await updateUserCoins(userId, reward, `Claim: ${claimId}`);

    console.log("UPDATED RESULT:", updated);

    const after = await prisma.user.findUnique({
      where: { id: userId }
    });

    console.log("COINS AFTER DB CHECK:", after?.coins);

    console.log("========== CLAIM END ==========");

    res.json({ success: true, claimId });

  } catch (error) {
    console.error("ERROR TRACE:", traceId, error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
