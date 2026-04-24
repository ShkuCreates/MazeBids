const express = require('express');
const { updateUserCoins } = require('../services/coinService');

const router = express.Router();

router.post('/update', async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { amount, source } = req.body || {};

    if (typeof amount !== 'number' || Number.isNaN(amount)) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    console.log('COIN UPDATE REQUEST', userId, amount, source);

    const updatedCoins = await updateUserCoins(userId, amount, source);

    console.log('✅ COINS UPDATED IN DB', updatedCoins);

    return res.json({
      success: true,
      coins: updatedCoins
    });
  } catch (err) {
    console.error('❌ COIN UPDATE ERROR', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
