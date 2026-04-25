let rewardSound: HTMLAudioElement | null = null;

export const playRewardSound = () => {
  if (typeof window === 'undefined') return;
  try {
    // Apple Pay style coin sound using Web Audio API
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;

    const ctx = new AudioContext();

    const playTone = (freq: number, startTime: number, duration: number, gainVal: number) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.frequency.setValueAtTime(freq, startTime);
      oscillator.frequency.exponentialRampToValueAtTime(freq * 1.5, startTime + duration * 0.3);

      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(gainVal, startTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      oscillator.type = 'sine';
      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    };

    const now = ctx.currentTime;
    playTone(600, now, 0.15, 0.6);
    playTone(900, now + 0.08, 0.15, 0.5);
    playTone(1200, now + 0.16, 0.18, 0.4);

  } catch {
    // Ignore audio errors silently
  }
};

export const playCoinSound = playRewardSound;
