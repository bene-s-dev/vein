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
    const maxFuel = this.player.maxFuel || 40;
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
            <span style="font-size: 13px; font-weight: 800; color: #f59e0b; width: 44px; min-width: 44px; text-align: right; font-variant-numeric: tabular-nums; display: inline-block;">
              ${fuelPct}%
            </span>
          </div>
          <div style="height: 6px; background: rgba(0, 0, 0, 0.5); border-radius: 99px; overflow: hidden;">
            <div style="width: ${fuelPct}%; height: 100%; background: #f59e0b; border-radius: 99px; transition: width 0.2s ease;"></div>
          </div>
          <div style="font-size: 10px; color: #cbd5e1; text-align: right; font-variant-numeric: tabular-nums; font-weight: 600;">
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
            <span style="font-size: 13px; font-weight: 800; color: ${hullPct <= 25 ? '#ef4444' : hullPct <= 50 ? '#f59e0b' : '#10b981'}; width: 44px; min-width: 44px; text-align: right; font-variant-numeric: tabular-nums; display: inline-block;">
              ${hullPct}%
            </span>
          </div>
          <div style="height: 6px; background: rgba(0, 0, 0, 0.5); border-radius: 99px; overflow: hidden;">
            <div style="width: ${hullPct}%; height: 100%; background: ${hullPct <= 25 ? '#ef4444' : hullPct <= 50 ? '#f59e0b' : '#10b981'}; border-radius: 99px; transition: width 0.2s ease;"></div>
          </div>
          <div style="font-size: 10px; color: #cbd5e1; text-align: right; font-variant-numeric: tabular-nums; font-weight: 600;">
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

    // 3. Darunter: Grid-Style-Inventar mit Steinen und Anzahl
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
        ${inventoryHtml}
      </div>
    `;

    document.body.classList.add('modal-open');
    modalEl.style.display = 'flex';
    refreshIcons(modalEl);

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
}
