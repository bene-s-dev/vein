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
  roundPixels: true,
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

function shieldUiElements() {
  // Verhindert das Durchklicken vom HUD auf den darunterliegenden Phaser-Canvas
  const elements = document.querySelectorAll('#hud-overlay, #btn-mobile-fly, #orientation-tip, #mission-tracker');
  const events = ['pointerdown', 'mousedown', 'touchstart'];
  
  elements.forEach((el) => {
    events.forEach((eventType) => {
      el.addEventListener(eventType, (e) => {
        // Nur stoppen, wenn nicht direkt auf ein interaktives Steuerelement geklickt wird
        if (e.target && e.target.closest && e.target.closest('button, input, select, textarea, .stat-cluster')) {
          return;
        }
        e.stopPropagation();
      });
    });
  });
}

function initGame() {
  refreshIcons();
  shieldUiElements();
  window.__game = new Phaser.Game(config);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initGame);
} else {
  initGame();
}
