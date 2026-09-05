import { soundFx } from '../core/SoundEffects.js';

/**
 * ToastManager
 * Schlanke, rote Warnungs-Toasts oben zentriert mit Achtung-Emoji.
 */
class ToastManager {
  constructor() {
    this.container = null;
    this.toasts = new Map();
  }

  getContainer() {
    if (!this.container || !document.contains(this.container)) {
      this.container = document.getElementById('toast-container');
      if (!this.container) {
        this.container = document.createElement('div');
        this.container.id = 'toast-container';
        const gameContainer = document.getElementById('game-container') || document.body;
        gameContainer.appendChild(this.container);
      }
    }
    return this.container;
  }

  /**
   * Zeigt einen kompakten roten Warn-Toast oben mittig an.
   * @param {Object} options
   * @param {string} [options.id] - Eindeutige ID
   * @param {string} [options.text] - Angezeigter Begriff (z. B. 'Tanken empfohlen' oder 'Rückkehrwarnung')
   * @param {number} [options.duration=4000] - Anzeigedauer in ms
   * @param {boolean} [options.sound=true] - Ob ein Warnton ertönen soll
   */
  show(options = {}) {
    const {
      id = 'toast_' + Date.now(),
      text = options.text || options.title || 'Warnung',
      duration = 4000,
      sound = true
    } = options;

    const container = this.getContainer();
    if (!container) return;

    if (this.toasts.has(id)) {
      this.dismiss(id, false);
    }

    const toastEl = document.createElement('div');
    toastEl.className = 'game-toast';
    toastEl.id = `toast-item-${id}`;

    toastEl.innerHTML = `
      <span class="toast-emoji">⚠️</span>
      <span class="toast-label">${text}</span>
    `;

    container.appendChild(toastEl);

    // Audio-Feedback
    if (sound && soundFx) {
      if (sound === 'cockpit' || sound === 'collision') {
        soundFx.playCockpitAlarm();
      } else {
        soundFx.playError();
      }
    }

    requestAnimationFrame(() => {
      toastEl.classList.add('show');
    });

    toastEl.onclick = (e) => {
      e.stopPropagation();
      this.dismiss(id);
    };

    let timeoutId = null;
    if (duration > 0) {
      timeoutId = setTimeout(() => {
        this.dismiss(id);
      }, duration);
    }

    this.toasts.set(id, { element: toastEl, timeoutId });

    if (this.toasts.size > 2) {
      const oldestKey = this.toasts.keys().next().value;
      this.dismiss(oldestKey);
    }
  }

  dismiss(id, animate = true) {
    const entry = this.toasts.get(id);
    if (!entry) return;

    this.toasts.delete(id);
    if (entry.timeoutId) clearTimeout(entry.timeoutId);

    const el = entry.element;
    if (!el || !el.parentNode) return;

    if (animate) {
      el.classList.remove('show');
      el.classList.add('hide');
      setTimeout(() => {
        if (el.parentNode) {
          el.parentNode.removeChild(el);
        }
      }, 250);
    } else {
      el.parentNode.removeChild(el);
    }
  }

  clearAll() {
    for (const id of Array.from(this.toasts.keys())) {
      this.dismiss(id, false);
    }
  }
}

export const toastManager = new ToastManager();
if (typeof window !== 'undefined') {
  window.toastManager = toastManager;
}
