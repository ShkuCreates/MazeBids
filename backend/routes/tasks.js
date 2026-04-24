const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { createNotification } = require('../lib/notificationHelper');
const { checkAndResetUserDaily, addDailyEarnings } = require('../lib/dailyReset');

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
  const { taskId, score, reward, verificationToken } = req.body;

  try {
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) return res.status(404).json({ message: 'Task not found' });

    // Use provided reward or fall back to task reward
    const actualReward = reward || task.reward;

    console.log('Task completion:', { taskId, score, actualReward, taskReward: task.reward });

    // LAZY RESET: Check and reset daily fields if needed
    await checkAndResetUserDaily(req.user.id);

    // 1. Anti-Cheat: Daily Coin Limit (using coinsEarnedToday field)
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { coinsEarnedToday: true }
    });

    const dailyTotal = user?.coinsEarnedToday || 0;
    if (dailyTotal + actualReward > 5000) { // Max 5000 coins per day
      return res.status(429).json({
        message: 'Daily earning limit reached',
        current: dailyTotal,
        limit: 5000,
        remaining: Math.max(0, 5000 - dailyTotal)
      });
    }

    // 2. Anti-Cheat: Cooldown Check
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

    // 3. Validation Logic (Score check for games)
    if (task.type === 'GAME' && score !== undefined) {
      // Validate score is a non-negative number
      const scoreNum = parseInt(score);
      if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > 999999) {
        return res.status(400).json({ message: 'Invalid score' });
      }
    }

    // 4. Update daily earnings and complete task
    const updatedUser = await prisma.$transaction([
      prisma.userTask.create({
        data: { userId: req.user.id, taskId }
      }),
      prisma.user.update({
        where: { id: req.user.id },
        data: {
          coins: { increment: actualReward },
          totalEarned: { increment: actualReward },
          coinsEarnedToday: { increment: actualReward } // Track daily earnings
        },
        select: {
          coins: true,
          coinsEarnedToday: true
        }
      }),
      prisma.transaction.create({
        data: {
          userId: req.user.id,
          amount: actualReward,
          type: 'EARN',
          description: `Completed task: ${task.title}`
        }
      })
    ]);

    // Notify user of coins earned
    await createNotification(req.user.id, 'COINS_EARNED', `+${actualReward} coins earned from: ${task.title}`, { amount: actualReward });

    res.json({
      message: 'Task completed',
      reward: actualReward,
      coins: updatedUser[1].coins,
      dailyEarned: dailyTotal + actualReward,
      dailyLimit: 5000
    });
  } catch (err) {
    console.error('Task completion error:', err);
    res.status(500).json({ message: 'Failed to complete task' });
  }
});

module.exports = router;
