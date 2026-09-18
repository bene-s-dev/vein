import { LeaderboardService } from '../core/LeaderboardService.js';
import { SaveSystem } from '../core/SaveSystem.js';
import { soundFx } from '../core/SoundEffects.js';
import { icon, refreshIcons } from './IconHelper.js';
import { TutorialModal } from './TutorialModal.js';

/**
 * Erzeugt das exakte, pixel-perfekte PNG-Bild des VEIN-Startbildschirms (1:1 wie im Screenshot).
 * VÖLLIG GETRENNT von der eigentlichen Spielwelt - kein Abbau, kein Kamerasprung, kein Treibstoffverbrauch.
 */
export function generateShowcasePng(scene) {
  if (!scene || !scene.textures) return null;

  const TILE = 32;
  const screenW = Math.max(window.innerWidth || 0, document.documentElement?.clientWidth || 0, 800);
  const screenH = Math.max(window.innerHeight || 0, document.documentElement?.clientHeight || 0, 420);

  // Berechne Spalten und Zeilen basierend auf dem Bildschirm
  const cols = Math.max(22, Math.ceil(screenW / TILE));
  const rows = Math.max(12, Math.ceil(screenH / TILE));
  const width = cols * TILE;
  const height = rows * TILE;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.imageSmoothingEnabled = false;

  const getImg = (key) => {
    if (!scene.textures.exists(key)) return null;
    const tex = scene.textures.get(key);
    return tex ? tex.getSourceImage() : null;
  };

  const imgShaft = getImg('tile_shaft_stone');
  const imgDirt = getImg('tile_dirt');
  const imgStone = getImg('tile_stone');
  const imgGold = getImg('ore_gold');
  const imgDiamond = getImg('ore_diamond');
  const imgRuby = getImg('ore_ruby');
  const imgEmerald = getImg('ore_emerald');

  const drawTile = (img, c, r) => {
    if (img) ctx.drawImage(img, c * TILE, r * TILE, TILE, TILE);
  };

  const drawOreTile = (oreImg, c, r) => {
    if (imgStone) ctx.drawImage(imgStone, c * TILE, r * TILE, TILE, TILE);
    if (oreImg) ctx.drawImage(oreImg, c * TILE, r * TILE, TILE, TILE);
  };

  // 1. Schachtstein-Hintergrund für die gesamte Höhle
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      drawTile(imgShaft, c, r);
    }
  }

  // 2. VEIN Buchstaben horizontal zentrieren
  // V(5) + 1 + E(4) + 1 + I(3) + 1 + N(5) = 20 Spalten
  const startCol = Math.max(1, Math.floor((cols - 20) / 2));
  const startRow = 1; // Zeile 1..5 für die Buchstaben (schöner Abstand oben und zur Menükarte)

  // V (Gold-Erz) - 100% symmetrisch
  const vCol = startCol;
  const vOffsets = [
    [0, 0], [4, 0],
    [0, 1], [4, 1],
    [1, 2], [3, 2],
    [1, 3], [3, 3],
    [2, 4]
  ];
  vOffsets.forEach(([dc, dr]) => drawOreTile(imgGold, vCol + dc, startRow + dr));

  // E (Diamant-Erz)
  const eCol = vCol + 5 + 1;
  const eOffsets = [
    [0, 0], [1, 0], [2, 0], [3, 0],
    [0, 1],
    [0, 2], [1, 2], [2, 2],
    [0, 3],
    [0, 4], [1, 4], [2, 4], [3, 4]
  ];
  eOffsets.forEach(([dc, dr]) => drawOreTile(imgDiamond, eCol + dc, startRow + dr));

  // I (Rubin-Erz)
  const iCol = eCol + 4 + 1;
  const iOffsets = [
    [0, 0], [1, 0], [2, 0],
    [1, 1],
    [1, 2],
    [1, 3],
    [0, 4], [1, 4], [2, 4]
  ];
  iOffsets.forEach(([dc, dr]) => drawOreTile(imgRuby, iCol + dc, startRow + dr));

  // N (Smaragd-Erz)
  const nCol = iCol + 3 + 1;
  const nOffsets = [
    [0, 0], [4, 0],
    [0, 1], [1, 1], [4, 1],
    [0, 2], [2, 2], [4, 2],
    [0, 3], [3, 3], [4, 3],
    [0, 4], [4, 4]
  ];
  nOffsets.forEach(([dc, dr]) => drawOreTile(imgEmerald, nCol + dc, startRow + dr));

  // 4. Sanfte Vignette & Abdunklung zum unteren Kartenbereich
  const vignette = ctx.createRadialGradient(width / 2, height * 0.35, width * 0.25, width / 2, height * 0.35, width * 0.7);
  vignette.addColorStop(0, 'rgba(3, 7, 18, 0.0)');
  vignette.addColorStop(1, 'rgba(2, 6, 23, 0.55)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, width, height);

  const bottomGrad = ctx.createLinearGradient(0, height * 0.55, 0, height);
  bottomGrad.addColorStop(0, 'rgba(2, 6, 23, 0.0)');
  bottomGrad.addColorStop(1, 'rgba(2, 6, 23, 0.90)');
  ctx.fillStyle = bottomGrad;
  ctx.fillRect(0, height * 0.55, width, height * 0.45);

  return canvas.toDataURL('image/png');
}

export class StartScreen {
  constructor(scene) {
    this.scene = scene;
    this.container = document.getElementById('start-screen-overlay');
    this.playerName = localStorage.getItem('vein_player_name') || '';
    this.isShowing = true;
    this.refreshInterval = null;
    this.init();
  }

  init() {
    if (!this.container) return;
    const hud = document.getElementById('hud-overlay');
    if (hud) hud.style.display = 'none';
    const hudFab = document.getElementById('hud-action-fab');
    if (hudFab) hudFab.style.display = 'none';
    const worldLabels = document.getElementById('world-labels-layer');
    if (worldLabels) worldLabels.style.display = 'none';
    this.container.style.display = 'flex';
    this.container.style.opacity = '1';
    this.render();

    // Bei Display-Drehung / Resize Hintergrundbild nahtlos anpassen
    window.addEventListener('resize', () => {
      if (this.isShowing) {
        const bgImg = document.getElementById('start-screen-showcase-img');
        if (bgImg && this.scene) {
          const freshPng = generateShowcasePng(this.scene);
          if (freshPng) bgImg.src = freshPng;
        }
      }
    });
  }

  async render() {
    const slots = SaveSystem.listSlots();
    const hasSave = slots.some(s => s.exists);

    const showcasePng = generateShowcasePng(this.scene);

    this.container.innerHTML = `
      <!-- PNG Hintergrundbild (echte Spieltexturen, genau wie im Referenz-Screenshot) -->
      ${showcasePng ? `
        <img id="start-screen-showcase-img" src="${showcasePng}" alt="VEIN" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; object-position: top center; image-rendering: pixelated; z-index: 0; pointer-events: none;" />
      ` : ''}

      <div class="start-screen-card" style="display: flex; flex-direction: column; justify-content: flex-end; align-items: center; width: 100%; height: 100%; max-height: calc(100vh - 12px); box-sizing: border-box; pointer-events: none; position: relative; z-index: 2;">
        
        <!-- Freier Raum oben: lässt das VEIN-Erzlogo voll zur Geltung kommen -->
        <div style="flex: 1; pointer-events: none;"></div>

        <!-- UNTERE KARTE (EINE KOMPAKTE KARTE, BLAUER RAND, PERFEKT PROPORTIONIERT) -->
        <div style="background: linear-gradient(135deg, rgba(15, 23, 42, 0.93) 0%, rgba(17, 24, 39, 0.91) 100%); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); border: 1.5px solid rgba(56, 189, 248, 0.6); border-radius: 16px; padding: 10px 16px; box-shadow: 0 8px 32px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.1); width: 100%; pointer-events: auto; margin-bottom: 2px; box-sizing: border-box; display: grid; grid-template-columns: 1fr 1fr; gap: 14px; align-items: start;">
          
          <!-- Linker Bereich: Expedition / Start -->
          <div style="display: flex; flex-direction: column; gap: 6px;">
            <div style="font-size: 10.5px; font-weight: 800; color: #38bdf8; text-transform: uppercase; letter-spacing: 0.8px; display: flex; align-items: center; gap: 6px;">
              ${icon('compass', '', 13)} EXPEDITION
            </div>

            <button id="btn-start-new-game" class="btn-buy start-screen-btn" style="height: 38px; width: 100%; border-radius: 9px; font-size: 12.5px; font-weight: 900; justify-content: center; gap: 7px; background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); border: 1.5px solid rgba(56, 189, 248, 0.6); box-shadow: 0 4px 14px rgba(2, 132, 199, 0.5); color: #ffffff; cursor: pointer; letter-spacing: 0.5px;">
              ${icon('play', '', 14)}
              <span>NEUES SPIEL</span>
            </button>

            ${hasSave ? `
              <button id="btn-start-continue-game" class="btn-action start-screen-btn" style="height: 32px; width: 100%; border-radius: 8px; font-size: 11.5px; font-weight: 800; justify-content: center; gap: 6px; background: rgba(30, 41, 59, 0.85); border: 1px solid rgba(255, 255, 255, 0.15); color: #f8fafc; cursor: pointer; letter-spacing: 0.5px;">
                ${icon('rotate-ccw', '', 12)}
                <span>LADEN</span>
              </button>
            ` : ''}
          </div>

          <!-- Rechter Bereich: Bestenliste -->
          <div style="display: flex; flex-direction: column; gap: 6px;">
            <div style="display: flex; align-items: center; justify-content: center;">
              <div style="font-size: 10.5px; font-weight: 800; color: #38bdf8; text-transform: uppercase; letter-spacing: 0.8px; display: flex; align-items: center; gap: 6px;">
                ${icon('trophy', '', 13)} BESTENLISTE
              </div>
            </div>

            <div id="start-leaderboard-list" style="display: flex; flex-direction: column; gap: 3px; min-height: 70px; max-height: 85px; overflow-y: auto; padding-right: 2px;">
              <div style="color: #94a3b8; font-size: 10.5px; text-align: center; padding: 12px 0;">
                Lade Bestenliste...
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Popup-Modal für Slot-Auswahl beim Laden -->
      <div id="start-slots-modal" style="display: none; position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(2, 6, 23, 0.85); backdrop-filter: blur(8px); z-index: 500; justify-content: center; align-items: center; padding: 16px; box-sizing: border-box; pointer-events: auto;">
        <div style="background: #0f172a; border: 1.5px solid rgba(56, 189, 248, 0.5); border-radius: 16px; padding: 18px; width: 100%; max-width: 380px; box-shadow: 0 16px 40px rgba(0,0,0,0.85); display: flex; flex-direction: column; gap: 12px; pointer-events: auto;">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 8px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="color: #38bdf8;">${icon('folder-open', '', 18)}</span>
              <h3 style="margin: 0; font-size: 15px; font-weight: 800; color: #f8fafc;">Spielstand laden</h3>
            </div>
            <button id="btn-close-slots-modal" style="background: transparent; border: none; color: #94a3b8; cursor: pointer; padding: 4px; display: flex; align-items: center; justify-content: center; border-radius: 6px;">
              ${icon('x', '', 18)}
            </button>
          </div>
          
          <div id="start-slots-list" style="display: flex; flex-direction: column; gap: 8px; max-height: 260px; overflow-y: auto;">
          </div>
        </div>
      </div>

      <!-- Popup-Modal für Fahrer-Namenseingabe -->
      <div id="start-name-modal" style="display: none; position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(2, 6, 23, 0.85); backdrop-filter: blur(8px); z-index: 500; justify-content: center; align-items: center; padding: 16px; box-sizing: border-box; pointer-events: auto;">
        <div style="background: #0f172a; border: 1.5px solid rgba(249, 115, 22, 0.5); border-radius: 16px; padding: 20px; width: 100%; max-width: 380px; box-shadow: 0 16px 40px rgba(0,0,0,0.8); display: flex; flex-direction: column; gap: 14px; pointer-events: auto;">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 8px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="color: #f97316;">${icon('id-card', '', 20)}</span>
              <h3 style="margin: 0; font-size: 16px; font-weight: 800; color: #f8fafc;">Neuer Fahrer-Vertrag</h3>
            </div>
            <button id="btn-close-name-modal" style="background: transparent; border: none; color: #94a3b8; cursor: pointer; padding: 4px; display: flex; align-items: center; justify-content: center; border-radius: 6px;">
              ${icon('x', '', 18)}
            </button>
          </div>
          <div style="font-size: 12px; color: #cbd5e1; line-height: 1.4;">
            Gib deinen Rufnamen für das Bergbaufahrzeug <strong>VEIN-01</strong> ein (für die Bestenliste):
          </div>
          <input type="text" id="modal-player-name" placeholder="Fahrername..." value="${this.playerName}" maxlength="20" autofocus style="width: 100%; height: 42px; box-sizing: border-box; background: rgba(2, 6, 23, 0.85); border: 1.5px solid rgba(249, 115, 22, 0.5); border-radius: 8px; color: #ffffff; padding: 0 12px; font-size: 14px; font-weight: 700; outline: none; pointer-events: auto !important; user-select: text !important; -webkit-user-select: text !important; cursor: text;" />
          <div style="display: flex; gap: 8px; justify-content: flex-end;">
            <button id="btn-confirm-name" class="btn-buy" style="height: 38px; padding: 0 16px; border-radius: 8px; font-size: 12.5px; font-weight: 800; cursor: pointer; pointer-events: auto;">
              Dienst antreten
            </button>
          </div>
        </div>
      </div>
    `;

    refreshIcons(this.container);
    this.bindEvents();
    this.loadLeaderboard();
    this.startAutoRefresh();
  }

  startAutoRefresh() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
    this.refreshInterval = setInterval(() => {
      if (this.isShowing) {
        this.loadLeaderboard();
      }
    }, 15000);
  }

  async loadLeaderboard() {
    const listEl = document.getElementById('start-leaderboard-list');
    if (!listEl) return;

    try {
      const scores = await LeaderboardService.fetchTopScores(10);

      if (scores === null) {
        listEl.innerHTML = `<div style="color: #94a3b8; font-size: 10.5px; text-align: center; padding: 15px 0;">Bereit zur Verbindung</div>`;
        return;
      }

      if (scores.length === 0) {
        listEl.innerHTML = `
          <div style="color: #94a3b8; font-size: 11px; text-align: center; padding: 20px 10px;">
            Noch keine Einträge vorhanden.
          </div>
        `;
        return;
      }

      listEl.innerHTML = scores.map((s, idx) => {
        const isTop1 = idx === 0;
        const isTop3 = idx < 3;
        const badgeColor = isTop1 ? '#fbbf24' : (idx === 1 ? '#cbd5e1' : (idx === 2 ? '#b45309' : '#64748b'));
        const depthVal = s.depth || 0;
        const levelVal = s.level || 1;

        return `
          <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(30, 41, 59, ${isTop3 ? '0.75' : '0.45'}); border: 1px solid ${isTop1 ? 'rgba(251, 191, 36, 0.4)' : 'rgba(255,255,255,0.06)'}; border-radius: 7px; padding: 5px 8px; font-size: 11px;">
            <div style="display: flex; align-items: center; gap: 7px; min-width: 0;">
              <span style="display: inline-flex; justify-content: center; align-items: center; width: 17px; height: 17px; border-radius: 50%; background: ${badgeColor}; color: #0f172a; font-size: 9.5px; font-weight: 900; flex-shrink: 0;">
                ${idx + 1}
              </span>
              <span style="color: #f8fafc; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 130px;">
                ${s.name || 'Fahrer'}
              </span>
              <span style="font-size: 9px; color: #94a3b8;">Lv.${levelVal}</span>
            </div>
            <strong style="color: #38bdf8; font-weight: 800; font-size: 11.5px; margin-left: 8px; flex-shrink: 0;">
              ${depthVal} m
            </strong>
          </div>
        `;
      }).join('');
    } catch (e) {
      listEl.innerHTML = `<div style="color: #f87171; font-size: 10.5px; text-align: center; padding: 10px 0;">Konnte Bestenliste nicht laden</div>`;
    }
  }

  bindEvents() {
    const btnNew = document.getElementById('btn-start-new-game');
    if (btnNew) {
      btnNew.onclick = () => {
        soundFx.playClick();
        this.openNameModal(false);
      };
    }

    const btnContinue = document.getElementById('btn-start-continue-game');
    if (btnContinue) {
      btnContinue.onclick = () => {
        soundFx.playClick();
        this.openSlotsModal();
      };
    }

    const closeSlotsBtn = document.getElementById('btn-close-slots-modal');
    if (closeSlotsBtn) {
      closeSlotsBtn.onclick = () => {
        soundFx.playClick();
        const modal = document.getElementById('start-slots-modal');
        if (modal) modal.style.display = 'none';
      };
    }

    const closeNameBtn = document.getElementById('btn-close-name-modal');
    if (closeNameBtn) {
      closeNameBtn.onclick = () => {
        soundFx.playClick();
        const modal = document.getElementById('start-name-modal');
        if (modal) modal.style.display = 'none';
      };
    }

    const inputName = document.getElementById('modal-player-name');
    if (inputName) {
      inputName.onkeydown = (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          const confirmBtn = document.getElementById('btn-confirm-name');
          if (confirmBtn) confirmBtn.click();
        }
      };
    }

    const confirmBtn = document.getElementById('btn-confirm-name');
    if (confirmBtn) {
      confirmBtn.onclick = () => {
        soundFx.playClick();
        const input = document.getElementById('modal-player-name');
        const chosen = (input?.value || '').trim() || 'Fahrer_01';
        this.playerName = chosen;
        try {
          localStorage.setItem('vein_player_name', chosen);
        } catch (_) {}
        const modal = document.getElementById('start-name-modal');
        if (modal) modal.style.display = 'none';
        this.startSession(this._pendingContinue || false);
      };
    }
  }

  openSlotsModal() {
    const modal = document.getElementById('start-slots-modal');
    const listEl = document.getElementById('start-slots-list');
    if (!modal || !listEl) return;

    const slots = SaveSystem.listSlots();
    listEl.innerHTML = slots.map(s => {
      if (!s.exists) {
        return `
          <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(15, 23, 42, 0.6); border: 1px dashed rgba(255, 255, 255, 0.15); border-radius: 10px; padding: 10px 12px; opacity: 0.65;">
            <div>
              <div style="color: #cbd5e1; font-weight: 700; font-size: 12.5px;">${s.label}</div>
              <div style="color: #64748b; font-size: 10.5px;">Leer / Kein Spielstand</div>
            </div>
            <span style="font-size: 10.5px; color: #64748b; font-weight: 600;">Leer</span>
          </div>
        `;
      }

      return `
        <div class="start-slot-item" style="display: flex; justify-content: space-between; align-items: center; background: rgba(30, 41, 59, 0.75); border: 1.5px solid ${s.isCurrent ? 'rgba(56, 189, 248, 0.6)' : 'rgba(255, 255, 255, 0.1)'}; border-radius: 10px; padding: 10px 12px; cursor: pointer; transition: all 0.2s;" data-slot="${s.slotId}">
          <div style="display: flex; flex-direction: column; gap: 2px;">
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="color: #f8fafc; font-weight: 800; font-size: 13px;">${s.label}</span>
              ${s.isCurrent ? `<span style="background: rgba(56, 189, 248, 0.2); color: #38bdf8; font-size: 9px; font-weight: 800; padding: 1px 6px; border-radius: 99px;">Aktiv</span>` : ''}
            </div>
            <div style="color: #94a3b8; font-size: 11px;">
              Tiefe: <strong style="color: #38bdf8;">${s.highestDepth}m</strong> · Lv.${s.level} · ${s.dateFormatted}
            </div>
          </div>
          <button class="btn-buy" style="height: 32px; padding: 0 12px; font-size: 11.5px; font-weight: 800; border-radius: 7px; pointer-events: none;">
            Laden
          </button>
        </div>
      `;
    }).join('');

    refreshIcons(listEl);

    listEl.querySelectorAll('.start-slot-item').forEach(el => {
      el.onclick = () => {
        const slotId = parseInt(el.getAttribute('data-slot'), 10);
        soundFx.playClick();
        SaveSystem.setActiveSlotId(slotId);
        if (this.scene) {
          SaveSystem.loadSlot(this.scene, slotId);
        }
        modal.style.display = 'none';
        this.startSession(true);
      };
    });

    modal.style.display = 'flex';
  }

  openNameModal(continueSave = false) {
    this._pendingContinue = continueSave;
    const modal = document.getElementById('start-name-modal');
    if (modal) {
      modal.style.display = 'flex';
      const input = document.getElementById('modal-player-name');
      if (input) {
        input.value = this.playerName || '';
        setTimeout(() => {
          input.focus();
          try {
            input.select();
          } catch (_) {}
        }, 50);
      }
    }
  }

  startSession(continueSave = false) {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }

    const finalName = this.playerName.trim() || 'Fahrer_01';
    try {
      localStorage.setItem('vein_player_name', finalName);
    } catch (_) {}

    if (this.scene && this.scene.player) {
      this.scene.player.name = finalName;
    }

    if (!continueSave) {
      // 1. Aktuellen Slot bereinigen
      SaveSystem.clear();
      SaveSystem.isClearing = false;

      // 2. Spieler komplett auf sauberen Startzustand an die Oberfläche setzen
      if (this.scene && this.scene.player) {
        const p = this.scene.player;
        p.cargo = [];
        p.cash = 0;
        p.level = 1;
        p.xp = 0;
        p.xpNeeded = 350;
        p.highestDepthReached = 0;
        p.drillTier = 1;
        p.cargoTier = 1;
        p.hullTier = 1;
        p.engineTier = 1;
        p.tankTier = 1;
        p.sensorTier = 1;
        p.maxCargo = 12;
        p.maxHull = 50;
        p.hull = 50;
        p.maxFuel = 40;
        p.fuel = 40;
        p.freeRescues = 3;
        p.gadgets = { dynamite: 0, fuel_canister: 0, repair_kit: 0 };
        p.gx = 15;
        p.gy = -1;
        p.x = 15 * 32 + 16;
        p.y = -1 * 32 + 16;
        if (p.sprite) {
          p.sprite.setPosition(p.x, p.y);
        }
      }

      // 3. GridSystem komplett zurücksetzen (unberührte, saubere prozedurale Welt)
      if (this.scene && this.scene.gridSystem) {
        const gs = this.scene.gridSystem;
        gs.tiles.clear();
        if (gs.destroyedTiles) gs.destroyedTiles.clear();
        if (gs.exploredTiles) gs.exploredTiles.clear();
        if (gs.clearAllSprites) gs.clearAllSprites();
        gs.fogDirty = true;
        gs.fogBufferReady = false;
      }

      // 4. Rekord-Übermittlungsstatus zurücksetzen
      if (this.scene) {
        this.scene._lastSubmittedLeaderboardDepth = 0;
      }
      try {
        localStorage.removeItem('vein_last_submitted_depth');
      } catch (_) {}

      // 5. Frischen Spielstand anlegen
      SaveSystem.save(this.scene);
    }

    this.hide();
  }

  hide() {
    this.isShowing = false;
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
    const hudOverlay = document.getElementById('hud-overlay');
    if (hudOverlay) hudOverlay.style.display = '';
    const hudFab = document.getElementById('hud-action-fab');
    if (hudFab) hudFab.style.display = '';
    const worldLabels = document.getElementById('world-labels-layer');
    if (worldLabels) worldLabels.style.display = '';

    if (this.container) {
      this.container.style.opacity = '0';
      this.container.style.pointerEvents = 'none';
      this.container.style.display = 'none';
    }

    if (this.scene) {
      this.scene.inStartScreen = false;
      this.scene.isPaused = false;
      if (this.scene.setupCamera) {
        this.scene.setupCamera();
      }
      if (this.scene.gridSystem) {
        this.scene.gridSystem.fogDirty = true;
        this.scene.gridSystem.fogBufferReady = false;
        this.scene.gridSystem.lastCamX = null;
        this.scene.gridSystem.lastCamY = null;
        this.scene.gridSystem.updateViewport(this.scene.cameras.main, this.scene.player);
      }
      if (this.scene.baseSystem && this.scene.baseSystem.updateWorldLabels) {
        this.scene.baseSystem.updateWorldLabels();
      }

      // Tutorial für neue Spieler anzeigen (nur einmalig, gemerkt in localStorage)
      if (TutorialModal.shouldShow()) {
        setTimeout(() => {
          new TutorialModal(this.scene).show();
        }, 150);
      }
    }
  }

  show() {
    this.isShowing = true;
    soundFx.stopAllLoops?.();
    const hudOverlay = document.getElementById('hud-overlay');
    if (hudOverlay) hudOverlay.style.display = 'none';
    const hudFab = document.getElementById('hud-action-fab');
    if (hudFab) hudFab.style.display = 'none';
    const worldLabels = document.getElementById('world-labels-layer');
    if (worldLabels) worldLabels.style.display = 'none';

    if (this.container) {
      this.container.style.display = 'flex';
      this.container.style.opacity = '1';
      this.container.style.pointerEvents = 'auto';
    }
    if (this.scene) {
      this.scene.inStartScreen = true;
      this.scene.isPaused = true;
    }
    this.render();
  }
}
