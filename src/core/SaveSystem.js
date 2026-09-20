/**
 * SaveSystem.js
 * Speichert den Spielfortschritt automatisch im localStorage.
 * Unterstützt:
 * - Mehrere Speicherstände / Slots (Slot 1, Slot 2, Slot 3)
 * - JSON Export & Import
 * - Entwicklermodus mit vollständigen Test-Presets (Early-, Mid-, Lategame)
 *   inklusive passender Schachtsysteme, abgebauten Erzen, Upgrades, Basisbauten & Finanzen.
 */

import { TILE_TYPES, TILE_SIZE, MINE_ENTRANCE_GX_START, MINE_ENTRANCE_GX_END, ORE_DATA } from './GridSystem.js';
import { MISSION_POOL } from './MissionSystem.js';
import { DRILL_TIERS, DEPOT_TIERS, FACTORY_PRODUCTS, GEOLOGIST_QUESTS } from './BaseSystem.js';
import { TANK_TIERS, HULL_TIERS, ENGINE_TIERS, CARGO_TIERS, SENSOR_TIERS } from './Player.js';
import { LeaderboardService } from './LeaderboardService.js';

const DEFAULT_SAVE_KEY = 'deep_miner_save_v1';
const ACTIVE_SLOT_KEY = 'deep_miner_active_slot_id';

export class SaveSystem {
  static isClearing = false;
  static isLoading = false;

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
        label: `Slot ${slotId}${slotId === 1 ? ' (Hauptspiel)' : ''}`,
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

    // Abgebaute Kacheln ermitteln: Kombination aus gs.destroyedTiles und allen leeren Kacheln in gs.tiles (nur gy > 0)
    const destroyedSet = new Set();
    if (gs.destroyedTiles) {
      gs.destroyedTiles.forEach((key) => {
        const parts = key.split(',');
        const gy = parseInt(parts[1], 10);
        if (gy > 0) destroyedSet.add(key);
      });
    }
    if (gs.tiles) {
      gs.tiles.forEach((tile, key) => {
        if (tile && tile.type === TILE_TYPES.EMPTY) {
          const parts = key.split(',');
          const gy = parseInt(parts[1], 10);
          if (gy > 0) destroyedSet.add(key);
        }
      });
    }
    const destroyedTiles = Array.from(destroyedSet);

    // Aufgedeckte Kacheln ermitteln (alle abgebauten Kacheln sind automatisch auch aufgedeckt)
    const exploredSet = new Set(gs.exploredTiles || []);
    destroyedTiles.forEach((k) => exploredSet.add(k));
    const exploredTiles = Array.from(exploredSet);

    // Gebäude-Stati speichern
    const buildingsData = [];
    if (bs && bs.purchasableBuildings) {
      bs.purchasableBuildings.forEach((pb) => {
        buildingsData.push({
          id: pb.id,
          tier: pb.tier || 1,
          isBuilt: !!pb.isBuilt,
          storedOres: pb.storedOres || [],
          accumulatedCash: pb.accumulatedCash || 0
        });
      });
    }

    // Missionsdaten speichern (max 3 Kontrakte auf dem Board)
    let missionData = null;
    if (ms) {
      missionData = {
        availableMissions: (ms.availableMissions || []).map(m => ({
          id: m.id,
          progress: m.progress || 0,
          isCompleted: !!m.isCompleted,
          isRerolled: !!m.isRerolled
        })),
        completedMissionIds: ms.completedMissionIds ? Array.from(ms.completedMissionIds) : [],
        rerolledMissionIds: ms.rerolledMissionIds ? Array.from(ms.rerolledMissionIds) : [],
        id: ms.activeMission ? ms.activeMission.id : null,
        progress: ms.progress || 0,
        isCompleted: !!ms.isCompleted
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
        seenGeologistQuests: Array.from(p.seenGeologistQuests || []),
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
        name: p.name || (typeof localStorage !== 'undefined' && localStorage.getItem('vein_player_name')) || 'Fahrer',
        freeRescues: typeof p.freeRescues === 'number' ? p.freeRescues : 1,
        firstRescueUsed: !!p.firstRescueUsed,
        activeInsurance: p.activeInsurance ? { ...p.activeInsurance } : null,
        isGameOver: !!p.isGameOver,
        hasPurchasedDynamite: !!p.hasPurchasedDynamite,
        frontLightEnabled: p.frontLightEnabled !== undefined ? !!p.frontLightEnabled : true,
        rearLightEnabled: p.rearLightEnabled !== undefined ? !!p.rearLightEnabled : true,
        lightIntensity: typeof p.lightIntensity === 'number' ? p.lightIntensity : 0.85,
        directionLockEnabled: p.directionLockEnabled !== undefined ? !!p.directionLockEnabled : true,
        autoDrillEnabled: p.autoDrillEnabled !== undefined ? !!p.autoDrillEnabled : true,
        headlightsEnabled: p.headlightsEnabled !== undefined ? !!p.headlightsEnabled : true,
        stats: {
          totalTilesMined: p.stats?.totalTilesMined || 0,
          totalOresMined: { ...(p.stats?.totalOresMined || {}) },
          totalCashEarned: typeof p.stats?.totalCashEarned === 'number' ? p.stats.totalCashEarned : (p.cash || 0),
          missionsCompleted: p.stats?.missionsCompleted || 0,
          researchCompleted: p.stats?.researchCompleted || 0
        },
        gadgets: { ...(p.gadgets || { dynamite: 0, fuel_canister: 0, repair_kit: 0 }) }
      },
      grid: {
        destroyedTiles,
        exploredTiles,
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

  static saveGame(scene) {
    return SaveSystem.save(scene);
  }

  static saveToSlot(scene, slotId) {
    if (SaveSystem.isClearing) return false;
    if (!scene || !scene.player || !scene.gridSystem) return false;

    let saveData = null;
    try {
      saveData = SaveSystem.buildSaveDataObject(scene);
      if (!saveData) return false;

      const key = SaveSystem.getSlotKey(slotId);
      localStorage.setItem(key, JSON.stringify(saveData));
      return true;
    } catch (err) {
      console.warn('Fehler beim Speichern auf Slot ' + slotId + ':', err);
      // Spezieller iOS Safari Schutz vor QuotaExceededError (5MB Limit)
      try {
        if (saveData && saveData.grid) {
          saveData.grid.exploredStamps = [];
          const key = SaveSystem.getSlotKey(slotId);
          localStorage.setItem(key, JSON.stringify(saveData));
          console.info('Speichern nach Quota-Bereinigung erfolgreich!');
          return true;
        }
      } catch (retryErr) {
        console.error('Speicherfehler trotz Reduzierung:', retryErr);
      }
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

    SaveSystem.isLoading = true;
    if (scene) scene.isRestoringState = true;

    try {
      const p = scene.player;
      const gs = scene.gridSystem;
      const bs = scene.baseSystem;
      const ms = scene.missionSystem;

      // Gespeicherte Spielerposition vorab erfassen
      const targetGx = typeof data.player.gx === 'number' ? data.player.gx : 20;
      const targetGy = typeof data.player.gy === 'number' ? data.player.gy : 0;

      // 1. Raster & Welt-Zustand komplett zurücksetzen und neu befüllen
      if (gs.clearAllSprites) {
        gs.clearAllSprites();
      }
      gs.tiles.clear();
      if (gs.exploredTiles) gs.exploredTiles.clear();
      if (gs.destroyedTiles) gs.destroyedTiles.clear();
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



      p.cash = typeof data.player.cash === 'number' ? data.player.cash : 0;
      if (p.cash === 60 && (p.highestDepthReached || 0) <= 0 && (!data.player.stats || (data.player.stats.totalTilesMined || 0) === 0)) {
        p.cash = 0;
      }
      p.level = data.player.level || 1;
      p.xp = data.player.xp || 0;
      p.xpNeeded = data.player.xpNeeded || 350;
      p.highestDepthReached = data.player.highestDepthReached || 0;

      p.tankTier = data.player.tankTier || 1;
      p.researchedTankTier = data.player.researchedTankTier || p.tankTier;
      if (p.upgradeTank) {
        p.upgradeTank(p.tankTier);
      }
      const rawSavedFuel = typeof data.player.fuel === 'number' ? data.player.fuel : p.maxFuel;
      p.fuel = (p.tankTier === 1 && rawSavedFuel >= 39.5) ? p.maxFuel : Math.min(p.maxFuel, rawSavedFuel);
      p.batteryTier = data.player.batteryTier || 1;

      p.hullTier = data.player.hullTier || 1;
      p.researchedHullTier = data.player.researchedHullTier || p.hullTier;
      if (p.upgradeHull) {
        p.upgradeHull(p.hullTier);
      }

      p.drillTier = data.player.drillTier || 1;
      p.researchedDrillTier = data.player.researchedDrillTier || p.drillTier;
      const parsedPower = parseFloat(data.player.drillPower);
      p.drillPower = (!isNaN(parsedPower) && parsedPower > 0) ? parsedPower : (DRILL_TIERS[(p.drillTier || 1) - 1]?.stat || 38);
      if (p.updateDrillTexture) {
        p.updateDrillTexture();
      }

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

      p.discoveredOres = new Set(data.player.discoveredOres && data.player.discoveredOres.length ? data.player.discoveredOres : []);
      if ((p.highestDepthReached || 0) <= 0 && (!data.player.stats || (data.player.stats.totalTilesMined || 0) === 0)) {
        p.discoveredOres = new Set();
      }
      if (Array.isArray(data.player.cargo)) {
        data.player.cargo.forEach(c => {
          const oreType = typeof c === 'string' ? c : c?.type;
          if (oreType) p.discoveredOres.add(oreType);
        });
      }
      if (data.depot?.ores) {
        Object.keys(data.depot.ores).forEach(ore => {
          if (data.depot.ores[ore] > 0) p.discoveredOres.add(ore);
        });
      }
      p.discoveredProducts = new Set(data.player.discoveredProducts && data.player.discoveredProducts.length ? data.player.discoveredProducts : []);
      p.discoveredSpecialTiles = new Set(Array.isArray(data.player.discoveredSpecialTiles) ? data.player.discoveredSpecialTiles : []);
      p.seenGeologistQuests = new Set(Array.isArray(data.player.seenGeologistQuests) ? data.player.seenGeologistQuests : []);

      p.hull = Math.min(p.maxHull, typeof data.player.hull === 'number' ? data.player.hull : p.maxHull);
      p.name = data.player.name || (typeof localStorage !== 'undefined' && localStorage.getItem('vein_player_name')) || 'Fahrer';
      p.firstRescueUsed = typeof data.player.firstRescueUsed === 'boolean'
        ? data.player.firstRescueUsed
        : (typeof data.player.freeRescues === 'number' ? data.player.freeRescues <= 0 : false);
      p.freeRescues = p.firstRescueUsed ? 0 : 1;
      p.activeInsurance = data.player.activeInsurance || null;
      p.isGameOver = !!data.player.isGameOver;

      p.components = { ...(data.player.components || {}) };
      // Schutz vor Altlasten: Wenn ein frisches Spiel auf Stufe 1 bei 0m geladen wird, keine Spezialbauteile vergeben
      if ((p.highestDepthReached || 0) <= 0 && (p.level || 1) <= 1) {
        if (p.components && p.components.hydraulic_part) {
          p.components.hydraulic_part = 0;
        }
      }
      p.factoryProducts = { ...(data.player.factoryProducts || {}) };
      let researchedTnt = typeof data.player.researchedTnt === 'number' ? data.player.researchedTnt : 0;
      const hasPurchasedDynamite = !!data.player.hasPurchasedDynamite;
      p.hasPurchasedDynamite = hasPurchasedDynamite;

      // Bereinigung von fälschlicherweise vergebenem TNT-Forschungsstatus aus Kapsel-Altlasten
      if (researchedTnt === 1 && !hasPurchasedDynamite) {
        const hasIronTube = (data.player.discoveredProducts && data.player.discoveredProducts.includes('iron_tube')) ||
                            (data.player.components && (data.player.components.iron_tube || 0) > 0) ||
                            (data.player.factoryProducts && (data.player.factoryProducts.iron_tube || 0) > 0);
        if (!hasIronTube && (p.level || 1) <= 3) {
          researchedTnt = 0;
        }
      }
      p.researchedTnt = researchedTnt;
      p.researchedEmergency = typeof data.player.researchedEmergency === 'number' ? data.player.researchedEmergency : 0;
      p.researchedStationFuel = data.player.researchedStationFuel || 0;
      p.researchedStationTube = data.player.researchedStationTube || 0;

      let dynamiteCount = data.player.gadgets?.dynamite ?? 0;
      // Wenn TNT im Labor nicht erforscht wurde oder Dynamit nie im Depot gekauft wurde: zwingend 0 Dynamit!
      if ((p.researchedTnt || 0) < 1 || !hasPurchasedDynamite) {
        dynamiteCount = 0;
      }

      let fuelCanisterCount = data.player.gadgets?.fuel_canister ?? 0;
      let repairKitCount = data.player.gadgets?.repair_kit ?? 0;
      if ((p.researchedEmergency || 0) < 1) {
        fuelCanisterCount = 0;
        repairKitCount = 0;
      }

      p.gadgets = {
        dynamite: dynamiteCount,
        fuel_canister: fuelCanisterCount,
        repair_kit: repairKitCount,
        tube_s1: data.player.gadgets?.tube_s1 ?? 0,
        tube_s2: data.player.gadgets?.tube_s2 ?? 0,
        tube_s3: data.player.gadgets?.tube_s3 ?? 0,
        fuel_s1: data.player.gadgets?.fuel_s1 ?? 0,
        fuel_s2: data.player.gadgets?.fuel_s2 ?? 0,
        fuel_s3: data.player.gadgets?.fuel_s3 ?? 0
      };

      // Abgebaute Kacheln unter Tage zählen (ohne Oberflächenkacheln gy <= 0)
      const destroyedCount = Array.isArray(data.grid?.destroyedTiles)
        ? data.grid.destroyedTiles.filter(k => {
            const gy = parseInt(k.split(',')[1], 10);
            return gy > 0;
          }).length
        : 0;
      const savedTilesMined = typeof data.player.stats?.totalTilesMined === 'number'
        ? data.player.stats.totalTilesMined
        : 0;

      // Kacheln abgebaut ermitteln: Niemals Schachttiefe hineinmischen!
      // Wenn der Wert durch den alten Tiefen-Bug künstlich auf 500 aufgebläht war,
      // mit den tatsächlich in der Welt zerstörten Kacheln korrigieren.
      let resolvedTilesMined = destroyedCount;
      if (destroyedCount === 0 && savedTilesMined > 0 && (!data.grid || !Array.isArray(data.grid.destroyedTiles))) {
        resolvedTilesMined = savedTilesMined;
      }

      const resolvedOresMined = { ...(data.player.stats?.totalOresMined || {}) };
      // Plausibilitäts-Abgleich mit vorhandenem Cargo & Depot
      if (Array.isArray(data.player.cargo)) {
        data.player.cargo.forEach(ore => {
          const k = typeof ore === 'string' ? ore : ore?.type;
          if (k) resolvedOresMined[k] = Math.max(resolvedOresMined[k] || 0, 1);
        });
      }
      if (data.depot && data.depot.ores) {
        Object.entries(data.depot.ores).forEach(([ore, count]) => {
          if (count > 0) {
            resolvedOresMined[ore] = Math.max(resolvedOresMined[ore] || 0, count);
          }
        });
      }

      p.stats = {
        totalTilesMined: resolvedTilesMined,
        totalOresMined: resolvedOresMined,
        totalCashEarned: typeof data.player.stats?.totalCashEarned === 'number'
          ? Math.max(data.player.stats.totalCashEarned, p.cash || 0)
          : (p.cash || 0),
        missionsCompleted: data.player.stats?.missionsCompleted || 0,
        researchCompleted: data.player.stats?.researchCompleted || 0
      };

      // Spielerposition & Bewegungszustand absolut sauber synchronisieren
      p.gx = targetGx;
      p.gy = targetGy;
      p.x = p.gx * TILE_SIZE + TILE_SIZE / 2;
      p.y = p.gy * TILE_SIZE + TILE_SIZE / 2;
      p.moveTargetGx = targetGx;
      p.moveTargetGy = targetGy;
      p.moveTargetX = p.x;
      p.moveTargetY = p.y;
      p.state = 'idle';
      if (scene.tweens) {
        scene.tweens.killTweensOf(p.sprite);
      }
      // WICHTIG: Zuerst das Sprite auf die gespeicherte Position setzen, BEVOR syncAttachments aufgerufen wird!
      if (p.sprite) {
        p.sprite.setPosition(p.x, p.y);
      }
      p.syncAttachments?.();
      p._lastEmittedDepth = -1;
      p.highestDepthReached = Math.max(p.highestDepthReached || 0, Math.floor(targetGy));
      if (typeof data.player.frontLightEnabled === 'boolean') {
        p.frontLightEnabled = data.player.frontLightEnabled;
      } else if (typeof data.player.headlightsEnabled === 'boolean') {
        p.frontLightEnabled = data.player.headlightsEnabled;
      } else {
        p.frontLightEnabled = true;
      }
      if (typeof data.player.rearLightEnabled === 'boolean') {
        p.rearLightEnabled = data.player.rearLightEnabled;
      } else if (typeof data.player.headlightsEnabled === 'boolean') {
        p.rearLightEnabled = data.player.headlightsEnabled;
      } else {
        p.rearLightEnabled = true;
      }
      if (typeof data.player.lightIntensity === 'number') {
        p.lightIntensity = data.player.lightIntensity;
      } else {
        p.lightIntensity = 0.85;
      }
      if (typeof data.player.directionLockEnabled === 'boolean') {
        p.directionLockEnabled = data.player.directionLockEnabled;
      } else {
        p.directionLockEnabled = true;
      }
      if (typeof data.player.autoDrillEnabled === 'boolean') {
        p.autoDrillEnabled = data.player.autoDrillEnabled;
      } else {
        p.autoDrillEnabled = true;
      }
      p.updateHeadlightVisibility?.();
      if (p.scannerRing) p.scannerRing.setPosition(p.x, p.y);

      if (scene.cameras && scene.cameras.main && p.sprite) {
        if (scene.setupCamera) {
          scene.setupCamera();
        } else {
          scene.cameras.main.centerOn(p.x, p.y);
          scene.cameras.main.startFollow(p.sprite, false, 1, 1);
        }
      }

      // 3. Gebäude-Ausbau
      if (bs) {
        if (bs.purchasableBuildings) {
          bs.purchasableBuildings.forEach((pb) => {
            const savedB = (data.buildings || []).find(b => b.id === pb.id);
            const isBuilt = savedB ? !!savedB.isBuilt : false;
            pb.isBuilt = isBuilt;
            pb.tier = Math.max(1, Math.min(3, Number(savedB?.tier) || 1));
            pb.storedOres = savedB?.storedOres || [];
            pb.accumulatedCash = savedB?.accumulatedCash || 0;
            if (pb.sprite) {
              pb.sprite.setTexture(isBuilt ? pb.spriteKey : 'building_plot');
              pb.sprite.setAlpha(isBuilt ? 1.0 : 0.85);
            }
            if (pb.textLabel) {
              const tierStr = isBuilt && pb.tier > 1 ? ` Lvl ${pb.tier}` : '';
              pb.textLabel.setText(isBuilt ? `${pb.label || pb.title}${tierStr}` : `BAUPLATZ: ${pb.label || pb.title}`);
              pb.textLabel.setColor(isBuilt ? '#ffffff' : '#fb923c');
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
        if (typeof ms.restoreSavedMissions === 'function') {
          ms.restoreSavedMissions(data.mission);
        } else {
          const found = MISSION_POOL.find(m => m.id === data.mission.id);
          if (found) {
            ms.activeMission = found;
            ms.progress = data.mission.progress || 0;
            ms.isCompleted = !!data.mission.isCompleted;
            scene.events.emit('mission_updated', ms.getMissionStatus());
          }
        }
      }

      // Eventuell aktive Sounds sofort stoppen
      if (typeof soundFx !== 'undefined' && soundFx) {
        soundFx.stopAllLoops?.();
      }

      // HUD synchronisieren
      if (scene.hud) {
        scene.hud._lastDepth = -1;
        scene.hud.update();
      }

      // Viewport & Nebel sofort frisch für neue Position & Spielstand rendern
      gs.fogDirty = true;
      gs.fogBufferReady = false;
      if (scene.cameras && scene.cameras.main) {
        if (scene.setupCamera) {
          scene.setupCamera();
        }
        gs.updateViewport(scene.cameras.main, p);
      }

      scene.events.emit('notify', `💾 ${sourceLabel} erfolgreich geladen!`);

      // Falls beim Speichern ein Game-Over aktiv war, prüfen ob der Admin in Supabase freigeschaltet hat
      if (p.isGameOver) {
        LeaderboardService.checkGameOver(p.name).then(isStillGameOver => {
          if (isStillGameOver === false) {
            p.isGameOver = false;
            SaveSystem.save(scene);
            if (scene.playRescueCutscene) {
              scene.playRescueCutscene('Bergung erfolgreich');
            } else {
              p.teleportToSurface('Bergung erfolgreich');
            }
          } else if (scene.rescueModal) {
            scene.rescueModal.open();
          }
        }).catch(() => {
          if (scene.rescueModal) scene.rescueModal.open();
        });
      }

      return true;
    } catch (err) {
      console.warn('Fehler beim Einspielen von Daten:', err);
      return false;
    } finally {
      SaveSystem.isLoading = false;
      if (scene) scene.isRestoringState = false;
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

  static resetToNewGame(scene) {
    if (!scene) return;
    SaveSystem.isClearing = true;

    // 1. Storage des aktiven Slots leeren
    try {
      const activeKey = SaveSystem.getSlotKey(SaveSystem.getActiveSlotId());
      localStorage.removeItem(activeKey);
    } catch (e) {
      console.warn(e);
    }

    // 2. Spieler komplett auf saubere Standardwerte (alle Tiers 1, keine Forschungen) zurücksetzen
    if (scene.player && typeof scene.player.resetToDefault === 'function') {
      scene.player.resetToDefault();
    }

    // 3. GridSystem komplett leeren (frische unberührte Welt)
    if (scene.gridSystem) {
      const gs = scene.gridSystem;
      gs.tiles.clear();
      if (gs.destroyedTiles) gs.destroyedTiles.clear();
      if (gs.exploredTiles) gs.exploredTiles.clear();
      if (gs.exploredStamps) gs.exploredStamps = [];
      if (gs.clearAllSprites) gs.clearAllSprites();
      gs.fogDirty = true;
      gs.fogBufferReady = false;
      gs.lastCamX = null;
      gs.lastCamY = null;
    }

    // 4. BaseSystem (Hangar, Depot, Fabrik, Gebäude, Stationen) zurücksetzen
    if (scene.baseSystem && typeof scene.baseSystem.resetToDefault === 'function') {
      scene.baseSystem.resetToDefault();
    }

    // 5. MissionSystem zurücksetzen
    if (scene.missionSystem && typeof scene.missionSystem.resetAll === 'function') {
      scene.missionSystem.resetAll();
    }

    // 6. Kamera, Rekordmarken & HUD zurücksetzen
    scene._lastSubmittedLeaderboardDepth = 0;
    if (typeof scene.setupCamera === 'function') {
      scene.setupCamera();
    }
    if (scene.hud) {
      scene.hud._lastDepth = -1;
      if (typeof scene.hud.update === 'function') {
        scene.hud.update();
      }
    }
    if (scene.gridSystem && scene.cameras?.main && scene.player) {
      scene.gridSystem.updateViewport(scene.cameras.main, scene.player);
    }

    SaveSystem.isClearing = false;

    // 7. Sauberen Anfangsspielstand sofort abspeichern
    SaveSystem.save(scene);
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
          researchedTnt: 1,
          gadgets: { dynamite: 5, fuel_canister: 3, repair_kit: 3 },
          discoveredSpecialTiles: ['tile_boulder', 'tile_cache', 'tile_lava']
        },
        grid: gridData,
        buildings: [
          { id: 'drone_hangar', isBuilt: true, storedOres: ['coal', 'copper'], accumulatedCash: 350 },
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
          freeRescues: 1,
          firstRescueUsed: false,
          researchedTnt: 3,
          gadgets: { dynamite: 12, fuel_canister: 6, repair_kit: 6 },
          discoveredSpecialTiles: ['tile_boulder', 'tile_cache', 'tile_lava']
        },
        grid: gridData,
        buildings: [
          { id: 'drone_hangar', isBuilt: true, storedOres: ['iron', 'silver'], accumulatedCash: 1450 },
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
      // 🟣 Late-Game: Tiefe ~1.150m, Tiefenkern & Titan, Tier-9-Quantenfräse, alle Erze
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
          researchedTnt: 7,
          gadgets: { dynamite: 25, fuel_canister: 10, repair_kit: 10 },
          discoveredSpecialTiles: ['tile_boulder', 'tile_cache', 'tile_lava']
        },
        grid: gridData,
        buildings: [
          { id: 'drone_hangar', isBuilt: true, storedOres: ['gold', 'diamond', 'titanium'], accumulatedCash: 6800 },
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
