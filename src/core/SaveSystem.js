/**
 * SaveSystem.js
 * Speichert den Spielfortschritt automatisch alle 10 Sekunden im localStorage
 * und überschreibt den alten Spielstand.
 * Beinhaltet:
 * - Spieler (Geld, XP, Level, Fracht, Spezial-Bauteile, Upgrade-Stufen, Position, Treibstoff, Rumpf)
 * - Abgebaute Kacheln & Höhlen im Untergrund (damit Gänge erhalten bleiben)
 * - Erforschte Zonen (Fog of War)
 * - Errichtete Gebäude (Drohnen-Hangar, Teleporter, Kraftwerk) & deren Status
 * - Aktiver Auftrag & Missionsfortschritt
 */

import { TILE_TYPES, TILE_SIZE, MINE_ENTRANCE_GX_START, MINE_ENTRANCE_GX_END } from './GridSystem.js';
import { MISSION_POOL } from './MissionSystem.js';

const SAVE_KEY = 'deep_miner_save_v1';

export class SaveSystem {
  static isClearing = false;

  static save(scene) {
    if (SaveSystem.isClearing) return;
    if (!scene || !scene.player || !scene.gridSystem) return;

    try {
      const p = scene.player;
      const gs = scene.gridSystem;
      const bs = scene.baseSystem;
      const ms = scene.missionSystem;

      // Abgebaute Kacheln ermitteln (Kacheln, die jetzt leer sind)
      const destroyedTiles = [];
      gs.tiles.forEach((tile, key) => {
        if (tile.type === TILE_TYPES.EMPTY) {
          destroyedTiles.push(key);
        }
      });

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

      const saveData = {
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
          batteryTier: p.batteryTier || 1,
          hull: p.hull,
          maxHull: p.maxHull,
          hullTier: p.hullTier,
          drillPower: p.drillPower,
          drillTier: p.drillTier,
          researchedDrillTier: p.researchedDrillTier || p.drillTier || 1,
          engineTier: p.engineTier || 1,
          discoveredOres: Array.from(p.discoveredOres || []),
          maxCargo: p.maxCargo,
          cargoTier: p.cargoTier,
          cargo: [...p.cargo],
          components: { ...p.components },
          factoryProducts: { ...(p.factoryProducts || {}) },
          sensorTier: p.sensorTier,
          sensorRadius: p.sensorRadius,
          freeRescues: typeof p.freeRescues === 'number' ? p.freeRescues : 3
        },
        grid: {
          destroyedTiles,
          exploredTiles: Array.from(gs.exploredTiles || []),
          exploredStamps: (gs.exploredStamps || []).slice(-8000)
        },
        buildings: buildingsData,
        refinery: bs && bs.getRefinerySaveData ? bs.getRefinerySaveData() : null,
        depot: bs && bs.getDepotSaveData ? bs.getDepotSaveData() : null,
        mission: missionData
      };

      const jsonStr = JSON.stringify(saveData);
      localStorage.setItem(SAVE_KEY, jsonStr);
      // console.log('💾 Spielstand im localStorage gesichert.');
    } catch (err) {
      console.warn('Fehler beim automatischen Speichern:', err);
    }
  }

  static load(scene) {
    if (!scene || !scene.player || !scene.gridSystem) return false;

    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return false;

      const data = JSON.parse(raw);
      if (!data || !data.player) return false;

      const p = scene.player;
      const gs = scene.gridSystem;
      const bs = scene.baseSystem;
      const ms = scene.missionSystem;

      // 1. Spieler-Werte & Progression wiederherstellen
      p.cash = typeof data.player.cash === 'number' ? data.player.cash : p.cash;
      p.level = data.player.level || 1;
      p.xp = data.player.xp || 0;
      p.xpNeeded = data.player.xpNeeded || 350;
      p.highestDepthReached = data.player.highestDepthReached || 0;

      p.fuel = typeof data.player.fuel === 'number' ? data.player.fuel : p.fuel;
      p.maxFuel = data.player.maxFuel || p.maxFuel;
      p.fuelEfficiency = data.player.fuelEfficiency || p.fuelEfficiency;
      p.tankTier = data.player.tankTier || p.tankTier;
      p.batteryTier = data.player.batteryTier || 1;

      p.hull = typeof data.player.hull === 'number' ? data.player.hull : p.hull;
      p.maxHull = data.player.maxHull || p.maxHull;
      p.hullTier = data.player.hullTier || p.hullTier;
      p.freeRescues = typeof data.player.freeRescues === 'number' ? data.player.freeRescues : 3;

      p.drillPower = data.player.drillPower || p.drillPower;
      p.drillTier = data.player.drillTier || p.drillTier;
      p.researchedDrillTier = data.player.researchedDrillTier || p.drillTier || 1;
      p.discoveredOres = new Set(data.player.discoveredOres && data.player.discoveredOres.length ? data.player.discoveredOres : ['coal']);
      p.factoryProducts = data.player.factoryProducts || {};

      if (p.upgradeEngine) {
        p.upgradeEngine(data.player.engineTier || 1);
      }

      p.maxCargo = data.player.maxCargo || p.maxCargo;
      p.cargoTier = data.player.cargoTier || p.cargoTier;
      p.cargo = Array.isArray(data.player.cargo) ? [...data.player.cargo] : [];

      if (data.player.components) {
        p.components = {
          hydraulic_part: data.player.components.hydraulic_part || 0,
          titan_alloy: data.player.components.titan_alloy || 0,
          laser_lens: data.player.components.laser_lens || 0,
          quantum_chip: data.player.components.quantum_chip || 0
        };
      }

      if (data.player.sensorTier) {
        p.sensorTier = data.player.sensorTier;
        p.sensorRadius = data.player.sensorRadius || 140;
      }

      // Spielerposition
      if (typeof data.player.gx === 'number' && typeof data.player.gy === 'number') {
        p.gx = data.player.gx;
        p.gy = data.player.gy;
        p.x = p.gx * TILE_SIZE + TILE_SIZE / 2;
        p.y = p.gy * TILE_SIZE + TILE_SIZE / 2;
        p.sprite.setPosition(p.x, p.y);
        if (p.headlight) p.headlight.setPosition(p.x, p.y);
        if (p.scannerRing) p.scannerRing.setPosition(p.x, p.y);
      }

      // 2. Abgebaute Kacheln wiederherstellen
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
        });
      }

      // 2b. Aufgedeckte Kacheln wiederherstellen
      if (data.grid && Array.isArray(data.grid.exploredTiles)) {
        data.grid.exploredTiles.forEach((key) => {
          if (gs.exploredTiles) {
            gs.exploredTiles.add(key);
          }
          const t = gs.tiles.get(key);
          if (t) t.explored = true;
        });
      }

      // 3. Nebel-Stempel wiederherstellen (nur Tiefen-Stempel y >= 8, niemals über der Erdoberfläche)
      if (data.grid && Array.isArray(data.grid.exploredStamps)) {
        gs.exploredStamps = data.grid.exploredStamps.filter(s => s && s.y >= 8);
      }

      // 4. Gebäude-Ausbau wiederherstellen
      if (bs && Array.isArray(data.buildings)) {
        data.buildings.forEach((savedB) => {
          const pb = bs.purchasableBuildings.find(b => b.id === savedB.id);
          if (pb && savedB.isBuilt) {
            pb.isBuilt = true;
            pb.storedOres = savedB.storedOres || [];
            pb.accumulatedCash = savedB.accumulatedCash || 0;
            if (pb.sprite) pb.sprite.setTexture(pb.spriteKey);
            if (pb.textLabel) {
              pb.textLabel.setText(pb.label || pb.title);
              pb.textLabel.setColor('#ffffff');
            }
          }
        });
      }

      // 4b. Raffinerie-Status & Offline-Veredelung anhand Geräte-Uhrzeit
      if (bs && data.refinery && bs.loadRefinerySaveData) {
        bs.loadRefinerySaveData(data.refinery);
      }

      // 4c. Rohstoff- & Waren-Depot
      if (bs && data.depot && bs.loadDepotSaveData) {
        bs.loadDepotSaveData(data.depot);
      }

      // 5. Missions-Status
      if (ms && data.mission) {
        const found = MISSION_POOL.find(m => m.id === data.mission.id);
        if (found) {
          ms.activeMission = found;
          ms.progress = data.mission.progress || 0;
          ms.isCompleted = !!data.mission.isCompleted;
          ms.completedMissionIds = data.mission.completedMissionIds || [];
          if (ms.checkCurrentProgress) {
            ms.checkCurrentProgress();
          }
          scene.events.emit('mission_updated', ms.getMissionStatus());
        }
      }

      // HUD synchronisieren
      if (scene.hud) {
        scene.hud.update();
      }

      scene.events.emit('notify', '💾 Spielstand aus Speicher geladen!');
      return true;
    } catch (err) {
      console.warn('Fehler beim Laden des Spielstands:', err);
      return false;
    }
  }

  static clear() {
    SaveSystem.isClearing = true;
    try {
      localStorage.removeItem(SAVE_KEY);
      localStorage.clear();
      // console.log('🗑️ Spielstand vollständig gelöscht.');
    } catch (e) {
      console.warn(e);
    }
  }
}
