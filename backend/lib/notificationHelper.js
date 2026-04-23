const prisma = require('./prisma');

// Singleton io instance — set during server startup
let io = null;

function setIo(ioInstance) {
  io = ioInstance;
}

function getIo() {
  return io;
}

/**
 * Create a notification in DB and push it to the user via socket.io
 * @param {string} userId - The user who should receive the notification
 * @param {string} type - Notification type (BID_PLACED, OUTBID, WIN, COINS_EARNED, COINS_SPENT, REWARD, REFUND, SYSTEM)
 * @param {string} message - Human-readable message
 * @param {object} [options] - Optional fields
 * @param {number} [options.amount] - Coin amount if relevant
 * @param {string} [options.relatedId] - Related auction or transaction ID
 */
async function createNotification(userId, type, message, options = {}) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        message,
        amount: options.amount || null,
        relatedId: options.relatedId || null,
      },
    });

    // Push to user in real-time via socket.io
    if (io) {
      io.to(`user:${userId}`).emit('notification', notification);
    }

    return notification;
  } catch (err) {
    // Graceful degradation: if Notification table doesn't exist, still push via socket
    console.error('Failed to create notification (table may not exist):', err.message);
    if (io) {
      const notification = {
        id: `temp-${Date.now()}`,
        userId,
        type,
        message,
        amount: options.amount || null,
        relatedId: options.relatedId || null,
        isRead: false,
        createdAt: new Date().toISOString(),
      };
      io.to(`user:${userId}`).emit('notification', notification);
    }
    return null;
  }
}

module.exports = { setIo, getIo, createNotification };
