import { icon, refreshIcons } from './IconHelper.js';
import { soundFx } from '../core/SoundEffects.js';
import { closeActiveModal } from '../core/BaseSystem.js';
import { TILE_SIZE, MINE_ENTRANCE_GX_START, MINE_ENTRANCE_GX_END } from '../core/GridSystem.js';

/**
 * MapModal.js
 * Interaktive Vollbild-Minenkarte mit Zoom, Pan, POIs und Navigationsfunktion.
 */
export class MapModal {
  constructor(scene, player, baseSystem, hud) {
    this.scene = scene;
    this.player = player;
    this.baseSystem = baseSystem;
    this.hud = hud;

    this.isOpen = false;
    this.zoom = 1.0;
    this.panX = 0;
    this.panY = 0;
    this.isDragging = false;
    this.hasDragged = false;
    this.dragStartX = 0;
    this.dragStartY = 0;
    this.mouseDownScreenX = 0;
    this.mouseDownScreenY = 0;
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.activeMode = 'select'; // 'select' (Ziel wählen) | 'pan' (Verschieben)
    this.hoverGx = null;
    this.hoverGy = null;

    // Aktives Navigationsziel (Waypoint)
    this.activeWaypoint = null; // { gx, gy, name, type }
    this.selectedPOI = null;

    this.canvas = null;
    this.ctx = null;
    this.animId = null;

    this.initDOM();
    this.initGlobalEvents();
  }

  initDOM() {
    let modalEl = document.getElementById('map-modal');
    if (!modalEl) {
      modalEl = document.createElement('div');
      modalEl.id = 'map-modal';
      modalEl.className = 'map-modal-container';
      modalEl.style.display = 'none';
      const container = document.getElementById('game-container') || document.body;
      container.appendChild(modalEl);
    }
    this.modalEl = modalEl;
  }

  initGlobalEvents() {
    window.addEventListener('resize', () => {
      if (this.isOpen) this.resizeCanvas();
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.isOpen) return;
      this.onGlobalMouseMove(e);
    });

    window.addEventListener('mouseup', (e) => {
      if (!this.isOpen) return;
      this.onGlobalMouseUp(e);
    });
  }

  open() {
    if (this.isOpen) return;
    this.isOpen = true;
    this.isDragging = false;
    this.hasDragged = false;
    this.activeMode = 'select'; // Immer standardmäßig im Ziel-Wählen-Modus!
    this.hoverGx = null;
    this.hoverGy = null;
    soundFx.playClick?.();

    if (this.scene) {
      this.scene.isPaused = true;
    }
    document.body.classList.add('modal-open');
    document.body.classList.add('map-modal-open');
    if (this.hud) {
      this.hud.update(true);
    }

    this.render();
    this.centerOnPlayer();
    this.startLoop();
  }

  close() {
    if (!this.isOpen) return;
    this.isOpen = false;
    this.isDragging = false;
    this.hasDragged = false;
    soundFx.playClick?.();

    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }

    if (this.modalEl) {
      this.modalEl.style.display = 'none';
    }
    document.body.classList.remove('modal-open');
    document.body.classList.remove('map-modal-open');

    if (this.scene && !this.scene.inStartScreen) {
      this.scene.isPaused = false;
    }
  }

  toggle() {
    if (this.isOpen) this.close();
    else this.open();
  }

  render() {
    const isMinimapOn = this.hud ? (this.hud.isMinimapEnabled !== false) : true;
    const curMZoom = this.hud ? (this.hud.minimapZoomLevel || 1.0) : 1.0;

    this.modalEl.innerHTML = `
      <!-- Canvas Area -->
      <div class="map-canvas-wrapper mode-select" id="map-canvas-wrapper">
        <canvas id="map-viewport-canvas"></canvas>

        <!-- Legende (schwebend oben rechts) -->
        <div class="map-legend">
          <span class="map-legend-item" id="chip-jump-player"><span class="poi-dot" style="background:#fbbf24;"></span> Bohrer</span>
          <span class="map-legend-item" id="chip-jump-entrance"><span class="poi-dot" style="background:#10b981;"></span> Schacht</span>
          <span class="map-legend-item" id="chip-jump-fuel"><span class="poi-dot" style="background:#f59e0b;"></span> Tankanlagen</span>
          <span class="map-legend-item" id="chip-jump-pneumatic"><span class="poi-dot" style="background:#38bdf8;"></span> Erzförderung</span>
          <span class="map-legend-item" id="chip-jump-surface"><span class="poi-dot" style="background:#a855f7;"></span> Basis</span>
        </div>

        <!-- Floating Navigation Actions -->
        <div class="map-floating-actions" id="map-floating-actions">
          ${this.getFloatingActionsHtml()}
        </div>
      </div>
    `;

    this.modalEl.style.display = 'flex';
    refreshIcons(this.modalEl);

    this.canvas = document.getElementById('map-viewport-canvas');
    if (this.canvas) {
      this.ctx = this.canvas.getContext('2d');
      this.resizeCanvas();
    }

    this.bindEvents();
  }

  getFloatingActionsHtml() {
    let html = '';
    if (this.activeWaypoint) {
      html += `
        <button id="map-btn-clear-waypoint" class="btn-flyover btn-flyover-danger" title="Aktive Navigation beenden">
          ${icon('x', '', 15)} Ziel löschen
        </button>
      `;
    }
    if (this.selectedPOI && this.selectedPOI.type !== 'player') {
      const p = this.player;
      const curGx = Math.round(p?.gx || 20);
      const curGy = Math.round(p?.gy || 0);
      const dx = this.selectedPOI.gx - curGx;
      const dy = this.selectedPOI.gy - curGy;
      const distBlocks = Math.round(Math.hypot(dx, dy));
      const distMeters = Math.round(distBlocks * 1.5);

      html += `
        <button id="map-btn-set-nav" class="btn-flyover btn-flyover-primary" title="Als Navigationsziel setzen">
          ${icon('navigation', '', 15)} Ziel setzen (${distMeters}m)
        </button>
      `;
    }
    return html;
  }

  updateFloatingActions() {
    const el = document.getElementById('map-floating-actions');
    if (el) {
      el.innerHTML = this.getFloatingActionsHtml();
      refreshIcons(el);
      this.bindFloatingActions();
    }
  }

  bindFloatingActions() {
    const setNavBtn = document.getElementById('map-btn-set-nav');
    if (setNavBtn) {
      setNavBtn.onclick = (e) => {
        e.stopPropagation();
        soundFx.playClick?.();
        if (this.selectedPOI) {
          this.setWaypoint(this.selectedPOI);
          this.close();
        }
      };
    }

    const clearNavBtn = document.getElementById('map-btn-clear-waypoint');
    if (clearNavBtn) {
      clearNavBtn.onclick = (e) => {
        e.stopPropagation();
        this.clearWaypoint();
      };
    }
  }

  bindEvents() {
    // Schließen
    const closeBtn = document.getElementById('map-modal-close-btn');
    if (closeBtn) closeBtn.onclick = () => this.close();

    // Zoom Controls
    const btnIn = document.getElementById('map-btn-zoom-in');
    const btnOut = document.getElementById('map-btn-zoom-out');
    const btnRecenter = document.getElementById('map-btn-recenter');

    if (btnIn) btnIn.onclick = () => { this.setZoom(this.zoom * 1.25); };
    if (btnOut) btnOut.onclick = () => { this.setZoom(this.zoom / 1.25); };
    if (btnRecenter) btnRecenter.onclick = () => { this.centerOnPlayer(); };

    // POI Chips
    const chipPlayer = document.getElementById('chip-jump-player');
    const chipEntrance = document.getElementById('chip-jump-entrance');
    const chipFuel = document.getElementById('chip-jump-fuel');
    const chipSurface = document.getElementById('chip-jump-surface');

    if (chipPlayer) {
      chipPlayer.onclick = () => {
        this.selectPOI({ gx: Math.round(this.player.gx), gy: Math.round(this.player.gy), name: 'Bohrfahrzeug', type: 'player' });
        this.centerOn(this.player.gx, this.player.gy);
      };
    }
    if (chipEntrance) {
      chipEntrance.onclick = () => {
        this.selectPOI({ gx: 20, gy: 0, name: 'Schachteinstieg (0/0)', type: 'entrance' });
        this.centerOn(20, 0);
      };
    }
    if (chipFuel) {
      chipFuel.onclick = () => {
        const stations = (this.baseSystem?.subsurfaceStations || []).filter(s => s.type === 'fuel' || s.type === 'geothermal');
        if (stations.length > 0) {
          let nearest = stations[0];
          let minDist = 99999;
          stations.forEach(s => {
            const d = Math.hypot(s.gx - this.player.gx, s.gy - this.player.gy);
            if (d < minDist) { minDist = d; nearest = s; }
          });
          this.selectPOI({ gx: nearest.gx, gy: nearest.gy, name: nearest.name || 'Tankanlage', type: 'fuel' });
          this.centerOn(nearest.gx, nearest.gy);
        } else {
          this.selectPOI({ gx: 20, gy: 0, name: 'Keine Untertage-Tankanlage gebaut', type: 'info' });
        }
      };
    }
    if (chipSurface) {
      chipSurface.onclick = () => {
        this.selectPOI({ gx: 15, gy: -1, name: 'Basis & Hangar', type: 'surface' });
        this.centerOn(15, -1);
      };
    }
    const chipPneumatic = document.getElementById('chip-jump-pneumatic');
    if (chipPneumatic) {
      chipPneumatic.onclick = () => {
        const stations = (this.baseSystem?.subsurfaceStations || []).filter(s => s.type === 'pneumatic');
        if (stations.length > 0) {
          let nearest = stations[0];
          let minDist = 99999;
          stations.forEach(s => {
            const d = Math.hypot(s.gx - this.player.gx, s.gy - this.player.gy);
            if (d < minDist) { minDist = d; nearest = s; }
          });
          this.selectPOI({ gx: nearest.gx, gy: nearest.gy, name: nearest.name || 'Erzförderung', type: 'pneumatic' });
          this.centerOn(nearest.gx, nearest.gy);
        }
      };
    }

    // Floating Nav-Buttons
    this.bindFloatingActions();

    // Modus Umschalter
    const modeSelectBtn = document.getElementById('map-mode-select');
    const modePanBtn = document.getElementById('map-mode-pan');
    if (modeSelectBtn) modeSelectBtn.onclick = () => this.setMode('select');
    if (modePanBtn) modePanBtn.onclick = () => this.setMode('pan');

    // Canvas Mouse & Touch Dragging & Click Selection
    const wrapper = document.getElementById('map-canvas-wrapper');
    if (!wrapper || !this.canvas) return;

    this.canvas.onmousedown = (e) => {
      if (e.button !== 0) return;
      this.isDragging = true;
      this.hasDragged = false;
      this.mouseDownScreenX = e.clientX;
      this.mouseDownScreenY = e.clientY;
      this.dragStartX = e.clientX - this.panX;
      this.dragStartY = e.clientY - this.panY;
      if (wrapper) wrapper.classList.add('dragging');
    };

    // Zoom per Mausrad
    this.canvas.onwheel = (e) => {
      e.preventDefault();
      const rect = this.canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const factor = e.deltaY < 0 ? 1.15 : 0.87;
      this.zoomAt(mouseX, mouseY, factor);
    };

    // Touch Support
    let touchStartDist = 0;
    this.canvas.ontouchstart = (e) => {
      if (e.touches.length === 1) {
        this.isDragging = true;
        this.hasDragged = false;
        this.touchStartX = e.touches[0].clientX;
        this.touchStartY = e.touches[0].clientY;
        this.dragStartX = e.touches[0].clientX - this.panX;
        this.dragStartY = e.touches[0].clientY - this.panY;
      } else if (e.touches.length === 2) {
        this.isDragging = false;
        touchStartDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
      }
    };

    this.canvas.ontouchmove = (e) => {
      e.preventDefault();
      if (e.touches.length === 1 && this.isDragging) {
        const dist = Math.hypot(e.touches[0].clientX - this.touchStartX, e.touches[0].clientY - this.touchStartY);
        if (dist > 7) {
          this.hasDragged = true;
          this.panX = e.touches[0].clientX - this.dragStartX;
          this.panY = e.touches[0].clientY - this.dragStartY;
        }
      } else if (e.touches.length === 2 && touchStartDist > 0) {
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        const factor = dist / touchStartDist;
        touchStartDist = dist;
        const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
        this.zoomAt(midX, midY, Math.max(0.9, Math.min(1.1, factor)));
      }
    };

    this.canvas.ontouchend = (e) => {
      if (e.touches.length === 0) {
        const wasDragging = this.isDragging;
        const hadDragged = this.hasDragged;
        this.isDragging = false;
        this.hasDragged = false;
        if (wasDragging && !hadDragged && e.changedTouches.length === 1) {
          this.handleCanvasClick(e.changedTouches[0]);
        }
      }
    };
  }

  setMode(mode) {
    this.activeMode = mode;
    soundFx.playClick?.();
    const wrapper = document.getElementById('map-canvas-wrapper');
    if (wrapper) {
      wrapper.classList.toggle('mode-select', mode === 'select');
      wrapper.classList.toggle('mode-pan', mode === 'pan');
    }
    const modeSelectBtn = document.getElementById('map-mode-select');
    const modePanBtn = document.getElementById('map-mode-pan');
    if (modeSelectBtn) modeSelectBtn.classList.toggle('active', mode === 'select');
    if (modePanBtn) modePanBtn.classList.toggle('active', mode === 'pan');
  }

  onGlobalMouseMove(e) {
    if (this.canvas) {
      const rect = this.canvas.getBoundingClientRect();
      if (e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom) {
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const worldPixelSize = 12 * this.zoom;
        this.hoverGx = Math.round((mouseX - this.panX) / worldPixelSize);
        this.hoverGy = Math.round((mouseY - this.panY) / worldPixelSize);
      } else {
        this.hoverGx = null;
        this.hoverGy = null;
      }
    }

    if (!this.isDragging) return;

    const dist = Math.hypot(e.clientX - this.mouseDownScreenX, e.clientY - this.mouseDownScreenY);
    if (dist > 7) {
      this.hasDragged = true;
      this.panX = e.clientX - this.dragStartX;
      this.panY = e.clientY - this.dragStartY;
    }
  }

  onGlobalMouseUp(e) {
    const wrapper = document.getElementById('map-canvas-wrapper');
    if (wrapper) wrapper.classList.remove('dragging');

    const wasDragging = this.isDragging;
    const hadDragged = this.hasDragged;
    this.isDragging = false;
    this.hasDragged = false;

    if (wasDragging && !hadDragged) {
      if (this.canvas) {
        const rect = this.canvas.getBoundingClientRect();
        if (e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom) {
          this.handleCanvasClick(e);
        }
      }
    }
  }

  resizeCanvas() {
    const wrapper = document.getElementById('map-canvas-wrapper');
    if (!wrapper || !this.canvas) return;
    const w = wrapper.clientWidth;
    const h = wrapper.clientHeight;
    if (w > 0 && h > 0) {
      this.canvas.width = w * window.devicePixelRatio;
      this.canvas.height = h * window.devicePixelRatio;
      this.canvas.style.width = `${w}px`;
      this.canvas.style.height = `${h}px`;
    }
  }

  setZoom(z) {
    this.zoom = Math.max(0.25, Math.min(3.5, z));
    const zoomText = document.getElementById('map-zoom-level');
    if (zoomText) zoomText.textContent = `${Math.round(this.zoom * 100)}%`;
  }

  zoomAt(screenX, screenY, factor) {
    const oldZoom = this.zoom;
    const newZoom = Math.max(0.25, Math.min(3.5, oldZoom * factor));
    if (oldZoom === newZoom) return;

    this.panX = screenX - (screenX - this.panX) * (newZoom / oldZoom);
    this.panY = screenY - (screenY - this.panY) * (newZoom / oldZoom);
    this.zoom = newZoom;

    const zoomText = document.getElementById('map-zoom-level');
    if (zoomText) zoomText.textContent = `${Math.round(this.zoom * 100)}%`;
  }

  centerOn(gx, gy) {
    if (!this.canvas) return;
    const w = this.canvas.width / window.devicePixelRatio;
    const h = this.canvas.height / window.devicePixelRatio;
    const worldPixelSize = 12 * this.zoom;

    this.panX = w / 2 - gx * worldPixelSize;
    this.panY = h / 2 - gy * worldPixelSize;
  }

  centerOnPlayer() {
    const gx = this.player ? this.player.gx : 20;
    const gy = this.player ? this.player.gy : 0;
    this.centerOn(gx, gy);
  }

  selectPOI(poi) {
    this.selectedPOI = poi;
    soundFx.playClick?.();
    this.updateFloatingActions();
  }

  setWaypoint(poi) {
    this.activeWaypoint = { ...poi };
    soundFx.play?.('ka-ching');
    if (this.hud) {
      this.hud.setNavigationWaypoint(this.activeWaypoint);
    }
    this.updateFloatingActions();
  }

  clearWaypoint() {
    this.activeWaypoint = null;
    this.selectedPOI = null;
    soundFx.playClick?.();
    if (this.hud) {
      this.hud.clearNavigationWaypoint();
    }
    this.updateFloatingActions();
  }

  handleCanvasClick(e) {
    if (!this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const worldPixelSize = 12 * this.zoom;
    const clickedGx = Math.round((clickX - this.panX) / worldPixelSize);
    const clickedGy = Math.round((clickY - this.panY) / worldPixelSize);

    // 1. Prüfen, ob eine Untertage-Station geklickt wurde
    const stations = this.baseSystem?.subsurfaceStations || [];
    for (const st of stations) {
      if (Math.hypot(st.gx - clickedGx, st.gy - clickedGy) <= 1.8) {
        this.selectPOI({ gx: st.gx, gy: st.gy, name: st.name || (st.type === 'fuel' ? 'Tankanlage' : 'Erzförderung'), type: st.type });
        return;
      }
    }

    // 2. Prüfen, ob Schachteinstieg geklickt wurde
    if (Math.hypot(20 - clickedGx, 0 - clickedGy) <= 2.0) {
      this.selectPOI({ gx: 20, gy: 0, name: 'Schachteinstieg (0/0)', type: 'entrance' });
      return;
    }

    // 3. Prüfen, ob Bohrer geklickt wurde
    const pGx = Math.round(this.player.gx);
    const pGy = Math.round(this.player.gy);
    if (Math.hypot(pGx - clickedGx, pGy - clickedGy) <= 1.8) {
      this.selectPOI({ gx: pGx, gy: pGy, name: 'Bohrfahrzeug (Hier)', type: 'player' });
      return;
    }

    // 4. Freier Wegpunkt auf geklickte Kachel
    const relX = clickedGx - 20;
    const relY = clickedGy === 0 ? 0 : -clickedGy;
    this.selectPOI({
      gx: clickedGx,
      gy: clickedGy,
      name: `Wegpunkt (${relX} / ${relY})`,
      type: 'custom'
    });
  }

  startLoop() {
    const loop = () => {
      if (!this.isOpen) return;
      this.draw();
      this.animId = requestAnimationFrame(loop);
    };
    this.animId = requestAnimationFrame(loop);
  }

  draw() {
    if (!this.canvas || !this.ctx) return;
    const ctx = this.ctx;
    const dpr = window.devicePixelRatio || 1;
    const w = this.canvas.width / dpr;
    const h = this.canvas.height / dpr;

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);

    // Dunkler Sci-Fi / Radar-Hintergrund
    ctx.fillStyle = '#060a12';
    ctx.fillRect(0, 0, w, h);

    const worldPixelSize = 12 * this.zoom;
    const gs = this.scene?.gridSystem;
    const destroyedTiles = gs?.destroyedTiles || new Set();

    // Sichtbarer Bereich in Gitter-Koordinaten berechnen
    const minGx = Math.floor(-this.panX / worldPixelSize) - 2;
    const maxGx = Math.ceil((w - this.panX) / worldPixelSize) + 2;
    const minGy = Math.floor(-this.panY / worldPixelSize) - 2;
    const maxGy = Math.ceil((h - this.panY) / worldPixelSize) + 2;

    // 1. Tiefen- und Gitterlinien im Hintergrund
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;
    for (let gy = Math.max(0, Math.floor(minGy / 10) * 10); gy <= maxGy; gy += 10) {
      const sy = this.panY + gy * worldPixelSize;
      ctx.beginPath();
      ctx.moveTo(0, sy);
      ctx.lineTo(w, sy);
      ctx.stroke();

      // Tiefenbeschriftung links
      ctx.fillStyle = 'rgba(148, 163, 184, 0.35)';
      ctx.font = '9px monospace';
      ctx.fillText(`${Math.round(gy * 1.5)}m`, 10, sy - 3);
    }

    // 2. Erdoberfläche & Himmel (gy < 0)
    const surfaceScreenY = this.panY + 0 * worldPixelSize;
    if (surfaceScreenY > 0) {
      ctx.fillStyle = '#0a192f';
      ctx.fillRect(0, 0, w, surfaceScreenY);

      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = Math.max(1.5, 2 * this.zoom);
      ctx.beginPath();
      ctx.moveTo(0, surfaceScreenY);
      ctx.lineTo(w, surfaceScreenY);
      ctx.stroke();
    }

    // 3. Gegrabene Schächte und Tunnel zeichnen
    ctx.fillStyle = '#1e293b';
    for (const key of destroyedTiles) {
      const [gxStr, gyStr] = key.split(',');
      const gx = Number(gxStr);
      const gy = Number(gyStr);
      if (gx < minGx || gx > maxGx || gy < minGy || gy > maxGy) continue;

      const sx = this.panX + gx * worldPixelSize;
      const sy = this.panY + gy * worldPixelSize;
      ctx.fillRect(sx, sy, worldPixelSize + 0.5, worldPixelSize + 0.5);
    }

    // Fester Schachteinstieg (gx: 19..20, gy: 0)
    ctx.fillStyle = '#334155';
    for (let egx = MINE_ENTRANCE_GX_START; egx <= MINE_ENTRANCE_GX_END; egx++) {
      const sx = this.panX + egx * worldPixelSize;
      const sy = this.panY + 0 * worldPixelSize;
      ctx.fillRect(sx, sy, worldPixelSize + 0.5, worldPixelSize + 0.5);
    }

    // 4. Oberflächen-Gebäude (Basis)
    const surfaceBuildings = [
      { gx: 3, name: 'Erzbörse', color: '#f59e0b' },
      { gx: 9, name: 'Depot', color: '#a855f7' },
      { gx: 15, name: 'Hangar', color: '#38bdf8' },
      { gx: 20, name: 'Schachteinstieg (0/0)', color: '#10b981' }
    ];

    surfaceBuildings.forEach(b => {
      const sx = this.panX + b.gx * worldPixelSize;
      const sy = this.panY + (-1) * worldPixelSize;
      if (sx > -60 && sx < w + 60 && sy > -40 && sy < h + 40) {
        ctx.fillStyle = b.color;
        ctx.fillRect(sx - 3, sy, 8, 8);
        if (this.zoom >= 0.7) {
          ctx.font = '10px sans-serif';
          ctx.fillStyle = '#f8fafc';
          ctx.textAlign = 'center';
          ctx.fillText(b.name, sx + 2, sy - 6);
        }
      }
    });

    // 5. Untertage-Stationen (POIs)
    const stations = this.baseSystem?.subsurfaceStations || [];
    stations.forEach(st => {
      const sx = this.panX + st.gx * worldPixelSize;
      const sy = this.panY + st.gy * worldPixelSize;
      if (sx < -40 || sx > w + 40 || sy < -40 || sy > h + 40) return;

      const isFuel = st.type === 'fuel' || st.type === 'geothermal';
      const color = isFuel ? '#f59e0b' : '#38bdf8';
      const label = isFuel ? '⛽ Tankstelle' : '📦 Erzförderung';

      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(sx + worldPixelSize / 2, sy + worldPixelSize / 2, Math.max(6, 7 * this.zoom), 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(sx + worldPixelSize / 2, sy + worldPixelSize / 2, Math.max(3, 4 * this.zoom), 0, Math.PI * 2);
      ctx.fill();

      if (this.zoom >= 0.65) {
        ctx.font = 'bold 10px sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.fillText(label, sx + worldPixelSize / 2, sy - 6);
      }
    });

    // 6. Ausgewählter POI (Highlight Marker, nur für Ziele/Stationen, nicht für das Bohrfahrzeug selbst)
    if (this.selectedPOI && this.selectedPOI.type !== 'player') {
      const sx = this.panX + this.selectedPOI.gx * worldPixelSize + worldPixelSize / 2;
      const sy = this.panY + this.selectedPOI.gy * worldPixelSize + worldPixelSize / 2;

      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(sx, sy, Math.max(10, 14 * this.zoom), 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(sx, sy, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#38bdf8';
      ctx.fill();
    }

    // 6b. Fadenkreuz-Vorschau im Ziel-Wahl-Modus
    if (this.activeMode === 'select' && !this.isDragging && this.hoverGx !== null && this.hoverGy !== null) {
      const hx = this.panX + this.hoverGx * worldPixelSize;
      const hy = this.panY + this.hoverGy * worldPixelSize;
      if (hx > -50 && hx < w + 50 && hy > -50 && hy < h + 50) {
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.7)';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(hx + 0.5, hy + 0.5, worldPixelSize - 1, worldPixelSize - 1);

        const cLen = Math.max(3, Math.min(6, worldPixelSize * 0.3));
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(hx, hy, cLen, 1.5);
        ctx.fillRect(hx, hy, 1.5, cLen);
        ctx.fillRect(hx + worldPixelSize - cLen, hy, cLen, 1.5);
        ctx.fillRect(hx + worldPixelSize - 1.5, hy, 1.5, cLen);
        ctx.fillRect(hx, hy + worldPixelSize - 1.5, cLen, 1.5);
        ctx.fillRect(hx, hy + worldPixelSize - cLen, 1.5, cLen);
        ctx.fillRect(hx + worldPixelSize - cLen, hy + worldPixelSize - 1.5, cLen, 1.5);
        ctx.fillRect(hx + worldPixelSize - 1.5, hy + worldPixelSize - cLen, 1.5, cLen);
      }
    }

    // 7. Aktiver Wegpunkt (Holografischer Ziel-Pin)
    if (this.activeWaypoint) {
      const sx = this.panX + this.activeWaypoint.gx * worldPixelSize + worldPixelSize / 2;
      const sy = this.panY + this.activeWaypoint.gy * worldPixelSize + worldPixelSize / 2;

      const time = Date.now() / 300;
      const pulse = 10 + Math.sin(time) * 3;

      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(sx, sy, pulse * this.zoom, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(sx - 8, sy); ctx.lineTo(sx + 8, sy);
      ctx.moveTo(sx, sy - 8); ctx.lineTo(sx, sy + 8);
      ctx.stroke();

      ctx.font = 'bold 11px sans-serif';
      ctx.fillStyle = '#10b981';
      ctx.textAlign = 'center';
      ctx.fillText(`ZIEL: ${this.activeWaypoint.name}`, sx, sy - 14 * this.zoom);

      if (this.player) {
        const px = this.panX + this.player.gx * worldPixelSize + worldPixelSize / 2;
        const py = this.panY + this.player.gy * worldPixelSize + worldPixelSize / 2;

        ctx.strokeStyle = 'rgba(16, 185, 129, 0.45)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(sx, sy);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    // 8. Bohrfahrzeug (Aktuelle Spieler-Position in Bohrer-Gelb, ohne pulsierenden Kreis)
    if (this.player) {
      const px = this.panX + this.player.gx * worldPixelSize + worldPixelSize / 2;
      const py = this.panY + this.player.gy * worldPixelSize + worldPixelSize / 2;

      // Reiner gelber Punkt passend zur Bohrerfarbe
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(px, py, Math.max(3.5, 4.5 * this.zoom), 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      ctx.font = 'bold 10px sans-serif';
      ctx.fillStyle = '#fbbf24';
      ctx.textAlign = 'center';
      ctx.fillText('DU', px, py + 13 * this.zoom);
    }

    ctx.restore();
  }
}
