import { ORE_DATA } from '../core/GridSystem.js';
import { soundFx } from '../core/SoundEffects.js';
import { icon, refreshIcons, oreIcon, itemDisplayIcon, getRefinedOreName, drillerVehicleIcon } from './IconHelper.js';
import { notifyModalClosed } from '../core/BaseSystem.js';

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
    soundFx.stopDrive();
    soundFx.stopJetpack();
    soundFx.stopDrilling();

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

    // Titel: "BOHRER" mit dem originalen Spiel-Fahrzeug-Icon
    titleEl.innerHTML = `
      <div style="display: flex; align-items: center; gap: 10px; color: #38bdf8;">
        ${drillerVehicleIcon(26)}
        <span style="font-weight: 800; letter-spacing: 0.5px;">BOHRER</span>
      </div>
    `;

    // 1. Oben: Drei Balken und Prozentanzeige für Tank, Hülle und Fracht
    const fuel = Math.max(0, this.player.fuel || 0);
    const maxFuel = this.player.maxFuel || 100;
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
          background: rgba(15, 23, 42, 0.8);
          border: 1px solid rgba(245, 158, 11, 0.25);
          border-radius: 10px;
          padding: 8px 10px;
          display: flex;
          flex-direction: column;
          gap: 5px;
        ">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 11px; font-weight: 700; color: #94a3b8; display: inline-flex; align-items: center; gap: 4px;">
              ${icon('fuel', '', 12)} Tank
            </span>
            <span style="font-size: 13px; font-weight: 800; color: #f59e0b; width: 44px; min-width: 44px; text-align: right; font-variant-numeric: tabular-nums; display: inline-block;">
              ${fuelPct}%
            </span>
          </div>
          <div style="height: 6px; background: rgba(0, 0, 0, 0.6); border-radius: 99px; overflow: hidden; border: 1px solid rgba(255, 255, 255, 0.08);">
            <div style="width: ${fuelPct}%; height: 100%; background: #f59e0b; border-radius: 99px; transition: width 0.2s ease;"></div>
          </div>
          <div style="font-size: 9.5px; color: #64748b; text-align: right; font-variant-numeric: tabular-nums;">
            ${Math.round(fuel)} / ${maxFuel} L
          </div>
        </div>

        <!-- Hülle -->
        <div style="
          background: rgba(15, 23, 42, 0.8);
          border: 1px solid ${hullPct <= 25 ? 'rgba(239, 68, 68, 0.35)' : 'rgba(16, 185, 129, 0.25)'};
          border-radius: 10px;
          padding: 8px 10px;
          display: flex;
          flex-direction: column;
          gap: 5px;
        ">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 11px; font-weight: 700; color: #94a3b8; display: inline-flex; align-items: center; gap: 4px;">
              ${icon('shield-cog', '', 12)} Hülle
            </span>
            <span style="font-size: 13px; font-weight: 800; color: ${hullPct <= 25 ? '#ef4444' : hullPct <= 50 ? '#f59e0b' : '#10b981'}; width: 44px; min-width: 44px; text-align: right; font-variant-numeric: tabular-nums; display: inline-block;">
              ${hullPct}%
            </span>
          </div>
          <div style="height: 6px; background: rgba(0, 0, 0, 0.6); border-radius: 99px; overflow: hidden; border: 1px solid rgba(255, 255, 255, 0.08);">
            <div style="width: ${hullPct}%; height: 100%; background: ${hullPct <= 25 ? '#ef4444' : hullPct <= 50 ? '#f59e0b' : '#10b981'}; border-radius: 99px; transition: width 0.2s ease;"></div>
          </div>
          <div style="font-size: 9.5px; color: #64748b; text-align: right; font-variant-numeric: tabular-nums;">
            ${Math.round(hull)} / ${maxHull} HP
          </div>
        </div>

        <!-- Fracht -->
        <div style="
          background: rgba(15, 23, 42, 0.8);
          border: 1px solid ${cargoPct >= 100 ? 'rgba(239, 68, 68, 0.35)' : 'rgba(56, 189, 248, 0.25)'};
          border-radius: 10px;
          padding: 8px 10px;
          display: flex;
          flex-direction: column;
          gap: 5px;
        ">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 11px; font-weight: 700; color: #94a3b8; display: inline-flex; align-items: center; gap: 4px;">
              ${icon('container', '', 12)} Fracht
            </span>
            <span style="font-size: 13px; font-weight: 800; color: ${cargoPct >= 100 ? '#ef4444' : '#38bdf8'}; width: 44px; min-width: 44px; text-align: right; font-variant-numeric: tabular-nums; display: inline-block;">
              ${cargoPct}%
            </span>
          </div>
          <div style="height: 6px; background: rgba(0, 0, 0, 0.6); border-radius: 99px; overflow: hidden; border: 1px solid rgba(255, 255, 255, 0.08);">
            <div style="width: ${cargoPct}%; height: 100%; background: ${cargoPct >= 100 ? '#ef4444' : '#38bdf8'}; border-radius: 99px; transition: width 0.2s ease;"></div>
          </div>
          <div style="font-size: 9.5px; color: #64748b; text-align: right; font-variant-numeric: tabular-nums;">
            ${cargoCount} / ${maxCargo}
          </div>
        </div>
      </div>
    `;

    // 2. Darunter: Grid-Style-Inventar mit Steinen und Anzahl
    const oreCounts = {};
    cargo.forEach(oreKey => {
      oreCounts[oreKey] = (oreCounts[oreKey] || 0) + 1;
    });

    // Optionale Fabrik-Waren im Frachtraum mit einbeziehen (falls vorhanden)
    const fp = this.player.factoryProducts || {};
    const productCounts = {};
    Object.entries(fp).forEach(([k, v]) => {
      if (v > 0) productCounts[k] = v;
    });

    const PRODUCT_NAMES = {
      steel_beam: 'Stahlträger',
      bronze_ingot: 'Bronze-Barren',
      circuit_board: 'Leiterplatte',
      polished_gem: 'Polierter Kristall',
      titan_plate: 'Titanplatte',
      fusion_rod: 'Fusionsstab'
    };

    const oreKeys = Object.keys(oreCounts);
    const prodKeys = Object.keys(productCounts);
    const filledItemsCount = oreKeys.length + prodKeys.length;

    // Mindestens 12 Slots im Grid für ein schickes Inventar-Raster
    const minSlots = 12;
    const totalSlots = Math.max(minSlots, Math.ceil(filledItemsCount / 4) * 4);
    const emptySlotsCount = totalSlots - filledItemsCount;

    let gridItemsHtml = '';

    // Erze rendern
    oreKeys.forEach(key => {
      const count = oreCounts[key];
      const data = ORE_DATA[key] || { name: key, value: 0 };

      gridItemsHtml += `
        <div style="
          position: relative;
          background: rgba(15, 23, 42, 0.9);
          border: 1px solid rgba(56, 189, 248, 0.3);
          border-radius: 10px;
          padding: 10px 6px 8px 6px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 6px;
          min-height: 84px;
          box-sizing: border-box;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05);
        ">
          <!-- Anzahl Badge -->
          <span style="
            position: absolute;
            top: 5px;
            right: 5px;
            background: #0284c7;
            border: 1px solid #38bdf8;
            color: #ffffff;
            font-size: 10px;
            font-weight: 800;
            padding: 1px 5px;
            border-radius: 99px;
            line-height: 1.2;
          ">${count}x</span>

          <!-- Stein Icon: Lucide "stone" in individueller Erzfarbe -->
          <div style="display: flex; align-items: center; justify-content: center; width: 34px; height: 34px; margin-top: 2px;">
            ${oreIcon(key, 28)}
          </div>

          <!-- Stein Name -->
          <span style="
            font-size: 11px;
            font-weight: 700;
            color: #f8fafc;
            text-align: center;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 100%;
          ">${data.name}</span>
        </div>
      `;
    });

    // Fabrikprodukte & veredelte Barren/Briketts rendern
    prodKeys.forEach(key => {
      const count = productCounts[key];
      const isBar = key.startsWith('bar_');
      const name = isBar ? getRefinedOreName(key.replace('bar_', '')) : (PRODUCT_NAMES[key] || key);
      const borderCol = isBar ? 'rgba(245, 158, 11, 0.35)' : 'rgba(192, 132, 252, 0.35)';
      const badgeBg = isBar ? '#d97706' : '#7c3aed';
      const badgeBorder = isBar ? '#f59e0b' : '#c084fc';

      gridItemsHtml += `
        <div style="
          position: relative;
          background: rgba(15, 23, 42, 0.9);
          border: 1px solid ${borderCol};
          border-radius: 10px;
          padding: 10px 6px 8px 6px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 6px;
          min-height: 84px;
          box-sizing: border-box;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05);
        ">
          <!-- Anzahl Badge -->
          <span style="
            position: absolute;
            top: 5px;
            right: 5px;
            background: ${badgeBg};
            border: 1px solid ${badgeBorder};
            color: #ffffff;
            font-size: 10px;
            font-weight: 800;
            padding: 1px 5px;
            border-radius: 99px;
            line-height: 1.2;
          ">${count}x</span>

          <!-- Icon (Barren/Brikett oder Fabrikprodukt) -->
          <div style="display: flex; align-items: center; justify-content: center; width: 34px; height: 34px; margin-top: 2px;">
            ${itemDisplayIcon(key, 28)}
          </div>

          <!-- Name -->
          <span style="
            font-size: 11px;
            font-weight: 700;
            color: #f8fafc;
            text-align: center;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 100%;
          ">${name}</span>
        </div>
      `;
    });

    // Leere Slots für den echten Inventar-Grid-Look
    for (let i = 0; i < emptySlotsCount; i++) {
      gridItemsHtml += `
        <div style="
          background: rgba(15, 23, 42, 0.3);
          border: 1px dashed rgba(255, 255, 255, 0.08);
          border-radius: 10px;
          min-height: 84px;
          box-sizing: border-box;
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <span style="color: rgba(255, 255, 255, 0.08); font-size: 16px; font-weight: 700;">+</span>
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
            <span style="background: rgba(239, 68, 68, 0.2); border: 1px solid rgba(239, 68, 68, 0.4); color: #ef4444; font-size: 10px; font-weight: 800; padding: 1px 6px; border-radius: 4px;">
              VOLL
            </span>
          ` : ''}
        </div>

        <div style="
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(84px, 1fr));
          gap: 8px;
          max-height: 320px;
          overflow-y: auto;
          padding-right: 2px;
        ">
          ${gridItemsHtml}
        </div>
      </div>
    `;

    bodyEl.innerHTML = `
      <div style="display: flex; flex-direction: column;">
        ${statusBarsHtml}
        ${inventoryHtml}
      </div>
    `;

    modalEl.style.display = 'flex';
    refreshIcons(modalEl);


  }
}
