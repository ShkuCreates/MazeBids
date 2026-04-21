const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');

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
  const { taskId, score, verificationToken } = req.body;

  try {
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) return res.status(404).json({ message: 'Task not found' });

    // 1. Anti-Cheat: Daily Coin Limit
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const dailyTransactions = await prisma.transaction.aggregate({
      where: {
        userId: req.user.id,
        type: 'EARN',
        timestamp: { gte: startOfDay }
      },
      _sum: { amount: true }
    });

    const dailyTotal = dailyTransactions._sum.amount || 0;
    if (dailyTotal + task.reward > 5000) { // Max 5000 coins per day
      return res.status(429).json({ message: 'Daily earning limit reached' });
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
      // Basic validation: ensure score is not impossibly high
      if (score > 1000) return res.status(400).json({ message: 'Invalid score' });
    }

    await prisma.$transaction([
      prisma.userTask.create({
        data: { userId: req.user.id, taskId }
      }),
      prisma.user.update({
        where: { id: req.user.id },
        data: { 
          coins: { increment: task.reward },
          totalEarned: { increment: task.reward }
        }
      }),
      prisma.transaction.create({
        data: {
          userId: req.user.id,
          amount: task.reward,
          type: 'EARN',
          description: `Completed task: ${task.title}`
        }
      })
    ]);

    res.json({ message: 'Task completed', reward: task.reward });
  } catch (err) {
    res.status(500).json({ message: 'Failed to complete task' });
  }
});

module.exports = router;
