import { soundFx } from '../core/SoundEffects.js';
import { SaveSystem } from '../core/SaveSystem.js';
import { MissionsProgressModal } from './MissionsProgressModal.js';
import { DrillerMenuModal } from './DrillerMenuModal.js';
import { icon, refreshIcons, oreIcon } from './IconHelper.js';
import { ORE_DATA } from '../core/GridSystem.js';
import { notifyModalClosed } from '../core/BaseSystem.js';
import { toastManager } from './ToastManager.js';

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

function launchConfetti() {
  let canvas = document.getElementById('confetti-canvas');
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.id = 'confetti-canvas';
    canvas.style.cssText = 'position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; pointer-events: none; z-index: 250;';
    document.body.appendChild(canvas);
  }

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const ctx = canvas.getContext('2d');

  const colors = ['#38bdf8', '#fbbf24', '#10b981', '#c084fc', '#f43f5e', '#fb923c', '#e879f9'];
  const particles = [];
  const numParticles = 65;

  for (let i = 0; i < numParticles; i++) {
    particles.push({
      x: canvas.width / 2 + (Math.random() - 0.5) * 80,
      y: canvas.height * 0.45 + (Math.random() - 0.5) * 60,
      vx: (Math.random() - 0.5) * 16,
      vy: -Math.random() * 14 - 5,
      size: Math.random() * 8 + 6,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      vRotation: (Math.random() - 0.5) * 12,
      opacity: 1,
      gravity: 0.35
    });
  }

  let animFrameId;
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
      animFrameId = requestAnimationFrame(render);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      cancelAnimationFrame(animFrameId);
    }
  }

  render();
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

    // DOM-Referenzen
    this.fuelText = document.getElementById('hud-fuel-text');
    this.fuelBar = document.getElementById('hud-fuel-bar');
    this.fuelBarContainer = document.getElementById('hud-fuel-bar-container');
    this.fuelReturnLine = document.getElementById('hud-fuel-return-line');
    this.hullText = document.getElementById('hud-hull-text');
    this.hullBar = document.getElementById('hud-hull-bar');
    this.hullBarContainer = document.getElementById('hud-hull-bar-container');
    this.cargoText = document.getElementById('hud-cargo-text');
    this.cashText = document.getElementById('hud-cash');
    this.depthText = document.getElementById('hud-depth');
    this.recallBtn = document.getElementById('btn-recall');
    this.pauseBtn = document.getElementById('btn-pause') || document.getElementById('btn-settings');
    this.cardGauges = document.getElementById('card-gauges');
    this.rankName = document.getElementById('hud-rank-name');
    this.levelRight = document.getElementById('hud-level-right');
    this.returnWarn = document.getElementById('hud-return-warn');

    // Toast-Warnungstracking
    this.wasAtSurface = true;
    this.warnedReturn2Percent = false;

    // Oberes linkes Bohrer-Status-Widget (Tank, Hülle, Fracht) als ein einheitliches klick-/tippbares Element
    let lastDrillerModalOpen = 0;
    const handleOpenDriller = (e) => {
      if (e && e.stopPropagation) e.stopPropagation();
      const now = Date.now();
      if (now - lastDrillerModalOpen < 300) return;
      lastDrillerModalOpen = now;

      soundFx.playClick();
      this.openDrillerModal('cargo');
    };

    if (this.cardGauges) {
      this.cardGauges.style.cursor = 'pointer';
      ['pointerdown', 'click'].forEach((evt) => {
        this.cardGauges.addEventListener(evt, handleOpenDriller);
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
      this.pauseBtn.onclick = () => {
        this.togglePauseMenu();
      };
    }

    this.scene.events.on('mission_updated', (info) => {
      this.updateMissionWidget(info);
    });

    // Neu entdeckte Steinsorte: Konfetti & Info-Popup anzeigen
    this.scene.events.on('ore_discovered', (oreType) => {
      this.showDiscoveryModal(oreType);
    });
  }

  openDrillerModal(tab = 'cargo') {
    if (this.scene && this.scene.baseSystem) {
      this.drillerModal.baseSystem = this.scene.baseSystem;
    }
    if (this.scene && this.scene.player) {
      this.drillerModal.player = this.scene.player;
    }
    this.drillerModal.open(tab);
  }

  showDiscoveryModal(oreType) {
    const data = ORE_DATA[oreType];
    if (!data) return;

    soundFx.playPurchase();
    launchConfetti();

    const desc = ORE_DESCRIPTIONS[oreType] || 'Ein wertvolles Mineral aus den Tiefen des Schachts.';
    const modalEl = document.getElementById('building-modal');
    const titleEl = document.getElementById('modal-title');
    const bodyEl = document.getElementById('modal-body');
    if (!modalEl || !titleEl || !bodyEl) return;

    titleEl.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px; color: #fbbf24;">
        ${icon('sparkles', '', 18)}
        <span>NEUE STEINSORTE ENTDECKT!</span>
      </div>
    `;

    bodyEl.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 14px; text-align: center; align-items: center;">
        <div style="
          background: rgba(15, 23, 42, 0.85);
          border: 1px solid rgba(56, 189, 248, 0.25);
          border-radius: 12px;
          padding: 18px 20px;
          width: 100%;
          box-sizing: border-box;
        ">
          <h2 style="color: #f8fafc; font-size: 22px; font-weight: 800; margin: 0 0 8px 0; letter-spacing: 0.5px; display: inline-flex; align-items: center; justify-content: center; gap: 8px;">
            ${oreIcon(oreType, 22)}
            <span>${data.name.toUpperCase()}</span>
          </h2>
          <div style="display: flex; justify-content: center; gap: 10px; font-size: 12px; margin-bottom: 12px; flex-wrap: wrap;">
            <span style="background: rgba(251, 191, 36, 0.15); border: 1px solid rgba(251, 191, 36, 0.3); color: #fbbf24; font-weight: 800; padding: 3px 10px; border-radius: 6px;">
              Börsenwert: +€${data.value}
            </span>
            <span style="background: rgba(56, 189, 248, 0.15); border: 1px solid rgba(56, 189, 248, 0.3); color: #38bdf8; font-weight: 700; padding: 3px 10px; border-radius: 6px;">
              Tiefe: ab ${data.minDepth}m
            </span>
            <span style="background: rgba(148, 163, 184, 0.15); border: 1px solid rgba(148, 163, 184, 0.3); color: #cbd5e1; font-weight: 700; padding: 3px 10px; border-radius: 6px;">
              Härte: ${data.hardness}x
            </span>
          </div>
          <p style="font-size: 13px; line-height: 1.5; color: #cbd5e1; margin: 0;">
            ${desc}
          </p>
        </div>

        <button id="btn-discovery-ok" class="btn-buy" style="height: 32px; padding: 0 28px; font-size: 12.5px; font-weight: 800;">
          OK
        </button>
      </div>
    `;

    modalEl.style.display = 'flex';
    refreshIcons(modalEl);

    const btnOk = document.getElementById('btn-discovery-ok');
    if (btnOk) {
      btnOk.onclick = () => {
        notifyModalClosed();
        modalEl.style.display = 'none';
      };
    }
  }

  updateMissionWidget(info) {
    if (!info) return;
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

  update() {
    // Treibstoff & dynamische Rückkehr-Linie
    const fuelPercent = Math.max(0, (this.player.fuel / this.player.maxFuel) * 100);
    if (this.fuelBar) {
      this.fuelBar.style.width = `${fuelPercent}%`;
    }
    if (this.fuelText) {
      this.fuelText.innerText = `${Math.round(fuelPercent)}%`;
    }

    // Dynamischer Rückweg-Bedarf: Schwarzer Strich zur garantierten Rückkehr
    const returnPercent = this.player.getReturnFuelPercent ? this.player.getReturnFuelPercent() : 0;

    if (this.fuelReturnLine) {
      if (returnPercent > 0.5 && returnPercent < 99.5) {
        this.fuelReturnLine.style.display = 'block';
        this.fuelReturnLine.style.left = `${returnPercent}%`;
      } else {
        this.fuelReturnLine.style.display = 'none';
      }
    }

    if (this.fuelBarContainer) {
      this.fuelBarContainer.title = `Tank: ${Math.round(fuelPercent)}% | Rückkehr-Schwelle: ${Math.round(returnPercent)}%`;
    }

    // Tankwarnung auf Rot ab 15% (oder wenn aktueller Tank unter die garantierte Rückkehr fällt)
    const isReturnCritical = returnPercent > 0.5 && fuelPercent <= returnPercent;
    if (fuelPercent <= 15 || isReturnCritical) {
      this.cardGauges?.classList.add('fuel-warning');
    } else {
      this.cardGauges?.classList.remove('fuel-warning');
    }

    // Karosserie / Rumpfintegrität (Reine Prozent-Anzeige)
    const hullPercent = Math.max(0, Math.min(100, (this.player.hull / this.player.maxHull) * 100));
    if (this.hullText) {
      this.hullText.innerText = `${Math.round(hullPercent)}%`;
      if (hullPercent <= 20) {
        this.hullText.style.color = '#ef4444';
      } else if (hullPercent <= 45) {
        this.hullText.style.color = '#f59e0b';
      } else {
        this.hullText.style.color = '#10b981';
      }
    }
    if (this.hullCluster) {
      this.hullCluster.title = `Driller-Status & Panzerung: ${Math.round(hullPercent)}% (${Math.round(this.player.hull)}/${this.player.maxHull} HP) - Klick zum Öffnen`;
    }

    if (hullPercent <= 20) {
      this.cardGauges?.classList.add('hull-warning');
    } else {
      this.cardGauges?.classList.remove('hull-warning');
    }

    // Fracht (nur als Zahl)
    if (this.cargoText) {
      this.cargoText.innerText = `${this.player.cargoCount}/${this.player.maxCargo}`;
    }

    // Level (links, nur als Zahl)
    if (this.rankName) {
      this.rankName.innerText = `${this.player.level || 1}`;
    }

    // Level (rechts oben, lila)
    if (this.levelRight) {
      this.levelRight.innerText = `${this.player.level || 1}`;
    }

    // Adaptive Rückkehr-Warnung (oben rechts, rot pulsierend)
    const fuelPctRaw = Math.max(0, (this.player.fuel / this.player.maxFuel) * 100);
    const returnPct = this.player.getReturnFuelPercent ? this.player.getReturnFuelPercent() : 0;
    const currentY = this.player.sprite ? this.player.sprite.y : (this.player.gy * 32 + 16);
    const isAtSurface = this.player.gy < 0 || currentY <= -8;
    const isBelowGround = !isAtSurface && (this.player.gy >= 0 || currentY >= 8);

    // Adaptive Rückkehr-Warnung (oben rechts, rot pulsierend)
    const isReturnWarn = isBelowGround && returnPct > 0.5 && fuelPctRaw <= returnPct;
    if (this.returnWarn) {
      this.returnWarn.style.display = isReturnWarn ? 'flex' : 'none';
    }

    // --- Toast-Warnungen (oben zentriert) ---
    // 1. NUR beim Eintritt in die Mine von der Oberfläche, wenn man dann <= 15% hat
    if (this.wasAtSurface && isBelowGround) {
      this.wasAtSurface = false;
      if (fuelPctRaw <= 15) {
        toastManager.show({
          id: 'fuel-low-entry',
          text: 'Tanken empfohlen',
          duration: 4000
        });
      }
    } else if (isAtSurface) {
      this.wasAtSurface = true;
      this.warnedReturn2Percent = false;
    }

    // 2. Rückkehr-Vorwarnung: 2% vor Erreichen des Tankminimums zur Rückkehr (nur unter Tage)
    // Tankminimum zur Rückkehr ist returnPct. 2% davor = returnPct + 2.
    const returnMinThreshold = returnPct + 2;
    if (isBelowGround && returnPct > 0.5) {
      if (!this.warnedReturn2Percent && fuelPctRaw <= returnMinThreshold) {
        this.warnedReturn2Percent = true;
        toastManager.show({
          id: 'return-fuel-2percent',
          text: 'Rückkehrwarnung',
          duration: 4000,
          sound: 'cockpit'
        });
      }
    } else if (fuelPctRaw > returnMinThreshold + 5) {
      this.warnedReturn2Percent = false;
    }

    // Cash & Tiefe
    if (this.cashText) {
      this.cashText.innerText = `€${this.player.cash}`;
    }
    if (this.depthText) {
      this.depthText.innerText = `${this.player.depthMeters} m`;
    }
  }

  togglePauseMenu() {
    const modalEl = document.getElementById('building-modal');
    if (modalEl && modalEl.style.display === 'flex' && this.isPauseMenuOpen) {
      this.closePauseMenu();
    } else {
      this.openPauseMenu();
    }
  }

  closePauseMenu() {
    notifyModalClosed();
    const modalEl = document.getElementById('building-modal');
    if (modalEl) modalEl.style.display = 'none';
    if (this.scene) this.scene.isPaused = false;
    this.isPauseMenuOpen = false;
  }

  openPauseMenu() {
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

    const fuelPct = Math.max(0, Math.min(100, Math.round((this.player.fuel / this.player.maxFuel) * 100)));
    const freeCount = typeof this.player.freeRescues === 'number' ? this.player.freeRescues : 3;

    bodyEl.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 12px;">
        <!-- Status-Übersicht -->
        <div style="background: rgba(15, 23, 42, 0.75); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 10px; padding: 10px 14px; display: flex; justify-content: space-between; align-items: center; font-size: 11.5px;">
          <span style="color: #94a3b8;">Tiefe: <strong style="color: #38bdf8;">${this.player.depthMeters} m</strong></span>
          <span style="color: #94a3b8;">Konto: <strong style="color: #fbbf24;">€${this.player.cash}</strong></span>
          <span style="color: #94a3b8;">Tank: <strong style="color: ${fuelPct < 25 ? '#ef4444' : '#34d399'};">${fuelPct}%</strong></span>
          <span style="color: #94a3b8;">Level: <strong style="color: #c084fc;">${this.player.level || 1}</strong></span>
        </div>


        <!-- 2. Rettungsknopf (3 kostenlos) -->
        <div style="background: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 10px; padding: 10px 14px; display: flex; flex-direction: column; gap: 8px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 12px; font-weight: 700; color: #f87171; display: inline-flex; align-items: center; gap: 6px;">
              ${icon('shield-alert', '', 15)}
              NOTFALL-RETTUNG ZUR BASIS
            </span>
            ${freeCount > 0 ? `
              <span style="background: rgba(16, 185, 129, 0.2); border: 1px solid rgba(16, 185, 129, 0.5); color: #34d399; font-size: 10.5px; font-weight: 800; padding: 2px 8px; border-radius: 6px;">
                ${freeCount}/3 KOSTENLOS
              </span>
            ` : `
              <span style="background: rgba(239, 68, 68, 0.2); border: 1px solid rgba(239, 68, 68, 0.5); color: #f87171; font-size: 10.5px; font-weight: 800; padding: 2px 8px; border-radius: 6px;">
                €150 GEBÜHR
              </span>
            `}
          </div>
          <div style="font-size: 11px; color: #94a3b8; line-height: 1.4;">
            ${freeCount > 0
              ? `Teleportiert deinen Crawler sofort zur Oberfläche (noch <strong>${freeCount} kostenlose Rettung${freeCount === 1 ? '' : 'en'}</strong> übrig). Der Tank wird auf mindestens 20% aufgeladen.`
              : `Alle 3 kostenlosen Bergungen aufgebraucht. Kosten: <strong>€150</strong> (wird vom Guthaben abgebucht). Tank wird auf 20% aufgeladen.`}
          </div>
          <button id="btn-menu-rescue" class="btn-3d-danger" style="height: 36px; width: 100%; font-size: 11.5px; font-weight: 800; justify-content: center; gap: 6px; border-radius: 8px;">
            ${icon('rocket', '', 14)}
            <span>${freeCount > 0 ? 'RETTUNG ZUR BASIS STARTEN' : 'RETTUNG ANFORDERN (€150)'}</span>
          </button>
        </div>

        <!-- 3. Einstellungen -->
        <button id="btn-menu-settings" class="btn-3d-secondary" style="height: 44px; width: 100%; font-size: 12.5px; font-weight: 700; justify-content: flex-start; padding: 0 14px; gap: 12px; border-radius: 10px;">
          <span style="color: #38bdf8; display: inline-flex;">${icon('settings', '', 17)}</span>
          <div style="display: flex; flex-direction: column; text-align: left; line-height: 1.2;">
            <span style="color: #f8fafc; font-weight: 700;">Einstellungen</span>
            <span style="color: #64748b; font-size: 10.5px; font-weight: 500;">Sound, Vollbild & Spielstand</span>
          </div>
        </button>

        <!-- 4. Erklärungen & Anleitung -->
        <button id="btn-menu-guide" class="btn-3d-secondary" style="height: 44px; width: 100%; font-size: 12.5px; font-weight: 700; justify-content: flex-start; padding: 0 14px; gap: 12px; border-radius: 10px;">
          <span style="color: #fbbf24; display: inline-flex;">${icon('book-open', '', 17)}</span>
          <div style="display: flex; flex-direction: column; text-align: left; line-height: 1.2;">
            <span style="color: #f8fafc; font-weight: 700;">Erklärungen & Spielanleitung</span>
            <span style="color: #64748b; font-size: 10.5px; font-weight: 500;">Steuerung, Gebäude, Erze & Fabrik</span>
          </div>
        </button>

        <!-- 5. Spielstand sichern -->
        <button id="btn-menu-save" class="btn-3d-secondary" style="height: 44px; width: 100%; font-size: 12.5px; font-weight: 700; justify-content: flex-start; padding: 0 14px; gap: 12px; border-radius: 10px;">
          <span style="color: #10b981; display: inline-flex;">${icon('save', '', 17)}</span>
          <div style="display: flex; flex-direction: column; text-align: left; line-height: 1.2;">
            <span style="color: #f8fafc; font-weight: 700;">Spielstand speichern</span>
            <span style="color: #64748b; font-size: 10.5px; font-weight: 500;">Fortschritt jetzt im Speicher sichern</span>
          </div>
        </button>
      </div>
    `;

    refreshIcons(modalEl);

    // Event-Listener
    const rescueBtn = document.getElementById('btn-menu-rescue');
    if (rescueBtn) {
      rescueBtn.onclick = () => {
        this.player.teleportToSurface();
        this.closePauseMenu();
      };
    }

    const settingsBtn = document.getElementById('btn-menu-settings');
    if (settingsBtn) {
      settingsBtn.onclick = () => this.openSettingsView();
    }

    const guideBtn = document.getElementById('btn-menu-guide');
    if (guideBtn) {
      guideBtn.onclick = () => this.openGuideView('controls');
    }

    const saveBtn = document.getElementById('btn-menu-save');
    if (saveBtn) {
      saveBtn.onclick = () => {
        SaveSystem.save(this.scene);
        this.scene.events.emit('notify', '💾 Spielstand erfolgreich gesichert!');
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

    bodyEl.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 14px;">
        <button id="btn-back-to-menu" class="btn-3d-secondary" style="height: 30px; padding: 0 12px; font-size: 11px; align-self: flex-start; display: inline-flex; align-items: center; gap: 6px;">
          ${icon('arrow-left', '', 13)}
          <span>Zurück zum Spielmenü</span>
        </button>

        <!-- Audio -->
        <div style="background: rgba(15, 23, 42, 0.75); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 10px; padding: 12px 14px; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <strong style="color: #f8fafc; font-size: 12.5px; display: block;">Soundeffekte</strong>
            <span style="color: #94a3b8; font-size: 11px;">Bohren, Triebwerk, Erze & Gebäude</span>
          </div>
          <button id="btn-toggle-sound" class="${soundFx.muted ? 'btn-3d-secondary' : 'btn-action'}" style="height: 32px; padding: 0 14px; font-size: 11.5px; display: inline-flex; align-items: center; gap: 6px;">
            ${icon(soundFx.muted ? 'volume-x' : 'volume-2', '', 14)}
            <span>Sound: ${soundFx.muted ? 'Aus' : 'An'}</span>
          </button>
        </div>

        <!-- Anzeige -->
        <div style="background: rgba(15, 23, 42, 0.75); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 10px; padding: 12px 14px; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <strong style="color: #f8fafc; font-size: 12.5px; display: block;">Vollbildmodus</strong>
            <span style="color: #94a3b8; font-size: 11px;">Desktop & Mobilgeräte</span>
          </div>
          <button id="btn-toggle-fullscreen" class="${document.fullscreenElement ? 'btn-3d-success' : 'btn-action'}" style="height: 32px; padding: 0 14px; font-size: 11.5px; display: inline-flex; align-items: center; gap: 6px;">
            ${icon(document.fullscreenElement ? 'minimize' : 'maximize', '', 14)}
            <span>${document.fullscreenElement ? 'Beenden' : 'Aktivieren'}</span>
          </button>
        </div>

        <!-- Spielstand -->
        <div style="background: rgba(15, 23, 42, 0.75); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 10px; padding: 12px 14px; display: flex; flex-direction: column; gap: 10px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <strong style="color: #f8fafc; font-size: 12.5px; display: block;">Automatisches Speichern</strong>
              <span style="color: #94a3b8; font-size: 11px;">Speichert automatisch alle 10 Sekunden</span>
            </div>
            <span style="color: #10b981; font-weight: 700; font-size: 12px; display: inline-flex; align-items: center; gap: 4px;">
              ${icon('check-circle', '', 13)} Aktiv
            </span>
          </div>

          <div id="save-buttons-row" style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
            <button id="btn-manual-save" class="btn-action" style="height: 34px; font-size: 11.5px; justify-content: center;">
              ${icon('save', '', 13)} Jetzt sichern
            </button>
            <button id="btn-reset-save" class="btn-3d-danger" style="height: 34px; font-size: 11.5px; justify-content: center;">
              ${icon('rotate-ccw', '', 13)} Spielstand löschen
            </button>
          </div>

          <!-- Sicherheitsabfrage mit Eingabe von "delete" -->
          <div id="box-delete-confirm" style="display: none; margin-top: 10px; background: rgba(239, 68, 68, 0.12); border: 1px solid rgba(239, 68, 68, 0.4); border-radius: 10px; padding: 12px; flex-direction: column; gap: 8px;">
            <div style="display: flex; align-items: center; gap: 6px; color: #f87171; font-weight: 700; font-size: 12px;">
              ${icon('alert-triangle', '', 14)}
              <span>Sicherheitsabfrage: Spielstand löschen</span>
            </div>
            <div style="font-size: 11.5px; color: #cbd5e1; line-height: 1.4;">
              Der gesamte Fortschritt geht verloren. Tippe zur Bestätigung <strong style="color: #ffffff; background: rgba(0, 0, 0, 0.5); padding: 2px 6px; border-radius: 4px; font-family: monospace;">delete</strong> ein:
            </div>
            <div style="display: flex; gap: 8px; align-items: center; margin-top: 4px;">
              <input type="text" id="input-confirm-delete" placeholder="delete" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" style="flex: 1; height: 34px; background: rgba(15, 23, 42, 0.9); border: 1px solid rgba(239, 68, 68, 0.5); border-radius: 8px; color: #ffffff; padding: 0 10px; font-size: 13px; font-weight: 700; outline: none;" />
              <button id="btn-confirm-delete-action" class="btn-3d-danger" disabled style="height: 34px; padding: 0 14px; font-size: 12px; font-weight: 800; opacity: 0.35; cursor: not-allowed; white-space: nowrap;">
                Löschen
              </button>
              <button id="btn-cancel-delete" class="btn-action" style="height: 34px; padding: 0 12px; font-size: 12px; white-space: nowrap;">
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
        soundFx.toggleMute();
        toggleSoundBtn.innerHTML = `
          ${icon(soundFx.muted ? 'volume-x' : 'volume-2', '', 13)}
          <span>Sound: ${soundFx.muted ? 'Aus' : 'An'}</span>
        `;
        toggleSoundBtn.style.background = soundFx.muted ? '#475569' : '#2563eb';
        refreshIcons(toggleSoundBtn);
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
          <span>${isFs ? 'Beenden' : 'Aktivieren'}</span>
        `;
        toggleFullscreenBtn.style.background = isFs ? '#10b981' : '#2563eb';
        refreshIcons(toggleFullscreenBtn);
      };
    }

    const manualSaveBtn = document.getElementById('btn-manual-save');
    if (manualSaveBtn) {
      manualSaveBtn.onclick = () => {
        SaveSystem.save(this.scene);
        this.scene.events.emit('notify', '💾 Spielstand erfolgreich gesichert!');
      };
    }

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
      <button class="guide-tab-btn ${activeTab === t.id ? 'active' : ''}" data-tab="${t.id}" style="
        flex: 1;
        height: 32px;
        font-size: 11px;
        font-weight: 700;
        border-radius: 8px;
        border: 1px solid ${activeTab === t.id ? 'rgba(56, 189, 248, 0.6)' : 'rgba(255,255,255,0.08)'};
        background: ${activeTab === t.id ? 'linear-gradient(180deg, #2563eb 0%, #1d4ed8 100%)' : 'rgba(30, 41, 59, 0.5)'};
        color: ${activeTab === t.id ? '#ffffff' : '#94a3b8'};
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 5px;
        transition: all 0.15s ease;
      ">
        ${icon(t.icon, '', 13)}
        <span>${t.label}</span>
      </button>
    `).join('');

    let contentHtml = '';

    if (activeTab === 'controls') {
      contentHtml = `
        <div style="display: flex; flex-direction: column; gap: 10px;">
          <div style="background: rgba(15, 23, 42, 0.75); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 10px; padding: 12px 14px; display: flex; flex-direction: column; gap: 8px;">
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

          <div style="background: rgba(15, 23, 42, 0.75); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 10px; padding: 12px 14px; display: flex; flex-direction: column; gap: 8px;">
            <div style="font-size: 12px; font-weight: 800; color: #38bdf8; text-transform: uppercase;">Touch & Mobile</div>
            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 11.5px;">
              <span style="color: #cbd5e1;">360° Floating Joystick</span>
              <span style="color: #94a3b8;">Unten links berühren & ziehen</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 11.5px;">
              <span style="color: #cbd5e1;">Schnell-Aufstieg</span>
              <span style="color: #94a3b8;">Button "HOCH" gedrückt halten</span>
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
          <div style="background: rgba(15, 23, 42, 0.75); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 9px; padding: 10px 12px;">
            <div style="font-size: 12px; font-weight: 700; color: #38bdf8; margin-bottom: 2px; display: flex; align-items: center; gap: 5px;">${icon('laptop-minimal', '', 14)} Büro</div>
            <div style="font-size: 11px; color: #94a3b8; line-height: 1.4;">Auftragszentrale. Erfülle Missionen (z. B. Erze abbauen oder Ziel-Tiefen erreichen) für hohes Extra-Guthaben und Level-Aufstiege.</div>
          </div>
          <div style="background: rgba(15, 23, 42, 0.75); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 9px; padding: 10px 12px;">
            <div style="font-size: 12px; font-weight: 700; color: #fbbf24; margin-bottom: 2px;">💰 Erzbörse</div>
            <div style="font-size: 11px; color: #94a3b8; line-height: 1.4;">Verkaufe geförderte Rohstoffe und Fabrik-Erzeugnisse. Bietet freie Mengenauswahl und Sofort-Verkauf aller Erze.</div>
          </div>
          <div style="background: rgba(15, 23, 42, 0.75); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 9px; padding: 10px 12px;">
            <div style="font-size: 12px; font-weight: 700; color: #34d399; margin-bottom: 2px;">🔧 Hangar (Crawler-Werkstatt)</div>
            <div style="font-size: 11px; color: #94a3b8; line-height: 1.4;">Tuning deines Bohrers, Treibstoff-Tanks, Frachtraums, Antriebs und Gehäuseschutzes. Automatisches Auftanken per Tankkabel an der Plattform.</div>
          </div>
          <div style="background: rgba(15, 23, 42, 0.75); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 9px; padding: 10px 12px;">
            <div style="font-size: 12px; font-weight: 700; color: #fb923c; margin-bottom: 2px;">🔥 Fabrik & Raffinerie</div>
            <div style="font-size: 11px; color: #94a3b8; line-height: 1.4;">Schmelze Roherze zu Barren (+50% Erlös) oder kombiniere Erze zu High-Tech-Industriewaren wie Stahlträgern, Bronze und Platinen.</div>
          </div>
          <div style="background: rgba(15, 23, 42, 0.75); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 9px; padding: 10px 12px;">
            <div style="font-size: 12px; font-weight: 700; color: #c084fc; margin-bottom: 2px;">🔬 Labor</div>
            <div style="font-size: 11px; color: #94a3b8; line-height: 1.4;">High-Tech Forschung. Schalte modernste Bohrköpfe und Sensor-Upgrades frei, um Erze durch Gestein hindurch aufzuspüren.</div>
          </div>
          <div style="background: rgba(15, 23, 42, 0.75); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 9px; padding: 10px 12px;">
            <div style="font-size: 12px; font-weight: 700; color: #e2e8f0; margin-bottom: 2px;">🏠 Schachteinstieg & Steineforscher</div>
            <div style="font-size: 11px; color: #94a3b8; line-height: 1.4;">Die restliche Oberfläche ist unzerstörbar – der Schachteinstieg führt nach unten. Der Steineforscher am Hangar sucht seltene Gesteinsproben für wertvolle Bauteile.</div>
          </div>
        </div>
      `;
    } else if (activeTab === 'refinery') {
      contentHtml = `
        <div style="display: flex; flex-direction: column; gap: 8px;">
          <div style="background: rgba(15, 23, 42, 0.75); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 9px; padding: 10px 12px;">
            <div style="font-size: 12px; font-weight: 700; color: #38bdf8; margin-bottom: 3px;">Tiefenschichten & Mineralien</div>
            <div style="font-size: 11px; color: #94a3b8; line-height: 1.5;">
              • <strong>0–40 m (Humus & Erde):</strong> Kohle, Kupfer<br>
              • <strong>40–120 m (Schiefer):</strong> Eisen, Zinn<br>
              • <strong>120–300 m (Granit):</strong> Silber, Gold<br>
              • <strong>300–800 m (Obsidian & Basalt):</strong> Smaragde, Saphire, Rubine, Diamanten<br>
              • <strong>>800 m (Tiefenkern):</strong> Titan, Platin, Uran, Dunkelmaterie
            </div>
          </div>
          <div style="background: rgba(15, 23, 42, 0.75); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 9px; padding: 10px 12px;">
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
          <div style="background: rgba(15, 23, 42, 0.75); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 9px; padding: 10px 12px;">
            <div style="font-size: 12px; font-weight: 700; color: #10b981; margin-bottom: 2px;">⛽ Treibstoff & Betankung</div>
            <div style="font-size: 11px; color: #94a3b8; line-height: 1.4;">Parke auf der Hangar-Plattform an der Oberfläche – das Tankkabel dockt automatisch an und füllt deinen Treibstoff kostenlos auf.</div>
          </div>
          <div style="background: rgba(15, 23, 42, 0.75); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 9px; padding: 10px 12px;">
            <div style="font-size: 12px; font-weight: 700; color: #38bdf8; margin-bottom: 2px;">🚀 Jetpack-Nutzung</div>
            <div style="font-size: 11px; color: #94a3b8; line-height: 1.4;">Halte <strong>W</strong> oder <strong>↑</strong> gedrückt, um mit dem Triebwerk aufzusteigen. Der Aufstieg verbraucht Treibstoff – plane deine Rückkehr rechtzeitig!</div>
          </div>
          <div style="background: rgba(15, 23, 42, 0.75); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 9px; padding: 10px 12px;">
            <div style="font-size: 12px; font-weight: 700; color: #f87171; margin-bottom: 2px;">🚨 3 Kostenlose Notfall-Rettungen</div>
            <div style="font-size: 11px; color: #94a3b8; line-height: 1.4;">Wenn dein Tank tief unten leer wird oder du festsitzt, öffne das Spielmenü und nutze die Notfall-Rettung. Die ersten 3 Rettungen sind gratis!</div>
          </div>
        </div>
      `;
    }

    bodyEl.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 12px;">
        <button id="btn-back-to-menu" class="btn-3d-secondary" style="height: 30px; padding: 0 12px; font-size: 11px; align-self: flex-start; display: inline-flex; align-items: center; gap: 6px;">
          ${icon('arrow-left', '', 13)}
          <span>Zurück zum Spielmenü</span>
        </button>

        <div style="display: flex; gap: 6px;">
          ${tabButtonsHtml}
        </div>

        <div>
          ${contentHtml}
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

  openSettingsModal() {
    this.openPauseMenu();
  }
}
