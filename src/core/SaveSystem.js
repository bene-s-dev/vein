/**
 * SaveSystem.js
 * Speichert den Spielfortschritt automatisch im localStorage.
 * Unterstützt:
 * - Mehrere Speicherstände / Slots (Slot 1, Slot 2, Slot 3)
 * - JSON Export & Import
 * - Entwicklermodus mit vollständigen Test-Presets (Early-, Mid-, Lategame)
 *   inklusive passender Schachtsysteme, abgebauten Erzen, Upgrades, Basisbauten & Finanzen.
 */

import { TILE_TYPES, TILE_SIZE, MINE_ENTRANCE_GX_START, MINE_ENTRANCE_GX_END, ORE_DATA, ARTIFACT_CATALOG } from './GridSystem.js';
import { MISSION_POOL } from './MissionSystem.js';
import { DRILL_TIERS, DEPOT_TIERS, FACTORY_PRODUCTS, GEOLOGIST_QUESTS } from './BaseSystem.js';
import { TANK_TIERS, HULL_TIERS, ENGINE_TIERS, CARGO_TIERS, SENSOR_TIERS } from './Player.js';

const DEFAULT_SAVE_KEY = 'deep_miner_save_v1';
const ACTIVE_SLOT_KEY = 'deep_miner_active_slot_id';

export class SaveSystem {
  static isClearing = false;

  static getActiveSlotId() {
    try {
      const stored = localStorage.getItem(ACTIVE_SLOT_KEY);
      const parsed = parseInt(stored, 10);
      return (parsed >= 1 && parsed <= 3) ? parsed : 1;
    } catch {
      return 1;
    }
  }

  static setActiveSlotId(slotId) {
    try {
      const id = Math.max(1, Math.min(3, parseInt(slotId, 10) || 1));
      localStorage.setItem(ACTIVE_SLOT_KEY, String(id));
      return id;
    } catch {
      return 1;
    }
  }

  static getSlotKey(slotId) {
    const id = parseInt(slotId, 10) || 1;
    if (id === 1) return DEFAULT_SAVE_KEY;
    return `deep_miner_save_slot_${id}`;
  }

  static getSlotInfo(slotId) {
    const key = SaveSystem.getSlotKey(slotId);
    const activeId = SaveSystem.getActiveSlotId();
    const isCurrent = (slotId === activeId);

    try {
      const raw = localStorage.getItem(key);
      if (!raw) {
        return {
          slotId,
          key,
          exists: false,
          isCurrent,
          label: `Slot ${slotId}`
        };
      }

      const data = JSON.parse(raw);
      if (!data || !data.player) {
        return {
          slotId,
          key,
          exists: false,
          isCurrent,
          label: `Slot ${slotId}`
        };
      }

      const p = data.player;
      const date = data.timestamp ? new Date(data.timestamp) : null;
      const dateFormatted = date
        ? `${date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })} ${date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}`
        : 'Unbekannt';

      return {
        slotId,
        key,
        exists: true,
        isCurrent,
        label: `Slot ${slotId}${slotId === 1 ? ' (Hauptspielstand)' : ''}`,
        level: p.level || 1,
        cash: typeof p.cash === 'number' ? p.cash : 0,
        highestDepth: p.highestDepthReached || 0,
        timestamp: data.timestamp || 0,
        dateFormatted,
        drillTier: p.drillTier || 1,
        tankTier: p.tankTier || 1
      };
    } catch (err) {
      console.warn('Fehler beim Auslesen von Slot', slotId, err);
      return {
        slotId,
        key,
        exists: false,
        isCurrent,
        label: `Slot ${slotId}`
      };
    }
  }

  static listSlots() {
    return [
      SaveSystem.getSlotInfo(1),
      SaveSystem.getSlotInfo(2),
      SaveSystem.getSlotInfo(3)
    ];
  }

  static buildSaveDataObject(scene) {
    if (!scene || !scene.player || !scene.gridSystem) return null;

    const p = scene.player;
    const gs = scene.gridSystem;
    const bs = scene.baseSystem;
    const ms = scene.missionSystem;

    // Abgebaute Kacheln ermitteln (blitzschnell aus Set ohne 20.000-Iteration-Scan)
    let destroyedTiles;
    if (gs.destroyedTiles && gs.destroyedTiles.size > 0) {
      destroyedTiles = Array.from(gs.destroyedTiles);
    } else {
      destroyedTiles = [];
      gs.tiles.forEach((tile, key) => {
        if (tile.type === TILE_TYPES.EMPTY) {
          destroyedTiles.push(key);
        }
      });
    }

    // Gebäude-Stati speichern
    const buildingsData = [];
    if (bs && bs.purchasableBuildings) {
      bs.purchasableBuildings.forEach((pb) => {
        buildingsData.push({
          id: pb.id,
          isBuilt: !!pb.isBuilt,
          storedOres: pb.storedOres || [],
          accumulatedCash: pb.accumulatedCash || 0
        });
      });
    }

    // Missionsdaten speichern
    let missionData = null;
    if (ms && ms.activeMission) {
      missionData = {
        id: ms.activeMission.id,
        progress: ms.progress,
        isCompleted: ms.isCompleted,
        completedMissionIds: ms.completedMissionIds || []
      };
    }

    return {
      version: 1,
      timestamp: Date.now(),
      player: {
        cash: p.cash,
        level: p.level,
        xp: p.xp,
        xpNeeded: p.xpNeeded,
        highestDepthReached: p.highestDepthReached || 0,
        gx: p.gx,
        gy: p.gy,
        fuel: p.fuel,
        maxFuel: p.maxFuel,
        fuelEfficiency: p.fuelEfficiency,
        tankTier: p.tankTier,
        researchedTankTier: p.researchedTankTier || p.tankTier || 1,
        batteryTier: p.batteryTier || 1,
        hull: p.hull,
        maxHull: p.maxHull,
        hullTier: p.hullTier,
        researchedHullTier: p.researchedHullTier || p.hullTier || 1,
        drillPower: p.drillPower,
        drillTier: p.drillTier,
        researchedDrillTier: p.researchedDrillTier || p.drillTier || 1,
        engineTier: p.engineTier || 1,
        researchedEngineTier: p.researchedEngineTier || p.engineTier || 1,
        discoveredOres: Array.from(p.discoveredOres || []),
        discoveredProducts: Array.from(p.discoveredProducts || []),
        discoveredSpecialTiles: Array.from(p.discoveredSpecialTiles || []),
        maxCargo: p.maxCargo,
        cargoTier: p.cargoTier,
        researchedCargoTier: p.researchedCargoTier || p.cargoTier || 1,
        cargo: [...(p.cargo || [])],
        components: { ...(p.components || {}) },
        factoryProducts: { ...(p.factoryProducts || {}) },
        sensorTier: p.sensorTier,
        researchedSensorTier: p.researchedSensorTier || p.sensorTier || 1,
        researchedTnt: p.researchedTnt || 0,
        researchedEmergency: p.researchedEmergency || 0,
        researchedStationFuel: p.researchedStationFuel || 0,
        researchedStationTube: p.researchedStationTube || 0,
        sensorRadius: p.sensorRadius,
        freeRescues: typeof p.freeRescues === 'number' ? p.freeRescues : 3,
        gadgets: { ...(p.gadgets || { dynamite: 0, fuel_canister: 0, repair_kit: 0 }) },
        discoveredArtifacts: [...(p.discoveredArtifacts || [])]
      },
      grid: {
        destroyedTiles,
        exploredTiles: Array.from(gs.exploredTiles || []),
        exploredStamps: (gs.exploredStamps || []).slice(-8000)
      },
      buildings: buildingsData,
      refinery: bs && bs.getRefinerySaveData ? bs.getRefinerySaveData() : null,
      depot: bs && bs.getDepotSaveData ? bs.getDepotSaveData() : null,
      hangar: bs && bs.getHangarSaveData ? bs.getHangarSaveData() : { tier: bs?.hangarTier || 1 },
      subsurfaceStations: bs && bs.getSubsurfaceSaveData ? bs.getSubsurfaceSaveData() : [],
      mission: missionData
    };
  }

  static save(scene) {
    if (SaveSystem.isClearing) return;
    const activeId = SaveSystem.getActiveSlotId();
    return SaveSystem.saveToSlot(scene, activeId);
  }

  static saveToSlot(scene, slotId) {
    if (SaveSystem.isClearing) return false;
    if (!scene || !scene.player || !scene.gridSystem) return false;

    try {
      const saveData = SaveSystem.buildSaveDataObject(scene);
      if (!saveData) return false;

      const key = SaveSystem.getSlotKey(slotId);
      localStorage.setItem(key, JSON.stringify(saveData));
      return true;
    } catch (err) {
      console.warn('Fehler beim Speichern auf Slot ' + slotId + ':', err);
      return false;
    }
  }

  static load(scene) {
    const activeId = SaveSystem.getActiveSlotId();
    return SaveSystem.loadSlot(scene, activeId);
  }

  static loadSlot(scene, slotId) {
    if (!scene || !scene.player || !scene.gridSystem) return false;

    try {
      const key = SaveSystem.getSlotKey(slotId);
      const raw = localStorage.getItem(key);
      if (!raw) return false;

      const data = JSON.parse(raw);
      if (!data || !data.player) return false;

      SaveSystem.setActiveSlotId(slotId);
      return SaveSystem.loadData(scene, data, `Slot ${slotId}`);
    } catch (err) {
      console.warn('Fehler beim Laden von Slot ' + slotId + ':', err);
      return false;
    }
  }

  static loadData(scene, data, sourceLabel = 'Speicherstand') {
    if (!scene || !scene.player || !scene.gridSystem || !data || !data.player) return false;

    try {
      const p = scene.player;
      const gs = scene.gridSystem;
      const bs = scene.baseSystem;
      const ms = scene.missionSystem;

      // 1. Raster & Welt-Zustand komplett zurücksetzen und neu befüllen
      if (gs.clearAllSprites) {
        gs.clearAllSprites();
      }
      gs.tiles.clear();
      if (gs.exploredTiles) gs.exploredTiles.clear();
      gs.exploredStamps = [];
      gs.fogDirty = true;
      gs.fogBufferReady = false;
      gs.lastCamX = null;
      gs.lastCamY = null;
      gs.lastPlayerX = null;
      gs.lastPlayerY = null;

      // Abgebaute Kacheln anwenden
      if (data.grid && Array.isArray(data.grid.destroyedTiles)) {
        data.grid.destroyedTiles.forEach((key) => {
          const parts = key.split(',');
          const tgx = parseInt(parts[0], 10);
          const tgy = parseInt(parts[1], 10);
          // Schutz: Erste Reihe Oberfläche außerhalb des Eingangs niemals als leer laden
          if (tgy === 0 && (tgx < MINE_ENTRANCE_GX_START || tgx > MINE_ENTRANCE_GX_END)) {
            return;
          }
          gs.tiles.set(key, {
            type: TILE_TYPES.EMPTY,
            ore: null,
            hp: 0,
            maxHp: 0,
            indestructible: false,
            explored: true
          });
          if (gs.exploredTiles) {
            gs.exploredTiles.add(key);
          }
          if (gs.destroyedTiles) {
            gs.destroyedTiles.add(key);
          }
        });
      }

      // Aufgedeckte Kacheln wiederherstellen
      if (data.grid && Array.isArray(data.grid.exploredTiles)) {
        data.grid.exploredTiles.forEach((key) => {
          if (gs.exploredTiles) {
            gs.exploredTiles.add(key);
          }
          const t = gs.tiles.get(key);
          if (t) t.explored = true;
        });
      }

      // 2. Spieler-Progression & Attribute
      p.cash = typeof data.player.cash === 'number' ? data.player.cash : p.cash;
      p.level = data.player.level || 1;
      p.xp = data.player.xp || 0;
      p.xpNeeded = data.player.xpNeeded || 350;
      p.highestDepthReached = data.player.highestDepthReached || 0;

      p.tankTier = data.player.tankTier || 1;
      p.researchedTankTier = data.player.researchedTankTier || p.tankTier;
      if (p.upgradeTank) {
        p.upgradeTank(p.tankTier);
      }
      p.fuel = Math.min(p.maxFuel, typeof data.player.fuel === 'number' ? data.player.fuel : p.maxFuel);
      p.batteryTier = data.player.batteryTier || 1;

      p.hullTier = data.player.hullTier || 1;
      p.researchedHullTier = data.player.researchedHullTier || p.hullTier;
      if (p.upgradeHull) {
        p.upgradeHull(p.hullTier);
      }

      p.drillTier = data.player.drillTier || 1;
      p.researchedDrillTier = data.player.researchedDrillTier || p.drillTier;
      const drillData = DRILL_TIERS[p.drillTier - 1] || DRILL_TIERS[0];
      p.drillPower = typeof data.player.drillPower === 'number' ? data.player.drillPower : drillData.stat;

      p.engineTier = data.player.engineTier || 1;
      p.researchedEngineTier = data.player.researchedEngineTier || p.engineTier;
      if (p.upgradeEngine) {
        p.upgradeEngine(p.engineTier);
      }

      p.cargoTier = data.player.cargoTier || 1;
      p.researchedCargoTier = data.player.researchedCargoTier || p.cargoTier;
      if (p.upgradeCargo) {
        p.upgradeCargo(p.cargoTier);
      }
      p.cargo = Array.isArray(data.player.cargo) ? [...data.player.cargo] : [];

      p.sensorTier = data.player.sensorTier || 1;
      p.researchedSensorTier = data.player.researchedSensorTier || p.sensorTier;
      const sensorData = SENSOR_TIERS[p.sensorTier - 1] || SENSOR_TIERS[0];
      p.sensorRadius = sensorData.radius || 1.8;

      p.discoveredOres = new Set(data.player.discoveredOres && data.player.discoveredOres.length ? data.player.discoveredOres : ['coal']);
      p.discoveredProducts = new Set(data.player.discoveredProducts && data.player.discoveredProducts.length ? data.player.discoveredProducts : []);
      p.discoveredSpecialTiles = new Set(Array.isArray(data.player.discoveredSpecialTiles) ? data.player.discoveredSpecialTiles : []);
      p.discoveredArtifacts = Array.isArray(data.player.discoveredArtifacts) ? [...data.player.discoveredArtifacts] : [];

      if (p.recalculateArtifactPerks) {
        p.recalculateArtifactPerks();
      }

      p.hull = Math.min(p.maxHull, typeof data.player.hull === 'number' ? data.player.hull : p.maxHull);
      p.freeRescues = typeof data.player.freeRescues === 'number' ? data.player.freeRescues : 3;

      p.components = { ...(data.player.components || {}) };
      p.factoryProducts = { ...(data.player.factoryProducts || {}) };
      p.researchedTnt = typeof data.player.researchedTnt === 'number' ? data.player.researchedTnt : (data.player.gadgets?.dynamite > 0 ? 1 : 0);
      p.researchedEmergency = typeof data.player.researchedEmergency === 'number' ? data.player.researchedEmergency : (data.player.gadgets?.fuel_canister > 0 ? 1 : 0);
      p.researchedStationFuel = data.player.researchedStationFuel || 0;
      p.researchedStationTube = data.player.researchedStationTube || 0;

      p.gadgets = {
        dynamite: data.player.gadgets?.dynamite ?? 0,
        fuel_canister: data.player.gadgets?.fuel_canister ?? 0,
        repair_kit: data.player.gadgets?.repair_kit ?? 0,
        tube_s1: data.player.gadgets?.tube_s1 ?? 0,
        tube_s2: data.player.gadgets?.tube_s2 ?? 0,
        tube_s3: data.player.gadgets?.tube_s3 ?? 0,
        fuel_s1: data.player.gadgets?.fuel_s1 ?? 0,
        fuel_s2: data.player.gadgets?.fuel_s2 ?? 0,
        fuel_s3: data.player.gadgets?.fuel_s3 ?? 0
      };

      // Spielerposition setzen
      const targetGx = typeof data.player.gx === 'number' ? data.player.gx : 20;
      const targetGy = typeof data.player.gy === 'number' ? data.player.gy : 0;
      p.gx = targetGx;
      p.gy = targetGy;
      p.x = p.gx * TILE_SIZE + TILE_SIZE / 2;
      p.y = p.gy * TILE_SIZE + TILE_SIZE / 2;
      if (p.sprite) p.sprite.setPosition(p.x, p.y);
      if (p.headlight) p.headlight.setPosition(p.x, p.y);
      if (p.scannerRing) p.scannerRing.setPosition(p.x, p.y);

      if (scene.cameras && scene.cameras.main && p.sprite) {
        scene.cameras.main.centerOn(p.x, p.y);
        scene.cameras.main.scrollX = p.x - scene.cameras.main.width / 2;
        scene.cameras.main.scrollY = p.y - scene.cameras.main.height / 2;
        scene.cameras.main.startFollow(p.sprite, true, 0.15, 0.15);
      }

      // 3. Gebäude-Ausbau
      if (bs) {
        if (bs.purchasableBuildings) {
          bs.purchasableBuildings.forEach((pb) => {
            const savedB = (data.buildings || []).find(b => b.id === pb.id);
            const isBuilt = savedB ? !!savedB.isBuilt : false;
            pb.isBuilt = isBuilt;
            pb.storedOres = savedB?.storedOres || [];
            pb.accumulatedCash = savedB?.accumulatedCash || 0;
            if (pb.sprite) {
              pb.sprite.setTexture(pb.spriteKey);
              pb.sprite.setAlpha(isBuilt ? 1.0 : 0.45);
            }
            if (pb.textLabel) {
              pb.textLabel.setText(pb.label || pb.title);
              pb.textLabel.setColor(isBuilt ? '#ffffff' : '#94a3b8');
            }
          });
        }

        if (data.refinery && bs.loadRefinerySaveData) {
          bs.loadRefinerySaveData(data.refinery);
        } else if (bs.refinery) {
          bs.refinery.tier = 1;
          bs.refinery.activeProcesses = [];
          bs.refinery.completedItems = [];
        }

        if (data.depot && bs.loadDepotSaveData) {
          bs.loadDepotSaveData(data.depot);
        } else if (bs.depot) {
          bs.depot.tier = 1;
          bs.depot.capacity = 10;
          bs.depot.ores = {};
          bs.depot.products = {};
        }

        if (data.hangar && bs.loadHangarSaveData) {
          bs.loadHangarSaveData(data.hangar);
        } else if (bs) {
          bs.hangarTier = data.hangar?.tier || 1;
          bs.updateHangarBuildingLabel?.();
        }

        if (data.subsurfaceStations && bs.loadSubsurfaceSaveData) {
          bs.loadSubsurfaceSaveData(data.subsurfaceStations);
        }

        bs.updateBuildingVisuals?.();
        bs.updateSurfaceVisuals?.();
      }

      // 4. Missionsfortschritt
      if (ms && data.mission) {
        const found = MISSION_POOL.find(m => m.id === data.mission.id);
        if (found) {
          ms.activeMission = found;
          ms.progress = data.mission.progress || 0;
          ms.isCompleted = !!data.mission.isCompleted;
          ms.completedMissionIds = data.mission.completedMissionIds || [];
          scene.events.emit('mission_updated', ms.getMissionStatus());
        }
      }

      // HUD synchronisieren
      if (scene.hud) {
        scene.hud.update();
      }

      // Viewport & Nebel sofort frisch für neue Position & Spielstand rendern
      gs.fogDirty = true;
      gs.fogBufferReady = false;
      if (scene.cameras && scene.cameras.main) {
        gs.updateViewport(scene.cameras.main, p);
      }

      scene.events.emit('notify', `💾 ${sourceLabel} erfolgreich geladen!`);
      return true;
    } catch (err) {
      console.warn('Fehler beim Einspielen von Daten:', err);
      return false;
    }
  }

  static deleteSlot(slotId) {
    try {
      const key = SaveSystem.getSlotKey(slotId);
      localStorage.removeItem(key);
      return true;
    } catch (e) {
      console.warn(e);
      return false;
    }
  }

  static exportSlotJSON(slotId) {
    const key = SaveSystem.getSlotKey(slotId);
    return localStorage.getItem(key) || null;
  }

  static importSlotJSON(scene, slotId, jsonStr) {
    try {
      const data = JSON.parse(jsonStr);
      if (!data || !data.player) {
        throw new Error('Ungültiges Spielstand-Format');
      }
      const key = SaveSystem.getSlotKey(slotId);
      localStorage.setItem(key, jsonStr);
      SaveSystem.setActiveSlotId(slotId);
      return SaveSystem.loadData(scene, data, `Importierter Slot ${slotId}`);
    } catch (err) {
      console.warn('Import fehlgeschlagen:', err);
      return false;
    }
  }

  static clear() {
    SaveSystem.isClearing = true;
    try {
      const activeKey = SaveSystem.getSlotKey(SaveSystem.getActiveSlotId());
      localStorage.removeItem(activeKey);
    } catch (e) {
      console.warn(e);
    }
  }

  // =========================================================
  // ENTWICKLERMODUS: PRESET GENERATOR
  // Erstellt fiktiven, detailgetreuen Spielfortschritt inklusive
  // abgebauter Erde & Schächte, passender Upgrades, Geld & Inventar
  // =========================================================
  static createDevPreset(presetType) {
    const now = Date.now();

    if (presetType === 'early') {
      // 🟢 Early-Game: Tiefe ~85m, Schieferzone, Tier-2-Upgrades
      const maxDepth = 85;
      const branches = [
        { startGy: 11, endGy: 13, minGx: 13, maxGx: 26 }, // Kohle-Flöz
        { startGy: 25, endGy: 27, minGx: 14, maxGx: 28 }, // Kupfer-Stollen
        { startGy: 43, endGy: 45, minGx: 12, maxGx: 25 }, // Erstes Eisen-Abbaugebiet
        { startGy: 63, endGy: 65, minGx: 15, maxGx: 27 }, // Schiefer-Suchstollen
        { startGy: 79, endGy: 81, minGx: 16, maxGx: 25 }  // Zinn-Kammer am Grund
      ];
      const gridData = SaveSystem.generateDestroyedAndExplored(maxDepth, branches);

      return {
        version: 1,
        timestamp: now,
        player: {
          cash: 2400,
          level: 4,
          xp: 450,
          xpNeeded: 900,
          highestDepthReached: maxDepth,
          gx: 20,
          gy: 0,
          fuel: 70,
          maxFuel: 70,
          fuelEfficiency: 1.12,
          tankTier: 2,
          researchedTankTier: 2,
          batteryTier: 1,
          hull: 90,
          maxHull: 90,
          hullTier: 2,
          researchedHullTier: 2,
          drillPower: 52,
          drillTier: 2,
          researchedDrillTier: 2,
          engineTier: 2,
          researchedEngineTier: 2,
          discoveredOres: ['coal', 'copper', 'iron', 'tin'],
          discoveredProducts: ['bar_coal', 'bar_copper', 'bar_iron', 'steel_beam', 'bronze_ingot', 'iron_tube', 'microprocessor'],
          maxCargo: 18,
          cargoTier: 2,
          researchedCargoTier: 2,
          cargo: ['coal', 'coal', 'copper', 'iron'],
          components: { iron_tube: 2, microprocessor: 1 },
          factoryProducts: { steel_beam: 2, bronze_ingot: 1 },
          sensorTier: 2,
          researchedSensorTier: 2,
          sensorRadius: 2.4,
          freeRescues: 3,
          gadgets: { dynamite: 5, fuel_canister: 3, repair_kit: 3 },
          discoveredArtifacts: ['artifact_ammonite']
        },
        grid: gridData,
        buildings: [
          { id: 'drone_hangar', isBuilt: true, storedOres: ['coal', 'copper'], accumulatedCash: 350 },
          { id: 'teleporter', isBuilt: false },
          { id: 'powerplant', isBuilt: false }
        ],
        refinery: {
          tier: 1,
          activeProcesses: [],
          completedItems: [{ id: 'bar_iron', name: 'Eisen-Barren', value: 88, timestamp: now - 5000 }]
        },
        depot: {
          tier: 2,
          capacity: 25,
          ores: { coal: 8, copper: 6, iron: 4, tin: 2 },
          products: { bar_coal: 4, bar_copper: 3, steel_beam: 2 }
        },
        hangar: {
          tier: 1
        },
        mission: {
          id: 'tier2_iron_strike',
          progress: 2,
          isCompleted: false,
          completedMissionIds: ['mine_first_ores', 'mine_coal_depth']
        }
      };
    } else if (presetType === 'mid') {
      // 🟡 Mid-Game: Tiefe ~360m, Granit & Gold, Tier-5-Laser, Fabrik Stufe 3
      const maxDepth = 360;
      const branches = [
        { startGy: 13, endGy: 15, minGx: 12, maxGx: 26 },
        { startGy: 27, endGy: 29, minGx: 10, maxGx: 28 },
        { startGy: 46, endGy: 48, minGx: 11, maxGx: 27 },
        { startGy: 71, endGy: 73, minGx: 9, maxGx: 29 },
        { startGy: 116, endGy: 118, minGx: 8, maxGx: 30 }, // Schiefer-Großstollen
        { startGy: 151, endGy: 153, minGx: 12, maxGx: 29 }, // Silber-Flöz
        { startGy: 206, endGy: 208, minGx: 10, maxGx: 28 }, // Granit-Vortrieb
        { startGy: 236, endGy: 238, minGx: 8, maxGx: 32 }, // Reiche Gold-Kammer
        { startGy: 291, endGy: 293, minGx: 11, maxGx: 29 }, // Tiefe Goldadern
        { startGy: 346, endGy: 348, minGx: 10, maxGx: 30 }  // Smaragd-Halle
      ];
      const gridData = SaveSystem.generateDestroyedAndExplored(maxDepth, branches);

      return {
        version: 1,
        timestamp: now,
        player: {
          cash: 32000,
          level: 8,
          xp: 3400,
          xpNeeded: 5800,
          highestDepthReached: maxDepth,
          gx: 20,
          gy: 0,
          fuel: 235,
          maxFuel: 235,
          fuelEfficiency: 1.48,
          tankTier: 5,
          researchedTankTier: 5,
          batteryTier: 1,
          hull: 365,
          maxHull: 365,
          hullTier: 5,
          researchedHullTier: 5,
          drillPower: 115,
          drillTier: 5,
          researchedDrillTier: 5,
          engineTier: 5,
          researchedEngineTier: 5,
          discoveredOres: ['coal', 'copper', 'iron', 'tin', 'silver', 'gold', 'emerald', 'sapphire'],
          discoveredProducts: [
            'bar_coal', 'bar_copper', 'bar_iron', 'bar_tin', 'bar_silver', 'bar_gold',
            'steel_beam', 'bronze_ingot', 'circuit_board', 'sapphire_glass',
            'iron_tube', 'bronze_gear', 'silver_coil', 'crystal_lens',
            'microprocessor', 'capacitor', 'spectrometer'
          ],
          maxCargo: 38,
          cargoTier: 5,
          researchedCargoTier: 5,
          cargo: ['silver', 'gold', 'emerald'],
          components: {
            iron_tube: 5,
            bronze_gear: 4,
            silver_coil: 3,
            crystal_lens: 1,
            microprocessor: 4,
            capacitor: 3,
            spectrometer: 2
          },
          factoryProducts: {
            steel_beam: 6,
            bronze_ingot: 5,
            circuit_board: 3,
            sapphire_glass: 2
          },
          sensorTier: 5,
          researchedSensorTier: 5,
          sensorRadius: 4.5,
          freeRescues: 2,
          gadgets: { dynamite: 12, fuel_canister: 6, repair_kit: 6 },
          discoveredArtifacts: ['artifact_ammonite', 'artifact_trilobite', 'artifact_dino_tooth', 'artifact_geode']
        },
        grid: gridData,
        buildings: [
          { id: 'drone_hangar', isBuilt: true, storedOres: ['iron', 'silver'], accumulatedCash: 1450 },
          { id: 'teleporter', isBuilt: true },
          { id: 'powerplant', isBuilt: false }
        ],
        refinery: {
          tier: 3,
          activeProcesses: [],
          completedItems: [
            { id: 'bar_gold', name: 'Gold-Barren', value: 345, timestamp: now - 8000 },
            { id: 'circuit_board', name: 'Elektronik-Platine', value: 1150, timestamp: now - 3000 }
          ]
        },
        depot: {
          tier: 5,
          capacity: 350,
          ores: { coal: 35, copper: 28, iron: 22, tin: 18, silver: 14, gold: 10, emerald: 5, sapphire: 3 },
          products: { bar_coal: 12, bar_copper: 10, bar_iron: 8, bar_silver: 6, bar_gold: 5, steel_beam: 5, bronze_ingot: 4, circuit_board: 3 }
        },
        hangar: {
          tier: 4
        },
        mission: {
          id: 'deep_gold_strike',
          progress: 5,
          isCompleted: false,
          completedMissionIds: ['mine_first_ores', 'tier2_iron_strike', 'schist_depth_master']
        }
      };
    } else {
      // 🟣 Late-Game: Tiefe ~1.150m, Tiefenkern & Titan, Tier-9-Quantenfräse, alle Erze & Relikte
      const maxDepth = 1150;
      const branches = [
        { startGy: 15, endGy: 17, minGx: 10, maxGx: 28 },
        { startGy: 45, endGy: 47, minGx: 10, maxGx: 28 },
        { startGy: 95, endGy: 97, minGx: 9, maxGx: 30 },
        { startGy: 160, endGy: 162, minGx: 10, maxGx: 30 },
        { startGy: 240, endGy: 242, minGx: 8, maxGx: 32 },
        { startGy: 350, endGy: 352, minGx: 10, maxGx: 30 },
        { startGy: 490, endGy: 492, minGx: 10, maxGx: 30 },
        { startGy: 620, endGy: 622, minGx: 8, maxGx: 32 }, // Obsidian & Rubin
        { startGy: 780, endGy: 782, minGx: 10, maxGx: 30 },
        { startGy: 860, endGy: 862, minGx: 8, maxGx: 32 }, // Diamant-Hauptlager
        { startGy: 980, endGy: 982, minGx: 10, maxGx: 30 },
        { startGy: 1070, endGy: 1072, minGx: 8, maxGx: 32 }, // Titan-Bruchfeld
        { startGy: 1130, endGy: 1133, minGx: 9, maxGx: 31 }  // Tiefenkern-Halle
      ];
      const gridData = SaveSystem.generateDestroyedAndExplored(maxDepth, branches);

      return {
        version: 1,
        timestamp: now,
        player: {
          cash: 350000,
          level: 15,
          xp: 28000,
          xpNeeded: 40000,
          highestDepthReached: maxDepth,
          gx: 20,
          gy: 0,
          fuel: 850,
          maxFuel: 850,
          fuelEfficiency: 2.35,
          tankTier: 9,
          researchedTankTier: 9,
          batteryTier: 1,
          hull: 1265,
          maxHull: 1265,
          hullTier: 9,
          researchedHullTier: 9,
          drillPower: 500,
          drillTier: 9,
          researchedDrillTier: 9,
          engineTier: 9,
          researchedEngineTier: 9,
          discoveredOres: Object.keys(ORE_DATA),
          discoveredProducts: [
            'bar_coal', 'bar_copper', 'bar_iron', 'bar_tin', 'bar_silver', 'bar_gold', 'bar_titanium', 'bar_platinum',
            'steel_beam', 'bronze_ingot', 'circuit_board', 'sapphire_glass', 'polished_gem', 'titan_plate', 'obsidian_matrix', 'fusion_rod',
            'iron_tube', 'bronze_gear', 'silver_coil', 'crystal_lens', 'titan_bolt', 'quantum_core',
            'microprocessor', 'capacitor', 'spectrometer', 'plasma_regulator', 'graviton_core', 'quantum_processor'
          ],
          maxCargo: 132,
          cargoTier: 9,
          researchedCargoTier: 9,
          cargo: ['titanium', 'platinum', 'uranium'],
          components: {
            iron_tube: 12,
            bronze_gear: 10,
            silver_coil: 8,
            crystal_lens: 5,
            titan_bolt: 4,
            quantum_core: 2,
            microprocessor: 8,
            capacitor: 6,
            spectrometer: 5,
            plasma_regulator: 4,
            graviton_core: 3,
            quantum_processor: 2
          },
          factoryProducts: {
            steel_beam: 16,
            bronze_ingot: 12,
            circuit_board: 10,
            sapphire_glass: 8,
            polished_gem: 5,
            titan_plate: 4,
            obsidian_matrix: 2
          },
          sensorTier: 9,
          researchedSensorTier: 9,
          sensorRadius: 9.0,
          freeRescues: 3,
          gadgets: { dynamite: 25, fuel_canister: 10, repair_kit: 10 },
          discoveredArtifacts: Object.keys(ARTIFACT_CATALOG)
        },
        grid: gridData,
        buildings: [
          { id: 'drone_hangar', isBuilt: true, storedOres: ['gold', 'diamond', 'titanium'], accumulatedCash: 6800 },
          { id: 'teleporter', isBuilt: true },
          { id: 'powerplant', isBuilt: true }
        ],
        refinery: {
          tier: 5,
          activeProcesses: [],
          completedItems: [
            { id: 'titan_plate', name: 'Titan-Panzerung', value: 9800, timestamp: now - 12000 },
            { id: 'obsidian_matrix', name: 'Obsidian-Superleiter', value: 19500, timestamp: now - 4000 }
          ]
        },
        depot: {
          tier: 8,
          capacity: 1500,
          ores: {
            coal: 95, copper: 75, iron: 65, tin: 45, silver: 40, gold: 35,
            emerald: 28, sapphire: 22, ruby: 18, diamond: 14, titanium: 10, platinum: 7, uranium: 4
          },
          products: {
            bar_coal: 25, bar_copper: 20, bar_iron: 18, bar_silver: 14, bar_gold: 12, bar_titanium: 8, bar_platinum: 5,
            steel_beam: 12, bronze_ingot: 10, circuit_board: 8, sapphire_glass: 6, polished_gem: 4, titan_plate: 3
          }
        },
        hangar: {
          tier: 8
        },
        mission: {
          id: 'deep_core_master',
          progress: 8,
          isCompleted: false,
          completedMissionIds: ['mine_first_ores', 'tier2_iron_strike', 'schist_depth_master', 'deep_gold_strike', 'obsidian_descent']
        }
      };
    }
  }

  static generateDestroyedAndExplored(maxDepth, branches) {
    const destroyed = new Set();
    const explored = new Set();

    // 1. Senkrechter Hauptschacht: gx 19 und 20 von der Oberfläche bis maxDepth
    for (let gy = 1; gy <= maxDepth; gy++) {
      destroyed.add(`19,${gy}`);
      destroyed.add(`20,${gy}`);
      for (let dx = -3; dx <= 3; dx++) {
        explored.add(`${19 + dx},${gy}`);
      }
    }

    // 2. Abzweigende Abbau-Stollen und Kammern
    branches.forEach((b) => {
      const { startGy, endGy, minGx, maxGx } = b;
      for (let gy = startGy; gy <= endGy && gy <= maxDepth; gy++) {
        for (let gx = minGx; gx <= maxGx; gx++) {
          destroyed.add(`${gx},${gy}`);
          for (let dx = -2; dx <= 2; dx++) {
            for (let dy = -2; dy <= 2; dy++) {
              explored.add(`${gx + dx},${gy + dy}`);
            }
          }
        }
      }
    });

    return {
      destroyedTiles: Array.from(destroyed),
      exploredTiles: Array.from(explored),
      exploredStamps: []
    };
  }

  static loadDevPreset(scene, presetType) {
    const presetData = SaveSystem.createDevPreset(presetType);
    if (!presetData) return false;

    // In den aktuellen aktiven Slot schreiben
    const activeId = SaveSystem.getActiveSlotId();
    const key = SaveSystem.getSlotKey(activeId);
    try {
      localStorage.setItem(key, JSON.stringify(presetData));
    } catch (e) {
      console.warn('Konnte Preset nicht im Slot sichern:', e);
    }

    const presetNames = {
      early: 'Early-Game (85m · Schiefer)',
      mid: 'Mid-Game (360m · Granit & Gold)',
      late: 'Late-Game (1.150m · Tiefenkern)'
    };
    const name = presetNames[presetType] || 'Entwickler-Preset';

    return SaveSystem.loadData(scene, presetData, `🛠️ ${name}`);
  }
}
