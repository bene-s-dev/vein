/**
 * MissionSystem.js
 * Verwaltet dynamische Bergbau-Aufträge (Contracts Board),
 * Fortschrittsmessung, Belohnungs-Ausschüttung (Geld & XP) und Rang-Aufstiege.
 */

import { soundFx } from './SoundEffects.js';
import { ORE_DATA } from './GridSystem.js';

export const MISSION_POOL = [
  {
    id: 'coal_crisis',
    title: 'Kohle für das Kraftwerk',
    desc: 'Die Oberflächengeneratoren benötigen dringend Brennstoff. Baue 5 Einheiten Kohle ab.',
    type: 'COLLECT_ORE',
    targetOre: 'coal',
    targetCount: 5,
    rewardCash: 220,
    rewardXp: 100,
    minLevel: 1
  },
  {
    id: 'copper_wires',
    title: 'Kupferkabel-Produktion',
    desc: 'Für die Fabrik-Schaltkreise werden 4 Einheiten Kupfererz benötigt.',
    type: 'COLLECT_ORE',
    targetOre: 'copper',
    targetCount: 4,
    rewardCash: 320,
    rewardXp: 140,
    minLevel: 1
  },
  {
    id: 'depth_pioneer_1',
    title: 'Tiefenbohrung I: 25 Meter',
    desc: 'Dringe durch die Humusschicht bis auf eine Tiefe von 25 Metern vor.',
    type: 'REACH_DEPTH',
    targetDepth: 25,
    rewardCash: 450,
    rewardXp: 180,
    minLevel: 1
  },
  {
    id: 'iron_plating',
    title: 'Panzerung aus Eisen',
    desc: 'Die Werkstatt benötigt 4 Einheiten Eisenerz zur Rumpf-Verstärkung.',
    type: 'COLLECT_ORE',
    targetOre: 'iron',
    targetCount: 4,
    rewardCash: 650,
    rewardXp: 260,
    minLevel: 1
  },
  {
    id: 'depth_pioneer_2',
    title: 'Tiefenbohrung II: 65 Meter',
    desc: 'Stoße in die Schieferschichten vor und erreiche eine Tiefe von 65 Metern.',
    type: 'REACH_DEPTH',
    targetDepth: 65,
    rewardCash: 850,
    rewardXp: 350,
    minLevel: 2
  },
  {
    id: 'tin_smelt',
    title: 'Zinn für Legierungen',
    desc: 'Fördere 3 Einheiten Zinnerz für hochwertige Legierungen.',
    type: 'COLLECT_ORE',
    targetOre: 'tin',
    targetCount: 3,
    rewardCash: 950,
    rewardXp: 400,
    minLevel: 2
  },
  {
    id: 'depth_pioneer_3',
    title: 'Tiefenbohrung III: 150 Meter',
    desc: 'Erreiche die dichte Granitschicht in mindestens 150 Metern Tiefe.',
    type: 'REACH_DEPTH',
    targetDepth: 150,
    rewardCash: 1400,
    rewardXp: 550,
    minLevel: 2
  },
  {
    id: 'silver_vein',
    title: 'Silber-Raffination',
    desc: 'Baue 3 Einheiten reines Silbererz im Granit ab.',
    type: 'COLLECT_ORE',
    targetOre: 'silver',
    targetCount: 3,
    rewardCash: 1500,
    rewardXp: 600,
    minLevel: 3
  },
  {
    id: 'gold_rush',
    title: 'Goldrausch in der Tiefe',
    desc: 'Fördere 3 Einheiten reines Gold für das Forschungslabor.',
    type: 'COLLECT_ORE',
    targetOre: 'gold',
    targetCount: 3,
    rewardCash: 2200,
    rewardXp: 800,
    minLevel: 3
  },
  {
    id: 'depth_pioneer_4',
    title: 'Tiefenbohrung IV: 350 Meter',
    desc: 'Stoße durch den Granit vor und erreiche eine Tiefe von 350 Metern.',
    type: 'REACH_DEPTH',
    targetDepth: 350,
    rewardCash: 2800,
    rewardXp: 1000,
    minLevel: 3
  },
  {
    id: 'emerald_optics',
    title: 'Smaragd-Laserlinsen',
    desc: 'Fördere 2 Smaragde zur Kalibrierung des Laser-Sensors.',
    type: 'COLLECT_ORE',
    targetOre: 'emerald',
    targetCount: 2,
    rewardCash: 3200,
    rewardXp: 1200,
    minLevel: 4
  },
  {
    id: 'depth_pioneer_5',
    title: 'Tiefenbohrung V: 700 Meter',
    desc: 'Dringe in die Obsidian-Zone vor und erreiche eine Tiefe von 700 Metern.',
    type: 'REACH_DEPTH',
    targetDepth: 700,
    rewardCash: 4500,
    rewardXp: 1600,
    minLevel: 4
  },
  {
    id: 'diamond_core',
    title: 'Der Diamant-Fund',
    desc: 'Bringe mindestens 2 Rohdiamanten aus den Tiefen an die Oberfläche.',
    type: 'COLLECT_ORE',
    targetOre: 'diamond',
    targetCount: 2,
    rewardCash: 6000,
    rewardXp: 2200,
    minLevel: 4
  },
  {
    id: 'depth_pioneer_6',
    title: 'Tiefenbohrung VI: 1200 Meter',
    desc: 'Stoße in die Urgestein-Kernzone vor und erreiche mindestens 1.200 Meter.',
    type: 'REACH_DEPTH',
    targetDepth: 1200,
    rewardCash: 9500,
    rewardXp: 3200,
    minLevel: 5
  },
  {
    id: 'dark_matter_expedition',
    title: 'Artefakt der Dunkelmaterie',
    desc: 'Fördere 1 Einheit Dunkelmaterie aus der tiefsten Abyssalzone.',
    type: 'COLLECT_ORE',
    targetOre: 'dark_matter',
    targetCount: 1,
    rewardCash: 24000,
    rewardXp: 8000,
    minLevel: 5
  }
];

export class MissionSystem {
  constructor(scene, player) {
    this.scene = scene;
    this.player = player;

    this.activeMission = null;
    this.progress = 0;
    this.isCompleted = false;

    // Erste Mission zuweisen
    this.assignNewMission();

    // Event-Listener für Erz-Sammeln und Tiefe
    this.scene.events.on('ore_collected', (oreType) => this.onOreCollected(oreType));
    this.scene.events.on('depth_changed', (depth) => this.onDepthChanged(depth));
  }

  assignNewMission() {
    const playerLevel = this.player.level || 1;
    const available = MISSION_POOL.filter(m => m.minLevel <= playerLevel && (!this.activeMission || m.id !== this.activeMission.id));
    const chosen = available[Math.floor(Math.random() * available.length)] || MISSION_POOL[0];

    this.activeMission = { ...chosen };
    this.progress = 0;
    this.isCompleted = false;

    this.scene.events.emit('mission_updated', this.getMissionStatus());
  }

  onOreCollected(oreType) {
    if (!this.activeMission || this.isCompleted) return;

    if (this.activeMission.type === 'COLLECT_ORE' && this.activeMission.targetOre === oreType) {
      this.progress++;
      if (this.progress >= this.activeMission.targetCount) {
        this.progress = this.activeMission.targetCount;
        this.isCompleted = true;
        soundFx.playOreCollect(3);
        this.scene.events.emit('notify', `🎉 AUFTRAG ERFÜLLT: ${this.activeMission.title}! Kehre zur Basis zurück.`);
      }
      this.scene.events.emit('mission_updated', this.getMissionStatus());
    }
  }

  onDepthChanged(depth) {
    if (!this.activeMission || this.isCompleted) return;

    if (this.activeMission.type === 'REACH_DEPTH') {
      this.progress = Math.max(this.progress, depth);
      if (this.progress >= this.activeMission.targetDepth) {
        this.progress = this.activeMission.targetDepth;
        this.isCompleted = true;
        soundFx.playOreCollect(3);
        this.scene.events.emit('notify', `🎉 TIEFENZIEL ERREICHT! Kehre zur Basis zurück.`);
      }
      this.scene.events.emit('mission_updated', this.getMissionStatus());
    }
  }

  claimReward() {
    if (!this.activeMission || !this.isCompleted) return false;

    const cash = this.activeMission.rewardCash;
    const xp = this.activeMission.rewardXp;

    this.player.cash += cash;
    this.player.addXp(xp);
    soundFx.playPurchase();

    this.scene.events.emit('notify', `💰 Belohnung erhalten: +€${cash} & +${xp} XP!`);

    // Neue Mission vergeben
    this.assignNewMission();
    return true;
  }

  getMissionStatus() {
    if (!this.activeMission) return null;

    let targetText = '';
    if (this.activeMission.type === 'COLLECT_ORE') {
      const oreName = (this.activeMission.targetOre && ORE_DATA[this.activeMission.targetOre]?.name) || 'Erze';
      targetText = `Ziel: ${this.progress}/${this.activeMission.targetCount} ${oreName}`;
    } else if (this.activeMission.type === 'REACH_DEPTH') {
      targetText = `Ziel: ${this.progress}/${this.activeMission.targetDepth} Meter`;
    }

    return {
      title: this.activeMission.title,
      desc: this.activeMission.desc,
      rewardCash: this.activeMission.rewardCash,
      rewardXp: this.activeMission.rewardXp,
      targetText,
      isCompleted: this.isCompleted
    };
  }
}
