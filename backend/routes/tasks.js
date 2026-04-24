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
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
  const { taskId, score, reward, source } = req.body;

  console.log('[Tasks] Complete request:', { userId: req.user.id, taskId, score, reward, source });

  try {
    // LAZY RESET: Check and reset daily fields if needed
    await checkAndResetUserDaily(req.user.id);

    // 1. Anti-Cheat: Daily Coin Limit (using coinsEarnedToday field)
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { coinsEarnedToday: true }
    });

    const dailyTotal = user?.coinsEarnedToday || 0;

    let actualReward = reward;
    let taskTitle = source || 'Game reward';

    // If taskId is provided, validate against database task
    if (taskId) {
      const task = await prisma.task.findUnique({ where: { id: taskId } });
      if (!task) return res.status(404).json({ message: 'Task not found' });

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
      if (!reward) {
        return res.status(400).json({ message: 'Reward amount required when no taskId provided' });
      }
      actualReward = reward;
      console.log('Game reward (no taskId):', { score, actualReward, source });
    }

    // Check daily limit
    if (dailyTotal + actualReward > 5000) { // Max 5000 coins per day
      return res.status(429).json({
        message: 'Daily earning limit reached',
        current: dailyTotal,
        limit: 5000,
        remaining: Math.max(0, 5000 - dailyTotal)
      });
    }

    // Update coins using centralized function
    const coinResult = await updateUserCoins(req.user.id, actualReward, `Completed: ${taskTitle}`);

    if (!coinResult.success) {
      console.error('[Tasks] Coin update failed:', coinResult.error);
      return res.status(500).json({ message: 'Failed to process reward' });
    }

    // Notify user of coins earned
    await createNotification(req.user.id, 'COINS_EARNED', `+${actualReward} coins earned from: ${taskTitle}`, { amount: actualReward });

    console.log('[Tasks] Reward processed successfully:', { userId: req.user.id, reward: actualReward, newBalance: coinResult.newBalance });

    res.json({
      message: 'Reward processed',
      reward: actualReward,
      coins: coinResult.newBalance,
      dailyEarned: dailyTotal + actualReward,
      dailyLimit: 5000
    });
  } catch (err) {
    console.error('Task completion error:', err);
    res.status(500).json({ message: 'Failed to complete task' });
  }
});

module.exports = router;
