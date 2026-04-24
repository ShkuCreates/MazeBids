// Reward sound effect - only works in browser after user interaction.
let rewardSound: HTMLAudioElement | null = null;

export const playRewardSound = () => {
  if (typeof window === 'undefined') return;

  try {
    if (!rewardSound) {
      rewardSound = new Audio('/sounds/reward.mp3');
      rewardSound.volume = 0.3;
    }

    rewardSound.currentTime = 0;
    rewardSound.play().catch(() => {});
  } catch {
    // Ignore blocked or unavailable audio silently.
  }
};

export const playCoinSound = playRewardSound;
