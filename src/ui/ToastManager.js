import { icon, refreshIcons } from './IconHelper.js';
import { soundFx } from '../core/SoundEffects.js';

/**
 * ToastManager
 * Modernes, animiertes Benachrichtigungssystem oben rechts für Warnungen,
 * Status-Updates und Missions-Hinweise.
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
   * Zeigt einen Toast-Hinweis oben rechts an.
   * @param {Object} options
   * @param {string} [options.id] - Eindeutige ID (verhindert doppeltes Einblenden der gleichen Warnung)
   * @param {string} [options.title='Warnung'] - Überschrift
   * @param {string} [options.message=''] - Hinweistext
   * @param {'warning'|'critical'|'info'} [options.type='warning'] - Art des Toasts (Farbschema)
   * @param {string} [options.iconName='triangle-alert'] - Lucide-Icon-Name
   * @param {Array<string>|string} [options.badges=[]] - Kleine Daten-Badges unter dem Text
   * @param {number} [options.duration=5000] - Anzeigedauer in ms (0 = dauerhaft)
   * @param {boolean} [options.sound=true] - Ob ein Benachrichtigungston abgespielt werden soll
   */
  show(options = {}) {
    const {
      id = 'toast_' + Date.now(),
      title = 'Warnung',
      message = '',
      type = 'warning',
      iconName = 'triangle-alert',
      badges = [],
      duration = 5000,
      sound = true
    } = options;

    const container = this.getContainer();
    if (!container) return;

    // Falls ein Toast mit dieser ID bereits existiert, ersetzen
    if (this.toasts.has(id)) {
      this.dismiss(id, false);
    }

    const toastEl = document.createElement('div');
    toastEl.className = `game-toast toast-${type}`;
    toastEl.id = `toast-item-${id}`;

    const badgesList = Array.isArray(badges) ? badges : (badges ? [badges] : []);
    const badgesHtml = badgesList.length > 0
      ? `<div class="toast-badges">
          ${badgesList.map(b => `<span class="toast-badge">${b}</span>`).join('')}
        </div>`
      : '';

    toastEl.innerHTML = `
      <div class="toast-icon-wrap">
        ${icon(iconName, '', 16)}
      </div>
      <div class="toast-body">
        <div class="toast-header-row">
          <span class="toast-title">${title}</span>
          <button class="toast-close-btn" title="Schließen">&times;</button>
        </div>
        ${message ? `<p class="toast-msg">${message}</p>` : ''}
        ${badgesHtml}
      </div>
      ${duration > 0 ? `
        <div class="toast-progress">
          <div class="toast-progress-fill" style="transition-duration: ${duration}ms;"></div>
        </div>
      ` : ''}
    `;

    container.appendChild(toastEl);
    refreshIcons(toastEl);

    // Audio-Feedback
    if (sound && soundFx) {
      soundFx.playError();
    }

    // Einblende-Animation
    requestAnimationFrame(() => {
      toastEl.classList.add('show');
      const progressFill = toastEl.querySelector('.toast-progress-fill');
      if (progressFill) {
        requestAnimationFrame(() => {
          progressFill.style.transform = 'scaleX(0)';
        });
      }
    });

    // Klick auf Schließen
    const closeBtn = toastEl.querySelector('.toast-close-btn');
    if (closeBtn) {
      closeBtn.onclick = (e) => {
        e.stopPropagation();
        this.dismiss(id);
      };
    }

    // Auto-Dismiss
    let timeoutId = null;
    if (duration > 0) {
      timeoutId = setTimeout(() => {
        this.dismiss(id);
      }, duration);
    }

    this.toasts.set(id, { element: toastEl, timeoutId });

    // Begrenzung auf maximal 3 gleichzeitige Toasts
    if (this.toasts.size > 3) {
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
      }, 350);
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
