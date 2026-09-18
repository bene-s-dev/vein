import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene.js';
import { MiningScene } from './scenes/MiningScene.js';

/**
 * Scaling & Responsive Konfiguration:
 * Phaser.Scale.RESIZE passt das Spielfeld dynamisch an jede Displaygröße an (Mobile & Desktop),
 * ohne künstliche Verzerrungen, Streckungen oder schwarze Balken.
 */
const config = {
  type: Phaser.AUTO,
  parent: 'game-container',
  pixelArt: true,
  roundPixels: false,
  backgroundColor: '#07090e',
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: '100%',
    height: '100%'
  },
  input: {
    activePointers: 3,
    smoothStep: true,
    windowEvents: false,
    touch: {
      capture: false
    }
  },
  fps: {
    min: 10,
    target: 60,
    smoothStep: false
  },
  scene: [BootScene, MiningScene]
};

import { refreshIcons } from './ui/IconHelper.js';
import { closeActiveModal, notifyModalClosed, isModalActive } from './core/BaseSystem.js';

let isHandlingPopstate = false;
let pushedModalHistoryCount = 0;

function initMobileSwipeBackHandler() {
  // 1. Touch-Swipe-Geste (von links nach rechts wischen zum Schließen von Fenstern)
  let touchStartX = 0;
  let touchStartY = 0;
  let touchStartTime = 0;

  window.addEventListener('touchstart', (e) => {
    if (!isModalActive()) return;
    if (e.touches && e.touches.length === 1) {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      touchStartTime = Date.now();
    }
  }, { passive: true, capture: true });

  window.addEventListener('touchend', (e) => {
    if (!isModalActive()) return;
    if (e.changedTouches && e.changedTouches.length === 1) {
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      const deltaX = touchEndX - touchStartX;
      const deltaY = touchEndY - touchStartY;
      const duration = Date.now() - touchStartTime;

      // Rechtswisch-Bedingung: Mindestens 45px nach rechts, überwiegend horizontal, < 650ms
      if (deltaX > 45 && Math.abs(deltaX) > Math.abs(deltaY) * 1.15 && duration < 650) {
        closeActiveModal();
        if (pushedModalHistoryCount > 0) {
          pushedModalHistoryCount--;
          isHandlingPopstate = true;
          window.history.back();
          setTimeout(() => { isHandlingPopstate = false; }, 100);
        }
      }
    }
  }, { passive: true, capture: true });

  // 2. Browser / Handy System-Zurück (Android Back Button / Safari Zurück-Geste)
  const syncHistoryWithModal = (isOpen) => {
    if (isHandlingPopstate) return;
    if (isOpen) {
      if (pushedModalHistoryCount === 0) {
        window.history.pushState({ veinModal: true }, '');
        pushedModalHistoryCount = 1;
      }
    } else {
      if (pushedModalHistoryCount > 0) {
        pushedModalHistoryCount--;
        isHandlingPopstate = true;
        window.history.back();
        setTimeout(() => { isHandlingPopstate = false; }, 100);
      }
    }
  };

  const modalBodyObserver = new MutationObserver(() => {
    const active = isModalActive();
    if (active && pushedModalHistoryCount === 0) {
      window.history.pushState({ veinModal: true }, '');
      pushedModalHistoryCount = 1;
    } else if (!active && pushedModalHistoryCount > 0 && !isHandlingPopstate) {
      pushedModalHistoryCount--;
      isHandlingPopstate = true;
      window.history.back();
      setTimeout(() => { isHandlingPopstate = false; }, 100);
    }
  });
  modalBodyObserver.observe(document.body, { attributes: true, attributeFilter: ['class'] });

  window.addEventListener('popstate', (e) => {
    if (isHandlingPopstate) return;
    if (isModalActive()) {
      pushedModalHistoryCount = Math.max(0, pushedModalHistoryCount - 1);
      closeActiveModal();
    }
  });
}

function shieldUiElements() {
  // Verhindert das Durchklicken von Modals, HUD, Action-FAB und Dialogen auf den Phaser-Canvas
  const events = ['pointerdown', 'pointerup', 'pointermove', 'mousedown', 'mouseup', 'click', 'touchstart', 'touchend'];

  // Globaler Listener auf document (Bubbling-Phase):
  // Wenn ein Event von einem DOM-UI-Element stammt (nicht vom Canvas),
  // wird verhindert, dass es bis zu Window bubbelt (wo Phaser oder andere globale Handler sitzen).
  events.forEach((eventType) => {
    document.addEventListener(eventType, (e) => {
      const canvas = window.__game?.canvas;
      if (!e.target) return;
      // Klicks auf HTML-UI-Elemente niemals an Window/Canvas durchlassen
      if (canvas && e.target !== canvas) {
        e.stopPropagation();
      }
    }, { capture: false, passive: false });
  });

  // Direkte Absicherung aller bekannten UI-Container & Klassen
  const selectors = [
    '#building-modal',
    '#hud-overlay',
    '#orientation-tip',
    '#mission-tracker',
    '#hud-action-fab',
    '#hud-action-dial',
    '#toast-container',
    '#ore-info-backdrop',
    '.modal-backdrop',
    '.modal-window',
    '.modal-content',
    '.hud-card',
    '.fab-item-row',
    '.btn-fab-item',
    '.btn-fab-main',
    '.fab-label',
    '.ore-info-window',
    'button',
    'input',
    'select',
    'textarea'
  ];

  selectors.forEach((sel) => {
    document.querySelectorAll(sel).forEach((el) => {
      events.forEach((eventType) => {
        el.addEventListener(eventType, (e) => {
          e.stopPropagation();
        }, { passive: false });
      });
    });
  });
}

function initModalObserver() {
  const modal = document.getElementById('building-modal');
  const titleEl = document.getElementById('modal-title');
  const centerTitleEl = document.getElementById('hud-center-menu-title');

  function syncMenuTitle() {
    if (!titleEl || !centerTitleEl) return;
    if (centerTitleEl.innerHTML !== titleEl.innerHTML) {
      centerTitleEl.innerHTML = titleEl.innerHTML;
    }
  }

  if (modal) {
    const obs = new MutationObserver(() => {
      const isOpen = modal.style.display === 'flex' || (modal.style.display !== 'none' && modal.style.display !== '');
      document.body.classList.toggle('modal-open', isOpen);
      if (isOpen) {
        syncMenuTitle();
      }
    });
    obs.observe(modal, { attributes: true, attributeFilter: ['style'] });
  }

  if (titleEl) {
    let isSyncing = false;
    const titleObs = new MutationObserver(() => {
      if (isSyncing) return;
      isSyncing = true;
      syncMenuTitle();
      isSyncing = false;
    });
    titleObs.observe(titleEl, { childList: true, subtree: true, characterData: true });
  }
  const closeBtn = document.getElementById('modal-close-btn');
  if (closeBtn) {
    ['pointerdown', 'click'].forEach(evt => {
      closeBtn.addEventListener(evt, (e) => {
        e.preventDefault();
        e.stopPropagation();
        closeActiveModal();
      });
    });
  }
}

export async function enableFullscreenLandscape() {
  try {
    const doc = document.documentElement;
    if (!document.fullscreenElement && !document.webkitFullscreenElement) {
      if (doc.requestFullscreen) {
        await doc.requestFullscreen({ navigationUI: 'hide' });
      } else if (doc.webkitRequestFullscreen) {
        await doc.webkitRequestFullscreen();
      }
    }
  } catch (_) {}

  try {
    if (window.screen && window.screen.orientation && window.screen.orientation.lock) {
      await window.screen.orientation.lock('landscape');
    }
  } catch (_) {}
}

async function initGame() {
  // Sofortiger Versuch beim Aufruf der URL
  enableFullscreenLandscape();

  // One-time Touch/Click-Listener für Mobilgeräte & Browser mit User-Gesture-Pflicht
  const triggerOnGesture = () => {
    enableFullscreenLandscape();
  };
  ['pointerdown', 'touchstart', 'click', 'keydown'].forEach(evt => {
    window.addEventListener(evt, triggerOnGesture, { once: true, passive: true });
  });

  const btnForceLandscape = document.getElementById('btn-force-landscape');
  if (btnForceLandscape) {
    btnForceLandscape.addEventListener('click', () => {
      enableFullscreenLandscape();
      const tip = document.getElementById('orientation-tip');
      if (tip) tip.style.display = 'none';
    });
  }

  if (typeof document !== 'undefined' && document.fonts && document.fonts.ready) {
    try {
      await document.fonts.ready;
    } catch (e) {
      console.warn('Font loading check error:', e);
    }
  }
  refreshIcons();
  shieldUiElements();
  initModalObserver();
  initMobileSwipeBackHandler();
  window.__game = new Phaser.Game(config);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { initGame(); });
} else {
  initGame();
}


