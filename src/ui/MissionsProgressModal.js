import { MISSION_POOL } from '../core/MissionSystem.js';
import { ORE_DATA } from '../core/GridSystem.js';
import { soundFx } from '../core/SoundEffects.js';
import { icon, refreshIcons } from './IconHelper.js';

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

    this.currentTab = 'active'; // 'active' | 'levels' | 'pool' | 'geologist' | 'stats'
  }

  open(initialTab = 'active') {
    this.currentTab = initialTab;
    this.render();
  }

  render() {
    const modalEl = document.getElementById('building-modal');
    const titleEl = document.getElementById('modal-title');
    const bodyEl = document.getElementById('modal-body');
    if (!modalEl || !titleEl || !bodyEl) return;

    titleEl.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px;">
        ${icon('briefcase', '', 18)}
        <span>AUFTRAGS-BÜRO</span>
      </div>
    `;

    // Tab Navigation Bar
    const tabs = [
      { id: 'active', label: 'Aktiver Auftrag', icon: 'crosshair' },
      { id: 'levels', label: 'Ränge', icon: 'award' },
      { id: 'pool', label: 'Aufträge', icon: 'clipboard-list' },
      { id: 'geologist', label: 'Steinforscher', icon: 'microscope' },
      { id: 'stats', label: 'Statistik', icon: 'bar-chart-3' }
    ];

    const tabNavHtml = `
      <div style="display: flex; gap: 6px; overflow-x: auto; padding-bottom: 8px; margin-bottom: 12px; scrollbar-width: none;">
        ${tabs.map(t => {
          const isActive = this.currentTab === t.id;
          return `
            <button class="tab-btn btn-3d-secondary" data-tab="${t.id}" style="
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
            </button>
          `;
        }).join('')}
      </div>
    `;

    // Content je nach Tab
    let contentHtml = '';
    if (this.currentTab === 'active') {
      contentHtml = this.renderActiveTab();
    } else if (this.currentTab === 'levels') {
      contentHtml = this.renderLevelsTab();
    } else if (this.currentTab === 'pool') {
      contentHtml = this.renderPoolTab();
    } else if (this.currentTab === 'geologist') {
      contentHtml = this.renderGeologistTab();
    } else if (this.currentTab === 'stats') {
      contentHtml = this.renderStatsTab();
    }

    bodyEl.innerHTML = `
      <div style="display: flex; flex-direction: column;">
        ${tabNavHtml}
        <div id="modal-tab-content">
          ${contentHtml}
        </div>
      </div>
    `;

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
  // TAB 1: AKTIVER AUFTRAG
  // =========================================================================
  renderActiveTab() {
    const mission = this.missionSystem.activeMission;
    if (!mission) {
      return `
        <div style="padding: 24px; text-align: center; color: #94a3b8;">
          <p>Momentan ist kein Auftrag aktiv.</p>
          <button id="btn-select-next-mission" class="btn-buy" style="margin-top: 12px;">Auftrag auswählen</button>
        </div>
      `;
    }

    const isDone = this.missionSystem.isCompleted;
    const maxProg = mission.targetCount || mission.targetDepth || 1;
    const curProg = Math.min(maxProg, this.missionSystem.progress);
    const pct = Math.round((curProg / maxProg) * 100);

    return `
      <div style="display: flex; flex-direction: column; gap: 14px;">
        <!-- Card: Aktiver Auftrag Header -->
        <div style="
          background: rgba(15, 23, 42, 0.75);
          border: 1.5px solid ${isDone ? '#10b981' : 'rgba(56, 189, 248, 0.35)'};
          border-radius: 12px;
          padding: 16px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        ">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
            <div>
              <span style="
                font-size: 10px;
                font-weight: 800;
                color: ${isDone ? '#10b981' : '#38bdf8'};
                text-transform: uppercase;
                letter-spacing: 0.8px;
                background: rgba(255,255,255,0.06);
                padding: 2px 8px;
                border-radius: 4px;
              ">
                ${isDone ? 'AUFTRAG ERFÜLLT' : 'LAUFENDER BERGBAU-VERTRAG'}
              </span>
              <h3 style="color: #f8fafc; font-size: 16px; font-weight: 700; margin-top: 6px;">${mission.title}</h3>
            </div>
            <div style="display: flex; gap: 8px; align-items: center;">
              <span style="background: rgba(251, 191, 36, 0.15); border: 1px solid rgba(251, 191, 36, 0.3); color: #fbbf24; font-weight: 800; font-size: 12px; padding: 4px 10px; border-radius: 6px; display: inline-flex; align-items: center; gap: 4px;">
                ${icon('coins', '', 13)} +€${mission.rewardCash}
              </span>
              <span style="background: rgba(168, 85, 247, 0.15); border: 1px solid rgba(168, 85, 247, 0.3); color: #c084fc; font-weight: 800; font-size: 12px; padding: 4px 10px; border-radius: 6px; display: inline-flex; align-items: center; gap: 4px;">
                ${icon('award', '', 13)} +${mission.rewardXp} XP
              </span>
            </div>
          </div>

          <p style="font-size: 12.5px; line-height: 1.5; color: #94a3b8; margin-bottom: 14px;">
            ${mission.desc}
          </p>

          <!-- Fortschrittsbalken -->
          <div style="margin-bottom: 12px;">
            <div style="display: flex; justify-content: space-between; font-size: 11.5px; font-weight: 700; margin-bottom: 5px;">
              <span style="color: #cbd5e1; display: inline-flex; align-items: center; gap: 5px;">
                ${icon('target', '', 13)}
                ${mission.type === 'COLLECT_ORE' ? `Gefördert: ${curProg} von ${maxProg} ${ORE_DATA[mission.targetOre]?.name || 'Erzen'}` : `Ziel-Tiefe: ${curProg} von ${maxProg} Metern`}
              </span>
              <span style="color: ${isDone ? '#10b981' : '#38bdf8'};">${pct}%</span>
            </div>
            <div style="width: 100%; height: 8px; background: rgba(15, 23, 42, 0.9); border-radius: 99px; overflow: hidden; border: 1px solid rgba(255,255,255,0.06);">
              <div style="
                width: ${pct}%;
                height: 100%;
                background: ${isDone ? 'linear-gradient(90deg, #10b981, #34d399)' : 'linear-gradient(90deg, #2563eb, #38bdf8)'};
                border-radius: 99px;
                transition: width 0.3s ease;
              "></div>
            </div>
          </div>

          <!-- Aktions-Buttons -->
          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 14px; gap: 10px;">
            <button id="btn-reroll-mission" class="btn-3d-secondary" style="height: 34px; box-sizing: border-box; font-size: 11.5px; padding: 0 14px; display: inline-flex; align-items: center; justify-content: center; gap: 6px; border-radius: 8px;">
              ${icon('refresh-cw', '', 13)} Anderer Auftrag
            </button>
            <button id="btn-claim-in-modal" class="btn-buy" style="
              height: 34px;
              box-sizing: border-box;
              padding: 0 16px;
              font-size: 12px;
              font-weight: 800;
              display: inline-flex;
              align-items: center;
              justify-content: center;
              gap: 6px;
              border-radius: 8px;
              ${isDone ? 'background: linear-gradient(180deg, #10b981 0%, #059669 100%); border-color: #34d399; border-bottom: 3px solid #047857; color: #ffffff;' : ''}
            " ${isDone ? '' : 'disabled'}>
              ${icon('check-circle', '', 14)}
              <span>${isDone ? `BELOHNUNG EINZIEHEN (+€${mission.rewardCash})` : 'IN BEARBEITUNG'}</span>
            </button>
          </div>
        </div>

        <!-- Schnell-Info Schacht & Rohstoffe -->
        <div style="
          background: rgba(15, 23, 42, 0.5);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 10px;
          padding: 12px 14px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 12px;
        ">
          <span style="color: #94a3b8;">Aktuelle Schachttiefe: <strong style="color: #38bdf8;">${this.player.depthMeters}m</strong></span>
          <span style="color: #94a3b8;">Frachtraum: <strong style="color: #f8fafc;">${this.player.cargoCount}/${this.player.maxCargo}</strong></span>
          <button id="btn-go-pool" class="btn-action" style="padding: 5px 10px; font-size: 11px;">
            ${icon('list', '', 12)} Alle Aufträge ansehen
          </button>
        </div>
      </div>
    `;
  }

  // =========================================================================
  // TAB 2: LEVEL & RÄNGE
  // =========================================================================
  renderLevelsTab() {
    const p = this.player;
    const curLevel = p.level || 1;
    const curXp = p.xp || 0;
    const neededXp = p.xpNeeded || 350;
    const pct = Math.min(100, Math.round((curXp / neededXp) * 100));

    const ranks = [
      {
        level: 1,
        title: 'Novize',
        desc: 'Humus- und Erdschicht (0-50m). Abbau von Kohle und Kupfer.',
        perks: 'Zugang zu Basis-Upgrades und Erzbörse'
      },
      {
        level: 2,
        title: 'Schürfer',
        desc: 'Schiefer- und Felsschicht (50-180m). Abbau von Eisenerz und Zinn.',
        perks: 'Hydraulik-Zylinder und Titan-Legierung montierbar'
      },
      {
        level: 3,
        title: 'Tiefen-Geologe',
        desc: 'Dichte Granitschicht (180-480m). Silber-, Gold- und Smaragd-Adern.',
        perks: 'Kristall-Fokuslinsen und Plasmabrenner freigeschaltet'
      },
      {
        level: 4,
        title: 'Kern-Ingenieur',
        desc: 'Obsidian- und Basaltzone (480-950m). Saphir, Rubin und Diamant-Kristalle.',
        perks: 'Quanten-Steuerkerne und Teleporter-Warp aktivierbar'
      },
      {
        level: 5,
        title: 'Meister der Tiefe',
        desc: 'Urgestein und Tiefenkern (950-1.600m+). Titan, Platin, Uran und Dunkelmaterie.',
        perks: 'Antimaterie-Bohrer und Maximale Frachtkapazität'
      }
    ];

    return `
      <div style="display: flex; flex-direction: column; gap: 14px;">
        <!-- Aktueller Level Status -->
        <div style="
          background: rgba(15, 23, 42, 0.75);
          border: 1px solid rgba(168, 85, 247, 0.35);
          border-radius: 12px;
          padding: 14px 16px;
        ">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="background: rgba(168, 85, 247, 0.2); color: #c084fc; font-size: 13px; font-weight: 800; padding: 4px 10px; border-radius: 6px; border: 1px solid rgba(168, 85, 247, 0.4); display: inline-flex; align-items: center; gap: 5px;">
                ${icon('award', '', 14)} STUFE ${curLevel}
              </span>
              <span style="font-weight: 700; color: #f8fafc; font-size: 14px;">${p.rankTitle}</span>
            </div>
            <span style="font-size: 12px; color: #c084fc; font-weight: 700;">${curXp} / ${neededXp} XP (${pct}%)</span>
          </div>

          <div style="width: 100%; height: 8px; background: rgba(15, 23, 42, 0.9); border-radius: 99px; overflow: hidden; border: 1px solid rgba(255,255,255,0.06); margin-top: 8px;">
            <div style="width: ${pct}%; height: 100%; background: linear-gradient(90deg, #9333ea, #c084fc); border-radius: 99px; transition: width 0.3s ease;"></div>
          </div>
          <p style="font-size: 11px; color: #94a3b8; margin-top: 8px;">
            Erhalte XP durch das Bohren von Kacheln (+1 XP), das Fördern seltener Erze (+15 bis +750 XP) und das Abschließen von Bergbau-Aufträgen.
          </p>
        </div>

        <!-- Rang-Stufen Roadmap -->
        <div style="display: flex; flex-direction: column; gap: 8px; max-height: 280px; overflow-y: auto; padding-right: 4px;">
          ${ranks.map(r => {
            const isCurrent = curLevel === r.level;
            const isUnlocked = curLevel >= r.level;
            return `
              <div style="
                background: ${isCurrent ? 'rgba(56, 189, 248, 0.12)' : 'rgba(15, 23, 42, 0.65)'};
                border: 1px solid ${isCurrent ? '#38bdf8' : isUnlocked ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255, 255, 255, 0.06)'};
                border-radius: 10px;
                padding: 10px 14px;
                display: flex;
                flex-direction: column;
                gap: 4px;
              ">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="font-weight: 800; font-size: 11px; color: ${isUnlocked ? '#10b981' : '#64748b'};">
                      LVL ${r.level}
                    </span>
                    <strong style="color: ${isCurrent ? '#38bdf8' : isUnlocked ? '#f8fafc' : '#94a3b8'}; font-size: 13px;">
                      ${r.title}
                    </strong>
                  </div>
                  <span style="font-size: 10.5px; font-weight: 700; color: ${isCurrent ? '#38bdf8' : isUnlocked ? '#10b981' : '#64748b'};">
                    ${isCurrent ? 'AKTUELL' : isUnlocked ? 'FREIGESCHALTET' : 'GESPERRT'}
                  </span>
                </div>
                <p style="font-size: 11.5px; color: #94a3b8;">${r.desc}</p>
                <div style="font-size: 11px; color: #38bdf8; display: inline-flex; align-items: center; gap: 4px;">
                  ${icon('sparkles', '', 11)} ${r.perks}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  // =========================================================================
  // TAB 3: AUFTRÄGE-POOL
  // =========================================================================
  renderPoolTab() {
    const curLevel = this.player.level || 1;
    const activeId = this.missionSystem.activeMission ? this.missionSystem.activeMission.id : null;

    return `
      <div style="display: flex; flex-direction: column; gap: 10px;">
        <p style="font-size: 12px; color: #94a3b8;">
          Wähle einen Bergbau-Auftrag aus. Aufträge mit höherer Stufe erfordern tiefere Vorstöße, bieten aber massive Geld- und XP-Prämien.
        </p>
        <div style="display: flex; flex-direction: column; gap: 8px; max-height: 320px; overflow-y: auto; padding-right: 4px;">
          ${MISSION_POOL.map(m => {
            const isCurrent = activeId === m.id;
            const isLocked = curLevel < m.minLevel;

            return `
              <div style="
                background: ${isCurrent ? 'rgba(56, 189, 248, 0.12)' : 'rgba(15, 23, 42, 0.65)'};
                border: 1px solid ${isCurrent ? '#38bdf8' : isLocked ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.08)'};
                border-radius: 10px;
                padding: 10px 14px;
                opacity: ${isLocked ? '0.6' : '1'};
              ">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 4px;">
                  <div>
                    <strong style="color: #f8fafc; font-size: 13px;">${m.title}</strong>
                    <div style="font-size: 11px; color: #94a3b8; margin-top: 2px;">${m.desc}</div>
                  </div>
                  <div style="display: flex; gap: 6px; align-items: center;">
                    <span style="color: #fbbf24; font-weight: 700; font-size: 11.5px; display: inline-flex; align-items: center; gap: 3px;">
                      ${icon('coins', '', 12)} +€${m.rewardCash}
                    </span>
                    <span style="color: #c084fc; font-weight: 700; font-size: 11.5px; display: inline-flex; align-items: center; gap: 3px;">
                      ${icon('award', '', 12)} +${m.rewardXp} XP
                    </span>
                  </div>
                </div>

                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 6px; padding-top: 6px;">
                  <span style="font-size: 11px; color: #94a3b8;">
                    ${isLocked ? `<span style="color: #ef4444; font-weight: 700;">Benötigt Level ${m.minLevel}</span>` : `Ab Level ${m.minLevel}`}
                  </span>
                  <div>
                    ${isCurrent ? `
                      <span style="height: 32px; font-size: 11.5px; color: #38bdf8; font-weight: 700; display: inline-flex; align-items: center; gap: 4px; padding: 0 8px;">
                        ${icon('check', '', 14)} Aktiv
                      </span>
                    ` : isLocked ? `
                      <button class="btn-3d-secondary" disabled style="height: 32px; box-sizing: border-box; padding: 0 12px; font-size: 11px;">Gesperrt</button>
                    ` : `
                      <button class="btn-select-mission btn-buy" data-mid="${m.id}" style="height: 32px; box-sizing: border-box; padding: 0 14px; font-size: 11.5px; font-weight: 800;">
                        Auftrag annehmen
                      </button>
                    `}
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  // =========================================================================
  // TAB 4: STEINFORSCHER (GEOLOGE)
  // =========================================================================
  renderGeologistTab() {
    const p = this.player;
    const comps = p.components || {};

    // Bauteil-Inventar Header
    const compInventoryHtml = `
      <div style="
        background: rgba(15, 23, 42, 0.8);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 10px;
        padding: 10px 14px;
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 8px;
        margin-bottom: 12px;
      ">
        <div style="display: flex; align-items: center; gap: 6px; font-size: 12px;">
          ${icon('cog', '', 14)}
          <span style="color: #94a3b8;">Hydraulik-Zylinder:</span>
          <strong style="color: #38bdf8;">${comps.hydraulic_part || 0}</strong>
        </div>
        <div style="display: flex; align-items: center; gap: 6px; font-size: 12px;">
          ${icon('shield-check', '', 14)}
          <span style="color: #94a3b8;">Titan-Legierung:</span>
          <strong style="color: #38bdf8;">${comps.titan_alloy || 0}</strong>
        </div>
        <div style="display: flex; align-items: center; gap: 6px; font-size: 12px;">
          ${icon('disc', '', 14)}
          <span style="color: #94a3b8;">Kristall-Linse:</span>
          <strong style="color: #38bdf8;">${comps.laser_lens || 0}</strong>
        </div>
        <div style="display: flex; align-items: center; gap: 6px; font-size: 12px;">
          ${icon('atom', '', 14)}
          <span style="color: #94a3b8;">Quanten-Kern:</span>
          <strong style="color: #38bdf8;">${comps.quantum_chip || 0}</strong>
        </div>
      </div>
    `;

    // Quests (abgestimmt auf 0-1600m Tiefe)
    const quests = [
      {
        id: 'geologist_coal_copper',
        title: 'Geologische Probensammlung I',
        depthHint: 'Tiefe 0-50m (Erdschicht)',
        reqs: { coal: 5, copper: 3 },
        rewardComp: { key: 'hydraulic_part', name: 'Hydraulik-Zylinder', iconName: 'cog' },
        rewardCash: 160,
        rewardXp: 120
      },
      {
        id: 'geologist_iron_tin',
        title: 'Sedimentproben II',
        depthHint: 'Tiefe 30-150m (Schiefer-Schicht)',
        reqs: { iron: 4, tin: 3 },
        rewardComp: { key: 'titan_alloy', name: 'Titan-Legierung', iconName: 'shield-check' },
        rewardCash: 350,
        rewardXp: 280
      },
      {
        id: 'geologist_silver_gold',
        title: 'Kristall-Reflektionsanalyse III',
        depthHint: 'Tiefe 130-350m (Granit-Schicht)',
        reqs: { silver: 3, gold: 2 },
        rewardComp: { key: 'laser_lens', name: 'Kristall-Fokuslinse', iconName: 'disc' },
        rewardCash: 800,
        rewardXp: 580
      },
      {
        id: 'geologist_gem_cluster',
        title: 'Quanten-Kernresonanz IV',
        depthHint: 'Tiefe 340-800m (Obsidian-Zone)',
        reqs: { emerald: 2, ruby: 2 },
        rewardComp: { key: 'quantum_chip', name: 'Quanten-Steuerkern', iconName: 'atom' },
        rewardCash: 1900,
        rewardXp: 1150
      },
      {
        id: 'geologist_diamond_core',
        title: 'Tiefenanalyse V: Urgestein',
        depthHint: 'Tiefe 850m+ (Urgestein-Kern)',
        reqs: { diamond: 1, sapphire: 2 },
        rewardComp: { key: 'quantum_chip', name: 'Quanten-Steuerkern', iconName: 'atom' },
        rewardCash: 3400,
        rewardXp: 1900
      }
    ];

    const cargoCounts = {};
    p.cargo.forEach(ore => {
      cargoCounts[ore] = (cargoCounts[ore] || 0) + 1;
    });

    return `
      <div style="display: flex; flex-direction: column; gap: 10px;">
        <p style="font-size: 12px; color: #94a3b8;">
          Der Steineforscher analysiert Erzproben für geologische Studien. Gib gesuchte Erze ab, um seltene High-Tech-Bauteile für deine Tech-Upgrades zu erhalten!
        </p>

        ${compInventoryHtml}

        <div style="display: flex; flex-direction: column; gap: 8px; max-height: 250px; overflow-y: auto; padding-right: 4px;">
          ${quests.map(q => {
            let canFulfill = true;
            const reqsText = [];
            for (const [ore, needed] of Object.entries(q.reqs)) {
              const have = cargoCounts[ore] || 0;
              const oreName = ORE_DATA[ore]?.name || ore;
              if (have < needed) canFulfill = false;
              reqsText.push(`<span style="color: ${have >= needed ? '#10b981' : '#f87171'}; font-weight: 600;">${oreName}: ${have}/${needed}</span>`);
            }

            return `
              <div style="
                background: #131b2c;
                border: 1px solid ${canFulfill ? '#10b981' : 'rgba(255,255,255,0.08)'};
                border-radius: 8px;
                padding: 10px 12px;
              ">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                  <strong style="color: #f8fafc; font-size: 12.5px;">${q.title}</strong>
                  <span style="font-size: 11px; color: #94a3b8;">${q.depthHint}</span>
                </div>
                <div style="font-size: 11.5px; margin-bottom: 6px;">
                  Benötigt: ${reqsText.join(', ')}
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <div style="display: flex; align-items: center; gap: 8px; font-size: 11.5px;">
                    <span style="color: #38bdf8; font-weight: bold; display: inline-flex; align-items: center; gap: 4px;">
                      ${icon(q.rewardComp.iconName, '', 13)} +1 ${q.rewardComp.name}
                    </span>
                    <span style="color: #fbbf24; font-weight: bold;">+€${q.rewardCash}</span>
                    <span style="color: #c084fc; font-weight: bold;">+${q.rewardXp} XP</span>
                  </div>
                  <button class="btn-claim-geologist-modal btn-buy" data-qid="${q.id}" ${canFulfill ? '' : 'disabled'} style="height: 32px; box-sizing: border-box; padding: 0 14px; font-size: 11.5px; font-weight: 700; display: inline-flex; align-items: center; justify-content: center;">
                    ${canFulfill ? 'Erze abgeben' : 'Erze fehlen'}
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
  // TAB 5: STATISTIK ÜBER GAMEFORTSCHRITT
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

    // Zähle gebaute Gebäude
    const bs = this.baseSystem;
    const builtCount = bs ? bs.purchasableBuildings.filter(b => b.isBuilt).length : 0;
    const totalBuildings = bs ? bs.purchasableBuildings.length : 3;

    return `
      <div style="display: flex; flex-direction: column; gap: 12px; max-height: 360px; overflow-y: auto; padding-right: 4px;">
        <!-- Haupt-Kennzahlen Grid -->
        <div style="
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
        ">
          <div style="background: rgba(15, 23, 42, 0.7); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 10px; padding: 10px 12px;">
            <span style="font-size: 11px; color: #94a3b8; display: flex; align-items: center; gap: 4px;">
              ${icon('arrow-down', '', 12)} Maximale Schachttiefe
            </span>
            <strong style="color: #38bdf8; font-size: 18px; font-weight: 800; display: block; margin-top: 2px;">
              ${p.highestDepthReached || p.depthMeters || 0} m
            </strong>
          </div>

          <div style="background: rgba(15, 23, 42, 0.7); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 10px; padding: 10px 12px;">
            <span style="font-size: 11px; color: #94a3b8; display: flex; align-items: center; gap: 4px;">
              ${icon('pickaxe', '', 12)} Kacheln abgebaut
            </span>
            <strong style="color: #f8fafc; font-size: 18px; font-weight: 800; display: block; margin-top: 2px;">
              ${stats.totalTilesMined || 0}
            </strong>
          </div>

          <div style="background: rgba(15, 23, 42, 0.7); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 10px; padding: 10px 12px;">
            <span style="font-size: 11px; color: #94a3b8; display: flex; align-items: center; gap: 4px;">
              ${icon('coins', '', 12)} Aktuelles Vermögen
            </span>
            <strong style="color: #fbbf24; font-size: 18px; font-weight: 800; display: block; margin-top: 2px;">
              €${p.cash}
            </strong>
          </div>

          <div style="background: rgba(15, 23, 42, 0.7); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 10px; padding: 10px 12px;">
            <span style="font-size: 11px; color: #94a3b8; display: flex; align-items: center; gap: 4px;">
              ${icon('building', '', 12)} Basis-Infrastruktur
            </span>
            <strong style="color: #10b981; font-size: 18px; font-weight: 800; display: block; margin-top: 2px;">
              ${builtCount} / ${totalBuildings} Gebäude
            </strong>
          </div>
        </div>

        <!-- Fahrzeug-Spezifikationen & Tech-Stufen -->
        <div style="background: rgba(15, 23, 42, 0.65); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 10px; padding: 12px;">
          <div style="font-size: 12px; font-weight: 700; color: #38bdf8; margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
            ${icon('wrench', '', 13)} Installierte Tech-Komponenten
          </div>
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px; font-size: 11.5px;">
            <span style="color: #94a3b8;">Treibstoff-Tank: <strong style="color: #f8fafc;">Stufe ${p.tankTier || 1} (${p.maxFuel}L)</strong></span>
            <span style="color: #94a3b8;">Bohrkopf: <strong style="color: #f8fafc;">Stufe ${p.drillTier || 1} (${p.drillPower} DPS)</strong></span>
            <span style="color: #94a3b8;">Frachtraum: <strong style="color: #f8fafc;">Stufe ${p.cargoTier || 1} (${p.maxCargo} Erze)</strong></span>
            <span style="color: #94a3b8;">Rumpfpanzerung: <strong style="color: #f8fafc;">Stufe ${p.hullTier || 1} (${p.maxHull} HP)</strong></span>
            <span style="color: #94a3b8;">Sensor-Radar: <strong style="color: #f8fafc;">Stufe ${p.sensorTier || 1} (${p.sensorRadius} Kacheln)</strong></span>
            <span style="color: #94a3b8;">Missionsabgaben: <strong style="color: #f8fafc;">${stats.missionsCompleted || 0} erfüllt</strong></span>
          </div>
        </div>

        <!-- Geförderte Erze Statistik -->
        <div style="background: rgba(15, 23, 42, 0.65); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 10px; padding: 12px;">
          <div style="font-size: 12px; font-weight: 700; color: #fbbf24; margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
            ${icon('gem', '', 13)} Geförderte Bodenschätze (Insgesamt)
          </div>
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; font-size: 11px;">
            ${Object.entries(ORE_DATA).map(([key, data]) => {
              const count = (stats.totalOresMined && stats.totalOresMined[key]) || 0;
              return `
                <div style="display: flex; justify-content: space-between; background: rgba(0,0,0,0.25); padding: 4px 6px; border-radius: 4px;">
                  <span style="color: #94a3b8;">${data.name}:</span>
                  <strong style="color: ${count > 0 ? '#38bdf8' : '#64748b'};">${count}</strong>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    `;
  }

  attachTabListeners(bodyEl) {
    // Belohnung einfordern (Tab 1)
    const btnClaim = bodyEl.querySelector('#btn-claim-in-modal');
    if (btnClaim) {
      btnClaim.onclick = () => {
        this.missionSystem.claimReward();
        this.render();
      };
    }

    // Neuer Auftrag / Reroll (Tab 1)
    const btnReroll = bodyEl.querySelector('#btn-reroll-mission');
    if (btnReroll) {
      btnReroll.onclick = () => {
        this.missionSystem.assignNewMission();
        this.render();
      };
    }

    // Weiterleitung zu Auftrags-Pool (Tab 1)
    const btnGoPool = bodyEl.querySelector('#btn-go-pool');
    if (btnGoPool) {
      btnGoPool.onclick = () => {
        this.currentTab = 'pool';
        this.render();
      };
    }

    // Auftrag aus Pool annehmen (Tab 3)
    const selectBtns = bodyEl.querySelectorAll('.btn-select-mission');
    selectBtns.forEach(btn => {
      btn.onclick = () => {
        const mid = btn.getAttribute('data-mid');
        const targetMission = MISSION_POOL.find(m => m.id === mid);
        if (targetMission) {
          this.missionSystem.activeMission = { ...targetMission };
          this.missionSystem.progress = 0;
          this.missionSystem.isCompleted = false;
          soundFx.playPurchase();
          this.scene.events.emit('mission_updated', this.missionSystem.getMissionStatus());
          this.scene.events.emit('notify', `Neuer Auftrag aktiviert: ${targetMission.title}`);
          this.currentTab = 'active';
          this.render();
        }
      };
    });

    // Steinforscher Erz-Abgabe (Tab 4)
    const claimGeologistBtns = bodyEl.querySelectorAll('.btn-claim-geologist-modal');
    claimGeologistBtns.forEach(btn => {
      btn.onclick = () => {
        const qid = btn.getAttribute('data-qid');
        const quests = [
          { id: 'geologist_coal_copper', reqs: { coal: 5, copper: 3 }, rewardKey: 'hydraulic_part', name: 'Hydraulik-Zylinder', cash: 160, xp: 120 },
          { id: 'geologist_iron_tin', reqs: { iron: 4, tin: 3 }, rewardKey: 'titan_alloy', name: 'Titan-Legierung', cash: 350, xp: 280 },
          { id: 'geologist_silver_gold', reqs: { silver: 3, gold: 2 }, rewardKey: 'laser_lens', name: 'Kristall-Fokuslinse', cash: 800, xp: 580 },
          { id: 'geologist_gem_cluster', reqs: { emerald: 2, ruby: 2 }, rewardKey: 'quantum_chip', name: 'Quanten-Steuerkern', cash: 1900, xp: 1150 },
          { id: 'geologist_diamond_core', reqs: { diamond: 1, sapphire: 2 }, rewardKey: 'quantum_chip', name: 'Quanten-Steuerkern', cash: 3400, xp: 1900 }
        ];
        const q = quests.find(item => item.id === qid);
        if (!q) return;

        // Erze aus Cargo entfernen
        for (const [ore, needed] of Object.entries(q.reqs)) {
          this.player.sellSpecificOre(ore, needed);
        }

        // Belohnung
        this.player.addComponent(q.rewardKey, 1);
        this.player.cash += q.cash;
        this.player.addXp(q.xp);
        this.player.stats.researchCompleted = (this.player.stats.researchCompleted || 0) + 1;
        soundFx.playPurchase();

        this.scene.events.emit('notify', `Steinforscher: +1 ${q.name}, +€${q.cash}, +${q.xp} XP erhalten!`);
        this.render();
      };
    });
  }
}
