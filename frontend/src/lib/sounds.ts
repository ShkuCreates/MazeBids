// Coin sound effect - only works in browser
let coinSound: HTMLAudioElement | null = null;

export const playCoinSound = () => {
  // Only run in browser environment
  if (typeof window === 'undefined') return;

  try {
    if (!coinSound) {
      coinSound = new Audio('/sounds/coin.mp3');
      coinSound.volume = 0.3;
    }
    
    coinSound.currentTime = 0;
    coinSound.play().catch(err => {
      console.log('Audio play failed (user may need to interact first):', err);
    });
  } catch (err) {
    console.log('Coin sound error:', err);
  }
};
