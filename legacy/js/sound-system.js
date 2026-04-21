/**
 * MAZEBIDS SOUND SYSTEM
 * Professional audio management with Web Audio API
 */

class SoundSystem {
  constructor() {
    this.audioContext = null;
    this.gainNode = null;
    this.sounds = new Map();
    this.masterVolume = 0.7;
    this.initialized = false;
    this.soundEnabled = localStorage.getItem('soundEnabled') !== 'false';
    this.soundVolume = parseFloat(localStorage.getItem('soundVolume') || '0.7');
  }

  /**
   * Initialize audio context and create sounds
   */
  async init() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.gainNode = this.audioContext.createGain();
      this.gainNode.connect(this.audioContext.destination);
      this.gainNode.gain.value = this.soundVolume;
      
      // Create all sounds
      this.createSounds();
      this.initialized = true;
      
      // Add click listener to resume audio context
      document.addEventListener('click', () => {
        if (this.audioContext && this.audioContext.state === 'suspended') {
          this.audioContext.resume();
        }
      }, { once: true });
    } catch (err) {
      console.warn('Audio system unavailable:', err);
    }
  }

  /**
   * Create all sound effects using Web Audio API
   */
  createSounds() {
    // Click sound - short beep
    this.sounds.set('click', () => this.playBeep(400, 0.1, 0.1));
    
    // Success sound - ascending beeps
    this.sounds.set('success', () => this.playSuccessSound());
    
    // Error sound - descending beep
    this.sounds.set('error', () => this.playErrorSound());
    
    // Coin sound - ping
    this.sounds.set('coin', () => this.playBeep(800, 0.15, 0.2));
    
    // Bid placed sound
    this.sounds.set('bid', () => this.playBidSound());
    
    // Task completed sound
    this.sounds.set('task-complete', () => this.playTaskCompleteSound());
    
    // Notification sound
    this.sounds.set('notification', () => this.playNotificationSound());
    
    // Hover sound - subtle
    this.sounds.set('hover', () => this.playBeep(600, 0.05, 0.05));
    
    // Level up / achievement sound
    this.sounds.set('achievement', () => this.playAchievementSound());
  }

  /**
   * Simple beep
   */
  playBeep(frequency = 400, duration = 0.1, volumeMultiplier = 1) {
    if (!this.shouldPlaySound()) return;

    const osc = this.audioContext.createOscillator();
    const env = this.audioContext.createGain();
    
    osc.type = 'sine';
    osc.frequency.value = frequency;
    
    env.gain.setValueAtTime(0.3 * volumeMultiplier, this.audioContext.currentTime);
    env.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
    
    osc.connect(env);
    env.connect(this.gainNode);
    
    osc.start(this.audioContext.currentTime);
    osc.stop(this.audioContext.currentTime + duration);
  }

  /**
   * Success sound - ascending beeps
   */
  playSuccessSound() {
    if (!this.shouldPlaySound()) return;

    const frequencies = [523.25, 659.25, 783.99]; // C5, E5, G5
    const timing = [0, 0.1, 0.2];

    frequencies.forEach((freq, index) => {
      setTimeout(() => {
        this.playBeep(freq, 0.15, 1);
      }, timing[index] * 1000);
    });
  }

  /**
   * Error sound - descending beep
   */
  playErrorSound() {
    if (!this.shouldPlaySound()) return;

    const frequencies = [600, 400, 200];
    const timing = [0, 0.1, 0.2];

    frequencies.forEach((freq, index) => {
      setTimeout(() => {
        this.playBeep(freq, 0.15, 0.8);
      }, timing[index] * 1000);
    });
  }

  /**
   * Bid placed sound
   */
  playBidSound() {
    if (!this.shouldPlaySound()) return;

    const osc = this.audioContext.createOscillator();
    const env = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();
    
    osc.type = 'square';
    osc.frequency.setValueAtTime(400, this.audioContext.currentTime);
    osc.frequency.exponentialRampToValueAtTime(600, this.audioContext.currentTime + 0.2);
    
    filter.type = 'highpass';
    filter.frequency.value = 300;
    
    env.gain.setValueAtTime(0.2, this.audioContext.currentTime);
    env.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
    
    osc.connect(filter);
    filter.connect(env);
    env.connect(this.gainNode);
    
    osc.start(this.audioContext.currentTime);
    osc.stop(this.audioContext.currentTime + 0.2);
  }

  /**
   * Task completed sound
   */
  playTaskCompleteSound() {
    if (!this.shouldPlaySound()) return;

    const frequencies = [400, 600, 800, 1000];
    
    frequencies.forEach((freq, index) => {
      setTimeout(() => {
        const osc = this.audioContext.createOscillator();
        const env = this.audioContext.createGain();
        
        osc.type = 'sine';
        osc.frequency.value = freq;
        
        env.gain.setValueAtTime(0.15, this.audioContext.currentTime);
        env.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
        
        osc.connect(env);
        env.connect(this.gainNode);
        
        osc.start(this.audioContext.currentTime);
        osc.stop(this.audioContext.currentTime + 0.1);
      }, index * 50);
    });
  }

  /**
   * Notification sound
   */
  playNotificationSound() {
    if (!this.shouldPlaySound()) return;

    this.playBeep(800, 0.2, 0.8);
    setTimeout(() => {
      this.playBeep(1000, 0.2, 0.8);
    }, 150);
  }

  /**
   * Achievement/level up sound
   */
  playAchievementSound() {
    if (!this.shouldPlaySound()) return;

    const frequencies = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    
    frequencies.forEach((freq, index) => {
      setTimeout(() => {
        this.playBeep(freq, 0.2, 1);
      }, index * 80);
    });
  }

  /**
   * Play sound by name
   */
  play(soundName) {
    if (!this.initialized) {
      this.init().then(() => this.play(soundName));
      return;
    }

    const sound = this.sounds.get(soundName);
    if (sound && this.soundEnabled) {
      try {
        sound();
      } catch (err) {
        console.warn('Error playing sound:', soundName, err);
      }
    }
  }

  /**
   * Check if sounds should play
   */
  shouldPlaySound() {
    return this.soundEnabled && this.audioContext && this.audioContext.state === 'running';
  }

  /**
   * Set master volume
   */
  setVolume(volume) {
    this.soundVolume = Math.max(0, Math.min(1, volume));
    localStorage.setItem('soundVolume', this.soundVolume);
    if (this.gainNode) {
      this.gainNode.gain.value = this.soundVolume;
    }
  }

  /**
   * Toggle sound on/off
   */
  toggleSound() {
    this.soundEnabled = !this.soundEnabled;
    localStorage.setItem('soundEnabled', this.soundEnabled);
    return this.soundEnabled;
  }

  /**
   * Get sound enabled status
   */
  isSoundEnabled() {
    return this.soundEnabled;
  }

  /**
   * Get current volume
   */
  getVolume() {
    return this.soundVolume;
  }
}

// Initialize global sound system
const soundSystem = new SoundSystem();

// Auto-initialize on first user interaction
document.addEventListener('click', () => {
  if (!soundSystem.initialized) {
    soundSystem.init();
  }
}, { once: true });

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = soundSystem;
}
