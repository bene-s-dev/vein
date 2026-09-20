import Phaser from 'phaser';
import { GridSystem, TILE_SIZE } from '../core/GridSystem.js';
import { Player } from '../core/Player.js';
import { InputHandler } from '../core/InputHandler.js';
import { BaseSystem } from '../core/BaseSystem.js';
import { MissionSystem } from '../core/MissionSystem.js';
import { HUD } from '../ui/HUD.js';
import { SaveSystem } from '../core/SaveSystem.js';
import { soundFx } from '../core/SoundEffects.js';
import { StartScreen } from '../ui/StartScreen.js';
import { LeaderboardService } from '../core/LeaderboardService.js';
import { EmergencyRescueModal } from '../ui/EmergencyRescueModal.js';

export class MiningScene extends Phaser.Scene {
  constructor() {
    super('MiningScene');
  }

  create() {
    // 1. GridSystem initialisieren (endlose Welt nach unten & in beide Richtungen)
    this.gridSystem = new GridSystem(this);

    // 2. Himmel & Sternenhintergrund (endlose Weite mit Tag-/Nacht-Unterstützung)
    this.surfaceTheme = (typeof localStorage !== 'undefined' && localStorage.getItem('vein_surface_theme')) || 'day';
    this.skyElements = [];
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
    this.rescueModal = new EmergencyRescueModal(this, this.player);
    window.__activeMiningScene = this;

    this.events.on('fuel_empty', () => {
      this.checkFuelStatusAndShowRescue();
    });

    // 8. Kamera vorab initialisieren (korrekte Screen-Dimensionen & Zoom)
    this.setupCamera();

    // 9. Gespeicherten Spielfortschritt aus localStorage laden
    SaveSystem.load(this);

    // Initialen Status der Mission an HUD senden
    this.events.emit('mission_updated', this.missionSystem.getMissionStatus());

    // Vor Schließen des Fensters, Tab-Wechsel oder App-Minimieren automatisch sichern (auch iOS Safari)
    const handleAutoSave = () => {
      if (!SaveSystem.isClearing) {
        SaveSystem.save(this);
      }
    };
    window.addEventListener('beforeunload', handleAutoSave);
    window.addEventListener('pagehide', handleAutoSave);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        handleAutoSave();
      }
    });

    // 10. Kamera nach dem Laden sauber auf den Spieler zentrieren & Viewport sofort rendern
    this.setupCamera();
    this.gridSystem.fogDirty = true;
    this.gridSystem.fogBufferReady = false;
    this.gridSystem.updateViewport(this.cameras.main, this.player);

    // 11. Resize-Listener
    this.scale.on('resize', (gameSize) => {
      this.cameras.main.setViewport(0, 0, gameSize.width, gameSize.height);
      this.setupCamera();
      this.gridSystem.updateViewport(this.cameras.main, this.player);
    });

    // 12. Platzierte TNT-Sprengsätze (Fernzündung)
    this.placedTnt = [];

    // 13. Start-Bildschirm initialisieren (Spiel im Pausenmodus, saubere unberührte Welt)
    this.inStartScreen = true;
    this.isPaused = true;
    this.startScreen = new StartScreen(this);

    // Bisher an Supabase übermittelte Rekordtiefe laden
    this._lastSubmittedLeaderboardDepth = parseInt(localStorage.getItem('vein_last_submitted_depth') || '0', 10);
  }

  autoSaveNow() {
    if (!SaveSystem.isClearing) {
      SaveSystem.save(this);
    }
  }

  toggleSurfaceTheme() {
    const nextTheme = this.surfaceTheme === 'night' ? 'day' : 'night';
    this.setSurfaceTheme(nextTheme);
    return nextTheme;
  }

  setSurfaceTheme(theme) {
    this.surfaceTheme = theme;
    try {
      localStorage.setItem('vein_surface_theme', theme);
    } catch (_) {}
    this.createSkyAndSurface();
  }

  createSkyAndSurface() {
    const spanW = 200000;
    const skyHeight = 360;
    const isNight = this.surfaceTheme === 'night';

    // Bisherige Oberflächen-Elemente sauber aufräumen
    if (this.skyElements && this.skyElements.length) {
      this.skyElements.forEach(el => {
        try {
          if (el && el.destroy) el.destroy();
        } catch (_) {}
      });
    }
    this.skyElements = [];
    this.clouds = [];

    // 1. Himmel (Tag: Azurblau -> Horizont-Cyan / Nacht: Tiefes Obsidian-Nachtblau -> Midnight-Navy)
    const sky = this.add.graphics().setDepth(1);
    this.skyElements.push(sky);
    if (isNight) {
      sky.fillGradientStyle(0x020617, 0x020617, 0x0b1329, 0x172554, 1);
    } else {
      sky.fillGradientStyle(0x0284c7, 0x0284c7, 0xbae6fd, 0xe0f2fe, 1);
    }
    sky.fillRect(-spanW / 2, -skyHeight, spanW, skyHeight);

    // 1b. Funkelnder Sternenhimmel bei Nacht
    if (isNight) {
      const starGraphics = this.add.graphics().setDepth(1.1);
      this.skyElements.push(starGraphics);

      // Deterministische Sternenverteilung (saubere funkelnde Lichtpunkte ohne harte Nebelscheiben)
      const starColors = [0xffffff, 0xf8fafc, 0xbae6fd, 0xfef3c7];
      for (let i = 0; i < 220; i++) {
        const sx = ((i * 997 + 1337) % 7600) - 3800;
        const sy = -340 + ((i * 353 + 71) % 300);
        const color = starColors[i % starColors.length];
        const alpha = 0.30 + ((i % 7) / 10);
        const r = (i % 13 === 0) ? 1.8 : ((i % 5 === 0) ? 1.2 : 0.8);
        starGraphics.fillStyle(color, alpha);
        starGraphics.fillCircle(sx, sy, r);
        if (i % 23 === 0) {
          // Nur wenige funkelnde Sterne mit feinem Fadenkreuz
          starGraphics.lineStyle(1, color, alpha * 0.40);
          starGraphics.beginPath();
          starGraphics.moveTo(sx - 3, sy);
          starGraphics.lineTo(sx + 3, sy);
          starGraphics.moveTo(sx, sy - 3);
          starGraphics.lineTo(sx, sy + 3);
          starGraphics.strokePath();
        }
      }
    }

    // 2. Weit entfernte Bergkette im Hintergrund (Tiefe 1.2)
    const mountains = this.add.graphics().setDepth(1.2);
    this.skyElements.push(mountains);
    if (isNight) {
      mountains.fillStyle(0x080e18, 0.95);
      mountains.lineStyle(1, 0x1e293b, 0.40);
    } else {
      mountains.fillStyle(0x38bdf8, 0.28);
    }
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
    if (isNight) {
      mountains.strokePath();
    }

    // 3. Mittlere sanfte Hügelkette (Tiefe 1.3)
    const hills = this.add.graphics().setDepth(1.3);
    this.skyElements.push(hills);
    if (isNight) {
      hills.fillStyle(0x064e3b, 0.45);
    } else {
      hills.fillStyle(0x166534, 0.40);
    }
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

    // 4. Himmelskörper (Tag: Strahlende Sonne / Nacht: Realistischer Mond mit Mondschein & Kratern) (Tiefe 1.4)
    const celestialX = 620;
    const celestialY = -215;
    const celestial = this.add.graphics().setDepth(1.4);
    this.skyElements.push(celestial);

    if (isNight) {
      // 🌙 Authentischer Mond (keine Sonnenstrahlen, stattdessen weicher diffuser Mondschein)
      // Zarter atmosphärischer Glow
      celestial.fillStyle(0x38bdf8, 0.03);
      celestial.fillCircle(celestialX, celestialY, 56);
      celestial.fillStyle(0x93c5fd, 0.06);
      celestial.fillCircle(celestialX, celestialY, 38);
      celestial.fillStyle(0xe2e8f0, 0.10);
      celestial.fillCircle(celestialX, celestialY, 26);

      // Mondscheibe (sanftes Mondsilber)
      celestial.fillStyle(0xf1f5f9, 0.98);
      celestial.fillCircle(celestialX, celestialY, 20);

      // Sphärische 3D-Tiefenschattierung am Rand
      celestial.fillStyle(0x94a3b8, 0.18);
      celestial.fillCircle(celestialX - 4, celestialY + 3, 17);

      // Mondmeere (Maria / dunkle Basaltebenen)
      celestial.fillStyle(0x94a3b8, 0.38);
      celestial.fillCircle(celestialX - 6, celestialY - 4, 5.5);
      celestial.fillCircle(celestialX - 10, celestialY - 2, 3.8);
      celestial.fillCircle(celestialX - 3, celestialY - 9, 3.2);
      celestial.fillCircle(celestialX + 5, celestialY + 2, 5.0);
      celestial.fillCircle(celestialX + 8, celestialY - 3, 3.5);
      celestial.fillCircle(celestialX + 4, celestialY + 7, 3.8);

      // Krater mit 3D-Lichtkante und Schattenbecken
      // Krater 1 (Tycho-artig unten)
      celestial.fillStyle(0xffffff, 0.75);
      celestial.fillCircle(celestialX - 2.5, celestialY + 6.5, 3.2);
      celestial.fillStyle(0x64748b, 0.55);
      celestial.fillCircle(celestialX - 2.0, celestialY + 7.0, 2.4);

      // Krater 2 (Copernicus-artig rechts oben)
      celestial.fillStyle(0xffffff, 0.70);
      celestial.fillCircle(celestialX + 6.5, celestialY - 6.5, 2.5);
      celestial.fillStyle(0x64748b, 0.50);
      celestial.fillCircle(celestialX + 7.0, celestialY - 6.0, 1.8);
    } else {
      // ☀️ Strahlende Sonne mit warmem Glow
      celestial.fillStyle(0xfef08a, 0.12);
      celestial.fillCircle(celestialX, celestialY, 68);
      celestial.fillStyle(0xfde047, 0.28);
      celestial.fillCircle(celestialX, celestialY, 38);

      celestial.lineStyle(1.5, 0xfef08a, 0.25);
      for (let r = 0; r < 8; r++) {
        const angle = (r * Math.PI) / 4;
        celestial.beginPath();
        celestial.moveTo(celestialX + Math.cos(angle) * 22, celestialY + Math.sin(angle) * 22);
        celestial.lineTo(celestialX + Math.cos(angle) * 48, celestialY + Math.sin(angle) * 48);
        celestial.strokePath();
      }

      celestial.fillStyle(0xfffbeb, 0.98);
      celestial.fillCircle(celestialX, celestialY, 18);
    }

    // 5. Wolken (nur am Tag aktiv, nachts klarer Sternenhimmel) (Tiefe 1.5)
    this.clouds = [];
    if (!isNight) {
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
        this.skyElements.push(container);
        const g = this.add.graphics();

        g.fillStyle(0xe2e8f0, 0.45);
        g.fillCircle(-22 * cfg.scale, 5 * cfg.scale, 16 * cfg.scale);
        g.fillCircle(0, 7 * cfg.scale, 20 * cfg.scale);
        g.fillCircle(24 * cfg.scale, 5 * cfg.scale, 15 * cfg.scale);

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
    }


    // 6. Gras- und Bodenkante an der Oberfläche (Tiefe 2)
    const earthColor = isNight ? 0x1c1917 : 0x3f2e1e;
    const grassColor = isNight ? 0x064e3b : 0x16a34a;
    const grassEdgeColor = isNight ? 0x10b981 : 0x4ade80;
    const bladeColor = isNight ? 0x059669 : 0x22c55e;

    const r1 = this.add.rectangle(0, 2, spanW, 4, earthColor).setDepth(2);
    const r2 = this.add.rectangle(0, 0, spanW, 3, grassColor).setDepth(2.1);
    const r3 = this.add.rectangle(0, -1, spanW, 1.2, grassEdgeColor).setDepth(2.2);
    this.skyElements.push(r1, r2, r3);

    // Kleine Grashalme & Akzente entlang der Oberfläche
    const grassDetails = this.add.graphics().setDepth(2.3);
    this.skyElements.push(grassDetails);
    grassDetails.lineStyle(1.4, bladeColor, 0.9);
    for (let gx = -2000; gx <= 2000; gx += 28) {
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

    const screenW = Math.max(this.scale.width || 0, window.innerWidth || 0, document.documentElement.clientWidth || 0);
    const screenH = Math.max(this.scale.height || 0, window.innerHeight || 0, document.documentElement.clientHeight || 0);

    // Viewport und Display-Größe der Kamera zwingend setzen (verhindert 1px-Glitch auf Mobile)
    cam.setViewport(0, 0, screenW, screenH);
    cam.setSize(screenW, screenH);

    // Endlose Kamera-Grenzen nach links, rechts und in die Tiefe
    cam.setBounds(-100000, -280, 200000, 500000);
    cam.roundPixels = false;
    if (this.player && this.player.sprite) {
      cam.centerOn(this.player.sprite.x, this.player.sprite.y);
      cam.startFollow(this.player.sprite, false, 1, 1);
    }

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

    if (this.player && this.player.sprite) {
      cam.centerOn(this.player.sprite.x, this.player.sprite.y);
    }

    // WorldView sofort synchron berechnen, damit Viewport-Culling und Fog-Buffer stets akkurat sind
    if (cam.preRender) {
      cam.preRender();
    }
  }

  update(time, delta) {
    if (typeof document !== 'undefined' && document.hidden) {
      soundFx.stopAllLoops?.();
      return;
    }

    // Soundtrack dynamisch an Tiefe anpassen (auch während Modals, Depot oder im Schacht)
    const currentDepth = this.player ? (this.player.depthMeters || 0) : 0;
    soundFx.updateSoundtrack?.(currentDepth);

    if (this.inStartScreen) {
      soundFx.stopAllLoops?.();
      return;
    }

    const isMovementBlocked = (typeof document !== 'undefined' && (
      document.body.classList.contains('modal-open') ||
      document.body.classList.contains('tutorial-open') ||
      document.body.classList.contains('discovery-modal-open')
    )) || !!this.isRescueCutsceneActive || this.isPaused;

    // Notfall-Bergung / Game Over prüfen
    if (this.player && !this.isRescueCutsceneActive) {
      this.checkFuelStatusAndShowRescue();
    }

    if (!isMovementBlocked && !this.player?.isGameOver) {
      const inputDir = this.inputHandler.getDirection();
      this.player.update(delta, inputDir);
    } else if (!this.isRescueCutsceneActive) {
      soundFx.stopAllLoops?.(true);
      // Tanken & Reparatur weiterlaufen lassen, auch wenn Bewegung blockiert oder Menüs offen sind
      if (this.player && !this.player.isGameOver) {
        this.player.checkDocking(delta);
      }
    }

    // Basis-System, NPC & Gebäude-Funktionen aktualisieren (Produktion läuft weiter)
    if (this.baseSystem && this.baseSystem.update) {
      this.baseSystem.update(delta);
    }

    // Automatisches Speichern alle 10 Sekunden (mobilfreundlich für kurze Sessions)
    this.autoSaveTimer = (this.autoSaveTimer || 0) + delta;
    if (this.autoSaveTimer >= 10000) {
      this.autoSaveTimer = 0;
      if (!SaveSystem.isClearing) {
        SaveSystem.save(this);
        this.checkAndSubmitLeaderboard();
      }
    }

    // Sofort-Speichern beim Wiederauftauchen an die Oberfläche
    const isAtSurface = this.player && (this.player.gy <= 0 || (this.player.sprite && this.player.sprite.y <= -8));
    if (isAtSurface && this._wasDeepUnderground) {
      this._wasDeepUnderground = false;
      this.autoSaveNow();
    } else if (!isAtSurface && this.player && this.player.gy >= 2) {
      this._wasDeepUnderground = true;
    }

    // Viewport Culling & Sensor-Erz-Scanner (bei geöffnetem Vollbild-Modal pausiert, im Tutorial aktiv)
    const isFullscreenModalOpen = typeof document !== 'undefined' && document.body.classList.contains('modal-open');
    if (!isFullscreenModalOpen) {
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
    if (!this.player.gadgets) this.player.gadgets = { dynamite: 0, fuel_canister: 0, repair_kit: 0 };
    if ((this.player.gadgets.dynamite || 0) <= 0) {
      this.hud?.showToast('Kein Dynamit im Vorrat!', 'warning');
      soundFx.playError();
      return false;
    }

    const currentY = this.player.sprite ? this.player.sprite.y : (this.player.gy * TILE_SIZE + TILE_SIZE / 2);
    if (currentY <= -8 || this.player.gy < 0) {
      this.hud?.showToast('Dynamit kann nur unter Tage platziert werden!', 'warning');
      soundFx.playError();
      return false;
    }

    // Exakte ganzzahlige Gitterkoordinaten (verhindert Fehltreffer bei Float-Werten im Flug)
    const pX = this.player.sprite ? this.player.sprite.x : this.player.x;
    const pY = this.player.sprite ? this.player.sprite.y : this.player.y;
    const gx = Math.round((pX - TILE_SIZE / 2) / TILE_SIZE);
    const gy = Math.max(1, Math.round((pY - TILE_SIZE / 2) / TILE_SIZE));

    if (!this.placedTnt) this.placedTnt = [];

    // Prüfen, ob an dieser Position bereits eine Ladung scharf liegt
    const alreadyPlaced = this.placedTnt.some(b => b.gx === gx && b.gy === gy);
    if (alreadyPlaced) {
      this.hud?.showToast('An dieser Stelle liegt bereits eine Sprengladung!', 'info');
      soundFx.playError();
      return false;
    }

    this.player.gadgets.dynamite--;

    const bombX = gx * TILE_SIZE + TILE_SIZE / 2;
    const bombY = gy * TILE_SIZE + TILE_SIZE / 2;

    // Dynamit-Sprite scharf im Schacht platzieren
    const bombSprite = this.add.image(bombX, bombY, 'item_dynamite')
      .setDepth(15)
      .setScale(0.95);

    // Scharfschaltungs-LED (rotes Pulsieren signalisiert Fernzündungs-Bereitschaft)
    const ledIndicator = this.add.circle(bombX, bombY - 10, 3.5, 0xef4444, 0.95)
      .setDepth(16);

    const tween = this.tweens.add({
      targets: [bombSprite, ledIndicator],
      scaleX: 1.12,
      scaleY: 1.12,
      alpha: 0.85,
      yoyo: true,
      repeat: -1,
      duration: 500,
      ease: 'Sine.easeInOut'
    });

    const blastSize = this.player.getTntBlastSize ? this.player.getTntBlastSize() : 3;

    const tntEntry = {
      gx,
      gy,
      bombX,
      bombY,
      sprite: bombSprite,
      led: ledIndicator,
      tween,
      blastSize
    };

    this.placedTnt.push(tntEntry);

    soundFx.playClick();
    this.hud?.showToast(`💣 TNT platziert (${this.placedTnt.length}x scharf - Zünden per Aktions-Button)`, 'info');
    this.events.emit('player_updated');
    this.hud?.update();
    return true;
  }

  detonateAllTnt() {
    if (!this.placedTnt || this.placedTnt.length === 0) {
      this.hud?.showToast('Keine scharfen TNT-Ladungen platziert!', 'info');
      soundFx.playError();
      return false;
    }

    const bombsToExplode = [...this.placedTnt];
    this.placedTnt = [];

    // Sofort HUD aktualisieren
    this.events.emit('player_updated');
    this.hud?.update();

    // Detonations-Kaskade (schnelle Kaskade von 75ms zwischen Ladungen für kinoreife Action)
    bombsToExplode.forEach((bomb, index) => {
      this.time.delayedCall(index * 75, () => {
        try {
          if (bomb.tween) bomb.tween.stop();
          if (bomb.led) bomb.led.destroy();
          if (bomb.sprite) bomb.sprite.destroy();
          this.explodeDynamite(bomb.gx, bomb.gy, bomb.blastSize);
        } catch (err) {
          console.error('Fehler bei Detonation:', err);
        }
      });
    });

    return true;
  }

  explodeDynamite(centerGx, centerGy, blastSize = 3) {
    try {
      centerGx = Math.round(centerGx);
      centerGy = Math.round(centerGy);
      const bombX = centerGx * TILE_SIZE + TILE_SIZE / 2;
      const bombY = centerGy * TILE_SIZE + TILE_SIZE / 2;

      // Immer ungerade Kachel-Dimension sicherstellen (3x3, 5x5, 7x7, ...)
      let size = Math.max(3, Math.round(blastSize));
      if (size % 2 === 0) size += 1;
      const radius = Math.floor(size / 2);

      // Sound & Erschütterung (skaliert dynamisch mit Sprengkraft)
      soundFx.playExplosion();
      const shakeIntensity = 0.024 + (size - 3) * 0.003;
      this.cameras.main.shake(380 + (size - 3) * 30, Math.min(0.05, shakeIntensity));

      // Explosions-Flash (visuell skaliert mit Feldgröße)
      const flashRadius = size * 18;
      const blast = this.add.circle(bombX, bombY, flashRadius, 0xfef08a, 0.95).setDepth(20);
      this.tweens.add({
        targets: blast,
        scale: 1.6,
        alpha: 0,
        duration: 320,
        onComplete: () => blast.destroy()
      });

      // Sekundär-Flammenwelle
      const blastFire = this.add.circle(bombX, bombY, flashRadius * 0.7, 0xf97316, 0.85).setDepth(21);
      this.tweens.add({
        targets: blastFire,
        scale: 1.8,
        alpha: 0,
        duration: 260,
        onComplete: () => blastFire.destroy()
      });

      let oresCollected = 0;

      // Kacheln im symmetrischen Radius um die Bombe (3x3, 5x5, 7x7 etc.) sprengen
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const tgx = centerGx + dx;
          const tgy = centerGy + dy;

          // Oberfläche gy <= 0 Fundamente nicht sprengen
          if (tgy <= 0) continue;

          const tile = this.gridSystem.getTile(tgx, tgy);
          if (tile && tile.type !== 'empty' && !tile.indestructible) {
            if (this.player.stats) {
              this.player.stats.totalTilesMined = (this.player.stats.totalTilesMined || 0) + 1;
            }
            if (tile.ore) {
              if (this.player.discoverOre) {
                this.player.discoverOre(tile.ore);
              }
              if (this.player.stats) {
                if (!this.player.stats.totalOresMined) this.player.stats.totalOresMined = {};
                this.player.stats.totalOresMined[tile.ore] = (this.player.stats.totalOresMined[tile.ore] || 0) + 1;
              }
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

      if (Math.abs(curGx - centerGx) <= radius && Math.abs(curGy - centerGy) <= radius) {
        this.player.takeDamage(20 + radius * 5);
      }
      this.events.emit('player_updated');

      // Geröll über dem Krater prüfen
      for (let dx = -radius; dx <= radius; dx++) {
        this.gridSystem.checkBoulderFall(centerGx + dx, centerGy - radius - 1);
      }
    } catch (err) {
      console.error('Dynamite explosion error:', err);
    }
  }

  /**
   * Sendet den aktuellen Tiefenrekord alle 30 Sekunden an Supabase,
   * jedoch AUSSCHLIESSLICH dann, wenn ein neuer Tiefenrekord aufgestellt wurde.
   */
  checkAndSubmitLeaderboard() {
    if (!this.player || this.inStartScreen) return;
    const currentMax = Math.max(0, Math.round(this.player.highestDepthReached || 0));
    const lastSubmitted = this._lastSubmittedLeaderboardDepth || 0;

    if (currentMax > 0 && currentMax > lastSubmitted) {
      this._lastSubmittedLeaderboardDepth = currentMax;
      try {
        localStorage.setItem('vein_last_submitted_depth', String(currentMax));
      } catch (_) {}

      const name = this.player.name || localStorage.getItem('vein_player_name') || 'Fahrer';
      const level = this.player.level || 1;

      LeaderboardService.submitScore(name, currentMax, level).then((ok) => {
        if (ok) {
          console.log(`[Leaderboard] Neuer Tiefenrekord an Supabase übermittelt: ${name} – ${currentMax}m (Lv.${level})`);
        }
      }).catch((err) => {
        console.warn('[Leaderboard] Fehler beim Senden an Supabase:', err);
      });
    }
  }

  /**
   * Prüft ob der Treibstoff unter Tage leer ist oder Game Over vorliegt,
   * und öffnet das Rettungs-/Game-Over-Modal.
   */
  checkFuelStatusAndShowRescue() {
    if (!this.player || this.inStartScreen || this.isRescueCutsceneActive) return;
    const isFuelEmpty = (this.player.fuel <= 0.05);
    const isActivelyRefueling = this.player.fuelArmState && this.player.fuelArmState.isDockedOnVehicle;
    const atSurface = this.player.gy <= -1 || (this.player.sprite && this.player.sprite.y <= -16);

    // Rettungsmodal öffnet bei Game Over oder bei leerem Tank unter Tage (an der Oberfläche ist Verbrauch aus)
    if (this.player.isGameOver || (isFuelEmpty && !isActivelyRefueling && !atSurface)) {
      if (this.rescueModal && !this.rescueModal.isOpen) {
        this.rescueModal.open();
      }
    }
  }

  /**
   * Realistische Rettungsfahrzeug-Sequenz:
   * 1. Berechnet mittels Breitensuche (BFS) den exakten, befahrbaren Tunnel-Pfad vom Schacht
   *    (Oberfläche / Stollen) bis zum havarierten Driller durch alle freigelegten Kacheln.
   * 2. Das Rettungsfahrzeug fährt/fliegt diesen gegrabenen Tunneln entlang (mit Ketten- oder Jetpack-Sound,
   *    automatischer Blickrichtungs- und Track-Animation).
   * 3. Dockt mit Schleppkabel am Driller an.
   * 4. Zieht den Driller auf demselben Tunnelpfad wieder zurück nach oben an die Oberfläche.
   * 5. Übergibt den Driller sanft an das Hangar-Dock und fährt mit Ketten nach links weg.
   */
  playRescueCutscene(message = 'Bergung erfolgreich') {
    if (this.isRescueCutsceneActive) return;
    this.isRescueCutsceneActive = true;

    const p = this.player;
    if (!p || !p.sprite) {
      p?.teleportToSurface(message);
      this.isRescueCutsceneActive = false;
      return;
    }

    let crawlerTimer = null;
    let thrusterParticles = null;
    let rescueSprite = null;
    let activeMoveStep = null;
    let safetyWatchdog = null;

    const stopActivePathMovement = () => {
      if (activeMoveStep) {
        this.events.off('update', activeMoveStep);
        activeMoveStep = null;
      }
    };

    try {
      // 1. Spieler-Bewegung und Steuerung sofort sperren & bisherige Sounds anhalten
      p.state = 'IDLE';
      this.tweens.killTweensOf(p.sprite);
      soundFx.stopAllLoops?.();
      soundFx.stopJetpack?.();
      soundFx.stopDrilling?.();
      soundFx.stopDrive?.();
      if (p.leftThrustParticles) p.leftThrustParticles.stop();
      if (p.rightThrustParticles) p.rightThrustParticles.stop();
      if (p.leftHoverParticles) p.leftHoverParticles.stop();
      if (p.rightHoverParticles) p.rightHoverParticles.stop();
      if (p.drillParticles) p.drillParticles.stop();

      // Exakte Kachelkoordinaten des Spielers
      const playerGx = Math.floor(p.sprite.x / TILE_SIZE);
      const playerGy = Math.floor(p.sprite.y / TILE_SIZE);
      const isUnderground = (playerGy > 0) || (playerGy === 0 && p.sprite.y > -8);

      const shaftGx = 20;
      const startSurfaceGx = Math.max(shaftGx + 5, Math.min(32, playerGx + 6));
      const surfaceGy = -1;
      const surfaceY = -16;
      const startX = startSurfaceGx * TILE_SIZE + TILE_SIZE / 2;
      const startY = surfaceY;

      // Sicherheits-Watchdog: Falls Wegfindung oder Animation hängenbleibt, garantiert nach max. 20s bergen
      safetyWatchdog = this.time.delayedCall(20000, () => {
        if (this.isRescueCutsceneActive) {
          console.warn('[RescueCutscene] Watchdog ausgelöst - Fallback Bergung');
          stopActivePathMovement();
          try {
            if (crawlerTimer) crawlerTimer.remove();
            if (thrusterParticles) thrusterParticles.destroy();
            if (rescueSprite) rescueSprite.destroy();
          } catch (_) {}
          this.tweens.killTweensOf(p.sprite);
          this.isRescueCutsceneActive = false;
          p.teleportToSurface(message);
        }
      });

      // BFS-Wegfindung STRIKT durch nicht-solide Kacheln (gegrabene Tunnel & Schächte)
      const findTunnelPath = (fromGx, fromGy, toGx, toGy) => {
        if (toGy <= 0 && !isUnderground) {
          return [{ gx: toGx, gy: toGy, x: toGx * TILE_SIZE + TILE_SIZE / 2, y: toGy < 0 ? -16 : toGy * TILE_SIZE + TILE_SIZE / 2 }];
        }

        const queue = [[fromGx, fromGy]];
        let qHead = 0;
        const visited = new Set();
        const parent = new Map();
        const startKey = `${fromGx},${fromGy}`;
        visited.add(startKey);

        const isWalkable = (gx, gy) => {
          if (gx < 5 || gx > 45) return false;
          if (gy < -1 || gy > toGy + 10) return false;
          if (gy === -1) return true; // Über der Oberfläche
          if (gy === 0 && (gx === 19 || gx === 20)) return true; // Schachteinstieg
          if (this.gridSystem) {
            return !this.gridSystem.isSolid(gx, gy);
          }
          return true;
        };

        let reached = false;
        const dirs = [
          { dx: 0, dy: 1 },  // runter
          { dx: 1, dy: 0 },  // rechts
          { dx: -1, dy: 0 }, // links
          { dx: 0, dy: -1 }  // hoch
        ];

        let iterations = 0;
        while (qHead < queue.length && iterations < 8000) {
          iterations++;
          const [curGx, curGy] = queue[qHead++];
          if (curGx === toGx && curGy === toGy) {
            reached = true;
            break;
          }

          for (const d of dirs) {
            const nGx = curGx + d.dx;
            const nGy = curGy + d.dy;
            const nKey = `${nGx},${nGy}`;
            if (!visited.has(nKey) && isWalkable(nGx, nGy)) {
              visited.add(nKey);
              parent.set(nKey, [curGx, curGy]);
              queue.push([nGx, nGy]);
            }
          }
        }

        const path = [];
        if (reached) {
          let curr = [toGx, toGy];
          while (curr) {
            const [cgx, cgy] = curr;
            path.unshift({
              gx: cgx,
              gy: cgy,
              x: cgx * TILE_SIZE + TILE_SIZE / 2,
              y: cgy < 0 ? -16 : cgy * TILE_SIZE + TILE_SIZE / 2
            });
            const pKey = `${cgx},${cgy}`;
            curr = parent.get(pKey);
          }
        } else {
          // Fallback: Entlang des Schachts (gx 20) hinab und dann waagerecht
          for (let gy = fromGy; gy <= toGy; gy++) {
            path.push({
              gx: fromGx,
              gy,
              x: fromGx * TILE_SIZE + TILE_SIZE / 2,
              y: gy < 0 ? -16 : gy * TILE_SIZE + TILE_SIZE / 2
            });
          }
          const stepX = toGx >= fromGx ? 1 : -1;
          for (let gx = fromGx + stepX; stepX > 0 ? gx <= toGx : gx >= toGx; gx += stepX) {
            path.push({
              gx,
              gy: toGy,
              x: gx * TILE_SIZE + TILE_SIZE / 2,
              y: toGy * TILE_SIZE + TILE_SIZE / 2
            });
          }
        }
        return path;
      };

      // Tunnelpfad von der Schachtmündung (gx: 20, gy: -1) bis zum havarierten Driller
      const tunnelPath = findTunnelPath(shaftGx, surfaceGy, playerGx, playerGy);

      // Gesamter Anfahrtspfad
      const descentPath = [];
      if (isUnderground) {
        descentPath.push({
          gx: startSurfaceGx,
          gy: surfaceGy,
          x: startX,
          y: surfaceY
        });
        descentPath.push({
          gx: shaftGx,
          gy: surfaceGy,
          x: shaftGx * TILE_SIZE + TILE_SIZE / 2,
          y: surfaceY
        });
        for (const wp of tunnelPath) {
          if (wp.gx === shaftGx && wp.gy === surfaceGy) continue;
          descentPath.push(wp);
        }
      } else {
        descentPath.push({
          gx: startSurfaceGx,
          gy: surfaceGy,
          x: startX,
          y: surfaceY
        });
        if (p.sprite.y < surfaceY - 10) {
          descentPath.push({
            gx: playerGx,
            gy: surfaceGy,
            x: p.sprite.x,
            y: surfaceY
          });
          descentPath.push({
            gx: playerGx,
            gy: playerGy,
            x: p.sprite.x,
            y: p.sprite.y
          });
        } else {
          descentPath.push({
            gx: playerGx,
            gy: surfaceGy,
            x: p.sprite.x,
            y: surfaceY
          });
        }
      }

      // Rotes Rettungsfahrzeug Sprite erzeugen
      rescueSprite = this.add.sprite(startX, startY, 'rescue_crawler_left')
        .setDepth(14)
        .setOrigin(0.5, 0.5);

      // Blaue Flugdüsen-Partikel für das Rettungsfahrzeug
      thrusterParticles = this.add.particles(0, 0, 'particle_thrust', {
        speedY: { min: 80, max: 150 },
        speedX: { min: -10, max: 10 },
        scale: { start: 1.15, end: 0.1 },
        alpha: { start: 0.95, end: 0 },
        lifespan: 190,
        frequency: 20,
        emitting: false
      }).setDepth(13);

      const updateThrusterPos = () => {
        if (!rescueSprite || !rescueSprite.active) return;
        thrusterParticles.setPosition(rescueSprite.x, rescueSprite.y + 13);
      };

      // Kamera direkt und ruckelfrei auf das startende Bergungsfahrzeug ausrichten
      const cam = this.cameras.main;
      cam.stopFollow();
      cam.centerOn(startX, startY);
      if (this.gridSystem) {
        this.gridSystem.updateViewport(cam, p);
      }
      cam.startFollow(rescueSprite, false, 1, 1);

      // Ketten-Lauf-Animation
      let crawlerFacing = 'left';
      let trackStep = 0;
      crawlerTimer = this.time.addEvent({
        delay: 80,
        loop: true,
        callback: () => {
          if (!rescueSprite || !rescueSprite.active) return;
          trackStep = (trackStep + 1) % 4;
          rescueSprite.setTexture(`rescue_crawler_${crawlerFacing}_track_${trackStep}`);
        }
      });

      // Sound-Management während der Bewegung
      let currentSoundState = null;
      const setSoundMode = (mode) => {
        if (currentSoundState === mode) return;
        currentSoundState = mode;
        if (mode === 'fly') {
          soundFx.stopDrive?.();
          soundFx.startJetpack?.();
          thrusterParticles.start();
        } else if (mode === 'drive') {
          soundFx.stopJetpack?.();
          soundFx.startDrive?.();
          thrusterParticles.stop();
        } else {
          soundFx.stopJetpack?.();
          soundFx.stopDrive?.();
          thrusterParticles.stop();
        }
      };

      // Pfad glätten: Alle kollinearen Zwischenpunkte auf geraden Strecken entfernen
      const simplifyPath = (points) => {
        if (!points || points.length <= 2) return points ? [...points] : [];
        const result = [points[0]];
        for (let i = 1; i < points.length - 1; i++) {
          const prev = result[result.length - 1];
          const curr = points[i];
          const next = points[i + 1];
          if (!prev || !curr || !next) continue;
          const dx1 = Math.sign(Math.round(curr.x - prev.x));
          const dy1 = Math.sign(Math.round(curr.y - prev.y));
          const dx2 = Math.sign(Math.round(next.x - curr.x));
          const dy2 = Math.sign(Math.round(next.y - curr.y));
          if (dx1 !== dx2 || dy1 !== dy2) {
            result.push(curr);
          }
        }
        result.push(points[points.length - 1]);
        return result;
      };

      // Helfer für butterweiche, kontinuierliche Pfad-Bewegung pro Frame
      const followPathSmoothly = (spriteToMove, rawWaypoints, moveSpeedPxPerSec, onDirectionChange, onStep, onFinished) => {
        const waypoints = simplifyPath(rawWaypoints);
        let wpIndex = 0;

        const updateDirectionForSegment = (fromX, fromY, toX, toY) => {
          const dx = toX - fromX;
          const dy = toY - fromY;
          if (onDirectionChange) {
            onDirectionChange(dx, dy);
          }
        };

        if (waypoints.length > 0) {
          updateDirectionForSegment(spriteToMove.x, spriteToMove.y, waypoints[0].x, waypoints[0].y);
        }

        const moveStep = (time, delta) => {
          if (!spriteToMove || !spriteToMove.active) {
            stopActivePathMovement();
            return;
          }

          const dtSec = Math.min(0.05, delta / 1000);
          let remainingMove = moveSpeedPxPerSec * dtSec;

          while (remainingMove > 0 && wpIndex < waypoints.length) {
            const target = waypoints[wpIndex];
            const curX = spriteToMove.x;
            const curY = spriteToMove.y;
            const dist = Phaser.Math.Distance.Between(curX, curY, target.x, target.y);

            if (dist <= remainingMove) {
              spriteToMove.setPosition(target.x, target.y);
              remainingMove -= dist;
              wpIndex++;
              if (wpIndex < waypoints.length) {
                updateDirectionForSegment(target.x, target.y, waypoints[wpIndex].x, waypoints[wpIndex].y);
              }
            } else {
              const ratio = dist > 0 ? (remainingMove / dist) : 1;
              spriteToMove.setPosition(curX + (target.x - curX) * ratio, curY + (target.y - curY) * ratio);
              remainingMove = 0;
            }
          }

          updateThrusterPos();
          if (onStep) {
            onStep(spriteToMove.x, spriteToMove.y);
          }

          if (wpIndex >= waypoints.length) {
            stopActivePathMovement();
            if (onFinished) onFinished();
          }
        };

        stopActivePathMovement();
        activeMoveStep = moveStep;
        this.events.on('update', moveStep);
      };

      const handleDirectionChange = (dx, dy) => {
        if (Math.abs(dx) > Math.abs(dy)) {
          crawlerFacing = dx > 0 ? 'right' : 'left';
          setSoundMode('drive');
        } else if (dy > 0) {
          setSoundMode('drive');
        } else {
          setSoundMode('fly');
        }
        if (rescueSprite && rescueSprite.active) {
          rescueSprite.setTexture(`rescue_crawler_${crawlerFacing}_track_${trackStep}`);
        }
      };

      // Phase 1: Anfahrt zum Havaristen von rechts auf der Erdoberfläche
      crawlerFacing = 'left';
      setSoundMode('drive');

      followPathSmoothly(
        rescueSprite,
        descentPath,
        360,
        handleDirectionChange,
        null,
        () => {
          // Phase 2: Ankunft & Einladen des Bohrers
          setSoundMode(null);
          soundFx.playPurchase?.();

          if (rescueSprite.x < p.sprite.x) {
            crawlerFacing = 'left';
          } else {
            crawlerFacing = 'right';
          }
          if (rescueSprite && rescueSprite.active) {
            rescueSprite.setTexture(`rescue_crawler_${crawlerFacing}_track_${trackStep}`);
          }

          p.sprite.setDepth(13);
          this.tweens.add({
            targets: p.sprite,
            x: rescueSprite.x,
            y: rescueSprite.y,
            scaleX: 0.3,
            scaleY: 0.3,
            alpha: 0,
            duration: 650,
            ease: 'Quad.easeIn',
            onComplete: () => {
              p.sprite.setVisible(false);
              soundFx.playClick?.();

              // Phase 3 & 4: Rückfahrt an die Oberfläche / zum Hangar
              const hangarGx = 15;
              const hangarGy = -1;
              const hangarX = hangarGx * TILE_SIZE + TILE_SIZE / 2; // 496
              const hangarY = hangarGy * TILE_SIZE + TILE_SIZE / 2; // -16

              const arriveAtHangar = () => {
                setSoundMode(null);
                cam.stopFollow();

                crawlerFacing = 'left';
                if (rescueSprite && rescueSprite.active) {
                  rescueSprite.setTexture(`rescue_crawler_left_track_${trackStep}`);
                }
                setSoundMode('drive');

                cam.pan(hangarX, hangarY, 1000, 'Sine.easeInOut');

                this.tweens.add({
                  targets: rescueSprite,
                  x: hangarX + 36,
                  y: hangarY,
                  duration: 900,
                  ease: 'Linear',
                  onComplete: () => {
                    setSoundMode(null);

                    // Phase 5: Bohrer wird hinten aus dem Rettungsfahrzeug entlassen
                    p.sprite.setPosition(rescueSprite.x, rescueSprite.y);
                    p.sprite.setVisible(true);
                    p.sprite.setAlpha(0);
                    p.sprite.setScale(0.3);

                    soundFx.playPurchase?.();

                    this.tweens.add({
                      targets: p.sprite,
                      x: hangarX,
                      y: hangarY,
                      scaleX: 1,
                      scaleY: 1,
                      alpha: 1,
                      duration: 700,
                      ease: 'Quad.easeOut',
                      onComplete: () => {
                        p.sprite.setDepth(10);
                        p.sprite.setVisible(true);
                        p.sprite.setAlpha(1);
                        p.sprite.setScale(1);
                        p.isGameOver = false;
                        p.gx = hangarGx;
                        p.gy = hangarGy;
                        p.x = hangarX;
                        p.y = hangarY;
                        p.sprite.setPosition(hangarX, hangarY);
                        p.setVisualDirection('RIGHT');
                        p.state = 'IDLE';

                        // Notfall-Auftankung bei komplett leerem Tank (mind. 20% oder 15L)
                        const minReserve = Math.max(15, Math.round(p.maxFuel * 0.2));
                        if (p.fuel < minReserve) {
                          p.fuel = Math.min(minReserve, p.maxFuel);
                        }

                        cam.startFollow(p.sprite, false, 1, 1);
                        if (this.gridSystem) {
                          this.gridSystem.updateViewport(cam, p);
                        }

                        if (this.events) {
                          this.events.emit('notify', message);
                        }

                        stopActivePathMovement();
                        if (safetyWatchdog) {
                          safetyWatchdog.remove();
                          safetyWatchdog = null;
                        }

                        this.isRescueCutsceneActive = false;
                      }
                    });

                    // Rettungsfahrzeug fährt nach links aus dem Bildschirm
                    this.time.delayedCall(400, () => {
                      crawlerFacing = 'left';
                      setSoundMode('drive');

                      this.tweens.add({
                        targets: rescueSprite,
                        x: -350,
                        duration: 3200,
                        ease: 'Linear',
                        onComplete: () => {
                          setSoundMode(null);
                          if (crawlerTimer) crawlerTimer.remove();
                          if (thrusterParticles) thrusterParticles.destroy();
                          if (rescueSprite) rescueSprite.destroy();
                        }
                      });
                    });
                  }
                });
              };

              if (!isUnderground) {
                const directPath = [
                  { gx: playerGx, gy: surfaceGy, x: rescueSprite.x, y: surfaceY },
                  { gx: hangarGx, gy: hangarGy, x: hangarX + 36, y: hangarY }
                ];
                followPathSmoothly(
                  rescueSprite,
                  directPath,
                  280,
                  handleDirectionChange,
                  (curX, curY) => {
                    p.sprite.setPosition(curX, curY);
                  },
                  () => {
                    arriveAtHangar();
                  }
                );
              } else {
                const ascentRaw = [...tunnelPath].reverse();
                const surfaceWaypoint = {
                  gx: shaftGx,
                  gy: surfaceGy,
                  x: shaftGx * TILE_SIZE + TILE_SIZE / 2,
                  y: surfaceY
                };
                const ascentPath = [];
                for (const wp of ascentRaw) {
                  ascentPath.push(wp);
                }
                if (!ascentPath.some(w => w.gx === shaftGx && w.gy === surfaceGy)) {
                  ascentPath.push(surfaceWaypoint);
                }

                followPathSmoothly(
                  rescueSprite,
                  ascentPath,
                  260,
                  handleDirectionChange,
                  (curX, curY) => {
                    p.sprite.setPosition(curX, curY);
                  },
                  () => {
                    arriveAtHangar();
                  }
                );
              }
            }
          });
        }
      );
    } catch (err) {
      console.error('[RescueCutscene] Fehler bei Bergung:', err);
      stopActivePathMovement();
      try {
        if (crawlerTimer) crawlerTimer.remove();
        if (thrusterParticles) thrusterParticles.destroy();
        if (rescueSprite) rescueSprite.destroy();
        if (safetyWatchdog) safetyWatchdog.remove();
      } catch (_) {}
      this.tweens.killTweensOf(p.sprite);
      this.isRescueCutsceneActive = false;
      p.teleportToSurface(message);
    }
  }
}

