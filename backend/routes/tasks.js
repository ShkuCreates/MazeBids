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
  console.log('[Tasks] Request received:', { hasUser: !!req.user, userId: req.user?.id, body: req.body });

  // Validate authentication
  if (!req.user || !req.user.id) {
    console.error('[Tasks] ERROR: Unauthorized - no user or userId');
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const { taskId, score, reward, source } = req.body;

  console.log('[Tasks] Complete request:', { userId: req.user.id, taskId, score, reward, source });

  try {
    // LAZY RESET: Check and reset daily fields if needed
    console.log('[Tasks] Step 1: Check and reset daily fields');
    await checkAndResetUserDaily(req.user.id);

    // 1. Anti-Cheat: Daily Coin Limit (using coinsEarnedToday field)
    console.log('[Tasks] Step 2: Fetch user for daily limit check');
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { coinsEarnedToday: true }
    });

    if (!user) {
      console.error('[Tasks] ERROR: User not found in database:', req.user.id);
      return res.status(404).json({ message: 'User not found' });
    }

    const dailyTotal = user.coinsEarnedToday || 0;

    let actualReward = reward;
    let taskTitle = source || 'Game reward';

    // If taskId is provided, validate against database task
    if (taskId) {
      console.log('[Tasks] Step 3: Validate taskId against database');
      const task = await prisma.task.findUnique({ where: { id: taskId } });
      if (!task) {
        console.error('[Tasks] ERROR: Task not found:', taskId);
        return res.status(404).json({ message: 'Task not found' });
      }

      actualReward = reward || task.reward;
      taskTitle = task.title;

      console.log('Task completion:', { taskId, score, actualReward, taskReward: task.reward });

      // 2. Anti-Cheat: Cooldown Check (only for database tasks)
      const lastCompletion = await prisma.userTask.findFirst({
        where: { userId: req.user.id, taskId },
        orderBy: { completedAt: 'desc' }
      });

      if (lastCompletion) {
        const diff = (new Date() - lastCompletion.completedAt) / 1000 / 60; // in minutes
        if (diff < task.cooldown) {
          return res.status(429).json({ message: `Please wait ${Math.ceil(task.cooldown - diff)} more minutes` });
        }
      }

      // 3. Validation Logic (Score check for database game tasks)
      if (task.type === 'GAME' && score !== undefined) {
        const scoreNum = parseInt(score);
        if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > 999999) {
          return res.status(400).json({ message: 'Invalid score' });
        }
      }

      // Create the task completion record (only for database tasks)
      await prisma.userTask.create({
        data: { userId: req.user.id, taskId }
      });
    } else {
      // For games without taskId (standalone games)
      console.log('[Tasks] Step 3: No taskId provided, validating reward');
      if (!reward) {
        console.error('[Tasks] ERROR: Reward required when no taskId provided');
        return res.status(400).json({ message: 'Reward amount required when no taskId provided' });
      }
      actualReward = reward;
      console.log('Game reward (no taskId):', { score, actualReward, source });
    }

    // Validate reward value
    console.log('[Tasks] Step 4: Validate reward value');
    if (!actualReward || actualReward <= 0 || isNaN(actualReward)) {
      console.error('[Tasks] ERROR: Invalid reward value:', actualReward);
      return res.status(400).json({ message: 'Invalid reward amount' });
    }

    // Check daily limit
    console.log('[Tasks] Step 5: Check daily limit');
    if (dailyTotal + actualReward > 5000) { // Max 5000 coins per day
      return res.status(429).json({
        message: 'Daily earning limit reached',
        current: dailyTotal,
        limit: 5000,
        remaining: Math.max(0, 5000 - dailyTotal)
      });
    }

    // Update coins using centralized function
    console.log('[Tasks] Step 6: Call updateUserCoins', { userId: req.user.id, reward: actualReward, source: taskTitle });
    const coinResult = await updateUserCoins(req.user.id, actualReward, `Completed: ${taskTitle}`);

    if (!coinResult.success) {
      console.error('[Tasks] ERROR: Coin update failed:', coinResult.error);
      return res.status(500).json({ message: 'Failed to process reward', error: coinResult.error });
    }

    // Notify user of coins earned
    console.log('[Tasks] Step 7: Create notification');
    await createNotification(req.user.id, 'COINS_EARNED', `+${actualReward} coins earned from: ${taskTitle}`, { amount: actualReward });

    console.log('[Tasks] SUCCESS: Reward processed:', { userId: req.user.id, reward: actualReward, newBalance: coinResult.newBalance });

    res.json({
      success: true,
      message: 'Reward processed',
      reward: actualReward,
      coins: coinResult.newBalance,
      dailyEarned: dailyTotal + actualReward,
      dailyLimit: 5000
    });
  } catch (err) {
    console.error('[Tasks] CRITICAL ERROR:', err);
    console.error('[Tasks] Error stack:', err.stack);
    console.error('[Tasks] Error details:', {
      message: err.message,
      code: err.code,
      meta: err.meta
    });
    res.status(500).json({ message: 'Failed to complete task', error: err.message });
  }
});

module.exports = router;
