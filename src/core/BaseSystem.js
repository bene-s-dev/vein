/**
 * BaseSystem.js
 * Verwaltet die Oberflächen-Gebäude (Hangar, Erzbörse, Raffinerie, Tech-Labor),
 * den Steinsammler-NPC (Auftraggeber für Upgrade-Bauteile),
 * kaufbare Neubauten (Drohnen-Hangar, Quanten-Teleporter, Geothermie-Kraftwerk)
 * und das erweiterte Tech-Upgrade-System.
 */

import Phaser from 'phaser';
import { TILE_SIZE, ORE_DATA } from './GridSystem.js';
import { soundFx } from './SoundEffects.js';
import { icon, refreshIcons, COMPONENT_ICONS, oreIcon, ORE_COLORS, REFINED_ORE_DATA, getRefinedOreName, refinedItemIcon, itemDisplayIcon, drillerVehicleIcon } from '../ui/IconHelper.js';
import { TANK_TIERS, HULL_TIERS, ENGINE_TIERS, CARGO_TIERS, SENSOR_TIERS } from './Player.js';
import { showOreInfoModal, showGoodsInfoModal } from '../ui/OreInfoModal.js';

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

export function closeActiveModal(scene) {
  notifyModalClosed();

  const modalEl = document.getElementById('building-modal');
  if (modalEl) {
    modalEl.classList.remove('discovery-modal-active');
    modalEl.style.display = 'none';
  }
  const floatingContainer = document.getElementById('modal-floating-actions');
  if (floatingContainer) {
    floatingContainer.innerHTML = '';
    floatingContainer.style.display = 'none';
  }
  const oreBackdrop = document.getElementById('ore-info-backdrop');
  if (oreBackdrop) {
    oreBackdrop.style.display = 'none';
  }
  // Emergency Rescue Modal schließen (sofern nicht Game Over)
  const rescueModal = document.getElementById('emergency-rescue-modal');
  if (rescueModal && rescueModal.style.display !== 'none') {
    const scPlayer = (scene && scene.player) || (window.__game?.scene?.getScene('MiningScene')?.player);
    if (!scPlayer || !scPlayer.isGameOver) {
      if (sc && sc.emergencyRescueModal && sc.emergencyRescueModal.close) {
        sc.emergencyRescueModal.close();
      } else {
        rescueModal.style.display = 'none';
      }
    }
  }

  // Speed Dial FAB schließen falls geöffnet
  const actionFab = document.getElementById('hud-action-fab');
  if (actionFab && actionFab.classList.contains('open')) {
    actionFab.classList.remove('open');
  }

  // Tutorial schliessen falls aktiv
  const tutorialCont = document.getElementById('tutorial-container');
  if (tutorialCont && sc && sc.tutorialModal && sc.tutorialModal.close) {
    sc.tutorialModal.close();
  }

  document.body.classList.remove('modal-open');
  document.body.classList.remove('discovery-modal-open');
  document.body.classList.remove('tutorial-open');

  try {
    soundFx.stopAllLoops?.();
  } catch (_) {}

  const sc = scene || (window.__game && window.__game.scene && window.__game.scene.getScene('MiningScene'));
  if (sc) {
    sc.isPaused = false;
    if (sc.hud) {
      sc.hud.isPauseMenuOpen = false;
    }
    if (sc.baseSystem) {
      sc.baseSystem.isRefineryModalOpen = false;
      sc.baseSystem.isDepotModalOpen = false;
      if (sc.baseSystem.refineryUiInterval) {
        clearInterval(sc.baseSystem.refineryUiInterval);
        sc.baseSystem.refineryUiInterval = null;
      }
    }
  }

  try {
    soundFx.playClick();
  } catch (e) {}
}

export function isModalActive() {
  if (typeof document !== 'undefined') {
    if (document.body && (
      document.body.classList.contains('modal-open') ||
      document.body.classList.contains('discovery-modal-open') ||
      document.body.classList.contains('tutorial-open')
    )) {
      return true;
    }
    const modal = document.getElementById('building-modal');
    if (modal && modal.style && (modal.style.display === 'flex' || (modal.style.display !== 'none' && modal.style.display !== ''))) {
      return true;
    }
    const oreInfoBackdrop = document.getElementById('ore-info-backdrop');
    if (oreInfoBackdrop && oreInfoBackdrop.style && (oreInfoBackdrop.style.display === 'flex' || (oreInfoBackdrop.style.display !== 'none' && oreInfoBackdrop.style.display !== ''))) {
      return true;
    }
    const rescueModal = document.getElementById('emergency-rescue-modal');
    if (rescueModal && rescueModal.style && (rescueModal.style.display === 'flex' || (rescueModal.style.display !== 'none' && rescueModal.style.display !== ''))) {
      return true;
    }
    const tutorialCont = document.getElementById('tutorial-container');
    if (tutorialCont && tutorialCont.parentNode) {
      return true;
    }
    const actionFab = document.getElementById('hud-action-fab');
    if (actionFab && actionFab.classList.contains('open')) {
      return true;
    }
  }
  if (Date.now() - lastModalCloseTimestamp < 100) {
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
  { tier: 1, name: 'Stahl-Bohrkopf', stat: '38 DPS', cost: 0, comp: null, mountComps: null, level: 1, desc: 'Solider Bohrkopf für Humus & lockere Erde (ca. 1.2s pro Block).' },
  { tier: 2, name: 'Wolframkarbid-Spitze', stat: '52 DPS', cost: 920, comp: null, mountComps: [{ key: 'iron_tube', name: 'Stahl-Rohr', count: 1, source: 'Fabrik' }], level: 1, desc: 'Fräst spürbar flüssiger durch Erde (ca. 0.9s) und Schiefer.' },
  { tier: 3, name: 'Gehärteter Meißel Mk.III', stat: '60 DPS', cost: 3400, comp: null, mountComps: [{ key: 'bronze_gear', name: 'Bronze-Getriebe', count: 1, source: 'Fabrik' }, { key: 'capacitor', name: 'Druck-Kondensator', count: 1, source: 'Geologe' }], level: 1, desc: 'Schneidet zügig durch Stein und zerbröckelt Fels.' },
  { tier: 4, name: 'Titan-Diamant-Kopf Mk.IV', stat: '82 DPS', cost: 8800, comp: null, mountComps: [{ key: 'silver_coil', name: 'Silber-Spule', count: 2, source: 'Fabrik' }], level: 2, desc: 'Hydraulisch verstärkte Fräse zermalmt harte Granitadern.' },
  { tier: 5, name: 'Hochdruck-Fräse Mk.V', stat: '115 DPS', cost: 22000, comp: null, mountComps: [{ key: 'silver_coil', name: 'Silber-Spule', count: 1, source: 'Fabrik' }, { key: 'spectrometer', name: 'Sensor-Spektrometer', count: 1, source: 'Geologe' }], level: 3, desc: 'Panzerung und Zahnkränze fräsen mühelos durch Granit und Basalt.' },
  { tier: 6, name: 'Plasma-Schneidbrenner Mk.VI', stat: '165 DPS', cost: 48000, comp: null, mountComps: [{ key: 'crystal_lens', name: 'Kristall-Linse', count: 1, source: 'Fabrik' }, { key: 'plasma_regulator', name: 'Plasma-Injektor', count: 1, source: 'Geologe' }], level: 4, desc: 'Fokussierter Plasmastrahl schmilzt Obsidian-Gestein.' },
  { tier: 7, name: 'Laser-Kavitationsmeißel Mk.VII', stat: '240 DPS', cost: 98000, comp: null, mountComps: [{ key: 'plasma_regulator', name: 'Plasma-Injektor', count: 1, source: 'Geologe' }, { key: 'spectrometer', name: 'Sensor-Spektrometer', count: 1, source: 'Geologe' }], level: 5, desc: 'Höchste Schneidleistung für schwerste Tiefenerze.' },
  { tier: 8, name: 'Antimaterie-Bohrer Mk.VIII', stat: '350 DPS', cost: 210000, comp: null, mountComps: [{ key: 'titan_bolt', name: 'Titan-Bolzen', count: 2, source: 'Fabrik' }], level: 6, desc: 'Fräst durch das härteste Urgestein wie Butter.' },
  { tier: 9, name: 'Singularitäts-Fräse Mk.IX', stat: '500 DPS', cost: 415000, comp: null, mountComps: [{ key: 'titan_bolt', name: 'Titan-Bolzen', count: 1, source: 'Fabrik' }, { key: 'graviton_core', name: 'Gravitations-Modulator', count: 1, source: 'Geologe' }], level: 8, desc: 'Erzeugt Mikrogravitations-Kollapse vor dem Bohrkopf.' },
  { tier: 10, name: 'Tachyonen-Disruptor X', stat: '700 DPS', cost: 820000, comp: null, mountComps: [{ key: 'quantum_core', name: 'Quanten-Kern', count: 1, source: 'Fabrik' }, { key: 'quantum_processor', name: 'Quanten-Prozessor', count: 1, source: 'Geologe' }], level: 10, desc: 'Zersetzt die Molekularstruktur des Erdkerns in Sekundenbruchteilen.' }
];
export const DRILL_DPS = [38, 52, 60, 82, 115, 165, 240, 350, 500, 700];
export const DRILL_DATA = DRILL_TIERS;

// Zentrale Depot-Ausbaustufen (10 Tiers mit linear-exponentieller Kapazität)
export const DEPOT_TIERS = [
  { tier: 1, capacity: 10, costCash: 0, label: 'Kompaktes Lagerfach' },
  { tier: 2, capacity: 25, costCash: 850, label: 'Erweitertes Regallager' },
  { tier: 3, capacity: 60, costCash: 2600, costComp: { iron_tube: 1 }, compName: '1x Stahl-Rohr', label: 'Automatisierte Förderbrücke' },
  { tier: 4, capacity: 150, costCash: 6800, costComp: { bronze_gear: 1 }, compName: '1x Bronze-Getriebe', label: 'Schwergut-Containerterminal' },
  { tier: 5, capacity: 350, costCash: 16500, costComp: { bronze_gear: 2 }, compName: '2x Bronze-Getriebe', label: 'Industrie-Großlager' },
  { tier: 6, capacity: 650, costCash: 36000, costComp: { silver_coil: 2 }, compName: '2x Silber-Spule', label: 'Logistik-Zentralverteiler' },
  { tier: 7, capacity: 1000, costCash: 75000, costComp: { crystal_lens: 1 }, compName: '1x Kristall-Linse', label: 'Quanten-Kompressionslager' },
  { tier: 8, capacity: 1500, costCash: 160000, costComp: { crystal_lens: 2 }, compName: '2x Kristall-Linse', label: 'Subraum-Speicherkomplex' },
  { tier: 9, capacity: 2200, costCash: 320000, costComp: { titan_bolt: 2 }, compName: '2x Titan-Bolzen', label: 'Megaspeicher-Matrix' },
  { tier: 10, capacity: 3000, costCash: 620000, costComp: { quantum_core: 2 }, compName: '2x Quanten-Kern', label: 'Interdimensionales Zentrallager' }
];

// Zentrale Hangar-Ausbaustufen (Tank- und Reparaturrate am Oberflächen-Dock)
export const HANGAR_TIERS = [
  {
    tier: 1,
    name: 'Basis-Servicestation',
    fuelSpeed: 6,
    repairSpeed: 12,
    costCash: 0,
    costComps: null,
    desc: 'Standard-Tankanlage mit Basisausleger und manueller Schweißtechnik.'
  },
  {
    tier: 2,
    name: 'Druckluft-Schnellbetankung Mk.II',
    fuelSpeed: 12,
    repairSpeed: 24,
    costCash: 1100,
    costComps: [{ key: 'iron_tube', name: 'Stahl-Rohr', count: 1, source: 'Fabrik' }],
    desc: 'Hochdruckpumpe für doppelte Durchflussrate und verstärkte Schweißleistung.'
  },
  {
    tier: 3,
    name: 'Turbinen-Servicebrücke Mk.III',
    fuelSpeed: 20,
    repairSpeed: 40,
    costCash: 3200,
    costComps: [{ key: 'microprocessor', name: 'Mikroprozessor', count: 1, source: 'Geologe' }],
    desc: 'Mikroprozessor-gesteuerter Injektor & automatisierter Doppel-Schweißarm.'
  },
  {
    tier: 4,
    name: 'Industrie-Hochdruckdock Mk.IV',
    fuelSpeed: 35,
    repairSpeed: 68,
    costCash: 8000,
    costComps: [{ key: 'bronze_gear', name: 'Bronze-Getriebe', count: 1, source: 'Fabrik' }, { key: 'capacitor', name: 'Druck-Kondensator', count: 1, source: 'Geologe' }],
    desc: 'Industrielle Getriebepumpen und Hochspannungs-Schweißkondensatoren.'
  },
  {
    tier: 5,
    name: 'Plasma-Kompressionstankstelle Mk.V',
    fuelSpeed: 55,
    repairSpeed: 110,
    costCash: 19000,
    costComps: [{ key: 'silver_coil', name: 'Silber-Spule', count: 2, source: 'Fabrik' }],
    desc: 'Plasmabeschleunigter Kerosinfluss füllt schwere Tanks zügig wieder auf.'
  },
  {
    tier: 6,
    name: 'Nanit-Instandsetzungsdock Mk.VI',
    fuelSpeed: 85,
    repairSpeed: 170,
    costCash: 42000,
    costComps: [{ key: 'plasma_regulator', name: 'Plasma-Injektor', count: 1, source: 'Geologe' }],
    desc: 'Autonomer Naniten-Schwarm rekonstruiert Hüllenschäden in Sekundenschnelle.'
  },
  {
    tier: 7,
    name: 'Kryo-Quantenservicestation Mk.VII',
    fuelSpeed: 130,
    repairSpeed: 260,
    costCash: 85000,
    costComps: [{ key: 'crystal_lens', name: 'Kristall-Linse', count: 1, source: 'Fabrik' }, { key: 'spectrometer', name: 'Sensor-Spektrometer', count: 1, source: 'Geologe' }],
    desc: 'Kryogenische Kompression und Spektrometer-gesteuerte Molekularreparatur.'
  },
  {
    tier: 8,
    name: 'Subraum-Resonanzdock Mk.VIII',
    fuelSpeed: 190,
    repairSpeed: 380,
    costCash: 175000,
    costComps: [{ key: 'graviton_core', name: 'Gravitations-Modulator', count: 1, source: 'Geologe' }, { key: 'titan_bolt', name: 'Titan-Bolzen', count: 1, source: 'Fabrik' }],
    desc: 'Gravitationswellen-Transfer füllt auch riesige Tanks in kürzester Zeit.'
  },
  {
    tier: 9,
    name: 'Singularitäts-Dock Mk.IX',
    fuelSpeed: 280,
    repairSpeed: 550,
    costCash: 340000,
    costComps: [{ key: 'titan_bolt', name: 'Titan-Bolzen', count: 2, source: 'Fabrik' }],
    desc: 'Hyperraum-Transfertankung und simultane Hüllen-Reparatur.'
  },
  {
    tier: 10,
    name: 'Chrono-Quanten-Zentraldock X',
    fuelSpeed: 420,
    repairSpeed: 800,
    costCash: 650000,
    costComps: [{ key: 'quantum_core', name: 'Quanten-Kern', count: 1, source: 'Fabrik' }, { key: 'quantum_processor', name: 'Quanten-Prozessor', count: 1, source: 'Geologe' }],
    desc: 'Ultimative Versorgungsmatrix: Hochenergie-Betankung und augenblickliche Reparatur.'
  }
];

// Kaufbare Zusatzgebäude: Ausbaustufen 1 bis 3
export const PURCHASABLE_BUILDING_TIERS = {
  drone_hangar: [
    {
      tier: 1,
      name: 'Standard-Hangar',
      drones: 1,
      intervalSec: 18,
      capacity: 12,
      oresDesc: 'Kohle, Kupfer, Eisen, Zinn',
      ores: ['coal', 'copper', 'iron', 'tin'],
      costCash: 3800,
      costComp: { iron_tube: 4, bronze_gear: 2, microprocessor: 1 },
      desc: '1 autonome Bergbau-Drohne fördert periodisch Basis-Erze an die Oberfläche.'
    },
    {
      tier: 2,
      name: 'Drohnen-Geschwader Mk.II',
      drones: 2,
      intervalSec: 12,
      capacity: 24,
      oresDesc: '+ Silber, Gold',
      ores: ['coal', 'copper', 'iron', 'tin', 'silver', 'gold'],
      costCash: 12500,
      costComp: { iron_tube: 6, bronze_gear: 4, microprocessor: 2, capacitor: 2 },
      desc: '2 Drohnen im Dauerflug: Schnellere Schürfzyklen (12s), doppeltes Silo (24 Erze) und Silber & Gold im Suchraster.'
    },
    {
      tier: 3,
      name: 'Quanten-Drohnenmatrix Mk.III',
      drones: 3,
      intervalSec: 8,
      capacity: 40,
      oresDesc: '+ Smaragd, Rubin, Diamant, Titan',
      ores: ['coal', 'copper', 'iron', 'tin', 'silver', 'gold', 'emerald', 'ruby', 'diamond', 'titanium'],
      costCash: 38000,
      costComp: { silver_coil: 4, crystal_lens: 3, spectrometer: 2, titan_bolt: 2 },
      desc: '3 Quanten-Drohnen mit Tiefensensoren: Höchstgeschwindigkeit (8s), Großraumsilo (40 Erze) & Schürfen seltener Edelsteine und Titan.'
    }
  ],
  powerplant: [
    {
      tier: 1,
      name: 'Geothermie-Turbine I',
      cashPerTick: 65,
      fuelMult: 2.0,
      repairMult: 1.5,
      costCash: 18500,
      costComp: { iron_tube: 4, silver_coil: 4, crystal_lens: 2, capacitor: 2 },
      desc: 'Generiert +€65 alle 8s und versorgt den Hangar mit Starkstrom (2.0x Tank- & 1.5x Reparatur-Speed).'
    },
    {
      tier: 2,
      name: 'Magma-Konvektionsgenerator II',
      cashPerTick: 150,
      fuelMult: 2.5,
      repairMult: 2.0,
      costCash: 48000,
      costComp: { silver_coil: 6, crystal_lens: 4, plasma_regulator: 2, titan_bolt: 3 },
      desc: 'Mehr als verdoppelter Stromertrag (+€150 alle 8s) und beschleunigte Hangarversorgung (2.5x Tank- & 2.0x Reparatur-Speed).'
    },
    {
      tier: 3,
      name: 'Quanten-Fusionskraftwerk III',
      cashPerTick: 320,
      fuelMult: 3.5,
      repairMult: 3.0,
      costCash: 120000,
      costComp: { titan_bolt: 4, quantum_core: 2, graviton_core: 2, spectrometer: 2 },
      desc: 'Ultimative Fusionsenergie: +€320 alle 8s passiv und maximale Hangar-Ladeleistung (3.5x Tank- & 3.0x Reparatur-Speed).'
    }
  ]
};

// Expeditions-Ausrüstung, Untertage-Stationen & Notfall-Verbrauchsgüter
export const EXPEDITION_ITEMS = [
  // 1. Erzförderung (Pneumatische Förderstationen) nach 5 Schichten in 3 Preisstufen
  {
    key: 'tube_s1',
    category: 'station',
    stationType: 'tube',
    name: 'Erzförderung (Schicht 1 & 2)',
    badge: '0–180m',
    desc: 'Förderschacht für Humus & Schiefer (bis 180m). Saugt Erze direkt ins Depot ab.',
    price: 650,
    icon: 'conveyor-belt',
    minDepth: 5,
    maxDepth: 180,
    reqResearch: { track: 'station_tube', tier: 1, label: 'Förderschacht Stufe 1' }
  },
  {
    key: 'tube_s2',
    category: 'station',
    stationType: 'tube',
    name: 'Erzförderung (Schicht 3 & 4)',
    badge: '180–950m',
    desc: 'Verstärkter Förderschacht für Granit & Obsidian (180–950m). Druckfeste Rohre.',
    price: 2600,
    icon: 'conveyor-belt',
    minDepth: 5,
    maxDepth: 950,
    reqResearch: { track: 'station_tube', tier: 2, label: 'Förderschacht Stufe 2' }
  },
  {
    key: 'tube_s3',
    category: 'station',
    stationType: 'tube',
    name: 'Erzförderung (Schicht 5)',
    badge: '>950m',
    desc: 'Titan-Kernbohr-Förderschacht für Urgestein (>950m). Höchste Tiefenbeständigkeit.',
    price: 11500,
    icon: 'conveyor-belt',
    minDepth: 5,
    maxDepth: 99999,
    reqResearch: { track: 'station_tube', tier: 3, label: 'Förderschacht Stufe 3' }
  },

  // 2. Untertage-Tankanlagen nach 5 Schichten in 3 Preisstufen
  {
    key: 'fuel_s1',
    category: 'station',
    stationType: 'fuel',
    name: 'Tankanlage (Schicht 1 & 2)',
    badge: '0–180m',
    desc: 'Untertage-Tankanlage für Humus & Schiefer (bis 180m). Roboter-Betankungsarm.',
    price: 650,
    icon: 'fuel',
    minDepth: 5,
    maxDepth: 180,
    reqResearch: { track: 'station_fuel', tier: 1, label: 'Tankanlage Stufe 1' }
  },
  {
    key: 'fuel_s2',
    category: 'station',
    stationType: 'fuel',
    name: 'Tankanlage (Schicht 3 & 4)',
    badge: '180–950m',
    desc: 'Hochdruck-Tankanlage für Granit & Obsidian (180–950m). Schnelles Tiefenbetanken.',
    price: 3500,
    icon: 'fuel',
    minDepth: 5,
    maxDepth: 950,
    reqResearch: { track: 'station_fuel', tier: 2, label: 'Tankanlage Stufe 2' }
  },
  {
    key: 'fuel_s3',
    category: 'station',
    stationType: 'fuel',
    name: 'Tankanlage (Schicht 5)',
    badge: '>950m',
    desc: 'Thermo-resistente Tiefen-Tankanlage für Urgestein (>950m). Für extremste Tiefen.',
    price: 14000,
    icon: 'fuel',
    minDepth: 5,
    maxDepth: 99999,
    reqResearch: { track: 'station_fuel', tier: 3, label: 'Tankanlage Stufe 3' }
  },

  // 3. Notfall-Ausrüstung & Verbrauchsgüter
  {
    key: 'dynamite',
    category: 'gadget',
    name: 'Dynamit-Sprengsatz',
    badge: 'Sprengladung',
    desc: 'Platziert TNT im Fels. Kann mehrfach gelegt und per Touch-Aktionsbutton gezündet werden.',
    reqResearch: { track: 'tnt', tier: 1, label: 'Sprengtechnik Stufe 1' },
    price: 350,
    icon: 'bomb'
  },
  {
    key: 'fuel_canister',
    category: 'gadget',
    name: 'Notfall-Treibstoffkanister',
    badge: '+20L Tank',
    desc: 'Füllt unter Tage sofort +20L Treibstoff nach (per Touch-Aktion im Cockpit).',
    reqResearch: { track: 'emergency_gear', tier: 1, label: 'Notfallset Stufe 1' },
    price: 160,
    icon: 'fuel'
  },
  {
    key: 'repair_kit',
    category: 'gadget',
    name: 'Feld-Reparatur-Kit',
    badge: '+40 HP Hülle',
    desc: 'Repariert im Notfall sofort +40 HP Panzerung (per Touch-Aktion im Cockpit).',
    reqResearch: { track: 'emergency_gear', tier: 1, label: 'Notfallset Stufe 1' },
    price: 240,
    icon: 'wrench'
  }
];

export function isExpeditionItemResearched(player, item) {
  if (!item || !item.reqResearch) return true;
  if (!player) return false;
  const req = item.reqResearch;
  if (req.track === 'tnt') return (player.researchedTnt || 0) >= req.tier;
  if (req.track === 'emergency_gear') return (player.researchedEmergency || 0) >= req.tier;
  if (req.track === 'station_fuel') return (player.researchedStationFuel || 0) >= req.tier;
  if (req.track === 'station_tube') return (player.researchedStationTube || 0) >= req.tier;
  return true;
}

export function getAvailableStationCount(player, type, depthMeters) {
  const g = player?.gadgets || {};
  const isTube = (type === 'tube' || type === 'pneumatic');
  if (depthMeters == null || depthMeters <= 0) {
    if (isTube) {
      return (g.tube_s1 || 0) + (g.tube_s2 || 0) + (g.tube_s3 || 0);
    } else {
      return (g.fuel_s1 || 0) + (g.fuel_s2 || 0) + (g.fuel_s3 || 0);
    }
  }

  if (isTube) {
    if (depthMeters <= 180) {
      return (g.tube_s1 || 0) + (g.tube_s2 || 0) + (g.tube_s3 || 0);
    } else if (depthMeters <= 950) {
      return (g.tube_s2 || 0) + (g.tube_s3 || 0);
    } else {
      return (g.tube_s3 || 0);
    }
  } else {
    if (depthMeters <= 180) {
      return (g.fuel_s1 || 0) + (g.fuel_s2 || 0) + (g.fuel_s3 || 0);
    } else if (depthMeters <= 950) {
      return (g.fuel_s2 || 0) + (g.fuel_s3 || 0);
    } else {
      return (g.fuel_s3 || 0);
    }
  }
}

export function getUsableStationKey(player, type, depthMeters) {
  const g = player?.gadgets || {};
  const isTube = (type === 'tube' || type === 'pneumatic');
  if (isTube) {
    if (depthMeters <= 180) {
      if ((g.tube_s1 || 0) > 0) return 'tube_s1';
      if ((g.tube_s2 || 0) > 0) return 'tube_s2';
      if ((g.tube_s3 || 0) > 0) return 'tube_s3';
    } else if (depthMeters <= 950) {
      if ((g.tube_s2 || 0) > 0) return 'tube_s2';
      if ((g.tube_s3 || 0) > 0) return 'tube_s3';
    } else {
      if ((g.tube_s3 || 0) > 0) return 'tube_s3';
    }
    return null;
  } else {
    if (depthMeters <= 180) {
      if ((g.fuel_s1 || 0) > 0) return 'fuel_s1';
      if ((g.fuel_s2 || 0) > 0) return 'fuel_s2';
      if ((g.fuel_s3 || 0) > 0) return 'fuel_s3';
    } else if (depthMeters <= 950) {
      if ((g.fuel_s2 || 0) > 0) return 'fuel_s2';
      if ((g.fuel_s3 || 0) > 0) return 'fuel_s3';
    } else {
      if ((g.fuel_s3 || 0) > 0) return 'fuel_s3';
    }
    return null;
  }
}

// Spezial-Upgrade-Bauteile (Auftragsbelohnungen & Montagebauteile)
export const COMPONENT_DATA = {
  // Fabrik-Montagebauteile (Mechanik & Struktur)
  iron_tube: { name: 'Stahl-Rohr', icon: 'cylinder', color: '#94a3b8' },
  bronze_gear: { name: 'Bronze-Getriebe', icon: 'settings', color: '#d97706' },
  silver_coil: { name: 'Silber-Spule', icon: 'rotate-ccw', color: '#e2e8f0' },
  crystal_lens: { name: 'Kristall-Linse', icon: 'aperture', color: '#a78bfa' },
  titan_bolt: { name: 'Titan-Bolzen', icon: 'bolt', color: '#38bdf8' },
  quantum_core: { name: 'Quanten-Kern', icon: 'orbit', color: '#34d399' },
  // Forscher- / Geologen-Elektronik & High-Tech-Bauteile
  microprocessor: { name: 'Mikroprozessor', icon: 'cpu', color: '#60a5fa' },
  capacitor: { name: 'Druck-Kondensator', icon: 'battery-charging', color: '#fbbf24' },
  spectrometer: { name: 'Sensor-Spektrometer', icon: 'activity', color: '#c084fc' },
  plasma_regulator: { name: 'Plasma-Injektor', icon: 'flame', color: '#f87171' },
  graviton_core: { name: 'Gravitations-Modulator', icon: 'compass', color: '#38bdf8' },
  quantum_processor: { name: 'Quanten-Prozessor', icon: 'atom', color: '#a78bfa' },
  // Abwärtskompatibilität für alte Spielstände
  hydraulic_part: { name: 'Hydraulik-Zylinder', icon: 'cog', color: '#38bdf8' },
  titan_alloy: { name: 'Titan-Legierung', icon: 'shield-check', color: '#60a5fa' },
  laser_lens: { name: 'Kristall-Fokuslinse', icon: 'disc', color: '#c084fc' },
  quantum_chip: { name: 'Quanten-Steuerkern', icon: 'atom', color: '#34d399' }
};

// Steinsammler- / Geologen-Aufträge (Tiefenstufen 0-2000m+)
export const GEOLOGIST_QUESTS = [
  {
    id: 'geologist_microprocessor',
    title: 'Humus- & Sedimentforschung I',
    depthHint: 'Tiefe 0-50m (Humus)',
    reqs: { coal: 3, iron: 2 },
    rewardComp: { key: 'microprocessor', name: 'Mikroprozessor', iconName: 'cpu' },
    rewardCash: 180,
    rewardXp: 140,
    minLevel: 1
  },
  {
    id: 'geologist_capacitor',
    title: 'Schiefer-Mineralogie II',
    depthHint: 'Tiefe 30-150m (Schiefer)',
    reqs: { copper: 3, tin: 3 },
    rewardComp: { key: 'capacitor', name: 'Druck-Kondensator', iconName: 'battery-charging' },
    rewardCash: 420,
    rewardXp: 300,
    minLevel: 1
  },
  {
    id: 'geologist_spectrometer',
    title: 'Tiefengranit-Kristallographie III',
    depthHint: 'Tiefe 130-350m (Granit)',
    reqs: { silver: 3, gold: 2 },
    rewardComp: { key: 'spectrometer', name: 'Sensor-Spektrometer', iconName: 'activity' },
    rewardCash: 950,
    rewardXp: 650,
    minLevel: 2
  },
  {
    id: 'geologist_plasma_regulator',
    title: 'Vulkanische Obsidian-Petrologie IV',
    depthHint: 'Tiefe 340-800m (Obsidian)',
    reqs: { emerald: 2, sapphire: 2 },
    rewardComp: { key: 'plasma_regulator', name: 'Plasma-Injektor', iconName: 'flame' },
    rewardCash: 2200,
    rewardXp: 1300,
    minLevel: 3
  },
  {
    id: 'geologist_graviton_core',
    title: 'Basalt-Geophysik & Tiefenseismik V',
    depthHint: 'Tiefe 850m+ (Urgestein)',
    reqs: { titanium: 2, diamond: 1 },
    rewardComp: { key: 'graviton_core', name: 'Gravitations-Modulator', iconName: 'compass' },
    rewardCash: 4200,
    rewardXp: 2200,
    minLevel: 5
  },
  {
    id: 'geologist_quantum_processor',
    title: 'Isotopen-Geochemie & Erdkern-Geologie VI',
    depthHint: 'Tiefe 1.500m+ (Erdkern)',
    reqs: { uranium: 2, platinum: 1 },
    rewardComp: { key: 'quantum_processor', name: 'Quanten-Prozessor', iconName: 'atom' },
    rewardCash: 8500,
    rewardXp: 4200,
    minLevel: 7
  },
  {
    id: 'geologist_amethyst_bonus',
    title: 'Mantelgesteins-Kristallisation VII',
    depthHint: 'Tiefe 1.000-1.500m (Urgestein)',
    reqs: { obsidian_gem: 2, sapphire: 2 },
    rewardComp: { key: 'graviton_core', name: 'Gravitations-Modulator', iconName: 'compass' },
    rewardCash: 6000,
    rewardXp: 3200,
    minLevel: 6
  },
  {
    id: 'geologist_darkmatter_bonus',
    title: 'Planetares Gravitationsfeld & Tiefen-Astrophysik VIII',
    depthHint: 'Tiefe 2.000m+ (Erdkern)',
    reqs: { dark_matter: 1, platinum: 2 },
    rewardComp: { key: 'quantum_processor', name: 'Quanten-Prozessor', iconName: 'atom' },
    rewardCash: 16000,
    rewardXp: 8000,
    minLevel: 9
  }
];

// Fabrik-Maschinen Ausbaustufen (Schaltet Fertigung mit tieferen Erzen frei)
export const REFINERY_MACHINE_TIERS = [
  { tier: 1, name: 'Standard-Maschine', costCash: 0, desc: 'Einfache Bauteile aus Eisen, Kupfer und Zinn.' },
  { tier: 2, name: 'Präzisions-Werkbank Mk.II', costCash: 1500, desc: 'Elektronik-Platinen & Silber-Spulen (Silber, Gold).' },
  { tier: 3, name: 'Kristall-Schleifer Mk.III', costCash: 5000, desc: 'Saphir-Panzerglas, Schmuck-Diamanten & Kristall-Linsen (Saphir, Smaragd, Rubin).' },
  { tier: 4, name: 'Tiefsee-Schmiede Mk.IV', costCash: 15000, desc: 'Titan-Panzerungen & Titan-Bolzen (Titan, Diamant, Platin).' },
  { tier: 5, name: 'Quanten-Assembler V', costCash: 45000, desc: 'Obsidian-Superleiter, Quanten-Brennstäbe & Quanten-Kerne (Obsidian, Uran, Dunkelmaterie).' }
];

// Fabrik-Produkte (Industrielle Werkstoffe mit hohem Börsenwert & Montagebauteile)
// Jedes Handelsgut benötigt zusätzlich 2x Kohle als Prozesshitze/Brennstoff
export const FACTORY_PRODUCTS = {
  // ── 1. Industrielle Handelsgüter (Börsen-Verkauf mit hohem Gewinn) ──
  steel_beam: {
    id: 'steel_beam',
    name: 'Stahlträger',
    desc: 'Schwerer Baustahl für Schachtgerüste und Industrie. Aus 2x Eisen + 2x Kohle geschmiedet.',
    iconName: 'circle-pile',
    recipe: { iron: 2, coal: 2 },
    fuelCoal: 2,
    minTier: 1,
    durationSec: 45,
    value: 280
  },
  bronze_ingot: {
    id: 'bronze_ingot',
    name: 'Bronze-Barren',
    desc: 'Korrosionsfreie Legierung für Schiffbau und Maschinenbau. Gegossen aus 2x Kupfer + 1x Zinn.',
    iconName: 'layers',
    recipe: { copper: 2, tin: 1 },
    fuelCoal: 2,
    minTier: 1,
    durationSec: 55,
    value: 360
  },
  circuit_board: {
    id: 'circuit_board',
    name: 'Elektronik-Platine',
    desc: 'Hochintegrierte Leiterplatte mit Zinn-Lötbahnen und Gold-Kontakten.',
    iconName: 'cpu',
    recipe: { copper: 2, tin: 1, gold: 1 },
    fuelCoal: 2,
    minTier: 2,
    durationSec: 110,
    value: 1150
  },
  sapphire_glass: {
    id: 'sapphire_glass',
    name: 'Saphir-Panzerglas',
    desc: 'Kratzfestes und hochdruckstabiles Panzerglas aus Saphirkristallen und Feinsilber.',
    iconName: 'shield',
    recipe: { sapphire: 2, silver: 1 },
    fuelCoal: 2,
    minTier: 3,
    durationSec: 160,
    value: 2300
  },
  polished_gem: {
    id: 'polished_gem',
    name: 'Schmuck-Diamant',
    desc: 'Präzisionsgeschliffener Dreifach-Edelstein aus Smaragd, Rubin und Diamant.',
    iconName: 'gem',
    recipe: { emerald: 1, ruby: 1, diamond: 1 },
    fuelCoal: 2,
    minTier: 3,
    durationSec: 200,
    value: 4400
  },
  titan_plate: {
    id: 'titan_plate',
    name: 'Titan-Panzerung',
    desc: 'Hitzebeständige Panzerplatte mit Diamant-Partikelbeschichtung für Tiefsee- und Hochdruckrümpfe.',
    iconName: 'shield-check',
    recipe: { titanium: 2, diamond: 1 },
    fuelCoal: 2,
    minTier: 4,
    durationSec: 300,
    value: 9800
  },
  obsidian_matrix: {
    id: 'obsidian_matrix',
    name: 'Obsidian-Superleiter',
    desc: 'Hochdichte vulkanische Kristallmatrix mit Platin-Leiterbahnen für extremste Energiedichten.',
    iconName: 'disc',
    recipe: { obsidian_gem: 1, platinum: 2 },
    fuelCoal: 2,
    minTier: 5,
    durationSec: 400,
    value: 19500
  },
  fusion_rod: {
    id: 'fusion_rod',
    name: 'Quanten-Brennstab',
    desc: 'Hochenergetischer Nuklear-Brennstab aus radioaktivem Uran und stabilisierter Dunkelmaterie.',
    iconName: 'zap',
    recipe: { uranium: 2, dark_matter: 1 },
    fuelCoal: 2,
    minTier: 5,
    durationSec: 480,
    value: 32000
  },

  // ── 2. Montage-Bauteile (für Hangar-Fahrzeug-Upgrades) ──
  iron_tube: {
    id: 'iron_tube',
    name: 'Stahl-Rohr',
    desc: 'Nahtlos gezogenes Hochdruckrohr für Tier-2-Module. Aus 2x Eisen + 1x Kupfer gefertigt.',
    iconName: 'pipe',
    recipe: { iron: 2, copper: 1 },
    fuelCoal: 0,
    minTier: 1,
    durationSec: 40,
    value: 0,
    isComponent: true,
    compKey: 'iron_tube'
  },
  bronze_gear: {
    id: 'bronze_gear',
    name: 'Bronze-Getriebe',
    desc: 'Präzisionszahnrad für Tier-3-Mechanik. Gefertigt aus 2x Zinn + 1x Eisen (Zahnkranz & Achse).',
    iconName: 'settings',
    recipe: { tin: 2, iron: 1 },
    fuelCoal: 0,
    minTier: 1,
    durationSec: 50,
    value: 0,
    isComponent: true,
    compKey: 'bronze_gear'
  },
  silver_coil: {
    id: 'silver_coil',
    name: 'Silber-Spule',
    desc: 'Induktionsspule für Tier-4-5-Elektronik. Feines Silber mit isolierendem Feingold gewickelt.',
    iconName: 'rotate-ccw',
    recipe: { silver: 2, gold: 1 },
    fuelCoal: 0,
    minTier: 2,
    durationSec: 90,
    value: 0,
    isComponent: true,
    compKey: 'silver_coil'
  },
  crystal_lens: {
    id: 'crystal_lens',
    name: 'Kristall-Linse',
    desc: 'Prismatische Zweifarben-Linse für Tier-6-7-Sensorik. Aus 1x Saphir + 1x Smaragd geschliffen.',
    iconName: 'aperture',
    recipe: { sapphire: 1, emerald: 1 },
    fuelCoal: 0,
    minTier: 3,
    durationSec: 160,
    value: 0,
    isComponent: true,
    compKey: 'crystal_lens'
  },
  titan_bolt: {
    id: 'titan_bolt',
    name: 'Titan-Bolzen',
    desc: 'Extrem zugfester Gewindebolzen für Tier-8-9-Chassis. Aus 2x Titan + 1x Platin legiert.',
    iconName: 'bolt',
    recipe: { titanium: 2, platinum: 1 },
    fuelCoal: 0,
    minTier: 4,
    durationSec: 240,
    value: 0,
    isComponent: true,
    compKey: 'titan_bolt'
  },
  quantum_core: {
    id: 'quantum_core',
    name: 'Quanten-Kern',
    desc: 'Subatomarer Gravitationskern für Tier-10-Technologie. Aus 1x Uran + 1x Obsidian-Kern synthetisiert.',
    iconName: 'orbit',
    recipe: { uranium: 1, obsidian_gem: 1 },
    fuelCoal: 0,
    minTier: 5,
    durationSec: 360,
    value: 0,
    isComponent: true,
    compKey: 'quantum_core'
  }
};

export class BaseSystem {
  constructor(scene, player, missionSystem) {
    this.scene = scene;
    this.player = player;
    this.missionSystem = missionSystem;

    // Börsen-Boom Event System
    this.activeBoom = null;
    this.boomTimer = 0;

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
        tier: 1,
        maxTier: 3,
        costCash: PURCHASABLE_BUILDING_TIERS.drone_hangar[0].costCash,
        costComp: PURCHASABLE_BUILDING_TIERS.drone_hangar[0].costComp,
        isBuilt: false,
        storedOres: ['coal', 'copper'],
        timer: 0,
        action: () => this.openDroneModal()
      },

      {
        id: 'powerplant',
        title: 'KRAFTWERK',
        label: 'KRAFTWERK',
        iconName: 'zap',
        desc: 'Generiert passives Einkommen (+€65 alle 8s) und verdoppelt die Basis-Auftankgeschwindigkeit.',
        spriteKey: 'building_powerplant',
        gx: 42,
        height: 76,
        tier: 1,
        maxTier: 3,
        costCash: PURCHASABLE_BUILDING_TIERS.powerplant[0].costCash,
        costComp: PURCHASABLE_BUILDING_TIERS.powerplant[0].costComp,
        isBuilt: false,
        timer: 0,
        accumulatedCash: 0,
        action: () => this.openPowerplantModal()
      }
    ];

    this.modalEl = document.getElementById('building-modal');
    this.modalTitleEl = document.getElementById('modal-title');
    this.modalBodyEl = document.getElementById('modal-body');

    // Raffinerie-Zustand (Berechnung über Geräte-Uhrzeit, auch offline)
    this.refinery = {
      queue: [], // [{ id, ore, name, durationMs, remainingMs, value }]
      finished: [], // [{ id, ore, name, value, finishedAt }]
      lastTimestamp: Date.now(),
      fuelCoal: 0,   // Manuell geladene Kohle in der Brennkammer
      machineTier: 1 // Ausbaustufe der Industrie-Maschine (1-5)
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
    // Hangar-Ausbaustufe (1-10) für Betankungs- und Reparaturrate
    this.hangarTier = 1;

    // Unterirdische Infrastruktur (Frei platzierbare Förder-Schächte & Geothermie-Zapfsäulen)
    this.subsurfaceStations = [];
    this.activeStationAction = null;
    this.geothermalAudioTimer = 0;
    this.worldLabelsList = [];
    this.worldLabelsContainer = null;

    this.initWorldLabelsLayer();
    this.initWorldSprites();
    this.initPurchasableWorldSprites();
    this.initSubsurfaceStations();
    this.initSurfaceVisualUpgrades();
    this.initSteinsammler();
    this.initSmokeParticles();
    this.initEvents();
  }

  initWorldLabelsLayer() {
    this.worldLabelsList = [];
    let container = document.getElementById('world-labels-layer');
    if (!container) {
      const gameContainer = document.getElementById('game-container') || document.body;
      container = document.createElement('div');
      container.id = 'world-labels-layer';
      container.style.cssText = 'position: absolute; inset: 0; pointer-events: none; overflow: hidden; z-index: 6;';
      gameContainer.appendChild(container);
    }
    container.innerHTML = '';
    this.worldLabelsContainer = container;

    // Post-update Hook: Garantiert, dass die Labels NACH dem Phaser CameraManager
    // auf den exakten Frame-Stand des Viewports positioniert werden (0ms Lag, absolut wackelfrei)
    if (this.scene && this.scene.events && !this._hasPostUpdateListener) {
      this._hasPostUpdateListener = true;
      this.scene.events.on('postupdate', () => this.updateWorldLabels());
    }
  }

  createWorldLabel(worldX, worldY, text, color = '#ffffff', onClick = null) {
    if (!this.worldLabelsContainer || !this.worldLabelsContainer.parentNode) {
      this.initWorldLabelsLayer();
    }

    const el = document.createElement('div');
    el.className = 'world-badge-label';
    el.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      font-family: "Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 11.5px;
      font-weight: 800;
      letter-spacing: 0.5px;
      color: ${color};
      background: transparent !important;
      border: none !important;
      box-shadow: none !important;
      padding: 0 !important;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
      white-space: nowrap;
      user-select: none;
      pointer-events: auto;
      cursor: ${onClick ? 'pointer' : 'default'};
      display: none;
      transform: translate3d(-9999px, -9999px, 0) translate(-50%, -50%);
      transition: none !important;
      will-change: transform;
    `;
    el.textContent = text;

    if (onClick) {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        if (typeof isModalActive === 'function' && isModalActive()) return;
        onClick();
      });
      el.addEventListener('pointerdown', (e) => e.stopPropagation());
    }

    this.worldLabelsContainer.appendChild(el);

    const labelObj = {
      worldX,
      worldY,
      el,
      setText: (newText) => {
        el.textContent = newText;
      },
      setColor: (newColor) => {
        el.style.color = newColor;
      },
      setY: (newY) => {
        labelObj.worldY = newY;
      },
      setX: (newX) => {
        labelObj.worldX = newX;
      },
      destroy: () => {
        if (el.parentNode) el.parentNode.removeChild(el);
        if (this.worldLabelsList) {
          const idx = this.worldLabelsList.indexOf(labelObj);
          if (idx !== -1) this.worldLabelsList.splice(idx, 1);
        }
      }
    };

    if (!this.worldLabelsList) this.worldLabelsList = [];
    this.worldLabelsList.push(labelObj);
    return labelObj;
  }

  updateWorldLabels() {
    if (!this.worldLabelsList || this.worldLabelsList.length === 0) return;
    const cam = this.scene?.cameras?.main;
    if (!cam || !cam.worldView) return;
    const wv = cam.worldView;
    const zoom = cam.zoom;
    const cw = cam.width;
    const ch = cam.height;

    for (let i = 0; i < this.worldLabelsList.length; i++) {
      const lbl = this.worldLabelsList[i];
      const sx = (lbl.worldX - wv.x) * zoom;
      const sy = (lbl.worldY - wv.y) * zoom;
      if (sx < -140 || sx > cw + 140 || sy < -80 || sy > ch + 80) {
        if (lbl.el.style.display !== 'none') lbl.el.style.display = 'none';
      } else {
        if (lbl.el.style.display !== 'block') lbl.el.style.display = 'block';
        lbl.el.style.transform = `translate3d(${sx.toFixed(1)}px, ${sy.toFixed(1)}px, 0) translate(-50%, -50%)`;
      }
    }
  }

  initWorldSprites() {
    this.buildings.forEach((b) => {
      const px = b.gx * TILE_SIZE;
      const py = 0; // Graslinie y = 0

      const sprite = this.scene.add.image(px, py, b.spriteKey)
        .setDepth(4)
        .setOrigin(0.5, 1.0)
        .setInteractive({ useHandCursor: true });

      const onTrigger = (pointer) => {
        if (isModalActive()) return;
        const canvas = this.scene.game?.canvas;
        if (pointer && pointer.event) {
          const target = pointer.event.target;
          if (target && canvas && target !== canvas) {
            return;
          }
          if (target && target.closest && target.closest('#building-modal, .modal-backdrop, .modal-window, #ore-info-backdrop, #hud-overlay, #hud-action-fab, .hud-card, button, input, #toast-container')) {
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

      const label = b.label || b.title;
      const text = this.createWorldLabel(px, -b.height - 14, label, '#ffffff', () => onTrigger());

      sprite.on('pointerdown', onTrigger);

      b.sprite = sprite;
      b.textLabel = text;

      // Sprechblase über dem Büro für den Steinforscher (wenn neuer Auftrag oder Abgabe bereit)
      if (b.id === 'office') {
        const bubbleX = px;
        const bubbleY = -b.height - 30;
        this.officeBubble = this.scene.add.image(bubbleX, bubbleY, 'speech_bubble')
          .setDepth(22)
          .setOrigin(0.5, 0.5)
          .setVisible(false)
          .setInteractive({ useHandCursor: true });

        this.scene.tweens.add({
          targets: this.officeBubble,
          y: '-=4',
          yoyo: true,
          repeat: -1,
          duration: 900,
          ease: 'Sine.easeInOut'
        });

        const onTriggerOfficeBubble = (pointer) => {
          if (isModalActive()) return;
          const canvas = this.scene.game?.canvas;
          if (pointer && pointer.event) {
            const target = pointer.event.target;
            if (target && canvas && target !== canvas) return;
            if (target && target.closest && target.closest('#building-modal, .modal-backdrop, .modal-window, #ore-info-backdrop, #hud-overlay, #hud-action-fab, .hud-card, button, input, #toast-container')) {
              return;
            }
          }
          if (this.scene.hud && this.scene.hud.missionsModal) {
            this.scene.hud.missionsModal.open('geologist');
          }
        };

        this.officeBubble.on('pointerdown', onTriggerOfficeBubble);
      }
    });

    this.updateOfficeBubble();

    this.updateHangarBuildingLabel();
    this.updateBuildingVisuals();

    // Feste Gruben-Überdachung beim Minen-Schachteinstieg (gx: 19..20, x=640)
    const entranceX = 20 * TILE_SIZE;
    this.scene.add.image(entranceX, 0, 'building_mine_entrance')
      .setDepth(11) // Über dem Bohrfahrzeug (Tiefe 10)
      .setOrigin(0.5, 1.0);

    const entranceText = this.createWorldLabel(entranceX, -56, 'SCHACHTEINGANG', '#ffffff');
  }

  initPurchasableWorldSprites() {
    this.purchasableBuildings.forEach((pb) => {
      const px = pb.gx * TILE_SIZE;
      const py = 0;

      const sprite = this.scene.add.image(px, py, pb.isBuilt ? pb.spriteKey : 'building_plot')
        .setDepth(4)
        .setOrigin(0.5, 1.0)
        .setInteractive({ useHandCursor: true });

      const tierStr = (pb.isBuilt && (pb.tier || 1) > 1) ? ` Lvl ${pb.tier}` : '';
      const labelText = pb.isBuilt ? `${pb.label || pb.title}${tierStr}` : `BAUPLATZ: ${pb.label || pb.title}`;
      const textColor = pb.isBuilt ? '#ffffff' : '#fb923c';

      const onTriggerPb = (pointer) => {
        if (isModalActive()) return;
        const canvas = this.scene.game?.canvas;
        if (pointer && pointer.event) {
          const target = pointer.event.target;
          if (target && canvas && target !== canvas) {
            return;
          }
          if (target && target.closest && target.closest('#building-modal, .modal-backdrop, .modal-window, #ore-info-backdrop, #hud-overlay, #hud-action-fab, .hud-card, button, input, #toast-container')) {
            return;
          }
        }
        if (!pb.isBuilt) {
          this.openBuildModal(pb);
        } else {
          pb.action();
        }
      };

      const text = this.createWorldLabel(px, -pb.height - 14, labelText, textColor, () => onTriggerPb());

      sprite.on('pointerdown', onTriggerPb);

      pb.sprite = sprite;
      pb.textLabel = text;
    });
  }

  initSteinsammler() {
    // Steinforscher ist nun dauerhaft im Büro integriert (kein NPC-Sprite mehr auf der Oberfläche)
  }

  updateOfficeBubble() {
    if (!this.officeBubble) return;
    const shouldShow = this.hasGeologistNotification();
    this.officeBubble.setVisible(shouldShow);
  }

  hasGeologistNotification() {
    if (!this.player) return false;
    const p = this.player;
    if (!p.seenGeologistQuests) {
      p.seenGeologistQuests = new Set();
    }

    const visibleQuests = GEOLOGIST_QUESTS.filter(q =>
      Object.keys(q.reqs).every(ore => p.isOreDiscovered(ore))
    );

    if (visibleQuests.length === 0) return false;

    // 1. Gibt es einen neuen Auftrag, der im Büro noch nicht angesehen wurde?
    const hasUnseen = visibleQuests.some(q => !p.seenGeologistQuests.has(q.id));
    if (hasUnseen) return true;

    // 2. Kann ein Auftrag aktuell abgegeben werden (Erze im Frachtraum oder Depot vorhanden)?
    const cargoCounts = {};
    if (Array.isArray(p.cargo)) {
      p.cargo.forEach(ore => {
        cargoCounts[ore] = (cargoCounts[ore] || 0) + 1;
      });
    }
    const depotOres = this.depot?.ores || {};

    const canFulfill = visibleQuests.some(q => {
      return Object.entries(q.reqs).every(([ore, needed]) => {
        const total = (cargoCounts[ore] || 0) + (depotOres[ore] || 0);
        return total >= needed;
      });
    });

    return canFulfill;
  }

  initSmokeParticles() {
    // Rauch aus Schornsteinen der Fabrik
    const factoryB = this.buildings.find(b => b.id === 'factory');
    const refX = (factoryB ? factoryB.gx : 26) * TILE_SIZE;
    const refY = -70;

    this.factorySmokeEmitter = this.scene.add.particles(refX - 22, refY, 'particle_smoke', {
      speedY: { min: -18, max: -36 },
      speedX: { min: 3, max: 10 },
      scale: { start: 0.5, end: 1.4 },
      alpha: { start: 0.45, end: 0 },
      lifespan: 1400,
      frequency: 240
    }).setDepth(3);
  }

  initEvents() {

    if (this.modalEl) {
      // Verhindert das Durchklicken auf Canvas und Objekte hinter dem Modal
      const blockEvents = ['pointerdown', 'pointerup', 'pointermove', 'mousedown', 'mouseup', 'touchstart', 'touchend'];
      blockEvents.forEach((evt) => {
        this.modalEl.addEventListener(evt, (e) => {
          e.stopPropagation();
        });
      });

      this.modalEl.addEventListener('click', (e) => {
        if (e.target === this.modalEl) {
          closeActiveModal(this.scene);
        }
        e.stopPropagation();
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

    this.scene.events.on('player_level_up', () => {
      this.updateBuildingVisuals();
    });
    this.scene.events.on('player_updated', () => {
      this.updateBuildingVisuals();
    });
  }

  update(delta) {
    const dt = delta / 1000;
    this.updateWorldLabels();

    // Steinforscher Sprechblase über dem Büro aktualisieren
    this.updateOfficeBubble();

    // Kaufbare Gebäude Ticks
    this.purchasableBuildings.forEach((pb) => {
      if (!pb.isBuilt) return;

      // 1. Drohnen-Hangar: Bringt periodisch Erze je nach Ausbaustufe (Lvl 1-3)
      if (pb.id === 'drone_hangar') {
        const curTier = Math.max(1, Math.min(3, pb.tier || 1));
        const tierData = PURCHASABLE_BUILDING_TIERS.drone_hangar[curTier - 1];
        const interval = tierData?.intervalSec || 18;
        const maxCapacity = tierData?.capacity || 12;
        const oreCandidates = tierData?.ores || ['coal', 'copper', 'iron', 'tin'];

        pb.timer = (pb.timer || 0) + dt;
        if (pb.timer >= interval) {
          pb.timer = 0;
          const picked = oreCandidates[Math.floor(Math.random() * oreCandidates.length)];
          pb.storedOres = pb.storedOres || [];
          if (pb.storedOres.length < maxCapacity) {
            pb.storedOres.push(picked);
          }
        }
      }

      // 2. Geothermie-Kraftwerk: Passiver Stromertrag je nach Ausbaustufe (Lvl 1-3)
      if (pb.id === 'powerplant') {
        const curTier = Math.max(1, Math.min(3, pb.tier || 1));
        const tierData = PURCHASABLE_BUILDING_TIERS.powerplant[curTier - 1];
        const income = tierData?.cashPerTick || 65;

        pb.timer = (pb.timer || 0) + dt;
        if (pb.timer >= 8) {
          pb.timer = 0;
          this.player.cash += income;
          pb.accumulatedCash = (pb.accumulatedCash || 0) + income;
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

    // 4. Börsen-Boom Event Timer (alle 5 Minuten 180s Boom auf zufälliges Erz)
    if (!this.activeBoom) {
      this.boomTimer = (this.boomTimer || 0) + delta;
      if (this.boomTimer >= 300000) { // 5 Minuten
        this.boomTimer = 0;
        const candidates = ['coal', 'copper', 'iron', 'tin', 'silver', 'gold', 'emerald'];
        const picked = candidates[Math.floor(Math.random() * candidates.length)];
        this.activeBoom = {
          oreKey: picked,
          remainingMs: 180000 // 3 Minuten
        };
        soundFx.playPurchase();
        const oreName = ORE_DATA[picked]?.name || picked;
        this.scene.hud?.showToast(`📈 BÖRSEN-BOOM! Hohe Industrienachfrage nach ${oreName}: 2x Verkaufspreis an der Börse!`, 'success');
      }
    } else {
      this.activeBoom.remainingMs -= delta;
      if (this.activeBoom.remainingMs <= 0) {
        const endName = ORE_DATA[this.activeBoom.oreKey]?.name || this.activeBoom.oreKey;
        this.activeBoom = null;
        this.scene.hud?.showToast(`📉 Börsen-Boom für ${endName} ist beendet. Preise normalisieren sich.`, 'info');
      }
    }

    // 5. Unterirdische Basislager & Stationen (Förderschächte & Geothermie-Zapfsäulen)
    this.updateSubsurfaceStations(delta);
  }

  initSubsurfaceStations() {
    if (!this.subsurfaceStations) this.subsurfaceStations = [];
    this.subsurfaceStations.forEach(st => {
      if (st.isBuilt && !st.sprite) {
        this.spawnStationInWorld(st);
      }
    });
  }

  initSurfaceVisualUpgrades() {
    this.surfaceVisuals = {
      lanterns: []
    };

    // Neon-Laternen entlang des Werksgeländes (ohne Bodenkreis)
    const lanternGXs = [-13, -6, 0, 6, 12, 17, 24, 31, 39];
    lanternGXs.forEach(lgx => {
      const lx = lgx * TILE_SIZE;
      const lantern = this.scene.add.image(lx, 0, 'surface_lantern')
        .setOrigin(0.5, 1.0)
        .setDepth(4.4)
        .setVisible(false);

      this.surfaceVisuals.lanterns.push(lantern);
    });

    this.updateSurfaceVisuals();
    this.updateBuildingVisuals();
  }

  updateSurfaceVisuals() {
    if (!this.surfaceVisuals) return;
    const hTier = this.hangarTier || 1;
    const builtPurchasedCount = (this.purchasableBuildings || []).filter(b => b.isBuilt).length;

    // Neon-Laternen ab Hangar Tier >= 4 oder 2 Bauwerken
    const showLanterns = hTier >= 4 || builtPurchasedCount >= 2;
    this.surfaceVisuals.lanterns.forEach(lantern => {
      lantern.setVisible(showLanterns);
    });
  }

  updateBuildingVisuals() {
    if (!this.buildings) return;

    const hTier = this.hangarTier || 1;
    const dTier = this.depot?.tier || 1;
    const fTier = this.refinery?.machineTier || 1;
    const resTier = this.player?.researchedDrillTier || (this.player?.drillTier || 1);

    this.buildings.forEach((b) => {
      let key = b.spriteKey;
      let height = b.height || 70;

      if (b.id === 'dock') {
        if (hTier === 1) {
          key = 'building_dock_t1';
          height = 42;
        } else if (hTier <= 4) {
          key = 'building_dock_t2';
          height = 56;
        } else {
          key = 'building_dock';
          height = 72;
        }
      } else if (b.id === 'depot') {
        if (dTier === 1) {
          key = 'building_depot_t1';
          height = 40;
        } else if (dTier <= 3) {
          key = 'building_depot_t2';
          height = 54;
        } else if (dTier <= 5) {
          key = 'building_depot_t3';
          height = 62;
        } else {
          key = 'building_depot';
          height = 70;
        }
      } else if (b.id === 'factory') {
        if (fTier === 1) {
          key = 'building_factory_t1';
          height = 42;
        } else if (fTier === 2) {
          key = 'building_factory_t2';
          height = 56;
        } else if (fTier === 3) {
          key = 'building_factory_t3';
          height = 64;
        } else {
          key = 'building_factory';
          height = 72;
        }
      } else if (b.id === 'lab') {
        key = 'building_lab';
        height = 72;
      } else if (b.id === 'market') {
        // Nicht ausbaubar: von Anfang an wie ursprünglich
        key = 'building_market';
        height = 68;
      } else if (b.id === 'office') {
        // Nicht ausbaubar: von Anfang an wie ursprünglich
        key = 'building_office';
        height = 70;
      }

      if (b.sprite) {
        if (b.sprite.texture.key !== key) {
          b.sprite.setTexture(key);
        }
        b.currentHeight = height;
        if (b.textLabel) {
          b.textLabel.setY(-height - 14);
        }
      }
    });

    // Fabrik-Rauch dynamisch an Schornstein der aktuellen Fabrik-Stufe anpassen
    if (this.factorySmokeEmitter) {
      const factoryB = this.buildings.find(b => b.id === 'factory');
      const refX = (factoryB ? factoryB.gx : 26) * TILE_SIZE;
      if (fTier === 1) {
        this.factorySmokeEmitter.setPosition(refX + 13, -39);
      } else if (fTier === 2) {
        this.factorySmokeEmitter.setPosition(refX + 19, -54);
      } else if (fTier === 3) {
        this.factorySmokeEmitter.setPosition(refX - 23, -64);
      } else {
        this.factorySmokeEmitter.setPosition(refX - 22, -70);
      }
    }
  }

  getPneumaticCost(depthMeters) {
    const d = Math.max(0, depthMeters || 0);
    if (d <= 180) return 350;
    if (d <= 950) return 1800;
    return 7500;
  }

  getGeothermalCost(depthMeters) {
    const d = Math.max(0, depthMeters || 0);
    if (d <= 180) return 500;
    if (d <= 950) return 2600;
    return 11000;
  }

  getAvailableStationCount(player, type, depthMeters) {
    return getAvailableStationCount(player || this.player, type, depthMeters);
  }

  getUsableStationKey(player, type, depthMeters) {
    return getUsableStationKey(player || this.player, type, depthMeters);
  }

  buyGadget(key, price) {
    if (!this.player) return false;
    const itemData = EXPEDITION_ITEMS.find(i => i.key === key);
    if (itemData && !isExpeditionItemResearched(this.player, itemData)) {
      soundFx.playError();
      this.scene.events.emit('notify', `🔒 ${itemData.name} muss zuerst im LABOR erforscht werden!`);
      return false;
    }
    if (this.player.cash < price) {
      soundFx.playError();
      this.scene.events.emit('notify', '⚠️ Nicht genug Geld!');
      return false;
    }
    this.player.cash -= price;
    this.player.gadgets = this.player.gadgets || { dynamite: 0, fuel_canister: 0, repair_kit: 0 };
    this.player.gadgets[key] = (this.player.gadgets[key] || 0) + 1;
    if (key === 'dynamite') {
      this.player.hasPurchasedDynamite = true;
    }
    soundFx.playPurchase();
    this.scene.events.emit('player_updated');
    if (this.scene.hud) this.scene.hud.update();
    const itemName = itemData ? itemData.name : key;
    this.scene.events.emit('notify', `Gekauft: 1x ${itemName} für €${price.toLocaleString()}`);
    return true;
  }

  getNearbyStation(gx, gy, maxDist = 2.4) {
    if (!this.subsurfaceStations) return null;
    let closest = null;
    let minDist = maxDist;
    for (const st of this.subsurfaceStations) {
      const dist = Math.hypot(st.gx - gx, st.gy - gy);
      if (dist <= minDist) {
        minDist = dist;
        closest = st;
      }
    }
    return closest;
  }

  spawnStationInWorld(st) {
    const px = st.gx * TILE_SIZE + TILE_SIZE / 2;
    const py = st.gy * TILE_SIZE + TILE_SIZE / 2;

    const isTube = (st.type === 'pneumatic' || st.type === 'tube');
    const spriteKey = isTube ? 'station_pneumatic_tube' : 'station_fuel';
    const sprite = this.scene.add.image(px, py, spriteKey)
      .setDepth(6)
      .setOrigin(0.5, 0.5)
      .setInteractive({ useHandCursor: true });

    const labelText = isTube ? 'Förder-Schacht' : 'Tankanlage';
    const textColor = isTube ? '#38bdf8' : '#fb923c';

    const onTrigger = (pointer) => {
      if (isModalActive()) return;
      const canvas = this.scene.game?.canvas;
      if (pointer && pointer.event) {
        const target = pointer.event.target;
        if (target && canvas && target !== canvas) {
          return;
        }
        if (target && target.closest && target.closest('#building-modal, .modal-backdrop, .modal-window, #ore-info-backdrop, #hud-overlay, #hud-action-fab, .hud-card, button, input, #toast-container')) {
          return;
        }
      }
      this.handleStationInteraction(st);
    };

    const text = this.createWorldLabel(px, py - 26, labelText, textColor, () => onTrigger());
    sprite.on('pointerdown', onTrigger);

    st.sprite = sprite;
    st.textLabel = text;
    return st;
  }

  buildPneumaticStationAtPlayer() {
    if (!this.player) return;
    const depthMeters = Math.max(0, Math.floor(this.player.gy));
    if (depthMeters < 5) {
      this.scene.events.emit('notify', '⚠️ Förderstationen können nur unter Tage errichtet werden!');
      soundFx.playError();
      return;
    }

    const nearby = this.getNearbyStation(this.player.gx, this.player.gy, 2.5);
    if (nearby && (nearby.type === 'pneumatic' || nearby.type === 'tube')) {
      this.openSubsurfaceStationModal(nearby);
      return;
    }

    const usableKey = this.getUsableStationKey(this.player, 'tube', depthMeters);
    if (!usableKey) {
      const anyTubes = (this.player.gadgets?.tube_s1 || 0) + (this.player.gadgets?.tube_s2 || 0) + (this.player.gadgets?.tube_s3 || 0);
      if (anyTubes > 0) {
        this.scene.events.emit('notify', `⚠️ Vorhandene Förderstation reicht nicht bis ${depthMeters}m! Passendes Modul im Depot kaufen.`);
      } else {
        this.scene.events.emit('notify', '⚠️ Keine passende Erzförderstation im Inventar! Im Depot kaufen.');
      }
      soundFx.playError();
      return;
    }

    // Item aus dem Inventar verbrauchen
    this.player.gadgets[usableKey] = Math.max(0, (this.player.gadgets[usableKey] || 0) - 1);

    const count = (this.subsurfaceStations || []).filter(s => s.type === 'pneumatic' || s.type === 'tube').length + 1;
    const itemData = EXPEDITION_ITEMS.find(i => i.key === usableKey);
    const cost = itemData ? itemData.price : 350;
    const newStation = {
      id: 'tube_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      type: 'pneumatic',
      name: 'Förder-Schacht',
      depth: depthMeters,
      gx: Math.round(this.player.gx),
      gy: Math.round(this.player.gy),
      usedItem: usableKey,
      costCash: cost,
      isBuilt: true
    };

    this.subsurfaceStations.push(newStation);
    this.spawnStationInWorld(newStation);
    this.depot.capacity = (this.depot.capacity || 10) + 20;

    soundFx.playUpgrade();
    this.showFloatingText(newStation.gx * TILE_SIZE + 16, newStation.gy * TILE_SIZE - 20, '🏗️ Förderstation zementiert!', '#38bdf8');
    this.scene.events.emit('notify', '🏗️ Förderstation errichtet! (+20 Depot-Kapazität)');
    this.updateSurfaceVisuals();
    if (this.scene.hud) this.scene.hud.update();
  }

  buildFuelStationAtPlayer() {
    if (!this.player) return;
    const depthMeters = Math.max(0, Math.floor(this.player.gy));
    if (depthMeters < 5) {
      this.scene.events.emit('notify', '⚠️ Tankanlagen können nur unter Tage gebaut werden!');
      soundFx.playError();
      return;
    }

    const nearby = this.getNearbyStation(this.player.gx, this.player.gy, 2.5);
    if (nearby && (nearby.type === 'fuel' || nearby.type === 'geothermal')) {
      this.openSubsurfaceStationModal(nearby);
      return;
    }

    const usableKey = this.getUsableStationKey(this.player, 'fuel', depthMeters);
    if (!usableKey) {
      const anyFuels = (this.player.gadgets?.fuel_s1 || 0) + (this.player.gadgets?.fuel_s2 || 0) + (this.player.gadgets?.fuel_s3 || 0);
      if (anyFuels > 0) {
        this.scene.events.emit('notify', `⚠️ Vorhandene Tankanlage reicht nicht bis ${depthMeters}m! Passendes Modul im Depot kaufen.`);
      } else {
        this.scene.events.emit('notify', '⚠️ Keine passende Tankanlage im Inventar! Im Depot kaufen.');
      }
      soundFx.playError();
      return;
    }

    // Item aus dem Inventar verbrauchen
    this.player.gadgets[usableKey] = Math.max(0, (this.player.gadgets[usableKey] || 0) - 1);

    const count = (this.subsurfaceStations || []).filter(s => s.type === 'fuel' || s.type === 'geothermal').length + 1;
    const itemData = EXPEDITION_ITEMS.find(i => i.key === usableKey);
    const cost = itemData ? itemData.price : 500;
    const newStation = {
      id: 'fuel_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      type: 'fuel',
      name: 'Tankanlage',
      depth: depthMeters,
      gx: Math.round(this.player.gx),
      gy: Math.round(this.player.gy),
      usedItem: usableKey,
      costCash: cost,
      isBuilt: true
    };

    this.subsurfaceStations.push(newStation);
    this.spawnStationInWorld(newStation);

    soundFx.playUpgrade();
    this.showFloatingText(newStation.gx * TILE_SIZE + 16, newStation.gy * TILE_SIZE - 20, '⛽ Tankanlage einsatzbereit!', '#f59e0b');
    this.scene.events.emit('notify', '⛽ Tankanlage errichtet! Halte an der Station an oder nutze das Menü zum Auftanken.');
    this.updateSurfaceVisuals();
    if (this.scene.hud) this.scene.hud.update();
  }

  buildGeothermalStationAtPlayer() {
    return this.buildFuelStationAtPlayer();
  }

  depositOresAtStation(station) {
    const cargo = this.player.cargo || [];
    const ores = [];
    const kept = [];
    cargo.forEach(item => {
      if (typeof item === 'string' && item.startsWith('bar_')) {
        kept.push(item);
      } else {
        ores.push(item);
      }
    });

    if (ores.length === 0) {
      this.scene.events.emit('notify', 'Laderaum enthält keine Roh-Erze zum Absaugen.');
      return;
    }

    if (!this.depot.ores) this.depot.ores = {};
    ores.forEach(ore => {
      this.depot.ores[ore] = (this.depot.ores[ore] || 0) + 1;
    });
    this.player.cargo = kept;

    soundFx.playPneumaticDeposit();
    const stX = station?.sprite ? station.sprite.x : (this.player.gx * TILE_SIZE + 16);
    const stY = station?.sprite ? station.sprite.y : (this.player.gy * TILE_SIZE + 16);
    this.showFloatingText(stX, stY - 30, `▲ ${ores.length}x Erze nach oben gesaugt!`, '#38bdf8');
    this.scene.events.emit('notify', `🚀 ${ores.length}x Erze durch Förder-Schacht direkt ins Depot befördert!`);
    if (this.scene.hud) this.scene.hud.update();
  }

  updateSubsurfaceStations(delta) {
    // Untertage-Betankung wird vollautomatisch in Player.js (checkDocking)
    // inklusive mechanischer Roboterarm-Animation, Schlauch-Physik & Audio gesteuert!
  }

  handleStationInteraction(targetStation) {
    if (!this.player) return;
    const playerGx = this.player.gx;
    const playerGy = this.player.gy;

    let station = targetStation || this.getNearbyStation(playerGx, playerGy, 2.5);
    if (station) {
      this.openSubsurfaceStationModal(station);
    } else {
      const fab = document.getElementById('hud-action-fab');
      if (fab) fab.classList.add('open');
    }
  }

  openSubsurfaceStationModal(station) {
    if (!station || !this.player) return;

    const isTube = (station.type === 'pneumatic' || station.type === 'tube');
    const isFuel = (station.type === 'fuel' || station.type === 'geothermal');

    const titleIcon = isTube ? icon('conveyor-belt', '', 18) : icon('fuel', '', 18);
    const titleColor = isTube ? '#38bdf8' : '#fb923c';
    const stationName = isTube ? 'Pneumatische Erzförderung' : 'Untertage-Tankanlage';

    const itemData = EXPEDITION_ITEMS.find(i => i.key === station.usedItem);
    let fallbackPrice = isTube ? 350 : 500;
    if (station.depth > 950) fallbackPrice = isTube ? 7500 : 11000;
    else if (station.depth > 180) fallbackPrice = isTube ? 1800 : 2600;
    const refundPrice = itemData ? itemData.price : (station.costCash || fallbackPrice);

    const dist = Math.hypot(this.player.gx - station.gx, this.player.gy - station.gy);
    const isNearby = dist <= 3.5;

    // Fuel data
    const curFuel = Math.round(this.player.fuel);
    const maxFuel = Math.round(this.player.maxFuel);
    const fuelPct = Math.min(100, Math.round((curFuel / maxFuel) * 100));

    // Cargo data
    const cargo = this.player.cargo || [];
    const rawOres = cargo.filter(item => typeof item === 'string' && !item.startsWith('bar_'));
    const rawOreCount = rawOres.length;
    const maxCargo = this.player.maxCargo || 10;

    let actionCardHtml = '';
    if (isFuel) {
      const isAlreadyFull = curFuel >= maxFuel;
      actionCardHtml = `
        <div style="background: rgba(15, 23, 42, 0.75); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 10px; padding: 12px; display: flex; flex-direction: column; gap: 8px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 11.5px; font-weight: 700; color: #94a3b8; display: inline-flex; align-items: center; gap: 5px;">
              ${icon('fuel', '', 14)} Treibstoff
            </span>
            <span style="font-size: 12.5px; font-weight: 800; color: #fb923c; font-variant-numeric: tabular-nums;">
              ${curFuel} / ${maxFuel} L (${fuelPct}%)
            </span>
          </div>
          <div style="width: 100%; height: 6px; background: rgba(0, 0, 0, 0.5); border-radius: 99px; overflow: hidden;">
            <div style="width: ${fuelPct}%; height: 100%; background: #fb923c; border-radius: 99px; transition: width 0.2s ease;"></div>
          </div>
          ${!isNearby ? `
            <button class="btn-buy" disabled style="width: 100%; height: 36px; font-size: 12px; font-weight: 700; background: #334155; color: #94a3b8; border-radius: 8px; border: none; display: inline-flex; align-items: center; justify-content: center; gap: 6px; margin-top: 2px;">
              ${icon('alert-circle', '', 14)} Zu weit entfernt (${dist.toFixed(1)}m)
            </button>
          ` : isAlreadyFull ? `
            <button class="btn-buy" disabled style="width: 100%; height: 36px; font-size: 12px; font-weight: 700; background: #334155; color: #94a3b8; border-radius: 8px; border: none; display: inline-flex; align-items: center; justify-content: center; gap: 6px; margin-top: 2px;">
              ${icon('check', '', 14)} Tank ist voll (100%)
            </button>
          ` : `
            <button id="btn-station-use-fuel" class="btn-buy" style="width: 100%; height: 36px; font-size: 12.5px; font-weight: 800; background: linear-gradient(135deg, #f59e0b, #d97706); color: #ffffff; border-radius: 8px; border: none; display: inline-flex; align-items: center; justify-content: center; gap: 6px; box-shadow: 0 2px 8px rgba(245, 158, 11, 0.35); cursor: pointer; margin-top: 2px;">
              ${icon('zap', '', 15)} Vollständig auftanken
            </button>
          `}
        </div>
      `;
    } else {
      actionCardHtml = `
        <div style="background: rgba(15, 23, 42, 0.75); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 10px; padding: 12px; display: flex; flex-direction: column; gap: 8px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 11.5px; font-weight: 700; color: #94a3b8; display: inline-flex; align-items: center; gap: 5px;">
              ${icon('package', '', 14)} Laderaum
            </span>
            <span style="font-size: 12.5px; font-weight: 800; color: #38bdf8; font-variant-numeric: tabular-nums;">
              ${rawOreCount} Roh-Erze (${cargo.length} / ${maxCargo})
            </span>
          </div>
          ${!isNearby ? `
            <button class="btn-buy" disabled style="width: 100%; height: 36px; font-size: 12px; font-weight: 700; background: #334155; color: #94a3b8; border-radius: 8px; border: none; display: inline-flex; align-items: center; justify-content: center; gap: 6px;">
              ${icon('alert-circle', '', 14)} Zu weit entfernt (${dist.toFixed(1)}m)
            </button>
          ` : rawOreCount === 0 ? `
            <button class="btn-buy" disabled style="width: 100%; height: 36px; font-size: 12px; font-weight: 700; background: #334155; color: #94a3b8; border-radius: 8px; border: none; display: inline-flex; align-items: center; justify-content: center; gap: 6px;">
              ${icon('check', '', 14)} Laderaum enthält keine Erze
            </button>
          ` : `
            <button id="btn-station-use-tube" class="btn-buy" style="width: 100%; height: 36px; font-size: 12.5px; font-weight: 800; background: linear-gradient(135deg, #0284c7, #0369a1); color: #ffffff; border-radius: 8px; border: none; display: inline-flex; align-items: center; justify-content: center; gap: 6px; box-shadow: 0 2px 8px rgba(2, 132, 199, 0.35); cursor: pointer;">
              ${icon('upload-cloud', '', 15)} ${rawOreCount}x Erze nach oben befördern
            </button>
          `}
        </div>
      `;
    }

    const contentHtml = `
      <div style="display: flex; flex-direction: column; gap: 10px;">
        <!-- Status Bar -->
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 2px 2px;">
          <span style="font-size: 11.5px; font-weight: 700; color: #94a3b8;">
            Tiefe: <strong style="color: #f8fafc;">${Math.round(station.gy)}m</strong>
          </span>
          <span style="font-size: 11px; font-weight: 700; color: ${isNearby ? '#34d399' : '#f87171'}; display: inline-flex; align-items: center; gap: 4px;">
            ${isNearby ? '● In Reichweite' : `● Zu weit entfernt (${dist.toFixed(1)}m)`}
          </span>
        </div>

        <!-- Action Card -->
        ${actionCardHtml}

        <!-- Dismantle Button -->
        <button id="btn-station-dismantle" class="btn-buy" style="width: 100%; height: 32px; font-size: 11.5px; font-weight: 700; background: rgba(239, 68, 68, 0.10); border: 1px solid rgba(239, 68, 68, 0.25); color: #fca5a5; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; gap: 5px; cursor: pointer; transition: all 0.15s ease;">
          ${icon('trash-2', '', 13)} Station abbauen (+${refundPrice.toLocaleString('de-DE')} €)
        </button>
      </div>
    `;

    this.openModal(`
      <span style="color: ${titleColor}; display: inline-flex; align-items: center; gap: 8px; font-weight: 800; font-size: 15px;">
        ${titleIcon} ${stationName}
      </span>
    `, contentHtml, 420);

    // Event Listeners
    if (isFuel) {
      const useBtn = document.getElementById('btn-station-use-fuel');
      if (useBtn) {
        useBtn.onclick = () => {
          this.player.fuel = this.player.maxFuel;
          if (soundFx.playRefuel) soundFx.playRefuel();
          else soundFx.playUpgrade();
          const posX = this.player.gx * TILE_SIZE + 16;
          const posY = this.player.gy * TILE_SIZE + 16;
          this.showFloatingText(posX, posY - 20, '⛽ 100% Aufgetankt!', '#10b981');
          this.scene.events.emit('notify', '⛽ Bohrer an der Tankanlage vollständig aufgetankt!');
          if (this.scene.hud) this.scene.hud.update();
          this.openSubsurfaceStationModal(station);
        };
      }
    } else {
      const useBtn = document.getElementById('btn-station-use-tube');
      if (useBtn) {
        useBtn.onclick = () => {
          this.depositOresAtStation(station);
          this.openSubsurfaceStationModal(station);
        };
      }
    }

    // Dismantle button with 2-step confirmation
    const dismantleBtn = document.getElementById('btn-station-dismantle');
    if (dismantleBtn) {
      let isConfirming = false;
      dismantleBtn.onclick = () => {
        if (!isConfirming) {
          isConfirming = true;
          dismantleBtn.style.background = 'linear-gradient(135deg, #dc2626, #b91c1c)';
          dismantleBtn.style.borderColor = '#ef4444';
          dismantleBtn.style.color = '#ffffff';
          dismantleBtn.innerHTML = `⚠️ Wirklich für ${refundPrice.toLocaleString('de-DE')} € abbauen? (Erneut tippen)`;
          refreshIcons(dismantleBtn);
        } else {
          this.dismantleSubsurfaceStation(station, refundPrice);
        }
      };
    }
  }

  dismantleSubsurfaceStation(station, refundPrice) {
    if (!station) return;

    // 1. Sprite & World Label entfernen
    if (station.sprite) {
      station.sprite.destroy();
      station.sprite = null;
    }
    if (station.textLabel && typeof station.textLabel.destroy === 'function') {
      station.textLabel.destroy();
      station.textLabel = null;
    }

    // 2. Falls Förderschacht: Depot-Kapazität um 20 reduzieren
    const isTube = (station.type === 'pneumatic' || station.type === 'tube');
    if (isTube && this.depot) {
      this.depot.capacity = Math.max(10, (this.depot.capacity || 10) - 20);
    }

    // 3. Aus Liste subsurfaceStations entfernen
    this.subsurfaceStations = (this.subsurfaceStations || []).filter(s => s !== station && s.id !== station.id);

    // 4. Kaufpreis erstatten
    if (this.player) {
      this.player.cash = (this.player.cash || 0) + refundPrice;
    }

    // 5. Sound & Text
    soundFx.playUpgrade();
    const posX = station.gx * TILE_SIZE + 16;
    const posY = station.gy * TILE_SIZE + 16;
    this.showFloatingText(posX, posY - 20, `+${refundPrice.toLocaleString('de-DE')} € (Abgebaut)`, '#4ade80');
    this.scene.events.emit('notify', `🏗️ ${station.name || 'Station'} abgebaut und für ${refundPrice.toLocaleString('de-DE')} € verkauft.`);

    // 6. Visuals & HUD
    this.updateSurfaceVisuals();
    if (this.scene.hud) this.scene.hud.update();

    // 7. Modal schließen
    this.closeModal();
  }

  showFloatingText(worldX, worldY, message, color = '#38bdf8') {
    if (!this.worldLabelsContainer || !this.worldLabelsContainer.parentNode) {
      this.initWorldLabelsLayer();
    }
    const el = document.createElement('div');
    el.className = 'floating-world-text';
    el.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      font-family: "Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 12px;
      font-weight: 800;
      color: ${color};
      text-shadow: 0 1px 3px rgba(0,0,0,0.9), 0 0 6px rgba(0,0,0,0.8);
      pointer-events: none;
      white-space: nowrap;
      user-select: none;
      transform: translate3d(-9999px, -9999px, 0) translate(-50%, -50%);
      transition: opacity 1.4s ease-out;
    `;
    el.textContent = message;
    if (this.worldLabelsContainer) {
      this.worldLabelsContainer.appendChild(el);
    }

    let startY = worldY;
    let curY = worldY;
    const startTime = performance.now();
    const duration = 1400;

    const anim = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      curY = startY - progress * 36;
      if (progress >= 0.5) {
        el.style.opacity = (1 - (progress - 0.5) / 0.5).toFixed(2);
      }
      const c = this.scene?.cameras?.main;
      if (c && c.worldView) {
        const sx = (worldX - c.worldView.x) * c.zoom;
        const sy = (curY - c.worldView.y) * c.zoom;
        el.style.transform = `translate3d(${Math.round(sx)}px, ${Math.round(sy)}px, 0) translate(-50%, -50%)`;
      }
      if (progress < 1) {
        requestAnimationFrame(anim);
      } else {
        el.remove();
      }
    };
    requestAnimationFrame(anim);
  }

  getSubsurfaceSaveData() {
    return (this.subsurfaceStations || []).map(st => ({
      id: st.id,
      type: st.type,
      name: st.name,
      depth: st.depth,
      isBuilt: !!st.isBuilt,
      gx: st.gx,
      gy: st.gy,
      costCash: st.costCash,
      usedItem: st.usedItem
    }));
  }

  loadSubsurfaceSaveData(data) {
    if (!Array.isArray(data)) return;
    if (this.subsurfaceStations) {
      this.subsurfaceStations.forEach(st => {
        if (st.sprite) st.sprite.destroy();
        if (st.textLabel) st.textLabel.destroy();
      });
    }
    this.subsurfaceStations = [];
    data.forEach(saved => {
      const isFuel = saved.type === 'fuel' || saved.type === 'geothermal' || (saved.id && (saved.id.startsWith('geo') || saved.id.startsWith('fuel')));
      const st = {
        id: saved.id,
        type: isFuel ? 'fuel' : 'pneumatic',
        name: isFuel ? 'Tankanlage' : 'Förder-Schacht',
        depth: saved.depth || saved.gy || 0,
        gx: saved.gx,
        gy: saved.gy,
        costCash: saved.costCash || (isFuel ? 500 : 350),
        usedItem: saved.usedItem,
        isBuilt: !!saved.isBuilt
      };
      this.subsurfaceStations.push(st);
      if (st.isBuilt) {
        this.spawnStationInWorld(st);
      }
    });
    this.updateSurfaceVisuals();
  }

  resetToDefault() {
    this.hangarTier = 1;
    this.updateHangarBuildingLabel?.();

    if (this.depot) {
      this.depot.tier = 1;
      this.depot.capacity = 10;
      this.depot.ores = {};
      this.depot.products = {};
      this.depot.currentTab = 'ores';
    }

    if (this.refinery) {
      this.refinery.fuelCoal = 0;
      this.refinery.machineTier = 1;
      this.refinery.queue = [];
      this.refinery.finished = [];
      this.refinery.activeProcesses = [];
      this.refinery.completedItems = [];
      this.refinery.lastTimestamp = Date.now();
    }

    if (this.purchasableBuildings) {
      this.purchasableBuildings.forEach(pb => {
        pb.isBuilt = false;
        pb.storedOres = [];
        pb.accumulatedCash = 0;
        if (pb.sprite) {
          pb.sprite.setTexture('building_plot');
          pb.sprite.setAlpha(0.85);
        }
        if (pb.textLabel) {
          pb.textLabel.setText(`BAUPLATZ: ${pb.label || pb.title}`);
          pb.textLabel.setColor('#fb923c');
        }
      });
    }

    if (this.subsurfaceStations) {
      this.subsurfaceStations.forEach(st => {
        if (st.sprite) st.sprite.destroy();
        if (st.textLabel) st.textLabel.destroy();
      });
    }
    this.subsurfaceStations = [];

    this.updateBuildingVisuals?.();
    this.updateSurfaceVisuals?.();
  }

  openModal(title, contentHtml, maxWidth = 760) {
    try {
      soundFx.stopAllLoops?.();
    } catch (_) {}
    if (this.scene) {
      this.scene.isPaused = true;
    }
    if (!this.modalEl || !this.modalTitleEl || !this.modalBodyEl) return;
    this.clearFloatingAction();
    this.modalTitleEl.innerHTML = title;
    this.modalBodyEl.innerHTML = `
      <div style="display: flex; flex-direction: column; max-width: ${maxWidth}px; margin: 0 auto; width: 100%; box-sizing: border-box; padding: 0 4px 36px 4px;">
        ${contentHtml}
      </div>
    `;
    document.body.classList.add('modal-open');
    this.modalEl.style.display = 'flex';
    refreshIcons(this.modalEl);
    if (this.scene && this.scene.hud) {
      this.scene.hud.update();
    }
  }

  setFloatingAction(html, onAttach) {
    const container = document.getElementById('modal-floating-actions');
    if (!container) return;
    if (!html) {
      container.innerHTML = '';
      container.style.display = 'none';
      return;
    }
    container.innerHTML = html;
    container.style.display = 'flex';
    refreshIcons(container);
    if (onAttach) onAttach(container);
  }

  clearFloatingAction() {
    const container = document.getElementById('modal-floating-actions');
    if (container) {
      container.innerHTML = '';
      container.style.display = 'none';
    }
  }

  closeModal() {
    this.clearFloatingAction();
    closeActiveModal(this.scene);
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
  openMarketModal(initialTab = null) {
    if (initialTab && ['ores', 'products'].includes(initialTab)) {
      this.activeMarketTab = initialTab;
    }
    if (!this.activeMarketTab) {
      this.activeMarketTab = 'ores';
    }

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
        const mult = this.player.getOreSellMultiplier ? this.player.getOreSellMultiplier(ore) : 1.0;
        totalOreValue += Math.round(ORE_DATA[ore].value * mult) * count;
        totalOreCount += count;
      }
    }

    let boomBannerHtml = '';
    if (this.activeBoom && ORE_DATA[this.activeBoom.oreKey]) {
      const boomOre = ORE_DATA[this.activeBoom.oreKey];
      const secLeft = Math.max(0, Math.ceil(this.activeBoom.remainingMs / 1000));
      boomBannerHtml = `
        <div style="background: linear-gradient(90deg, rgba(234, 88, 12, 0.28), rgba(245, 158, 11, 0.28)); border: 1.5px solid #f97316; border-radius: 12px; padding: 12px 16px; margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 0 20px rgba(249, 115, 22, 0.25);">
          <div style="display: flex; align-items: center; gap: 12px;">
            <span style="font-size: 24px;">🔥</span>
            <div>
              <div style="font-size: 13px; font-weight: 800; color: #fbbf24; text-transform: uppercase; letter-spacing: 0.5px;">Börsen-Boom Aktiv (200% Kurs)!</div>
              <div style="font-size: 12px; color: #f8fafc;">Industrie kauft <strong>${boomOre.name}</strong> zum doppelten Marktpreis!</div>
            </div>
          </div>
          <div style="background: rgba(0,0,0,0.4); padding: 4px 10px; border-radius: 8px; font-weight: 800; font-size: 13px; color: #fdba74;">${secLeft}s</div>
        </div>
      `;
    }

    let oreListHtml = '';
    if (totalOreCount === 0) {
      oreListHtml = `${boomBannerHtml}<p style="color: #94a3b8; font-style: italic; margin: 18px 0; text-align: center;">Keine Erze im Frachtraum oder Depot vorhanden. Baue Erze im Schacht ab!</p>`;
    } else {
      oreListHtml = `${boomBannerHtml}<div style="display: flex; flex-direction: column; gap: 10px; margin: 12px 0;">`;
      for (const [ore, count] of Object.entries(combinedCounts)) {
        if (count <= 0) continue;
        const data = ORE_DATA[ore];
        const mult = this.player.getOreSellMultiplier ? this.player.getOreSellMultiplier(ore) : 1.0;
        const val = data ? Math.round(data.value * mult) : 0;
        const isBoom = this.activeBoom && this.activeBoom.oreKey === ore;
        const boomBadge = isBoom ? `<span style="background: #ea580c; color: #fff; font-size: 10px; font-weight: 800; padding: 2px 6px; border-radius: 4px; margin-left: 6px;">2X BOOM</span>` : '';
        oreListHtml += `
          <div class="market-ore-card" data-ore="${ore}" style="background: #090e1a; border: 1px solid rgba(255, 255, 255, 0.1); box-shadow: 0 3px 8px rgba(0, 0, 0, 0.35); padding: 10px 14px; border-radius: 10px; display: flex; flex-direction: column; gap: 8px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-weight: 700; color: #f8fafc; font-size: 13.5px; display: inline-flex; align-items: center; gap: 6px; width: 140px; min-width: 140px; flex-shrink: 0;">${oreIcon(ore, 16)} ${data.name}</span>
                <span style="background: rgba(56, 189, 248, 0.15); padding: 2px 8px; border-radius: 6px; font-size: 11px; color: #38bdf8; font-weight: 700; width: 44px; min-width: 44px; text-align: center; justify-content: center; display: inline-flex; flex-shrink: 0;">${count}x</span>
                <span style="font-size: 11px; color: #94a3b8; width: 75px; min-width: 75px; font-variant-numeric: tabular-nums; flex-shrink: 0;">(€${val}/Stk)</span>
                ${boomBadge}
              </div>
              <div style="display: flex; align-items: center; gap: 4px;">
                <strong class="ore-subtotal" id="subtotal-${ore}" style="color: #fbbf24; font-size: 13.5px; font-weight: 800;">€${(val * count).toLocaleString()}</strong>
              </div>
            </div>

            <!-- Freie Mengenwahl: Einheitliche Höhe 32px, zentriertes Plus/Minus, 3D Look -->
            <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px; background: rgba(0,0,0,0.3); padding: 8px 12px; border-radius: 10px; flex-wrap: nowrap;">
              <div style="display: flex; align-items: center; gap: 6px; flex-shrink: 0;">
                <span style="font-size: 11.5px; color: #94a3b8; font-weight: 700; margin-right: 2px;">Menge:</span>
                
                <button class="btn-qty-step btn-3d-secondary" data-ore="${ore}" data-step="-1" style="
                  width: 32px; height: 32px; padding: 0; box-sizing: border-box;
                  display: inline-flex; align-items: center; justify-content: center;
                  font-size: 17px; font-weight: 800; border-radius: 8px; line-height: 1;
                ">-</button>
                
                <input type="number" class="input-ore-qty" id="qty-input-${ore}" data-ore="${ore}" data-unit-val="${val}" data-max="${count}" min="1" max="${count}" value="${count}" style="
                  width: 50px; height: 32px; padding: 0 4px; box-sizing: border-box;
                  background: #090d16; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px;
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
                width: 105px; min-width: 105px; flex-shrink: 0;
                height: 32px; padding: 0 8px; box-sizing: border-box;
                font-size: 11.5px; font-weight: 800; white-space: nowrap;
                display: inline-flex; align-items: center; justify-content: center; gap: 5px;
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
    const fp = this.player.factoryProducts || {};
    const dp = this.depot?.products || {};
    const allProductKeys = Array.from(new Set([
      ...Object.keys(FACTORY_PRODUCTS),
      ...Object.keys(fp),
      ...Object.keys(dp)
    ])).filter(k => ((fp[k] || 0) + (dp[k] || 0)) > 0);

    const hasAnyFp = allProductKeys.length > 0;
    let totalFpValue = 0;
    let totalFpCount = 0;

    let fpListHtml = '';
    if (!hasAnyFp) {
      fpListHtml = '<p style="color: #64748b; font-style: italic; margin: 18px 0; text-align: center; font-size: 12px;">Keine Fabrik-Waren oder Barren auf Lager. Fertige Erzeugnisse in der FABRIK, um hier Spitzenpreise zu erzielen!</p>';
    } else {
      fpListHtml = '<div style="display: flex; flex-direction: column; gap: 10px; margin: 12px 0;">';
      for (const prodId of allProductKeys) {
        const pCount = fp[prodId] || 0;
        const dCount = dp[prodId] || 0;
        const count = pCount + dCount;
        if (count <= 0) continue;

        totalFpCount += count;
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
          <div class="market-fp-card" data-prod="${prodId}" style="background: #090e1a; border: 1px solid rgba(255, 255, 255, 0.1); box-shadow: 0 3px 8px rgba(0, 0, 0, 0.35); padding: 10px 14px; border-radius: 10px; display: flex; flex-direction: column; gap: 8px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="display: inline-flex; align-items: center; justify-content: center; width: 26px; height: 26px; background: rgba(56,189,248,0.15); border-radius: 6px; color: #38bdf8; flex-shrink: 0;">
                  ${iconHtml}
                </span>
                <span style="font-weight: 700; color: #f8fafc; font-size: 13.5px; width: 140px; min-width: 140px; flex-shrink: 0;">${prodName}</span>
                <span style="background: rgba(16, 185, 129, 0.15); padding: 2px 8px; border-radius: 6px; font-size: 11px; color: #10b981; font-weight: 700; width: 44px; min-width: 44px; text-align: center; justify-content: center; display: inline-flex; flex-shrink: 0;">${count}x</span>
                <span style="font-size: 11px; color: #94a3b8; width: 75px; min-width: 75px; font-variant-numeric: tabular-nums; flex-shrink: 0;">(€${val}/Stk)</span>
              </div>
              <div style="display: flex; align-items: center; gap: 4px;">
                <strong class="fp-subtotal" id="subtotal-fp-${prodId}" style="color: #fbbf24; font-size: 13.5px; font-weight: 800;">€${subtotal.toLocaleString()}</strong>
              </div>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px; background: rgba(0,0,0,0.3); padding: 8px 12px; border-radius: 10px; flex-wrap: nowrap;">
              <div style="display: flex; align-items: center; gap: 6px; flex-shrink: 0;">
                <span style="font-size: 11.5px; color: #94a3b8; font-weight: 700;">Menge:</span>
                <button class="btn-fp-qty-step btn-3d-secondary" data-prod="${prodId}" data-step="-1" style="width: 32px; height: 32px; padding: 0; box-sizing: border-box; display: inline-flex; align-items: center; justify-content: center; font-size: 17px; font-weight: 800; border-radius: 8px;">-</button>
                <input type="number" class="input-fp-qty" id="qty-input-fp-${prodId}" data-prod="${prodId}" data-unit-val="${val}" data-max="${count}" min="1" max="${count}" value="${count}" style="width: 50px; height: 32px; padding: 0 4px; box-sizing: border-box; background: #090d16; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; color: #f8fafc; text-align: center; font-weight: 800; font-size: 13px; outline: none;">
                <button class="btn-fp-qty-step btn-3d-secondary" data-prod="${prodId}" data-step="1" style="width: 32px; height: 32px; padding: 0; box-sizing: border-box; display: inline-flex; align-items: center; justify-content: center; font-size: 17px; font-weight: 800; border-radius: 8px;">+</button>
                <button class="btn-fp-qty-quick btn-3d-secondary" data-prod="${prodId}" data-set="1" style="height: 32px; padding: 0 10px; font-size: 11.5px; font-weight: 700; border-radius: 8px;">1x</button>
                <button class="btn-fp-qty-quick btn-action" data-prod="${prodId}" data-set="${count}" style="height: 32px; padding: 0 10px; font-size: 11.5px; font-weight: 700; border-radius: 8px;">Alle (${count})</button>
              </div>
              <button class="btn-sell-fp-custom btn-buy" data-prod="${prodId}" style="width: 105px; min-width: 105px; flex-shrink: 0; height: 32px; padding: 0 8px; font-size: 11.5px; font-weight: 800; display: inline-flex; align-items: center; justify-content: center; gap: 5px; white-space: nowrap;">
                ${icon('coins', '', 14)}
                <span id="btn-sell-fp-text-${prodId}">Verkaufen</span>
              </button>
            </div>
          </div>
        `;
      }
      fpListHtml += '</div>';
    }

    const marketTabs = [
      { id: 'ores', label: 'Erze', icon: 'gem', count: totalOreCount, val: totalOreValue },
      { id: 'products', label: 'Waren', icon: 'factory', count: totalFpCount, val: totalFpValue }
    ];

    const tabNavHtml = `
      <div class="register-tab-bar">
        ${marketTabs.map(t => {
          const isActive = this.activeMarketTab === t.id;
          return `
            <button class="register-tab market-tab-btn ${isActive ? 'active' : ''}" data-tab="${t.id}">
              ${icon(t.icon, '', 14)}
              <span>${t.label}</span>
              <span class="tab-badge">${t.count}x · €${t.val.toLocaleString()}</span>
            </button>
          `;
        }).join('')}
      </div>
    `;

    let activeTabContentHtml = '';
    if (this.activeMarketTab === 'ores') {
      activeTabContentHtml = `
        <div class="register-tab-panel">
          <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 4px;">
            <strong style="color: #38bdf8; font-size: 13px; display: inline-flex; align-items: center; gap: 6px;">
              ${icon('gem', '', 15)} ERZE (${totalOreCount} Erze verfügbar)
            </strong>
            <strong style="color: #fbbf24; font-size: 14px; font-weight: 800;">Gesamtwert: €${totalOreValue.toLocaleString()}</strong>
          </div>
          ${oreListHtml}
        </div>
      `;
    } else {
      activeTabContentHtml = `
        <div class="register-tab-panel">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <strong style="color: #38bdf8; font-size: 13px; display: inline-flex; align-items: center; gap: 6px;">
              ${icon('factory', '', 15)} WAREN (${totalFpCount} Waren verfügbar)
            </strong>
            <span style="color: #fbbf24; font-size: 14px; font-weight: 800;">Warenwert: €${totalFpValue.toLocaleString()}</span>
          </div>
          ${fpListHtml}
        </div>
      `;
    }

    const content = `
      <div class="register-tab-container" style="display: flex; flex-direction: column; max-width: 760px; margin: 0 auto; width: 100%; box-sizing: border-box; padding-bottom: 54px; gap: 0 !important; row-gap: 0 !important;">
        ${tabNavHtml}
        ${activeTabContentHtml}
      </div>
    `;

    this.openModal(`
      <div style="display: flex; align-items: center; gap: 8px;">
        ${icon('coins', '', 18)}
        <span>ERZBÖRSE</span>
      </div>
    `, content);

    // Floating Action Button je nach aktivem Register-Tab
    if (this.activeMarketTab === 'ores') {
      this.setFloatingAction(`
        <button id="btn-market-sell-ores-flyover" class="btn-buy btn-flyover" style="gap: 6px;" ${totalOreCount > 0 ? '' : 'disabled'}>
          ${icon('coins', '', 14)}
          <span>Alle Erze verkaufen (${totalOreCount}${totalOreCount > 0 ? ` · €${totalOreValue.toLocaleString()}` : ''})</span>
        </button>
      `, (container) => {
        const btn = container.querySelector('#btn-market-sell-ores-flyover');
        if (btn) {
          btn.onclick = (e) => {
            e.stopPropagation();
            const res = this.sellAllMarketOres();
            if (res.totalEarned > 0) {
              soundFx.playPurchase();
              this.openMarketModal('ores');
              this.scene.events.emit('notify', `${res.totalCount} Erze vollständig verkauft für +€${res.totalEarned.toLocaleString()}!`);
            }
          };
        }
      });
    } else {
      this.setFloatingAction(`
        <button id="btn-market-sell-fp-flyover" class="btn-buy btn-flyover" style="gap: 6px;" ${totalFpCount > 0 ? '' : 'disabled'}>
          ${icon('coins', '', 14)}
          <span>Alle Erzeugnisse verkaufen (${totalFpCount}${totalFpCount > 0 ? ` · €${totalFpValue.toLocaleString()}` : ''})</span>
        </button>
      `, (container) => {
        const btn = container.querySelector('#btn-market-sell-fp-flyover');
        if (btn) {
          btn.onclick = (e) => {
            e.stopPropagation();
            const res = this.sellAllMarketProducts();
            if (res.totalEarned > 0) {
              soundFx.playPurchase();
              this.openMarketModal('products');
              this.scene.events.emit('notify', `${res.totalCount} Fabrikerzeugnisse vollständig verkauft für +€${res.totalEarned.toLocaleString()}!`);
            }
          };
        }
      });
    }

    // Register-Tab Umschaltung
    document.querySelectorAll('.market-tab-btn').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const tab = btn.getAttribute('data-tab');
        if (tab) {
          soundFx.playClick();
          this.openMarketModal(tab);
        }
      };
    });

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
          this.openMarketModal(this.activeMarketTab);
          this.scene.events.emit('notify', `${qty}x ${ORE_DATA[ore]?.name || ore} verkauft für +€${earned.toLocaleString()}!`);
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
          this.openMarketModal(this.activeMarketTab);
          const displayName = prodId.startsWith('bar_')
            ? getRefinedOreName(prodId.replace('bar_', ''))
            : (FACTORY_PRODUCTS[prodId]?.name || prodId);
          this.scene.events.emit('notify', `${qty}x ${displayName} verkauft für +€${earned.toLocaleString()}!`);
        }
      };
    });

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

  sellAllMarketProducts() {
    let totalFpEarned = 0;
    let totalFpCount = 0;
    const allKeys = Array.from(new Set([
      ...Object.keys(FACTORY_PRODUCTS),
      ...Object.keys(this.player.factoryProducts || {}),
      ...Object.keys(this.depot?.products || {})
    ]));
    for (const prodId of allKeys) {
      const avail = (this.player.factoryProducts?.[prodId] || 0) + (this.depot?.products?.[prodId] || 0);
      if (avail > 0) {
        const earned = this.sellMarketProductFromPlayerOrDepot(prodId, avail);
        if (earned > 0) {
          totalFpCount += avail;
          totalFpEarned += earned;
        }
      }
    }
    return {
      totalEarned: totalFpEarned,
      totalCount: totalFpCount
    };
  }

  sellAllMarketItems() {
    const oresRes = this.sellAllMarketOres();
    let totalFpEarned = 0;
    let totalFpCount = 0;
    const allKeys = Array.from(new Set([
      ...Object.keys(FACTORY_PRODUCTS),
      ...Object.keys(this.player.factoryProducts || {}),
      ...Object.keys(this.depot?.products || {})
    ]));
    for (const prodId of allKeys) {
      const avail = (this.player.factoryProducts?.[prodId] || 0) + (this.depot?.products?.[prodId] || 0);
      if (avail > 0) {
        const earned = this.sellMarketProductFromPlayerOrDepot(prodId, avail);
        if (earned > 0) {
          totalFpCount += avail;
          totalFpEarned += earned;
        }
      }
    }
    return {
      totalEarned: (oresRes?.totalEarned || 0) + totalFpEarned,
      totalCount: (oresRes?.totalCount || 0) + totalFpCount
    };
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

  updateHangarBuildingLabel() {
    const dockBuilding = this.buildings?.find(b => b.id === 'dock');
    if (dockBuilding && dockBuilding.textLabel) {
      dockBuilding.textLabel.setText('HANGAR');
    }
  }

  getHangarSaveData() {
    return {
      tier: this.hangarTier || 1
    };
  }

  loadHangarSaveData(data) {
    if (!data) return;
    this.hangarTier = Math.max(1, Math.min(HANGAR_TIERS.length, Number(data.tier) || 1));
    this.updateHangarBuildingLabel();
  }

  getDrillerUpgradeTracks() {
    return [
      {
        id: 'tank',
        iconName: 'fuel',
        title: 'TREIBSTOFF-TANK',
        curTier: this.player.tankTier || 1,
        resTier: this.player.researchedTankTier || (this.player.tankTier || 1),
        maxTier: TANK_TIERS.length,
        tiers: TANK_TIERS,
        onMount: (nextTier) => {
          if (this.player.upgradeTank) {
            this.player.upgradeTank(nextTier.tier);
          } else {
            this.player.tankTier = nextTier.tier;
            this.player.maxFuel = nextTier.maxFuel;
          }
        }
      },
      {
        id: 'hull',
        iconName: 'shield-cog',
        title: 'PANZERUNG',
        curTier: this.player.hullTier || 1,
        resTier: this.player.researchedHullTier || (this.player.hullTier || 1),
        maxTier: HULL_TIERS.length,
        tiers: HULL_TIERS,
        onMount: (nextTier) => {
          if (this.player.upgradeHull) {
            this.player.upgradeHull(nextTier.tier);
          } else {
            this.player.hullTier = nextTier.tier;
            this.player.maxHull = nextTier.maxHull;
            this.player.hull = this.player.maxHull;
          }
        }
      },
      {
        id: 'drill',
        iconName: 'pickaxe',
        title: 'BOHRKOPF',
        curTier: this.player.drillTier || 1,
        resTier: this.player.researchedDrillTier || (this.player.drillTier || 1),
        maxTier: DRILL_DATA.length,
        tiers: DRILL_DATA,
        onMount: (nextTier) => {
          if (this.player?.upgradeDrill) {
            this.player.upgradeDrill(nextTier.tier);
          } else {
            this.player.drillTier = nextTier.tier;
            this.player.drillPower = DRILL_DPS[nextTier.tier - 1];
          }
        }
      },
      {
        id: 'engine',
        iconName: 'zap',
        title: 'ANTRIEB',
        curTier: this.player.engineTier || 1,
        resTier: this.player.researchedEngineTier || (this.player.engineTier || 1),
        maxTier: ENGINE_TIERS.length,
        tiers: ENGINE_TIERS,
        onMount: (nextTier) => {
          if (this.player.upgradeEngine) {
            this.player.upgradeEngine(nextTier.tier);
          } else {
            this.player.engineTier = nextTier.tier;
          }
        }
      },
      {
        id: 'cargo',
        iconName: 'container',
        title: 'FRACHTRAUM',
        curTier: this.player.cargoTier || 1,
        resTier: this.player.researchedCargoTier || (this.player.cargoTier || 1),
        maxTier: CARGO_TIERS.length,
        tiers: CARGO_TIERS,
        onMount: (nextTier) => {
          if (this.player.upgradeCargo) {
            this.player.upgradeCargo(nextTier.tier);
          } else {
            this.player.cargoTier = nextTier.tier;
            this.player.maxCargo = nextTier.maxCargo;
          }
        }
      },
      {
        id: 'sensor',
        iconName: 'radio',
        title: 'RADAR',
        curTier: this.player.sensorTier || 1,
        resTier: this.player.researchedSensorTier || (this.player.sensorTier || 1),
        maxTier: SENSOR_TIERS.length,
        tiers: SENSOR_TIERS,
        onMount: (nextTier) => {
          if (this.player.upgradeSensor) {
            this.player.upgradeSensor(nextTier.tier);
          } else {
            this.player.sensorTier = nextTier.tier;
          }
        }
      }
    ];
  }

  renderDrillerUpgradeCards(prefix = 'dock') {
    const tracks = this.getDrillerUpgradeTracks();
    let sectionsHtml = '';

    const getRequiredComps = (tierData) => {
      if (!tierData) return [];
      if (Array.isArray(tierData.mountComps)) return tierData.mountComps;
      if (tierData.mountComp) return [tierData.mountComp];
      return [];
    };

    const checkMountComp = (tierData) => {
      const compsNeeded = getRequiredComps(tierData);
      if (compsNeeded.length === 0) return true;
      return compsNeeded.every(mc => (this.player.components[mc.key] || 0) >= mc.count);
    };

    const getMountCompBadge = (tierData) => {
      const compsNeeded = getRequiredComps(tierData);
      if (compsNeeded.length === 0) return '<span style="color: #94a3b8; font-size: 10.5px; white-space: nowrap;">Keine Teile nötig</span>';
      return compsNeeded.map(mc => {
        const have = this.player.components[mc.key] || 0;
        const isMet = have >= mc.count;
        const iconName = COMPONENT_ICONS[mc.key] || 'box';
        return `<span style="background: ${isMet ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)'}; border: 1px solid ${isMet ? 'rgba(16,185,129,0.35)' : 'rgba(239,68,68,0.35)'}; color: ${isMet ? '#34d399' : '#f87171'}; font-weight: 700; font-size: 10.5px; padding: 2px 6px; border-radius: 5px; display: inline-flex; align-items: center; gap: 3px; white-space: nowrap; flex-shrink: 0;">${icon(iconName, '', 11)} ${mc.count}x ${mc.name} <span style="font-size: 9.5px; opacity: 0.85;">(${have}/${mc.count})</span></span>`;
      }).join(' ');
    };

    tracks.forEach((track) => {
      const curData = track.tiers[track.curTier - 1] || track.tiers[0];
      const hasNext = track.curTier < track.maxTier;
      const nextData = hasNext ? (track.tiers[track.curTier] || null) : null;
      const isResearched = hasNext && (track.resTier > track.curTier);
      const hasMountComp = isResearched && checkMountComp(nextData);
      const mountBtnId = `btn-mount-${track.id}-${prefix}`;

      // Segmented Progress Bar
      let segmentsHtml = '<div class="segmented-progress-bar">';
      for (let s = 1; s <= track.maxTier; s++) {
        if (s <= track.curTier) {
          segmentsHtml += `
            <div class="seg-step completed${s === track.curTier ? ' current' : ''}">
              <span><span class="step-label">Stufe </span>${s}</span>
            </div>
          `;
        } else if (s === track.curTier + 1) {
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

      let actionRowHtml = '';
      if (!hasNext) {
        actionRowHtml = `
          <div class="cat-action-row" style="margin-top: 6px; display: flex; align-items: center; justify-content: space-between; background: rgba(0, 0, 0, 0.4); border: 1px solid rgba(255, 255, 255, 0.08); padding: 7px 12px; border-radius: 8px; gap: 10px; box-sizing: border-box; flex-wrap: nowrap; min-height: 44px; overflow-x: auto; scrollbar-width: none;">
            <div style="flex-shrink: 0; display: flex; align-items: center; gap: 6px; white-space: nowrap;">
              <strong style="color: #10b981; font-size: 12.5px; display: inline-flex; align-items: center; gap: 6px; white-space: nowrap;">
                ${icon('award', '', 14)} Vollständig montiert
              </strong>
            </div>
            <div style="width: 105px; min-width: 105px; flex-shrink: 0; margin-left: auto;">
              <span style="font-size: 11px; color: #10b981; font-weight: 700; background: rgba(16,185,129,0.15); border: 1px solid rgba(16,185,129,0.3); padding: 3px 8px; border-radius: 6px; display: inline-flex; align-items: center; justify-content: center; width: 100%; box-sizing: border-box; white-space: nowrap;">MAX</span>
            </div>
          </div>
        `;
      } else if (!isResearched) {
        actionRowHtml = `
          <div class="cat-action-row" style="margin-top: 6px; display: flex; align-items: center; justify-content: space-between; background: rgba(0, 0, 0, 0.4); border: 1px solid rgba(255, 255, 255, 0.08); padding: 7px 12px; border-radius: 8px; gap: 10px; box-sizing: border-box; flex-wrap: nowrap; min-height: 44px; overflow-x: auto; scrollbar-width: none;">
            <div style="display: flex; align-items: center; gap: 8px; flex-shrink: 0; flex-wrap: nowrap;">
              <strong style="color: #f8fafc; font-size: 12.5px; white-space: nowrap; flex-shrink: 0; width: 185px; min-width: 185px;">${nextData.name}</strong>
              <span style="background: rgba(56, 189, 248, 0.15); border: 1px solid rgba(56, 189, 248, 0.3); color: #38bdf8; font-weight: 700; font-size: 11px; padding: 2px 7px; border-radius: 6px; white-space: nowrap; flex-shrink: 0; font-variant-numeric: tabular-nums; width: 68px; min-width: 68px; text-align: center; justify-content: center; display: inline-flex;">
                ${nextData.stat}
              </span>
              <span style="color: #f59e0b; font-size: 10.5px; font-weight: 700; display: inline-flex; align-items: center; gap: 4px; background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.25); padding: 2px 6px; border-radius: 6px; white-space: nowrap; flex-shrink: 0;">
                ${icon('microscope', '', 12)} Im Labor erforschen
              </span>
            </div>
            <div style="width: 105px; min-width: 105px; flex-shrink: 0; margin-left: auto;">
              <button class="btn-buy" disabled style="opacity: 0.45; background: #334155; color: #94a3b8; cursor: not-allowed; width: 100%; height: 30px; font-size: 11px; display: inline-flex; align-items: center; justify-content: center; gap: 4px; white-space: nowrap;">
                ${icon('lock', '', 12)} Gesperrt
              </button>
            </div>
          </div>
        `;
      } else {
        const compBadge = getMountCompBadge(nextData);
        const mountBtnHtml = hasMountComp ? `
          <button id="${mountBtnId}" class="btn-buy" style="width: 100%; height: 30px; padding: 0 8px; font-size: 11px; font-weight: 800; background: linear-gradient(135deg, #10b981, #059669); display: inline-flex; align-items: center; justify-content: center; gap: 4px; white-space: nowrap;">
            ${icon('wrench', '', 12)} Montieren
          </button>
        ` : `
          <button id="${mountBtnId}" class="btn-buy" style="width: 100%; height: 30px; padding: 0 6px; font-size: 10.5px; font-weight: 700; background: #334155; color: #f87171; border: 1px solid rgba(239,68,68,0.3); display: inline-flex; align-items: center; justify-content: center; gap: 4px; white-space: nowrap;" title="Benötigt Bauteile aus der Fabrik oder vom Geologen">
            ${icon('wrench', '', 12)} Bauteil fehlt
          </button>
        `;

        actionRowHtml = `
          <div class="cat-action-row" style="margin-top: 6px; display: flex; align-items: center; justify-content: space-between; background: rgba(0, 0, 0, 0.4); border: 1px solid rgba(255, 255, 255, 0.08); padding: 7px 12px; border-radius: 8px; gap: 10px; box-sizing: border-box; flex-wrap: nowrap; min-height: 44px; overflow-x: auto; scrollbar-width: none;">
            <div style="display: flex; align-items: center; gap: 8px; flex-shrink: 0; flex-wrap: nowrap;">
              <strong style="color: #f8fafc; font-size: 12.5px; white-space: nowrap; flex-shrink: 0; width: 185px; min-width: 185px;">${nextData.name}</strong>
              <span style="background: rgba(56, 189, 248, 0.15); border: 1px solid rgba(56, 189, 248, 0.3); color: #38bdf8; font-weight: 700; font-size: 11px; padding: 2px 7px; border-radius: 6px; white-space: nowrap; flex-shrink: 0; font-variant-numeric: tabular-nums; width: 68px; min-width: 68px; text-align: center; justify-content: center; display: inline-flex;">
                ${nextData.stat}
              </span>
              <div style="display: inline-flex; align-items: center; gap: 4px; flex-shrink: 0; white-space: nowrap;">
                ${compBadge}
              </div>
            </div>
            <div style="width: 105px; min-width: 105px; flex-shrink: 0; margin-left: auto;">
              ${mountBtnHtml}
            </div>
          </div>
        `;
      }

      sectionsHtml += `
        <div class="tech-category-card" style="margin-bottom: 8px;">
          <div class="cat-header-row" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <div class="cat-title-wrap" style="display: flex; align-items: center; gap: 8px; font-weight: 700; font-size: 13px; color: #f8fafc;">
              ${icon(track.iconName, '', 16)}
              <span>${track.title}</span>
            </div>
            <div class="cat-status-pill" style="font-size: 11px; color: #94a3b8; background: rgba(255, 255, 255, 0.06); padding: 3px 8px; border-radius: 6px;">
              Stufe ${track.curTier}/${track.maxTier} • <strong style="color: #10b981;">${curData.stat}</strong>
            </div>
          </div>

          ${segmentsHtml}
          ${actionRowHtml}
        </div>
      `;
    });

    return sectionsHtml;
  }

  bindDrillerMountHandlers(prefix = 'dock', onMountedCallback = null) {
    const tracks = this.getDrillerUpgradeTracks();

    const getRequiredComps = (tierData) => {
      if (!tierData) return [];
      if (Array.isArray(tierData.mountComps)) return tierData.mountComps;
      if (tierData.mountComp) return [tierData.mountComp];
      return [];
    };

    const checkMountComp = (tierData) => {
      const compsNeeded = getRequiredComps(tierData);
      if (compsNeeded.length === 0) return true;
      return compsNeeded.every(mc => (this.player.components[mc.key] || 0) >= mc.count);
    };

    const consumeMountComp = (tierData) => {
      const compsNeeded = getRequiredComps(tierData);
      compsNeeded.forEach(mc => {
        this.player.components[mc.key] = Math.max(0, (this.player.components[mc.key] || 0) - mc.count);
      });
    };

    tracks.forEach((track) => {
      const hasNext = track.curTier < track.maxTier;
      if (!hasNext) return;
      const nextData = track.tiers[track.curTier] || null;
      const isResearched = hasNext && (track.resTier > track.curTier);
      const mountBtnId = `btn-mount-${track.id}-${prefix}`;

      const btn = document.getElementById(mountBtnId);
      if (btn) {
        btn.onclick = (e) => {
          if (e) { e.preventDefault(); e.stopPropagation(); }
          if (!isResearched) {
            this.scene.events.emit('notify', `Dieser Bauplan muss zuerst im Labor erforscht werden!`);
            return;
          }
          if (!checkMountComp(nextData)) {
            const compsNeeded = getRequiredComps(nextData);
            const missing = compsNeeded
              .filter(mc => (this.player.components[mc.key] || 0) < mc.count)
              .map(mc => `${mc.count}x ${mc.name}`)
              .join(', ');
            this.scene.events.emit('notify', `Fehlende Bauteile: ${missing}!`);
            return;
          }
          consumeMountComp(nextData);
          track.onMount(nextData);
          soundFx.playUpgrade();
          this.scene.events.emit('player_upgraded');
          this.scene.events.emit('notify', `${nextData.name} montiert (${nextData.stat})!`);
          if (typeof onMountedCallback === 'function') {
            onMountedCallback();
          }
        };
      }
    });
  }

  openDepotModal(tab = null) {
    this.isDepotModalOpen = true;
    if (this.scene) {
      this.scene.isPaused = true;
    }
    if (!this.depot) {
      this.depot = { ores: {}, products: {}, capacity: 10, tier: 1 };
    }
    if (tab && ['storage', 'upgrades', 'shop'].includes(tab)) {
      this.depot.currentTab = tab;
    }
    this.renderDepotModal();
  }

  renderDepotModal() {
    if (!this.modalEl || !this.modalTitleEl || !this.modalBodyEl) return;

    this.modalTitleEl.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px; color: #38bdf8;">
        ${icon('warehouse', '', 18)}
        <span>DEPOT</span>
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

    const totalStoredOresCount = Object.values(this.depot.ores || {}).reduce((s, v) => s + v, 0);
    const totalStoredGoodsCount = Object.values(this.depot.products || {}).reduce((s, v) => s + v, 0) + Object.values(this.player.components || {}).reduce((s, v) => s + v, 0);

    // 2. OBERES INVENTAR: ERZE & MINERALIEN

    // 3. OBERES INVENTAR: ERZE & MINERALIEN
    let oresItemsHtml = '';
    let filledOresCount = 0;

    const oreKeys = Object.keys(ORE_DATA).filter(k => {
      const inDepot = this.depot.ores?.[k] || 0;
      const inCargo = cargoOreCounts[k] || 0;
      return inDepot > 0 || inCargo > 0;
    });

    oreKeys.forEach(key => {
      filledOresCount++;
      const depotCount = this.depot.ores?.[key] || 0;
      const inCargo = cargoOreCounts[key] || 0;
      const data = ORE_DATA[key] || { name: key };
      const canDeposit = inCargo > 0 && freeDepot > 0;

      oresItemsHtml += `
        <div class="depot-ore-card" data-key="${key}" style="
          position: relative;
          background: #090e1a;
          border: 1px solid rgba(255, 255, 255, 0.16);
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.08);
          border-radius: 10px;
          padding: 8px 5px 8px 5px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          min-height: 90px;
          box-sizing: border-box;
          cursor: pointer;
          user-select: none;
          -webkit-tap-highlight-color: transparent;
          outline: none;
        " title="${data.name}: ${depotCount}x im Depot${inCargo > 0 ? ` · ${inCargo}x im Bohrer` : ''} (Klicken für Details)">
          <!-- Anzahl Badge -->
          <span style="
            position: absolute;
            top: 5px;
            right: 5px;
            background: #0284c7;
            color: #ffffff;
            font-size: 10px;
            font-weight: 800;
            padding: 1px 5px;
            border-radius: 99px;
            line-height: 1.2;
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.5);
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
              box-shadow: 0 2px 5px rgba(0, 0, 0, 0.5);
            ">+${inCargo}</span>
          ` : ''}

          <!-- Stein Icon -->
          <div style="display: flex; align-items: center; justify-content: center; width: 34px; height: 34px;">
            ${oreIcon(key, 28)}
          </div>

          <!-- Name -->
          <span class="depot-card-name" style="
            font-size: 10px;
            font-weight: 700;
            color: #f8fafc;
            text-align: center;
            line-height: 1.15;
            margin-top: 6px;
            max-width: 100%;
            white-space: normal;
            overflow: visible;
            text-overflow: clip;
            word-break: break-word;
            hyphens: auto;
          ">${data.name}</span>
        </div>
      `;
    });

    // Leere Slots für das Erze-Grid
    const minOreSlots = 12;
    const totalOreSlots = Math.max(minOreSlots, Math.ceil(Math.max(1, filledOresCount) / 4) * 4);
    const emptyOreSlots = Math.max(0, totalOreSlots - filledOresCount);
    for (let i = 0; i < emptyOreSlots; i++) {
      oresItemsHtml += `
        <div style="
          background: rgba(5, 8, 15, 0.55);
          border: 1px dashed rgba(255, 255, 255, 0.12);
          border-radius: 10px;
          min-height: 90px;
          box-sizing: border-box;
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <span style="color: rgba(255, 255, 255, 0.18); font-size: 16px; font-weight: 700;">•</span>
        </div>
      `;
    }

    // 4. UNTERES INVENTAR: WAREN & BAUTEILE
    let goodsItemsHtml = '';
    let filledGoodsCount = 0;

    // Barren im Depot
    const refinedBarKeys = Object.entries(REFINED_ORE_DATA).map(([_, r]) => r.key).filter(k => {
      return (this.depot.products?.[k] || 0) > 0;
    });

    refinedBarKeys.forEach(key => {
      filledGoodsCount++;
      const depotCount = this.depot.products?.[key] || 0;
      const name = getRefinedOreName(key.replace('bar_', ''));

      goodsItemsHtml += `
        <div class="depot-goods-card" data-type="product" data-key="${key}" style="
          position: relative;
          background: #090e1a;
          border: 1px solid rgba(255, 255, 255, 0.16);
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.08);
          border-radius: 10px;
          padding: 8px 5px 8px 5px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          min-height: 90px;
          box-sizing: border-box;
          user-select: none;
          cursor: default;
        " title="${name}: ${depotCount}x im Depot">
          <!-- Anzahl Badge -->
          <span style="
            position: absolute;
            top: 5px;
            right: 5px;
            background: #d97706;
            color: #ffffff;
            font-size: 10px;
            font-weight: 800;
            padding: 1px 5px;
            border-radius: 99px;
            line-height: 1.2;
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.5);
          ">${depotCount}x</span>

          <!-- Icon -->
          <div style="display: flex; align-items: center; justify-content: center; width: 34px; height: 34px;">
            ${itemDisplayIcon(key, 26)}
          </div>

          <!-- Name -->
          <span class="depot-card-name" style="
            font-size: 10px;
            font-weight: 700;
            color: #f8fafc;
            text-align: center;
            line-height: 1.15;
            margin-top: 6px;
            max-width: 100%;
            white-space: normal;
            overflow: visible;
            text-overflow: clip;
            word-break: break-word;
            hyphens: auto;
          ">${name}</span>
        </div>
      `;
    });

    // Fabrikprodukte im Depot
    const factoryKeys = Object.keys(FACTORY_PRODUCTS).filter(k => {
      return (this.depot.products?.[k] || 0) > 0;
    });

    factoryKeys.forEach(key => {
      filledGoodsCount++;
      const depotCount = this.depot.products?.[key] || 0;
      const name = FACTORY_PRODUCTS[key]?.name || key;

      goodsItemsHtml += `
        <div class="depot-goods-card" data-type="product" data-key="${key}" style="
          position: relative;
          background: #090e1a;
          border: 1px solid rgba(255, 255, 255, 0.16);
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.08);
          border-radius: 10px;
          padding: 8px 5px 8px 5px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          min-height: 90px;
          box-sizing: border-box;
          user-select: none;
          cursor: pointer;
          touch-action: manipulation;
          transition: transform 0.1s, border-color 0.15s;
        " title="${name}: ${depotCount}x im Depot (Klicken für Details)">
          <!-- Anzahl Badge -->
          <span style="
            position: absolute;
            top: 5px;
            right: 5px;
            background: #7c3aed;
            color: #ffffff;
            font-size: 10px;
            font-weight: 800;
            padding: 1px 5px;
            border-radius: 99px;
            line-height: 1.2;
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.5);
          ">${depotCount}x</span>

          <!-- Icon -->
          <div style="display: flex; align-items: center; justify-content: center; width: 34px; height: 34px;">
            ${itemDisplayIcon(key, 26)}
          </div>

          <!-- Name -->
          <span class="depot-card-name" style="
            font-size: 10px;
            font-weight: 700;
            color: #f8fafc;
            text-align: center;
            line-height: 1.15;
            margin-top: 6px;
            max-width: 100%;
            white-space: normal;
            overflow: visible;
            text-overflow: clip;
            word-break: break-word;
            hyphens: auto;
          ">${name}</span>
        </div>
      `;
    });

    // Bauteile im Depot
    const compKeys = Object.keys(COMPONENT_DATA).filter(k => {
      return (this.player.components?.[k] || 0) > 0;
    });

    compKeys.forEach(key => {
      filledGoodsCount++;
      const count = this.player.components?.[key] || 0;
      const compInfo = COMPONENT_DATA[key] || { name: key, icon: 'box', color: '#c084fc' };

      goodsItemsHtml += `
        <div class="depot-goods-card" data-type="component" data-key="${key}" style="
          position: relative;
          background: #090e1a;
          border: 1px solid rgba(255, 255, 255, 0.16);
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.08);
          border-radius: 10px;
          padding: 8px 5px 8px 5px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          min-height: 90px;
          box-sizing: border-box;
          user-select: none;
          cursor: pointer;
          touch-action: manipulation;
          transition: transform 0.1s, border-color 0.15s;
        " title="${compInfo.name}: ${count}x vorhanden (Klicken für Details)">
          <!-- Anzahl Badge -->
          <span style="
            position: absolute;
            top: 5px;
            right: 5px;
            background: #7c3aed;
            color: #ffffff;
            font-size: 10px;
            font-weight: 800;
            padding: 1px 5px;
            border-radius: 99px;
            line-height: 1.2;
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.5);
          ">${count}x</span>

          <!-- Icon -->
          <div style="display: flex; align-items: center; justify-content: center; width: 34px; height: 34px; color: ${compInfo.color || '#c084fc'};">
            ${icon(compInfo.icon, '', 24)}
          </div>

          <!-- Name -->
          <span class="depot-card-name" style="
            font-size: 10px;
            font-weight: 700;
            color: #f8fafc;
            text-align: center;
            line-height: 1.15;
            margin-top: 6px;
            max-width: 100%;
            white-space: normal;
            overflow: visible;
            text-overflow: clip;
            word-break: break-word;
            hyphens: auto;
          ">${compInfo.name}</span>
        </div>
      `;
    });

    // Leere Slots für das Waren-Grid
    const minGoodsSlots = 8;
    const totalGoodsSlots = Math.max(minGoodsSlots, Math.ceil(Math.max(1, filledGoodsCount) / 4) * 4);
    const emptyGoodsSlots = Math.max(0, totalGoodsSlots - filledGoodsCount);
    for (let i = 0; i < emptyGoodsSlots; i++) {
      goodsItemsHtml += `
        <div style="
          background: rgba(5, 8, 15, 0.55);
          border: 1px dashed rgba(255, 255, 255, 0.12);
          border-radius: 10px;
          min-height: 90px;
          box-sizing: border-box;
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <span style="color: rgba(255, 255, 255, 0.18); font-size: 16px; font-weight: 700;">•</span>
        </div>
      `;
    }

    const oresSectionHtml = `
      <div style="display: flex; flex-direction: column; gap: 8px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 11.5px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; display: inline-flex; align-items: center; gap: 5px;">
            ${icon('stone', '', 12)} Erze (${totalStoredOresCount})
          </span>
          ${isFull ? `
            <span style="background: rgba(239, 68, 68, 0.2); color: #ef4444; font-size: 10px; font-weight: 800; padding: 1px 6px; border-radius: 4px;">
              DEPOT VOLL
            </span>
          ` : ''}
        </div>

        <div style="
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
          gap: 8px;
        ">
          ${oresItemsHtml}
        </div>
      </div>
    `;

    const goodsSectionHtml = `
      <div style="display: flex; flex-direction: column; gap: 8px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 11.5px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; display: inline-flex; align-items: center; gap: 5px;">
            ${icon('layers', '', 12)} Waren (${totalStoredGoodsCount})
          </span>
        </div>

        <div style="
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
          gap: 8px;
        ">
          ${goodsItemsHtml}
        </div>
      </div>
    `;

    // --- TAB-SYSTEM: 1. LAGER | 2. AUSBAU | 3. SHOP ---
    if (!this.depot.currentTab || !['storage', 'upgrades', 'shop'].includes(this.depot.currentTab)) {
      this.depot.currentTab = 'storage';
    }
    const currentTab = this.depot.currentTab;

    const depotTabs = [
      { id: 'storage', label: 'Lager', icon: 'warehouse', badge: `${totalStored}/${capacity}` },
      { id: 'upgrades', label: 'Ausbau', icon: 'arrow-up-circle', badge: null },
      { id: 'shop', label: 'Ausrüstung', icon: 'backpack', badge: null }
    ];

    const tabNavHtml = `
      <div class="register-tab-bar">
        ${depotTabs.map(t => {
          const isActive = currentTab === t.id;
          return `
            <button class="register-tab depot-tab-btn ${isActive ? 'active' : ''}" data-tab="${t.id}">
              ${icon(t.icon, '', 14)}
              <span>${t.label}</span>
              ${t.badge ? `<span class="tab-badge">${t.badge}</span>` : ''}
            </button>
          `;
        }).join('')}
      </div>
    `;

    let tabContentHtml = '';

    if (currentTab === 'storage') {
      tabContentHtml = `
        <div style="display: flex; flex-direction: column; gap: 14px;">
          ${oresSectionHtml}
          ${goodsSectionHtml}
        </div>
      `;
    } else if (currentTab === 'upgrades') {
      // 1. Kompakter Gebäude-Ausbau (Depot)
      const curTierInfo = DEPOT_TIERS.find(t => t.tier === currentTier) || DEPOT_TIERS[0];
      let depotUpgradeBtnHtml = '';
      if (nextTierData) {
        const compBadgesHtml = nextTierData.costComp ? Object.entries(nextTierData.costComp).map(([compKey, need]) => {
          const have = this.player.components[compKey] || 0;
          const isMet = have >= need;
          const compIconName = COMPONENT_ICONS[compKey] || 'box';
          const cName = COMPONENT_DATA[compKey]?.name || compKey;
          return `
            <span style="background: rgba(192, 132, 252, 0.14); color: ${isMet ? '#c084fc' : '#ef4444'}; font-weight: 700; font-size: 10.5px; padding: 2px 6px; border-radius: 6px; display: inline-flex; align-items: center; gap: 3px; white-space: nowrap;">
              ${icon(compIconName, '', 11)} ${need}x ${cName} <span style="font-size: 9.5px; opacity: 0.85;">(${have}/${need})</span>
            </span>
          `;
        }).join('') : '';

        depotUpgradeBtnHtml = `
          <div style="display: flex; align-items: center; justify-content: flex-end; gap: 8px; flex-shrink: 0; margin-left: auto; flex-wrap: nowrap;">
            <span style="background: rgba(251, 191, 36, 0.14); color: ${this.player.cash >= nextTierData.costCash ? '#fbbf24' : '#ef4444'}; font-weight: 800; font-size: 11.5px; padding: 2px 7px; border-radius: 6px; display: inline-flex; align-items: center; gap: 4px; white-space: nowrap; flex-shrink: 0;">
              ${icon('coins', '', 12)} €${nextTierData.costCash.toLocaleString()}
            </span>
            ${compBadgesHtml}
            <div style="width: 105px; min-width: 105px; flex-shrink: 0;">
              <button id="btn-depot-upgrade" class="btn-buy" style="width: 100%; height: 30px; padding: 0 6px; font-size: 11px; font-weight: 800; display: inline-flex; align-items: center; justify-content: center; gap: 4px; white-space: nowrap; box-sizing: border-box;" ${canAffordDepot ? '' : 'disabled'}>
                ${icon('wrench', '', 12)}
                <span>Ausbauen</span>
              </button>
            </div>
          </div>
        `;
      } else {
        depotUpgradeBtnHtml = `
          <div style="width: 105px; min-width: 105px; flex-shrink: 0; display: flex; align-items: center; justify-content: flex-end; margin-left: auto;">
            <span style="color: #10b981; font-weight: 800; font-size: 11px; background: rgba(16,185,129,0.15); border: 1px solid rgba(16,185,129,0.3); padding: 3px 8px; border-radius: 6px; display: inline-flex; align-items: center; justify-content: center; width: 100%; box-sizing: border-box; white-space: nowrap;">
              ${icon('award', '', 12)} MAX
            </span>
          </div>
        `;
      }

      const compactBuildingHtml = `
        <div style="background: #090e1a; border: 1px solid rgba(255, 255, 255, 0.14); box-shadow: 0 4px 12px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.08); border-radius: 10px; padding: 8px 12px; display: flex; justify-content: space-between; align-items: center; gap: 10px; flex-wrap: nowrap; min-height: 52px; box-sizing: border-box;">
          <div style="display: flex; align-items: center; gap: 8px; flex: 1 1 auto; min-width: 0; overflow: hidden; flex-wrap: nowrap;">
            <div style="width: 32px; height: 32px; border-radius: 6px; background: rgba(56,189,248,0.15); display: flex; align-items: center; justify-content: center; color: #38bdf8; flex-shrink: 0;">
              ${icon('warehouse', '', 16)}
            </div>
            <div style="min-width: 0; overflow: hidden; flex: 1 1 auto;">
              <div style="display: flex; align-items: center; gap: 6px; white-space: nowrap;">
                <span style="font-size: 12.5px; font-weight: 800; color: #f8fafc;">DEPOT</span>
                <span style="font-size: 10px; font-weight: 800; color: #38bdf8; background: rgba(56,189,248,0.15); padding: 1px 6px; border-radius: 4px; flex-shrink: 0;">Stufe ${currentTier}/10</span>
              </div>
              <div style="font-size: 10.5px; color: #94a3b8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">Kapazität: <strong style="color: #38bdf8;">${capacity} Plätze</strong> (${totalStored} belegt · ${occPct}%)</div>
            </div>
          </div>
          ${depotUpgradeBtnHtml}
        </div>
      `;

      // 2. Bohrer-Upgrades (alle 6 Tracks)
      const drillerSectionsHtml = this.renderDrillerUpgradeCards('depot');

      tabContentHtml = `
        <div style="display: flex; flex-direction: column; gap: 10px;">
          <!-- Gebäude-Ausbau (Kompakt) -->
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: -2px;">
            <span style="font-size: 11px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.6px; display: inline-flex; align-items: center; gap: 5px;">
              ${icon('building-2', '', 13)} Gebäude-Ausbau
            </span>
          </div>
          ${compactBuildingHtml}

          <!-- Bohrer-Ausbau (Werkstatt) -->
          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 6px; margin-bottom: -2px;">
            <span style="font-size: 11px; font-weight: 800; color: #38bdf8; text-transform: uppercase; letter-spacing: 0.6px; display: inline-flex; align-items: center; gap: 5px;">
              ${drillerVehicleIcon(16)} Bohrer-Upgrades
            </span>
            <span style="font-size: 10.5px; color: #94a3b8;">Montiere erforschte Bauteile</span>
          </div>
          <div style="display: flex; flex-direction: column; gap: 8px;">
            ${drillerSectionsHtml}
          </div>
        </div>
      `;
    } else if (currentTab === 'shop') {
      const currentGadgets = this.player.gadgets || {};
      const gadgetsItems = EXPEDITION_ITEMS.filter(i => i.category === 'gadget');
      const tubeItems = EXPEDITION_ITEMS.filter(i => i.stationType === 'tube');
      const fuelItems = EXPEDITION_ITEMS.filter(i => i.stationType === 'fuel');

      const stationTracks = [
        {
          id: 'station_tube',
          title: 'UNTERTAGE-ERZFÖRDERSCHÄCHTE',
          iconName: 'conveyor-belt',
          items: tubeItems,
          resTier: this.player.researchedStationTube || 0
        },
        {
          id: 'station_fuel',
          title: 'UNTERTAGE-TANKANLAGEN',
          iconName: 'fuel',
          items: fuelItems,
          resTier: this.player.researchedStationFuel || 0
        }
      ];

      const tracksHtml = stationTracks.map(track => {
        const totalTiers = track.items.length;
        const curResTier = Math.min(totalTiers, track.resTier);
        const curItem = curResTier > 0 ? track.items[curResTier - 1] : null;

        let segmentsHtml = '<div class="segmented-progress-bar">';
        for (let s = 1; s <= totalTiers; s++) {
          if (s <= curResTier) {
            segmentsHtml += `
              <div class="seg-step completed${s === curResTier ? ' current' : ''}">
                <span><span class="step-label">Stufe </span>${s}</span>
              </div>
            `;
          } else if (s === curResTier + 1) {
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

        const unlockedItems = track.items.filter((_, idx) => (idx + 1) <= Math.max(1, curResTier));
        const itemsRowsHtml = unlockedItems.map((item, idx) => {
          const tierNum = idx + 1;
          const isRes = curResTier >= tierNum;
          const count = currentGadgets[item.key] || 0;
          const canAfford = this.player.cash >= item.price;

          return `
            <div class="cat-action-row" style="margin-top: 6px; display: flex; align-items: center; justify-content: space-between; background: rgba(0, 0, 0, 0.4); border: 1px solid rgba(255, 255, 255, 0.08); padding: 7px 12px; border-radius: 8px; gap: 10px; box-sizing: border-box; flex-wrap: nowrap; min-height: 44px; overflow-x: auto; scrollbar-width: none;">
              <div style="display: flex; align-items: center; gap: 8px; flex-shrink: 0; flex-wrap: nowrap;">
                <span style="font-size: 11px; font-weight: 800; color: #38bdf8; background: rgba(56,189,248,0.15); padding: 2px 6px; border-radius: 4px; white-space: nowrap;">Stufe ${tierNum}</span>
                <strong style="color: #f8fafc; font-size: 12.5px; white-space: nowrap; flex-shrink: 0; width: 195px; min-width: 195px;">${item.name}</strong>
                <span style="background: rgba(56, 189, 248, 0.15); border: 1px solid rgba(56, 189, 248, 0.3); color: #38bdf8; font-weight: 700; font-size: 11px; padding: 2px 7px; border-radius: 6px; white-space: nowrap; flex-shrink: 0; font-variant-numeric: tabular-nums; width: 68px; min-width: 68px; text-align: center; justify-content: center; display: inline-flex;">
                  ${item.badge}
                </span>
                ${!isRes ? `
                  <span style="color: #ef4444; font-size: 10.5px; font-weight: 700; display: inline-flex; align-items: center; gap: 4px; background: rgba(239, 68, 68, 0.12); border: 1px solid rgba(239, 68, 68, 0.3); padding: 2px 6px; border-radius: 6px; white-space: nowrap; flex-shrink: 0;">
                    ${icon('lock', '', 12)} Im Labor erforschen
                  </span>
                ` : ''}
              </div>
              <div style="display: flex; align-items: center; justify-content: flex-end; gap: 8px; flex-shrink: 0; margin-left: auto; flex-wrap: nowrap;">
                ${isRes ? `
                  <span style="font-size: 11px; background: rgba(56,189,248,0.15); color: #38bdf8; font-weight: 700; padding: 2px 7px; border-radius: 6px; white-space: nowrap; font-variant-numeric: tabular-nums; flex-shrink: 0; min-width: 68px; text-align: center; justify-content: center; display: inline-flex;">Vorrat: ${count}</span>
                  <div style="width: 115px; min-width: 115px; flex-shrink: 0;">
                    <button class="btn-buy-gadget btn-buy" data-gadget="${item.key}" data-price="${item.price}" style="width: 100%; height: 30px; padding: 0 4px; font-size: 11px; font-weight: 800; background: ${canAfford ? 'linear-gradient(135deg, #10b981, #059669)' : '#334155'}; color: ${canAfford ? '#ffffff' : '#94a3b8'}; display: inline-flex; align-items: center; justify-content: center; white-space: nowrap;" ${canAfford ? '' : 'disabled'}>
                      + Kaufen (€${item.price.toLocaleString()})
                    </button>
                  </div>
                ` : `
                  <div style="width: 115px; min-width: 115px; flex-shrink: 0;">
                    <button class="btn-buy" disabled style="width: 100%; height: 30px; padding: 0 6px; font-size: 10.5px; font-weight: 700; background: #1e293b; border: 1px solid rgba(239, 68, 68, 0.3); color: #ef4444; display: inline-flex; align-items: center; justify-content: center; gap: 4px; opacity: 0.85; white-space: nowrap; box-sizing: border-box;">
                      ${icon('lock', '', 12)}
                      <span>Labor</span>
                    </button>
                  </div>
                `}
              </div>
            </div>
          `;
        }).join('');

        return `
          <div class="tech-category-card" style="margin-bottom: 8px;">
            <div class="cat-header-row" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <div class="cat-title-wrap" style="display: flex; align-items: center; gap: 8px; font-weight: 700; font-size: 13px; color: #f8fafc;">
                ${icon(track.iconName, '', 16)}
                <span>${track.title}</span>
              </div>
              <div class="cat-status-pill" style="font-size: 11px; color: #94a3b8; background: rgba(255, 255, 255, 0.06); padding: 3px 8px; border-radius: 6px;">
                Stufe ${curResTier}/${totalTiers} • <strong style="color: ${curResTier > 0 ? '#10b981' : '#94a3b8'};">${curItem ? curItem.badge : 'Nicht erforscht'}</strong>
              </div>
            </div>

            ${segmentsHtml}
            <div style="display: flex; flex-direction: column; gap: 4px; margin-top: 6px;">
              ${itemsRowsHtml}
            </div>
          </div>
        `;
      }).join('');

      const renderShopGadget = (item) => {
        const count = currentGadgets[item.key] || 0;
        const canAfford = this.player.cash >= item.price;
        const isResearched = isExpeditionItemResearched(this.player, item);

        return `
          <div style="
            background: #090e1a;
            border: 1px solid ${isResearched ? 'rgba(255,255,255,0.12)' : 'rgba(239, 68, 68, 0.25)'};
            box-shadow: 0 3px 8px rgba(0, 0, 0, 0.35);
            border-radius: 10px;
            padding: 9px 12px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
            min-height: 52px;
            box-sizing: border-box;
            opacity: ${isResearched ? '1' : '0.85'};
          ">
            <div style="display: flex; align-items: center; gap: 10px; min-width: 0; flex: 1 1 auto;">
              <div style="width: 36px; height: 36px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.35); border-radius: 8px; border: 1px solid rgba(255,255,255,0.06); color: #38bdf8;">
                ${icon(item.icon || 'package', '', 20)}
              </div>
              <div style="min-width: 0; flex: 1 1 auto;">
                <div style="display: flex; align-items: center; gap: 8px; flex-wrap: nowrap;">
                  <span style="font-size: 12.5px; font-weight: 700; color: #f8fafc; white-space: nowrap; width: 220px; min-width: 220px; max-width: 220px; overflow: hidden; text-overflow: ellipsis;">${item.name}</span>
                  <span style="font-size: 9.5px; font-weight: 800; padding: 2px 6px; border-radius: 5px; background: rgba(168,85,247,0.15); color: #a855f7; white-space: nowrap; flex-shrink: 0; width: 76px; min-width: 76px; text-align: center; display: inline-flex; align-items: center; justify-content: center;">${item.badge}</span>
                  ${!isResearched ? `<span style="font-size: 9.5px; font-weight: 800; padding: 2px 6px; border-radius: 5px; background: rgba(239, 68, 68, 0.18); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); white-space: nowrap; flex-shrink: 0; display: inline-flex; align-items: center; gap: 3px;">${icon('lock', '', 11)} Im Labor erforschen</span>` : ''}
                </div>
                <div style="font-size: 10.5px; color: #94a3b8; line-height: 1.35; margin-top: 2px;">
                  ${item.desc}
                </div>
              </div>
            </div>
            <div style="display: flex; align-items: center; justify-content: flex-end; gap: 8px; flex-shrink: 0; margin-left: auto; flex-wrap: nowrap;">
              ${isResearched ? `
                <span style="font-size: 11px; font-weight: 700; color: #38bdf8; background: rgba(56,189,248,0.15); padding: 2px 7px; border-radius: 6px; white-space: nowrap; font-variant-numeric: tabular-nums; flex-shrink: 0; min-width: 68px; text-align: center; justify-content: center; display: inline-flex;">
                  Vorrat: ${count}
                </span>
                <div style="width: 115px; min-width: 115px; flex-shrink: 0;">
                  <button id="btn-buy-${item.key}" class="btn-buy-gadget btn-buy" data-gadget="${item.key}" data-price="${item.price}" style="width: 100%; height: 30px; padding: 0 4px; font-size: 11px; font-weight: 800; display: inline-flex; align-items: center; justify-content: center; gap: 4px; white-space: nowrap; box-sizing: border-box; background: ${canAfford ? 'linear-gradient(135deg, #10b981, #059669)' : '#334155'}; color: ${canAfford ? '#ffffff' : '#94a3b8'};" ${canAfford ? '' : 'disabled'}>
                    + Kaufen (€${item.price.toLocaleString()})
                  </button>
                </div>
              ` : `
                <div style="width: 115px; min-width: 115px; flex-shrink: 0;">
                  <button class="btn-buy" disabled style="width: 100%; height: 30px; padding: 0 6px; font-size: 10.5px; font-weight: 700; background: #1e293b; border: 1px solid rgba(239, 68, 68, 0.3); color: #ef4444; display: inline-flex; align-items: center; justify-content: center; gap: 4px; opacity: 0.85; white-space: nowrap; box-sizing: border-box;">
                    ${icon('lock', '', 12)}
                    <span>Labor</span>
                  </button>
                </div>
              `}
            </div>
          </div>
        `;
      };

      tabContentHtml = `
        <div style="display: flex; flex-direction: column; gap: 14px;">
          <div style="display: flex; flex-direction: column; gap: 8px;">
            <span style="font-size: 11.5px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; display: inline-flex; align-items: center; gap: 5px;">
              ${icon('anchor', '', 12)} Stationen-Ausbau
            </span>
            <div style="display: flex; flex-direction: column; gap: 8px;">
              ${tracksHtml}
            </div>
          </div>

          <div style="display: flex; flex-direction: column; gap: 8px;">
            <span style="font-size: 11.5px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; display: inline-flex; align-items: center; gap: 5px;">
              ${icon('package', '', 12)} Verbrauchsgüter & Gadgets
            </span>
            <div style="display: flex; flex-direction: column; gap: 6px;">
              ${gadgetsItems.map(renderShopGadget).join('')}
            </div>
          </div>
        </div>
      `;
    }

    // Zusammenbau des scrollbaren Modals
    this.modalBodyEl.innerHTML = `
      <div class="register-tab-container" style="display: flex; flex-direction: column; max-width: 760px; margin: 0 auto; width: 100%; box-sizing: border-box; padding: 0 4px 54px 4px; gap: 0 !important; row-gap: 0 !important;">
        ${tabNavHtml}
        <div class="register-tab-panel">
          ${tabContentHtml}
        </div>
      </div>
    `;

    if (currentTab === 'storage') {
      this.setFloatingAction(`
        <button id="btn-depot-all-ores" class="btn-buy btn-flyover" style="gap: 6px;" ${playerCargoOreLength > 0 && freeDepot > 0 ? '' : 'disabled'}>
          ${icon('arrow-down-to-line', '', 14)}
          <span>Alle Erze einlagern (${playerCargoOreLength})</span>
        </button>
      `, (container) => {
        const btn = container.querySelector('#btn-depot-all-ores');
        if (btn) {
          btn.onclick = (e) => {
            e.stopPropagation();
            this.depositAllOres();
          };
        }
      });
    } else if (currentTab === 'upgrades' && nextTierData && canAffordDepot) {
      this.setFloatingAction(`
        <button id="btn-depot-floating-upgrade" class="btn-buy btn-flyover" style="gap: 6px; background: linear-gradient(135deg, #10b981, #059669);">
          ${icon('wrench', '', 14)}
          <span>Depot ausbauen auf Stufe ${nextTierData.tier}</span>
        </button>
      `, (container) => {
        const btn = container.querySelector('#btn-depot-floating-upgrade');
        if (btn) {
          btn.onclick = (e) => {
            e.stopPropagation();
            this.upgradeDepot();
          };
        }
      });
    } else {
      this.clearFloatingAction();
    }

    try {
      soundFx.stopAllLoops?.();
    } catch (_) {}
    document.body.classList.add('modal-open');
    this.modalEl.style.display = 'flex';
    refreshIcons(this.modalEl);

    // Event Listener anbinden
    this.attachDepotEventListeners();
  }

  attachDepotEventListeners() {
    const body = this.modalBodyEl;
    if (!body) return;

    // Tab-Umschaltung
    body.querySelectorAll('.depot-tab-btn').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const tab = btn.getAttribute('data-tab');
        if (tab) {
          this.depot.currentTab = tab;
          this.renderDepotModal();
        }
      };
    });

    // Bulk Aktionen: Nur Erze aus dem Bohrer einlagern
    const btnAllOres = document.getElementById('btn-depot-all-ores');
    if (btnAllOres) {
      btnAllOres.onclick = (e) => {
        e.stopPropagation();
        this.depositAllOres();
      };
    }

    // Klick auf Erz-Kachel öffnet das Info-Popup
    body.querySelectorAll('.depot-ore-card').forEach(card => {
      card.onclick = (e) => {
        e.stopPropagation();
        const key = card.getAttribute('data-key');
        if (key) {
          showOreInfoModal(key, this.scene);
        }
      };
    });

    // Klick auf Waren- & Bauteil-Kachel öffnet das neue Waren-Info-Popup
    body.querySelectorAll('.depot-goods-card').forEach(card => {
      card.onclick = (e) => {
        e.stopPropagation();
        const key = card.getAttribute('data-key');
        if (key) {
          showGoodsInfoModal(key, this.scene);
        }
      };
    });

    // Ausbau (in Tab 2 oder Floating)
    const btnUpgrade = body.querySelector('#btn-depot-upgrade');
    if (btnUpgrade) {
      btnUpgrade.onclick = (e) => {
        e.stopPropagation();
        this.upgradeDepot();
      };
    }
    const btnFloatingUpgrade = document.getElementById('btn-depot-floating-upgrade');
    if (btnFloatingUpgrade) {
      btnFloatingUpgrade.onclick = (e) => {
        e.stopPropagation();
        this.upgradeDepot();
      };
    }

    // Bohrer-Upgrades Montage-Handler im Depot registrieren
    this.bindDrillerMountHandlers('depot', () => this.renderDepotModal());

    // Expeditions-Ausrüstung & Untertage-Stationen kaufen
    body.querySelectorAll('.btn-buy-gadget').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const key = btn.getAttribute('data-gadget');
        const price = parseInt(btn.getAttribute('data-price'), 10);
        if (this.buyGadget(key, price)) {
          this.renderDepotModal();
        }
      };
    });
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

    this.updateBuildingVisuals();
    soundFx.playUpgrade();
    this.renderDepotModal();
    if (this.scene.hud) this.scene.hud.update();
    this.scene.events.emit('notify', `🎉 Depot ausgebaut auf Stufe ${this.depot.tier} (${this.depot.capacity} Plätze)!`);
  }

  // =========================================================
  // 2. STEINSAMMLER / STEINFORSCHER (IM BÜRO INTEGRIERT)
  // =========================================================
  openGeologistModal() {
    if (this.scene?.hud?.missionsModal) {
      this.scene.hud.missionsModal.open('geologist');
    }
  }

  // =========================================================
  // 3. TECH-LABOR (KOMPLEXES UPGRADE-SYSTEM OHNE FILTERLEISTE)
  // =========================================================
  openLabModal(tab = null) {
    const p = this.player;
    if (tab && ['vehicle', 'infrastructure', 'infra'].includes(tab)) {
      this.activeLabTab = tab === 'infra' ? 'infrastructure' : tab;
    }
    if (!this.activeLabTab) this.activeLabTab = 'vehicle';
    const activeLabTab = this.activeLabTab;

    const labTabs = [
      { id: 'vehicle', label: 'Bohrfahrzeug-Module', icon: 'wrench' },
      { id: 'infrastructure', label: 'Infrastruktur', icon: 'package' }
    ];

    const tabNavHtml = `
      <div class="register-tab-bar">
        ${labTabs.map(t => {
          const isActive = activeLabTab === t.id;
          return `
            <button class="register-tab lab-tab-btn ${isActive ? 'active' : ''}" data-tab="${t.id}">
              ${icon(t.icon, '', 14)}
              <span>${t.label}</span>
            </button>
          `;
        }).join('')}
      </div>
    `;

    const vehicleTracks = [
      {
        id: 'tank',
        title: 'TREIBSTOFF-TANK',
        iconName: 'fuel',
        currentTier: p.researchedTankTier || p.tankTier || 1,
        installedTier: p.tankTier || 1,
        maxTier: TANK_TIERS.length,
        tiers: TANK_TIERS,
        apply: (tier) => {
          p.researchedTankTier = tier;
        }
      },
      {
        id: 'hull',
        title: 'PANZERUNG',
        iconName: 'shield-cog',
        currentTier: p.researchedHullTier || p.hullTier || 1,
        installedTier: p.hullTier || 1,
        maxTier: HULL_TIERS.length,
        tiers: HULL_TIERS,
        apply: (tier) => {
          p.researchedHullTier = tier;
        }
      },
      {
        id: 'drill',
        title: 'BOHRKOPF',
        iconName: 'pickaxe',
        currentTier: p.researchedDrillTier || p.drillTier || 1,
        installedTier: p.drillTier || 1,
        maxTier: DRILL_DATA.length,
        tiers: DRILL_DATA,
        apply: (tier) => {
          p.researchedDrillTier = tier;
        }
      },
      {
        id: 'engine',
        title: 'ANTRIEB',
        iconName: 'zap',
        currentTier: p.researchedEngineTier || p.engineTier || 1,
        installedTier: p.engineTier || 1,
        maxTier: ENGINE_TIERS.length,
        tiers: ENGINE_TIERS,
        apply: (tier) => {
          p.researchedEngineTier = tier;
        }
      },
      {
        id: 'cargo',
        title: 'FRACHTRAUM',
        iconName: 'container',
        currentTier: p.researchedCargoTier || p.cargoTier || 1,
        installedTier: p.cargoTier || 1,
        maxTier: CARGO_TIERS.length,
        tiers: CARGO_TIERS,
        apply: (tier) => {
          p.researchedCargoTier = tier;
        }
      },
      {
        id: 'sensor',
        title: 'RADAR',
        iconName: 'radio',
        currentTier: p.researchedSensorTier || p.sensorTier || 1,
        installedTier: p.sensorTier || 1,
        maxTier: SENSOR_TIERS.length,
        tiers: SENSOR_TIERS,
        apply: (tier) => {
          p.researchedSensorTier = tier;
        }
      }
    ];

    const infraTracks = [
      {
        id: 'tnt',
        title: 'SPRENGTECHNIK',
        iconName: 'flame',
        currentTier: p.researchedTnt || 0,
        installedTier: p.researchedTnt || 0,
        maxTier: 7,
        tiers: [
          {
            tier: 1,
            name: 'Dynamit-Sprengsatz Stufe 1',
            stat: '3x3 Feld',
            cost: 850,
            level: 1,
            comp: { key: 'iron_tube', name: 'Stahl-Rohr', count: 1 },
            desc: 'Erforscht die kontrollierte Gesteinssprengung per Fernzünder. Schaltet Dynamit im Depot-Shop frei.'
          },
          {
            tier: 2,
            name: 'Verstärkte Ladung Stufe 2',
            stat: '4x4 Feld',
            cost: 2800,
            level: 2,
            comp: { key: 'bronze_gear', name: 'Bronze-Getriebe', count: 1 },
            desc: 'Kompaktierter Sprengstoff vergrößert den Explosionsradius auf ein 4x4-Feld.'
          },
          {
            tier: 3,
            name: 'Hohlladungs-Sprengstoff Stufe 3',
            stat: '5x5 Feld',
            cost: 7500,
            level: 3,
            comp: { key: 'silver_coil', name: 'Silber-Spule', count: 1 },
            desc: 'Gerichtete Detonationswellen sprengen gigantische 5x5-Kavernen in den Fels.'
          },
          {
            tier: 4,
            name: 'Seismische Megaladung Stufe 4',
            stat: '6x6 Feld',
            cost: 18000,
            level: 4,
            comp: { key: 'crystal_lens', name: 'Kristall-Linse', count: 1 },
            desc: 'Maximale seismische Sprengkraft bis 6x6 Kacheln für massive Durchbrüche im tiefsten Gestein.'
          },
          {
            tier: 5,
            name: 'Thermo-Kavitationsladung Stufe 5',
            stat: '7x7 Feld',
            cost: 42000,
            level: 5,
            comp: { key: 'plasma_regulator', name: 'Plasma-Injektor', count: 1 },
            desc: 'Hochenergetische Implosions-Kavitation sprengt ein gewaltiges 7x7-Feld im Gestein frei.'
          },
          {
            tier: 6,
            name: 'Subatomare Schockwelle Stufe 6',
            stat: '8x8 Feld',
            cost: 95000,
            level: 6,
            comp: { key: 'titan_bolt', name: 'Titan-Bolzen', count: 2 },
            desc: 'Verdichtete Schockwellen pulverisieren selbst härtestes Basaltgestein in einem 8x8-Feld.'
          },
          {
            tier: 7,
            name: 'Gravitations-Kollapsor Stufe 7',
            stat: '9x9 Feld',
            cost: 220000,
            level: 8,
            comp: { key: 'graviton_core', name: 'Gravitations-Modulator', count: 1 },
            desc: 'Ultimative Detonations-Matrix erzeugt einen gewaltigen 9x9-Durchbruch in tiefsten Urgesteinschichten.'
          }
        ],
        apply: (tier) => {
          p.researchedTnt = tier;
        }
      },
      {
        id: 'emergency_gear',
        title: 'NOTFALL-EXPEDITIONSAUSRÜSTUNG',
        iconName: 'package',
        currentTier: p.researchedEmergency || 0,
        installedTier: p.researchedEmergency || 0,
        maxTier: 1,
        tiers: [
          {
            tier: 1,
            name: 'Notfall-Expeditionsset',
            stat: '+20L / +40HP',
            cost: 550,
            level: 1,
            comp: null,
            desc: 'Schaltet Notfall-Treibstoffkanister und Feld-Reparatur-Kits im Depot-Shop frei.'
          }
        ],
        apply: (tier) => {
          p.researchedEmergency = tier;
        }
      },
      {
        id: 'station_tube',
        title: 'UNTERTAGE-ERZFÖRDERSCHÄCHTE',
        iconName: 'conveyor-belt',
        currentTier: p.researchedStationTube || 0,
        installedTier: p.researchedStationTube || 0,
        maxTier: 3,
        tiers: [
          {
            tier: 1,
            name: 'Förderschacht (Schicht 1 & 2)',
            stat: '0–180m',
            cost: 850,
            level: 1,
            comp: { key: 'iron_tube', name: 'Stahl-Rohr', count: 1 },
            desc: 'Schaltet pneumatische Förderschächte für Schicht 1 & 2 im Depot-Shop frei.'
          },
          {
            tier: 2,
            name: 'Förderschacht (Schicht 3 & 4)',
            stat: '180–950m',
            cost: 3600,
            level: 2,
            comp: { key: 'bronze_gear', name: 'Bronze-Getriebe', count: 1 },
            desc: 'Schaltet druckfeste Förderschächte für Schicht 3 & 4 im Depot-Shop frei.'
          },
          {
            tier: 3,
            name: 'Förderschacht (Schicht 5)',
            stat: '>950m',
            cost: 15000,
            level: 4,
            comp: { key: 'titan_bolt', name: 'Titan-Bolzen', count: 1 },
            desc: 'Schaltet Tiefen-Förderschächte für Urgestein (>950m) im Depot-Shop frei.'
          }
        ],
        apply: (tier) => {
          p.researchedStationTube = tier;
        }
      },
      {
        id: 'station_fuel',
        title: 'UNTERTAGE-TANKANLAGEN',
        iconName: 'fuel',
        currentTier: p.researchedStationFuel || 0,
        installedTier: p.researchedStationFuel || 0,
        maxTier: 3,
        tiers: [
          {
            tier: 1,
            name: 'Tankanlage (Schicht 1 & 2)',
            stat: '0–180m',
            cost: 950,
            level: 1,
            comp: { key: 'iron_tube', name: 'Stahl-Rohr', count: 1 },
            desc: 'Schaltet Untertage-Tankanlagen für Schicht 1 & 2 im Depot-Shop frei.'
          },
          {
            tier: 2,
            name: 'Tankanlage (Schicht 3 & 4)',
            stat: '180–950m',
            cost: 4800,
            level: 2,
            comp: { key: 'silver_coil', name: 'Silber-Spule', count: 1 },
            desc: 'Schaltet Hochdruck-Tankanlagen für Schicht 3 & 4 im Depot-Shop frei.'
          },
          {
            tier: 3,
            name: 'Tankanlage (Schicht 5)',
            stat: '>950m',
            cost: 18500,
            level: 4,
            comp: { key: 'crystal_lens', name: 'Kristall-Linse', count: 1 },
            desc: 'Schaltet thermo-resistente Tankanlagen für Urgestein (>950m) im Depot-Shop frei.'
          }
        ],
        apply: (tier) => {
          p.researchedStationFuel = tier;
        }
      }
    ];

    const tracks = activeLabTab === 'infrastructure' ? infraTracks : vehicleTracks;

    // Feste Kategorien mit Segmented Progress Bar
    let cardsHtml = '<div class="tech-lab-categories" style="display: flex; flex-direction: column; gap: 14px;">';

    tracks.forEach((track) => {
      const currentTierData = track.currentTier > 0 ? track.tiers[track.currentTier - 1] : { stat: 'Nicht erforscht' };
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
          <div class="cat-action-row" style="margin-top: 8px; display: flex; align-items: center; justify-content: space-between; background: rgba(15,23,42,0.6); padding: 7px 12px; border-radius: 8px; gap: 8px; box-sizing: border-box; flex-wrap: nowrap; min-height: 44px;">
            <!-- Linke Seite: Name, Stat, Level und Komponenten -->
            <div style="display: flex; align-items: center; gap: 8px; flex: 1 1 auto; min-width: 0; flex-wrap: nowrap;">
              <strong style="color: #f8fafc; font-size: 12.5px; white-space: nowrap; flex-shrink: 0; width: 205px; min-width: 205px;">${nextTier.name}</strong>
              <span style="background: rgba(56, 189, 248, 0.15); border: 1px solid rgba(56, 189, 248, 0.3); color: #38bdf8; font-weight: 700; font-size: 11px; padding: 2px 7px; border-radius: 6px; white-space: nowrap; flex-shrink: 0; font-variant-numeric: tabular-nums; width: 78px; min-width: 78px; text-align: center; justify-content: center; display: inline-flex;">
                ${nextTier.stat}
              </span>
              <div style="flex-shrink: 0; white-space: nowrap;">
                ${levelBadge}
              </div>
              <div style="display: inline-flex; align-items: center; gap: 4px; flex-shrink: 0; white-space: nowrap;">
                ${compBadge}
              </div>
            </div>

            <!-- Rechte Seite: Preis und Erforschen-Button -->
            <div style="display: flex; align-items: center; justify-content: flex-end; gap: 8px; flex-shrink: 0; margin-left: auto; flex-wrap: nowrap;">
              <div style="flex-shrink: 0; white-space: nowrap;">
                ${costBadge}
              </div>
              <div style="width: 105px; min-width: 105px; flex-shrink: 0;">
                <button class="btn-buy" id="btn-buy-track-${track.id}" ${canBuy ? '' : 'disabled'} style="width: 100%; height: 30px; padding: 0 6px; font-size: 11px; font-weight: 800; display: inline-flex; align-items: center; justify-content: center; gap: 4px; white-space: nowrap; box-sizing: border-box;">
                  ${icon('cpu', '', 12)}
                  <span>Erforschen</span>
                </button>
              </div>
            </div>
          </div>
        `;
      } else {
        actionHtml = `
          <div class="cat-action-row" style="margin-top: 8px; display: flex; align-items: center; justify-content: space-between; background: rgba(15,23,42,0.6); padding: 7px 12px; border-radius: 8px; gap: 8px; box-sizing: border-box; flex-wrap: nowrap; min-height: 44px;">
            <div style="flex: 1 1 auto; min-width: 0; display: flex; align-items: center; gap: 6px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
              <strong style="color: #10b981; font-size: 12.5px; display: inline-flex; align-items: center; gap: 6px; white-space: nowrap;">${icon('award', '', 14)} Vollständig erforscht</strong>
            </div>
            <div style="width: 105px; min-width: 105px; flex-shrink: 0; display: flex; align-items: center; justify-content: flex-end; margin-left: auto;">
              <span style="font-size: 11px; color: #10b981; font-weight: 700; background: rgba(16,185,129,0.15); border: 1px solid rgba(16,185,129,0.3); padding: 3px 8px; border-radius: 6px; display: inline-flex; align-items: center; justify-content: center; width: 100%; box-sizing: border-box; white-space: nowrap;">MAX</span>
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
            <div class="cat-status-pill" style="font-size: 11px; color: #94a3b8; display: flex; align-items: center; gap: 8px;">
              <span>Erforscht: Stufe ${track.currentTier}/${track.maxTier} • <strong style="color: ${track.currentTier > 0 ? '#10b981' : '#94a3b8'};">${currentTierData.stat}</strong></span>
            </div>
          </div>

          ${segmentsHtml}
          ${actionHtml}
        </div>
      `;
    });
    cardsHtml += '</div>';

    const fullContent = `
      <div class="register-tab-container" style="display: flex; flex-direction: column; max-width: 760px; margin: 0 auto; width: 100%; box-sizing: border-box; padding: 0 4px 50px 4px; gap: 0 !important; row-gap: 0 !important;">
        ${tabNavHtml}
        <div class="register-tab-panel">
          ${cardsHtml}
        </div>
      </div>
    `;
    this.openModal(`
      <div style="display: flex; align-items: center; gap: 8px;">
        ${icon('microscope', '', 18)}
        <span>LABOR</span>
      </div>
    `, fullContent);

    // Tab-Buttons Event Listener
    const modalBody = this.modalBodyEl;
    if (modalBody) {
      modalBody.querySelectorAll('.lab-tab-btn').forEach(btn => {
        btn.onclick = (e) => {
          e.stopPropagation();
          const tab = btn.getAttribute('data-tab');
          if (tab) {
            this.activeLabTab = tab;
            this.openLabModal();
          }
        };
      });
    }

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
            this.updateBuildingVisuals();
            soundFx.playPurchase();
            this.openLabModal();

            let notifyMsg = `Bauplan für ${nextTier.name} erforscht! Im HANGAR montieren.`;
            if (track.id === 'tnt') notifyMsg = `💥 Sprengtechnik (${nextTier.name}) erforscht! Jetzt im Depot-Shop erhältlich.`;
            else if (track.id === 'emergency_gear') notifyMsg = `🧰 Notfall-Versorgung (${nextTier.name}) erforscht! Jetzt im Depot-Shop erhältlich.`;
            else if (track.id === 'station_tube') notifyMsg = `🚀 Förderschächte (${nextTier.name}) erforscht! Jetzt im Depot-Shop erhältlich.`;
            else if (track.id === 'station_fuel') notifyMsg = `⛽ Tankanlagen (${nextTier.name}) erforscht! Jetzt im Depot-Shop erhältlich.`;
            this.scene.events.emit('notify', notifyMsg);
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
      const cName = COMPONENT_DATA[key]?.name || key;
      const compIcon = COMPONENT_ICONS[key] || 'box';
      const isMet = have >= count;
      reqCompsHtml.push(`
        <span style="background: ${isMet ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)'}; border: 1px solid ${isMet ? 'rgba(16, 185, 129, 0.35)' : 'rgba(239, 68, 68, 0.35)'}; color: ${isMet ? '#34d399' : '#f87171'}; font-size: 11.5px; font-weight: 700; padding: 4px 9px; border-radius: 6px; display: inline-flex; align-items: center; gap: 5px;">
          ${icon(compIcon, '', 13)} ${cName}: <span style="font-variant-numeric: tabular-nums;">${have}/${count}</span>
        </span>
      `);
    }

    const canBuild = canAffordCash && canAffordComp;

    const content = `
      <div style="display: flex; flex-direction: column; gap: 14px;">
        <p style="font-size: 13px; color: var(--text-muted); line-height: 1.5;">
          ${pb.desc}
        </p>

        <div style="background: rgba(15, 23, 42, 0.75); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 12px; display: flex; flex-direction: column; gap: 8px;">
          <strong style="color: #f8fafc; font-size: 12px; text-transform: uppercase;">Baukosten:</strong>
          <div style="font-size: 13px; display: flex; align-items: center; gap: 6px;">
            <span style="color: #94a3b8;">Finanzierung:</span>
            <strong style="color: ${canAffordCash ? '#fbbf24' : '#f87171'};">€${pb.costCash.toLocaleString('de-DE')}</strong>
          </div>
          <div style="display: flex; flex-direction: column; gap: 6px;">
            <span style="color: #94a3b8; font-size: 12px;">Benötigte Bauteile:</span>
            <div style="display: flex; flex-wrap: wrap; gap: 6px;">
              ${reqCompsHtml.join('')}
            </div>
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
    const curTier = Math.max(1, Math.min(3, pb.tier || 1));
    const tiers = PURCHASABLE_BUILDING_TIERS.drone_hangar;
    const curData = tiers[curTier - 1];
    const hasNext = curTier < 3;
    const nextData = hasNext ? tiers[curTier] : null;

    const ores = pb.storedOres || [];
    let oreList = ores.map(o => `<span style="background: rgba(255,255,255,0.08); padding: 3px 8px; border-radius: 6px; font-size: 12px; display: inline-flex; align-items: center; gap: 5px;">${oreIcon(o, 13)} ${ORE_DATA[o]?.name || o}</span>`).join(' ');
    if (ores.length === 0) oreList = '<span style="color: #94a3b8; font-style: italic;">Drohnen schürfen aktuell unter Tage...</span>';

    // Upgrade-Bedingungen prüfen
    let canAffordUpgrade = false;
    let upgradeCompsHtml = [];
    if (nextData) {
      const canAffordCash = this.player.cash >= nextData.costCash;
      let canAffordComps = true;
      for (const [key, count] of Object.entries(nextData.costComp)) {
        const have = this.player.components[key] || 0;
        if (have < count) canAffordComps = false;
        const cName = COMPONENT_DATA[key]?.name || key;
        const compIcon = COMPONENT_ICONS[key] || 'box';
        const isMet = have >= count;
        upgradeCompsHtml.push(`
          <span style="background: ${isMet ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)'}; border: 1px solid ${isMet ? 'rgba(16, 185, 129, 0.35)' : 'rgba(239, 68, 68, 0.35)'}; color: ${isMet ? '#34d399' : '#f87171'}; font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 6px; display: inline-flex; align-items: center; gap: 4px;">
            ${icon(compIcon, '', 12)} ${cName}: <span style="font-variant-numeric: tabular-nums;">${have}/${count}</span>
          </span>
        `);
      }
      canAffordUpgrade = canAffordCash && canAffordComps;
    }

    const content = `
      <div style="display: flex; flex-direction: column; gap: 14px;">
        <!-- Aktueller Status & Stufen-Badge -->
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px; flex-wrap: wrap;">
          <div style="display: flex; align-items: center; gap: 6px;">
            <span style="font-size: 11px; color: #38bdf8; font-weight: 800; background: rgba(56, 189, 248, 0.15); border: 1px solid rgba(56, 189, 248, 0.3); padding: 2px 8px; border-radius: 6px;">Stufe ${curTier}/3: ${curData.name}</span>
          </div>
          <span style="font-size: 11.5px; color: #94a3b8; font-weight: 600;">
            ${curData.drones}x Drohne(n) &bull; Zyklus: ${curData.intervalSec}s &bull; Silo: ${curData.capacity}
          </span>
        </div>

        <p style="font-size: 12.5px; color: var(--text-muted); line-height: 1.45; margin: 0;">
          ${curData.desc}
        </p>

        <!-- Silo & Funde -->
        <div style="background: rgba(15, 23, 42, 0.75); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 12px; display: flex; flex-direction: column; gap: 8px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <strong style="color: #f8fafc; font-size: 12px; text-transform: uppercase;">Eingelagerte Drohnen-Funde:</strong>
            <span style="font-size: 11.5px; font-weight: 700; color: ${ores.length >= curData.capacity ? '#ef4444' : '#38bdf8'}; font-variant-numeric: tabular-nums;">
              ${ores.length} / ${curData.capacity} Erze
            </span>
          </div>
          <div style="display: flex; flex-wrap: wrap; gap: 6px; min-height: 28px;">
            ${oreList}
          </div>
          <button id="btn-collect-drone-ores" class="btn-buy btn-lg" ${ores.length === 0 ? 'disabled' : ''} style="width: 100%; margin-top: 4px;">
            ${icon('container', '', 14)}
            <span>${ores.length > 0 ? `ALLE FUNDE (${ores.length}) INS FAHRZEUG ÜBERTRAGEN` : 'SILO IST AKTUELL LEER'}</span>
          </button>
        </div>

        <!-- Ausbau-Sektion -->
        ${hasNext ? `
          <div style="background: rgba(15, 23, 42, 0.75); border: 1px solid rgba(56, 189, 248, 0.25); border-radius: 10px; padding: 12px; display: flex; flex-direction: column; gap: 10px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <strong style="color: #38bdf8; font-size: 12px; text-transform: uppercase; display: inline-flex; align-items: center; gap: 5px;">
                ${icon('chevrons-up', '', 14)} Nächster Ausbau: Stufe ${nextData.tier} (${nextData.name})
              </strong>
            </div>
            <p style="font-size: 11.5px; color: #94a3b8; line-height: 1.4; margin: 0;">
              ${nextData.desc}
            </p>
            <div style="display: flex; flex-direction: column; gap: 6px;">
              <div style="font-size: 12.5px; display: flex; align-items: center; gap: 6px;">
                <span style="color: #94a3b8;">Kosten:</span>
                <strong style="color: ${this.player.cash >= nextData.costCash ? '#fbbf24' : '#f87171'};">€${nextData.costCash.toLocaleString('de-DE')}</strong>
              </div>
              <div style="display: flex; flex-wrap: wrap; gap: 6px;">
                ${upgradeCompsHtml.join('')}
              </div>
            </div>
            <button id="btn-upgrade-drone-hangar" class="btn-buy" ${canAffordUpgrade ? '' : 'disabled'} style="width: 100%; height: 34px; font-size: 12px; font-weight: 700; display: inline-flex; align-items: center; justify-content: center; gap: 6px;">
              ${icon('arrow-up-circle', '', 14)}
              <span>DROHNEN-HANGAR AUF STUFE ${nextData.tier} AUSBAUEN</span>
            </button>
          </div>
        ` : `
          <div style="background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.25); border-radius: 8px; padding: 10px; text-align: center; font-size: 12px; color: #34d399; font-weight: 700; display: inline-flex; align-items: center; justify-content: center; gap: 6px;">
            ${icon('check-circle', '', 15)} Maximale Ausbaustufe 3 erreicht (Quanten-Drohnenmatrix aktiv)
          </div>
        `}
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

    const btnUpgrade = document.getElementById('btn-upgrade-drone-hangar');
    if (btnUpgrade) {
      btnUpgrade.onclick = () => this.upgradePurchasableBuilding('drone_hangar');
    }
  }

  // 4b. Geothermie-Kraftwerk Modal
  openPowerplantModal() {
    const pb = this.purchasableBuildings.find(b => b.id === 'powerplant');
    const curTier = Math.max(1, Math.min(3, pb.tier || 1));
    const tiers = PURCHASABLE_BUILDING_TIERS.powerplant;
    const curData = tiers[curTier - 1];
    const hasNext = curTier < 3;
    const nextData = hasNext ? tiers[curTier] : null;
    const totalAcc = pb.accumulatedCash || 0;

    // Upgrade-Bedingungen prüfen
    let canAffordUpgrade = false;
    let upgradeCompsHtml = [];
    if (nextData) {
      const canAffordCash = this.player.cash >= nextData.costCash;
      let canAffordComps = true;
      for (const [key, count] of Object.entries(nextData.costComp)) {
        const have = this.player.components[key] || 0;
        if (have < count) canAffordComps = false;
        const cName = COMPONENT_DATA[key]?.name || key;
        const compIcon = COMPONENT_ICONS[key] || 'box';
        const isMet = have >= count;
        upgradeCompsHtml.push(`
          <span style="background: ${isMet ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)'}; border: 1px solid ${isMet ? 'rgba(16, 185, 129, 0.35)' : 'rgba(239, 68, 68, 0.35)'}; color: ${isMet ? '#34d399' : '#f87171'}; font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 6px; display: inline-flex; align-items: center; gap: 4px;">
            ${icon(compIcon, '', 12)} ${cName}: <span style="font-variant-numeric: tabular-nums;">${have}/${count}</span>
          </span>
        `);
      }
      canAffordUpgrade = canAffordCash && canAffordComps;
    }

    const content = `
      <div style="display: flex; flex-direction: column; gap: 14px;">
        <!-- Aktueller Status & Stufen-Badge -->
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px; flex-wrap: wrap;">
          <div style="display: flex; align-items: center; gap: 6px;">
            <span style="font-size: 11px; color: #f59e0b; font-weight: 800; background: rgba(245, 158, 11, 0.15); border: 1px solid rgba(245, 158, 11, 0.3); padding: 2px 8px; border-radius: 6px;">Stufe ${curTier}/3: ${curData.name}</span>
          </div>
          <span style="font-size: 12px; color: #34d399; font-weight: 800;">
            +€${curData.cashPerTick} alle 8s
          </span>
        </div>

        <p style="font-size: 12.5px; color: var(--text-muted); line-height: 1.45; margin: 0;">
          ${curData.desc}
        </p>

        <!-- Energie & Ertrag Info-Card -->
        <div style="background: rgba(15, 23, 42, 0.75); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 12px; display: flex; flex-direction: column; gap: 10px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <strong style="color: #10b981; font-size: 12.5px; display: block;">STROMERZEUGUNG AKTIV</strong>
              <span style="font-size: 11px; color: #94a3b8;">Einspeisung: +€${curData.cashPerTick} / 8s ins Basis-Netz</span>
            </div>
            <span style="font-size: 12px; font-weight: 800; color: #fbbf24;">Gesamt: €${totalAcc.toLocaleString('de-DE')}</span>
          </div>
          <div style="background: rgba(56, 189, 248, 0.1); border: 1px solid rgba(56, 189, 248, 0.25); border-radius: 6px; padding: 8px 10px; font-size: 11.5px; color: #38bdf8; display: flex; align-items: center; gap: 6px;">
            ${icon('zap', '', 13)}
            <span>Starkstrom-Booster: <strong>${curData.fuelMult}x</strong> Tank- & <strong>${curData.repairMult}x</strong> Reparatur-Geschwindigkeit im Hangar!</span>
          </div>
        </div>

        <!-- Ausbau-Sektion -->
        ${hasNext ? `
          <div style="background: rgba(15, 23, 42, 0.75); border: 1px solid rgba(245, 158, 11, 0.25); border-radius: 10px; padding: 12px; display: flex; flex-direction: column; gap: 10px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <strong style="color: #f59e0b; font-size: 12px; text-transform: uppercase; display: inline-flex; align-items: center; gap: 5px;">
                ${icon('chevrons-up', '', 14)} Nächster Ausbau: Stufe ${nextData.tier} (${nextData.name})
              </strong>
            </div>
            <p style="font-size: 11.5px; color: #94a3b8; line-height: 1.4; margin: 0;">
              ${nextData.desc}
            </p>
            <div style="display: flex; flex-direction: column; gap: 6px;">
              <div style="font-size: 12.5px; display: flex; align-items: center; gap: 6px;">
                <span style="color: #94a3b8;">Kosten:</span>
                <strong style="color: ${this.player.cash >= nextData.costCash ? '#fbbf24' : '#f87171'};">€${nextData.costCash.toLocaleString('de-DE')}</strong>
              </div>
              <div style="display: flex; flex-wrap: wrap; gap: 6px;">
                ${upgradeCompsHtml.join('')}
              </div>
            </div>
            <button id="btn-upgrade-powerplant" class="btn-buy" ${canAffordUpgrade ? '' : 'disabled'} style="width: 100%; height: 34px; font-size: 12px; font-weight: 700; display: inline-flex; align-items: center; justify-content: center; gap: 6px;">
              ${icon('arrow-up-circle', '', 14)}
              <span>KRAFTWERK AUF STUFE ${nextData.tier} AUSBAUEN</span>
            </button>
          </div>
        ` : `
          <div style="background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.25); border-radius: 8px; padding: 10px; text-align: center; font-size: 12px; color: #34d399; font-weight: 700; display: inline-flex; align-items: center; justify-content: center; gap: 6px;">
            ${icon('check-circle', '', 15)} Maximale Ausbaustufe 3 erreicht (Quanten-Fusionskraftwerk aktiv)
          </div>
        `}
      </div>
    `;

    this.openModal(`
      <div style="display: flex; align-items: center; gap: 8px;">
        ${icon('zap', '', 18)}
        <span>KRAFTWERK</span>
      </div>
    `, content);

    const btnUpgrade = document.getElementById('btn-upgrade-powerplant');
    if (btnUpgrade) {
      btnUpgrade.onclick = () => this.upgradePurchasableBuilding('powerplant');
    }
  }

  upgradePurchasableBuilding(buildingId) {
    const pb = this.purchasableBuildings.find(b => b.id === buildingId);
    if (!pb || !pb.isBuilt) return;

    const curTier = Math.max(1, Math.min(3, pb.tier || 1));
    if (curTier >= 3) return;

    const tiers = PURCHASABLE_BUILDING_TIERS[buildingId];
    if (!tiers) return;
    const nextTierData = tiers[curTier];
    if (!nextTierData) return;

    if (this.player.cash < nextTierData.costCash) return;
    for (const [key, count] of Object.entries(nextTierData.costComp)) {
      if ((this.player.components[key] || 0) < count) return;
    }

    this.player.cash -= nextTierData.costCash;
    for (const [key, count] of Object.entries(nextTierData.costComp)) {
      this.player.components[key] -= count;
    }

    pb.tier = curTier + 1;
    if (pb.textLabel) {
      pb.textLabel.setText(`${pb.label || pb.title} Lvl ${pb.tier}`);
    }

    soundFx.playPurchase();
    this.scene.events.emit('notify', `⚡ ${pb.title} auf Stufe ${pb.tier} (${nextTierData.name}) ausgebaut!`);

    if (buildingId === 'drone_hangar') {
      this.openDroneModal();
    } else if (buildingId === 'powerplant') {
      this.openPowerplantModal();
    }
  }

  // =========================================================
  // BASIS-DOCKING & SCHMELZOFEN
  // =========================================================
  openDockModal(tab = null) {
    if (tab && ['workshop', 'gear'].includes(tab)) {
      this.activeDockTab = tab;
    }
    if (!this.activeDockTab) this.activeDockTab = 'workshop';
    const currentTab = this.activeDockTab;

    // ── Hangar-Infrastruktur (Betankungs- & Reparaturrate) ──
    const curHangarTier = Math.max(1, Math.min(HANGAR_TIERS.length, this.hangarTier || 1));
    const curHangarData = HANGAR_TIERS[curHangarTier - 1] || HANGAR_TIERS[0];
    const hasNextHangar = curHangarTier < HANGAR_TIERS.length;
    const nextHangarData = hasNextHangar ? HANGAR_TIERS[curHangarTier] : null;

    let canAffordHangar = false;
    let missingHangarReason = '';
    let compsBadgeHtml = '';

    if (hasNextHangar && nextHangarData) {
      const hasCash = this.player.cash >= nextHangarData.costCash;
      let hasComps = true;
      const missingComps = [];

      if (nextHangarData.costComps && nextHangarData.costComps.length > 0) {
        compsBadgeHtml = nextHangarData.costComps.map(mc => {
          const count = this.player.components[mc.key] || 0;
          const ok = count >= mc.count;
          if (!ok) {
            hasComps = false;
            missingComps.push(`${mc.count}x ${mc.name}`);
          }
          const cData = COMPONENT_DATA[mc.key];
          const iconStr = cData ? icon(cData.icon, '', 11) : '';
          return `
            <span style="background: rgba(16, 185, 129, 0.12); border: 1px solid ${ok ? 'rgba(16, 185, 129, 0.35)' : 'rgba(239, 68, 68, 0.35)'}; color: ${ok ? '#34d399' : '#f87171'}; font-weight: 700; font-size: 10.5px; padding: 2px 6px; border-radius: 6px; display: inline-flex; align-items: center; gap: 3px; white-space: nowrap;">
              ${iconStr} ${mc.count}x ${mc.name} <span style="font-size: 9.5px; opacity: 0.85;">(${count}/${mc.count})</span>
            </span>
          `;
        }).join(' ');
      }

      canAffordHangar = hasCash && hasComps;
      if (!hasCash) missingHangarReason = `Fehlendes Bargeld ($${nextHangarData.costCash.toLocaleString('de-DE')})`;
      else if (!hasComps) missingHangarReason = `Fehlende Bauteile: ${missingComps.join(', ')}`;
    }

    const pp = this.purchasableBuildings?.find(b => b.id === 'powerplant');
    const hasPowerplant = !!(pp?.isBuilt);
    const ppTier = Math.max(1, Math.min(3, pp?.tier || 1));
    const fuelMult = hasPowerplant ? (ppTier === 3 ? 3.5 : (ppTier === 2 ? 2.5 : 2.0)) : 1;
    const repairMult = hasPowerplant ? (ppTier === 3 ? 3.0 : (ppTier === 2 ? 2.0 : 1.5)) : 1;
    const effFuelSpeed = Math.round(curHangarData.fuelSpeed * fuelMult);
    const effRepairSpeed = Math.round(curHangarData.repairSpeed * repairMult);

    // Register-Tabs wie im Depot
    const dockTabs = [
      { id: 'workshop', label: 'Werkstatt', icon: 'wrench', badge: null },
      { id: 'gear', label: 'Ausrüstung', icon: 'backpack', badge: null }
    ];

    const tabNavHtml = `
      <div class="register-tab-bar">
        ${dockTabs.map(t => {
          const isActive = t.id === currentTab;
          return `
            <button class="register-tab dock-tab-btn ${isActive ? 'active' : ''}" data-tab="${t.id}">
              ${icon(t.icon, '', 14)}
              <span>${t.label}</span>
              ${t.badge ? `<span class="tab-badge">${t.badge}</span>` : ''}
            </button>
          `;
        }).join('')}
      </div>
    `;

    let tabContentHtml = '';

    if (currentTab === 'workshop') {
      // 1. Kompakter Gebäude-Ausbau (Hangar) wie im Depot!
      let hangarUpgradeBtnHtml = '';
      if (hasNextHangar && nextHangarData) {
        hangarUpgradeBtnHtml = `
          <button id="btn-upgrade-hangar-dock" class="btn-buy btn-sm" ${canAffordHangar ? '' : 'disabled'} style="white-space: nowrap; flex-shrink: 0;" title="${!canAffordHangar ? missingHangarReason : `Auf Stufe ${nextHangarData.tier} (${nextHangarData.name}) ausbauen`}">
            ${icon('chevrons-up', '', 12)}
            <span>Lvl ${nextHangarData.tier} &bull; €${nextHangarData.costCash.toLocaleString('de-DE')}</span>
          </button>
        `;
      } else {
        hangarUpgradeBtnHtml = `
          <span style="font-size: 11px; font-weight: 800; color: #10b981; background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 6px; padding: 4px 10px; white-space: nowrap; flex-shrink: 0; display: inline-flex; align-items: center; gap: 4px;">
            ${icon('check', '', 12)}
            <span>MAX</span>
          </span>
        `;
      }

      const compactBuildingHtml = `
        <div style="background: #090e1a; border: 1px solid rgba(255, 255, 255, 0.14); box-shadow: 0 4px 12px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.08); border-radius: 10px; padding: 8px 12px; display: flex; justify-content: space-between; align-items: center; gap: 10px; flex-wrap: nowrap; min-height: 52px; box-sizing: border-box;">
          <div style="display: flex; align-items: center; gap: 8px; flex: 1 1 auto; min-width: 0; overflow: hidden; flex-wrap: nowrap;">
            <div style="width: 32px; height: 32px; border-radius: 6px; background: rgba(56,189,248,0.15); display: flex; align-items: center; justify-content: center; color: #38bdf8; flex-shrink: 0;">
              ${icon('wrench', '', 16)}
            </div>
            <div style="min-width: 0; overflow: hidden; flex: 1 1 auto;">
              <div style="display: flex; align-items: center; gap: 6px; white-space: nowrap;">
                <span style="font-size: 12.5px; font-weight: 800; color: #f8fafc;">HANGAR</span>
                <span style="font-size: 10px; font-weight: 800; color: #38bdf8; background: rgba(56,189,248,0.15); padding: 1px 6px; border-radius: 4px; flex-shrink: 0;">Stufe ${curHangarTier}/${HANGAR_TIERS.length}</span>
              </div>
              <div style="font-size: 10.5px; color: #94a3b8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                Tankrate: <strong style="color: #38bdf8;">${effFuelSpeed} L/s</strong> &bull; Reparatur: <strong style="color: #10b981;">${effRepairSpeed} HP/s</strong>
                ${hasPowerplant ? ` &bull; <span style="color: #f59e0b; font-weight: 700;">⚡ Kraftwerk Lvl ${ppTier} (${fuelMult}x)</span>` : ''}
              </div>
            </div>
          </div>
          ${hangarUpgradeBtnHtml}
        </div>
      `;

      // 2. Bohrer-Upgrades (alle 6 Tracks)
      const drillerSectionsHtml = this.renderDrillerUpgradeCards('dock');

      tabContentHtml = `
        <div style="display: flex; flex-direction: column; gap: 10px;">
          <!-- Gebäude-Ausbau (Kompakt) -->
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: -2px;">
            <span style="font-size: 11px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.6px; display: inline-flex; align-items: center; gap: 5px;">
              ${icon('building-2', '', 13)} Gebäude-Ausbau
            </span>
          </div>
          ${compactBuildingHtml}

          <!-- Bohrer-Upgrades -->
          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 4px; margin-bottom: -2px;">
            <span style="font-size: 11px; font-weight: 800; color: #38bdf8; text-transform: uppercase; letter-spacing: 0.6px; display: inline-flex; align-items: center; gap: 5px;">
              ${icon('wrench', '', 13)} Bohrer-Upgrades
            </span>
            <span style="font-size: 10.5px; color: #64748b;">Montiere erforschte Bauteile</span>
          </div>
          ${drillerSectionsHtml}
        </div>
      `;
    } else {
      // Ausrüstung / Shop Tab
      const currentGadgets = this.player.gadgets || { dynamite: 0, fuel_canister: 0, repair_kit: 0 };
      const tubeItems = EXPEDITION_ITEMS.filter(i => i.stationType === 'tube');
      const fuelItems = EXPEDITION_ITEMS.filter(i => i.stationType === 'fuel');
      const gadgetItems = EXPEDITION_ITEMS.filter(i => i.category === 'gadget');

      const stationTracks = [
        {
          id: 'station_tube',
          title: 'UNTERTAGE-ERZFÖRDERSCHÄCHTE',
          iconName: 'conveyor-belt',
          items: tubeItems,
          resTier: this.player.researchedStationTube || 0
        },
        {
          id: 'station_fuel',
          title: 'UNTERTAGE-TANKANLAGEN',
          iconName: 'fuel',
          items: fuelItems,
          resTier: this.player.researchedStationFuel || 0
        }
      ];

      const tracksHtml = stationTracks.map(track => {
        const totalTiers = track.items.length;
        const curResTier = Math.min(totalTiers, track.resTier);
        const curItem = curResTier > 0 ? track.items[curResTier - 1] : null;

        // Segmented Progress Bar (wie im Hangar)
        let segmentsHtml = '<div class="segmented-progress-bar">';
        for (let s = 1; s <= totalTiers; s++) {
          if (s <= curResTier) {
            segmentsHtml += `
              <div class="seg-step completed${s === curResTier ? ' current' : ''}">
                <span><span class="step-label">Stufe </span>${s}</span>
              </div>
            `;
          } else if (s === curResTier + 1) {
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

        // Action-Reihe für die freigeschalteten Module (Vorrat & Kaufen)
        const unlockedItems = track.items.filter((_, idx) => (idx + 1) <= Math.max(1, curResTier));
        const itemsRowsHtml = unlockedItems.map((item, idx) => {
          const tierNum = idx + 1;
          const isRes = curResTier >= tierNum;
          const count = currentGadgets[item.key] || 0;
          const canAfford = this.player.cash >= item.price;

          return `
            <div class="cat-action-row" style="margin-top: 6px; display: flex; align-items: center; justify-content: space-between; background: rgba(0, 0, 0, 0.4); border: 1px solid rgba(255, 255, 255, 0.08); padding: 7px 12px; border-radius: 8px; gap: 10px; box-sizing: border-box; flex-wrap: nowrap; min-height: 44px; overflow-x: auto; scrollbar-width: none;">
              <div style="display: flex; align-items: center; gap: 8px; flex-shrink: 0; flex-wrap: nowrap;">
                <span style="font-size: 11px; font-weight: 800; color: #38bdf8; background: rgba(56,189,248,0.15); padding: 2px 6px; border-radius: 4px; white-space: nowrap;">Stufe ${tierNum}</span>
                <strong style="color: #f8fafc; font-size: 12.5px; white-space: nowrap; flex-shrink: 0; width: 195px; min-width: 195px;">${item.name}</strong>
                <span style="background: rgba(56, 189, 248, 0.15); border: 1px solid rgba(56, 189, 248, 0.3); color: #38bdf8; font-weight: 700; font-size: 11px; padding: 2px 7px; border-radius: 6px; white-space: nowrap; flex-shrink: 0; font-variant-numeric: tabular-nums; width: 68px; min-width: 68px; text-align: center; justify-content: center; display: inline-flex;">
                  ${item.badge}
                </span>
                ${!isRes ? `
                  <span style="color: #ef4444; font-size: 10.5px; font-weight: 700; display: inline-flex; align-items: center; gap: 4px; background: rgba(239, 68, 68, 0.12); border: 1px solid rgba(239, 68, 68, 0.3); padding: 2px 6px; border-radius: 6px; white-space: nowrap; flex-shrink: 0;">
                    ${icon('lock', '', 12)} Im Labor erforschen
                  </span>
                ` : ''}
              </div>
              <div style="display: flex; align-items: center; justify-content: flex-end; gap: 8px; flex-shrink: 0; margin-left: auto; flex-wrap: nowrap;">
                ${isRes ? `
                  <span style="font-size: 11px; background: rgba(56,189,248,0.15); color: #38bdf8; font-weight: 700; padding: 2px 7px; border-radius: 6px; white-space: nowrap; font-variant-numeric: tabular-nums; flex-shrink: 0; min-width: 68px; text-align: center; justify-content: center; display: inline-flex;">Vorrat: ${count}</span>
                  <div style="width: 115px; min-width: 115px; flex-shrink: 0;">
                    <button class="btn-buy-gadget btn-buy" data-gadget="${item.key}" data-price="${item.price}" style="width: 100%; height: 30px; padding: 0 4px; font-size: 11px; font-weight: 800; background: ${canAfford ? 'linear-gradient(135deg, #10b981, #059669)' : '#334155'}; color: ${canAfford ? '#ffffff' : '#94a3b8'}; display: inline-flex; align-items: center; justify-content: center; white-space: nowrap;" ${canAfford ? '' : 'disabled'}>
                      + Kaufen (€${item.price.toLocaleString()})
                    </button>
                  </div>
                ` : `
                  <div style="width: 115px; min-width: 115px; flex-shrink: 0;">
                    <button class="btn-buy" disabled style="width: 100%; height: 30px; padding: 0 6px; font-size: 10.5px; font-weight: 700; background: #1e293b; border: 1px solid rgba(239, 68, 68, 0.3); color: #ef4444; display: inline-flex; align-items: center; justify-content: center; gap: 4px; opacity: 0.85; white-space: nowrap; box-sizing: border-box;">
                      ${icon('lock', '', 12)}
                      <span>Labor</span>
                    </button>
                  </div>
                `}
              </div>
            </div>
          `;
        }).join('');

        return `
          <div class="tech-category-card" style="margin-bottom: 8px;">
            <div class="cat-header-row" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <div class="cat-title-wrap" style="display: flex; align-items: center; gap: 8px; font-weight: 700; font-size: 13px; color: #f8fafc;">
                ${icon(track.iconName, '', 16)}
                <span>${track.title}</span>
              </div>
              <div class="cat-status-pill" style="font-size: 11px; color: #94a3b8; background: rgba(255, 255, 255, 0.06); padding: 3px 8px; border-radius: 6px;">
                Stufe ${curResTier}/${totalTiers} • <strong style="color: ${curResTier > 0 ? '#10b981' : '#94a3b8'};">${curItem ? curItem.badge : 'Nicht erforscht'}</strong>
              </div>
            </div>

            ${segmentsHtml}
            <div style="display: flex; flex-direction: column; gap: 4px; margin-top: 6px;">
              ${itemsRowsHtml}
            </div>
          </div>
        `;
      }).join('');

      // Verbrauchsgüter (Dynamit, Treibstoffkanister, Reparatur-Kit)
      const gadgetsCardsHtml = gadgetItems.map(g => {
        const count = currentGadgets[g.key] || 0;
        const canAfford = this.player.cash >= g.price;
        const isResearched = isExpeditionItemResearched(this.player, g);

        return `
          <div style="
            background: #090e1a;
            border: 1px solid ${isResearched ? 'rgba(255,255,255,0.12)' : 'rgba(239, 68, 68, 0.25)'};
            box-shadow: 0 3px 8px rgba(0, 0, 0, 0.35);
            border-radius: 10px;
            padding: 9px 12px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
            min-height: 52px;
            box-sizing: border-box;
            opacity: ${isResearched ? '1' : '0.85'};
          ">
            <div style="display: flex; align-items: center; gap: 10px; min-width: 0; flex: 1 1 auto;">
              <div style="width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.35); border: 1px solid rgba(255,255,255,0.06); border-radius: 8px; flex-shrink: 0; color: #a855f7;">
                ${icon(g.icon || 'package', '', 20)}
              </div>
              <div style="min-width: 0; flex: 1 1 auto;">
                <div style="display: flex; align-items: center; gap: 8px; flex-wrap: nowrap;">
                  <span style="font-size: 12.5px; font-weight: 700; color: #f8fafc; white-space: nowrap; width: 220px; min-width: 220px; max-width: 220px; overflow: hidden; text-overflow: ellipsis;">${g.name}</span>
                  <span style="font-size: 9.5px; font-weight: 800; padding: 2px 6px; border-radius: 5px; background: rgba(168,85,247,0.15); color: #a855f7; white-space: nowrap; flex-shrink: 0; width: 76px; min-width: 76px; text-align: center; display: inline-flex; align-items: center; justify-content: center;">${g.badge}</span>
                  ${!isResearched ? `<span style="font-size: 9.5px; font-weight: 800; padding: 2px 6px; border-radius: 5px; background: rgba(239, 68, 68, 0.18); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); white-space: nowrap; flex-shrink: 0; display: inline-flex; align-items: center; gap: 3px;">${icon('lock', '', 11)} Im Labor erforschen</span>` : ''}
                </div>
                <div style="font-size: 10.5px; color: #94a3b8; line-height: 1.35; margin-top: 2px;">
                  ${g.desc}
                </div>
              </div>
            </div>
            <div style="display: flex; align-items: center; justify-content: flex-end; gap: 8px; flex-shrink: 0; margin-left: auto; flex-wrap: nowrap;">
              ${isResearched ? `
                <span style="font-size: 11px; background: rgba(56,189,248,0.15); color: #38bdf8; font-weight: 700; padding: 2px 7px; border-radius: 6px; white-space: nowrap; font-variant-numeric: tabular-nums; flex-shrink: 0; min-width: 68px; text-align: center; justify-content: center; display: inline-flex;">Vorrat: ${count}</span>
                <div style="width: 115px; min-width: 115px; flex-shrink: 0;">
                  <button class="btn-buy-gadget btn-buy" data-gadget="${g.key}" data-price="${g.price}" style="width: 100%; height: 30px; padding: 0 4px; font-size: 11px; font-weight: 800; background: ${canAfford ? 'linear-gradient(135deg, #10b981, #059669)' : '#334155'}; color: ${canAfford ? '#ffffff' : '#94a3b8'}; display: inline-flex; align-items: center; justify-content: center; white-space: nowrap;" ${canAfford ? '' : 'disabled'}>
                    + Kaufen (€${g.price.toLocaleString()})
                  </button>
                </div>
              ` : `
                <div style="width: 115px; min-width: 115px; flex-shrink: 0;">
                  <button class="btn-buy" disabled style="width: 100%; height: 30px; padding: 0 6px; font-size: 10.5px; font-weight: 700; background: #1e293b; border: 1px solid rgba(239, 68, 68, 0.3); color: #ef4444; display: inline-flex; align-items: center; justify-content: center; gap: 4px; opacity: 0.85; white-space: nowrap; box-sizing: border-box;">
                    ${icon('lock', '', 12)}
                    <span>Labor</span>
                  </button>
                </div>
              `}
            </div>
          </div>
        `;
      }).join('');

      tabContentHtml = `
        <div style="display: flex; flex-direction: column; gap: 10px;">
          <!-- Stationen als levelbare Strecken mit Segmented Progress Bar -->
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: -2px;">
            <span style="font-size: 11px; font-weight: 800; color: #38bdf8; text-transform: uppercase; letter-spacing: 0.6px; display: inline-flex; align-items: center; gap: 5px;">
              ${icon('anchor', '', 13)} Untertage-Stationen (Ausbaustufen)
            </span>
            <span style="font-size: 10.5px; color: #64748b;">Stationen für Tiefenbohrungen</span>
          </div>
          ${tracksHtml}

          <!-- Verbrauchsgüter -->
          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 4px; margin-bottom: -2px;">
            <span style="font-size: 11px; font-weight: 800; color: #a855f7; text-transform: uppercase; letter-spacing: 0.6px; display: inline-flex; align-items: center; gap: 5px;">
              ${icon('package', '', 13)} Verbrauchsgüter & Notfall-Ausrüstung
            </span>
            <span style="font-size: 10.5px; color: #64748b;">Direkt im Cockpit einsetzbar</span>
          </div>
          <div style="display: flex; flex-direction: column; gap: 6px;">
            ${gadgetsCardsHtml}
          </div>
        </div>
      `;
    }

    const fullContent = `
      <div class="register-tab-container" style="display: flex; flex-direction: column; max-width: 760px; margin: 0 auto; width: 100%; box-sizing: border-box; padding: 0 4px 50px 4px; gap: 0 !important; row-gap: 0 !important;">
        ${tabNavHtml}
        <div class="register-tab-panel">
          ${tabContentHtml}
        </div>
      </div>
    `;

    this.openModal(`
      <div style="display: flex; align-items: center; gap: 8px;">
        ${icon('wrench', '', 18)}
        <span>HANGAR</span>
      </div>
    `, fullContent);

    const executeHangarUpgrade = () => {
      if (!canAffordHangar) {
        this.scene.events.emit('notify', missingHangarReason);
        soundFx.playError();
        return;
      }
      this.player.cash -= nextHangarData.costCash;
      if (nextHangarData.costComps) {
        for (const c of nextHangarData.costComps) {
          this.player.components[c.key] = Math.max(0, (this.player.components[c.key] || 0) - c.count);
        }
      }
      this.hangarTier = curHangarTier + 1;
      this.updateHangarBuildingLabel();
      this.updateBuildingVisuals();
      this.updateSurfaceVisuals();
      soundFx.playUpgrade();
      this.scene.events.emit('player_updated');
      this.scene.events.emit('notify', `Hangar auf Stufe ${this.hangarTier} ausgebaut! Tankrate: ${nextHangarData.fuelSpeed} L/s, Reparatur: ${nextHangarData.repairSpeed} HP/s`);
      this.openDockModal();
    };

    // Event-Handler für Hangar-Infrastruktur Ausbau
    const hangarUpgradeBtn = document.getElementById('btn-upgrade-hangar-dock');
    if (hangarUpgradeBtn) {
      hangarUpgradeBtn.onclick = (e) => {
        e.stopPropagation();
        executeHangarUpgrade();
      };
    }

    // Floating Action Button wie im Depot
    if (currentTab === 'workshop' && nextHangarData && canAffordHangar) {
      this.setFloatingAction(`
        <button id="btn-hangar-floating-upgrade" class="btn-buy btn-flyover" style="gap: 6px; background: linear-gradient(135deg, #0284c7, #0369a1);">
          ${icon('wrench', '', 14)}
          <span>Hangar ausbauen auf Stufe ${curHangarTier + 1}</span>
        </button>
      `, (container) => {
        const btn = container.querySelector('#btn-hangar-floating-upgrade');
        if (btn) {
          btn.onclick = (e) => {
            e.stopPropagation();
            executeHangarUpgrade();
          };
        }
      });
    } else {
      this.clearFloatingAction();
    }

    // Tab-Umschaltung
    const modalBody = this.modalBodyEl;
    if (modalBody) {
      modalBody.querySelectorAll('.dock-tab-btn').forEach(btn => {
        btn.onclick = (e) => {
          e.stopPropagation();
          const tab = btn.getAttribute('data-tab');
          if (tab) {
            this.activeDockTab = tab;
            this.openDockModal();
          }
        };
      });
    }

    // Event-Handler für alle Montage-Buttons registrieren
    this.bindDrillerMountHandlers('dock', () => this.openDockModal());

    // Gadget-Kauf Handler
    const modalEl = document.getElementById('building-modal');
    if (modalEl) {
      modalEl.querySelectorAll('.btn-buy-gadget').forEach(btn => {
        btn.onclick = (e) => {
          e.stopPropagation();
          const key = btn.getAttribute('data-gadget');
          const price = parseInt(btn.getAttribute('data-price'), 10);
          if (this.buyGadget(key, price)) {
            this.openDockModal();
          }
        };
      });
    }
  }

  // =========================================================
  // 3. RAFFINERIE (ZEITGESTEUERT & OFFLINE ANHAND GERÄTE-UHRZEIT)
  // =========================================================

  processRefinery(now = Date.now()) {
    const elapsedMs = Math.max(0, now - this.refinery.lastTimestamp);
    this.refinery.lastTimestamp = now;

    if (elapsedMs <= 0 || this.refinery.queue.length === 0) return 0;

    // Migration: Falls noch unverarbeitete fertige Waren aus vorigem Stand existieren, direkt ins Depot übertragen
    if (this.refinery.finished && this.refinery.finished.length > 0) {
      if (!this.depot) this.depot = { ores: {}, products: {}, capacity: 10, tier: 1 };
      if (!this.depot.products) this.depot.products = {};
      this.refinery.finished.forEach(item => {
        const key = item.isProduct ? item.productId : ('bar_' + item.ore);
        if (key) this.depot.products[key] = (this.depot.products[key] || 0) + 1;
      });
      this.refinery.finished = [];
    }

    let finishedCount = 0;

    // 1. Schmelzofen-Linie (Erze -> Barren direkt ins Depot)
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

        // Automatisch direkt ins Depot einlagern
        if (!this.depot) this.depot = { ores: {}, products: {}, capacity: 10, tier: 1 };
        if (!this.depot.products) this.depot.products = {};
        const barKey = 'bar_' + currentSmelt.ore;
        this.depot.products[barKey] = (this.depot.products[barKey] || 0) + 1;
        if (this.player && this.player.discoverProduct) this.player.discoverProduct(barKey);

        finishedCount++;
      } else {
        currentSmelt.remainingMs -= remSmelt;
        remSmelt = 0;
      }
    }

    // 2. Industrie-Fertigungslinie (Produkte direkt ins Depot)
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

        // Automatisch einlagern: isComponent → player.components, sonst → Depot
        if (!this.depot) this.depot = { ores: {}, products: {}, capacity: 10, tier: 1 };
        if (!this.depot.products) this.depot.products = {};
        const prodId = currentCraft.productId;
        const prodDef = FACTORY_PRODUCTS[prodId];
        if (prodDef && prodDef.isComponent && prodDef.compKey) {
          // Montage-Bauteil → direkt in player.components
          this.player.components[prodDef.compKey] = (this.player.components[prodDef.compKey] || 0) + 1;
        } else {
          // Normal-Produkt → ins Depot
          this.depot.products[prodId] = (this.depot.products[prodId] || 0) + 1;
        }
        if (this.player && this.player.discoverProduct) this.player.discoverProduct(prodId);

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
      lastTimestamp: this.refinery.lastTimestamp,
      fuelCoal: typeof this.refinery.fuelCoal === 'number' ? this.refinery.fuelCoal : 0,
      machineTier: typeof this.refinery.machineTier === 'number' ? this.refinery.machineTier : 1
    };
  }

  loadRefinerySaveData(savedData) {
    if (!savedData) return;
    this.refinery.fuelCoal = typeof savedData.fuelCoal === 'number' ? savedData.fuelCoal : 0;
    this.refinery.machineTier = typeof savedData.machineTier === 'number' ? savedData.machineTier : 1;
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

  addFuelCoal(amount = 1) {
    const cargoCoal = this.player.cargo.filter(k => k === 'coal').length;
    const depotCoal = this.depot?.ores?.['coal'] || 0;
    const available = cargoCoal + depotCoal;

    if (available <= 0) {
      this.scene.events.emit('notify', 'Keine Kohle im Frachtraum oder Depot vorhanden!');
      return;
    }

    const toAdd = Math.min(amount, available);
    for (let i = 0; i < toAdd; i++) {
      this.consumeSingleOre('coal');
    }
    this.refinery.fuelCoal = (this.refinery.fuelCoal || 0) + toAdd;

    soundFx.playClick();
    this.renderRefineryModalBody();
    if (this.scene.hud) this.scene.hud.update();
    this.scene.events.emit('notify', `🔥 ${toAdd}x Kohle in die Brennkammer eingefüllt (Aktuell: ${this.refinery.fuelCoal}x).`);
  }

  upgradeRefineryMachine() {
    const currentTier = this.refinery.machineTier || 1;
    const nextTierData = REFINERY_MACHINE_TIERS.find(t => t.tier === currentTier + 1);
    if (!nextTierData) {
      this.scene.events.emit('notify', 'Industrie-Maschine hat bereits die maximale Ausbaustufe erreicht!');
      return;
    }

    if (this.player.cash < nextTierData.costCash) {
      this.scene.events.emit('notify', `Nicht genug Geld! Benötigt: €${nextTierData.costCash.toLocaleString()}`);
      return;
    }

    this.player.cash -= nextTierData.costCash;
    this.refinery.machineTier = currentTier + 1;
    this.updateBuildingVisuals();
    soundFx.playPurchase();
    this.renderRefineryModalBody();
    if (this.scene.hud) this.scene.hud.update();
    this.scene.events.emit('notify', `⚙️ Industrie-Maschine auf Stufe ${this.refinery.machineTier} aufgerüstet (${nextTierData.name})!`);
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
    const loadedCoal = typeof this.refinery.fuelCoal === 'number' ? this.refinery.fuelCoal : 0;
    const currentTier = typeof this.refinery.machineTier === 'number' ? this.refinery.machineTier : 1;
    const currentTierData = REFINERY_MACHINE_TIERS.find(t => t.tier === currentTier) || REFINERY_MACHINE_TIERS[0];
    const nextTierData = REFINERY_MACHINE_TIERS.find(t => t.tier === currentTier + 1) || null;
    const canAffordUpgrade = nextTierData ? (this.player.cash >= nextTierData.costCash) : false;

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

    const hasSmeltFuel = loadedCoal >= 1;
    const hasCraftFuel = loadedCoal >= 2;

    let html = `
      <div style="display: flex; flex-direction: column; gap: 10px;">

        <!-- 1. ZENTRALE BRENNKAMMER -->
        <div style="
          background: rgba(15, 23, 42, 0.65);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 8px;
          padding: 8px 12px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        ">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; background: rgba(249, 115, 22, 0.12); border: 1px solid rgba(249, 115, 22, 0.25); border-radius: 6px; color: #f97316; flex-shrink: 0;">
              ${itemDisplayIcon('coal', 15)}
            </span>
            <strong style="color: #f8fafc; font-size: 12px; letter-spacing: 0.5px; text-transform: uppercase;">Brennkammer</strong>
          </div>

          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="
              background: ${loadedCoal > 0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.05)'};
              border: 1px solid ${loadedCoal > 0 ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255, 255, 255, 0.1)'};
              color: ${loadedCoal > 0 ? '#34d399' : '#94a3b8'};
              font-size: 11px;
              font-weight: 700;
              padding: 3px 8px;
              border-radius: 5px;
              display: inline-flex;
              align-items: center;
              gap: 4px;
              white-space: nowrap;
            ">
              ${icon('flame', loadedCoal > 0 ? 'flame-anim' : '', 12)}
              <span>${loadedCoal}x Kohle geladen</span>
            </span>
            <button id="btn-add-fuel-coal" class="btn-buy" ${availableCoal > 0 ? '' : 'disabled'} style="height: 28px; font-size: 11px; padding: 0 10px; gap: 4px;" title="1x Kohle in die Brennkammer laden (${availableCoal}x verfügbar)">
              +1 Kohle
            </button>
            ${availableCoal > 1 ? `
              <button id="btn-add-fuel-all" class="btn-buy" style="height: 28px; font-size: 11px; padding: 0 10px;" title="Alle Kohle (${availableCoal}x) einfüllen">
                Alle (${availableCoal})
              </button>
            ` : ''}
          </div>
        </div>

        <!-- 2. FERTIGE WAREN (FALLS VORHANDEN) -->
        ${finished.length > 0 ? (() => {
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
              <span>${data.count}x ${name}</span>
            </span>
          `).join('');

          return `
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
        })() : ''}

        <!-- 3. SCHMELZOFEN (STATUS & MENÜ VEREINT) -->
        <div style="background: rgba(15, 23, 42, 0.75); border: 1px solid ${isSmelting ? 'rgba(249, 115, 22, 0.4)' : 'rgba(255,255,255,0.08)'}; border-radius: 10px; padding: 12px 14px; display: flex; flex-direction: column; gap: 10px;">
          <!-- Schmelzofen Status & Fortschritt direkt im Header -->
          <div style="display: flex; justify-content: space-between; align-items: center; gap: 6px;">
            <strong style="color: #f8fafc; font-size: 12.5px; letter-spacing: 0.5px; text-transform: uppercase; display: inline-flex; align-items: center; gap: 6px;">
              ${icon('flame', isSmelting ? 'flame-anim' : '', 14)} Schmelzofen
            </strong>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="background: ${hasSmeltFuel ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)'}; border: 1px solid ${hasSmeltFuel ? 'rgba(16, 185, 129, 0.35)' : 'rgba(239, 68, 68, 0.35)'}; color: ${hasSmeltFuel ? '#34d399' : '#f87171'}; padding: 2px 7px; border-radius: 6px; font-size: 11px; font-weight: 800; display: inline-flex; align-items: center; gap: 4px; white-space: nowrap;" title="Brennstoffverbrauch: 1x Kohle pro Barren">
                ${itemDisplayIcon('coal', 13)} 1×
              </span>
              <span id="smelt-timer" style="font-family: monospace; font-size: 12px; font-weight: 800; color: ${isSmelting ? '#fbbf24' : '#64748b'}; font-variant-numeric: tabular-nums;">
                ${isSmelting ? this.formatRefineryClock(currentSmelt.remainingMs) : '00:00'}
              </span>
            </div>
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; font-size: 11px; min-height: 16px;">
            ${isSmelting ? `
              <span style="font-weight: 700; color: #fbbf24; display: inline-flex; align-items: center; gap: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                &bull; ${itemDisplayIcon('bar_' + currentSmelt.ore, 12)} ${currentSmelt.name}
                ${smeltQueue.length > 1 ? `<span style="font-size: 9.5px; color: #94a3b8; background: rgba(0,0,0,0.35); padding: 1px 5px; border-radius: 4px;">+${smeltQueue.length - 1}</span>` : ''}
              </span>
            ` : `
              <span style="color: ${hasSmeltFuel ? '#94a3b8' : '#f87171'}; font-weight: ${hasSmeltFuel ? '500' : '600'}; display: inline-flex; align-items: center; gap: 5px;">
                <span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: ${hasSmeltFuel ? '#34d399' : '#ef4444'}; box-shadow: 0 0 6px ${hasSmeltFuel ? 'rgba(52, 211, 153, 0.7)' : 'rgba(239, 68, 68, 0.7)'};"></span>
                ${hasSmeltFuel ? 'Bereit für Roherze' : 'Brennkammer leer'}
              </span>
            `}
          </div>

          <div style="height: 6px; background: #090d16; border: 1px solid rgba(255,255,255,0.08); border-radius: 3px; overflow: hidden; margin-bottom: 2px;">
            <div id="smelt-progress-fill" style="width: ${pctSmelt}%; height: 100%; background: linear-gradient(90deg, #ea580c 0%, #f59e0b 80%, #fde047 100%); box-shadow: ${isSmelting ? '0 0 8px rgba(245, 158, 11, 0.6)' : 'none'}; transition: width 0.15s linear;"></div>
          </div>

          <!-- Schmelzofen Roherz-Liste -->
          ${(() => {
            const totalCargoOres = cargo.length;
            const totalDepotOres = Object.values(this.depot?.ores || {}).reduce((s, v) => s + v, 0);
            const totalAvailableOres = totalCargoOres + totalDepotOres;

            if (totalAvailableOres === 0) {
              return `
                <div style="color: #64748b; font-size: 12px; text-align: center; padding: 10px 0;">
                  Keine Erze im Frachtraum oder Depot vorhanden. Baue unter Tage Erze ab, um sie hier einzuschmelzen.
                </div>
              `;
            }

            const canSmeltAny = loadedCoal > 0 && totalAvailableOres > 0;
            let oresHtml = `
              <button id="btn-deposit-all-ores" class="btn-buy" ${canSmeltAny ? '' : 'disabled'} style="width: 100%; height: 34px; font-size: 11.5px; font-weight: 700; display: inline-flex; align-items: center; justify-content: center; gap: 6px;">
                ${icon('flame', '', 14)}
                <span>Alle Erze schmelzen (${Math.min(totalAvailableOres, loadedCoal)} / ${totalAvailableOres})</span>
              </button>
              <div style="display: flex; flex-direction: column; gap: 6px;">
            `;

            const allOreKeys = Object.keys(ORE_DATA).filter(k => this.player.isOreDiscovered(k) && ((cargoCounts[k] || 0) > 0 || (this.depot?.ores?.[k] || 0) > 0));

            for (const oreKey of allOreKeys) {
              const oreName = ORE_DATA[oreKey]?.name || oreKey;
              const refinedName = getRefinedOreName(oreKey);
              const durSec = REFINERY_DURATIONS_SEC[oreKey] || Math.max(20, Math.round((ORE_DATA[oreKey]?.value || 25) * 0.70));
              const inCargo = cargoCounts[oreKey] || 0;
              const inDepot = this.depot?.ores?.[oreKey] || 0;
              const totalThisOre = inCargo + inDepot;

              const hasFuel = loadedCoal >= 1;
              const canSmeltThis = hasFuel && totalThisOre > 0;

              oresHtml += `
                <div style="background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.06); border-radius: 8px; padding: 10px 14px; display: flex; align-items: center; gap: 12px; box-sizing: border-box;">
                  <!-- Spalte 1: Icon + Erz ➔ Barren (flex: 1) -->
                  <div style="display: flex; align-items: center; gap: 10px; flex: 1; min-width: 0;">
                    <span style="display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; background: rgba(56,189,248,0.12); border: 1px solid rgba(56,189,248,0.25); border-radius: 8px; flex-shrink: 0;">
                      ${itemDisplayIcon(oreKey, 18)}
                    </span>
                    <strong style="color: #f8fafc; font-size: 12.5px; display: inline-flex; align-items: center; min-width: 0; flex: 1;">
                      <span style="display: inline-block; min-width: 92px; text-align: left; white-space: nowrap;">${oreName}</span>
                      <span style="color: #64748b; font-size: 11px; width: 16px; min-width: 16px; margin: 0 8px; display: inline-flex; justify-content: center; align-items: center; flex-shrink: 0;">➔</span>
                      <span style="color: #f8fafc; display: inline-flex; align-items: center; gap: 6px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${itemDisplayIcon('bar_' + oreKey, 14)} ${refinedName}</span>
                    </strong>
                  </div>

                  <!-- Spalte 2: Dauer -->
                  <div style="display: flex; align-items: center; flex-shrink: 0;">
                    <span style="background: rgba(255, 255, 255, 0.06); border: 1px solid rgba(255, 255, 255, 0.1); padding: 2px 7px; border-radius: 6px; font-size: 10.5px; color: #94a3b8; font-weight: 600; display: inline-flex; align-items: center; justify-content: center; gap: 4px; box-sizing: border-box; white-space: nowrap; font-variant-numeric: tabular-nums;">
                      ${icon('clock', '', 10)} ${durSec}s
                    </span>
                  </div>

                  <!-- Spalte 3: Buttons (136px) -->
                  <div style="width: 136px; min-width: 136px; flex-shrink: 0; display: flex; gap: 6px; align-items: center; justify-content: flex-end;">
                    <button class="btn-deposit-one btn-3d-secondary" data-ore="${oreKey}" ${canSmeltThis ? '' : 'disabled'} style="width: 42px; min-width: 42px; height: 30px; padding: 0; font-size: 11px; font-weight: 700; border-radius: 6px; display: inline-flex; align-items: center; justify-content: center; box-sizing: border-box;">+1</button>
                    <button class="btn-deposit-all-type btn-action" data-ore="${oreKey}" ${canSmeltThis ? '' : 'disabled'} style="width: 88px; min-width: 88px; height: 30px; padding: 0 4px; font-size: 11px; font-weight: 700; border-radius: 6px; display: inline-flex; align-items: center; justify-content: center; box-sizing: border-box; white-space: nowrap;">Alle (${totalThisOre})</button>
                  </div>
                </div>
              `;
            }
            oresHtml += `</div>`;
            return oresHtml;
          })()}
        </div>

        <!-- 4. INDUSTRIEMASCHINE (STATUS & FERTIGUNG VEREINT) -->
        <div style="background: rgba(15, 23, 42, 0.75); border: 1px solid ${isCrafting ? 'rgba(56, 189, 248, 0.4)' : 'rgba(255,255,255,0.08)'}; border-radius: 10px; padding: 12px 14px; display: flex; flex-direction: column; gap: 10px;">
          <!-- Industriemaschine Status, Fortschritt & Upgrade direkt im Header -->
          <div style="display: flex; justify-content: space-between; align-items: center; gap: 6px; flex-wrap: wrap;">
            <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
              <strong style="color: #f8fafc; font-size: 12.5px; letter-spacing: 0.5px; text-transform: uppercase; display: inline-flex; align-items: center; gap: 6px;">
                ${icon('anvil', isCrafting ? 'craft-icon-active' : '', 14)} Industriemaschine
              </strong>
              <span style="font-size: 10px; color: #38bdf8; font-weight: 700; background: rgba(56, 189, 248, 0.15); padding: 1px 5px; border-radius: 4px;">Lvl ${currentTier}</span>
              ${nextTierData ? `
                <button id="btn-upgrade-machine" class="btn-buy" ${canAffordUpgrade ? '' : 'disabled'} style="height: 24px; font-size: 10.5px; font-weight: 700; padding: 0 8px; gap: 4px; border-radius: 5px;" title="Schaltet tiefere Erze & Bauteile frei: ${nextTierData.desc}">
                  ${icon('chevrons-up', '', 11)} Upgrade Lvl ${nextTierData.tier} &bull; €${nextTierData.costCash.toLocaleString('de-DE')}
                </button>
              ` : `
                <span style="font-size: 10px; font-weight: 700; color: #34d399; background: rgba(16, 185, 129, 0.12); padding: 2px 6px; border-radius: 4px;">Max Lvl</span>
              `}
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="background: ${hasCraftFuel ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)'}; border: 1px solid ${hasCraftFuel ? 'rgba(16, 185, 129, 0.35)' : 'rgba(239, 68, 68, 0.35)'}; color: ${hasCraftFuel ? '#34d399' : '#f87171'}; padding: 2px 7px; border-radius: 6px; font-size: 11px; font-weight: 800; display: inline-flex; align-items: center; gap: 4px; white-space: nowrap;" title="Brennstoffverbrauch: 2x Kohle pro Fertigung">
                ${itemDisplayIcon('coal', 13)} 2×
              </span>
              <span id="craft-timer" style="font-family: monospace; font-size: 12px; font-weight: 800; color: ${isCrafting ? '#38bdf8' : '#64748b'}; font-variant-numeric: tabular-nums;">
                ${isCrafting ? this.formatRefineryClock(currentCraft.remainingMs) : '00:00'}
              </span>
            </div>
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; font-size: 11px; min-height: 16px;">
            ${isCrafting ? `
              <span style="font-weight: 700; color: #38bdf8; display: inline-flex; align-items: center; gap: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                &bull; ${itemDisplayIcon(currentCraft.productId, 12)} ${currentCraft.name}
                ${craftQueue.length > 1 ? `<span style="font-size: 9.5px; color: #94a3b8; background: rgba(0,0,0,0.35); padding: 1px 5px; border-radius: 4px;">+${craftQueue.length - 1}</span>` : ''}
              </span>
            ` : `
              <span style="color: ${hasCraftFuel ? '#94a3b8' : '#f87171'}; font-weight: ${hasCraftFuel ? '500' : '600'}; display: inline-flex; align-items: center; gap: 5px;">
                <span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: ${hasCraftFuel ? '#34d399' : '#ef4444'}; box-shadow: 0 0 6px ${hasCraftFuel ? 'rgba(52, 211, 153, 0.7)' : 'rgba(239, 68, 68, 0.7)'};"></span>
                ${hasCraftFuel ? currentTierData.name : 'Brennkammer leer'}
              </span>
            `}
          </div>

          <div style="height: 6px; background: #090d16; border: 1px solid rgba(255,255,255,0.08); border-radius: 3px; overflow: hidden; margin-bottom: 2px;">
            <div id="craft-progress-fill" style="width: ${pctCraft}%; height: 100%; background: linear-gradient(90deg, #0284c7 0%, #38bdf8 80%, #bae6fd 100%); box-shadow: ${isCrafting ? '0 0 8px rgba(56, 189, 248, 0.6)' : 'none'}; transition: width 0.15s linear;"></div>
          </div>

          <!-- Industriemaschine Produkt-Rezepte -->
          <div style="display: flex; flex-direction: column; gap: 8px;">
            ${(() => {
              const visibleFactoryProducts = Object.entries(FACTORY_PRODUCTS).filter(([prodId, prod]) => {
                return Object.keys(prod.recipe).every(ore => this.player.isOreDiscovered(ore));
              });

              if (visibleFactoryProducts.length === 0) {
                return `
                  <div style="text-align: center; padding: 16px; color: #94a3b8; font-size: 11.5px; background: rgba(0,0,0,0.25); border-radius: 8px;">
                    Keine Industrie-Rezepte verfügbar. Entdecke neue Erzadern im Schacht, um Fertigungspläne freizuschalten!
                  </div>
                `;
              }

              let prodsHtml = '';
              for (const [prodId, prod] of visibleFactoryProducts) {
                const isTierLocked = (prod.minTier || 1) > currentTier;
                let canCraft = !isTierLocked && hasCraftFuel;
                const ingBadges = Object.entries(prod.recipe).map(([ore, need]) => {
                  const inCargo = cargoCounts[ore] || 0;
                  const inDepot = this.depot?.ores?.[ore] || 0;
                  const have = inCargo + inDepot;
                  if (have < need) canCraft = false;
                  const oreName = ORE_DATA[ore]?.name || ore;
                  const isMet = have >= need;
                  return `<span style="background: ${isMet ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)'}; border: 1px solid ${isMet ? 'rgba(16, 185, 129, 0.35)' : 'rgba(239, 68, 68, 0.35)'}; color: ${isMet ? '#34d399' : '#f87171'}; font-size: 11px; font-weight: 700; padding: 2px 7px; border-radius: 6px; display: inline-flex; align-items: center; gap: 4px; white-space: nowrap;">${itemDisplayIcon(ore, 13)} ${need}x ${oreName} <span style="font-size: 9.5px; opacity: 0.85; font-variant-numeric: tabular-nums;">(${have}/${need})</span></span>`;
                }).join('');

                prodsHtml += `
                  <div style="background: rgba(0,0,0,0.3); border: 1px solid ${isTierLocked ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255,255,255,0.06)'}; border-radius: 8px; padding: 10px 14px; display: flex; align-items: center; gap: 12px; box-sizing: border-box; opacity: ${isTierLocked ? '0.75' : '1'};">
                    <!-- Spalte 1: Icon (32px) + Name (185px) -->
                    <div style="display: flex; align-items: center; gap: 10px; width: 185px; min-width: 185px; flex-shrink: 0;">
                      <span style="display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; background: rgba(56,189,248,0.12); border: 1px solid rgba(56,189,248,0.25); border-radius: 8px; flex-shrink: 0; color: #38bdf8;">
                        ${itemDisplayIcon(prodId, 18)}
                      </span>
                      <strong style="color: #f8fafc; font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${prod.name}</strong>
                    </div>

                    <!-- Spalte 2: Fertigungs-Dauer -->
                    <div style="display: flex; align-items: center; flex-shrink: 0;">
                      <span style="background: rgba(255, 255, 255, 0.06); border: 1px solid rgba(255, 255, 255, 0.1); padding: 2px 7px; border-radius: 6px; font-size: 10.5px; color: #94a3b8; font-weight: 600; display: inline-flex; align-items: center; justify-content: center; gap: 4px; box-sizing: border-box; white-space: nowrap; font-variant-numeric: tabular-nums;">
                        ${icon('clock', '', 10)} ${prod.durationSec}s
                      </span>
                    </div>

                    <!-- Spalte 3: Zutaten / Bauplan-Rezepte (flex: 1) -->
                    <div style="flex: 1; min-width: 0; display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                      ${ingBadges}
                    </div>

                    <!-- Spalte 4: Herstellen-Button / Sperre (120px) -->
                    <div style="width: 120px; min-width: 120px; flex-shrink: 0; display: flex; align-items: center; justify-content: flex-end;">
                      ${isTierLocked ? `
                        <span style="font-size: 10px; font-weight: 800; color: #f59e0b; background: rgba(245, 158, 11, 0.15); border: 1px solid rgba(245, 158, 11, 0.4); border-radius: 6px; padding: 4px 8px; display: inline-flex; align-items: center; gap: 4px; text-align: center; line-height: 1.2;">
                          ${icon('lock', '', 11)} Stufe ${prod.minTier}
                        </span>
                      ` : `
                        <button class="btn-craft-product btn-buy" data-prod="${prodId}" ${canCraft ? '' : 'disabled'} style="width: 100%; height: 32px; padding: 0 10px; font-size: 11.5px; font-weight: 700; display: inline-flex; align-items: center; justify-content: center; gap: 6px;" title="${!hasCraftFuel ? 'Brennkammer benötigt 2x Kohle!' : (canCraft ? 'Produkt herstellen' : 'Nicht genügend Materialien im Frachtraum oder Depot')}">
                          ${icon('hammer', '', 13)} Herstellen
                        </button>
                      `}
                    </div>
                  </div>
                `;
              }
              return prodsHtml;
            })()}
          </div>
        </div>

      </div>
    `;

    container.innerHTML = html;
    refreshIcons(container);

    // Event Listener
    const btnAddCoal = container.querySelector('#btn-add-fuel-coal');
    if (btnAddCoal) {
      btnAddCoal.onclick = () => this.addFuelCoal(1);
    }

    const btnAddCoalAll = container.querySelector('#btn-add-fuel-all');
    if (btnAddCoalAll) {
      btnAddCoalAll.onclick = () => this.addFuelCoal(9999);
    }

    const btnUpgradeMachine = container.querySelector('#btn-upgrade-machine');
    if (btnUpgradeMachine) {
      btnUpgradeMachine.onclick = () => this.upgradeRefineryMachine();
    }

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

    const currentTier = this.refinery.machineTier || 1;
    if (prod.minTier && prod.minTier > currentTier) {
      this.scene.events.emit('notify', `🔒 Industrie-Maschine Stufe ${prod.minTier} erforderlich! (Aktuell: Stufe ${currentTier})`);
      return;
    }

    const fuelNeeded = 2;
    const loadedFuel = this.refinery.fuelCoal || 0;
    if (loadedFuel < fuelNeeded) {
      this.scene.events.emit('notify', `⚠️ Brennkammer benötigt ${fuelNeeded}x Kohle! Bitte erst oben in die Brennkammer einfüllen.`);
      return;
    }

    const cargoCounts = {};
    this.player.cargo.forEach(ore => {
      cargoCounts[ore] = (cargoCounts[ore] || 0) + 1;
    });

    for (const [ore, needed] of Object.entries(prod.recipe)) {
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

    // 2. Brennkammer-Brennstoff verbrauchen
    this.refinery.fuelCoal = Math.max(0, (this.refinery.fuelCoal || 0) - fuelNeeded);

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
    const loadedFuel = this.refinery.fuelCoal || 0;
    if (loadedFuel <= 0) {
      this.scene.events.emit('notify', '⚠️ Brennkammer ist leer! Bitte erst oben rechts Kohle mit dem Button einfüllen.');
      return;
    }

    const availableTarget = (this.player.cargo.filter(k => k === oreKey).length) + (this.depot?.ores?.[oreKey] || 0);
    const toSmelt = Math.min(count, availableTarget, loadedFuel);
    if (toSmelt <= 0) {
      this.scene.events.emit('notify', `Kein ${ORE_DATA[oreKey]?.name || oreKey} zum Einschmelzen vorhanden.`);
      return;
    }

    for (let i = 0; i < toSmelt; i++) {
      this.consumeSingleOre(oreKey);
      this.refinery.fuelCoal--;
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
    const oreDisplayName = oreKey === 'coal' ? 'Kohle-Brikett' : (ORE_DATA[oreKey]?.name || oreKey);
    this.scene.events.emit('notify', `${toSmelt}x ${oreDisplayName} im Ofen (${toSmelt}x Kohle aus Brennkammer verbraucht).`);
  }

  depositAllOresToRefinery() {
    const loadedFuel = this.refinery.fuelCoal || 0;
    if (loadedFuel <= 0) {
      this.scene.events.emit('notify', '⚠️ Brennkammer ist leer! Bitte erst oben rechts Kohle mit dem Button einfüllen.');
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
    // Kohle zuletzt, damit wertvollere Erze Vorrang bei der Schmelze haben
    allOres.sort((a, b) => (a === 'coal' ? 1 : 0) - (b === 'coal' ? 1 : 0));

    let smelted = 0;
    for (const oreKey of allOres) {
      if ((this.refinery.fuelCoal || 0) <= 0) break;

      const consumed = this.consumeSingleOre(oreKey);
      if (!consumed) continue;

      this.refinery.fuelCoal--;

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
      this.scene.events.emit('notify', `${smelted} Erze in den Schmelzofen gegeben (${smelted}x Kohle aus Brennkammer verbraucht)!`);
    } else {
      this.scene.events.emit('notify', 'Keine Erze zum Einschmelzen vorhanden.');
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
