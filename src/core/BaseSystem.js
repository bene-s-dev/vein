/**
 * BaseSystem.js
 * Verwaltet die Oberflächen-Gebäude (Hangar, Erzbörse, Raffinerie, Tech-Labor),
 * den Steinsammler-NPC (Auftraggeber für Upgrade-Bauteile),
 * kaufbare Neubauten (Drohnen-Hangar, Quanten-Teleporter, Geothermie-Kraftwerk)
 * und das erweiterte Tech-Upgrade-System.
 */

import { TILE_SIZE, ORE_DATA } from './GridSystem.js';
import { soundFx } from './SoundEffects.js';
import { icon, refreshIcons, COMPONENT_ICONS, oreIcon, ORE_COLORS } from '../ui/IconHelper.js';
import { BATTERY_TIERS } from './Player.js';

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
        id: 'office',
        title: 'BÜRO',
        label: 'BÜRO',
        iconName: 'briefcase',
        spriteKey: 'building_office',
        gx: 1,
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
        gx: 7,
        height: 68,
        action: () => this.openMarketModal()
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
      },
      {
        id: 'lab',
        title: 'LABOR',
        label: 'LABOR',
        iconName: 'microscope',
        spriteKey: 'building_lab',
        gx: 33,
        height: 72,
        action: () => this.openLabModal()
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
        gx: -4,
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
        gx: 41,
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
        gx: 49,
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
    this.sammlerSpawnX = 36 * TILE_SIZE; // Kommt von rechts gelaufen
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

      // Verhindert das Durchklicken auf den Phaser-Canvas hinter dem Modal
      const stopPropagation = (e) => {
        e.stopPropagation();
      };
      ['pointerdown', 'pointerup', 'mousedown', 'mouseup', 'click', 'touchstart', 'touchend'].forEach((evt) => {
        this.modalEl.addEventListener(evt, stopPropagation);
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
    if (this.refineryUiInterval) {
      clearInterval(this.refineryUiInterval);
      this.refineryUiInterval = null;
    }
    if (this.modalEl) {
      this.modalEl.style.display = 'none';
    }
    if (this.scene) {
      this.scene.isPaused = false;
    }
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
      for (const [prodId, prodData] of Object.entries(FACTORY_PRODUCTS)) {
        const count = fp[prodId] || 0;
        if (count <= 0) continue;
        const val = prodData.value;
        const subtotal = count * val;
        totalFpValue += subtotal;

        fpListHtml += `
          <div class="market-fp-card" data-prod="${prodId}" style="background: #141c2b; padding: 10px 14px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.07); display: flex; flex-direction: column; gap: 8px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="display: inline-flex; align-items: center; justify-content: center; width: 26px; height: 26px; background: rgba(56,189,248,0.15); border-radius: 6px; color: #38bdf8;">
                  ${icon(prodData.iconName, '', 15)}
                </span>
                <span style="font-weight: 700; color: #f8fafc; font-size: 13.5px;">${prodData.name}</span>
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

    const content = `
      <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 8px;">
        <span style="font-size: 13px; color: var(--text-muted);">Frachtraum: <strong>${cargo.length} / ${this.player.maxCargo}</strong> Erzen</span>
        <strong style="color: #fbbf24; font-size: 14px;">Gesamtwert: €${totalValue}</strong>
      </div>
      ${oreListHtml}
      <button id="btn-do-sell" class="btn-buy btn-lg" style="width: 100%; margin-top: 8px;" ${cargo.length === 0 ? 'disabled' : ''}>
        ${icon('coins', '', 15)} GESAMTE ROHERZ-FRACHT VERKAUFEN (+€${totalValue})
      </button>
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
      subtotalEl.innerText = `+€${clamped * val}`;
      if (btnSellText) btnSellText.innerText = `${clamped}x Verkaufen`;
    };

    // Stepper Plus/Minus
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

    // Quick Buttons (1x, Alle)
    const quickBtns = document.querySelectorAll('.btn-qty-quick');
    quickBtns.forEach((btn) => {
      btn.onclick = () => {
        const ore = btn.getAttribute('data-ore');
        const setVal = parseInt(btn.getAttribute('data-set'), 10) || 1;
        updateOreQty(ore, setVal);
      };
    });

    // Direkte Tastatureingabe im Number-Input
    const qtyInputs = document.querySelectorAll('.input-ore-qty');
    qtyInputs.forEach((input) => {
      input.oninput = () => {
        const ore = input.getAttribute('data-ore');
        updateOreQty(ore, input.value);
      };
    });

    // Individueller Verkauf mit gewählter Stückzahl (Erze)
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

    // Einzelverkauf Fabrik-Produkt
    document.querySelectorAll('.btn-sell-fp-custom').forEach(btn => {
      btn.onclick = () => {
        const prodId = btn.getAttribute('data-prod');
        const input = document.getElementById(`qty-input-fp-${prodId}`);
        const qty = input ? parseInt(input.value, 10) || 1 : 1;
        const earned = this.player.sellFactoryProduct(prodId, qty);
        if (earned > 0) {
          soundFx.playPurchase();
          this.openMarketModal();
          this.scene.events.emit('notify', `${qty}x ${FACTORY_PRODUCTS[prodId]?.name || prodId} verkauft für +€${earned}!`);
        }
      };
    });

    // Gesamtverkauf aller Fabrik-Waren
    const btnSellAllFp = document.getElementById('btn-sell-all-fp');
    if (btnSellAllFp) {
      btnSellAllFp.onclick = () => {
        let totalEarned = 0;
        for (const [prodId, prodData] of Object.entries(FACTORY_PRODUCTS)) {
          const qty = this.player.factoryProducts?.[prodId] || 0;
          if (qty > 0) {
            totalEarned += this.player.sellFactoryProduct(prodId, qty);
          }
        }
        if (totalEarned > 0) {
          soundFx.playPurchase();
          this.openMarketModal();
          this.scene.events.emit('notify', `Alle Fabrik-Waren verkauft für +€${totalEarned}!`);
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

    // Cargo nach Erzen zählen
    const cargoCounts = {};
    p.cargo.forEach((ore) => {
      cargoCounts[ore] = (cargoCounts[ore] || 0) + 1;
    });

    let questsHtml = '<div style="display: flex; flex-direction: column; gap: 10px; margin: 12px 0; max-height: 280px; overflow-y: auto; padding-right: 4px;">';

    quests.forEach((q) => {
      let canFulfill = true;
      let reqsText = [];
      for (const [ore, needed] of Object.entries(q.reqs)) {
        const have = cargoCounts[ore] || 0;
        const oreName = ORE_DATA[ore]?.name || ore;
        if (have < needed) canFulfill = false;
        reqsText.push(`<span style="color: ${have >= needed ? '#10b981' : '#f87171'}; font-weight: 600;">${oreName}: ${have}/${needed}</span>`);
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
        "Hallo Kollege! Ich analysiere geologische Besonderheiten im Gestein. Bring mir die gesuchten Erzproben, und ich überlasse dir wertvolle Spezial-Bauteile für deine Tech-Upgrades und Bauprojekte!"
      </p>
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

        // Erze aus Frachtraum entfernen
        for (const [ore, needed] of Object.entries(q.reqs)) {
          p.sellSpecificOre(ore, needed);
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
        id: 'battery',
        title: 'AKKUSYSTEME / LADESPEED',
        iconName: 'zap',
        currentTier: p.batteryTier || 1,
        maxTier: 8,
        tiers: BATTERY_TIERS,
        apply: (tier) => {
          p.batteryTier = tier;
        }
      },
      {
        id: 'tank',
        title: 'TREIBSTOFF',
        iconName: 'fuel',
        currentTier: p.tankTier || 1,
        maxTier: 8,
        tiers: [
          { tier: 1, name: 'Standard-Tank', stat: '100 Liter', cost: 0, comp: null, level: 1, desc: 'Basis-Treibstofftank für kurze Bohrgänge.' },
          { tier: 2, name: 'Kerosin-Tank Mk.II', stat: '135 Liter (+35L)', cost: 180, comp: null, level: 1, desc: 'Erhöht Treibstoff auf 135 Liter und senkt Verbrauch um 12%.' },
          { tier: 3, name: 'Spartriebwerk Mk.III', stat: '180 Liter (+45L)', cost: 420, comp: null, level: 1, desc: 'Erhöht Treibstoff auf 180 Liter und spart 20% Kerosin.' },
          { tier: 4, name: 'Dual-Injektor Mk.IV', stat: '240 Liter (+60L)', cost: 950, comp: { key: 'hydraulic_part', name: 'Hydraulik-Zylinder', count: 1 }, level: 2, desc: 'Verbessert Steigflug-Effizienz mit Hochdruck-Injektoren.' },
          { tier: 5, name: 'Kompressions-Tank Mk.V', stat: '320 Liter (+80L)', cost: 2000, comp: { key: 'titan_alloy', name: 'Titan-Legierung', count: 1 }, level: 2, desc: 'Hochfeste Legierung erlaubt 320 Liter Treibstoffkapazität.' },
          { tier: 6, name: 'Turbo-Booster Mk.VI', stat: '420 Liter (+100L)', cost: 4200, comp: { key: 'titan_alloy', name: 'Titan-Legierung', count: 2 }, level: 3, desc: 'Großer 420L Tank für tiefe Expeditionen.' },
          { tier: 7, name: 'Fusions-Generator Mk.VII', stat: '540 Liter (+120L)', cost: 8800, comp: { key: 'laser_lens', name: 'Kristall-Fokuslinse', count: 2 }, level: 4, desc: 'Hocheffizienter Fusions-Antrieb mit 540 Litern Kapazität.' },
          { tier: 8, name: 'Quanten-Ionen-Antrieb', stat: '700 Liter (+160L)', cost: 17500, comp: { key: 'quantum_chip', name: 'Quanten-Steuerkern', count: 2 }, level: 5, desc: 'Ultimativer 700L Quantenantrieb mit extrem sparsamen Düsen.' }
        ],
        apply: (tier) => {
          p.tankTier = tier;
          const fuels = [100, 135, 180, 240, 320, 420, 540, 700];
          const effs = [1.0, 1.12, 1.20, 1.28, 1.35, 1.42, 1.50, 1.60];
          p.maxFuel = fuels[tier - 1];
          p.fuel = p.maxFuel;
          p.fuelEfficiency = effs[tier - 1];
        }
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
        title: 'ANTRIEB & FLUG',
        iconName: 'zap',
        currentTier: p.engineTier || 1,
        maxTier: 8,
        tiers: [
          { tier: 1, name: 'Standard-Raupenfahrwerk', stat: '260ms / 120 px/s', cost: 0, comp: null, level: 1, desc: 'Sicheres Basis-Fahrwerk für solide Schachtmanöver.' },
          { tier: 2, name: 'Verstärkte Getriebe Mk.II', stat: '160ms / 145 px/s (+18%)', cost: 190, comp: null, level: 1, desc: 'Kürzere Schaltzeiten beschleunigen Kriechgang und Steigflug.' },
          { tier: 3, name: 'Hydraulik-Raupen Mk.III', stat: '142ms / 175 px/s (+22%)', cost: 440, comp: null, level: 1, desc: 'Flüssigere Kettenbewegungen und mehr Schubdüsengeschwindigkeit.' },
          { tier: 4, name: 'Hochdruck-Turbine Mk.IV', stat: '126ms / 210 px/s (+25%)', cost: 980, comp: { key: 'hydraulic_part', name: 'Hydraulik-Zylinder', count: 1 }, level: 2, desc: 'Kraftvoller Vortrieb im Schacht und schnellerer Aufstieg.' },
          { tier: 5, name: 'Titan-Kettenantrieb Mk.V', stat: '112ms / 245 px/s (+25%)', cost: 2100, comp: { key: 'titan_alloy', name: 'Titan-Legierung', count: 1 }, level: 2, desc: 'Geringerer Rollwiderstand und kräftige Schwebetriebwerke.' },
          { tier: 6, name: 'Vektor-Booster Mk.VI', stat: '98ms / 280 px/s (+25%)', cost: 4300, comp: { key: 'titan_alloy', name: 'Titan-Legierung', count: 2 }, level: 3, desc: 'Schnelle Manövrierfähigkeit im Gestein und hoher Schwebespeed.' },
          { tier: 7, name: 'Magnet-Levitation Mk.VII', stat: '87ms / 310 px/s (+20%)', cost: 8900, comp: { key: 'laser_lens', name: 'Kristall-Fokuslinse', count: 2 }, level: 4, desc: 'Magnetschwebende Fahrwerkssegmente für rasantes Gleiten.' },
          { tier: 8, name: 'Quanten-Gravitationsantrieb', stat: '78ms / 340 px/s (+18%)', cost: 18000, comp: { key: 'quantum_chip', name: 'Quanten-Steuerkern', count: 2 }, level: 5, desc: 'Krümmt das Schwerefeld für blitzschnelle Fortbewegung.' }
        ],
        apply: (tier) => {
          p.upgradeEngine(tier);
        }
      },
      {
        id: 'cargo',
        title: 'FRACHTRAUM',
        iconName: 'container',
        currentTier: p.cargoTier || 1,
        maxTier: 8,
        tiers: [
          { tier: 1, name: 'Standard-Ladebucht', stat: '10 Erze', cost: 0, comp: null, level: 1, desc: 'Kompakter Laderaum für die ersten Bergbau-Expeditionen.' },
          { tier: 2, name: 'Erweiterte Frachtbucht', stat: '14 Erze (+4)', cost: 170, comp: null, level: 1, desc: 'Erweitert Ladeplätze auf 14 Erze für lukrativere Tauchgänge.' },
          { tier: 3, name: 'Titan-Containermodul Mk.III', stat: '20 Erze (+6)', cost: 400, comp: null, level: 1, desc: 'Großzügiger Frachtraum für 20 Erze.' },
          { tier: 4, name: 'Struktur-Laderaum Mk.IV', stat: '28 Erze (+8)', cost: 900, comp: { key: 'hydraulic_part', name: 'Hydraulik-Zylinder', count: 1 }, level: 2, desc: 'Hydraulische Ladeklappen bieten Platz für 28 Erze.' },
          { tier: 5, name: 'Molekular-Kompressor Mk.V', stat: '38 Erze (+10)', cost: 1900, comp: { key: 'titan_alloy', name: 'Titan-Legierung', count: 1 }, level: 2, desc: 'Hohe Packdichte erlaubt den Transport von 38 Erzen.' },
          { tier: 6, name: 'Subraum-Boxen Mk.VI', stat: '50 Erze (+12)', cost: 3900, comp: { key: 'titan_alloy', name: 'Titan-Legierung', count: 2 }, level: 3, desc: 'Transportiert bis zu 50 Erze auf einen Schlag.' },
          { tier: 7, name: 'Tiefsee-Depot Mk.VII', stat: '65 Erze (+15)', cost: 8200, comp: { key: 'laser_lens', name: 'Kristall-Fokuslinse', count: 2 }, level: 4, desc: 'Riesige Kapazität von 65 Plätzen für Edelsteine.' },
          { tier: 8, name: 'Quanten-Frachtdepot Mk.VIII', stat: '80 Erze (+15)', cost: 16500, comp: { key: 'quantum_chip', name: 'Quanten-Steuerkern', count: 2 }, level: 5, desc: 'Gigantischer 80-Plätze-Frachtraum für maximale Gewinne.' }
        ],
        apply: (tier) => {
          p.cargoTier = tier;
          const caps = [10, 14, 20, 28, 38, 50, 65, 80];
          p.maxCargo = caps[tier - 1];
        }
      },
      {
        id: 'sensor',
        title: 'GEO-SENSOR',
        iconName: 'radio',
        currentTier: p.sensorTier || 1,
        maxTier: 8,
        tiers: [
          { tier: 1, name: 'Basis-Sonar', stat: '1.8 Kacheln', cost: 0, comp: null, level: 1, desc: 'Kompakter Sensor zur Erkennung naher Erzadern.' },
          { tier: 2, name: 'Geo-Scanner Mk.II', stat: '2.4 Kacheln (+0.6)', cost: 140, comp: null, level: 1, desc: 'Vergrößert den kreisrunden Scan-Umkreis spürbar.' },
          { tier: 3, name: 'Puls-Sonar Mk.III', stat: '3.0 Kacheln (+0.6)', cost: 340, comp: null, level: 1, desc: 'Erweitert den Erfassungsbereich auf 3.0 Kacheln.' },
          { tier: 4, name: 'Spektral-Radar Mk.IV', stat: '3.7 Kacheln (+0.7)', cost: 780, comp: { key: 'hydraulic_part', name: 'Hydraulik-Zylinder', count: 1 }, level: 2, desc: 'Schwenkbarer Pylon deckt Erze in 3.7 Kacheln Umkreis auf.' },
          { tier: 5, name: 'Tiefen-Sensor Mk.V', stat: '4.5 Kacheln (+0.8)', cost: 1650, comp: { key: 'laser_lens', name: 'Kristall-Fokuslinse', count: 1 }, level: 2, desc: 'Optische Linse durchdringt dicke Gesteinsschichten bis 4.5 Kacheln.' },
          { tier: 6, name: 'Sub-Terra-Scan Mk.VI', stat: '5.4 Kacheln (+0.9)', cost: 3400, comp: { key: 'laser_lens', name: 'Kristall-Fokuslinse', count: 2 }, level: 3, desc: 'Großer Scanradius von 5.4 Kacheln für seltene Adern.' },
          { tier: 7, name: 'Graviton-Array Mk.VII', stat: '6.4 Kacheln (+1.0)', cost: 7200, comp: { key: 'quantum_chip', name: 'Quanten-Steuerkern', count: 1 }, level: 4, desc: 'Erfasst 6.4 Kacheln im Umkreis auf einen Blick.' },
          { tier: 8, name: 'Quanten-Resonator Mk.VIII', stat: '7.5 Kacheln (+1.1)', cost: 15200, comp: { key: 'quantum_chip', name: 'Quanten-Steuerkern', count: 2 }, level: 5, desc: 'Elite-Scanbereich von 7.5 Kacheln erhellt riesige Höhlen.' }
        ],
        apply: (tier) => {
          p.sensorTier = tier;
          const radii = [1.8, 2.4, 3.0, 3.7, 4.5, 5.4, 6.4, 7.5];
          p.upgradeSensor(tier, radii[tier - 1]);
        }
      },
      {
        id: 'hull',
        title: 'PANZERUNG',
        iconName: 'shield-cog',
        currentTier: p.hullTier || 1,
        maxTier: 8,
        tiers: [
          { tier: 1, name: 'Leichtmetall-Rumpf', stat: '100 HP', cost: 0, comp: null, level: 1, desc: 'Basis-Struktur für normale Bohrungen.' },
          { tier: 2, name: 'Kevlar-Verbundpanzer Mk.II', stat: '140 HP (+40)', cost: 140, comp: null, level: 1, desc: 'Schützt vor Erschütterungen und erhöht HP auf 140.' },
          { tier: 3, name: 'Gehärteter Rumpf Mk.III', stat: '190 HP (+50)', cost: 330, comp: null, level: 1, desc: 'Robuste Panzerung mit 190 HP für mittlere Tiefen.' },
          { tier: 4, name: 'Titan-Panzerung Mk.IV', stat: '260 HP (+70)', cost: 790, comp: { key: 'titan_alloy', name: 'Titan-Legierung', count: 1 }, level: 2, desc: 'Widersteht hohem Druck in 260 HP Integrität.' },
          { tier: 5, name: 'Magma-Hitzeschild Mk.V', stat: '350 HP (+90)', cost: 1700, comp: { key: 'titan_alloy', name: 'Titan-Legierung', count: 2 }, level: 2, desc: 'Schützt vor extremen Temperaturen (350 HP).' },
          { tier: 6, name: 'Schwere Verbundpanzerung Mk.VI', stat: '470 HP (+120)', cost: 3400, comp: { key: 'laser_lens', name: 'Kristall-Fokuslinse', count: 1 }, level: 3, desc: 'Extrem widerstandsfähige 470 HP Panzerung.' },
          { tier: 7, name: 'Kraftfeld-Generator Mk.VII', stat: '620 HP (+150)', cost: 7300, comp: { key: 'quantum_chip', name: 'Quanten-Steuerkern', count: 1 }, level: 4, desc: 'Aktives Energieschild stärkt den Rumpf auf 620 HP.' },
          { tier: 8, name: 'Nanit-Matrix Mk.VIII', stat: '800 HP (+180)', cost: 15500, comp: { key: 'quantum_chip', name: 'Quanten-Steuerkern', count: 2 }, level: 5, desc: 'Spitzentechnologie mit 800 HP Naniten-Integrität.' }
        ],
        apply: (tier) => {
          p.hullTier = tier;
          const hulls = [100, 140, 190, 260, 350, 470, 620, 800];
          const prevMax = p.maxHull;
          p.maxHull = hulls[tier - 1];
          p.hull += (p.maxHull - prevMax);
        }
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

    // Akkusystem & Tankspeed (verschiedene Akkutypen für den Bohrer)
    const curBattery = this.player.getBatteryData ? this.player.getBatteryData() : BATTERY_TIERS[0];
    const curBatTier = this.player.batteryTier || 1;
    const canUpgradeBattery = curBatTier < BATTERY_TIERS.length;
    const nextBattery = canUpgradeBattery ? BATTERY_TIERS[curBatTier] : null;

    let batCompAvailable = true;
    if (nextBattery && nextBattery.comp) {
      const have = this.player.components[nextBattery.comp.key] || 0;
      if (have < nextBattery.comp.count) batCompAvailable = false;
    }
    const canAffordBattery = nextBattery && this.player.cash >= nextBattery.cost && batCompAvailable && this.player.level >= nextBattery.level;

    const batterySection = `
      <div style="background: rgba(15, 23, 42, 0.75); border: 1px solid rgba(255,255,255,0.08); padding: 12px 14px; border-radius: 10px; display: flex; flex-direction: column; gap: 8px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <strong style="display: inline-flex; align-items: center; gap: 6px; font-size: 13px; color: #f8fafc;">
              ${icon('zap', '', 14)} Akkusystem & Ladeelektronik
            </strong>
            <div style="font-size: 11.5px; color: #94a3b8; margin-top: 2px;">
              Akkutyp: <strong style="color: #38bdf8;">${curBattery.name} (${curBattery.stat})</strong>
            </div>
          </div>
          ${canUpgradeBattery ? `
            <button id="btn-upgrade-battery-dock" class="btn-buy" style="height: 32px; padding: 0 14px; font-size: 11.5px; font-weight: 800;" ${canAffordBattery ? '' : 'disabled'}>
              ${icon('zap', '', 13)} UPGRADE: €${nextBattery.cost}
            </button>
          ` : `
            <span style="font-size: 11px; color: #10b981; font-weight: 700; background: rgba(16,185,129,0.15); border: 1px solid rgba(16,185,129,0.3); padding: 4px 8px; border-radius: 6px;">
              MAXIMALER AKKU
            </span>
          `}
        </div>
        ${canUpgradeBattery ? `
          <div style="font-size: 11.5px; color: #94a3b8;">
            Nächste Stufe: <strong style="color: #f8fafc;">${nextBattery.name}</strong> (${nextBattery.stat})
            ${nextBattery.comp ? ` &bull; <span style="color: ${batCompAvailable ? '#38bdf8' : '#f87171'};">${nextBattery.comp.count}x ${nextBattery.comp.name}</span>` : ''}
            ${this.player.level < nextBattery.level ? ` &bull; <span style="color: #f87171;">Ab Level ${nextBattery.level}</span>` : ''}
          </div>
        ` : `
          <div style="font-size: 11px; color: #10b981;">
            Höchste Ladegeschwindigkeit am Hangar erreicht.
          </div>
        `}
      </div>
    `;

    // Bohrkopf-Montage / Werkstatt
    const curTier = this.player.drillTier || 1;
    const resTier = this.player.researchedDrillTier || curTier;
    const curDrillData = DRILL_DATA[curTier - 1] || DRILL_DATA[0];
    const canMount = resTier > curTier;
    const nextDrillData = canMount ? (DRILL_DATA[resTier - 1] || DRILL_DATA[0]) : null;

    const drillSection = `
      <div style="background: rgba(15, 23, 42, 0.75); border: 1px solid rgba(255,255,255,0.08); padding: 12px 14px; border-radius: 10px; display: flex; flex-direction: column; gap: 8px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <strong style="display: inline-flex; align-items: center; gap: 6px; font-size: 13px; color: #f8fafc;">
              ${icon('pickaxe', '', 14)} Bohrkopf-Werkstatt
            </strong>
            <div style="font-size: 11.5px; color: #94a3b8; margin-top: 2px;">
              Montiert: <strong style="color: #38bdf8;">${curDrillData.name} (${curDrillData.stat})</strong>
            </div>
          </div>
          ${canMount ? `
            <button id="btn-mount-drill" class="btn-buy" style="height: 32px; padding: 0 14px; font-size: 11.5px; font-weight: 800;">
              ${icon('wrench', '', 13)} BOHRKOPF MONTIEREN
            </button>
          ` : `
            <span style="font-size: 11px; color: #10b981; font-weight: 700; background: rgba(16,185,129,0.15); border: 1px solid rgba(16,185,129,0.3); padding: 4px 8px; border-radius: 6px;">
              AKTUELLSTE STUFE
            </span>
          `}
        </div>
        ${canMount ? `
          <div style="font-size: 11.5px; color: #fbbf24; background: rgba(251,191,36,0.1); border: 1px solid rgba(251,191,36,0.25); padding: 6px 10px; border-radius: 6px;">
            Erforschter Bauplan verfügbar: <strong>${nextDrillData.name} (${nextDrillData.stat})</strong> steht im Hangar zum Einbau bereit!
          </div>
        ` : `
          <div style="font-size: 11px; color: #94a3b8;">
            Neue Bohrkopf-Baupläne müssen zuerst im <strong>LABOR</strong> entwickelt werden.
          </div>
        `}
      </div>
    `;

    const content = `
      <div style="display: flex; flex-direction: column; gap: 12px;">
        <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(15, 23, 42, 0.75); border: 1px solid rgba(255,255,255,0.08); padding: 10px 14px; border-radius: 10px;">
          <div>
            <strong style="display: inline-flex; align-items: center; gap: 5px;">${icon('fuel', '', 14)} Tank aufladen</strong>
            <div style="font-size: 12px; color: #94a3b8;">Status: ${Math.round(this.player.fuel)} / ${this.player.maxFuel} L &bull; Tankspeed: <span style="color: #38bdf8; font-weight: 600;">${curBattery.chargeSpeed.toFixed(1)} L/s</span></div>
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

        ${batterySection}

        ${drillSection}

        ${sammlerInfo}

        <div style="font-size: 11px; color: #10b981;">
          Tipp: Am Hangar schließt das Betankungskabel automatisch an und lädt deinen Akku kostenlos auf.
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

    const btnUpgradeBattery = document.getElementById('btn-upgrade-battery-dock');
    if (btnUpgradeBattery && canUpgradeBattery && nextBattery) {
      btnUpgradeBattery.onclick = () => {
        if (!canAffordBattery) return;
        this.player.cash -= nextBattery.cost;
        if (nextBattery.comp) {
          this.player.components[nextBattery.comp.key] = (this.player.components[nextBattery.comp.key] || 0) - nextBattery.comp.count;
        }
        this.player.batteryTier = curBatTier + 1;
        soundFx.playUpgrade();
        this.scene.events.emit('notify', `Neuer Akkutyp installiert: ${nextBattery.name}! Tankspeed: ${nextBattery.chargeSpeed} L/s`);
        this.openDockModal();
      };
    }

    const btnMountDrill = document.getElementById('btn-mount-drill');
    if (btnMountDrill && nextDrillData) {
      btnMountDrill.onclick = () => {
        this.player.drillTier = resTier;
        this.player.drillPower = DRILL_DPS[resTier - 1];
        soundFx.playUpgrade();
        this.openDockModal();
        this.scene.events.emit('notify', `${nextDrillData.name} erfolgreich montiert!`);
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
        const have = cargoCounts[ore] || 0;
        if (have < need) canCraft = false;
        const oreName = ORE_DATA[ore]?.name || ore;
        return `<span style="color: ${have >= need ? '#10b981' : '#f87171'}; font-size: 11px; font-weight: 700; background: rgba(0,0,0,0.35); padding: 2px 6px; border-radius: 4px; border: 1px solid ${have >= need ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}; display: inline-flex; align-items: center; gap: 4px;">${oreIcon(ore, 12)} ${need}x ${oreName} (${have}/${need})</span>`;
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

    // 5. Frachtraum / Rohstoff-Schmelze
    html += `
      <div style="background: rgba(15, 23, 42, 0.75); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 12px; display: flex; flex-direction: column; gap: 10px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <strong style="color: #38bdf8; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; display: inline-flex; align-items: center; gap: 6px;">
            ${icon('container', '', 14)}
            Roherz-Schmelzofen (Frachtraum: ${cargo.length}/${this.player.maxCargo} Erze)
          </strong>
        </div>
    `;

    if (cargo.length === 0) {
      html += `
        <div style="color: #64748b; font-size: 12px; text-align: center; padding: 10px 0;">
          Dein Frachtraum ist aktuell leer. Baue unter Tage Erze ab, um sie hier einzuschmelzen.
        </div>
      `;
    } else {
      // Button: Alle Erze in den Ofen geben
      html += `
        <button id="btn-deposit-all-cargo" class="btn-action btn-lg" style="width: 100%;">
          ${icon('flame', '', 15)}
          <span>ALLE ${cargo.length} ERZE IN DEN SCHMELZOFEN GEBEN</span>
        </button>
      `;

      html += `<div style="display: flex; flex-direction: column; gap: 6px;">`;
      for (const [oreKey, count] of Object.entries(cargoCounts)) {
        const oreName = ORE_DATA[oreKey]?.name || oreKey;
        const durSec = REFINERY_DURATIONS_SEC[oreKey] || Math.max(10, Math.round((ORE_DATA[oreKey]?.value || 25) * 0.35));
        const netVal = getRefinedOreNetValue(oreKey);

        html += `
          <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.06); border-radius: 8px; padding: 6px 10px;">
            <div style="display: flex; align-items: center; gap: 6px;">
              ${oreIcon(oreKey, 14)}
              <div>
                <strong style="color: #f8fafc; font-size: 12.5px;">${oreName}</strong>
                <span style="color: #94a3b8; font-size: 11px; margin-left: 6px;">(${count}x Vorrat) · ${durSec}s/Stk · +€${netVal}/Barren</span>
              </div>
            </div>
            <div style="display: flex; gap: 6px; align-items: center;">
              <button class="btn-deposit-one btn-3d-secondary" data-ore="${oreKey}" style="height: 32px; padding: 0 10px; font-size: 11px; font-weight: 700; border-radius: 8px;">+1 in Ofen</button>
              <button class="btn-deposit-all-type btn-action" data-ore="${oreKey}" style="height: 32px; padding: 0 10px; font-size: 11px; font-weight: 700; border-radius: 8px;">Alle (${count})</button>
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

    const btnDepositAll = document.getElementById('btn-deposit-all-cargo');
    if (btnDepositAll) {
      btnDepositAll.onclick = () => {
        this.depositAllCargoToRefinery();
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

  craftFactoryProduct(productId) {
    const prod = FACTORY_PRODUCTS[productId];
    if (!prod) return;

    // Check cargo requirements
    const cargoCounts = {};
    this.player.cargo.forEach(ore => {
      cargoCounts[ore] = (cargoCounts[ore] || 0) + 1;
    });

    for (const [ore, needed] of Object.entries(prod.recipe)) {
      if ((cargoCounts[ore] || 0) < needed) {
        this.scene.events.emit('notify', `Nicht genug ${ORE_DATA[ore]?.name || ore} im Frachtraum!`);
        return;
      }
    }

    // Deduct ores from cargo without awarding cash
    for (const [ore, needed] of Object.entries(prod.recipe)) {
      this.player.consumeOre(ore, needed);
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

    let prodTransferred = 0;
    let oreCashGained = 0;

    this.refinery.finished.forEach(item => {
      if (item.isProduct && item.productId) {
        this.player.factoryProducts[item.productId] = (this.player.factoryProducts[item.productId] || 0) + 1;
        prodTransferred++;
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
    if (prodTransferred > 0 && oreCashGained > 0) {
      msg = `${prodTransferred}x Waren ins Lager übernommen & Barren für +€${oreCashGained} verkauft!`;
    } else if (prodTransferred > 0) {
      msg = `${prodTransferred}x Fabrik-Waren ins Lager übernommen! Verkaufe sie an der Erzbörse.`;
    } else {
      msg = `Barren für +€${oreCashGained} verkauft!`;
    }
    this.scene.events.emit('notify', msg);
  }

  depositOreToRefinery(oreKey, count = 1) {
    let moved = 0;
    for (let i = this.player.cargo.length - 1; i >= 0 && moved < count; i--) {
      if (this.player.cargo[i] === oreKey) {
        this.player.cargo.splice(i, 1);
        const durationMs = getRefinerySmeltDurationMs(oreKey);
        const netVal = getRefinedOreNetValue(oreKey);
        this.refinery.queue.push({
          id: `q_${Date.now()}_${Math.random().toString(36).substr(2, 7)}`,
          ore: oreKey,
          name: ORE_DATA[oreKey]?.name || oreKey,
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
      this.scene.events.emit('notify', `${moved}x ${ORE_DATA[oreKey]?.name || oreKey} in den Schmelzofen gegeben.`);
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
        name: ORE_DATA[oreKey]?.name || oreKey,
        durationMs,
        remainingMs: durationMs,
        value: netVal
      });
    });

    this.player.cargo = [];
    soundFx.playFurnace();
    this.renderRefineryModalBody();
    if (this.scene.hud) this.scene.hud.update();
    this.scene.events.emit('notify', `${total} Erze in den Schmelzofen gegeben!`);
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
