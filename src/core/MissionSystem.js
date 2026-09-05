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
    rewardComp: { key: 'hydraulic_part', name: 'Hydraulik-Zylinder', count: 1 },
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
    rewardComp: { key: 'hydraulic_part', name: 'Hydraulik-Zylinder', count: 1 },
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
    rewardComp: { key: 'hydraulic_part', name: 'Hydraulik-Zylinder', count: 1 },
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
    rewardComp: { key: 'titan_alloy', name: 'Titan-Legierung', count: 1 },
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
    rewardComp: { key: 'titan_alloy', name: 'Titan-Legierung', count: 1 },
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
    rewardComp: { key: 'titan_alloy', name: 'Titan-Legierung', count: 1 },
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
    rewardComp: { key: 'titan_alloy', name: 'Titan-Legierung', count: 1 },
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
    rewardComp: { key: 'laser_lens', name: 'Kristall-Fokuslinse', count: 1 },
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
    rewardComp: { key: 'laser_lens', name: 'Kristall-Fokuslinse', count: 1 },
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
    rewardComp: { key: 'laser_lens', name: 'Kristall-Fokuslinse', count: 1 },
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
    rewardComp: { key: 'laser_lens', name: 'Kristall-Fokuslinse', count: 1 },
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
    rewardComp: { key: 'quantum_chip', name: 'Quanten-Steuerkern', count: 1 },
    minLevel: 5
  },
  {
    id: 'sapphire_crystals',
    title: 'Tiefblaue Saphire',
    desc: 'Fördere 3 seltene Saphire aus den magmatischen Schichten.',
    type: 'COLLECT_ORE',
    targetOre: 'sapphire',
    targetCount: 3,
    rewardCash: 12000,
    rewardXp: 4000,
    rewardComp: { key: 'quantum_chip', name: 'Quanten-Steuerkern', count: 1 },
    minLevel: 6
  },
  {
    id: 'depth_pioneer_7',
    title: 'Tiefenbohrung VII: 1600 Meter',
    desc: 'Dringe tief in den Urgestein-Sockel vor und erreiche 1.600 Meter Tiefe.',
    type: 'REACH_DEPTH',
    targetDepth: 1600,
    rewardCash: 15000,
    rewardXp: 5000,
    rewardComp: { key: 'quantum_chip', name: 'Quanten-Steuerkern', count: 1 },
    minLevel: 6
  },
  {
    id: 'amethyst_resonance',
    title: 'Amethyst-Geoden',
    desc: 'Berge 3 edle Amethyste aus den tiefen Kristallkavitationen.',
    type: 'COLLECT_ORE',
    targetOre: 'amethyst',
    targetCount: 3,
    rewardCash: 18000,
    rewardXp: 6000,
    rewardComp: { key: 'quantum_chip', name: 'Quanten-Steuerkern', count: 1 },
    minLevel: 7
  },
  {
    id: 'depth_pioneer_8',
    title: 'Tiefenbohrung VIII: 2000 Meter',
    desc: 'Stoße in den äußeren Erdkern vor und erreiche 2.000 Meter Tiefe.',
    type: 'REACH_DEPTH',
    targetDepth: 2000,
    rewardCash: 22000,
    rewardXp: 7500,
    rewardComp: { key: 'quantum_chip', name: 'Quanten-Steuerkern', count: 1 },
    minLevel: 8
  },
  {
    id: 'diamond_hoard',
    title: 'Diamanten-Vollendung',
    desc: 'Sammle 4 ungeschliffene Diamanten aus den extremsten Druckkammern.',
    type: 'COLLECT_ORE',
    targetOre: 'diamond',
    targetCount: 4,
    rewardCash: 28000,
    rewardXp: 9500,
    rewardComp: { key: 'quantum_chip', name: 'Quanten-Steuerkern', count: 2 },
    minLevel: 8
  },
  {
    id: 'dark_matter_expedition',
    title: 'Artefakt der Dunkelmaterie',
    desc: 'Fördere 2 Einheiten Dunkelmaterie aus der tiefsten Abyssalzone.',
    type: 'COLLECT_ORE',
    targetOre: 'dark_matter',
    targetCount: 2,
    rewardCash: 40000,
    rewardXp: 15000,
    rewardComp: { key: 'quantum_chip', name: 'Quanten-Steuerkern', count: 2 },
    minLevel: 9
  },
  {
    id: 'depth_core_abyss',
    title: 'Reise zum Planetenkern: 3000 Meter',
    desc: 'Meistere die ultimative Herausforderung und stoße bis auf 3.000 Meter Tiefe vor!',
    type: 'REACH_DEPTH',
    targetDepth: 3000,
    rewardCash: 65000,
    rewardXp: 30000,
    rewardComp: { key: 'quantum_chip', name: 'Quanten-Steuerkern', count: 3 },
    minLevel: 10
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

    // Sofortige Überprüfung des aktuellen Spielstands
    this.checkCurrentProgress();
  }

  setActiveMission(mission) {
    if (!mission) return;
    this.activeMission = { ...mission };
    this.progress = 0;
    this.isCompleted = false;

    this.checkCurrentProgress();
    this.scene.events.emit('mission_updated', this.getMissionStatus());
  }

  checkCurrentProgress() {
    if (!this.activeMission || this.isCompleted) return;

    if (this.activeMission.type === 'REACH_DEPTH') {
      const currentDepth = Math.max(
        this.player.highestDepthReached || 0,
        this.player.depthMeters || 0
      );
      if (currentDepth > 0) {
        this.onDepthChanged(currentDepth);
      }
    }
  }

  assignNewMission() {
    const playerLevel = this.player.level || 1;
    const available = MISSION_POOL.filter(m => {
      if (m.minLevel > playerLevel) return false;
      if (this.activeMission && m.id === this.activeMission.id) return false;
      if (m.type === 'COLLECT_ORE' && !this.player.isOreDiscovered(m.targetOre)) return false;
      return true;
    });

    const chosen = available[Math.floor(Math.random() * available.length)] ||
                   MISSION_POOL.find(m => m.type === 'REACH_DEPTH' && m.minLevel <= playerLevel) ||
                   MISSION_POOL[0];

    this.setActiveMission(chosen);
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
        this.scene.events.emit('notify', `🎉 TIEFENZIEL ERREICHT (${this.activeMission.targetDepth}m)! Kehre zur Basis zurück.`);
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

    let compMsg = '';
    if (this.activeMission.rewardComp) {
      const compKey = this.activeMission.rewardComp.key || this.activeMission.rewardComp;
      const count = this.activeMission.rewardComp.count || 1;
      const compName = this.activeMission.rewardComp.name || compKey;
      if (!this.player.components) {
        this.player.components = { hydraulic_part: 0, titan_alloy: 0, laser_lens: 0, quantum_chip: 0 };
      }
      this.player.components[compKey] = (this.player.components[compKey] || 0) + count;
      compMsg = `, +${count}x ${compName}`;
    }

    soundFx.playPurchase();

    this.scene.events.emit('notify', `💰 Belohnung erhalten: +€${cash}, +${xp} XP${compMsg}!`);

    // Neue Mission vergeben
    this.assignNewMission();
    return true;
  }

  getMissionStatus() {
    if (!this.activeMission) return null;

    // Dynamische Absicherung für Tiefenziele
    if (this.activeMission.type === 'REACH_DEPTH' && !this.isCompleted) {
      const currentDepth = Math.max(
        this.player.highestDepthReached || 0,
        this.player.depthMeters || 0
      );
      if (currentDepth >= this.activeMission.targetDepth) {
        this.progress = this.activeMission.targetDepth;
        this.isCompleted = true;
      } else if (currentDepth > this.progress) {
        this.progress = currentDepth;
      }
    }

    let targetText = '';
    if (this.activeMission.type === 'COLLECT_ORE') {
      const oreName = (this.activeMission.targetOre && ORE_DATA[this.activeMission.targetOre]?.name) || 'Erze';
      targetText = `Ziel: ${this.progress}/${this.activeMission.targetCount} ${oreName}`;
    } else if (this.activeMission.type === 'REACH_DEPTH') {
      targetText = `Ziel: ${this.progress}/${this.activeMission.targetDepth} Meter`;
    }

    return {
      id: this.activeMission.id,
      title: this.activeMission.title,
      desc: this.activeMission.desc,
      rewardCash: this.activeMission.rewardCash,
      rewardXp: this.activeMission.rewardXp,
      rewardComp: this.activeMission.rewardComp || null,
      type: this.activeMission.type,
      targetOre: this.activeMission.targetOre,
      targetText,
      progress: this.progress,
      targetCount: this.activeMission.targetDepth || this.activeMission.targetCount,
      isCompleted: this.isCompleted
    };
  }
}
