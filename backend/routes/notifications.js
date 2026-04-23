const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');

// GET /notifications — fetch user's notifications (paginated)
router.get('/', async (req, res) => {
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
  try {
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;
    const typeFilter = req.query.type; // optional filter by type

    const where = { userId: req.user.id };
    if (typeFilter) {
      // Support comma-separated types: ?type=BID_PLACED,OUTBID
      const types = typeFilter.split(',');
      where.type = { in: types };
    }

    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.notification.count({
        where: { userId: req.user.id, isRead: false },
      }),
    ]);

    res.json({ notifications, unreadCount });
  } catch (err) {
    // Graceful degradation: if Notification table doesn't exist, return empty results
    if (err.code === 'P2021' || err.message.includes('does not exist')) {
      console.log('Notification table does not exist, returning empty results');
      return res.json({ notifications: [], unreadCount: 0 });
    }
    console.error('Fetch notifications error:', err);
    res.status(500).json({ message: 'Failed to fetch notifications' });
  }
});

// PATCH /notifications/:id/read — mark single notification as read
router.patch('/:id/read', async (req, res) => {
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
  try {
    const notification = await prisma.notification.findUnique({
      where: { id: req.params.id },
    });

    if (!notification) return res.status(404).json({ message: 'Notification not found' });
    if (notification.userId !== req.user.id) return res.status(403).json({ message: 'Forbidden' });

    const updated = await prisma.notification.update({
      where: { id: req.params.id },
      data: { isRead: true },
    });

    res.json(updated);
  } catch (err) {
    console.error('Mark read error:', err);
    res.status(500).json({ message: 'Failed to mark notification as read' });
  }
});

// PATCH /notifications/read-all — mark all user's notifications as read
router.patch('/read-all', async (req, res) => {
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
  try {
    const result = await prisma.notification.updateMany({
      where: { userId: req.user.id, isRead: false },
      data: { isRead: true },
    });

    res.json({ message: 'All notifications marked as read', count: result.count });
  } catch (err) {
    console.error('Mark all read error:', err);
    res.status(500).json({ message: 'Failed to mark all as read' });
  }
});

module.exports = router;
