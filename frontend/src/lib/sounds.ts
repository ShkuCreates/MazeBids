// Coin sound effect
const coinSound = new Audio('/sounds/coin.mp3');
coinSound.volume = 0.3;

export const playCoinSound = () => {
  try {
    coinSound.currentTime = 0;
    coinSound.play().catch(err => {
      console.log('Audio play failed (user may need to interact first):', err);
    });
  } catch (err) {
    console.log('Coin sound error:', err);
  }
};
