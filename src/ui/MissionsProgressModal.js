import { MISSION_POOL } from '../core/MissionSystem.js';
import { ORE_DATA } from '../core/GridSystem.js';
import { soundFx } from '../core/SoundEffects.js';
import { icon, refreshIcons, oreIcon } from './IconHelper.js';
import { closeActiveModal, GEOLOGIST_QUESTS, COMPONENT_DATA } from '../core/BaseSystem.js';
import { SaveSystem } from '../core/SaveSystem.js';
import { LEVEL_BONUS_REWARDS } from '../core/Player.js';

export const INSURANCE_PLANS = [
  {
    id: 'humus',
    layerName: 'Humus',
    depthRange: '0 – 50 m',
    maxDepth: 50,
    price: 150,
    color: '#d97706',
    desc: 'Basis-Schutz für die oberste Schicht (0–50 m). Bergungsdrohnen schleppen deinen Crawler bei Treibstoffmangel sicher an die Oberfläche.'
  },
  {
    id: 'schist',
    layerName: 'Schiefer',
    depthRange: '0 – 180 m',
    maxDepth: 180,
    price: 450,
    color: '#64748b',
    desc: 'Erweiterte Bergung bis 180 m Tiefe. Deckt Humus und Schiefergestein zuverlässig ab.'
  },
  {
    id: 'granite',
    layerName: 'Granit',
    depthRange: '0 – 480 m',
    maxDepth: 480,
    price: 1500,
    color: '#38bdf8',
    desc: 'Schwerer Drohnen-Schutz bis 480 m Tiefe für Expeditionen in zähen Tiefengranit.'
  },
  {
    id: 'obsidian',
    layerName: 'Obsidian',
    depthRange: '0 – 950 m',
    maxDepth: 950,
    price: 5000,
    color: '#a855f7',
    desc: 'Hitzebeständige Tiefen-Bergungsdrohnen für vulkanische Schichten bis 950 m.'
  },
  {
    id: 'core',
    layerName: 'Urgestein',
    depthRange: 'Alle Schichten (> 950 m)',
    maxDepth: 99999,
    price: 15000,
    color: '#ef4444',
    desc: 'Ultimative Subraum-Bergungsmatrix. Schützt deinen Crawler bis in tiefste Kernzonen.'
  }
];

/**
 * MissionsProgressModal.js
 * Zentrales Expeditions- & Auftragsmenü mit 5 Reitern:
 * 1. Aktiver Auftrag (Detailansicht, Fortschrittsbalken, Belohnung)
 * 2. Level & Ränge (XP-Balken, Freischaltungen, Perks)
 * 3. Auftrags-Pool (Alle Missionen auswählen & annehmen)
 * 4. Steinforscher (Erzproben für Spezial-Bauteile abgeben)
 * 5. Statistik über Gamefortschritt (Tiefe, geförderte Erze, Vermögen, Ausbauten)
 */

export class MissionsProgressModal {
  constructor(scene, player, missionSystem, baseSystem) {
    this.scene = scene;
    this.player = player;
    this.missionSystem = missionSystem;
    this.baseSystem = baseSystem;

    this.currentTab = 'missions'; // 'missions' | 'levels' | 'geologist' | 'insurance' | 'stats'
  }

  open(initialTab = 'missions') {
    soundFx.stopAllLoops?.();
    if (this.scene) this.scene.isPaused = true;
    if (!this.baseSystem && this.scene && this.scene.baseSystem) {
      this.baseSystem = this.scene.baseSystem;
    }
    if (initialTab === 'active' || initialTab === 'pool') {
      initialTab = 'missions';
    }
    this.currentTab = initialTab;
    this.render();
  }

  close() {
    closeActiveModal(this.scene);
  }

  render() {
    const modalEl = document.getElementById('building-modal');
    const titleEl = document.getElementById('modal-title');
    const bodyEl = document.getElementById('modal-body');
    if (!modalEl || !titleEl || !bodyEl) return;

    titleEl.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px;">
        ${icon('laptop-minimal', '', 18)}
        <span>BÜRO</span>
      </div>
    `;

    // Steinforscher Quests Status prüfen
    const p = this.player;
    if (!p.seenGeologistQuests) p.seenGeologistQuests = new Set();
    const cargoCounts = {};
    p.cargo?.forEach(ore => {
      cargoCounts[ore] = (cargoCounts[ore] || 0) + 1;
    });
    const depotOres = (this.baseSystem?.depot?.ores) || (this.scene?.baseSystem?.depot?.ores) || {};
    const visibleGeologistQuests = GEOLOGIST_QUESTS.filter(q =>
      Object.keys(q.reqs).every(ore => p.isOreDiscovered(ore))
    );
    const readyGeologistCount = visibleGeologistQuests.filter(q => {
      return Object.entries(q.reqs).every(([ore, needed]) => {
        const total = (cargoCounts[ore] || 0) + (depotOres[ore] || 0);
        return total >= needed;
      });
    }).length;
    const unseenGeologistCount = visibleGeologistQuests.filter(q => !p.seenGeologistQuests?.has(q.id)).length;

    if (this.currentTab === 'geologist') {
      visibleGeologistQuests.forEach(q => p.seenGeologistQuests.add(q.id));
      if (this.baseSystem?.updateOfficeBubble) {
        this.baseSystem.updateOfficeBubble();
      }
    }

    const geologistBadge = readyGeologistCount > 0 
      ? `<span class="tab-badge" style="background: rgba(16, 185, 129, 0.25); color: #10b981;">${readyGeologistCount}</span>`
      : (unseenGeologistCount > 0 ? `<span class="tab-badge" style="background: rgba(56, 189, 248, 0.25); color: #38bdf8;">${unseenGeologistCount}</span>` : '');

    const insuranceBadge = this.player.activeInsurance 
      ? `<span class="tab-badge" style="background: rgba(16, 185, 129, 0.25); color: #10b981;">Aktiv</span>` 
      : (!this.player.firstRescueUsed ? `<span class="tab-badge" style="background: rgba(245, 158, 11, 0.25); color: #fbbf24;">1x Frei</span>` : `<span class="tab-badge" style="background: rgba(239, 68, 68, 0.25); color: #f87171;">Keine</span>`);

    const readyMissionsCount = (this.missionSystem.availableMissions || []).filter(m => m.isCompleted).length;
    const missionBadge = readyMissionsCount > 0 
      ? `<span class="tab-badge" style="background: rgba(16, 185, 129, 0.25); color: #10b981;">${readyMissionsCount}</span>` 
      : '';

    // Tab Navigation Bar
    const tabs = [
      { id: 'missions', label: 'Aufträge', icon: 'clipboard-list', badgeHtml: missionBadge },
      { id: 'levels', label: 'Level', icon: 'award' },
      { id: 'geologist', label: 'Geologe', icon: 'microscope', badgeHtml: geologistBadge },
      { id: 'insurance', label: 'Versicherung', icon: 'shield-check', badgeHtml: insuranceBadge },
      { id: 'stats', label: 'Statistik', icon: 'bar-chart-3' }
    ];

    const tabNavHtml = `
      <div class="register-tab-bar">
        ${tabs.map(t => {
          const isActive = this.currentTab === t.id;
          return `
            <button class="register-tab tab-btn ${isActive ? 'active' : ''}" data-tab="${t.id}">
              ${icon(t.icon, '', 14)}
              <span>${t.label}</span>
              ${t.badgeHtml || ''}
            </button>
          `;
        }).join('')}
      </div>
    `;

    // Content je nach Tab
    let contentHtml = '';
    if (this.currentTab === 'missions' || this.currentTab === 'active' || this.currentTab === 'pool') {
      contentHtml = this.renderMissionsTab();
    } else if (this.currentTab === 'levels') {
      contentHtml = this.renderLevelsTab();
    } else if (this.currentTab === 'geologist') {
      contentHtml = this.renderGeologistTab();
    } else if (this.currentTab === 'insurance') {
      contentHtml = this.renderInsuranceTab();
    } else if (this.currentTab === 'stats') {
      contentHtml = this.renderStatsTab();
    }

    bodyEl.innerHTML = `
      <div class="register-tab-container" style="display: flex; flex-direction: column; max-width: 760px; margin: 0 auto; width: 100%; box-sizing: border-box; padding: 0 4px 36px 4px; gap: 0 !important; row-gap: 0 !important;">
        ${tabNavHtml}
        <div id="modal-tab-content" class="register-tab-panel">
          ${contentHtml}
        </div>
      </div>
    `;

    document.body.classList.add('modal-open');
    modalEl.style.display = 'flex';
    refreshIcons(modalEl);

    // Tab-Klick Listener
    const tabBtns = bodyEl.querySelectorAll('.tab-btn');
    tabBtns.forEach(b => {
      b.onclick = () => {
        this.currentTab = b.getAttribute('data-tab');
        this.render();
      };
    });

    this.attachTabListeners(bodyEl);
  }

  // =========================================================================
  // TAB 1: AUFTRÄGE (3 GLEICHZEITIG AKTIVE AUFTRÄGE)
  // =========================================================================
  renderMissionsTab() {
    if (this.missionSystem.ensureAvailableMissions) {
      this.missionSystem.ensureAvailableMissions(3);
    }
    const available = this.missionSystem.availableMissions || [];
    const curLevel = this.player.level || 1;

    const cardsHtml = available.length === 0 ? `
      <div style="text-align: center; padding: 28px 16px; color: #94a3b8; font-size: 12.5px; background: rgba(15,23,42,0.6); border-radius: 12px; border: 1.5px dashed rgba(56,189,248,0.25);">
        ${icon('check-circle', '', 28)}
        <div style="font-weight: 700; color: #f8fafc; font-size: 14px; margin: 8px 0 4px 0;">Alle Aufträge erfüllt!</div>
        <p style="margin: 0; color: #cbd5e1; font-size: 12px;">Aktuell stehen keine weiteren Aufträge an. Erkunde tiefere Schichten oder steigere dein Level für neue Verträge.</p>
      </div>
    ` : available.map(m => {
      const isDone = !!m.isCompleted;
      const isUpcoming = !isDone && curLevel < m.minLevel;
      const maxProg = m.targetCount || m.targetDepth || 1;
      const curProg = Math.min(maxProg, m.progress || 0);
      const pct = Math.min(100, Math.round((curProg / maxProg) * 100));

      return `
        <div style="
          background: rgba(15, 23, 42, 0.85);
          border: 1px solid ${isDone ? 'rgba(16, 185, 129, 0.5)' : isUpcoming ? 'rgba(245, 158, 11, 0.35)' : 'rgba(56, 189, 248, 0.3)'};
          border-left: 5px solid ${isDone ? '#10b981' : isUpcoming ? '#f59e0b' : '#38bdf8'};
          border-radius: 12px;
          padding: 14px 16px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
          transition: all 0.2s ease;
        ">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; margin-bottom: 8px;">
            <div>
              <span style="
                font-size: 10px;
                font-weight: 800;
                color: ${isDone ? '#10b981' : isUpcoming ? '#fbbf24' : '#38bdf8'};
                text-transform: uppercase;
                letter-spacing: 0.8px;
                background: ${isDone ? 'rgba(16, 185, 129, 0.15)' : isUpcoming ? 'rgba(245, 158, 11, 0.15)' : 'rgba(56, 189, 248, 0.15)'};
                padding: 2px 8px;
                border-radius: 4px;
                display: inline-flex;
                align-items: center;
                gap: 5px;
              ">
                ${icon(isDone ? 'check-circle' : isUpcoming ? 'lock' : 'crosshair', '', 12)}
                ${isDone ? 'AUFTRAG ERFÜLLT' : isUpcoming ? `DEMNÄCHST (AB LVL ${m.minLevel})` : 'IN ARBEIT'}
              </span>
              <h3 style="color: #f8fafc; font-size: 15px; font-weight: 700; margin: 6px 0 2px 0;">${m.title}</h3>
            </div>
            <div style="display: flex; gap: 6px; align-items: center; flex-wrap: wrap; justify-content: flex-end;">
              <span style="background: rgba(251, 191, 36, 0.15); color: #fbbf24; font-weight: 800; font-size: 11.5px; padding: 3px 8px; border-radius: 6px; display: inline-flex; align-items: center; gap: 4px;">
                ${icon('coins', '', 12)} €${m.rewardCash.toLocaleString('de-DE')}
              </span>
              <span style="background: rgba(168, 85, 247, 0.15); color: #c084fc; font-weight: 800; font-size: 11.5px; padding: 3px 8px; border-radius: 6px; display: inline-flex; align-items: center; gap: 4px;">
                ${icon('award', '', 12)} ${m.rewardXp} XP
              </span>
              ${m.rewardComp ? `
                <span style="background: rgba(56, 189, 248, 0.15); color: #38bdf8; font-weight: 800; font-size: 11.5px; padding: 3px 8px; border-radius: 6px; display: inline-flex; align-items: center; gap: 4px;">
                  ${icon('package', '', 12)} +${m.rewardComp.count || 1}x ${m.rewardComp.name || 'Bauteil'}
                </span>
              ` : ''}
            </div>
          </div>

          <p style="font-size: 12px; line-height: 1.45; color: #cbd5e1; margin: 0 0 10px 0;">
            ${m.desc}
          </p>

          <!-- Fortschrittsbalken -->
          <div style="margin-bottom: 12px;">
            <div style="display: flex; justify-content: space-between; font-size: 11.5px; font-weight: 700; margin-bottom: 5px;">
              <span style="color: #cbd5e1; display: inline-flex; align-items: center; gap: 5px;">
                ${icon('target', '', 13)}
                ${m.type === 'COLLECT_ORE' ? `Gefördert: <strong style="color: #f8fafc; margin: 0 2px;">${curProg}/${maxProg}</strong> <span style="display: inline-flex; align-items: center; gap: 4px;">${oreIcon(m.targetOre, 13)} ${ORE_DATA[m.targetOre]?.name || 'Erzen'}</span>` : `Ziel-Tiefe: <strong style="color: #f8fafc; margin: 0 2px;">${curProg}/${maxProg}</strong> Meter`}
              </span>
              <span style="color: ${isDone ? '#10b981' : isUpcoming ? '#fbbf24' : '#38bdf8'}; font-weight: 800;">${pct}%</span>
            </div>
            <div style="width: 100%; height: 7px; background: rgba(15, 23, 42, 0.9); border-radius: 99px; overflow: hidden;">
              <div style="
                width: ${pct}%;
                height: 100%;
                background: ${isDone ? 'linear-gradient(90deg, #10b981, #34d399)' : isUpcoming ? 'linear-gradient(90deg, #d97706, #fbbf24)' : 'linear-gradient(90deg, #2563eb, #38bdf8)'};
                border-radius: 99px;
                transition: width 0.3s ease;
              "></div>
            </div>
          </div>

          <!-- Aktions-Buttons -->
          <div style="display: flex; justify-content: space-between; align-items: center; gap: 10px; padding-top: 6px; border-top: 1px solid rgba(255, 255, 255, 0.05);">
            <button class="btn-reroll-single-mission btn-3d-secondary" data-mid="${m.id}" style="height: 32px; box-sizing: border-box; font-size: 11px; padding: 0 12px; display: inline-flex; align-items: center; justify-content: center; gap: 5px; border-radius: 7px;">
              ${icon('refresh-cw', '', 12)} Anderer Auftrag
            </button>
            <div>
              ${isDone ? `
                <button class="btn-claim-mission btn-buy" data-mid="${m.id}" style="
                  height: 32px;
                  box-sizing: border-box;
                  padding: 0 16px;
                  font-size: 11.5px;
                  font-weight: 800;
                  display: inline-flex;
                  align-items: center;
                  justify-content: center;
                  gap: 6px;
                  border-radius: 7px;
                  background: linear-gradient(180deg, #10b981 0%, #059669 100%);
                  border-color: #34d399;
                  border-bottom: 3px solid #047857;
                  color: #ffffff;
                ">
                  ${icon('check-circle', '', 14)}
                  <span>Belohnung abholen</span>
                </button>
              ` : `
                <span style="font-size: 11px; color: #94a3b8; font-weight: 600; display: inline-flex; align-items: center; gap: 5px; padding: 0 4px;">
                  ${icon('clock', '', 12)}
                  <span>${isUpcoming ? `Freischaltung ab Level ${m.minLevel}` : 'Aktiv im Schacht'}</span>
                </span>
              `}
            </div>
          </div>
        </div>
      `;
    }).join('');

    return `
      <div style="display: flex; flex-direction: column; gap: 12px;">
        <!-- Header Info Bar -->
        <div style="
          background: rgba(15, 23, 42, 0.6);
          border: 1px solid rgba(56, 189, 248, 0.2);
          border-radius: 10px;
          padding: 10px 14px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 8px;
        ">
          <div style="font-size: 12px; font-weight: 800; color: #38bdf8; text-transform: uppercase; letter-spacing: 0.6px; display: flex; align-items: center; gap: 6px;">
            ${icon('clipboard-list', '', 14)} Auftragsbörse (3 aktive Verträge)
          </div>
          <span style="font-size: 11px; color: #94a3b8;">
            Schachttiefe: <strong style="color: #38bdf8;">${this.player.depthMeters > 0 ? `-${this.player.depthMeters}` : '0'}m</strong> · Fracht: <strong style="color: #f8fafc;">${this.player.cargoCount}/${this.player.maxCargo}</strong>
          </span>
        </div>

        <!-- 3 Auftrags-Karten -->
        <div style="display: flex; flex-direction: column; gap: 10px;">
          ${cardsHtml}
        </div>
      </div>
    `;
  }

  // =========================================================================
  // TAB 2: LEVEL (NUR AKTUELLES & NÄCHSTES LEVEL)
  // =========================================================================
  renderLevelsTab() {
    const p = this.player;
    const curLevel = p.level || 1;
    const curXp = p.xp || 0;
    const neededXp = p.xpNeeded || 350;
    const pct = Math.min(100, Math.round((curXp / neededXp) * 100));

    const levelDetails = {
      1: {
        title: 'Novize',
        layer: 'Humus (0–50m)',
        desc: 'Einstieg in den Schacht-Bergbau.',
        perks: 'Zugang zu Basis-Upgrades und Erzbörse'
      },
      2: {
        title: 'Schürfer',
        layer: 'Schiefer (30–150m)',
        desc: 'Erste Festgesteins-Schichten.',
        perks: 'Freischaltung von Fabrik und Steinforscher'
      },
      3: {
        title: 'Tiefen-Geologe',
        layer: 'Granit (130–350m)',
        desc: 'Zähe Tiefengesteine und reiche Mineraladern.',
        perks: 'Bohrkopf Mk.III & Kompressions-Tank'
      },
      4: {
        title: 'Basalt-Pionier',
        layer: 'Basalt (300–600m)',
        desc: 'Vulkanisches Gestein unter hohem Gebirgsdruck.',
        perks: 'Schwere Verbundpanzerung & Booster'
      },
      5: {
        title: 'Kern-Ingenieur',
        layer: 'Obsidian (500–900m)',
        desc: 'Magmatische Hochdruck-Zone.',
        perks: 'Industrie-Werkstatt & Laser-Schub'
      },
      6: {
        title: 'Magma-Schürfer',
        layer: 'Magma (850–1.200m)',
        desc: 'Glutflüssiges Tiefengestein.',
        perks: 'Nanit-Matrix & Plasmareaktoren'
      },
      7: {
        title: 'Kavitations-Experte',
        layer: 'Kavitation (1.200–1.600m)',
        desc: 'Tiefe Hohlraum-Systeme & Geoden.',
        perks: 'Kraftfeld-Deflektoren & Subraum-Module'
      },
      8: {
        title: 'Urgestein-Meister',
        layer: 'Urgestein (1.600–2.000m)',
        desc: 'Extrem verdichtetes Tiefengestein.',
        perks: 'Singularitäts-Fräsen & Kompaktoren'
      },
      9: {
        title: 'Quanten-Architekt',
        layer: 'Erdkern (2.000–2.500m)',
        desc: 'Fluktuierende Gravitationsfelder.',
        perks: 'Chrono-Tachyonen & Adamantit-Hülle'
      },
      10: {
        title: 'Meister der Tiefe',
        layer: 'Planetenherz (2.500m+)',
        desc: 'Das Herz der Welt.',
        perks: 'Tachyonen-Disruptor & Quanten-Aura'
      }
    };

    const cur = levelDetails[curLevel] || {
      title: p.rankTitle || `Level ${curLevel}`,
      layer: 'Schacht-Tiefe',
      desc: 'Aktuelle Expedition.',
      perks: 'Standard-Ausrüstung'
    };

    const nextLvl = curLevel + 1;
    const next = levelDetails[nextLvl];
    const nextBonus = LEVEL_BONUS_REWARDS[nextLvl];

    return `
      <div style="display: flex; flex-direction: column; gap: 12px; max-width: 620px; margin: 0 auto; width: 100%;">
        <!-- AKTUELLES LEVEL -->
        <div style="
          background: rgba(15, 23, 42, 0.85);
          border: 1px solid rgba(56, 189, 248, 0.3);
          border-left: 4px solid #38bdf8;
          border-radius: 12px;
          padding: 14px 16px;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
        ">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="
                background: rgba(56, 189, 248, 0.15);
                color: #38bdf8;
                font-size: 11px;
                font-weight: 800;
                padding: 2px 8px;
                border-radius: 5px;
                letter-spacing: 0.5px;
              ">
                LEVEL ${curLevel}
              </span>
              <strong style="color: #f8fafc; font-size: 15px;">${cur.title}</strong>
            </div>
            <span style="font-size: 10px; font-weight: 800; color: #10b981; background: rgba(16, 185, 129, 0.15); padding: 2px 8px; border-radius: 4px; display: inline-flex; align-items: center; gap: 4px;">
              ${icon('check', '', 11)} AKTUELL
            </span>
          </div>

          <div style="font-size: 11.5px; color: #cbd5e1; margin-bottom: 10px; line-height: 1.4;">
            ${cur.layer} · ${cur.desc}
          </div>

          <div style="font-size: 11px; color: #94a3b8; display: flex; align-items: center; gap: 5px; margin-bottom: 12px;">
            ${icon('sparkles', '', 12)} <span style="color: #cbd5e1;">Aktiv:</span> <strong style="color: #38bdf8;">${cur.perks}</strong>
          </div>

          <!-- XP-Balken -->
          <div style="padding-top: 8px; border-top: 1px solid rgba(255, 255, 255, 0.06);">
            <div style="display: flex; justify-content: space-between; font-size: 11px; font-weight: 700; margin-bottom: 5px;">
              <span style="color: #94a3b8; display: inline-flex; align-items: center; gap: 4px;">
                ${icon('award', '', 12)} Fortschritt zu Level ${nextLvl <= 10 ? nextLvl : 'Max'}
              </span>
              <span style="color: #38bdf8; font-weight: 800;">${curXp.toLocaleString('de-DE')} / ${neededXp.toLocaleString('de-DE')} XP (${pct}%)</span>
            </div>
            <div style="width: 100%; height: 6px; background: rgba(15, 23, 42, 0.9); border-radius: 99px; overflow: hidden;">
              <div style="width: ${pct}%; height: 100%; background: linear-gradient(90deg, #0284c7, #38bdf8); border-radius: 99px; transition: width 0.3s ease;"></div>
            </div>
          </div>
        </div>

        <!-- NÄCHSTES LEVEL -->
        ${next ? `
          <div style="
            background: rgba(15, 23, 42, 0.6);
            border: 1px dashed rgba(168, 85, 247, 0.35);
            border-left: 4px solid #a855f7;
            border-radius: 12px;
            padding: 14px 16px;
          ">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="
                  background: rgba(168, 85, 247, 0.15);
                  color: #c084fc;
                  font-size: 11px;
                  font-weight: 800;
                  padding: 2px 8px;
                  border-radius: 5px;
                  letter-spacing: 0.5px;
                ">
                  LEVEL ${nextLvl}
                </span>
                <strong style="color: #f8fafc; font-size: 15px;">${next.title}</strong>
              </div>
              <span style="font-size: 10px; font-weight: 800; color: #c084fc; background: rgba(168, 85, 247, 0.15); padding: 2px 8px; border-radius: 4px; display: inline-flex; align-items: center; gap: 4px;">
                ${icon('lock', '', 11)} NÄCHSTES LEVEL
              </span>
            </div>

            <div style="font-size: 11.5px; color: #cbd5e1; margin-bottom: 10px; line-height: 1.4;">
              ${next.layer} · ${next.desc}
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; padding-top: 8px; border-top: 1px solid rgba(255, 255, 255, 0.06); font-size: 11px;">
              <span style="color: #94a3b8; display: inline-flex; align-items: center; gap: 4px;">
                ${icon('sparkles', '', 12)} Schaltet frei: <strong style="color: #e2e8f0; margin-left: 2px;">${next.perks}</strong>
              </span>
              ${nextBonus ? `
                <span style="color: #fbbf24; font-weight: 700; background: rgba(251, 191, 36, 0.1); border: 1px solid rgba(251, 191, 36, 0.2); padding: 2px 8px; border-radius: 4px; display: inline-flex; align-items: center; gap: 4px;">
                  ${icon('coins', '', 11)} +€${nextBonus.toLocaleString('de-DE')} Bonus
                </span>
              ` : ''}
            </div>
          </div>
        ` : `
          <div style="text-align: center; padding: 16px; color: #10b981; font-weight: 700; font-size: 12px; background: rgba(16, 185, 129, 0.1); border-radius: 10px; border: 1px solid rgba(16, 185, 129, 0.25);">
            ${icon('award', '', 16)} Maximales Level erreicht! Du bist Meister der Tiefe.
          </div>
        `}
      </div>
    `;
  }

  // =========================================================================
  // TAB 3: STEINFORSCHER (GEOLOGE)
  // =========================================================================
  renderGeologistTab() {
    const p = this.player;
    const comps = p.components || {};

    // Bauteil-Inventar Header (Forscher-Bauteile)
    const activeCompKeys = [
      { key: 'microprocessor', name: 'Mikroprozessor', icon: 'cpu', color: '#60a5fa' },
      { key: 'capacitor', name: 'Druck-Kondensator', icon: 'battery-charging', color: '#fbbf24' },
      { key: 'spectrometer', name: 'Sensor-Spektrometer', icon: 'activity', color: '#c084fc' },
      { key: 'plasma_regulator', name: 'Plasma-Injektor', icon: 'flame', color: '#f87171' },
      { key: 'graviton_core', name: 'Gravitations-Modulator', icon: 'compass', color: '#38bdf8' },
      { key: 'quantum_processor', name: 'Quanten-Prozessor', icon: 'atom', color: '#a78bfa' }
    ];

    const compInventoryHtml = `
      <div style="
        background: rgba(15, 23, 42, 0.85);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 10px;
        padding: 10px 14px;
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 8px;
        margin-bottom: 12px;
      ">
        ${activeCompKeys.map(c => `
          <div style="display: flex; align-items: center; gap: 6px; font-size: 11.5px; background: rgba(0,0,0,0.25); padding: 4px 8px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.04);">
            ${icon(c.icon, '', 13)}
            <span style="color: #cbd5e1; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${c.name}:</span>
            <strong style="color: ${c.color};">${comps[c.key] || 0}</strong>
          </div>
        `).join('')}
      </div>
    `;

    // Quests (abgestimmt auf 0-2000m Tiefe aus BaseSystem)
    const quests = GEOLOGIST_QUESTS;

    const cargoCounts = {};
    p.cargo.forEach(ore => {
      cargoCounts[ore] = (cargoCounts[ore] || 0) + 1;
    });
    const depotOres = (this.baseSystem?.depot?.ores) || (this.scene?.baseSystem?.depot?.ores) || {};

    const visibleQuests = quests.filter(q => Object.keys(q.reqs).every(ore => p.isOreDiscovered(ore)));

    return `
      <div style="display: flex; flex-direction: column; gap: 10px;">
        <p style="font-size: 12px; color: #cbd5e1;">
          Der Geologe analysiert Erzproben für geologische Studien. Gib gesuchte Erze ab (aus Frachtraum & Depot), um seltene High-Tech-Bauteile für deine Tech-Upgrades zu erhalten!
        </p>

        ${compInventoryHtml}

        <div style="display: flex; flex-direction: column; gap: 8px;">
          ${visibleQuests.length === 0 ? `
            <div style="text-align: center; padding: 24px 16px; color: #94a3b8; font-size: 12px; background: rgba(15,23,42,0.5); border-radius: 10px; border: 1px dashed rgba(255,255,255,0.1);">
              <div style="font-weight: 700; color: #f8fafc; font-size: 13px; margin-bottom: 4px;">Keine Proben-Aufträge verfügbar</div>
              Erkunde tiefere Schichten und entdecke neue Erze, um Forschungsaufträge freizuschalten!
            </div>
          ` : visibleQuests.map(q => {
            let canFulfill = true;
            const reqBadges = Object.entries(q.reqs).map(([ore, needed]) => {
              const haveCargo = cargoCounts[ore] || 0;
              const haveDepot = depotOres[ore] || 0;
              const totalHave = haveCargo + haveDepot;
              const oreName = ORE_DATA[ore]?.name || ore;
              if (totalHave < needed) canFulfill = false;
              const isMet = totalHave >= needed;
              return `
                <span style="background: ${isMet ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)'}; border: 1px solid ${isMet ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'}; color: ${isMet ? '#34d399' : '#f87171'}; font-weight: 700; font-size: 11.5px; padding: 3px 8px; border-radius: 6px; display: inline-flex; align-items: center; gap: 5px;">
                  ${oreIcon(ore, 13)} ${oreName}: <strong>${totalHave}/${needed}</strong> ${isMet ? '✓' : ''}
                </span>
              `;
            }).join('');

            return `
              <div style="
                background: #131b2c;
                border: 1px solid ${canFulfill ? 'rgba(16, 185, 129, 0.6)' : 'rgba(255,255,255,0.08)'};
                border-radius: 10px;
                padding: 12px 14px;
                display: flex;
                flex-direction: column;
                gap: 10px;
              ">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <strong style="color: #f8fafc; font-size: 13px; font-weight: 800;">${q.title}</strong>
                  <span style="font-size: 11px; color: #94a3b8; font-weight: 600;">${q.depthHint}</span>
                </div>

                <!-- 1. Du gibst ab (Gesteins- & Erzproben) -->
                <div style="background: rgba(15, 23, 42, 0.55); border: 1px solid rgba(255, 255, 255, 0.07); border-radius: 8px; padding: 8px 10px; display: flex; flex-direction: column; gap: 6px;">
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-size: 10.5px; font-weight: 800; color: #f87171; text-transform: uppercase; letter-spacing: 0.5px; display: inline-flex; align-items: center; gap: 5px;">
                      ${icon('arrow-up-right', '', 12)} Du gibst ab (Proben-Abgabe):
                    </span>
                    <span style="font-size: 10px; color: #94a3b8;">Lager & Fracht</span>
                  </div>
                  <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                    ${reqBadges}
                  </div>
                </div>

                <!-- 2. Du erhältst (Forschungsvergütung) -->
                <div style="background: rgba(16, 185, 129, 0.06); border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 8px; padding: 8px 10px; display: flex; justify-content: space-between; align-items: center; gap: 8px; flex-wrap: wrap;">
                  <div style="display: flex; flex-direction: column; gap: 5px;">
                    <span style="font-size: 10.5px; font-weight: 800; color: #34d399; text-transform: uppercase; letter-spacing: 0.5px; display: inline-flex; align-items: center; gap: 5px;">
                      ${icon('gift', '', 12)} Du erhältst (Belohnung):
                    </span>
                    <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                      <span style="background: rgba(192, 132, 252, 0.18); border: 1px solid rgba(192, 132, 252, 0.4); color: #c084fc; font-weight: 800; font-size: 11.5px; padding: 3px 8px; border-radius: 6px; display: inline-flex; align-items: center; gap: 4px;">
                        ${icon(q.rewardComp.iconName, '', 12)} 1x ${q.rewardComp.name}
                      </span>
                      <span style="background: rgba(251, 191, 36, 0.18); border: 1px solid rgba(251, 191, 36, 0.4); color: #fbbf24; font-weight: 800; font-size: 11.5px; padding: 3px 8px; border-radius: 6px; display: inline-flex; align-items: center; gap: 4px;">
                        ${icon('coins', '', 12)} +€${q.rewardCash.toLocaleString('de-DE')}
                      </span>
                      <span style="background: rgba(56, 189, 248, 0.18); border: 1px solid rgba(56, 189, 248, 0.4); color: #38bdf8; font-weight: 800; font-size: 11.5px; padding: 3px 8px; border-radius: 6px;">
                        +${q.rewardXp} XP
                      </span>
                    </div>
                  </div>

                  <button class="btn-claim-geologist-modal btn-buy" data-qid="${q.id}" ${canFulfill ? '' : 'disabled'} style="height: 34px; box-sizing: border-box; padding: 0 16px; font-size: 12px; font-weight: 800; display: inline-flex; align-items: center; gap: 6px;">
                    ${icon('check', '', 14)}
                    <span>Proben abgeben</span>
                  </button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  // =========================================================================
  // TAB 5: VERSICHERUNG (BERGUNGSSCHUTZ)
  // =========================================================================
  renderInsuranceTab() {
    const p = this.player;
    const active = p.activeInsurance;
    const isFirstFree = !p.firstRescueUsed;

    return `
      <div style="display: flex; flex-direction: column; gap: 12px;">
        <!-- Status-Banner -->
        <div style="
          background: rgba(15, 23, 42, 0.75);
          border: 1px solid ${active ? 'rgba(16, 185, 129, 0.35)' : (isFirstFree ? 'rgba(245, 158, 11, 0.35)' : 'rgba(239, 68, 68, 0.35)')};
          border-radius: 12px;
          padding: 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        ">
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="
              width: 42px;
              height: 42px;
              border-radius: 10px;
              background: ${active ? 'rgba(16, 185, 129, 0.15)' : (isFirstFree ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.15)')};
              color: ${active ? '#34d399' : (isFirstFree ? '#fbbf24' : '#f87171')};
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 20px;
              flex-shrink: 0;
            ">
              ${icon(active ? 'shield-check' : (isFirstFree ? 'shield-alert' : 'shield-x'), '', 22)}
            </div>
            <div>
              <div style="font-size: 14px; font-weight: 800; color: #f8fafc;">
                ${active ? `Aktiver Schutz: ${active.layerName}` : (isFirstFree ? '1x Kostenlose Erstbergung verfügbar' : 'Kein Bergungsschutz aktiv!')}
              </div>
              <div style="font-size: 11.5px; color: #94a3b8; line-height: 1.4;">
                ${active 
                  ? `Dein Crawler ist bis <strong>${active.maxDepth} m</strong> Tiefe gegen Treibstoffmangel versichert. (Wird bei Rettung eingelöst)` 
                  : (isFirstFree 
                    ? 'Deine allererste Rettung ist kostenlos. Für spätere Notfälle muss hier eine Versicherung gekauft werden.' 
                    : 'Achtung: Treibstoffmangel ohne gültige Versicherung führt zum sofortigen <strong style="color: #f87171;">GAME OVER</strong>!')}
              </div>
            </div>
          </div>

          <div style="text-align: right; flex-shrink: 0;">
            <div style="font-size: 10.5px; color: #64748b; font-weight: 700; text-transform: uppercase;">Guthaben</div>
            <div style="font-size: 15px; font-weight: 800; color: #34d399;">€${p.cash.toLocaleString('de-DE')}</div>
          </div>
        </div>

        <!-- Übersicht der Gesteinsschicht-Versicherungen -->
        <div style="display: flex; flex-direction: column; gap: 8px;">
          ${INSURANCE_PLANS.map(plan => {
            const isCurrentlyActive = active?.layerId === plan.id;
            const isCoveredByHigher = active && active.maxDepth >= plan.maxDepth && !isCurrentlyActive;
            const canAfford = p.cash >= plan.price;

            let badgeHtml = '';
            if (isCurrentlyActive) {
              badgeHtml = `<span style="background: rgba(16, 185, 129, 0.2); color: #34d399; font-size: 10.5px; font-weight: 800; padding: 3px 8px; border-radius: 6px; display: inline-flex; align-items: center; gap: 4px;">${icon('check', '', 12)} AKTIV</span>`;
            } else if (isCoveredByHigher) {
              badgeHtml = `<span style="background: rgba(56, 189, 248, 0.15); color: #38bdf8; font-size: 10.5px; font-weight: 700; padding: 3px 8px; border-radius: 6px;">ABGEDECKT</span>`;
            }

            return `
              <div style="
                background: rgba(15, 23, 42, 0.6);
                border: 1px solid ${isCurrentlyActive ? 'rgba(16, 185, 129, 0.4)' : 'rgba(255, 255, 255, 0.08)'};
                border-radius: 12px;
                padding: 12px 14px;
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 12px;
              ">
                <div style="display: flex; align-items: center; gap: 12px; flex: 1;">
                  <div style="
                    width: 10px;
                    height: 38px;
                    border-radius: 5px;
                    background: ${plan.color};
                    flex-shrink: 0;
                  "></div>
                  <div style="display: flex; flex-direction: column; gap: 2px;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                      <span style="font-size: 13.5px; font-weight: 800; color: #f8fafc;">${plan.layerName}</span>
                      <span style="font-size: 11px; color: ${plan.color}; font-weight: 700;">${plan.depthRange}</span>
                      ${badgeHtml}
                    </div>
                    <div style="font-size: 11px; color: #94a3b8; line-height: 1.35;">
                      ${plan.desc}
                    </div>
                  </div>
                </div>

                <div style="flex-shrink: 0; display: flex; align-items: center; gap: 8px;">
                  ${isCurrentlyActive ? `
                    <button class="btn-action" disabled style="opacity: 0.6; cursor: default; height: 36px; padding: 0 14px; font-size: 11.5px; font-weight: 700; border-radius: 8px; background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3);">
                      Bereits aktiv
                    </button>
                  ` : isCoveredByHigher ? `
                    <button class="btn-action" disabled style="opacity: 0.5; cursor: default; height: 36px; padding: 0 12px; font-size: 11px; font-weight: 700; border-radius: 8px; background: rgba(30, 41, 59, 0.5); color: #94a3b8; border: 1px solid rgba(255, 255, 255, 0.06);">
                      Höher gedeckt
                    </button>
                  ` : `
                    <button class="btn-buy-insurance btn-3d" data-plan-id="${plan.id}" ${!canAfford ? 'disabled' : ''} style="
                      height: 36px;
                      padding: 0 16px;
                      font-size: 11.5px;
                      font-weight: 800;
                      border-radius: 8px;
                      border: none;
                      background: ${canAfford ? 'linear-gradient(180deg, #10b981 0%, #059669 100%)' : 'rgba(51, 65, 85, 0.6)'};
                      color: ${canAfford ? '#ffffff' : '#64748b'};
                      box-shadow: ${canAfford ? '0 2px 8px rgba(16, 185, 129, 0.3)' : 'none'};
                      cursor: ${canAfford ? 'pointer' : 'not-allowed'};
                    ">
                      Versichern (€${plan.price.toLocaleString('de-DE')})
                    </button>
                  `}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  // =========================================================================
  // TAB 6: STATISTIK ÜBER GAMEFORTSCHRITT
  // =========================================================================
  renderStatsTab() {
    const p = this.player;
    const stats = p.stats || {
      totalTilesMined: 0,
      totalOresMined: {},
      totalCashEarned: p.cash || 0,
      missionsCompleted: 0,
      researchCompleted: 0
    };

    // Zähle Basis-Infrastruktur (7 Start-Gebäude + bis zu 2 Erweiterungsbauten = 9 Gebäude)
    const bs = this.baseSystem;
    const baseBuildingCount = 7; // Labor, Büro, Erzbörse, Depot, Hangar, Schachteinteig, Fabrik
    const purchasedBuilt = (bs && bs.purchasableBuildings) ? bs.purchasableBuildings.filter(b => b.isBuilt).length : 0;
    const builtCount = baseBuildingCount + purchasedBuilt;
    const totalBuildings = 9;

    // Maximale Tiefe (stets sauberer positiver Meterwert)
    const maxDepth = Math.max(0, Math.round(p.highestDepthReached || p.depthMeters || 0));
    const actualDestroyed = this.scene?.gridSystem?.destroyedTiles?.size || 0;
    const tilesMined = Math.max(stats.totalTilesMined || 0, actualDestroyed, maxDepth);
    stats.totalTilesMined = tilesMined;

    const totalOresCount = Object.values(stats.totalOresMined || {}).reduce((sum, n) => sum + (n || 0), 0);
    const totalEarned = Math.max(stats.totalCashEarned || 0, p.cash || 0);

    return `
      <div style="display: flex; flex-direction: column; gap: 12px;">
        <!-- Haupt-Kennzahlen Grid (6 Kacheln) -->
        <div style="
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
        ">
          <div style="background: rgba(30, 41, 59, 0.75); border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 10px; padding: 10px 12px;">
            <span style="font-size: 11px; color: #cbd5e1; font-weight: 700; display: flex; align-items: center; gap: 4px;">
              ${icon('arrow-down', '', 12)} Maximale Schachttiefe
            </span>
            <strong style="color: #38bdf8; font-size: 18px; font-weight: 800; display: block; margin-top: 2px; font-variant-numeric: tabular-nums;">
              ${maxDepth} m
            </strong>
          </div>

          <div style="background: rgba(30, 41, 59, 0.75); border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 10px; padding: 10px 12px;">
            <span style="font-size: 11px; color: #cbd5e1; font-weight: 700; display: flex; align-items: center; gap: 4px;">
              ${icon('pickaxe', '', 12)} Kacheln abgebaut
            </span>
            <strong style="color: #f8fafc; font-size: 18px; font-weight: 800; display: block; margin-top: 2px;">
              ${tilesMined.toLocaleString('de-DE')}
            </strong>
          </div>

          <div style="background: rgba(30, 41, 59, 0.75); border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 10px; padding: 10px 12px;">
            <span style="font-size: 11px; color: #cbd5e1; font-weight: 700; display: flex; align-items: center; gap: 4px;">
              ${icon('coins', '', 12)} Aktuelles Guthaben
            </span>
            <strong style="color: #fbbf24; font-size: 18px; font-weight: 800; display: block; margin-top: 2px;">
              €${(p.cash || 0).toLocaleString('de-DE')}
            </strong>
          </div>

          <div style="background: rgba(30, 41, 59, 0.75); border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 10px; padding: 10px 12px;">
            <span style="font-size: 11px; color: #cbd5e1; font-weight: 700; display: flex; align-items: center; gap: 4px;">
              ${icon('trending-up', '', 12)} Gesamteinnahmen
            </span>
            <strong style="color: #34d399; font-size: 18px; font-weight: 800; display: block; margin-top: 2px;">
              €${totalEarned.toLocaleString('de-DE')}
            </strong>
          </div>

          <div style="background: rgba(30, 41, 59, 0.75); border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 10px; padding: 10px 12px;">
            <span style="font-size: 11px; color: #cbd5e1; font-weight: 700; display: flex; align-items: center; gap: 4px;">
              ${icon('building', '', 12)} Basis-Infrastruktur
            </span>
            <strong style="color: #10b981; font-size: 18px; font-weight: 800; display: block; margin-top: 2px;">
              ${builtCount} / ${totalBuildings} Gebäude
            </strong>
          </div>

          <div style="background: rgba(30, 41, 59, 0.75); border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 10px; padding: 10px 12px;">
            <span style="font-size: 11px; color: #cbd5e1; font-weight: 700; display: flex; align-items: center; gap: 4px;">
              ${icon('clipboard-check', '', 12)} Auftrags-Erfolge
            </span>
            <strong style="color: #60a5fa; font-size: 18px; font-weight: 800; display: block; margin-top: 2px;">
              ${(stats.missionsCompleted || 0) + (stats.researchCompleted || 0)} erledigt
            </strong>
          </div>
        </div>

        <!-- Fahrzeug-Spezifikationen & Tech-Stufen -->
        <div style="background: rgba(30, 41, 59, 0.75); border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 10px; padding: 14px 16px;">
          <div style="font-size: 12px; font-weight: 800; color: #38bdf8; margin-bottom: 12px; display: flex; align-items: center; gap: 6px;">
            ${icon('wrench', '', 13)} Installierte Tech-Komponenten & Missionen
          </div>
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px 24px; font-size: 11.5px;">
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 3px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.06);">
              <span style="color: #94a3b8; font-weight: 600;">Treibstoff-Tank:</span>
              <strong style="color: #f8fafc; font-weight: 800; text-align: right;">Stufe ${p.tankTier || 1} (${p.maxFuel}L)</strong>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 3px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.06);">
              <span style="color: #94a3b8; font-weight: 600;">Bohrkopf:</span>
              <strong style="color: #f8fafc; font-weight: 800; text-align: right;">Stufe ${p.drillTier || 1} (${p.drillPower} DPS)</strong>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 3px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.06);">
              <span style="color: #94a3b8; font-weight: 600;">Frachtraum:</span>
              <strong style="color: #f8fafc; font-weight: 800; text-align: right;">Stufe ${p.cargoTier || 1} (${p.maxCargo} Erze)</strong>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 3px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.06);">
              <span style="color: #94a3b8; font-weight: 600;">Rumpfpanzerung:</span>
              <strong style="color: #f8fafc; font-weight: 800; text-align: right;">Stufe ${p.hullTier || 1} (${p.maxHull} HP)</strong>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 3px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.06);">
              <span style="color: #94a3b8; font-weight: 600;">Sensor-Radar:</span>
              <strong style="color: #f8fafc; font-weight: 800; text-align: right;">Stufe ${p.sensorTier || 1} (${p.sensorRadius} Kacheln)</strong>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 3px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.06);">
              <span style="color: #94a3b8; font-weight: 600;">Bergbau-Aufträge:</span>
              <strong style="color: #f8fafc; font-weight: 800; text-align: right;">${stats.missionsCompleted || 0} erfüllt</strong>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 3px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.06);">
              <span style="color: #94a3b8; font-weight: 600;">Geologie-Forschung:</span>
              <strong style="color: #f8fafc; font-weight: 800; text-align: right;">${stats.researchCompleted || 0} Proben eingereicht</strong>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 3px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.06);">
              <span style="color: #94a3b8; font-weight: 600;">Bodenschätze gesamt:</span>
              <strong style="color: #f8fafc; font-weight: 800; text-align: right;">${totalOresCount} gefördert</strong>
            </div>
          </div>
        </div>

        <!-- Geförderte Erze Statistik (nur bisher entdeckte Steine) -->
        <div style="background: rgba(30, 41, 59, 0.75); border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 10px; padding: 12px;">
          <div style="font-size: 12px; font-weight: 800; color: #fbbf24; margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
            ${icon('gem', '', 13)} Geförderte Bodenschätze (${totalOresCount} insgesamt)
          </div>
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; font-size: 11px;">
            ${Object.entries(ORE_DATA).filter(([key]) => p.isOreDiscovered(key)).map(([key, data]) => {
              const count = (stats.totalOresMined && stats.totalOresMined[key]) || 0;
              return `
                <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.06); padding: 4px 6px; border-radius: 6px;">
                  <span style="color: #cbd5e1; font-weight: 600; display: inline-flex; align-items: center; gap: 4px;">${oreIcon(key, 12)} ${data.name}:</span>
                  <strong style="color: ${count > 0 ? '#38bdf8' : '#94a3b8'}; font-weight: 800;">${count}</strong>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    `;
  }

  attachTabListeners(bodyEl) {
    // Belohnung für einzelnen Auftrag einfordern (Tab 1)
    const claimBtns = bodyEl.querySelectorAll('.btn-claim-mission');
    claimBtns.forEach(btn => {
      btn.onclick = () => {
        const mid = btn.getAttribute('data-mid');
        this.missionSystem.claimReward(mid);
        this.render();
      };
    });

    // Einzelnen Auftrag neu auswürfeln / tauschen (Tab 1)
    const rerollBtns = bodyEl.querySelectorAll('.btn-reroll-single-mission');
    rerollBtns.forEach(btn => {
      btn.onclick = () => {
        const mid = btn.getAttribute('data-mid');
        this.missionSystem.rerollMission(mid);
        this.render();
      };
    });

    // Fallbacks für alte Buttons
    const btnClaim = bodyEl.querySelector('#btn-claim-in-modal');
    if (btnClaim) {
      btnClaim.onclick = () => {
        soundFx.playClick();
        this.missionSystem.claimReward();
        this.render();
      };
    }

    const btnReroll = bodyEl.querySelector('#btn-reroll-mission');
    if (btnReroll) {
      btnReroll.onclick = () => {
        soundFx.playClick();
        this.missionSystem.assignNewMission();
        this.render();
      };
    }

    // Auftrag aus Pool annehmen (Fallback)
    const selectBtns = bodyEl.querySelectorAll('.btn-select-mission');
    selectBtns.forEach(btn => {
      btn.onclick = () => {
        const mid = btn.getAttribute('data-mid');
        const targetMission = MISSION_POOL.find(m => m.id === mid);
        if (targetMission) {
          this.missionSystem.setActiveMission(targetMission);
          soundFx.playPurchase();
          this.scene.events.emit('notify', `Neuer Auftrag aktiviert: ${targetMission.title}`);
          this.currentTab = 'missions';
          this.render();
        }
      };
    });

    // Steinforscher Erz-Abgabe (Tab 4)
    const claimGeologistBtns = bodyEl.querySelectorAll('.btn-claim-geologist-modal');
    claimGeologistBtns.forEach(btn => {
      btn.onclick = () => {
        const qid = btn.getAttribute('data-qid');
        const q = GEOLOGIST_QUESTS.find(item => item.id === qid);
        if (!q) return;

        const depotOres = (this.baseSystem?.depot?.ores) || (this.scene?.baseSystem?.depot?.ores) || {};

        // Erze aus Cargo und falls nötig aus Depot entnehmen
        for (const [ore, needed] of Object.entries(q.reqs)) {
          let consumed = 0;
          if (this.player.consumeOre) {
            consumed = this.player.consumeOre(ore, needed);
          }
          const fromDepot = needed - consumed;
          if (fromDepot > 0 && depotOres[ore]) {
            depotOres[ore] = Math.max(0, depotOres[ore] - fromDepot);
          }
        }

        // Belohnung
        this.player.addComponent(q.rewardComp.key, 1);
        this.player.cash += q.rewardCash;
        this.player.addXp(q.rewardXp);
        this.player.stats.researchCompleted = (this.player.stats.researchCompleted || 0) + 1;
        soundFx.playPurchase();

        this.render();
        if (this.baseSystem?.updateOfficeBubble) this.baseSystem.updateOfficeBubble();
        if (this.scene && this.scene.hud) this.scene.hud.update();
        this.scene.events.emit('notify', `Auftrag erfüllt: +1 ${q.rewardComp.name}, +€${q.rewardCash}, +${q.rewardXp} XP erhalten!`);
      };
    });

    // Versicherung kaufen (Tab 5)
    const buyInsuranceBtns = bodyEl.querySelectorAll('.btn-buy-insurance');
    buyInsuranceBtns.forEach(btn => {
      btn.onclick = () => {
        const planId = btn.getAttribute('data-plan-id');
        const plan = INSURANCE_PLANS.find(p => p.id === planId);
        if (!plan) return;

        if (this.player.cash < plan.price) {
          soundFx.playError?.();
          this.scene.events.emit('notify', 'Nicht genug Bargeld für diese Versicherung!');
          return;
        }

        this.player.cash -= plan.price;
        this.player.activeInsurance = {
          layerId: plan.id,
          layerName: plan.layerName,
          maxDepth: plan.maxDepth,
          price: plan.price
        };

        soundFx.playPurchase?.();
        this.scene.events.emit('notify', `Bergungs-Versicherung für ${plan.layerName} aktiviert!`);
        SaveSystem.save(this.scene);
        this.render();
        if (this.scene && this.scene.hud) this.scene.hud.update();
      };
    });
  }
}
