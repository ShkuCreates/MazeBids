const express = require('express');
const { updateUserCoins } = require('../services/coinService');

const router = express.Router();

router.post('/update', async (req, res) => {
  const userId = req.user?.id || req.user?._id;
  const { amount, source } = req.body || {};

  console.log('COIN UPDATE REQUEST', userId, amount, source);

  if (!userId) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  if (typeof amount !== 'number' || Number.isNaN(amount)) {
    return res.status(400).json({ success: false, message: 'Invalid amount' });
  }

  try {
    const updatedBalance = await updateUserCoins(userId, amount, source);

    return res.json({
      success: true,
      coins: updatedBalance
    });
  } catch (error) {
    console.error('[CoinRoutes] Failed to update coins:', error);

    if (error.message === 'User not found') {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (error instanceof TypeError) {
      return res.status(400).json({ success: false, message: error.message });
    }

    return res.status(500).json({ success: false, message: 'Failed to update coins' });
  }
});

module.exports = router;
