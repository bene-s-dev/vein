import { ORE_DATA } from '../core/GridSystem.js';
import { soundFx } from '../core/SoundEffects.js';
import { icon, refreshIcons, oreIcon, itemDisplayIcon, getRefinedOreName, drillerVehicleIcon } from './IconHelper.js';
import { notifyModalClosed, closeActiveModal } from '../core/BaseSystem.js';
import { showOreInfoModal } from './OreInfoModal.js';

/**
 * DrillerMenuModal.js
 * Minimalistisches Fahrzeugmenü "Bohrer".
 * Oben: Drei Balken mit Prozentanzeige für Tank, Hülle und Fracht.
 * Darunter: Grid-Style-Inventar mit Steinen und Anzahl.
 */
export class DrillerMenuModal {
  constructor(scene, player, baseSystem) {
    this.scene = scene;
    this.player = player;
    this.baseSystem = baseSystem;
  }

  open(_initialTab = 'cargo') {
    // Laufende Motorsounds beim Öffnen des Menüs stoppen
    soundFx.stopAllLoops?.();

    if (this.scene) {
      this.scene.isPaused = true;
    }

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

    // Titel: "BOHRER" mit dem originalen Spiel-Fahrzeug-Icon
    titleEl.innerHTML = `
      <div style="display: flex; align-items: center; gap: 10px; color: #38bdf8;">
        ${drillerVehicleIcon(26)}
        <span style="font-weight: 800; letter-spacing: 0.5px;">BOHRER</span>
      </div>
    `;

    // 1. Oben: Drei Balken und Prozentanzeige für Tank, Hülle und Fracht
    const fuel = Math.max(0, this.player.fuel || 0);
    const maxFuel = this.player.maxFuel || 60;
    const fuelPct = Math.max(0, Math.min(100, Math.round((fuel / maxFuel) * 100)));

    const hull = Math.max(0, this.player.hull || 0);
    const maxHull = this.player.maxHull || 100;
    const hullPct = Math.max(0, Math.min(100, Math.round((hull / maxHull) * 100)));

    const cargo = this.player.cargo || [];
    const cargoCount = cargo.length;
    const maxCargo = this.player.maxCargo || 10;
    const cargoPct = Math.max(0, Math.min(100, Math.round((cargoCount / maxCargo) * 100)));

    const statusBarsHtml = `
      <div style="
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        gap: 8px;
        margin-bottom: 16px;
      ">
        <!-- Tank -->
        <div style="
          background: rgba(30, 41, 59, 0.75);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 10px;
          padding: 8px 10px;
          display: flex;
          flex-direction: column;
          gap: 5px;
        ">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 11px; font-weight: 700; color: #cbd5e1; display: inline-flex; align-items: center; gap: 4px;">
              ${icon('fuel', '', 12)} Tank
            </span>
            <span id="driller-menu-fuel-pct" style="font-size: 13px; font-weight: 800; color: #f59e0b; width: 44px; min-width: 44px; text-align: right; font-variant-numeric: tabular-nums; display: inline-block;">
              ${fuelPct}%
            </span>
          </div>
          <div style="height: 6px; background: rgba(0, 0, 0, 0.5); border-radius: 99px; overflow: hidden;">
            <div id="driller-menu-fuel-fill" style="width: ${fuelPct}%; height: 100%; background: #f59e0b; border-radius: 99px; transition: width 0.2s ease;"></div>
          </div>
          <div id="driller-menu-fuel-text" style="font-size: 10px; color: #cbd5e1; text-align: right; font-variant-numeric: tabular-nums; font-weight: 600;">
            ${Math.round(fuel)} / ${maxFuel} L
          </div>
        </div>

        <!-- Hülle -->
        <div style="
          background: rgba(30, 41, 59, 0.75);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 10px;
          padding: 8px 10px;
          display: flex;
          flex-direction: column;
          gap: 5px;
        ">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 11px; font-weight: 700; color: #cbd5e1; display: inline-flex; align-items: center; gap: 4px;">
              ${icon('shield-cog', '', 12)} Hülle
            </span>
            <span id="driller-menu-hull-pct" style="font-size: 13px; font-weight: 800; color: ${hullPct <= 25 ? '#ef4444' : hullPct <= 50 ? '#f59e0b' : '#10b981'}; width: 44px; min-width: 44px; text-align: right; font-variant-numeric: tabular-nums; display: inline-block;">
              ${hullPct}%
            </span>
          </div>
          <div style="height: 6px; background: rgba(0, 0, 0, 0.5); border-radius: 99px; overflow: hidden;">
            <div id="driller-menu-hull-fill" style="width: ${hullPct}%; height: 100%; background: ${hullPct <= 25 ? '#ef4444' : hullPct <= 50 ? '#f59e0b' : '#10b981'}; border-radius: 99px; transition: width 0.2s ease;"></div>
          </div>
          <div id="driller-menu-hull-text" style="font-size: 10px; color: #cbd5e1; text-align: right; font-variant-numeric: tabular-nums; font-weight: 600;">
            ${Math.round(hull)} / ${maxHull} HP
          </div>
        </div>

        <!-- Fracht -->
        <div style="
          background: rgba(30, 41, 59, 0.75);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 10px;
          padding: 8px 10px;
          display: flex;
          flex-direction: column;
          gap: 5px;
        ">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 11px; font-weight: 700; color: #cbd5e1; display: inline-flex; align-items: center; gap: 4px;">
              ${icon('container', '', 12)} Fracht
            </span>
            <span style="font-size: 13px; font-weight: 800; color: ${cargoPct >= 100 ? '#ef4444' : '#38bdf8'}; width: 44px; min-width: 44px; text-align: right; font-variant-numeric: tabular-nums; display: inline-block;">
              ${cargoCount}
            </span>
          </div>
          <div style="height: 6px; background: rgba(0, 0, 0, 0.5); border-radius: 99px; overflow: hidden;">
            <div style="width: ${cargoPct}%; height: 100%; background: ${cargoPct >= 100 ? '#ef4444' : '#38bdf8'}; border-radius: 99px; transition: width 0.2s ease;"></div>
          </div>
          <div style="font-size: 10px; color: #cbd5e1; text-align: right; font-variant-numeric: tabular-nums; font-weight: 600;">
            ${cargoCount} / ${maxCargo}
          </div>
        </div>
      </div>
    `;

    // 2. Ausrüstung & Notfall: Treibstoff und Reparatur
    const fuelCanisters = (this.player.gadgets && this.player.gadgets.fuel_canister) || 0;
    const repairKits = (this.player.gadgets && this.player.gadgets.repair_kit) || 0;
    const canRefuel = fuelCanisters > 0 && fuel < maxFuel;
    const canRepair = repairKits > 0 && hull < maxHull;

    const emergencyActionsHtml = `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 2px;">
        <!-- Treibstoffkanister -->
        <div style="
          background: rgba(15, 23, 42, 0.75);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 10px;
          padding: 8px 10px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        ">
          <div style="display: flex; align-items: center; gap: 8px; min-width: 0;">
            <div style="width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; background: rgba(245, 158, 11, 0.15); border-radius: 8px; color: #f59e0b; flex-shrink: 0;">
              ${icon('fuel', '', 18)}
            </div>
            <div style="min-width: 0;">
              <div style="display: flex; align-items: center; gap: 5px;">
                <span style="font-size: 11.5px; font-weight: 700; color: #f8fafc; white-space: nowrap;">Treibstoff</span>
                <span style="font-size: 9px; font-weight: 800; padding: 1px 4px; border-radius: 4px; background: rgba(245, 158, 11, 0.2); color: #f59e0b;">+20L</span>
              </div>
              <div style="font-size: 10px; color: #94a3b8; margin-top: 1px;">
                Vorrat: <strong style="color: ${fuelCanisters > 0 ? '#38bdf8' : '#ef4444'};">${fuelCanisters}</strong>
              </div>
            </div>
          </div>
          <button id="btn-driller-refuel" class="btn-buy" style="
            height: 28px;
            padding: 0 10px;
            font-size: 10.5px;
            font-weight: 800;
            background: ${canRefuel ? 'linear-gradient(135deg, #f59e0b, #d97706)' : '#334155'};
            color: ${canRefuel ? '#ffffff' : '#94a3b8'};
            border: none;
            border-radius: 6px;
            white-space: nowrap;
            display: inline-flex;
            align-items: center;
            gap: 4px;
            cursor: ${canRefuel ? 'pointer' : 'default'};
          " ${canRefuel ? '' : 'disabled'}>
            Tanken
          </button>
        </div>

        <!-- Reparatur-Kit -->
        <div style="
          background: rgba(15, 23, 42, 0.75);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 10px;
          padding: 8px 10px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        ">
          <div style="display: flex; align-items: center; gap: 8px; min-width: 0;">
            <div style="width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; background: rgba(16, 185, 129, 0.15); border-radius: 8px; color: #10b981; flex-shrink: 0;">
              ${icon('wrench', '', 18)}
            </div>
            <div style="min-width: 0;">
              <div style="display: flex; align-items: center; gap: 5px;">
                <span style="font-size: 11.5px; font-weight: 700; color: #f8fafc; white-space: nowrap;">Reparatur</span>
                <span style="font-size: 9px; font-weight: 800; padding: 1px 4px; border-radius: 4px; background: rgba(16, 185, 129, 0.2); color: #10b981;">+40 HP</span>
              </div>
              <div style="font-size: 10px; color: #94a3b8; margin-top: 1px;">
                Vorrat: <strong style="color: ${repairKits > 0 ? '#38bdf8' : '#ef4444'};">${repairKits}</strong>
              </div>
            </div>
          </div>
          <button id="btn-driller-repair" class="btn-buy" style="
            height: 28px;
            padding: 0 10px;
            font-size: 10.5px;
            font-weight: 800;
            background: ${canRepair ? 'linear-gradient(135deg, #10b981, #059669)' : '#334155'};
            color: ${canRepair ? '#ffffff' : '#94a3b8'};
            border: none;
            border-radius: 6px;
            white-space: nowrap;
            display: inline-flex;
            align-items: center;
            gap: 4px;
            cursor: ${canRepair ? 'pointer' : 'default'};
          " ${canRepair ? '' : 'disabled'}>
            Reparieren
          </button>
        </div>
      </div>
    `;

    // 3. Fahrerassistenz & Beleuchtung
    const frontOn = !!this.player.frontLightEnabled;
    const rearOn = !!this.player.rearLightEnabled;
    const intensity = Math.round((this.player.lightIntensity ?? 0.85) * 100);
    const lockOn = this.player.directionLockEnabled !== false;
    const drillOn = this.player.autoDrillEnabled !== false;

    const mkToggle = (id, label, sub, isOn, iconName) => `
      <div style="
        background: rgba(15,23,42,0.7);
        border: 1px solid rgba(255,255,255,${isOn ? '0.14' : '0.06'});
        border-radius: 10px;
        padding: 8px 10px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
      ">
        <div style="display:flex;align-items:center;gap:8px;min-width:0;">
          <div style="
            width:28px;height:28px;display:flex;align-items:center;justify-content:center;
            background:${isOn ? 'rgba(245,158,11,0.18)' : 'rgba(71,85,105,0.15)'};
            border-radius:7px;color:${isOn ? '#f59e0b' : '#64748b'};flex-shrink:0;">
            ${icon(iconName, '', 15)}
          </div>
          <div style="min-width:0;">
            <div style="font-size:11px;font-weight:700;color:#f8fafc;white-space:nowrap;">${label}</div>
            <div style="font-size:9.5px;color:#94a3b8;margin-top:1px;white-space:nowrap;">${sub}</div>
          </div>
        </div>
        <button id="${id}" style="
          width:44px;height:24px;border:none;border-radius:12px;cursor:pointer;flex-shrink:0;
          background:${isOn ? 'linear-gradient(135deg,#10b981,#059669)' : '#334155'};
          position:relative;transition:background 0.2s ease;">
          <span style="
            position:absolute;top:3px;left:${isOn ? '22px' : '3px'};
            width:18px;height:18px;border-radius:50%;background:#fff;
            transition:left 0.2s ease;display:block;"></span>
        </button>
      </div>`;

    const assistHtml = `
      <div style="
        background: rgba(8,14,26,0.6);
        border: 1px solid rgba(255,255,255,0.07);
        border-radius: 12px;
        padding: 10px 12px;
        display: flex;
        flex-direction: column;
        gap: 8px;
      ">
        <div style="font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.6px;display:flex;align-items:center;gap:5px;margin-bottom:2px;">
          ${icon('settings-2','',11)} Beleuchtung & Fahrerassistenz
        </div>

        ${mkToggle('btn-front-light','Frontscheinwerfer','Arbeitsrichtung beleuchten (Taste L)', frontOn, 'lightbulb')}
        ${mkToggle('btn-rear-light','Heckscheinwerfer','Schachtrücken & Rückwärtsbereich', rearOn, 'lightbulb-off')}

        <div style="
          background: rgba(15,23,42,0.7);
          border: 1px solid rgba(255,255,255,${(frontOn||rearOn) ? '0.14' : '0.06'});
          border-radius: 10px;
          padding: 8px 10px;
        ">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
            <div style="display:flex;align-items:center;gap:8px;">
              <div style="width:28px;height:28px;display:flex;align-items:center;justify-content:center;
                background:rgba(245,158,11,0.12);border-radius:7px;color:#f59e0b;flex-shrink:0;">
                ${icon('sun-dim','',15)}
              </div>
              <div>
                <div style="font-size:11px;font-weight:700;color:#f8fafc;">Lichtstärke</div>
                <div style="font-size:9.5px;color:#94a3b8;">Helligkeit der Scheinwerfer</div>
              </div>
            </div>
            <span id="driller-intensity-val" style="font-size:12px;font-weight:800;color:#f59e0b;min-width:36px;text-align:right;">${intensity}%</span>
          </div>
          <style>
            #driller-intensity-slider{
              -webkit-appearance:none;appearance:none;
              width:100%;height:16px;background:transparent;
              outline:none;cursor:pointer;display:block;
              padding:0;margin:2px 0;
            }
            #driller-intensity-slider::-webkit-slider-runnable-track{
              height:4px;border-radius:99px;
              background:linear-gradient(to right,#f59e0b var(--v,85%),rgba(255,255,255,0.13) var(--v,85%));
            }
            #driller-intensity-slider::-webkit-slider-thumb{
              -webkit-appearance:none;appearance:none;
              width:16px;height:16px;border-radius:50%;
              background:#f59e0b;border:2.5px solid #fff;
              box-shadow:0 0 8px rgba(245,158,11,0.6);
              margin-top:-6px;cursor:pointer;
            }
            #driller-intensity-slider::-moz-range-track{
              height:4px;border-radius:99px;
              background:rgba(255,255,255,0.13);
            }
            #driller-intensity-slider::-moz-range-progress{
              height:4px;border-radius:99px;background:#f59e0b;
            }
            #driller-intensity-slider::-moz-range-thumb{
              width:13px;height:13px;border-radius:50%;
              background:#f59e0b;border:2.5px solid #fff;
              box-shadow:0 0 8px rgba(245,158,11,0.6);cursor:pointer;
            }
          </style>
          <input id="driller-intensity-slider" type="range" min="10" max="100" value="${intensity}"
            style="--v:${intensity}%">
        </div>



        ${mkToggle('btn-dir-lock','Einrasten','Richtung durch Halten fixieren', lockOn, 'lock')}
        ${mkToggle('btn-auto-drill','Automatisch weiterbohren','Blockiert nicht an Gestein', drillOn, 'drill')}
      </div>
    `;

    // 4. Darunter: Grid-Style-Inventar mit Steinen und Anzahl
    const oreCounts = {};
    cargo.forEach(oreKey => {
      oreCounts[oreKey] = (oreCounts[oreKey] || 0) + 1;
    });

    const oreKeys = Object.keys(oreCounts);

    // Freie Slots exakt basierend auf der verbleibenden Frachtraum-Kapazität
    const emptySlotsCount = Math.max(0, maxCargo - cargoCount);

    let gridItemsHtml = '';

    // Erze rendern
    oreKeys.forEach(key => {
      const count = oreCounts[key];
      const data = ORE_DATA[key] || { name: key, value: 0 };

      gridItemsHtml += `
        <div class="driller-ore-card" data-key="${key}" style="
          position: relative;
          background: rgba(18, 26, 42, 0.85);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 10px;
          padding: 8px 5px 8px 5px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          min-height: 90px;
          box-sizing: border-box;
          cursor: pointer;
          user-select: none;
          transition: transform 0.15s ease, border-color 0.15s ease, background 0.15s ease;
        " title="${data.name} (Klicken für Erz-Details)">
          <!-- Anzahl Badge -->
          <span style="
            position: absolute;
            top: 5px;
            right: 5px;
            background: #0284c7;
            color: #ffffff;
            font-size: 10px;
            font-weight: 800;
            padding: 1px 5px;
            border-radius: 99px;
            line-height: 1.2;
          ">${count}x</span>

          <!-- Stein Icon: Lucide "stone" in individueller Erzfarbe -->
          <div style="display: flex; align-items: center; justify-content: center; width: 34px; height: 34px;">
            ${oreIcon(key, 28)}
          </div>

          <!-- Stein Name -->
          <span class="driller-card-name" style="
            font-size: 11px;
            font-weight: 700;
            color: #f8fafc;
            text-align: center;
            margin-top: 6px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 100%;
          ">${data.name}</span>
        </div>
      `;
    });

    // Leere Slots für den echten Inventar-Grid-Look
    for (let i = 0; i < emptySlotsCount; i++) {
      gridItemsHtml += `
        <div style="
          background: rgba(255, 255, 255, 0.02);
          border-radius: 10px;
          min-height: 90px;
          box-sizing: border-box;
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <span style="color: rgba(255, 255, 255, 0.06); font-size: 14px; font-weight: 700;">•</span>
        </div>
      `;
    }

    const inventoryHtml = `
      <div style="display: flex; flex-direction: column; gap: 8px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 11.5px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; display: inline-flex; align-items: center; gap: 5px;">
            ${icon('stone', '', 12)} Inventar (${cargoCount}/${maxCargo})
          </span>
          ${cargoCount >= maxCargo ? `
            <span style="background: rgba(239, 68, 68, 0.2); color: #ef4444; font-size: 10px; font-weight: 800; padding: 1px 6px; border-radius: 4px;">
              VOLL
            </span>
          ` : ''}
        </div>

        <div style="
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(84px, 1fr));
          gap: 8px;
        ">
          ${gridItemsHtml}
        </div>
      </div>
    `;

    bodyEl.innerHTML = `
      <div style="display: flex; flex-direction: column; max-width: 620px; margin: 0 auto; width: 100%; box-sizing: border-box; padding: 0 4px 36px 4px; gap: 14px;">
        ${statusBarsHtml}
        ${emergencyActionsHtml}
        ${assistHtml}
        ${inventoryHtml}
      </div>
    `;

    document.body.classList.add('modal-open');
    modalEl.style.display = 'flex';
    refreshIcons(modalEl);

    // Frontscheinwerfer
    const frontBtn = bodyEl.querySelector('#btn-front-light');
    if (frontBtn) {
      frontBtn.onclick = (e) => { e.stopPropagation(); this.player?.setFrontLight(!this.player.frontLightEnabled); this.render(); };
    }
    // Heckscheinwerfer
    const rearBtn = bodyEl.querySelector('#btn-rear-light');
    if (rearBtn) {
      rearBtn.onclick = (e) => { e.stopPropagation(); this.player?.setRearLight(!this.player.rearLightEnabled); this.render(); };
    }
    // Lichtstärke-Slider (Live-Update ohne re-render)
    const slider = bodyEl.querySelector('#driller-intensity-slider');
    const intensityVal = bodyEl.querySelector('#driller-intensity-val');
    if (slider) {
      slider.oninput = (e) => {
        const v = Number(e.target.value);
        if (intensityVal) intensityVal.textContent = `${v}%`;
        slider.style.setProperty('--v', `${v}%`);
        this.player?.setLightIntensity(v / 100);
      };
    }
    // Einrasten
    const lockBtn = bodyEl.querySelector('#btn-dir-lock');
    if (lockBtn) {
      lockBtn.onclick = (e) => { e.stopPropagation(); this.player?.setDirectionLock(this.player.directionLockEnabled === false); this.render(); };
    }
    // Auto-Bohren
    const drillBtn = bodyEl.querySelector('#btn-auto-drill');
    if (drillBtn) {
      drillBtn.onclick = (e) => { e.stopPropagation(); this.player?.setAutoDrill(this.player.autoDrillEnabled === false); this.render(); };
    }

    // Klick auf Notfall-Ausrüstung im Driller-Menü
    const refuelBtn = bodyEl.querySelector('#btn-driller-refuel');
    if (refuelBtn) {
      refuelBtn.onclick = (e) => {
        e.stopPropagation();
        if (this.player?.useFuelCanister()) {
          this.render();
        }
      };
    }

    const repairBtn = bodyEl.querySelector('#btn-driller-repair');
    if (repairBtn) {
      repairBtn.onclick = (e) => {
        e.stopPropagation();
        if (this.player?.useRepairKit()) {
          this.render();
        }
      };
    }

    // Klick auf Erz-Karten im Bohrermenü öffnet das Info-Popup
    bodyEl.querySelectorAll('.driller-ore-card').forEach(card => {
      card.onclick = (e) => {
        e.stopPropagation();
        const key = card.getAttribute('data-key');
        if (key) {
          showOreInfoModal(key, this.scene);
        }
      };
    });
  }

  syncLiveStats() {
    if (!this.isOpen || !this.player) return;
    const fuel = Math.max(0, this.player.fuel || 0);
    const maxFuel = this.player.maxFuel || 60;
    const fuelPct = Math.max(0, Math.min(100, Math.round((fuel / maxFuel) * 100)));

    const fuelPctEl = document.getElementById('driller-menu-fuel-pct');
    if (fuelPctEl) fuelPctEl.textContent = `${fuelPct}%`;
    const fuelFillEl = document.getElementById('driller-menu-fuel-fill');
    if (fuelFillEl) fuelFillEl.style.width = `${fuelPct}%`;
    const fuelTxtEl = document.getElementById('driller-menu-fuel-text');
    if (fuelTxtEl) fuelTxtEl.textContent = `${Math.round(fuel)} / ${maxFuel} L`;

    const hull = Math.max(0, this.player.hull || 0);
    const maxHull = this.player.maxHull || 100;
    const hullPct = Math.max(0, Math.min(100, Math.round((hull / maxHull) * 100)));
    const hullColor = hullPct <= 25 ? '#ef4444' : hullPct <= 50 ? '#f59e0b' : '#10b981';

    const hullPctEl = document.getElementById('driller-menu-hull-pct');
    if (hullPctEl) {
      hullPctEl.textContent = `${hullPct}%`;
      hullPctEl.style.color = hullColor;
    }
    const hullFillEl = document.getElementById('driller-menu-hull-fill');
    if (hullFillEl) {
      hullFillEl.style.width = `${hullPct}%`;
      hullFillEl.style.background = hullColor;
    }
    const hullTxtEl = document.getElementById('driller-menu-hull-text');
    if (hullTxtEl) hullTxtEl.textContent = `${Math.round(hull)} / ${maxHull} HP`;
  }
}
