/**
 * BaseSystem.js
 * Verwaltet die Oberflächen-Gebäude (Hangar, Erzbörse, Raffinerie, Tech-Labor),
 * den Steinsammler-NPC (Auftraggeber für Upgrade-Bauteile),
 * kaufbare Neubauten (Drohnen-Hangar, Quanten-Teleporter, Geothermie-Kraftwerk)
 * und das erweiterte Tech-Upgrade-System.
 */

import { TILE_SIZE, ORE_DATA } from './GridSystem.js';
import { soundFx } from './SoundEffects.js';
import { icon, refreshIcons, COMPONENT_ICONS, oreIcon, ORE_COLORS, REFINED_ORE_DATA, getRefinedOreName, refinedItemIcon, itemDisplayIcon } from '../ui/IconHelper.js';
import { TANK_TIERS, HULL_TIERS, ENGINE_TIERS, CARGO_TIERS, SENSOR_TIERS } from './Player.js';

// Dauer für das Einschmelzen einzelner Erze in Sekunden (verlängert für spürbaren Fortschritt)
export const REFINERY_DURATIONS_SEC = {
  coal: 20,          // 20s (vorher 10s)
  copper: 35,        // 35s (vorher 16s)
  iron: 55,          // 55s (vorher 26s)
  tin: 75,           // 1m 15s (vorher 36s)
  silver: 110,       // 1m 50s (vorher 50s)
  gold: 160,         // 2m 40s (vorher 75s)
  emerald: 220,      // 3m 40s (vorher 1m 45s)
  sapphire: 280,     // 4m 40s (vorher 2m 15s)
  ruby: 360,         // 6m (vorher 2m 50s)
  diamond: 450,      // 7m 30s (vorher 3m 30s)
  titanium: 550,     // 9m 10s (vorher 4m 20s)
  platinum: 680,     // 11m 20s (vorher 5m 20s)
  uranium: 850,      // 14m 10s (vorher 6m 40s)
  obsidian_gem: 1100,// 18m 20s (vorher 8m 20s)
  dark_matter: 1400  // 23m 20s (vorher 10m 50s)
};

export function getRefinerySmeltDurationMs(oreKey) {
  const sec = REFINERY_DURATIONS_SEC[oreKey];
  if (sec) return sec * 1000;
  const val = ORE_DATA[oreKey]?.value || 25;
  return Math.max(20, Math.round(val * 0.70)) * 1000;
}

let lastModalCloseTimestamp = 0;

export function notifyModalClosed() {
  lastModalCloseTimestamp = Date.now();
}

export function isModalActive() {
  const modal = document.getElementById('building-modal');
  if (modal && modal.style.display && modal.style.display !== 'none') {
    return true;
  }
  if (Date.now() - lastModalCloseTimestamp < 350) {
    return true;
  }
  return false;
}

export function getRefinedOreNetValue(oreKey) {
  const val = ORE_DATA[oreKey]?.value || 10;
  const refinedVal = Math.round(val * 1.5);
  const fee = Math.round(refinedVal * 0.12);
  return refinedVal - fee;
}

// Bohrkopf-Stufen & DPS (Entwicklung im Labor -> Montage im Hangar)
export const DRILL_TIERS = [
  { tier: 1, name: 'Stahl-Bohrkopf', stat: '34 DPS', cost: 0, comp: null, level: 1, desc: 'Solider Bohrkopf für Humus & lockere Erde (ca. 2.5s pro Block).' },
  { tier: 2, name: 'Wolframkarbid-Spitze', stat: '45 DPS', cost: 220, comp: null, level: 1, desc: 'Fräst spürbar flüssiger durch Erde (ca. 1.9s) und Schiefer.' },
  { tier: 3, name: 'Gehärteter Meißel Mk.III', stat: '60 DPS', cost: 480, comp: null, level: 1, desc: 'Schneidet zügig durch Stein und zerbröckelt Fels.' },
  { tier: 4, name: 'Titan-Diamant-Kopf Mk.IV', stat: '82 DPS', cost: 1050, comp: { key: 'hydraulic_part', name: 'Hydraulik-Zylinder', count: 1 }, level: 2, desc: 'Hydraulisch verstärkte Fräse zermalmt harte Granitadern.' },
  { tier: 5, name: 'Hochdruck-Fräse Mk.V', stat: '115 DPS', cost: 2200, comp: { key: 'titan_alloy', name: 'Titan-Legierung', count: 1 }, level: 3, desc: 'Panzerung und Zahnkränze fräsen mühelos durch Granit und Basalt.' },
  { tier: 6, name: 'Plasma-Schneidbrenner Mk.VI', stat: '165 DPS', cost: 4500, comp: { key: 'laser_lens', name: 'Kristall-Fokuslinse', count: 1 }, level: 4, desc: 'Fokussierter Plasmastrahl schmilzt Obsidian-Gestein.' },
  { tier: 7, name: 'Laser-Kavitationsmeißel Mk.VII', stat: '240 DPS', cost: 9000, comp: { key: 'laser_lens', name: 'Kristall-Fokuslinse', count: 2 }, level: 5, desc: 'Höchste Schneidleistung für schwerste Tiefenerze.' },
  { tier: 8, name: 'Antimaterie-Bohrer Mk.VIII', stat: '350 DPS', cost: 17500, comp: { key: 'quantum_chip', name: 'Quanten-Steuerkern', count: 2 }, level: 6, desc: 'Fräst durch das härteste Urgestein wie Butter.' },
  { tier: 9, name: 'Singularitäts-Fräse Mk.IX', stat: '500 DPS', cost: 28000, comp: { key: 'quantum_chip', name: 'Quanten-Steuerkern', count: 2 }, level: 8, desc: 'Erzeugt Mikrogravitations-Kollapse vor dem Bohrkopf.' },
  { tier: 10, name: 'Tachyonen-Disruptor X', stat: '700 DPS', cost: 45000, comp: { key: 'quantum_chip', name: 'Quanten-Steuerkern', count: 3 }, level: 10, desc: 'Zersetzt die Molekularstruktur des Erdkerns in Sekundenbruchteilen.' }
];
export const DRILL_DPS = [34, 45, 60, 82, 115, 165, 240, 350, 500, 700];
export const DRILL_DATA = DRILL_TIERS;

// Zentrale Depot-Ausbaustufen (10 Tiers mit linear-exponentieller Kapazität)
export const DEPOT_TIERS = [
  { tier: 1, capacity: 10, costCash: 0, label: 'Kompaktes Lagerfach' },
  { tier: 2, capacity: 25, costCash: 250, label: 'Erweitertes Regallager' },
  { tier: 3, capacity: 60, costCash: 800, costComp: { hydraulic_part: 1 }, compName: '1x Hydraulikzylinder', label: 'Automatisierte Förderbrücke' },
  { tier: 4, capacity: 150, costCash: 2200, costComp: { titan_alloy: 1 }, compName: '1x Titan-Legierung', label: 'Schwergut-Containerterminal' },
  { tier: 5, capacity: 350, costCash: 5500, costComp: { titan_alloy: 2 }, compName: '2x Titan-Legierung', label: 'Industrie-Großlager' },
  { tier: 6, capacity: 650, costCash: 11000, costComp: { laser_lens: 2 }, compName: '2x Kristall-Fokuslinse', label: 'Logistik-Zentralverteiler' },
  { tier: 7, capacity: 1000, costCash: 18000, costComp: { quantum_chip: 1 }, compName: '1x Quanten-Steuerkern', label: 'Quanten-Kompressionslager' },
  { tier: 8, capacity: 1500, costCash: 26000, costComp: { quantum_chip: 2 }, compName: '2x Quanten-Steuerkern', label: 'Subraum-Speicherkomplex' },
  { tier: 9, capacity: 2200, costCash: 35000, costComp: { quantum_chip: 2 }, compName: '2x Quanten-Kern, 2x Titan', label: 'Megaspeicher-Matrix' },
  { tier: 10, capacity: 3000, costCash: 48000, costComp: { quantum_chip: 3 }, compName: '3x Quanten-Steuerkern', label: 'Interdimensionales Zentrallager' }
];

// Fabrik-Produkte (Industrielle Werkstoffe mit hohem Börsenwert)
// Jedes Produkt benötigt zusätzlich 2x Kohle als Prozesshitze/Brennstoff
export const FACTORY_PRODUCTS = {
  steel_beam: {
    id: 'steel_beam',
    name: 'Stahlträger',
    desc: 'Hochbelastbarer Baustahl für Schachtgerüste und Industrie.',
    iconName: 'circle-pile',
    recipe: { iron: 2, coal: 2 }, // 2x Eisen + 2x Kohle Material
    fuelCoal: 2,
    durationSec: 45,
    value: 260
  },
  bronze_ingot: {
    id: 'bronze_ingot',
    name: 'Bronze-Barren',
    desc: 'Widerstandsfähige Legierung für korrosionsfreie Maschinenteile.',
    iconName: 'layers',
    recipe: { copper: 2, tin: 2 },
    fuelCoal: 2,
    durationSec: 60,
    value: 390
  },
  circuit_board: {
    id: 'circuit_board',
    name: 'Elektronik-Platine',
    desc: 'Hochintegrierte Leiterplatte für Steuerungen und Navigationssysteme.',
    iconName: 'cpu',
    recipe: { copper: 2, silver: 1, gold: 1 },
    fuelCoal: 2,
    durationSec: 120,
    value: 920
  },
  polished_gem: {
    id: 'polished_gem',
    name: 'Schmuck-Diamant',
    desc: 'Präzisionsgeschliffener Edelstein für Optik und Luxusmärkte.',
    iconName: 'gem',
    recipe: { emerald: 1, ruby: 1 },
    fuelCoal: 2,
    durationSec: 200,
    value: 3600
  },
  titan_plate: {
    id: 'titan_plate',
    name: 'Titan-Panzerung',
    desc: 'Hitzebeständige Panzerplatte für Tiefsee- und Hochdruckrümpfe.',
    iconName: 'shield',
    recipe: { titanium: 2, diamond: 1 },
    fuelCoal: 2,
    durationSec: 320,
    value: 9400
  },
  fusion_rod: {
    id: 'fusion_rod',
    name: 'Quanten-Brennstab',
    desc: 'Hochenergetischer Nuklear-Brennstab für Fusionsreaktoren.',
    iconName: 'zap',
    recipe: { uranium: 2, platinum: 1 },
    fuelCoal: 2,
    durationSec: 480,
    value: 24500
  }
};

export class BaseSystem {
  constructor(scene, player, missionSystem) {
    this.scene = scene;
    this.player = player;
    this.missionSystem = missionSystem;

    // Basis-Gebäude (Standard an der Oberfläche)
    this.buildings = [
      {
        id: 'lab',
        title: 'LABOR',
        label: 'LABOR',
        iconName: 'microscope',
        spriteKey: 'building_lab',
        gx: -9,
        height: 72,
        action: () => this.openLabModal()
      },
      {
        id: 'office',
        title: 'BÜRO',
        label: 'BÜRO',
        iconName: 'laptop-minimal',
        spriteKey: 'building_office',
        gx: -3,
        height: 70,
        action: () => {
          if (this.scene.hud && this.scene.hud.missionsModal) {
            this.scene.hud.missionsModal.open('active');
          }
        }
      },
      {
        id: 'market',
        title: 'ERZBÖRSE',
        label: 'ERZBÖRSE',
        iconName: 'coins',
        spriteKey: 'building_market',
        gx: 3,
        height: 68,
        action: () => this.openMarketModal()
      },
      {
        id: 'depot',
        title: 'DEPOT',
        label: 'DEPOT',
        iconName: 'warehouse',
        spriteKey: 'building_depot',
        gx: 9,
        height: 70,
        action: () => this.openDepotModal()
      },
      {
        id: 'dock',
        title: 'HANGAR',
        label: 'HANGAR',
        iconName: 'wrench',
        spriteKey: 'building_dock',
        gx: 15,
        height: 72,
        action: () => this.openDockModal()
      },
      {
        id: 'factory',
        title: 'FABRIK',
        label: 'FABRIK',
        iconName: 'factory',
        spriteKey: 'building_factory',
        gx: 26,
        height: 72,
        action: () => this.openFactoryModal()
      }
    ];

    // Kaufbare Erweiterungs-Gebäude mit neuen Funktionen - ohne Emojis
    this.purchasableBuildings = [
      {
        id: 'drone_hangar',
        title: 'DROHNEN-HANGAR',
        label: 'DROHNEN-HANGAR',
        iconName: 'bot',
        desc: 'Startet autonome Bergbau-Drohnen, die periodisch Erze an die Oberfläche schaffen.',
        spriteKey: 'building_drone_hangar',
        gx: -16,
        height: 70,
        costCash: 650,
        costComp: { hydraulic_part: 1 },
        isBuilt: false,
        storedOres: ['coal', 'copper'],
        timer: 0,
        action: () => this.openDroneModal()
      },
      {
        id: 'teleporter',
        title: 'TELEPORTER',
        label: 'TELEPORTER',
        iconName: 'navigation',
        desc: 'Ermöglicht Rohrpost-Verkauf aus der Tiefe und Sofort-Warp zur tiefsten Schachtebene.',
        spriteKey: 'building_teleporter',
        gx: 34,
        height: 76,
        costCash: 1100,
        costComp: { hydraulic_part: 2, titan_alloy: 1 },
        isBuilt: false,
        action: () => this.openTeleporterModal()
      },
      {
        id: 'powerplant',
        title: 'KRAFTWERK',
        label: 'KRAFTWERK',
        iconName: 'zap',
        desc: 'Generiert passives Einkommen (+€35 alle 8s) und verdoppelt die Basis-Auftankgeschwindigkeit.',
        spriteKey: 'building_powerplant',
        gx: 42,
        height: 76,
        costCash: 1950,
        costComp: { titan_alloy: 2, laser_lens: 1 },
        isBuilt: false,
        timer: 0,
        accumulatedCash: 0,
        action: () => this.openPowerplantModal()
      }
    ];

    this.modalEl = document.getElementById('building-modal');
    this.modalTitleEl = document.getElementById('modal-title');
    this.modalBodyEl = document.getElementById('modal-body');
    this.modalCloseBtn = document.getElementById('modal-close-btn');

    // Raffinerie-Zustand (Berechnung über Geräte-Uhrzeit, auch offline)
    this.refinery = {
      queue: [], // [{ id, ore, name, durationMs, remainingMs, value }]
      finished: [], // [{ id, ore, name, value, finishedAt }]
      lastTimestamp: Date.now()
    };
    this.isRefineryModalOpen = false;
    this.refineryUiInterval = null;

    // Rohstoff- & Waren-Depot (Zwischenlager an der Oberfläche)
    this.depot = {
      ores: {},        // { coal: 0, copper: 0, ... }
      products: {},    // { steel_beam: 0, ... }
      capacity: 10,    // Stufe 1: 10 Lagerplätze
      tier: 1,
      currentTab: 'ores' // 'ores' | 'products' | 'upgrade'
    };
    this.isDepotModalOpen = false;

    this.initWorldSprites();
    this.initPurchasableWorldSprites();
    this.initSteinsammler();
    this.initSmokeParticles();
    this.initEvents();
  }

  initWorldSprites() {
    this.buildings.forEach((b) => {
      const px = b.gx * TILE_SIZE;
      const py = 0; // Graslinie y = 0

      const sprite = this.scene.add.image(px, py, b.spriteKey)
        .setDepth(4)
        .setOrigin(0.5, 1.0)
        .setInteractive({ useHandCursor: true });

      const label = b.label || b.title;
      const text = this.scene.add.text(px, -b.height - 14, label, {
        fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif',
        fontSize: '11px',
        fontStyle: 'bold',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 3,
        shadow: {
          offsetX: 0,
          offsetY: 1,
          color: '#000000',
          blur: 3,
          stroke: true,
          fill: true
        },
        padding: { x: 4, y: 2 },
        resolution: 4
      }).setOrigin(0.5, 0.5).setDepth(20)
        .setInteractive({ useHandCursor: true });

      const onTrigger = (pointer) => {
        if (isModalActive()) return;
        if (pointer && pointer.event) {
          const target = pointer.event.target;
          if (target && target.closest && target.closest('#building-modal, .modal-backdrop, .modal-window, .hud-card, button, input')) {
            return;
          }
        }
        if (pointer && this.player && this.player.sprite) {
          const pDist = Math.hypot(pointer.worldX - this.player.x, pointer.worldY - this.player.y);
          if (pDist <= 28) {
            return;
          }
        }
        b.action();
      };

      sprite.on('pointerdown', onTrigger);
      text.on('pointerdown', onTrigger);

      b.sprite = sprite;
      b.textLabel = text;
    });

    // Feste Gruben-Überdachung beim Minen-Schachteinstieg (gx: 19..20, x=640)
    const entranceX = 20 * TILE_SIZE;
    this.scene.add.image(entranceX, 0, 'building_mine_entrance')
      .setDepth(11) // Über dem Bohrfahrzeug (Tiefe 10)
      .setOrigin(0.5, 1.0);

    this.scene.add.text(entranceX, -56, 'SCHACHTEINGANG', {
      fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif',
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
      shadow: {
        offsetX: 0,
        offsetY: 1,
        color: '#000000',
        blur: 3,
        stroke: true,
        fill: true
      },
      padding: { x: 4, y: 2 },
      resolution: 4
    }).setOrigin(0.5, 0.5).setDepth(20);
  }

  initPurchasableWorldSprites() {
    this.purchasableBuildings.forEach((pb) => {
      const px = pb.gx * TILE_SIZE;
      const py = 0;

      const sprite = this.scene.add.image(px, py, pb.isBuilt ? pb.spriteKey : 'building_plot')
        .setDepth(4)
        .setOrigin(0.5, 1.0)
        .setInteractive({ useHandCursor: true });

      const labelText = pb.isBuilt ? (pb.label || pb.title) : `BAUPLATZ: ${pb.label || pb.title}`;
      const textColor = pb.isBuilt ? '#ffffff' : '#fb923c';

      const text = this.scene.add.text(px, -pb.height - 14, labelText, {
        fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif',
        fontSize: '11px',
        fontStyle: 'bold',
        color: textColor,
        stroke: '#000000',
        strokeThickness: 3,
        shadow: {
          offsetX: 0,
          offsetY: 1,
          color: '#000000',
          blur: 3,
          stroke: true,
          fill: true
        },
        padding: { x: 4, y: 2 },
        resolution: 4
      }).setOrigin(0.5, 0.5).setDepth(20)
        .setInteractive({ useHandCursor: true });

      const onTriggerPb = (pointer) => {
        if (isModalActive()) return;
        if (pointer && pointer.event) {
          const target = pointer.event.target;
          if (target && target.closest && target.closest('#building-modal, .modal-backdrop, .modal-window, .hud-card, button, input')) {
            return;
          }
        }
        if (!pb.isBuilt) {
          this.openBuildModal(pb);
        } else {
          pb.action();
        }
      };

      sprite.on('pointerdown', onTriggerPb);
      text.on('pointerdown', onTriggerPb);

      pb.sprite = sprite;
      pb.textLabel = text;
    });
  }

  initSteinsammler() {
    // Steineforscher kommt nur manchmal und wartet dann am Hangar (gx: 17, direkt neben Hangar gx: 15)
    this.sammlerWaitX = 17 * TILE_SIZE;
    this.sammlerSpawnX = 42 * TILE_SIZE; // Kommt von rechts gelaufen
    this.sammlerState = 'WAITING'; // Startet initial 40s am Hangar
    this.sammlerTimer = 40; // Sekunden bis zum Aufbruch
    this.sammlerAwayDuration = 60; // Sekunden bis zum nächsten Besuch
    this.sammlerWaitDuration = 75; // Sekunden Wartezeit am Hangar
    this.sammlerWalkSpeed = 24; // Ruhiges Laufen

    this.sammlerSprite = this.scene.add.image(this.sammlerWaitX, 0, 'npc_geologist')
      .setDepth(5)
      .setOrigin(0.5, 1.0)
      .setInteractive({ useHandCursor: true });

    // Keine Text-Beschriftung, nur die kleine Sprechblase zum Anklicken!
    this.sammlerBubble = this.scene.add.image(this.sammlerWaitX, -28, 'speech_bubble')
      .setDepth(21)
      .setOrigin(0.5, 0.5)
      .setInteractive({ useHandCursor: true });

    // Sanfte Schwebe-Animation der Sprechblase
    this.scene.tweens.add({
      targets: this.sammlerBubble,
      y: '-=3',
      yoyo: true,
      repeat: -1,
      duration: 900,
      ease: 'Sine.easeInOut'
    });

    const onOpenForscher = (pointer) => {
      if (isModalActive()) return;
      if (pointer && pointer.event) {
        const target = pointer.event.target;
        if (target && target.closest && target.closest('#building-modal, .modal-backdrop, .modal-window, .hud-card, button, input')) {
          return;
        }
      }
      this.openGeologistModal();
    };

    this.sammlerSprite.on('pointerdown', onOpenForscher);
    this.sammlerBubble.on('pointerdown', onOpenForscher);
  }

  initSmokeParticles() {
    // Rauch aus Schornsteinen der Fabrik
    const factoryB = this.buildings.find(b => b.id === 'factory');
    const refX = (factoryB ? factoryB.gx : 26) * TILE_SIZE;
    const refY = -70;

    this.scene.add.particles(refX - 22, refY, 'particle_smoke', {
      speedY: { min: -18, max: -36 },
      speedX: { min: 3, max: 10 },
      scale: { start: 0.5, end: 1.4 },
      alpha: { start: 0.45, end: 0 },
      lifespan: 1400,
      frequency: 240
    }).setDepth(3);
  }

  initEvents() {
    if (this.modalCloseBtn) {
      this.modalCloseBtn.onclick = (e) => {
        if (e) e.stopPropagation();
        this.closeModal();
      };
    }

    if (this.modalEl) {
      // Backdrop-Klick schließt das Modal
      this.modalEl.addEventListener('click', (e) => {
        if (e.target === this.modalEl) {
          this.closeModal();
          e.stopPropagation();
        }
      });
    }

    // Wenn der Spieler zwischen Tabs/Apps wechselt: Sofort Gerätezeit verrechnen
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && this.refinery) {
        const finishedCount = this.processRefinery(Date.now());
        if (finishedCount > 0) {
          soundFx.playSmelt();
          this.scene.events.emit('notify', `🔥 Raffinerie: ${finishedCount} Barren während deiner Abwesenheit veredelt!`);
          if (this.isRefineryModalOpen) {
            this.renderRefineryModalBody();
          }
        }
      }
    });
  }

  update(delta) {
    const dt = delta / 1000;

    // Steineforscher Zustand & Lauf-Verhalten
    if (this.sammlerSprite && this.sammlerBubble) {
      if (this.sammlerState === 'WAITING') {
        // Wartet am Hangar
        this.sammlerTimer -= dt;
        this.sammlerSprite.setPosition(this.sammlerWaitX, 0);
        this.sammlerSprite.setVisible(true);
        this.sammlerBubble.setVisible(true);
        this.sammlerBubble.x = this.sammlerWaitX;

        if (this.sammlerTimer <= 0) {
          // Geht wieder auf Expedition
          this.sammlerState = 'WALKING_OUT';
          this.sammlerSprite.setFlipX(false); // Schaut nach rechts beim Weggehen
        }
      } else if (this.sammlerState === 'WALKING_OUT') {
        // Läuft nach rechts weg
        this.sammlerSprite.x += this.sammlerWalkSpeed * dt;
        this.sammlerBubble.x = this.sammlerSprite.x;
        if (this.sammlerSprite.x >= this.sammlerSpawnX) {
          // Außer Sicht: Ist unterwegs
          this.sammlerState = 'AWAY';
          this.sammlerTimer = this.sammlerAwayDuration;
          this.sammlerSprite.setVisible(false);
          this.sammlerBubble.setVisible(false);
        }
      } else if (this.sammlerState === 'AWAY') {
        // Nicht da - Timer bis zur nächsten Ankunft läuft
        this.sammlerTimer -= dt;
        this.sammlerSprite.setVisible(false);
        this.sammlerBubble.setVisible(false);
        if (this.sammlerTimer <= 0) {
          // Kommt angelaufen!
          this.sammlerState = 'WALKING_IN';
          this.sammlerSprite.setPosition(this.sammlerSpawnX, 0);
          this.sammlerSprite.setVisible(true);
          this.sammlerSprite.setFlipX(true); // Schaut nach links zum Hangar
          this.sammlerBubble.setVisible(true);
          this.sammlerBubble.x = this.sammlerSpawnX;
          this.scene.events.emit('notify', 'Der Steineforscher ist am Hangar eingetroffen und sucht Gesteinsproben!');
        }
      } else if (this.sammlerState === 'WALKING_IN') {
        // Läuft von rechts zum Hangar
        this.sammlerSprite.x -= this.sammlerWalkSpeed * dt;
        this.sammlerBubble.x = this.sammlerSprite.x;
        if (this.sammlerSprite.x <= this.sammlerWaitX) {
          this.sammlerSprite.x = this.sammlerWaitX;
          this.sammlerBubble.x = this.sammlerWaitX;
          this.sammlerState = 'WAITING';
          this.sammlerTimer = this.sammlerWaitDuration;
        }
      }
    }

    // Kaufbare Gebäude Ticks
    this.purchasableBuildings.forEach((pb) => {
      if (!pb.isBuilt) return;

      // 1. Drohnen-Hangar: Bringt alle 18 Sekunden Erze
      if (pb.id === 'drone_hangar') {
        pb.timer = (pb.timer || 0) + dt;
        if (pb.timer >= 18) {
          pb.timer = 0;
          const randomOres = ['coal', 'copper', 'iron', 'tin'];
          const picked = randomOres[Math.floor(Math.random() * randomOres.length)];
          pb.storedOres = pb.storedOres || [];
          if (pb.storedOres.length < 12) {
            pb.storedOres.push(picked);
          }
        }
      }

      // 2. Geothermie-Kraftwerk: +€35 alle 8 Sekunden
      if (pb.id === 'powerplant') {
        pb.timer = (pb.timer || 0) + dt;
        if (pb.timer >= 8) {
          pb.timer = 0;
          this.player.cash += 35;
          pb.accumulatedCash = (pb.accumulatedCash || 0) + 35;
        }
      }
    });

    // 3. Raffinerie: Zeitgesteuerte Veredelung anhand der echten Geräte-Uhrzeit
    const finishedCount = this.processRefinery(Date.now());
    if (finishedCount > 0) {
      soundFx.playSmelt();
      if (this.isRefineryModalOpen) {
        this.renderRefineryModalBody();
      }
    }
  }

  openModal(title, contentHtml) {
    if (!this.modalEl || !this.modalTitleEl || !this.modalBodyEl) return;
    this.modalTitleEl.innerHTML = title;
    this.modalBodyEl.innerHTML = contentHtml;
    this.modalEl.style.display = 'flex';
    refreshIcons(this.modalEl);
    if (this.scene && this.scene.hud) {
      this.scene.hud.update();
    }
  }

  closeModal() {
    notifyModalClosed();
    this.isRefineryModalOpen = false;
    this.isDepotModalOpen = false;
    if (this.refineryUiInterval) {
      clearInterval(this.refineryUiInterval);
      this.refineryUiInterval = null;
    }
    if (this.modalEl) {
      this.modalEl.style.display = 'none';
    }
    if (this.scene) {
      this.scene.isPaused = false;
      if (this.scene.hud) {
        this.scene.hud.isPauseMenuOpen = false;
      }
    }
  }

  // Alias für Hangar / Werkstatt
  openHangarModal() {
    this.openDockModal();
  }

  // =========================================================
  // 1. ERZ-BÖRSE (FREIE MENGENWAHL MIT STEPPER & DIREKT-EINGABE)
  // =========================================================
  // =========================================================
  // 1. ERZ-BÖRSE (EINHEITLICHES INVENTAR OHNE STANDORT-TRENNUNG)
  // =========================================================
  openMarketModal() {
    const cargo = this.player.cargo || [];
    const depotOres = this.depot?.ores || {};

    // Summe aller Erze (Fracht + Depot) ermitteln
    const combinedCounts = {};
    cargo.forEach((ore) => {
      combinedCounts[ore] = (combinedCounts[ore] || 0) + 1;
    });
    for (const [ore, count] of Object.entries(depotOres)) {
      if (count > 0) {
        combinedCounts[ore] = (combinedCounts[ore] || 0) + count;
      }
    }

    let totalOreValue = 0;
    let totalOreCount = 0;
    for (const [ore, count] of Object.entries(combinedCounts)) {
      if (count > 0 && ORE_DATA[ore]) {
        totalOreValue += ORE_DATA[ore].value * count;
        totalOreCount += count;
      }
    }

    let oreListHtml = '';
    if (totalOreCount === 0) {
      oreListHtml = '<p style="color: #94a3b8; font-style: italic; margin: 18px 0; text-align: center;">Keine Erze im Frachtraum oder Depot vorhanden. Baue Erze im Schacht ab!</p>';
    } else {
      oreListHtml = '<div style="display: flex; flex-direction: column; gap: 10px; margin: 12px 0; max-height: 280px; overflow-y: auto; padding-right: 4px;">';
      for (const [ore, count] of Object.entries(combinedCounts)) {
        if (count <= 0) continue;
        const data = ORE_DATA[ore];
        const val = data ? data.value : 0;
        oreListHtml += `
          <div class="market-ore-card" data-ore="${ore}" style="background: #141c2b; padding: 10px 14px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.07); display: flex; flex-direction: column; gap: 8px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-weight: 700; color: #f8fafc; font-size: 13.5px; display: inline-flex; align-items: center; gap: 6px;">${oreIcon(ore, 16)} ${data.name}</span>
                <span style="background: rgba(56, 189, 248, 0.15); border: 1px solid rgba(56, 189, 248, 0.3); padding: 2px 8px; border-radius: 6px; font-size: 11px; color: #38bdf8; font-weight: 700;">${count}x</span>
                <span style="font-size: 11px; color: #94a3b8;">(€${val}/Stk)</span>
              </div>
              <div style="display: flex; align-items: center; gap: 4px;">
                <strong class="ore-subtotal" id="subtotal-${ore}" style="color: #fbbf24; font-size: 13.5px; font-weight: 800;">€${(val * count).toLocaleString()}</strong>
              </div>
            </div>

            <!-- Freie Mengenwahl: Einheitliche Höhe 32px, zentriertes Plus/Minus, 3D Look -->
            <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px; background: rgba(0,0,0,0.3); padding: 8px 12px; border-radius: 10px;">
              <div style="display: flex; align-items: center; gap: 6px;">
                <span style="font-size: 11.5px; color: #94a3b8; font-weight: 700; margin-right: 2px;">Menge:</span>
                
                <button class="btn-qty-step btn-3d-secondary" data-ore="${ore}" data-step="-1" style="
                  width: 32px; height: 32px; padding: 0; box-sizing: border-box;
                  display: inline-flex; align-items: center; justify-content: center;
                  font-size: 17px; font-weight: 800; border-radius: 8px; line-height: 1;
                ">-</button>
                
                <input type="number" class="input-ore-qty" id="qty-input-${ore}" data-ore="${ore}" data-unit-val="${val}" data-max="${count}" min="1" max="${count}" value="${count}" style="
                  width: 50px; height: 32px; padding: 0 4px; box-sizing: border-box;
                  background: #090d16; border: 1px solid rgba(255,255,255,0.18); border-radius: 8px;
                  color: #f8fafc; text-align: center; font-weight: 800; font-size: 13px;
                  display: inline-flex; align-items: center; justify-content: center;
                  outline: none; line-height: 30px;
                ">
                
                <button class="btn-qty-step btn-3d-secondary" data-ore="${ore}" data-step="1" style="
                  width: 32px; height: 32px; padding: 0; box-sizing: border-box;
                  display: inline-flex; align-items: center; justify-content: center;
                  font-size: 17px; font-weight: 800; border-radius: 8px; line-height: 1;
                ">+</button>
                
                <button class="btn-qty-quick btn-3d-secondary" data-ore="${ore}" data-set="1" style="
                  height: 32px; padding: 0 10px; box-sizing: border-box;
                  font-size: 11.5px; font-weight: 700; border-radius: 8px;
                  display: inline-flex; align-items: center; justify-content: center; line-height: 1;
                ">1x</button>
                <button class="btn-qty-quick btn-action" data-ore="${ore}" data-set="${count}" style="
                  height: 32px; padding: 0 10px; box-sizing: border-box;
                  font-size: 11.5px; font-weight: 700; border-radius: 8px;
                  display: inline-flex; align-items: center; justify-content: center; line-height: 1;
                ">Alle (${count})</button>
              </div>

              <button class="btn-sell-custom btn-buy" data-ore="${ore}" style="
                height: 32px; padding: 0 14px; box-sizing: border-box;
                font-size: 12px; font-weight: 800;
                display: inline-flex; align-items: center; justify-content: center; gap: 6px;
              ">
                ${icon('coins', '', 14)}
                <span id="btn-sell-text-${ore}">Verkaufen</span>
              </button>
            </div>
          </div>
        `;
      }
      oreListHtml += '</div>';
    }

    // Fabrik-Produkte & Barren (aus Bohrer-Inventar und Depot-Lager summiert)
    let factoryHtml = '';
    const fp = this.player.factoryProducts || {};
    const dp = this.depot?.products || {};
    const allProductKeys = Array.from(new Set([
      ...Object.keys(FACTORY_PRODUCTS),
      ...Object.keys(fp),
      ...Object.keys(dp)
    ])).filter(k => ((fp[k] || 0) + (dp[k] || 0)) > 0);

    const hasAnyFp = allProductKeys.length > 0;
    let totalFpValue = 0;

    let fpListHtml = '';
    if (!hasAnyFp) {
      fpListHtml = '<p style="color: #64748b; font-style: italic; margin: 10px 0; text-align: center; font-size: 12px;">Keine Fabrik-Waren oder Barren auf Lager. Fertige Erzeugnisse in der FABRIK, um hier Spitzenpreise zu erzielen!</p>';
    } else {
      fpListHtml = '<div style="display: flex; flex-direction: column; gap: 8px; margin: 8px 0;">';
      for (const prodId of allProductKeys) {
        const pCount = fp[prodId] || 0;
        const dCount = dp[prodId] || 0;
        const count = pCount + dCount;
        if (count <= 0) continue;
        const isBar = prodId.startsWith('bar_');
        let prodName = '';
        let val = 0;
        let iconHtml = '';

        if (isBar) {
          const rawKey = prodId.replace('bar_', '');
          prodName = getRefinedOreName(rawKey);
          val = getRefinedOreNetValue(rawKey);
          iconHtml = itemDisplayIcon(prodId, 16);
        } else if (FACTORY_PRODUCTS[prodId]) {
          prodName = FACTORY_PRODUCTS[prodId].name;
          val = FACTORY_PRODUCTS[prodId].value;
          iconHtml = itemDisplayIcon(prodId, 16);
        } else {
          prodName = prodId;
          val = 0;
          iconHtml = itemDisplayIcon(prodId, 16);
        }

        const subtotal = count * val;
        totalFpValue += subtotal;

        fpListHtml += `
          <div class="market-fp-card" data-prod="${prodId}" style="background: #141c2b; padding: 10px 14px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.07); display: flex; flex-direction: column; gap: 8px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="display: inline-flex; align-items: center; justify-content: center; width: 26px; height: 26px; background: rgba(56,189,248,0.15); border-radius: 6px; color: #38bdf8;">
                  ${iconHtml}
                </span>
                <span style="font-weight: 700; color: #f8fafc; font-size: 13.5px;">${prodName}</span>
                <span style="background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.3); padding: 2px 8px; border-radius: 6px; font-size: 11px; color: #10b981; font-weight: 700;">${count}x</span>
                <span style="font-size: 11px; color: #94a3b8;">(€${val}/Stk)</span>
              </div>
              <div style="display: flex; align-items: center; gap: 4px;">
                <strong class="fp-subtotal" id="subtotal-fp-${prodId}" style="color: #fbbf24; font-size: 13.5px; font-weight: 800;">€${subtotal.toLocaleString()}</strong>
              </div>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px; background: rgba(0,0,0,0.3); padding: 8px 12px; border-radius: 10px;">
              <div style="display: flex; align-items: center; gap: 6px;">
                <span style="font-size: 11.5px; color: #94a3b8; font-weight: 700;">Menge:</span>
                <button class="btn-fp-qty-step btn-3d-secondary" data-prod="${prodId}" data-step="-1" style="width: 32px; height: 32px; padding: 0; box-sizing: border-box; display: inline-flex; align-items: center; justify-content: center; font-size: 17px; font-weight: 800; border-radius: 8px;">-</button>
                <input type="number" class="input-fp-qty" id="qty-input-fp-${prodId}" data-prod="${prodId}" data-unit-val="${val}" data-max="${count}" min="1" max="${count}" value="${count}" style="width: 50px; height: 32px; padding: 0 4px; box-sizing: border-box; background: #090d16; border: 1px solid rgba(255,255,255,0.18); border-radius: 8px; color: #f8fafc; text-align: center; font-weight: 800; font-size: 13px; outline: none;">
                <button class="btn-fp-qty-step btn-3d-secondary" data-prod="${prodId}" data-step="1" style="width: 32px; height: 32px; padding: 0; box-sizing: border-box; display: inline-flex; align-items: center; justify-content: center; font-size: 17px; font-weight: 800; border-radius: 8px;">+</button>
                <button class="btn-fp-qty-quick btn-3d-secondary" data-prod="${prodId}" data-set="1" style="height: 32px; padding: 0 10px; font-size: 11.5px; font-weight: 700; border-radius: 8px;">1x</button>
                <button class="btn-fp-qty-quick btn-action" data-prod="${prodId}" data-set="${count}" style="height: 32px; padding: 0 10px; font-size: 11.5px; font-weight: 700; border-radius: 8px;">Alle (${count})</button>
              </div>
              <button class="btn-sell-fp-custom btn-buy" data-prod="${prodId}" style="height: 32px; padding: 0 14px; font-size: 12px; font-weight: 800; display: inline-flex; align-items: center; gap: 6px;">
                ${icon('coins', '', 14)}
                <span id="btn-sell-fp-text-${prodId}">Verkaufen</span>
              </button>
            </div>
          </div>
        `;
      }
      fpListHtml += '</div>';
    }

    factoryHtml = `
      <div style="background: rgba(15, 23, 42, 0.7); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 12px; margin-top: 14px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
          <strong style="color: #38bdf8; font-size: 13px; display: inline-flex; align-items: center; gap: 6px;">
            ${icon('container', '', 15)} FABRIK-ERZEUGNISSE & BARREN
          </strong>
          <span style="color: #fbbf24; font-size: 13px; font-weight: 700;">Warenwert: €${totalFpValue.toLocaleString()}</span>
        </div>
        ${fpListHtml}
        ${hasAnyFp ? `
          <button id="btn-sell-all-fp" class="btn-buy btn-lg" style="width: 100%; margin-top: 6px;">
            ${icon('coins', '', 15)} Fabrik-Waren verkaufen (€${totalFpValue.toLocaleString()})
          </button>
        ` : ''}
      </div>
    `;

    const content = `
      <div style="background: rgba(15, 23, 42, 0.7); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 12px;">
        <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 4px;">
          <strong style="color: #38bdf8; font-size: 13px; display: inline-flex; align-items: center; gap: 6px;">
            ${icon('coins', '', 15)} ROHERZE & MINERALIEN (${totalOreCount} Erze verfügbar)
          </strong>
          <strong style="color: #fbbf24; font-size: 14px; font-weight: 800;">Gesamtwert: €${totalOreValue.toLocaleString()}</strong>
        </div>
        ${oreListHtml}
        ${totalOreCount > 0 ? `
          <button id="btn-sell-all-ores" class="btn-buy btn-lg" style="width: 100%; margin-top: 6px;">
            ${icon('coins', '', 15)} Alle Erze verkaufen (€${totalOreValue.toLocaleString()})
          </button>
        ` : ''}
      </div>
      ${factoryHtml}
    `;

    this.openModal(`
      <div style="display: flex; align-items: center; gap: 8px;">
        ${icon('coins', '', 18)}
        <span>ERZBÖRSE</span>
      </div>
    `, content);

    // Mengen-Aktualisierungshelfer (Erze)
    const updateOreQty = (ore, newQty) => {
      const input = document.getElementById(`qty-input-${ore}`);
      const subtotalEl = document.getElementById(`subtotal-${ore}`);
      const btnSellText = document.getElementById(`btn-sell-text-${ore}`);
      if (!input || !subtotalEl) return;
      const max = parseInt(input.getAttribute('data-max'), 10) || 1;
      const val = parseInt(input.getAttribute('data-unit-val'), 10) || 0;
      const clamped = Math.max(1, Math.min(max, parseInt(newQty, 10) || 1));
      input.value = clamped;
      subtotalEl.innerText = `€${(clamped * val).toLocaleString()}`;
      if (btnSellText) btnSellText.innerText = 'Verkaufen';
    };

    // Stepper Plus/Minus
    document.querySelectorAll('.btn-qty-step').forEach((btn) => {
      btn.onclick = () => {
        const ore = btn.getAttribute('data-ore');
        const step = parseInt(btn.getAttribute('data-step'), 10) || 0;
        const input = document.getElementById(`qty-input-${ore}`);
        if (!input) return;
        const cur = parseInt(input.value, 10) || 1;
        updateOreQty(ore, cur + step);
      };
    });

    // Quick Buttons (1x, Alle)
    document.querySelectorAll('.btn-qty-quick').forEach((btn) => {
      btn.onclick = () => {
        const ore = btn.getAttribute('data-ore');
        const setVal = parseInt(btn.getAttribute('data-set'), 10) || 1;
        updateOreQty(ore, setVal);
      };
    });

    // Direkte Tastatureingabe im Number-Input
    document.querySelectorAll('.input-ore-qty').forEach((input) => {
      input.oninput = () => {
        const ore = input.getAttribute('data-ore');
        updateOreQty(ore, input.value);
      };
    });

    // Individueller Verkauf mit gewählter Stückzahl (aus Fracht und Depot)
    document.querySelectorAll('.btn-sell-custom').forEach((btn) => {
      btn.onclick = () => {
        const ore = btn.getAttribute('data-ore');
        const input = document.getElementById(`qty-input-${ore}`);
        const qty = input ? parseInt(input.value, 10) || 1 : 1;
        const earned = this.sellMarketOreFromPlayerOrDepot(ore, qty);
        if (earned > 0) {
          soundFx.playPurchase();
          this.openMarketModal();
          this.scene.events.emit('notify', `${qty}x ${ORE_DATA[ore]?.name || ore} verkauft für +€${earned.toLocaleString()}!`);
        }
      };
    });

    // Gesamtverkauf aller Erze (Fracht + Depot)
    const btnSellAllOres = document.getElementById('btn-sell-all-ores');
    if (btnSellAllOres) {
      btnSellAllOres.onclick = () => {
        const res = this.sellAllMarketOres();
        if (res.totalEarned > 0) {
          soundFx.playPurchase();
          this.openMarketModal();
          this.scene.events.emit('notify', `${res.totalCount} Erze vollständig verkauft für +€${res.totalEarned.toLocaleString()}!`);
        }
      };
    }

    // Fabrik-Produkte Mengenhelfer
    const updateFpQty = (prodId, newQty) => {
      const input = document.getElementById(`qty-input-fp-${prodId}`);
      const subtotalEl = document.getElementById(`subtotal-fp-${prodId}`);
      const btnSellText = document.getElementById(`btn-sell-fp-text-${prodId}`);
      if (!input || !subtotalEl) return;
      const max = parseInt(input.getAttribute('data-max'), 10) || 1;
      const val = parseInt(input.getAttribute('data-unit-val'), 10) || 0;
      const clamped = Math.max(1, Math.min(max, parseInt(newQty, 10) || 1));
      input.value = clamped;
      subtotalEl.innerText = `€${(clamped * val).toLocaleString()}`;
      if (btnSellText) btnSellText.innerText = 'Verkaufen';
    };

    // Fabrik Stepper
    document.querySelectorAll('.btn-fp-qty-step').forEach(btn => {
      btn.onclick = () => {
        const prod = btn.getAttribute('data-prod');
        const step = parseInt(btn.getAttribute('data-step'), 10) || 0;
        const input = document.getElementById(`qty-input-fp-${prod}`);
        if (!input) return;
        const cur = parseInt(input.value, 10) || 1;
        updateFpQty(prod, cur + step);
      };
    });

    // Fabrik Quick Buttons
    document.querySelectorAll('.btn-fp-qty-quick').forEach(btn => {
      btn.onclick = () => {
        const prod = btn.getAttribute('data-prod');
        const setVal = parseInt(btn.getAttribute('data-set'), 10) || 1;
        updateFpQty(prod, setVal);
      };
    });

    document.querySelectorAll('.input-fp-qty').forEach(input => {
      input.oninput = () => {
        const prod = input.getAttribute('data-prod');
        updateFpQty(prod, input.value);
      };
    });

    // Einzelverkauf Fabrik-Produkt / Barren (aus Inventar & Depot)
    document.querySelectorAll('.btn-sell-fp-custom').forEach(btn => {
      btn.onclick = () => {
        const prodId = btn.getAttribute('data-prod');
        const input = document.getElementById(`qty-input-fp-${prodId}`);
        const qty = input ? parseInt(input.value, 10) || 1 : 1;
        const earned = this.sellMarketProductFromPlayerOrDepot(prodId, qty);
        if (earned > 0) {
          soundFx.playPurchase();
          this.openMarketModal();
          const displayName = prodId.startsWith('bar_')
            ? getRefinedOreName(prodId.replace('bar_', ''))
            : (FACTORY_PRODUCTS[prodId]?.name || prodId);
          this.scene.events.emit('notify', `${qty}x ${displayName} verkauft für +€${earned.toLocaleString()}!`);
        }
      };
    });

    // Gesamtverkauf aller Fabrik- & Veredelungs-Waren
    const btnSellAllFp = document.getElementById('btn-sell-all-fp');
    if (btnSellAllFp) {
      btnSellAllFp.onclick = () => {
        let totalEarned = 0;
        const allKeys = Array.from(new Set([
          ...Object.keys(FACTORY_PRODUCTS),
          ...Object.keys(this.player.factoryProducts || {}),
          ...Object.keys(this.depot?.products || {})
        ]));
        for (const prodId of allKeys) {
          const avail = (this.player.factoryProducts?.[prodId] || 0) + (this.depot?.products?.[prodId] || 0);
          if (avail > 0) {
            totalEarned += this.sellMarketProductFromPlayerOrDepot(prodId, avail);
          }
        }
        if (totalEarned > 0) {
          soundFx.playPurchase();
          this.openMarketModal();
          this.scene.events.emit('notify', `Alle Industrie- & Veredelungswaren verkauft für +€${totalEarned.toLocaleString()}!`);
        }
      };
    }
  }

  sellMarketOreFromPlayerOrDepot(oreKey, count = 1) {
    if (!this.player.cargo) this.player.cargo = [];
    if (!this.depot) this.depot = {};
    if (!this.depot.ores) this.depot.ores = {};

    const inCargo = this.player.cargo.filter(k => k === oreKey).length;
    const inDepot = this.depot.ores[oreKey] || 0;
    const totalAvail = inCargo + inDepot;
    const toSell = Math.max(0, Math.min(totalAvail, count));
    if (toSell <= 0) return 0;

    let remainingToSell = toSell;

    // 1. Erst aus Frachtraum verkaufen
    while (remainingToSell > 0) {
      const idx = this.player.cargo.indexOf(oreKey);
      if (idx !== -1) {
        this.player.cargo.splice(idx, 1);
        remainingToSell--;
      } else {
        break;
      }
    }

    // 2. Rest aus Depot verkaufen
    if (remainingToSell > 0 && this.depot.ores[oreKey] > 0) {
      const fromDepot = Math.min(remainingToSell, this.depot.ores[oreKey]);
      this.depot.ores[oreKey] -= fromDepot;
      remainingToSell -= fromDepot;
    }

    const val = ORE_DATA[oreKey]?.value || 0;
    const earned = Math.round(toSell * val);
    this.player.cash += earned;
    this.player.stats.totalCashEarned = (this.player.stats.totalCashEarned || 0) + earned;
    if (this.scene.hud) this.scene.hud.update();
    return earned;
  }

  sellAllMarketOres() {
    let totalEarned = 0;
    let totalCount = 0;

    // Aus Frachtraum
    const cargo = this.player.cargo || [];
    for (const ore of cargo) {
      if (ORE_DATA[ore]) {
        totalEarned += ORE_DATA[ore].value;
        totalCount++;
      }
    }
    this.player.cargo = [];

    // Aus Depot
    if (this.depot?.ores) {
      for (const [ore, count] of Object.entries(this.depot.ores)) {
        if (count > 0 && ORE_DATA[ore]) {
          totalEarned += ORE_DATA[ore].value * count;
          totalCount += count;
        }
      }
      this.depot.ores = {};
    }

    if (totalEarned > 0) {
      this.player.cash += totalEarned;
      this.player.stats.totalCashEarned = (this.player.stats.totalCashEarned || 0) + totalEarned;
      if (this.scene.hud) this.scene.hud.update();
    }
    return { totalEarned, totalCount };
  }

  sellMarketProductFromPlayerOrDepot(prodId, count = 1) {
    if (!this.player.factoryProducts) this.player.factoryProducts = {};
    if (!this.depot) this.depot = {};
    if (!this.depot.products) this.depot.products = {};

    const inPlayer = this.player.factoryProducts[prodId] || 0;
    const inDepot = this.depot.products[prodId] || 0;
    const totalAvail = inPlayer + inDepot;
    const toSell = Math.max(0, Math.min(totalAvail, count));
    if (toSell <= 0) return 0;

    const fromPlayer = Math.min(inPlayer, toSell);
    const fromDepot = toSell - fromPlayer;

    if (fromPlayer > 0) {
      this.player.factoryProducts[prodId] = inPlayer - fromPlayer;
    }
    if (fromDepot > 0) {
      this.depot.products[prodId] = inDepot - fromDepot;
    }

    let val = 0;
    if (FACTORY_PRODUCTS[prodId]) {
      val = FACTORY_PRODUCTS[prodId].value;
    } else if (prodId.startsWith('bar_')) {
      const rawKey = prodId.replace('bar_', '');
      val = getRefinedOreNetValue(rawKey);
    } else {
      val = ORE_DATA[prodId]?.value || 0;
    }

    const earned = Math.round(toSell * val);
    this.player.cash += earned;
    this.player.stats.totalCashEarned = (this.player.stats.totalCashEarned || 0) + earned;
    if (this.scene.hud) this.scene.hud.update();
    return earned;
  }

  // =========================================================
  // 1B. ROHSTOFF- & WAREN-DEPOT (ZWISCHENLAGER AN DER OBERFLÄCHE)
  // =========================================================
  getDepotTotalCount() {
    let count = 0;
    if (this.depot && this.depot.ores) {
      for (const c of Object.values(this.depot.ores)) count += (c || 0);
    }
    if (this.depot && this.depot.products) {
      for (const c of Object.values(this.depot.products)) count += (c || 0);
    }
    return count;
  }

  getDepotTotalValue() {
    let val = 0;
    if (this.depot && this.depot.ores) {
      for (const [k, c] of Object.entries(this.depot.ores)) {
        if (c > 0 && ORE_DATA[k]) val += ORE_DATA[k].value * c;
      }
    }
    if (this.depot && this.depot.products) {
      for (const [k, c] of Object.entries(this.depot.products)) {
        if (c > 0) {
          if (FACTORY_PRODUCTS[k]) {
            val += FACTORY_PRODUCTS[k].value * c;
          } else if (k.startsWith('bar_')) {
            const rawKey = k.replace('bar_', '');
            val += getRefinedOreNetValue(rawKey) * c;
          }
        }
      }
    }
    return val;
  }

  getDepotSaveData() {
    return {
      ores: { ...(this.depot?.ores || {}) },
      products: { ...(this.depot?.products || {}) },
      capacity: this.depot?.capacity || 10,
      tier: this.depot?.tier || 1
    };
  }

  loadDepotSaveData(data) {
    if (!data) return;
    if (!this.depot) this.depot = {};
    this.depot.ores = { ...(data.ores || {}) };
    this.depot.products = { ...(data.products || {}) };
    this.depot.tier = data.tier || 1;

    const tierInfo = DEPOT_TIERS.find(t => t.tier === this.depot.tier) || DEPOT_TIERS[0];
    if (!data.capacity || (this.depot.tier === 1 && data.capacity === 150)) {
      this.depot.capacity = tierInfo.capacity;
    } else {
      this.depot.capacity = data.capacity;
    }
    this.depot.currentTab = 'ores';
  }

  openDepotModal() {
    this.isDepotModalOpen = true;
    if (!this.depot) {
      this.depot = { ores: {}, products: {}, capacity: 10, tier: 1 };
    }
    this.renderDepotModal();
  }

  renderDepotModal() {
    if (!this.modalEl || !this.modalTitleEl || !this.modalBodyEl) return;

    this.modalTitleEl.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px; color: #38bdf8;">
        ${icon('warehouse', '', 18)}
        <span>ROHSTOFF- & WAREN-DEPOT</span>
      </div>
    `;

    const totalStored = this.getDepotTotalCount();
    const capacity = this.depot.capacity || 10;
    const occPct = Math.min(100, Math.round((totalStored / capacity) * 100));
    const isFull = totalStored >= capacity;
    const totalVal = this.getDepotTotalValue();
    const freeDepot = Math.max(0, capacity - totalStored);

    // Erzzählung im Laderaum des Bohrers
    const cargoOreCounts = {};
    let playerCargoBarCount = 0;
    (this.player.cargo || []).forEach(item => {
      if (typeof item === 'string' && item.startsWith('bar_')) {
        playerCargoBarCount++;
      } else {
        cargoOreCounts[item] = (cargoOreCounts[item] || 0) + 1;
      }
    });
    const playerCargoOreLength = Object.values(cargoOreCounts).reduce((s, v) => s + v, 0);

    const playerProducts = this.player.factoryProducts || {};
    const totalPlayerProdCount = Object.values(playerProducts).reduce((s, v) => s + v, 0) + playerCargoBarCount;
    const totalPlayerItems = playerCargoOreLength + totalPlayerProdCount;

    const currentTier = this.depot.tier || 1;
    const nextTierData = DEPOT_TIERS.find(t => t.tier === currentTier + 1);

    let canAffordDepotComp = true;
    if (nextTierData && nextTierData.costComp) {
      for (const [compKey, need] of Object.entries(nextTierData.costComp)) {
        if ((this.player.components[compKey] || 0) < need) canAffordDepotComp = false;
      }
    }
    const canAffordDepot = nextTierData && (this.player.cash >= nextTierData.costCash) && canAffordDepotComp;

    // Kopfzeile: Statusanzeige, Auslastungsbalken & Ausbau-Aktion
    let upgradeSnippetHtml = '';
    if (nextTierData) {
      const compBadgesHtml = nextTierData.costComp ? Object.entries(nextTierData.costComp).map(([compKey, need]) => {
        const have = this.player.components[compKey] || 0;
        const isMet = have >= need;
        const compIconName = COMPONENT_ICONS[compKey] || 'box';
        const compNames = {
          hydraulic_part: 'Hydraulik-Zylinder',
          titan_alloy: 'Titan-Legierung',
          laser_lens: 'Kristall-Fokuslinse',
          quantum_chip: 'Quanten-Steuerkern'
        };
        const cName = compNames[compKey] || compKey;
        return `
          <span style="background: rgba(192, 132, 252, 0.12); border: 1px solid ${isMet ? 'rgba(192, 132, 252, 0.3)' : 'rgba(239, 68, 68, 0.4)'}; color: ${isMet ? '#c084fc' : '#ef4444'}; font-weight: 700; font-size: 11px; padding: 2px 7px; border-radius: 6px; display: inline-flex; align-items: center; gap: 4px; white-space: nowrap;">
            ${icon(compIconName, '', 11)} ${need}x ${cName} <span style="font-size: 9.5px; opacity: 0.85; font-variant-numeric: tabular-nums;">(${have}/${need})</span>
          </span>
        `;
      }).join('') : '';

      upgradeSnippetHtml = `
        <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(0,0,0,0.35); border: 1px solid rgba(255,255,255,0.06); padding: 8px 12px; border-radius: 8px; gap: 10px; flex-wrap: wrap;">
          <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
            <strong style="color: #38bdf8; font-size: 12px;">Nächste Stufe ${nextTierData.tier}: ${nextTierData.label}</strong>
            <span style="background: rgba(56, 189, 248, 0.15); border: 1px solid rgba(56, 189, 248, 0.3); color: #38bdf8; font-weight: 800; font-size: 11px; padding: 1px 7px; border-radius: 6px;">
              ${nextTierData.capacity} Plätze
            </span>
          </div>
          <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
            <span style="background: rgba(251, 191, 36, 0.12); border: 1px solid ${this.player.cash >= nextTierData.costCash ? 'rgba(251, 191, 36, 0.3)' : 'rgba(239, 68, 68, 0.4)'}; color: ${this.player.cash >= nextTierData.costCash ? '#fbbf24' : '#ef4444'}; font-weight: 800; font-size: 11px; padding: 2px 8px; border-radius: 6px; display: inline-flex; align-items: center; gap: 4px; font-variant-numeric: tabular-nums;">
              ${icon('coins', '', 11)} €${nextTierData.costCash.toLocaleString()}
            </span>
            ${compBadgesHtml}
            <button id="btn-depot-upgrade" class="btn-buy" style="height: 28px; padding: 0 12px; font-size: 11px; font-weight: 800; display: inline-flex; align-items: center; gap: 5px;" ${canAffordDepot ? '' : 'disabled'}>
              ${icon('wrench', '', 12)}
              <span>Ausbauen</span>
            </button>
          </div>
        </div>
      `;
    } else {
      upgradeSnippetHtml = `
        <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 8px; padding: 6px 12px; text-align: center; color: #10b981; font-weight: 800; font-size: 11.5px;">
          MAXIMALER DEPOT-AUSBAU ERREICHT (${capacity} PLÄTZE)
        </div>
      `;
    }

    const headerHtml = `
      <div style="
        background: rgba(15, 23, 42, 0.85);
        border: 1px solid ${isFull ? 'rgba(239, 68, 68, 0.5)' : 'rgba(56, 189, 248, 0.25)'};
        border-radius: 12px;
        padding: 10px 14px;
        display: flex;
        flex-direction: column;
        gap: 8px;
        box-sizing: border-box;
      ">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 6px;">
          <div style="display: flex; align-items: center; gap: 6px;">
            <span style="font-weight: 800; color: #f8fafc; font-size: 13px; letter-spacing: 0.5px;">LAGERKAPAZITÄT</span>
            <span style="background: rgba(56, 189, 248, 0.15); border: 1px solid rgba(56, 189, 248, 0.3); color: #38bdf8; font-size: 10.5px; font-weight: 800; padding: 1px 7px; border-radius: 99px;">
              STUFE ${this.depot.tier || 1}
            </span>
            ${isFull ? `<span style="background: #ef4444; color: #ffffff; font-size: 9.5px; font-weight: 800; padding: 1px 6px; border-radius: 4px;">VOLL</span>` : ''}
          </div>
          <div style="display: flex; align-items: center; gap: 10px; font-size: 11px; font-weight: 700;">
            <span style="color: ${isFull ? '#ef4444' : '#f8fafc'}; font-variant-numeric: tabular-nums;">
              ${totalStored} / ${capacity} Plätze belegt (${occPct}%)
            </span>
            <span style="color: #fbbf24; display: inline-flex; align-items: center; gap: 3px; font-variant-numeric: tabular-nums;">
              ${icon('coins', '', 12)} Wert: +€${totalVal.toLocaleString()}
            </span>
          </div>
        </div>

        <div style="height: 6px; background: rgba(0,0,0,0.6); border-radius: 99px; overflow: hidden; border: 1px solid rgba(255,255,255,0.1);">
          <div style="width: ${occPct}%; height: 100%; background: ${isFull ? '#ef4444' : occPct >= 80 ? '#f59e0b' : '#38bdf8'}; border-radius: 99px; transition: width 0.2s ease;"></div>
        </div>

        ${upgradeSnippetHtml}
      </div>
    `;

    // Action Header über dem Grid
    const actionsHtml = `
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; margin-top: 2px;">
        <span style="font-size: 11.5px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; display: inline-flex; align-items: center; gap: 5px;">
          ${icon('warehouse', '', 13)} Depot-Inventar (${totalStored}/${capacity})
        </span>
        <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
          <button id="btn-depot-all-ores" class="btn-action" style="height: 28px; font-size: 11px; font-weight: 800; padding: 0 10px; display: inline-flex; align-items: center; gap: 4px;" ${playerCargoOreLength > 0 && freeDepot > 0 ? '' : 'disabled'}>
            ${icon('stone', '', 12)}
            <span>Erze (${playerCargoOreLength})</span>
          </button>
          <button id="btn-depot-all-products" class="btn-action" style="height: 28px; font-size: 11px; font-weight: 800; padding: 0 10px; display: inline-flex; align-items: center; gap: 4px;" ${totalPlayerProdCount > 0 && freeDepot > 0 ? '' : 'disabled'}>
            ${icon('layers', '', 12)}
            <span>Waren (${totalPlayerProdCount})</span>
          </button>
          <button id="btn-depot-all" class="btn-buy" style="height: 28px; font-size: 11px; font-weight: 800; padding: 0 12px; display: inline-flex; align-items: center; gap: 5px;" ${totalPlayerItems > 0 && freeDepot > 0 ? '' : 'disabled'}>
            ${icon('arrow-down-to-line', '', 12)}
            <span>Alle einlagern (${totalPlayerItems})</span>
          </button>
        </div>
      </div>
    `;

    // Grid-Generierung (genau wie Driller Inventar: nur Anzahl, Icon, Name - keine extra Infos)
    let gridItemsHtml = '';
    let filledCount = 0;

    // 1. Erze
    const oreKeys = Object.keys(ORE_DATA).filter(k => {
      const inDepot = this.depot.ores?.[k] || 0;
      const inCargo = cargoOreCounts[k] || 0;
      return inDepot > 0 || inCargo > 0;
    });

    oreKeys.forEach(key => {
      filledCount++;
      const depotCount = this.depot.ores?.[key] || 0;
      const inCargo = cargoOreCounts[key] || 0;
      const data = ORE_DATA[key] || { name: key };
      const canDeposit = inCargo > 0 && freeDepot > 0;

      gridItemsHtml += `
        <div class="depot-grid-item" data-type="ore" data-key="${key}" style="
          position: relative;
          background: rgba(15, 23, 42, 0.9);
          border: 1px solid ${canDeposit ? 'rgba(56, 189, 248, 0.45)' : 'rgba(56, 189, 248, 0.25)'};
          border-radius: 10px;
          padding: 10px 6px 8px 6px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 6px;
          min-height: 84px;
          box-sizing: border-box;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05);
          cursor: ${canDeposit ? 'pointer' : 'default'};
          user-select: none;
          transition: transform 0.1s ease, border-color 0.15s ease;
        " title="${data.name}: ${depotCount}x im Depot${inCargo > 0 ? ` · ${inCargo}x im Bohrer (Klick = +1, Shift-Klick = Alle)` : ''}">
          <!-- Anzahl Badge -->
          <span style="
            position: absolute;
            top: 5px;
            right: 5px;
            background: #0284c7;
            border: 1px solid #38bdf8;
            color: #ffffff;
            font-size: 10px;
            font-weight: 800;
            padding: 1px 5px;
            border-radius: 99px;
            line-height: 1.2;
          ">${depotCount}x</span>

          ${inCargo > 0 ? `
            <span style="
              position: absolute;
              top: 5px;
              left: 5px;
              background: rgba(16, 185, 129, 0.25);
              border: 1px solid rgba(16, 185, 129, 0.5);
              color: #34d399;
              font-size: 9px;
              font-weight: 800;
              padding: 1px 4px;
              border-radius: 99px;
              line-height: 1.2;
            ">+${inCargo}</span>
          ` : ''}

          <!-- Stein Icon: Lucide "stone" in individueller Erzfarbe -->
          <div style="display: flex; align-items: center; justify-content: center; width: 34px; height: 34px; margin-top: 2px;">
            ${oreIcon(key, 28)}
          </div>

          <!-- Stein Name -->
          <span style="
            font-size: 11px;
            font-weight: 700;
            color: #f8fafc;
            text-align: center;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 100%;
          ">${data.name}</span>
        </div>
      `;
    });

    // 2. Barren (aus REFINED_ORE_DATA)
    const refinedBarKeys = Object.entries(REFINED_ORE_DATA).map(([_, r]) => r.key).filter(k => {
      const inDepot = this.depot.products?.[k] || 0;
      const inCargo = this.player.cargo ? this.player.cargo.filter(c => c === k).length : 0;
      const inPlayer = (playerProducts[k] || 0) + inCargo;
      return inDepot > 0 || inPlayer > 0;
    });

    refinedBarKeys.forEach(key => {
      filledCount++;
      const depotCount = this.depot.products?.[key] || 0;
      const inCargo = this.player.cargo ? this.player.cargo.filter(c => c === key).length : 0;
      const inPlayer = (playerProducts[key] || 0) + inCargo;
      const name = getRefinedOreName(key.replace('bar_', ''));
      const canDeposit = inPlayer > 0 && freeDepot > 0;

      gridItemsHtml += `
        <div class="depot-grid-item" data-type="product" data-key="${key}" style="
          position: relative;
          background: rgba(15, 23, 42, 0.9);
          border: 1px solid ${canDeposit ? 'rgba(245, 158, 11, 0.55)' : 'rgba(245, 158, 11, 0.35)'};
          border-radius: 10px;
          padding: 10px 6px 8px 6px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 6px;
          min-height: 84px;
          box-sizing: border-box;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05);
          cursor: ${canDeposit ? 'pointer' : 'default'};
          user-select: none;
          transition: transform 0.1s ease, border-color 0.15s ease;
        " title="${name}: ${depotCount}x im Depot${inPlayer > 0 ? ` · ${inPlayer}x im Bohrer (Klick = +1, Shift-Klick = Alle)` : ''}">
          <!-- Anzahl Badge -->
          <span style="
            position: absolute;
            top: 5px;
            right: 5px;
            background: #d97706;
            border: 1px solid #f59e0b;
            color: #ffffff;
            font-size: 10px;
            font-weight: 800;
            padding: 1px 5px;
            border-radius: 99px;
            line-height: 1.2;
          ">${depotCount}x</span>

          ${inPlayer > 0 ? `
            <span style="
              position: absolute;
              top: 5px;
              left: 5px;
              background: rgba(16, 185, 129, 0.25);
              border: 1px solid rgba(16, 185, 129, 0.5);
              color: #34d399;
              font-size: 9px;
              font-weight: 800;
              padding: 1px 4px;
              border-radius: 99px;
              line-height: 1.2;
            ">+${inPlayer}</span>
          ` : ''}

          <!-- Icon -->
          <div style="display: flex; align-items: center; justify-content: center; width: 34px; height: 34px; margin-top: 2px;">
            ${itemDisplayIcon(key, 28)}
          </div>

          <!-- Name -->
          <span style="
            font-size: 11px;
            font-weight: 700;
            color: #f8fafc;
            text-align: center;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 100%;
          ">${name}</span>
        </div>
      `;
    });

    // 3. Fabrikprodukte (aus FACTORY_PRODUCTS)
    const factoryKeys = Object.keys(FACTORY_PRODUCTS).filter(k => {
      const inDepot = this.depot.products?.[k] || 0;
      const inPlayer = playerProducts[k] || 0;
      return inDepot > 0 || inPlayer > 0;
    });

    factoryKeys.forEach(key => {
      filledCount++;
      const depotCount = this.depot.products?.[key] || 0;
      const inPlayer = playerProducts[key] || 0;
      const name = FACTORY_PRODUCTS[key]?.name || key;
      const canDeposit = inPlayer > 0 && freeDepot > 0;

      gridItemsHtml += `
        <div class="depot-grid-item" data-type="product" data-key="${key}" style="
          position: relative;
          background: rgba(15, 23, 42, 0.9);
          border: 1px solid ${canDeposit ? 'rgba(192, 132, 252, 0.55)' : 'rgba(192, 132, 252, 0.35)'};
          border-radius: 10px;
          padding: 10px 6px 8px 6px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 6px;
          min-height: 84px;
          box-sizing: border-box;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05);
          cursor: ${canDeposit ? 'pointer' : 'default'};
          user-select: none;
          transition: transform 0.1s ease, border-color 0.15s ease;
        " title="${name}: ${depotCount}x im Depot${inPlayer > 0 ? ` · ${inPlayer}x im Bohrer (Klick = +1, Shift-Klick = Alle)` : ''}">
          <!-- Anzahl Badge -->
          <span style="
            position: absolute;
            top: 5px;
            right: 5px;
            background: #7c3aed;
            border: 1px solid #c084fc;
            color: #ffffff;
            font-size: 10px;
            font-weight: 800;
            padding: 1px 5px;
            border-radius: 99px;
            line-height: 1.2;
          ">${depotCount}x</span>

          ${inPlayer > 0 ? `
            <span style="
              position: absolute;
              top: 5px;
              left: 5px;
              background: rgba(16, 185, 129, 0.25);
              border: 1px solid rgba(16, 185, 129, 0.5);
              color: #34d399;
              font-size: 9px;
              font-weight: 800;
              padding: 1px 4px;
              border-radius: 99px;
              line-height: 1.2;
            ">+${inPlayer}</span>
          ` : ''}

          <!-- Icon -->
          <div style="display: flex; align-items: center; justify-content: center; width: 34px; height: 34px; margin-top: 2px;">
            ${itemDisplayIcon(key, 28)}
          </div>

          <!-- Name -->
          <span style="
            font-size: 11px;
            font-weight: 700;
            color: #f8fafc;
            text-align: center;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 100%;
          ">${name}</span>
        </div>
      `;
    });

    // 4. Leere Slots für den echten Inventar-Grid-Look
    const minSlots = 16;
    const totalSlots = Math.max(minSlots, Math.ceil(filledCount / 4) * 4);
    const emptySlotsCount = Math.max(0, totalSlots - filledCount);

    for (let i = 0; i < emptySlotsCount; i++) {
      gridItemsHtml += `
        <div style="
          background: rgba(15, 23, 42, 0.3);
          border: 1px dashed rgba(255, 255, 255, 0.08);
          border-radius: 10px;
          min-height: 84px;
          box-sizing: border-box;
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <span style="color: rgba(255, 255, 255, 0.08); font-size: 16px; font-weight: 700;">+</span>
        </div>
      `;
    }

    const gridContainerHtml = `
      <div style="
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(84px, 1fr));
        gap: 8px;
        max-height: 360px;
        overflow-y: auto;
        padding-right: 4px;
      ">
        ${gridItemsHtml}
      </div>
    `;

    // Zusammenbau des scrollbaren Modals
    this.modalBodyEl.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 12px; max-height: 520px; overflow-y: auto; padding-right: 4px;">
        ${headerHtml}
        ${actionsHtml}
        ${gridContainerHtml}
      </div>
    `;

    this.modalEl.style.display = 'flex';
    refreshIcons(this.modalEl);

    // Event Listener anbinden
    this.attachDepotEventListeners();
  }

  attachDepotEventListeners() {
    const body = this.modalBodyEl;
    if (!body) return;

    // Bulk Aktionen
    const btnAll = body.querySelector('#btn-depot-all');
    if (btnAll) btnAll.onclick = () => this.depositAll();

    const btnAllOres = body.querySelector('#btn-depot-all-ores');
    if (btnAllOres) btnAllOres.onclick = () => this.depositAllOres();

    const btnAllProducts = body.querySelector('#btn-depot-all-products');
    if (btnAllProducts) btnAllProducts.onclick = () => this.depositAllProducts();

    // Grid Item Klick (1x einlagern, oder alle bei Shift-Klick)
    body.querySelectorAll('.depot-grid-item').forEach(card => {
      card.onclick = (e) => {
        const type = card.getAttribute('data-type');
        const key = card.getAttribute('data-key');
        const count = e.shiftKey ? 9999 : 1;
        if (type === 'ore') {
          this.depositOre(key, count);
        } else if (type === 'product') {
          this.depositProduct(key, count);
        }
      };
    });

    // Ausbau
    const btnUpgrade = body.querySelector('#btn-depot-upgrade');
    if (btnUpgrade) {
      btnUpgrade.onclick = () => this.upgradeDepot();
    }
  }

  depositOre(oreKey, count = 1) {
    if (!this.depot.ores) this.depot.ores = {};
    const freeCapacity = (this.depot.capacity || 10) - this.getDepotTotalCount();
    if (freeCapacity <= 0) {
      this.scene.events.emit('notify', '⚠️ Depot ist voll! Baue die Lagerkapazität aus.');
      return;
    }

    let deposited = 0;
    for (let i = this.player.cargo.length - 1; i >= 0 && deposited < count && deposited < freeCapacity; i--) {
      if (this.player.cargo[i] === oreKey) {
        this.player.cargo.splice(i, 1);
        this.depot.ores[oreKey] = (this.depot.ores[oreKey] || 0) + 1;
        deposited++;
      }
    }

    if (deposited > 0) {
      soundFx.playClick();
      if (this.scene.hud) this.scene.hud.update();
      this.renderDepotModal();
    }
  }

  withdrawOre(oreKey, count = 1) {
    if (!this.depot.ores || (this.depot.ores[oreKey] || 0) <= 0) return;
    const playerFreeCargo = (this.player.maxCargo || 10) - (this.player.cargo ? this.player.cargo.length : 0);
    if (playerFreeCargo <= 0) {
      this.scene.events.emit('notify', '⚠️ Bohrer-Laderaum ist voll!');
      return;
    }

    let withdrawn = 0;
    while (withdrawn < count && (this.player.cargo.length < (this.player.maxCargo || 10)) && this.depot.ores[oreKey] > 0) {
      this.depot.ores[oreKey]--;
      this.player.cargo.push(oreKey);
      withdrawn++;
    }

    if (withdrawn > 0) {
      soundFx.playClick();
      if (this.scene.hud) this.scene.hud.update();
      this.renderDepotModal();
    }
  }

  withdrawFillOre(oreKey) {
    if (!this.depot.ores || (this.depot.ores[oreKey] || 0) <= 0) return;
    const playerFreeCargo = (this.player.maxCargo || 10) - (this.player.cargo ? this.player.cargo.length : 0);
    if (playerFreeCargo <= 0) {
      this.scene.events.emit('notify', '⚠️ Bohrer-Laderaum ist bereits voll!');
      return;
    }

    let moved = 0;
    while (this.depot.ores[oreKey] > 0 && (this.player.cargo.length < (this.player.maxCargo || 10))) {
      this.depot.ores[oreKey]--;
      this.player.cargo.push(oreKey);
      moved++;
    }

    if (moved > 0) {
      soundFx.playClick();
      if (this.scene.hud) this.scene.hud.update();
      this.renderDepotModal();
      this.scene.events.emit('notify', `🚜 ${moved}x ${ORE_DATA[oreKey]?.name || oreKey} in den Laderaum geladen!`);
    }
  }

  fillCargoFromDepot() {
    if (!this.depot.ores) return;
    const playerFreeCargo = (this.player.maxCargo || 10) - (this.player.cargo ? this.player.cargo.length : 0);
    if (playerFreeCargo <= 0) {
      this.scene.events.emit('notify', '⚠️ Bohrer-Laderaum ist bereits voll!');
      return;
    }

    let moved = 0;
    for (const [oreKey, qty] of Object.entries(this.depot.ores)) {
      while (this.depot.ores[oreKey] > 0 && (this.player.cargo.length < (this.player.maxCargo || 10))) {
        this.depot.ores[oreKey]--;
        this.player.cargo.push(oreKey);
        moved++;
      }
      if (this.player.cargo.length >= (this.player.maxCargo || 10)) break;
    }

    if (moved > 0) {
      soundFx.playClick();
      if (this.scene.hud) this.scene.hud.update();
      this.renderDepotModal();
      this.scene.events.emit('notify', `🚜 ${moved}x Erze aus dem Depot in den Laderaum geladen!`);
    } else {
      this.scene.events.emit('notify', 'Keine Erze im Depot vorhanden.');
    }
  }

  sellDepotOre(oreKey, count = 1) {
    if (!this.depot.ores || (this.depot.ores[oreKey] || 0) <= 0) return;
    const val = ORE_DATA[oreKey]?.value || 0;
    const available = this.depot.ores[oreKey];
    const toSell = Math.min(available, count);

    this.depot.ores[oreKey] -= toSell;
    const earned = val * toSell;
    this.player.cash += earned;

    soundFx.playPurchase();
    if (this.scene.hud) this.scene.hud.update();
    this.renderDepotModal();
    this.scene.events.emit('notify', `💰 ${toSell}x ${ORE_DATA[oreKey]?.name || oreKey} aus Depot verkauft für +€${earned}!`);
  }

  sellAllDepotOres() {
    if (!this.depot.ores) return;
    let totalEarned = 0;
    let totalCount = 0;

    for (const [oreKey, qty] of Object.entries(this.depot.ores)) {
      if (qty > 0) {
        const val = ORE_DATA[oreKey]?.value || 0;
        totalEarned += val * qty;
        totalCount += qty;
        this.depot.ores[oreKey] = 0;
      }
    }

    if (totalCount > 0) {
      this.player.cash += totalEarned;
      soundFx.playPurchase();
      if (this.scene.hud) this.scene.hud.update();
      this.renderDepotModal();
      this.scene.events.emit('notify', `💰 Alle ${totalCount} Depot-Erze verkauft für +€${totalEarned.toLocaleString()}!`);
    } else {
      this.scene.events.emit('notify', 'Keine Erze im Depot zum Verkaufen.');
    }
  }

  depositProduct(productKey, count = 1) {
    if (!this.depot.products) this.depot.products = {};
    const freeCapacity = (this.depot.capacity || 10) - this.getDepotTotalCount();
    if (freeCapacity <= 0) {
      this.scene.events.emit('notify', '⚠️ Depot ist voll! Baue die Lagerkapazität aus.');
      return;
    }

    let moved = 0;
    // 1. Aus player.factoryProducts
    if (this.player.factoryProducts && (this.player.factoryProducts[productKey] || 0) > 0) {
      const available = this.player.factoryProducts[productKey];
      const toMove = Math.min(available, count, freeCapacity);
      this.player.factoryProducts[productKey] -= toMove;
      this.depot.products[productKey] = (this.depot.products[productKey] || 0) + toMove;
      moved += toMove;
    }

    // 2. Aus player.cargo (falls dort als bar_* gelagert)
    if (moved < count && moved < freeCapacity && this.player.cargo) {
      for (let i = this.player.cargo.length - 1; i >= 0 && moved < count && moved < freeCapacity; i--) {
        if (this.player.cargo[i] === productKey) {
          this.player.cargo.splice(i, 1);
          this.depot.products[productKey] = (this.depot.products[productKey] || 0) + 1;
          moved++;
        }
      }
    }

    if (moved > 0) {
      soundFx.playClick();
      if (this.scene.hud) this.scene.hud.update();
      this.renderDepotModal();
    }
  }

  withdrawProduct(productKey, count = 1) {
    if (!this.depot.products || (this.depot.products[productKey] || 0) <= 0) return;
    if (!this.player.factoryProducts) this.player.factoryProducts = {};

    const available = this.depot.products[productKey] || 0;
    const toMove = Math.min(available, count);
    if (toMove > 0) {
      this.depot.products[productKey] -= toMove;
      this.player.factoryProducts[productKey] = (this.player.factoryProducts[productKey] || 0) + toMove;
      soundFx.playClick();
      if (this.scene.hud) this.scene.hud.update();
      this.renderDepotModal();
    }
  }

  withdrawAllProducts() {
    if (!this.depot.products) return;
    if (!this.player.factoryProducts) this.player.factoryProducts = {};
    let count = 0;
    for (const [prodKey, qty] of Object.entries(this.depot.products)) {
      if (qty > 0) {
        this.player.factoryProducts[prodKey] = (this.player.factoryProducts[prodKey] || 0) + qty;
        count += qty;
        this.depot.products[prodKey] = 0;
      }
    }
    if (count > 0) {
      soundFx.playClick();
      if (this.scene.hud) this.scene.hud.update();
      this.renderDepotModal();
      this.scene.events.emit('notify', `📦 ${count}x Waren ins persönliche Inventar übernommen!`);
    }
  }

  sellDepotProduct(productKey, count = 1) {
    if (!this.depot.products || (this.depot.products[productKey] || 0) <= 0) return;
    let val = FACTORY_PRODUCTS[productKey]?.value || 0;
    let name = FACTORY_PRODUCTS[productKey]?.name || productKey;
    if (productKey.startsWith('bar_')) {
      const rawKey = productKey.replace('bar_', '');
      val = getRefinedOreNetValue(rawKey);
      name = getRefinedOreName(rawKey);
    }
    const available = this.depot.products[productKey];
    const toSell = Math.min(available, count);

    this.depot.products[productKey] -= toSell;
    const earned = val * toSell;
    this.player.cash += earned;

    soundFx.playPurchase();
    if (this.scene.hud) this.scene.hud.update();
    this.renderDepotModal();
    this.scene.events.emit('notify', `💰 ${toSell}x ${name} verkauft für +€${earned.toLocaleString()}!`);
  }

  sellAllDepotProducts() {
    if (!this.depot.products) return;
    let totalEarned = 0;
    let totalCount = 0;

    for (const [prodKey, qty] of Object.entries(this.depot.products)) {
      if (qty > 0) {
        let val = FACTORY_PRODUCTS[prodKey]?.value || 0;
        if (prodKey.startsWith('bar_')) {
          const rawKey = prodKey.replace('bar_', '');
          val = getRefinedOreNetValue(rawKey);
        }
        totalEarned += val * qty;
        totalCount += qty;
        this.depot.products[prodKey] = 0;
      }
    }

    if (totalCount > 0) {
      this.player.cash += totalEarned;
      soundFx.playPurchase();
      if (this.scene.hud) this.scene.hud.update();
      this.renderDepotModal();
      this.scene.events.emit('notify', `💰 Alle ${totalCount} Depot-Waren verkauft für +€${totalEarned.toLocaleString()}!`);
    } else {
      this.scene.events.emit('notify', 'Keine Waren im Depot zum Verkaufen.');
    }
  }

  depositAllOres() {
    if (!this.depot.ores) this.depot.ores = {};
    const freeCapacity = (this.depot.capacity || 10) - this.getDepotTotalCount();
    if (freeCapacity <= 0) {
      this.scene.events.emit('notify', '⚠️ Depot ist voll! Baue die Lagerkapazität aus.');
      return;
    }
    if (!this.player.cargo || this.player.cargo.length === 0) {
      this.scene.events.emit('notify', 'Laderaum enthält keine Erze.');
      return;
    }

    let moved = 0;
    const remainingCargo = [];
    for (const item of this.player.cargo) {
      if (typeof item === 'string' && item.startsWith('bar_')) {
        remainingCargo.push(item);
        continue;
      }
      if (moved < freeCapacity) {
        this.depot.ores[item] = (this.depot.ores[item] || 0) + 1;
        moved++;
      } else {
        remainingCargo.push(item);
      }
    }
    this.player.cargo = remainingCargo;
    if (moved > 0) {
      soundFx.playPurchase();
      if (this.scene.hud) this.scene.hud.update();
      this.renderDepotModal();
      this.scene.events.emit('notify', `📦 ${moved}x Erze ins Depot eingelagert!`);
    } else {
      this.scene.events.emit('notify', 'Keine Erze zum Einlagern vorhanden.');
    }
  }

  depositAllProducts() {
    if (!this.depot.products) this.depot.products = {};
    const freeCapacity = (this.depot.capacity || 10) - this.getDepotTotalCount();
    if (freeCapacity <= 0) {
      this.scene.events.emit('notify', '⚠️ Depot ist voll! Baue die Lagerkapazität aus.');
      return;
    }

    let moved = 0;
    // 1. Aus player.factoryProducts
    for (const [key, qty] of Object.entries(this.player.factoryProducts || {})) {
      if (qty > 0 && moved < freeCapacity) {
        const canMove = Math.min(qty, freeCapacity - moved);
        this.player.factoryProducts[key] -= canMove;
        this.depot.products[key] = (this.depot.products[key] || 0) + canMove;
        moved += canMove;
      }
    }

    // 2. Aus player.cargo (falls dort noch Barren lagern)
    if (this.player.cargo && moved < freeCapacity) {
      for (let i = this.player.cargo.length - 1; i >= 0 && moved < freeCapacity; i--) {
        const item = this.player.cargo[i];
        if (typeof item === 'string' && item.startsWith('bar_')) {
          this.player.cargo.splice(i, 1);
          this.depot.products[item] = (this.depot.products[item] || 0) + 1;
          moved++;
        }
      }
    }

    if (moved > 0) {
      soundFx.playPurchase();
      if (this.scene.hud) this.scene.hud.update();
      this.renderDepotModal();
      this.scene.events.emit('notify', `📦 ${moved}x Fabrik-Erzeugnisse ins Depot eingelagert!`);
    } else {
      this.scene.events.emit('notify', 'Keine Fabrik-Erzeugnisse zum Einlagern vorhanden.');
    }
  }

  depositAll() {
    this.depositAllOres();
    this.depositAllProducts();
  }

  upgradeDepot() {
    const currentTier = this.depot.tier || 1;
    const nextTierData = DEPOT_TIERS.find(t => t.tier === currentTier + 1);
    if (!nextTierData) {
      this.scene.events.emit('notify', 'Depot hat bereits die maximale Ausbaustufe erreicht!');
      return;
    }

    if (this.player.cash < nextTierData.costCash) {
      this.scene.events.emit('notify', `Nicht genug Geld! Benötigt: €${nextTierData.costCash}`);
      return;
    }

    if (nextTierData.costComp) {
      for (const [compKey, need] of Object.entries(nextTierData.costComp)) {
        if ((this.player.components[compKey] || 0) < need) {
          this.scene.events.emit('notify', `Fehlendes Bauteil für Ausbau: ${need}x ${compKey}`);
          return;
        }
      }
      for (const [compKey, need] of Object.entries(nextTierData.costComp)) {
        this.player.components[compKey] -= need;
      }
    }

    this.player.cash -= nextTierData.costCash;
    this.depot.tier = nextTierData.tier;
    this.depot.capacity = nextTierData.capacity;

    soundFx.playUpgrade();
    this.renderDepotModal();
    if (this.scene.hud) this.scene.hud.update();
    this.scene.events.emit('notify', `🎉 Depot ausgebaut auf Stufe ${this.depot.tier} (${this.depot.capacity} Plätze)!`);
  }

  // =========================================================
  // 2. STEINSAMMLER NPC (SPEZIELLE ERZE GEGEN UPGRADE-BAUTEILE)
  // =========================================================
  openGeologistModal() {
    const p = this.player;
    const comps = p.components;

    // Realistische Quests passend zur Tiefe (0 bis 1600m) & Level
    const quests = [
      {
        id: 'geologist_coal_copper',
        title: 'Geologische Probensammlung I',
        depthHint: 'Tiefe 0-50m (Erdschicht)',
        reqs: { coal: 5, copper: 3 },
        rewardComp: { key: 'hydraulic_part', name: 'Hydraulik-Zylinder', iconName: 'cog' },
        rewardCash: 160,
        rewardXp: 120,
        minLevel: 1
      },
      {
        id: 'geologist_iron_tin',
        title: 'Sedimentproben II',
        depthHint: 'Tiefe 30-150m (Schiefer-Schicht)',
        reqs: { iron: 4, tin: 3 },
        rewardComp: { key: 'titan_alloy', name: 'Titan-Legierung', iconName: 'shield-check' },
        rewardCash: 350,
        rewardXp: 280,
        minLevel: 2
      },
      {
        id: 'geologist_silver_gold',
        title: 'Kristall-Reflektionsanalyse III',
        depthHint: 'Tiefe 130-350m (Granit-Schicht)',
        reqs: { silver: 3, gold: 2 },
        rewardComp: { key: 'laser_lens', name: 'Kristall-Fokuslinse', iconName: 'disc' },
        rewardCash: 800,
        rewardXp: 580,
        minLevel: 3
      },
      {
        id: 'geologist_gem_cluster',
        title: 'Quanten-Kernresonanz IV',
        depthHint: 'Tiefe 340-800m (Obsidian-Zone)',
        reqs: { emerald: 2, ruby: 2 },
        rewardComp: { key: 'quantum_chip', name: 'Quanten-Steuerkern', iconName: 'atom' },
        rewardCash: 1900,
        rewardXp: 1150,
        minLevel: 4
      },
      {
        id: 'geologist_diamond_core',
        title: 'Tiefenanalyse V: Urgestein',
        depthHint: 'Tiefe 850m+ (Urgestein-Kern)',
        reqs: { diamond: 1, sapphire: 2 },
        rewardComp: { key: 'quantum_chip', name: 'Quanten-Steuerkern', iconName: 'atom' },
        rewardCash: 3400,
        rewardXp: 1900,
        minLevel: 5
      }
    ];

    // Cargo & Depot nach Erzen zählen
    const cargoCounts = {};
    p.cargo.forEach((ore) => {
      cargoCounts[ore] = (cargoCounts[ore] || 0) + 1;
    });
    const depotOres = this.depot?.ores || {};

    let questsHtml = '<div style="display: flex; flex-direction: column; gap: 10px; margin: 12px 0; max-height: 280px; overflow-y: auto; padding-right: 4px;">';

    const visibleQuests = quests.filter(q => Object.keys(q.reqs).every(ore => p.isOreDiscovered(ore)));

    if (visibleQuests.length === 0) {
      questsHtml += `
        <div style="text-align: center; padding: 20px 16px; color: #94a3b8; font-size: 12px; background: rgba(15,23,42,0.5); border-radius: 10px; border: 1px dashed rgba(255,255,255,0.1);">
          Erkunde tiefere Gesteinsschichten, um neue Proben-Aufträge freizuschalten.
        </div>
      `;
    } else {
      visibleQuests.forEach((q) => {
        let canFulfill = true;
        const reqBadges = Object.entries(q.reqs).map(([ore, needed]) => {
          const haveCargo = cargoCounts[ore] || 0;
          const haveDepot = depotOres[ore] || 0;
          const totalHave = haveCargo + haveDepot;
          const oreName = ORE_DATA[ore]?.name || ore;
          if (totalHave < needed) canFulfill = false;
          const isMet = totalHave >= needed;
          return `
            <span style="background: rgba(15, 23, 42, 0.8); border: 1px solid ${isMet ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}; color: ${isMet ? '#10b981' : '#f87171'}; font-weight: 700; font-size: 11px; padding: 2px 7px; border-radius: 6px; display: inline-flex; align-items: center; gap: 4px;">
              ${oreIcon(ore, 12)} ${oreName} (${totalHave}/${needed})
            </span>
          `;
        }).join('');

        questsHtml += `
          <div style="background: rgba(15, 23, 42, 0.75); border: 1px solid ${canFulfill ? '#10b981' : 'rgba(255,255,255,0.08)'}; border-radius: 10px; padding: 10px 14px; display: flex; flex-direction: column; gap: 8px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <strong style="color: #f8fafc; font-size: 13px;">${q.title}</strong>
              <span style="font-size: 11px; color: #94a3b8;">${q.depthHint}</span>
            </div>
            <div style="display: flex; gap: 6px; flex-wrap: wrap;">
              ${reqBadges}
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px; flex-wrap: wrap; margin-top: 2px;">
              <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                <span style="background: rgba(192, 132, 252, 0.12); border: 1px solid rgba(192, 132, 252, 0.3); color: #c084fc; font-weight: 700; font-size: 11px; padding: 2px 7px; border-radius: 6px; display: inline-flex; align-items: center; gap: 4px;">
                  ${icon(q.rewardComp.iconName, '', 11)} 1x ${q.rewardComp.name}
                </span>
                <span style="background: rgba(251, 191, 36, 0.12); border: 1px solid rgba(251, 191, 36, 0.3); color: #fbbf24; font-weight: 800; font-size: 11.5px; padding: 2px 8px; border-radius: 6px;">
                  €${q.rewardCash}
                </span>
                <span style="background: rgba(168, 85, 247, 0.12); border: 1px solid rgba(168, 85, 247, 0.3); color: #a855f7; font-weight: 800; font-size: 11.5px; padding: 2px 8px; border-radius: 6px;">
                  ${q.rewardXp} XP
                </span>
              </div>
              <button class="btn-claim-geologist btn-buy" data-qid="${q.id}" ${canFulfill ? '' : 'disabled'} style="height: 30px; padding: 0 12px; font-size: 11px; font-weight: 800; display: inline-flex; align-items: center; gap: 4px;">
                ${icon('check', '', 12)}
                <span>Abgeben</span>
              </button>
            </div>
          </div>
        `;
      });
    }
    questsHtml += '</div>';

    // Komponenten-Inventar des Spielers
    const compHeader = `
      <div style="background: rgba(15,23,42,0.85); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 10px 14px; display: flex; justify-content: space-around; font-size: 12px; margin-bottom: 8px; flex-wrap: wrap; gap: 6px;">
        <span style="display: inline-flex; align-items: center; gap: 4px;">${icon('cog', '', 13)} Hydraulik-Zylinder: <strong style="color: #38bdf8;">${comps.hydraulic_part || 0}</strong></span>
        <span style="display: inline-flex; align-items: center; gap: 4px;">${icon('shield-check', '', 13)} Titan-Legierung: <strong style="color: #38bdf8;">${comps.titan_alloy || 0}</strong></span>
        <span style="display: inline-flex; align-items: center; gap: 4px;">${icon('disc', '', 13)} Kristall-Linse: <strong style="color: #38bdf8;">${comps.laser_lens || 0}</strong></span>
        <span style="display: inline-flex; align-items: center; gap: 4px;">${icon('atom', '', 13)} Quanten-Kern: <strong style="color: #38bdf8;">${comps.quantum_chip || 0}</strong></span>
      </div>
    `;

    const content = `
      ${compHeader}
      ${questsHtml}
    `;

    this.openModal(`
      <div style="display: flex; align-items: center; gap: 8px;">
        ${icon('microscope', '', 18)}
        <span>STEINEFORSCHER</span>
      </div>
    `, content);



    // Abgabe Event Listener
    const claimBtns = document.querySelectorAll('.btn-claim-geologist');
    claimBtns.forEach((btn) => {
      btn.onclick = () => {
        const qid = btn.getAttribute('data-qid');
        const q = quests.find(item => item.id === qid);
        if (!q) return;

        // Erze aus Frachtraum und falls nötig aus Depot entnehmen
        for (const [ore, needed] of Object.entries(q.reqs)) {
          let consumed = 0;
          if (p.consumeOre) {
            consumed = p.consumeOre(ore, needed);
          } else {
            p.sellSpecificOre(ore, needed);
            consumed = needed;
          }
          const fromDepot = needed - consumed;
          if (fromDepot > 0 && this.depot?.ores?.[ore]) {
            this.depot.ores[ore] = Math.max(0, this.depot.ores[ore] - fromDepot);
          }
        }

        // Belohnung gewähren
        comps[q.rewardComp.key] = (comps[q.rewardComp.key] || 0) + 1;
        p.cash += q.rewardCash;
        p.addXp(q.rewardXp);
        p.stats.researchCompleted = (p.stats.researchCompleted || 0) + 1;
        soundFx.playPurchase();

        this.openGeologistModal();
        this.scene.events.emit('notify', `Auftrag erfüllt: +1 ${q.rewardComp.name}, +€${q.rewardCash}, +${q.rewardXp} XP`);
      };
    });
  }

  // =========================================================
  // 3. TECH-LABOR (KOMPLEXES UPGRADE-SYSTEM OHNE FILTERLEISTE)
  // =========================================================
  openLabModal() {
    const p = this.player;

    const tracks = [
      {
        id: 'tank',
        title: 'TREIBSTOFF-TANK',
        iconName: 'fuel',
        currentTier: p.tankTier || 1,
        maxTier: TANK_TIERS.length,
        tiers: TANK_TIERS,
        apply: (tier) => p.upgradeTank(tier)
      },
      {
        id: 'hull',
        title: 'GEHÄUSESCHUTZ / PANZERUNG',
        iconName: 'shield-cog',
        currentTier: p.hullTier || 1,
        maxTier: HULL_TIERS.length,
        tiers: HULL_TIERS,
        apply: (tier) => p.upgradeHull(tier)
      },
      {
        id: 'drill',
        title: 'BOHRKOPF-BAUPLÄNE',
        iconName: 'pickaxe',
        currentTier: p.researchedDrillTier || p.drillTier || 1,
        maxTier: DRILL_DATA.length,
        tiers: DRILL_DATA,
        apply: (tier) => {
          p.researchedDrillTier = tier;
        }
      },
      {
        id: 'engine',
        title: 'ANTRIEB & STEIGFLUG',
        iconName: 'zap',
        currentTier: p.engineTier || 1,
        maxTier: ENGINE_TIERS.length,
        tiers: ENGINE_TIERS,
        apply: (tier) => p.upgradeEngine(tier)
      },
      {
        id: 'cargo',
        title: 'FRACHTRAUM-KAPAZITÄT',
        iconName: 'container',
        currentTier: p.cargoTier || 1,
        maxTier: CARGO_TIERS.length,
        tiers: CARGO_TIERS,
        apply: (tier) => p.upgradeCargo(tier)
      },
      {
        id: 'sensor',
        title: 'GEO-SENSOR & RADAR',
        iconName: 'radio',
        currentTier: p.sensorTier || 1,
        maxTier: SENSOR_TIERS.length,
        tiers: SENSOR_TIERS,
        apply: (tier) => p.upgradeSensor(tier)
      }
    ];

    // Komponenten-Übersicht im Labor-Header
    const comps = p.components;
    const compHeader = `
      <div style="background: rgba(15,23,42,0.85); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 10px 14px; display: flex; justify-content: space-around; font-size: 12px; margin-bottom: 12px; flex-wrap: wrap; gap: 6px;">
        <span style="display: inline-flex; align-items: center; gap: 4px;">${icon('cog', '', 13)} Hydraulik-Zylinder: <strong style="color: #38bdf8;">${comps.hydraulic_part || 0}</strong></span>
        <span style="display: inline-flex; align-items: center; gap: 4px;">${icon('shield-check', '', 13)} Titan-Legierung: <strong style="color: #38bdf8;">${comps.titan_alloy || 0}</strong></span>
        <span style="display: inline-flex; align-items: center; gap: 4px;">${icon('disc', '', 13)} Kristall-Fokuslinse: <strong style="color: #38bdf8;">${comps.laser_lens || 0}</strong></span>
        <span style="display: inline-flex; align-items: center; gap: 4px;">${icon('atom', '', 13)} Quanten-Steuerkern: <strong style="color: #38bdf8;">${comps.quantum_chip || 0}</strong></span>
      </div>
    `;

    // Feste Kategorien mit Segmented Progress Bar (OHNE Filterleiste!)
    let cardsHtml = '<div class="tech-lab-categories" style="display: flex; flex-direction: column; gap: 14px; max-height: 480px; overflow-y: auto; padding-right: 4px;">';

    tracks.forEach((track) => {
      const currentTierData = track.tiers[track.currentTier - 1];
      const hasNext = track.currentTier < track.maxTier;
      const nextTier = hasNext ? track.tiers[track.currentTier] : null;

      // Segmented Progress Bar (saubere Blöcke ohne umbrechenden Text)
      let segmentsHtml = '<div class="segmented-progress-bar">';
      for (let s = 1; s <= track.maxTier; s++) {
        if (s <= track.currentTier) {
          segmentsHtml += `
            <div class="seg-step completed${s === track.currentTier ? ' current' : ''}">
              <span><span class="step-label">Stufe </span>${s}</span>
            </div>
          `;
        } else if (s === track.currentTier + 1) {
          segmentsHtml += `
            <div class="seg-step active">
              <span><span class="step-label">Stufe </span>${s}</span>
            </div>
          `;
        } else {
          segmentsHtml += `
            <div class="seg-step locked">
              <span><span class="step-label">Stufe </span>${s}</span>
            </div>
          `;
        }
      }
      segmentsHtml += '</div>';

      // Nächste Stufe Details & Kauf-Button
      let actionHtml = '';
      if (hasNext && nextTier) {
        const isLevelMet = p.level >= nextTier.level;
        const canAffordCash = p.cash >= nextTier.cost;

        let canAffordComp = true;
        if (nextTier.comp) {
          const haveComp = p.components[nextTier.comp.key] || 0;
          if (haveComp < nextTier.comp.count) canAffordComp = false;
        }

        const canBuy = isLevelMet && canAffordCash && canAffordComp;
        const compIconName = nextTier.comp ? (COMPONENT_ICONS[nextTier.comp.key] || 'box') : 'box';
        const haveComp = nextTier.comp ? (p.components[nextTier.comp.key] || 0) : 0;
        const compBadge = nextTier.comp ? `
          <span style="background: rgba(192, 132, 252, 0.12); border: 1px solid ${haveComp >= nextTier.comp.count ? 'rgba(192, 132, 252, 0.3)' : 'rgba(239, 68, 68, 0.4)'}; color: ${haveComp >= nextTier.comp.count ? '#c084fc' : '#ef4444'}; font-weight: 700; font-size: 11px; padding: 2px 8px; border-radius: 6px; display: inline-flex; align-items: center; gap: 5px; white-space: nowrap;">
            ${icon(compIconName, '', 12)} ${nextTier.comp.count}x ${nextTier.comp.name} (${haveComp}/${nextTier.comp.count})
          </span>
        ` : '';

        const levelBadge = !isLevelMet ? `
          <span style="background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.3); color: #ef4444; font-weight: 700; font-size: 11px; padding: 2px 6px; border-radius: 4px; white-space: nowrap;">
            Lv. ${nextTier.level}
          </span>
        ` : '';

        const costBadge = `
          <span style="background: rgba(251, 191, 36, 0.12); border: 1px solid ${canAffordCash ? 'rgba(251, 191, 36, 0.3)' : 'rgba(239, 68, 68, 0.4)'}; color: ${canAffordCash ? '#fbbf24' : '#ef4444'}; font-weight: 800; font-size: 11.5px; padding: 2px 8px; border-radius: 6px; display: inline-flex; align-items: center; justify-content: center; gap: 3px; width: 100%; box-sizing: border-box; white-space: nowrap;">
            ${icon('coins', '', 11)} €${nextTier.cost}
          </span>
        `;

        actionHtml = `
          <div class="cat-action-row" style="margin-top: 8px; display: flex; align-items: center; background: rgba(15,23,42,0.6); padding: 8px 12px; border-radius: 8px; gap: 10px; box-sizing: border-box;">
            <!-- Spalte 1: Modul-Name (200px) -->
            <div style="width: 200px; min-width: 200px; flex-shrink: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
              <strong style="color: #f8fafc; font-size: 13px;">${nextTier.name}</strong>
            </div>

            <!-- Spalte 2: Stat (100px) -->
            <div style="width: 100px; min-width: 100px; flex-shrink: 0;">
              <span style="background: rgba(56, 189, 248, 0.15); border: 1px solid rgba(56, 189, 248, 0.3); color: #38bdf8; font-weight: 700; font-size: 11.5px; padding: 2px 8px; border-radius: 6px; display: inline-flex; align-items: center; justify-content: center; width: 100%; box-sizing: border-box; white-space: nowrap;">
                ${nextTier.stat}
              </span>
            </div>

            <!-- Spalte 3: Spezialbauteile & Level (flex: 1, rechtsbündig) -->
            <div style="flex: 1; min-width: 0; display: flex; align-items: center; justify-content: flex-end; gap: 6px;">
              ${levelBadge}
              ${compBadge}
            </div>

            <!-- Spalte 4: Preis (90px) -->
            <div style="width: 90px; min-width: 90px; flex-shrink: 0; display: flex; align-items: center; justify-content: center;">
              ${costBadge}
            </div>

            <!-- Spalte 5: Button (110px) -->
            <div style="width: 110px; min-width: 110px; flex-shrink: 0; display: flex; align-items: center; justify-content: flex-end;">
              <button class="btn-buy" id="btn-buy-track-${track.id}" ${canBuy ? '' : 'disabled'} style="width: 100%; height: 30px; padding: 0 10px; font-size: 11px; font-weight: 800; display: inline-flex; align-items: center; justify-content: center; gap: 4px;">
                ${icon('cpu', '', 12)}
                <span>Erforschen</span>
              </button>
            </div>
          </div>
        `;
      } else {
        actionHtml = `
          <div class="cat-action-row" style="margin-top: 8px; display: flex; align-items: center; background: rgba(15,23,42,0.6); padding: 8px 12px; border-radius: 8px; gap: 10px; box-sizing: border-box;">
            <div style="flex: 1; display: flex; align-items: center; gap: 6px;">
              <strong style="color: #10b981; font-size: 12.5px; display: inline-flex; align-items: center; gap: 6px;">${icon('award', '', 14)} Vollständig erforscht</strong>
            </div>
            <div style="width: 110px; min-width: 110px; flex-shrink: 0; display: flex; align-items: center; justify-content: flex-end;">
              <span style="font-size: 11px; color: #10b981; font-weight: 700; background: rgba(16,185,129,0.15); border: 1px solid rgba(16,185,129,0.3); padding: 3px 8px; border-radius: 6px; display: inline-flex; align-items: center; justify-content: center; width: 100%; box-sizing: border-box;">MAX</span>
            </div>
          </div>
        `;
      }

      cardsHtml += `
        <div class="tech-category-card" id="cat-block-${track.id}">
          <div class="cat-header-row" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <div class="cat-title-wrap" style="display: flex; align-items: center; gap: 8px; font-weight: 700;">
              ${icon(track.iconName, '', 16)}
              <span>${track.title}</span>
            </div>
            <div class="cat-status-pill" style="font-size: 11px; color: #94a3b8;">
              Stufe ${track.currentTier}/${track.maxTier} • <strong style="color: #10b981;">${currentTierData.stat}</strong>
            </div>
          </div>

          ${segmentsHtml}
          ${actionHtml}
        </div>
      `;
    });
    cardsHtml += '</div>';

    const fullContent = compHeader + cardsHtml;
    this.openModal(`
      <div style="display: flex; align-items: center; gap: 8px;">
        ${icon('microscope', '', 18)}
        <span>LABOR</span>
      </div>
    `, fullContent);

    // Kauf-Buttons Event Listener
    tracks.forEach((track) => {
      const btn = document.getElementById(`btn-buy-track-${track.id}`);
      if (btn) {
        const nextTier = track.tiers[track.currentTier];
        btn.onclick = () => {
          let hasComp = true;
          if (nextTier.comp) {
            hasComp = (p.components[nextTier.comp.key] || 0) >= nextTier.comp.count;
          }

          if (p.cash >= nextTier.cost && p.level >= nextTier.level && hasComp) {
            p.cash -= nextTier.cost;
            if (nextTier.comp) {
              p.components[nextTier.comp.key] -= nextTier.comp.count;
            }
            track.apply(track.currentTier + 1);
            soundFx.playPurchase();
            this.openLabModal();
            if (track.id === 'drill') {
              this.scene.events.emit('notify', `Bauplan für ${nextTier.name} erforscht! Im HANGAR montieren.`);
            } else {
              this.scene.events.emit('notify', `${track.title}: Stufe ${track.currentTier + 1} (${nextTier.name}) freigeschaltet!`);
            }
          }
        };
      }
    });


  }

  // =========================================================
  // 4. KAUFBARE NEUBAUTEN (BAUPLATZ-SYSTEM)
  // =========================================================
  openBuildModal(pb) {
    const p = this.player;
    const canAffordCash = p.cash >= pb.costCash;

    let canAffordComp = true;
    let reqCompsHtml = [];
    for (const [key, count] of Object.entries(pb.costComp)) {
      const have = p.components[key] || 0;
      if (have < count) canAffordComp = false;
      const names = {
        hydraulic_part: 'Hydraulik-Zylinder',
        titan_alloy: 'Titan-Legierung',
        laser_lens: 'Kristall-Linse',
        quantum_chip: 'Quanten-Kern'
      };
      const compIcon = COMPONENT_ICONS[key] || 'box';
      reqCompsHtml.push(`<span style="color: ${have >= count ? '#10b981' : '#f87171'}; font-weight: 700; display: inline-flex; align-items: center; gap: 4px;">${icon(compIcon, '', 13)} ${names[key] || key}: ${have}/${count}</span>`);
    }

    const canBuild = canAffordCash && canAffordComp;

    const content = `
      <div style="display: flex; flex-direction: column; gap: 14px;">
        <p style="font-size: 13px; color: var(--text-muted); line-height: 1.5;">
          ${pb.desc}
        </p>

        <div style="background: rgba(15, 23, 42, 0.75); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 12px; display: flex; flex-direction: column; gap: 6px;">
          <strong style="color: #f8fafc; font-size: 12px; text-transform: uppercase;">Baukosten:</strong>
          <div style="font-size: 13px;">
            Finanzierung: <strong style="color: ${canAffordCash ? '#fbbf24' : '#f87171'};">€${pb.costCash}</strong> (Dein Guthaben: €${p.cash})
          </div>
          <div style="font-size: 13px;">
            Bauteile: ${reqCompsHtml.join(', ')}
          </div>
        </div>

        <button id="btn-construct-building" class="btn-buy btn-lg" ${canBuild ? '' : 'disabled'} style="width: 100%;">
          ${icon('wrench', '', 14)}
          <span>${canBuild ? `${pb.title} JETZT ERRICHTEN` : 'RESSOURCEN FEHLEN'}</span>
        </button>
      </div>
    `;

    this.openModal(`
      <div style="display: flex; align-items: center; gap: 8px;">
        ${icon('wrench', '', 18)}
        <span>BAUVORHABEN: ${pb.title}</span>
      </div>
    `, content);

    const btnConstruct = document.getElementById('btn-construct-building');
    if (btnConstruct) {
      btnConstruct.onclick = () => {
        if (!canBuild) return;

        p.cash -= pb.costCash;
        for (const [key, count] of Object.entries(pb.costComp)) {
          p.components[key] -= count;
        }

        pb.isBuilt = true;
        pb.sprite.setTexture(pb.spriteKey);
        pb.textLabel.setText(pb.label || pb.title);
        pb.textLabel.setColor('#ffffff');

        soundFx.playPurchase();
        this.closeModal();
        this.scene.events.emit('notify', `${pb.title} erfolgreich errichtet und in Betrieb genommen!`);
      };
    }
  }

  // 4a. Drohnen-Hangar Modal
  openDroneModal() {
    const pb = this.purchasableBuildings.find(b => b.id === 'drone_hangar');
    const ores = pb.storedOres || [];
    let oreList = ores.map(o => `<span style="background: rgba(255,255,255,0.08); padding: 3px 8px; border-radius: 6px; font-size: 12px; display: inline-flex; align-items: center; gap: 5px;">${oreIcon(o, 13)} ${ORE_DATA[o]?.name || o}</span>`).join(' ');
    if (ores.length === 0) oreList = '<span style="color: #94a3b8; font-style: italic;">Drohne schürft aktuell...</span>';

    const content = `
      <div style="display: flex; flex-direction: column; gap: 14px;">
        <p style="font-size: 12px; color: #94a3b8;">
          Die automatisierte Drohne erkundet das Minengebiet und lagert gefundene Mineralien im Silo ein.
        </p>
        <div style="background: rgba(15, 23, 42, 0.75); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 12px;">
          <strong style="color: #f8fafc; font-size: 13px; display: block; margin-bottom: 6px;">Eingelagerte Drohnen-Funde (${ores.length}/12):</strong>
          <div style="display: flex; flex-wrap: wrap; gap: 6px;">
            ${oreList}
          </div>
        </div>
        <button id="btn-collect-drone-ores" class="btn-buy btn-lg" ${ores.length === 0 ? 'disabled' : ''} style="width: 100%;">
          ${icon('container', '', 14)}
          <span>ALLE FUNDE INS FAHRZEUG ÜBERTRAGEN</span>
        </button>
      </div>
    `;

    this.openModal(`
      <div style="display: flex; align-items: center; gap: 8px;">
        ${icon('bot', '', 18)}
        <span>DROHNEN-HANGAR</span>
      </div>
    `, content);



    const btnCollect = document.getElementById('btn-collect-drone-ores');
    if (btnCollect) {
      btnCollect.onclick = () => {
        let moved = 0;
        while (pb.storedOres.length > 0 && !this.player.isCargoFull) {
          const ore = pb.storedOres.shift();
          this.player.cargo.push(ore);
          moved++;
        }
        soundFx.playPurchase();
        this.openDroneModal();
        this.scene.events.emit('notify', `${moved} Erze aus dem Drohnen-Hangar übernommen!`);
      };
    }
  }

  // 4b. Quanten-Teleporter Modal
  openTeleporterModal() {
    const p = this.player;
    const maxDepth = p.highestDepthReached || 0;

    let totalVal = 0;
    p.cargo.forEach(ore => {
      totalVal += ORE_DATA[ore]?.value || 0;
    });

    const content = `
      <div style="display: flex; flex-direction: column; gap: 14px;">
        <p style="font-size: 12px; color: #94a3b8;">
          Quantentechnologie und Hochdruck-Rohrpost ermöglichen schnellen Frachttransport und Tiefen-Warp.
        </p>
        <div style="background: rgba(15, 23, 42, 0.75); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 12px; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <strong style="color: #f8fafc; font-size: 13px; display: block;">Pneumatischer Erz-Transceiver</strong>
            <span style="font-size: 11px; color: #94a3b8;">Fracht (${p.cargo.length} Erze) direkt zur Börse schicken</span>
          </div>
          <button id="btn-pipe-sell" class="btn-buy" ${p.cargo.length === 0 ? 'disabled' : ''} style="height: 32px; padding: 0 14px; font-size: 11.5px;">
            SOFORT VERKAUFEN (+€${totalVal})
          </button>
        </div>

        <div style="background: rgba(15, 23, 42, 0.75); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 12px; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <strong style="color: #38bdf8; font-size: 13px; display: block;">Tiefen-Warp Generator</strong>
            <span style="font-size: 11px; color: #94a3b8;">Bohrer direkt auf tiefste Rekord-Tiefe (${maxDepth}m) teleportieren</span>
          </div>
          <button id="btn-depth-warp" class="btn-buy" ${maxDepth < 5 ? 'disabled' : ''} style="height: 32px; padding: 0 14px; font-size: 11.5px;">
            ${maxDepth >= 5 ? `WARPEN (${maxDepth}m)` : 'TIEFE ZU GERING'}
          </button>
        </div>
      </div>
    `;

    this.openModal(`
      <div style="display: flex; align-items: center; gap: 8px;">
        ${icon('navigation', '', 18)}
        <span>TELEPORTER</span>
      </div>
    `, content);



    const btnPipe = document.getElementById('btn-pipe-sell');
    if (btnPipe) {
      btnPipe.onclick = () => {
        const earned = p.sellCargo();
        soundFx.playPurchase();
        this.openTeleporterModal();
        this.scene.events.emit('notify', `Rohrpost: Erze zur Börse gesendet für +€${earned}!`);
      };
    }

    const btnWarp = document.getElementById('btn-depth-warp');
    if (btnWarp) {
      btnWarp.onclick = () => {
        if (maxDepth >= 5) {
          p.gy = maxDepth;
          p.y = p.gy * TILE_SIZE + TILE_SIZE / 2;
          p.sprite.setPosition(p.x, p.y);
          p.headlight.setPosition(p.x, p.y);
          soundFx.playJetpack();
          this.closeModal();
          this.scene.events.emit('notify', `Warp erfolgreich auf Tiefe ${maxDepth}m ausgeführt!`);
        }
      };
    }
  }

  // 4c. Geothermie-Kraftwerk Modal
  openPowerplantModal() {
    const pb = this.purchasableBuildings.find(b => b.id === 'powerplant');
    const totalAcc = pb.accumulatedCash || 0;

    const content = `
      <div style="display: flex; flex-direction: column; gap: 14px;">
        <p style="font-size: 12px; color: #94a3b8;">
          Das Geothermie-Kraftwerk nutzt vulkanische Wärme der Schächte und speist saubere Energie ins Basis-Netzwerk ein.
        </p>
        <div style="background: #141c2c; border: 1px solid #10b981; border-radius: 8px; padding: 12px; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <strong style="color: #10b981; font-size: 13px; display: block;">PASSIVER STROMERTRAG: AKTIV</strong>
            <span style="font-size: 11px; color: #94a3b8;">Generiert automatisch +€35 alle 8 Sekunden</span>
          </div>
          <span style="font-size: 13px; font-weight: 800; color: #fbbf24;">Gesamt generiert: €${totalAcc}</span>
        </div>
        <div style="background: #141c2c; border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; padding: 10px; font-size: 12px; color: #38bdf8;">
          Bonus-Effekt: Das Kraftwerk versorgt die Docking-Station mit Starkstrom (Verdoppelte Tank- und Reparatur-Geschwindigkeit)!
        </div>
      </div>
    `;

    this.openModal(`
      <div style="display: flex; align-items: center; gap: 8px;">
        ${icon('zap', '', 18)}
        <span>KRAFTWERK</span>
      </div>
    `, content);


  }

  // =========================================================
  // BASIS-DOCKING & SCHMELZOFEN
  // =========================================================
  openDockModal() {
    const fuelCost = Math.round((this.player.maxFuel - this.player.fuel) * 0.4);
    const repairCost = Math.round((this.player.maxHull - this.player.hull) * 1.0);


    // Helper für Bauteil- und Levelanforderungen
    const checkAfford = (nextData) => {
      if (!nextData) return false;
      let compOk = true;
      if (nextData.comp) {
        const have = this.player.components[nextData.comp.key] || 0;
        if (have < nextData.comp.count) compOk = false;
      }
      return this.player.cash >= nextData.cost && compOk && (this.player.level || 1) >= nextData.level;
    };

    const formatCompReq = (nextData) => {
      if (!nextData || !nextData.comp) return '';
      const have = this.player.components[nextData.comp.key] || 0;
      const isMet = have >= nextData.comp.count;
      const compIconName = COMPONENT_ICONS[nextData.comp.key] || 'box';
      return ` &bull; <span style="color: ${isMet ? '#38bdf8' : '#f87171'}; font-weight: 600;">${icon(compIconName, '', 12)} ${nextData.comp.count}x ${nextData.comp.name} (${have}/${nextData.comp.count})</span>`;
    };

    const formatLevelReq = (nextData) => {
      if (!nextData || (this.player.level || 1) >= nextData.level) return '';
      return ` &bull; <span style="color: #f87171; font-weight: 600;">Ab Level ${nextData.level}</span>`;
    };

    // 1. Treibstoff-Tank
    const curTankTier = this.player.tankTier || 1;
    const curTankData = this.player.getTankData ? this.player.getTankData() : (TANK_TIERS[curTankTier - 1] || TANK_TIERS[0]);
    const canUpgradeTank = curTankTier < TANK_TIERS.length;
    const nextTankData = canUpgradeTank ? TANK_TIERS[curTankTier] : null;
    const canAffordTank = checkAfford(nextTankData);

    // 2. Gehäuseschutz & Karosserie (Case-Schutz)
    const curHullTier = this.player.hullTier || 1;
    const curHullData = this.player.getHullData ? this.player.getHullData() : (HULL_TIERS[curHullTier - 1] || HULL_TIERS[0]);
    const canUpgradeHull = curHullTier < HULL_TIERS.length;
    const nextHullData = canUpgradeHull ? HULL_TIERS[curHullTier] : null;
    const canAffordHull = checkAfford(nextHullData);

    // 3. Bohrkopf-Werkstatt (Montage erforschter Köpfe oder direktes Hangar-Upgrade)
    const curDrillTier = this.player.drillTier || 1;
    const resDrillTier = this.player.researchedDrillTier || curDrillTier;
    const curDrillData = DRILL_DATA[curDrillTier - 1] || DRILL_DATA[0];
    const canMount = resDrillTier > curDrillTier;
    const mountDrillData = canMount ? (DRILL_DATA[resDrillTier - 1] || DRILL_DATA[0]) : null;
    const canUpgradeDrill = curDrillTier < DRILL_DATA.length;
    const nextDrillData = canUpgradeDrill ? DRILL_DATA[curDrillTier] : null;
    const canAffordDrill = checkAfford(nextDrillData);

    // 4. Antrieb & Steigflug
    const curEngineTier = this.player.engineTier || 1;
    const curEngineData = this.player.getEngineData ? this.player.getEngineData() : (ENGINE_TIERS[curEngineTier - 1] || ENGINE_TIERS[0]);
    const canUpgradeEngine = curEngineTier < ENGINE_TIERS.length;
    const nextEngineData = canUpgradeEngine ? ENGINE_TIERS[curEngineTier] : null;
    const canAffordEngine = checkAfford(nextEngineData);

    // 5. Frachtraum-Kapazität
    const curCargoTier = this.player.cargoTier || 1;
    const curCargoData = this.player.getCargoData ? this.player.getCargoData() : (CARGO_TIERS[curCargoTier - 1] || CARGO_TIERS[0]);
    const canUpgradeCargo = curCargoTier < CARGO_TIERS.length;
    const nextCargoData = canUpgradeCargo ? CARGO_TIERS[curCargoTier] : null;
    const canAffordCargo = checkAfford(nextCargoData);

    // 6. Geo-Sensor & Radar
    const curSensorTier = this.player.sensorTier || 1;
    const curSensorData = this.player.getSensorData ? this.player.getSensorData() : (SENSOR_TIERS[curSensorTier - 1] || SENSOR_TIERS[0]);
    const canUpgradeSensor = curSensorTier < SENSOR_TIERS.length;
    const nextSensorData = canUpgradeSensor ? SENSOR_TIERS[curSensorTier] : null;
    const canAffordSensor = checkAfford(nextSensorData);

    const renderDockCard = (cfg) => {
      const { id, iconName, title, curTier = 1, maxTier = 10, curData, canUpgrade, nextData, canAfford, specialAction } = cfg;

      // Segmented Progress Bar wie im Labor
      let segmentsHtml = '<div class="segmented-progress-bar">';
      for (let s = 1; s <= maxTier; s++) {
        if (s <= curTier) {
          segmentsHtml += `
            <div class="seg-step completed${s === curTier ? ' current' : ''}">
              <span><span class="step-label">Stufe </span>${s}</span>
            </div>
          `;
        } else if (s === curTier + 1) {
          segmentsHtml += `
            <div class="seg-step active">
              <span><span class="step-label">Stufe </span>${s}</span>
            </div>
          `;
        } else {
          segmentsHtml += `
            <div class="seg-step locked">
              <span><span class="step-label">Stufe </span>${s}</span>
            </div>
          `;
        }
      }
      segmentsHtml += '</div>';

      let compBadgeHtml = '';
      let levelBadgeHtml = '';
      let costBadgeHtml = '';
      let actionBtnHtml = '';

      if (specialAction) {
        actionBtnHtml = specialAction;
      } else if (canUpgrade && nextData) {
        const isLevelMet = (this.player.level || 1) >= nextData.level;
        if (nextData.comp) {
          const have = this.player.components[nextData.comp.key] || 0;
          const isMet = have >= nextData.comp.count;
          const compIconName = COMPONENT_ICONS[nextData.comp.key] || 'box';
          compBadgeHtml = `
            <span style="background: rgba(192, 132, 252, 0.12); border: 1px solid ${isMet ? 'rgba(192, 132, 252, 0.3)' : 'rgba(239, 68, 68, 0.4)'}; color: ${isMet ? '#c084fc' : '#ef4444'}; font-weight: 700; font-size: 11px; padding: 2px 8px; border-radius: 6px; display: inline-flex; align-items: center; gap: 5px; white-space: nowrap;">
              ${icon(compIconName, '', 12)} ${nextData.comp.count}x ${nextData.comp.name} (${have}/${nextData.comp.count})
            </span>
          `;
        }

        if (!isLevelMet) {
          levelBadgeHtml = `
            <span style="background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.3); color: #ef4444; font-weight: 700; font-size: 11px; padding: 2px 6px; border-radius: 4px; white-space: nowrap;">
              Lv. ${nextData.level}
            </span>
          `;
        }

        const isCashMet = this.player.cash >= nextData.cost;
        costBadgeHtml = `
          <span style="background: rgba(251, 191, 36, 0.12); border: 1px solid ${isCashMet ? 'rgba(251, 191, 36, 0.3)' : 'rgba(239, 68, 68, 0.4)'}; color: ${isCashMet ? '#fbbf24' : '#ef4444'}; font-weight: 800; font-size: 11.5px; padding: 2px 8px; border-radius: 6px; display: inline-flex; align-items: center; justify-content: center; gap: 3px; width: 100%; box-sizing: border-box; white-space: nowrap; font-variant-numeric: tabular-nums;">
            ${icon('coins', '', 11)} €${nextData.cost}
          </span>
        `;

        actionBtnHtml = `
          <button id="${id}" class="btn-buy" style="width: 100%; height: 30px; padding: 0 10px; font-size: 11px; font-weight: 800; display: inline-flex; align-items: center; justify-content: center; gap: 4px;" ${canAfford ? '' : 'disabled'}>
            ${icon('wrench', '', 12)}
            <span>Aufrüsten</span>
          </button>
        `;
      } else {
        actionBtnHtml = `
          <span style="font-size: 11px; color: #10b981; font-weight: 700; background: rgba(16,185,129,0.15); border: 1px solid rgba(16,185,129,0.3); padding: 3px 8px; border-radius: 6px; display: inline-flex; align-items: center; justify-content: center; width: 100%; box-sizing: border-box;">
            Maximal
          </span>
        `;
      }

      let actionRowHtml = '';
      if (canUpgrade && nextData) {
        actionRowHtml = `
          <div class="cat-action-row" style="margin-top: 6px; display: flex; align-items: center; background: rgba(15,23,42,0.6); padding: 8px 12px; border-radius: 8px; gap: 10px; box-sizing: border-box;">
            <!-- Spalte 1: Modul-Name (200px) -->
            <div style="width: 200px; min-width: 200px; flex-shrink: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
              <strong style="color: #f8fafc; font-size: 13px;">${nextData.name}</strong>
            </div>

            <!-- Spalte 2: Stat (100px) -->
            <div style="width: 100px; min-width: 100px; flex-shrink: 0;">
              <span style="background: rgba(56, 189, 248, 0.15); border: 1px solid rgba(56, 189, 248, 0.3); color: #38bdf8; font-weight: 700; font-size: 11.5px; padding: 2px 8px; border-radius: 6px; display: inline-flex; align-items: center; justify-content: center; width: 100%; box-sizing: border-box; white-space: nowrap; font-variant-numeric: tabular-nums;">
                ${nextData.stat}
              </span>
            </div>

            <!-- Spalte 3: Spezialbauteile & Level (flex: 1, rechtsbündig) -->
            <div style="flex: 1; min-width: 0; display: flex; align-items: center; justify-content: flex-end; gap: 6px;">
              ${levelBadgeHtml}
              ${compBadgeHtml}
            </div>

            <!-- Spalte 4: Preis-Badge (90px) -->
            <div style="width: 90px; min-width: 90px; flex-shrink: 0; display: flex; align-items: center; justify-content: center;">
              ${costBadgeHtml}
            </div>

            <!-- Spalte 5: Button (110px) -->
            <div style="width: 110px; min-width: 110px; flex-shrink: 0; display: flex; align-items: center; justify-content: flex-end;">
              ${actionBtnHtml}
            </div>
          </div>
        `;
      } else if (specialAction && mountDrillData) {
        actionRowHtml = `
          <div class="cat-action-row" style="margin-top: 6px; display: flex; align-items: center; background: rgba(15,23,42,0.6); padding: 8px 12px; border-radius: 8px; gap: 10px; box-sizing: border-box;">
            <!-- Spalte 1: Modul-Name (200px) -->
            <div style="width: 200px; min-width: 200px; flex-shrink: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
              <strong style="color: #f8fafc; font-size: 13px;">${mountDrillData.name}</strong>
            </div>

            <!-- Spalte 2: Stat (100px) -->
            <div style="width: 100px; min-width: 100px; flex-shrink: 0;">
              <span style="background: rgba(56, 189, 248, 0.15); border: 1px solid rgba(56, 189, 248, 0.3); color: #38bdf8; font-weight: 700; font-size: 11.5px; padding: 2px 8px; border-radius: 6px; display: inline-flex; align-items: center; justify-content: center; width: 100%; box-sizing: border-box; white-space: nowrap; font-variant-numeric: tabular-nums;">
                ${mountDrillData.stat}
              </span>
            </div>

            <!-- Spalte 3: Bereit im Labor erforscht -->
            <div style="flex: 1; min-width: 0; display: flex; align-items: center; justify-content: flex-end; gap: 6px;">
              <span style="color: #34d399; font-size: 11px; font-weight: 700;">Im Labor erforscht</span>
            </div>

            <!-- Spalte 4: Preis-Badge (90px) -->
            <div style="width: 90px; min-width: 90px; flex-shrink: 0; display: flex; align-items: center; justify-content: center;">
              <span style="color: #64748b; font-size: 11px;">Kostenlos</span>
            </div>

            <!-- Spalte 5: Button (110px) -->
            <div style="width: 110px; min-width: 110px; flex-shrink: 0; display: flex; align-items: center; justify-content: flex-end;">
              ${actionBtnHtml}
            </div>
          </div>
        `;
      } else {
        actionRowHtml = `
          <div class="cat-action-row" style="margin-top: 6px; display: flex; align-items: center; background: rgba(15,23,42,0.6); padding: 8px 12px; border-radius: 8px; gap: 10px; box-sizing: border-box;">
            <div style="flex: 1; min-width: 0;">
              <strong style="color: #10b981; font-size: 12.5px; display: inline-flex; align-items: center; gap: 6px;">
                ${icon('award', '', 14)} Vollständig aufgerüstet
              </strong>
            </div>
            <div style="width: 110px; min-width: 110px; flex-shrink: 0; display: flex; align-items: center; justify-content: flex-end;">
              ${actionBtnHtml}
            </div>
          </div>
        `;
      }

      return `
        <div class="tech-category-card">
          <div class="cat-header-row" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <div class="cat-title-wrap" style="display: flex; align-items: center; gap: 8px; font-weight: 700; font-size: 13px; color: #f8fafc;">
              ${icon(iconName, '', 16)}
              <span>${title}</span>
            </div>
            <div class="cat-status-pill" style="font-size: 11px; color: #94a3b8; background: rgba(255, 255, 255, 0.06); padding: 3px 8px; border-radius: 6px;">
              Stufe ${curTier}/${maxTier} • <strong style="color: #10b981;">${curData.stat}</strong>
            </div>
          </div>

          ${segmentsHtml}
          ${actionRowHtml}
        </div>
      `;
    };

    const tankSection = renderDockCard({
      id: 'btn-upgrade-tank-dock',
      iconName: 'fuel',
      title: 'TREIBSTOFF-TANK',
      curTier: curTankTier,
      maxTier: TANK_TIERS.length,
      curData: curTankData,
      canUpgrade: canUpgradeTank,
      nextData: nextTankData,
      canAfford: canAffordTank
    });

    const hullSection = renderDockCard({
      id: 'btn-upgrade-hull-dock',
      iconName: 'shield-cog',
      title: 'GEHÄUSESCHUTZ / PANZERUNG',
      curTier: curHullTier,
      maxTier: HULL_TIERS.length,
      curData: curHullData,
      canUpgrade: canUpgradeHull,
      nextData: nextHullData,
      canAfford: canAffordHull
    });

    const drillSection = renderDockCard({
      id: 'btn-upgrade-drill-dock',
      iconName: 'pickaxe',
      title: 'BOHRKOPF-WERKSTATT',
      curTier: curDrillTier,
      maxTier: DRILL_DATA.length,
      curData: curDrillData,
      canUpgrade: canUpgradeDrill,
      nextData: canMount ? mountDrillData : nextDrillData,
      canAfford: canAffordDrill,
      specialAction: canMount ? `
        <button id="btn-mount-drill-dock" class="btn-buy" style="width: 100%; height: 30px; padding: 0 10px; font-size: 11px; font-weight: 800; background: linear-gradient(135deg, #10b981, #059669); display: inline-flex; align-items: center; justify-content: center; gap: 4px;">
          ${icon('wrench', '', 12)} Montieren
        </button>
      ` : null
    });

    const engineSection = renderDockCard({
      id: 'btn-upgrade-engine-dock',
      iconName: 'zap',
      title: 'ANTRIEB & STEIGFLUG',
      curTier: curEngineTier,
      maxTier: ENGINE_TIERS.length,
      curData: curEngineData,
      canUpgrade: canUpgradeEngine,
      nextData: nextEngineData,
      canAfford: canAffordEngine
    });

    const cargoSection = renderDockCard({
      id: 'btn-upgrade-cargo-dock',
      iconName: 'container',
      title: 'FRACHTRAUM-KAPAZITÄT',
      curTier: curCargoTier,
      maxTier: CARGO_TIERS.length,
      curData: curCargoData,
      canUpgrade: canUpgradeCargo,
      nextData: nextCargoData,
      canAfford: canAffordCargo
    });

    const sensorSection = renderDockCard({
      id: 'btn-upgrade-sensor-dock',
      iconName: 'radio',
      title: 'GEO-SENSOR & RADAR',
      curTier: curSensorTier,
      maxTier: SENSOR_TIERS.length,
      curData: curSensorData,
      canUpgrade: canUpgradeSensor,
      nextData: nextSensorData,
      canAfford: canAffordSensor
    });

    const content = `
      <div style="display: flex; flex-direction: column; gap: 8px; max-height: 520px; overflow-y: auto; padding-right: 4px;">
        <div style="background: rgba(15, 23, 42, 0.75); border: 1px solid rgba(255,255,255,0.08); padding: 10px 14px; border-radius: 10px; display: flex; align-items: center; gap: 10px; box-sizing: border-box;">
          <div style="width: 135px; min-width: 135px; flex-shrink: 0;">
            <strong style="display: inline-flex; align-items: center; gap: 6px; font-size: 13px; color: #f8fafc; white-space: nowrap;">
              ${icon('fuel', '', 14)} Tank
            </strong>
          </div>
          <div style="width: 175px; min-width: 175px; flex-shrink: 0;">
            <span style="background: rgba(245, 158, 11, 0.15); border: 1px solid rgba(245, 158, 11, 0.3); color: #f59e0b; font-weight: 800; font-size: 11.5px; padding: 2px 8px; border-radius: 6px; display: inline-flex; align-items: center; justify-content: center; width: 100%; box-sizing: border-box; white-space: nowrap; font-variant-numeric: tabular-nums;">
              ${Math.round(this.player.fuel)} / ${this.player.maxFuel} L
            </span>
          </div>
          <div style="flex: 1; min-width: 0;"></div>
          <div style="width: 90px; min-width: 90px; flex-shrink: 0; display: flex; align-items: center; justify-content: center;">
            ${fuelCost > 0 ? `
              <span style="background: rgba(251, 191, 36, 0.12); border: 1px solid rgba(251, 191, 36, 0.3); color: #fbbf24; font-weight: 800; font-size: 11.5px; padding: 2px 8px; border-radius: 6px; display: inline-flex; align-items: center; justify-content: center; gap: 3px; width: 100%; box-sizing: border-box; white-space: nowrap; font-variant-numeric: tabular-nums;">
                ${icon('coins', '', 11)} €${fuelCost}
              </span>
            ` : ''}
          </div>
          <div style="width: 110px; min-width: 110px; flex-shrink: 0; display: flex; align-items: center; justify-content: flex-end;">
            <button id="btn-refuel-dock" class="btn-buy" style="width: 100%; height: 30px; padding: 0 10px; font-size: 11px; font-weight: 800; display: inline-flex; align-items: center; justify-content: center; gap: 4px;" ${fuelCost <= 0 || this.player.cash < fuelCost ? 'disabled' : ''}>
              ${icon('fuel', '', 12)}
              <span>${fuelCost <= 0 ? 'Voll' : 'Tanken'}</span>
            </button>
          </div>
        </div>

        <div style="background: rgba(15, 23, 42, 0.75); border: 1px solid rgba(255,255,255,0.08); padding: 10px 14px; border-radius: 10px; display: flex; align-items: center; gap: 10px; box-sizing: border-box;">
          <div style="width: 135px; min-width: 135px; flex-shrink: 0;">
            <strong style="display: inline-flex; align-items: center; gap: 6px; font-size: 13px; color: #f8fafc; white-space: nowrap;">
              ${icon('shield', '', 14)} Hülle
            </strong>
          </div>
          <div style="width: 175px; min-width: 175px; flex-shrink: 0;">
            <span style="background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.3); color: #10b981; font-weight: 800; font-size: 11.5px; padding: 2px 8px; border-radius: 6px; display: inline-flex; align-items: center; justify-content: center; width: 100%; box-sizing: border-box; white-space: nowrap; font-variant-numeric: tabular-nums;">
              ${Math.round(this.player.hull)} / ${this.player.maxHull} HP
            </span>
          </div>
          <div style="flex: 1; min-width: 0;"></div>
          <div style="width: 90px; min-width: 90px; flex-shrink: 0; display: flex; align-items: center; justify-content: center;">
            ${repairCost > 0 ? `
              <span style="background: rgba(251, 191, 36, 0.12); border: 1px solid rgba(251, 191, 36, 0.3); color: #fbbf24; font-weight: 800; font-size: 11.5px; padding: 2px 8px; border-radius: 6px; display: inline-flex; align-items: center; justify-content: center; gap: 3px; width: 100%; box-sizing: border-box; white-space: nowrap; font-variant-numeric: tabular-nums;">
                ${icon('coins', '', 11)} €${repairCost}
              </span>
            ` : ''}
          </div>
          <div style="width: 110px; min-width: 110px; flex-shrink: 0; display: flex; align-items: center; justify-content: flex-end;">
            <button id="btn-repair-dock" class="btn-buy" style="width: 100%; height: 30px; padding: 0 10px; font-size: 11px; font-weight: 800; display: inline-flex; align-items: center; justify-content: center; gap: 4px;" ${repairCost <= 0 || this.player.cash < repairCost ? 'disabled' : ''}>
              ${icon('shield', '', 12)}
              <span>${repairCost <= 0 ? 'Intakt' : 'Reparieren'}</span>
            </button>
          </div>
        </div>

        <div style="font-weight: 800; font-size: 12px; color: #38bdf8; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 6px; display: flex; align-items: center; gap: 6px;">
          ${icon('wrench', '', 14)} Modul-Aufrüstung
        </div>

        ${tankSection}
        ${hullSection}
        ${drillSection}
        ${engineSection}
        ${cargoSection}
        ${sensorSection}
      </div>
    `;

    this.openModal(`
      <div style="display: flex; align-items: center; gap: 8px;">
        ${icon('wrench', '', 18)}
        <span>HANGAR</span>
      </div>
    `, content);


    const btnFuel = document.getElementById('btn-refuel-dock');
    if (btnFuel) {
      btnFuel.onclick = () => {
        if (this.player.cash < fuelCost) {
          this.scene.events.emit('notify', 'Nicht genug Geld!');
          return;
        }
        this.player.cash -= fuelCost;
        this.player.refuel();
        soundFx.playPurchase();
        this.openDockModal();
        this.scene.events.emit('notify', 'Tank vollständig aufgeladen!');
      };
    }

    const btnRepair = document.getElementById('btn-repair-dock');
    if (btnRepair) {
      btnRepair.onclick = () => {
        if (this.player.cash < repairCost) {
          this.scene.events.emit('notify', 'Nicht genug Geld!');
          return;
        }
        this.player.cash -= repairCost;
        this.player.repairHull();
        soundFx.playPurchase();
        this.openDockModal();
        this.scene.events.emit('notify', 'Rumpf vollständig repariert!');
      };
    }

    // 1. Tank-Upgrade
    const btnUpgradeTank = document.getElementById('btn-upgrade-tank-dock');
    if (btnUpgradeTank && canUpgradeTank && nextTankData) {
      btnUpgradeTank.onclick = () => {
        if (!canAffordTank) return;
        this.player.cash -= nextTankData.cost;
        if (nextTankData.comp) {
          this.player.components[nextTankData.comp.key] = (this.player.components[nextTankData.comp.key] || 0) - nextTankData.comp.count;
        }
        if (this.player.upgradeTank) {
          this.player.upgradeTank(curTankTier + 1);
        } else {
          this.player.tankTier = curTankTier + 1;
          this.player.maxFuel = nextTankData.maxFuel;
        }
        soundFx.playUpgrade();
        this.scene.events.emit('notify', `Treibstoff-Tank vergrößert: ${nextTankData.name} (${nextTankData.maxFuel} L)!`);
        this.openDockModal();
      };
    }

    // 2. Gehäuseschutz-Upgrade
    const btnUpgradeHull = document.getElementById('btn-upgrade-hull-dock');
    if (btnUpgradeHull && canUpgradeHull && nextHullData) {
      btnUpgradeHull.onclick = () => {
        if (!canAffordHull) return;
        this.player.cash -= nextHullData.cost;
        if (nextHullData.comp) {
          this.player.components[nextHullData.comp.key] = (this.player.components[nextHullData.comp.key] || 0) - nextHullData.comp.count;
        }
        if (this.player.upgradeHull) {
          this.player.upgradeHull(curHullTier + 1);
        } else {
          this.player.hullTier = curHullTier + 1;
          this.player.maxHull = nextHullData.maxHull;
          this.player.hull = this.player.maxHull;
        }
        soundFx.playUpgrade();
        this.scene.events.emit('notify', `Case-Schutz verbessert: ${nextHullData.name} (${nextHullData.maxHull} HP)!`);
        this.openDockModal();
      };
    }

    // 3. Bohrkopf-Montage (kostenlos falls im Labor erforscht)
    const btnMountDrill = document.getElementById('btn-mount-drill-dock');
    if (btnMountDrill && mountDrillData) {
      btnMountDrill.onclick = () => {
        this.player.drillTier = resDrillTier;
        this.player.drillPower = DRILL_DPS[resDrillTier - 1];
        soundFx.playUpgrade();
        this.openDockModal();
        this.scene.events.emit('notify', `${mountDrillData.name} erfolgreich montiert!`);
      };
    }

    // 3b. Bohrkopf direkt im Hangar aufrüsten & montieren
    const btnUpgradeDrill = document.getElementById('btn-upgrade-drill-dock');
    if (btnUpgradeDrill && canUpgradeDrill && nextDrillData) {
      btnUpgradeDrill.onclick = () => {
        if (!canAffordDrill) return;
        this.player.cash -= nextDrillData.cost;
        if (nextDrillData.comp) {
          this.player.components[nextDrillData.comp.key] = (this.player.components[nextDrillData.comp.key] || 0) - nextDrillData.comp.count;
        }
        this.player.researchedDrillTier = Math.max(this.player.researchedDrillTier || 1, curDrillTier + 1);
        this.player.drillTier = curDrillTier + 1;
        this.player.drillPower = DRILL_DPS[curDrillTier];
        soundFx.playUpgrade();
        this.scene.events.emit('notify', `${nextDrillData.name} montiert & verbessert (${nextDrillData.stat})!`);
        this.openDockModal();
      };
    }

    // 4. Antrieb-Upgrade
    const btnUpgradeEngine = document.getElementById('btn-upgrade-engine-dock');
    if (btnUpgradeEngine && canUpgradeEngine && nextEngineData) {
      btnUpgradeEngine.onclick = () => {
        if (!canAffordEngine) return;
        this.player.cash -= nextEngineData.cost;
        if (nextEngineData.comp) {
          this.player.components[nextEngineData.comp.key] = (this.player.components[nextEngineData.comp.key] || 0) - nextEngineData.comp.count;
        }
        if (this.player.upgradeEngine) {
          this.player.upgradeEngine(curEngineTier + 1);
        } else {
          this.player.engineTier = curEngineTier + 1;
        }
        soundFx.playUpgrade();
        this.scene.events.emit('notify', `Antrieb verbessert: ${nextEngineData.name} (${nextEngineData.stat})!`);
        this.openDockModal();
      };
    }

    // 5. Frachtraum-Upgrade
    const btnUpgradeCargo = document.getElementById('btn-upgrade-cargo-dock');
    if (btnUpgradeCargo && canUpgradeCargo && nextCargoData) {
      btnUpgradeCargo.onclick = () => {
        if (!canAffordCargo) return;
        this.player.cash -= nextCargoData.cost;
        if (nextCargoData.comp) {
          this.player.components[nextCargoData.comp.key] = (this.player.components[nextCargoData.comp.key] || 0) - nextCargoData.comp.count;
        }
        if (this.player.upgradeCargo) {
          this.player.upgradeCargo(curCargoTier + 1);
        } else {
          this.player.cargoTier = curCargoTier + 1;
          this.player.maxCargo = nextCargoData.maxCargo;
        }
        soundFx.playUpgrade();
        this.scene.events.emit('notify', `Frachtraum vergrößert: ${nextCargoData.name} (${nextCargoData.stat})!`);
        this.openDockModal();
      };
    }

    // 6. Sensor-Upgrade
    const btnUpgradeSensor = document.getElementById('btn-upgrade-sensor-dock');
    if (btnUpgradeSensor && canUpgradeSensor && nextSensorData) {
      btnUpgradeSensor.onclick = () => {
        if (!canAffordSensor) return;
        this.player.cash -= nextSensorData.cost;
        if (nextSensorData.comp) {
          this.player.components[nextSensorData.comp.key] = (this.player.components[nextSensorData.comp.key] || 0) - nextSensorData.comp.count;
        }
        if (this.player.upgradeSensor) {
          this.player.upgradeSensor(curSensorTier + 1);
        } else {
          this.player.sensorTier = curSensorTier + 1;
        }
        soundFx.playUpgrade();
        this.scene.events.emit('notify', `Geo-Sensor aufgerüstet: ${nextSensorData.name} (${nextSensorData.stat})!`);
        this.openDockModal();
      };
    }


  }

  // =========================================================
  // 3. RAFFINERIE (ZEITGESTEUERT & OFFLINE ANHAND GERÄTE-UHRZEIT)
  // =========================================================

  processRefinery(now = Date.now()) {
    const elapsedMs = Math.max(0, now - this.refinery.lastTimestamp);
    this.refinery.lastTimestamp = now;

    if (elapsedMs <= 0 || this.refinery.queue.length === 0) return 0;

    let finishedCount = 0;

    // 1. Schmelzofen-Linie (Erze -> Barren)
    let remSmelt = elapsedMs;
    while (remSmelt > 0) {
      const currentSmelt = this.refinery.queue.find(item => !item.isProduct);
      if (!currentSmelt) break;

      if (remSmelt >= currentSmelt.remainingMs) {
        remSmelt -= currentSmelt.remainingMs;
        const idx = this.refinery.queue.indexOf(currentSmelt);
        this.refinery.queue.splice(idx, 1);
        currentSmelt.remainingMs = 0;
        currentSmelt.finishedAt = now - remSmelt;
        this.refinery.finished.push(currentSmelt);
        finishedCount++;
      } else {
        currentSmelt.remainingMs -= remSmelt;
        remSmelt = 0;
      }
    }

    // 2. Industrie-Fertigungslinie (Produkte)
    let remCraft = elapsedMs;
    while (remCraft > 0) {
      const currentCraft = this.refinery.queue.find(item => item.isProduct);
      if (!currentCraft) break;

      if (remCraft >= currentCraft.remainingMs) {
        remCraft -= currentCraft.remainingMs;
        const idx = this.refinery.queue.indexOf(currentCraft);
        this.refinery.queue.splice(idx, 1);
        currentCraft.remainingMs = 0;
        currentCraft.finishedAt = now - remCraft;
        this.refinery.finished.push(currentCraft);
        finishedCount++;
      } else {
        currentCraft.remainingMs -= remCraft;
        remCraft = 0;
      }
    }

    return finishedCount;
  }

  getRefinerySaveData() {
    this.processRefinery(Date.now());
    return {
      queue: this.refinery.queue.map(item => ({
        id: item.id,
        isProduct: !!item.isProduct,
        productId: item.productId || null,
        ore: item.ore || null,
        name: item.name,
        durationMs: item.durationMs,
        remainingMs: item.remainingMs,
        value: item.value
      })),
      finished: this.refinery.finished.map(item => ({
        id: item.id,
        isProduct: !!item.isProduct,
        productId: item.productId || null,
        ore: item.ore || null,
        name: item.name,
        value: item.value,
        finishedAt: item.finishedAt || Date.now()
      })),
      lastTimestamp: this.refinery.lastTimestamp
    };
  }

  loadRefinerySaveData(savedData) {
    if (!savedData) return;
    this.refinery.queue = (savedData.queue || []).map(item => ({
      id: item.id || `q_${Math.random().toString(36).substr(2, 9)}`,
      isProduct: !!item.isProduct,
      productId: item.productId || null,
      ore: item.ore,
      name: item.name || (item.productId ? FACTORY_PRODUCTS[item.productId]?.name : ORE_DATA[item.ore]?.name) || 'Produkt',
      durationMs: item.durationMs || (item.isProduct && item.productId ? (FACTORY_PRODUCTS[item.productId]?.durationSec * 1000) : getRefinerySmeltDurationMs(item.ore)),
      remainingMs: Math.max(0, item.remainingMs !== undefined ? item.remainingMs : (item.durationMs || 10000)),
      value: item.value || (item.isProduct && item.productId ? FACTORY_PRODUCTS[item.productId]?.value : getRefinedOreNetValue(item.ore))
    }));

    this.refinery.finished = (savedData.finished || []).map(item => ({
      id: item.id || `f_${Math.random().toString(36).substr(2, 9)}`,
      isProduct: !!item.isProduct,
      productId: item.productId || null,
      ore: item.ore,
      name: item.name || (item.productId ? FACTORY_PRODUCTS[item.productId]?.name : ORE_DATA[item.ore]?.name) || 'Produkt',
      value: item.value || (item.isProduct && item.productId ? FACTORY_PRODUCTS[item.productId]?.value : getRefinedOreNetValue(item.ore)),
      finishedAt: item.finishedAt || Date.now()
    }));

    this.refinery.lastTimestamp = savedData.lastTimestamp || Date.now();

    // Sofortige Verrechnung der Offline-Zeit anhand aktueller Geräte-Uhrzeit
    const offlineFinished = this.processRefinery(Date.now());
    if (offlineFinished > 0) {
      this.scene.events.emit('notify', `🏭 Fabrik: ${offlineFinished} Aufträge während deiner Abwesenheit fertiggestellt! (${this.refinery.finished.length} abholbereit)`);
    }
  }

  formatRefineryTime(ms) {
    if (ms <= 0) return '0s';
    const totalSec = Math.ceil(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    if (m > 0) {
      return `${m}m ${s < 10 ? '0' : ''}${s}s`;
    }
    return `${s}s`;
  }

  formatRefineryClock(ms) {
    if (ms <= 0) return '00:00';
    const totalSec = Math.ceil(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  }

  openFactoryModal() {
    this.openRefineryModal();
  }

  openRefineryModal() {
    this.isRefineryModalOpen = true;
    this.processRefinery(Date.now());

    this.openModal(`
      <div style="display: flex; align-items: center; gap: 8px;">
        ${icon('factory', '', 18)}
        <span>FABRIK</span>
      </div>
    `, `<div id="refinery-modal-container"></div>`);

    this.renderRefineryModalBody();

    // Live-Update Timer für flüssige Fortschrittsbalken und Countdown
    if (this.refineryUiInterval) clearInterval(this.refineryUiInterval);
    this.refineryUiInterval = setInterval(() => {
      if (!this.isRefineryModalOpen) {
        clearInterval(this.refineryUiInterval);
        this.refineryUiInterval = null;
        return;
      }
      const finishedCount = this.processRefinery(Date.now());
      if (finishedCount > 0) {
        soundFx.playSmelt();
        this.renderRefineryModalBody();
      } else {
        this.updateRefineryLiveTimers();
      }
    }, 200);
  }

  updateRefineryLiveTimers() {
    const queue = this.refinery.queue;
    const currentSmelt = queue.find(item => !item.isProduct);
    const currentCraft = queue.find(item => item.isProduct);

    if (currentSmelt) {
      const pct = Math.min(100, Math.max(0, Math.round(((currentSmelt.durationMs - currentSmelt.remainingMs) / currentSmelt.durationMs) * 100)));
      const timerEl = document.getElementById('smelt-timer');
      if (timerEl) timerEl.textContent = this.formatRefineryClock(currentSmelt.remainingMs);
      const fillEl = document.getElementById('smelt-progress-fill');
      if (fillEl) fillEl.style.width = `${pct}%`;
    }

    if (currentCraft) {
      const pct = Math.min(100, Math.max(0, Math.round(((currentCraft.durationMs - currentCraft.remainingMs) / currentCraft.durationMs) * 100)));
      const timerEl = document.getElementById('craft-timer');
      if (timerEl) timerEl.textContent = this.formatRefineryClock(currentCraft.remainingMs);
      const fillEl = document.getElementById('craft-progress-fill');
      if (fillEl) fillEl.style.width = `${pct}%`;
    }
  }

  renderRefineryModalBody() {
    const container = document.getElementById('refinery-modal-container');
    if (!container) return;

    const queue = this.refinery.queue;
    const finished = this.refinery.finished;
    const cargo = this.player.cargo || [];

    const cargoCounts = {};
    cargo.forEach(ore => {
      cargoCounts[ore] = (cargoCounts[ore] || 0) + 1;
    });

    const availableCoal = (cargoCounts['coal'] || 0) + (this.depot?.ores?.['coal'] || 0);

    // Aufteilung in 2 getrennte Produktionslinien
    const smeltQueue = queue.filter(item => !item.isProduct);
    const craftQueue = queue.filter(item => item.isProduct);
    const finishedSmelt = finished.filter(item => !item.isProduct);
    const finishedCraft = finished.filter(item => item.isProduct);

    const currentSmelt = smeltQueue[0] || null;
    const currentCraft = craftQueue[0] || null;
    const isSmelting = !!currentSmelt;
    const isCrafting = !!currentCraft;

    const pctSmelt = currentSmelt ? Math.min(100, Math.max(0, Math.round(((currentSmelt.durationMs - currentSmelt.remainingMs) / currentSmelt.durationMs) * 100))) : 0;
    const pctCraft = currentCraft ? Math.min(100, Math.max(0, Math.round(((currentCraft.durationMs - currentCraft.remainingMs) / currentCraft.durationMs) * 100))) : 0;

    let html = `
      <div style="display: flex; flex-direction: column; gap: 12px; max-height: 520px; overflow-y: auto; padding-right: 4px;">

        <!-- 1. ZWEI VISUELLE PRODUKTIONSLINIEN (SCHMELZE & FERTIGUNG) -->
        <div style="background: linear-gradient(180deg, rgba(15, 23, 42, 0.95) 0%, rgba(10, 15, 26, 0.98) 100%); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 12px; display: flex; flex-direction: column; gap: 10px;">
          
          <!-- LINIE 1: SCHMELZOFEN (ROHERZ-SCHMELZE) -->
          <div style="background: rgba(30, 41, 59, 0.35); border: 1px solid ${isSmelting ? 'rgba(249, 115, 22, 0.45)' : 'rgba(255,255,255,0.06)'}; border-radius: 10px; padding: 8px 10px; display: flex; flex-direction: column; gap: 6px;">
            <!-- Header mit Ofen-Brennstoffverbrauch -->
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div style="display: flex; align-items: center; gap: 6px;">
                <span style="display: inline-block; width: 7px; height: 7px; border-radius: 50%; background: ${isSmelting ? '#f97316' : '#64748b'}; box-shadow: 0 0 6px ${isSmelting ? '#f97316' : 'transparent'};"></span>
                <strong style="color: #f8fafc; font-size: 11px; letter-spacing: 0.5px; text-transform: uppercase; display: inline-flex; align-items: center; gap: 4px;">
                  ${icon('flame', '', 12)} SCHMELZOFEN
                </strong>
                ${smeltQueue.length > 1 ? `<span style="font-size: 10px; color: #94a3b8; background: rgba(0,0,0,0.35); padding: 1px 5px; border-radius: 4px;">+${smeltQueue.length - 1}</span>` : ''}
              </div>
              <div style="display: flex; align-items: center; gap: 6px;">
                <span style="background: rgba(245, 158, 11, 0.12); border: 1px solid rgba(245, 158, 11, 0.3); color: #fbbf24; font-size: 10.5px; font-weight: 700; padding: 1px 7px; border-radius: 6px; display: inline-flex; align-items: center; gap: 4px;">
                  ${icon('flame', '', 11)} 1x Kohle Brennstoff <strong style="color: ${availableCoal >= 1 ? '#10b981' : '#f87171'}; font-size: 10px;">(${availableCoal}x)</strong>
                </span>
              </div>
            </div>

            <!-- Visuelle 3-Stationen-Strecke -->
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 6px;">
              <!-- 1. Zufuhr -->
              <div style="width: 72px; height: 44px; box-sizing: border-box; background: rgba(15,23,42,0.65); border: 1px solid rgba(255,255,255,0.06); border-radius: 8px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px;">
                <span style="color: #38bdf8;">${icon('container', '', 12)}</span>
                <span style="font-size: 10px; font-weight: 700; color: ${smeltQueue.length > 0 ? '#38bdf8' : '#64748b'};">${smeltQueue.length > 0 ? `${smeltQueue.length} Erze` : 'Leer'}</span>
              </div>

              <!-- Förderpfeile -->
              <div style="flex-shrink: 0; width: 14px; text-align: center;">
                <div class="conveyor-arrow ${isSmelting ? 'running' : ''}" style="font-size: 10px;">▶▶</div>
              </div>

              <!-- 2. Ofen -->
              <div class="${isSmelting ? 'furnace-active' : ''}" style="flex: 1.5; min-width: 0; height: 44px; box-sizing: border-box; background: ${isSmelting ? 'rgba(234, 88, 12, 0.12)' : 'rgba(15,23,42,0.5)'}; border: 1px solid ${isSmelting ? 'rgba(249, 115, 22, 0.4)' : 'rgba(255,255,255,0.06)'}; border-radius: 8px; padding: 4px 10px; display: flex; flex-direction: column; justify-content: center; gap: 4px;">
                <div style="display: flex; justify-content: space-between; align-items: center; gap: 6px;">
                  <span style="font-size: 11px; font-weight: 700; color: ${isSmelting ? '#f8fafc' : '#64748b'}; display: inline-flex; align-items: center; gap: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                    ${isSmelting ? `${itemDisplayIcon('bar_' + currentSmelt.ore, 13)} ${currentSmelt.name}` : `${icon('power', '', 11)} Bereit`}
                  </span>
                  <span id="smelt-timer" style="font-size: 10.5px; font-weight: 700; color: ${isSmelting ? '#fbbf24' : '#64748b'}; font-variant-numeric: tabular-nums; flex-shrink: 0;">
                    ${isSmelting ? this.formatRefineryClock(currentSmelt.remainingMs) : '00:00'}
                  </span>
                </div>
                <div style="width: 100%; height: 6px; background: #090d16; border-radius: 3px; overflow: hidden;">
                  <div id="smelt-progress-fill" style="width: ${pctSmelt}%; height: 100%; background: linear-gradient(90deg, #ea580c 0%, #f59e0b 100%); transition: width 0.15s linear;"></div>
                </div>
              </div>

              <!-- Förderpfeile -->
              <div style="flex-shrink: 0; width: 14px; text-align: center;">
                <div class="conveyor-arrow ${isSmelting ? 'running' : ''}" style="font-size: 10px;">▶▶</div>
              </div>

              <!-- 3. Ausgang -->
              <div style="width: 72px; height: 44px; box-sizing: border-box; background: ${finishedSmelt.length > 0 ? 'rgba(16, 185, 129, 0.12)' : 'rgba(15,23,42,0.65)'}; border: 1px solid ${finishedSmelt.length > 0 ? 'rgba(16, 185, 129, 0.4)' : 'rgba(255,255,255,0.06)'}; border-radius: 8px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px;">
                <span style="color: ${finishedSmelt.length > 0 ? '#34d399' : '#64748b'};">${icon('check-circle', '', 12)}</span>
                <span style="font-size: 10px; font-weight: 700; color: ${finishedSmelt.length > 0 ? '#34d399' : '#64748b'};">${finishedSmelt.length > 0 ? `${finishedSmelt.length} Barren` : 'Leer'}</span>
              </div>
            </div>
          </div>

          <!-- LINIE 2: INDUSTRIE-FERTIGUNG (MONTAGELINIE) -->
          <div style="background: rgba(30, 41, 59, 0.35); border: 1px solid ${isCrafting ? 'rgba(56, 189, 248, 0.45)' : 'rgba(255,255,255,0.06)'}; border-radius: 10px; padding: 8px 10px; display: flex; flex-direction: column; gap: 6px;">
            <!-- Header mit Fertigungs-Brennstoffverbrauch -->
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div style="display: flex; align-items: center; gap: 6px;">
                <span style="display: inline-block; width: 7px; height: 7px; border-radius: 50%; background: ${isCrafting ? '#38bdf8' : '#64748b'}; box-shadow: 0 0 6px ${isCrafting ? '#38bdf8' : 'transparent'};"></span>
                <strong style="color: #f8fafc; font-size: 11px; letter-spacing: 0.5px; text-transform: uppercase; display: inline-flex; align-items: center; gap: 4px;">
                  ${icon('anvil', '', 12)} INDUSTRIE-FERTIGUNG
                </strong>
                ${craftQueue.length > 1 ? `<span style="font-size: 10px; color: #94a3b8; background: rgba(0,0,0,0.35); padding: 1px 5px; border-radius: 4px;">+${craftQueue.length - 1}</span>` : ''}
              </div>
              <div style="display: flex; align-items: center; gap: 6px;">
                <span style="background: rgba(245, 158, 11, 0.12); border: 1px solid rgba(245, 158, 11, 0.3); color: #fbbf24; font-size: 10.5px; font-weight: 700; padding: 1px 7px; border-radius: 6px; display: inline-flex; align-items: center; gap: 4px;">
                  ${icon('flame', '', 11)} 2x Kohle Brennstoff <strong style="color: ${availableCoal >= 2 ? '#10b981' : '#f87171'}; font-size: 10px;">(${availableCoal}x)</strong>
                </span>
              </div>
            </div>

            <!-- Visuelle 3-Stationen-Strecke -->
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 6px;">
              <!-- 1. Zufuhr -->
              <div style="width: 72px; height: 44px; box-sizing: border-box; background: rgba(15,23,42,0.65); border: 1px solid rgba(255,255,255,0.06); border-radius: 8px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px;">
                <span style="color: #38bdf8;">${icon('container', '', 12)}</span>
                <span style="font-size: 10px; font-weight: 700; color: ${craftQueue.length > 0 ? '#38bdf8' : '#64748b'};">${craftQueue.length > 0 ? `${craftQueue.length} Aufträge` : 'Leer'}</span>
              </div>

              <!-- Förderpfeile -->
              <div style="flex-shrink: 0; width: 14px; text-align: center;">
                <div class="conveyor-arrow ${isCrafting ? 'running' : ''}" style="font-size: 10px;">▶▶</div>
              </div>

              <!-- 2. Montage -->
              <div style="flex: 1.5; min-width: 0; height: 44px; box-sizing: border-box; background: ${isCrafting ? 'rgba(56, 189, 248, 0.12)' : 'rgba(15,23,42,0.5)'}; border: 1px solid ${isCrafting ? 'rgba(56, 189, 248, 0.4)' : 'rgba(255,255,255,0.06)'}; border-radius: 8px; padding: 4px 10px; display: flex; flex-direction: column; justify-content: center; gap: 4px;">
                <div style="display: flex; justify-content: space-between; align-items: center; gap: 6px;">
                  <span style="font-size: 11px; font-weight: 700; color: ${isCrafting ? '#f8fafc' : '#64748b'}; display: inline-flex; align-items: center; gap: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                    ${isCrafting ? `${itemDisplayIcon(currentCraft.productId, 13)} ${currentCraft.name}` : `${icon('power', '', 11)} Bereit`}
                  </span>
                  <span id="craft-timer" style="font-size: 10.5px; font-weight: 700; color: ${isCrafting ? '#38bdf8' : '#64748b'}; font-variant-numeric: tabular-nums; flex-shrink: 0;">
                    ${isCrafting ? this.formatRefineryClock(currentCraft.remainingMs) : '00:00'}
                  </span>
                </div>
                <div style="width: 100%; height: 6px; background: #090d16; border-radius: 3px; overflow: hidden;">
                  <div id="craft-progress-fill" style="width: ${pctCraft}%; height: 100%; background: linear-gradient(90deg, #0284c7 0%, #38bdf8 100%); transition: width 0.15s linear;"></div>
                </div>
              </div>

              <!-- Förderpfeile -->
              <div style="flex-shrink: 0; width: 14px; text-align: center;">
                <div class="conveyor-arrow ${isCrafting ? 'running' : ''}" style="font-size: 10px;">▶▶</div>
              </div>

              <!-- 3. Ausgang -->
              <div style="width: 72px; height: 44px; box-sizing: border-box; background: ${finishedCraft.length > 0 ? 'rgba(16, 185, 129, 0.12)' : 'rgba(15,23,42,0.65)'}; border: 1px solid ${finishedCraft.length > 0 ? 'rgba(16, 185, 129, 0.4)' : 'rgba(255,255,255,0.06)'}; border-radius: 8px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px;">
                <span style="color: ${finishedCraft.length > 0 ? '#34d399' : '#64748b'};">${icon('award', '', 12)}</span>
                <span style="font-size: 10px; font-weight: 700; color: ${finishedCraft.length > 0 ? '#34d399' : '#64748b'};">${finishedCraft.length > 0 ? `${finishedCraft.length} Waren` : 'Leer'}</span>
              </div>
            </div>
          </div>

        </div>
    `;

    // 2. Fertige Waren (Abholung / Einlagern)
    if (finished.length > 0) {
      const grouped = {};
      finished.forEach(item => {
        const itemKey = item.isProduct ? item.productId : ('bar_' + item.ore);
        if (!grouped[item.name]) grouped[item.name] = { count: 0, value: 0, itemKey };
        grouped[item.name].count++;
        grouped[item.name].value += item.value;
      });

      const finishedBadges = Object.entries(grouped).map(([name, data]) => `
        <span style="background: rgba(16, 185, 129, 0.2); border: 1px solid rgba(16, 185, 129, 0.5); padding: 3px 8px; border-radius: 6px; font-size: 11.5px; color: #a7f3d0; font-weight: 700; display: inline-flex; align-items: center; gap: 5px;">
          ${itemDisplayIcon(data.itemKey, 13)}
          <span>${data.count}x ${name} (+€${data.value})</span>
        </span>
      `).join('');

      html += `
        <div style="background: rgba(16, 185, 129, 0.12); border: 1px solid rgba(16, 185, 129, 0.45); border-radius: 10px; padding: 10px 12px; display: flex; flex-direction: column; gap: 8px; box-sizing: border-box; width: 100%;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <strong style="color: #34d399; font-size: 12.5px; display: inline-flex; align-items: center; gap: 6px;">
              ${icon('check-circle', '', 14)}
              Fertiggestellt (${finished.length === 1 ? '1 Einheit' : `${finished.length} Einheiten`})
            </strong>
          </div>

          <div style="display: flex; flex-wrap: wrap; gap: 6px;">
            ${finishedBadges}
          </div>

          <button id="btn-transfer-to-storage" class="btn-buy" style="height: 34px; font-size: 11.5px; font-weight: 700; padding: 0 14px; width: 100%; justify-content: center; display: inline-flex; align-items: center; gap: 6px;">
            ${icon('warehouse', '', 14)}
            <span>Waren ins Depot einlagern</span>
          </button>
        </div>
      `;
    }

    // 3. INDUSTRIE-FERTIGUNG (Neue Produkte aus Erzen herstellen - Brennstoff wird beim Ofen oben gezeigt!)
    const visibleFactoryProducts = Object.entries(FACTORY_PRODUCTS).filter(([prodId, prod]) => {
      return Object.keys(prod.recipe).every(ore => this.player.isOreDiscovered(ore));
    });

    html += `
      <div style="background: rgba(15, 23, 42, 0.75); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 12px; display: flex; flex-direction: column; gap: 10px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <strong style="color: #38bdf8; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; display: inline-flex; align-items: center; gap: 6px;">
            ${icon('anvil', '', 14)}
            Industrie-Fertigung (Baupläne & Waren)
          </strong>
        </div>
        <div style="display: flex; flex-direction: column; gap: 8px;">
    `;

    if (visibleFactoryProducts.length === 0) {
      html += `
        <div style="text-align: center; padding: 16px; color: #94a3b8; font-size: 11.5px; background: rgba(0,0,0,0.25); border-radius: 8px;">
          Keine Industrie-Rezepte verfügbar. Entdecke neue Erzadern im Schacht, um Fertigungspläne freizuschalten!
        </div>
      `;
    } else {
      for (const [prodId, prod] of visibleFactoryProducts) {
        let canCraft = true;
        const ingBadges = Object.entries(prod.recipe).map(([ore, need]) => {
          const inCargo = cargoCounts[ore] || 0;
          const inDepot = this.depot?.ores?.[ore] || 0;
          const have = inCargo + inDepot;
          if (have < need) canCraft = false;
          const oreName = ORE_DATA[ore]?.name || ore;
          const isMet = have >= need;
          return `<span style="background: ${isMet ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)'}; border: 1px solid ${isMet ? 'rgba(16, 185, 129, 0.35)' : 'rgba(239, 68, 68, 0.35)'}; color: ${isMet ? '#34d399' : '#f87171'}; font-size: 11px; font-weight: 700; padding: 2px 7px; border-radius: 6px; display: inline-flex; align-items: center; gap: 4px; white-space: nowrap;">${itemDisplayIcon(ore, 13)} ${need}x ${oreName} <span style="font-size: 9.5px; opacity: 0.85; font-variant-numeric: tabular-nums;">(${have}/${need})</span></span>`;
        }).join('');

        // Prüfung: Reicht die Kohle für den Ofen-Brennstoff (2x) + eventuelle Rezept-Kohle?
        const recipeCoal = prod.recipe['coal'] || 0;
        const totalCoalNeeded = recipeCoal + (prod.fuelCoal || 2);
        if (availableCoal < totalCoalNeeded) canCraft = false;

        html += `
          <div style="background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.06); border-radius: 8px; padding: 10px 14px; display: flex; align-items: center; gap: 12px; box-sizing: border-box;">
            <!-- Spalte 1: Icon (32px) + Name (145px) -->
            <div style="display: flex; align-items: center; gap: 10px; width: 185px; min-width: 185px; flex-shrink: 0;">
              <span style="display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; background: rgba(56,189,248,0.12); border: 1px solid rgba(56,189,248,0.25); border-radius: 8px; flex-shrink: 0; color: #38bdf8;">
                ${itemDisplayIcon(prodId, 18)}
              </span>
              <strong style="color: #f8fafc; font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${prod.name}</strong>
            </div>

            <!-- Spalte 2: Wert / Börsenpreis (80px) -->
            <div style="width: 80px; min-width: 80px; flex-shrink: 0; display: flex; align-items: center; justify-content: center;">
              <span style="background: rgba(245, 158, 11, 0.15); border: 1px solid rgba(245, 158, 11, 0.35); padding: 2px 8px; border-radius: 6px; font-size: 11px; color: #fbbf24; font-weight: 800; display: inline-flex; align-items: center; justify-content: center; gap: 4px; width: 100%; box-sizing: border-box; white-space: nowrap; font-variant-numeric: tabular-nums;">
                ${icon('coins', '', 11)} €${prod.value}
              </span>
            </div>

            <!-- Spalte 3: Fertigungs-Dauer (62px) -->
            <div style="width: 62px; min-width: 62px; flex-shrink: 0; display: flex; align-items: center; justify-content: center;">
              <span style="background: rgba(255, 255, 255, 0.06); border: 1px solid rgba(255, 255, 255, 0.1); padding: 2px 7px; border-radius: 6px; font-size: 10.5px; color: #94a3b8; font-weight: 600; display: inline-flex; align-items: center; justify-content: center; gap: 3px; width: 100%; box-sizing: border-box; white-space: nowrap; font-variant-numeric: tabular-nums;">
                ${icon('clock', '', 10)} ${prod.durationSec}s
              </span>
            </div>

            <!-- Spalte 4: Zutaten / Bauplan-Rezepte (flex: 1) -->
            <div style="flex: 1; min-width: 0; display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
              ${ingBadges}
            </div>

            <!-- Spalte 5: Herstellen-Button (110px) -->
            <div style="width: 110px; min-width: 110px; flex-shrink: 0; display: flex; align-items: center; justify-content: flex-end;">
              <button class="btn-craft-product btn-buy" data-prod="${prodId}" ${canCraft ? '' : 'disabled'} style="width: 100%; height: 32px; padding: 0 10px; font-size: 11.5px; font-weight: 700; display: inline-flex; align-items: center; justify-content: center; gap: 6px;">
                ${icon('hammer', '', 13)} Herstellen
              </button>
            </div>
          </div>
        `;
      }
    }

    html += `
        </div>
      </div>
    `;

    // 4. ROHERZ-SCHMELZOFEN (Einschmelzen einzelner Erze)
    const totalCargoOres = cargo.length;
    const totalDepotOres = Object.values(this.depot?.ores || {}).reduce((s, v) => s + v, 0);
    const totalAvailableOres = totalCargoOres + totalDepotOres;

    html += `
      <div style="background: rgba(15, 23, 42, 0.75); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 12px; display: flex; flex-direction: column; gap: 10px;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 6px;">
          <strong style="color: #38bdf8; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; display: inline-flex; align-items: center; gap: 6px;">
            ${icon('container', '', 14)}
            Roherz-Schmelzofen (${totalAvailableOres} Erze verfügbar)
          </strong>
        </div>
    `;

    if (totalAvailableOres === 0) {
      html += `
        <div style="color: #64748b; font-size: 12px; text-align: center; padding: 10px 0;">
          Keine Erze im Frachtraum oder Depot vorhanden. Baue unter Tage Erze ab, um sie hier einzuschmelzen.
        </div>
      `;
    } else {
      html += `
        ${totalAvailableOres > 0 ? `
          <button id="btn-deposit-all-ores" class="btn-buy" ${availableCoal > 0 ? '' : 'disabled'} style="width: 100%; height: 34px; font-size: 11.5px; font-weight: 700; display: inline-flex; align-items: center; justify-content: center; gap: 6px;">
            ${icon('flame', '', 14)}
            <span>Alle Erze schmelzen (${totalAvailableOres})</span>
          </button>
        ` : ''}
      `;

      const allOreKeys = Object.keys(ORE_DATA).filter(k => this.player.isOreDiscovered(k) && ((cargoCounts[k] || 0) > 0 || (this.depot?.ores?.[k] || 0) > 0));

      html += `<div style="display: flex; flex-direction: column; gap: 6px;">`;
      for (const oreKey of allOreKeys) {
        const oreName = ORE_DATA[oreKey]?.name || oreKey;
        const refinedName = getRefinedOreName(oreKey);
        const durSec = REFINERY_DURATIONS_SEC[oreKey] || Math.max(20, Math.round((ORE_DATA[oreKey]?.value || 25) * 0.70));
        const netVal = getRefinedOreNetValue(oreKey);
        const inCargo = cargoCounts[oreKey] || 0;
        const inDepot = this.depot?.ores?.[oreKey] || 0;
        const totalThisOre = inCargo + inDepot;

        const canAffordFuel = (oreKey === 'coal') ? (availableCoal >= 2) : (availableCoal >= 1);
        const canSmeltThis = canAffordFuel && totalThisOre > 0;

        html += `
          <div style="background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.06); border-radius: 8px; padding: 10px 14px; display: flex; align-items: center; gap: 12px; box-sizing: border-box;">
            <!-- Spalte 1: Icon + Erz ➔ Barren (220px) -->
            <div style="display: flex; align-items: center; gap: 10px; width: 220px; min-width: 220px; flex-shrink: 0;">
              <span style="display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; background: rgba(56,189,248,0.12); border: 1px solid rgba(56,189,248,0.25); border-radius: 8px; flex-shrink: 0;">
                ${itemDisplayIcon(oreKey, 18)}
              </span>
              <strong style="color: #f8fafc; font-size: 12.5px; display: inline-flex; align-items: center; gap: 6px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                ${oreName} <span style="color: #64748b; font-size: 11px;">➔</span> <span style="color: #fbbf24; display: inline-flex; align-items: center; gap: 4px;">${itemDisplayIcon('bar_' + oreKey, 14)} ${refinedName}</span>
              </strong>
            </div>

            <!-- Spalte 2: Wert (80px) -->
            <div style="width: 80px; min-width: 80px; flex-shrink: 0; display: flex; align-items: center; justify-content: center;">
              <span style="background: rgba(245,158,11,0.15); border: 1px solid rgba(245,158,11,0.3); padding: 2px 8px; border-radius: 6px; font-size: 11px; color: #fbbf24; font-weight: 800; display: inline-flex; align-items: center; justify-content: center; gap: 4px; width: 100%; box-sizing: border-box; white-space: nowrap; font-variant-numeric: tabular-nums;">
                ${icon('coins', '', 11)} €${netVal}
              </span>
            </div>

            <!-- Spalte 3: Dauer (62px) -->
            <div style="width: 62px; min-width: 62px; flex-shrink: 0; display: flex; align-items: center; justify-content: center;">
              <span style="background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); padding: 2px 7px; border-radius: 6px; font-size: 10.5px; color: #94a3b8; font-weight: 600; display: inline-flex; align-items: center; justify-content: center; gap: 3px; width: 100%; box-sizing: border-box; white-space: nowrap; font-variant-numeric: tabular-nums;">
                ${icon('clock', '', 10)} ${durSec}s
              </span>
            </div>

            <!-- Spalte 4: Vorrat (flex: 1) -->
            <div style="flex: 1; min-width: 0; display: flex; align-items: center; gap: 6px;">
              <span style="background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); padding: 2px 8px; border-radius: 6px; font-size: 11px; color: #94a3b8; font-weight: 600; white-space: nowrap; font-variant-numeric: tabular-nums;">
                ${totalThisOre}x verfügbar
              </span>
            </div>

            <!-- Spalte 5: Buttons -->
            <div style="display: flex; gap: 6px; align-items: center; justify-content: flex-end; flex-shrink: 0;">
              <button class="btn-deposit-one btn-3d-secondary" data-ore="${oreKey}" ${canSmeltThis ? '' : 'disabled'} style="height: 30px; padding: 0 10px; font-size: 11px; font-weight: 700; border-radius: 6px;">+1</button>
              <button class="btn-deposit-all-type btn-action" data-ore="${oreKey}" ${canSmeltThis ? '' : 'disabled'} style="height: 30px; padding: 0 12px; font-size: 11px; font-weight: 700; border-radius: 6px;">Alle (${totalThisOre})</button>
            </div>
          </div>
        `;
      }
      html += `</div>`;
    }

    html += `
        </div>
      </div>
    `;

    container.innerHTML = html;
    refreshIcons(container);

    // Event Listener
    const btnTransfer = document.getElementById('btn-transfer-to-storage');
    if (btnTransfer) {
      btnTransfer.onclick = () => {
        this.transferFinishedToStorage();
      };
    }

    const btnCollect = document.getElementById('btn-collect-refined');
    if (btnCollect) {
      btnCollect.onclick = () => {
        this.collectRefinedIngots();
      };
    }

    const btnDepositAllOres = document.getElementById('btn-deposit-all-ores');
    if (btnDepositAllOres) {
      btnDepositAllOres.onclick = () => {
        this.depositAllOresToRefinery();
      };
    }

    container.querySelectorAll('.btn-craft-product').forEach(btn => {
      btn.onclick = () => {
        const prodId = btn.getAttribute('data-prod');
        this.craftFactoryProduct(prodId);
      };
    });

    container.querySelectorAll('.btn-deposit-one').forEach(btn => {
      btn.onclick = () => {
        const oreKey = btn.getAttribute('data-ore');
        this.depositOreToRefinery(oreKey, 1);
      };
    });

    container.querySelectorAll('.btn-deposit-all-type').forEach(btn => {
      btn.onclick = () => {
        const oreKey = btn.getAttribute('data-ore');
        this.depositOreToRefinery(oreKey, 9999);
      };
    });


  }

  consumeSingleOre(oreKey) {
    const cargoIdx = this.player.cargo.indexOf(oreKey);
    if (cargoIdx !== -1) {
      this.player.cargo.splice(cargoIdx, 1);
      return true;
    }
    if (this.depot?.ores?.[oreKey] > 0) {
      this.depot.ores[oreKey]--;
      return true;
    }
    return false;
  }

  craftFactoryProduct(productId) {
    const prod = FACTORY_PRODUCTS[productId];
    if (!prod) return;

    const cargoCounts = {};
    this.player.cargo.forEach(ore => {
      cargoCounts[ore] = (cargoCounts[ore] || 0) + 1;
    });

    const availableCoal = (cargoCounts['coal'] || 0) + (this.depot?.ores?.['coal'] || 0);
    const fuelNeeded = prod.fuelCoal || 2;
    const recipeCoal = prod.recipe['coal'] || 0;
    const totalCoalNeeded = recipeCoal + fuelNeeded;

    if (availableCoal < totalCoalNeeded) {
      this.scene.events.emit('notify', `Nicht genug Kohle! Die Fertigungslinie benötigt ${fuelNeeded}x Kohle als Brennstoff.`);
      return;
    }

    for (const [ore, needed] of Object.entries(prod.recipe)) {
      if (ore === 'coal') continue;
      const inCargo = cargoCounts[ore] || 0;
      const inDepot = this.depot?.ores?.[ore] || 0;
      if (inCargo + inDepot < needed) {
        this.scene.events.emit('notify', `Nicht genug ${ORE_DATA[ore]?.name || ore}!`);
        return;
      }
    }

    // 1. Rezept-Materialien verbrauchen
    for (const [ore, needed] of Object.entries(prod.recipe)) {
      for (let i = 0; i < needed; i++) {
        this.consumeSingleOre(ore);
      }
    }

    // 2. Ofen-Brennstoff verbrauchen (2x Kohle)
    for (let i = 0; i < fuelNeeded; i++) {
      this.consumeSingleOre('coal');
    }

    const durationMs = prod.durationSec * 1000;
    this.refinery.queue.push({
      id: `q_${Date.now()}_${Math.random().toString(36).substr(2, 7)}`,
      isProduct: true,
      productId: prod.id,
      name: prod.name,
      durationMs,
      remainingMs: durationMs,
      value: prod.value
    });

    soundFx.playFurnace();
    this.renderRefineryModalBody();
    if (this.scene.hud) this.scene.hud.update();
    this.scene.events.emit('notify', `Fertigung von "${prod.name}" gestartet!`);
  }

  transferFinishedToStorage() {
    if (!this.refinery.finished || this.refinery.finished.length === 0) return;
    if (!this.depot) {
      this.depot = { ores: {}, products: {}, capacity: 10, tier: 1 };
    }
    if (!this.depot.ores) this.depot.ores = {};
    if (!this.depot.products) this.depot.products = {};

    const depotCap = this.depot.capacity || 10;
    let currentDepotCount = this.getDepotTotalCount();
    let freeCapacity = Math.max(0, depotCap - currentDepotCount);

    if (freeCapacity <= 0) {
      this.scene.events.emit('notify', '⚠️ Depot ist voll! Bitte Lagerkapazität im Depot ausbauen.');
      return;
    }

    const remainingFinished = [];
    let transferredBars = 0;
    let transferredProducts = 0;

    for (const item of this.refinery.finished) {
      if (freeCapacity > 0) {
        if (item.isProduct && item.productId) {
          this.depot.products[item.productId] = (this.depot.products[item.productId] || 0) + 1;
          transferredProducts++;
          freeCapacity--;
        } else if (item.ore) {
          const barKey = 'bar_' + item.ore;
          this.depot.products[barKey] = (this.depot.products[barKey] || 0) + 1;
          transferredBars++;
          freeCapacity--;
        }
      } else {
        remainingFinished.push(item);
      }
    }

    this.refinery.finished = remainingFinished;
    soundFx.playPurchase();
    this.renderRefineryModalBody();
    if (this.scene.hud) this.scene.hud.update();

    const totalTransferred = transferredBars + transferredProducts;
    if (totalTransferred > 0) {
      let msg = `📦 ${totalTransferred}x Waren direkt ins Depot eingelagert!`;
      if (remainingFinished.length > 0) {
        msg += ` (${remainingFinished.length}x verbleiben in der Fabrik - Depot voll)`;
      }
      this.scene.events.emit('notify', msg);
    }
  }

  depositOreToRefinery(oreKey, count = 1) {
    const availableCoal = (this.player.cargo.filter(k => k === 'coal').length) + (this.depot?.ores?.['coal'] || 0);
    const availableTarget = (this.player.cargo.filter(k => k === oreKey).length) + (this.depot?.ores?.[oreKey] || 0);

    // Schmelzofen benötigt immer 1x Kohle als Brennstoff
    if (oreKey === 'coal') {
      // 1 Kohle zum Einschmelzen + 1 Kohle als Brennstoff = 2 Kohle pro Brikett
      const maxPossible = Math.floor(availableCoal / 2);
      const toSmelt = Math.min(count, maxPossible);
      if (toSmelt <= 0) {
        if (availableCoal < 2) {
          this.scene.events.emit('notify', 'Mindestens 2x Kohle erforderlich (1x zum Veredeln + 1x als Brennstoff)!');
        }
        return;
      }

      for (let i = 0; i < toSmelt; i++) {
        this.consumeSingleOre('coal'); // Material
        this.consumeSingleOre('coal'); // Brennstoff
        const durationMs = getRefinerySmeltDurationMs('coal');
        const netVal = getRefinedOreNetValue('coal');
        this.refinery.queue.push({
          id: `q_${Date.now()}_${Math.random().toString(36).substr(2, 7)}`,
          ore: 'coal',
          name: getRefinedOreName('coal'),
          durationMs,
          remainingMs: durationMs,
          value: netVal
        });
      }

      soundFx.playFurnace();
      this.renderRefineryModalBody();
      if (this.scene.hud) this.scene.hud.update();
      this.scene.events.emit('notify', `${toSmelt}x Kohle-Brikett in Ofen gegeben (${toSmelt}x Kohle als Brennstoff verbraucht).`);
      return;
    }

    // Anderes Erz als Kohle:
    if (availableCoal <= 0) {
      this.scene.events.emit('notify', 'Keine Kohle vorhanden! Der Schmelzofen benötigt 1x Kohle als Brennstoff.');
      return;
    }

    const toSmelt = Math.min(count, availableTarget, availableCoal);
    if (toSmelt <= 0) {
      this.scene.events.emit('notify', `Kein ${ORE_DATA[oreKey]?.name || oreKey} zum Einschmelzen vorhanden.`);
      return;
    }

    for (let i = 0; i < toSmelt; i++) {
      this.consumeSingleOre(oreKey); // Erz
      this.consumeSingleOre('coal');  // Brennstoff
      const durationMs = getRefinerySmeltDurationMs(oreKey);
      const netVal = getRefinedOreNetValue(oreKey);
      this.refinery.queue.push({
        id: `q_${Date.now()}_${Math.random().toString(36).substr(2, 7)}`,
        ore: oreKey,
        name: getRefinedOreName(oreKey),
        durationMs,
        remainingMs: durationMs,
        value: netVal
      });
    }

    soundFx.playFurnace();
    this.renderRefineryModalBody();
    if (this.scene.hud) this.scene.hud.update();
    this.scene.events.emit('notify', `${toSmelt}x ${ORE_DATA[oreKey]?.name || oreKey} im Ofen (${toSmelt}x Kohle als Brennstoff verbraucht).`);
  }

  depositAllOresToRefinery() {
    let availableCoal = (this.player.cargo.filter(k => k === 'coal').length) + (this.depot?.ores?.['coal'] || 0);
    if (availableCoal <= 0) {
      this.scene.events.emit('notify', 'Keine Kohle vorhanden! Der Schmelzofen benötigt 1x Kohle als Brennstoff pro Vorgang.');
      return;
    }

    // Liste aller Erze sammeln (Fracht + Depot)
    const cargoCopy = [...this.player.cargo];
    const depotOres = this.depot?.ores || {};
    const depotList = [];
    for (const [oreKey, count] of Object.entries(depotOres)) {
      for (let i = 0; i < count; i++) {
        depotList.push(oreKey);
      }
    }

    const allOres = [...cargoCopy, ...depotList];
    // Kohle zuletzt, damit sie als Brennstoff für andere Erze genutzt wird
    allOres.sort((a, b) => (a === 'coal' ? 1 : 0) - (b === 'coal' ? 1 : 0));

    let smelted = 0;
    for (const oreKey of allOres) {
      if (oreKey === 'coal') {
        if (availableCoal < 2) break;
      } else {
        if (availableCoal < 1) break;
      }

      const consumed = this.consumeSingleOre(oreKey);
      if (!consumed) continue;

      this.consumeSingleOre('coal'); // Brennstoff
      availableCoal--;

      const durationMs = getRefinerySmeltDurationMs(oreKey);
      const netVal = getRefinedOreNetValue(oreKey);
      this.refinery.queue.push({
        id: `q_${Date.now()}_${Math.random().toString(36).substr(2, 7)}`,
        ore: oreKey,
        name: getRefinedOreName(oreKey),
        durationMs,
        remainingMs: durationMs,
        value: netVal
      });
      smelted++;
    }

    if (smelted > 0) {
      soundFx.playFurnace();
      this.renderRefineryModalBody();
      if (this.scene.hud) this.scene.hud.update();
      this.scene.events.emit('notify', `${smelted} Erze in den Schmelzofen gegeben (${smelted}x Kohle als Brennstoff verbraucht)!`);
    } else {
      this.scene.events.emit('notify', 'Nicht genug Kohle vorhanden, um Erze einzuschmelzen.');
    }
  }

  // Alias-Methoden für Abwärtskompatibilität
  depositAllCargoToRefinery() {
    this.depositAllOresToRefinery();
  }

  depositAllDepotToRefinery() {
    this.depositAllOresToRefinery();
  }

  collectRefinedIngots() {
    const totalGain = this.refinery.finished.reduce((sum, item) => sum + item.value, 0);
    const count = this.refinery.finished.length;
    if (count === 0) return;

    this.player.cash += totalGain;
    this.refinery.finished = [];
    soundFx.playPurchase();
    this.renderRefineryModalBody();
    if (this.scene.hud) this.scene.hud.update();
    this.scene.events.emit('notify', `🔥 ${count} Einheiten direkt verkauft für +€${totalGain}!`);
  }
}
