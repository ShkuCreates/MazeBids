// Reward sound effect - only works after user interaction in browser
let rewardSound: HTMLAudioElement | null = null;

export const playRewardSound = () => {
  if (typeof window === 'undefined') return;

  try {
    if (!rewardSound) {
      rewardSound = new Audio('/sounds/reward.mp3');
      rewardSound.volume = 0.3;
      rewardSound.onerror = () => {
        if (rewardSound) {
          rewardSound.onerror = null;
          rewardSound.src = '/sounds/coin.mp3';
        }
      };
    }

    rewardSound.currentTime = 0;
    rewardSound.play().catch(() => {});
  } catch {
    // Ignore audio issues silently to avoid crashing reward flow.
  }
};

export const playCoinSound = playRewardSound;
