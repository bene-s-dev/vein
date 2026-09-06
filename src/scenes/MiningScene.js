import Phaser from 'phaser';
import { GridSystem, TILE_SIZE } from '../core/GridSystem.js';
import { Player } from '../core/Player.js';
import { InputHandler } from '../core/InputHandler.js';
import { BaseSystem } from '../core/BaseSystem.js';
import { MissionSystem } from '../core/MissionSystem.js';
import { HUD } from '../ui/HUD.js';
import { SaveSystem } from '../core/SaveSystem.js';

export class MiningScene extends Phaser.Scene {
  constructor() {
    super('MiningScene');
  }

  create() {
    // 1. GridSystem initialisieren (endlose Welt nach unten & in beide Richtungen)
    this.gridSystem = new GridSystem(this);

    // 2. Himmel & Sternenhintergrund (endlose Weite)
    this.createSkyAndSurface();

    // 3. Spieler-Fahrzeug platzieren (auf der Basis an der Oberfläche gx: 15, gy: -1)
    this.player = new Player(this, this.gridSystem, 15, -1);

    // 4. Input-Handler (Tastatur + Touch)
    this.inputHandler = new InputHandler(this);

    // 5. Missions- & Auftrags-System
    this.missionSystem = new MissionSystem(this, this.player);

    // 6. Oberflächen-Gebäude (Hangar, Erzbörse, Raffinerie, Labor)
    this.baseSystem = new BaseSystem(this, this.player, this.missionSystem);

    // 7. HUD
    this.hud = new HUD(this, this.player, this.missionSystem);
    window.__activeMiningScene = this;

    // 8. Gespeicherten Spielfortschritt aus localStorage laden
    SaveSystem.load(this);

    // Initialen Status der Mission an HUD senden
    this.events.emit('mission_updated', this.missionSystem.getMissionStatus());

    // Vor Schließen des Fensters automatisch sichern
    window.addEventListener('beforeunload', () => {
      if (!SaveSystem.isClearing) {
        SaveSystem.save(this);
      }
    });

    // 9. Kamera konfigurieren (Full-screen Follow)
    this.setupCamera();

    // 10. Erstes Viewport-Rendering
    this.gridSystem.updateViewport(this.cameras.main, this.player);

    // 11. Resize-Listener
    this.scale.on('resize', (gameSize) => {
      this.cameras.main.setViewport(0, 0, gameSize.width, gameSize.height);
      this.setupCamera();
      this.gridSystem.updateViewport(this.cameras.main, this.player);
    });
  }

  createSkyAndSurface() {
    const spanW = 200000;
    const skyHeight = 350;

    // Ruhiger, eleganter Dämmerungs-Himmel (Slate & Dark Navy)
    const sky = this.add.graphics().setDepth(1);
    sky.fillGradientStyle(0x090d16, 0x090d16, 0x1a2333, 0x1a2333, 1);
    sky.fillRect(-spanW / 2, -skyHeight, spanW, skyHeight);

    // Dezent gestreute Sterne
    for (let i = 0; i < 120; i++) {
      const sx = Phaser.Math.Between(-3000, 3000);
      const sy = Phaser.Math.Between(-skyHeight + 10, -30);
      this.add.circle(sx, sy, Phaser.Math.FloatBetween(0.8, 1.5), 0xf8fafc, Phaser.Math.FloatBetween(0.2, 0.6)).setDepth(1);
    }

    // Saubere, endlose Bodenlinie
    this.add.rectangle(0, 0, spanW, 3, 0x2d6a4f).setDepth(2);
  }

  setupCamera() {
    const cam = this.cameras.main;

    // Endlose Kamera-Grenzen nach links, rechts und in die Tiefe
    cam.setBounds(-100000, -280, 200000, 500000);
    cam.roundPixels = false;
    cam.startFollow(this.player.sprite, false, 0.15, 0.15);

    const screenW = this.scale.width || window.innerWidth;
    const screenH = this.scale.height || window.innerHeight;
    const isPortrait = screenH > screenW;

    // Intelligente Zoom-Berechnung für optimale Sichtweite:
    let zoom;
    if (isPortrait) {
      zoom = screenW / 432; // ~13.5 Kacheln Breite im Hochformat
    } else if (screenH <= 480) {
      // Mobile Landscape (Smartphones im Querformat):
      // Garantiert ca. 10.5 vertikale Kacheln Schachttiefe und ~22-25 Kacheln Breite
      zoom = screenH / 330;
    } else if (screenW < 1000) {
      zoom = screenW / 680;
    } else {
      zoom = screenW / 820;
    }

    zoom = Math.max(0.75, Math.min(2.0, zoom));
    cam.setZoom(zoom);
  }

  update(time, delta) {
    if (this.isPaused) return;

    const inputDir = this.inputHandler.getDirection();

    // Spieler aktualisieren
    this.player.update(delta, inputDir);

    // Basis-System, NPC & Gebäude-Funktionen aktualisieren
    if (this.baseSystem && this.baseSystem.update) {
      this.baseSystem.update(delta);
    }

    // Automatisches Speichern alle 10 Sekunden (überschreibt alten Stand)
    this.autoSaveTimer = (this.autoSaveTimer || 0) + delta;
    if (this.autoSaveTimer >= 10000) {
      this.autoSaveTimer = 0;
      if (!SaveSystem.isClearing) {
        SaveSystem.save(this);
      }
    }

    // Viewport Culling & Sensor-Erz-Scanner
    this.gridSystem.updateViewport(this.cameras.main, this.player);

    // HUD synchronisieren
    this.hud.update();
  }
}
