/**
 * InputHandler.js
 * Vereinheitlichte Eingabelogik:
 * - Desktop: Tastatur (WASD / Pfeiltasten)
 * - Mobile: Frei platzierbarer Floating-Joystick in dezenten Grautönen + Jetpack-Aufstiegsbutton
 */

import Phaser from 'phaser';
import { isModalActive, closeActiveModal, notifyModalClosed } from './BaseSystem.js';
import { TILE_SIZE, TILE_TYPES } from './GridSystem.js';
import { showOreInfoModal, showSpecialTileInfoModal } from '../ui/OreInfoModal.js';

export class InputHandler {
  constructor(scene) {
    this.scene = scene;
    this.currentDirection = null;
    this.touchDirection = null;
    this.flyButtonPressed = false;

    // Desktop Tastatur
    this.cursors = scene.input.keyboard.createCursorKeys();
    this.wasd = {
      W: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W, false),
      A: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A, false),
      S: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S, false),
      D: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D, false)
    };

    this.keyEsc = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC, false);
    this.keyP = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P, false);

    // Gadget Hotkeys
    this.keyB = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.B, false);
    this.keyT = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.T, false);
    this.key1 = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE, false);
    this.key2 = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TWO, false);
    this.key3 = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.THREE, false);
    this.keyF = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F, false);
    this.keyR = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R, false);
    this.keyE = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E, false);
    this.keyZ = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z, false);
    this.keySpace = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE, false);

    // Tastatur-Capture für Buchstaben und Ziffern freigeben, damit Texteingaben überall funktionieren
    if (scene.input.keyboard.removeCapture) {
      scene.input.keyboard.removeCapture([
        Phaser.Input.Keyboard.KeyCodes.W,
        Phaser.Input.Keyboard.KeyCodes.A,
        Phaser.Input.Keyboard.KeyCodes.S,
        Phaser.Input.Keyboard.KeyCodes.D,
        Phaser.Input.Keyboard.KeyCodes.ESC,
        Phaser.Input.Keyboard.KeyCodes.P,
        Phaser.Input.Keyboard.KeyCodes.B,
        Phaser.Input.Keyboard.KeyCodes.T,
        Phaser.Input.Keyboard.KeyCodes.ONE,
        Phaser.Input.Keyboard.KeyCodes.TWO,
        Phaser.Input.Keyboard.KeyCodes.THREE,
        Phaser.Input.Keyboard.KeyCodes.F,
        Phaser.Input.Keyboard.KeyCodes.R,
        Phaser.Input.Keyboard.KeyCodes.E,
        Phaser.Input.Keyboard.KeyCodes.Z,
        Phaser.Input.Keyboard.KeyCodes.SPACE
      ]);
    }

    const handlePauseKey = () => {
      if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) {
        return;
      }
      const modalEl = document.getElementById('building-modal');
      const isModalOpen = modalEl && modalEl.style.display && modalEl.style.display !== 'none';
      if (isModalOpen) {
        closeActiveModal(this.scene);
      } else {
        if (this.scene.hud && this.scene.hud.openPauseMenu) {
          this.scene.hud.openPauseMenu();
        }
      }
    };

    this.keyEsc.on('down', handlePauseKey);
    this.keyP.on('down', handlePauseKey);

    const triggerDynamite = () => {
      if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) return;
      if (isModalActive()) return;
      this.scene.useDynamite?.();
    };

    const triggerFuel = () => {
      if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) return;
      if (isModalActive()) return;
      this.scene.player?.useFuelCanister();
    };

    const triggerRepair = () => {
      if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) return;
      if (isModalActive()) return;
      this.scene.player?.useRepairKit();
    };

    const triggerInteract = () => {
      if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) return;
      if (isModalActive()) return;
      this.scene.baseSystem?.handleStationInteraction?.();
    };

    this.keyB.on('down', triggerDynamite);
    this.keyT.on('down', triggerDynamite);
    this.key1.on('down', triggerDynamite);

    this.keyF.on('down', triggerFuel);
    this.key2.on('down', triggerFuel);

    this.keyR.on('down', triggerRepair);
    this.key3.on('down', triggerRepair);

    this.keyE.on('down', triggerInteract);

    const triggerDetonate = () => {
      if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) return;
      if (isModalActive()) return;
      this.scene.detonateAllTnt?.();
    };

    this.keyZ.on('down', triggerDetonate);
    this.keySpace.on('down', triggerDetonate);

    this.setupControls();
  }

  setupControls() {
    const joystickContainer = document.getElementById('floating-joystick');
    const knob = document.getElementById('joystick-knob');
    const flyBtn = document.getElementById('btn-mobile-fly');

    // Mobile Fly-Button Listener
    if (flyBtn) {
      const startFly = (e) => {
        if (e.cancelable) e.preventDefault();
        e.stopPropagation();
        this.flyButtonPressed = true;
        flyBtn.classList.add('active');
      };
      const stopFly = (e) => {
        if (e && e.cancelable) e.preventDefault();
        if (e) e.stopPropagation();
        this.flyButtonPressed = false;
        flyBtn.classList.remove('active');
      };

      flyBtn.addEventListener('touchstart', startFly, { passive: false });
      flyBtn.addEventListener('touchend', stopFly, { passive: false });
      flyBtn.addEventListener('touchcancel', stopFly, { passive: false });
      flyBtn.addEventListener('mousedown', startFly);
      flyBtn.addEventListener('mouseup', stopFly);
      flyBtn.addEventListener('mouseleave', stopFly);
    }

    let activePointerId = null;
    let startClientX = 0;
    let startClientY = 0;
    let startWorldX = 0;
    let startWorldY = 0;
    let startTime = 0;
    let hasMovedBeyondTap = false;
    const maxRadius = 40;
    const deadzone = 8;

    const isModalOpen = () => {
      return isModalActive();
    };

    const hideJoystick = () => {
      activePointerId = null;
      this.touchDirection = null;
      if (joystickContainer) {
        joystickContainer.style.opacity = '0';
        setTimeout(() => {
          if (activePointerId === null) {
            joystickContainer.style.display = 'none';
          }
        }, 150);
      }
      if (knob) {
        knob.style.transform = 'translate(0px, 0px)';
      }
    };

    // POINTER DOWN: Frei auf dem Bildschirm berühren spawnt den Joystick
    this.scene.input.on('pointerdown', (pointer, currentlyOver) => {
      if (isModalActive()) {
        const hud = this.scene.hud;
        if (hud && hud.actionFabContainer && hud.actionFabContainer.classList.contains('open')) {
          hud.actionFabContainer.classList.remove('open');
          notifyModalClosed();
        }
        return;
      }
      if (activePointerId !== null) return;

      const canvas = this.scene.game?.canvas;
      const evTarget = pointer.event ? pointer.event.target : null;
      if (evTarget && canvas && evTarget !== canvas) {
        return;
      }
      if (evTarget && evTarget.closest && evTarget.closest('#hud-overlay, #hud-action-fab, #building-modal, #ore-info-backdrop, .modal-backdrop, .modal-window, .hud-card, button, input, #toast-container, .game-toast, #orientation-tip, .mobile-fly-btn')) {
        return;
      }

      // Wenn das Bohrfahrzeug berührt oder angetippt wurde, Driller-Menü öffnen und keinen Joystick starten
      if (this.scene.player && this.scene.player.sprite) {
        const pWorldX = pointer.worldX;
        const pWorldY = pointer.worldY;
        const dist = Math.hypot(pWorldX - this.scene.player.x, pWorldY - this.scene.player.y);
        if (dist <= 36) {
          this.scene.events.emit('open_driller_menu', 'cargo');
          return;
        }
      }

      // Wenn ein interaktives Gebäude oder NPC angetippt wurde, dieses öffnen und keinen Joystick starten
      if (currentlyOver && currentlyOver.length > 0) {
        const hitBuildingOrNpc = currentlyOver.some(obj => obj && obj.input && obj.input.enabled);
        if (hitBuildingOrNpc) {
          return;
        }
      }

      activePointerId = pointer.id;

      // Exakte Bildschirm- und Weltkoordinaten merken
      startClientX = (pointer.event && pointer.event.clientX != null) ? pointer.event.clientX : pointer.x;
      startClientY = (pointer.event && pointer.event.clientY != null) ? pointer.event.clientY : pointer.y;
      startWorldX = pointer.worldX;
      startWorldY = pointer.worldY;
      startTime = Date.now();
      hasMovedBeyondTap = false;

      if (joystickContainer) {
        joystickContainer.style.left = `${startClientX - 48}px`;
        joystickContainer.style.top = `${startClientY - 48}px`;
        joystickContainer.style.display = 'block';
        requestAnimationFrame(() => {
          joystickContainer.style.opacity = '1';
        });
      }
      if (knob) {
        knob.style.transform = 'translate(0px, 0px)';
      }
    });

    // POINTER MOVE:
    this.scene.input.on('pointermove', (pointer) => {
      if (pointer.id !== activePointerId) return;

      const currentClientX = (pointer.event && pointer.event.clientX != null) ? pointer.event.clientX : pointer.x;
      const currentClientY = (pointer.event && pointer.event.clientY != null) ? pointer.event.clientY : pointer.y;

      let dx = currentClientX - startClientX;
      let dy = currentClientY - startClientY;
      const dist = Math.hypot(dx, dy);

      if (dist > maxRadius) {
        const angle = Math.atan2(dy, dx);
        dx = Math.cos(angle) * maxRadius;
        dy = Math.sin(angle) * maxRadius;
      }

      if (knob) {
        knob.style.transform = `translate(${dx}px, ${dy}px)`;
      }

      if (dist > deadzone) {
        hasMovedBeyondTap = true;
      }

      if (dist < deadzone) {
        this.touchDirection = null;
        return;
      }

      const deg = (Math.atan2(dy, dx) * 180) / Math.PI;
      if (deg >= -140 && deg <= -40) {
        this.touchDirection = 'UP';
      } else if (deg >= 40 && deg <= 140) {
        this.touchDirection = 'DOWN';
      } else if (deg > -40 && deg < 40) {
        this.touchDirection = 'RIGHT';
      } else {
        this.touchDirection = 'LEFT';
      }
    });

    // POINTER UP & CANCEL:
    const handlePointerUp = (pointer) => {
      if (pointer && pointer.id !== activePointerId) return;

      const upTime = Date.now();
      const upClientX = (pointer && pointer.event && pointer.event.clientX != null) ? pointer.event.clientX : (pointer ? pointer.x : startClientX);
      const upClientY = (pointer && pointer.event && pointer.event.clientY != null) ? pointer.event.clientY : (pointer ? pointer.y : startClientY);
      const tapDist = Math.hypot(upClientX - startClientX, upClientY - startClientY);

      hideJoystick();

      if (isModalActive()) return;
      const canvas = this.scene.game?.canvas;
      const evTarget = pointer && pointer.event ? pointer.event.target : null;
      if (evTarget && canvas && evTarget !== canvas) return;
      if (evTarget && evTarget.closest && evTarget.closest('#hud-overlay, #hud-action-fab, #building-modal, #ore-info-backdrop, .modal-backdrop, .modal-window, .hud-card, button, input, #toast-container, .game-toast, #orientation-tip, .mobile-fly-btn')) {
        return;
      }

      // Tap / Klick-Erkennung auf Erze unter Tage
      if (!hasMovedBeyondTap && tapDist < 14 && (upTime - startTime) < 550) {
        if (this.scene.gridSystem) {
          const gx = Math.floor(startWorldX / TILE_SIZE);
          const gy = Math.floor(startWorldY / TILE_SIZE);
          if (gy >= 1) {
            const tile = this.scene.gridSystem.getTile(gx, gy);
            const isExplored = tile && (tile.explored || (this.scene.gridSystem.exploredTiles && this.scene.gridSystem.exploredTiles.has(key)));
            if (tile && tile.type !== TILE_TYPES.EMPTY && isExplored) {
              if (tile.ore) {
                showOreInfoModal(tile.ore, this.scene);
                return;
              } else if (['tile_boulder', 'tile_cache', 'tile_fossil', 'tile_lava'].includes(tile.type)) {
                showSpecialTileInfoModal(tile.type, this.scene, false);
                return;
              }
            }
          }
        }
      }
    };

    this.scene.input.on('pointerup', handlePointerUp);
    this.scene.input.on('pointercancel', handlePointerUp);
    this.scene.input.on('gameout', handlePointerUp);
    window.addEventListener('blur', hideJoystick);
  }

  getDirection() {
    // Wenn der Fokus in einem Eingabefeld liegt (z. B. Spielstand löschen 'delete')
    if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) {
      return null;
    }

    // 1. Mobile Jetpack Button hat Vorrang für Aufstieg
    if (this.flyButtonPressed) {
      return 'UP';
    }

    // 2. Mobile Floating-Joystick
    if (this.touchDirection) {
      return this.touchDirection;
    }

    // 3. Desktop Tastatur (WASD / Pfeiltasten)
    if (this.cursors.left.isDown || this.wasd.A.isDown) {
      return 'LEFT';
    }
    if (this.cursors.right.isDown || this.wasd.D.isDown) {
      return 'RIGHT';
    }
    if (this.cursors.down.isDown || this.wasd.S.isDown) {
      return 'DOWN';
    }
    if (this.cursors.up.isDown || this.wasd.W.isDown) {
      return 'UP';
    }

    return null;
  }
}
