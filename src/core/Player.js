/**
 * Player.js
 * Verwaltet das Bergbau-Fahrzeug mit dynamischer Ausrichtung (Bohrkopf in Fahrtrichtung),
 * Fahren nach oben, automatischem Auftanken in der Basis, XP- & Level-System.
 */

import Phaser from 'phaser';
import { TILE_SIZE, ORE_DATA } from './GridSystem.js';
import { soundFx } from './SoundEffects.js';
import { FACTORY_PRODUCTS, getRefinedOreNetValue } from './BaseSystem.js';

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

export const TANK_TIERS = [
  { tier: 1, name: 'Standard-Tank', maxFuel: 100, stat: '100 L', cost: 0, comp: null, level: 1, desc: 'Basis-Treibstofftank für kurze Bohrgänge.' },
  { tier: 2, name: 'Kerosin-Tank Mk.II', maxFuel: 135, stat: '135 L', cost: 180, comp: null, level: 1, desc: 'Erhöht Treibstoff auf 135 Liter und senkt Verbrauch um 12%.' },
  { tier: 3, name: 'Spartriebwerk Mk.III', maxFuel: 180, stat: '180 L', cost: 420, comp: null, level: 1, desc: 'Erhöht Treibstoff auf 180 Liter und spart 20% Kerosin.' },
  { tier: 4, name: 'Dual-Injektor Mk.IV', maxFuel: 240, stat: '240 L', cost: 950, comp: { key: 'hydraulic_part', name: 'Hydraulik-Zylinder', count: 1 }, level: 2, desc: 'Verbessert Steigflug-Effizienz mit Hochdruck-Injektoren.' },
  { tier: 5, name: 'Kompressions-Tank Mk.V', maxFuel: 320, stat: '320 L', cost: 2000, comp: { key: 'titan_alloy', name: 'Titan-Legierung', count: 1 }, level: 2, desc: 'Hochfeste Legierung erlaubt 320 Liter Treibstoffkapazität.' },
  { tier: 6, name: 'Turbo-Booster Mk.VI', maxFuel: 420, stat: '420 L', cost: 4200, comp: { key: 'titan_alloy', name: 'Titan-Legierung', count: 2 }, level: 3, desc: 'Großer 420L Tank für tiefe Expeditionen.' },
  { tier: 7, name: 'Fusions-Generator Mk.VII', maxFuel: 540, stat: '540 L', cost: 8800, comp: { key: 'laser_lens', name: 'Kristall-Fokuslinse', count: 2 }, level: 4, desc: 'Hocheffizienter Fusions-Antrieb mit 540 Litern Kapazität.' },
  { tier: 8, name: 'Quanten-Ionen-Antrieb', maxFuel: 700, stat: '700 L', cost: 17500, comp: { key: 'quantum_chip', name: 'Quanten-Steuerkern', count: 2 }, level: 5, desc: 'Ultimativer 700L Quantenantrieb mit extrem sparsamen Düsen.' }
];

export const HULL_TIERS = [
  {
    tier: 1,
    name: 'Leichtmetall-Gehäuse',
    shortName: 'Leichtmetall',
    maxHull: 100,
    stat: '100 HP',
    cost: 0,
    comp: null,
    level: 1,
    desc: 'Basis-Gehäuse für normale Bohrungen in oberflächennahem Erdreich.'
  },
  {
    tier: 2,
    name: 'Kevlar-Verbundschutz Mk.II',
    shortName: 'Kevlar Mk.II',
    maxHull: 140,
    stat: '140 HP',
    cost: 140,
    comp: null,
    level: 1,
    desc: 'Verstärkte Verbundstruktur gegen Stoß- und Reibungsverschleiß beim Bohren.'
  },
  {
    tier: 3,
    name: 'Gehärtetes Stahl-Chassis Mk.III',
    shortName: 'Stahl Mk.III',
    maxHull: 190,
    stat: '190 HP',
    cost: 330,
    comp: null,
    level: 1,
    desc: 'Widerstandsfähiger Gehäuseschutz für tiefere Schiefer- und Granitschichten.'
  },
  {
    tier: 4,
    name: 'Titan-Panzergehäuse Mk.IV',
    shortName: 'Titan Mk.IV',
    maxHull: 260,
    stat: '260 HP',
    cost: 790,
    comp: { key: 'titan_alloy', name: 'Titan-Legierung', count: 1 },
    level: 2,
    desc: 'Widersteht hohem Gesteinsdruck und Reibungshitze.'
  },
  {
    tier: 5,
    name: 'Magma-Hitzeschild Mk.V',
    shortName: 'Hitzeschild Mk.V',
    maxHull: 350,
    stat: '350 HP',
    cost: 1700,
    comp: { key: 'titan_alloy', name: 'Titan-Legierung', count: 2 },
    level: 2,
    desc: 'Schützt das Gehäuse vor extremen Tiefentemperaturen und Erschütterungen.'
  },
  {
    tier: 6,
    name: 'Schwere Verbundpanzerung Mk.VI',
    shortName: 'Verbund Mk.VI',
    maxHull: 470,
    stat: '470 HP',
    cost: 3400,
    comp: { key: 'laser_lens', name: 'Kristall-Fokuslinse', count: 1 },
    level: 3,
    desc: 'Extrem schlagfester Case-Schutz für härtestes Basaltgestein.'
  },
  {
    tier: 7,
    name: 'Kraftfeld-Deflektor Mk.VII',
    shortName: 'Deflektor Mk.VII',
    maxHull: 620,
    stat: '620 HP',
    cost: 7300,
    comp: { key: 'quantum_chip', name: 'Quanten-Steuerkern', count: 1 },
    level: 4,
    desc: 'Aktives Energieschild fängt Reibungsenergie ab und stärkt das Gehäuse.'
  },
  {
    tier: 8,
    name: 'Nanit-Matrix-Chassis Mk.VIII',
    shortName: 'Nanit Mk.VIII',
    maxHull: 800,
    stat: '800 HP',
    cost: 15500,
    comp: { key: 'quantum_chip', name: 'Quanten-Steuerkern', count: 2 },
    level: 5,
    desc: 'Selbstreparierendes Naniten-Gehäuse für maximale Tiefen-Integrität.'
  }
];

export const ENGINE_TIERS = [
  { tier: 1, name: 'Standard-Raupenfahrwerk', stat: '120 px/s', moveDuration: 260, flightSpeed: 120, cost: 0, comp: null, level: 1, desc: 'Sicheres Basis-Fahrwerk für solide Schachtmanöver.' },
  { tier: 2, name: 'Verstärkte Getriebe Mk.II', stat: '138 px/s', moveDuration: 225, flightSpeed: 138, cost: 190, comp: null, level: 1, desc: 'Kürzere Schaltzeiten beschleunigen Kriechgang und Steigflug.' },
  { tier: 3, name: 'Hydraulik-Raupen Mk.III', stat: '160 px/s', moveDuration: 195, flightSpeed: 160, cost: 440, comp: null, level: 1, desc: 'Flüssigere Kettenbewegungen und mehr Schubdüsengeschwindigkeit.' },
  { tier: 4, name: 'Hochdruck-Turbine Mk.IV', stat: '185 px/s', moveDuration: 170, flightSpeed: 185, cost: 980, comp: { key: 'hydraulic_part', name: 'Hydraulik-Zylinder', count: 1 }, level: 2, desc: 'Kraftvoller Vortrieb im Schacht und schnellerer Aufstieg.' },
  { tier: 5, name: 'Titan-Kettenantrieb Mk.V', stat: '215 px/s', moveDuration: 145, flightSpeed: 215, cost: 2100, comp: { key: 'titan_alloy', name: 'Titan-Legierung', count: 1 }, level: 2, desc: 'Geringerer Rollwiderstand und kräftige Schwebetriebwerke.' },
  { tier: 6, name: 'Vektor-Booster Mk.VI', stat: '250 px/s', moveDuration: 125, flightSpeed: 250, cost: 4300, comp: { key: 'titan_alloy', name: 'Titan-Legierung', count: 2 }, level: 3, desc: 'Schnelle Manövrierfähigkeit im Gestein und hoher Schwebespeed.' },
  { tier: 7, name: 'Magnet-Levitation Mk.VII', stat: '290 px/s', moveDuration: 105, flightSpeed: 290, cost: 8900, comp: { key: 'laser_lens', name: 'Kristall-Fokuslinse', count: 2 }, level: 4, desc: 'Magnetschwebende Fahrwerkssegmente für rasantes Gleiten.' },
  { tier: 8, name: 'Quanten-Gravitationsantrieb', stat: '340 px/s', moveDuration: 90, flightSpeed: 340, cost: 18000, comp: { key: 'quantum_chip', name: 'Quanten-Steuerkern', count: 2 }, level: 5, desc: 'Krümmt das Schwerefeld für blitzschnelle Fortbewegung.' }
];

export const CARGO_TIERS = [
  { tier: 1, name: 'Standard-Ladebucht', maxCargo: 10, stat: '10 Plätze', cost: 0, comp: null, level: 1, desc: 'Kompakter Laderaum für die ersten Bergbau-Expeditionen.' },
  { tier: 2, name: 'Erweiterte Frachtbucht', maxCargo: 14, stat: '14 Plätze', cost: 170, comp: null, level: 1, desc: 'Erweitert Ladeplätze auf 14 Erze für lukrativere Tauchgänge.' },
  { tier: 3, name: 'Titan-Containermodul Mk.III', maxCargo: 20, stat: '20 Plätze', cost: 400, comp: null, level: 1, desc: 'Großzügiger Frachtraum für 20 Erze.' },
  { tier: 4, name: 'Struktur-Laderaum Mk.IV', maxCargo: 28, stat: '28 Plätze', cost: 900, comp: { key: 'hydraulic_part', name: 'Hydraulik-Zylinder', count: 1 }, level: 2, desc: 'Hydraulische Ladeklappen bieten Platz für 28 Erze.' },
  { tier: 5, name: 'Molekular-Kompressor Mk.V', maxCargo: 38, stat: '38 Plätze', cost: 1900, comp: { key: 'titan_alloy', name: 'Titan-Legierung', count: 1 }, level: 2, desc: 'Hohe Packdichte erlaubt den Transport von 38 Erzen.' },
  { tier: 6, name: 'Subraum-Boxen Mk.VI', maxCargo: 50, stat: '50 Plätze', cost: 3900, comp: { key: 'titan_alloy', name: 'Titan-Legierung', count: 2 }, level: 3, desc: 'Transportiert bis zu 50 Erze auf einen Schlag.' },
  { tier: 7, name: 'Tiefsee-Depot Mk.VII', maxCargo: 65, stat: '65 Plätze', cost: 8200, comp: { key: 'laser_lens', name: 'Kristall-Fokuslinse', count: 2 }, level: 4, desc: 'Riesige Kapazität von 65 Plätzen für Edelsteine.' },
  { tier: 8, name: 'Quanten-Frachtdepot Mk.VIII', maxCargo: 80, stat: '80 Plätze', cost: 16500, comp: { key: 'quantum_chip', name: 'Quanten-Steuerkern', count: 2 }, level: 5, desc: 'Gigantischer 80-Plätze-Frachtraum für maximale Gewinne.' }
];

export const SENSOR_TIERS = [
  { tier: 1, name: 'Basis-Sonar', radius: 1.8, stat: '1.8 Kacheln', cost: 0, comp: null, level: 1, desc: 'Kompakter Sensor zur Erkennung naher Erzadern.' },
  { tier: 2, name: 'Geo-Scanner Mk.II', radius: 2.4, stat: '2.4 Kacheln', cost: 140, comp: null, level: 1, desc: 'Vergrößert den kreisrunden Scan-Umkreis spürbar.' },
  { tier: 3, name: 'Puls-Sonar Mk.III', radius: 3.0, stat: '3.0 Kacheln', cost: 340, comp: null, level: 1, desc: 'Erweitert den Erfassungsbereich auf 3.0 Kacheln.' },
  { tier: 4, name: 'Spektral-Radar Mk.IV', radius: 3.7, stat: '3.7 Kacheln', cost: 780, comp: { key: 'hydraulic_part', name: 'Hydraulik-Zylinder', count: 1 }, level: 2, desc: 'Schwenkbarer Pylon deckt Erze in 3.7 Kacheln Umkreis auf.' },
  { tier: 5, name: 'Tiefen-Sensor Mk.V', radius: 4.5, stat: '4.5 Kacheln', cost: 1650, comp: { key: 'laser_lens', name: 'Kristall-Fokuslinse', count: 1 }, level: 2, desc: 'Optische Linse durchdringt dicke Gesteinsschichten bis 4.5 Kacheln.' },
  { tier: 6, name: 'Sub-Terra-Scan Mk.VI', radius: 5.4, stat: '5.4 Kacheln', cost: 3400, comp: { key: 'laser_lens', name: 'Kristall-Fokuslinse', count: 2 }, level: 3, desc: 'Großer Scanradius von 5.4 Kacheln für seltene Adern.' },
  { tier: 7, name: 'Graviton-Array Mk.VII', radius: 6.4, stat: '6.4 Kacheln', cost: 7200, comp: { key: 'quantum_chip', name: 'Quanten-Steuerkern', count: 1 }, level: 4, desc: 'Erfasst 6.4 Kacheln im Umkreis auf einen Blick.' },
  { tier: 8, name: 'Quanten-Resonator Mk.VIII', radius: 7.5, stat: '7.5 Kacheln', cost: 15200, comp: { key: 'quantum_chip', name: 'Quanten-Steuerkern', count: 2 }, level: 5, desc: 'Elite-Scanbereich von 7.5 Kacheln erhellt riesige Höhlen.' }
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
    this.currentDirection = 'RIGHT';
    this.sprite = scene.add.image(this.x, this.y, 'player_drill_right')
      .setDepth(10)
      .setOrigin(0.5, 0.5)
      .setInteractive({
        hitArea: new Phaser.Geom.Rectangle(-12, -12, 72, 72),
        hitAreaCallback: Phaser.Geom.Rectangle.Contains,
        useHandCursor: true
      });

    // Klick oder Touch auf das Bohr-Fahrzeug öffnet das Driller-Menü (Fracht & Stats)
    let lastDrillerClickTime = 0;
    this.sprite.on('pointerdown', (pointer) => {
      if (pointer && pointer.event && pointer.event.stopPropagation) {
        pointer.event.stopPropagation();
      }
      const now = Date.now();
      if (now - lastDrillerClickTime < 300) return;
      lastDrillerClickTime = now;

      soundFx.playClick();
      this.scene.events.emit('open_driller_menu', 'cargo');
    });

    // Animierter Bohrkopf (6-stufige Archimedes-Spiral-Drehung)
    this.drillFrame = 0;
    this.drillAnimTimer = 0;

    // Set aller bisher entdeckten Erze (Kohle ist als Start-Brennstoff von Beginn an bekannt)
    this.discoveredOres = new Set(['coal']);

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
    this.moveDuration = 260; // 260ms pro Kachel (~3.8 Kacheln/s für ruhiges, kontrolliertes Fahren auf Stufe 1)
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

    // Ladekabel / Betankungsstrahl (mit eigenem Auslegerarm)
    this.refuelBeam = scene.add.graphics().setDepth(12);

    // Roboterarm für Chassis-Reparatur am Hangar
    this.repairArm = scene.add.graphics().setDepth(13);

    // Sanfte kinematische Roboterarme am Hangar (gleitende Bewegung statt Springen)
    this.repairArmState = {
      curTipX: 15 * TILE_SIZE + 32 - 8,
      curTipY: -30 + 20,
      curMidX: 15 * TILE_SIZE + 32 - 16,
      curMidY: -30 + 8,
      activeWeight: 0 // 0 = geparkt, 1 = voll am Fahrzeug
    };

    this.fuelArmState = {
      curTipX: 15 * TILE_SIZE - 36 + 6,
      curTipY: -28 + 20,
      curMidX: 15 * TILE_SIZE - 36 + 14,
      curMidY: -28 + 8,
      activeWeight: 0 // 0 = geparkt, 1 = voll am Fahrzeug
    };

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

    // Sanfte Schwebedüsen (wenn der Driller in der Luft schwebt, aber nicht hochfliegt)
    this.leftHoverParticles = scene.add.particles(0, 0, 'particle_thrust', {
      speedY: { min: 25, max: 55 },
      speedX: { min: -5, max: 5 },
      scale: { start: 0.65, end: 0.08 },
      alpha: { start: 0.75, end: 0 },
      lifespan: 110,
      frequency: 32,
      emitting: false
    }).setDepth(9);

    this.rightHoverParticles = scene.add.particles(0, 0, 'particle_thrust', {
      speedY: { min: 25, max: 55 },
      speedX: { min: -5, max: 5 },
      scale: { start: 0.65, end: 0.08 },
      alpha: { start: 0.75, end: 0 },
      lifespan: 110,
      frequency: 32,
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
    const tierData = SENSOR_TIERS[newTier - 1] || SENSOR_TIERS[0];
    this.sensorRadius = newRadius || tierData.radius || 1.8;
    this.drawScanner();
  }

  upgradeEngine(tier) {
    this.engineTier = tier;
    // Bewegung: Stufe 1 (260ms) bis Stufe 8 (90ms)
    // Fluggeschwindigkeit: Stufe 1 (120 px/s) bis Stufe 8 (340 px/s)
    const moveDurations = [260, 225, 195, 170, 145, 125, 105, 90];
    const flightSpeeds = [120, 138, 160, 185, 215, 250, 290, 340];
    this.moveDuration = moveDurations[tier - 1] || 260;
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

    // Position der Düsen am Unterflur-Fahrgestell
    const n1X = this.sprite.x - 7;
    const n1Y = this.sprite.y + 15;
    const n2X = this.sprite.x + 7;
    const n2Y = this.sprite.y + 15;

    if (this.leftThrustParticles) this.leftThrustParticles.setPosition(n1X, n1Y);
    if (this.rightThrustParticles) this.rightThrustParticles.setPosition(n2X, n2Y);
    if (this.leftHoverParticles) this.leftHoverParticles.setPosition(n1X, n1Y);
    if (this.rightHoverParticles) this.rightHoverParticles.setPosition(n2X, n2Y);

    if (this.state === PLAYER_STATES.FLYING) {
      // Voller Steigflug: Große Düsenstrahlen an, sanfte Schwebedüsen aus
      if (this.leftHoverParticles?.emitting) this.leftHoverParticles.stop();
      if (this.rightHoverParticles?.emitting) this.rightHoverParticles.stop();
    } else {
      // Nicht im Steigflug: Große Düsenstrahlen sicher stoppen
      if (this.leftThrustParticles?.emitting) this.leftThrustParticles.stop();
      if (this.rightThrustParticles?.emitting) this.rightThrustParticles.stop();

      // Prüfen ob Driller in der Luft schwebt (kein Boden unter den Ketten)
      const isHovering = this.state !== PLAYER_STATES.DRILLING && this.isHoveringInAir();
      if (isHovering) {
        if (!this.leftHoverParticles?.emitting) {
          this.leftHoverParticles?.start();
          this.rightHoverParticles?.start();
        }
      } else {
        if (this.leftHoverParticles?.emitting) {
          this.leftHoverParticles?.stop();
          this.rightHoverParticles?.stop();
        }
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

  get cash() {
    return this._cash !== undefined ? this._cash : 10;
  }

  set cash(val) {
    this._cash = Math.max(0, Math.round(Number(val) || 0));
  }

  getChargeSpeed() {
    return 5; // Verlängerte, ruhige Betankungszeit am Hangar (~20s für 100L)
  }

  getTankData() {
    const tier = Math.max(1, Math.min(TANK_TIERS.length, this.tankTier || 1));
    return TANK_TIERS[tier - 1];
  }

  upgradeTank(tier) {
    this.tankTier = tier;
    const data = TANK_TIERS[tier - 1] || TANK_TIERS[0];
    const prevMax = this.maxFuel || 100;
    this.maxFuel = data.maxFuel;
    const effs = [1.0, 1.12, 1.20, 1.28, 1.35, 1.42, 1.50, 1.60];
    this.fuelEfficiency = effs[tier - 1] || 1.0;
    this.fuel = Math.min(this.maxFuel, this.fuel + (this.maxFuel - prevMax));
  }

  getHullData() {
    const tier = Math.max(1, Math.min(HULL_TIERS.length, this.hullTier || 1));
    return HULL_TIERS[tier - 1];
  }

  upgradeHull(tier) {
    this.hullTier = tier;
    const data = HULL_TIERS[tier - 1] || HULL_TIERS[0];
    const prevMax = this.maxHull || 100;
    this.maxHull = data.maxHull;
    this.hull = Math.min(this.maxHull, this.hull + (this.maxHull - prevMax));
  }

  getEngineData() {
    const tier = Math.max(1, Math.min(ENGINE_TIERS.length, this.engineTier || 1));
    return ENGINE_TIERS[tier - 1];
  }

  getCargoData() {
    const tier = Math.max(1, Math.min(CARGO_TIERS.length, this.cargoTier || 1));
    return CARGO_TIERS[tier - 1];
  }

  upgradeCargo(tier) {
    this.cargoTier = tier;
    const data = CARGO_TIERS[tier - 1] || CARGO_TIERS[0];
    this.maxCargo = data.maxCargo || 10;
  }

  getSensorData() {
    const tier = Math.max(1, Math.min(SENSOR_TIERS.length, this.sensorTier || 1));
    return SENSOR_TIERS[tier - 1];
  }

  checkDocking(delta) {
    // Sobald sich der Spieler an der Oberfläche befindet (gy <= -1)
    const isAtSurface = (this.gy <= -1);
    const isNearHangar = isAtSurface && (this.gx >= 13 && this.gx <= 17);
    const isVehicleStationary = (this.state !== PLAYER_STATES.MOVING && this.state !== PLAYER_STATES.FLYING);
    const isParkedAtHangar = isNearHangar && isVehicleStationary;

    if (isAtSurface) {
      if (!this.isDocked) {
        this.isDocked = true;
      }

      // Rumpfreparatur: Verlängerte, sorgfältige Schweißzeit (4 HP/s = ~25s für 100 HP)
      const isRepairReady = isParkedAtHangar && this.repairArmState && this.repairArmState.activeWeight > 0.8;
      if (isRepairReady && this.hull < this.maxHull) {
        this.hull = Math.min(this.maxHull, this.hull + (delta / 1000) * 4);
        if (this.hull >= this.maxHull - 0.05) {
          this.hull = this.maxHull;
        }
      }

      // Betankung über Kabel: Verlängerte Betankungszeit (7 L/s = ~14s für 100L)
      const isFuelReady = isParkedAtHangar && this.fuelArmState && this.fuelArmState.activeWeight > 0.8;
      const chargeSpeed = this.getChargeSpeed();
      if (isFuelReady && this.fuel < this.maxFuel) {
        this.fuel = Math.min(this.maxFuel, this.fuel + (delta / 1000) * chargeSpeed);
        if (this.fuel >= this.maxFuel - 0.05) {
          this.fuel = this.maxFuel;
        }
      }
    } else {
      if (this.isDocked) {
        this.isDocked = false;
      }
    }

    // Beide Roboterarme fahren nur aus, solange das Fahrzeug am Hangar STEHT und die jeweilige Aufgabe noch ansteht.
    // Sobald das Auto weiterfährt ODER die Aufgabe erledigt ist (Tank voll / Bohrer ganz),
    // fahren die Arme sofort einzeln zur Parkposition ein, anstatt dem Auto hinterherzugehen!
    const shouldDeployFuel = isParkedAtHangar && (this.fuel < this.maxFuel);
    const shouldDeployRepair = isParkedAtHangar && (this.hull < this.maxHull);

    this.updateFuelArm(shouldDeployFuel, delta);
    this.updateRepairArm(shouldDeployRepair, delta);
  }

  updateFuelArm(shouldDeploy, delta) {
    if (!this.refuelBeam) return;
    this.refuelBeam.clear();

    const now = Date.now();
    const dt = Math.min(0.05, (delta || 16) / 1000);

    // Tanksäulen-Sockel an der Hangar-Bucht links (x=444, y=-28)
    const pumpBaseX = 15 * TILE_SIZE - 36;
    const pumpBaseY = -28;

    if (!this.fuelArmState) {
      this.fuelArmState = {
        curTipX: pumpBaseX + 6,
        curTipY: pumpBaseY + 18,
        curMidX: pumpBaseX + 14,
        curMidY: pumpBaseY + 8,
        activeWeight: 0
      };
    }

    // Park-Position an der Tanksäule (Arm sauber angeklappt)
    const parkTipX = pumpBaseX + 6;
    const parkTipY = pumpBaseY + 18;
    const parkMidX = pumpBaseX + 14;
    const parkMidY = pumpBaseY + 8;

    // Zielposition: Wenn aktiv am Fahrzeug (strikt auf die Hangar-Bucht begrenzt),
    // andernfalls direkt die Park-Position (kein Nachziehen beim Wegfahren des Autos!)
    let targetTipX, targetTipY, targetMidX, targetMidY;

    if (shouldDeploy) {
      const clampedVehX = Phaser.Math.Clamp(this.sprite.x, 15 * TILE_SIZE - 20, 15 * TILE_SIZE + 20);
      const clampedVehY = Phaser.Math.Clamp(this.sprite.y, -32, -4);
      const portX = clampedVehX - 12;
      const portY = clampedVehY - 4;

      targetTipX = portX;
      targetTipY = portY;
      targetMidX = (pumpBaseX + portX) / 2 - 4;
      targetMidY = Math.min(pumpBaseY, portY) - 14;

      this.fuelArmState.activeWeight = Phaser.Math.Linear(this.fuelArmState.activeWeight, 1.0, dt * 2.2);
    } else {
      // Wenn Tank voll oder Auto weiterfährt: Sofort zur Parkposition zurückfahren!
      targetTipX = parkTipX;
      targetTipY = parkTipY;
      targetMidX = parkMidX;
      targetMidY = parkMidY;

      this.fuelArmState.activeWeight = Phaser.Math.Linear(this.fuelArmState.activeWeight, 0.0, dt * 2.8);
    }

    // Sanftes Nachführen der Gelenke (kinematisches Nachziehen, kein Springen oder Strecken)
    this.fuelArmState.curTipX = Phaser.Math.Linear(this.fuelArmState.curTipX, targetTipX, dt * 3.8);
    this.fuelArmState.curTipY = Phaser.Math.Linear(this.fuelArmState.curTipY, targetTipY, dt * 3.8);
    this.fuelArmState.curMidX = Phaser.Math.Linear(this.fuelArmState.curMidX, targetMidX, dt * 3.8);
    this.fuelArmState.curMidY = Phaser.Math.Linear(this.fuelArmState.curMidY, targetMidY, dt * 3.8);

    const curTipX = this.fuelArmState.curTipX;
    const curTipY = this.fuelArmState.curTipY;
    const curMidX = this.fuelArmState.curMidX;
    const curMidY = this.fuelArmState.curMidY;

    const isConnected = this.fuelArmState.activeWeight > 0.8;
    const isActivelyRefueling = isConnected && shouldDeploy && (this.fuel < this.maxFuel);

    // 2. Sockel & Drehscheibe an der Tanksäule
    this.refuelBeam.fillStyle(0x1e293b, 1);
    this.refuelBeam.fillRect(pumpBaseX - 5, pumpBaseY - 4, 10, 8);
    this.refuelBeam.fillStyle(0xd97706, 1); // Industrie-Orange für Treibstofftechnik
    this.refuelBeam.fillCircle(pumpBaseX, pumpBaseY, 3.5);

    // 3. Ausleger-Segment 1 (von Säule zu Kniegelenk)
    this.refuelBeam.lineStyle(3.6, 0x334155, 1);
    this.refuelBeam.beginPath();
    this.refuelBeam.moveTo(pumpBaseX, pumpBaseY);
    this.refuelBeam.lineTo(curMidX, curMidY);
    this.refuelBeam.strokePath();

    // Hydraulik-Akzentlinie auf Ausleger
    this.refuelBeam.lineStyle(1.4, 0x94a3b8, 0.9);
    this.refuelBeam.beginPath();
    this.refuelBeam.moveTo(pumpBaseX, pumpBaseY);
    this.refuelBeam.lineTo(curMidX, curMidY);
    this.refuelBeam.strokePath();

    // 4. Knie-Gelenk
    this.refuelBeam.fillStyle(0x0f172a, 1);
    this.refuelBeam.fillCircle(curMidX, curMidY, 3.5);
    this.refuelBeam.fillStyle(isConnected ? 0x0284c7 : 0x64748b, 1);
    this.refuelBeam.fillCircle(curMidX, curMidY, 1.8);

    // 5. Ausleger-Segment 2 (vom Kniegelenk zum Düsenkopf)
    this.refuelBeam.lineStyle(2.8, 0x475569, 1);
    this.refuelBeam.beginPath();
    this.refuelBeam.moveTo(curMidX, curMidY);
    this.refuelBeam.lineTo(curTipX, curTipY);
    this.refuelBeam.strokePath();

    // Teleskopzylinder-Akzent
    this.refuelBeam.lineStyle(1.2, 0xe2e8f0, 0.85);
    this.refuelBeam.beginPath();
    this.refuelBeam.moveTo(curMidX, curMidY);
    this.refuelBeam.lineTo(curTipX, curTipY);
    this.refuelBeam.strokePath();

    // 6. Durchhängendes Betankungskabel (gehalten vom Auslegerarm)
    const cableDist = Math.hypot(curTipX - pumpBaseX, curTipY - pumpBaseY);
    const sag = Math.min(18, 4 + cableDist * 0.14);
    const cp1X = pumpBaseX + (curTipX - pumpBaseX) * 0.35;
    const cp1Y = Math.max(pumpBaseY, curTipY) + sag;
    const cp2X = pumpBaseX + (curTipX - pumpBaseX) * 0.70;
    const cp2Y = Math.max(pumpBaseY, curTipY) + sag;

    // Äußerer robuster Gummimantel
    this.refuelBeam.lineStyle(3.4, 0x090d16, 0.95);
    this.refuelBeam.beginPath();
    this.refuelBeam.moveTo(pumpBaseX, pumpBaseY);
    for (let t = 0.05; t <= 1.0; t += 0.05) {
      const u = 1 - t;
      const qx = u*u*u*pumpBaseX + 3*u*u*t*cp1X + 3*u*t*t*cp2X + t*t*t*curTipX;
      const qy = u*u*u*pumpBaseY + 3*u*u*t*cp1Y + 3*u*t*t*cp2Y + t*t*t*curTipY;
      this.refuelBeam.lineTo(qx, qy);
    }
    this.refuelBeam.strokePath();

    // Betankungskabel-Ader (konstante Industriefarbe, keine Farbänderung beim Tanken)
    const hoseColor = 0x334155;
    this.refuelBeam.lineStyle(1.8, hoseColor, 0.95);
    this.refuelBeam.beginPath();
    this.refuelBeam.moveTo(pumpBaseX, pumpBaseY);
    for (let t = 0.05; t <= 1.0; t += 0.05) {
      const u = 1 - t;
      const qx = u*u*u*pumpBaseX + 3*u*u*t*cp1X + 3*u*t*t*cp2X + t*t*t*curTipX;
      const qy = u*u*u*pumpBaseY + 3*u*u*t*cp1Y + 3*u*t*t*cp2Y + t*t*t*curTipY;
      this.refuelBeam.lineTo(qx, qy);
    }
    this.refuelBeam.strokePath();

    // 7. Betankungsdüse & Haltekopf am Ende des Arms
    this.refuelBeam.fillStyle(0x1e293b, 1);
    this.refuelBeam.fillRect(curTipX - 3, curTipY - 3, 6, 6);
    this.refuelBeam.fillStyle(0x475569, 1);
    this.refuelBeam.fillRect(curTipX - 2, curTipY - 2, 4, 4);

    // Status-LED an der Düse: Grün blinkend beim Tanken, Grün statisch beim Abkoppeln/Voll, Blau im Standby
    const ledColor = isActivelyRefueling ? 0x10b981 : (this.fuelArmState.activeWeight > 0.15 ? 0x38bdf8 : 0x0284c7);
    const ledAlpha = isActivelyRefueling ? (0.6 + 0.4 * Math.sin(now * 0.008)) : (0.4 + 0.3 * Math.sin(now * 0.003));
    this.refuelBeam.fillStyle(ledColor, ledAlpha);
    this.refuelBeam.fillCircle(curTipX, curTipY, 2.0);
  }

  updateRepairArm(shouldDeploy, delta) {
    if (!this.repairArm) return;
    this.repairArm.clear();

    const now = Date.now();
    const dt = Math.min(0.05, (delta || 16) / 1000);

    // Roboterarm-Sockel an der Hangar-Überdachung rechts (x=512, y=-30)
    const armBaseX = 15 * TILE_SIZE + 32;
    const armBaseY = -30;

    if (!this.repairArmState) {
      this.repairArmState = {
        curTipX: armBaseX - 8,
        curTipY: armBaseY + 20,
        curMidX: armBaseX - 16,
        curMidY: armBaseY + 8,
        activeWeight: 0
      };
    }

    // 1. Sanfte Gewichtsannäherung (0 = geparkt am Dach, 1 = am Bohrer-Chassis)
    // Sobald die Hülle 100% repariert ist (shouldDeploy = false), fährt der Arm sanft wieder ein
    const targetWeight = shouldDeploy ? 1.0 : 0.0;
    this.repairArmState.activeWeight = Phaser.Math.Linear(
      this.repairArmState.activeWeight,
      targetWeight,
      dt * 1.8
    );

    // Park-Position am Hangar-Dach (Arm sauber eingeklappt)
    const parkTipX = armBaseX - 8;
    const parkTipY = armBaseY + 20;
    const parkMidX = armBaseX - 16;
    const parkMidY = armBaseY + 8;

    // Zielposition: Wenn aktiv am Fahrzeug (strikt auf die Hangar-Bucht begrenzt),
    // andernfalls direkt die Park-Position (kein Nachziehen beim Wegfahren des Autos!)
    let targetTipX, targetTipY, targetMidX, targetMidY;

    const isConnected = this.repairArmState.activeWeight > 0.8;
    const isRepairing = isConnected && shouldDeploy && (this.hull < this.maxHull);

    if (shouldDeploy) {
      const clampedVehX = Phaser.Math.Clamp(this.sprite.x, 15 * TILE_SIZE - 20, 15 * TILE_SIZE + 20);
      const clampedVehY = Phaser.Math.Clamp(this.sprite.y, -32, -4);
      const sweepX = isRepairing ? Math.sin(now * 0.007) * 8 : 0;
      const workTipX = clampedVehX + sweepX;
      const workTipY = clampedVehY - 10;

      targetTipX = workTipX;
      targetTipY = workTipY;
      targetMidX = (armBaseX + workTipX) / 2 + 5;
      targetMidY = Math.min(armBaseY, workTipY) - 15;

      this.repairArmState.activeWeight = Phaser.Math.Linear(this.repairArmState.activeWeight, 1.0, dt * 2.2);
    } else {
      // Wenn Hülle repariert oder Auto weiterfährt: Sofort zur Parkposition zurückfahren!
      targetTipX = parkTipX;
      targetTipY = parkTipY;
      targetMidX = parkMidX;
      targetMidY = parkMidY;

      this.repairArmState.activeWeight = Phaser.Math.Linear(this.repairArmState.activeWeight, 0.0, dt * 2.8);
    }

    // Sanftes Nachführen der Gelenke (kinematisches Nachziehen, kein Springen oder Strecken)
    this.repairArmState.curTipX = Phaser.Math.Linear(this.repairArmState.curTipX, targetTipX, dt * 3.8);
    this.repairArmState.curTipY = Phaser.Math.Linear(this.repairArmState.curTipY, targetTipY, dt * 3.8);
    this.repairArmState.curMidX = Phaser.Math.Linear(this.repairArmState.curMidX, targetMidX, dt * 3.8);
    this.repairArmState.curMidY = Phaser.Math.Linear(this.repairArmState.curMidY, targetMidY, dt * 3.8);

    const curTipX = this.repairArmState.curTipX;
    const curTipY = this.repairArmState.curTipY;
    const curMidX = this.repairArmState.curMidX;
    const curMidY = this.repairArmState.curMidY;

    // 2. Sockel & Drehscheibe an der Hangar-Überdachung
    this.repairArm.fillStyle(0x1e293b, 1);
    this.repairArm.fillRect(armBaseX - 5, armBaseY - 4, 10, 7);
    this.repairArm.fillStyle(0x0284c7, 1);
    this.repairArm.fillCircle(armBaseX, armBaseY, 3.5);

    // 3. Segment 1: Hauptausleger (Arm von Basis zu Gelenk)
    this.repairArm.lineStyle(3.5, 0x334155, 1);
    this.repairArm.beginPath();
    this.repairArm.moveTo(armBaseX, armBaseY);
    this.repairArm.lineTo(curMidX, curMidY);
    this.repairArm.strokePath();

    // Warnstreifen / Farb-Akzent auf Hauptausleger
    this.repairArm.lineStyle(1.6, 0xf59e0b, 0.9);
    this.repairArm.beginPath();
    this.repairArm.moveTo(armBaseX, armBaseY);
    this.repairArm.lineTo(curMidX, curMidY);
    this.repairArm.strokePath();

    // 4. Ellbogen-Gelenk
    this.repairArm.fillStyle(0x0f172a, 1);
    this.repairArm.fillCircle(curMidX, curMidY, 3.5);
    this.repairArm.fillStyle(isRepairing ? 0x38bdf8 : isConnected ? 0x10b981 : 0x64748b, 1);
    this.repairArm.fillCircle(curMidX, curMidY, 1.8);

    // 5. Segment 2: Unterarm (vom Gelenk zum Schweißkopf)
    this.repairArm.lineStyle(2.8, 0x475569, 1);
    this.repairArm.beginPath();
    this.repairArm.moveTo(curMidX, curMidY);
    this.repairArm.lineTo(curTipX, curTipY);
    this.repairArm.strokePath();

    // Hydraulikzylinder-Akzent
    this.repairArm.lineStyle(1.2, 0xe2e8f0, 0.85);
    this.repairArm.beginPath();
    this.repairArm.moveTo(curMidX, curMidY);
    this.repairArm.lineTo(curTipX, curTipY);
    this.repairArm.strokePath();

    // 6. Schweißkopf / Werkzeugdüse
    this.repairArm.fillStyle(0x1e293b, 1);
    this.repairArm.fillRect(curTipX - 2, curTipY - 3, 4, 5);

    // 7. Effekte: Schweißlichtbogen & Funken nur beim tatsächlichen Schweißen vor Ort
    if (isRepairing) {
      const sparkSize = 2.5 + Math.random() * 2.5;
      this.repairArm.fillStyle(0x38bdf8, 0.85);
      this.repairArm.fillCircle(curTipX, curTipY, sparkSize);

      this.repairArm.fillStyle(0xffffff, 1);
      this.repairArm.fillCircle(curTipX, curTipY, 1.4);

      // Winzige Funken
      this.repairArm.lineStyle(1, 0xfacc15, 0.9);
      for (let s = 0; s < 3; s++) {
        const rx = (Math.random() - 0.5) * 10;
        const ry = (Math.random() - 0.5) * 8;
        this.repairArm.beginPath();
        this.repairArm.moveTo(curTipX, curTipY);
        this.repairArm.lineTo(curTipX + rx, curTipY + ry);
        this.repairArm.strokePath();
      }
    } else if (this.repairArmState.activeWeight > 0.15) {
      // Beim Zurückfahren / Fertig: Grüne Erfolgs-LED
      this.repairArm.fillStyle(0x10b981, 1);
      this.repairArm.fillCircle(curTipX, curTipY, 1.6);
    } else {
      // Inaktiv / Standby: Dezentes Pulsieren der Bereitschafts-LED
      const pulse = 0.4 + 0.3 * Math.sin(now * 0.003);
      this.repairArm.fillStyle(0x0284c7, pulse);
      this.repairArm.fillCircle(curTipX, curTipY, 1.4);
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

  isHoveringInAir() {
    if (!this.sprite) return false;

    // Erdoberfläche:
    if (this.sprite.y <= -15) {
      // Über dem Schachteinstieg (gx 19-20) schwebt der Bohrer über dem Abgrund
      return (this.gx >= 19 && this.gx <= 20);
    }

    // Unter Tage: prüfen ob unter den Ketten feste Kacheln liegen
    const footY = this.sprite.y + 17;
    const checkGy = Math.floor(footY / TILE_SIZE);
    if (checkGy < 0) return true;

    const leftGx = Math.floor((this.sprite.x - 8) / TILE_SIZE);
    const rightGx = Math.floor((this.sprite.x + 8) / TILE_SIZE);

    const solidGround = (this.gridSystem && (this.gridSystem.isSolid(leftGx, checkGy) || this.gridSystem.isSolid(rightGx, checkGy)));
    return !solidGround;
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
    // Auf Level 1 besonders robust (nur ca. 0.35 HP/s statt 1.5 HP/s, mehr als 4x langsamer kaputt)
    const baseWear = (this.level || 1) === 1 ? 0.35 : Math.max(0.4, 1.2 - ((this.level || 1) * 0.08));
    // Höhere Gehäuseschutz-Stufen (hullTier) reduzieren Reibungsverschleiß zusätzlich
    const tierReduction = Math.max(0.4, 1.0 - ((this.hullTier || 1) - 1) * 0.08);
    const hullWearPerSec = baseWear * tierReduction;
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

    if (this.scene && this.scene.events) {
      this.scene.events.emit('ore_collected', oreType);
    }

    // Entdeckungs-Event beim allerersten Fund
    if (this.discoveredOres && !this.discoveredOres.has(oreType)) {
      this.discoveredOres.add(oreType);
      this.scene.events.emit('ore_discovered', oreType);
    }
  }

  isOreDiscovered(oreKey) {
    if (!this.discoveredOres) this.discoveredOres = new Set(['coal']);
    if (this.discoveredOres.has(oreKey)) return true;
    if (this.cargo && this.cargo.includes(oreKey)) {
      this.discoveredOres.add(oreKey);
      return true;
    }
    if (this.scene?.baseSystem?.depot?.ores?.[oreKey] > 0) {
      this.discoveredOres.add(oreKey);
      return true;
    }
    if (this.stats?.totalOresMined?.[oreKey] > 0) {
      this.discoveredOres.add(oreKey);
      return true;
    }
    return false;
  }

  checkDepthProgress() {
    const depthMeters = this.depthMeters;
    if (depthMeters > this.highestDepthReached) {
      this.highestDepthReached = depthMeters;
    }
    if (this.scene && this.scene.events) {
      this.scene.events.emit('depth_changed', depthMeters);
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
    let val = unitValue;
    if (val <= 0) {
      if (FACTORY_PRODUCTS[productId]) {
        val = FACTORY_PRODUCTS[productId].value;
      } else if (productId.startsWith('bar_')) {
        const rawKey = productId.replace('bar_', '');
        val = getRefinedOreNetValue(rawKey);
      } else {
        val = ORE_DATA[productId]?.value || 0;
      }
    }
    const totalEarned = Math.round(count * val);
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
    if (this.leftHoverParticles) this.leftHoverParticles.stop();
    if (this.rightHoverParticles) this.rightHoverParticles.stop();
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
