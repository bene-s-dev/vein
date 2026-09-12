import Phaser from 'phaser';
import { GridSystem, TILE_SIZE } from '../core/GridSystem.js';
import { Player } from '../core/Player.js';
import { InputHandler } from '../core/InputHandler.js';
import { BaseSystem } from '../core/BaseSystem.js';
import { MissionSystem } from '../core/MissionSystem.js';
import { HUD } from '../ui/HUD.js';
import { SaveSystem } from '../core/SaveSystem.js';
import { soundFx } from '../core/SoundEffects.js';

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
    const skyHeight = 360;

    // 1. Strahlender, satter Tages-Himmel (Azurblau nach hellem Horizont-Cyan)
    const sky = this.add.graphics().setDepth(1);
    sky.fillGradientStyle(0x0284c7, 0x0284c7, 0xbae6fd, 0xe0f2fe, 1);
    sky.fillRect(-spanW / 2, -skyHeight, spanW, skyHeight);

    // 2. Weit entfernte Dunst-Bergkette im Hintergrund (Tiefe 1.2)
    const mountains = this.add.graphics().setDepth(1.2);
    mountains.fillStyle(0x38bdf8, 0.28);
    mountains.beginPath();
    mountains.moveTo(-4000, 0);
    const mPeaks = [
      { x: -3500, y: -90 }, { x: -3000, y: -60 }, { x: -2500, y: -110 }, { x: -2000, y: -75 },
      { x: -1600, y: -125 }, { x: -1200, y: -70 }, { x: -800, y: -105 }, { x: -400, y: -80 },
      { x: 0, y: -115 }, { x: 350, y: -85 }, { x: 700, y: -120 }, { x: 1100, y: -75 },
      { x: 1500, y: -110 }, { x: 1900, y: -80 }, { x: 2300, y: -130 }, { x: 2800, y: -70 },
      { x: 3300, y: -115 }, { x: 4000, y: -65 }
    ];
    for (const p of mPeaks) {
      mountains.lineTo(p.x, p.y);
    }
    mountains.lineTo(4000, 0);
    mountains.closePath();
    mountains.fillPath();

    // 3. Mittlere sanfte Hügelkette mit Naturgrün (Tiefe 1.3)
    const hills = this.add.graphics().setDepth(1.3);
    hills.fillStyle(0x166534, 0.40);
    hills.beginPath();
    hills.moveTo(-4000, 0);
    const hPeaks = [
      { x: -3600, y: -45 }, { x: -3100, y: -25 }, { x: -2600, y: -55 }, { x: -2100, y: -30 },
      { x: -1700, y: -50 }, { x: -1300, y: -35 }, { x: -900, y: -58 }, { x: -500, y: -30 },
      { x: -100, y: -52 }, { x: 250, y: -32 }, { x: 600, y: -56 }, { x: 950, y: -28 },
      { x: 1350, y: -54 }, { x: 1750, y: -30 }, { x: 2150, y: -58 }, { x: 2600, y: -32 },
      { x: 3100, y: -50 }, { x: 4000, y: -28 }
    ];
    for (const p of hPeaks) {
      hills.lineTo(p.x, p.y);
    }
    hills.lineTo(4000, 0);
    hills.closePath();
    hills.fillPath();

    // 4. Strahlende Sonne mit warmem Glow über dem Basis-Areal (Tiefe 1.4)
    const sunX = 620;
    const sunY = -215;
    const sun = this.add.graphics().setDepth(1.4);
    // Äußerer atmosphärischer Schein
    sun.fillStyle(0xfef08a, 0.12);
    sun.fillCircle(sunX, sunY, 68);
    // Mittlerer warmer Kranz
    sun.fillStyle(0xfde047, 0.28);
    sun.fillCircle(sunX, sunY, 38);
    // Zarte Sonnenstrahlen
    sun.lineStyle(1.5, 0xfef08a, 0.25);
    for (let r = 0; r < 8; r++) {
      const angle = (r * Math.PI) / 4;
      sun.beginPath();
      sun.moveTo(sunX + Math.cos(angle) * 22, sunY + Math.sin(angle) * 22);
      sun.lineTo(sunX + Math.cos(angle) * 48, sunY + Math.sin(angle) * 48);
      sun.strokePath();
    }
    // Strahlend weiß-goldener Sonnenkern
    sun.fillStyle(0xfffbeb, 0.98);
    sun.fillCircle(sunX, sunY, 18);

    // 5. Lebendige Tages-Wolken mit leichter Drift (Tiefe 1.5)
    this.clouds = [];
    const cloudConfigs = [
      { x: -1400, y: -190, scale: 1.1, speed: 2.8 },
      { x: -1000, y: -140, scale: 0.85, speed: 3.5 },
      { x: -650,  y: -230, scale: 1.25, speed: 2.2 },
      { x: -280,  y: -170, scale: 0.9,  speed: 3.1 },
      { x: 120,   y: -220, scale: 1.15, speed: 2.6 },
      { x: 480,   y: -150, scale: 0.8,  speed: 3.8 },
      { x: 880,   y: -240, scale: 1.3,  speed: 2.0 },
      { x: 1250,  y: -180, scale: 1.0,  speed: 3.0 },
      { x: 1650,  y: -145, scale: 0.85, speed: 3.4 },
      { x: 2100,  y: -225, scale: 1.2,  speed: 2.4 },
      { x: 2550,  y: -160, scale: 0.95, speed: 3.2 }
    ];

    cloudConfigs.forEach(cfg => {
      const container = this.add.container(cfg.x, cfg.y).setDepth(1.5);
      const g = this.add.graphics();

      // Wolkenschatten (sanftes Hellgrau)
      g.fillStyle(0xe2e8f0, 0.45);
      g.fillCircle(-22 * cfg.scale, 5 * cfg.scale, 16 * cfg.scale);
      g.fillCircle(0, 7 * cfg.scale, 20 * cfg.scale);
      g.fillCircle(24 * cfg.scale, 5 * cfg.scale, 15 * cfg.scale);

      // Wolkenkörper (reines Weiß)
      g.fillStyle(0xffffff, 0.88);
      g.fillCircle(-24 * cfg.scale, 0, 16 * cfg.scale);
      g.fillCircle(-10 * cfg.scale, -8 * cfg.scale, 20 * cfg.scale);
      g.fillCircle(12 * cfg.scale, -6 * cfg.scale, 22 * cfg.scale);
      g.fillCircle(26 * cfg.scale, 2 * cfg.scale, 15 * cfg.scale);
      g.fillRoundedRect(-32 * cfg.scale, 0, 64 * cfg.scale, 14 * cfg.scale, 7 * cfg.scale);

      container.add(g);
      container.speed = cfg.speed;
      this.clouds.push(container);
    });

    // 6. Frische, grüne Gras- und Bodenkante an der Oberfläche (Tiefe 2)
    // Untere Erdschicht (dunkelbraun)
    this.add.rectangle(0, 2, spanW, 4, 0x3f2e1e).setDepth(2);
    // Saftige grüne Graslinie
    this.add.rectangle(0, 0, spanW, 3, 0x16a34a).setDepth(2.1);
    // Helle Gras-Lichtkante
    this.add.rectangle(0, -1, spanW, 1.2, 0x4ade80).setDepth(2.2);

    // Kleine Grashalme & Akzente entlang der Oberfläche
    const grassDetails = this.add.graphics().setDepth(2.3);
    grassDetails.lineStyle(1.4, 0x22c55e, 0.9);
    for (let gx = -2000; gx <= 2000; gx += 28) {
      // Nicht direkt in der Hangar-Schacht-Einfahrt
      if (gx >= 18 * 32 && gx <= 21 * 32) continue;
      const h = Phaser.Math.Between(2, 4);
      grassDetails.beginPath();
      grassDetails.moveTo(gx, -1);
      grassDetails.lineTo(gx - 1, -1 - h);
      grassDetails.moveTo(gx + 3, -1);
      grassDetails.lineTo(gx + 4, -1 - (h - 1));
      grassDetails.strokePath();
    }
  }

  setupCamera() {
    const cam = this.cameras.main;

    // Endlose Kamera-Grenzen nach links, rechts und in die Tiefe
    cam.setBounds(-100000, -280, 200000, 500000);
    cam.roundPixels = false;
    cam.startFollow(this.player.sprite, false, 1, 1);

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
    if (typeof document !== 'undefined' && document.hidden) return;
    if (this.isPaused) return;

    const isModalOpen = typeof document !== 'undefined' && document.body.classList.contains('modal-open');

    if (!isModalOpen) {
      const inputDir = this.inputHandler.getDirection();
      this.player.update(delta, inputDir);
    }

    // Basis-System, NPC & Gebäude-Funktionen aktualisieren (Produktion läuft weiter)
    if (this.baseSystem && this.baseSystem.update) {
      this.baseSystem.update(delta);
    }

    // Automatisches Speichern alle 30 Sekunden (überschreibt alten Stand)
    this.autoSaveTimer = (this.autoSaveTimer || 0) + delta;
    if (this.autoSaveTimer >= 30000) {
      this.autoSaveTimer = 0;
      if (!SaveSystem.isClearing) {
        SaveSystem.save(this);
      }
    }

    // Viewport Culling & Sensor-Erz-Scanner (bei geöffnetem Modal pausiert)
    if (!isModalOpen) {
      this.gridSystem.updateViewport(this.cameras.main, this.player);
    }

    // Sanfte Wolkendrift am Tageshimmel
    if (this.clouds && this.clouds.length) {
      const dtSec = Math.min(0.05, delta / 1000);
      for (const cloud of this.clouds) {
        cloud.x += cloud.speed * dtSec;
        if (cloud.x > 3200) {
          cloud.x = -3200;
        }
      }
    }

    // HUD synchronisieren
    this.hud.update();
  }

  useDynamite() {
    if (!this.player) return false;
    if (!this.player.gadgets) this.player.gadgets = { dynamite: 3, fuel_canister: 2, repair_kit: 2 };
    if ((this.player.gadgets.dynamite || 0) <= 0) {
      this.hud?.showToast('Kein Dynamit im Vorrat! (Im Hangar erhältlich)', 'warning');
      soundFx.playError();
      return false;
    }

    const currentY = this.player.sprite ? this.player.sprite.y : (this.player.gy * TILE_SIZE + TILE_SIZE / 2);
    if (currentY <= -8 || this.player.gy < 0) {
      this.hud?.showToast('Dynamit kann nur unter Tage platziert werden!', 'info');
      return false;
    }
    if (this.isDynamiteActive) {
      this.hud?.showToast('Ein Sprengsatz zündet bereits!', 'warning');
      return false;
    }

    this.player.gadgets.dynamite--;
    this.isDynamiteActive = true;
    this.events.emit('player_updated');

    // Exakte ganzzahlige Gitterkoordinaten (verhindert Fehltreffer bei Float-Werten im Flug)
    const pX = this.player.sprite ? this.player.sprite.x : this.player.x;
    const pY = this.player.sprite ? this.player.sprite.y : this.player.y;
    const gx = Math.round((pX - TILE_SIZE / 2) / TILE_SIZE);
    const gy = Math.max(1, Math.round((pY - TILE_SIZE / 2) / TILE_SIZE));
    const bombX = gx * TILE_SIZE + TILE_SIZE / 2;
    const bombY = gy * TILE_SIZE + TILE_SIZE / 2;

    // Dynamit-Sprite platzieren
    const bombSprite = this.add.image(bombX, bombY, 'item_dynamite')
      .setDepth(15)
      .setScale(0.95);

    // Zündschnur-Ticken & Blinken
    soundFx.playClick();
    this.hud?.showToast('🧨 Dynamit scharf gemacht! Detonation in 1.4s!', 'warning');

    this.tweens.add({
      targets: bombSprite,
      scaleX: 1.25,
      scaleY: 1.25,
      yoyo: true,
      repeat: 3,
      duration: 175,
      onComplete: () => {
        try {
          bombSprite.destroy();
          this.explodeDynamite(gx, gy);
        } catch (err) {
          console.error('Fehler bei Detonation:', err);
        } finally {
          this.isDynamiteActive = false;
        }
      }
    });
    return true;
  }

  explodeDynamite(centerGx, centerGy) {
    try {
      centerGx = Math.round(centerGx);
      centerGy = Math.round(centerGy);
      const bombX = centerGx * TILE_SIZE + TILE_SIZE / 2;
      const bombY = centerGy * TILE_SIZE + TILE_SIZE / 2;

      // Sound & Erschütterung
      soundFx.playExplosion();
      this.cameras.main.shake(380, 0.028);

    // Explosions-Flash
    const blast = this.add.circle(bombX, bombY, 56, 0xfef08a, 0.95).setDepth(20);
    this.tweens.add({
      targets: blast,
      scale: 1.6,
      alpha: 0,
      duration: 320,
      onComplete: () => blast.destroy()
    });

    let oresCollected = 0;

    // 3x3 Kacheln um das Zentrum sprengen
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const tgx = centerGx + dx;
        const tgy = centerGy + dy;

        // Oberfläche gy <= 0 Fundamente nicht sprengen
        if (tgy <= 0) continue;

        const tile = this.gridSystem.getTile(tgx, tgy);
        if (tile && tile.type !== 'empty' && !tile.indestructible) {
          if (tile.ore) {
            if (this.player.cargo.length < this.player.maxCargo) {
              this.player.collectOre(tile.ore);
              oresCollected++;
            }
          }
          this.gridSystem.damageTile(tgx, tgy, 999999);
        }
      }
    }

    // Sofortige visuelle Aktualisierung der Kacheln und des Nebels
    this.gridSystem.fogDirty = true;
    this.gridSystem.lastCamX = null;
    this.gridSystem.updateViewport(this.cameras.main, this.player);

    // Spieler-Schaden wenn noch im Explosionsradius
    const curPx = this.player.sprite ? this.player.sprite.x : this.player.x;
    const curPy = this.player.sprite ? this.player.sprite.y : this.player.y;
    const curGx = Math.round((curPx - TILE_SIZE / 2) / TILE_SIZE);
    const curGy = Math.round((curPy - TILE_SIZE / 2) / TILE_SIZE);

    if (Math.abs(curGx - centerGx) <= 1 && Math.abs(curGy - centerGy) <= 1) {
      this.player.takeDamage(20);
      this.hud?.showToast('💥 Autsch! Eigene Sprengung hat dich erwischt! (-20 HP)', 'danger');
    } else if (oresCollected > 0) {
      this.hud?.showToast(`💥 BOOM! Sprengung erfolgreich: +${oresCollected} Erze geborgen!`, 'success');
    } else {
      this.hud?.showToast('💥 BOOM! Felsbereich freigesprengt!', 'info');
    }
    this.events.emit('player_updated');

    // Geröll über dem Krater prüfen
    for (let dx = -1; dx <= 1; dx++) {
      this.gridSystem.checkBoulderFall(centerGx + dx, centerGy - 2);
    }
    } catch (err) {
      console.error('Dynamite explosion error:', err);
    }
  }
}
