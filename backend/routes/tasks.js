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
  try {
    console.log("BODY:", req.body);
    console.log("USER:", req.user);

    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const { reward } = req.body;

    if (!reward || isNaN(reward)) {
      return res.status(400).json({ error: "Invalid reward" });
    }

    await updateUserCoins(userId, reward);

    return res.json({ success: true });

  } catch (error) {
    console.error("TASK COMPLETE ERROR:", error);
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
