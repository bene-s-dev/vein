import { ORE_DATA } from '../core/GridSystem.js';
import { soundFx } from '../core/SoundEffects.js';
import { icon, refreshIcons, oreIcon, ORE_COLORS } from './IconHelper.js';
import { notifyModalClosed } from '../core/BaseSystem.js';

/**
 * DrillerMenuModal.js
 * Ausführliches Status- & Frachtmenü für das Bohr-Fahrzeug.
 * Zeigt aktuelle Stats (Tank, Panzerung, Motor, Bohrer, Scanner)
 * und vor allem den gesamten abgebauten Frachtinhalt mit Werten und Mengen.
 */
export class DrillerMenuModal {
  constructor(scene, player, baseSystem) {
    this.scene = scene;
    this.player = player;
    this.baseSystem = baseSystem;

    this.currentTab = 'cargo'; // 'cargo' | 'specs' | 'history'
  }

  open(initialTab = 'cargo') {
    this.currentTab = initialTab;

    // Laufende Motorsounds beim Öffnen des Menüs stoppen
    soundFx.stopDrive();
    soundFx.stopJetpack();
    soundFx.stopDrill();

    if (this.scene) {
      this.scene.isPaused = true;
    }

    this.render();
  }

  close() {
    notifyModalClosed();
    const modalEl = document.getElementById('building-modal');
    if (modalEl) {
      modalEl.style.display = 'none';
    }
    if (this.scene) {
      this.scene.isPaused = false;
    }
  }

  render() {
    const modalEl = document.getElementById('building-modal');
    const titleEl = document.getElementById('modal-title');
    const bodyEl = document.getElementById('modal-body');
    if (!modalEl || !titleEl || !bodyEl) return;

    titleEl.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px; color: #38bdf8;">
        ${icon('shield-cog', '', 18)}
        <span>DRILLER-STATUS & FRACHT</span>
      </div>
    `;

    // Persistente Mini-Statusleiste oben
    const fuelPct = Math.max(0, Math.min(100, (this.player.fuel / this.player.maxFuel) * 100));
    const hullPct = Math.max(0, Math.min(100, (this.player.hull / this.player.maxHull) * 100));
    const cargoCount = this.player.cargo ? this.player.cargo.length : 0;
    const maxCargo = this.player.maxCargo || 10;
    const cargoPct = Math.round((cargoCount / maxCargo) * 100);

    const miniHudHtml = `
      <div style="
        background: rgba(15, 23, 42, 0.85);
        border: 1px solid rgba(56, 189, 248, 0.25);
        border-radius: 12px;
        padding: 10px 14px;
        margin-bottom: 12px;
        display: flex;
        flex-direction: column;
        gap: 8px;
      ">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 6px;">
          <div style="display: flex; align-items: center; gap: 6px;">
            <span style="font-weight: 800; color: #f8fafc; font-size: 13px; letter-spacing: 0.3px;">TERRA-DRILL MK-${this.player.drillTier || 1}</span>
            <span style="background: rgba(56, 189, 248, 0.15); border: 1px solid rgba(56, 189, 248, 0.3); color: #38bdf8; font-size: 10.5px; font-weight: 700; padding: 1px 7px; border-radius: 99px;">
              LVL ${this.player.level || 1}
            </span>
          </div>
          <div style="display: flex; align-items: center; gap: 10px; font-size: 11px; font-weight: 700;">
            <span style="color: #94a3b8; display: inline-flex; align-items: center; gap: 4px;">
              ${icon('map-pin', '', 12)} ${this.player.depthMeters || 0} m Tiefe
            </span>
            <span style="color: #fbbf24; display: inline-flex; align-items: center; gap: 3px;">
              ${icon('coins', '', 12)} €${(this.player.cash || 0).toLocaleString()}
            </span>
          </div>
        </div>

        <!-- 3 Schnellbalken -->
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px;">
          <!-- Tank -->
          <div style="display: flex; flex-direction: column; gap: 3px;">
            <div style="display: flex; justify-content: space-between; font-size: 10px; font-weight: 700;">
              <span style="color: #f59e0b; display: inline-flex; align-items: center; gap: 3px;">${icon('fuel', '', 11)} Tank</span>
              <span style="color: #ffffff;">${Math.round(fuelPct)}%</span>
            </div>
            <div style="height: 5px; background: rgba(0,0,0,0.6); border-radius: 99px; overflow: hidden; border: 1px solid rgba(255,255,255,0.1);">
              <div style="width: ${fuelPct}%; height: 100%; background: #f59e0b; border-radius: 99px;"></div>
            </div>
          </div>

          <!-- Panzerung -->
          <div style="display: flex; flex-direction: column; gap: 3px;">
            <div style="display: flex; justify-content: space-between; font-size: 10px; font-weight: 700;">
              <span style="color: #10b981; display: inline-flex; align-items: center; gap: 3px;">${icon('shield-cog', '', 11)} Hülle</span>
              <span style="color: #ffffff;">${Math.round(hullPct)}%</span>
            </div>
            <div style="height: 5px; background: rgba(0,0,0,0.6); border-radius: 99px; overflow: hidden; border: 1px solid rgba(255,255,255,0.1);">
              <div style="width: ${hullPct}%; height: 100%; background: ${hullPct <= 25 ? '#ef4444' : hullPct <= 50 ? '#f59e0b' : '#10b981'}; border-radius: 99px;"></div>
            </div>
          </div>

          <!-- Fracht -->
          <div style="display: flex; flex-direction: column; gap: 3px;">
            <div style="display: flex; justify-content: space-between; font-size: 10px; font-weight: 700;">
              <span style="color: #38bdf8; display: inline-flex; align-items: center; gap: 3px;">${icon('container', '', 11)} Fracht</span>
              <span style="color: ${cargoPct >= 100 ? '#ef4444' : '#ffffff'};">${cargoCount}/${maxCargo}</span>
            </div>
            <div style="height: 5px; background: rgba(0,0,0,0.6); border-radius: 99px; overflow: hidden; border: 1px solid rgba(255,255,255,0.1);">
              <div style="width: ${Math.min(100, cargoPct)}%; height: 100%; background: ${cargoPct >= 100 ? '#ef4444' : '#38bdf8'}; border-radius: 99px;"></div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Tabs Navigation
    const tabs = [
      { id: 'cargo', label: 'Fracht & Erze', icon: 'container', badge: `${cargoCount}/${maxCargo}` },
      { id: 'specs', label: 'Fahrzeug-Werte', icon: 'gauge' },
      { id: 'history', label: 'Abbau-Historie', icon: 'bar-chart-3' }
    ];

    const tabNavHtml = `
      <div style="display: flex; gap: 6px; overflow-x: auto; padding-bottom: 8px; margin-bottom: 12px; scrollbar-width: none;">
        ${tabs.map(t => {
          const isActive = this.currentTab === t.id;
          return `
            <button class="driller-tab-btn btn-3d-secondary" data-tab="${t.id}" style="
              height: 32px;
              box-sizing: border-box;
              background: ${isActive ? 'linear-gradient(180deg, #0284c7 0%, #0369a1 100%)' : ''};
              border-color: ${isActive ? '#38bdf8' : ''};
              border-bottom: ${isActive ? '3px solid #075985' : ''};
              color: ${isActive ? '#ffffff' : '#94a3b8'};
              padding: 0 12px;
              font-size: 11.5px;
              font-weight: 700;
              border-radius: 8px;
              display: inline-flex;
              align-items: center;
              justify-content: center;
              gap: 6px;
              cursor: pointer;
              white-space: nowrap;
            ">
              ${icon(t.icon, '', 14)}
              <span>${t.label}</span>
              ${t.badge ? `<span style="background: rgba(0,0,0,0.45); border-radius: 99px; padding: 1px 6px; font-size: 10px; color: ${cargoPct >= 100 ? '#ef4444' : '#e0f2fe'};">${t.badge}</span>` : ''}
            </button>
          `;
        }).join('')}
      </div>
    `;

    // Tab-Content rendern
    let contentHtml = '';
    if (this.currentTab === 'cargo') {
      contentHtml = this.renderCargoTab();
    } else if (this.currentTab === 'specs') {
      contentHtml = this.renderSpecsTab();
    } else if (this.currentTab === 'history') {
      contentHtml = this.renderHistoryTab();
    }

    bodyEl.innerHTML = `
      <div style="display: flex; flex-direction: column;">
        ${miniHudHtml}
        ${tabNavHtml}
        <div id="driller-tab-content">
          ${contentHtml}
        </div>
      </div>
    `;

    modalEl.style.display = 'flex';
    refreshIcons(modalEl);

    // Tab Buttons verbinden
    const tabBtns = bodyEl.querySelectorAll('.driller-tab-btn');
    tabBtns.forEach(b => {
      b.onclick = () => {
        soundFx.playClick();
        this.currentTab = b.getAttribute('data-tab');
        this.render();
      };
    });

    this.attachEventListeners(bodyEl);
  }

  // =========================================================
  // TAB 1: FRACHT & ABGEBAUTE ERZE
  // =========================================================
  renderCargoTab() {
    const cargo = this.player.cargo || [];
    const maxCargo = this.player.maxCargo || 10;
    const isFull = cargo.length >= maxCargo;

    // Erze zusammenzählen & Gesamtwert berechnen
    const oreCounts = {};
    let totalEstimatedValue = 0;

    cargo.forEach((oreKey) => {
      oreCounts[oreKey] = (oreCounts[oreKey] || 0) + 1;
      const d = ORE_DATA[oreKey];
      if (d) {
        totalEstimatedValue += d.value;
      }
    });

    // Kapazitäts- und Börsenwert-Karten
    const headerHtml = `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px;">
        <!-- Kapazität -->
        <div style="
          background: #141c2b;
          border: 1px solid ${isFull ? 'rgba(239, 68, 68, 0.4)' : 'rgba(56, 189, 248, 0.25)'};
          border-radius: 10px;
          padding: 10px 12px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        ">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 11px; font-weight: 700; color: #94a3b8; display: inline-flex; align-items: center; gap: 4px;">
              ${icon('container', '', 13)} Frachtkapazität
            </span>
            ${isFull ? `<span style="background: #ef4444; color: #ffffff; font-size: 9.5px; font-weight: 800; padding: 1px 5px; border-radius: 4px;">VOLL</span>` : ''}
          </div>
          <div style="font-size: 15px; font-weight: 800; color: ${isFull ? '#ef4444' : '#f8fafc'};">
            ${cargo.length} / ${maxCargo} <span style="font-size: 11px; font-weight: 600; color: #94a3b8;">Kacheln</span>
          </div>
          <div style="height: 4px; background: rgba(0,0,0,0.5); border-radius: 99px; overflow: hidden; margin-top: 2px;">
            <div style="width: ${Math.min(100, (cargo.length / maxCargo) * 100)}%; height: 100%; background: ${isFull ? '#ef4444' : '#38bdf8'}; border-radius: 99px;"></div>
          </div>
        </div>

        <!-- Geschätzter Börsenwert -->
        <div style="
          background: #141c2b;
          border: 1px solid rgba(251, 191, 36, 0.3);
          border-radius: 10px;
          padding: 10px 12px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        ">
          <span style="font-size: 11px; font-weight: 700; color: #94a3b8; display: inline-flex; align-items: center; gap: 4px;">
            ${icon('coins', '', 13)} Börsenwert
          </span>
          <div style="font-size: 15px; font-weight: 800; color: #fbbf24;">
            +€${totalEstimatedValue.toLocaleString()}
          </div>
          <span style="font-size: 10px; color: #64748b;">
            Verkauf an der Erzbörse
          </span>
        </div>
      </div>
    `;

    // Erzliste
    let oreListHtml = '';
    const oreKeys = Object.keys(oreCounts);

    if (oreKeys.length === 0) {
      oreListHtml = `
        <div style="
          background: #141c2b;
          border: 1px dashed rgba(255, 255, 255, 0.12);
          border-radius: 10px;
          padding: 24px 16px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        ">
          <div style="color: #64748b;">${icon('container', '', 32)}</div>
          <div style="font-size: 13.5px; font-weight: 700; color: #cbd5e1;">Dein Laderaum ist leer</div>
          <p style="font-size: 11.5px; color: #94a3b8; margin: 0; max-width: 280px; line-height: 1.4;">
            Fahre in den Schacht und baue Erze ab. Sie landen automatisch hier in deinem Frachtraum.
          </p>
        </div>
      `;
    } else {
      oreListHtml = `
        <div style="font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; display: flex; align-items: center; gap: 5px;">
          ${icon('stone', '', 12)} Aktuelles Rohstoff-Inventar (${cargo.length} Einheiten)
        </div>
        <div style="display: flex; flex-direction: column; gap: 6px; max-height: 240px; overflow-y: auto; padding-right: 2px;">
          ${oreKeys.map(key => {
            const count = oreCounts[key];
            const data = ORE_DATA[key] || { name: key, value: 0, hardness: 1.0, minDepth: 1 };
            const subtotal = data.value * count;

            return `
              <div style="
                background: #141c2b;
                border: 1px solid rgba(255, 255, 255, 0.08);
                border-radius: 8px;
                padding: 8px 12px;
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 8px;
              ">
                <div style="display: flex; align-items: center; gap: 8px; min-width: 0;">
                  <div style="display: flex; align-items: center; justify-content: center; width: 26px; height: 26px; background: rgba(0,0,0,0.35); border-radius: 6px; border: 1px solid rgba(255,255,255,0.06);">
                    ${oreIcon(key, 16)}
                  </div>
                  <div style="display: flex; flex-direction: column; min-width: 0;">
                    <span style="font-size: 13px; font-weight: 700; color: #f8fafc; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                      ${data.name}
                    </span>
                    <span style="font-size: 10px; color: #94a3b8;">
                      €${data.value}/Stk. • ab ${data.minDepth}m • Härte ${data.hardness}x
                    </span>
                  </div>
                </div>

                <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 2px; flex-shrink: 0;">
                  <span style="background: rgba(56, 189, 248, 0.15); border: 1px solid rgba(56, 189, 248, 0.3); color: #38bdf8; font-weight: 800; font-size: 11px; padding: 1px 7px; border-radius: 99px;">
                    ${count}x
                  </span>
                  <span style="font-size: 11px; font-weight: 700; color: #fbbf24;">
                    +€${subtotal.toLocaleString()}
                  </span>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `;
    }

    // Zusätzliche Industrie-Erzeugnisse anzeigen (falls vorhanden)
    let factoryHtml = '';
    const fp = this.player.factoryProducts || {};
    const fpEntries = Object.entries(fp).filter(([k, v]) => v > 0);
    if (fpEntries.length > 0) {
      const PRODUCT_NAMES = {
        steel_beam: 'Stahlträger',
        bronze_ingot: 'Bronze-Barren',
        circuit_board: 'Leiterplatte',
        polished_gem: 'Polierter Kristall',
        titan_plate: 'Titanplatte',
        fusion_rod: 'Fusionsstab'
      };

      factoryHtml = `
        <div style="margin-top: 12px;">
          <div style="font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; display: flex; align-items: center; gap: 5px;">
            ${icon('factory', '', 12)} Fabrik-Erzeugnisse
          </div>
          <div style="display: flex; flex-wrap: wrap; gap: 6px;">
            ${fpEntries.map(([k, v]) => `
              <div style="background: #141c2b; border: 1px solid rgba(255,255,255,0.08); border-radius: 6px; padding: 4px 10px; font-size: 11px; display: inline-flex; align-items: center; gap: 6px;">
                ${icon('box', '', 12)}
                <span style="color: #f8fafc; font-weight: 600;">${PRODUCT_NAMES[k] || k}:</span>
                <span style="color: #38bdf8; font-weight: 800;">${v}x</span>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    // Aktions-Leiste unten
    const isAtSurface = (this.player.gy || 0) <= 0;
    const actionsHtml = `
      <div style="display: flex; gap: 8px; margin-top: 14px; flex-wrap: wrap; justify-content: flex-end;">
        ${isAtSurface ? `
          <button id="btn-driller-to-market" class="btn-buy" style="height: 32px; font-size: 11.5px; font-weight: 800; padding: 0 14px; display: inline-flex; align-items: center; gap: 6px;">
            ${icon('coins', '', 13)}
            <span>ZUR ERZ-BÖRSE</span>
          </button>
          <button id="btn-driller-to-depot" class="btn-action" style="height: 32px; font-size: 11.5px; font-weight: 800; padding: 0 14px; display: inline-flex; align-items: center; gap: 6px;">
            ${icon('warehouse', '', 13)}
            <span>ZUM DEPOT</span>
          </button>
          <button id="btn-driller-to-hangar" class="btn-action" style="height: 32px; font-size: 11.5px; font-weight: 800; padding: 0 14px; display: inline-flex; align-items: center; gap: 6px;">
            ${icon('wrench', '', 13)}
            <span>ZUR WERKSTATT</span>
          </button>
        ` : `
          <div style="display: inline-flex; align-items: center; gap: 6px; font-size: 11px; color: #94a3b8; margin-right: auto;">
            ${icon('info', '', 12)} Unter Tage: Erze werden an der Oberfläche verkauft.
          </div>
        `}
        <button id="btn-driller-close" class="btn-3d-secondary" style="height: 32px; font-size: 11.5px; font-weight: 700; padding: 0 16px;">
          SCHLIESSEN
        </button>
      </div>
    `;

    return `
      ${headerHtml}
      ${oreListHtml}
      ${factoryHtml}
      ${actionsHtml}
    `;
  }

  // =========================================================
  // TAB 2: FAHRZEUG-WERTE & SPEZIFIKATIONEN
  // =========================================================
  renderSpecsTab() {
    const p = this.player;

    const returnPct = p.getReturnFuelPercent ? p.getReturnFuelPercent() : 0;
    const hullPct = Math.round((p.hull / p.maxHull) * 100);
    const fuelPct = Math.round((p.fuel / p.maxFuel) * 100);

    const specCards = [
      {
        title: 'BOHRKOPF & MEISSEL',
        icon: 'disc',
        accentColor: '#38bdf8',
        mainVal: `${p.drillPower} DPS`,
        subVal: `Modell: MK-${p.drillTier}`,
        desc: `Schneidet durch Erdreich, Schiefer, Granit und Obsidian. Erforscht im Labor: MK-${p.researchedDrillTier || p.drillTier}.`
      },
      {
        title: 'PANZERUNG & KAROSSERIE',
        icon: 'shield-cog',
        accentColor: hullPct <= 25 ? '#ef4444' : '#10b981',
        mainVal: `${Math.round(p.hull)} / ${p.maxHull} HP`,
        subVal: `Stufe ${p.hullTier || 1} • ${hullPct}%`,
        desc: `Schützt die Fahrzeugkabine. Erleidet beim Bohren von hartem Gestein leichten Reibungsverschleiß.`
      },
      {
        title: 'TREIBSTOFF & TANK',
        icon: 'fuel',
        accentColor: '#f59e0b',
        mainVal: `${Math.round(p.fuel)} / ${p.maxFuel} L`,
        subVal: `Tank Stufe ${p.tankTier} • ${fuelPct}%`,
        desc: `Reservebedarf für sicheren Rückflug: ca. ${Math.round(returnPct)}%. An der Tankstelle kostenlos auffüllbar.`
      },
      {
        title: 'ANTRIEB & JETPACK',
        icon: 'zap',
        accentColor: '#c084fc',
        mainVal: `${p.flightSpeed} px/s`,
        subVal: `Getriebe Stufe ${p.engineTier} • ${p.moveDuration}ms`,
        desc: `Regelt die Fahr- und Steiggeschwindigkeit. Kontrollierte, stabile Kettenführung unter Tage.`
      },
      {
        title: 'FRACHTRAUM-KAPAZITÄT',
        icon: 'container',
        accentColor: '#38bdf8',
        mainVal: `${p.maxCargo} Kacheln`,
        subVal: `Laderaum Stufe ${p.cargoTier}`,
        desc: `Bestimmt, wie viele abgebaute Erzkacheln transportiert werden können, bevor eine Entleerung nötig ist.`
      },
      {
        title: 'SENSOR & ERZ-RADAR',
        icon: 'radio',
        accentColor: '#10b981',
        mainVal: `${p.sensorRadius || 1.6} Kacheln`,
        subVal: `Radar Stufe ${p.sensorTier || 1}`,
        desc: `Macht verdeckte Erzadern im umgebenden Gestein sichtbar. Größerer Radius erleichtert das Finden von Diamanten.`
      }
    ];

    const cardsHtml = `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
        ${specCards.map(s => `
          <div style="
            background: #141c2b;
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 10px;
            padding: 10px 12px;
            display: flex;
            flex-direction: column;
            gap: 4px;
          ">
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <span style="font-size: 10px; font-weight: 800; color: ${s.accentColor}; text-transform: uppercase; letter-spacing: 0.4px; display: inline-flex; align-items: center; gap: 5px;">
                ${icon(s.icon, '', 12)} ${s.title}
              </span>
            </div>
            <div style="font-size: 14px; font-weight: 800; color: #f8fafc;">
              ${s.mainVal}
            </div>
            <div style="font-size: 11px; font-weight: 700; color: #94a3b8;">
              ${s.subVal}
            </div>
            <p style="font-size: 10.5px; color: #64748b; margin: 4px 0 0 0; line-height: 1.35;">
              ${s.desc}
            </p>
          </div>
        `).join('')}
      </div>
    `;

    const isAtSurface = (this.player.gy || 0) <= 0;
    const footerHtml = `
      <div style="display: flex; gap: 8px; margin-top: 14px; justify-content: flex-end;">
        ${isAtSurface ? `
          <button id="btn-driller-to-hangar" class="btn-action" style="height: 32px; font-size: 11.5px; font-weight: 800; padding: 0 14px; display: inline-flex; align-items: center; gap: 6px;">
            ${icon('wrench', '', 13)}
            <span>UPGRADES IN WERKSTATT</span>
          </button>
        ` : ''}
        <button id="btn-driller-close" class="btn-3d-secondary" style="height: 32px; font-size: 11.5px; font-weight: 700; padding: 0 16px;">
          SCHLIESSEN
        </button>
      </div>
    `;

    return `
      ${cardsHtml}
      ${footerHtml}
    `;
  }

  // =========================================================
  // TAB 3: GESAMT-ABBAU & KARRIERE-STATISTIK
  // =========================================================
  renderHistoryTab() {
    const stats = this.player.stats || {};
    const totalOresMined = stats.totalOresMined || {};

    const summaryCards = [
      { label: 'Abgebaute Kacheln', value: (stats.totalTilesMined || 0).toLocaleString(), icon: 'pickaxe', color: '#38bdf8' },
      { label: 'Gesamterlös Börse', value: `€${(stats.totalCashEarned || 0).toLocaleString()}`, icon: 'coins', color: '#fbbf24' },
      { label: 'Maximale Tiefe', value: `${this.player.highestDepthReached || 0} m`, icon: 'arrow-down', color: '#10b981' },
      { label: 'Erfüllte Missionen', value: `${stats.missionsCompleted || 0}`, icon: 'award', color: '#c084fc' }
    ];

    const summaryHtml = `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px;">
        ${summaryCards.map(c => `
          <div style="background: #141c2b; border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; padding: 8px 10px; display: flex; flex-direction: column; gap: 2px;">
            <span style="font-size: 10px; color: #94a3b8; font-weight: 700; display: inline-flex; align-items: center; gap: 4px;">
              ${icon(c.icon, '', 11)} ${c.label}
            </span>
            <span style="font-size: 14px; font-weight: 800; color: ${c.color};">
              ${c.value}
            </span>
          </div>
        `).join('')}
      </div>
    `;

    // Gesamte abgebaute Erze nach Art
    const oreKeys = Object.keys(ORE_DATA);
    const oresHtml = `
      <div style="font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">
        Lebenszeit-Förderung aller Erze
      </div>
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 6px; max-height: 200px; overflow-y: auto; padding-right: 2px;">
        ${oreKeys.map(k => {
          const count = totalOresMined[k] || 0;
          const data = ORE_DATA[k];
          return `
            <div style="background: #141c2b; border: 1px solid rgba(255,255,255,0.06); border-radius: 6px; padding: 6px 8px; display: flex; align-items: center; justify-content: space-between;">
              <span style="font-size: 11.5px; font-weight: 600; color: #cbd5e1; display: inline-flex; align-items: center; gap: 5px;">
                ${oreIcon(k, 13)} ${data.name}
              </span>
              <span style="font-size: 11px; font-weight: 800; color: ${count > 0 ? '#38bdf8' : '#64748b'};">
                ${count}
              </span>
            </div>
          `;
        }).join('')}
      </div>
    `;

    const footerHtml = `
      <div style="display: flex; gap: 8px; margin-top: 14px; justify-content: flex-end;">
        <button id="btn-driller-close" class="btn-3d-secondary" style="height: 32px; font-size: 11.5px; font-weight: 700; padding: 0 16px;">
          SCHLIESSEN
        </button>
      </div>
    `;

    return `
      ${summaryHtml}
      ${oresHtml}
      ${footerHtml}
    `;
  }

  attachEventListeners(bodyEl) {
    const btnClose = bodyEl.querySelector('#btn-driller-close');
    if (btnClose) {
      btnClose.onclick = () => {
        soundFx.playClick();
        this.close();
      };
    }

    const btnToMarket = bodyEl.querySelector('#btn-driller-to-market');
    if (btnToMarket) {
      btnToMarket.onclick = () => {
        soundFx.playClick();
        if (this.baseSystem && this.baseSystem.openMarketModal) {
          this.baseSystem.openMarketModal();
        }
      };
    }

    const btnToDepot = bodyEl.querySelector('#btn-driller-to-depot');
    if (btnToDepot) {
      btnToDepot.onclick = () => {
        soundFx.playClick();
        if (this.baseSystem && this.baseSystem.openDepotModal) {
          this.baseSystem.openDepotModal('ores');
        }
      };
    }

    const btnToHangar = bodyEl.querySelector('#btn-driller-to-hangar');
    if (btnToHangar) {
      btnToHangar.onclick = () => {
        soundFx.playClick();
        if (this.baseSystem && this.baseSystem.openHangarModal) {
          this.baseSystem.openHangarModal();
        }
      };
    }
  }
}
