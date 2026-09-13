import { ORE_COLORS, ORE_FILL_COLORS } from '../ui/IconHelper.js';

/**
 * AssetLoader.js
 * Clean Material Design Ästhetik:
 * Moderne, aufgeräumte Farbpaletten, matte Oberflächen, reduzierte Akzente
 * und klare Formen (weder grelles Neon noch grobes Retro).
 */

export class AssetLoader {
  static generateTextures(scene) {
    const TILE_SIZE = 32;

    const createTexture = (key, width, height, drawFn) => {
      if (scene.textures.exists(key)) {
        scene.textures.remove(key);
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = false;
      drawFn(ctx, width, height);
      scene.textures.addCanvas(key, canvas);
    };

    // =======================================================
    // 1. KACHELN - NATÜRLICHE, RUHIGE MATERIAL-SCHICHTEN
    // =======================================================

    // Surface Grass (32x32)
    createTexture('tile_surface', TILE_SIZE, TILE_SIZE, (ctx) => {
      // Warme Erde
      ctx.fillStyle = '#5c3d28';
      ctx.fillRect(0, 0, 32, 32);
      ctx.fillStyle = '#4a2f1c';
      ctx.fillRect(4, 14, 6, 4);
      ctx.fillRect(18, 18, 8, 4);
      ctx.fillRect(9, 25, 6, 4);
      ctx.fillStyle = '#6e4b33';
      ctx.fillRect(12, 12, 4, 3);
      ctx.fillRect(22, 23, 5, 3);

      // Frisches, sattes Gras (Clean Flat Green)
      ctx.fillStyle = '#1e3a2f';
      ctx.fillRect(0, 5, 32, 2);
      ctx.fillStyle = '#2d6a4f';
      ctx.fillRect(0, 0, 32, 5);
      ctx.fillStyle = '#40916c';
      for (let x = 0; x < 32; x += 4) {
        ctx.fillRect(x, 0, 2, 3);
        ctx.fillRect(x + 1, 2, 2, 2);
      }
      // Subtile Bodenkante
      ctx.fillStyle = '#382213';
      ctx.fillRect(0, 31, 32, 1);
    });

    // Dirt (32x32)
    createTexture('tile_dirt', TILE_SIZE, TILE_SIZE, (ctx) => {
      ctx.fillStyle = '#64422b';
      ctx.fillRect(0, 0, 32, 32);
      ctx.fillStyle = '#52341f';
      ctx.fillRect(3, 4, 8, 6);
      ctx.fillRect(16, 9, 9, 5);
      ctx.fillRect(6, 18, 8, 6);
      ctx.fillRect(20, 21, 7, 6);
      ctx.fillStyle = '#7a5237';
      ctx.fillRect(8, 6, 4, 3);
      ctx.fillRect(14, 20, 5, 3);
      ctx.fillRect(24, 12, 3, 3);
      // Weiche Kanten
      ctx.fillStyle = '#3f2615';
      ctx.fillRect(0, 31, 32, 1);
      ctx.fillRect(31, 0, 1, 32);
    });

    // Stone (32x32)
    createTexture('tile_stone', TILE_SIZE, TILE_SIZE, (ctx) => {
      ctx.fillStyle = '#475569'; // Clean Slate
      ctx.fillRect(0, 0, 32, 32);
      ctx.fillStyle = '#334155';
      ctx.fillRect(4, 4, 11, 8);
      ctx.fillRect(18, 12, 10, 10);
      ctx.fillRect(6, 20, 8, 8);
      ctx.fillStyle = '#64748b';
      ctx.fillRect(2, 2, 6, 3);
      ctx.fillRect(16, 6, 8, 2);
      ctx.fillRect(4, 16, 4, 2);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 31, 32, 1);
      ctx.fillRect(31, 0, 1, 32);
    });

    // Granite (32x32)
    createTexture('tile_granite', TILE_SIZE, TILE_SIZE, (ctx) => {
      ctx.fillStyle = '#3b334a'; // Muted Slate-Purple
      ctx.fillRect(0, 0, 32, 32);
      ctx.fillStyle = '#292235';
      ctx.fillRect(4, 6, 12, 10);
      ctx.fillRect(18, 16, 10, 11);
      ctx.fillStyle = '#524766';
      ctx.fillRect(2, 2, 8, 4);
      ctx.fillRect(16, 8, 12, 3);
      ctx.fillStyle = '#1c1626';
      ctx.fillRect(0, 31, 32, 1);
      ctx.fillRect(31, 0, 1, 32);
    });

    // Obsidian (32x32)
    createTexture('tile_obsidian', TILE_SIZE, TILE_SIZE, (ctx) => {
      ctx.fillStyle = '#1e222d'; // Deep Basalt
      ctx.fillRect(0, 0, 32, 32);
      ctx.fillStyle = '#12151c';
      ctx.fillRect(4, 4, 14, 12);
      ctx.fillRect(16, 16, 12, 12);
      ctx.fillStyle = '#475569';
      ctx.fillRect(6, 6, 3, 3);
      ctx.fillRect(22, 10, 4, 3);
      ctx.fillRect(12, 22, 5, 4);
      ctx.fillStyle = '#9333ea';
      ctx.fillRect(7, 7, 2, 2);
      ctx.fillRect(23, 11, 2, 2);
    });

    // Bedrock (32x32)
    createTexture('tile_bedrock', TILE_SIZE, TILE_SIZE, (ctx) => {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, 32, 32);
      ctx.fillStyle = '#334155';
      ctx.fillRect(2, 2, 28, 10);
      ctx.fillRect(2, 20, 28, 10);
      ctx.strokeStyle = '#475569';
      ctx.strokeRect(0.5, 0.5, 31, 31);
    });

    // 1A-1. Felsbrocken / Geröll (32x32) - Dichter massiver Fels, harmonisch ins Schacht-Erdreich eingebettet
    createTexture('tile_boulder', TILE_SIZE, TILE_SIZE, (ctx) => {
      // 1. Hintergrund-Matrix / Schachtsediment (Füllt die 32x32 Kachel vollständig, keine schwarzen Leerräume!)
      ctx.fillStyle = '#52341f'; // Warme Erdbasis analog tile_dirt
      ctx.fillRect(0, 0, 32, 32);

      // Weiche Erd- & Schachtränder
      ctx.fillStyle = '#3f2615';
      ctx.fillRect(0, 31, 32, 1);
      ctx.fillRect(31, 0, 1, 32);
      ctx.fillRect(0, 0, 4, 3);
      ctx.fillRect(28, 0, 4, 3);
      ctx.fillRect(0, 29, 4, 3);
      ctx.fillRect(28, 29, 4, 3);

      // Tiefere Bettung im Erdreich (Felsbett-Schattenfuge)
      ctx.fillStyle = '#26160d';
      ctx.fillRect(2, 3, 28, 26);
      ctx.fillRect(3, 2, 26, 28);

      // 2. Massiver Felskörper (Dichter Granit / Tiefenstein)
      ctx.fillStyle = '#475569';
      ctx.fillRect(3, 4, 26, 24);
      ctx.fillRect(4, 3, 24, 26);
      ctx.fillRect(5, 2, 22, 28);
      ctx.fillRect(2, 5, 28, 22);

      // Obere / linke Lichtfacette (Gesteins-Lichtkante)
      ctx.fillStyle = '#64748b';
      ctx.fillRect(5, 4, 18, 10);
      ctx.fillRect(4, 6, 8, 12);
      ctx.fillRect(6, 3, 14, 3);

      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(7, 4, 9, 3);
      ctx.fillRect(5, 7, 4, 5);

      // Untere / rechte Schattenfacette (Schwere & Masse)
      ctx.fillStyle = '#334155';
      ctx.fillRect(14, 14, 14, 13);
      ctx.fillRect(9, 20, 16, 7);
      ctx.fillRect(18, 8, 9, 8);

      ctx.fillStyle = '#1e293b';
      ctx.fillRect(16, 18, 11, 8);
      ctx.fillRect(21, 13, 6, 8);
      ctx.fillRect(8, 24, 15, 3);

      // Natürliche Gesteinsrisse & mineralische Bruchlinien
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(8, 9);
      ctx.lineTo(13, 13);
      ctx.lineTo(18, 11);
      ctx.lineTo(24, 15);
      ctx.moveTo(13, 13);
      ctx.lineTo(14, 21);
      ctx.lineTo(19, 23);
      ctx.moveTo(18, 11);
      ctx.lineTo(21, 7);
      ctx.stroke();

      // Feine Riss-Lichtkanten (Kristall-Reflexion)
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(9, 8);
      ctx.lineTo(13, 12);
      ctx.stroke();

      // Subtile Erd-Einlagerungen an den Kanten (Verbindung zum Schacht)
      ctx.fillStyle = '#5c3d28';
      ctx.fillRect(2, 11, 2, 6);
      ctx.fillRect(28, 14, 2, 5);
      ctx.fillRect(12, 27, 5, 2);
    });

    // 1A-2. Lava-Ader (32x32) - Glühende Magmaschicht
    createTexture('tile_lava', TILE_SIZE, TILE_SIZE, (ctx) => {
      // Dunkles Basalt-Bett
      ctx.fillStyle = '#180d09';
      ctx.fillRect(0, 0, 32, 32);

      // Glühendes Magma-Feld
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(2, 2, 28, 28);

      // Fließende orange Hitze-Ströme
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.arc(10, 12, 7, 0, Math.PI * 2);
      ctx.arc(22, 18, 8, 0, Math.PI * 2);
      ctx.fill();

      // Weiß-Gelber glutheißer Kern
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(11, 12, 3.5, 0, Math.PI * 2);
      ctx.arc(22, 18, 4, 0, Math.PI * 2);
      ctx.fill();

      // Schwimmende Krusten-Schollen
      ctx.fillStyle = '#451a03';
      ctx.fillRect(4, 5, 6, 3);
      ctx.fillRect(18, 6, 7, 4);
      ctx.fillRect(12, 23, 8, 4);
    });

    // 1A-3. Verlassene Expeditions-Kapsel / Schatz-Wrack (32x32)
    createTexture('tile_cache', TILE_SIZE, TILE_SIZE, (ctx) => {
      // Gesteinsrand
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 0, 32, 32);

      // Titan-Panzerkiste
      ctx.fillStyle = '#334155';
      ctx.fillRect(3, 4, 26, 24);

      // Goldener/Gelber Behälter-Kern
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(6, 7, 20, 18);

      // Warnstreifen (Hazard Stripes)
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.moveTo(7, 7); ctx.lineTo(12, 7); ctx.lineTo(7, 12); ctx.fill();
      ctx.moveTo(14, 7); ctx.lineTo(19, 7); ctx.lineTo(7, 19); ctx.lineTo(7, 14); ctx.fill();
      ctx.moveTo(21, 7); ctx.lineTo(26, 7); ctx.lineTo(7, 25); ctx.lineTo(7, 21); ctx.fill();
      ctx.moveTo(26, 12); ctx.lineTo(26, 17); ctx.lineTo(14, 25); ctx.lineTo(9, 25); ctx.fill();

      // Zentrales Schloss / Datenmodul (Cyan leuchtend)
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(13, 13, 6, 6);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(15, 15, 2, 2);

      // Rahmen-Kontur
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1.2;
      ctx.strokeRect(3.5, 4.5, 25, 23);
    });

    // 1A-3b. Fossil-Gestein (32x32) - Altes Sedimentgestein mit Knochen-/Fossilienabdrücken
    createTexture('tile_fossil', TILE_SIZE, TILE_SIZE, (ctx) => {
      // 1. Warmes Schiefer- / Kalksedimentbett (passend zu Schachtgestein)
      ctx.fillStyle = '#4a3f35';
      ctx.fillRect(0, 0, 32, 32);
      ctx.fillStyle = '#3a3027';
      ctx.fillRect(2, 3, 28, 12);
      ctx.fillRect(4, 17, 24, 12);

      // Kanten & Schieferung
      ctx.fillStyle = '#2b231b';
      ctx.fillRect(0, 31, 32, 1);
      ctx.fillRect(31, 0, 1, 32);

      // Sediment-Schichtrisse
      ctx.fillStyle = '#5c4e42';
      ctx.fillRect(4, 6, 24, 2);
      ctx.fillRect(5, 25, 22, 2);

      // 2. Eingebettetes Ammoniten-Fossil (Natürliches Elfenbein/Kalkstein statt grelles Neongelb)
      ctx.fillStyle = '#261e17'; // Fossile Einbettungs-Vertiefung
      ctx.beginPath();
      ctx.arc(16, 16, 9.5, 0, Math.PI * 2);
      ctx.fill();

      // Äußere Kalkschale
      ctx.fillStyle = '#d6cbba';
      ctx.beginPath();
      ctx.arc(16, 16, 8.5, 0, Math.PI * 2);
      ctx.fill();

      // Innere Schalenwindung
      ctx.fillStyle = '#b8aa96';
      ctx.beginPath();
      ctx.arc(16, 16, 5.5, 0, Math.PI * 2);
      ctx.fill();

      // Spiralfurche / Bernstein-Kern
      ctx.strokeStyle = '#6b4f2c';
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.arc(16, 16, 4, 0, Math.PI * 1.6);
      ctx.stroke();

      // Feine Kalkstein-Rippen (Ammoniten-Rippen)
      ctx.strokeStyle = '#f1ebe1';
      ctx.lineWidth = 1;
      for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 4) {
        ctx.beginPath();
        ctx.moveTo(16 + Math.cos(angle) * 4.5, 16 + Math.sin(angle) * 4.5);
        ctx.lineTo(16 + Math.cos(angle) * 8.5, 16 + Math.sin(angle) * 8.5);
        ctx.stroke();
      }
    });

    // 1A-4. Dynamit (32x32)
    createTexture('item_dynamite', 32, 32, (ctx) => {
      // Rote Dynamitstangen
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(8, 8, 16, 18);
      // Haltebänder & Warnstreifen
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(7, 12, 18, 3);
      ctx.fillRect(7, 20, 18, 3);
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(9, 13, 14, 1);
      ctx.fillRect(9, 21, 14, 1);
      // Zündschnur
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(16, 8);
      ctx.quadraticCurveTo(18, 3, 23, 4);
      ctx.stroke();
      // Funke
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(23, 4, 2.5, 0, Math.PI * 2);
      ctx.fill();
    });

    // 1A-5. Notfall-Treibstoffkanister (32x32)
    createTexture('item_fuel_canister', 32, 32, (ctx) => {
      ctx.fillStyle = '#15803d'; // Militär-Grün / Notfall
      ctx.fillRect(7, 9, 18, 19);
      // Griff oben
      ctx.fillRect(10, 4, 12, 5);
      ctx.fillStyle = '#070a10';
      ctx.fillRect(13, 6, 6, 3);
      // Füllstand / Kreuz
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(14, 13, 4, 11);
      ctx.fillRect(10, 16, 12, 4);
    });

    // 1A-6. Reparatur-Kit (32x32)
    createTexture('item_repair_kit', 32, 32, (ctx) => {
      ctx.fillStyle = '#0284c7'; // Techniker-Blau
      ctx.fillRect(6, 8, 20, 18);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(11, 4, 10, 4);
      // Weißes Sanitäts-Kreuz
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(14, 12, 4, 10);
      ctx.fillRect(11, 15, 10, 4);
    });

    // 1A-7. 6 Artefakte für das Bergmann-Buch (je 32x32)
    // 1. Ammonit (Spiral-Fossil)
    createTexture('artifact_ammonite', 32, 32, (ctx) => {
      ctx.fillStyle = '#d97706';
      ctx.beginPath();
      ctx.arc(16, 16, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(16, 16, 9, 0, Math.PI * 1.6);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(16, 16, 5, 0, Math.PI * 1.4);
      ctx.stroke();
    });

    // 2. Trilobit
    createTexture('artifact_trilobite', 32, 32, (ctx) => {
      ctx.fillStyle = '#0284c7';
      ctx.beginPath();
      ctx.ellipse(16, 16, 10, 13, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#082f49';
      ctx.lineWidth = 1.5;
      for (let y = 8; y <= 24; y += 4) {
        ctx.beginPath();
        ctx.moveTo(8, y);
        ctx.lineTo(24, y);
        ctx.stroke();
      }
    });

    // 3. Dino-Zahn
    createTexture('artifact_dino_tooth', 32, 32, (ctx) => {
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.moveTo(9, 7);
      ctx.quadraticCurveTo(11, 22, 23, 27);
      ctx.quadraticCurveTo(18, 17, 21, 7);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#94a3b8';
      ctx.stroke();
    });

    // 4. Kristall-Geode
    createTexture('artifact_geode', 32, 32, (ctx) => {
      ctx.fillStyle = '#475569';
      ctx.beginPath();
      ctx.arc(16, 16, 12, 0, Math.PI * 2);
      ctx.fill();
      // Kristalle innen
      ctx.fillStyle = '#a855f7';
      ctx.beginPath();
      ctx.arc(16, 16, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#e9d5ff';
      ctx.fillRect(15, 12, 2, 8);
      ctx.fillRect(12, 15, 8, 2);
    });

    // 5. Meteoriten-Fragment
    createTexture('artifact_meteorite', 32, 32, (ctx) => {
      ctx.fillStyle = '#1e1b4b';
      ctx.beginPath();
      ctx.moveTo(7, 12); ctx.lineTo(14, 5); ctx.lineTo(26, 9);
      ctx.lineTo(27, 23); ctx.lineTo(16, 27); ctx.lineTo(5, 20);
      ctx.closePath();
      ctx.fill();
      // Schmelzkrater
      ctx.fillStyle = '#4338ca';
      ctx.beginPath();
      ctx.arc(13, 14, 3, 0, Math.PI * 2);
      ctx.arc(20, 19, 2.5, 0, Math.PI * 2);
      ctx.fill();
    });

    // 6. Uralter Mech-Kern
    createTexture('artifact_mech_core', 32, 32, (ctx) => {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(6, 6, 20, 20);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(7, 7, 18, 18);
      ctx.fillStyle = '#06b6d4';
      ctx.beginPath();
      ctx.arc(16, 16, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(15, 15, 2, 2);
    });

    // =======================================================
    // 1B. SCHACHT-HINTERGRUNDWÄNDE (AUSGEHÖHLTES GESTEIN MIT STRUKTUR)
    // =======================================================

    // Schacht-Hintergrund Erde (32x32)
    createTexture('tile_shaft_dirt', TILE_SIZE, TILE_SIZE, (ctx) => {
      // Dunkle Schacht-Basis
      ctx.fillStyle = '#1c130c';
      ctx.fillRect(0, 0, 32, 32);

      // Horizontale Sediment-Schichten
      ctx.fillStyle = '#140c06';
      ctx.fillRect(0, 7, 32, 4);
      ctx.fillRect(0, 19, 32, 5);

      ctx.fillStyle = '#261a11';
      ctx.fillRect(0, 12, 32, 3);
      ctx.fillRect(0, 26, 32, 4);

      // Meißelspuren & Abbaufacetten (Bohr- & Spitzhacken-Rillen)
      ctx.fillStyle = '#332317';
      ctx.fillRect(4, 3, 8, 3);
      ctx.fillRect(18, 5, 9, 2);
      ctx.fillRect(8, 15, 11, 3);
      ctx.fillRect(22, 21, 7, 3);
      ctx.fillRect(3, 27, 10, 2);

      ctx.fillStyle = '#0f0804';
      ctx.fillRect(4, 6, 8, 1);
      ctx.fillRect(18, 7, 9, 1);
      ctx.fillRect(8, 18, 11, 1);

      // Gesteinsgranulat & Kiesel im Hintergrund
      ctx.fillStyle = '#422e20';
      ctx.fillRect(14, 9, 2, 2);
      ctx.fillRect(27, 14, 2, 2);
      ctx.fillRect(6, 22, 2, 2);
      ctx.fillRect(19, 28, 2, 2);

      // Weiche Tiefen-Schattierung an den Rändern
      ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
      ctx.fillRect(0, 0, 2, 32);
      ctx.fillRect(30, 0, 2, 32);
    });

    // Schacht-Hintergrund Stein (32x32)
    createTexture('tile_shaft_stone', TILE_SIZE, TILE_SIZE, (ctx) => {
      // Dunkler Schiefer-Hohlraum
      ctx.fillStyle = '#151c27';
      ctx.fillRect(0, 0, 32, 32);

      // Schiefer-Bruchkanten
      ctx.fillStyle = '#0f141d';
      ctx.fillRect(0, 8, 32, 5);
      ctx.fillRect(0, 22, 32, 4);

      ctx.fillStyle = '#1f2a3a';
      ctx.fillRect(0, 14, 32, 4);
      ctx.fillRect(0, 28, 32, 3);

      // Gesteinsrisse & Abbaufacetten
      ctx.fillStyle = '#2b394e';
      ctx.fillRect(3, 3, 10, 3);
      ctx.fillRect(17, 4, 11, 2);
      ctx.fillRect(6, 17, 12, 3);
      ctx.fillRect(21, 23, 8, 3);

      ctx.fillStyle = '#090d13';
      ctx.fillRect(3, 6, 10, 1);
      ctx.fillRect(6, 20, 12, 1);

      // Mineral-Partikel
      ctx.fillStyle = '#3d4f6b';
      ctx.fillRect(15, 10, 2, 2);
      ctx.fillRect(28, 16, 2, 2);
      ctx.fillRect(4, 24, 2, 2);

      // Weicher Rand-Schatten
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.fillRect(0, 0, 2, 32);
      ctx.fillRect(30, 0, 2, 32);
    });

    // Schacht-Hintergrund Granit (32x32)
    createTexture('tile_shaft_granite', TILE_SIZE, TILE_SIZE, (ctx) => {
      ctx.fillStyle = '#171220';
      ctx.fillRect(0, 0, 32, 32);

      ctx.fillStyle = '#0f0c15';
      ctx.fillRect(0, 9, 32, 5);
      ctx.fillRect(0, 23, 32, 4);

      ctx.fillStyle = '#221b2f';
      ctx.fillRect(0, 15, 32, 4);

      ctx.fillStyle = '#2f2640';
      ctx.fillRect(4, 4, 10, 3);
      ctx.fillRect(18, 16, 9, 3);

      ctx.fillStyle = '#44375c';
      ctx.fillRect(12, 10, 2, 2);
      ctx.fillRect(26, 25, 2, 2);

      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.fillRect(0, 0, 2, 32);
      ctx.fillRect(30, 0, 2, 32);
    });

    // Schacht-Hintergrund Obsidian (32x32)
    createTexture('tile_shaft_obsidian', TILE_SIZE, TILE_SIZE, (ctx) => {
      ctx.fillStyle = '#0d0f15';
      ctx.fillRect(0, 0, 32, 32);

      ctx.fillStyle = '#07080b';
      ctx.fillRect(0, 10, 32, 6);
      ctx.fillRect(0, 24, 32, 4);

      ctx.fillStyle = '#161924';
      ctx.fillRect(3, 4, 12, 3);
      ctx.fillRect(18, 17, 10, 3);

      ctx.fillStyle = '#3b0764';
      ctx.fillRect(14, 12, 2, 2);
      ctx.fillRect(25, 27, 2, 2);

      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.fillRect(0, 0, 2, 32);
      ctx.fillRect(30, 0, 2, 32);
    });

    // =======================================================
    // 2. ERZ-FACETTEN (1:1 FARBLICH ABGESTIMMT AUF DIE MENÜ-STONE-ICONS)
    // =======================================================
    const oreKeys = [
      'coal', 'copper', 'iron', 'tin', 'silver',
      'gold', 'emerald', 'sapphire', 'ruby', 'diamond',
      'titanium', 'platinum', 'uranium', 'obsidian_gem', 'dark_matter'
    ];

    oreKeys.forEach(key => {
      const color = ORE_FILL_COLORS[key] || '#334155';
      const highlight = ORE_COLORS[key] || '#94a3b8';

      createTexture(`ore_${key}`, TILE_SIZE, TILE_SIZE, (ctx) => {
        // Kristallflächen (Satte Grundfarbe der Menü-Stone-Icons)
        ctx.fillStyle = color;
        ctx.fillRect(5, 6, 8, 8);
        ctx.fillRect(17, 15, 9, 9);
        ctx.fillRect(8, 20, 7, 7);
        ctx.fillRect(19, 5, 7, 6);

        // Strahlende Lichtkante & Konturfacetten (Leuchtender Stone-Kontur-Akzent aus den Menüs)
        ctx.fillStyle = highlight;
        ctx.fillRect(6, 7, 4, 3);
        ctx.fillRect(18, 16, 5, 4);
        ctx.fillRect(9, 21, 3, 3);
        ctx.fillRect(20, 6, 3, 3);

        // Funkelnder Glanzpunkt
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = 0.55;
        ctx.fillRect(7, 8, 1, 1);
        ctx.fillRect(19, 17, 2, 1);
        ctx.fillRect(10, 22, 1, 1);
        ctx.fillRect(21, 7, 1, 1);
        ctx.globalAlpha = 1.0;
      });
    });

    // =======================================================
    // 3. RISS-STUFEN (1 bis 4)
    // =======================================================
    for (let stage = 1; stage <= 4; stage++) {
      createTexture(`crack_${stage}`, TILE_SIZE, TILE_SIZE, (ctx) => {
        const drawPaths = () => {
          ctx.beginPath();
          ctx.moveTo(16, 16);
          ctx.lineTo(8, 6);
          ctx.lineTo(4, 12);
          if (stage >= 2) {
            ctx.moveTo(16, 16);
            ctx.lineTo(24, 8);
            ctx.lineTo(28, 16);
          }
          if (stage >= 3) {
            ctx.moveTo(16, 16);
            ctx.lineTo(12, 26);
            ctx.lineTo(6, 28);
            ctx.moveTo(16, 16);
            ctx.lineTo(22, 24);
          }
          if (stage >= 4) {
            ctx.moveTo(22, 24);
            ctx.lineTo(28, 28);
            ctx.moveTo(8, 6);
            ctx.lineTo(2, 2);
            ctx.moveTo(24, 8);
            ctx.lineTo(30, 2);
          }
          ctx.stroke();
        };

        // Reiner tiefer Risskern ohne weiße Ränder
        ctx.strokeStyle = '#05070d';
        ctx.lineWidth = 1.6;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        drawPaths();
      });
    }

    // =======================================================
    // 4. BOHRFAHRZEUG (HORIZONTAL AUF DEM BODEN FAHRENDE KETTEN MIT SCHWENKBAREM BOHRARM)
    // =======================================================
    // Das Kettenfahrwerk liegt HORIZONTAL auf dem Boden (y=22..31) mit 5 rollenden Laufrollen.
    // Die Panzerkabine sitzt auf dem Fahrwerk. Der Bohrkopf schwenkt physikalisch logisch:
    // - RECHTS: Schwenkarm fährt horizontal nach rechts aus (x=36..48, y=15.5), Ketten fahren am Boden.
    // - LINKS: Schwenkarm fährt horizontal nach links aus (x=12..0, y=15.5), Ketten fahren am Boden.
    // - UNTEN: Bohrkopf senkt sich mittig ab, Spitze schließt exakt bündig bei y=31 ab (kein Schweben!).
    // - OBEN: Bohrkopf richtet sich nach oben auf, bohrt in die Decke bei y=0.
    // Einheitliche Canvas-Größe: 48x32 Pixel.

    const drawCrawlerChassis = (ctx, facing = 'right', trackFrame = 0) => {
      // 1. HORIZONTALES KETTENFAHRWERK (x=6.5..41.5, y=20.5..31 - solide, wuchtige Proportionen)
      const leftCenterX = 11.5;
      const rightCenterX = 36.5;
      const wheelCenterY = 26.5;

      // A) Dunkles Kettenbett / Fahrwerkskasten hinter den Rollen
      ctx.fillStyle = '#090d16';
      ctx.beginPath();
      ctx.arc(rightCenterX, wheelCenterY, 3.1, -Math.PI * 0.5, Math.PI * 0.5);
      ctx.lineTo(leftCenterX, wheelCenterY + 3.1);
      ctx.arc(leftCenterX, wheelCenterY, 3.1, Math.PI * 0.5, Math.PI * 1.5);
      ctx.lineTo(rightCenterX, wheelCenterY - 3.1);
      ctx.closePath();
      ctx.fill();

      // B) 5 solide Stahllaufrollen im Inneren der Kette (statisch)
      const roadWheelsX = [11.5, 17.75, 24, 30.25, 36.5];
      roadWheelsX.forEach(wx => {
        // Äußerer Stahlfelgenring
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.arc(wx, wheelCenterY, 2.9, 0, Math.PI * 2);
        ctx.fill();

        // Radscheibe
        ctx.fillStyle = '#334155';
        ctx.beginPath();
        ctx.arc(wx, wheelCenterY, 1.9, 0, Math.PI * 2);
        ctx.fill();

        // Achsnabe / Chrom-Zentralbolzen
        ctx.fillStyle = '#94a3b8';
        ctx.beginPath();
        ctx.arc(wx, wheelCenterY, 0.9, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(Math.round(wx) - 0.5, 26, 1, 1);
      });

      // C) Vollständig umlaufendes Kettenband (gleichmäßig schlank 1.5px)
      const trackMidR = 3.6;

      // 1. Dunkler Kettenkörper
      ctx.strokeStyle = '#090d16';
      ctx.lineWidth = 1.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.arc(rightCenterX, wheelCenterY, trackMidR, -Math.PI * 0.5, Math.PI * 0.5);
      ctx.lineTo(leftCenterX, wheelCenterY + trackMidR);
      ctx.arc(leftCenterX, wheelCenterY, trackMidR, Math.PI * 0.5, Math.PI * 1.5);
      ctx.lineTo(rightCenterX, wheelCenterY - trackMidR);
      ctx.closePath();
      ctx.stroke();

      // 2. Gehärteter Kettengliederstahl (feiner 0.9px Kern)
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      ctx.arc(rightCenterX, wheelCenterY, trackMidR, -Math.PI * 0.5, Math.PI * 0.5);
      ctx.lineTo(leftCenterX, wheelCenterY + trackMidR);
      ctx.arc(leftCenterX, wheelCenterY, trackMidR, Math.PI * 0.5, Math.PI * 1.5);
      ctx.lineTo(rightCenterX, wheelCenterY - trackMidR);
      ctx.closePath();
      ctx.stroke();

      // D) Boden-Stege (bewegt sich wenn trackFrame sich ändert)
      ctx.fillStyle = '#475569';
      const dirMult = facing === 'left' ? -1 : 1;
      const stepOffset = ((trackFrame % 4) * 0.75 * dirMult + 3) % 3;
      for (let tx = 11 + stepOffset; tx <= 37; tx += 3) {
        ctx.fillRect(tx, 30.2, 1.8, 0.8);
      }

      // E) Gepanzerte Kettenschürze / Kotflügel (schließt exakt bündig mit der Kette ab, kein Überstand oben!)
      const trackOuterLeft = leftCenterX - trackMidR - 0.75; // 7.15
      const trackOuterRight = rightCenterX + trackMidR + 0.75; // 40.85
      const fenderWidth = trackOuterRight - trackOuterLeft; // 33.7

      ctx.fillStyle = '#1e2430';
      ctx.fillRect(trackOuterLeft, 20.5, fenderWidth, 2.0);
      ctx.fillStyle = '#475569';
            // 2. GEPANZERTE INDUSTRIE-KAROSSERIE (OBEN AN BEIDEN KANTEN LEICHT ABGESCHRÄGT, y=7..20.5)
      const drawBeveledBody = (inset = 0) => {
        ctx.beginPath();
        ctx.moveTo(10 + inset, 20.5);
        ctx.lineTo(10 + inset, 9.5 + inset * 0.5);
        ctx.lineTo(12.5 + inset * 0.5, 7 + inset);
        ctx.lineTo(35.5 - inset * 0.5, 7 + inset);
        ctx.lineTo(38 - inset, 9.5 + inset * 0.5);
        ctx.lineTo(38 - inset, 20.5);
        ctx.closePath();
      };

      ctx.fillStyle = '#d97706'; // Karosserie-Hauptton
      drawBeveledBody(0);
      ctx.fill();

      ctx.fillStyle = '#f59e0b'; // Helle Frontpanzerung
      drawBeveledBody(0.8);
      ctx.fill();

      // Horizontale Dachkante
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(13, 7, 22, 1.0);

      // Unterer Karosserie-Schatten
      ctx.fillStyle = '#92400e';
      ctx.fillRect(10, 18.5, 28, 2.0);

      // 3. EINZELNES COCKPIT-FRONTFENSTER (NUR AUF EINER SEITE - IMMER IN FAHRTRICHTUNG!)
      if (facing === 'left') {
        // --- FAHRTRICHTUNG LINKS ---
        // A) Frontfenster vorn links (schließt exakt bündig an der Außenkante x=10 ab, ohne gelbe Pixel!)
        ctx.fillStyle = '#0f172a'; // Rahmen
        ctx.beginPath();
        ctx.moveTo(10.0, 15.2);
        ctx.lineTo(10.0, 9.5);
        ctx.lineTo(12.5, 7.5);
        ctx.lineTo(24.5, 7.5);
        ctx.lineTo(24.5, 15.2);
        ctx.closePath();
        ctx.fill();

        // Getöntes Panzerglas
        ctx.fillStyle = '#0369a1';
        ctx.beginPath();
        ctx.moveTo(10.8, 14.5);
        ctx.lineTo(10.8, 10.0);
        ctx.lineTo(12.8, 8.3);
        ctx.lineTo(23.7, 8.3);
        ctx.lineTo(23.7, 14.5);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#0284c7';
        ctx.beginPath();
        ctx.moveTo(11.2, 14.0);
        ctx.lineTo(11.2, 10.3);
        ctx.lineTo(13.0, 8.8);
        ctx.lineTo(23.2, 8.8);
        ctx.lineTo(23.2, 14.0);
        ctx.closePath();
        ctx.fill();

        // Bordinstrumente & Lichtreflexion vorn-links
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(15.5, 11.5, 3.5, 2.0);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(11.8, 10.2, 2.2, 1.2);
        ctx.fillRect(14.5, 9.0, 2.0, 0.8);

        // B) Heckbereich / Motorraum hinten rechts (x = 24.5..38)
        ctx.fillStyle = '#78350f';
        ctx.fillRect(24.5, 7.5, 0.8, 11.0); // Trennfuge zur Kabine

        // Kühlergitter / Motorschlitze
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(26.5, 9.0, 9.5, 5.5);
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(27.0, 9.5, 8.5, 4.5);
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(27.5, 10.5, 7.5, 0.7);
        ctx.fillRect(27.5, 12.0, 7.5, 0.7);
        ctx.fillRect(27.5, 13.0, 7.5, 0.7);

        // Nieten am Heck
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(36.5, 17, 1, 1);
        ctx.fillRect(26.0, 17, 1, 1);

        // Rotes Heck-Positionslicht rechts
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(35.5, 15.0, 2.5, 2.5);
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(35.8, 15.5, 1.8, 1.5);
        ctx.fillStyle = '#f87171';
        ctx.fillRect(36.0, 15.7, 0.8, 0.8);

        // Xenon-Frontscheinwerfer vorn links
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(11.0, 15.0, 3.5, 2.5);
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(11.5, 15.5, 2.5, 1.5);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(12.0, 16.0, 1.0, 0.8);
      } else {
        // --- FAHRTRICHTUNG RECHTS (Standard) ---
        // A) Frontfenster vorn rechts (schließt exakt an der Außenkante x=38 ab, ohne gelbe Pixel!)
        ctx.fillStyle = '#0f172a'; // Rahmen
        ctx.beginPath();
        ctx.moveTo(23.5, 15.2);
        ctx.lineTo(23.5, 7.5);
        ctx.lineTo(35.5, 7.5);
        ctx.lineTo(38.0, 9.5);
        ctx.lineTo(38.0, 15.2);
        ctx.closePath();
        ctx.fill();

        // Getöntes Panzerglas rechts
        ctx.fillStyle = '#0369a1';
        ctx.beginPath();
        ctx.moveTo(24.3, 14.5);
        ctx.lineTo(24.3, 8.3);
        ctx.lineTo(35.2, 8.3);
        ctx.lineTo(37.2, 10.0);
        ctx.lineTo(37.2, 14.5);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#0284c7';
        ctx.beginPath();
        ctx.moveTo(24.8, 14.0);
        ctx.lineTo(24.8, 8.8);
        ctx.lineTo(35.0, 8.8);
        ctx.lineTo(36.8, 10.3);
        ctx.lineTo(36.8, 14.0);
        ctx.closePath();
        ctx.fill();

        // Bordinstrumente & Lichtreflexion vorn-rechts
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(29.0, 11.5, 3.5, 2.0);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(34.0, 10.2, 2.2, 1.2);
        ctx.fillRect(31.5, 9.0, 2.0, 0.8);

        // B) Heckbereich / Motorraum hinten links (x = 10..23.5)
        ctx.fillStyle = '#78350f';
        ctx.fillRect(23.5, 7.5, 0.8, 11.0); // Trennfuge zur Kabine

        // Kühlergitter / Motorschlitze
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(12.0, 9.0, 9.5, 5.5);
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(12.5, 9.5, 8.5, 4.5);
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(13.0, 10.5, 7.5, 0.7);
        ctx.fillRect(13.0, 12.0, 7.5, 0.7);
        ctx.fillRect(13.0, 13.0, 7.5, 0.7);

        // Nieten am Heck
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(11.5, 17, 1, 1);
        ctx.fillRect(22.0, 17, 1, 1);

        // Rotes Heck-Positionslicht links
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(10.0, 15.0, 2.5, 2.5);
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(10.2, 15.5, 1.8, 1.5);
        ctx.fillStyle = '#f87171';
        ctx.fillRect(10.5, 15.7, 0.8, 0.8);

        // Xenon-Frontscheinwerfer vorn rechts
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(33.5, 15.0, 3.5, 2.5);
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(34.0, 15.5, 2.5, 1.5);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(34.5, 16.0, 1.0, 0.8);
      }

      // 4. Stoßstange mit Industrie-Warnstreifen
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(11, 18.5, 26, 2.5);
      for (let hx = 12; hx < 36; hx += 3.5) {
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(hx, 18.5, 1.8, 2.5);
      }

      // 5. Zentraler Industrie-Drehkranz für den Bohrausleger
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(24, 15.5, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.arc(24, 15.5, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#64748b';
      ctx.fillRect(23, 14.5, 2, 2);
    };

    // =======================================================
    // BOHRKOPF-STUFEN VISUALISIERUNG (10 TIERS MIT EIGENER FARBE, FORM & GRÖSSE)
    // Tier 1: Reiner Meißel vorne
    // Tier 2..10: Wachsende Bohrkegel, Spezialwerkstoffe, Diamanten, Plasma, Laser etc.
    // =======================================================
    const TIER_DRILL_CONFIGS = {
      1: {
        type: 'chisel',
        name: 'Stahl-Meißel'
      },
      2: {
        type: 'cone',
        name: 'Wolframkarbid-Spitze',
        bodyColor: '#334155',
        highlightColor: '#64748b',
        fluteColor: '#0f172a',
        spiralColor: '#f59e0b',
        edgeColor: '#fbbf24',
        tipColor: '#f59e0b',
        coneLength: 9.5,
        coneHalfH: 4.2,
        numFlutes: 2
      },
      3: {
        type: 'cone',
        name: 'Gehärteter Meißel Mk.III',
        bodyColor: '#78350f',
        highlightColor: '#b45309',
        fluteColor: '#451a03',
        spiralColor: '#fde68a',
        edgeColor: '#f59e0b',
        tipColor: '#fef08a',
        coneLength: 10.5,
        coneHalfH: 4.8,
        numFlutes: 3
      },
      4: {
        type: 'cone',
        name: 'Titan-Diamant-Kopf Mk.IV',
        bodyColor: '#0369a1',
        highlightColor: '#38bdf8',
        fluteColor: '#0c4a6e',
        spiralColor: '#e0f2fe',
        edgeColor: '#7dd3fc',
        tipColor: '#ffffff',
        coneLength: 11.5,
        coneHalfH: 5.2,
        numFlutes: 3,
        isDiamond: true
      },
      5: {
        type: 'cone',
        name: 'Hochdruck-Fräse Mk.V',
        bodyColor: '#b45309',
        highlightColor: '#f59e0b',
        fluteColor: '#1e293b',
        spiralColor: '#fef08a',
        edgeColor: '#fbbf24',
        tipColor: '#ffffff',
        coneLength: 11.5,
        coneHalfH: 5.6,
        numFlutes: 4
      },
      6: {
        type: 'cone',
        name: 'Plasma-Schneidbrenner Mk.VI',
        bodyColor: '#9a3412',
        highlightColor: '#ea580c',
        fluteColor: '#7c2d12',
        spiralColor: '#fde047',
        edgeColor: '#f97316',
        tipColor: '#fef08a',
        coneLength: 11.5,
        coneHalfH: 5.2,
        numFlutes: 3,
        isPlasma: true
      },
      7: {
        type: 'cone',
        name: 'Laser-Kavitationsmeißel Mk.VII',
        bodyColor: '#881337',
        highlightColor: '#e11d48',
        fluteColor: '#4c0519',
        spiralColor: '#fecdd3',
        edgeColor: '#fb7185',
        tipColor: '#ffffff',
        coneLength: 11.5,
        coneHalfH: 5.0,
        numFlutes: 2,
        isLaser: true
      },
      8: {
        type: 'cone',
        name: 'Antimaterie-Bohrer Mk.VIII',
        bodyColor: '#4c1d95',
        highlightColor: '#7c3aed',
        fluteColor: '#2e1065',
        spiralColor: '#e9d5ff',
        edgeColor: '#a855f7',
        tipColor: '#ffffff',
        coneLength: 11.8,
        coneHalfH: 5.6,
        numFlutes: 3,
        isAntimatter: true
      },
      9: {
        type: 'cone',
        name: 'Singularitäts-Fräse Mk.IX',
        bodyColor: '#090d16',
        highlightColor: '#0891b2',
        fluteColor: '#020617',
        spiralColor: '#67e8f9',
        edgeColor: '#22d3ee',
        tipColor: '#cffafe',
        coneLength: 12.0,
        coneHalfH: 5.8,
        numFlutes: 3,
        isSingularity: true
      },
      10: {
        type: 'cone',
        name: 'Tachyonen-Disruptor X',
        bodyColor: '#064e3b',
        highlightColor: '#059669',
        fluteColor: '#022c22',
        spiralColor: '#a7f3d0',
        edgeColor: '#34d399',
        tipColor: '#fde047',
        coneLength: 12.0,
        coneHalfH: 6.0,
        numFlutes: 4,
        isTachyon: true
      }
    };

    // A) BOHRER NACH RECHTS
    const drawPlayerRight = (ctx, drillF = 0, tier = 1, trackF = 0) => {
      drawCrawlerChassis(ctx, 'right', trackF);
      const f = drillF;

      // Auslegerarm von Drehachse nach rechts
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(25, 12.5, 11, 6);
      ctx.fillStyle = '#334155';
      ctx.fillRect(26, 13.5, 9, 4);
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(27, 14.5, 7, 1.5);

      if (tier === 1) {
        // TIER 1: Reiner Meißel vorne
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(35, 12, 2.5, 7);
        ctx.fillStyle = '#475569';
        ctx.fillRect(35.5, 13, 1.5, 5);

        const hammer = f > 0 ? (f % 2 === 0 ? 1.5 : -0.5) : 0;
        const chiselTipX = 44 + hammer;

        // Schlanker Meißel-Schaft
        ctx.fillStyle = '#475569';
        ctx.beginPath();
        ctx.moveTo(37, 13.8);
        ctx.lineTo(chiselTipX - 1.5, 14.5);
        ctx.lineTo(chiselTipX, 15.5);
        ctx.lineTo(chiselTipX - 1.5, 16.5);
        ctx.lineTo(37, 17.2);
        ctx.closePath();
        ctx.fill();

        // Obere Glanzfase
        ctx.fillStyle = '#94a3b8';
        ctx.beginPath();
        ctx.moveTo(37, 13.8);
        ctx.lineTo(chiselTipX - 1.5, 14.5);
        ctx.lineTo(chiselTipX, 15.5);
        ctx.lineTo(37, 15.5);
        ctx.closePath();
        ctx.fill();

        // Schliffkante
        ctx.strokeStyle = '#f8fafc';
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        ctx.moveTo(chiselTipX - 2.5, 14.6);
        ctx.lineTo(chiselTipX, 15.5);
        ctx.stroke();

        // Meißelspitze
        ctx.fillStyle = '#f8fafc';
        ctx.beginPath();
        ctx.moveTo(chiselTipX - 1.5, 14.9);
        ctx.lineTo(chiselTipX + 0.8, 15.5);
        ctx.lineTo(chiselTipX - 1.5, 16.1);
        ctx.closePath();
        ctx.fill();
        return;
      }

      // TIERS 2-10: Rotierender Bohrkegel
      const cfg = TIER_DRILL_CONFIGS[tier] || TIER_DRILL_CONFIGS[2];
      const halfH = cfg.coneHalfH;
      const coneTipX = Math.min(48, 37 + cfg.coneLength);

      // Flansch / Manschette vor dem Bohrkegel
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(35, 15.5 - halfH - 0.5, 2.5, halfH * 2 + 1);
      ctx.fillStyle = cfg.highlightColor;
      ctx.fillRect(35.5, 15.5 - halfH + 0.5, 1.5, halfH * 2 - 1);

      // Bohrkegel
      ctx.fillStyle = cfg.bodyColor;
      ctx.beginPath();
      ctx.moveTo(37, 15.5 - halfH);
      ctx.lineTo(coneTipX, 15.5);
      ctx.lineTo(37, 15.5 + halfH);
      ctx.closePath();
      ctx.fill();

      // Oberer Glanzkegel
      ctx.fillStyle = cfg.highlightColor;
      ctx.beginPath();
      ctx.moveTo(37, 15.5 - halfH);
      ctx.lineTo(coneTipX, 15.5);
      ctx.lineTo(37, 15.5);
      ctx.closePath();
      ctx.fill();

      // Schneidkante
      ctx.strokeStyle = cfg.edgeColor || '#f8fafc';
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.moveTo(37, 15.5 - halfH);
      ctx.lineTo(coneTipX, 15.5);
      ctx.stroke();

      // Spiral-Wendeln
      const numFlutes = cfg.numFlutes || 3;
      const len = coneTipX - 37;
      for (let i = 0; i < numFlutes; i++) {
        const u = ((f / 6) + i / numFlutes) % 1.0;
        const x = 37 + u * (len - 2);
        const fluteH = halfH * (1 - (x - 37) / len);
        const curvePhase = Math.sin((u * Math.PI * 2) + Math.PI / 4);

        ctx.strokeStyle = cfg.fluteColor;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(x - 1.2, 15.5 - fluteH);
        ctx.quadraticCurveTo(x + curvePhase * 1.5, 15.5, x + 1.2, 15.5 + fluteH);
        ctx.stroke();

        ctx.strokeStyle = cfg.spiralColor;
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.moveTo(x - 0.4, 15.5 - fluteH);
        ctx.quadraticCurveTo(x + curvePhase * 1.5 + 0.8, 15.5, x + 2.0, 15.5 + fluteH);
        ctx.stroke();
      }

      // Spezialeffekt: Diamant-Facetten
      if (cfg.isDiamond) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.beginPath();
        ctx.moveTo(41, 14);
        ctx.lineTo(43, 15.5);
        ctx.lineTo(41, 17);
        ctx.lineTo(39, 15.5);
        ctx.closePath();
        ctx.fill();
      }

      // Spezialeffekt: Laser-Spitze
      if (cfg.isLaser) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(coneTipX - 2, 15.5);
        ctx.lineTo(48, 15.5);
        ctx.stroke();
      }

      // Spezialeffekt: Tachyon-Doppelzinken
      if (cfg.isTachyon) {
        ctx.strokeStyle = '#fde047';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(coneTipX - 3, 14);
        ctx.lineTo(48, 13.5);
        ctx.moveTo(coneTipX - 3, 17);
        ctx.lineTo(48, 17.5);
        ctx.stroke();
      }

      // Meißelspitze mit Vibration
      const tipAngle = (f / 6) * Math.PI * 2;
      const tipOffset = Math.sin(tipAngle) * 1.5;
      ctx.fillStyle = cfg.tipColor;
      ctx.beginPath();
      ctx.moveTo(coneTipX - 2, 15.5 - tipOffset);
      ctx.lineTo(coneTipX, 15.5);
      ctx.lineTo(coneTipX - 2, 15.5 + tipOffset);
      ctx.closePath();
      ctx.fill();
    };

    // B) BOHRER NACH LINKS
    const drawPlayerLeft = (ctx, drillF = 0, tier = 1, trackF = 0) => {
      drawCrawlerChassis(ctx, 'left', trackF);
      const f = drillF;

      // Auslegerarm von Drehachse nach links
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(12, 12.5, 11, 6);
      ctx.fillStyle = '#334155';
      ctx.fillRect(13, 13.5, 9, 4);
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(14, 14.5, 7, 1.5);

      if (tier === 1) {
        // TIER 1: Reiner Meißel nach links
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(10.5, 12, 2.5, 7);
        ctx.fillStyle = '#475569';
        ctx.fillRect(11, 13, 1.5, 5);

        const hammer = f > 0 ? (f % 2 === 0 ? 1.5 : -0.5) : 0;
        const chiselTipX = 4 - hammer;

        // Schlanker Meißel-Schaft
        ctx.fillStyle = '#475569';
        ctx.beginPath();
        ctx.moveTo(11, 13.8);
        ctx.lineTo(chiselTipX + 1.5, 14.5);
        ctx.lineTo(chiselTipX, 15.5);
        ctx.lineTo(chiselTipX + 1.5, 16.5);
        ctx.lineTo(11, 17.2);
        ctx.closePath();
        ctx.fill();

        // Obere Glanzfase
        ctx.fillStyle = '#94a3b8';
        ctx.beginPath();
        ctx.moveTo(11, 13.8);
        ctx.lineTo(chiselTipX + 1.5, 14.5);
        ctx.lineTo(chiselTipX, 15.5);
        ctx.lineTo(11, 15.5);
        ctx.closePath();
        ctx.fill();

        // Schliffkante
        ctx.strokeStyle = '#f8fafc';
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        ctx.moveTo(chiselTipX + 2.5, 14.6);
        ctx.lineTo(chiselTipX, 15.5);
        ctx.stroke();

        // Meißelspitze
        ctx.fillStyle = '#f8fafc';
        ctx.beginPath();
        ctx.moveTo(chiselTipX + 1.5, 14.9);
        ctx.lineTo(chiselTipX - 0.8, 15.5);
        ctx.lineTo(chiselTipX + 1.5, 16.1);
        ctx.closePath();
        ctx.fill();
        return;
      }

      // TIERS 2-10: Rotierender Bohrkegel nach links
      const cfg = TIER_DRILL_CONFIGS[tier] || TIER_DRILL_CONFIGS[2];
      const halfH = cfg.coneHalfH;
      const coneTipX = Math.max(0, 11 - cfg.coneLength);

      // Flansch / Manschette vor dem Bohrkegel
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(10.5, 15.5 - halfH - 0.5, 2.5, halfH * 2 + 1);
      ctx.fillStyle = cfg.highlightColor;
      ctx.fillRect(11, 15.5 - halfH + 0.5, 1.5, halfH * 2 - 1);

      // Bohrkegel nach links
      ctx.fillStyle = cfg.bodyColor;
      ctx.beginPath();
      ctx.moveTo(11, 15.5 - halfH);
      ctx.lineTo(coneTipX, 15.5);
      ctx.lineTo(11, 15.5 + halfH);
      ctx.closePath();
      ctx.fill();

      // Oberer Glanzkegel
      ctx.fillStyle = cfg.highlightColor;
      ctx.beginPath();
      ctx.moveTo(11, 15.5 - halfH);
      ctx.lineTo(coneTipX, 15.5);
      ctx.lineTo(11, 15.5);
      ctx.closePath();
      ctx.fill();

      // Schneidkante
      ctx.strokeStyle = cfg.edgeColor || '#f8fafc';
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.moveTo(11, 15.5 - halfH);
      ctx.lineTo(coneTipX, 15.5);
      ctx.stroke();

      // Spiral-Wendeln nach links
      const numFlutes = cfg.numFlutes || 3;
      const len = 11 - coneTipX;
      for (let i = 0; i < numFlutes; i++) {
        const u = ((f / 6) + i / numFlutes) % 1.0;
        const x = 11 - u * (len - 2);
        const fluteH = halfH * (1 - (11 - x) / len);
        const curvePhase = Math.sin((u * Math.PI * 2) + Math.PI / 4);

        ctx.strokeStyle = cfg.fluteColor;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(x + 1.2, 15.5 - fluteH);
        ctx.quadraticCurveTo(x - curvePhase * 1.5, 15.5, x - 1.2, 15.5 + fluteH);
        ctx.stroke();

        ctx.strokeStyle = cfg.spiralColor;
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.moveTo(x + 0.4, 15.5 - fluteH);
        ctx.quadraticCurveTo(x - curvePhase * 1.5 - 0.8, 15.5, x - 2.0, 15.5 + fluteH);
        ctx.stroke();
      }

      // Spezialeffekt: Diamant-Facetten
      if (cfg.isDiamond) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.beginPath();
        ctx.moveTo(7, 14);
        ctx.lineTo(5, 15.5);
        ctx.lineTo(7, 17);
        ctx.lineTo(9, 15.5);
        ctx.closePath();
        ctx.fill();
      }

      // Spezialeffekt: Laser-Spitze
      if (cfg.isLaser) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(coneTipX + 2, 15.5);
        ctx.lineTo(0, 15.5);
        ctx.stroke();
      }

      // Spezialeffekt: Tachyon-Doppelzinken
      if (cfg.isTachyon) {
        ctx.strokeStyle = '#fde047';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(coneTipX + 3, 14);
        ctx.lineTo(0, 13.5);
        ctx.moveTo(coneTipX + 3, 17);
        ctx.lineTo(0, 17.5);
        ctx.stroke();
      }

      // Meißelspitze mit Vibration
      const tipAngle = (f / 6) * Math.PI * 2;
      const tipOffset = Math.sin(tipAngle) * 1.5;
      ctx.fillStyle = cfg.tipColor;
      ctx.beginPath();
      ctx.moveTo(coneTipX + 2, 15.5 - tipOffset);
      ctx.lineTo(coneTipX, 15.5);
      ctx.lineTo(coneTipX + 2, 15.5 + tipOffset);
      ctx.closePath();
      ctx.fill();
    };

    // C) BOHRER NACH UNTEN
    const drawPlayerDown = (ctx, drillF = 0, tier = 1, facing = 'right', trackF = 0) => {
      drawCrawlerChassis(ctx, facing, trackF);
      const f = drillF;

      // Vertikaler Führungssockel & Hydraulikzylinder
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(19, 18, 10, 4);
      ctx.fillStyle = '#334155';
      ctx.fillRect(20, 19, 8, 3);
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(21, 20.5, 6, 1.5);

      if (tier === 1) {
        // TIER 1: Reiner Meißel nach unten
        const hammer = f > 0 ? (f % 2 === 0 ? 1.5 : -0.5) : 0;
        const chiselTipY = 28 + hammer;

        ctx.fillStyle = '#475569';
        ctx.beginPath();
        ctx.moveTo(22.5, 22);
        ctx.lineTo(23.5, chiselTipY - 1.5);
        ctx.lineTo(24, chiselTipY);
        ctx.lineTo(24.5, chiselTipY - 1.5);
        ctx.lineTo(25.5, 22);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#94a3b8';
        ctx.beginPath();
        ctx.moveTo(22.5, 22);
        ctx.lineTo(23.5, chiselTipY - 1.5);
        ctx.lineTo(24, chiselTipY);
        ctx.lineTo(24, 22);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#f8fafc';
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        ctx.moveTo(23.5, chiselTipY - 2.0);
        ctx.lineTo(24, chiselTipY);
        ctx.stroke();

        ctx.fillStyle = '#f8fafc';
        ctx.beginPath();
        ctx.moveTo(23.5, chiselTipY - 1.2);
        ctx.lineTo(24, chiselTipY + 0.8);
        ctx.lineTo(24.5, chiselTipY - 1.2);
        ctx.closePath();
        ctx.fill();
        return;
      }

      // TIERS 2-10: Rotierender Bohrkegel nach unten
      const cfg = TIER_DRILL_CONFIGS[tier] || TIER_DRILL_CONFIGS[2];
      const halfW = cfg.coneHalfH;
      const coneTipY = Math.min(31, 22 + Math.round(cfg.coneLength * 0.78));

      ctx.fillStyle = cfg.bodyColor;
      ctx.beginPath();
      ctx.moveTo(24 - halfW, 22);
      ctx.lineTo(24 + halfW, 22);
      ctx.lineTo(24, coneTipY);
      ctx.closePath();
      ctx.fill();

      // Linke Glanzhälfte
      ctx.fillStyle = cfg.highlightColor;
      ctx.beginPath();
      ctx.moveTo(24 - halfW, 22);
      ctx.lineTo(24, 22);
      ctx.lineTo(24, coneTipY);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = cfg.edgeColor || '#f8fafc';
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.moveTo(24 - halfW, 22);
      ctx.lineTo(24, coneTipY);
      ctx.stroke();

      // Spiral-Wendeln nach unten
      const numFlutes = cfg.numFlutes || 3;
      const len = coneTipY - 22;
      for (let i = 0; i < numFlutes; i++) {
        const u = ((f / 6) + i / numFlutes) % 1.0;
        const y = 22 + u * (len - 2);
        const fluteW = halfW * (1 - (y - 22) / len);
        const curvePhase = Math.sin((u * Math.PI * 2) + Math.PI / 4);

        ctx.strokeStyle = cfg.fluteColor;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(24 - fluteW, y - 1.0);
        ctx.quadraticCurveTo(24, y + curvePhase * 1.5, 24 + fluteW, y + 1.0);
        ctx.stroke();

        ctx.strokeStyle = cfg.spiralColor;
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.moveTo(24 - fluteW, y - 0.3);
        ctx.quadraticCurveTo(24, y + curvePhase * 1.5 + 0.8, 24 + fluteW, y + 1.6);
        ctx.stroke();
      }

      // Meißelspitze unten
      const tipAngle = (f / 6) * Math.PI * 2;
      const tipOffset = Math.sin(tipAngle) * 1.5;
      ctx.fillStyle = cfg.tipColor;
      ctx.beginPath();
      ctx.moveTo(24 - tipOffset, coneTipY - 1.5);
      ctx.lineTo(24, coneTipY);
      ctx.lineTo(24 + tipOffset, coneTipY - 1.5);
      ctx.closePath();
      ctx.fill();
    };

    // D) BOHRER NACH OBEN
    const drawPlayerUp = (ctx, drillF = 0, tier = 1, facing = 'right', trackF = 0) => {
      drawCrawlerChassis(ctx, facing, trackF);
      const f = drillF;

      // Dach-Führungssockel & Hubzylinder
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(19, 7, 10, 3);
      ctx.fillStyle = '#334155';
      ctx.fillRect(20, 6.5, 8, 2);
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(21, 6, 6, 1);

      if (tier === 1) {
        // TIER 1: Reiner Meißel nach oben
        const hammer = f > 0 ? (f % 2 === 0 ? 1.5 : -0.5) : 0;
        const chiselTipY = 3 - hammer;

        ctx.fillStyle = '#475569';
        ctx.beginPath();
        ctx.moveTo(22.5, 7);
        ctx.lineTo(23.5, chiselTipY + 1.5);
        ctx.lineTo(24, chiselTipY);
        ctx.lineTo(24.5, chiselTipY + 1.5);
        ctx.lineTo(25.5, 7);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#94a3b8';
        ctx.beginPath();
        ctx.moveTo(22.5, 7);
        ctx.lineTo(23.5, chiselTipY + 1.5);
        ctx.lineTo(24, chiselTipY);
        ctx.lineTo(24, 7);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#f8fafc';
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        ctx.moveTo(23.5, chiselTipY + 2.0);
        ctx.lineTo(24, chiselTipY);
        ctx.stroke();

        ctx.fillStyle = '#f8fafc';
        ctx.beginPath();
        ctx.moveTo(23.5, chiselTipY + 1.2);
        ctx.lineTo(24, chiselTipY - 0.8);
        ctx.lineTo(24.5, chiselTipY + 1.2);
        ctx.closePath();
        ctx.fill();
        return;
      }

      // TIERS 2-10: Rotierender Bohrkegel nach oben
      const cfg = TIER_DRILL_CONFIGS[tier] || TIER_DRILL_CONFIGS[2];
      const halfW = cfg.coneHalfH;
      const coneTipY = Math.max(0, 8 - Math.round(cfg.coneLength * 0.70));

      ctx.fillStyle = cfg.bodyColor;
      ctx.beginPath();
      ctx.moveTo(24 - halfW, 8);
      ctx.lineTo(24 + halfW, 8);
      ctx.lineTo(24, coneTipY);
      ctx.closePath();
      ctx.fill();

      // Linke Glanzhälfte
      ctx.fillStyle = cfg.highlightColor;
      ctx.beginPath();
      ctx.moveTo(24 - halfW, 8);
      ctx.lineTo(24, 8);
      ctx.lineTo(24, coneTipY);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = cfg.edgeColor || '#f8fafc';
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.moveTo(24 - halfW, 8);
      ctx.lineTo(24, coneTipY);
      ctx.stroke();

      // Spiral-Wendeln nach oben
      const numFlutes = cfg.numFlutes || 3;
      const len = 8 - coneTipY;
      for (let i = 0; i < numFlutes; i++) {
        const u = ((f / 6) + i / numFlutes) % 1.0;
        const y = 8 - u * (len - 2);
        const fluteW = halfW * (1 - (8 - y) / len);
        const curvePhase = Math.sin((u * Math.PI * 2) + Math.PI / 4);

        ctx.strokeStyle = cfg.fluteColor;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(24 - fluteW, y + 1.0);
        ctx.quadraticCurveTo(24, y - curvePhase * 1.5, 24 + fluteW, y - 1.0);
        ctx.stroke();

        ctx.strokeStyle = cfg.spiralColor;
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.moveTo(24 - fluteW, y + 0.3);
        ctx.quadraticCurveTo(24, y - curvePhase * 1.5 - 0.8, 24 + fluteW, y - 1.6);
        ctx.stroke();
      }

      // Meißelspitze oben
      const tipAngle = (f / 6) * Math.PI * 2;
      const tipOffset = Math.sin(tipAngle) * 1.5;
      ctx.fillStyle = cfg.tipColor;
      ctx.beginPath();
      ctx.moveTo(24 - tipOffset, coneTipY + 1.5);
      ctx.lineTo(24, coneTipY);
      ctx.lineTo(24 + tipOffset, coneTipY + 1.5);
      ctx.closePath();
      ctx.fill();
    };

    // Texturen für alle 10 Bohrkopf-Stufen in allen Richtungen generieren
    for (let t = 1; t <= 10; t++) {
      createTexture(`player_drill_t${t}_right`, 48, 32, (ctx) => drawPlayerRight(ctx, 0, t));
      createTexture(`player_drill_t${t}_left`, 48, 32, (ctx) => drawPlayerLeft(ctx, 0, t));
      createTexture(`player_drill_t${t}_down`, 48, 32, (ctx) => drawPlayerDown(ctx, 0, t, 'right'));
      createTexture(`player_drill_t${t}_up`, 48, 32, (ctx) => drawPlayerUp(ctx, 0, t, 'right'));

      createTexture(`player_drill_t${t}_down_right`, 48, 32, (ctx) => drawPlayerDown(ctx, 0, t, 'right'));
      createTexture(`player_drill_t${t}_down_left`, 48, 32, (ctx) => drawPlayerDown(ctx, 0, t, 'left'));
      createTexture(`player_drill_t${t}_up_right`, 48, 32, (ctx) => drawPlayerUp(ctx, 0, t, 'right'));
      createTexture(`player_drill_t${t}_up_left`, 48, 32, (ctx) => drawPlayerUp(ctx, 0, t, 'left'));

      for (let f = 0; f < 6; f++) {
        // Bohrkopf dreht sich (f: 0..5), Kette bleibt stehen (trackF: 0)
        createTexture(`player_drill_t${t}_right_${f}`, 48, 32, (ctx) => drawPlayerRight(ctx, f, t, 0));
        createTexture(`player_drill_t${t}_left_${f}`, 48, 32, (ctx) => drawPlayerLeft(ctx, f, t, 0));
        createTexture(`player_drill_t${t}_down_${f}`, 48, 32, (ctx) => drawPlayerDown(ctx, f, t, 'right', 0));
        createTexture(`player_drill_t${t}_up_${f}`, 48, 32, (ctx) => drawPlayerUp(ctx, f, t, 'right', 0));

        createTexture(`player_drill_t${t}_down_right_${f}`, 48, 32, (ctx) => drawPlayerDown(ctx, f, t, 'right', 0));
        createTexture(`player_drill_t${t}_down_left_${f}`, 48, 32, (ctx) => drawPlayerDown(ctx, f, t, 'left', 0));
        createTexture(`player_drill_t${t}_up_right_${f}`, 48, 32, (ctx) => drawPlayerUp(ctx, f, t, 'right', 0));
        createTexture(`player_drill_t${t}_up_left_${f}`, 48, 32, (ctx) => drawPlayerUp(ctx, f, t, 'left', 0));
      }

      // 4 Ketten-Fahrt-Texturen: Kette läuft (track: 0..3), Bohrkopf steht still (drillF: 0)
      for (let tr = 0; tr < 4; tr++) {
        createTexture(`player_drill_t${t}_right_track_${tr}`, 48, 32, (ctx) => drawPlayerRight(ctx, 0, t, tr));
        createTexture(`player_drill_t${t}_left_track_${tr}`, 48, 32, (ctx) => drawPlayerLeft(ctx, 0, t, tr));
        createTexture(`player_drill_t${t}_down_track_${tr}`, 48, 32, (ctx) => drawPlayerDown(ctx, 0, t, 'right', tr));
        createTexture(`player_drill_t${t}_up_track_${tr}`, 48, 32, (ctx) => drawPlayerUp(ctx, 0, t, 'right', tr));

        createTexture(`player_drill_t${t}_down_right_track_${tr}`, 48, 32, (ctx) => drawPlayerDown(ctx, 0, t, 'right', tr));
        createTexture(`player_drill_t${t}_down_left_track_${tr}`, 48, 32, (ctx) => drawPlayerDown(ctx, 0, t, 'left', tr));
        createTexture(`player_drill_t${t}_up_right_track_${tr}`, 48, 32, (ctx) => drawPlayerUp(ctx, 0, t, 'right', tr));
        createTexture(`player_drill_t${t}_up_left_track_${tr}`, 48, 32, (ctx) => drawPlayerUp(ctx, 0, t, 'left', tr));
      }
    }

    // Abwärtskompatible Standard-Texturen (Tier 1 als Basis)
    createTexture('player_drill_right', 48, 32, (ctx) => drawPlayerRight(ctx, 0, 1, 0));
    createTexture('player_drill_left', 48, 32, (ctx) => drawPlayerLeft(ctx, 0, 1, 0));
    createTexture('player_drill_down', 48, 32, (ctx) => drawPlayerDown(ctx, 0, 1, 'right', 0));
    createTexture('player_drill_up', 48, 32, (ctx) => drawPlayerUp(ctx, 0, 1, 'right', 0));
    createTexture('player_drill_down_right', 48, 32, (ctx) => drawPlayerDown(ctx, 0, 1, 'right', 0));
    createTexture('player_drill_down_left', 48, 32, (ctx) => drawPlayerDown(ctx, 0, 1, 'left', 0));
    createTexture('player_drill_up_right', 48, 32, (ctx) => drawPlayerUp(ctx, 0, 1, 'right', 0));
    createTexture('player_drill_up_left', 48, 32, (ctx) => drawPlayerUp(ctx, 0, 1, 'left', 0));

    for (let f = 0; f < 6; f++) {
      createTexture(`player_drill_right_${f}`, 48, 32, (ctx) => drawPlayerRight(ctx, f, 1, 0));
      createTexture(`player_drill_left_${f}`, 48, 32, (ctx) => drawPlayerLeft(ctx, f, 1, 0));
      createTexture(`player_drill_down_${f}`, 48, 32, (ctx) => drawPlayerDown(ctx, f, 1, 'right', 0));
      createTexture(`player_drill_up_${f}`, 48, 32, (ctx) => drawPlayerUp(ctx, f, 1, 'right', 0));
    }

    for (let tr = 0; tr < 4; tr++) {
      createTexture(`player_drill_right_track_${tr}`, 48, 32, (ctx) => drawPlayerRight(ctx, 0, 1, tr));
      createTexture(`player_drill_left_track_${tr}`, 48, 32, (ctx) => drawPlayerLeft(ctx, 0, 1, tr));
      createTexture(`player_drill_down_track_${tr}`, 48, 32, (ctx) => drawPlayerDown(ctx, 0, 1, 'right', tr));
      createTexture(`player_drill_up_track_${tr}`, 48, 32, (ctx) => drawPlayerUp(ctx, 0, 1, 'right', tr));
    }

    // Leere Dummy-Textur für Rückwärtskompatibilität
    createTexture('drill_rotary_cutter', 1, 1, () => {});

    // =======================================================
    // 5. GEBÄUDE (HOCHDETAILLIERTE ARCHITEKTUR AUF LABOR-NIVEAU)
    // =======================================================

    // A) HANGAR & TANK-WERKSTATT (112x72) - Schwerer Industrie-Hangar & High-Tech Servicebucht
    createTexture('building_dock', 112, 72, (ctx) => {
      // 1. Fundament & Beton-Vorfeld mit Fugen und Kanten
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 68, 112, 4);
      ctx.fillStyle = '#334155';
      ctx.fillRect(2, 64, 108, 5);
      ctx.fillStyle = '#475569';
      ctx.fillRect(2, 63, 108, 1.5);
      // Beton-Dehnungsfugen & Schmutzspuren
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(24, 64, 1, 5);
      ctx.fillRect(56, 64, 1, 5);
      ctx.fillRect(88, 64, 1, 5);
      ctx.fillStyle = 'rgba(15, 23, 42, 0.45)';
      ctx.fillRect(44, 65, 24, 2); // Reifen-/Ölspuren am Hallentor

      // 2. Industrie-Stahlhalle & Trapezblech-Fassade
      ctx.fillStyle = '#0f172a'; // Hallen-Außenkontur
      ctx.fillRect(6, 12, 100, 52);
      ctx.fillStyle = '#1e293b'; // Stahlblech-Hauptton
      ctx.fillRect(7, 13, 98, 50);

      // Vertikale Trapezblech-Sicken / Rillen
      for (let x = 8; x < 104; x += 3) {
        ctx.fillStyle = '#172033';
        ctx.fillRect(x, 14, 1, 49);
        ctx.fillStyle = '#293548';
        ctx.fillRect(x + 1, 14, 1, 49);
      }

      // Eckpfeiler aus Doppel-T-Trägern mit Nieten
      const pillars = [6, 102];
      pillars.forEach(px => {
        ctx.fillStyle = '#334155';
        ctx.fillRect(px, 12, 4, 52);
        ctx.fillStyle = '#475569';
        ctx.fillRect(px + 1, 12, 2, 52);
        // Nieten
        ctx.fillStyle = '#94a3b8';
        for (let py = 15; py < 62; py += 8) {
          ctx.fillRect(px + 1.5, py, 1, 1);
        }
      });

      // 3. Dachkonstruktion & Attika mit Blitzleuchte und Klimagerät
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(4, 8, 104, 5);
      ctx.fillStyle = '#334155';
      ctx.fillRect(5, 9, 102, 3);
      ctx.fillStyle = '#64748b';
      ctx.fillRect(5, 8, 102, 1);

      // Dach-Klimagerät / Belüftung (Links)
      ctx.fillStyle = '#334155';
      ctx.fillRect(16, 2, 18, 7);
      ctx.fillStyle = '#475569';
      ctx.fillRect(17, 3, 16, 5);
      ctx.fillStyle = '#0f172a'; // Lüftungsgitter
      for (let lx = 19; lx < 31; lx += 2) {
        ctx.fillRect(lx, 4, 1, 3);
      }

      // Gelbe Sicherheits-Rundumleuchte (Dachmitte)
      ctx.fillStyle = '#475569';
      ctx.fillRect(78, 5, 4, 4);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(78.5, 3, 3, 3);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(79.5, 3.5, 1, 1);

      // Schwerer Dachkranausleger (Rechts)
      ctx.fillStyle = '#334155';
      ctx.fillRect(48, 0, 16, 8);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(40, 1, 32, 3); // Gelber I-Träger
      ctx.fillStyle = '#d97706';
      ctx.fillRect(40, 3, 32, 1);
      // Laufkatze & Hubseil mit Haken
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(53, 3, 6, 4);
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(55.5, 7, 1, 4); // Stahlseil
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(54.5, 11, 3, 2.5); // Kranhaken

      // 4. Werkstatt-Bucht & Schwerlast-Hebebühne (Zentrum)
      // Dunkler Halleninnenraum mit Tiefenwirkung
      ctx.fillStyle = '#090d16';
      ctx.fillRect(28, 22, 56, 42);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(30, 24, 52, 40);

      // Deckenbeleuchtung (Neon-Lichtstreifen in der Werkstattdecke)
      ctx.fillStyle = '#e0f2fe';
      ctx.fillRect(36, 24, 40, 2);
      ctx.fillStyle = 'rgba(56, 189, 248, 0.15)';
      ctx.fillRect(32, 26, 48, 12); // Lichtkegel

      // Hydraulische Scherenhebebühne
      ctx.fillStyle = '#78350f';
      ctx.fillRect(34, 56, 44, 2); // Scherenstreben im Schatten
      // Scheren-X-Gelenke
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(38, 62); ctx.lineTo(48, 56);
      ctx.moveTo(48, 62); ctx.lineTo(38, 56);
      ctx.moveTo(64, 62); ctx.lineTo(74, 56);
      ctx.moveTo(74, 62); ctx.lineTo(64, 56);
      ctx.stroke();

      // Hydraulik-Zylinder (Glänzendes Chrom)
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(54, 57, 4, 6);
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(53, 61, 6, 2);

      // Gelbe Riffelblech-Trägerplattform
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(33, 54, 46, 3.5);
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(33, 54, 46, 1);
      ctx.fillStyle = '#b45309';
      for (let rx = 35; rx < 78; rx += 4) {
        ctx.fillRect(rx, 55, 2, 1);
      }

      // 5. Tanksäule mit Display, Schlauch & Tankgalgen (Links: x=9..27)
      ctx.fillStyle = '#090d16';
      ctx.fillRect(10, 30, 16, 34);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(11, 31, 14, 32);
      // Edelstahl-Frontblende
      ctx.fillStyle = '#334155';
      ctx.fillRect(12, 33, 12, 15);
      // Digitales Flow-Meter & Preis-Display
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(13, 35, 10, 6);
      ctx.fillStyle = '#10b981'; // Grüne LED Ziffern
      ctx.fillRect(14, 36, 8, 2);
      ctx.fillStyle = '#34d399';
      ctx.fillRect(15, 39, 6, 1);

      // Not-Aus-Schalter (Rot)
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(15, 45, 1.5, 0, Math.PI * 2);
      ctx.fill();

      // Pumpensockel & Zapfhahn-Aufnahme
      ctx.fillStyle = '#475569';
      ctx.fillRect(12, 50, 12, 13);
      ctx.fillStyle = '#64748b';
      ctx.fillRect(13, 52, 4, 8);

      // Flexibler Kerosinschlauch (Neongrün ummantelt)
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(21, 52);
      ctx.bezierCurveTo(26, 54, 23, 62, 27, 63);
      ctx.stroke();
      // Zapfpistole aus Messing/Chrom
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(26, 61, 3, 2);

      // 6. Diagnose-Computer, Werkzeugwand & Monitor (Rechts: x=85..103)
      ctx.fillStyle = '#090d16';
      ctx.fillRect(85, 30, 18, 34);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(86, 31, 16, 32);

      // Telemetrie-Monitor (High-Tech Cyan)
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(88, 33, 12, 9);
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(89, 34, 10, 7);
      // Oszilloskop-Kurve / Diagnosegitter
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(90, 36, 8, 1);
      ctx.fillStyle = '#e0f2fe';
      ctx.fillRect(92, 35, 2, 3);

      // Roter Werkzeug-Rollwagen (4 Schubladen mit Chromgriffen)
      ctx.fillStyle = '#b91c1c';
      ctx.fillRect(88, 44, 12, 17);
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(89, 45, 10, 15);
      for (let dy = 47; dy < 59; dy += 3) {
        ctx.fillStyle = '#7f1d1d';
        ctx.fillRect(90, dy, 8, 1);
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(92, dy - 0.5, 4, 0.8); // Griff
      }

      // Feuerlöscher an der Wand
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(85.5, 48, 2, 7);
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(85, 47, 3, 1.5);

      // 7. Gelb-Schwarze Sicherheits-Warnschraffur am Hallentor-Sturz
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(28, 19, 56, 4);
      for (let x = 29; x < 83; x += 6) {
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.moveTo(x, 23);
        ctx.lineTo(x + 3, 19);
        ctx.lineTo(x + 5, 19);
        ctx.lineTo(x + 2, 23);
        ctx.closePath();
        ctx.fill();
      }
    });

    // A1) STARTER-HANGAR TIER 1 (64x42) - Kleiner Reparatur-Schuppen & Wellblech-Garage
    createTexture('building_dock_t1', 64, 42, (ctx) => {
      // Kiesbett & Ölfleck
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(2, 38, 60, 4);
      ctx.fillStyle = 'rgba(15, 23, 42, 0.6)';
      ctx.fillRect(16, 39, 20, 2);

      // Wände aus Holz- und Wellblechlatten
      ctx.fillStyle = '#3f2d1d';
      ctx.fillRect(6, 12, 52, 26);
      ctx.fillStyle = '#5c4028';
      for (let x = 8; x < 56; x += 4) {
        ctx.fillRect(x, 13, 3, 24);
      }

      // Vordach aus rostigem Wellblech
      ctx.fillStyle = '#475569';
      ctx.fillRect(4, 8, 56, 5);
      ctx.fillStyle = '#64748b';
      ctx.fillRect(4, 8, 56, 1.5);
      ctx.fillStyle = '#b45309';
      ctx.fillRect(18, 9, 8, 2);
      ctx.fillRect(42, 9, 6, 2);

      // Offenes Werkstatttor / Innenraum dunkel
      ctx.fillStyle = '#18130e';
      ctx.fillRect(16, 16, 24, 22);

      // Werkzeugwand & kleine Arbeitsleuchte innen
      ctx.fillStyle = '#78350f';
      ctx.fillRect(18, 18, 14, 8);
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(20, 20, 2, 4);
      ctx.fillRect(24, 21, 2, 3);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(27, 17, 2, 2);

      // Gelbes 200L Treibstoff-Fass außen links (x=6..16) als Treibstofflager
      ctx.fillStyle = '#d97706';
      ctx.fillRect(7, 24, 10, 14);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(8, 25, 8, 12);
      ctx.fillStyle = '#78350f';
      ctx.fillRect(7, 28, 10, 1.5);
      ctx.fillRect(7, 33, 10, 1.5);
      ctx.fillStyle = '#334155';
      ctx.fillRect(11, 20, 2, 4);
      ctx.fillRect(9, 20, 6, 1.5);

      // Tankgalgen-Stütze links am Schuppen (Sockel für Tankschlauch bei x=12, y=8)
      ctx.fillStyle = '#334155';
      ctx.fillRect(10, 4, 4, 6);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(11, 2, 2, 4);

      // Schwenkbarer Schweißarm-Sockel rechts auf dem Vordach (x=50, y=7)
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(48, 5, 6, 4);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(49, 3, 4, 3);
      ctx.fillStyle = '#334155';
      ctx.fillRect(50, 1, 2, 3);

      // Messingblende & Nieten über dem Tor
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(19, 11, 18, 4);
      ctx.fillStyle = '#b45309';
      ctx.fillRect(20, 12, 16, 2);
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(21, 12.5, 1.5, 1);
      ctx.fillRect(33.5, 12.5, 1.5, 1);
    });

    // A2) INTERMEDIATE-HANGAR TIER 2-3 (88x56) - Solide Metallbau-Werkstatthalle
    createTexture('building_dock_t2', 88, 56, (ctx) => {
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(2, 51, 84, 5);
      ctx.fillStyle = '#334155';
      ctx.fillRect(4, 49, 80, 3);

      // Fassade aus dunkelgrauem Trapezblech
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(8, 12, 72, 38);
      for (let x = 10; x < 78; x += 4) {
        ctx.fillStyle = '#111827';
        ctx.fillRect(x, 13, 1.5, 36);
        ctx.fillStyle = '#334155';
        ctx.fillRect(x + 1.5, 13, 1.5, 36);
      }

      // Dachrahmen
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(6, 9, 76, 4);
      ctx.fillStyle = '#475569';
      ctx.fillRect(6, 8, 76, 1.5);

      // Sektionaltor mit Gelb/Schwarz-Streifen
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(20, 18, 36, 32);
      ctx.fillStyle = '#eab308';
      ctx.fillRect(20, 18, 36, 3);
      ctx.fillStyle = '#0f172a';
      for (let sx = 20; sx < 56; sx += 6) {
        ctx.fillRect(sx, 18, 3, 3);
      }
      ctx.fillStyle = '#334155';
      for (let ry = 23; ry < 48; ry += 5) {
        ctx.fillRect(22, ry, 32, 1);
      }

      // Zapfsäule & Tankstand links (x=10..22, y=28..50)
      ctx.fillStyle = '#d97706';
      ctx.fillRect(10, 28, 12, 22);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(11, 29, 10, 20);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(13, 32, 6, 4);
      ctx.fillStyle = '#10b981';
      ctx.fillRect(14, 33, 4, 2);

      // Schwenkbarer Reparaturarm-Sockel rechts auf dem Dach (x=72, y=6)
      ctx.fillStyle = '#334155';
      ctx.fillRect(68, 5, 8, 4);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(70, 2, 4, 4);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(71, 0, 2, 3);

      // Lüfterkasten auf dem Dach (Mitte-Links)
      ctx.fillStyle = '#475569';
      ctx.fillRect(34, 4, 12, 5);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(36, 5, 8, 3);
    });

    // B) ERZ-BÖRSE & ROHSTOFF-LAGERHALLE (100x68) - Schweres Logistik- & Güterdepot
    createTexture('building_market', 100, 68, (ctx) => {
      // 1. Schweres Beton-Laderampen-Fundament mit Dehnungsfugen & Anfahrschutz
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 64, 100, 4);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(2, 60, 96, 5);
      ctx.fillStyle = '#334155';
      ctx.fillRect(2, 59, 96, 2);
      ctx.fillStyle = '#475569';
      ctx.fillRect(2, 58, 96, 1.5);

      // Beton-Fugen & Gummipuffer an der Laderampe
      ctx.fillStyle = '#090d16';
      ctx.fillRect(20, 60, 1, 5);
      ctx.fillRect(50, 60, 1, 5);
      ctx.fillRect(80, 60, 1, 5);
      // Gummipuffer links & rechts am Tor
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(18, 56, 4, 5);
      ctx.fillRect(78, 56, 4, 5);

      // 2. Lagerhallen-Korpus aus robustem Industrie-Trapezblech
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(6, 10, 88, 50);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(7, 11, 86, 48);

      // Vertikale Trapezblech-Sicken / Profilrillen
      for (let x = 8; x < 92; x += 3.5) {
        ctx.fillStyle = '#151f2e';
        ctx.fillRect(x, 12, 1, 46);
        ctx.fillStyle = '#2d3b4e';
        ctx.fillRect(x + 1, 12, 1, 46);
      }

      // Stahlbau-Eckstützen (I-Träger) mit Nieten
      const warehousePillars = [6, 90];
      warehousePillars.forEach(px => {
        ctx.fillStyle = '#334155';
        ctx.fillRect(px, 10, 4, 50);
        ctx.fillStyle = '#475569';
        ctx.fillRect(px + 1, 10, 2, 50);
        ctx.fillStyle = '#94a3b8';
        for (let py = 14; py < 58; py += 7) {
          ctx.fillRect(px + 1.5, py, 1, 1);
        }
      });

      // 3. Auskragendes Vordach mit Entwässerungsrinne & Dachlüftern
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(4, 7, 92, 4);
      ctx.fillStyle = '#334155';
      ctx.fillRect(5, 8, 90, 2);
      ctx.fillStyle = '#475569';
      ctx.fillRect(5, 7, 90, 1);

      // 2 rotierende Industrie-Dachlüfter / Turbinenhauben
      const ventsX = [22, 74];
      ventsX.forEach(vx => {
        ctx.fillStyle = '#475569';
        ctx.fillRect(vx, 2, 6, 6);
        ctx.fillStyle = '#64748b';
        ctx.beginPath();
        ctx.arc(vx + 3, 2, 4, Math.PI, 0);
        ctx.fill();
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(vx + 1, 4, 4, 1.5);
      });

      // Kranbahnträger-Überstand (I-Träger Mitte Dach)
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(45, 3, 10, 3);
      ctx.fillStyle = '#d97706';
      ctx.fillRect(45, 5, 10, 1);

      // 4. Großes offenes Laderampen-Rolltor (Zentrum: x=22..78, y=18..60)
      // Tiefschwarzer Hallen-Innenraum mit Tiefenwirkung
      ctx.fillStyle = '#070a11';
      ctx.fillRect(22, 18, 56, 42);
      ctx.fillStyle = '#0d131f';
      ctx.fillRect(24, 20, 52, 40);

      // Schwerlast-Hochregale im Hallen-Hintergrund
      ctx.fillStyle = '#1e293b';
      // Vertikale Regalpfosten
      ctx.fillRect(27, 24, 2, 34);
      ctx.fillRect(48, 24, 2, 34);
      ctx.fillRect(71, 24, 2, 34);
      // Horizontale Regalböden (Orange Industrie-Träger)
      ctx.fillStyle = '#ea580c';
      ctx.fillRect(27, 33, 46, 2);
      ctx.fillRect(27, 44, 46, 2);

      // Gelagerte Güter im Regal:
      // Ebene 1: Fässer / Industriebehälter
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(31, 27, 5, 6);
      ctx.fillRect(37, 27, 5, 6);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(32, 28, 3, 1);
      // Ebene 2: Frachtkisten & Kerosinfässer
      ctx.fillStyle = '#78350f';
      ctx.fillRect(52, 27, 8, 6);
      ctx.fillRect(31, 38, 7, 6);
      ctx.fillStyle = '#10b981';
      ctx.fillRect(40, 38, 6, 6);

      // Aufgerolltes Industrie-Sektionaltor oben (Lamellenpanzer)
      ctx.fillStyle = '#334155';
      ctx.fillRect(23, 18, 54, 7);
      ctx.fillStyle = '#475569';
      for (let ly = 19; ly < 25; ly += 2) {
        ctx.fillRect(23, ly, 54, 1);
      }
      // Kettenzug-Getriebe links am Tor
      ctx.fillStyle = '#64748b';
      ctx.fillRect(23, 23, 2.5, 6);

      // Gelb-schwarze Warnmarkierung am Torsturz & Torpfosten
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(21, 16, 58, 3);
      for (let x = 22; x < 78; x += 6) {
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.moveTo(x, 19);
        ctx.lineTo(x + 3, 16);
        ctx.lineTo(x + 5, 16);
        ctx.lineTo(x + 2, 19);
        ctx.closePath();
        ctx.fill();
      }

      // Hallen-Lichtkegel über dem Ladebereich
      ctx.fillStyle = 'rgba(254, 240, 138, 0.12)';
      ctx.beginPath();
      ctx.moveTo(50, 19);
      ctx.lineTo(24, 60);
      ctx.lineTo(76, 60);
      ctx.closePath();
      ctx.fill();

      // 5. Paletten, Erzkisten & Mineralien auf der Laderampe
      // A) Linke Palette: Massives Rohgold & Erzbrocken
      ctx.fillStyle = '#52280d'; // Holzpalette
      ctx.fillRect(8, 54, 16, 4);
      ctx.fillStyle = '#78350f';
      ctx.fillRect(8, 55, 16, 1.5);
      // Schwere Holzkiste mit Stahlbandagen
      ctx.fillStyle = '#92400e';
      ctx.fillRect(9, 40, 14, 14);
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1;
      ctx.strokeRect(9, 40, 14, 14);
      // Goldbarren & funkelndes Erz
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(11, 41, 10, 5);
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(12, 42, 5, 2.5);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(13, 42.5, 3, 1);

      // B) Rechte Palette: Titanbehälter mit Diamanten & Smaragden
      ctx.fillStyle = '#52280d';
      ctx.fillRect(76, 54, 16, 4);
      ctx.fillStyle = '#78350f';
      ctx.fillRect(76, 55, 16, 1.5);
      // Container
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(77, 40, 14, 14);
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 1;
      ctx.strokeRect(77, 40, 14, 14);
      // Diamant- & Kristallspitzen
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(79, 41, 10, 6);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(80, 42, 8, 4);
      ctx.fillStyle = '#e0f2fe';
      ctx.fillRect(82, 43, 4, 2);

      // C) Handhubwagen (Pallet Jack) in Sicherheitsgelb in der Tormitte
      // Lenkdeichsel & Griff
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(49, 46, 1.5, 9);
      ctx.fillRect(47, 45, 5, 1.5); // T-Griff
      // Hydraulik-Pumpenkörper
      ctx.fillStyle = '#d97706';
      ctx.fillRect(48, 53, 3.5, 4);
      // Gelbe Hubgabeln (unter Palette)
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(51, 55, 12, 2.5);
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(51, 55, 12, 1);
      // Lenkrollen unten
      ctx.fillStyle = '#090d16';
      ctx.fillRect(48, 57, 3, 2);
      ctx.fillRect(61, 57, 2, 2);

      // Gestapelte Erzsäcke auf der Hubwagengabel
      ctx.fillStyle = '#b45309';
      ctx.beginPath();
      ctx.ellipse(57, 52, 5, 2.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#d97706';
      ctx.beginPath();
      ctx.ellipse(56, 50, 4, 2, 0, 0, Math.PI * 2);
      ctx.fill();
    });

    // B1) STARTER-ERZBÖRSE / RAFFINERIE TIER 1 (56x40) - Rustikaler Schmelzofen & Schürfer-Stand
    createTexture('building_market_t1', 56, 40, (ctx) => {
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(2, 36, 52, 4);

      // Gemauerter Schmelzofen rechts
      ctx.fillStyle = '#475569';
      ctx.fillRect(34, 14, 18, 23);
      ctx.fillStyle = '#64748b';
      ctx.fillRect(35, 15, 16, 21);
      // Schornstein
      ctx.fillStyle = '#334155';
      ctx.fillRect(40, 4, 6, 10);
      ctx.fillStyle = '#475569';
      ctx.fillRect(39, 3, 8, 2);

      // Glühender Ofenschlund
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(38, 23, 10, 11);
      ctx.fillStyle = '#ea580c';
      ctx.fillRect(39, 25, 8, 8);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(41, 27, 4, 4);

      // Verkaufsstand links mit Holztheke & Sonnensegel
      ctx.fillStyle = '#78350f';
      ctx.fillRect(6, 22, 24, 15);
      ctx.fillStyle = '#92400e';
      ctx.fillRect(5, 21, 26, 2.5);

      // Gestreiftes Stoffdach (Rot-Weiß)
      for (let i = 0; i < 6; i++) {
        ctx.fillStyle = (i % 2 === 0) ? '#dc2626' : '#f8fafc';
        ctx.fillRect(4 + i * 4.5, 11, 4.5, 4);
      }
      ctx.fillStyle = '#78350f';
      ctx.fillRect(5, 15, 2, 7);

      // Waage & Preistafel
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(10, 18, 5, 3);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(18, 14, 8, 6);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(19, 16, 6, 2);
    });

    // B2-MID) INTERMEDIATE-ERZBÖRSE TIER 2 (78x54) - Massives Handels- & Schmelzhaus
    createTexture('building_market_t2', 78, 54, (ctx) => {
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(2, 49, 74, 5);

      // Ziegelstein-Korpus
      ctx.fillStyle = '#7f1d1d';
      ctx.fillRect(6, 14, 66, 36);
      ctx.fillStyle = '#991b1b';
      ctx.fillRect(8, 15, 62, 34);

      // Kupferschornstein
      ctx.fillStyle = '#b45309';
      ctx.fillRect(52, 6, 8, 12);
      ctx.fillStyle = '#d97706';
      ctx.fillRect(50, 4, 12, 3);

      // Verglastes Schmelzfeuer
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(48, 24, 16, 16);
      ctx.fillStyle = '#ea580c';
      ctx.fillRect(50, 26, 12, 12);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(53, 29, 6, 6);

      // Börsen-Schalterfenster links
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(14, 20, 26, 22);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(16, 22, 22, 14);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(18, 37, 18, 3);
    });

    // B2) ROHSTOFF- & WAREN-DEPOT (92x70) - Hochregallager & Schwergut-Containerterminal
    createTexture('building_depot', 92, 70, (ctx) => {
      // 1. Schweres Beton-Fundament mit Laderampe & Dehnungsfugen
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 65, 92, 5);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(2, 61, 88, 5);
      ctx.fillStyle = '#334155';
      ctx.fillRect(2, 60, 88, 1.5);

      // Anfahrschutz-Puffer an der Rampe
      ctx.fillStyle = '#090d16';
      ctx.fillRect(10, 61, 3, 5);
      ctx.fillRect(44, 61, 3, 5);
      ctx.fillRect(80, 61, 3, 5);

      // 2. Lager-Hauptgebäude (Stahlkonstruktion)
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(4, 12, 84, 49);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(5, 13, 82, 47);

      // Vertikale Profilrippen auf der Fassade
      for (let x = 6; x < 86; x += 3.5) {
        ctx.fillStyle = '#162032';
        ctx.fillRect(x, 14, 1, 45);
        ctx.fillStyle = '#26354a';
        ctx.fillRect(x + 1, 14, 1, 45);
      }

      // Stahlbau-Eckpfeiler
      const cornerPillars = [4, 84];
      cornerPillars.forEach(px => {
        ctx.fillStyle = '#334155';
        ctx.fillRect(px, 12, 4, 49);
        ctx.fillStyle = '#475569';
        ctx.fillRect(px + 1, 12, 2, 49);
      });

      // 3. Fracht-Sektionaltor links (x=10..46, y=26..61)
      ctx.fillStyle = '#0b0f19';
      ctx.fillRect(10, 26, 36, 35);
      // Innenbeleuchtung / Regale im Hintergrund
      ctx.fillStyle = '#111827';
      ctx.fillRect(11, 27, 34, 33);
      // Glimmende Innenlampe
      ctx.fillStyle = 'rgba(56, 189, 248, 0.18)';
      ctx.beginPath();
      ctx.moveTo(28, 27);
      ctx.lineTo(12, 60);
      ctx.lineTo(44, 60);
      ctx.closePath();
      ctx.fill();

      // Palette mit Kisten im Torbereich
      ctx.fillStyle = '#78350f';
      ctx.fillRect(14, 56, 12, 3);
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(15, 48, 10, 8);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(16, 49, 8, 2);

      // Zweite Kiste (Erz-Behälter)
      ctx.fillStyle = '#92400e';
      ctx.fillRect(28, 51, 12, 8);
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(29, 52, 10, 2);

      // Aufgerolltes Rolltor oben mit Lamellen
      ctx.fillStyle = '#334155';
      ctx.fillRect(10, 26, 36, 6);
      ctx.fillStyle = '#475569';
      for (let ly = 27; ly < 32; ly += 1.5) {
        ctx.fillRect(10, ly, 36, 0.8);
      }

      // Gelb-schwarze Warnstreifen über dem Tor
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(9, 23, 38, 3);
      for (let wx = 10; wx < 46; wx += 5) {
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.moveTo(wx, 26);
        ctx.lineTo(wx + 2.5, 23);
        ctx.lineTo(wx + 4.5, 23);
        ctx.lineTo(wx + 2, 26);
        ctx.closePath();
        ctx.fill();
      }

      // 4. Rechts: Gestapelte Schwerlast-Seefracht-Container (x=50..82)
      // Unterer Container (Blau / Cyan für Mineralien)
      ctx.fillStyle = '#0369a1';
      ctx.fillRect(50, 41, 32, 19);
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(51, 42, 30, 17);
      for (let cx = 53; cx < 80; cx += 3) {
        ctx.fillStyle = '#075985';
        ctx.fillRect(cx, 43, 1, 15);
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(cx + 1, 43, 0.8, 15);
      }
      // Eckbeschläge
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(50, 41, 3, 3);
      ctx.fillRect(79, 41, 3, 3);
      ctx.fillRect(50, 57, 3, 3);
      ctx.fillRect(79, 57, 3, 3);

      // Oberer Container (Orange / Bernstein für Legierungen)
      ctx.fillStyle = '#b45309';
      ctx.fillRect(52, 21, 30, 19);
      ctx.fillStyle = '#d97706';
      ctx.fillRect(53, 22, 28, 17);
      for (let cx = 55; cx < 80; cx += 3) {
        ctx.fillStyle = '#92400e';
        ctx.fillRect(cx, 23, 1, 15);
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(cx + 1, 23, 0.8, 15);
      }
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(52, 21, 3, 3);
      ctx.fillRect(79, 21, 3, 3);
      ctx.fillRect(52, 37, 3, 3);
      ctx.fillRect(79, 37, 3, 3);

      // 5. Dachkonstruktion mit Deckenkran-Laufkatze & Entlüftung
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(2, 9, 88, 4);
      ctx.fillStyle = '#334155';
      ctx.fillRect(3, 10, 86, 2);

      // Dach-Kranbahn (Gelber I-Träger mit Seilzug)
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(20, 5, 30, 4);
      ctx.fillStyle = '#b45309';
      ctx.fillRect(20, 8, 30, 1);
      // Laufkatze mit Lastseil & Magnetkralle
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(32, 3, 7, 5);
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(35, 8, 1, 6);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(33, 14, 5, 3);

      // Funk- & Logistik-Antenne links auf dem Dach
      ctx.fillStyle = '#475569';
      ctx.fillRect(7, 2, 2, 8);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(6, 1, 4, 1.5);
      // Rote Status-Blinkleuchte
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(7.5, 0, 1, 1);

      // 6. Signalleiste & Container-Kennung über dem Tor
      ctx.fillStyle = '#090d16';
      ctx.fillRect(12, 14, 32, 7);
      ctx.fillStyle = '#0284c7';
      ctx.strokeRect(12, 14, 32, 7);
      ctx.fillStyle = '#0369a1';
      ctx.fillRect(14, 16, 28, 3);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(16, 17, 6, 1);
      ctx.fillRect(24, 17, 6, 1);
      ctx.fillRect(32, 17, 8, 1);
    });

    // B2-T1) STARTER-DEPOT TIER 1 (56x40) - Kleiner Holzunterstand & Erzlagerplatz
    createTexture('building_depot_t1', 56, 40, (ctx) => {
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(2, 36, 52, 4);

      // Kleine Holzhütte links
      ctx.fillStyle = '#451a03';
      ctx.fillRect(4, 14, 26, 23);
      ctx.fillStyle = '#78350f';
      for (let x = 6; x < 28; x += 4) {
        ctx.fillRect(x, 15, 2.5, 21);
      }
      ctx.fillStyle = '#291104';
      ctx.fillRect(8, 20, 10, 17);
      ctx.fillStyle = '#d97706';
      ctx.fillRect(16, 28, 1.5, 1.5);

      // Schrägdach mit Holzlatten
      ctx.fillStyle = '#291104';
      ctx.fillRect(2, 10, 30, 4);
      ctx.fillStyle = '#78350f';
      ctx.fillRect(3, 9, 28, 2);

      // Überdachter Lagerbereich rechts mit grüner Plane
      ctx.fillStyle = '#78350f';
      ctx.fillRect(50, 14, 3, 23);
      ctx.fillStyle = '#065f46';
      ctx.fillRect(30, 13, 23, 4);
      ctx.fillStyle = '#047857';
      ctx.fillRect(30, 13, 23, 1.5);

      // Gestapelte Erzkisten & Säcke
      ctx.fillStyle = '#78350f';
      ctx.fillRect(34, 25, 14, 12);
      ctx.fillStyle = '#92400e';
      ctx.fillRect(35, 26, 12, 10);
      ctx.fillStyle = '#451a03';
      ctx.fillRect(35, 30, 12, 1.5);
      ctx.fillStyle = '#18181b';
      ctx.fillRect(36, 22, 4, 3);
      ctx.fillStyle = '#b45309';
      ctx.fillRect(42, 22, 4, 3);

      // Holzblende über dem Eingang
      ctx.fillStyle = '#291104';
      ctx.fillRect(10, 12, 14, 4);
      ctx.fillStyle = '#78350f';
      ctx.fillRect(11, 13, 12, 2);
    });

    // B2-T2) INTERMEDIATE-DEPOT TIER 2-3 (74x54) - Solide Lagerhalle mit Laderampe
    createTexture('building_depot_t2', 74, 54, (ctx) => {
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(2, 49, 70, 5);

      // Mauerwerk & Stahlblech
      ctx.fillStyle = '#334155';
      ctx.fillRect(6, 14, 62, 36);
      ctx.fillStyle = '#475569';
      ctx.fillRect(8, 15, 58, 34);

      // Rolltor Mitte
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(18, 22, 26, 28);
      ctx.fillStyle = '#64748b';
      for (let y = 24; y < 48; y += 4) {
        ctx.fillRect(20, y, 22, 1.5);
      }

      // Laderampe & Kisten rechts
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(48, 36, 18, 14);
      ctx.fillStyle = '#b45309';
      ctx.fillRect(50, 26, 12, 10);

      // Dach mit Oberlicht
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(4, 10, 66, 5);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(24, 7, 16, 4);
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.fillRect(26, 8, 12, 1.5);
    });

    // B2-T3) ADVANCED-DEPOT TIER 4-5 (84x62) - Modernes Logistikterminal mit Kranbahn & Hochregalen
    createTexture('building_depot_t3', 84, 62, (ctx) => {
      // 1. Beton-Fundament
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 58, 84, 4);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(2, 54, 80, 5);
      ctx.fillStyle = '#334155';
      ctx.fillRect(2, 53, 80, 1.5);

      // Puffer an der Rampe
      ctx.fillStyle = '#090d16';
      ctx.fillRect(8, 54, 3, 5);
      ctx.fillRect(38, 54, 3, 5);
      ctx.fillRect(72, 54, 3, 5);

      // 2. Haupthalle
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(4, 14, 76, 40);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(5, 15, 74, 38);

      // Vertikale Profilrippen
      for (let x = 6; x < 78; x += 3.5) {
        ctx.fillStyle = '#162032';
        ctx.fillRect(x, 16, 1, 36);
        ctx.fillStyle = '#26354a';
        ctx.fillRect(x + 1, 16, 1, 36);
      }

      // Eckpfeiler
      [4, 76].forEach(px => {
        ctx.fillStyle = '#334155';
        ctx.fillRect(px, 14, 4, 40);
        ctx.fillStyle = '#475569';
        ctx.fillRect(px + 1, 14, 2, 40);
      });

      // 3. Dach mit Kran-Ausleger oben
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(2, 10, 80, 4);
      ctx.fillStyle = '#334155';
      ctx.fillRect(2, 9, 80, 1.5);

      // Kranbahn & Katze oben
      ctx.fillStyle = '#eab308';
      ctx.fillRect(18, 5, 48, 3);
      ctx.fillStyle = '#ca8a04';
      ctx.fillRect(18, 8, 48, 1);
      // Laufkatze & Haken
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(36, 4, 8, 5);
      ctx.fillStyle = '#64748b';
      ctx.fillRect(39, 9, 2, 4);

      // 4. Fracht-Rolltor links (offen mit Lagergut)
      ctx.fillStyle = '#0b0f19';
      ctx.fillRect(8, 24, 32, 30);
      ctx.fillStyle = '#111827';
      ctx.fillRect(9, 25, 30, 28);
      // Glimmende Innenbeleuchtung
      ctx.fillStyle = 'rgba(56, 189, 248, 0.16)';
      ctx.beginPath();
      ctx.moveTo(24, 25);
      ctx.lineTo(9, 53);
      ctx.lineTo(39, 53);
      ctx.closePath();
      ctx.fill();

      // Regalkisten innen
      ctx.fillStyle = '#b45309';
      ctx.fillRect(12, 43, 8, 9);
      ctx.fillStyle = '#d97706';
      ctx.fillRect(13, 44, 6, 7);
      ctx.fillStyle = '#475569';
      ctx.fillRect(22, 45, 7, 7);
      ctx.fillStyle = '#64748b';
      ctx.fillRect(23, 46, 5, 5);
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(14, 36, 6, 6);

      // 5. Rechtes Sektionaltor mit Warnstreifen (geschlossen)
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(44, 24, 28, 30);
      ctx.fillStyle = '#334155';
      for (let y = 26; y < 52; y += 4) {
        ctx.fillRect(46, y, 24, 2);
      }
      // Status-LEDs
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(46, 22, 2, 2);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(50, 22, 2, 2);

      // Fracht-Kennzeichnung
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(46, 16, 24, 4);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(48, 17.5, 20, 1);
    });

    // C) FABRIK & WERKSTOFF-PRODUKTION (104x72) - Authentisches Schmelzwerk mit Abstichrinne & Gießerei
    createTexture('building_factory', 104, 72, (ctx) => {
      // 1. Schwerlast-Fundament & Riffelblech-Boden
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 68, 104, 4);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(2, 63, 100, 6);
      ctx.fillStyle = '#334155';
      ctx.fillRect(2, 62, 100, 1.5);

      // Verankerungsflansche mit Bolzen
      for (let ax = 6; ax < 98; ax += 16) {
        ctx.fillStyle = '#090d16';
        ctx.fillRect(ax, 63, 4, 5);
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(ax + 1, 64, 2, 2);
      }

      // 2. Industrie-Halle aus anthrazitfarbenem Stahl & Klinkermauerwerk
      ctx.fillStyle = '#111827';
      ctx.fillRect(5, 16, 94, 47);
      ctx.fillStyle = '#1f2937';
      ctx.fillRect(6, 17, 92, 45);

      // Sägezahndach / Sheddach-Aufbauten oben mit Oberlichtern
      ctx.fillStyle = '#111827';
      ctx.beginPath();
      ctx.moveTo(26, 17);
      ctx.lineTo(38, 8);
      ctx.lineTo(38, 17);
      ctx.lineTo(50, 8);
      ctx.lineTo(50, 17);
      ctx.lineTo(62, 8);
      ctx.lineTo(62, 17);
      ctx.closePath();
      ctx.fill();

      // Oberlicht-Verglasung (angewinkeltes blaues Industrieglas)
      ctx.fillStyle = '#0284c7';
      ctx.beginPath();
      ctx.moveTo(28, 16);
      ctx.lineTo(37, 9.5);
      ctx.lineTo(37, 16);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(40, 16);
      ctx.lineTo(49, 9.5);
      ctx.lineTo(49, 16);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(52, 16);
      ctx.lineTo(61, 9.5);
      ctx.lineTo(61, 16);
      ctx.closePath();
      ctx.fill();

      // Vertikale Doppel-T-Träger (Stahlstützen)
      for (let cx = 8; cx < 96; cx += 14) {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(cx, 17, 3, 45);
        ctx.fillStyle = '#374151';
        ctx.fillRect(cx + 0.8, 17, 1.4, 45);
      }

      // 3. Doppel-Schornsteine mit Schornsteinkronen & Wartungsleiter
      const chimneys = [12, 78];
      chimneys.forEach(cx => {
        // Schornsteinsäule
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(cx, 0, 14, 20);
        ctx.fillStyle = '#334155';
        ctx.fillRect(cx + 1, 0, 12, 20);

        // Flugsicherungs-Warnstreifen (Orange-Weiß-Orange)
        ctx.fillStyle = '#ea580c';
        ctx.fillRect(cx - 1, 0, 16, 3);
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(cx - 1, 3, 16, 2.5);
        ctx.fillStyle = '#ea580c';
        ctx.fillRect(cx - 1, 5.5, 16, 2.5);

        // Verstärkungsbänder
        ctx.fillStyle = '#475569';
        ctx.fillRect(cx, 11, 14, 1.5);
        ctx.fillRect(cx, 16, 14, 1.5);

        // Wartungsleiter mit Schutzkorb
        ctx.fillStyle = '#64748b';
        ctx.fillRect(cx + 12, 1, 1, 19);
        for (let ly = 3; ly < 19; ly += 3) {
          ctx.fillRect(cx + 10, ly, 3, 0.8);
        }

        // Mündungsöffnung & dezente Hitzeschlieren
        ctx.fillStyle = '#090d16';
        ctx.fillRect(cx + 1.5, 0, 11, 1.5);
      });

      // 4. Industrielle Sprossenfenster im Obergeschoss (Büro / Leitstand)
      const upperWindows = [24, 66];
      upperWindows.forEach(wx => {
        ctx.fillStyle = '#090d16';
        ctx.fillRect(wx - 1, 21, 14, 12);
        ctx.fillStyle = '#0369a1';
        ctx.fillRect(wx, 22, 12, 10);
        ctx.fillStyle = '#0284c7';
        ctx.fillRect(wx, 23, 12, 8);

        // Terminal-Beleuchtung im Leitstand
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(wx + 2, 25, 4, 3);
        ctx.fillStyle = '#10b981';
        ctx.fillRect(wx + 7, 26, 3, 2);

        // Gittersprossen
        ctx.fillStyle = '#090d16';
        ctx.fillRect(wx + 5.5, 22, 1, 10);
        ctx.fillRect(wx, 26.5, 12, 1);
      });

      // 5. ZENTRALER SCHMELZOFEN (AUTHENTISCHER LICHTBOGENOFER MIT ABSTICH & GUSSKAMMER)
      // Massives, abgerundetes Ofengehäuse aus schwerem Gussstahl (x=36..68, y=26..62)
      ctx.fillStyle = '#090d16';
      ctx.fillRect(36, 26, 32, 36);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(37, 27, 30, 34);
      ctx.fillStyle = '#334155';
      ctx.fillRect(38, 28, 28, 32);

      // Niethorizontale & Hitzeschild-Segmente
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(36, 36, 32, 2);
      ctx.fillRect(36, 48, 32, 2);
      for (let nx = 38; nx < 68; nx += 5) {
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(nx, 29, 1.2, 1.2);
        ctx.fillRect(nx, 39, 1.2, 1.2);
        ctx.fillRect(nx, 51, 1.2, 1.2);
      }

      // Hydraulischer Ofendeckel mit Elektroden-Säulen oben (Graphitelektroden)
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(44, 21, 4, 6);
      ctx.fillRect(56, 21, 4, 6);
      ctx.fillStyle = '#475569';
      ctx.fillRect(45, 22, 2, 5);
      ctx.fillRect(57, 22, 2, 5);
      // Stromzuführungsschienen aus Kupfer
      ctx.fillStyle = '#b45309';
      ctx.fillRect(42, 23, 20, 2);
      ctx.fillStyle = '#d97706';
      ctx.fillRect(42, 23, 20, 1);

      // Zwei kreisrunde Schaugläser (Inspection Portholes) mit Hitzeglut
      const portholes = [43, 57];
      portholes.forEach(px => {
        // Stahl-Schauglasfassung mit Schraubkranz
        ctx.fillStyle = '#090d16';
        ctx.beginPath();
        ctx.arc(px, 35, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#475569';
        ctx.beginPath();
        ctx.arc(px, 35, 3.5, 0, Math.PI * 2);
        ctx.fill();

        // Glut im Ofeninneren (feiner Farbverlauf von Rot über Orange zu Weiß)
        ctx.fillStyle = '#7f1d1d';
        ctx.beginPath();
        ctx.arc(px, 35, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ea580c';
        ctx.beginPath();
        ctx.arc(px, 35, 1.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(px, 35, 0.9, 0, Math.PI * 2);
        ctx.fill();
      });

      // Abstich-Öffnung & Abstichrinne (Tapping Spout)
      ctx.fillStyle = '#090d16';
      ctx.fillRect(48, 42, 8, 4);
      ctx.fillStyle = '#78350f'; // Feuerfeste Schamottauskleidung
      ctx.fillRect(49, 43, 6, 2.5);

      // Gezielt fließender, schmaler Schmelzstrahl (kein diffuser Fleck!)
      ctx.fillStyle = '#ea580c';
      ctx.fillRect(51, 44, 2.5, 9);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(51.5, 44.5, 1.5, 8.5);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(52, 45, 0.8, 6);

      // Auffangpfanne / Gießform-Kokille unter dem Strahl (x=46..58, y=53..61)
      ctx.fillStyle = '#090d16';
      ctx.fillRect(46, 53, 12, 7);
      ctx.fillStyle = '#1e2430';
      ctx.fillRect(47, 54, 10, 5.5);

      // Flüssiges Metall in der Gießform mit Glühkruste
      ctx.fillStyle = '#c2410c';
      ctx.fillRect(48, 55, 8, 3.5);
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(49, 55.5, 6, 2);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(50.5, 56, 3, 1);

      // 6. Automatisiertes Kettenförderband nach rechts mit abkühlenden Barren
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(58, 57, 24, 5);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(58, 57.5, 24, 4);
      // Förderrollen
      for (let rx = 60; rx < 82; rx += 4) {
        ctx.fillStyle = '#475569';
        ctx.fillRect(rx, 58, 2, 3);
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(rx, 58, 2, 1);
      }

      // Gegossene Barren auf dem Förderband:
      // 1. Barren (glüht noch rot-orange ab)
      ctx.fillStyle = '#9a3412';
      ctx.fillRect(62, 55, 6, 3);
      ctx.fillStyle = '#ea580c';
      ctx.fillRect(63, 55.5, 4, 1.5);

      // 2. Barren (abgekühlt: Fertiger Gold-/Bronze-Barren)
      ctx.fillStyle = '#d97706';
      ctx.fillRect(72, 55, 6, 3);
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(72.5, 55, 5, 1.2);

      // 7. Schmiede- & Hydraulikhammer links vom Ofen (x=16..30, y=36..62)
      // Führungsständer
      ctx.fillStyle = '#090d16';
      ctx.fillRect(18, 36, 12, 26);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(19, 37, 10, 24);
      // Hydraulikzylinder
      ctx.fillStyle = '#475569';
      ctx.fillRect(22, 32, 4, 8);
      ctx.fillStyle = '#cbd5e1'; // Chrom-Stange
      ctx.fillRect(23, 40, 2, 6);
      // Schlagbär / Schmiedestempel
      ctx.fillStyle = '#64748b';
      ctx.fillRect(20, 46, 8, 4);
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(20, 49, 8, 1);
      // Ambossblock
      ctx.fillStyle = '#334155';
      ctx.fillRect(18, 54, 12, 8);
      ctx.fillStyle = '#64748b';
      ctx.fillRect(19, 54, 10, 2);

      // 8. Industriepalette mit gestapelten Barren rechts (x=84..98, y=56..62)
      // Holzpalette
      ctx.fillStyle = '#78350f';
      ctx.fillRect(84, 60, 14, 2);
      ctx.fillStyle = '#451a03';
      ctx.fillRect(86, 61, 2, 1);
      ctx.fillRect(90, 61, 2, 1);
      ctx.fillRect(94, 61, 2, 1);

      // Gestapelte fertige Titan- & Stahlbarren
      ctx.fillStyle = '#475569';
      ctx.fillRect(85, 57, 5, 3);
      ctx.fillStyle = '#64748b';
      ctx.fillRect(85, 57, 5, 1);
      ctx.fillStyle = '#334155';
      ctx.fillRect(91, 57, 5, 3);
      ctx.fillStyle = '#475569';
      ctx.fillRect(91, 57, 5, 1);
      // Zweite Lage
      ctx.fillStyle = '#64748b';
      ctx.fillRect(88, 54, 5, 3);
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(88, 54, 5, 1);

      // 9. Hochdruck-Dampf- & Gasleitungen mit Manometern und Handrädern
      ctx.fillStyle = '#334155';
      ctx.fillRect(6, 20, 92, 3);
      ctx.fillStyle = '#475569';
      ctx.fillRect(6, 20, 92, 1);

      // Gelbe Erdgas-/Brennstoffleitung
      ctx.fillStyle = '#d97706';
      ctx.fillRect(6, 23.5, 92, 2);
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(6, 23.5, 92, 0.8);

      // Messing-Manometer mit rotem Zeiger
      ctx.fillStyle = '#78350f';
      ctx.beginPath();
      ctx.arc(32, 22, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(32, 22, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#dc2626'; // Zeiger
      ctx.fillRect(32, 20.5, 1, 2.5);

      // Rotes Industrie-Ventilhandrad
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.arc(74, 22, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#991b1b';
      ctx.beginPath();
      ctx.arc(74, 22, 1.5, 0, Math.PI * 2);
      ctx.fill();
    });
    // Kompatibilitäts-Alias
    createTexture('building_refinery', 104, 72, (ctx) => {
      const src = scene.textures.get('building_factory').getSourceImage();
      if (src) ctx.drawImage(src, 0, 0);
    });

    // C1) STARTER-FABRIK TIER 1 (58x42) - Kleine Feldschmiede & Werkstatt
    createTexture('building_factory_t1', 58, 42, (ctx) => {
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(2, 38, 54, 4);

      // Ziegelstein- & Holzwerkstatt
      ctx.fillStyle = '#451a03';
      ctx.fillRect(6, 14, 46, 25);
      ctx.fillStyle = '#78350f';
      ctx.fillRect(8, 15, 42, 23);

      // Einzelschornstein aus Klinkern
      ctx.fillStyle = '#991b1b';
      ctx.fillRect(38, 4, 8, 11);
      ctx.fillStyle = '#7f1d1d';
      ctx.fillRect(37, 3, 10, 2);

      // Amboss und Feuerstelle links
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(12, 20, 16, 18);
      ctx.fillStyle = '#ea580c';
      ctx.fillRect(14, 26, 12, 10);
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(17, 28, 6, 6);

      // Amboss vor der Hütte
      ctx.fillStyle = '#475569';
      ctx.fillRect(32, 28, 8, 6);
      ctx.fillRect(34, 34, 4, 4);
    });

    // C1-T2) INTERMEDIATE-FABRIK TIER 2 (78x56) - Ziegelwerkstatt mit Doppelofen & Abluftrohr
    createTexture('building_factory_t2', 78, 56, (ctx) => {
      // 1. Fundament
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 52, 78, 4);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(2, 48, 74, 5);

      // 2. Mauerwerk-Halle aus Klinkern
      ctx.fillStyle = '#451a03';
      ctx.fillRect(4, 16, 70, 33);
      ctx.fillStyle = '#78350f';
      ctx.fillRect(5, 17, 68, 31);

      // Ziegelstein-Textur
      for (let y = 18; y < 47; y += 4) {
        ctx.fillStyle = '#291104';
        ctx.fillRect(5, y, 68, 1);
      }

      // Dachstuhl (Satteldach mit Schiefer)
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(2, 12, 74, 5);
      ctx.fillStyle = '#334155';
      ctx.fillRect(3, 11, 72, 2);

      // Haupt-Schornstein rechts
      ctx.fillStyle = '#991b1b';
      ctx.fillRect(54, 2, 10, 15);
      ctx.fillStyle = '#7f1d1d';
      ctx.fillRect(53, 1, 12, 2.5);
      ctx.fillStyle = '#475569';
      ctx.fillRect(54, 7, 10, 1.5);
      ctx.fillRect(54, 12, 10, 1.5);

      // Sekundär-Abluftrohr links mit Winkel
      ctx.fillStyle = '#475569';
      ctx.fillRect(14, 8, 4, 12);
      ctx.fillStyle = '#64748b';
      ctx.fillRect(13, 7, 6, 2);

      // Schmelzofen-Bogen Mitte mit Gluthitze
      ctx.fillStyle = '#111827';
      ctx.fillRect(24, 24, 24, 25);
      ctx.fillStyle = '#451a03';
      ctx.fillRect(22, 22, 28, 3);

      // Glühender Ofeninnenraum
      ctx.fillStyle = '#ea580c';
      ctx.fillRect(26, 30, 20, 18);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(28, 34, 16, 13);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(31, 38, 10, 8);

      // Werkbank & Amboss rechts
      ctx.fillStyle = '#334155';
      ctx.fillRect(52, 38, 14, 11);
      ctx.fillStyle = '#475569';
      ctx.fillRect(54, 32, 10, 6);
      ctx.fillRect(56, 28, 6, 4);

      // Barren-Stapel links
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(10, 42, 8, 4);
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(11, 39, 6, 3);
    });

    // C1-T3) ADVANCED-FABRIK TIER 3 (92x64) - Industrie-Gießerei mit Sheddach & Hochkamin
    createTexture('building_factory_t3', 92, 64, (ctx) => {
      // 1. Schwerlast-Betonfundament
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 60, 92, 4);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(2, 55, 88, 6);
      ctx.fillStyle = '#334155';
      ctx.fillRect(2, 54, 88, 1.5);

      // 2. Industriehalle aus Profilstahl
      ctx.fillStyle = '#111827';
      ctx.fillRect(4, 16, 84, 39);
      ctx.fillStyle = '#1f2937';
      ctx.fillRect(5, 17, 82, 37);

      // Sheddach-Aufbauten oben mit Oberlichtern
      ctx.fillStyle = '#111827';
      ctx.beginPath();
      ctx.moveTo(32, 17);
      ctx.lineTo(44, 9);
      ctx.lineTo(44, 17);
      ctx.lineTo(56, 9);
      ctx.lineTo(56, 17);
      ctx.lineTo(68, 9);
      ctx.lineTo(68, 17);
      ctx.closePath();
      ctx.fill();

      // Oberlicht-Verglasung (blau)
      ctx.fillStyle = '#0284c7';
      ctx.beginPath();
      ctx.moveTo(34, 16);
      ctx.lineTo(43, 10.5);
      ctx.lineTo(43, 16);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(46, 16);
      ctx.lineTo(55, 10.5);
      ctx.lineTo(55, 16);
      ctx.closePath();
      ctx.fill();

      // Stahlträger
      for (let cx = 8; cx < 86; cx += 14) {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(cx, 17, 3, 37);
        ctx.fillStyle = '#374151';
        ctx.fillRect(cx + 0.8, 17, 1.4, 37);
      }

      // Großer Industrie-Schornstein links
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(16, 0, 13, 20);
      ctx.fillStyle = '#334155';
      ctx.fillRect(17, 0, 11, 20);
      // Warnstreifen
      ctx.fillStyle = '#ea580c';
      ctx.fillRect(15, 0, 15, 3);
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(15, 3, 15, 2.5);
      ctx.fillStyle = '#ea580c';
      ctx.fillRect(15, 5.5, 15, 2.5);

      // Schmelztiegel-Halle (Mitte) mit flüssigem Metallfluss
      ctx.fillStyle = '#0b0f19';
      ctx.fillRect(28, 28, 30, 27);
      ctx.fillStyle = '#ea580c';
      ctx.fillRect(32, 38, 22, 16);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(34, 42, 18, 11);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(37, 46, 12, 6);

      // Drucktank / Wärmetauscher rechts
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(66, 26, 16, 28);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(67, 27, 14, 26);
      // Druckrohre
      ctx.fillStyle = '#64748b';
      ctx.fillRect(69, 32, 10, 2);
      ctx.fillRect(69, 42, 10, 2);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(72, 36, 4, 4);
    });

    // C2) EXPEDITIONS- & AUFTRAGS-BÜRO (100x70) - 2-stöckige High-Tech Kommandozentrale
    createTexture('building_office', 100, 70, (ctx) => {
      // 1. Granit-Fundament & Eingangspodest mit Stufen
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 66, 100, 4);
      ctx.fillStyle = '#334155';
      ctx.fillRect(2, 62, 96, 5);
      ctx.fillStyle = '#475569';
      ctx.fillRect(2, 61, 96, 1.5);

      // Eingangsstufen vor dem Portal (Mitte)
      ctx.fillStyle = '#475569';
      ctx.fillRect(40, 63, 20, 2);
      ctx.fillStyle = '#64748b';
      ctx.fillRect(42, 61, 16, 2);

      // 2. Gebäude-Fassade (Anthrazit & Navy Architectural Cladding)
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(6, 12, 88, 50);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(7, 13, 86, 48);

      // Horizontale Fassaden-Fugen (Moderne Plattenoptik)
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(7, 26, 86, 1);
      ctx.fillRect(7, 39, 86, 1.5); // Geschosstrennung OG / EG
      ctx.fillRect(7, 53, 86, 1);

      // Auskragendes weißes Dachgesims / Attika mit Beleuchtungskante
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(4, 9, 92, 4);
      ctx.fillStyle = '#f8fafc'; // Helles Dachblech wie beim Labor
      ctx.fillRect(5, 9, 90, 2);
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(5, 11, 90, 1.5);
      // LED-Downlights unter dem Gesims
      for (let dx = 12; dx < 90; dx += 15) {
        ctx.fillStyle = '#e0f2fe';
        ctx.fillRect(dx, 12.5, 3, 1);
      }

      // 3. OBERGESCHOSS: 5 High-Tech Büro- & Leitstandfenster (x=13, 29, 45, 61, 77)
      const upperWindowsX = [13, 29, 45, 61, 77];
      upperWindowsX.forEach((wx, idx) => {
        // Schwarzer Fensterrahmen & Sohlbank
        ctx.fillStyle = '#090d16';
        ctx.fillRect(wx - 1, 16, 12, 16);
        ctx.fillStyle = '#475569';
        ctx.fillRect(wx - 2, 31, 14, 1.5); // Sohlbank

        // Tiefblaues Isolierglas mit Innenraum-Beleuchtung
        ctx.fillStyle = '#0284c7';
        ctx.fillRect(wx, 17, 10, 14);
        ctx.fillStyle = '#0369a1';
        ctx.fillRect(wx, 18, 10, 12);

        // Innenleben: Leuchtende Terminal-Bildschirme im Leitstand
        if (idx === 1 || idx === 3) {
          ctx.fillStyle = '#38bdf8'; // Cyan Terminal
          ctx.fillRect(wx + 2, 24, 4, 3);
        } else if (idx === 2) {
          ctx.fillStyle = '#10b981'; // Grüner Radar-Screen
          ctx.fillRect(wx + 3, 24, 4, 3);
        } else {
          ctx.fillStyle = '#fbbf24'; // Warmes Licht
          ctx.fillRect(wx + 1, 23, 3, 3);
        }

        // Fenstersprosse (Mullion) & Reflexion
        ctx.fillStyle = '#090d16';
        ctx.fillRect(wx + 4.5, 17, 1, 14);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.fillRect(wx + 1, 18, 3, 4); // Glasglanz
      });

      // Geschoss-Zwischenband (Akzentstreifen)
      ctx.fillStyle = '#334155';
      ctx.fillRect(7, 37, 86, 3);
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(7, 39, 86, 1);

      // 4. ERDGESCHOSS: Flankierende Büros & zentraler Glaseingang
      // Linke Fenstergruppe (x=13, 27)
      const lowerWindowsLeft = [13, 27];
      lowerWindowsLeft.forEach(wx => {
        ctx.fillStyle = '#090d16';
        ctx.fillRect(wx - 1, 42, 11, 16);
        ctx.fillStyle = '#475569';
        ctx.fillRect(wx - 2, 57, 13, 1.5);

        ctx.fillStyle = '#0369a1';
        ctx.fillRect(wx, 43, 9, 14);
        // Horizontale Jalousie-Lamellen
        ctx.fillStyle = 'rgba(15, 23, 42, 0.6)';
        for (let jy = 45; jy < 56; jy += 2.5) {
          ctx.fillRect(wx, jy, 9, 0.8);
        }
        ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.fillRect(wx + 1, 44, 2, 4);
      });

      // Rechte Fenstergruppe (x=63, 77)
      const lowerWindowsRight = [63, 77];
      lowerWindowsRight.forEach(wx => {
        ctx.fillStyle = '#090d16';
        ctx.fillRect(wx - 1, 42, 11, 16);
        ctx.fillStyle = '#475569';
        ctx.fillRect(wx - 2, 57, 13, 1.5);

        ctx.fillStyle = '#0369a1';
        ctx.fillRect(wx, 43, 9, 14);
        // Jalousie
        ctx.fillStyle = 'rgba(15, 23, 42, 0.6)';
        for (let jy = 45; jy < 56; jy += 2.5) {
          ctx.fillRect(wx, jy, 9, 0.8);
        }
        ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.fillRect(wx + 1, 44, 2, 4);
      });

      // Haupteingang / Repräsentatives Glasportal (Mitte x=42..58, y=41..62)
      // Freitragendes Glas-/Stahl-Vordach mit Zugstangen
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(41, 37); ctx.lineTo(40, 41);
      ctx.moveTo(59, 37); ctx.lineTo(60, 41);
      ctx.stroke();

      ctx.fillStyle = '#0284c7';
      ctx.fillRect(39, 41, 22, 2.5);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(40, 41, 20, 1);

      // Türportal & Rahmen
      ctx.fillStyle = '#090d16';
      ctx.fillRect(43, 43.5, 14, 18.5);
      // Doppel-Glastür
      ctx.fillStyle = '#0369a1';
      ctx.fillRect(44, 44.5, 12, 17.5);
      // Einladendes helles Foyer-Licht
      ctx.fillStyle = 'rgba(56, 189, 248, 0.35)';
      ctx.fillRect(45, 45.5, 10, 15.5);
      // Vertikaler Türspalt & Edelstahl-Stoßgriffe
      ctx.fillStyle = '#090d16';
      ctx.fillRect(49.5, 43.5, 1, 18.5);
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(48.5, 51, 1, 5); // Griff links
      ctx.fillRect(50.5, 51, 1, 5); // Griff rechts

      // 5. Moderne Formhecken vor dem Gebäude (Architektonische Begrünung)
      // Links
      ctx.fillStyle = '#15803d';
      ctx.fillRect(8, 59, 12, 3);
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(9, 58, 10, 1.5);
      // Rechts
      ctx.fillStyle = '#15803d';
      ctx.fillRect(80, 59, 12, 3);
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(81, 58, 10, 1.5);

      // 6. Dach-Telekommunikationsmast & Satellitenschüssel
      // Funkmast mit Warn-Blinkleuchte
      ctx.fillStyle = '#475569';
      ctx.fillRect(22, 1, 3, 9);
      ctx.fillRect(19, 4, 9, 1.5);
      ctx.fillRect(20.5, 0, 6, 1);
      // Rote Flugsicherheitsleuchte
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(22.5, -1, 2, 2);

      // Satellitenantenne (Rechts)
      ctx.fillStyle = '#64748b';
      ctx.fillRect(76, 3, 3, 7);
      ctx.beginPath();
      ctx.arc(77.5, 4, 6, Math.PI * 0.7, Math.PI * 1.8);
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(74, 2, 2, 2);
    });

    // C2-T1) STARTER-BÜRO TIER 1 (52x40) - Bauleitungs-Container
    createTexture('building_office_t1', 52, 40, (ctx) => {
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(2, 36, 48, 4);

      // Container-Stahlwände (Marineblau)
      ctx.fillStyle = '#1e3a8a';
      ctx.fillRect(4, 12, 44, 25);
      ctx.fillStyle = '#1d4ed8';
      for (let x = 6; x < 46; x += 4) {
        ctx.fillRect(x, 13, 2, 23);
      }

      // Flachdach mit Kante
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(2, 9, 48, 3.5);

      // Bürofenster mit warmem Licht
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(8, 17, 14, 10);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(9, 18, 12, 8);
      ctx.fillStyle = '#ca8a04';
      ctx.fillRect(9, 21, 12, 1);
      ctx.fillRect(9, 24, 12, 1);

      // Stahltür rechts mit Trittstufe
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(28, 16, 12, 20);
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(36, 25, 2, 2);
      ctx.fillStyle = '#475569';
      ctx.fillRect(26, 36, 16, 2);

      // Eingangsblende mit dezentem Leuchtstreifen
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(10, 12, 12, 3.5);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(11, 13, 10, 1.2);
    });

    // D) MODERNES WEISSES LABOR (108x72) - Exaktes Design nach dem Foto (Modernist White Lab / MVZ Clotten)
    createTexture('building_lab', 108, 72, (ctx) => {
      // 1. Asphalt & Bürgersteig-Kante
      ctx.fillStyle = '#64748b';
      ctx.fillRect(0, 69, 108, 3);
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(2, 68, 104, 1.5);

      // 2. Strahlend weißer Baukörper mit asymmetrischem, modernem Pultdach (steigt nach rechts an!)
      ctx.fillStyle = '#f8fafc'; // Haupt-Weiß der Fassade
      ctx.beginPath();
      ctx.moveTo(6, 68);
      ctx.lineTo(6, 16);
      ctx.lineTo(102, 4);  // Dachkante steigt steil nach rechts an wie im Foto
      ctx.lineTo(102, 68);
      ctx.closePath();
      ctx.fill();

      // Feine Fassaden-Schattierung & Kontur
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Obere Dachabdeckung / Attika-Abschlussblech
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(5, 15.5);
      ctx.lineTo(103, 3.5);
      ctx.stroke();

      // 3. OBERGESCHOSS 3 (Attikageschoss direkt unter der schrägen Dachkante)
      // Dunkles Fensterband rechts (von x=42 bis x=98, y=8 bis y=16)
      ctx.fillStyle = '#0f172a'; // Fensterrahmen
      ctx.fillRect(42, 8, 56, 8.5);
      ctx.fillStyle = '#1e293b'; // Glasfläche
      ctx.fillRect(43, 9, 54, 6.5);
      // Vertikale Pfostenteilung
      ctx.fillStyle = '#0f172a';
      for (let mx = 47; mx < 97; mx += 5) {
        ctx.fillRect(mx, 8, 1, 8.5);
      }
      // Helle Himmel-Reflexion im Glas
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(44, 10, 52, 1);

      // 4. OBERGESCHOSS 2 (Mitte oben)
      // Links: Offene eingeschnittene Loggia / Terrasse (Ausschnitt im Baukörper wie im Foto!)
      ctx.fillStyle = '#cbd5e1'; // Tiefer Schatten der Decke
      ctx.fillRect(10, 19, 32, 9);
      ctx.fillStyle = '#94a3b8'; // Rückwand der Loggia
      ctx.fillRect(12, 20, 28, 7.5);
      ctx.fillStyle = '#334155'; // Schiebetüren hinten
      ctx.fillRect(16, 21, 20, 6.5);
      ctx.fillStyle = '#e2e8f0'; // Brüstungskante
      ctx.fillRect(10, 27, 32, 1.5);

      // Rechts: Fensterband im 2. OG (x=44 bis 66, y=20 bis 27)
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(44, 20, 24, 7.5);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(45, 21, 22, 5.5);
      for (let mx = 49; mx < 68; mx += 5) {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(mx, 20, 1, 7.5);
      }
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(46, 22, 20, 1);

      // 5. OBERGESCHOSS 1 (Durchgehendes langes horizontales Fensterband über fast die ganze Breite)
      // Von x=10 bis x=88, y=32 bis 40
      ctx.fillStyle = '#0f172a'; // Rahmen
      ctx.fillRect(10, 31.5, 78, 9);
      ctx.fillStyle = '#1e293b'; // Glas
      ctx.fillRect(11, 32.5, 76, 7);
      // Gleichmäßige Fenster-Pfosten wie im Foto
      ctx.fillStyle = '#0f172a';
      for (let mx = 15; mx < 88; mx += 5) {
        ctx.fillRect(Math.round(mx), 31.5, 1, 9);
      }
      // Durchgehende Glas-Reflexion
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(12, 33.5, 74, 1);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.fillRect(12, 35.5, 74, 0.7);

      // Weißes Trennband zwischen 1. OG und EG
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(8, 40.5, 92, 4);

      // 6. ERDGESCHOSS
      // Links: Vollflächig verglaste Lobby & Automatiktüren (x=10 bis 54, y=45 bis 68)
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(10, 44.5, 46, 23.5);
      // Kühles modernes Labor-Licht von innen
      ctx.fillStyle = 'rgba(56, 189, 248, 0.28)';
      ctx.fillRect(12, 46.5, 42, 20.5);

      // Vertikale Glaspfosten
      ctx.fillStyle = '#334155';
      for (let mx = 17; mx < 54; mx += 7) {
        ctx.fillRect(mx, 44.5, 1, 23.5);
      }

      // Automatische Schiebetür in der Mitte
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(29, 47, 14, 21);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(31, 49, 10, 17);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(35.5, 47, 1.5, 21); // Mittiger Türspalt

      // Horizontales weißes Vordach über dem Eingang (Auskragung wie im Foto)
      ctx.fillStyle = '#94a3b8'; // Schatten unter Vordach
      ctx.fillRect(8, 45.5, 50, 1.5);
      ctx.fillStyle = '#ffffff'; // Vordach-Oberseite
      ctx.fillRect(8, 43.5, 50, 2.5);

      // Rechts: Große weiße Wandfläche mit rotem Logo und Schriftzug "LABOR"
      // Rotes Firmen-Logo (C-förmiger roter Kreis wie im Foto)
      ctx.fillStyle = '#dc2626'; // Karminrot
      ctx.beginPath();
      ctx.arc(63, 53, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f8fafc'; // Innen weiß ausgestanzt
      ctx.beginPath();
      ctx.arc(63, 53, 2.4, 0, Math.PI * 2);
      ctx.fill();
      // Roter Mittelpunkt
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(63, 52, 2, 2);

      // 7. BEGRÜNUNG VOR DEM GEBÄUDE (aus dem Foto: Grüne Hecke & Bäumchen)
      // Formhecke rechts vor der weißen Wand
      ctx.fillStyle = '#15803d';
      ctx.fillRect(58, 64, 44, 4);
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(59, 63, 42, 2);
      ctx.fillStyle = '#16a34a';
      for (let bx = 60; bx < 100; bx += 3) {
        ctx.fillRect(bx, 62, 2, 2);
      }

      // Gestützter Baum links vor dem Eingang (mit 2 Pfählen wie im Foto)
      ctx.fillStyle = '#78350f';
      ctx.fillRect(15, 52, 1, 16);
      ctx.fillRect(19, 52, 1, 16);
      ctx.fillStyle = '#92400e';
      ctx.fillRect(14, 59, 7, 1); // Querverstrebung
      ctx.fillStyle = '#15803d'; // Laubkrone
      ctx.beginPath();
      ctx.arc(17, 48, 5.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.arc(16, 47, 3.5, 0, Math.PI * 2);
      ctx.fill();
    });

    // =======================================================
    // 5b. STEINSAMMLER NPC (GEOLOGE AUF DER ERDOBERFLÄCHE: 16x22 REALISTISCHER MASSSTAB)
    // =======================================================
    createTexture('npc_geologist', 16, 22, (ctx) => {
      // 1. Robuste Stiefel
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(4, 18, 3, 4);
      ctx.fillRect(9, 18, 3, 4);

      // 2. Beine & Geologen-Hose
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(4, 13, 3, 5);
      ctx.fillRect(9, 13, 3, 5);

      // 3. Körper & Geologen-Schutzanzug (Teal mit gelbem Sicherheitsgurt)
      ctx.fillStyle = '#0d9488';
      ctx.fillRect(3, 7, 10, 6);
      ctx.fillStyle = '#14b8a6';
      ctx.fillRect(4, 8, 8, 5);
      ctx.fillStyle = '#fbbf24'; // Warnstreifen / Gürtel
      ctx.fillRect(3, 11, 10, 2);

      // 4. Rucksack mit Mineralproben (links)
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(1, 7, 2, 7);
      ctx.fillStyle = '#10b981'; // Smaragd-Probe
      ctx.fillRect(1, 5, 2, 2);

      // 5. Arm & Geologen-Hammer (rechts)
      ctx.fillStyle = '#0d9488';
      ctx.fillRect(13, 8, 2, 5);
      ctx.fillStyle = '#64748b'; // Hammer-Stiel
      ctx.fillRect(14, 12, 1, 5);
      ctx.fillStyle = '#94a3b8'; // Hammerkopf
      ctx.fillRect(13, 16, 3, 2);

      // 6. Kopf & Schutzhelm mit Visier (passend zum Crawler-Cockpit)
      ctx.fillStyle = '#fed7aa'; // Gesicht
      ctx.fillRect(5, 3, 6, 4);
      ctx.fillStyle = '#0284c7'; // Visier
      ctx.fillRect(7, 4, 4, 2);

      // Bergbau-Schutzhelm
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(4, 1, 8, 3);
      ctx.fillRect(3, 3, 10, 1);

      // Kopflampe / Stirnleuchte
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(6, 0, 3, 2);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(7, 1, 1, 1);
    });

    // =======================================================
    // 5c. KAUFBARE GEBÄUDE & EXPANSIONEN
    // =======================================================

    // 1. Freier Bauplatz (Markierte Baustelle) - 76x44
    createTexture('building_plot', 76, 44, (ctx) => {
      // Beton-Fundamentgrube mit Randschalung
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(2, 24, 72, 20);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(4, 25, 68, 17);
      ctx.fillStyle = '#334155';
      ctx.fillRect(6, 22, 64, 4);

      // Bewehrungsstahl-Gitter (Rebar-Mesh) im Fundament
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1;
      for (let x = 10; x < 68; x += 6) {
        ctx.beginPath();
        ctx.moveTo(x, 26); ctx.lineTo(x, 40);
        ctx.stroke();
      }
      for (let y = 28; y < 40; y += 4) {
        ctx.beginPath();
        ctx.moveTo(8, y); ctx.lineTo(68, y);
        ctx.stroke();
      }

      // Schwarz-Gelbe Gefahren-Absperrung (Hazard-Streifen)
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(6, 21, 64, 3);
      for (let x = 7; x < 68; x += 8) {
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(x, 21, 4, 3);
      }

      // Baustellen-Pylonen mit Reflektorstreifen
      const cones = [5, 67];
      cones.forEach(cx => {
        ctx.fillStyle = '#ea580c';
        ctx.beginPath();
        ctx.moveTo(cx + 2, 9);
        ctx.lineTo(cx + 5, 22);
        ctx.lineTo(cx - 1, 22);
        ctx.closePath();
        ctx.fill();
        // Weißer Reflektorring
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(cx, 15, 4, 2.5);
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(cx - 2, 22, 8, 2); // Fuß
      });

      // Digitaler Laser-Vermessungs-Teleskopstab (Links)
      ctx.fillStyle = '#64748b';
      ctx.fillRect(16, 8, 1.5, 14);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(14.5, 6, 4.5, 4);
      // Grüner Vermessungs-Laserstrahl
      ctx.fillStyle = '#10b981';
      ctx.fillRect(17, 7.5, 48, 1);

      // Holographisches Bauschild mit Bauplan-Grid
      ctx.fillStyle = 'rgba(14, 165, 233, 0.15)';
      ctx.fillRect(24, 2, 30, 18);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1;
      ctx.strokeRect(24, 2, 30, 18);
      // Bauplan-Gitterlinien
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
      ctx.beginPath();
      ctx.moveTo(24, 8); ctx.lineTo(54, 8);
      ctx.moveTo(24, 14); ctx.lineTo(54, 14);
      ctx.moveTo(34, 2); ctx.lineTo(34, 20);
      ctx.moveTo(44, 2); ctx.lineTo(44, 20);
      ctx.stroke();
    });



    // 3. Geothermie-Kraftwerk & Energie-Reaktor (gx: 47) - 96x76
    createTexture('building_powerplant', 96, 76, (ctx) => {
      // 1. Massiver Panzerbeton-Sockel
      ctx.fillStyle = '#090d16';
      ctx.fillRect(2, 54, 92, 22);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(4, 52, 88, 4);
      ctx.fillStyle = '#334155';
      ctx.fillRect(6, 44, 84, 9);
      // Kühlmittel-Ablassventile
      for (let x = 10; x < 86; x += 15) {
        ctx.fillStyle = '#475569';
        ctx.fillRect(x, 47, 4, 4);
        ctx.fillStyle = '#10b981';
        ctx.fillRect(x + 1.5, 48.5, 1, 1);
      }

      // 2. Reaktor-Sicherheitskuppel (Mitte: x=24..72, y=14..44)
      ctx.fillStyle = '#1e2430';
      ctx.beginPath();
      ctx.arc(48, 44, 26, Math.PI, 0);
      ctx.fill();
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Strahlungsschild-Segmente
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(48, 44, 22, Math.PI, 0);
      ctx.fill();

      // Pulsierender Fusions- / Geothermie-Plasmakern (Smaragdgrün & Mint)
      ctx.fillStyle = '#064e3b';
      ctx.beginPath();
      ctx.arc(48, 44, 18, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = '#059669';
      ctx.beginPath();
      ctx.arc(48, 44, 13, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(48, 44, 8, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = '#a7f3d0';
      ctx.fillRect(45, 36, 6, 5); // Weiß-grünes Kernlicht

      // Magnetische Einschlussspulen über der Kuppel
      ctx.strokeStyle = '#34d399';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(48, 44, 24, Math.PI * 1.15, Math.PI * 1.85);
      ctx.stroke();

      // 3. Flankierende Kühltürme & Dampf-Vents (Links & Rechts)
      const towers = [6, 72];
      towers.forEach(tx => {
        ctx.fillStyle = '#151c28';
        ctx.fillRect(tx, 18, 18, 28);
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(tx + 1, 19, 16, 26);
        // Kühllamellen
        ctx.fillStyle = '#0f172a';
        for (let ly = 22; ly < 42; ly += 4) {
          ctx.fillRect(tx + 3, ly, 12, 2);
        }
        // Kondensatkrone
        ctx.fillStyle = '#334155';
        ctx.fillRect(tx - 1, 15, 20, 4);
        ctx.fillStyle = '#10b981';
        ctx.fillRect(tx + 1, 17, 16, 1.5);
      });

      // 4. Hochspannungs-Transformatoren & Isolatoren auf dem Dach
      ctx.fillStyle = '#475569';
      ctx.fillRect(44, 6, 8, 9);
      // Keramik-Isolatoren (Rippen)
      ctx.fillStyle = '#d97706';
      ctx.fillRect(45, 2, 6, 2);
      ctx.fillRect(45, 4, 6, 2);
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(47, 0, 2, 2);
    });

    // 4. Automatisierter Drohnen-Hangar (gx: -3) - 84x70
    createTexture('building_drone_hangar', 84, 70, (ctx) => {
      // 1. Schweres Stahlbeton-Fundament
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(2, 48, 80, 22);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(4, 46, 76, 4);
      ctx.fillStyle = '#334155';
      ctx.fillRect(6, 38, 72, 9);

      // 2. Unterirdischer Hangar & Panzertor-Dach
      ctx.fillStyle = '#090d16';
      ctx.fillRect(14, 18, 56, 28);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(16, 20, 52, 24);

      // Gepanzerte Schiebetore links & rechts
      ctx.fillStyle = '#334155';
      ctx.fillRect(16, 20, 10, 24);
      ctx.fillRect(58, 20, 10, 24);
      // Nieten auf Toren
      ctx.fillStyle = '#64748b';
      for (let y = 24; y < 42; y += 5) {
        ctx.fillRect(20, y, 2, 2);
        ctx.fillRect(62, y, 2, 2);
      }

      // 3. Landeplattform mit Beleuchtung & Markierung [ H ]
      ctx.fillStyle = '#111827';
      ctx.fillRect(26, 22, 32, 20);
      ctx.fillStyle = '#f59e0b'; // Gelbes Landekreuz / H
      ctx.fillRect(38, 26, 3, 12);
      ctx.fillRect(45, 26, 3, 12);
      ctx.fillRect(38, 30, 10, 3);

      // Gelandete Mini-Aufklärungsdrohne (High-Tech Hexacopter)
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(40, 27, 6, 5); // Rumpf
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(42, 28, 2, 2); // Sensorlinse
      // Rotor-Ausleger
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(36, 25, 4, 1);
      ctx.fillRect(46, 25, 4, 1);
      ctx.fillRect(36, 33, 4, 1);
      ctx.fillRect(46, 33, 4, 1);

      // Grüne & blaue Anflug-LEDs
      ctx.fillStyle = '#10b981';
      ctx.fillRect(27, 23, 2, 2);
      ctx.fillRect(57, 23, 2, 2);
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(27, 39, 2, 2);
      ctx.fillRect(57, 39, 2, 2);

      // 4. Telemetrie-Radarschüssel & Richtfunk
      ctx.fillStyle = '#475569';
      ctx.fillRect(66, 4, 3, 14);
      ctx.beginPath();
      ctx.arc(67.5, 6, 7, Math.PI * 0.7, Math.PI * 1.8);
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(64, 4, 2, 2);
    });

    // G) SCHACHTEINGANG & STOLLEN-ÜBERDACHUNG (76x52) - Schweres Bergbau-Fördergerüst
    createTexture('building_mine_entrance', 76, 52, (ctx) => {
      // 1. Massives Beton-Fundament mit Ankerplatten
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 48, 14, 4);
      ctx.fillRect(62, 48, 14, 4);
      ctx.fillStyle = '#334155';
      ctx.fillRect(1, 45, 12, 4);
      ctx.fillRect(63, 45, 12, 4);
      ctx.fillStyle = '#475569';
      ctx.fillRect(2, 43, 10, 2);
      ctx.fillRect(64, 43, 10, 2);

      // Ankerbolzen
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(4, 44, 2, 2);
      ctx.fillRect(8, 44, 2, 2);
      ctx.fillRect(66, 44, 2, 2);
      ctx.fillRect(70, 44, 2, 2);

      // 2. Stahlfachwerk-Pfeiler links & rechts
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(4, 12, 7, 32);
      ctx.fillRect(65, 12, 7, 32);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(5, 13, 5, 30);
      ctx.fillRect(66, 13, 5, 30);

      // Knotenbleche & Schrägverstrebungen
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(10, 32); ctx.lineTo(24, 12);
      ctx.moveTo(66, 32); ctx.lineTo(52, 12);
      ctx.stroke();

      // Nietenreihen an den Pfeilern
      ctx.fillStyle = '#64748b';
      for (let y = 16; y < 42; y += 6) {
        ctx.fillRect(7, y, 1.5, 1.5);
        ctx.fillRect(68, y, 1.5, 1.5);
      }

      // Not-Aus-Schaltkasten am linken Pfeiler
      ctx.fillStyle = '#eab308'; // Gelber Schaltkasten
      ctx.fillRect(1, 26, 3.5, 6);
      ctx.fillStyle = '#ef4444'; // Roter Pilzkopf-Taster
      ctx.fillRect(1.5, 27.5, 2.5, 2.5);

      // 3. Haupt-Querträger mit scharfer Schwarz-Gelber Warnschraffur
      ctx.fillStyle = '#090d16';
      ctx.fillRect(2, 10, 72, 7);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(3, 11, 70, 5);

      for (let x = 4; x < 72; x += 7) {
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.moveTo(x, 16);
        ctx.lineTo(x + 3.5, 11);
        ctx.lineTo(x + 6, 11);
        ctx.lineTo(x + 2.5, 16);
        ctx.closePath();
        ctx.fill();
      }

      // 4. Industrielles Satteldach / Wellblech-Haube
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.moveTo(0, 11);
      ctx.lineTo(38, 1);
      ctx.lineTo(76, 11);
      ctx.lineTo(74, 13);
      ctx.lineTo(38, 4);
      ctx.lineTo(2, 13);
      ctx.closePath();
      ctx.fill();

      // Zinkblech-Dachfläche mit Falzen
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.moveTo(2, 11);
      ctx.lineTo(38, 2.5);
      ctx.lineTo(74, 11);
      ctx.lineTo(73, 12);
      ctx.lineTo(38, 3.5);
      ctx.lineTo(3, 12);
      ctx.closePath();
      ctx.fill();

      // Firstblech & Dachrinne
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(36, 0.5, 4, 2.5);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(2, 11, 72, 1);

      // 5. Seilscheibe (Förderrad) im Dachfirst
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(38, 11, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(37.5, 10.5, 1, 1); // Achsbolzen

      // Förderseil in den Schacht
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(37.5, 16, 1, 36);

      // 6. Explosionsgeschützte Industrie-Grubenleuchte mit volumetrischem Lichtkegel
      ctx.fillStyle = '#334155';
      ctx.fillRect(35, 17, 6, 3); // Fassung mit Schutzkorb
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(36, 20, 4, 3); // Birne
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(37, 21, 2, 2); // Glühwendel

      // Weicher Lichtkegel in die Tiefe
      ctx.fillStyle = 'rgba(251, 191, 36, 0.18)';
      ctx.beginPath();
      ctx.moveTo(38, 23);
      ctx.lineTo(16, 52);
      ctx.lineTo(60, 52);
      ctx.closePath();
      ctx.fill();
    });

    // D1) STARTER-LABOR TIER 1 (54x40) - Geologen-Feldhütte
    createTexture('building_lab_t1', 54, 40, (ctx) => {
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(2, 36, 50, 4);

      // Hütte aus hellgrauen Holzplanken
      ctx.fillStyle = '#334155';
      ctx.fillRect(6, 14, 42, 23);
      ctx.fillStyle = '#475569';
      for (let x = 8; x < 46; x += 4) {
        ctx.fillRect(x, 15, 2.5, 21);
      }

      // Schrägdach mit Zinkblech
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(4, 10, 46, 4);
      ctx.fillStyle = '#64748b';
      ctx.fillRect(5, 9, 44, 2);

      // Fenster mit blauem Scanner-/Lampen-Licht
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(12, 18, 12, 10);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(13, 19, 10, 8);
      ctx.fillStyle = '#bae6fd';
      ctx.fillRect(14, 20, 3, 3);

      // Eingangstür
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(28, 18, 12, 18);
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(36, 26, 2, 2);

      // Dünne Funk-/Messantenne auf dem Dach
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(10, 1, 1.5, 9);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(9, 0, 3.5, 2);
    });

    // D2) INTERMEDIATE-LABOR TIER 2-3 (80x56) - Solide Forschungsstation
    createTexture('building_lab_t2', 80, 56, (ctx) => {
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(2, 50, 76, 5);

      // High-Tech Fassade (Weiß/Grau/Cyan)
      ctx.fillStyle = '#334155';
      ctx.fillRect(6, 12, 68, 39);
      ctx.fillStyle = '#64748b';
      ctx.fillRect(8, 13, 64, 37);

      // Doppelfenster mit Analyse-Konsolen
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(14, 18, 24, 16);
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(16, 20, 20, 12);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(18, 22, 16, 2);

      // Schleusentür mit Bullauge
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(44, 18, 18, 32);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(49, 24, 8, 8);

      // Satellitenschüssel auf dem Dach
      ctx.fillStyle = '#94a3b8';
      ctx.beginPath();
      ctx.arc(62, 7, 7, Math.PI * 0.8, Math.PI * 1.8);
      ctx.stroke();
      ctx.fillRect(60, 8, 4, 4);
    });

    // H) SPRECHBLASE FÜR STEINEFORSCHER (18x14)
    createTexture('speech_bubble', 18, 14, (ctx) => {
      // Äußerer Kontur-Rand (Dunkelblau/Grau)
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.roundRect(0, 0, 18, 11, 3);
      ctx.fill();
      
      // Kleiner Zeiger nach unten zum Forscher
      ctx.beginPath();
      ctx.moveTo(6, 11);
      ctx.lineTo(9, 14);
      ctx.lineTo(12, 11);
      ctx.fill();

      // Weicher, heller Karten-Hintergrund
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.roundRect(1, 1, 16, 9, 2);
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(7, 10);
      ctx.lineTo(9, 13);
      ctx.lineTo(11, 10);
      ctx.fill();

      // Drei prägnante Punkte (...) in Cyan/Blau
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(4, 5, 2, 2);
      ctx.fillRect(8, 5, 2, 2);
      ctx.fillRect(12, 5, 2, 2);
    });

    // =======================================================
    // 6. PARTIKEL (DEZENT & UNGÜLTIG)
    // =======================================================
    createTexture('particle_rock', 5, 5, (ctx) => {
      ctx.fillStyle = '#78716c';
      ctx.fillRect(0, 0, 5, 5);
      ctx.fillStyle = '#57534e';
      ctx.fillRect(1, 1, 3, 3);
    });
    createTexture('particle_dust_grey', 4, 4, (ctx) => {
      ctx.fillStyle = '#a8a29e';
      ctx.fillRect(1, 0, 2, 4);
      ctx.fillRect(0, 1, 4, 2);
      ctx.fillStyle = '#78716c';
      ctx.fillRect(1, 1, 2, 2);
    });
    createTexture('particle_dust_brown', 4, 4, (ctx) => {
      ctx.fillStyle = '#92400e';
      ctx.fillRect(1, 0, 2, 4);
      ctx.fillRect(0, 1, 4, 2);
      ctx.fillStyle = '#b45309';
      ctx.fillRect(1, 1, 2, 2);
    });
    createTexture('particle_dust_dark', 3, 3, (ctx) => {
      ctx.fillStyle = '#44403c';
      ctx.fillRect(0, 0, 3, 3);
    });
    createTexture('particle_spark', 3, 3, (ctx) => {
      ctx.fillStyle = '#d6d3d1';
      ctx.fillRect(0, 0, 3, 3);
    });
    createTexture('particle_thrust', 6, 6, (ctx) => {
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(0, 0, 6, 6);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(1, 1, 4, 4);
      ctx.fillStyle = '#e0f2fe';
      ctx.fillRect(2, 2, 2, 2);
    });
    createTexture('particle_smoke', 8, 8, (ctx) => {
      ctx.fillStyle = 'rgba(148, 163, 184, 0.45)';
      ctx.beginPath();
      ctx.arc(4, 4, 3.5, 0, Math.PI * 2);
      ctx.fill();
    });

    // =======================================================
    // 9. UNTERTAGE-INFRASTRUKTUR & BASISLAGER
    // =======================================================

    // Pneumatische Förderstation / Rohrpost (36x48)
    createTexture('station_pneumatic_tube', 36, 48, (ctx) => {
      // 1. Stabile Wandverankerung / Stahlplatte in den Felsen
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 4, 36, 42);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(2, 6, 32, 38);
      // Felsanker-Bolzen
      ctx.fillStyle = '#64748b';
      ctx.fillRect(3, 8, 2, 2);
      ctx.fillRect(31, 8, 2, 2);
      ctx.fillRect(3, 40, 2, 2);
      ctx.fillRect(31, 40, 2, 2);

      // 2. Vakuum-Transportrohr (vertikal nach oben)
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(10, 0, 16, 26);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(12, 0, 12, 26);
      // Glanzkante Glaszylinder
      ctx.fillStyle = '#e0f2fe';
      ctx.fillRect(13, 0, 3, 26);
      // Saug-Strömungspfeile nach oben
      ctx.fillStyle = '#10b981';
      ctx.fillRect(17, 4, 2, 4);
      ctx.fillRect(16, 3, 4, 2);
      ctx.fillRect(17, 13, 2, 4);
      ctx.fillRect(16, 12, 4, 2);

      // 3. Rohrschellen & Druckluftventile
      ctx.fillStyle = '#090d16';
      ctx.fillRect(8, 7, 20, 3);
      ctx.fillRect(8, 20, 20, 3);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(9, 8, 18, 1.5);
      ctx.fillRect(9, 21, 18, 1.5);

      // 4. Trichtereinlauf / Lade-Schleuse unten
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.moveTo(6, 26);
      ctx.lineTo(30, 26);
      ctx.lineTo(26, 42);
      ctx.lineTo(10, 42);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.moveTo(8, 28);
      ctx.lineTo(28, 28);
      ctx.lineTo(24, 40);
      ctx.lineTo(12, 40);
      ctx.closePath();
      ctx.fill();

      // Grüne Status-Leuchte "BEREIT"
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(18, 34, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#a7f3d0';
      ctx.beginPath();
      ctx.arc(17, 33, 1.5, 0, Math.PI * 2);
      ctx.fill();
    });

    // Geothermie-Zapfsäule / Basislager-Energieterminal (36x48)
    createTexture('station_geothermal', 36, 48, (ctx) => {
      // 1. Felsbefestigung & Wärmeisolierte Rückwand
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(2, 6, 32, 40);
      ctx.fillStyle = '#292524'; // Vulkan-Graphit
      ctx.fillRect(4, 8, 28, 36);

      // 2. Kupferne Geothermie-Dampfrohre
      ctx.fillStyle = '#b45309';
      ctx.fillRect(5, 0, 5, 46);
      ctx.fillRect(26, 0, 5, 46);
      ctx.fillStyle = '#d97706';
      ctx.fillRect(6, 0, 3, 46);
      ctx.fillRect(27, 0, 3, 46);

      // 3. Glühender Magma-Energie-Konverter im Zentrum
      ctx.fillStyle = '#090d16';
      ctx.fillRect(11, 12, 14, 20);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(12, 13, 12, 18);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(13, 15, 10, 14);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(15, 17, 6, 10);

      // 4. Zapf-Arm & Ladekabel mit Magnethalter
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(18, 32);
      ctx.quadraticCurveTo(24, 42, 18, 44);
      ctx.stroke();

      // Cyan-farbene Ladekupplung
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(15, 42, 6, 5);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(16, 43, 4, 3);

      // Batterie-Blitzsymbol oben
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(17, 3, 2, 5);
      ctx.fillRect(16, 5, 4, 2);
    });

    // Untertage-Tankanlage / Treibstoff-Terminal (36x48)
    createTexture('station_fuel', 36, 48, (ctx) => {
      // 1. Schwerer Panzerstahl-Körper & Sockel
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(2, 6, 32, 40);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(4, 8, 28, 36);

      // 2. Vertikale Kerosin-Drucktanks links & rechts
      ctx.fillStyle = '#b45309';
      ctx.fillRect(5, 4, 5, 40);
      ctx.fillRect(26, 4, 5, 40);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(6, 4, 3, 40);
      ctx.fillRect(27, 4, 3, 40);

      // 3. Digital-Anzeige & Messinstrumente im Zentrum
      ctx.fillStyle = '#020617';
      ctx.fillRect(11, 12, 14, 18);
      ctx.fillStyle = '#0369a1';
      ctx.fillRect(12, 13, 12, 8);
      // Digitaler Füllbalken
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(13, 15, 10, 4);

      // Status-LEDs
      ctx.fillStyle = '#10b981';
      ctx.fillRect(13, 24, 3, 3);
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(17, 24, 3, 3);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(21, 24, 3, 3);

      // 4. Robuster Schwenkarm-Sockel & Zapfschlauch
      ctx.fillStyle = '#334155';
      ctx.fillRect(14, 32, 8, 8);
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(18, 34);
      ctx.quadraticCurveTo(24, 42, 18, 44);
      ctx.stroke();

      // Zapfpistolen-Kupplung (Goldgelb / Orange)
      ctx.fillStyle = '#d97706';
      ctx.fillRect(15, 42, 6, 5);
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(16, 43, 4, 3);

      // Zapfsäulen-Symbol / Kanister oben
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(16, 1, 4, 5);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(17, 3, 2, 2);
    });

    // =======================================================
    // 10. OPTISCHE OBERFLÄCHEN-AUSBAUSTUFEN (KRAN, STRASSE, LATERNE)
    // =======================================================

    // Straße wurde auf Spielerwunsch komplett entfernt.
    createTexture('surface_road_paved', 1, 1, () => {});

    // Schwerlast-Hafen/Schacht-Kran im Hintergrund (64x80)
    createTexture('surface_crane', 64, 80, (ctx) => {
      // Stahlgitter-Turm in Caterpillar-Gelb
      ctx.strokeStyle = '#ca8a04';
      ctx.lineWidth = 2.5;

      // Vertikale Stützen
      ctx.strokeRect(16, 20, 32, 58);
      // Diagonale Streben
      ctx.beginPath();
      ctx.moveTo(16, 20); ctx.lineTo(48, 45);
      ctx.moveTo(48, 20); ctx.lineTo(16, 45);
      ctx.moveTo(16, 45); ctx.lineTo(48, 70);
      ctx.moveTo(48, 45); ctx.lineTo(16, 70);
      ctx.stroke();

      // Ausleger oben (horizontal)
      ctx.fillStyle = '#eab308';
      ctx.fillRect(0, 14, 64, 7);
      ctx.fillStyle = '#ca8a04';
      ctx.fillRect(0, 19, 64, 2);

      // Gegengewicht links
      ctx.fillStyle = '#475569';
      ctx.fillRect(2, 8, 12, 12);

      // Seilzug & Haken rechts
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(48, 21, 1, 24);
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(46, 45, 5, 4);

      // Rotes Hindernisfeuer / Warnblinker ganz oben
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(32, 10, 3, 0, Math.PI * 2);
      ctx.fill();
    });

    // Industrie-Straßenlaterne mit warmem LED-Licht (16x48)
    createTexture('surface_lantern', 16, 48, (ctx) => {
      // Mast
      ctx.fillStyle = '#334155';
      ctx.fillRect(7, 6, 2, 40);
      ctx.fillStyle = '#475569';
      ctx.fillRect(5, 44, 6, 4); // Fuß

      // Lampenkopf gebogen
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(2, 4, 8, 3);
      // Warmweißes LED-Leuchtfeld
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(3, 7, 6, 2);
    });
  }
}
