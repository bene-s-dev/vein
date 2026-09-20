/**
 * MissionSystem.js
 * Verwaltet dynamische Bergbau-Aufträge (Contracts Board),
 * max 3 gleichzeitig verfügbare Aufträge, Fortschrittsmessung,
 * Belohnungs-Ausschüttung (Geld & XP) und automatische Nachbesetzung.
 */

import { soundFx } from './SoundEffects.js';
import { ORE_DATA } from './GridSystem.js';

export const MISSION_POOL = [
  // --- STUFE 1 (Humus-Zone: 0 - 50m) ---
  {
    id: 'coal_crisis',
    title: 'Kohle für das Kraftwerk',
    desc: 'Die Oberflächengeneratoren benötigen dringend Brennstoff. Baue 5 Einheiten Kohle ab.',
    type: 'COLLECT_ORE',
    targetOre: 'coal',
    targetCount: 5,
    rewardCash: 140,
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
    rewardCash: 190,
    rewardXp: 140,
    minLevel: 1
  },
  {
    id: 'depth_pioneer_1',
    title: 'Tiefenbohrung I: 25 Meter',
    desc: 'Dringe durch die Humusschicht bis auf eine Tiefe von 25 Metern vor.',
    type: 'REACH_DEPTH',
    targetDepth: 25,
    rewardCash: 260,
    rewardXp: 180,
    rewardComp: { key: 'iron_tube', name: 'Stahl-Rohr', count: 1 },
    minLevel: 1
  },
  {
    id: 'iron_plating',
    title: 'Panzerung aus Eisen',
    desc: 'Die Werkstatt benötigt 4 Einheiten Eisenerz zur Rumpf-Verstärkung.',
    type: 'COLLECT_ORE',
    targetOre: 'iron',
    targetCount: 4,
    rewardCash: 360,
    rewardXp: 260,
    rewardComp: { key: 'iron_tube', name: 'Stahl-Rohr', count: 1 },
    minLevel: 1
  },
  {
    id: 'coal_reserve',
    title: 'Kohlevorrat der Bergleute',
    desc: 'Sichere das Treibstofflager an der Oberfläche mit 8 Einheiten Kohle.',
    type: 'COLLECT_ORE',
    targetOre: 'coal',
    targetCount: 8,
    rewardCash: 220,
    rewardXp: 160,
    minLevel: 1
  },
  {
    id: 'copper_spool',
    title: 'Spulenfertigung',
    desc: 'Fördere 6 Einheiten Kupfererz für elektromagnetische Generatoren.',
    type: 'COLLECT_ORE',
    targetOre: 'copper',
    targetCount: 6,
    rewardCash: 280,
    rewardXp: 200,
    minLevel: 1
  },
  {
    id: 'depth_humus_master',
    title: 'Schachtvortrieb: 45 Meter',
    desc: 'Erkunde die tiefsten Schichten des Humus und erreiche 45 Meter Tiefe.',
    type: 'REACH_DEPTH',
    targetDepth: 45,
    rewardCash: 340,
    rewardXp: 240,
    rewardComp: { key: 'iron_tube', name: 'Stahl-Rohr', count: 1 },
    minLevel: 1
  },

  // --- STUFE 2 (Schiefer-Zone: 30 - 150m) ---
  {
    id: 'depth_pioneer_2',
    title: 'Tiefenbohrung II: 65 Meter',
    desc: 'Stoße in die Schieferschichten vor und erreiche eine Tiefe von 65 Metern.',
    type: 'REACH_DEPTH',
    targetDepth: 65,
    rewardCash: 520,
    rewardXp: 350,
    rewardComp: { key: 'iron_tube', name: 'Stahl-Rohr', count: 1 },
    minLevel: 2
  },
  {
    id: 'tin_smelt',
    title: 'Zinn für Legierungen',
    desc: 'Fördere 4 Einheiten Zinnerz für hochwertige Legierungen.',
    type: 'COLLECT_ORE',
    targetOre: 'tin',
    targetCount: 4,
    rewardCash: 580,
    rewardXp: 400,
    rewardComp: { key: 'bronze_gear', name: 'Bronze-Getriebe', count: 1 },
    minLevel: 2
  },
  {
    id: 'iron_expansion',
    title: 'Industrieller Eisenbedarf',
    desc: 'Baue 6 Einheiten Eisenerz in den Schieferwänden ab.',
    type: 'COLLECT_ORE',
    targetOre: 'iron',
    targetCount: 6,
    rewardCash: 680,
    rewardXp: 450,
    rewardComp: { key: 'iron_tube', name: 'Stahl-Rohr', count: 1 },
    minLevel: 2
  },
  {
    id: 'depth_slate_deep',
    title: 'Schiefer-Klüfte: 110 Meter',
    desc: 'Dringe tief in das Schiefergestein vor und erreiche 110 Meter Schachttiefe.',
    type: 'REACH_DEPTH',
    targetDepth: 110,
    rewardCash: 780,
    rewardXp: 480,
    rewardComp: { key: 'bronze_gear', name: 'Bronze-Getriebe', count: 1 },
    minLevel: 2
  },
  {
    id: 'tin_bronze_supply',
    title: 'Bronze-Gussvorrat',
    desc: 'Fördere 6 Einheiten Zinnerz für Getriebe- und Rumpfbauteile.',
    type: 'COLLECT_ORE',
    targetOre: 'tin',
    targetCount: 6,
    rewardCash: 850,
    rewardXp: 520,
    minLevel: 2
  },

  // --- STUFE 3 (Granit-Zone: 130 - 350m) ---
  {
    id: 'depth_pioneer_3',
    title: 'Tiefenbohrung III: 150 Meter',
    desc: 'Erreiche die dichte Granitschicht in mindestens 150 Metern Tiefe.',
    type: 'REACH_DEPTH',
    targetDepth: 150,
    rewardCash: 1400,
    rewardXp: 550,
    rewardComp: { key: 'bronze_gear', name: 'Bronze-Getriebe', count: 1 },
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
    rewardComp: { key: 'silver_coil', name: 'Silber-Spule', count: 1 },
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
    rewardComp: { key: 'silver_coil', name: 'Silber-Spule', count: 1 },
    minLevel: 3
  },
  {
    id: 'depth_granite_abyss',
    title: 'Granit-Kernbohrung: 250 Meter',
    desc: 'Stoße tief in die massiven Granitadern auf 250 Meter vor.',
    type: 'REACH_DEPTH',
    targetDepth: 250,
    rewardCash: 2400,
    rewardXp: 900,
    rewardComp: { key: 'silver_coil', name: 'Silber-Spule', count: 1 },
    minLevel: 3
  },
  {
    id: 'silver_conductors',
    title: 'Silberne Leiterbahnen',
    desc: 'Gewinne 5 Einheiten Silbererz für hochempfindliche Sensorantennen.',
    type: 'COLLECT_ORE',
    targetOre: 'silver',
    targetCount: 5,
    rewardCash: 2600,
    rewardXp: 950,
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
    rewardComp: { key: 'silver_coil', name: 'Silber-Spule', count: 1 },
    minLevel: 3
  },

  // --- STUFE 4 (Granit-Tiefen & Übergang: 300 - 500m) ---
  {
    id: 'emerald_optics',
    title: 'Smaragd-Laserlinsen',
    desc: 'Fördere 2 Smaragde zur Kalibrierung des Laser-Sensors.',
    type: 'COLLECT_ORE',
    targetOre: 'emerald',
    targetCount: 2,
    rewardCash: 3200,
    rewardXp: 1200,
    rewardComp: { key: 'crystal_lens', name: 'Kristall-Linse', count: 1 },
    minLevel: 4
  },
  {
    id: 'depth_basalt_ridge',
    title: 'Granit-Kluft: 450 Meter',
    desc: 'Meistere den enormen Gesteinsdruck und erreiche 450 Meter Tiefe.',
    type: 'REACH_DEPTH',
    targetDepth: 450,
    rewardCash: 3900,
    rewardXp: 1450,
    rewardComp: { key: 'crystal_lens', name: 'Kristall-Linse', count: 1 },
    minLevel: 4
  },
  {
    id: 'depth_pioneer_5',
    title: 'Tiefenbohrung V: 550 Meter',
    desc: 'Dringe bis in die Obsidian-Schichten auf 550 Meter vor.',
    type: 'REACH_DEPTH',
    targetDepth: 550,
    rewardCash: 4500,
    rewardXp: 1600,
    rewardComp: { key: 'crystal_lens', name: 'Kristall-Linse', count: 1 },
    minLevel: 4
  },

  // --- STUFE 5 (Obsidian-Zone: 480 - 950m) ---
  {
    id: 'sapphire_crystals',
    title: 'Tiefblaue Saphire',
    desc: 'Fördere 3 seltene Saphire aus den vulkanischen Schichten.',
    type: 'COLLECT_ORE',
    targetOre: 'sapphire',
    targetCount: 3,
    rewardCash: 5200,
    rewardXp: 1800,
    rewardComp: { key: 'titan_bolt', name: 'Titan-Bolzen', count: 1 },
    minLevel: 5
  },
  {
    id: 'ruby_thermals',
    title: 'Glutrote Rubine',
    desc: 'Berge 3 flammende Rubine zur Hitzeschild-Reflexion.',
    type: 'COLLECT_ORE',
    targetOre: 'ruby',
    targetCount: 3,
    rewardCash: 6500,
    rewardXp: 2200,
    rewardComp: { key: 'titan_bolt', name: 'Titan-Bolzen', count: 1 },
    minLevel: 5
  },
  {
    id: 'depth_obsidian_depths',
    title: 'Obsidian-Schlucht: 700 Meter',
    desc: 'Bohre dich durch extrem harte Glasschichten bis auf 700 Meter Tiefe vor.',
    type: 'REACH_DEPTH',
    targetDepth: 700,
    rewardCash: 5800,
    rewardXp: 2200,
    rewardComp: { key: 'titan_bolt', name: 'Titan-Bolzen', count: 1 },
    minLevel: 5
  },
  {
    id: 'diamond_core',
    title: 'Der Diamant-Fund',
    desc: 'Bringe mindestens 2 Rohdiamanten aus den Tiefen an die Oberfläche.',
    type: 'COLLECT_ORE',
    targetOre: 'diamond',
    targetCount: 2,
    rewardCash: 7500,
    rewardXp: 2600,
    rewardComp: { key: 'titan_bolt', name: 'Titan-Bolzen', count: 1 },
    minLevel: 5
  },
  {
    id: 'depth_pioneer_6',
    title: 'Tiefenbohrung VI: 850 Meter',
    desc: 'Erreiche die magmatische Schwelle in 850 Metern Tiefe.',
    type: 'REACH_DEPTH',
    targetDepth: 850,
    rewardCash: 7500,
    rewardXp: 2600,
    rewardComp: { key: 'titan_bolt', name: 'Titan-Bolzen', count: 1 },
    minLevel: 5
  },

  // --- STUFE 6 (Magma-Zone: 950 - 1300m) ---
  {
    id: 'depth_magma_sea',
    title: 'Magma-Schwelle: 1.000 Meter',
    desc: 'Erreiche den Meilenstein von 1.000 Metern Tiefe im glutflüssigen Gestein!',
    type: 'REACH_DEPTH',
    targetDepth: 1000,
    rewardCash: 9800,
    rewardXp: 3500,
    rewardComp: { key: 'quantum_core', name: 'Quanten-Kern', count: 1 },
    minLevel: 6
  },
  {
    id: 'titan_armor_plates',
    title: 'Titan für die Hülle',
    desc: 'Fördere 3 Einheiten Titanerz zur Verstärkung des Bohrers gegen Gebirgsdruck.',
    type: 'COLLECT_ORE',
    targetOre: 'titanium',
    targetCount: 3,
    rewardCash: 11000,
    rewardXp: 3800,
    rewardComp: { key: 'quantum_core', name: 'Quanten-Kern', count: 1 },
    minLevel: 6
  },
  {
    id: 'depth_pioneer_7',
    title: 'Tiefenbohrung VII: 1.200 Meter',
    desc: 'Dringe tief in den Glutmantel vor und erreiche 1.200 Meter.',
    type: 'REACH_DEPTH',
    targetDepth: 1200,
    rewardCash: 12500,
    rewardXp: 4200,
    rewardComp: { key: 'quantum_core', name: 'Quanten-Kern', count: 1 },
    minLevel: 6
  },

  // --- STUFE 7 (Kavitations-Zone: 1200 - 1700m) ---
  {
    id: 'platinum_vein',
    title: 'Platin-Konduktoren',
    desc: 'Fördere 3 Einheiten Platin für supraleitende Triebwerksspulen.',
    type: 'COLLECT_ORE',
    targetOre: 'platinum',
    targetCount: 3,
    rewardCash: 15000,
    rewardXp: 5000,
    rewardComp: { key: 'quantum_core', name: 'Quanten-Kern', count: 1 },
    minLevel: 7
  },
  {
    id: 'uranium_energy',
    title: 'Spaltbares Tiefen-Uran',
    desc: 'Sichere 2 Einheiten Uranerz für die Fusionsreaktoren der Station.',
    type: 'COLLECT_ORE',
    targetOre: 'uranium',
    targetCount: 2,
    rewardCash: 19000,
    rewardXp: 6500,
    rewardComp: { key: 'quantum_core', name: 'Quanten-Kern', count: 1 },
    minLevel: 7
  },
  {
    id: 'depth_cavitation',
    title: 'Kavitations-Abgrund: 1.500 Meter',
    desc: 'Erkunde gigantische Kristallhohlräume in 1.500 Metern Tiefe.',
    type: 'REACH_DEPTH',
    targetDepth: 1500,
    rewardCash: 16500,
    rewardXp: 5500,
    rewardComp: { key: 'quantum_core', name: 'Quanten-Kern', count: 1 },
    minLevel: 7
  },
  {
    id: 'obsidian_harvest',
    title: 'Vulkanisches Glas',
    desc: 'Fördere 4 seltene Obsidian-Kerne aus erstarrten Lavakanälen.',
    type: 'COLLECT_ORE',
    targetOre: 'obsidian_gem',
    targetCount: 4,
    rewardCash: 21000,
    rewardXp: 7000,
    rewardComp: { key: 'quantum_core', name: 'Quanten-Kern', count: 1 },
    minLevel: 7
  },

  // --- STUFE 8 (Urgestein-Zone: 1600 - 2100m) ---
  {
    id: 'depth_pioneer_8',
    title: 'Tiefenbohrung VIII: 1.800 Meter',
    desc: 'Dringe tief in den Urgestein-Sockel vor und erreiche 1.800 Meter Tiefe.',
    type: 'REACH_DEPTH',
    targetDepth: 1800,
    rewardCash: 24000,
    rewardXp: 8000,
    rewardComp: { key: 'quantum_core', name: 'Quanten-Kern', count: 2 },
    minLevel: 8
  },
  {
    id: 'depth_bedrock_base',
    title: 'Urgestein-Meister: 2.000 Meter',
    desc: 'Erreiche die sagenhafte 2-Kilometer-Marke im ältesten Gestein des Planeten!',
    type: 'REACH_DEPTH',
    targetDepth: 2000,
    rewardCash: 28000,
    rewardXp: 9500,
    rewardComp: { key: 'quantum_core', name: 'Quanten-Kern', count: 2 },
    minLevel: 8
  },

  // --- STUFE 9 & 10 (Erdkern & Planetenherz: 2000 - 3000m) ---
  {
    id: 'depth_mantle_core',
    title: 'Der flüssige Erdkern: 2.400 Meter',
    desc: 'Halte fluktuierenden Gravitationsfeldern stand und erreiche 2.400 Meter Tiefe.',
    type: 'REACH_DEPTH',
    targetDepth: 2400,
    rewardCash: 38000,
    rewardXp: 14000,
    rewardComp: { key: 'quantum_core', name: 'Quanten-Kern', count: 2 },
    minLevel: 9
  },
  {
    id: 'darkmatter_particles',
    title: 'Singularitäts-Partikel',
    desc: 'Berge 2 Einheiten Dunkle Materie am Rande des Gravitationskollapses.',
    type: 'COLLECT_ORE',
    targetOre: 'dark_matter',
    targetCount: 2,
    rewardCash: 52000,
    rewardXp: 22000,
    rewardComp: { key: 'quantum_core', name: 'Quanten-Kern', count: 3 },
    minLevel: 9
  },
  {
    id: 'depth_core_abyss',
    title: 'Reise zum Planetenkern: 3.000 Meter',
    desc: 'Meistere die ultimative Herausforderung und stoße bis auf 3.000 Meter Tiefe vor!',
    type: 'REACH_DEPTH',
    targetDepth: 3000,
    rewardCash: 65000,
    rewardXp: 30000,
    rewardComp: { key: 'quantum_core', name: 'Quanten-Kern', count: 3 },
    minLevel: 10
  }
];

export class MissionSystem {
  constructor(scene, player) {
    this.scene = scene;
    this.player = player;

    // Dauerhafter Speicher für bereits abgeschlossene Aufträge (jeder Auftrag darf nur 1x gemacht werden)
    this.completedMissionIds = new Set();

    // Aufträge, die bereits einmal ersetzt wurden (jeder Auftrag darf nur 1x ersetzt werden)
    this.rerolledMissionIds = new Set();

    // Max 3 gleichzeitig verfügbare Aufträge auf dem Kontrakt-Board
    this.availableMissions = [];
    this.activeMission = null;
    this.progress = 0;
    this.isCompleted = false;

    // Initial passende Aufträge zuweisen (begrenzt auf erreichbare Ziele)
    this.ensureAvailableMissions(3);

    // Event-Listener für Erz-Sammeln, Tiefe, Level-Up und Erz-Entdeckung
    this.scene.events.on('ore_collected', (oreType) => this.onOreCollected(oreType));
    this.scene.events.on('depth_changed', (depth) => this.onDepthChanged(depth));
    this.scene.events.on('level_up', () => this.onLevelUp());
    this.scene.events.on('ore_discovered', () => this.onOreDiscovered());

    // Sofortige Überprüfung des aktuellen Spielstands
    this.checkCurrentProgress();
  }

  /**
   * Prüft strikt, ob ein Auftrag für den aktuellen Spielerzustand erreichbar ist:
   * 1. Nie wieder anbieten, falls bereits abgeschlossen (Einmaligkeit)
   * 2. Kein Vorgriff auf zukünftige Level (Spoiler-Vermeidung)
   * 3. Erze: Nur anzeigen, wenn das Erz bereits entdeckt wurde ODER die Tiefe bereits in der entsprechenden Schicht liegt
   * 4. Tiefe: Tiefenziel muss im aktuellen Schachtbereich liegen (stufenweises Freischalten)
   */
  isMissionReachable(m) {
    if (!m || !m.id) return false;

    // Einmalig: Bereits erledigte Aufträge nie wieder anbieten
    if (this.completedMissionIds && this.completedMissionIds.has(m.id)) {
      return false;
    }

    const pLevel = this.player?.level || 1;
    // Kein Vorgriff auf zukünftige Level
    if ((m.minLevel || 1) > pLevel) {
      return false;
    }

    const maxDepthReached = Math.max(
      this.player?.highestDepthReached || 0,
      this.player?.depthMeters || 0
    );

    if (m.type === 'COLLECT_ORE') {
      const oreKey = m.targetOre;
      const oreMeta = ORE_DATA[oreKey];
      if (!oreMeta) return false;

      // Bereits entdeckt? Dann gilt das Erz als bekannt & anvisierbar
      const isDiscovered = this.player?.isOreDiscovered ? this.player.isOreDiscovered(oreKey) : false;
      if (isDiscovered) return true;

      // Noch nicht entdeckt: Nur anzeigen, wenn die Tiefe bereits in der entsprechenden Schicht liegt
      const minOreDepth = oreMeta.minDepth ?? 0;
      if (maxDepthReached < minOreDepth) {
        return false; // Spoiler-Schutz: Schicht noch nicht betreten!
      }
      return true;
    }

    if (m.type === 'REACH_DEPTH') {
      // Tiefenziel darf nicht weit jenseits des aktuellen Horizonts liegen
      // Tiefen werden stufenweise freigeschaltet (Start: max 35m, 20m Tiefe -> max 50m, 40m -> max 80m, usw.)
      const allowedTargetDepth = Math.max(35, Math.round(maxDepthReached * 1.5 + 20));
      if (m.targetDepth > allowedTargetDepth) {
        return false;
      }
      return true;
    }

    return true;
  }

  /**
   * Filtert passende Kandidaten für den aktuellen Spielstand.
   * Keine aggressiven Fallbacks auf höhere Level oder unerreichbare Erze!
   */
  getAvailableCandidates(excludeIds = []) {
    return MISSION_POOL.filter(m => {
      if (excludeIds.includes(m.id)) return false;
      return this.isMissionReachable(m);
    });
  }

  /**
   * Stellt sicher, dass erreichbare Aufträge auf dem Board liegen (maximal maxSlots = 3).
   * Wenn weniger erreichbar sind, bleibt die Liste begrenzt (kein Erwingen von Spoiler-Aufträgen).
   */
  ensureAvailableMissions(maxSlots = 3) {
    if (!Array.isArray(this.availableMissions)) {
      this.availableMissions = [];
    }
    if (!this.completedMissionIds) {
      this.completedMissionIds = new Set();
    }

    // Bereinigen: Ungültige, bereits erledigte oder unerreichbare Aufträge entfernen
    this.availableMissions = this.availableMissions.filter(m => {
      if (!m || !m.id) return false;
      if (this.completedMissionIds.has(m.id)) return false;
      return this.isMissionReachable(m);
    });

    // Auffüllen bis maxSlots, sofern ERREICHBARE Kandidaten existieren
    while (this.availableMissions.length < maxSlots) {
      const currentIds = this.availableMissions.map(m => m.id);
      const candidates = this.getAvailableCandidates(currentIds);
      if (candidates.length === 0) {
        // Keine erreichbaren Aufträge mehr vorhanden -> bewusst begrenzen, KEIN Fallback auf Spoiler!
        break;
      }

      const chosen = candidates[Math.floor(Math.random() * candidates.length)];
      this.availableMissions.push({
        ...chosen,
        progress: 0,
        isCompleted: false,
        isRerolled: false
      });
    }

    this.syncActiveMission();
  }

  /**
   * Synchronisiert die primär im HUD angezeigte Mission
   */
  syncActiveMission() {
    const ready = this.availableMissions.find(m => m.isCompleted);
    this.activeMission = ready || this.availableMissions[0] || null;

    if (this.activeMission) {
      this.progress = this.activeMission.progress || 0;
      this.isCompleted = !!this.activeMission.isCompleted;
    } else {
      this.progress = 0;
      this.isCompleted = false;
    }
  }

  checkCurrentProgress() {
    if (!Array.isArray(this.availableMissions)) return;

    const currentDepth = Math.max(
      this.player.highestDepthReached || 0,
      this.player.depthMeters || 0
    );

    let anyChanged = false;
    this.availableMissions.forEach(m => {
      if (m.type === 'REACH_DEPTH' && !m.isCompleted) {
        if (currentDepth > (m.progress || 0)) {
          m.progress = currentDepth;
          if (m.progress >= m.targetDepth) {
            m.progress = m.targetDepth;
            m.isCompleted = true;
          }
          anyChanged = true;
        }
      }
    });

    if (anyChanged) {
      this.syncActiveMission();
      this.scene.events.emit('mission_updated', this.getMissionStatus());
    }
  }

  onOreCollected(oreType) {
    if (!Array.isArray(this.availableMissions)) return;

    let anyChanged = false;
    this.availableMissions.forEach(m => {
      if (m.type === 'COLLECT_ORE' && m.targetOre === oreType && !m.isCompleted) {
        m.progress = (m.progress || 0) + 1;
        if (m.progress >= m.targetCount) {
          m.progress = m.targetCount;
          m.isCompleted = true;
          soundFx.playOreCollect(3);
          this.scene.events.emit('notify', `🎉 AUFTRAG ERFÜLLT: ${m.title}! Kehre zur Basis zurück.`);
        }
        anyChanged = true;
      }
    });

    // Prüfen, ob durch das neue Erz ein neuer Slot befüllt werden kann
    const prevCount = this.availableMissions.length;
    if (prevCount < 3) {
      this.ensureAvailableMissions(3);
      if (this.availableMissions.length > prevCount) {
        anyChanged = true;
      }
    }

    if (anyChanged) {
      this.syncActiveMission();
      this.scene.events.emit('mission_updated', this.getMissionStatus());
    }
  }

  onOreDiscovered() {
    const prevCount = this.availableMissions.length;
    if (prevCount < 3) {
      this.ensureAvailableMissions(3);
      if (this.availableMissions.length > prevCount) {
        this.syncActiveMission();
        this.scene.events.emit('mission_updated', this.getMissionStatus());
      }
    }
  }

  onLevelUp() {
    const prevCount = this.availableMissions.length;
    if (prevCount < 3) {
      this.ensureAvailableMissions(3);
      if (this.availableMissions.length > prevCount) {
        this.syncActiveMission();
        this.scene.events.emit('mission_updated', this.getMissionStatus());
        this.scene.events.emit('notify', `📋 Neue Aufträge für Level ${this.player.level} freigeschaltet!`);
      }
    }
  }

  onDepthChanged(depth) {
    if (!Array.isArray(this.availableMissions)) return;

    let anyChanged = false;
    this.availableMissions.forEach(m => {
      if (m.type === 'REACH_DEPTH' && !m.isCompleted) {
        const cur = m.progress || 0;
        if (depth > cur) {
          m.progress = depth;
          if (m.progress >= m.targetDepth) {
            m.progress = m.targetDepth;
            m.isCompleted = true;
            soundFx.playOreCollect(3);
            this.scene.events.emit('notify', `🎉 TIEFENZIEL ERREICHT (${m.targetDepth}m): ${m.title}! Kehre zur Basis zurück.`);
          }
          anyChanged = true;
        }
      }
    });

    // Prüfen, ob durch größeres Vordringen neue Aufträge freigeschaltet werden können
    const prevCount = this.availableMissions.length;
    if (prevCount < 3) {
      this.ensureAvailableMissions(3);
      if (this.availableMissions.length > prevCount) {
        anyChanged = true;
        const newlyAdded = this.availableMissions[this.availableMissions.length - 1];
        if (newlyAdded) {
          this.scene.events.emit('notify', `📋 Neuer Auftrag verfügbar: ${newlyAdded.title}`);
        }
      }
    }

    if (anyChanged) {
      this.syncActiveMission();
      this.scene.events.emit('mission_updated', this.getMissionStatus());
    }
  }

  /**
   * Belohnung für einen spezifischen Auftrag (oder den ersten fertigen) einfordern
   */
  claimReward(missionId = null) {
    if (!Array.isArray(this.availableMissions)) return false;

    const target = missionId
      ? this.availableMissions.find(m => m.id === missionId)
      : this.availableMissions.find(m => m.isCompleted);

    if (!target || !target.isCompleted) return false;

    const cash = target.rewardCash;
    const xp = target.rewardXp;

    this.player.cash += cash;
    if (this.player.stats) {
      this.player.stats.missionsCompleted = (this.player.stats.missionsCompleted || 0) + 1;
      this.player.stats.totalCashEarned = (this.player.stats.totalCashEarned || 0) + cash;
    }
    this.player.addXp(xp);

    let compMsg = '';
    if (target.rewardComp) {
      const compKey = target.rewardComp.key || target.rewardComp;
      const count = target.rewardComp.count || 1;
      const compName = target.rewardComp.name || compKey;
      if (!this.player.components) {
        this.player.components = {};
      }
      this.player.components[compKey] = (this.player.components[compKey] || 0) + count;
      compMsg = `, +${count}x ${compName}`;
    }

    soundFx.playPurchase();
    this.scene.events.emit('notify', `💰 Belohnung erhalten: +€${cash.toLocaleString('de-DE')}, +${xp} XP${compMsg}!`);

    // Dauerhaft als erledigt markieren (aufträge dürfen nur einmal gemacht werden)
    if (!this.completedMissionIds) {
      this.completedMissionIds = new Set();
    }
    this.completedMissionIds.add(target.id);

    // Abgeschlossene Mission aus den verfügbaren entfernen
    const index = this.availableMissions.findIndex(m => m.id === target.id);
    if (index !== -1) {
      this.availableMissions.splice(index, 1);
    }

    // Begrenzt nachziehen (nur wenn erreichbare Aufträge existieren)
    this.ensureAvailableMissions(3);

    this.syncActiveMission();
    this.scene.events.emit('mission_updated', this.getMissionStatus());
    this.scene.events.emit('player_updated');
    return true;
  }

  /**
   * Prüft, ob ein Auftrag noch ersetzt werden darf (jeder Auftrag darf nur 1x ersetzt werden)
   */
  canRerollMission(mission) {
    if (!mission || !mission.id) return false;
    if (mission.isRerolled) return false;
    if (this.rerolledMissionIds && this.rerolledMissionIds.has(mission.id)) return false;
    return true;
  }

  /**
   * Tauscht einen bestimmten Auftrag gegen einen neuen erreichbaren aus dem Pool (maximal 1x)
   */
  rerollMission(missionId = null) {
    if (!Array.isArray(this.availableMissions) || this.availableMissions.length === 0) return;

    const index = missionId
      ? this.availableMissions.findIndex(m => m.id === missionId)
      : 0;

    if (index === -1) return;

    const currentMission = this.availableMissions[index];
    if (!this.canRerollMission(currentMission)) {
      soundFx.playError?.();
      this.scene.events.emit('notify', '⚠️ Dieser Auftrag wurde bereits einmal ersetzt.');
      return;
    }

    const currentIds = this.availableMissions.map(m => m.id);
    const candidates = this.getAvailableCandidates(currentIds);

    if (candidates.length === 0) {
      soundFx.playError?.();
      this.scene.events.emit('notify', 'Keine weiteren erreichbaren Aufträge für diese Schicht verfügbar.');
      return;
    }

    if (!this.rerolledMissionIds) this.rerolledMissionIds = new Set();
    this.rerolledMissionIds.add(currentMission.id);

    const chosen = candidates[Math.floor(Math.random() * candidates.length)];
    this.availableMissions[index] = {
      ...chosen,
      progress: 0,
      isCompleted: false,
      isRerolled: true // Ersatzauftrag kann nicht noch einmal getauscht werden
    };
    soundFx.playClick();
    this.syncActiveMission();
    this.scene.events.emit('mission_updated', this.getMissionStatus());
    this.scene.events.emit('notify', `Neuer Auftrag erhalten: ${chosen.title}`);
  }

  // Rückwärtskompatible Methode
  assignNewMission() {
    this.rerollMission();
  }

  /**
   * Lädt gespeicherte Aufträge aus dem Save-Objekt
   */
  restoreSavedMissions(data) {
    if (!data) return;

    this.completedMissionIds = new Set(data.completedMissionIds || []);
    this.rerolledMissionIds = new Set(data.rerolledMissionIds || []);

    if (Array.isArray(data.availableMissions) && data.availableMissions.length > 0) {
      this.availableMissions = [];
      data.availableMissions.slice(0, 3).forEach(saved => {
        if (this.completedMissionIds.has(saved.id)) return;
        const base = MISSION_POOL.find(m => m.id === saved.id);
        if (base && this.isMissionReachable(base)) {
          this.availableMissions.push({
            ...base,
            progress: saved.progress || 0,
            isCompleted: !!saved.isCompleted,
            isRerolled: !!saved.isRerolled
          });
        }
      });
    } else if (data.id) {
      // Abwärtskompatibilität für alte Spielstände mit einzelnem Missions-Objekt
      if (!this.completedMissionIds.has(data.id)) {
        const base = MISSION_POOL.find(m => m.id === data.id);
        if (base && this.isMissionReachable(base)) {
          this.availableMissions = [{
            ...base,
            progress: data.progress || 0,
            isCompleted: !!data.isCompleted,
            isRerolled: !!data.isRerolled
          }];
        }
      }
    }

    this.ensureAvailableMissions(3);
    this.checkCurrentProgress();
    this.scene.events.emit('mission_updated', this.getMissionStatus());
  }

  resetAll() {
    this.completedMissionIds = new Set();
    this.rerolledMissionIds = new Set();
    this.availableMissions = [];
    this.activeMission = null;
    this.progress = 0;
    this.isCompleted = false;
    this.ensureAvailableMissions(3);
    this.checkCurrentProgress();
    this.scene.events.emit('mission_updated', this.getMissionStatus());
  }

  getMissionStatus() {
    this.syncActiveMission();
    if (!this.activeMission) return null;

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
