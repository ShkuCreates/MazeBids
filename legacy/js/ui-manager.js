/**
 * MAZEBIDS UI UTILITIES
 * Reusable functions for animations, notifications, and visual effects
 */

class UIManager {
  /**
   * Show a notification toast
   */
  static showNotification(message, type = 'success', duration = 3000) {
    const notification = document.createElement('div');
    notification.className = `notification ${type} pop-in`;
    notification.innerHTML = `
      <div style="display: flex; align-items: center; gap: 10px;">
        <i class="fas fa-${this.getIconForType(type)}"></i>
        <span>${message}</span>
      </div>
    `;

    document.body.appendChild(notification);
    soundSystem?.play(this.getSoundForType(type));

    setTimeout(() => {
      notification.style.animation = 'notificationSlideOut 0.4s ease-out forwards';
      setTimeout(() => notification.remove(), 400);
    }, duration);
  }

  /**
   * Get icon based on notification type
   */
  static getIconForType(type) {
    const icons = {
      success: 'check-circle',
      error: 'exclamation-circle',
      warning: 'exclamation-triangle',
      info: 'info-circle'
    };
    return icons[type] || 'info-circle';
  }

  /**
   * Get sound based on notification type
   */
  static getSoundForType(type) {
    const sounds = {
      success: 'success',
      error: 'error',
      warning: 'error',
      info: 'notification'
    };
    return sounds[type] || 'notification';
  }

  /**
   * Show loading overlay
   */
  static showLoading(message = 'Loading...') {
    const overlay = document.createElement('div');
    overlay.className = 'loading-overlay';
    overlay.id = 'loading-overlay';
    overlay.innerHTML = `
      <div class="loading-content pop-in">
        <div class="spinner"></div>
        <p>${message}</p>
      </div>
    `;
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      animation: overlayFadeIn 0.3s ease;
    `;

    const content = overlay.querySelector('.loading-content');
    content.style.cssText = `
      text-align: center;
      background: rgba(20, 30, 60, 0.95);
      padding: 40px;
      border-radius: 15px;
      border: 2px solid #6b21a8;
    `;

    const spinner = overlay.querySelector('.spinner');
    spinner.style.cssText = `
      width: 50px;
      height: 50px;
      margin: 0 auto 20px;
      border: 4px solid rgba(0, 212, 255, 0.2);
      border-top-color: #00d4ff;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    `;

    document.body.appendChild(overlay);
    return overlay;
  }

  /**
   * Hide loading overlay
   */
  static hideLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
      overlay.style.animation = 'overlayFadeIn 0.3s ease reverse forwards';
      setTimeout(() => overlay.remove(), 300);
    }
  }

  /**
   * Animate number counter
   */
  static animateCounter(element, start, end, duration = 1000) {
    const range = end - start;
    const increment = range / (duration / 16);
    let current = start;

    const counter = setInterval(() => {
      current += increment;
      if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
        current = end;
        clearInterval(counter);
      }
      element.textContent = Math.floor(current);
    }, 16);
  }

  /**
   * Add ripple effect to element
   */
  static addRipple(event) {
    const button = event.currentTarget;
    const ripple = document.createElement('span');
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;

    ripple.style.cssText = `
      position: absolute;
      width: ${size}px;
      height: ${size}px;
      background: rgba(255, 255, 255, 0.5);
      border-radius: 50%;
      left: ${x}px;
      top: ${y}px;
      pointer-events: none;
      animation: rippleEffect 0.6s ease-out;
    `;

    button.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  }

  /**
   * Stagger animate multiple elements
   */
  static staggerAnimate(elements, delay = 100) {
    elements.forEach((element, index) => {
      element.style.animation = 'none';
      setTimeout(() => {
        element.classList.add('stagger-item');
        element.style.animationDelay = `${index * delay}ms`;
      }, 10);
    });
  }

  /**
   * Scroll reveal animation
   */
  static enableScrollReveal() {
    const revealElements = document.querySelectorAll('.scroll-reveal');
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    revealElements.forEach(el => observer.observe(el));
  }

  /**
   * Shake animation for errors
   */
  static shake(element) {
    element.classList.remove('input-error');
    void element.offsetWidth; // Trigger reflow
    element.classList.add('input-error');
    setTimeout(() => element.classList.remove('input-error'), 400);
    soundSystem?.play('error');
  }

  /**
   * Float animation for coins/rewards
   */
  static floatReward(element, fromX, fromY, toX, toY, duration = 1000) {
    const float = document.createElement('div');
    float.innerHTML = element;
    float.style.cssText = `
      position: fixed;
      left: ${fromX}px;
      top: ${fromY}px;
      font-size: 2em;
      pointer-events: none;
      z-index: 10000;
    `;
    
    document.body.appendChild(float);
    
    setTimeout(() => {
      float.style.transition = `all ${duration}ms ease-out`;
      float.style.left = toX + 'px';
      float.style.top = toY + 'px';
      float.style.opacity = '0';
      float.style.transform = 'scale(1.5)';
    }, 10);

    setTimeout(() => float.remove(), duration + 50);
  }

  /**
   * Pulse animation
   */
  static pulse(element, duration = 1000) {
    element.style.animation = `pulse ${duration}ms ease-in-out`;
    setTimeout(() => element.style.animation = '', duration);
  }

  /**
   * Create confetti effect
   */
  static confetti() {
    const confettiPieces = 50;
    for (let i = 0; i < confettiPieces; i++) {
      const piece = document.createElement('div');
      const color = ['#00d4ff', '#6366f1', '#fbbf24', '#10b981'][
        Math.floor(Math.random() * 4)
      ];
      const size = Math.random() * 8 + 4;
      const duration = Math.random() * 2 + 2;
      const delay = Math.random() * 0.5;

      piece.style.cssText = `
        position: fixed;
        width: ${size}px;
        height: ${size}px;
        background: ${color};
        left: ${Math.random() * 100}%;
        top: -10px;
        border-radius: 50%;
        pointer-events: none;
        z-index: 9000;
        animation: floatElement ${duration}s ease-out ${delay}s forwards;
        opacity: 0.8;
      `;

      document.body.appendChild(piece);
      setTimeout(() => piece.remove(), (duration + delay) * 1000);
    }

    soundSystem?.play('achievement');
  }

  /**
   * Validate form and show errors
   */
  static validateForm(formElement) {
    const inputs = formElement.querySelectorAll('input[required], textarea[required]');
    let isValid = true;

    inputs.forEach(input => {
      if (!input.value.trim()) {
        this.shake(input);
        isValid = false;
      }
    });

    return isValid;
  }

  /**
   * Disable button with loading state
   */
  static disableButton(button, duration = null) {
    button.disabled = true;
    button.classList.add('btn-loading');
    const originalText = button.innerHTML;

    if (duration) {
      setTimeout(() => {
        this.enableButton(button, originalText);
      }, duration);
    }
  }

  /**
   * Enable button
   */
  static enableButton(button, originalText = null) {
    button.disabled = false;
    button.classList.remove('btn-loading');
    if (originalText) {
      button.innerHTML = originalText;
    }
  }

  /**
   * Debounce function for performance
   */
  static debounce(func, delay) {
    let timeoutId;
    return function (...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
  }

  /**
   * Throttle function for performance
   */
  static throttle(func, limit) {
    let inThrottle;
    return function (...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = UIManager;
}
