import { soundFx } from '../core/SoundEffects.js';
import { SaveSystem } from '../core/SaveSystem.js';
import { MissionsProgressModal } from './MissionsProgressModal.js';
import { DrillerMenuModal } from './DrillerMenuModal.js';
import { MinerBookModal } from './MinerBookModal.js';
import { icon, refreshIcons, oreIcon } from './IconHelper.js';
import { ORE_DATA } from '../core/GridSystem.js';
import { notifyModalClosed, closeActiveModal } from '../core/BaseSystem.js';
import { toastManager } from './ToastManager.js';
import { showSpecialTileInfoModal } from './OreInfoModal.js';

const ORE_DESCRIPTIONS = {
  coal: 'Fossiler Kohlenstoff aus den oberen Schichten. Solide Einnahmequelle für den Einstieg.',
  copper: 'Weiches, rötliches Leitmetall. Leicht abzubauen und ideal für die ersten Basis-Upgrades.',
  iron: 'Essentielles Baumetall aus der Schieferschicht. Hohe Festigkeit und unverzichtbar für Werkstatt-Umbauten.',
  tin: 'Silbrig glänzendes Metall. Zusammen mit Kupfer und Eisen der Grundstein der Industrieproduktion.',
  silver: 'Edles Glanzmetall mit exzellenter Leitfähigkeit. Tief im dichten Granitgestein verborgen.',
  gold: 'Schweres, hochkarätiges Edelmetall. Äußerst wertvoll an der Börse und für Präzisionselektronik.',
  emerald: 'Leuchtend grüner Beryllkristall. Entsteht unter gewaltigem Druck in der Obsidian-Zone.',
  sapphire: 'Tiefblauer Korund-Kristall mit enormer Härte. Sehr begehrt bei Forschern und Sammlern.',
  ruby: 'Feuerroter Chrom-Kristall mit starker Lichtbrechung. Erzielt Spitzenpreise auf dem Markt.',
  diamond: 'Härtester natürlicher Kohlenstoffkristall. Widersteht selbst gewaltigsten Gebirgsdrücken.',
  titanium: 'Ultraleichtes und extrem zähes Raumfahrt-Metall für schwerste Tiefenbohrungen.',
  platinum: 'Sehr dichtes, korrosionsbeständiges Edelmetall mit unvergleichlich hohem Marktwert.',
  uranium: 'Schweres radioaktives Isotop mit energetischem Glimmen. Treibt künftige Fusions-Generatoren an.',
  obsidian_gem: 'Vulkanisches Glas mit kosmischem Kern. Bildet sich erst nahe dem geschmolzenen Planetenkern.',
  dark_matter: 'Rätselhafte Energiepartikel aus den tiefsten Schichten der Erde. Höchster Marktwert im gesamten Minensektor.'
};

export function launchConfetti() {
  let canvas = document.getElementById('confetti-canvas');
  if (canvas) {
    if (canvas._animId) {
      cancelAnimationFrame(canvas._animId);
      canvas._animId = null;
    }
  } else {
    canvas = document.createElement('canvas');
    canvas.id = 'confetti-canvas';
    document.body.appendChild(canvas);
  }
  canvas.style.cssText = 'position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; pointer-events: none; z-index: 20000;';

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const ctx = canvas.getContext('2d');

  // Spielfarben: Orange, Blau & Braun (in harmonischen, leuchtenden Schattierungen)
  const colors = [
    '#f97316', '#fb923c', '#ea580c', // Orange (Leuchtend, Amber, Rost-Orange)
    '#38bdf8', '#0ea5e9', '#60a5fa', // Blau (Himmelblau, Cyan, Tiefseeblau)
    '#92400e', '#b45309', '#78350f', '#854d0e' // Braun (Satter Erdton, Bronze, Gesteinsbraun)
  ];
  const particles = [];
  const numParticles = 90;

  for (let i = 0; i < numParticles; i++) {
    particles.push({
      x: canvas.width / 2 + (Math.random() - 0.5) * (canvas.width * 0.4),
      y: canvas.height * 0.38 + (Math.random() - 0.5) * 80,
      vx: (Math.random() - 0.5) * 20,
      vy: -Math.random() * 15 - 6,
      size: Math.random() * 8 + 6,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      vRotation: (Math.random() - 0.5) * 14,
      opacity: 1,
      gravity: 0.35
    });
  }

  const startTime = Date.now();

  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const elapsed = Date.now() - startTime;

    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.vx *= 0.98;
      p.rotation += p.vRotation;
      if (elapsed > 2000) {
        p.opacity = Math.max(0, 1 - (elapsed - 2000) / 1000);
      }

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.globalAlpha = p.opacity;
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      ctx.restore();
    });

    if (elapsed < 3200) {
      canvas._animId = requestAnimationFrame(render);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      canvas._animId = null;
      if (canvas && canvas.parentNode) {
        canvas.parentNode.removeChild(canvas);
      }
    }
  }

  canvas._animId = requestAnimationFrame(render);
}

export class HUD {
  constructor(scene, player, missionSystem) {
    this.scene = scene;
    this.player = player;
    this.missionSystem = missionSystem;

    // Expeditions- & Fortschritts-Modal
    this.missionsModal = new MissionsProgressModal(scene, player, missionSystem, scene.baseSystem);

    // Driller-Cockpit & Fracht-Modal
    this.drillerModal = new DrillerMenuModal(scene, player, scene.baseSystem);

    // Bergmann-Buch (Schacht-Logbuch & Kompendium)
    this.minerBookModal = new MinerBookModal(scene, player);

    // DOM-Referenzen
    this.fuelText = document.getElementById('hud-fuel-text');
    this.fuelNum = document.getElementById('hud-fuel-num');
    this.fuelMax = document.getElementById('hud-fuel-max');
    this.fuelBar = document.getElementById('hud-fuel-bar');
    this.fuelReserveBar = document.getElementById('hud-fuel-reserve-bar');
    this.fuelReturnTrack = document.getElementById('hud-fuel-return-track');
    this.fuelBarContainer = document.getElementById('hud-fuel-bar-container');
    this.hullText = document.getElementById('hud-hull-text');
    this.hullNum = document.getElementById('hud-hull-num');
    this.hullMax = document.getElementById('hud-hull-max');
    this.hullIcon = document.getElementById('hud-hull-icon');
    this.hullBar = document.getElementById('hud-hull-bar');
    this.hullBarContainer = document.getElementById('hud-hull-bar-container');
    this.cargoText = document.getElementById('hud-cargo-text');
    this.cargoNum = document.getElementById('hud-cargo-num');
    this.cargoMax = document.getElementById('hud-cargo-max');
    this.cashText = document.getElementById('hud-cash');
    this.depthText = document.getElementById('hud-depth');
    this.depthVal = document.getElementById('hud-depth-val');
    this.recallBtn = document.getElementById('btn-recall');
    this.pauseBtn = document.getElementById('btn-pause') || document.getElementById('btn-settings');
    this.cardGauges = document.getElementById('card-gauges');
    this.rankName = document.getElementById('hud-rank-name');
    this.levelRight = document.getElementById('hud-level-right');
    this.returnWarn = document.getElementById('hud-return-warn');
    this.rescueFab = document.getElementById('hud-rescue-fab');
    if (this.rescueFab) {
      const openRescue = (e) => {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
        if (this.scene.rescueModal) {
          this.scene.rescueModal.open();
        }
      };
      ['pointerdown', 'touchstart', 'click'].forEach(evt => {
        this.rescueFab.addEventListener(evt, openRescue, { passive: false });
      });
    }

    // Action FAB & Speed Dial (Ausrüstung & Untertage-Stationen)
    this.actionFabContainer = document.getElementById('hud-action-fab');
    this.btnActionMain = document.getElementById('btn-action-main');
    this.btnActionPneumatic = document.getElementById('btn-action-pneumatic');
    this.btnActionGeothermal = document.getElementById('btn-action-geothermal');
    this.labelActionPneumatic = document.getElementById('label-action-pneumatic');
    this.labelActionGeothermal = document.getElementById('label-action-geothermal');
    this.badgeActionPneumatic = document.getElementById('badge-action-pneumatic');
    this.badgeActionGeothermal = document.getElementById('badge-action-geothermal');

    // Gadget Buttons
    this.btnDynamite = document.getElementById('btn-gadget-dynamite');
    this.btnFuel = document.getElementById('btn-gadget-fuel');
    this.btnRepair = document.getElementById('btn-gadget-repair');
    this.countDynamite = document.getElementById('gadget-count-dynamite');
    this.countFuel = document.getElementById('gadget-count-fuel');
    this.countRepair = document.getElementById('gadget-count-repair');

    const bindActionBtn = (btn, action) => {
      if (!btn) return;
      let lastTrigger = 0;
      const trigger = (e) => {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
        const now = Date.now();
        if (now - lastTrigger < 300) return;
        lastTrigger = now;
        action();
      };
      ['pointerdown', 'mousedown', 'touchstart', 'click'].forEach(evt => btn.addEventListener(evt, trigger, { passive: false }));
    };

    // Toggle Action FAB Speed Dial
    if (this.btnActionMain && this.actionFabContainer) {
      let lastToggle = 0;
      const toggleFab = (e) => {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
        const now = Date.now();
        if (now - lastToggle < 200) return;
        lastToggle = now;
        const willOpen = !this.actionFabContainer.classList.contains('open');
        this.actionFabContainer.classList.toggle('open');
        if (!willOpen) {
          notifyModalClosed();
        }
      };
      ['pointerdown', 'mousedown', 'touchstart', 'click'].forEach(evt => this.btnActionMain.addEventListener(evt, toggleFab, { passive: false }));

      window.addEventListener('click', (e) => {
        if (this.actionFabContainer.classList.contains('open')) {
          if (!this.actionFabContainer.contains(e.target)) {
            this.actionFabContainer.classList.remove('open');
            notifyModalClosed();
          }
        }
      });
    }

    // Action-Items binden
    bindActionBtn(this.btnDynamite, () => this.scene.useDynamite?.());
    bindActionBtn(this.btnFuel, () => this.player?.useFuelCanister());
    bindActionBtn(this.btnRepair, () => this.player?.useRepairKit());
    bindActionBtn(this.btnActionPneumatic, () => this.scene.baseSystem?.buildPneumaticStationAtPlayer?.());
    bindActionBtn(this.btnActionGeothermal, () => this.scene.baseSystem?.buildGeothermalStationAtPlayer?.());

    // Detonator-Aktionsbutton unten rechts (Fernzündung)
    this.btnActionDetonate = document.getElementById('btn-action-detonate');
    this.badgeActionDetonate = document.getElementById('badge-action-detonate');
    bindActionBtn(this.btnActionDetonate, () => this.scene.detonateAllTnt?.());

    // Klick auf Text-Labels löst ebenfalls aus
    const rowDyn = document.getElementById('row-action-dynamite')?.querySelector('.fab-label');
    if (rowDyn) bindActionBtn(rowDyn, () => this.scene.useDynamite?.());
    const rowFuel = document.getElementById('row-action-fuel')?.querySelector('.fab-label');
    if (rowFuel) bindActionBtn(rowFuel, () => this.player?.useFuelCanister());
    const rowRep = document.getElementById('row-action-repair')?.querySelector('.fab-label');
    if (rowRep) bindActionBtn(rowRep, () => this.player?.useRepairKit());
    if (this.labelActionPneumatic) bindActionBtn(this.labelActionPneumatic, () => this.scene.baseSystem?.buildPneumaticStationAtPlayer?.());
    if (this.labelActionGeothermal) bindActionBtn(this.labelActionGeothermal, () => this.scene.baseSystem?.buildGeothermalStationAtPlayer?.());

    // Toast- und Alarm-Tracking (Point of No Return & Abfahrt mit zu wenig Tank)
    this.warnedPointOfNoReturn = false;
    this.warnedLowFuelOnEntry = false;

    // Oberes linkes Bohrer-Status-Widget (Tank, Hülle, Fracht) als ein einheitliches klick-/tippbares Element
    let lastDrillerModalOpen = 0;
    const handleOpenDriller = (e) => {
      if (e) {
        if (e.preventDefault) e.preventDefault();
        if (e.stopPropagation) e.stopPropagation();
      }
      const now = Date.now();
      if (now - lastDrillerModalOpen < 300) return;
      lastDrillerModalOpen = now;

      soundFx.playClick();
      this.openDrillerModal('cargo');
    };

    if (this.cardGauges) {
      this.cardGauges.style.cursor = 'pointer';
      ['pointerdown', 'click'].forEach((evt) => {
        this.cardGauges.addEventListener(evt, handleOpenDriller, { passive: false });
      });
    }

    // Event aus dem Spiel (z. B. Klick/Touch auf den Driller)
    this.scene.events.on('open_driller_menu', (tab) => {
      const now = Date.now();
      if (now - lastDrillerModalOpen < 300) return;
      lastDrillerModalOpen = now;
      this.openDrillerModal(tab || 'cargo');
    });

    // Mission Tracker
    this.missionTrackerEl = document.getElementById('mission-tracker');
    this.missionTitle = document.getElementById('hud-mission-title');
    this.missionTarget = document.getElementById('hud-mission-target');
    this.missionReward = document.getElementById('hud-mission-reward');
    this.missionStatus = document.getElementById('hud-mission-status');

    if (this.missionTrackerEl) {
      this.missionTrackerEl.onclick = () => {
        if (!this.missionsModal.baseSystem && this.scene.baseSystem) {
          this.missionsModal.baseSystem = this.scene.baseSystem;
        }
        this.missionsModal.open('active');
      };
    }

    if (this.recallBtn) {
      this.recallBtn.onclick = () => {
        this.player.teleportToSurface();
      };
    }

    if (this.pauseBtn) {
      let lastPauseTrigger = 0;
      const handlePause = (e) => {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
        const now = Date.now();
        if (now - lastPauseTrigger < 250) return;
        lastPauseTrigger = now;
        this.togglePauseMenu();
      };
      ['pointerdown', 'click'].forEach((evt) => {
        this.pauseBtn.addEventListener(evt, handlePause, { passive: false });
      });
    }

    this.scene.events.on('mission_updated', (info) => {
      this.updateMissionWidget(info);
    });

    this.scene.events.on('player_updated', () => {
      this.update(true);
    });

    // Neu entdeckte Steinsorte: Konfetti & Info-Popup anzeigen
    this.scene.events.on('ore_discovered', (oreType) => {
      this.showDiscoveryModal(oreType);
    });

    // Neu entdecktes Spezialfeld (Kapsel, Lava, Felsbrocken):
    // Entdeckungen werden im Bergmann-Buch ('Gesteine & Gefahren') erfasst – ohne Unterbrechung des Spielflusses
    this.scene.events.on('special_tile_discovered', (_tileType) => {
      // Keine Unterbrechung/kein Modal/kein Pause während des Bohrens
    });
  }

  openDrillerModal(tab = 'cargo') {
    soundFx.stopAllLoops?.();
    if (this.scene && this.scene.baseSystem) {
      this.drillerModal.baseSystem = this.scene.baseSystem;
    }
    if (this.scene && this.scene.player) {
      this.drillerModal.player = this.scene.player;
    }
    this.drillerModal.open(tab);
  }

  showToast(message, type = 'info', duration = 3500) {
    toastManager.showToast(message, type, duration);
  }

  showDiscoveryModal(oreType) {
    const data = ORE_DATA[oreType];
    if (!data) return;

    const modalEl = document.getElementById('building-modal');
    const titleEl = document.getElementById('modal-title');
    const bodyEl = document.getElementById('modal-body');
    if (!modalEl || !titleEl || !bodyEl) return;

    soundFx.playPurchase();
    soundFx.stopAllLoops?.();
    try {
      launchConfetti();
    } catch (e) {}

    const wasAlreadyPaused = Boolean(this.scene?.isPaused);
    if (!wasAlreadyPaused && this.scene) {
      this.scene.isPaused = true;
    }

    try {
      const desc = ORE_DESCRIPTIONS[oreType] || 'Ein wertvolles Mineral aus den Tiefen des Schachts.';
      modalEl.classList.add('discovery-modal-active');
    document.body.classList.add('modal-open');
    document.body.classList.add('discovery-modal-open');

    titleEl.innerHTML = '';

    bodyEl.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; text-align: center; gap: 14px; width: 100%;">
        <div style="display: inline-flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 800; letter-spacing: 0.8px; text-transform: uppercase; color: #fbbf24; background: rgba(251, 191, 36, 0.12); padding: 4px 12px; border-radius: 9999px;">
          ${icon('sparkles', '', 14)}
          <span>NEUE ENTDECKUNG</span>
        </div>

        <div style="display: flex; align-items: center; justify-content: center; gap: 12px;">
          <div style="filter: drop-shadow(0 4px 14px rgba(0,0,0,0.6)); display: flex; align-items: center; transform: scale(1.2);">
            ${oreIcon(oreType, 36)}
          </div>
          <h2 style="margin: 0; font-size: 22px; font-weight: 800; color: #f8fafc; letter-spacing: 0.5px;">
            ${data.name.toUpperCase()}
          </h2>
        </div>

        <div style="display: flex; justify-content: center; gap: 8px; font-size: 12px; flex-wrap: wrap;">
          <span style="background: rgba(251, 191, 36, 0.12); border: 1px solid rgba(251, 191, 36, 0.25); color: #fbbf24; font-weight: 800; padding: 4px 10px; border-radius: 8px;">
            Wert: €${data.value}
          </span>
          <span style="background: rgba(56, 189, 248, 0.12); border: 1px solid rgba(56, 189, 248, 0.25); color: #38bdf8; font-weight: 700; padding: 4px 10px; border-radius: 8px;">
            ab ${data.minDepth}m
          </span>
          <span style="background: rgba(148, 163, 184, 0.12); border: 1px solid rgba(148, 163, 184, 0.25); color: #cbd5e1; font-weight: 700; padding: 4px 10px; border-radius: 8px;">
            Härte ${data.hardness}x
          </span>
        </div>

        <p style="margin: 2px 0 6px 0; font-size: 13px; line-height: 1.5; color: #cbd5e1; max-width: 310px;">
          ${desc}
        </p>

        <button id="btn-discovery-ok" class="btn-buy" style="height: 38px; width: 100%; max-width: 180px; font-size: 13px; font-weight: 800; border-radius: 10px; margin-top: 4px;">
          Alles klar! ✓
        </button>
      </div>
    `;

    modalEl.style.display = 'flex';
    refreshIcons(modalEl);

    const btnOk = document.getElementById('btn-discovery-ok');
    let onKey = null;
    const handleClose = (e) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      if (onKey) {
        window.removeEventListener('keydown', onKey);
        onKey = null;
      }
      modalEl.classList.remove('discovery-modal-active');
      document.body.classList.remove('discovery-modal-open');
      document.body.classList.remove('modal-open');
      modalEl.style.display = 'none';
      if (!wasAlreadyPaused && this.scene) {
        this.scene.isPaused = false;
      }
      notifyModalClosed();
    };

    if (btnOk) {
      btnOk.onclick = handleClose;
      btnOk.ontouchend = handleClose;
    }

    onKey = (e) => {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
        handleClose(e);
      }
    };
    window.addEventListener('keydown', onKey);
  } catch (err) {
    console.error('Error in showDiscoveryModal:', err);
    if (!wasAlreadyPaused && this.scene) {
      this.scene.isPaused = false;
    }
    modalEl.style.display = 'none';
  }
}

  updateMissionWidget(info) {
    if (!info) {
      if (this.missionTitle) this.missionTitle.innerText = 'Kein aktiver Auftrag';
      if (this.missionTarget) this.missionTarget.innerText = 'Erkunde tiefere Schichten';
      if (this.missionReward) this.missionReward.innerText = '';
      if (this.missionStatus) {
        this.missionStatus.innerText = 'Pausiert';
        this.missionStatus.style.color = '#94a3b8';
      }
      return;
    }
    if (this.missionTitle) this.missionTitle.innerText = info.title;
    if (this.missionTarget) this.missionTarget.innerText = info.targetText;
    if (this.missionReward) this.missionReward.innerText = `+€${info.rewardCash}`;
    if (this.missionStatus) {
      if (info.isCompleted) {
        this.missionStatus.innerText = 'Bereit zur Abgabe!';
        this.missionStatus.style.color = '#10b981';
      } else {
        this.missionStatus.innerText = 'In Arbeit';
        this.missionStatus.style.color = '#38bdf8';
      }
    }
  }

  update(force = false) {
    // 1. Statische HUD-Werte (Geld, Fracht, Level) IMMER sofort aktualisieren – auch wenn ein Menü geöffnet oder das Spiel pausiert ist!
    if (this.player) {
      if (this._lastCash !== this.player.cash) {
        this._lastCash = this.player.cash;
        if (this.cashText) this.cashText.textContent = `€${this.player.cash.toLocaleString('de-DE')}`;
      }

      const lvl = this.player.level || 1;
      if (this._lastLevel !== lvl) {
        this._lastLevel = lvl;
        if (this.rankName) this.rankName.textContent = lvl;
        if (this.levelRight) this.levelRight.textContent = lvl;
      }

      if (this.cargoText) {
        const cargoCount = this.player.cargoCount || (this.player.cargo ? this.player.cargo.length : 0);
        const maxCargo = this.player.maxCargo || 12;
        const cargoStr = `${cargoCount}/${maxCargo}`;
        if (this._lastCargoStr !== cargoStr) {
          this._lastCargoStr = cargoStr;
          this.cargoText.innerHTML = cargoStr;
        }
      }
    }

    if (this.scene && this.scene.inStartScreen) return;

    // Position & Tiefenstatus
    const currentY = this.player.sprite ? this.player.sprite.y : (this.player.gy * 32 + 16);
    const isAtSurface = this.player.gy < 0 || currentY <= -8;
    const isBelowGround = !isAtSurface && (this.player.gy >= 0 || currentY >= 8);

    // Treibstoff & dynamische Rückkehr-Schwelle
    const fuelPercent = Math.max(0, Math.min(100, (this.player.fuel / this.player.maxFuel) * 100));
    const returnPercent = this.player.getReturnFuelPercent ? this.player.getReturnFuelPercent() : 0;

    // Rückkehr-Schwelle inkl. Sicherheitspuffer zur rechtzeitigen Umkehr (nur wenn Rückweg erforderlich)
    const safetyBuffer = returnPercent > 0 ? 3.0 : 0; // 3% Sicherheitspuffer
    const effectiveReturnThreshold = returnPercent > 0 ? Math.min(100, Math.max(0, returnPercent + safetyBuffer)) : 0;

    const reserveWidth = Math.min(fuelPercent, effectiveReturnThreshold);
    const usableWidth = effectiveReturnThreshold > 0 ? Math.max(0, fuelPercent - effectiveReturnThreshold) : fuelPercent;

    if (this.fuelReserveBar) {
      const rwStr = `${reserveWidth.toFixed(1)}%`;
      if (this._lastReserveWidth !== rwStr) {
        this._lastReserveWidth = rwStr;
        this.fuelReserveBar.style.width = rwStr;
      }
    }

    if (this.fuelBar) {
      const uwStr = `${usableWidth.toFixed(1)}%`;
      if (this._lastUsableWidth !== uwStr) {
        this._lastUsableWidth = uwStr;
        this.fuelBar.style.width = uwStr;
      }
    }

    if (this.fuelReturnTrack) {
      const rtStr = `${effectiveReturnThreshold.toFixed(1)}%`;
      if (this._lastReturnTrackWidth !== rtStr) {
        this._lastReturnTrackWidth = rtStr;
        this.fuelReturnTrack.style.width = rtStr;
      }
    }

    const roundedFuelPct = Math.round(fuelPercent);
    if (this.fuelNum) {
      if (this._lastFuel !== roundedFuelPct) {
        this.fuelNum.textContent = roundedFuelPct;
        this._lastFuel = roundedFuelPct;
      }
    } else if (this.fuelText) {
      if (this._lastFuel !== roundedFuelPct) {
        this.fuelText.textContent = `${roundedFuelPct}%`;
        this._lastFuel = roundedFuelPct;
      }
    }

    if (this.fuelBarContainer) {
      const curFuel = Math.round(this.player.fuel);
      const maxFuel = Math.round(this.player.maxFuel);
      const roundedReturn = Math.round(effectiveReturnThreshold);
      const fuelPct = Math.round(fuelPercent);
      const returnCost = Math.round(this.player.getReturnFuelCost ? this.player.getReturnFuelCost() : 0);
      const target = this.player.getReturnFuelTarget ? this.player.getReturnFuelTarget() : null;
      const targetLabel = target && !target.isSurface
        ? `Tankanlage (${target.depth || Math.round(target.gy * 1.5)}m)`
        : 'Basis/Hangar';
      if (this._lastFuelTitleFuel !== curFuel || this._lastFuelTitleReturn !== roundedReturn) {
        this._lastFuelTitleFuel = curFuel;
        this._lastFuelTitleReturn = roundedReturn;
        this.fuelBarContainer.title = roundedReturn > 0
          ? `Tank: ${curFuel}/${maxFuel}L (${fuelPct}%) | Notration für Rückweg zu ${targetLabel}: ${returnCost}L (${roundedReturn}%)`
          : `Tank: ${curFuel}/${maxFuel}L (${fuelPct}%)`;
      }
    }

    // Gadget-Zähler aktualisieren
    if (this.player.gadgets) {
      // Schutz vor unberechtigtem Dynamitbestand (nicht erforscht oder nie im Depot gekauft)
      if (this.player.gadgets.dynamite > 0 && ((this.player.researchedTnt || 0) < 1 || !this.player.hasPurchasedDynamite)) {
        this.player.gadgets.dynamite = 0;
      }
      const dCount = this.player.gadgets.dynamite || 0;
      const fCount = this.player.gadgets.fuel_canister || 0;
      const rCount = this.player.gadgets.repair_kit || 0;

      if (this.countDynamite && this._lastCountDyn !== dCount) {
        this.countDynamite.textContent = dCount;
        this._lastCountDyn = dCount;
        if (this.btnDynamite) this.btnDynamite.classList.toggle('empty', dCount <= 0);
      }
      if (this.countFuel && this._lastCountFuel !== fCount) {
        this.countFuel.textContent = fCount;
        this._lastCountFuel = fCount;
        if (this.btnFuel) this.btnFuel.classList.toggle('empty', fCount <= 0);
      }
      if (this.countRepair && this._lastCountRepair !== rCount) {
        this.countRepair.textContent = rCount;
        this._lastCountRepair = rCount;
        if (this.btnRepair) this.btnRepair.classList.toggle('empty', rCount <= 0);
      }
    }

    // Action Speed Dial & FAB: Generell NUR unter Tage anzeigen und NUR wenn Items/Aktionen vorhanden sind!
    if (isBelowGround) {
      const depthMeters = Math.max(0, Math.floor(this.player.depthMeters || this.player.gy || 0));
      const bs = this.scene.baseSystem;
      let tubeCount = 0;
      let fuelCount = 0;
      let hasPneumaticAction = false;
      let hasGeothermalAction = false;
      let nearby = null;

      if (bs) {
        nearby = bs.getNearbyStation(this.player.gx, this.player.gy, 2.5);
        tubeCount = bs.getAvailableStationCount ? bs.getAvailableStationCount(this.player, 'tube', depthMeters) : 0;
        fuelCount = bs.getAvailableStationCount ? bs.getAvailableStationCount(this.player, 'fuel', depthMeters) : 0;

        // 1. Erzförderung / Rohrpost
        if (this.labelActionPneumatic) {
          if (nearby && (nearby.type === 'pneumatic' || nearby.type === 'tube')) {
            const rawOresCount = (this.player.cargo || []).filter(item => !String(item).startsWith('bar_')).length;
            if (rawOresCount > 0) {
              this.labelActionPneumatic.textContent = 'Erze absaugen';
              if (this.badgeActionPneumatic) {
                this.badgeActionPneumatic.textContent = rawOresCount;
                this.badgeActionPneumatic.style.display = 'flex';
              }
              hasPneumaticAction = true;
            } else {
              this.labelActionPneumatic.textContent = 'Rohrpost bereit';
              if (this.badgeActionPneumatic) {
                this.badgeActionPneumatic.textContent = '0';
                this.badgeActionPneumatic.style.display = 'flex';
              }
            }
          } else {
            this.labelActionPneumatic.textContent = 'Erzförderung';
            if (this.badgeActionPneumatic) {
              this.badgeActionPneumatic.textContent = tubeCount;
              this.badgeActionPneumatic.style.display = 'flex';
            }
            if (tubeCount > 0) hasPneumaticAction = true;
          }
          if (this.btnActionPneumatic) {
            const isUsable = (nearby && (nearby.type === 'pneumatic' || nearby.type === 'tube')) || tubeCount > 0;
            this.btnActionPneumatic.classList.toggle('empty', !isUsable);
          }
        }

        // 2. Tankanlage (Untertage-Tankanlage mit mechanischem Tankarm)
        if (this.labelActionGeothermal) {
          if (nearby && (nearby.type === 'fuel' || nearby.type === 'geothermal')) {
            const pct = Math.round((this.player.fuel / this.player.maxFuel) * 100);
            this.labelActionGeothermal.textContent = `Tankanlage (${pct}%)`;
            if (this.badgeActionGeothermal) {
              this.badgeActionGeothermal.textContent = pct + '%';
              this.badgeActionGeothermal.style.display = 'flex';
            }
            if (this.player.fuel < this.player.maxFuel) {
              hasGeothermalAction = true;
            }
          } else {
            this.labelActionGeothermal.textContent = 'Tankanlage';
            if (this.badgeActionGeothermal) {
              this.badgeActionGeothermal.textContent = fuelCount;
              this.badgeActionGeothermal.style.display = 'flex';
            }
            if (fuelCount > 0) hasGeothermalAction = true;
          }
          if (this.btnActionGeothermal) {
            const isUsable = (nearby && (nearby.type === 'fuel' || nearby.type === 'geothermal')) || fuelCount > 0;
            this.btnActionGeothermal.classList.toggle('empty', !isUsable);
          }
        }
      }

      // Alle Speed-Dial Zeilen dauerhaft im Menü verfügbar halten
      const rowGeothermal = document.getElementById('row-action-geothermal');
      if (rowGeothermal) {
        rowGeothermal.style.display = 'flex';
      }
      const rowPneumatic = document.getElementById('row-action-pneumatic');
      if (rowPneumatic) {
        rowPneumatic.style.display = 'flex';
      }
      const rowDynamite = document.getElementById('row-action-dynamite');
      const dCount = (this.player.gadgets && this.player.gadgets.dynamite) || 0;
      if (rowDynamite) {
        rowDynamite.style.display = 'flex';
      }

      // 3. Detonator-Aktionsbutton (erscheint sobald 1+ TNT im Schacht scharf liegt)
      const placedTntCount = (this.scene.placedTnt || []).length;
      if (this.btnActionDetonate) {
        if (placedTntCount > 0 && isBelowGround) {
          this.btnActionDetonate.style.display = 'inline-flex';
          if (this.badgeActionDetonate) this.badgeActionDetonate.textContent = placedTntCount;
        } else {
          this.btnActionDetonate.style.display = 'none';
        }
      }

      // Gesamten Action FAB nur anzeigen wenn mindestens 1 Item oder Aktion existiert!
      const hasAnyAction = hasGeothermalAction || hasPneumaticAction || dCount > 0 || placedTntCount > 0;
      if (this.actionFabContainer) {
        if (hasAnyAction) {
          if (this.actionFabContainer.style.display !== 'flex') {
            this.actionFabContainer.style.display = 'flex';
          }
        } else {
          if (this.actionFabContainer.style.display !== 'none') {
            this.actionFabContainer.style.display = 'none';
            this.actionFabContainer.classList.remove('open');
          }
        }
      }
    } else {
      // Nicht unter Tage -> FAB und Detonator ausblenden
      if (this.actionFabContainer && this.actionFabContainer.style.display !== 'none') {
        this.actionFabContainer.style.display = 'none';
        this.actionFabContainer.classList.remove('open');
      }
      if (this.btnActionDetonate) this.btnActionDetonate.style.display = 'none';
    }

    // Rückkehr-Status (Kritisch: aktueller Tank erreicht die Rückkehr-Schwelle inkl. Puffer - außerhalb von Tankstellen)
    const isAtHangar = isAtSurface && (this.player.gx >= 13 && this.player.gx <= 17);
    const nearbyStation = (!isAtSurface && this.scene?.baseSystem?.getNearbyStation) ? this.scene.baseSystem.getNearbyStation(this.player.gx, this.player.gy, 2.5) : null;
    const isAtUndergroundFuel = nearbyStation && (nearbyStation.type === 'fuel' || nearbyStation.type === 'geothermal') && (nearbyStation.isBuilt !== false);
    const isAtRefuelStation = isAtHangar || isAtUndergroundFuel;
    const isReturnCritical = !isAtRefuelStation && returnPercent > 2 && fuelPercent <= effectiveReturnThreshold;

    // Tankwarnung: NUR wenn der Tank tatsächlich niedrig ist (<= 15%), NICHT bei Rückkehrschwelle!
    const isFuelLow = fuelPercent <= 15;
    if (this._lastFuelWarning !== isFuelLow) {
      this._lastFuelWarning = isFuelLow;
      if (isFuelLow) this.cardGauges?.classList.add('fuel-warning');
      else this.cardGauges?.classList.remove('fuel-warning');
    }

    // Adaptive Rückkehr-Warnung (oben rechts, pulsierender roter Button/Badge)
    if (this.returnWarn) {
      if (this._lastReturnWarn !== isReturnCritical) {
        this._lastReturnWarn = isReturnCritical;
        this.returnWarn.style.display = isReturnCritical ? 'inline-flex' : 'none';
      }
      if (isReturnCritical) {
        const target = this.player.getReturnFuelTarget ? this.player.getReturnFuelTarget() : null;
        const targetLabel = target && !target.isSurface ? `Tankanlage (${target.depth || Math.round(target.gy * 1.5)}m)` : 'Basis/Hangar';
        this.returnWarn.title = `Notration erreicht! Reicht nur noch bis zur ${targetLabel}.`;
      }
    }

    // Notfall-Rettung Button (bei leerem Tank unter Tage oder bei Game Over)
    if (this.rescueFab) {
      const isFuelEmpty = (this.player.fuel <= 0.05);
      const isActivelyRefueling = this.player.fuelArmState && this.player.fuelArmState.isDockedOnVehicle;
      const showRescueFab = (isFuelEmpty && !isActivelyRefueling && !isAtSurface) || !!this.player.isGameOver;
      this.rescueFab.style.display = showRescueFab ? 'inline-flex' : 'none';
    }

    // --- Warnung bei kritischem Rückweg unter Tage ---
    if (isAtSurface) {
      this.warnedLowFuelOnEntry = false;
      this.warnedPointOfNoReturn = false;
    } else if (isBelowGround) {
      // Warnung beim Einfahren in den Schacht mit zu wenig Treibstoff (< 50%)
      if (!this.warnedLowFuelOnEntry) {
        this.warnedLowFuelOnEntry = true;
        if (fuelPercent < 50) {
          toastManager.show({
            id: 'tank-warning-entry',
            text: `Achtung: Tank fast leer (${Math.round(fuelPercent)}%)! Vor der Abfahrt auftanken.`,
            duration: 4500,
            sound: 'cockpit'
          });
        }
      }

      if (isReturnCritical && !this.warnedPointOfNoReturn) {
        this.warnedPointOfNoReturn = true;
        const target = this.player.getReturnFuelTarget ? this.player.getReturnFuelTarget() : null;
        const targetName = target && !target.isSurface ? `Tankanlage (${target.depth || Math.round(target.gy * 1.5)}m)` : 'Basis';
        toastManager.show({
          id: 'tank-warning-return',
          text: `Tankwarnung: Sofort zur ${targetName} umkehren!`,
          duration: 5000,
          sound: 'cockpit'
        });
      } else if (fuelPercent > effectiveReturnThreshold + 5) {
        this.warnedPointOfNoReturn = false;
      }
    }

    // Karosserie / Rumpfintegrität (Reine Prozent-Anzeige)
    const hullPercent = Math.max(0, Math.min(100, (this.player.hull / this.player.maxHull) * 100));
    const roundedHullPct = Math.round(hullPercent);
    if (this.hullNum) {
      if (this._lastHull !== roundedHullPct) {
        this.hullNum.textContent = roundedHullPct;
        this._lastHull = roundedHullPct;
      }
    } else if (this.hullText) {
      if (this._lastHull !== roundedHullPct) {
        this.hullText.textContent = `${roundedHullPct}%`;
        this._lastHull = roundedHullPct;
      }
    }

    let hullColor = '#10b981';
    if (hullPercent <= 20) hullColor = '#ef4444';
    else if (hullPercent <= 45) hullColor = '#f59e0b';

    if (this._lastHullColor !== hullColor) {
      this._lastHullColor = hullColor;
      if (this.hullIcon) {
        this.hullIcon.style.color = hullColor;
        const path = document.getElementById('hud-hull-icon-path');
        if (path) path.setAttribute('fill', hullColor);
      }
      if (this.hullText) this.hullText.style.color = '';
    }

    if (this.hullCluster) {
      const curHull = Math.round(this.player.hull);
      const maxHull = Math.round(this.player.maxHull);
      const roundedHullPct = Math.round(hullPercent);
      if (this._lastHullTitleHp !== curHull || this._lastHullTitleMax !== maxHull) {
        this._lastHullTitleHp = curHull;
        this._lastHullTitleMax = maxHull;
        this.hullCluster.title = `Driller-Status & Panzerung: ${curHull}/${maxHull} HP (${roundedHullPct}%) - Klick zum Öffnen`;
      }
    }

    const needsHullWarning = hullPercent <= 20;
    if (this._lastHullWarning !== needsHullWarning) {
      this._lastHullWarning = needsHullWarning;
      if (needsHullWarning) this.cardGauges?.classList.add('hull-warning');
      else this.cardGauges?.classList.remove('hull-warning');
    }

    // Fracht (nur als Zahl)
    if (this.cargoNum && this.cargoMax) {
      if (this._lastCargo !== this.player.cargoCount) {
        this.cargoNum.textContent = this.player.cargoCount;
        this._lastCargo = this.player.cargoCount;
      }
      if (this._lastMaxCargo !== this.player.maxCargo) {
        this.cargoMax.textContent = this.player.maxCargo;
        this._lastMaxCargo = this.player.maxCargo;
      }
    } else if (this.cargoText) {
      const cargoStr = `${this.player.cargoCount}<span class="hud-cargo-slash">/</span>${this.player.maxCargo}`;
      if (this._lastCargoStr !== cargoStr) {
        this._lastCargoStr = cargoStr;
        this.cargoText.innerHTML = cargoStr;
      }
    }

    // Level (links & rechts, nur bei Änderung)
    const lvl = this.player.level || 1;
    if (this._lastLevel !== lvl) {
      this._lastLevel = lvl;
      if (this.rankName) this.rankName.textContent = lvl;
      if (this.levelRight) this.levelRight.textContent = lvl;
    }

    // Cash & Tiefe (textContent + Dirty-Check verhindert teure Browser-Reflows)
    if (this._lastCash !== this.player.cash) {
      this._lastCash = this.player.cash;
      if (this.cashText) this.cashText.textContent = `€${this.player.cash.toLocaleString('de-DE')}`;
    }
    if (this._lastDepth !== this.player.depthMeters) {
      this._lastDepth = this.player.depthMeters;
      const dVal = this.player.depthMeters;
      const displayStr = dVal > 0 ? `-${dVal}` : '0';
      if (this.depthVal) {
        this.depthVal.textContent = displayStr;
      } else if (this.depthText) {
        this.depthText.textContent = `${displayStr} m`;
      }
    }

    if (this.drillerModal && this.drillerModal.isOpen && this.drillerModal.syncLiveStats) {
      this.drillerModal.syncLiveStats();
    }
  }

  togglePauseMenu() {
    const modalEl = document.getElementById('building-modal');
    const isModalOpen = modalEl && modalEl.style.display && modalEl.style.display !== 'none';
    if (isModalOpen) {
      closeActiveModal(this.scene);
    } else {
      this.openPauseMenu();
    }
  }

  closePauseMenu() {
    closeActiveModal(this.scene);
  }

  openPauseMenu() {
    soundFx.stopAllLoops?.();
    if (this.scene) this.scene.isPaused = true;
    this.isPauseMenuOpen = true;

    const modalEl = document.getElementById('building-modal');
    const titleEl = document.getElementById('modal-title');
    const bodyEl = document.getElementById('modal-body');
    if (!modalEl || !titleEl || !bodyEl) return;

    titleEl.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px;">
        ${icon('pause', '', 18)}
        <span>SPIELMENÜ</span>
      </div>
    `;

    const freeCount = typeof this.player.freeRescues === 'number' ? this.player.freeRescues : 3;

    bodyEl.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 10px; max-width: 440px; margin: 0 auto; width: 100%; box-sizing: border-box; padding: 0 4px 36px 4px;">
        <!-- 1. Einstellungen -->
        <button id="btn-menu-settings" class="btn-action" style="height: 48px; width: 100%; font-size: 12.5px; font-weight: 700; justify-content: flex-start; padding: 0 16px; gap: 14px; border-radius: 12px; background: rgba(30, 41, 59, 0.65); border: none; box-shadow: 0 2px 6px rgba(0,0,0,0.2);">
          <span style="color: #38bdf8; display: inline-flex;">${icon('settings', '', 18)}</span>
          <div style="display: flex; flex-direction: column; text-align: left; line-height: 1.2;">
            <span style="color: #f8fafc; font-weight: 700;">Einstellungen</span>
            <span style="color: #cbd5e1; font-size: 10.5px; font-weight: 500;">Sound, Vollbild & Spielstand</span>
          </div>
        </button>


        <!-- 3. Bergmann-Buch -->
        <button id="btn-menu-book" class="btn-action" style="height: 48px; width: 100%; font-size: 12.5px; font-weight: 700; justify-content: flex-start; padding: 0 16px; gap: 14px; border-radius: 12px; background: rgba(30, 41, 59, 0.65); border: none; box-shadow: 0 2px 6px rgba(0,0,0,0.2);">
          <span style="color: #fbbf24; display: inline-flex;">${icon('book-open', '', 18)}</span>
          <div style="display: flex; flex-direction: column; text-align: left; line-height: 1.2;">
            <span style="color: #f8fafc; font-weight: 700;">Bergmann-Buch</span>
            <span style="color: #cbd5e1; font-size: 10.5px; font-weight: 500;">Schacht-Logbuch, entdeckte Erze & Schichten</span>
          </div>
        </button>

        <!-- 4. Grubenwehr-Rettung anfordern -->
        <button id="btn-menu-rescue" class="btn-action" style="height: 48px; width: 100%; font-size: 12.5px; font-weight: 700; justify-content: flex-start; padding: 0 16px; gap: 14px; border-radius: 12px; background: rgba(239, 68, 68, 0.12); border: 1px solid rgba(239, 68, 68, 0.35); box-shadow: 0 2px 6px rgba(0,0,0,0.2);">
          <span style="color: #f87171; display: inline-flex;">${icon('shield-alert', '', 18)}</span>
          <div style="display: flex; flex-direction: column; text-align: left; line-height: 1.2;">
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="color: #f8fafc; font-weight: 700;">Grubenwehr-Rettung</span>
              ${!this.player.firstRescueUsed ? `<span style="font-size: 10px; font-weight: 800; background: rgba(245, 158, 11, 0.25); color: #fbbf24; padding: 1px 6px; border-radius: 4px;">1x Frei</span>` : ''}
            </div>
            <span style="color: #cbd5e1; font-size: 10.5px; font-weight: 500;">Fahrzeug zur Basis bergen & Notbetankung</span>
          </div>
        </button>

        <!-- 5. Über das Spiel -->
        <button id="btn-menu-about" class="btn-action" style="height: 48px; width: 100%; font-size: 12.5px; font-weight: 700; justify-content: flex-start; padding: 0 16px; gap: 14px; border-radius: 12px; background: rgba(30, 41, 59, 0.65); border: none; box-shadow: 0 2px 6px rgba(0,0,0,0.2);">
          <span style="color: #a78bfa; display: inline-flex;">${icon('info', '', 18)}</span>
          <div style="display: flex; flex-direction: column; text-align: left; line-height: 1.2;">
            <span style="color: #f8fafc; font-weight: 700;">Über</span>
            <span style="color: #cbd5e1; font-size: 10.5px; font-weight: 500;">Version, Lizenzen & Entwickler</span>
          </div>
        </button>

        <!-- 6. Zur Startseite -->
        <button id="btn-menu-startscreen" class="btn-action" style="height: 48px; width: 100%; font-size: 12.5px; font-weight: 700; justify-content: flex-start; padding: 0 16px; gap: 14px; border-radius: 12px; background: rgba(30, 41, 59, 0.65); border: none; box-shadow: 0 2px 6px rgba(0,0,0,0.2);">
          <span style="color: #f97316; display: inline-flex;">${icon('home', '', 18)}</span>
          <div style="display: flex; flex-direction: column; text-align: left; line-height: 1.2;">
            <span style="color: #f8fafc; font-weight: 700;">Zur Startseite</span>
            <span style="color: #cbd5e1; font-size: 10.5px; font-weight: 500;">Speichern & Hauptmenü öffnen</span>
          </div>
        </button>
      </div>
    `;

    refreshIcons(modalEl);

    // Event-Listener
    const settingsBtn = document.getElementById('btn-menu-settings');
    if (settingsBtn) {
      settingsBtn.onclick = () => this.openSettingsView();
    }

    const rescueBtn = document.getElementById('btn-menu-rescue');
    if (rescueBtn) {
      rescueBtn.onclick = () => {
        closeActiveModal(this.scene);
        this.scene.rescueModal?.open();
      };
    }


    const bookBtn = document.getElementById('btn-menu-book') || document.getElementById('btn-menu-guide');
    if (bookBtn) {
      bookBtn.onclick = () => this.minerBookModal.open('ores');
    }

    const aboutBtn = document.getElementById('btn-menu-about');
    if (aboutBtn) {
      aboutBtn.onclick = () => this.openAboutView();
    }

    const startscreenBtn = document.getElementById('btn-menu-startscreen');
    if (startscreenBtn) {
      startscreenBtn.onclick = () => {
        soundFx.playClick();
        SaveSystem.save(this.scene);
        closeActiveModal(this.scene);
        if (this.scene?.startScreen) {
          this.scene.startScreen.show();
        }
      };
    }

    modalEl.style.display = 'flex';
  }

  openSettingsView() {
    const modalEl = document.getElementById('building-modal');
    const titleEl = document.getElementById('modal-title');
    const bodyEl = document.getElementById('modal-body');
    if (!modalEl || !titleEl || !bodyEl) return;

    titleEl.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px;">
        ${icon('settings', '', 18)}
        <span>EINSTELLUNGEN</span>
      </div>
    `;

    const slots = SaveSystem.listSlots();

    const slotsHtml = slots.map(s => `
      <div style="background: rgba(15, 23, 42, 0.75); border: ${s.isCurrent ? '1.5px solid #10b981' : '1px solid rgba(255,255,255,0.08)'}; border-radius: 10px; padding: 10px 12px; display: flex; justify-content: space-between; align-items: center; gap: 8px; flex-wrap: wrap;">
        <div style="display: flex; flex-direction: column; gap: 3px; min-width: 170px;">
          <div style="display: flex; align-items: center; gap: 6px;">
            <strong style="color: #f8fafc; font-size: 12.5px;">${s.label}</strong>
            ${s.isCurrent ? '<span style="background: rgba(16,185,129,0.15); border: 1px solid rgba(16,185,129,0.4); color: #10b981; font-size: 9.5px; font-weight: 800; padding: 1px 6px; border-radius: 99px;">AKTIV</span>' : ''}
          </div>
          <div style="font-size: 11px; color: ${s.exists ? '#94a3b8' : '#64748b'}; font-variant-numeric: tabular-nums;">
            ${s.exists
              ? `Lv. ${s.level} · €${s.cash.toLocaleString()} · Tiefe: ${s.highestDepth > 0 ? `-${s.highestDepth}` : '0'}m · <span style="color: #64748b;">${s.dateFormatted}</span>`
              : 'Freier Speicherplatz (Leer)'
            }
          </div>
        </div>
        <div style="display: flex; gap: 6px; align-items: center;">
          ${s.exists ? `
            <button class="btn-slot-load btn-action" data-slot="${s.slotId}" style="height: 30px; padding: 0 12px; font-size: 11px; border: none; border-radius: 6px; display: inline-flex; align-items: center; gap: 5px;" title="Spielstand laden">
              ${icon('play', '', 12)} Spiel laden
            </button>
            <button class="btn-slot-delete btn-3d-danger" data-slot="${s.slotId}" style="height: 30px; width: 30px; padding: 0; justify-content: center; display: inline-flex; align-items: center; border: none; border-radius: 6px;" title="Diesen Slot löschen">
              ${icon('trash-2', '', 12)}
            </button>
          ` : `
            <button class="btn-slot-start btn-buy" data-slot="${s.slotId}" style="height: 30px; padding: 0 12px; font-size: 11px; border: none; border-radius: 6px; display: inline-flex; align-items: center; gap: 5px;" title="Neues Spiel in diesem Slot starten">
              ${icon('play', '', 12)} Neu starten
            </button>
          `}
        </div>
      </div>
    `).join('');

    const isDevUnlocked = !!(this.devModeUnlocked || (typeof localStorage !== 'undefined' && localStorage.getItem('vein_dev_mode') === '1'));

    bodyEl.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 12px; max-width: 580px; margin: 0 auto; width: 100%; box-sizing: border-box; padding: 0 4px 36px 4px;">
        <button id="btn-back-to-menu" class="btn-action" style="height: 32px; padding: 0 14px; font-size: 11.5px; align-self: flex-start; display: inline-flex; align-items: center; gap: 6px; border: none; border-radius: 8px;">
          ${icon('arrow-left', '', 14)}
          <span>Zurück zum Spielmenü</span>
        </button>

        <!-- Audio (Soundeffekte & Musik getrennt) & Anzeige -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 8px;">
          <!-- Soundeffekte -->
          <div style="background: rgba(15, 23, 42, 0.65); border-radius: 12px; padding: 10px 12px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 1px 4px rgba(0,0,0,0.2);">
            <div>
              <strong style="color: #f8fafc; font-size: 12px; display: block;">Soundeffekte</strong>
              <span style="color: #94a3b8; font-size: 10.5px;">Bohren & Ketten</span>
            </div>
            <button id="btn-toggle-sound" class="${soundFx.soundMuted ? 'btn-3d-secondary' : 'btn-action'}" style="height: 30px; padding: 0 10px; font-size: 11px; display: inline-flex; align-items: center; gap: 5px; border: none; border-radius: 8px;">
              ${icon(soundFx.soundMuted ? 'volume-x' : 'volume-2', '', 13)}
              <span>${soundFx.soundMuted ? 'Aus' : 'An'}</span>
            </button>
          </div>

          <!-- Musik / Soundtrack -->
          <div style="background: rgba(15, 23, 42, 0.65); border-radius: 12px; padding: 10px 12px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 1px 4px rgba(0,0,0,0.2);">
            <div>
              <strong style="color: #f8fafc; font-size: 12px; display: block;">Musik</strong>
              <span style="color: #94a3b8; font-size: 10.5px;">Untertage-Streicher</span>
            </div>
            <button id="btn-toggle-music" class="${soundFx.musicMuted ? 'btn-3d-secondary' : 'btn-action'}" style="height: 30px; padding: 0 10px; font-size: 11px; display: inline-flex; align-items: center; gap: 5px; border: none; border-radius: 8px;">
              ${icon(soundFx.musicMuted ? 'volume-x' : 'music', '', 13)}
              <span>${soundFx.musicMuted ? 'Aus' : 'An'}</span>
            </button>
          </div>

          <!-- Vollbild -->
          <div style="background: rgba(15, 23, 42, 0.65); border-radius: 12px; padding: 10px 12px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 1px 4px rgba(0,0,0,0.2);">
            <div>
              <strong style="color: #f8fafc; font-size: 12px; display: block;">Vollbildmodus</strong>
              <span style="color: #94a3b8; font-size: 10.5px;">Desktop & Mobile</span>
            </div>
            <button id="btn-toggle-fullscreen" class="${document.fullscreenElement ? 'btn-3d-success' : 'btn-action'}" style="height: 30px; padding: 0 10px; font-size: 11px; display: inline-flex; align-items: center; gap: 5px; border: none; border-radius: 8px;">
              ${icon(document.fullscreenElement ? 'minimize' : 'maximize', '', 13)}
              <span>${document.fullscreenElement ? 'Beenden' : 'An'}</span>
            </button>
          </div>

          <!-- Oberfläche / Tageszeit (Tag & Nacht) -->
          <div style="background: rgba(15, 23, 42, 0.65); border-radius: 12px; padding: 10px 12px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 1px 4px rgba(0,0,0,0.2);">
            <div>
              <strong style="color: #f8fafc; font-size: 12px; display: block;">Oberfläche</strong>
              <span style="color: #94a3b8; font-size: 10.5px;">Tag- & Nachtmodus</span>
            </div>
            <button id="btn-toggle-time-of-day" class="${(this.scene?.surfaceTheme === 'night') ? 'btn-3d-secondary' : 'btn-action'}" style="height: 30px; padding: 0 10px; font-size: 11px; display: inline-flex; align-items: center; gap: 5px; border: none; border-radius: 8px;" title="Zwischen Tag und Nacht umschalten">
              ${icon((this.scene?.surfaceTheme === 'night') ? 'moon' : 'sun', '', 13)}
              <span>${(this.scene?.surfaceTheme === 'night') ? 'Nacht' : 'Tag'}</span>
            </button>
          </div>
        </div>

        <!-- 1. Spiele -->
        <div style="background: rgba(15, 23, 42, 0.65); border-radius: 12px; padding: 12px 14px; display: flex; flex-direction: column; gap: 10px; box-shadow: 0 1px 4px rgba(0,0,0,0.2);">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 6px;">
            <div>
              <strong style="color: #f8fafc; font-size: 12.5px; display: inline-flex; align-items: center; gap: 6px;">
                ${icon('database', '', 14)}
                SPIELE
              </strong>
            </div>
          </div>

          <!-- Slots Liste -->
          <div style="display: flex; flex-direction: column; gap: 8px;">
            ${slotsHtml}
          </div>

          <!-- Backup / JSON Tools -->
          <div style="display: flex; gap: 8px; align-items: center; justify-content: flex-end; padding-top: 4px; border-top: 1px solid rgba(255,255,255,0.06);">
            <input type="file" id="input-import-file" accept=".json" style="display: none;" />
            <button id="btn-import-json" class="btn-action" style="height: 28px; padding: 0 10px; font-size: 10.5px; display: inline-flex; align-items: center; gap: 5px; border: none; border-radius: 6px;">
              ${icon('upload', '', 12)} Spielstand importieren
            </button>
            <button id="btn-export-json" class="btn-action" style="height: 28px; padding: 0 10px; font-size: 10.5px; display: inline-flex; align-items: center; gap: 5px; border: none; border-radius: 6px;">
              ${icon('download', '', 12)} Spielstand exportieren
            </button>
          </div>
        </div>

        ${isDevUnlocked ? `
        <!-- 2. Entwicklermodus (Dev-Test-Presets) -->
        <div style="background: linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(16, 185, 129, 0.08)); border: 1.5px solid rgba(245, 158, 11, 0.4); border-radius: 12px; padding: 12px 14px; display: flex; flex-direction: column; gap: 10px; box-shadow: 0 0 16px rgba(245, 158, 11, 0.08);">
          <div>
            <strong style="color: #fbbf24; font-size: 12.5px; display: inline-flex; align-items: center; gap: 6px; text-transform: uppercase; letter-spacing: 0.5px;">
              ${icon('wrench', '', 14)}
              Entwicklermodus · Test-Presets
            </strong>
            <span style="color: #cbd5e1; font-size: 11px; display: block; margin-top: 2px; line-height: 1.4;">
              Starte direkt in höheren Spielstufen mit fiktivem Spielfortschritt: <strong>abgebautes Schacht- & Stollennetz</strong>, passende Bohrer-Upgrades, Finanzen, Basis-Bauten & Erze!
            </span>
          </div>

          <!-- Presets Grid -->
          <div style="display: flex; flex-direction: column; gap: 8px;">
            <!-- Early-Game -->
            <div style="background: rgba(15, 23, 42, 0.8); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 10px; padding: 10px 12px; display: flex; justify-content: space-between; align-items: center; gap: 8px; flex-wrap: wrap;">
              <div>
                <div style="display: flex; align-items: center; gap: 6px;">
                  <span style="font-size: 14px;">🟢</span>
                  <strong style="color: #34d399; font-size: 12px;">Early-Game (85m Tiefe · Schiefer)</strong>
                </div>
                <div style="font-size: 10.5px; color: #94a3b8; margin-top: 2px;">
                  Level 4 · €2.400 · Wolfram-Bohrer (Tier 2) · 70L Tank · 85m Schacht mit Stollen
                </div>
              </div>
              <button class="btn-dev-preset btn-buy" data-preset="early" style="height: 30px; padding: 0 12px; font-size: 11px; border: none; border-radius: 6px; display: inline-flex; align-items: center; gap: 5px;">
                ${icon('zap', '', 12)} Early laden
              </button>
            </div>

            <!-- Mid-Game -->
            <div style="background: rgba(15, 23, 42, 0.8); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 10px; padding: 10px 12px; display: flex; justify-content: space-between; align-items: center; gap: 8px; flex-wrap: wrap;">
              <div>
                <div style="display: flex; align-items: center; gap: 6px;">
                  <span style="font-size: 14px;">🟡</span>
                  <strong style="color: #fbbf24; font-size: 12px;">Mid-Game (360m Tiefe · Granit & Gold)</strong>
                </div>
                <div style="font-size: 10.5px; color: #94a3b8; margin-top: 2px;">
                  Level 8 · €32.000 · Laser-Fräse (Tier 5) · 235L Tank · Fabrik Stufe 3 · 360m Stollen
                </div>
              </div>
              <button class="btn-dev-preset btn-buy" data-preset="mid" style="height: 30px; padding: 0 12px; font-size: 11px; border: none; border-radius: 6px; display: inline-flex; align-items: center; gap: 5px;">
                ${icon('zap', '', 12)} Mid laden
              </button>
            </div>

            <!-- Late-Game -->
            <div style="background: rgba(15, 23, 42, 0.8); border: 1px solid rgba(168, 85, 247, 0.3); border-radius: 10px; padding: 10px 12px; display: flex; justify-content: space-between; align-items: center; gap: 8px; flex-wrap: wrap;">
              <div>
                <div style="display: flex; align-items: center; gap: 6px;">
                  <span style="font-size: 14px;">🟣</span>
                  <strong style="color: #c084fc; font-size: 12px;">Late-Game (1.150m · Tiefenkern & Titan)</strong>
                </div>
                <div style="font-size: 10.5px; color: #94a3b8; margin-top: 2px;">
                  Level 15 · €350.000 · Quantenfräse (Tier 9) · 850L Tank · Alle Erze · 1.150m Mega-Mine
                </div>
              </div>
              <button class="btn-dev-preset btn-buy" data-preset="late" style="height: 30px; padding: 0 12px; font-size: 11px; border: none; border-radius: 6px; display: inline-flex; align-items: center; gap: 5px;">
                ${icon('zap', '', 12)} Late laden
              </button>
            </div>
          </div>
        </div>
        ` : ''}

        <!-- 3. Spielstand zurücksetzen -->
        <div style="background: rgba(15, 23, 42, 0.65); border-radius: 12px; padding: 12px 14px; display: flex; flex-direction: column; gap: 8px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <strong style="color: #f8fafc; font-size: 12px; display: block;">Aktiven Spielstand zurücksetzen</strong>
              <span style="color: #94a3b8; font-size: 10.5px;">Löscht den aktuellen Speicherplatz vollständig</span>
            </div>
            <button id="btn-reset-save" class="btn-3d-danger" style="height: 30px; padding: 0 12px; font-size: 11px; border: none; border-radius: 6px;">
              ${icon('rotate-ccw', '', 12)} Zurücksetzen
            </button>
          </div>

          <!-- Sicherheitsabfrage mit Eingabe von "delete" -->
          <div id="box-delete-confirm" style="display: none; margin-top: 6px; background: rgba(239, 68, 68, 0.08); border-radius: 10px; padding: 12px; flex-direction: column; gap: 8px;">
            <div style="display: flex; align-items: center; gap: 6px; color: #f87171; font-weight: 700; font-size: 12px;">
              ${icon('alert-triangle', '', 14)}
              <span>Sicherheitsabfrage: Spielstand löschen</span>
            </div>
            <div style="font-size: 11.5px; color: #cbd5e1; line-height: 1.4;">
              Der Fortschritt von <strong style="color: #ffffff;">Slot ${SaveSystem.getActiveSlotId()}</strong> geht verloren. Tippe zur Bestätigung <strong style="color: #ffffff; background: rgba(0, 0, 0, 0.5); padding: 2px 6px; border-radius: 4px; font-family: monospace;">delete</strong> ein:
            </div>
            <div style="display: flex; gap: 8px; align-items: center; margin-top: 4px;">
              <input type="text" id="input-confirm-delete" placeholder="delete" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" style="flex: 1; height: 34px; background: rgba(15, 23, 42, 0.9); border: 1px solid rgba(239, 68, 68, 0.35); border-radius: 8px; color: #ffffff; padding: 0 10px; font-size: 13px; font-weight: 700; outline: none;" />
              <button id="btn-confirm-delete-action" class="btn-3d-danger" disabled style="height: 34px; padding: 0 14px; font-size: 12px; font-weight: 800; opacity: 0.35; cursor: not-allowed; white-space: nowrap; border: none; border-radius: 8px;">
                Löschen
              </button>
              <button id="btn-cancel-delete" class="btn-action" style="height: 34px; padding: 0 12px; font-size: 12px; white-space: nowrap; border: none; border-radius: 8px;">
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    refreshIcons(modalEl);

    const backBtn = document.getElementById('btn-back-to-menu');
    if (backBtn) {
      backBtn.onclick = () => this.openPauseMenu();
    }

    const toggleSoundBtn = document.getElementById('btn-toggle-sound');
    if (toggleSoundBtn) {
      toggleSoundBtn.onclick = () => {
        soundFx.toggleSoundMute();
        toggleSoundBtn.innerHTML = `
          ${icon(soundFx.soundMuted ? 'volume-x' : 'volume-2', '', 13)}
          <span>${soundFx.soundMuted ? 'Aus' : 'An'}</span>
        `;
        toggleSoundBtn.className = soundFx.soundMuted ? 'btn-3d-secondary' : 'btn-action';
        refreshIcons(toggleSoundBtn);
      };
    }

    const toggleMusicBtn = document.getElementById('btn-toggle-music');
    if (toggleMusicBtn) {
      toggleMusicBtn.onclick = () => {
        soundFx.toggleMusicMute();
        toggleMusicBtn.innerHTML = `
          ${icon(soundFx.musicMuted ? 'volume-x' : 'music', '', 13)}
          <span>${soundFx.musicMuted ? 'Aus' : 'An'}</span>
        `;
        toggleMusicBtn.className = soundFx.musicMuted ? 'btn-3d-secondary' : 'btn-action';
        refreshIcons(toggleMusicBtn);
      };
    }

    const toggleFullscreenBtn = document.getElementById('btn-toggle-fullscreen');
    if (toggleFullscreenBtn) {
      toggleFullscreenBtn.onclick = async () => {
        try {
          if (!document.fullscreenElement) {
            if (document.documentElement.requestFullscreen) {
              await document.documentElement.requestFullscreen();
            } else if (document.documentElement.webkitRequestFullscreen) {
              await document.documentElement.webkitRequestFullscreen();
            }
          } else {
            if (document.exitFullscreen) {
              await document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
              await document.webkitExitFullscreen();
            }
          }
        } catch (err) {
          console.warn('Fullscreen toggle failed:', err);
        }
        const isFs = !!document.fullscreenElement;
        toggleFullscreenBtn.innerHTML = `
          ${icon(isFs ? 'minimize' : 'maximize', '', 13)}
          <span>${isFs ? 'Beenden' : 'An'}</span>
        `;
        toggleFullscreenBtn.className = isFs ? 'btn-3d-success' : 'btn-action';
        refreshIcons(toggleFullscreenBtn);
      };
    }

    const toggleTimeBtn = document.getElementById('btn-toggle-time-of-day');
    if (toggleTimeBtn) {
      toggleTimeBtn.onclick = () => {
        try {
          soundFx.playClick();
        } catch (_) {}
        const sc = this.scene;
        if (sc && sc.toggleSurfaceTheme) {
          const nextTheme = sc.toggleSurfaceTheme();
          const isNightNow = nextTheme === 'night';
          toggleTimeBtn.innerHTML = `
            ${icon(isNightNow ? 'moon' : 'sun', '', 13)}
            <span>${isNightNow ? 'Nacht' : 'Tag'}</span>
          `;
          toggleTimeBtn.className = isNightNow ? 'btn-3d-secondary' : 'btn-action';
          refreshIcons(toggleTimeBtn);
        }
      };
    }

    // Slots Aktionen
    bodyEl.querySelectorAll('.btn-slot-start').forEach(btn => {
      btn.onclick = () => {
        const slotId = parseInt(btn.getAttribute('data-slot'), 10);
        if (confirm(`Neues Spiel in Slot ${slotId} starten? Dein aktueller Spielfortschritt wird zuvor gesichert.`)) {
          SaveSystem.save(this.scene);
          SaveSystem.setActiveSlotId(slotId);
          SaveSystem.resetToNewGame(this.scene);
          SaveSystem.save(this.scene);
          soundFx.playPurchase();
          closeActiveModal(this.scene);
          if (this.scene) {
            this.scene.isPaused = false;
            this.scene.events.emit('notify', `Neues Spiel in Slot ${slotId} gestartet!`);
          }
        }
      };
    });

    bodyEl.querySelectorAll('.btn-slot-load').forEach(btn => {
      btn.onclick = () => {
        const slotId = parseInt(btn.getAttribute('data-slot'), 10);
        SaveSystem.save(this.scene);
        if (SaveSystem.loadSlot(this.scene, slotId)) {
          soundFx.playPurchase();
          closeActiveModal(this.scene);
          if (this.scene) {
            this.scene.isPaused = false;
            this.scene.events.emit('notify', `Slot ${slotId} geladen!`);
          }
        }
      };
    });

    bodyEl.querySelectorAll('.btn-slot-save').forEach(btn => {
      btn.onclick = () => {
        const slotId = parseInt(btn.getAttribute('data-slot'), 10);
        if (SaveSystem.saveToSlot(this.scene, slotId)) {
          SaveSystem.setActiveSlotId(slotId);
          soundFx.playClick();
          this.scene.events.emit('notify', `💾 Spielstand in Slot ${slotId} gesichert!`);
          this.openSettingsView();
        }
      };
    });

    bodyEl.querySelectorAll('.btn-slot-delete').forEach(btn => {
      btn.onclick = () => {
        const slotId = parseInt(btn.getAttribute('data-slot'), 10);
        if (confirm(`Möchtest du Slot ${slotId} wirklich leeren?`)) {
          SaveSystem.deleteSlot(slotId);
          soundFx.playClick();
          this.scene.events.emit('notify', `🗑️ Slot ${slotId} gelöscht!`);
          this.openSettingsView();
        }
      };
    });

    // Entwicklermodus Presets
    bodyEl.querySelectorAll('.btn-dev-preset').forEach(btn => {
      btn.onclick = () => {
        const preset = btn.getAttribute('data-preset');
        if (confirm(`Entwicklermodus: Möchtest du das [${preset.toUpperCase()}]-Preset laden?\nDein aktueller Slot wird mit diesem Test-Spielfortschritt überschrieben.`)) {
          SaveSystem.loadDevPreset(this.scene, preset);
          soundFx.playLevelUp();
          this.openSettingsView();
        }
      };
    });

    // JSON Exportieren
    const exportBtn = document.getElementById('btn-export-json');
    if (exportBtn) {
      exportBtn.onclick = () => {
        const json = SaveSystem.exportSlotJSON(SaveSystem.getActiveSlotId());
        if (!json) {
          alert('Kein Spielstand im aktiven Slot vorhanden!');
          return;
        }
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `deep_miner_save_slot${SaveSystem.getActiveSlotId()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        soundFx.playClick();
      };
    }

    // JSON Importieren
    const importBtn = document.getElementById('btn-import-json');
    const importFileInput = document.getElementById('input-import-file');
    if (importBtn && importFileInput) {
      importBtn.onclick = () => {
        importFileInput.click();
      };

      importFileInput.onchange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
          const content = evt.target?.result;
          if (content && typeof content === 'string') {
            const activeId = SaveSystem.getActiveSlotId();
            if (SaveSystem.importSlotJSON(this.scene, activeId, content)) {
              soundFx.playLevelUp();
              this.openSettingsModal();
            } else {
              alert('Fehler: Die Datei konnte nicht als gültiger Spielstand gelesen werden.');
            }
          }
        };
        reader.readAsText(file);
      };
    }

    // Spielstand zurücksetzen
    const resetSaveBtn = document.getElementById('btn-reset-save');
    const deleteBox = document.getElementById('box-delete-confirm');
    const deleteInput = document.getElementById('input-confirm-delete');
    const deleteConfirmBtn = document.getElementById('btn-confirm-delete-action');
    const deleteCancelBtn = document.getElementById('btn-cancel-delete');

    if (resetSaveBtn && deleteBox) {
      resetSaveBtn.onclick = () => {
        deleteBox.style.display = 'flex';
        resetSaveBtn.style.display = 'none';
        if (deleteInput) {
          deleteInput.value = '';
          deleteInput.focus();
        }
      };
    }

    if (deleteCancelBtn && deleteBox && resetSaveBtn) {
      deleteCancelBtn.onclick = () => {
        deleteBox.style.display = 'none';
        resetSaveBtn.style.display = 'flex';
        if (deleteInput) deleteInput.value = '';
      };
    }

    if (deleteInput && deleteConfirmBtn) {
      const checkMatch = () => {
        const isMatch = deleteInput.value.trim().toLowerCase() === 'delete';
        deleteConfirmBtn.disabled = !isMatch;
        deleteConfirmBtn.style.opacity = isMatch ? '1' : '0.35';
        deleteConfirmBtn.style.cursor = isMatch ? 'pointer' : 'not-allowed';
        return isMatch;
      };

      ['keydown', 'keyup', 'keypress'].forEach((evt) => {
        deleteInput.addEventListener(evt, (e) => {
          e.stopPropagation();
          if (evt === 'keydown' && e.key === 'Enter' && checkMatch()) {
            executeDelete();
          }
        });
      });

      deleteInput.addEventListener('input', checkMatch);

      const executeDelete = () => {
        if (checkMatch()) {
          deleteConfirmBtn.innerText = 'Wird gelöscht...';
          deleteConfirmBtn.disabled = true;
          SaveSystem.clear();
          window.location.reload();
        }
      };

      deleteConfirmBtn.onclick = executeDelete;
    }
  }

  openGuideView(activeTab = 'controls') {
    const modalEl = document.getElementById('building-modal');
    const titleEl = document.getElementById('modal-title');
    const bodyEl = document.getElementById('modal-body');
    if (!modalEl || !titleEl || !bodyEl) return;

    titleEl.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px;">
        ${icon('book-open', '', 18)}
        <span>ERKLÄRUNGEN & ANLEITUNG</span>
      </div>
    `;

    const tabs = [
      { id: 'controls', label: 'Steuerung', icon: 'gamepad-2' },
      { id: 'base', label: 'Gebäude', icon: 'building-2' },
      { id: 'refinery', label: 'Erze & Fabrik', icon: 'factory' },
      { id: 'tips', label: 'Profi-Tipps', icon: 'lightbulb' }
    ];

    const tabButtonsHtml = tabs.map(t => `
      <button class="register-tab guide-tab-btn ${activeTab === t.id ? 'active' : ''}" data-tab="${t.id}">
        ${icon(t.icon, '', 13)}
        <span>${t.label}</span>
      </button>
    `).join('');

    let contentHtml = '';

    if (activeTab === 'controls') {
      contentHtml = `
        <div style="display: flex; flex-direction: column; gap: 10px;">
          <div style="background: rgba(15, 23, 42, 0.65); border: none; border-radius: 12px; padding: 12px 14px; display: flex; flex-direction: column; gap: 8px; box-shadow: 0 1px 4px rgba(0,0,0,0.2);">
            <div style="font-size: 12px; font-weight: 800; color: #38bdf8; text-transform: uppercase;">Desktop-Tastatur</div>
            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 11.5px;">
              <span style="color: #cbd5e1;">Fahren & Bohren</span>
              <div style="display: flex; gap: 4px; align-items: center;">
                <span class="key-badge">W</span><span class="key-badge">A</span><span class="key-badge">S</span><span class="key-badge">D</span>
                <span style="color: #64748b; margin: 0 3px;">/</span>
                <span class="key-badge">↑</span><span class="key-badge">←</span><span class="key-badge">↓</span><span class="key-badge">→</span>
              </div>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 11.5px;">
              <span style="color: #cbd5e1;">Flüssiger Jetpack-Aufstieg</span>
              <div style="display: flex; gap: 4px; align-items: center;">
                <span class="key-badge">W</span><span class="key-badge">↑</span>
                <span style="color: #38bdf8; font-size: 10.5px; font-weight: 600;">(gedrückt halten)</span>
              </div>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 11.5px;">
              <span style="color: #cbd5e1;">Spielmenü & Pause</span>
              <div style="display: flex; gap: 4px; align-items: center;">
                <span class="key-badge">ESC</span>
                <span class="key-badge">P</span>
              </div>
            </div>
          </div>

          <div style="background: rgba(15, 23, 42, 0.65); border: none; border-radius: 12px; padding: 12px 14px; display: flex; flex-direction: column; gap: 8px; box-shadow: 0 1px 4px rgba(0,0,0,0.2);">
            <div style="font-size: 12px; font-weight: 800; color: #38bdf8; text-transform: uppercase;">Touch & Mobile</div>
            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 11.5px;">
              <span style="color: #cbd5e1;">360° Floating Joystick</span>
              <span style="color: #94a3b8;">Unten links berühren & ziehen</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 11.5px;">
              <span style="color: #cbd5e1;">Jetpack-Aufstieg</span>
              <span style="color: #94a3b8;">Joystick nach oben ziehen</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 11.5px;">
              <span style="color: #cbd5e1;">Gebäude betreten</span>
              <span style="color: #94a3b8;">Vor das Gebäude fahren oder antippen</span>
            </div>
          </div>
        </div>
      `;
    } else if (activeTab === 'base') {
      contentHtml = `
        <div style="display: flex; flex-direction: column; gap: 8px;">
          <div style="background: rgba(15, 23, 42, 0.65); border: none; border-radius: 10px; padding: 10px 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.2);">
            <div style="font-size: 12px; font-weight: 700; color: #38bdf8; margin-bottom: 2px; display: flex; align-items: center; gap: 5px;">${icon('laptop-minimal', '', 14)} Büro</div>
            <div style="font-size: 11px; color: #94a3b8; line-height: 1.4;">Auftragszentrale. Erfülle Missionen (z. B. Erze abbauen oder Ziel-Tiefen erreichen) für hohes Extra-Guthaben und Level-Aufstiege.</div>
          </div>
          <div style="background: rgba(15, 23, 42, 0.65); border: none; border-radius: 10px; padding: 10px 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.2);">
            <div style="font-size: 12px; font-weight: 700; color: #fbbf24; margin-bottom: 2px; display: flex; align-items: center; gap: 5px;">${icon('coins', '', 14)} Erzbörse</div>
            <div style="font-size: 11px; color: #94a3b8; line-height: 1.4;">Verkaufe geförderte Rohstoffe und Fabrik-Erzeugnisse. Bietet freie Mengenauswahl und Sofort-Verkauf aller Erze.</div>
          </div>
          <div style="background: rgba(15, 23, 42, 0.65); border: none; border-radius: 10px; padding: 10px 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.2);">
            <div style="font-size: 12px; font-weight: 700; color: #34d399; margin-bottom: 2px; display: flex; align-items: center; gap: 5px;">${icon('wrench', '', 14)} Hangar (Fahrzeug-Werkstatt)</div>
            <div style="font-size: 11px; color: #94a3b8; line-height: 1.4;">Tuning deines Bohrers, Treibstoff-Tanks, Frachtraums, Antriebs und Gehäuseschutzes. Automatisches Auftanken per Tankkabel an der Plattform.</div>
          </div>
          <div style="background: rgba(15, 23, 42, 0.65); border: none; border-radius: 10px; padding: 10px 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.2);">
            <div style="font-size: 12px; font-weight: 700; color: #fb923c; margin-bottom: 2px; display: flex; align-items: center; gap: 5px;">${icon('factory', '', 14)} Fabrik & Raffinerie</div>
            <div style="font-size: 11px; color: #94a3b8; line-height: 1.4;">Schmelze Roherze zu Barren (+50% Erlös) oder kombiniere Erze zu High-Tech-Industriewaren wie Stahlträgern, Bronze und Platinen.</div>
          </div>
          <div style="background: rgba(15, 23, 42, 0.65); border: none; border-radius: 10px; padding: 10px 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.2);">
            <div style="font-size: 12px; font-weight: 700; color: #c084fc; margin-bottom: 2px; display: flex; align-items: center; gap: 5px;">${icon('microscope', '', 14)} Labor</div>
            <div style="font-size: 11px; color: #94a3b8; line-height: 1.4;">High-Tech Forschung. Schalte modernste Bohrköpfe und Sensor-Upgrades frei, um Erze durch Gestein hindurch aufzuspüren.</div>
          </div>
          <div style="background: rgba(15, 23, 42, 0.65); border: none; border-radius: 10px; padding: 10px 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.2);">
            <div style="font-size: 12px; font-weight: 700; color: #e2e8f0; margin-bottom: 2px; display: flex; align-items: center; gap: 5px;">${icon('home', '', 14)} Schachteinstieg & Geologe</div>
            <div style="font-size: 11px; color: #94a3b8; line-height: 1.4;">Die restliche Oberfläche ist unzerstörbar – der Schachteinstieg führt nach unten. Der Geologe im Büro sucht seltene Gesteinsproben für wertvolle Bauteile.</div>
          </div>
        </div>
      `;
    } else if (activeTab === 'refinery') {
      contentHtml = `
        <div style="display: flex; flex-direction: column; gap: 8px;">
          <div style="background: rgba(15, 23, 42, 0.65); border: none; border-radius: 10px; padding: 10px 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.2);">
            <div style="font-size: 12px; font-weight: 700; color: #38bdf8; margin-bottom: 3px;">Tiefenschichten & Mineralien</div>
            <div style="font-size: 11px; color: #94a3b8; line-height: 1.5;">
              • <strong>0–50 m (Humus):</strong> Kohle, Kupfer, Eisen<br>
              • <strong>50–180 m (Schiefer):</strong> Eisen, Zinn, Silber<br>
              • <strong>180–480 m (Granit):</strong> Silber, Gold, Smaragd<br>
              • <strong>480–950 m (Obsidian):</strong> Saphir, Rubin, Diamant<br>
              • <strong>>950 m (Urgestein):</strong> Titan, Platin, Uran, Dunkelmaterie
            </div>
          </div>
          <div style="background: rgba(15, 23, 42, 0.65); border: none; border-radius: 10px; padding: 10px 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.2);">
            <div style="font-size: 12px; font-weight: 700; color: #fb923c; margin-bottom: 3px;">Fabrikstrecke (3 Stationen)</div>
            <div style="font-size: 11px; color: #94a3b8; line-height: 1.4;">
              1. <strong>Zufuhr:</strong> Erze unten einwerfen oder Produkt-Herstellung anstoßen.<br>
              2. <strong>Hochofen:</strong> Schmilzt Ware vollautomatisch mit Timer und Ladebalken.<br>
              3. <strong>Ausgang:</strong> Fertige Barren abholen (für die Börse) oder direkt per Sofort-Verkauf zu Geld machen.
            </div>
          </div>
        </div>
      `;
    } else if (activeTab === 'tips') {
      contentHtml = `
        <div style="display: flex; flex-direction: column; gap: 8px;">
          <div style="background: rgba(15, 23, 42, 0.65); border: none; border-radius: 10px; padding: 10px 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.2);">
            <div style="font-size: 12px; font-weight: 700; color: #10b981; margin-bottom: 2px; display: flex; align-items: center; gap: 5px;">${icon('fuel', '', 14)} Treibstoff & Betankung</div>
            <div style="font-size: 11px; color: #94a3b8; line-height: 1.4;">Fahren, Steigflug und insbesondere das Bohren durch Gestein verbrauchen Treibstoff. Parke an der Hangar-Plattform an der Oberfläche – das Tankkabel füllt deinen Tank kostenlos auf.</div>
          </div>
          <div style="background: rgba(15, 23, 42, 0.65); border: none; border-radius: 10px; padding: 10px 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.2);">
            <div style="font-size: 12px; font-weight: 700; color: #38bdf8; margin-bottom: 2px; display: flex; align-items: center; gap: 5px;">${icon('wind', '', 14)} Steigflug & Schubdüsen</div>
            <div style="font-size: 11px; color: #94a3b8; line-height: 1.4;">Halte <strong>W</strong> oder <strong>↑</strong> gedrückt, um mit dem Triebwerk aufzusteigen. Der Aufstieg verbraucht Treibstoff – plane deine Rückkehr rechtzeitig!</div>
          </div>
          <div style="background: rgba(15, 23, 42, 0.65); border: none; border-radius: 10px; padding: 10px 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.2);">
            <div style="font-size: 12px; font-weight: 700; color: #f87171; margin-bottom: 2px; display: flex; align-items: center; gap: 5px;">${icon('shield-alert', '', 14)} 3 Kostenlose Notfall-Rettungen</div>
            <div style="font-size: 11px; color: #94a3b8; line-height: 1.4;">Wenn dein Tank tief unten leer wird oder du festsitzt, öffne das Spielmenü und nutze die Notfall-Rettung. Die ersten 3 Rettungen sind gratis!</div>
          </div>
        </div>
      `;
    }

    bodyEl.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 12px; max-width: 580px; margin: 0 auto; width: 100%; box-sizing: border-box; padding: 0 4px 36px 4px;">
        <button id="btn-back-to-menu" class="btn-action" style="height: 32px; padding: 0 14px; font-size: 11.5px; align-self: flex-start; display: inline-flex; align-items: center; gap: 6px; border: none; border-radius: 8px;">
          ${icon('arrow-left', '', 14)}
          <span>Zurück zum Spielmenü</span>
        </button>

        <div class="register-tab-container" style="display: flex; flex-direction: column; width: 100%; gap: 0 !important; row-gap: 0 !important;">
          <div class="register-tab-bar" style="width: 100%;">
            ${tabButtonsHtml}
          </div>
          <div class="register-tab-panel">
            ${contentHtml}
          </div>
        </div>
      </div>
    `;

    refreshIcons(modalEl);

    const backBtn = document.getElementById('btn-back-to-menu');
    if (backBtn) {
      backBtn.onclick = () => this.openPauseMenu();
    }

    bodyEl.querySelectorAll('.guide-tab-btn').forEach(btn => {
      btn.onclick = () => {
        const tabId = btn.getAttribute('data-tab');
        this.openGuideView(tabId);
      };
    });
  }

  openAboutView() {
    const modalEl = document.getElementById('building-modal');
    const titleEl = document.getElementById('modal-title');
    const bodyEl = document.getElementById('modal-body');
    if (!modalEl || !titleEl || !bodyEl) return;

    titleEl.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px;">
        ${icon('info', '', 18)}
        <span>ÜBER DAS SPIEL</span>
      </div>
    `;

    const isDevUnlocked = !!(this.devModeUnlocked || (typeof localStorage !== 'undefined' && localStorage.getItem('vein_dev_mode') === '1'));

    bodyEl.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 12px; max-width: 540px; margin: 0 auto; width: 100%; box-sizing: border-box; padding: 0 4px 36px 4px;">
        <button id="btn-back-to-menu" class="btn-action" style="height: 32px; padding: 0 14px; font-size: 11.5px; align-self: flex-start; display: inline-flex; align-items: center; gap: 6px; border: none; border-radius: 8px;">
          ${icon('arrow-left', '', 14)}
          <span>Zurück zum Spielmenü</span>
        </button>

        <!-- Spiel-Header / Logo Card -->
        <div style="background: rgba(15, 23, 42, 0.75); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; padding: 16px 18px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.25); display: flex; flex-direction: column; align-items: center; gap: 6px;">
          <div style="width: 52px; height: 52px; border-radius: 14px; overflow: hidden; box-shadow: 0 0 20px rgba(249, 115, 22, 0.4); border: 1.5px solid rgba(249, 115, 22, 0.6);">
            <img src="/icon.png" alt="VEIN Icon" style="width: 100%; height: 100%; object-fit: cover; display: block;" />
          </div>
          <div style="font-size: 20px; font-weight: 900; letter-spacing: 2px; color: #f8fafc; text-transform: uppercase;">
            VEIN
          </div>
          <div id="about-version-entry" style="display: inline-block; padding: 3px 10px; background: rgba(56, 189, 248, 0.12); border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 99px; font-size: 11.5px; font-weight: 700; color: #38bdf8; cursor: pointer; user-select: none; transition: all 0.15s ease;" title="Tippe hier">
            Version 1.0.0
          </div>
          <div id="about-dev-status" style="margin-top: 6px; font-size: 10.5px; color: #10b981; font-weight: 700; display: ${isDevUnlocked ? 'block' : 'none'};">
            🛠️ Entwicklermodus freigeschaltet
          </div>
        </div>

        <!-- Entwickler & Team -->
        <div style="background: rgba(15, 23, 42, 0.65); border-radius: 12px; padding: 12px 14px; display: flex; flex-direction: column; gap: 8px; box-shadow: 0 1px 4px rgba(0,0,0,0.2);">
          <div style="display: flex; align-items: center; gap: 8px; color: #f8fafc; font-size: 12.5px; font-weight: 700;">
            ${icon('user', '', 15)}
            <span>ENTWICKLUNG</span>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.06);">
            <span style="color: #94a3b8; font-size: 11.5px;">Entwickler & Gamedesign</span>
            <strong style="color: #f8fafc; font-size: 12px;">Benedikt</strong>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 4px 0;">
            <span style="color: #94a3b8; font-size: 11.5px;">Projekt</span>
            <span style="color: #e2e8f0; font-size: 11.5px; font-weight: 600;">Deep Miner · 2D Mining Crawler</span>
          </div>
        </div>

        <!-- Lizenzen & Open-Source-Rechtshinweise -->
        <div style="background: rgba(15, 23, 42, 0.65); border-radius: 12px; padding: 14px 16px; display: flex; flex-direction: column; gap: 12px; box-shadow: 0 1px 4px rgba(0,0,0,0.2);">
          <div style="display: flex; align-items: center; gap: 8px; color: #f8fafc; font-size: 12.5px; font-weight: 700;">
            ${icon('file-text', '', 15)}
            <span>OPEN-SOURCE-LIZENZEN & RECHTSHINWEISE</span>
          </div>
          <div style="font-size: 11px; color: #94a3b8; line-height: 1.4;">
            Dieses Spiel verwendet quelloffene Komponenten gemäß den jeweiligen Lizenzbestimmungen:
          </div>

          <!-- Phaser Lizenz -->
          <div style="background: rgba(10, 15, 29, 0.8); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 8px; padding: 10px 12px; display: flex; flex-direction: column; gap: 6px;">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.06); padding-bottom: 4px;">
              <strong style="color: #38bdf8; font-size: 11.5px;">Phaser (v4.2.1)</strong>
              <span style="color: #64748b; font-size: 10px; font-family: monospace;">MIT License</span>
            </div>
            <pre style="margin: 0; padding: 0; font-family: monospace; font-size: 9.5px; color: #94a3b8; white-space: pre-wrap; line-height: 1.4; max-height: 140px; overflow-y: auto; background: transparent; border: none;">The MIT License (MIT)

Copyright (c) 2026 Richard Davey, Phaser Studio Inc.

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.</pre>
          </div>

          <!-- Lucide Icons Lizenz -->
          <div style="background: rgba(10, 15, 29, 0.8); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 8px; padding: 10px 12px; display: flex; flex-direction: column; gap: 6px;">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.06); padding-bottom: 4px;">
              <strong style="color: #38bdf8; font-size: 11.5px;">Lucide Icons</strong>
              <span style="color: #64748b; font-size: 10px; font-family: monospace;">ISC / MIT License</span>
            </div>
            <pre style="margin: 0; padding: 0; font-family: monospace; font-size: 9.5px; color: #94a3b8; white-space: pre-wrap; line-height: 1.4; max-height: 140px; overflow-y: auto; background: transparent; border: none;">ISC License

Copyright (c) 2026 Lucide Icons and Contributors

Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.</pre>
          </div>

          <!-- Urheberrecht Deep Miner -->
          <div style="padding-top: 4px; border-top: 1px solid rgba(255,255,255,0.06); font-size: 10.5px; color: #64748b; text-align: center;">
            © 2026 Deep Miner. Entwickelt von Benedikt. Alle weiteren Rechte vorbehalten.
          </div>
        </div>
      </div>
    `;

    refreshIcons(modalEl);

    const backBtn = document.getElementById('btn-back-to-menu');
    if (backBtn) {
      backBtn.onclick = () => this.openPauseMenu();
    }

    // Geheimes 5-fach Tippen auf die Versionsanzeige
    const versionEl = document.getElementById('about-version-entry');
    const devStatusEl = document.getElementById('about-dev-status');
    if (versionEl) {
      let clickCount = 0;
      let clickTimer = null;

      versionEl.onclick = () => {
        clickCount++;
        if (clickTimer) clearTimeout(clickTimer);

        // Feedback-Animation
        versionEl.style.transform = 'scale(0.92)';
        setTimeout(() => {
          versionEl.style.transform = 'scale(1)';
        }, 100);

        if (clickCount >= 5) {
          clickCount = 0;
          this.devModeUnlocked = true;
          try {
            localStorage.setItem('vein_dev_mode', '1');
          } catch (e) {
            console.warn(e);
          }
          if (devStatusEl) {
            devStatusEl.style.display = 'block';
          }
          if (soundFx.playLevelUp) {
            soundFx.playLevelUp();
          } else {
            soundFx.playPurchase?.();
          }
          toastManager.show('🛠️ Entwicklermodus freigeschaltet!');
          return;
        }

        clickTimer = setTimeout(() => {
          clickCount = 0;
        }, 1500);
      };
    }
  }

  openSettingsModal() {
    this.openPauseMenu();
  }
}
