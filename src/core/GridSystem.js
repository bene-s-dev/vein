/**
 * GridSystem.js
 * Verwaltet das endlose 2D-Kachelraster (World Grid):
 * - Prozedurale, endlose Generierung nach unten und in beide horizontalen Richtungen
 * - Kumulatives Erzsystem (tiefere Ebenen behalten alte Erze + neue seltene Schätze)
 * - Dunkelheit & Nebel des Krieges (Fog of War): Kacheln außerhalb des Sensor-Radius sind verdunkelt
 * - Dynamisches Culling & Sprite-Pooling
 */

import { soundFx } from './SoundEffects.js';

export const TILE_SIZE = 32;

export const TILE_TYPES = {
  EMPTY: 'empty',
  SURFACE: 'tile_surface',
  DIRT: 'tile_dirt',
  STONE: 'tile_stone',
  GRANITE: 'tile_granite',
  OBSIDIAN: 'tile_obsidian',
  BOULDER: 'tile_boulder',
  LAVA: 'tile_lava',
  CACHE: 'tile_cache',
  FOSSIL: 'tile_fossil'
};

export const MINE_ENTRANCE_GX_START = 19;
export const MINE_ENTRANCE_GX_END = 20;

// Deterministischer Hash für unendliche, konsistente Geländegenerierung
function hashCoord(x, y, seed = 1337) {
  let h = (x * 374761393 + y * 668265263 + seed) ^ 0x5bf03635;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

// 15 differenzierte Erze mit kumulativen Tiefenstufen (ausgelegt auf 0 bis 1600m+)
export const ORE_DATA = {
  coal: {
    name: 'Kohle',
    value: 22,
    weight: 1,
    sprite: 'ore_coal',
    hardness: 1.1,
    minDepth: 1,
    rarityWeight: 100
  },
  copper: {
    name: 'Kupfer',
    value: 40,
    weight: 1,
    sprite: 'ore_copper',
    hardness: 1.2,
    minDepth: 1,
    rarityWeight: 80
  },
  iron: {
    name: 'Eisen',
    value: 65,
    weight: 2,
    sprite: 'ore_iron',
    hardness: 1.35,
    minDepth: 18,
    rarityWeight: 65
  },
  tin: {
    name: 'Zinn',
    value: 90,
    weight: 2,
    sprite: 'ore_tin',
    hardness: 1.40,
    minDepth: 65,
    rarityWeight: 55
  },
  silver: {
    name: 'Silber',
    value: 150,
    weight: 2,
    sprite: 'ore_silver',
    hardness: 1.75,
    minDepth: 130,
    rarityWeight: 45
  },
  gold: {
    name: 'Gold',
    value: 260,
    weight: 2,
    sprite: 'ore_gold',
    hardness: 2.05,
    minDepth: 220,
    rarityWeight: 35
  },
  emerald: {
    name: 'Smaragd',
    value: 450,
    weight: 1,
    sprite: 'ore_emerald',
    hardness: 2.35,
    minDepth: 340,
    rarityWeight: 26
  },
  sapphire: {
    name: 'Saphir',
    value: 680,
    weight: 1,
    sprite: 'ore_sapphire',
    hardness: 2.65,
    minDepth: 480,
    rarityWeight: 20
  },
  ruby: {
    name: 'Rubin',
    value: 980,
    weight: 1,
    sprite: 'ore_ruby',
    hardness: 3.0,
    minDepth: 650,
    rarityWeight: 15
  },
  diamond: {
    name: 'Diamant',
    value: 1550,
    weight: 1,
    sprite: 'ore_diamond',
    hardness: 3.4,
    minDepth: 850,
    rarityWeight: 10
  },
  titanium: {
    name: 'Titan',
    value: 2400,
    weight: 2,
    sprite: 'ore_titanium',
    hardness: 3.8,
    minDepth: 1050,
    rarityWeight: 7
  },
  platinum: {
    name: 'Platin',
    value: 3800,
    weight: 2,
    sprite: 'ore_platinum',
    hardness: 4.2,
    minDepth: 1250,
    rarityWeight: 5
  },
  uranium: {
    name: 'Uran',
    value: 5900,
    weight: 3,
    sprite: 'ore_uranium',
    hardness: 4.6,
    minDepth: 1400,
    rarityWeight: 3.5
  },
  obsidian_gem: {
    name: 'Obsidian-Kern',
    value: 9500,
    weight: 2,
    sprite: 'ore_obsidian_gem',
    hardness: 5.0,
    minDepth: 1550,
    rarityWeight: 2.2
  },
  dark_matter: {
    name: 'Dunkelmaterie',
    value: 18000,
    weight: 1,
    sprite: 'ore_dark_matter',
    hardness: 5.5,
    minDepth: 1700,
    rarityWeight: 1.0
  }
};

export const ARTIFACT_CATALOG = {
  artifact_ammonite: {
    id: 'artifact_ammonite',
    name: 'Spiral-Ammonit',
    sprite: 'artifact_ammonite',
    description: 'Uraltes versteinertes Kopffüßer-Gehäuse aus Ur-Meeren.',
    perk: '+10% Treibstoff-Effizienz beim Bohren',
    bonusType: 'fuelEfficiency',
    bonusValue: 0.10,
    minDepth: 35
  },
  artifact_trilobite: {
    id: 'artifact_trilobite',
    name: 'Gepanzerter Trilobit',
    sprite: 'artifact_trilobite',
    description: 'Robuster Urzeit-Gliederfüßer mit unzerbrechlichem Chitin-Panzer.',
    perk: '+15 Max-Panzerung / HP',
    bonusType: 'maxHp',
    bonusValue: 15,
    minDepth: 80
  },
  artifact_dino_tooth: {
    id: 'artifact_dino_tooth',
    name: 'Säbelzahn-Fossil',
    sprite: 'artifact_dino_tooth',
    description: 'Rasiermesserscharfer Raubtier-Fangzahn aus tiefsten Sedimentschichten.',
    perk: '+10% Bohrgeschwindigkeit',
    bonusType: 'drillSpeed',
    bonusValue: 0.10,
    minDepth: 160
  },
  artifact_geode: {
    id: 'artifact_geode',
    name: 'Amethyst-Geode',
    sprite: 'artifact_geode',
    description: 'Perfekt kristallisierter Basalthohlraum voll leuchtender Bergkristalle.',
    perk: '+15% Verkaufswert für alle Edelsteine',
    bonusType: 'gemValue',
    bonusValue: 0.15,
    minDepth: 280
  },
  artifact_meteorite: {
    id: 'artifact_meteorite',
    name: 'Sternen-Meteorit',
    sprite: 'artifact_meteorite',
    description: 'Außerirdischer Nickel-Eisen-Meteorit mit enormer Thermoresistenz.',
    perk: '-50% Hitze-Schaden durch Lava',
    bonusType: 'lavaResistance',
    bonusValue: 0.50,
    minDepth: 450
  },
  artifact_mech_core: {
    id: 'artifact_mech_core',
    name: 'Precursor Mech-Kern',
    sprite: 'artifact_mech_core',
    description: 'Funktionierendes Gravitations-Relikt einer untergegangenen Hochkultur.',
    perk: '+20% Ladekapazität (Frachtraum)',
    bonusType: 'cargoCapacity',
    bonusValue: 0.20,
    minDepth: 750
  }
};

const MAX_DEPTH_LUT = 5000;
const DEPTH_TINT_LUT = new Uint32Array(MAX_DEPTH_LUT + 1);
const ORE_DEPTH_TINT_LUT = new Uint32Array(MAX_DEPTH_LUT + 1);

for (let y = 0; y <= MAX_DEPTH_LUT; y++) {
  if (y === 0) {
    DEPTH_TINT_LUT[y] = 0xffffff;
    ORE_DEPTH_TINT_LUT[y] = 0xffffff;
  } else {
    const t = Math.min(1.0, y / 1500);
    const r = Math.round(250 * Math.pow(1 - t, 1.15));
    const g = Math.round(220 * Math.pow(1 - t, 1.30));
    const b = Math.round(190 * Math.pow(1 - t, 1.45));
    DEPTH_TINT_LUT[y] = (r << 16) | (g << 8) | b;

    const factor = Math.max(0.40, 1.0 - t * 0.60);
    const v = Math.round(255 * factor);
    ORE_DEPTH_TINT_LUT[y] = (v << 16) | (v << 8) | v;
  }
}

/**
 * Tiefen-Fading: Sanfter Farbübergang von Hellbraun (Erdoberfläche) bis tiefstes Schwarz bei 1500m+
 * Extrem energiesparend & performant via vorberechnetem Uint32Array LUT
 */
export function getDepthTint(y) {
  if (y <= 0) return 0xffffff;
  if (y <= MAX_DEPTH_LUT) return DEPTH_TINT_LUT[y];
  return DEPTH_TINT_LUT[MAX_DEPTH_LUT];
}

/**
 * Erze behalten auch im dunklen Tiefenraum eine dezent glimmende Resthelligkeit
 * Extrem energiesparend & performant via vorberechnetem Uint32Array LUT
 */
export function getOreDepthTint(y) {
  if (y <= 0) return 0xffffff;
  if (y <= MAX_DEPTH_LUT) return ORE_DEPTH_TINT_LUT[y];
  return ORE_DEPTH_TINT_LUT[MAX_DEPTH_LUT];
}

export class GridSystem {
  constructor(scene) {
    this.scene = scene;

    // Dynamischer Kachel-Speicher (Map aus `${gx},${gy}` -> Tile)
    this.tiles = new Map();
    this.activeSprites = new Map();
    this.neededKeys = new Set(); // Wiederverwendbares Set gegen Garbage Collection Pressure

    // Verfolgung aller besuchten Positionen (wo man schon war bleibt hell angezeigt)
    this.exploredStamps = [];
    this.exploredTiles = new Set();
    this.destroyedTiles = new Set();
    this.lastStampX = null;
    this.lastStampY = null;

    // Kreisrunde Fog-of-War Textur auf Depth 6 (in World Space verankert!)
    const initialWidth = 1024;
    const initialHeight = 768;
    this.fogTexture = scene.textures.createCanvas('fog_of_war_overlay', initialWidth, initialHeight);
    this.fogImage = scene.add.image(0, 0, 'fog_of_war_overlay')
      .setOrigin(0, 0)
      .setScrollFactor(1)
      .setDepth(6);
    this.darkRockPattern = null;

    // Intelligentes Dirty-Tracking & Viewport-Pufferung für drastische Akku- und CPU-Ersparnis
    this.fogDirty = true;
    this.fogBufferReady = false;
    this.fogBufferX = 0;
    this.fogBufferY = 0;
    this.fogBufferW = 0;
    this.fogBufferH = 0;

    this.lastCamX = null;
    this.lastCamY = null;
    this.lastCamW = 0;
    this.lastCamH = 0;
    this.lastPlayerX = null;
    this.lastPlayerY = null;
  }

  // Erzeugt eine dezente, elegante Gesteinstextur für unerforschtes Erdreich (leichte Struktur)
  createDarkRockPattern() {
    const c = document.createElement('canvas');
    c.width = 64;
    c.height = 64;
    const ctx = c.getContext('2d');

    // Basis: Dunkles, tiefes Slate-Navy
    ctx.fillStyle = '#070a10';
    ctx.fillRect(0, 0, 64, 64);

    // Subtile Gesteinsschichten (Sediment-Streifen)
    ctx.fillStyle = '#0a0e18';
    ctx.fillRect(0, 10, 64, 6);
    ctx.fillRect(0, 32, 64, 8);
    ctx.fillRect(0, 48, 64, 5);

    // Feine Mineral-Linien
    ctx.fillStyle = '#0d1320';
    ctx.fillRect(0, 12, 44, 2);
    ctx.fillRect(18, 34, 46, 2);
    ctx.fillRect(0, 50, 36, 1);

    // Subtile mineralische Einschlüsse / Korn-Struktur
    ctx.fillStyle = '#111827';
    const specks = [
      [6, 6], [24, 18], [48, 8], [56, 24],
      [14, 42], [36, 46], [50, 56], [26, 58]
    ];
    for (const [sx, sy] of specks) {
      ctx.fillRect(sx, sy, 2, 2);
    }

    ctx.fillStyle = '#172134';
    const micro = [
      [14, 13], [36, 20], [52, 15],
      [8, 30], [28, 38], [46, 33]
    ];
    for (const [mx, my] of micro) {
      ctx.fillRect(mx, my, 1, 1);
    }

    return c;
  }

  // Generiert eine Kachel on-the-fly deterministisch für jede Koordinate
  generateTile(gx, gy) {
    // Über der Oberfläche ist freier Himmel/Luft
    if (gy < 0) {
      return null;
    }

    // 1. Gesteinsart nach Tiefe mit progressiv länger werdenden Schichten
    let type = TILE_TYPES.DIRT;
    let baseHp = 85;

    if (gy === 0) {
      // Fester Schachteinstieg (gx 19-20): Nach oben offen
      if (gx >= MINE_ENTRANCE_GX_START && gx <= MINE_ENTRANCE_GX_END) {
        const entranceTile = {
          type: TILE_TYPES.EMPTY,
          ore: null,
          maxHp: 0,
          hp: 0,
          indestructible: false,
          explored: true
        };
        const key = `${gx},${gy}`;
        this.tiles.set(key, entranceTile);
        return entranceTile;
      }

      // Restliche Oberfläche: Fundament ist unzerstörbar und nicht abbaubar!
      const surfaceTile = {
        type: TILE_TYPES.SURFACE,
        ore: null,
        maxHp: Infinity,
        hp: Infinity,
        indestructible: true,
        explored: true
      };
      const key = `${gx},${gy}`;
      this.tiles.set(key, surfaceTile);
      return surfaceTile;
    } else if (gy <= 50) {
      type = TILE_TYPES.DIRT;
      baseHp = 48;
    } else if (gy <= 180) {
      const isStone = hashCoord(gx, gy, 101) < 0.80;
      type = isStone ? TILE_TYPES.STONE : TILE_TYPES.DIRT;
      baseHp = isStone ? 160 : 65;
    } else if (gy <= 480) {
      const isGranite = hashCoord(gx, gy, 102) < 0.85;
      type = isGranite ? TILE_TYPES.GRANITE : TILE_TYPES.STONE;
      baseHp = isGranite ? 320 : 180;
    } else if (gy <= 950) {
      const isObsidian = hashCoord(gx, gy, 103) < 0.90;
      type = isObsidian ? TILE_TYPES.OBSIDIAN : TILE_TYPES.GRANITE;
      baseHp = isObsidian ? 600 : 350;
    } else if (gy <= 1600) {
      type = TILE_TYPES.OBSIDIAN;
      baseHp = 1100;
    } else {
      type = TILE_TYPES.OBSIDIAN;
      baseHp = 1800;
    }

    // 1b. Spezielle Gefahren- & Schatzkacheln (Geröll, Lava, Kapseln, Fossilien)
    const isEntranceCol = gx >= MINE_ENTRANCE_GX_START - 2 && gx <= MINE_ENTRANCE_GX_END + 2;
    let isSpecial = false;

    if (gy >= 8 && !isEntranceCol) {
      // 1. Expeditions-Kapseln (Fundkisten):
      // Zell-basiertes Spacing (8x8 Kacheln) - garantiert, dass Fundkisten niemals dicht beieinander spawnen!
      const cacheCellSize = 8;
      const cCellX = Math.floor(gx / cacheCellSize);
      const cCellY = Math.floor(gy / cacheCellSize);
      const cCandidateGx = cCellX * cacheCellSize + Math.floor(hashCoord(cCellX, cCellY, 711) * cacheCellSize);
      const cCandidateGy = cCellY * cacheCellSize + Math.floor(hashCoord(cCellX, cCellY, 712) * cacheCellSize);
      const hasCacheInCell = hashCoord(cCellX, cCellY, 777) < 0.35;

      // 2. Fossilien & Relikte:
      // Zell-basiertes Spacing (10x10 Kacheln)
      const fossilCellSize = 10;
      const fCellX = Math.floor(gx / fossilCellSize);
      const fCellY = Math.floor(gy / fossilCellSize);
      const fCandidateGx = fCellX * fossilCellSize + Math.floor(hashCoord(fCellX, fCellY, 811) * fossilCellSize);
      const fCandidateGy = fCellY * fossilCellSize + Math.floor(hashCoord(fCellX, fCellY, 812) * fossilCellSize);
      const hasFossilInCell = hashCoord(fCellX, fCellY, 888) < 0.30;

      if (gy >= 15 && hasCacheInCell && gx === cCandidateGx && gy === cCandidateGy) {
        type = TILE_TYPES.CACHE;
        baseHp = 45;
        isSpecial = true;
      }
      else if (gy >= 32 && hasFossilInCell && gx === fCandidateGx && gy === fCandidateGy) {
        type = TILE_TYPES.FOSSIL;
        baseHp = 90;
        isSpecial = true;
      }
      // Magma- & Lava-Adern (in tieferen Zonen ab 160m)
      else if (gy >= 160 && hashCoord(gx, gy, 555) < 0.045) {
        type = TILE_TYPES.LAVA;
        baseHp = 320;
        isSpecial = true;
      }
      // Instabiles Geröll / Felsbrocken (fallen herunter bei Untergrabung)
      else if (gy >= 12 && hashCoord(gx, gy, 444) < 0.035) {
        type = TILE_TYPES.BOULDER;
        baseHp = 110;
        isSpecial = true;
      }
    }

    // 2. Kumulative Erz-Generierung (nur wenn keine Spezialkachel)
    let ore = null;
    if (!isSpecial && gy > 0) {
      const oreChance = hashCoord(gx, gy, 201);
      // Ca. 28% Wahrscheinlichkeit für Erz in einem Block
      if (oreChance < 0.28) {
        // Gültigen Erz-Pool für aktuelle Tiefe ermitteln
        const availableOres = Object.entries(ORE_DATA).filter(([, data]) => gy >= data.minDepth);

        if (availableOres.length > 0) {
          // Gewichtete Zufallsauswahl nach Seltenheit
          const totalWeight = availableOres.reduce((sum, [, data]) => sum + data.rarityWeight, 0);
          let roll = hashCoord(gx, gy, 303) * totalWeight;

          for (const [key, data] of availableOres) {
            roll -= data.rarityWeight;
            if (roll <= 0) {
              ore = key;
              break;
            }
          }
          if (!ore) {
            ore = availableOres[availableOres.length - 1][0];
          }
        }
      }
    }

    let totalHp = baseHp;
    if (ore && ORE_DATA[ore]) {
      totalHp = Math.round(baseHp * ORE_DATA[ore].hardness);
    }

    const key = `${gx},${gy}`;
    const isAlreadyExplored = this.exploredTiles ? this.exploredTiles.has(key) : false;

    const tile = {
      type,
      ore,
      maxHp: totalHp,
      hp: totalHp,
      indestructible: false,
      explored: isAlreadyExplored
    };

    this.tiles.set(key, tile);
    return tile;
  }

  getTile(gx, gy) {
    if (gy < 0) return null;
    const key = `${gx},${gy}`;
    if (this.tiles.has(key)) {
      return this.tiles.get(key);
    }
    return this.generateTile(gx, gy);
  }

  isSolid(gx, gy) {
    if (gy < 0) return false;
    const tile = this.getTile(gx, gy);
    if (!tile) return false;
    return tile.type !== TILE_TYPES.EMPTY;
  }

  getShaftTexture(gy) {
    if (gy <= 50) return 'tile_shaft_dirt';
    if (gy <= 250) return 'tile_shaft_stone';
    if (gy <= 900) return 'tile_shaft_granite';
    return 'tile_shaft_obsidian';
  }

  damageTile(gx, gy, damageAmount) {
    const tile = this.getTile(gx, gy);
    if (!tile || tile.type === TILE_TYPES.EMPTY || tile.indestructible || gy === 0) {
      return null;
    }

    tile.hp -= damageAmount;
    const progress = 1 - Math.max(0, tile.hp) / tile.maxHp;

    if (tile.hp <= 0) {
      const destroyedOre = tile.ore;
      const prevType = tile.type;
      tile.hp = 0;
      tile.type = TILE_TYPES.EMPTY;
      tile.ore = null;
      tile.explored = true;
      this.fogDirty = true;
      if (this.exploredTiles) this.exploredTiles.add(`${gx},${gy}`);
      if (this.destroyedTiles) this.destroyedTiles.add(`${gx},${gy}`);

      // Spezielle Beute- & Gefahreneffekte
      if (prevType === TILE_TYPES.CACHE) {
        this.handleCacheFound(gx, gy);
      } else if (prevType === TILE_TYPES.FOSSIL) {
        this.handleFossilFound(gx, gy);
      } else if (prevType === TILE_TYPES.BOULDER) {
        if (this.scene.player) {
          this.scene.player.cash += 25;
          this.scene.player.addXp?.(8);
          // Keine Toast dazu zeigen (Infos im Bergmann-Buch)
        }
      } else if (prevType === TILE_TYPES.LAVA) {
        if (this.scene.player) {
          const res = this.scene.player.hasArtifact?.('artifact_meteorite') ? 0.5 : 1.0;
          const dmg = Math.round(16 * res);
          this.scene.player.takeDamage(dmg);
          this.scene.hud?.showToast(`⚠️ Heiße Lava angebohrt! -${dmg} HP Hitzeschaden!`, 'danger');
        }
      }

      // Anstatt eines leeren schwarzen Lochs: Strukturierte Schacht-Hintergrundwand setzen!
      const key = `${gx},${gy}`;
      const bundle = this.activeSprites.get(key);
      if (bundle) {
        if (bundle.oreSprite) { bundle.oreSprite.destroy(); bundle.oreSprite = null; }
        if (bundle.crackSprite) { bundle.crackSprite.destroy(); bundle.crackSprite = null; }
        if (gy >= 0) {
          const shaftTex = this.getShaftTexture(gy);
          const tint = getDepthTint(gy);
          if (bundle.bgSprite) {
            bundle.bgSprite.setTexture(shaftTex).setDepth(1).setTint(tint);
          } else {
            bundle.bgSprite = this.scene.add.image(gx * TILE_SIZE + TILE_SIZE / 2, gy * TILE_SIZE + TILE_SIZE / 2, shaftTex)
              .setDepth(1)
              .setTint(tint);
          }
        } else if (bundle.bgSprite) {
          bundle.bgSprite.destroy();
          this.activeSprites.delete(key);
        }
      }

      // Prüfen, ob über dieser Kachel instabiles Geröll liegt, das nun herabstürzt!
      if (this.scene && this.scene.time) {
        this.scene.time.delayedCall(160, () => {
          this.checkBoulderFall(gx, gy - 1);
        });
      }

      return {
        destroyed: true,
        ore: destroyedOre,
        special: prevType,
        gx,
        gy
      };
    } else {
      this.updateCrackVisual(gx, gy, progress);
      return {
        destroyed: false,
        hp: tile.hp,
        maxHp: tile.maxHp,
        progress
      };
    }
  }

  handleCacheFound(gx, gy) {
    const player = this.scene.player;
    if (!player) return;
    const cashBonus = Math.floor(280 + gy * 4.2);
    player.cash += cashBonus;
    player.stats.totalCashEarned = (player.stats.totalCashEarned || 0) + cashBonus;

    let bonusMsg = '';
    const roll = Math.random();
    if (roll < 0.35) {
      player.gadgets = player.gadgets || { dynamite: 0, fuel_canister: 0, repair_kit: 0 };
      player.gadgets.dynamite = (player.gadgets.dynamite || 0) + 1;
      bonusMsg = ' + 1x Dynamit';
    } else if (roll < 0.65) {
      player.gadgets = player.gadgets || { dynamite: 0, fuel_canister: 0, repair_kit: 0 };
      player.gadgets.fuel_canister = (player.gadgets.fuel_canister || 0) + 1;
      bonusMsg = ' + 1x Treibstoff-Kanister';
    } else if (roll < 0.85) {
      player.gadgets = player.gadgets || { dynamite: 0, fuel_canister: 0, repair_kit: 0 };
      player.gadgets.repair_kit = (player.gadgets.repair_kit || 0) + 1;
      bonusMsg = ' + 1x Reparatur-Kit';
    }

    soundFx.playPurchase();
    this.scene.hud?.showToast(`📦 Expeditions-Kapsel geborgen! +$${cashBonus.toLocaleString('de-DE')}${bonusMsg}`, 'success');
    this.scene.events?.emit('player_updated');
  }

  handleFossilFound(gx, gy) {
    const player = this.scene.player;
    if (!player) return;
    const catalogList = Object.values(ARTIFACT_CATALOG);
    const eligible = catalogList.filter(art => gy >= art.minDepth);
    const known = player.discoveredArtifacts || [];
    const undiscovered = eligible.filter(art => !known.includes(art.id));
    const pool = undiscovered.length > 0 ? undiscovered : (eligible.length > 0 ? eligible : catalogList);
    const picked = pool[Math.floor(Math.random() * pool.length)];

    if (picked) {
      const isNew = player.addArtifact ? player.addArtifact(picked.id) : false;
      soundFx.playArtifactFind();
      if (isNew) {
        this.scene.hud?.showToast(`🦖 Neues Relikt entdeckt: ${picked.name}! (${picked.perk})`, 'info');
      } else {
        const bonusCash = 1250;
        player.cash += bonusCash;
        this.scene.hud?.showToast(`🦖 Bekanntes Fossil ${picked.name} für $${bonusCash} an Museum verkauft!`, 'success');
      }
      this.scene.events?.emit('player_updated');
    }
  }

  checkBoulderFall(gx, gy) {
    if (gy <= 0) return;
    const tile = this.tiles.get(`${gx},${gy}`);
    if (!tile || tile.type !== TILE_TYPES.BOULDER) return;

    const belowTile = this.getTile(gx, gy + 1);
    if (!belowTile || belowTile.type !== TILE_TYPES.EMPTY) return;

    // Tiefsten leeren Zielblock ermitteln
    let targetGy = gy + 1;
    while (targetGy < gy + 150) {
      const nextBelow = this.getTile(gx, targetGy + 1);
      if (nextBelow && nextBelow.type === TILE_TYPES.EMPTY) {
        targetGy++;
      } else {
        break;
      }
    }

    if (targetGy <= gy) return;

    // Ursprüngliche Position leeren
    tile.type = TILE_TYPES.EMPTY;
    tile.hp = 0;
    tile.explored = true;
    this.fogDirty = true;
    this.removeSpritesAt(gx, gy);

    // Schachtwand an alter Position setzen
    const shaftTex = this.getShaftTexture(gy);
    const tint = getDepthTint(gy);
    const bgSprite = this.scene.add.image(gx * TILE_SIZE + TILE_SIZE / 2, gy * TILE_SIZE + TILE_SIZE / 2, shaftTex)
      .setDepth(1)
      .setTint(tint);
    this.activeSprites.set(`${gx},${gy}`, { bgSprite, oreSprite: null, crackSprite: null });

    // Fallender Felsbrocken
    const startX = gx * TILE_SIZE + TILE_SIZE / 2;
    const startY = gy * TILE_SIZE + TILE_SIZE / 2;
    const targetY = targetGy * TILE_SIZE + TILE_SIZE / 2;

    const fallingSprite = this.scene.add.image(startX, startY, 'tile_boulder')
      .setDepth(6)
      .setTint(getDepthTint(gy));

    const distance = targetGy - gy;
    const duration = Math.min(650, Math.max(160, distance * 110));

    this.scene.tweens.add({
      targets: fallingSprite,
      y: targetY,
      duration,
      ease: 'Quad.easeIn',
      onUpdate: () => {
        // Kollision mit Driller prüfen
        const player = this.scene.player;
        if (player && player.gx === gx && !fallingSprite.hasHitPlayer) {
          const pY = player.y;
          if (Math.abs(fallingSprite.y - pY) < 22) {
            fallingSprite.hasHitPlayer = true;
            player.takeDamage(25);
            this.scene.cameras.main.shake(200, 0.02);
          }
        }
      },
      onComplete: () => {
        fallingSprite.destroy();

        // Zielkachel wird zum Felsbrocken
        const landedTile = {
          type: TILE_TYPES.BOULDER,
          ore: null,
          maxHp: 110,
          hp: 110,
          indestructible: false,
          explored: true
        };
        this.tiles.set(`${gx},${targetGy}`, landedTile);
        this.fogDirty = true;
        if (this.scene.player) {
          this.scene.player.discoverSpecialTile?.(TILE_TYPES.BOULDER);
        }

        // Aufprallgeräusch & Erschütterung
        soundFx.playTileDestroy();
        this.scene.cameras.main.shake(120, 0.008);

        // Kettenreaktion: Felsbrocken über dem ursprünglichen Block prüfen
        this.checkBoulderFall(gx, gy - 1);
      }
    });
  }

  updateCrackVisual(gx, gy, progress) {
    const key = `${gx},${gy}`;
    const bundle = this.activeSprites.get(key);
    if (!bundle) return;

    let stage = 0;
    if (progress > 0.75) stage = 4;
    else if (progress > 0.50) stage = 3;
    else if (progress > 0.25) stage = 2;
    else if (progress > 0.05) stage = 1;

    if (stage > 0 && bundle.crackStage !== stage) {
      bundle.crackStage = stage;
      if (!bundle.crackSprite) {
        bundle.crackSprite = this.scene.add.image(
          gx * TILE_SIZE + TILE_SIZE / 2,
          gy * TILE_SIZE + TILE_SIZE / 2,
          `crack_${stage}`
        ).setDepth(5);
      } else {
        bundle.crackSprite.setTexture(`crack_${stage}`);
        if (!bundle.crackSprite.visible) bundle.crackSprite.setVisible(true);
      }
    }
  }

  removeSpritesAt(gx, gy) {
    const key = `${gx},${gy}`;
    const bundle = this.activeSprites.get(key);
    if (bundle) {
      if (bundle.bgSprite) bundle.bgSprite.destroy();
      if (bundle.oreSprite) bundle.oreSprite.destroy();
      if (bundle.crackSprite) bundle.crackSprite.destroy();
      this.activeSprites.delete(key);
    }
  }

  clearAllSprites() {
    for (const [key, bundle] of this.activeSprites.entries()) {
      if (bundle.bgSprite) bundle.bgSprite.destroy();
      if (bundle.oreSprite) bundle.oreSprite.destroy();
      if (bundle.crackSprite) bundle.crackSprite.destroy();
    }
    this.activeSprites.clear();
    this.neededKeys.clear();
    this.lastCamX = null;
    this.lastCamY = null;
    this.lastPlayerX = null;
    this.lastPlayerY = null;
    this.fogDirty = true;
    this.fogBufferReady = false;
  }

  updateViewport(camera, player) {
    const camView = camera.worldView;
    const pX = player ? (player.sprite ? player.sprite.x : (player.x || 0)) : 0;
    const pY = player ? (player.sprite ? player.sprite.y : (player.y || 0)) : 0;

    let viewX = camView.x;
    let viewY = camView.y;
    let viewW = camView.width;
    let viewH = camView.height;

    // Robuster Fallback, falls worldView noch nicht final berechnet wurde (z.B. erster Frame auf Mobile)
    if (viewW <= 32 || viewH <= 32) {
      const zoom = Math.max(0.5, camera.zoom || 1);
      const screenW = Math.max(camera.width || 0, window.innerWidth || 0, 800);
      const screenH = Math.max(camera.height || 0, window.innerHeight || 0, 600);
      viewW = screenW / zoom;
      viewH = screenH / zoom;
      viewX = pX - viewW / 2;
      viewY = pY - viewH / 2;
    }

    const viewThresholdSq = 16 * 16; // 16px (halbe Kachel) Bewegungsschwelle
    const camDistSq = this.lastCamX !== null ? ((viewX - this.lastCamX) ** 2 + (viewY - this.lastCamY) ** 2) : 99999;
    const playerDistSq = this.lastPlayerX !== null ? ((pX - this.lastPlayerX) ** 2 + (pY - this.lastPlayerY) ** 2) : 99999;
    const sizeChanged = viewW !== this.lastCamW || viewH !== this.lastCamH;

    // Nur überspringen, wenn Schwellenwert nicht erreicht und Nebel sauber ist
    if (this.lastCamX !== null && !this.fogDirty && !sizeChanged && camDistSq < viewThresholdSq && playerDistSq < viewThresholdSq) {
      return;
    }

    this.lastCamX = viewX;
    this.lastCamY = viewY;
    this.lastCamW = viewW;
    this.lastCamH = viewH;
    this.lastPlayerX = pX;
    this.lastPlayerY = pY;

    const margin = 10;
    const startCol = Math.floor(viewX / TILE_SIZE) - margin;
    const endCol = Math.ceil((viewX + viewW) / TILE_SIZE) + margin;

    const startRow = Math.max(0, Math.floor(viewY / TILE_SIZE) - margin);
    const endRow = Math.ceil((viewY + viewH) / TILE_SIZE) + margin;

    this.neededKeys.clear();
    const sensorRadTiles = player ? player.sensorRadius : 3.5;
    const sensorRadPx = sensorRadTiles * TILE_SIZE;
    const sensorThreshold = sensorRadPx + 6;
    const sensorThresholdSq = sensorThreshold * sensorThreshold;

    for (let y = startRow; y <= endRow; y++) {
      const depthTint = getDepthTint(y);
      const oreTint = getOreDepthTint(y);

      for (let x = startCol; x <= endCol; x++) {
        const tile = this.getTile(x, y);
        if (!tile) continue;

        const key = `${x},${y}`;
        this.neededKeys.add(key);

        const tileCenterX = x * TILE_SIZE + TILE_SIZE / 2;
        const tileCenterY = y * TILE_SIZE + TILE_SIZE / 2;
        const dx = tileCenterX - pX;
        const dy = tileCenterY - pY;

        if (dx * dx + dy * dy <= sensorThresholdSq) {
          if (!tile.explored) {
            tile.explored = true;
            this.fogDirty = true;
          }
          if (this.exploredTiles) this.exploredTiles.add(key);
        }

        // 1. Ausgegrabene Hohlräume unter der Erde (y >= 0): Schacht-Hintergrundwand rendern!
        if (tile.type === TILE_TYPES.EMPTY) {
          if (y >= 0) {
            let bundle = this.activeSprites.get(key);
            const shaftTex = this.getShaftTexture(y);
            if (!bundle) {
              const bgSprite = this.scene.add.image(tileCenterX, tileCenterY, shaftTex)
                .setDepth(1)
                .setTint(depthTint);
              bundle = { bgSprite, oreSprite: null, crackSprite: null };
              this.activeSprites.set(key, bundle);
            } else {
              if (bundle.bgSprite && bundle.bgSprite.texture.key !== shaftTex) {
                bundle.bgSprite.setTexture(shaftTex).setDepth(1).setTint(depthTint);
              }
              // Sicherstellen, dass keine Erze oder Risse in abgebauten Kacheln schweben
              if (bundle.oreSprite) {
                bundle.oreSprite.destroy();
                bundle.oreSprite = null;
              }
              if (bundle.crackSprite) {
                bundle.crackSprite.destroy();
                bundle.crackSprite = null;
              }
              if (!bundle.bgSprite.visible) bundle.bgSprite.setVisible(true);
            }
          }
          continue;
        }

        let bundle = this.activeSprites.get(key);
        const tileTint = (tile.type === TILE_TYPES.LAVA) ? 0xffffff : depthTint;
        if (!bundle) {
          const bgSprite = this.scene.add.image(tileCenterX, tileCenterY, tile.type)
            .setDepth(2)
            .setTint(tileTint);
          let oreSprite = null;

          if (tile.ore && ORE_DATA[tile.ore]) {
            oreSprite = this.scene.add.image(tileCenterX, tileCenterY, ORE_DATA[tile.ore].sprite)
              .setDepth(3)
              .setTint(oreTint);
          }

          let crackSprite = null;
          if (tile.hp < tile.maxHp) {
            const progress = 1 - tile.hp / tile.maxHp;
            let stage = Math.min(4, Math.max(1, Math.ceil(progress * 4)));
            crackSprite = this.scene.add.image(tileCenterX, tileCenterY, `crack_${stage}`).setDepth(5);
          }

          bundle = { bgSprite, oreSprite, crackSprite };
          this.activeSprites.set(key, bundle);
        } else {
          // Sprite existiert bereits: Typ, Erz und Risse mit aktuellem Kachelzustand synchronisieren
          if (bundle.bgSprite.texture.key !== tile.type) {
            bundle.bgSprite.setTexture(tile.type).setDepth(2).setTint(tileTint);
          }
          if (!bundle.bgSprite.visible) bundle.bgSprite.setVisible(true);

          const expectedOreSprite = (tile.ore && ORE_DATA[tile.ore]) ? ORE_DATA[tile.ore].sprite : null;
          if (expectedOreSprite) {
            if (!bundle.oreSprite) {
              bundle.oreSprite = this.scene.add.image(tileCenterX, tileCenterY, expectedOreSprite)
                .setDepth(3)
                .setTint(oreTint);
            } else if (bundle.oreSprite.texture.key !== expectedOreSprite) {
              bundle.oreSprite.setTexture(expectedOreSprite).setTint(oreTint);
            }
            if (!bundle.oreSprite.visible) bundle.oreSprite.setVisible(true);
          } else if (bundle.oreSprite) {
            bundle.oreSprite.destroy();
            bundle.oreSprite = null;
          }

          if (tile.hp < tile.maxHp) {
            const progress = 1 - tile.hp / tile.maxHp;
            let stage = Math.min(4, Math.max(1, Math.ceil(progress * 4)));
            const crackKey = `crack_${stage}`;
            if (!bundle.crackSprite) {
              bundle.crackSprite = this.scene.add.image(tileCenterX, tileCenterY, crackKey).setDepth(5);
            } else if (bundle.crackSprite.texture.key !== crackKey) {
              bundle.crackSprite.setTexture(crackKey);
            }
            if (!bundle.crackSprite.visible) bundle.crackSprite.setVisible(true);
          } else if (bundle.crackSprite) {
            bundle.crackSprite.destroy();
            bundle.crackSprite = null;
          }
        }
      }
    }

    // ------------------------------------------------------------------
    // FOG OF WAR: NUR UNTER DER ERDE (y >= 0) - NIEMALS IM HIMMEL!
    // Pufferung im World-Space: Canvas wird nur neu gezeichnet & zur GPU geladen,
    // wenn neue Kacheln aufgedeckt wurden oder die Kamera den Puffer verlässt!
    // ------------------------------------------------------------------
    if (viewY + viewH <= 0) {
      // Komplett im Himmel: Nebel unsichtbar schalten
      if (this.fogImage.visible) this.fogImage.setVisible(false);
    } else {
      const PAD_X = 384;
      const PAD_Y = 256;
      const SAFETY = 96;

      const viewLeft = viewX;
      const viewRight = viewX + viewW;
      const viewTop = Math.max(0, viewY);
      const viewBottom = viewY + viewH;

      const inBuffer = this.fogBufferReady &&
        this.fogBufferX <= (viewLeft - SAFETY) &&
        (this.fogBufferX + this.fogBufferW) >= (viewRight + SAFETY) &&
        this.fogBufferY <= Math.max(0, viewTop - SAFETY) &&
        (this.fogBufferY + this.fogBufferH) >= (viewBottom + SAFETY);

      if (!inBuffer || this.fogDirty || !this.fogImage.visible) {
        // Neu puffern & rendern
        const bufferX = Math.floor((viewLeft - PAD_X) / 64) * 64;
        const bufferW = Math.ceil((viewW + PAD_X * 2) / 128) * 128;
        const bufferY = Math.max(0, Math.floor((viewTop - PAD_Y) / 64) * 64);
        const rawBottom = viewBottom + PAD_Y;
        const bufferH = Math.ceil(Math.max(128, rawBottom - bufferY) / 128) * 128;

        if (this.fogTexture.width !== bufferW || this.fogTexture.height !== bufferH) {
          this.fogTexture.setSize(bufferW, bufferH);
          this.darkRockPattern = null;
        }

        this.fogImage.setPosition(bufferX, bufferY);
        this.fogImage.setDisplaySize(bufferW, bufferH);
        this.fogImage.setVisible(true);

        const ctx = this.fogTexture.context;
        if (!this.darkRockPattern) {
          const patCanvas = this.createDarkRockPattern();
          this.darkRockPattern = ctx.createPattern(patCanvas, 'repeat');
        }

        ctx.clearRect(0, 0, bufferW, bufferH);
        ctx.globalCompositeOperation = 'source-over';

        if (this.darkRockPattern && typeof DOMMatrix !== 'undefined') {
          try {
            const mat = new DOMMatrix();
            mat.translateSelf(-bufferX, -bufferY);
            this.darkRockPattern.setTransform(mat);
            ctx.fillStyle = this.darkRockPattern;
          } catch (err) {
            ctx.fillStyle = '#070a10';
          }
        } else {
          ctx.fillStyle = '#070a10';
        }
        ctx.fillRect(0, 0, bufferW, bufferH);

        // Licht in die Dunkelheit stanzen
        ctx.globalCompositeOperation = 'destination-out';
        ctx.fillStyle = '#000000';

        const carveStartCol = Math.floor(bufferX / TILE_SIZE);
        const carveEndCol = Math.ceil((bufferX + bufferW) / TILE_SIZE);
        const carveStartRow = Math.max(0, Math.floor(bufferY / TILE_SIZE));
        const carveEndRow = Math.ceil((bufferY + bufferH) / TILE_SIZE);

        for (let y = carveStartRow; y <= carveEndRow; y++) {
          for (let x = carveStartCol; x <= carveEndCol; x++) {
            const key = `${x},${y}`;
            const isExplored = this.exploredTiles && this.exploredTiles.has(key);
            const isDestroyed = this.destroyedTiles && this.destroyedTiles.has(key);
            const tile = this.tiles.get(key);
            if (isExplored || isDestroyed || (tile && (tile.explored || tile.type === TILE_TYPES.EMPTY))) {
              const cx = x * TILE_SIZE - bufferX;
              const cy = y * TILE_SIZE - bufferY;
              ctx.fillRect(cx - 1, cy - 1, TILE_SIZE + 2, TILE_SIZE + 2);
            }
          }
        }

        ctx.globalCompositeOperation = 'source-over';
        this.fogTexture.refresh();

        this.fogDirty = false;
        this.fogBufferReady = true;
        this.fogBufferX = bufferX;
        this.fogBufferY = bufferY;
        this.fogBufferW = bufferW;
        this.fogBufferH = bufferH;
      }
    }

    // Nicht mehr sichtbare Kacheln bereinigen (Culling)
    for (const [key, bundle] of this.activeSprites.entries()) {
      if (!this.neededKeys.has(key)) {
        if (bundle.bgSprite) bundle.bgSprite.destroy();
        if (bundle.oreSprite) bundle.oreSprite.destroy();
        if (bundle.crackSprite) bundle.crackSprite.destroy();
        this.activeSprites.delete(key);
      }
    }
  }
}
