// Reward sound effect - only works after user interaction in browser
export const playRewardSound = () => {
  if (typeof window === 'undefined') return;

  try {
    const audio = new Audio('/sounds/reward.mp3');
    audio.volume = 0.3;
    audio.play().catch(() => {});
  } catch {
    // Ignore audio issues silently to avoid crashing reward flow.
  }
};

export const playCoinSound = playRewardSound;
