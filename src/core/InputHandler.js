/**
 * InputHandler.js
 * Vereinheitlichte Eingabelogik:
 * - Desktop: Tastatur (WASD / Pfeiltasten)
 * - Mobile: Frei platzierbarer Floating-Joystick in dezenten Grautönen + Jetpack-Aufstiegsbutton
 */

import Phaser from 'phaser';
import { isModalActive } from './BaseSystem.js';

export class InputHandler {
  constructor(scene) {
    this.scene = scene;
    this.currentDirection = null;
    this.touchDirection = null;
    this.flyButtonPressed = false;

    // Desktop Tastatur
    this.cursors = scene.input.keyboard.createCursorKeys();
    this.wasd = {
      W: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      S: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D)
    };

    this.keyEsc = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this.keyP = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P);

    const handlePauseKey = () => {
      if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) {
        return;
      }
      if (this.scene.hud && this.scene.hud.togglePauseMenu) {
        this.scene.hud.togglePauseMenu();
      }
    };

    this.keyEsc.on('down', handlePauseKey);
    this.keyP.on('down', handlePauseKey);

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
      if (isModalActive()) return;
      if (activePointerId !== null) return;

      // Wenn Klick/Touch auf HTML UI oder Buttons liegt, ignorieren
      const evTarget = pointer.event ? pointer.event.target : null;
      if (evTarget && evTarget.closest && evTarget.closest('.hud-card, #mission-tracker, button, .modal-window, .modal-backdrop, #orientation-tip, .mobile-fly-btn, input')) {
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

      // Exakte Bildschirmkoordinaten
      startClientX = (pointer.event && pointer.event.clientX != null) ? pointer.event.clientX : pointer.x;
      startClientY = (pointer.event && pointer.event.clientY != null) ? pointer.event.clientY : pointer.y;

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
      hideJoystick();
    };

    this.scene.input.on('pointerup', handlePointerUp);
    this.scene.input.on('pointercancel', handlePointerUp);
    this.scene.input.on('gameout', handlePointerUp);
    window.addEventListener('blur', hideJoystick);
  }

  getDirection() {
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
