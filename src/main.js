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
import { closeActiveModal, notifyModalClosed } from './core/BaseSystem.js';

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

async function initGame() {
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
  window.__game = new Phaser.Game(config);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { initGame(); });
} else {
  initGame();
}

