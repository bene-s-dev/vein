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
    touch: {
      capture: false
    }
  },
  scene: [BootScene, MiningScene]
};

import { refreshIcons } from './ui/IconHelper.js';
import { closeActiveModal } from './core/BaseSystem.js';

function shieldUiElements() {
  // Verhindert das Durchklicken vom Modal & HUD auf den darunterliegenden Phaser-Canvas
  const events = ['pointerdown', 'pointerup', 'pointermove', 'mousedown', 'mouseup', 'click', 'touchstart', 'touchend'];
  
  const modal = document.getElementById('building-modal');
  if (modal) {
    events.forEach((eventType) => {
      modal.addEventListener(eventType, (e) => {
        e.stopPropagation();
      }, { passive: false });
    });
  }

  const elements = document.querySelectorAll('#hud-overlay, #orientation-tip, #mission-tracker');
  elements.forEach((el) => {
    ['pointerdown', 'pointerup', 'mousedown', 'mouseup', 'touchstart', 'touchend'].forEach((eventType) => {
      el.addEventListener(eventType, (e) => {
        e.stopPropagation();
      }, { passive: false });
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
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      closeActiveModal();
    });
  }
}

function initGame() {
  refreshIcons();
  shieldUiElements();
  initModalObserver();
  window.__game = new Phaser.Game(config);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initGame);
} else {
  initGame();
}
