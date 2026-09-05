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

// Dauer für das Einschmelzen einzelner Erze in Sekunden
export const REFINERY_DURATIONS_SEC = {
  coal: 10,          // 10s
  copper: 16,        // 16s
  iron: 26,          // 26s
  tin: 36,           // 36s
  silver: 50,        // 50s
  gold: 75,          // 1m 15s
  emerald: 105,      // 1m 45s
  sapphire: 135,     // 2m 15s
  ruby: 170,         // 2m 50s
  diamond: 210,      // 3m 30s
  titanium: 260,     // 4m 20s
  platinum: 320,     // 5m 20s
  uranium: 400,      // 6m 40s
  obsidian_gem: 500, // 8m 20s
  dark_matter: 650   // 10m 50s
};

export function getRefinerySmeltDurationMs(oreKey) {
  const sec = REFINERY_DURATIONS_SEC[oreKey];
  if (sec) return sec * 1000;
  const val = ORE_DATA[oreKey]?.value || 25;
  return Math.max(10, Math.round(val * 0.35)) * 1000;
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
  { tier: 2, name: 'Wolframkarbid-Spitze', stat: '45 DPS (+32%)', cost: 220, comp: null, level: 1, desc: 'Fräst spürbar flüssiger durch Erde (ca. 1.9s) und Schiefer.' },
  { tier: 3, name: 'Gehärteter Meißel Mk.III', stat: '60 DPS (+33%)', cost: 480, comp: null, level: 1, desc: 'Schneidet zügig durch Stein und zerbröckelt Fels.' },
  { tier: 4, name: 'Titan-Diamant-Kopf Mk.IV', stat: '82 DPS (+37%)', cost: 1050, comp: { key: 'hydraulic_part', name: 'Hydraulik-Zylinder', count: 1 }, level: 2, desc: 'Hydraulisch verstärkte Fräse zermalmt harte Granitadern.' },
  { tier: 5, name: 'Hochdruck-Fräse Mk.V', stat: '115 DPS (+40%)', cost: 2200, comp: { key: 'titan_alloy', name: 'Titan-Legierung', count: 1 }, level: 2, desc: 'Panzerung und Zahnkränze fräsen mühelos durch Granit und Basalt.' },
  { tier: 6, name: 'Plasma-Schneidbrenner Mk.VI', stat: '165 DPS (+43%)', cost: 4500, comp: { key: 'laser_lens', name: 'Kristall-Fokuslinse', count: 1 }, level: 3, desc: 'Fokussierter Plasmastrahl schmilzt Obsidian-Gestein.' },
  { tier: 7, name: 'Laser-Kavitationsmeißel Mk.VII', stat: '240 DPS (+45%)', cost: 9200, comp: { key: 'laser_lens', name: 'Kristall-Fokuslinse', count: 2 }, level: 4, desc: 'Höchste Schneidleistung für schwerste Tiefenerze.' },
  { tier: 8, name: 'Antimaterie-Bohrer Mk.VIII', stat: '350 DPS (+46%)', cost: 18500, comp: { key: 'quantum_chip', name: 'Quanten-Steuerkern', count: 2 }, level: 5, desc: 'Ultimativer Bohrkopf. Fräst durch den Tiefenkern wie Butter.' }
];
export const DRILL_DPS = [34, 45, 60, 82, 115, 165, 240, 350];
export const DRILL_DATA = DRILL_TIERS;

// Fabrik-Produkte (Industrielle Werkstoffe mit hohem Börsenwert)
export const FACTORY_PRODUCTS = {
  steel_beam: {
    id: 'steel_beam',
    name: 'Stahlträger',
    desc: 'Hochbelastbarer Baustahl für Schachtgerüste und Industrie.',
    iconName: 'anvil',
    recipe: { coal: 2, iron: 2 },
    durationSec: 15,
    value: 260
  },
  bronze_ingot: {
    id: 'bronze_ingot',
    name: 'Bronze-Barren',
    desc: 'Widerstandsfähige Legierung für korrosionsfreie Maschinenteile.',
    iconName: 'box',
    recipe: { copper: 2, tin: 2 },
    durationSec: 20,
    value: 390
  },
  circuit_board: {
    id: 'circuit_board',
    name: 'Elektronik-Platine',
    desc: 'Hochintegrierte Leiterplatte für Steuerungen und Navigationssysteme.',
    iconName: 'cpu',
    recipe: { copper: 2, silver: 1, gold: 1 },
    durationSec: 45,
    value: 920
  },
  polished_gem: {
    id: 'polished_gem',
    name: 'Schmuck-Diamant',
    desc: 'Präzisionsgeschliffener Edelstein für Optik und Luxusmärkte.',
    iconName: 'gem',
    recipe: { emerald: 1, ruby: 1 },
    durationSec: 75,
    value: 3600
  },
  titan_plate: {
    id: 'titan_plate',
    name: 'Titan-Panzerung',
    desc: 'Hitzebeständige Panzerplatte für Tiefsee- und Hochdruckrümpfe.',
    iconName: 'shield',
    recipe: { titanium: 2, diamond: 1 },
    durationSec: 120,
    value: 9400
  },
  fusion_rod: {
    id: 'fusion_rod',
    name: 'Quanten-Brennstab',
    desc: 'Hochenergetischer Nuklear-Brennstab für Fusionsreaktoren.',
    iconName: 'zap',
    recipe: { uranium: 2, platinum: 1 },
    durationSec: 180,
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
        iconName: 'briefcase',
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
      capacity: 150,   // Max Gesamtkapazität für Erze + Produkte
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
  openMarketModal() {
    const cargo = this.player.cargo;
    const counts = {};
    let totalValue = 0;

    cargo.forEach((ore) => {
      counts[ore] = (counts[ore] || 0) + 1;
      totalValue += ORE_DATA[ore] ? ORE_DATA[ore].value : 0;
    });

    let oreListHtml = '';
    if (cargo.length === 0) {
      oreListHtml = '<p style="color: #94a3b8; font-style: italic; margin: 18px 0; text-align: center;">Dein Frachtraum ist leer. Baue Erze im Schacht ab!</p>';
    } else {
      oreListHtml = '<div style="display: flex; flex-direction: column; gap: 10px; margin: 12px 0; max-height: 280px; overflow-y: auto; padding-right: 4px;">';
      for (const [ore, count] of Object.entries(counts)) {
        const data = ORE_DATA[ore];
        const val = data ? data.value : 0;
        oreListHtml += `
          <div class="market-ore-card" data-ore="${ore}" style="background: #141c2b; padding: 10px 14px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.07); display: flex; flex-direction: column; gap: 8px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-weight: 700; color: #f8fafc; font-size: 13.5px; display: inline-flex; align-items: center; gap: 6px;">${oreIcon(ore, 16)} ${data.name}</span>
                <span style="background: rgba(56, 189, 248, 0.15); border: 1px solid rgba(56, 189, 248, 0.3); padding: 2px 8px; border-radius: 6px; font-size: 11px; color: #38bdf8; font-weight: 700;">Vorrat: ${count}</span>
                <span style="font-size: 11px; color: #94a3b8;">(€${val}/Stk)</span>
              </div>
              <div style="display: flex; align-items: center; gap: 4px;">
                <span style="font-size: 11px; color: #94a3b8;">Erlös:</span>
                <strong class="ore-subtotal" id="subtotal-${ore}" style="color: #fbbf24; font-size: 14px;">+€${val * count}</strong>
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
                <span id="btn-sell-text-${ore}">${count}x Verkaufen</span>
              </button>
            </div>
          </div>
        `;
      }
      oreListHtml += '</div>';
    }

    // Fabrik-Produkte (Industrielle Güter)
    let factoryHtml = '';
    const fp = this.player.factoryProducts || {};
    const hasAnyFp = Object.values(fp).some(v => v > 0);
    let totalFpValue = 0;

    let fpListHtml = '';
    if (!hasAnyFp) {
      fpListHtml = '<p style="color: #64748b; font-style: italic; margin: 10px 0; text-align: center; font-size: 12px;">Keine Fabrik-Waren auf Lager. Fertige Erzeugnisse in der FABRIK, um hier Spitzenpreise zu erzielen!</p>';
    } else {
      fpListHtml = '<div style="display: flex; flex-direction: column; gap: 8px; margin: 8px 0;">';
      const allProductKeys = Array.from(new Set([
        ...Object.keys(FACTORY_PRODUCTS),
        ...Object.keys(fp)
      ])).filter(k => (fp[k] || 0) > 0);

      for (const prodId of allProductKeys) {
        const count = fp[prodId] || 0;
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
          iconHtml = icon(FACTORY_PRODUCTS[prodId].iconName, '', 15);
        } else {
          prodName = prodId;
          val = 0;
          iconHtml = icon('box', '', 15);
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
                <span style="background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.3); padding: 2px 8px; border-radius: 6px; font-size: 11px; color: #10b981; font-weight: 700;">Lager: ${count}x</span>
                <span style="font-size: 11px; color: #94a3b8;">(€${val}/Stk)</span>
              </div>
              <div style="display: flex; align-items: center; gap: 4px;">
                <span style="font-size: 11px; color: #94a3b8;">Erlös:</span>
                <strong class="fp-subtotal" id="subtotal-fp-${prodId}" style="color: #fbbf24; font-size: 14px;">+€${subtotal}</strong>
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
                <span id="btn-sell-fp-text-${prodId}">${count}x Verkaufen</span>
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
            ${icon('container', '', 15)} FABRIK-ERZEUGNISSE (INDUSTRIE-WAREN)
          </strong>
          <span style="color: #fbbf24; font-size: 13px; font-weight: 700;">Warenwert: €${totalFpValue}</span>
        </div>
        ${fpListHtml}
        ${hasAnyFp ? `
          <button id="btn-sell-all-fp" class="btn-buy btn-lg" style="width: 100%; margin-top: 6px;">
            ${icon('coins', '', 15)} ALLE FABRIK-WAREN VERKAUFEN (+€${totalFpValue})
          </button>
        ` : ''}
      </div>
    `;

    // Erze im Depot-Lager
    let depotHtml = '';
    const depotOres = this.depot?.ores || {};
    let totalDepotValue = 0;
    let totalDepotCount = 0;
    for (const [ore, count] of Object.entries(depotOres)) {
      if (count > 0 && ORE_DATA[ore]) {
        totalDepotValue += ORE_DATA[ore].value * count;
        totalDepotCount += count;
      }
    }

    let depotListHtml = '';
    if (totalDepotCount === 0) {
      depotListHtml = '<p style="color: #64748b; font-style: italic; margin: 10px 0; text-align: center; font-size: 12px;">Aktuell keine Erze im Depot eingelagert.</p>';
    } else {
      depotListHtml = '<div style="display: flex; flex-direction: column; gap: 8px; margin: 8px 0; max-height: 240px; overflow-y: auto; padding-right: 4px;">';
      for (const [ore, count] of Object.entries(depotOres)) {
        if (count <= 0) continue;
        const data = ORE_DATA[ore];
        const val = data ? data.value : 0;
        depotListHtml += `
          <div class="market-depot-card" data-ore="${ore}" style="background: #141c2b; padding: 10px 14px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.07); display: flex; flex-direction: column; gap: 8px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-weight: 700; color: #f8fafc; font-size: 13.5px; display: inline-flex; align-items: center; gap: 6px;">${oreIcon(ore, 16)} ${data.name}</span>
                <span style="background: rgba(56, 189, 248, 0.15); border: 1px solid rgba(56, 189, 248, 0.3); padding: 2px 8px; border-radius: 6px; font-size: 11px; color: #38bdf8; font-weight: 700;">Depot: ${count}x</span>
                <span style="font-size: 11px; color: #94a3b8;">(€${val}/Stk)</span>
              </div>
              <div style="display: flex; align-items: center; gap: 4px;">
                <span style="font-size: 11px; color: #94a3b8;">Erlös:</span>
                <strong class="ore-subtotal" id="subtotal-depot-${ore}" style="color: #fbbf24; font-size: 14px;">+€${val * count}</strong>
              </div>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px; background: rgba(0,0,0,0.3); padding: 8px 12px; border-radius: 10px;">
              <div style="display: flex; align-items: center; gap: 6px;">
                <span style="font-size: 11.5px; color: #94a3b8; font-weight: 700;">Menge:</span>
                <button class="btn-depot-qty-step btn-3d-secondary" data-ore="${ore}" data-step="-1" style="width: 32px; height: 32px; padding: 0; box-sizing: border-box; display: inline-flex; align-items: center; justify-content: center; font-size: 17px; font-weight: 800; border-radius: 8px;">-</button>
                <input type="number" class="input-depot-qty" id="qty-input-depot-${ore}" data-ore="${ore}" data-unit-val="${val}" data-max="${count}" min="1" max="${count}" value="${count}" style="width: 50px; height: 32px; padding: 0 4px; box-sizing: border-box; background: #090d16; border: 1px solid rgba(255,255,255,0.18); border-radius: 8px; color: #f8fafc; text-align: center; font-weight: 800; font-size: 13px; outline: none;">
                <button class="btn-depot-qty-step btn-3d-secondary" data-ore="${ore}" data-step="1" style="width: 32px; height: 32px; padding: 0; box-sizing: border-box; display: inline-flex; align-items: center; justify-content: center; font-size: 17px; font-weight: 800; border-radius: 8px;">+</button>
                <button class="btn-depot-qty-quick btn-3d-secondary" data-ore="${ore}" data-set="1" style="height: 32px; padding: 0 10px; font-size: 11.5px; font-weight: 700; border-radius: 8px;">1x</button>
                <button class="btn-depot-qty-quick btn-action" data-ore="${ore}" data-set="${count}" style="height: 32px; padding: 0 10px; font-size: 11.5px; font-weight: 700; border-radius: 8px;">Alle (${count})</button>
              </div>

              <button class="btn-sell-depot-market-custom btn-buy" data-ore="${ore}" style="height: 32px; padding: 0 14px; font-size: 12px; font-weight: 800; display: inline-flex; align-items: center; gap: 6px;">
                ${icon('coins', '', 14)}
                <span id="btn-sell-depot-text-${ore}">${count}x Verkaufen</span>
              </button>
            </div>
          </div>
        `;
      }
      depotListHtml += '</div>';
    }

    depotHtml = `
      <div style="background: rgba(15, 23, 42, 0.7); border: 1px solid rgba(56, 189, 248, 0.25); border-radius: 10px; padding: 12px; margin-top: 14px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
          <strong style="color: #38bdf8; font-size: 13px; display: inline-flex; align-items: center; gap: 6px;">
            ${icon('warehouse', '', 15)} DEPOT-LAGER (${totalDepotCount} Erze)
          </strong>
          <span style="color: #fbbf24; font-size: 13px; font-weight: 700;">Wert: €${totalDepotValue.toLocaleString()}</span>
        </div>
        ${depotListHtml}
        ${totalDepotCount > 0 ? `
          <button id="btn-sell-all-depot-market" class="btn-buy btn-lg" style="width: 100%; margin-top: 6px;">
            ${icon('coins', '', 15)} ALLE DEPOT-ERZE VERKAUFEN (+€${totalDepotValue.toLocaleString()})
          </button>
        ` : ''}
      </div>
    `;

    const content = `
      <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 8px;">
        <span style="font-size: 13px; color: var(--text-muted);">Frachtraum: <strong>${cargo.length} / ${this.player.maxCargo}</strong> Erzen</span>
        <strong style="color: #fbbf24; font-size: 14px;">Frachtwert: €${totalValue.toLocaleString()}</strong>
      </div>
      ${oreListHtml}
      <button id="btn-do-sell" class="btn-buy btn-lg" style="width: 100%; margin-top: 8px;" ${cargo.length === 0 ? 'disabled' : ''}>
        ${icon('coins', '', 15)} GESAMTE BOHRER-FRACHT VERKAUFEN (+€${totalValue.toLocaleString()})
      </button>
      ${depotHtml}
      ${factoryHtml}
      <div style="display: flex; justify-content: flex-end; margin-top: 14px;">
        <button id="btn-market-close" class="btn-3d-secondary" style="height: 32px; font-size: 11.5px; font-weight: 700; padding: 0 16px;">
          SCHLIESSEN
        </button>
      </div>
    `;

    this.openModal(`
      <div style="display: flex; align-items: center; gap: 8px;">
        ${icon('coins', '', 18)}
        <span>ERZBÖRSE</span>
      </div>
    `, content);

    // Mengen-Aktualisierungshelfer (Erze im Frachtraum)
    const updateOreQty = (ore, newQty) => {
      const input = document.getElementById(`qty-input-${ore}`);
      const subtotalEl = document.getElementById(`subtotal-${ore}`);
      const btnSellText = document.getElementById(`btn-sell-text-${ore}`);
      if (!input || !subtotalEl) return;
      const max = parseInt(input.getAttribute('data-max'), 10) || 1;
      const val = parseInt(input.getAttribute('data-unit-val'), 10) || 0;
      const clamped = Math.max(1, Math.min(max, parseInt(newQty, 10) || 1));
      input.value = clamped;
      subtotalEl.innerText = `+€${clamped * val}`;
      if (btnSellText) btnSellText.innerText = `${clamped}x Verkaufen`;
    };

    // Stepper Plus/Minus (Frachtraum)
    const stepBtns = document.querySelectorAll('.btn-qty-step');
    stepBtns.forEach((btn) => {
      btn.onclick = () => {
        const ore = btn.getAttribute('data-ore');
        const step = parseInt(btn.getAttribute('data-step'), 10) || 0;
        const input = document.getElementById(`qty-input-${ore}`);
        if (!input) return;
        const cur = parseInt(input.value, 10) || 1;
        updateOreQty(ore, cur + step);
      };
    });

    // Quick Buttons (1x, Alle) (Frachtraum)
    const quickBtns = document.querySelectorAll('.btn-qty-quick');
    quickBtns.forEach((btn) => {
      btn.onclick = () => {
        const ore = btn.getAttribute('data-ore');
        const setVal = parseInt(btn.getAttribute('data-set'), 10) || 1;
        updateOreQty(ore, setVal);
      };
    });

    // Direkte Tastatureingabe im Number-Input (Frachtraum)
    const qtyInputs = document.querySelectorAll('.input-ore-qty');
    qtyInputs.forEach((input) => {
      input.oninput = () => {
        const ore = input.getAttribute('data-ore');
        updateOreQty(ore, input.value);
      };
    });

    // Individueller Verkauf mit gewählter Stückzahl (Frachtraum)
    const sellCustomBtns = document.querySelectorAll('.btn-sell-custom');
    sellCustomBtns.forEach((btn) => {
      btn.onclick = () => {
        const ore = btn.getAttribute('data-ore');
        const input = document.getElementById(`qty-input-${ore}`);
        const qty = input ? parseInt(input.value, 10) || 1 : 1;
        const res = this.player.sellSpecificOre(ore, qty);
        if (res.count > 0) {
          soundFx.playPurchase();
          this.openMarketModal();
          this.scene.events.emit('notify', `${res.count}x ${ORE_DATA[ore]?.name || ore} verkauft für +€${res.totalEarned}!`);
        }
      };
    });

    // Depot Mengen-Aktualisierungshelfer (Erzbörse)
    const updateDepotOreQty = (ore, newQty) => {
      const input = document.getElementById(`qty-input-depot-${ore}`);
      const subtotalEl = document.getElementById(`subtotal-depot-${ore}`);
      const btnSellText = document.getElementById(`btn-sell-depot-text-${ore}`);
      if (!input || !subtotalEl) return;
      const max = parseInt(input.getAttribute('data-max'), 10) || 1;
      const val = parseInt(input.getAttribute('data-unit-val'), 10) || 0;
      const clamped = Math.max(1, Math.min(max, parseInt(newQty, 10) || 1));
      input.value = clamped;
      subtotalEl.innerText = `+€${clamped * val}`;
      if (btnSellText) btnSellText.innerText = `${clamped}x Verkaufen`;
    };

    document.querySelectorAll('.btn-depot-qty-step').forEach(btn => {
      btn.onclick = () => {
        const ore = btn.getAttribute('data-ore');
        const step = parseInt(btn.getAttribute('data-step'), 10) || 0;
        const input = document.getElementById(`qty-input-depot-${ore}`);
        if (!input) return;
        const cur = parseInt(input.value, 10) || 1;
        updateDepotOreQty(ore, cur + step);
      };
    });

    document.querySelectorAll('.btn-depot-qty-quick').forEach(btn => {
      btn.onclick = () => {
        const ore = btn.getAttribute('data-ore');
        const setVal = parseInt(btn.getAttribute('data-set'), 10) || 1;
        updateDepotOreQty(ore, setVal);
      };
    });

    document.querySelectorAll('.input-depot-qty').forEach(input => {
      input.oninput = () => {
        const ore = input.getAttribute('data-ore');
        updateDepotOreQty(ore, input.value);
      };
    });

    document.querySelectorAll('.btn-sell-depot-market-custom').forEach(btn => {
      btn.onclick = () => {
        const ore = btn.getAttribute('data-ore');
        const input = document.getElementById(`qty-input-depot-${ore}`);
        const qty = input ? parseInt(input.value, 10) || 1 : 1;
        this.sellDepotOre(ore, qty);
        this.openMarketModal();
      };
    });

    const btnSellAllDepotMarket = document.getElementById('btn-sell-all-depot-market');
    if (btnSellAllDepotMarket) {
      btnSellAllDepotMarket.onclick = () => {
        this.sellAllDepotOres();
        this.openMarketModal();
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
      subtotalEl.innerText = `+€${clamped * val}`;
      if (btnSellText) btnSellText.innerText = `${clamped}x Verkaufen`;
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

    // Einzelverkauf Fabrik-Produkt / Barren
    document.querySelectorAll('.btn-sell-fp-custom').forEach(btn => {
      btn.onclick = () => {
        const prodId = btn.getAttribute('data-prod');
        const input = document.getElementById(`qty-input-fp-${prodId}`);
        const qty = input ? parseInt(input.value, 10) || 1 : 1;
        const earned = this.player.sellFactoryProduct(prodId, qty);
        if (earned > 0) {
          soundFx.playPurchase();
          this.openMarketModal();
          const displayName = prodId.startsWith('bar_')
            ? getRefinedOreName(prodId.replace('bar_', ''))
            : (FACTORY_PRODUCTS[prodId]?.name || prodId);
          this.scene.events.emit('notify', `${qty}x ${displayName} verkauft für +€${earned}!`);
        }
      };
    });

    // Gesamtverkauf aller Fabrik- & Veredelungs-Waren
    const btnSellAllFp = document.getElementById('btn-sell-all-fp');
    if (btnSellAllFp) {
      btnSellAllFp.onclick = () => {
        let totalEarned = 0;
        const fp = this.player.factoryProducts || {};
        for (const [prodId, qty] of Object.entries(fp)) {
          if (qty > 0) {
            totalEarned += this.player.sellFactoryProduct(prodId, qty);
          }
        }
        if (totalEarned > 0) {
          soundFx.playPurchase();
          this.openMarketModal();
          this.scene.events.emit('notify', `Alle Industrie- & Veredelungswaren verkauft für +€${totalEarned}!`);
        }
      };
    }

    // Gesamtverkauf Roherze Listener
    const btnSell = document.getElementById('btn-do-sell');
    if (btnSell) {
      btnSell.onclick = () => {
        const earnings = this.player.sellCargo();
        soundFx.playPurchase();
        this.openMarketModal();
        this.scene.events.emit('notify', `Fracht vollständig verkauft für +€${earnings}!`);
      };
    }

    const btnMarketClose = document.getElementById('btn-market-close');
    if (btnMarketClose) {
      btnMarketClose.onclick = () => {
        soundFx.playClick();
        this.closeModal();
      };
    }
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
      capacity: this.depot?.capacity || 150,
      tier: this.depot?.tier || 1
    };
  }

  loadDepotSaveData(data) {
    if (!data) return;
    if (!this.depot) this.depot = {};
    this.depot.ores = { ...(data.ores || {}) };
    this.depot.products = { ...(data.products || {}) };
    this.depot.capacity = data.capacity || 150;
    this.depot.tier = data.tier || 1;
    this.depot.currentTab = 'ores';
  }

  openDepotModal(initialTab = 'ores') {
    this.isDepotModalOpen = true;
    if (!this.depot) {
      this.depot = { ores: {}, products: {}, capacity: 150, tier: 1, currentTab: 'ores' };
    }
    this.depot.currentTab = initialTab;
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
    const capacity = this.depot.capacity || 150;
    const occPct = Math.min(100, Math.round((totalStored / capacity) * 100));
    const isFull = totalStored >= capacity;
    const totalVal = this.getDepotTotalValue();

    // Erzzählung im Laderaum des Bohrers
    const cargoOreCounts = {};
    (this.player.cargo || []).forEach(ore => {
      cargoOreCounts[ore] = (cargoOreCounts[ore] || 0) + 1;
    });

    const playerProducts = this.player.factoryProducts || {};

    // Kopfzeile: Statusanzeige & Auslastungsbalken
    const headerHtml = `
      <div style="
        background: rgba(15, 23, 42, 0.85);
        border: 1px solid ${isFull ? 'rgba(239, 68, 68, 0.5)' : 'rgba(56, 189, 248, 0.25)'};
        border-radius: 12px;
        padding: 10px 14px;
        margin-bottom: 12px;
        display: flex;
        flex-direction: column;
        gap: 8px;
      ">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 6px;">
          <div style="display: flex; align-items: center; gap: 6px;">
            <span style="font-weight: 800; color: #f8fafc; font-size: 13px;">LAGERKAPAZITÄT</span>
            <span style="background: rgba(56, 189, 248, 0.15); border: 1px solid rgba(56, 189, 248, 0.3); color: #38bdf8; font-size: 10.5px; font-weight: 700; padding: 1px 7px; border-radius: 99px;">
              STUFE ${this.depot.tier || 1}
            </span>
            ${isFull ? `<span style="background: #ef4444; color: #ffffff; font-size: 9.5px; font-weight: 800; padding: 1px 6px; border-radius: 4px;">VOLL</span>` : ''}
          </div>
          <div style="display: flex; align-items: center; gap: 10px; font-size: 11px; font-weight: 700;">
            <span style="color: ${isFull ? '#ef4444' : '#f8fafc'};">
              ${totalStored} / ${capacity} Plätze belegt (${occPct}%)
            </span>
            <span style="color: #fbbf24; display: inline-flex; align-items: center; gap: 3px;">
              ${icon('coins', '', 12)} Wert: +€${totalVal.toLocaleString()}
            </span>
          </div>
        </div>

        <div style="height: 6px; background: rgba(0,0,0,0.6); border-radius: 99px; overflow: hidden; border: 1px solid rgba(255,255,255,0.1);">
          <div style="width: ${occPct}%; height: 100%; background: ${isFull ? '#ef4444' : occPct >= 80 ? '#f59e0b' : '#38bdf8'}; border-radius: 99px; transition: width 0.2s ease;"></div>
        </div>
      </div>
    `;

    // Tabs
    const tabs = [
      { id: 'ores', label: 'Erze & Mineralien', icon: 'stone' },
      { id: 'products', label: 'Barren & Fabrik-Waren', icon: 'layers' },
      { id: 'upgrade', label: 'Depot-Ausbau', icon: 'wrench' }
    ];

    const tabNavHtml = `
      <div style="display: flex; gap: 6px; overflow-x: auto; padding-bottom: 8px; margin-bottom: 12px; scrollbar-width: none;">
        ${tabs.map(t => {
          const isActive = this.depot.currentTab === t.id;
          return `
            <button class="depot-tab-btn btn-3d-secondary" data-tab="${t.id}" style="
              height: 32px;
              box-sizing: border-box;
              background: ${isActive ? 'linear-gradient(180deg, #0284c7 0%, #0369a1 100%)' : ''};
              border-color: ${isActive ? '#38bdf8' : ''};
              border-bottom: ${isActive ? '3px solid #075985' : ''};
              color: ${isActive ? '#ffffff' : '#94a3b8'};
              padding: 0 12px;
              font-size: 11.5px;
              font-weight: 700;
              border-radius: 8px;
              display: inline-flex;
              align-items: center;
              justify-content: center;
              gap: 6px;
              cursor: pointer;
              white-space: nowrap;
            ">
              ${icon(t.icon, '', 14)}
              <span>${t.label}</span>
            </button>
          `;
        }).join('')}
      </div>
    `;

    // Schnell-Aktionen (Bulk Transfer)
    let bulkActionsHtml = '';
    if (this.depot.currentTab === 'ores') {
      const totalStoredOresCount = Object.values(this.depot.ores || {}).reduce((s, v) => s + v, 0);
      const totalStoredOresValue = Object.entries(this.depot.ores || {}).reduce((s, [k, v]) => s + (ORE_DATA[k]?.value || 0) * v, 0);
      const playerCargoLen = this.player.cargo ? this.player.cargo.length : 0;
      const freeCargo = (this.player.maxCargo || 10) - playerCargoLen;

      bulkActionsHtml = `
        <div style="display: flex; gap: 8px; margin-bottom: 12px; flex-wrap: wrap;">
          <button id="btn-depot-all-ores" class="btn-action" style="height: 32px; font-size: 11px; padding: 0 12px; display: inline-flex; align-items: center; gap: 5px;" ${playerCargoLen > 0 ? '' : 'disabled'}>
            ${icon('arrow-down-to-line', '', 13)}
            <span>ALLE AUS BOHRER EINLAGERN (${playerCargoLen})</span>
          </button>
          <button id="btn-depot-fill-cargo" class="btn-3d-secondary" style="height: 32px; font-size: 11px; padding: 0 12px; display: inline-flex; align-items: center; gap: 5px;" ${(totalStoredOresCount > 0 && freeCargo > 0) ? '' : 'disabled'}>
            ${icon('arrow-up-from-line', '', 13)}
            <span>BOHRER AUS DEPOT FÜLLEN (${freeCargo} frei)</span>
          </button>
          <button id="btn-depot-sell-all-ores" class="btn-buy" style="height: 32px; font-size: 11px; padding: 0 12px; display: inline-flex; align-items: center; gap: 5px;" ${totalStoredOresCount > 0 ? '' : 'disabled'}>
            ${icon('coins', '', 13)}
            <span>ALLE DEPOT-ERZE VERKAUFEN (+€${totalStoredOresValue.toLocaleString()})</span>
          </button>
        </div>
      `;
    } else if (this.depot.currentTab === 'products') {
      const totalStoredProdCount = Object.values(this.depot.products || {}).reduce((s, v) => s + v, 0);
      const totalStoredProdValue = Object.entries(this.depot.products || {}).reduce((s, [k, v]) => s + (FACTORY_PRODUCTS[k]?.value || 0) * v, 0);
      const playerProdCount = Object.values(this.player.factoryProducts || {}).reduce((s, v) => s + v, 0);

      bulkActionsHtml = `
        <div style="display: flex; gap: 8px; margin-bottom: 12px; flex-wrap: wrap;">
          <button id="btn-depot-all-products" class="btn-action" style="height: 32px; font-size: 11px; padding: 0 12px; display: inline-flex; align-items: center; gap: 5px;" ${playerProdCount > 0 ? '' : 'disabled'}>
            ${icon('arrow-down-to-line', '', 13)}
            <span>ALLE EIGENEN WAREN EINLAGERN (${playerProdCount})</span>
          </button>
          <button id="btn-depot-withdraw-all-products" class="btn-3d-secondary" style="height: 32px; font-size: 11px; padding: 0 12px; display: inline-flex; align-items: center; gap: 5px;" ${totalStoredProdCount > 0 ? '' : 'disabled'}>
            ${icon('arrow-up-from-line', '', 13)}
            <span>ALLE WAREN AUSLAGERN (${totalStoredProdCount})</span>
          </button>
          <button id="btn-depot-sell-all-products" class="btn-buy" style="height: 32px; font-size: 11px; padding: 0 12px; display: inline-flex; align-items: center; gap: 5px;" ${totalStoredProdCount > 0 ? '' : 'disabled'}>
            ${icon('coins', '', 13)}
            <span>ALLE DEPOT-WAREN VERKAUFEN (+€${totalStoredProdValue.toLocaleString()})</span>
          </button>
        </div>
      `;
    }

    // Content je nach Tab
    let contentHtml = '';

    if (this.depot.currentTab === 'ores') {
      const oreEntries = Object.keys(ORE_DATA);
      const freeDepot = capacity - totalStored;
      const playerCargoLength = this.player.cargo ? this.player.cargo.length : 0;
      const freeCargo = (this.player.maxCargo || 10) - playerCargoLength;

      contentHtml = `
        ${bulkActionsHtml}
        <div style="display: flex; flex-direction: column; gap: 6px; max-height: 270px; overflow-y: auto; padding-right: 2px;">
          ${oreEntries.map(key => {
            const data = ORE_DATA[key];
            const inDepot = this.depot.ores?.[key] || 0;
            const inCargo = cargoOreCounts[key] || 0;

            const canDeposit = inCargo > 0 && freeDepot > 0;
            const canWithdraw = inDepot > 0 && freeCargo > 0;
            const canSell = inDepot > 0;

            return `
              <div style="
                background: #141c2b;
                border: 1px solid rgba(255, 255, 255, 0.08);
                border-radius: 8px;
                padding: 8px 12px;
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 8px;
              ">
                <!-- Info links -->
                <div style="display: flex; align-items: center; gap: 8px; min-width: 0;">
                  <div style="display: flex; align-items: center; justify-content: center; width: 26px; height: 26px; background: rgba(0,0,0,0.35); border-radius: 6px; border: 1px solid rgba(255,255,255,0.06);">
                    ${oreIcon(key, 16)}
                  </div>
                  <div style="display: flex; flex-direction: column; min-width: 0;">
                    <span style="font-size: 13px; font-weight: 700; color: #f8fafc; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                      ${data.name}
                    </span>
                    <span style="font-size: 10px; color: #94a3b8;">
                      Börsenwert: €${data.value} • Tiefe: ab ${data.minDepth}m
                    </span>
                  </div>
                </div>

                <!-- Bestands-Badges & Stepper rechts -->
                <div style="display: flex; align-items: center; gap: 8px; flex-shrink: 0;">
                  <!-- Bestände -->
                  <div style="display: flex; flex-direction: column; align-items: flex-end; font-size: 10.5px; font-weight: 700;">
                    <span style="color: #38bdf8;">Depot: <strong style="color: #ffffff;">${inDepot}x</strong></span>
                    <span style="color: #94a3b8;">Bohrer: <strong style="color: #e2e8f0;">${inCargo}x</strong></span>
                  </div>

                  <!-- Aktionen -->
                  <div style="display: flex; align-items: center; gap: 4px;">
                    <!-- Auslagern -->
                    <button class="btn-withdraw-ore btn-3d-secondary" data-ore="${key}" ${canWithdraw ? '' : 'disabled'} style="
                      height: 28px; padding: 0 7px; font-size: 11px; font-weight: 800; border-radius: 6px;
                      opacity: ${canWithdraw ? '1' : '0.35'}; cursor: ${canWithdraw ? 'pointer' : 'default'};
                    " title="1x in den Bohrer auslagern">-1</button>

                    <button class="btn-withdraw-fill-ore btn-3d-secondary" data-ore="${key}" ${canWithdraw ? '' : 'disabled'} style="
                      height: 28px; padding: 0 7px; font-size: 10px; font-weight: 700; border-radius: 6px;
                      opacity: ${canWithdraw ? '1' : '0.35'}; cursor: ${canWithdraw ? 'pointer' : 'default'};
                    " title="Bohrer-Laderaum mit diesem Erz füllen">Laden</button>

                    <!-- Einlagern -->
                    <button class="btn-deposit-ore btn-action" data-ore="${key}" ${canDeposit ? '' : 'disabled'} style="
                      height: 28px; padding: 0 7px; font-size: 11px; font-weight: 800; border-radius: 6px;
                      opacity: ${canDeposit ? '1' : '0.35'}; cursor: ${canDeposit ? 'pointer' : 'default'};
                    " title="1x ins Depot einlagern">+1</button>

                    <button class="btn-deposit-all-ore btn-action" data-ore="${key}" ${canDeposit ? '' : 'disabled'} style="
                      height: 28px; padding: 0 7px; font-size: 10px; font-weight: 800; border-radius: 6px;
                      opacity: ${canDeposit ? '1' : '0.35'}; cursor: ${canDeposit ? 'pointer' : 'default'};
                    " title="Alle aus Bohrer ins Depot einlagern">+Alle</button>

                    <!-- Direktverkauf aus Depot -->
                    <button class="btn-sell-depot-ore btn-buy" data-ore="${key}" ${canSell ? '' : 'disabled'} style="
                      height: 28px; padding: 0 8px; font-size: 10.5px; font-weight: 800; border-radius: 6px;
                      opacity: ${canSell ? '1' : '0.35'}; cursor: ${canSell ? 'pointer' : 'default'};
                    " title="1x direkt für €${data.value} verkaufen">€ Verkaufen</button>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `;
    } else if (this.depot.currentTab === 'products') {
      const freeDepot = capacity - totalStored;

      // 1. Alle veredelten Barren / Briketts / Kristalle
      const refinedEntries = Object.entries(REFINED_ORE_DATA).map(([rawKey, rData]) => {
        const key = rData.key;
        const inDepot = this.depot.products?.[key] || 0;
        const inPlayer = (playerProducts[key] || 0) + (this.player.cargo ? this.player.cargo.filter(c => c === key).length : 0);
        const val = getRefinedOreNetValue(rawKey);
        return {
          key,
          name: rData.name,
          value: val,
          desc: rData.desc,
          inDepot,
          inPlayer,
          isBar: true
        };
      });

      // 2. Industrielle Fabrik-Erzeugnisse
      const factoryEntries = Object.entries(FACTORY_PRODUCTS).map(([key, prod]) => {
        const inDepot = this.depot.products?.[key] || 0;
        const inPlayer = playerProducts[key] || 0;
        return {
          key,
          name: prod.name,
          value: prod.value,
          desc: prod.desc,
          inDepot,
          inPlayer,
          isBar: false
        };
      });

      const allProductItems = [...refinedEntries, ...factoryEntries];

      contentHtml = `
        ${bulkActionsHtml}
        <div style="display: flex; flex-direction: column; gap: 6px; max-height: 270px; overflow-y: auto; padding-right: 2px;">
          ${allProductItems.map(item => {
            const canDeposit = item.inPlayer > 0 && freeDepot > 0;
            const canWithdraw = item.inDepot > 0;
            const canSell = item.inDepot > 0;

            return `
              <div style="
                background: #141c2b;
                border: 1px solid rgba(255, 255, 255, 0.08);
                border-radius: 8px;
                padding: 8px 12px;
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 8px;
              ">
                <div style="display: flex; align-items: center; gap: 8px; min-width: 0;">
                  <div style="display: flex; align-items: center; justify-content: center; width: 26px; height: 26px; background: rgba(0,0,0,0.35); border-radius: 6px; border: 1px solid rgba(255,255,255,0.06);">
                    ${itemDisplayIcon(item.key, 16)}
                  </div>
                  <div style="display: flex; flex-direction: column; min-width: 0;">
                    <span style="font-size: 13px; font-weight: 700; color: #f8fafc; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                      ${item.name}
                    </span>
                    <span style="font-size: 10px; color: #94a3b8;">
                      Börsenwert: €${item.value} • ${item.isBar ? 'Aus Schmelzofen' : 'Fabrik-Werkstoff'}
                    </span>
                  </div>
                </div>

                <div style="display: flex; align-items: center; gap: 8px; flex-shrink: 0;">
                  <div style="display: flex; flex-direction: column; align-items: flex-end; font-size: 10.5px; font-weight: 700;">
                    <span style="color: #38bdf8;">Depot: <strong style="color: #ffffff;">${item.inDepot}x</strong></span>
                    <span style="color: #94a3b8;">Besitz: <strong style="color: #e2e8f0;">${item.inPlayer}x</strong></span>
                  </div>

                  <div style="display: flex; align-items: center; gap: 4px;">
                    <button class="btn-withdraw-product btn-3d-secondary" data-product="${item.key}" ${canWithdraw ? '' : 'disabled'} style="
                      height: 28px; padding: 0 7px; font-size: 11px; font-weight: 800; border-radius: 6px;
                      opacity: ${canWithdraw ? '1' : '0.35'}; cursor: ${canWithdraw ? 'pointer' : 'default'};
                    " title="1x aus dem Depot nehmen">-1</button>

                    <button class="btn-withdraw-all-product btn-3d-secondary" data-product="${item.key}" ${canWithdraw ? '' : 'disabled'} style="
                      height: 28px; padding: 0 7px; font-size: 10px; font-weight: 700; border-radius: 6px;
                      opacity: ${canWithdraw ? '1' : '0.35'}; cursor: ${canWithdraw ? 'pointer' : 'default'};
                    " title="Alle Einheiten aus dem Depot nehmen">-Alle</button>

                    <button class="btn-deposit-product btn-action" data-product="${item.key}" ${canDeposit ? '' : 'disabled'} style="
                      height: 28px; padding: 0 7px; font-size: 11px; font-weight: 800; border-radius: 6px;
                      opacity: ${canDeposit ? '1' : '0.35'}; cursor: ${canDeposit ? 'pointer' : 'default'};
                    " title="1x ins Depot legen">+1</button>

                    <button class="btn-deposit-all-product btn-action" data-product="${item.key}" ${canDeposit ? '' : 'disabled'} style="
                      height: 28px; padding: 0 7px; font-size: 10px; font-weight: 800; border-radius: 6px;
                      opacity: ${canDeposit ? '1' : '0.35'}; cursor: ${canDeposit ? 'pointer' : 'default'};
                    " title="Alle ins Depot legen">+Alle</button>

                    <button class="btn-sell-depot-product btn-buy" data-product="${item.key}" ${canSell ? '' : 'disabled'} style="
                      height: 28px; padding: 0 8px; font-size: 10.5px; font-weight: 800; border-radius: 6px;
                      opacity: ${canSell ? '1' : '0.35'}; cursor: ${canSell ? 'pointer' : 'default'};
                    " title="1x direkt für €${item.value} verkaufen">€ Verkaufen</button>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `;
    } else if (this.depot.currentTab === 'upgrade') {
      const DEPOT_TIERS = [
        { tier: 1, capacity: 150, costCash: 0, label: 'Standard-Depot' },
        { tier: 2, capacity: 350, costCash: 1200, label: 'Erweiterte Hochregale' },
        { tier: 3, capacity: 750, costCash: 3800, costComp: { hydraulic_part: 2 }, compName: '2x Hydraulikzylinder', label: 'Automatisierte Förderbrücke' },
        { tier: 4, capacity: 1500, costCash: 9500, costComp: { titan_alloy: 2 }, compName: '2x Titan-Legierung', label: 'Schwergut-Containerterminal' },
        { tier: 5, capacity: 3000, costCash: 24000, costComp: { quantum_chip: 2 }, compName: '2x Quanten-Steuerkern', label: 'Quanten-Kompressionslager' }
      ];

      const currentTier = this.depot.tier || 1;
      const nextTierData = DEPOT_TIERS.find(t => t.tier === currentTier + 1);

      contentHtml = `
        <div style="display: flex; flex-direction: column; gap: 10px;">
          <div style="background: #141c2b; border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 12px; display: flex; flex-direction: column; gap: 6px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 13px; font-weight: 700; color: #f8fafc;">Aktuelle Ausbaustufe: Stufe ${currentTier}</span>
              <span style="color: #38bdf8; font-weight: 800; font-size: 13px;">${capacity} Lagerplätze</span>
            </div>
            <p style="font-size: 11.5px; color: #94a3b8; margin: 0; line-height: 1.4;">
              Erweitere die Lagerkapazität des Depots, um riesige Mengen an Erzen für Fabrik-Aufträge und künftige Expeditionen vorzuhalten.
            </p>
          </div>

          ${nextTierData ? `
            <div style="background: rgba(56, 189, 248, 0.08); border: 1.5px solid #38bdf8; border-radius: 10px; padding: 12px; display: flex; flex-direction: column; gap: 8px;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 13.5px; font-weight: 800; color: #ffffff;">Stufe ${nextTierData.tier}: ${nextTierData.label}</span>
                <span style="background: rgba(56, 189, 248, 0.2); color: #38bdf8; font-weight: 800; font-size: 11px; padding: 2px 8px; border-radius: 6px;">
                  +${nextTierData.capacity - capacity} Plätze (${nextTierData.capacity} gesamt)
                </span>
              </div>

              <div style="display: flex; align-items: center; gap: 12px; font-size: 12px; font-weight: 700; flex-wrap: wrap;">
                <span style="color: ${this.player.cash >= nextTierData.costCash ? '#fbbf24' : '#ef4444'};">
                  Kosten: €${nextTierData.costCash.toLocaleString()}
                </span>
                ${nextTierData.compName ? `
                  <span style="color: #c084fc;">
                    Bauteile: ${nextTierData.compName}
                  </span>
                ` : ''}
              </div>

              <button id="btn-depot-upgrade" class="btn-buy" style="height: 34px; font-size: 12px; font-weight: 800; margin-top: 4px;">
                ${icon('wrench', '', 14)}
                <span>JETZT AUSBAUEN (+${nextTierData.capacity - capacity} KAPAZITÄT)</span>
              </button>
            </div>
          ` : `
            <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid #10b981; border-radius: 10px; padding: 14px; text-align: center; color: #10b981; font-weight: 800; font-size: 13px;">
              MAXIMALE AUSBAUSTUFE ERREICHT (3.000 PLÄTZE)
            </div>
          `}
        </div>
      `;
    }

    // Modal-Fußzeile
    const footerHtml = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 14px; flex-wrap: wrap; gap: 8px;">
        <div style="display: flex; gap: 6px;">
          <button id="btn-depot-to-market" class="btn-action" style="height: 32px; font-size: 11px; font-weight: 700; padding: 0 12px; display: inline-flex; align-items: center; gap: 5px;">
            ${icon('coins', '', 12)}
            <span>ZUR ERZ-BÖRSE</span>
          </button>
          <button id="btn-depot-to-factory" class="btn-action" style="height: 32px; font-size: 11px; font-weight: 700; padding: 0 12px; display: inline-flex; align-items: center; gap: 5px;">
            ${icon('factory', '', 12)}
            <span>ZUR FABRIK</span>
          </button>
        </div>

        <button id="btn-depot-close" class="btn-3d-secondary" style="height: 32px; font-size: 11.5px; font-weight: 700; padding: 0 16px;">
          SCHLIESSEN
        </button>
      </div>
    `;

    this.modalBodyEl.innerHTML = `
      <div style="display: flex; flex-direction: column;">
        ${headerHtml}
        ${tabNavHtml}
        <div id="depot-tab-content">
          ${contentHtml}
        </div>
        ${footerHtml}
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

    // Tabs
    body.querySelectorAll('.depot-tab-btn').forEach(btn => {
      btn.onclick = () => {
        soundFx.playClick();
        this.depot.currentTab = btn.getAttribute('data-tab');
        this.renderDepotModal();
      };
    });

    // Bulk Aktionen Erze
    const btnAllOres = body.querySelector('#btn-depot-all-ores');
    if (btnAllOres) btnAllOres.onclick = () => this.depositAllOres();

    const btnFillCargo = body.querySelector('#btn-depot-fill-cargo');
    if (btnFillCargo) btnFillCargo.onclick = () => this.fillCargoFromDepot();

    const btnSellAllOres = body.querySelector('#btn-depot-sell-all-ores');
    if (btnSellAllOres) btnSellAllOres.onclick = () => this.sellAllDepotOres();

    // Bulk Aktionen Waren
    const btnAllProducts = body.querySelector('#btn-depot-all-products');
    if (btnAllProducts) btnAllProducts.onclick = () => this.depositAllProducts();

    const btnWithdrawAllProducts = body.querySelector('#btn-depot-withdraw-all-products');
    if (btnWithdrawAllProducts) btnWithdrawAllProducts.onclick = () => this.withdrawAllProducts();

    const btnSellAllProducts = body.querySelector('#btn-depot-sell-all-products');
    if (btnSellAllProducts) btnSellAllProducts.onclick = () => this.sellAllDepotProducts();

    // Einzelaktionen Erze
    body.querySelectorAll('.btn-withdraw-ore').forEach(btn => {
      btn.onclick = () => {
        const ore = btn.getAttribute('data-ore');
        this.withdrawOre(ore, 1);
      };
    });

    body.querySelectorAll('.btn-withdraw-fill-ore').forEach(btn => {
      btn.onclick = () => {
        const ore = btn.getAttribute('data-ore');
        this.withdrawFillOre(ore);
      };
    });

    body.querySelectorAll('.btn-deposit-ore').forEach(btn => {
      btn.onclick = () => {
        const ore = btn.getAttribute('data-ore');
        this.depositOre(ore, 1);
      };
    });

    body.querySelectorAll('.btn-deposit-all-ore').forEach(btn => {
      btn.onclick = () => {
        const ore = btn.getAttribute('data-ore');
        this.depositOre(ore, 9999);
      };
    });

    body.querySelectorAll('.btn-sell-depot-ore').forEach(btn => {
      btn.onclick = () => {
        const ore = btn.getAttribute('data-ore');
        this.sellDepotOre(ore, 1);
      };
    });

    // Einzelaktionen Waren
    body.querySelectorAll('.btn-withdraw-product').forEach(btn => {
      btn.onclick = () => {
        const prod = btn.getAttribute('data-product');
        this.withdrawProduct(prod, 1);
      };
    });

    body.querySelectorAll('.btn-withdraw-all-product').forEach(btn => {
      btn.onclick = () => {
        const prod = btn.getAttribute('data-product');
        this.withdrawProduct(prod, 9999);
      };
    });

    body.querySelectorAll('.btn-deposit-product').forEach(btn => {
      btn.onclick = () => {
        const prod = btn.getAttribute('data-product');
        this.depositProduct(prod, 1);
      };
    });

    body.querySelectorAll('.btn-deposit-all-product').forEach(btn => {
      btn.onclick = () => {
        const prod = btn.getAttribute('data-product');
        this.depositProduct(prod, 9999);
      };
    });

    body.querySelectorAll('.btn-sell-depot-product').forEach(btn => {
      btn.onclick = () => {
        const prod = btn.getAttribute('data-product');
        this.sellDepotProduct(prod, 1);
      };
    });

    // Ausbau
    const btnUpgrade = body.querySelector('#btn-depot-upgrade');
    if (btnUpgrade) {
      btnUpgrade.onclick = () => this.upgradeDepot();
    }

    // Navigation & Schließen
    const btnClose = body.querySelector('#btn-depot-close');
    if (btnClose) btnClose.onclick = () => this.closeModal();

    const btnToMarket = body.querySelector('#btn-depot-to-market');
    if (btnToMarket) {
      btnToMarket.onclick = () => {
        soundFx.playClick();
        this.openMarketModal();
      };
    }

    const btnToFactory = body.querySelector('#btn-depot-to-factory');
    if (btnToFactory) {
      btnToFactory.onclick = () => {
        soundFx.playClick();
        this.openFactoryModal();
      };
    }
  }

  depositOre(oreKey, count = 1) {
    if (!this.depot.ores) this.depot.ores = {};
    const freeCapacity = (this.depot.capacity || 150) - this.getDepotTotalCount();
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
    const freeCapacity = (this.depot.capacity || 150) - this.getDepotTotalCount();
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
    const freeCapacity = (this.depot.capacity || 150) - this.getDepotTotalCount();
    if (freeCapacity <= 0) {
      this.scene.events.emit('notify', '⚠️ Depot ist voll! Baue die Lagerkapazität aus.');
      return;
    }
    if (this.player.cargo.length === 0) {
      this.scene.events.emit('notify', 'Laderaum enthält keine Erze.');
      return;
    }

    let moved = 0;
    const remainingCargo = [];
    for (const ore of this.player.cargo) {
      if (moved < freeCapacity) {
        this.depot.ores[ore] = (this.depot.ores[ore] || 0) + 1;
        moved++;
      } else {
        remainingCargo.push(ore);
      }
    }
    this.player.cargo = remainingCargo;
    soundFx.playPurchase();
    if (this.scene.hud) this.scene.hud.update();
    this.renderDepotModal();
    this.scene.events.emit('notify', `📦 ${moved}x Erze ins Depot eingelagert!`);
  }

  depositAllProducts() {
    if (!this.depot.products) this.depot.products = {};
    const freeCapacity = (this.depot.capacity || 150) - this.getDepotTotalCount();
    if (freeCapacity <= 0) {
      this.scene.events.emit('notify', '⚠️ Depot ist voll! Baue die Lagerkapazität aus.');
      return;
    }

    let moved = 0;
    for (const [key, qty] of Object.entries(this.player.factoryProducts || {})) {
      if (qty > 0 && moved < freeCapacity) {
        const canMove = Math.min(qty, freeCapacity - moved);
        this.player.factoryProducts[key] -= canMove;
        this.depot.products[key] = (this.depot.products[key] || 0) + canMove;
        moved += canMove;
      }
    }

    if (moved > 0) {
      soundFx.playPurchase();
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
    const DEPOT_TIERS = [
      { tier: 1, capacity: 150, costCash: 0 },
      { tier: 2, capacity: 350, costCash: 1200 },
      { tier: 3, capacity: 750, costCash: 3800, costComp: { hydraulic_part: 2 } },
      { tier: 4, capacity: 1500, costCash: 9500, costComp: { titan_alloy: 2 } },
      { tier: 5, capacity: 3000, costCash: 24000, costComp: { quantum_chip: 2 } }
    ];

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

    quests.forEach((q) => {
      let canFulfill = true;
      let reqsText = [];
      for (const [ore, needed] of Object.entries(q.reqs)) {
        const haveCargo = cargoCounts[ore] || 0;
        const haveDepot = depotOres[ore] || 0;
        const totalHave = haveCargo + haveDepot;
        const oreName = ORE_DATA[ore]?.name || ore;
        if (totalHave < needed) canFulfill = false;
        reqsText.push(`<span style="color: ${totalHave >= needed ? '#10b981' : '#f87171'}; font-weight: 600;">${oreName}: ${totalHave}/${needed}</span>`);
      }

      questsHtml += `
        <div style="background: rgba(15, 23, 42, 0.75); border: 1px solid ${canFulfill ? '#10b981' : 'rgba(255,255,255,0.08)'}; border-radius: 10px; padding: 12px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <strong style="color: #f8fafc; font-size: 13px;">${q.title}</strong>
            <span style="font-size: 11px; color: #94a3b8;">${q.depthHint}</span>
          </div>
          <div style="display: flex; gap: 12px; margin-bottom: 8px; font-size: 12px;">
            Benötigt: ${reqsText.join(', ')}
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div style="display: flex; align-items: center; gap: 8px; font-size: 12px;">
              <span style="color: #38bdf8; font-weight: bold; display: inline-flex; align-items: center; gap: 4px;">
                ${icon(q.rewardComp.iconName, '', 14)} +1 ${q.rewardComp.name}
              </span>
              <span style="color: #fbbf24; font-weight: bold;">+€${q.rewardCash}</span>
              <span style="color: #c084fc; font-weight: bold;">+${q.rewardXp} XP</span>
            </div>
            <button class="btn-claim-geologist btn-buy" data-qid="${q.id}" ${canFulfill ? '' : 'disabled'} style="height: 32px; padding: 0 14px; font-size: 11.5px; font-weight: 700;">
              ${canFulfill ? 'Erze abgeben' : 'Erze fehlen'}
            </button>
          </div>
        </div>
      `;
    });
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
      <p style="font-size: 12px; color: #94a3b8; margin-bottom: 10px;">
        "Hallo Kollege! Ich analysiere geologische Besonderheiten im Gestein. Bring mir die gesuchten Erzproben (aus Frachtraum oder Depot), und ich überlasse dir wertvolle Spezial-Bauteile für deine Tech-Upgrades und Bauprojekte!"
      </p>
      ${compHeader}
      ${questsHtml}
      <div style="display: flex; justify-content: flex-end; margin-top: 14px;">
        <button id="btn-geologist-close" class="btn-3d-secondary" style="height: 32px; font-size: 11.5px; font-weight: 700; padding: 0 16px;">
          SCHLIESSEN
        </button>
      </div>
    `;

    this.openModal(`
      <div style="display: flex; align-items: center; gap: 8px;">
        ${icon('microscope', '', 18)}
        <span>STEINEFORSCHER</span>
      </div>
    `, content);

    const btnGeologistClose = document.getElementById('btn-geologist-close');
    if (btnGeologistClose) {
      btnGeologistClose.onclick = () => {
        soundFx.playClick();
        this.closeModal();
      };
    }

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
        maxTier: 8,
        tiers: TANK_TIERS,
        apply: (tier) => p.upgradeTank(tier)
      },
      {
        id: 'hull',
        title: 'GEHÄUSESCHUTZ / PANZERUNG',
        iconName: 'shield-cog',
        currentTier: p.hullTier || 1,
        maxTier: 8,
        tiers: HULL_TIERS,
        apply: (tier) => p.upgradeHull(tier)
      },
      {
        id: 'drill',
        title: 'BOHRKOPF-BAUPLÄNE',
        iconName: 'pickaxe',
        currentTier: p.researchedDrillTier || p.drillTier || 1,
        maxTier: 8,
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
        maxTier: 8,
        tiers: ENGINE_TIERS,
        apply: (tier) => p.upgradeEngine(tier)
      },
      {
        id: 'cargo',
        title: 'FRACHTRAUM-KAPAZITÄT',
        iconName: 'container',
        currentTier: p.cargoTier || 1,
        maxTier: 8,
        tiers: CARGO_TIERS,
        apply: (tier) => p.upgradeCargo(tier)
      },
      {
        id: 'sensor',
        title: 'GEO-SENSOR & RADAR',
        iconName: 'radio',
        currentTier: p.sensorTier || 1,
        maxTier: 8,
        tiers: SENSOR_TIERS,
        apply: (tier) => p.upgradeSensor(tier)
      }
    ];

    // Komponenten-Übersicht im Labor-Header
    const comps = p.components;
    const compHeader = `
      <div style="background: rgba(15,23,42,0.85); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 10px 14px; display: flex; justify-content: space-around; font-size: 12px; margin-bottom: 12px; flex-wrap: wrap; gap: 6px;">
        <span style="display: inline-flex; align-items: center; gap: 4px;">${icon('cog', '', 13)} Hydraulik: <strong style="color: #38bdf8;">${comps.hydraulic_part || 0}</strong></span>
        <span style="display: inline-flex; align-items: center; gap: 4px;">${icon('shield-check', '', 13)} Titan: <strong style="color: #38bdf8;">${comps.titan_alloy || 0}</strong></span>
        <span style="display: inline-flex; align-items: center; gap: 4px;">${icon('disc', '', 13)} Linse: <strong style="color: #38bdf8;">${comps.laser_lens || 0}</strong></span>
        <span style="display: inline-flex; align-items: center; gap: 4px;">${icon('atom', '', 13)} Quanten-Kern: <strong style="color: #38bdf8;">${comps.quantum_chip || 0}</strong></span>
      </div>
    `;

    // Feste Kategorien mit Segmented Progress Bar (OHNE Filterleiste!)
    let cardsHtml = '<div class="tech-lab-categories" style="display: flex; flex-direction: column; gap: 14px; max-height: 480px; overflow-y: auto; padding-right: 4px;">';

    tracks.forEach((track) => {
      const currentTierData = track.tiers[track.currentTier - 1];
      const hasNext = track.currentTier < track.maxTier;
      const nextTier = hasNext ? track.tiers[track.currentTier] : null;

      // Segmented Progress Bar (8 saubere Blöcke ohne umbrechenden Text)
      let segmentsHtml = '<div class="segmented-progress-bar">';
      for (let s = 1; s <= track.maxTier; s++) {
        if (s <= track.currentTier) {
          segmentsHtml += `
            <div class="seg-step completed${s === track.currentTier ? ' current' : ''}">
              <span>Stufe ${s}</span>
            </div>
          `;
        } else if (s === track.currentTier + 1) {
          segmentsHtml += `
            <div class="seg-step active">
              <span>Stufe ${s}</span>
            </div>
          `;
        } else {
          segmentsHtml += `
            <div class="seg-step locked">
              <span>Stufe ${s}</span>
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
        let compText = '';
        if (nextTier.comp) {
          const haveComp = p.components[nextTier.comp.key] || 0;
          if (haveComp < nextTier.comp.count) canAffordComp = false;
          const compIconName = COMPONENT_ICONS[nextTier.comp.key] || 'box';
          compText = `<span style="color: ${haveComp >= nextTier.comp.count ? '#10b981' : '#f87171'}; font-weight: 700; margin-left: 6px; display: inline-flex; align-items: center; gap: 4px;">+ ${icon(compIconName, '', 12)} ${nextTier.comp.count}x ${nextTier.comp.name} (${haveComp}/${nextTier.comp.count})</span>`;
        }

        const canBuy = isLevelMet && canAffordCash && canAffordComp;
        const isDrill = track.id === 'drill';

        actionHtml = `
          <div class="cat-action-row" style="margin-top: 8px; display: flex; justify-content: space-between; align-items: center; background: rgba(15,23,42,0.6); padding: 10px 12px; border-radius: 8px;">
            <div class="cat-next-desc" style="display: flex; flex-direction: column; gap: 3px;">
              <div>
                <strong style="color: #f8fafc; font-size: 13px;">${nextTier.name} <span style="color: #38bdf8; font-weight: 600; font-size: 12px; margin-left: 4px;">(${nextTier.stat})</span></strong>
                ${compText}
              </div>
              <span style="font-size: 11px; color: #94a3b8;">${nextTier.desc}</span>
              ${isDrill ? `<span style="font-size: 11px; color: #38bdf8;">Hinweis: Nach Erforschung muss der Bohrkopf im HANGAR montiert werden.</span>` : ''}
              ${!canAffordComp && nextTier.comp ? `<span style="font-size: 11px; color: #fbbf24;">Tipp: Bauteil beim Steineforscher erhältlich!</span>` : ''}
            </div>
            <div style="display: flex; align-items: center; gap: 8px; flex-shrink: 0;">
              ${!isLevelMet ? `<span class="badge-level-req">Lvl ${nextTier.level}</span>` : ''}
              <button class="btn-buy" id="btn-buy-track-${track.id}" ${canBuy ? '' : 'disabled'} style="height: 32px; padding: 0 14px; font-weight: 800; color: ${canBuy ? '#091220' : '#94a3b8'};">
                ${isDrill ? 'Bauplan' : 'Stufe'} ${nextTier.tier}: €${nextTier.cost}
              </button>
            </div>
          </div>
        `;
      } else {
        actionHtml = `
          <div class="cat-action-row" style="margin-top: 8px; display: flex; justify-content: space-between; align-items: center; background: rgba(15,23,42,0.6); padding: 10px 12px; border-radius: 8px;">
            <div class="cat-next-desc">
              <strong style="color: #10b981; display: inline-flex; align-items: center; gap: 6px;">${icon('award', '', 14)} Maximale Ausbaustufe installiert</strong>
              <div style="font-size: 11px; color: #94a3b8;">Höchste Technologieklasse erreicht. Keine weiteren Upgrades nötig.</div>
            </div>
            <div class="cat-max-badge">
              <span>MAX STUFE ${track.maxTier}</span>
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

    const footerHtml = `
      <div style="display: flex; justify-content: flex-end; margin-top: 14px;">
        <button id="btn-lab-close" class="btn-3d-secondary" style="height: 32px; font-size: 11.5px; font-weight: 700; padding: 0 16px;">
          SCHLIESSEN
        </button>
      </div>
    `;

    const fullContent = compHeader + cardsHtml + footerHtml;
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

    const btnLabClose = document.getElementById('btn-lab-close');
    if (btnLabClose) {
      btnLabClose.onclick = () => {
        soundFx.playClick();
        this.closeModal();
      };
    }
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
        <div style="display: flex; justify-content: flex-end; margin-top: 6px;">
          <button id="btn-drone-close" class="btn-3d-secondary" style="height: 32px; font-size: 11.5px; font-weight: 700; padding: 0 16px;">
            SCHLIESSEN
          </button>
        </div>
      </div>
    `;

    this.openModal(`
      <div style="display: flex; align-items: center; gap: 8px;">
        ${icon('bot', '', 18)}
        <span>DROHNEN-HANGAR</span>
      </div>
    `, content);

    const btnDroneClose = document.getElementById('btn-drone-close');
    if (btnDroneClose) {
      btnDroneClose.onclick = () => {
        soundFx.playClick();
        this.closeModal();
      };
    }

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

        <div style="display: flex; justify-content: flex-end; margin-top: 6px;">
          <button id="btn-teleporter-close" class="btn-3d-secondary" style="height: 32px; font-size: 11.5px; font-weight: 700; padding: 0 16px;">
            SCHLIESSEN
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

    const btnTeleporterClose = document.getElementById('btn-teleporter-close');
    if (btnTeleporterClose) {
      btnTeleporterClose.onclick = () => {
        soundFx.playClick();
        this.closeModal();
      };
    }

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
        <div style="display: flex; justify-content: flex-end; margin-top: 6px;">
          <button id="btn-powerplant-close" class="btn-3d-secondary" style="height: 32px; font-size: 11.5px; font-weight: 700; padding: 0 16px;">
            SCHLIESSEN
          </button>
        </div>
      </div>
    `;

    this.openModal(`
      <div style="display: flex; align-items: center; gap: 8px;">
        ${icon('zap', '', 18)}
        <span>KRAFTWERK</span>
      </div>
    `, content);

    const btnPowerClose = document.getElementById('btn-powerplant-close');
    if (btnPowerClose) {
      btnPowerClose.onclick = () => {
        soundFx.playClick();
        this.closeModal();
      };
    }
  }

  // =========================================================
  // BASIS-DOCKING & SCHMELZOFEN
  // =========================================================
  openDockModal() {
    const fuelCost = Math.round((this.player.maxFuel - this.player.fuel) * 0.4);
    const repairCost = Math.round((this.player.maxHull - this.player.hull) * 1.0);

    let sammlerInfo = '';
    if (this.sammlerState === 'WAITING') {
      sammlerInfo = `
        <div style="background: rgba(16,185,129,0.15); border: 1px solid #10b981; border-radius: 10px; padding: 10px 12px; font-size: 12px; display: flex; justify-content: space-between; align-items: center; margin-top: 4px;">
          <span style="color: #10b981; font-weight: 700; display: inline-flex; align-items: center; gap: 4px;">${icon('microscope', '', 14)} Steineforscher wartet am Hangar! (${Math.ceil(this.sammlerTimer)}s)</span>
          <button id="btn-talk-sammler-dock" class="btn-buy" style="height: 32px; padding: 0 12px; font-size: 11.5px;">AUFTRÄGE ÖFFNEN</button>
        </div>
      `;
    } else if (this.sammlerState === 'WALKING_IN') {
      sammlerInfo = `<div style="font-size: 11px; color: #38bdf8; margin-top: 4px;">Steineforscher nähert sich dem Hangar...</div>`;
    } else {
      sammlerInfo = `<div style="font-size: 11px; color: #94a3b8; margin-top: 4px;">Steineforscher unterwegs (Nächster Besuch in ca. ${Math.max(1, Math.ceil(this.sammlerTimer))}s)</div>`;
    }

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

    const tankSection = `
      <div style="background: rgba(15, 23, 42, 0.75); border: 1px solid rgba(255,255,255,0.08); padding: 10px 14px; border-radius: 10px; display: flex; flex-direction: column; gap: 6px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <strong style="display: inline-flex; align-items: center; gap: 6px; font-size: 13px; color: #f8fafc;">
              ${icon('fuel', '', 14)} Treibstoff-Tank
            </strong>
            <div style="font-size: 11.5px; color: #94a3b8; margin-top: 1px;">
              Installiert: <strong style="color: #38bdf8;">${curTankData.name} (${curTankData.stat})</strong>
            </div>
          </div>
          ${canUpgradeTank ? `
            <button id="btn-upgrade-tank-dock" class="btn-buy" style="height: 30px; padding: 0 12px; font-size: 11px; font-weight: 800;" ${canAffordTank ? '' : 'disabled'}>
              ${icon('fuel', '', 12)} TANK VERBESSERN: €${nextTankData.cost}
            </button>
          ` : `
            <span style="font-size: 11px; color: #10b981; font-weight: 700; background: rgba(16,185,129,0.15); border: 1px solid rgba(16,185,129,0.3); padding: 3px 8px; border-radius: 6px;">
              MAXIMALER TANK
            </span>
          `}
        </div>
        ${canUpgradeTank ? `
          <div style="font-size: 11px; color: #94a3b8;">
            Nächste Stufe: <strong style="color: #f8fafc;">${nextTankData.name}</strong> (${nextTankData.stat}) &bull; ${nextTankData.desc}
            ${formatCompReq(nextTankData)}${formatLevelReq(nextTankData)}
          </div>
        ` : `
          <div style="font-size: 11px; color: #10b981;">Höchste Treibstoffkapazität erreicht.</div>
        `}
      </div>
    `;

    // 2. Gehäuseschutz & Karosserie (Case-Schutz)
    const curHullTier = this.player.hullTier || 1;
    const curHullData = this.player.getHullData ? this.player.getHullData() : (HULL_TIERS[curHullTier - 1] || HULL_TIERS[0]);
    const canUpgradeHull = curHullTier < HULL_TIERS.length;
    const nextHullData = canUpgradeHull ? HULL_TIERS[curHullTier] : null;
    const canAffordHull = checkAfford(nextHullData);

    const hullSection = `
      <div style="background: rgba(15, 23, 42, 0.75); border: 1px solid rgba(255,255,255,0.08); padding: 10px 14px; border-radius: 10px; display: flex; flex-direction: column; gap: 6px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <strong style="display: inline-flex; align-items: center; gap: 6px; font-size: 13px; color: #f8fafc;">
              ${icon('shield-cog', '', 14)} Gehäuseschutz (Case-Schutz)
            </strong>
            <div style="font-size: 11.5px; color: #94a3b8; margin-top: 1px;">
              Installiert: <strong style="color: #10b981;">${curHullData.name} (${curHullData.stat})</strong>
            </div>
          </div>
          ${canUpgradeHull ? `
            <button id="btn-upgrade-hull-dock" class="btn-buy" style="height: 30px; padding: 0 12px; font-size: 11px; font-weight: 800;" ${canAffordHull ? '' : 'disabled'}>
              ${icon('shield-cog', '', 12)} SCHUTZ VERBESSERN: €${nextHullData.cost}
            </button>
          ` : `
            <span style="font-size: 11px; color: #10b981; font-weight: 700; background: rgba(16,185,129,0.15); border: 1px solid rgba(16,185,129,0.3); padding: 3px 8px; border-radius: 6px;">
              MAXIMALER CASE-SCHUTZ
            </span>
          `}
        </div>
        ${canUpgradeHull ? `
          <div style="font-size: 11px; color: #94a3b8;">
            Nächste Stufe: <strong style="color: #f8fafc;">${nextHullData.name}</strong> (${nextHullData.stat}) &bull; ${nextHullData.desc}
            ${formatCompReq(nextHullData)}${formatLevelReq(nextHullData)}
          </div>
        ` : `
          <div style="font-size: 11px; color: #10b981;">Höchste Panzerung erreicht. Maximaler Schutz vor Bohrabnutzung.</div>
        `}
      </div>
    `;

    // 3. Bohrkopf-Werkstatt (Montage erforschter Köpfe oder direktes Hangar-Upgrade)
    const curDrillTier = this.player.drillTier || 1;
    const resDrillTier = this.player.researchedDrillTier || curDrillTier;
    const curDrillData = DRILL_DATA[curDrillTier - 1] || DRILL_DATA[0];
    const canMount = resDrillTier > curDrillTier;
    const mountDrillData = canMount ? (DRILL_DATA[resDrillTier - 1] || DRILL_DATA[0]) : null;
    const canUpgradeDrill = curDrillTier < DRILL_DATA.length;
    const nextDrillData = canUpgradeDrill ? DRILL_DATA[curDrillTier] : null;
    const canAffordDrill = checkAfford(nextDrillData);

    const drillSection = `
      <div style="background: rgba(15, 23, 42, 0.75); border: 1px solid rgba(255,255,255,0.08); padding: 10px 14px; border-radius: 10px; display: flex; flex-direction: column; gap: 6px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <strong style="display: inline-flex; align-items: center; gap: 6px; font-size: 13px; color: #f8fafc;">
              ${icon('pickaxe', '', 14)} Bohrkopf-Werkstatt
            </strong>
            <div style="font-size: 11.5px; color: #94a3b8; margin-top: 1px;">
              Montiert: <strong style="color: #38bdf8;">${curDrillData.name} (${curDrillData.stat})</strong>
            </div>
          </div>
          ${canMount ? `
            <button id="btn-mount-drill-dock" class="btn-buy" style="height: 30px; padding: 0 12px; font-size: 11px; font-weight: 800; background: linear-gradient(135deg, #10b981, #059669);">
              ${icon('wrench', '', 12)} BOHRKOPF MONTIEREN (KOSTENLOS)
            </button>
          ` : (canUpgradeDrill ? `
            <button id="btn-upgrade-drill-dock" class="btn-buy" style="height: 30px; padding: 0 12px; font-size: 11px; font-weight: 800;" ${canAffordDrill ? '' : 'disabled'}>
              ${icon('pickaxe', '', 12)} AUFRÜSTEN: €${nextDrillData.cost}
            </button>
          ` : `
            <span style="font-size: 11px; color: #10b981; font-weight: 700; background: rgba(16,185,129,0.15); border: 1px solid rgba(16,185,129,0.3); padding: 3px 8px; border-radius: 6px;">
              MAXIMALER BOHRKOPF
            </span>
          `)}
        </div>
        ${canMount ? `
          <div style="font-size: 11px; color: #fbbf24; background: rgba(251,191,36,0.1); border: 1px solid rgba(251,191,36,0.25); padding: 5px 8px; border-radius: 6px;">
            Erforschter Bauplan bereit: <strong>${mountDrillData.name} (${mountDrillData.stat})</strong> im Hangar montieren!
          </div>
        ` : (canUpgradeDrill ? `
          <div style="font-size: 11px; color: #94a3b8;">
            Nächste Stufe: <strong style="color: #f8fafc;">${nextDrillData.name}</strong> (${nextDrillData.stat}) &bull; ${nextDrillData.desc}
            ${formatCompReq(nextDrillData)}${formatLevelReq(nextDrillData)}
          </div>
        ` : `
          <div style="font-size: 11px; color: #10b981;">Höchste Bohrleistung erreicht. Fräst mühelos durch jede Gesteinsschicht.</div>
        `)}
      </div>
    `;

    // 4. Antrieb & Steigflug
    const curEngineTier = this.player.engineTier || 1;
    const curEngineData = this.player.getEngineData ? this.player.getEngineData() : (ENGINE_TIERS[curEngineTier - 1] || ENGINE_TIERS[0]);
    const canUpgradeEngine = curEngineTier < ENGINE_TIERS.length;
    const nextEngineData = canUpgradeEngine ? ENGINE_TIERS[curEngineTier] : null;
    const canAffordEngine = checkAfford(nextEngineData);

    const engineSection = `
      <div style="background: rgba(15, 23, 42, 0.75); border: 1px solid rgba(255,255,255,0.08); padding: 10px 14px; border-radius: 10px; display: flex; flex-direction: column; gap: 6px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <strong style="display: inline-flex; align-items: center; gap: 6px; font-size: 13px; color: #f8fafc;">
              ${icon('zap', '', 14)} Antrieb & Steigflug
            </strong>
            <div style="font-size: 11.5px; color: #94a3b8; margin-top: 1px;">
              Installiert: <strong style="color: #38bdf8;">${curEngineData.name} (${curEngineData.stat})</strong>
            </div>
          </div>
          ${canUpgradeEngine ? `
            <button id="btn-upgrade-engine-dock" class="btn-buy" style="height: 30px; padding: 0 12px; font-size: 11px; font-weight: 800;" ${canAffordEngine ? '' : 'disabled'}>
              ${icon('zap', '', 12)} ANTRIEB VERBESSERN: €${nextEngineData.cost}
            </button>
          ` : `
            <span style="font-size: 11px; color: #10b981; font-weight: 700; background: rgba(16,185,129,0.15); border: 1px solid rgba(16,185,129,0.3); padding: 3px 8px; border-radius: 6px;">
              MAXIMALER ANTRIEB
            </span>
          `}
        </div>
        ${canUpgradeEngine ? `
          <div style="font-size: 11px; color: #94a3b8;">
            Nächste Stufe: <strong style="color: #f8fafc;">${nextEngineData.name}</strong> (${nextEngineData.stat}) &bull; ${nextEngineData.desc}
            ${formatCompReq(nextEngineData)}${formatLevelReq(nextEngineData)}
          </div>
        ` : `
          <div style="font-size: 11px; color: #10b981;">Höchste Triebwerksleistung installiert.</div>
        `}
      </div>
    `;

    // 5. Frachtraum-Kapazität
    const curCargoTier = this.player.cargoTier || 1;
    const curCargoData = this.player.getCargoData ? this.player.getCargoData() : (CARGO_TIERS[curCargoTier - 1] || CARGO_TIERS[0]);
    const canUpgradeCargo = curCargoTier < CARGO_TIERS.length;
    const nextCargoData = canUpgradeCargo ? CARGO_TIERS[curCargoTier] : null;
    const canAffordCargo = checkAfford(nextCargoData);

    const cargoSection = `
      <div style="background: rgba(15, 23, 42, 0.75); border: 1px solid rgba(255,255,255,0.08); padding: 10px 14px; border-radius: 10px; display: flex; flex-direction: column; gap: 6px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <strong style="display: inline-flex; align-items: center; gap: 6px; font-size: 13px; color: #f8fafc;">
              ${icon('container', '', 14)} Frachtraum-Kapazität
            </strong>
            <div style="font-size: 11.5px; color: #94a3b8; margin-top: 1px;">
              Installiert: <strong style="color: #38bdf8;">${curCargoData.name} (${curCargoData.stat})</strong>
            </div>
          </div>
          ${canUpgradeCargo ? `
            <button id="btn-upgrade-cargo-dock" class="btn-buy" style="height: 30px; padding: 0 12px; font-size: 11px; font-weight: 800;" ${canAffordCargo ? '' : 'disabled'}>
              ${icon('container', '', 12)} KAPAZITÄT ERWEITERN: €${nextCargoData.cost}
            </button>
          ` : `
            <span style="font-size: 11px; color: #10b981; font-weight: 700; background: rgba(16,185,129,0.15); border: 1px solid rgba(16,185,129,0.3); padding: 3px 8px; border-radius: 6px;">
              MAXIMALER FRACHTRAUM
            </span>
          `}
        </div>
        ${canUpgradeCargo ? `
          <div style="font-size: 11px; color: #94a3b8;">
            Nächste Stufe: <strong style="color: #f8fafc;">${nextCargoData.name}</strong> (${nextCargoData.stat}) &bull; ${nextCargoData.desc}
            ${formatCompReq(nextCargoData)}${formatLevelReq(nextCargoData)}
          </div>
        ` : `
          <div style="font-size: 11px; color: #10b981;">Höchste Frachtraumstufe erreicht.</div>
        `}
      </div>
    `;

    // 6. Geo-Sensor & Radar
    const curSensorTier = this.player.sensorTier || 1;
    const curSensorData = this.player.getSensorData ? this.player.getSensorData() : (SENSOR_TIERS[curSensorTier - 1] || SENSOR_TIERS[0]);
    const canUpgradeSensor = curSensorTier < SENSOR_TIERS.length;
    const nextSensorData = canUpgradeSensor ? SENSOR_TIERS[curSensorTier] : null;
    const canAffordSensor = checkAfford(nextSensorData);

    const sensorSection = `
      <div style="background: rgba(15, 23, 42, 0.75); border: 1px solid rgba(255,255,255,0.08); padding: 10px 14px; border-radius: 10px; display: flex; flex-direction: column; gap: 6px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <strong style="display: inline-flex; align-items: center; gap: 6px; font-size: 13px; color: #f8fafc;">
              ${icon('radio', '', 14)} Geo-Sensor & Radar
            </strong>
            <div style="font-size: 11.5px; color: #94a3b8; margin-top: 1px;">
              Installiert: <strong style="color: #38bdf8;">${curSensorData.name} (${curSensorData.stat})</strong>
            </div>
          </div>
          ${canUpgradeSensor ? `
            <button id="btn-upgrade-sensor-dock" class="btn-buy" style="height: 30px; padding: 0 12px; font-size: 11px; font-weight: 800;" ${canAffordSensor ? '' : 'disabled'}>
              ${icon('radio', '', 12)} SENSOR VERBESSERN: €${nextSensorData.cost}
            </button>
          ` : `
            <span style="font-size: 11px; color: #10b981; font-weight: 700; background: rgba(16,185,129,0.15); border: 1px solid rgba(16,185,129,0.3); padding: 3px 8px; border-radius: 6px;">
              MAXIMALER SENSOR
            </span>
          `}
        </div>
        ${canUpgradeSensor ? `
          <div style="font-size: 11px; color: #94a3b8;">
            Nächste Stufe: <strong style="color: #f8fafc;">${nextSensorData.name}</strong> (${nextSensorData.stat}) &bull; ${nextSensorData.desc}
            ${formatCompReq(nextSensorData)}${formatLevelReq(nextSensorData)}
          </div>
        ` : `
          <div style="font-size: 11px; color: #10b981;">Höchste Scan-Reichweite aktiv.</div>
        `}
      </div>
    `;

    const content = `
      <div style="display: flex; flex-direction: column; gap: 10px; max-height: 520px; overflow-y: auto; padding-right: 4px;">
        <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(15, 23, 42, 0.75); border: 1px solid rgba(255,255,255,0.08); padding: 10px 14px; border-radius: 10px;">
          <div>
            <strong style="display: inline-flex; align-items: center; gap: 5px;">${icon('fuel', '', 14)} Tank auffüllen</strong>
            <div style="font-size: 12px; color: #94a3b8;">Status: ${Math.round(this.player.fuel)} / ${this.player.maxFuel} L</div>
          </div>
          <button id="btn-refuel-dock" class="btn-buy" style="height: 32px; padding: 0 14px; font-size: 11.5px;" ${fuelCost <= 0 ? 'disabled' : ''}>
            ${fuelCost <= 0 ? 'VOLLGETANKT' : `SOFORT: €${fuelCost}`}
          </button>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(15, 23, 42, 0.75); border: 1px solid rgba(255,255,255,0.08); padding: 10px 14px; border-radius: 10px;">
          <div>
            <strong style="display: inline-flex; align-items: center; gap: 5px;">${icon('shield', '', 14)} Rumpf reparieren</strong>
            <div style="font-size: 12px; color: #94a3b8;">Status: ${Math.round(this.player.hull)} / ${this.player.maxHull} HP</div>
          </div>
          <button id="btn-repair-dock" class="btn-buy" style="height: 32px; padding: 0 14px; font-size: 11.5px;" ${repairCost <= 0 ? 'disabled' : ''}>
            ${repairCost <= 0 ? 'UNBESCHÄDIGT' : `SOFORT: €${repairCost}`}
          </button>
        </div>

        ${sammlerInfo}

        <div style="font-weight: 800; font-size: 12px; color: #38bdf8; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 4px; display: flex; align-items: center; gap: 6px;">
          ${icon('wrench', '', 14)} Fahrzeug-Werkstatt (Aufrüstungen & Montage)
        </div>

        ${tankSection}
        ${hullSection}
        ${drillSection}
        ${engineSection}
        ${cargoSection}
        ${sensorSection}

        <div style="font-size: 11px; color: #10b981; margin-top: 4px;">
          Tipp: Am Hangar schließt das Betankungskabel automatisch an und füllt deinen Treibstoff kostenlos auf.
        </div>

        <div style="display: flex; justify-content: flex-end; margin-top: 14px;">
          <button id="btn-dock-close" class="btn-3d-secondary" style="height: 32px; font-size: 11.5px; font-weight: 700; padding: 0 16px;">
            SCHLIESSEN
          </button>
        </div>
      </div>
    `;

    this.openModal(`
      <div style="display: flex; align-items: center; gap: 8px;">
        ${icon('wrench', '', 18)}
        <span>HANGAR</span>
      </div>
    `, content);

    const btnTalkSammler = document.getElementById('btn-talk-sammler-dock');
    if (btnTalkSammler) {
      btnTalkSammler.onclick = () => {
        this.openGeologistModal();
      };
    }

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

    const btnDockClose = document.getElementById('btn-dock-close');
    if (btnDockClose) {
      btnDockClose.onclick = () => {
        soundFx.playClick();
        this.closeModal();
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

    let remainingElapsed = elapsedMs;
    let finishedCount = 0;

    while (remainingElapsed > 0 && this.refinery.queue.length > 0) {
      const current = this.refinery.queue[0];
      if (remainingElapsed >= current.remainingMs) {
        remainingElapsed -= current.remainingMs;
        const completed = this.refinery.queue.shift();
        completed.remainingMs = 0;
        completed.finishedAt = now - remainingElapsed;
        this.refinery.finished.push(completed);
        finishedCount++;
      } else {
        current.remainingMs -= remainingElapsed;
        remainingElapsed = 0;
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
    if (queue.length === 0) return;

    const current = queue[0];
    const pct = Math.min(100, Math.max(0, Math.round(((current.durationMs - current.remainingMs) / current.durationMs) * 100)));
    const totalQueueMs = queue.reduce((sum, item) => sum + item.remainingMs, 0);

    const timerEl = document.getElementById('refinery-current-timer');
    if (timerEl) {
      timerEl.textContent = this.formatRefineryClock(current.remainingMs);
    }

    const fillEl = document.getElementById('refinery-progress-fill');
    if (fillEl) {
      fillEl.style.width = `${pct}%`;
    }

    const pctEl = document.getElementById('refinery-progress-pct');
    if (pctEl) {
      pctEl.textContent = `${pct}%`;
    }

    const totalEl = document.getElementById('refinery-total-queue-time');
    if (totalEl) {
      totalEl.textContent = `Gesamtlaufzeit: ${this.formatRefineryTime(totalQueueMs)}`;
    }
  }

  renderRefineryModalBody() {
    const container = document.getElementById('refinery-modal-container');
    if (!container) return;

    const queue = this.refinery.queue;
    const finished = this.refinery.finished;
    const cargo = this.player.cargo || [];

    // Frachtzähler für Rezepte
    const cargoCounts = {};
    cargo.forEach(ore => {
      cargoCounts[ore] = (cargoCounts[ore] || 0) + 1;
    });

    const isProducing = queue.length > 0;
    const current = isProducing ? queue[0] : null;
    const pct = current ? Math.min(100, Math.max(0, Math.round(((current.durationMs - current.remainingMs) / current.durationMs) * 100))) : 0;
    const totalQueueMs = queue.reduce((sum, item) => sum + item.remainingMs, 0);
    const totalGain = finished.reduce((sum, item) => sum + item.value, 0);

    // Warteschlangen-Chips
    let queueChipsHtml = '';
    if (queue.length > 1) {
      const nextItems = queue.slice(1, 5);
      const chips = nextItems.map(item => `
        <span style="background: rgba(15, 23, 42, 0.9); border: 1px solid rgba(255,255,255,0.1); padding: 2px 6px; border-radius: 4px; font-size: 10px; color: #cbd5e1;">
          ${item.name}
        </span>
      `).join('');
      const more = queue.length - 1 - nextItems.length;
      queueChipsHtml = `
        <div style="display: flex; flex-wrap: wrap; gap: 4px; margin-top: 6px;">
          ${chips}
          ${more > 0 ? `<span style="font-size: 10px; color: #94a3b8;">+${more}</span>` : ''}
        </div>
      `;
    }

    // 1. VISUALISIERTE FABRIKSTRECKE (Trichter -> Förderband/Pfeile -> Ofen/Maschine -> Förderband -> Ausgang)
    let html = `
      <div style="display: flex; flex-direction: column; gap: 12px; max-height: 520px; overflow-y: auto; padding-right: 4px;">

        <div style="background: linear-gradient(180deg, rgba(15, 23, 42, 0.95) 0%, rgba(10, 15, 26, 0.98) 100%); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 14px; position: relative;">
          <!-- Status-Header der Fertigungsstrecke -->
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: ${isProducing ? '#10b981' : '#64748b'}; box-shadow: 0 0 8px ${isProducing ? '#10b981' : 'transparent'};"></span>
              <strong style="color: #f8fafc; font-size: 12px; letter-spacing: 0.5px; text-transform: uppercase;">
                PRODUKTIONSSTRECKE ${isProducing ? '<span style="color: #fb923c; font-size: 11px;">(IN BETRIEB)</span>' : '<span style="color: #64748b; font-size: 11px;">(BEREIT)</span>'}
              </strong>
            </div>
            ${isProducing ? `
              <span id="refinery-total-queue-time" style="font-size: 11.5px; color: #fbbf24; font-weight: 700;">
                Gesamtlaufzeit: ${this.formatRefineryTime(totalQueueMs)}
              </span>
            ` : `
              <span style="font-size: 11px; color: #64748b;">Bereit für Rohstoffe</span>
            `}
          </div>

          <!-- 3 Stationen mit Förderband-Pfeilen -->
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 6px;">

            <!-- 1. STATION: ZUFUHR / EINFÜLL-TRICHTER -->
            <div style="flex: 1; min-width: 0; height: 86px; box-sizing: border-box; background: rgba(30, 41, 59, 0.5); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 10px 12px; display: flex; flex-direction: column; justify-content: space-between;">
              <div style="display: flex; align-items: center; gap: 5px; white-space: nowrap;">
                <span style="color: #38bdf8; flex-shrink: 0;">${icon('container', '', 13)}</span>
                <strong style="font-size: 11px; color: #94a3b8; text-transform: uppercase; white-space: nowrap;">1. Zufuhr</strong>
              </div>
              <div style="font-size: 13px; font-weight: 700; color: #f8fafc; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                ${queue.length > 0 ? `${queue.length} Auftrag${queue.length > 1 ? 'e' : ''}` : 'Trichter leer'}
              </div>
              <div style="font-size: 10.5px; color: #64748b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                ${queue.length === 0 ? 'Erze einwerfen' : (queue.length === 1 ? 'Keine Folgeware' : `+${queue.length - 1} wartend`)}
              </div>
            </div>

            <!-- PFEIL 1 (Förderband zur Maschine) -->
            <div style="display: flex; align-items: center; justify-content: center; flex-shrink: 0; width: 18px;">
              <div class="conveyor-arrow ${isProducing ? 'running' : ''}">▶▶</div>
            </div>

            <!-- 2. STATION: HOCHOFEN & FERTIGUNGS-MASCHINE -->
            <div class="${isProducing ? 'furnace-active' : ''}" style="flex: 1.6; min-width: 0; height: 86px; box-sizing: border-box; background: ${isProducing ? 'rgba(234, 88, 12, 0.1)' : 'rgba(30, 41, 59, 0.4)'}; border: 1px solid ${isProducing ? '#ea580c' : 'rgba(255,255,255,0.08)'}; border-radius: 10px; padding: 10px 12px; display: flex; flex-direction: column; justify-content: space-between;">
              <div style="display: flex; justify-content: space-between; align-items: center; gap: 6px;">
                <div style="display: flex; align-items: center; gap: 5px; white-space: nowrap; min-width: 0;">
                  <span class="${isProducing ? 'flame-anim' : ''}" style="color: ${isProducing ? '#f97316' : '#64748b'}; flex-shrink: 0;">${icon('flame', '', 13)}</span>
                  <strong style="font-size: 11px; color: ${isProducing ? '#fb923c' : '#94a3b8'}; text-transform: uppercase; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">2. Hochofen</strong>
                </div>
                <span id="refinery-current-timer" style="font-size: 11px; font-weight: 700; color: ${isProducing ? '#f8fafc' : '#64748b'}; background: rgba(0,0,0,0.35); padding: 1px 6px; border-radius: 4px; font-variant-numeric: tabular-nums; flex-shrink: 0;">
                  ${isProducing ? this.formatRefineryClock(current.remainingMs) : '00:00'}
                </span>
              </div>

              <div style="display: flex; justify-content: space-between; align-items: center; gap: 6px;">
                <span style="font-size: 12px; font-weight: 700; color: ${isProducing ? '#f8fafc' : '#64748b'}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                  ${isProducing ? current.name : 'Bereit'}
                </span>
                ${isProducing ? `<span style="color: #fbbf24; font-weight: 700; font-size: 11.5px; white-space: nowrap; flex-shrink: 0;">+€${current.value}</span>` : ''}
              </div>

              <div style="width: 100%; height: 12px; background: #090d16; border: 1px solid ${isProducing ? 'rgba(249, 115, 22, 0.4)' : 'rgba(255,255,255,0.08)'}; border-radius: 6px; overflow: hidden; position: relative;">
                <div id="refinery-progress-fill" style="width: ${pct}%; height: 100%; background: linear-gradient(90deg, #ea580c 0%, #f59e0b 100%); transition: width 0.15s linear;"></div>
                <span id="refinery-progress-pct" style="position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); font-size: 8.5px; font-weight: 800; color: #ffffff; text-shadow: 0 1px 2px rgba(0,0,0,0.9); line-height: 1;">${pct}%</span>
              </div>
            </div>

            <!-- PFEIL 2 (Förderband zum Warenausgang) -->
            <div style="display: flex; align-items: center; justify-content: center; flex-shrink: 0; width: 18px;">
              <div class="conveyor-arrow ${isProducing ? 'running' : ''}">▶▶</div>
            </div>

            <!-- 3. STATION: WARENAUSGANG / KÜHLLAGER -->
            <div style="flex: 1; min-width: 0; height: 86px; box-sizing: border-box; background: ${finished.length > 0 ? 'rgba(16, 185, 129, 0.12)' : 'rgba(30, 41, 59, 0.4)'}; border: 1px solid ${finished.length > 0 ? '#10b981' : 'rgba(255,255,255,0.08)'}; border-radius: 10px; padding: 10px 12px; display: flex; flex-direction: column; justify-content: space-between;">
              <div style="display: flex; align-items: center; gap: 5px; white-space: nowrap;">
                <span style="color: ${finished.length > 0 ? '#34d399' : '#64748b'}; flex-shrink: 0;">${icon('check-circle', '', 13)}</span>
                <strong style="font-size: 11px; color: ${finished.length > 0 ? '#34d399' : '#94a3b8'}; text-transform: uppercase; white-space: nowrap;">3. Ausgang</strong>
              </div>
              <div style="font-size: 13px; font-weight: 700; color: ${finished.length > 0 ? '#a7f3d0' : '#64748b'}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                ${finished.length > 0 ? `${finished.length} Fertig` : 'Lager leer'}
              </div>
              <div style="font-size: 10.5px; font-weight: 700; color: ${finished.length > 0 ? '#fbbf24' : '#64748b'}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                ${finished.length > 0 ? `+€${totalGain} Erlös` : '0 Barren'}
              </div>
            </div>

          </div>
        </div>
    `;

    // 3. Fertige Waren (Abholung / Einlagern / Verkauf)
    if (finished.length > 0) {
      const totalGain = finished.reduce((sum, item) => sum + item.value, 0);

      const grouped = {};
      finished.forEach(item => {
        if (!grouped[item.name]) grouped[item.name] = { count: 0, value: 0, isProduct: item.isProduct, productId: item.productId };
        grouped[item.name].count++;
        grouped[item.name].value += item.value;
      });

      const finishedBadges = Object.entries(grouped).map(([name, data]) => `
        <span style="background: rgba(16, 185, 129, 0.2); border: 1px solid rgba(16, 185, 129, 0.5); padding: 3px 8px; border-radius: 6px; font-size: 11.5px; color: #a7f3d0; font-weight: 700;">
          ${data.count}x ${name} (+€${data.value})
        </span>
      `).join('');

      html += `
        <div style="background: rgba(16, 185, 129, 0.12); border: 1px solid rgba(16, 185, 129, 0.45); border-radius: 10px; padding: 12px; display: flex; flex-direction: column; gap: 10px; box-sizing: border-box; width: 100%;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <strong style="color: #34d399; font-size: 13px; display: inline-flex; align-items: center; gap: 6px;">
              ${icon('check-circle', '', 15)}
              Fertiggestellt (${finished.length === 1 ? '1 Einheit' : `${finished.length} Einheiten`})
            </strong>
            <strong style="color: #fbbf24; font-size: 14px; font-variant-numeric: tabular-nums;">+€${totalGain}</strong>
          </div>

          <div style="display: flex; flex-wrap: wrap; gap: 6px;">
            ${finishedBadges}
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; width: 100%; box-sizing: border-box;">
            <button id="btn-transfer-to-storage" class="btn-buy" style="height: 34px; font-size: 11.5px; font-weight: 700; padding: 0 10px; width: 100%; box-sizing: border-box; justify-content: center;">
              ${icon('container', '', 14)}
              <span>Ins Lager</span>
            </button>
            <button id="btn-collect-refined" class="btn-action" style="height: 34px; font-size: 11.5px; font-weight: 700; padding: 0 10px; width: 100%; box-sizing: border-box; justify-content: center;">
              ${icon('coins', '', 14)}
              <span>Verkaufen (+€${totalGain})</span>
            </button>
          </div>
        </div>
      `;
    }

    // 4. INDUSTRIE-FERTIGUNG (Neue Produkte aus Erzen herstellen)
    html += `
      <div style="background: rgba(15, 23, 42, 0.75); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 12px; display: flex; flex-direction: column; gap: 10px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <strong style="color: #38bdf8; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; display: inline-flex; align-items: center; gap: 6px;">
            ${icon('anvil', '', 14)}
            Industrie-Fertigung (Waren für Erzbörse herstellen)
          </strong>
        </div>
        <div style="display: flex; flex-direction: column; gap: 8px;">
    `;

    for (const [prodId, prod] of Object.entries(FACTORY_PRODUCTS)) {
      let canCraft = true;
      const ingBadges = Object.entries(prod.recipe).map(([ore, need]) => {
        const inCargo = cargoCounts[ore] || 0;
        const inDepot = this.depot?.ores?.[ore] || 0;
        const have = inCargo + inDepot;
        if (have < need) canCraft = false;
        const oreName = ORE_DATA[ore]?.name || ore;
        const depotText = inDepot > 0 ? ` (${inCargo}+${inDepot} Depot)` : ` (${have}/${need})`;
        return `<span style="color: ${have >= need ? '#10b981' : '#f87171'}; font-size: 11px; font-weight: 700; background: rgba(0,0,0,0.35); padding: 2px 6px; border-radius: 4px; border: 1px solid ${have >= need ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}; display: inline-flex; align-items: center; gap: 4px;">${oreIcon(ore, 12)} ${need}x ${oreName}${depotText}</span>`;
      }).join(' ');

      html += `
        <div style="background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.06); border-radius: 8px; padding: 8px 10px; display: flex; justify-content: space-between; align-items: center; gap: 10px;">
          <div style="display: flex; flex-direction: column; gap: 3px;">
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="color: #38bdf8;">${icon(prod.iconName, '', 14)}</span>
              <strong style="color: #f8fafc; font-size: 12.5px;">${prod.name}</strong>
              <span style="color: #fbbf24; font-size: 11.5px; font-weight: 700;">+€${prod.value}</span>
              <span style="color: #94a3b8; font-size: 11px;">(${prod.durationSec}s)</span>
            </div>
            <div style="font-size: 11px; color: #94a3b8;">${prod.desc}</div>
            <div style="display: flex; gap: 4px; margin-top: 2px; flex-wrap: wrap;">
              ${ingBadges}
            </div>
          </div>
          <button class="btn-craft-product btn-buy" data-prod="${prodId}" ${canCraft ? '' : 'disabled'} style="height: 32px; padding: 0 12px; font-size: 11px; font-weight: 800; flex-shrink: 0;">
            ${icon('hammer', '', 13)} HERSTELLEN
          </button>
        </div>
      `;
    }

    html += `
        </div>
      </div>
    `;

    // 5. Frachtraum & Depot / Rohstoff-Schmelze
    const totalCargoOres = cargo.length;
    const totalDepotOres = Object.values(this.depot?.ores || {}).reduce((s, v) => s + v, 0);
    const totalAvailableOres = totalCargoOres + totalDepotOres;

    html += `
      <div style="background: rgba(15, 23, 42, 0.75); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 12px; display: flex; flex-direction: column; gap: 10px;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 6px;">
          <strong style="color: #38bdf8; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; display: inline-flex; align-items: center; gap: 6px;">
            ${icon('container', '', 14)}
            Roherz-Schmelzofen (Fracht: ${totalCargoOres}/${this.player.maxCargo} · Depot: ${totalDepotOres})
          </strong>
          <span style="font-size: 11px; color: #94a3b8;">Ofen akzeptiert Erze aus Fracht & Depot</span>
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
        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
          ${totalCargoOres > 0 ? `
            <button id="btn-deposit-all-cargo" class="btn-action" style="flex: 1; height: 32px; font-size: 11px; font-weight: 700; display: inline-flex; align-items: center; justify-content: center; gap: 5px;">
              ${icon('flame', '', 14)}
              <span>ALLE FRACHT-ERZE IN OFEN (${totalCargoOres})</span>
            </button>
          ` : ''}
          ${totalDepotOres > 0 ? `
            <button id="btn-deposit-all-depot" class="btn-buy" style="flex: 1; height: 32px; font-size: 11px; font-weight: 700; display: inline-flex; align-items: center; justify-content: center; gap: 5px;">
              ${icon('warehouse', '', 14)}
              <span>ALLE DEPOT-ERZE IN OFEN (${totalDepotOres})</span>
            </button>
          ` : ''}
        </div>
      `;

      const allOreKeys = Object.keys(ORE_DATA).filter(k => (cargoCounts[k] || 0) > 0 || (this.depot?.ores?.[k] || 0) > 0);

      html += `<div style="display: flex; flex-direction: column; gap: 6px;">`;
      for (const oreKey of allOreKeys) {
        const oreName = ORE_DATA[oreKey]?.name || oreKey;
        const refinedName = getRefinedOreName(oreKey);
        const durSec = REFINERY_DURATIONS_SEC[oreKey] || Math.max(10, Math.round((ORE_DATA[oreKey]?.value || 25) * 0.35));
        const netVal = getRefinedOreNetValue(oreKey);
        const inCargo = cargoCounts[oreKey] || 0;
        const inDepot = this.depot?.ores?.[oreKey] || 0;
        const totalThisOre = inCargo + inDepot;

        html += `
          <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.06); border-radius: 8px; padding: 6px 10px;">
            <div style="display: flex; align-items: center; gap: 6px;">
              ${itemDisplayIcon(oreKey, 16)}
              <div>
                <strong style="color: #f8fafc; font-size: 12.5px;">${oreName} <span style="color: #64748b;">➔</span> <span style="color: #fbbf24;">${refinedName}</span></strong>
                <span style="color: #94a3b8; font-size: 11px; margin-left: 6px;">(${inCargo}x Fracht + ${inDepot}x Depot) · ${durSec}s/Stk · Wert: €${netVal}</span>
              </div>
            </div>
            <div style="display: flex; gap: 6px; align-items: center;">
              <button class="btn-deposit-one btn-3d-secondary" data-ore="${oreKey}" style="height: 32px; padding: 0 10px; font-size: 11px; font-weight: 700; border-radius: 8px;">+1 in Ofen</button>
              <button class="btn-deposit-all-type btn-action" data-ore="${oreKey}" style="height: 32px; padding: 0 10px; font-size: 11px; font-weight: 700; border-radius: 8px;">Alle (${totalThisOre})</button>
            </div>
          </div>
        `;
      }
      html += `</div>`;
    }

    html += `
        <div style="display: flex; justify-content: flex-end; margin-top: 14px;">
          <button id="btn-refinery-close" class="btn-3d-secondary" style="height: 32px; font-size: 11.5px; font-weight: 700; padding: 0 16px;">
            SCHLIESSEN
          </button>
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

    const btnDepositAll = document.getElementById('btn-deposit-all-cargo');
    if (btnDepositAll) {
      btnDepositAll.onclick = () => {
        this.depositAllCargoToRefinery();
      };
    }

    const btnDepositAllDepot = document.getElementById('btn-deposit-all-depot');
    if (btnDepositAllDepot) {
      btnDepositAllDepot.onclick = () => {
        this.depositAllDepotToRefinery();
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

    const btnRefineryClose = document.getElementById('btn-refinery-close');
    if (btnRefineryClose) {
      btnRefineryClose.onclick = () => {
        soundFx.playClick();
        this.closeModal();
      };
    }
  }

  craftFactoryProduct(productId) {
    const prod = FACTORY_PRODUCTS[productId];
    if (!prod) return;

    // Check cargo + depot requirements
    const cargoCounts = {};
    this.player.cargo.forEach(ore => {
      cargoCounts[ore] = (cargoCounts[ore] || 0) + 1;
    });

    for (const [ore, needed] of Object.entries(prod.recipe)) {
      const inCargo = cargoCounts[ore] || 0;
      const inDepot = this.depot?.ores?.[ore] || 0;
      if (inCargo + inDepot < needed) {
        this.scene.events.emit('notify', `Nicht genug ${ORE_DATA[ore]?.name || ore} (Fracht & Depot)!`);
        return;
      }
    }

    // Deduct ores: first from cargo, then remaining from depot
    for (const [ore, needed] of Object.entries(prod.recipe)) {
      const inCargo = cargoCounts[ore] || 0;
      const fromCargo = Math.min(inCargo, needed);
      const fromDepot = needed - fromCargo;

      if (fromCargo > 0) {
        this.player.consumeOre(ore, fromCargo);
      }
      if (fromDepot > 0 && this.depot?.ores?.[ore]) {
        this.depot.ores[ore] = Math.max(0, this.depot.ores[ore] - fromDepot);
      }
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
    if (this.refinery.finished.length === 0) return;
    if (!this.player.factoryProducts) this.player.factoryProducts = {};
    if (!this.depot) {
      this.depot = { ores: {}, products: {}, capacity: 150, tier: 1, currentTab: 'ores' };
    }
    if (!this.depot.ores) this.depot.ores = {};
    if (!this.depot.products) this.depot.products = {};

    let prodTransferred = 0;
    let oreTransferred = 0;
    let oreCashGained = 0;

    const depotCap = this.depot.capacity || 150;
    let currentDepotCount = this.getDepotTotalCount();

    this.refinery.finished.forEach(item => {
      if (item.isProduct && item.productId) {
        if (currentDepotCount < depotCap) {
          this.depot.products[item.productId] = (this.depot.products[item.productId] || 0) + 1;
          currentDepotCount++;
        } else {
          this.player.factoryProducts[item.productId] = (this.player.factoryProducts[item.productId] || 0) + 1;
        }
        prodTransferred++;
      } else if (item.ore) {
        const barKey = 'bar_' + item.ore;
        if (currentDepotCount < depotCap) {
          this.depot.products[barKey] = (this.depot.products[barKey] || 0) + 1;
          currentDepotCount++;
          oreTransferred++;
        } else {
          this.player.factoryProducts[barKey] = (this.player.factoryProducts[barKey] || 0) + 1;
          oreTransferred++;
        }
      } else {
        this.player.cash += item.value;
        oreCashGained += item.value;
      }
    });

    const totalCount = this.refinery.finished.length;
    this.refinery.finished = [];
    soundFx.playPurchase();
    this.renderRefineryModalBody();
    if (this.scene.hud) this.scene.hud.update();

    let msg = '';
    if (oreTransferred > 0 && prodTransferred > 0) {
      msg = `📦 ${oreTransferred}x Barren/Briketts & ${prodTransferred}x Waren sicher ins Depot eingelagert!`;
    } else if (oreTransferred > 0) {
      msg = `📦 ${oreTransferred}x veredelte Barren/Briketts sicher ins Depot eingelagert!`;
    } else if (prodTransferred > 0) {
      msg = `📦 ${prodTransferred}x Fabrik-Waren sicher ins Depot eingelagert!`;
    } else if (oreCashGained > 0) {
      msg = `Lager voll: Barren für +€${oreCashGained} verkauft!`;
    }
    this.scene.events.emit('notify', msg);
  }

  depositOreToRefinery(oreKey, count = 1) {
    let moved = 0;
    // 1. Zuerst aus Frachtraum
    for (let i = this.player.cargo.length - 1; i >= 0 && moved < count; i--) {
      if (this.player.cargo[i] === oreKey) {
        this.player.cargo.splice(i, 1);
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
        moved++;
      }
    }

    // 2. Falls noch nötig: aus Depot entnehmen
    if (moved < count && this.depot?.ores?.[oreKey] > 0) {
      const takeFromDepot = Math.min(count - moved, this.depot.ores[oreKey]);
      this.depot.ores[oreKey] -= takeFromDepot;
      for (let k = 0; k < takeFromDepot; k++) {
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
        moved++;
      }
    }

    if (moved > 0) {
      soundFx.playFurnace();
      this.renderRefineryModalBody();
      if (this.scene.hud) this.scene.hud.update();
      this.scene.events.emit('notify', `${moved}x ${ORE_DATA[oreKey]?.name || oreKey} wird zu ${getRefinedOreName(oreKey)} veredelt.`);
    }
  }

  depositAllCargoToRefinery() {
    const total = this.player.cargo.length;
    if (total === 0) return;

    this.player.cargo.forEach(oreKey => {
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
    });

    this.player.cargo = [];
    soundFx.playFurnace();
    this.renderRefineryModalBody();
    if (this.scene.hud) this.scene.hud.update();
    this.scene.events.emit('notify', `${total} Erze aus dem Frachtraum in den Schmelzofen gegeben!`);
  }

  depositAllDepotToRefinery() {
    if (!this.depot?.ores) return;
    let count = 0;
    for (const [oreKey, qty] of Object.entries(this.depot.ores)) {
      if (qty > 0) {
        for (let i = 0; i < qty; i++) {
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
          count++;
        }
        this.depot.ores[oreKey] = 0;
      }
    }

    if (count > 0) {
      soundFx.playFurnace();
      this.renderRefineryModalBody();
      if (this.scene.hud) this.scene.hud.update();
      this.scene.events.emit('notify', `📦 ${count} Erze aus dem Depot in den Schmelzofen gegeben!`);
    } else {
      this.scene.events.emit('notify', 'Keine Erze im Depot vorhanden.');
    }
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
