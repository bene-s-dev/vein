/**
 * Player.js
 * Verwaltet das Bergbau-Fahrzeug mit dynamischer Ausrichtung (Bohrkopf in Fahrtrichtung),
 * Fahren nach oben, automatischem Auftanken in der Basis, XP- & Level-System.
 */

import { TILE_SIZE, ORE_DATA } from './GridSystem.js';
import { soundFx } from './SoundEffects.js';
import { FACTORY_PRODUCTS } from './BaseSystem.js';

export const PLAYER_STATES = {
  IDLE: 'idle',
  MOVING: 'moving',
  FLYING: 'flying',
  DRILLING: 'drilling',
  DOCKING: 'docking'
};

export const RANK_NAMES = [
  'Novize',
  'Schürfer',
  'Tiefen-Geologe',
  'Kern-Ingenieur',
  'Meister der Tiefe'
];

export const BATTERY_TIERS = [
  {
    tier: 1,
    name: 'Blei-Säure Standard-Akku',
    shortName: 'Blei-Säure',
    chargeSpeed: 2.2, // Liter/Sekunde (sehr langsam)
    stat: '2.2 L/s Tankspeed',
    cost: 0,
    comp: null,
    level: 1,
    desc: 'Basis-Bleiakku. Sehr langsame Stromaufnahme an der Ladestation.'
  },
  {
    tier: 2,
    name: 'NiMH Hochstrom-Paket Mk.II',
    shortName: 'NiMH Mk.II',
    chargeSpeed: 4.5,
    stat: '4.5 L/s Tankspeed (+105%)',
    cost: 160,
    comp: null,
    level: 1,
    desc: 'Höhere Leitfähigkeit und verbesserte Zyklen verdoppeln die Ladegeschwindigkeit.'
  },
  {
    tier: 3,
    name: 'Li-Ion Schnelllade-Zelle Mk.III',
    shortName: 'Li-Ion Mk.III',
    chargeSpeed: 8.0,
    stat: '8.0 L/s Tankspeed (+78%)',
    cost: 380,
    comp: null,
    level: 1,
    desc: 'Moderne Lithium-Ionen-Zellen mit BMS für zügiges Zwischenladen am Hangar.'
  },
  {
    tier: 4,
    name: 'LiFePO4 Industrie-Speicher Mk.IV',
    shortName: 'LiFePO4 Mk.IV',
    chargeSpeed: 13.0,
    stat: '13.0 L/s Tankspeed (+62%)',
    cost: 850,
    comp: { key: 'hydraulic_part', name: 'Hydraulik-Zylinder', count: 1 },
    level: 2,
    desc: 'Robuster Lithium-Eisenphosphat-Speicher mit aktiver Kühlung für hohen Ladestrom.'
  },
  {
    tier: 5,
    name: 'Festkörper-Batterie Mk.V',
    shortName: 'Solid-State Mk.V',
    chargeSpeed: 20.0,
    stat: '20.0 L/s Tankspeed (+54%)',
    cost: 1900,
    comp: { key: 'titan_alloy', name: 'Titan-Legierung', count: 1 },
    level: 2,
    desc: 'Keramischer Festelektrolyt erlaubt rasante Stromaufnahme ohne Überhitzung.'
  },
  {
    tier: 6,
    name: 'Graphen-Superkondensator Mk.VI',
    shortName: 'Graphen Mk.VI',
    chargeSpeed: 30.0,
    stat: '30.0 L/s Tankspeed (+50%)',
    cost: 3900,
    comp: { key: 'titan_alloy', name: 'Titan-Legierung', count: 2 },
    level: 3,
    desc: 'Graphen-Schichten speichern enorme Energiemengen in Sekundenbruchteilen.'
  },
  {
    tier: 7,
    name: 'Quanten-Resonanz-Speicher Mk.VII',
    shortName: 'Quanten Mk.VII',
    chargeSpeed: 45.0,
    stat: '45.0 L/s Tankspeed (+50%)',
    cost: 8200,
    comp: { key: 'laser_lens', name: 'Kristall-Fokuslinse', count: 2 },
    level: 4,
    desc: 'Resonanzbasierter subatomarer Energiespeicher für Hochgeschwindigkeits-Ladung.'
  },
  {
    tier: 8,
    name: 'Tachyonen-Kern Hyperzelle',
    shortName: 'Tachyonen Mk.VIII',
    chargeSpeed: 70.0,
    stat: '70.0 L/s Tankspeed (+55%)',
    cost: 16500,
    comp: { key: 'quantum_chip', name: 'Quanten-Steuerkern', count: 2 },
    level: 5,
    desc: 'Maximale Ladegeschwindigkeit mit Tachyonen-Technologie für fast sofortiges Volltanken.'
  }
];

export class Player {
  constructor(scene, gridSystem, startGx = 15, startGy = -1) {
    this.scene = scene;
    this.gridSystem = gridSystem;

    // Raster-Koordinaten
    this.gx = startGx;
    this.gy = startGy;

    // Pixel-Position
    this.x = this.gx * TILE_SIZE + TILE_SIZE / 2;
    this.y = this.gy * TILE_SIZE + TILE_SIZE / 2;

    // Sprite mit Start-Textur (nach rechts schauend)
    // Sprite mit Start-Textur (nach rechts schauend)
    this.currentDirection = 'RIGHT';
    this.sprite = scene.add.image(this.x, this.y, 'player_drill_right')
      .setDepth(10)
      .setOrigin(0.5, 0.5);

    // Animierter Bohrkopf (6-stufige Archimedes-Spiral-Drehung)
    this.drillFrame = 0;
    this.drillAnimTimer = 0;

    // Set aller bisher entdeckten Erze (für Entdeckungs-Popup)
    this.discoveredOres = new Set();

    // Dynamischer Scheinwerfer (Über der Erde komplett unsichtbar)
    this.headlight = scene.add.circle(this.x, this.y, 64, 0xfffbeb, 0.08)
      .setDepth(9)
      .setVisible(false);

    // Fahrzeug-Werte & Stats (ausbalancierte Wirtschaft)
    this.maxFuel = 100;
    this.fuel = 100;
    this.fuelEfficiency = 1.0;
    this.tankTier = 1;
    this.batteryTier = 1;

    // Antrieb & Geschwindigkeit (am Anfang ruhig & beherrschbar, upgradebar)
    this.engineTier = 1;
    this.moveDuration = 180; // 180ms pro Kachel (~5.5 Kacheln/s statt 95ms)
    this.flightSpeed = 120;  // 120 px/s Steigflug (ca. 2.5 Kacheln/s)

    this.maxCargo = 10;
    this.cargo = [];
    this.cargoTier = 1;

    this.drillPower = 34; // Ausbalanciert: 85 HP / 34 DPS = ca. 2.5s pro Erdblock
    this.drillTier = 1;
    this.researchedDrillTier = 1; // Im Labor erforschter Bauplan (Montage im Hangar erforderlich)

    // Fabrik-Werkstoffe (Industrieerzeugnisse)
    this.factoryProducts = {
      steel_beam: 0,
      bronze_ingot: 0,
      circuit_board: 0,
      polished_gem: 0,
      titan_plate: 0,
      fusion_rod: 0
    };

    this.maxHull = 100;
    this.hull = 100;
    this.hullTier = 1;

    // Rettungen (3 kostenlos, danach Bergungsgebühr)
    this.freeRescues = 3;

    this.cash = 10; // Startgeld: Erstes Upgrade wird durch Abbau von ca. 10 Kohle verdient!

    // Level- und XP-System (saubere Progression: Start bei Level 1)
    this.level = 1;
    this.xp = 0;
    this.xpNeeded = 350;
    this.highestDepthReached = 0;

    // Spezial-Bauteile für High-Tier Upgrades (vom Steinsammler)
    this.components = {
      hydraulic_part: 0,  // Hydraulik-Zylinder
      titan_alloy: 0,     // Titan-Legierung
      laser_lens: 0,      // Kristall-Fokuslinse
      quantum_chip: 0     // Quanten-Steuerkern
    };

    // Sensor-Modul (Erze im Umkreis sichtbar machen)
    this.sensorTier = 1;
    this.sensorRadius = 1.6; // in Kacheln

    // Visueller Sensor-Umkreis: Graphics-Objekt, das strikt nur unter der Erde (y >= 0) gezeichnet wird
    this.scannerGraphics = scene.add.graphics().setDepth(8);

    // Ladekabel / Betankungsstrahl
    this.refuelBeam = scene.add.graphics().setDepth(12);

    // Spiel-Statistiken
    this.stats = {
      totalTilesMined: 0,
      totalOresMined: {},
      totalCashEarned: 10,
      missionsCompleted: 0,
      researchCompleted: 0
    };

    // Zustand
    this.state = PLAYER_STATES.IDLE;
    this.drillTarget = null;
    this.isDocked = false;
    this.lastInputDir = null;

    // Partikel-Emitter für Bohren (Grau/braunes Gesteinspulver & Abrieb statt gelber Funken)
    this.drillParticles = scene.add.particles(0, 0, 'particle_dust_grey', {
      speed: { min: 20, max: 75 },
      angle: { min: 0, max: 360 },
      scale: { start: 1.1, end: 0.2 },
      alpha: { start: 0.85, end: 0 },
      tint: [ 0xa8a29e, 0x78716c, 0x92400e, 0xb45309, 0x57534e, 0x44403c ],
      lifespan: { min: 220, max: 400 },
      gravityY: 60,
      emitting: false
    }).setDepth(11);

    // Zwei separate, kräftige blaue Jetpack-Strahlen (linker und rechter Triebwerksauslass)
    this.leftThrustParticles = scene.add.particles(0, 0, 'particle_thrust', {
      speedY: { min: 70, max: 150 },
      speedX: { min: -10, max: 10 },
      scale: { start: 1.3, end: 0.1 },
      alpha: { start: 0.95, end: 0 },
      lifespan: 190,
      frequency: 25,
      emitting: false
    }).setDepth(9);

    this.rightThrustParticles = scene.add.particles(0, 0, 'particle_thrust', {
      speedY: { min: 70, max: 150 },
      speedX: { min: -10, max: 10 },
      scale: { start: 1.3, end: 0.1 },
      alpha: { start: 0.95, end: 0 },
      lifespan: 190,
      frequency: 25,
      emitting: false
    }).setDepth(9);
  }

  get depthMeters() {
    return Math.max(0, Math.floor(this.gy));
  }

  get rankTitle() {
    const idx = Math.min(RANK_NAMES.length - 1, Math.max(0, this.level - 1));
    return `LVL ${this.level}: ${RANK_NAMES[idx]}`;
  }

  get isCargoFull() {
    return this.cargo.length >= this.maxCargo;
  }

  get cargoCount() {
    return this.cargo.length;
  }

  upgradeSensor(newTier, newRadius) {
    this.sensorTier = newTier;
    this.sensorRadius = newRadius;
    this.drawScanner();
  }

  upgradeEngine(tier) {
    this.engineTier = tier;
    // Bewegung: Stufe 1 (180ms) bis Stufe 8 (78ms)
    // Fluggeschwindigkeit: Stufe 1 (120 px/s) bis Stufe 8 (340 px/s)
    const moveDurations = [180, 160, 142, 126, 112, 100, 88, 78];
    const flightSpeeds = [120, 138, 160, 185, 215, 250, 290, 340];
    this.moveDuration = moveDurations[tier - 1] || 180;
    this.flightSpeed = flightSpeeds[tier - 1] || 120;
  }

  drawScanner() {
    if (this.scannerGraphics) {
      this.scannerGraphics.clear();
    }
  }

  update(delta, inputDir) {
    this.lastInputDir = inputDir;

    // Scheinwerfer und Scanner synchronisieren
    this.headlight.setPosition(this.sprite.x, this.sprite.y);
    this.drawScanner();

    // SICHERHEIT: Düsenstrahlen sofort stoppen, wenn nicht geflogen wird!
    if (this.state !== PLAYER_STATES.FLYING) {
      if (this.leftThrustParticles && this.leftThrustParticles.emitting) {
        this.leftThrustParticles.stop();
      }
      if (this.rightThrustParticles && this.rightThrustParticles.emitting) {
        this.rightThrustParticles.stop();
      }
    }

    // Prüfen ob Spieler an der Oberfläche ist und auftankt
    this.checkDocking(delta);

    // Wenn gerade im Move-Tween: keine neuen Eingaben
    if (this.state === PLAYER_STATES.MOVING) {
      return;
    }

    // Wenn gerade kontinuierlich flüssig nach oben geflogen wird
    if (this.state === PLAYER_STATES.FLYING) {
      this.processFlying(delta, inputDir);
      return;
    }

    // Wenn gerade gebohrt wird
    if (this.state === PLAYER_STATES.DRILLING) {
      if (!this.drillTarget) {
        this.cancelDrilling();
      } else {
        // Wenn der Spieler eine ANDERE Richtung eingibt/tippt:
        // Aktuelles Bohren sofort abbrechen und in die neue Richtung steuern/bohren!
        if (inputDir) {
          const dx = this.drillTarget.gx - this.gx;
          const dy = this.drillTarget.gy - this.gy;
          let currentDrillDir = null;
          if (dy > 0) currentDrillDir = 'DOWN';
          else if (dy < 0) currentDrillDir = 'UP';
          else if (dx > 0) currentDrillDir = 'RIGHT';
          else if (dx < 0) currentDrillDir = 'LEFT';

          if (currentDrillDir && inputDir !== currentDrillDir) {
            this.cancelDrilling();
            this.handleInput(inputDir);
            return;
          }
        }

        // Wenn keine neue Richtung angegeben wird (z. B. losgelassen):
        // Ungestört weiterbohren, bis der Block zerstört ist!
        this.processDrilling(delta);
        return;
      }
    }

    // Eingaben verarbeiten
    if (inputDir) {
      this.handleInput(inputDir);
    }
  }

  getBatteryData() {
    const tier = Math.max(1, Math.min(BATTERY_TIERS.length, this.batteryTier || 1));
    return BATTERY_TIERS[tier - 1];
  }

  getChargeSpeed() {
    return this.getBatteryData().chargeSpeed;
  }

  checkDocking(delta) {
    // Sobald sich der Spieler an der Oberfläche befindet (gy <= -1)
    const isAtSurface = (this.gy <= -1);
    const isNearHangar = isAtSurface && (this.gx >= 13 && this.gx <= 17);

    if (isAtSurface) {
      if (!this.isDocked) {
        this.isDocked = true;
      }

      // Rumpfreparatur an der Basis nahe dem Hangar
      if (isNearHangar && this.hull < this.maxHull) {
        this.hull = Math.min(this.maxHull, this.hull + (delta / 1000) * 8);
      }

      // Betankung über Kabel an der Hangar-Tanksäule mit wählbarem Akkutyp (ganz langsam bei Stufe 1)
      const chargeSpeed = this.getChargeSpeed();
      const isActivelyRefueling = isNearHangar && (this.fuel < this.maxFuel);
      if (isActivelyRefueling) {
        this.fuel = Math.min(this.maxFuel, this.fuel + (delta / 1000) * chargeSpeed);
      }

      // Realistisches, durchhängendes Betankungskabel vom Hangar
      if (isNearHangar && this.refuelBeam) {
        this.refuelBeam.clear();

        // Hangar Tanksäule (liegt links an der Hangar-Bucht bei x=444, y=-26)
        const pumpX = 15 * TILE_SIZE - 36;
        const pumpY = -26;

        // Fahrzeug-Tankanschluss
        const portX = this.sprite.x + (this.sprite.x >= pumpX ? -12 : 12);
        const portY = this.sprite.y - 4;

        // Natürlicher Schwerkraft-Durchhang nach unten
        const dist = Math.hypot(portX - pumpX, portY - pumpY);
        const sag = Math.min(22, 6 + dist * 0.18);
        const cp1X = pumpX + (portX > pumpX ? 12 : -12);
        const cp1Y = Math.max(pumpY, portY) + sag;
        const cp2X = portX - (portX > pumpX ? 12 : -12);
        const cp2Y = Math.max(pumpY, portY) + sag;

        // 1. Äußere dicke Gummi-Kabelhülle (dunkles Industrie-Kabel, 3.5px)
        this.refuelBeam.lineStyle(3.5, 0x090d16, 0.95);
        this.refuelBeam.beginPath();
        this.refuelBeam.moveTo(pumpX, pumpY);
        for (let t = 0.05; t <= 1.0; t += 0.05) {
          const u = 1 - t;
          const qx = u*u*u*pumpX + 3*u*u*t*cp1X + 3*u*t*t*cp2X + t*t*t*portX;
          const qy = u*u*u*pumpY + 3*u*u*t*cp1Y + 3*u*t*t*cp2Y + t*t*t*portY;
          this.refuelBeam.lineTo(qx, qy);
        }
        this.refuelBeam.strokePath();

        // 2. Innere Kraftstoffader (bernstein beim Tanken, cyan wenn 100% voll)
        const hoseColor = isActivelyRefueling ? 0xf59e0b : 0x0284c7;
        this.refuelBeam.lineStyle(1.8, hoseColor, 0.95);
        this.refuelBeam.beginPath();
        this.refuelBeam.moveTo(pumpX, pumpY);
        for (let t = 0.05; t <= 1.0; t += 0.05) {
          const u = 1 - t;
          const qx = u*u*u*pumpX + 3*u*u*t*cp1X + 3*u*t*t*cp2X + t*t*t*portX;
          const qy = u*u*u*pumpY + 3*u*u*t*cp1Y + 3*u*t*t*cp2Y + t*t*t*portY;
          this.refuelBeam.lineTo(qx, qy);
        }
        this.refuelBeam.strokePath();

        // 3. Robuste Metall-Kupplungen & Status-LED
        this.refuelBeam.fillStyle(0x475569, 1);
        this.refuelBeam.fillRect(pumpX - 2, pumpY - 3, 4, 6);

        this.refuelBeam.fillStyle(0x334155, 1);
        this.refuelBeam.fillRect(portX - 2, portY - 2, 4, 4);

        // LED-Statusleuchte (Grün pulsierend beim Laden, Türkis wenn voll)
        const ledColor = isActivelyRefueling ? 0x10b981 : 0x38bdf8;
        this.refuelBeam.fillStyle(ledColor, 1);
        this.refuelBeam.fillCircle(portX, portY, 2);
      } else if (this.refuelBeam) {
        this.refuelBeam.clear();
      }
    } else {
      if (this.isDocked) {
        this.isDocked = false;
      }
      if (this.refuelBeam) {
        this.refuelBeam.clear();
      }
    }
  }

  handleInput(dir) {
    if (this.fuel <= 0) {
      return; // Kein Treibstoff
    }

    let targetGx = this.gx;
    let targetGy = this.gy;

    // Richtungs-Textur & Bohrkopf anpassen
    if (dir === 'LEFT') {
      targetGx--;
      this.setVisualDirection('LEFT');
    } else if (dir === 'RIGHT') {
      targetGx++;
      this.setVisualDirection('RIGHT');
    } else if (dir === 'DOWN') {
      targetGy++;
      this.setVisualDirection('DOWN');
    } else if (dir === 'UP') {
      // Wenn das Fahrzeug bereits an der Oberfläche ist (gy <= -1 oder y <= -16),
      // kann es nicht in die Luft / den Himmel fliegen!
      if (this.sprite.y <= -16 || this.gy <= -1) {
        return;
      }

      // Prüfen ob die Kachel direkt über dem Bohrer feste Erde / Erz ist
      const checkGy = Math.floor((this.sprite.y - TILE_SIZE / 2 - 2) / TILE_SIZE);
      if (checkGy >= 0 && this.gridSystem.isSolid(this.gx, checkGy)) {
        // NACH OBEN BOHREN!
        const tile = this.gridSystem.getTile(this.gx, checkGy);
        if (!tile || tile.indestructible || checkGy === 0) return;

        this.setVisualDirection('UP');
        this.startDrilling(this.gx, checkGy);
        return;
      }

      // Wenn frei: Flüssigen Flug starten (behält bei Bedarf horizontale Blickrichtung bei)
      this.state = PLAYER_STATES.FLYING;
      this.flySoundTimer = 0;
      soundFx.startJetpack();
      return;
    }

    // Prüfen ob Zielfeld solid ist (für LINKS, RECHTS, UNTEN)
    const isTargetSolid = this.gridSystem.isSolid(targetGx, targetGy);

    if (!isTargetSolid) {
      // Freies Feld: normale Fahrt
      this.moveTo(targetGx, targetGy, 130);
      this.consumeFuel(0.3);
      soundFx.startDrive();
    } else {
      // Festes Feld: Bohren
      const tile = this.gridSystem.getTile(targetGx, targetGy);
      if (!tile || tile.indestructible || targetGy === 0) {
        if (targetGy === 0) {
          this.scene.events.emit('notify', 'Oberfläche unzerstörbar! Nutze den überdachten Schachteinstieg.');
        }
        return;
      }

      this.startDrilling(targetGx, targetGy);
    }
  }

  processFlying(delta, inputDir) {
    // Wenn kein Treibstoff mehr vorhanden ist oder Richtung nicht mehr UP ist
    if (this.fuel <= 0 || inputDir !== 'UP') {
      this.stopFlying();
      return;
    }

    const dt = delta / 1000;

    // Sanfter, gleichmäßiger Treibstoffverbrauch im Flug
    this.consumeFuel(dt * 1.8);

    // Zwei sichtbare blaue Jetpack-Strahlen (unter dem Fahrgestell bei den Unterflurdüsen)
    const n1X = this.sprite.x - 7;
    const n1Y = this.sprite.y + 15;
    const n2X = this.sprite.x + 7;
    const n2Y = this.sprite.y + 15;

    this.leftThrustParticles.setPosition(n1X, n1Y);
    this.rightThrustParticles.setPosition(n2X, n2Y);

    if (!this.leftThrustParticles.emitting) {
      this.leftThrustParticles.start();
      this.rightThrustParticles.start();
    }

    // Dezent taktender Jetpack-Sound (nur sicherstellen, dass er läuft)
    if (!soundFx._jetpackRunning) {
      soundFx.startJetpack();
    }

    // Flüssiger Aufstieg mit kontinuierlicher Geschwindigkeit (am Anfang 120 px/s, upgradebar)
    const flightSpeed = this.flightSpeed || 120;
    const dy = flightSpeed * dt;
    const nextY = this.sprite.y - dy;

    // Kollisionsprüfung mit der Decke über dem Fahrzeug
    const headY = nextY - TILE_SIZE / 2;
    const checkGy = Math.floor(headY / TILE_SIZE);

    if (checkGy >= 0 && this.gridSystem.isSolid(this.gx, checkGy)) {
      // Decke berührt: Sanft direkt unter der festen Kachel stoppen
      const clampedY = (checkGy + 1) * TILE_SIZE + TILE_SIZE / 2;
      this.sprite.y = clampedY;
      this.y = clampedY;
      this.gy = Math.round((this.y - TILE_SIZE / 2) / TILE_SIZE);
      this.stopFlying();
      return;
    }

    // Erreichen der Erdoberfläche (Boden-Niveau gy = -1, y = -16)
    if (nextY <= -16) {
      this.sprite.y = -16;
      this.y = -16;
      this.gy = -1;
      this.stopFlying();
      this.checkDepthProgress();
      return;
    }

    // Kontinuierliche Positionsänderung bei 60 FPS
    this.sprite.y = nextY;
    this.y = nextY;
    this.gy = (this.y - TILE_SIZE / 2) / TILE_SIZE;
    this.checkDepthProgress();
  }

  stopFlying() {
    this.flySoundTimer = 0;
    soundFx.stopJetpack();
    if (this.leftThrustParticles) {
      this.leftThrustParticles.stop();
    }
    if (this.rightThrustParticles) {
      this.rightThrustParticles.stop();
    }

    // Beim Loslassen sanft auf die nächste Kachelhöhe einrasten (50ms)
    const targetGy = Math.max(-1, Math.round((this.sprite.y - TILE_SIZE / 2) / TILE_SIZE));
    const targetY = targetGy * TILE_SIZE + TILE_SIZE / 2;

    this.state = PLAYER_STATES.MOVING;
    this.scene.tweens.add({
      targets: this.sprite,
      y: targetY,
      duration: 50,
      ease: 'Linear',
      onComplete: () => {
        this.y = targetY;
        this.gy = targetGy;
        this.state = PLAYER_STATES.IDLE;
        this.checkDepthProgress();
      }
    });
  }

  setVisualDirection(dir) {
    this.currentDirection = dir;
    this.sprite.setAngle(0);
    this.sprite.setFlipX(false);

    const dirLower = dir.toLowerCase();
    this.sprite.setTexture(`player_drill_${dirLower}`);
  }

  moveTo(targetGx, targetGy, duration = null) {
    this.state = PLAYER_STATES.MOVING;
    this.gx = targetGx;
    this.gy = targetGy;

    const targetX = targetGx * TILE_SIZE + TILE_SIZE / 2;
    const targetY = targetGy * TILE_SIZE + TILE_SIZE / 2;
    const moveDur = duration !== null ? duration : (this.moveDuration || 180);

    this.scene.tweens.add({
      targets: this.sprite,
      x: targetX,
      y: targetY,
      duration: moveDur,
      ease: 'Linear',
      onComplete: () => {
        this.x = targetX;
        this.y = targetY;
        this.state = PLAYER_STATES.IDLE;
        soundFx.stopDrive();
        this.checkDepthProgress();

        // Flüssiges Weiterfahren ohne Ruckeln / Pausen zwischen den Kacheln
        if (this.lastInputDir && this.fuel > 0) {
          this.handleInput(this.lastInputDir);
        }
      }
    });
  }

  getDrillBitPosition(targetGx, targetGy) {
    const dx = targetGx - this.gx;
    const dy = targetGy - this.gy;
    let drillX = this.sprite.x;
    let drillY = this.sprite.y;

    if (dy > 0) {
      // Bohren nach unten: Bohrkopf an Unterkante des Bohrers (bündig mit Ketten bei y=31)
      drillX = this.sprite.x;
      drillY = this.sprite.y + 15;
    } else if (dy < 0) {
      // Bohren nach oben: Bohrkopf an Oberkante (y=0)
      drillX = this.sprite.x;
      drillY = this.sprite.y - 16;
    } else if (dx > 0) {
      // Bohren nach rechts: Bohrkopf an rechter Spitze (x=48, y=15.5)
      drillX = this.sprite.x + 24;
      drillY = this.sprite.y - 0.5;
    } else if (dx < 0) {
      // Bohren nach links: Bohrkopf an linker Spitze (x=0, y=15.5)
      drillX = this.sprite.x - 24;
      drillY = this.sprite.y - 0.5;
    }
    return { x: drillX, y: drillY };
  }

  startDrilling(targetGx, targetGy) {
    if (targetGy === 0) return;
    if (this.hull <= 0) return; // Karosserie beschädigt - Bohrer blockiert
    const tile = this.gridSystem.getTile(targetGx, targetGy);
    if (!tile || tile.indestructible) return;
    // Sicherheit: nicht bohren wenn der Block schon leer ist (bereits abgebaut)!
    if (!this.gridSystem.isSolid(targetGx, targetGy)) return;

    this.state = PLAYER_STATES.DRILLING;
    this.drillTarget = { gx: targetGx, gy: targetGy };

    const bit = this.getDrillBitPosition(targetGx, targetGy);
    this.drillParticles.setPosition(bit.x, bit.y);
    this.drillParticles.start();
    soundFx.startDrilling();

    // Richtung passend zum Zielblock setzen
    const dx = targetGx - this.gx;
    const dy = targetGy - this.gy;
    if (dy > 0) this.setVisualDirection('DOWN');
    else if (dy < 0) this.setVisualDirection('UP');
    else if (dx > 0) this.setVisualDirection('RIGHT');
    else if (dx < 0) this.setVisualDirection('LEFT');
  }

  processDrilling(delta) {
    if (!this.drillTarget) {
      this.cancelDrilling();
      return;
    }

    if (this.fuel <= 0 || this.hull <= 0) {
      this.cancelDrilling();
      return;
    }

    this.consumeFuel(0.6 * (delta / 1000));

    // Karosserie-Verschleiß beim Bohren (nur beim Bohren, nicht beim Fahren)
    const hullWearPerSec = 1.5;
    this.hull = Math.max(0, this.hull - hullWearPerSec * (delta / 1000));
    if (this.hull <= 0) {
      this.cancelDrilling();
      return;
    }

    // Animierte Bohrkopf-Drehung (Spiral-Wendeln wechseln flüssig alle 28ms über 6 Frames)
    this.drillAnimTimer = (this.drillAnimTimer || 0) + delta;
    if (this.drillAnimTimer >= 28) {
      this.drillAnimTimer = 0;
      this.drillFrame = ((this.drillFrame || 0) + 1) % 6;
      const dirLower = (this.currentDirection || 'RIGHT').toLowerCase();
      this.sprite.setTexture(`player_drill_${dirLower}_${this.drillFrame}`);
    }

    // Welt bleibt komplett ruhig beim Bohren (kein Wackeln/Camera-Shake)
    this.sprite.x = this.x;
    this.sprite.y = this.y;

    if (this.drillTarget) {
      const bit = this.getDrillBitPosition(this.drillTarget.gx, this.drillTarget.gy);
      this.drillParticles.setPosition(bit.x, bit.y);
    }

    // Geräusch: kontinuierlicher Schleifer (startDrilling kümmert sich darum)
    // Kein per-frame playDrillTick() nötig

    const damage = this.drillPower * (delta / 1000);
    const result = this.gridSystem.damageTile(this.drillTarget.gx, this.drillTarget.gy, damage);

    if (!result) {
      this.cancelDrilling();
      return;
    }

    if (result.destroyed) {
      this.drillParticles.stop();
      soundFx.stopDrilling();
      const dirLower = (this.currentDirection || 'RIGHT').toLowerCase();
      this.sprite.setTexture(`player_drill_${dirLower}`);
      this.sprite.x = this.x;
      this.sprite.y = this.y;

      soundFx.playTileDestroy();

      // Statistik: Kachel abgebaut
      this.stats.totalTilesMined = (this.stats.totalTilesMined || 0) + 1;

      // Geringe XP für einfachen Kachelabbau
      this.addXp(1);

      if (result.ore) {
        this.collectOre(result.ore);
      }

      const nextGx = this.drillTarget.gx;
      const nextGy = this.drillTarget.gy;
      this.drillTarget = null;
      this.moveTo(nextGx, nextGy, Math.max(70, Math.round(this.moveDuration * 0.75)));
    }
  }

  cancelDrilling() {
    this.state = PLAYER_STATES.IDLE;
    this.drillTarget = null;
    this.drillParticles.stop();
    soundFx.stopDrilling();
    const dirLower = (this.currentDirection || 'RIGHT').toLowerCase();
    this.sprite.setTexture(`player_drill_${dirLower}`);
    this.sprite.x = this.x;
    this.sprite.y = this.y;
  }

  collectOre(oreType) {
    if (this.cargo.length >= this.maxCargo) {
      this.scene.events.emit('notify', 'Laderaum voll! Kann Erz nicht aufnehmen.');
      soundFx.playError();
      return;
    }

    this.cargo.push(oreType);
    this.stats.totalOresMined[oreType] = (this.stats.totalOresMined[oreType] || 0) + 1;

    const data = ORE_DATA[oreType];
    const xpGain = data ? Math.max(3, Math.round(data.value * 0.15)) : 5;
    this.addXp(xpGain);

    soundFx.playGemCollect();

    // Entdeckungs-Event beim allerersten Fund
    if (this.discoveredOres && !this.discoveredOres.has(oreType)) {
      this.discoveredOres.add(oreType);
      this.scene.events.emit('ore_discovered', oreType);
    }
  }

  checkDepthProgress() {
    const depthMeters = Math.max(0, Math.round((this.y / TILE_SIZE) * 2));
    if (depthMeters > this.highestDepthReached) {
      this.highestDepthReached = depthMeters;
    }
  }

  addXp(amount) {
    this.xp += amount;
    while (this.xp >= this.xpNeeded && this.level < 5) {
      this.xp -= this.xpNeeded;
      this.level++;
      this.xpNeeded = Math.round(this.xpNeeded * 1.6);
      soundFx.playPurchase();
      this.scene.events.emit('notify', `LEVEL AUFSTIEG: Du bist jetzt ${this.rankTitle}!`);
      this.scene.events.emit('level_up', this.level);
    }
  }

  refuel() {
    this.fuel = this.maxFuel;
  }

  consumeFuel(amount) {
    const actualAmount = amount / this.fuelEfficiency;
    this.fuel = Math.max(0, this.fuel - actualAmount);
    return this.fuel > 0;
  }

  getReturnFuelCost() {
    const efficiency = Math.max(0.1, this.fuelEfficiency || 1.0);
    const entranceGx = 19.5;
    const atSurface = this.gy <= -1 || (this.sprite && this.sprite.y <= -16);

    if (atSurface) {
      // Überirdisch: nur horizontaler Rückweg zur Einfahrt (gx ~19.5)
      const tilesX = Math.abs(this.gx - entranceGx);
      if (tilesX < 1) return 0; // Schon nah genug an der Basis
      return (tilesX * (0.3 / efficiency)) * 1.10;
    }

    // Unterirdisch: Steigflug + horizontaler Weg
    const currentY = this.sprite ? this.sprite.y : (this.gy * TILE_SIZE + TILE_SIZE / 2);
    const distY = Math.max(0, currentY - (-16));
    const flightSpeed = Math.max(1, this.flightSpeed || 120);

    const flightTimeSec = distY / flightSpeed;
    const verticalFuel = flightTimeSec * (1.8 / efficiency);

    const tilesX = Math.abs(this.gx - entranceGx);
    const horizontalFuel = tilesX * (0.3 / efficiency);

    return (verticalFuel + horizontalFuel) * 1.10;
  }

  getReturnFuelPercent() {
    const cost = this.getReturnFuelCost();
    const max = Math.max(1, this.maxFuel || 100);
    return Math.min(100, Math.max(0, (cost / max) * 100));
  }

  takeDamage(amount) {
    this.hull = Math.max(0, this.hull - amount);
    soundFx.playDamage();
  }

  repairHull() {
    this.hull = this.maxHull;
  }

  refuelTank() {
    this.fuel = this.maxFuel;
  }

  sellCargo() {
    let total = 0;
    for (const ore of this.cargo) {
      if (ORE_DATA[ore]) {
        total += ORE_DATA[ore].value;
      }
    }
    this.cash += total;
    this.stats.totalCashEarned = (this.stats.totalCashEarned || 0) + total;
    this.cargo = [];
    return total;
  }

  sellSpecificOre(oreType, amount = 1) {
    let count = 0;
    const remaining = [];
    for (const ore of this.cargo) {
      if (ore === oreType && count < amount) {
        count++;
      } else {
        remaining.push(ore);
      }
    }
    this.cargo = remaining;
    const val = ORE_DATA[oreType] ? ORE_DATA[oreType].value : 0;
    const totalEarned = count * val;
    this.cash += totalEarned;
    this.stats.totalCashEarned = (this.stats.totalCashEarned || 0) + totalEarned;
    return { count, totalEarned };
  }

  consumeOre(oreType, amount = 1) {
    let count = 0;
    const remaining = [];
    for (const ore of this.cargo) {
      if (ore === oreType && count < amount) {
        count++;
      } else {
        remaining.push(ore);
      }
    }
    this.cargo = remaining;
    return count;
  }

  sellFactoryProduct(productId, amount = 1, unitValue = 0) {
    if (!this.factoryProducts) this.factoryProducts = {};
    const available = this.factoryProducts[productId] || 0;
    const count = Math.max(0, Math.min(available, amount));
    if (count <= 0) return 0;
    this.factoryProducts[productId] -= count;
    const val = unitValue > 0 ? unitValue : (FACTORY_PRODUCTS[productId]?.value || 0);
    const totalEarned = count * val;
    this.cash += totalEarned;
    this.stats.totalCashEarned = (this.stats.totalCashEarned || 0) + totalEarned;
    return totalEarned;
  }

  hasFactoryProducts() {
    if (!this.factoryProducts) return false;
    return Object.values(this.factoryProducts).some(v => v > 0);
  }

  hasComponents(reqs = {}) {
    for (const [key, amt] of Object.entries(reqs)) {
      if ((this.components[key] || 0) < amt) return false;
    }
    return true;
  }

  consumeComponents(reqs = {}) {
    for (const [key, amt] of Object.entries(reqs)) {
      this.components[key] = Math.max(0, (this.components[key] || 0) - amt);
    }
  }

  addComponent(key, amt = 1) {
    this.components[key] = (this.components[key] || 0) + amt;
  }

  teleportToSurface() {
    let fee = 0;
    let message = '';
    if (this.freeRescues > 0) {
      this.freeRescues--;
      const rest = this.freeRescues;
      message = `Rettung zur Basis erfolgreich! (Noch ${rest} kostenlose Rettung${rest === 1 ? '' : 'en'})`;
    } else {
      fee = Math.min(this.cash, 150);
      this.cash -= fee;
      message = `Rettung zur Basis erfolgreich! (-€${fee} Bergungsgebühr)`;
    }

    // 1. Alle laufenden Tweens auf dem Sprite abbrechen
    if (this.scene && this.scene.tweens) {
      this.scene.tweens.killTweensOf(this.sprite);
    }

    // 2. Partikel und Sounds stoppen
    this.flySoundTimer = 0;
    soundFx.stopJetpack();
    soundFx.stopDrilling();
    soundFx.stopDrive();
    if (this.leftThrustParticles) this.leftThrustParticles.stop();
    if (this.rightThrustParticles) this.rightThrustParticles.stop();
    if (this.drillParticles) this.drillParticles.stop();
    this.cancelDrilling();

    // 3. Exakte Basis-Koordinaten an der Oberfläche (gx: 15, gy: -1)
    this.gx = 15;
    this.gy = -1;
    this.x = this.gx * TILE_SIZE + TILE_SIZE / 2;
    this.y = this.gy * TILE_SIZE + TILE_SIZE / 2;

    this.sprite.setPosition(this.x, this.y);
    this.setVisualDirection('RIGHT');
    this.state = PLAYER_STATES.IDLE;

    // 4. Notfall-Auftankung bei komplett leerem Tank
    if (this.fuel < 20) {
      this.fuel = 20;
    }

    // 5. Kamera und Viewport sofort an die Basis binden
    if (this.scene && this.scene.cameras && this.scene.cameras.main) {
      const cam = this.scene.cameras.main;
      cam.centerOn(this.x, this.y);
      if (this.gridSystem) {
        this.gridSystem.updateViewport(cam, this);
      }
    }

    soundFx.playJetpack();
    if (this.scene && this.scene.events) {
      this.scene.events.emit('notify', message);
    }
  }
}
