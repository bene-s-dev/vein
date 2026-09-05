/**
 * GridSystem.js
 * Verwaltet das endlose 2D-Kachelraster (World Grid):
 * - Prozedurale, endlose Generierung nach unten und in beide horizontalen Richtungen
 * - Kumulatives Erzsystem (tiefere Ebenen behalten alte Erze + neue seltene Schätze)
 * - Dunkelheit & Nebel des Krieges (Fog of War): Kacheln außerhalb des Sensor-Radius sind verdunkelt
 * - Dynamisches Culling & Sprite-Pooling
 */

export const TILE_SIZE = 32;

export const TILE_TYPES = {
  EMPTY: 'empty',
  SURFACE: 'tile_surface',
  DIRT: 'tile_dirt',
  STONE: 'tile_stone',
  GRANITE: 'tile_granite',
  OBSIDIAN: 'tile_obsidian'
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
    value: 18,
    weight: 1,
    sprite: 'ore_coal',
    hardness: 1.15,
    minDepth: 1,
    rarityWeight: 100
  },
  copper: {
    name: 'Kupfer',
    value: 35,
    weight: 1,
    sprite: 'ore_copper',
    hardness: 1.25,
    minDepth: 1,
    rarityWeight: 80
  },
  iron: {
    name: 'Eisen',
    value: 65,
    weight: 2,
    sprite: 'ore_iron',
    hardness: 1.45,
    minDepth: 30,
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

/**
 * Tiefen-Fading: Sanfter Farbübergang von Hellbraun (Erdoberfläche) bis tiefstes Schwarz bei 1500m+
 */
export function getDepthTint(y) {
  if (y <= 0) return 0xffffff;
  const t = Math.min(1.0, y / 1500);
  const r = Math.round(250 * Math.pow(1 - t, 1.15));
  const g = Math.round(220 * Math.pow(1 - t, 1.30));
  const b = Math.round(190 * Math.pow(1 - t, 1.45));
  return (r << 16) | (g << 8) | b;
}

/**
 * Erze behalten auch im dunklen Tiefenraum eine dezent glimmende Resthelligkeit
 */
export function getOreDepthTint(y) {
  if (y <= 0) return 0xffffff;
  const t = Math.min(1.0, y / 1500);
  const factor = Math.max(0.40, 1.0 - t * 0.60);
  const v = Math.round(255 * factor);
  return (v << 16) | (v << 8) | v;
}

export class GridSystem {
  constructor(scene) {
    this.scene = scene;

    // Dynamischer Kachel-Speicher (Map aus `${gx},${gy}` -> Tile)
    this.tiles = new Map();
    this.activeSprites = new Map();

    // Verfolgung aller besuchten Positionen (wo man schon war bleibt hell angezeigt)
    this.exploredStamps = [];
    this.exploredTiles = new Set();
    this.lastStampX = null;
    this.lastStampY = null;

    // Kreisrunde Fog-of-War Textur auf Depth 6 (in World Space verankert!)
    const initialWidth = 1000;
    const initialHeight = 800;
    this.fogTexture = scene.textures.createCanvas('fog_of_war_overlay', initialWidth, initialHeight);
    this.fogImage = scene.add.image(0, 0, 'fog_of_war_overlay')
      .setOrigin(0, 0)
      .setScrollFactor(1)
      .setDepth(6);
    this.darkRockPattern = null;
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
      baseHp = 85;
    } else if (gy <= 180) {
      const isStone = hashCoord(gx, gy, 101) < 0.80;
      type = isStone ? TILE_TYPES.STONE : TILE_TYPES.DIRT;
      baseHp = isStone ? 160 : 95;
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

    // 2. Kumulative Erz-Generierung (Alle bisherigen Erze bleiben erhalten!)
    let ore = null;
    const oreChance = hashCoord(gx, gy, 201);

    // Ca. 27% Wahrscheinlichkeit für Erz in einem Block
    if (gy > 0 && oreChance < 0.27) {
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
      tile.type = TILE_TYPES.EMPTY;
      tile.ore = null;
      tile.explored = true;
      if (this.exploredTiles) this.exploredTiles.add(`${gx},${gy}`);

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

      return {
        destroyed: true,
        ore: destroyedOre,
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

  updateCrackVisual(gx, gy, progress) {
    const key = `${gx},${gy}`;
    const bundle = this.activeSprites.get(key);
    if (!bundle) return;

    let stage = 0;
    if (progress > 0.75) stage = 4;
    else if (progress > 0.50) stage = 3;
    else if (progress > 0.25) stage = 2;
    else if (progress > 0.05) stage = 1;

    if (stage > 0) {
      if (!bundle.crackSprite) {
        bundle.crackSprite = this.scene.add.image(
          gx * TILE_SIZE + TILE_SIZE / 2,
          gy * TILE_SIZE + TILE_SIZE / 2,
          `crack_${stage}`
        ).setDepth(5);
      } else {
        bundle.crackSprite.setTexture(`crack_${stage}`);
        bundle.crackSprite.setVisible(true);
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

  updateViewport(camera, player) {
    const margin = 10;
    const startCol = Math.floor(camera.worldView.x / TILE_SIZE) - margin;
    const endCol = Math.ceil((camera.worldView.x + camera.worldView.width) / TILE_SIZE) + margin;

    const startRow = Math.max(0, Math.floor(camera.worldView.y / TILE_SIZE) - margin);
    const endRow = Math.ceil((camera.worldView.y + camera.worldView.height) / TILE_SIZE) + margin;

    const neededKeys = new Set();
    const pX = player ? player.sprite.x : 0;
    const pY = player ? player.sprite.y : 0;
    const sensorRadTiles = player ? player.sensorRadius : 3.5;
    const sensorRadPx = sensorRadTiles * TILE_SIZE;


    for (let y = startRow; y <= endRow; y++) {
      const depthTint = getDepthTint(y);
      const oreTint = getOreDepthTint(y);

      for (let x = startCol; x <= endCol; x++) {
        const tile = this.getTile(x, y);
        if (!tile) continue;

        const key = `${x},${y}`;
        neededKeys.add(key);

        const tileCenterX = x * TILE_SIZE + TILE_SIZE / 2;
        const tileCenterY = y * TILE_SIZE + TILE_SIZE / 2;
        const distPx = Math.hypot(tileCenterX - pX, tileCenterY - pY);

        if (distPx <= sensorRadPx + 6) {
          tile.explored = true;
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
                bundle.bgSprite.setTexture(shaftTex).setDepth(1);
              }
              bundle.bgSprite.setVisible(true);
              bundle.bgSprite.setTint(depthTint);
            }
          }
          continue;
        }

        let bundle = this.activeSprites.get(key);
        if (!bundle) {
          const bgSprite = this.scene.add.image(tileCenterX, tileCenterY, tile.type)
            .setDepth(2)
            .setTint(depthTint);
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
        }

        // Vordergrund-Kacheln mit Tiefen-Fading (Hellbraun nach Schwarz bis 5000m)
        bundle.bgSprite.setVisible(true);
        bundle.bgSprite.setTint(depthTint);
        bundle.bgSprite.setAlpha(1.0);

        if (bundle.oreSprite) {
          bundle.oreSprite.setVisible(true);
          bundle.oreSprite.setTint(oreTint);
          bundle.oreSprite.setAlpha(1.0);
        }

        if (bundle.crackSprite) {
          bundle.crackSprite.setVisible(true);
        }
      }
    }

    // ------------------------------------------------------------------
    // FOG OF WAR: NUR UNTER DER ERDE (y >= 0) - NIEMALS IM HIMMEL!
    // Großzügige Puffer (padX=350, padY=250), damit bei horizontaler Fahrt niemals Kanten oder Lücken entstehen
    // ------------------------------------------------------------------
    const camView = camera.worldView;
    const padX = 350;
    const padY = 250;

    const worldX = Math.floor(camView.x) - padX;
    const worldW = Math.ceil(camView.width) + padX * 2;

    const rawWorldY = Math.floor(camView.y);
    const rawWorldH = Math.ceil(camView.height);

    // Erdoberfläche ist bei y = 0. Fog existiert STRIKT nur für y >= 0!
    const fogTopY = Math.max(0, rawWorldY - padY);
    const fogBottomY = rawWorldY + rawWorldH + padY;
    const fogH = Math.max(0, fogBottomY - fogTopY);

    if (fogH <= 0) {
      // Komplett im Himmel: Nebel unsichtbar schalten
      this.fogImage.setVisible(false);
    } else {
      this.fogImage.setVisible(true);

      // Quantisiert auf 128px-Schritte, damit das Canvas nicht bei jeder Subpixel-Bewegung neu allokiert wird
      const targetW = Math.ceil(worldW / 128) * 128;
      const targetH = Math.ceil(fogH / 128) * 128;

      if (this.fogTexture.width !== targetW || this.fogTexture.height !== targetH) {
        this.fogTexture.setSize(targetW, targetH);
        this.darkRockPattern = null; // Canvas resized -> Pattern muss neu erstellt werden!
      }

      this.fogImage.setPosition(worldX, fogTopY);
      this.fogImage.setDisplaySize(targetW, targetH);

      const ctx = this.fogTexture.context;

      if (!this.darkRockPattern) {
        const patCanvas = this.createDarkRockPattern();
        this.darkRockPattern = ctx.createPattern(patCanvas, 'repeat');
      }

      ctx.clearRect(0, 0, targetW, targetH);

      ctx.globalCompositeOperation = 'source-over';
      if (this.darkRockPattern && typeof DOMMatrix !== 'undefined') {
        try {
          const mat = new DOMMatrix();
          mat.translateSelf(-worldX, -fogTopY);
          this.darkRockPattern.setTransform(mat);
          ctx.fillStyle = this.darkRockPattern;
        } catch (err) {
          ctx.fillStyle = '#070a10';
        }
      } else {
        ctx.fillStyle = '#070a10';
      }
      ctx.fillRect(0, 0, targetW, targetH);

      // Licht in die Dunkelheit stanzen
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = '#000000';

      // 1. Alle aufgedeckten oder abgebauten Kacheln im aktuellen Sichtfeld stanzen (Kacheln bleiben IMMER sichtbar!)
      for (let y = startRow; y <= endRow; y++) {
        for (let x = startCol; x <= endCol; x++) {
          const key = `${x},${y}`;
          const tile = this.getTile(x, y);
          if (tile && (tile.explored || tile.type === TILE_TYPES.EMPTY || (this.exploredTiles && this.exploredTiles.has(key)))) {
            const cx = x * TILE_SIZE - worldX;
            const cy = y * TILE_SIZE - fogTopY;
            ctx.fillRect(cx - 1, cy - 1, TILE_SIZE + 2, TILE_SIZE + 2);
          }
        }
      }


      ctx.globalCompositeOperation = 'source-over';
      this.fogTexture.refresh();
    }

    // Nicht mehr sichtbare Kacheln bereinigen (Culling)
    for (const [key, bundle] of this.activeSprites.entries()) {
      if (!neededKeys.has(key)) {
        if (bundle.bgSprite) bundle.bgSprite.destroy();
        if (bundle.oreSprite) bundle.oreSprite.destroy();
        if (bundle.crackSprite) bundle.crackSprite.destroy();
        this.activeSprites.delete(key);
      }
    }
  }
}
