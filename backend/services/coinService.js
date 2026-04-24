const prisma = require('../lib/prisma');

async function updateUserCoins(userId, amount, source) {
  if (typeof amount !== 'number' || Number.isNaN(amount)) {
    throw new TypeError('Amount must be a valid number');
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, coins: true }
  });

  if (!user) {
    throw new Error('User not found');
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      coins: user.coins + amount
    },
    select: {
      coins: true
    }
  });

  return updatedUser.coins;
}

module.exports = {
  updateUserCoins
};
