import { ORE_DATA, TILE_SIZE, TILE_TYPES } from '../core/GridSystem.js';
import { soundFx } from '../core/SoundEffects.js';
import { icon, refreshIcons, oreIcon } from './IconHelper.js';
import { ORE_DESCRIPTIONS, GEOLOGICAL_LAYERS } from './MinerBookModal.js';
import { isModalActive, notifyModalClosed } from '../core/BaseSystem.js';

export const ORE_USAGE_INFO = {
  coal: 'Brennstoff im Schmelzofen, Herstellung von Kohle-Briketts & Graphit-Dichtungen.',
  copper: 'Schmelzofen (Kupfer-Barren), Grundstoff für Bronze-Legierungen & Kupferkabel.',
  iron: 'Schmelzofen (Eisen-Barren), Stahlrohre, Träger und Strukturbauteile.',
  tin: 'Schmelzofen (Zinn-Barren), essenzielle Zutat zur Schmelze robuster Bronze.',
  silver: 'Schmelzofen (Silber-Barren), Präzisions-Sensoren & hochleitende Kontakte.',
  gold: 'Schmelzofen (Gold-Barren), High-Tech Leiterplatinen & Spitzenpreise an der Börse.',
  emerald: 'Kristallbörse, hoher Sammlerwert & optische Sensorkerne.',
  sapphire: 'Schleiferei & Hitzeschilde für extreme Tiefenbohrungen.',
  ruby: 'Laser-Fokuslinsen, verstärkte Schneidköpfe & Edelsteinhandel.',
  diamond: 'Diamant-Bohrspitzen & unzerbrechliche Fräsköpfe für härtestes Tiefengestein.',
  titanium: 'Schmelzofen (Titan-Barren), Titan-Panzerung & Schachtverstärkung.',
  platinum: 'Schmelzofen (Platin-Barren), Katalysatoren & Fusionskammern.',
  uranium: 'Reaktorbrennstoff & Nuklearantriebe für tiefste Expeditionen.',
  obsidian_gem: 'Druckfeste Schutzschilde für den extremen Tiefenkern.',
  dark_matter: 'Exotische Energiequelle höchster Stufe & absolut höchste Erlöse an der Börse.'
};

/**
 * Ermittelt die primäre geologische Fundschicht anhand der Mindest-Tiefe des Erzes.
 */
export function getLayerForOre(oreKey, oreData) {
  const depth = oreData?.minDepth != null ? oreData.minDepth : 0;
  let matched = GEOLOGICAL_LAYERS[0];
  for (const layer of GEOLOGICAL_LAYERS) {
    if (depth >= layer.minDepth) {
      matched = layer;
    }
  }
  return matched;
}

let activeKeydownListener = null;

/**
 * Zeigt das detailreiche Erz-Informations-Popup an (unter Tage, im Depot oder im Bohrermenü).
 */
export function showOreInfoModal(oreKey, scene) {
  if (!oreKey || !scene) return;
  const oreData = ORE_DATA[oreKey];
  if (!oreData) return;

  const desc = ORE_DESCRIPTIONS[oreKey] || 'Ein seltenes Mineral aus den Tiefen des Schachts.';
  const usage = ORE_USAGE_INFO[oreKey] || 'Verkauf an der Erzbörse und Weiterverarbeitung in der Basis.';
  const layer = getLayerForOre(oreKey, oreData);

  // Sound abspielen
  soundFx.playClick();

  // Spiel pausieren, falls es lief (unter Tage)
  const wasAlreadyPaused = Boolean(scene.isPaused);
  if (!wasAlreadyPaused) {
    scene.isPaused = true;
    soundFx.stopDrive();
    soundFx.stopDrilling();
    soundFx.stopJetpack();
    if (soundFx.stopRefuel) soundFx.stopRefuel();
  }

  // Aktuellen Besitz ermitteln
  const player = scene.player;
  const cargoCount = player?.cargo ? player.cargo.filter(k => k === oreKey).length : 0;
  const depotCount = scene.baseSystem?.depot?.ores?.[oreKey] || 0;

  // Prüfen, ob das Depot-Modal gerade geöffnet ist
  const buildingModal = document.getElementById('building-modal');
  const modalTitle = document.getElementById('modal-title');
  const isDepotOpen = buildingModal && buildingModal.style.display !== 'none' && modalTitle && modalTitle.innerText.includes('DEPOT');

  // DOM Container erstellen oder wiederverwenden
  let backdropEl = document.getElementById('ore-info-backdrop');
  if (!backdropEl) {
    backdropEl = document.createElement('div');
    backdropEl.id = 'ore-info-backdrop';
    backdropEl.style.cssText = `
      display: none;
      position: fixed;
      inset: 0;
      justify-content: center;
      align-items: center;
      padding: 16px;
      background: rgba(3, 7, 18, 0.78);
      backdrop-filter: blur(14px);
      -webkit-backdrop-filter: blur(14px);
      z-index: 10050;
      box-sizing: border-box;
    `;
    document.body.appendChild(backdropEl);
  }

  const closeModal = () => {
    notifyModalClosed();
    backdropEl.style.display = 'none';
    if (activeKeydownListener) {
      window.removeEventListener('keydown', activeKeydownListener);
      activeKeydownListener = null;
    }

    // Wenn das Spiel vorher nicht pausiert war und kein anderes Hauptmodal offen ist, unpausieren
    if (!wasAlreadyPaused && !isModalActive()) {
      scene.isPaused = false;
    }
  };

  backdropEl.innerHTML = `
    <div class="ore-info-window" style="
      width: 90%;
      max-width: 380px;
      max-height: 88vh;
      overflow-y: auto;
      background: rgba(15, 23, 42, 0.96);
      backdrop-filter: blur(24px) saturate(180%);
      -webkit-backdrop-filter: blur(24px) saturate(180%);
      border-radius: 20px;
      border: 1px solid rgba(255, 255, 255, 0.12);
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.85), 0 0 35px ${layer.color}25;
      padding: 22px 18px 18px 18px;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 12px;
      position: relative;
      animation: oreInfoPopIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    ">
      <!-- Schließen X-Button oben rechts -->
      <button id="btn-ore-info-x" style="
        position: absolute;
        top: 12px;
        right: 12px;
        background: rgba(255, 255, 255, 0.08);
        border: none;
        border-radius: 99px;
        width: 28px;
        height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #94a3b8;
        cursor: pointer;
        transition: background 0.15s, color 0.15s;
      ">
        ${icon('x', '', 14)}
      </button>

      <!-- Kopf-Badge: MINERALIEN-INFO -->
      <div style="display: inline-flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 800; letter-spacing: 0.8px; text-transform: uppercase; color: #38bdf8; background: rgba(56, 189, 248, 0.12); padding: 4px 12px; border-radius: 9999px; border: 1px solid rgba(56, 189, 248, 0.25);">
        ${icon('sparkles', '', 13)}
        <span>MINERALIEN-INFO</span>
      </div>

      <!-- Icon & Name -->
      <div style="display: flex; align-items: center; justify-content: center; gap: 10px; margin-top: 2px;">
        ${oreIcon(oreKey, 34)}
        <h2 style="margin: 0; font-size: 21px; font-weight: 800; color: #f8fafc; letter-spacing: 0.5px;">
          ${oreData.name.toUpperCase()}
        </h2>
      </div>

      <!-- Pillen / Werte -->
      <div style="display: flex; justify-content: center; gap: 6px; font-size: 12px; flex-wrap: wrap;">
        <span style="background: rgba(251, 191, 36, 0.12); border: 1px solid rgba(251, 191, 36, 0.25); color: #fbbf24; font-weight: 800; padding: 4px 10px; border-radius: 8px;">
          +€${oreData.value}
        </span>
        <span style="background: rgba(56, 189, 248, 0.12); border: 1px solid rgba(56, 189, 248, 0.25); color: #38bdf8; font-weight: 700; padding: 4px 10px; border-radius: 8px;">
          ab ${oreData.minDepth}m
        </span>
        <span style="background: rgba(148, 163, 184, 0.12); border: 1px solid rgba(148, 163, 184, 0.2); color: #cbd5e1; font-weight: 700; padding: 4px 10px; border-radius: 8px;">
          Härte ${oreData.hardness}x
        </span>
        <span style="background: rgba(168, 85, 247, 0.12); border: 1px solid rgba(168, 85, 247, 0.2); color: #c084fc; font-weight: 700; padding: 4px 10px; border-radius: 8px;">
          ${oreData.weight || 1}t / Stk.
        </span>
      </div>

      <!-- Geologische Fundschicht Box -->
      <div style="width: 100%; background: rgba(255, 255, 255, 0.03); border: 1px solid ${layer.color}33; border-radius: 12px; padding: 10px 12px; display: flex; flex-direction: column; gap: 5px; text-align: left; box-sizing: border-box;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 10px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.6px; display: inline-flex; align-items: center; gap: 4px;">
            ${icon('layers', '', 12)} Fundschicht
          </span>
          <span style="font-size: 11px; font-weight: 700; color: #cbd5e1; font-variant-numeric: tabular-nums;">
            ${layer.depthRange}
          </span>
        </div>
        <div style="display: flex; align-items: center; gap: 8px; font-size: 13.5px; font-weight: 800; color: ${layer.color};">
          <span style="display: inline-block; width: 9px; height: 9px; border-radius: 50%; background: ${layer.color}; box-shadow: 0 0 8px ${layer.color};"></span>
          ${layer.name}
        </div>
      </div>

      <!-- Geologische Beschreibung / Lore -->
      <p style="margin: 2px 0 4px 0; font-size: 13px; line-height: 1.5; color: #cbd5e1; max-width: 330px; text-align: center;">
        ${desc}
      </p>

      <!-- Verwendung & Nutzen -->
      <div style="width: 100%; background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.06); border-radius: 10px; padding: 8px 12px; text-align: left; box-sizing: border-box; display: flex; flex-direction: column; gap: 3px;">
        <span style="font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; display: inline-flex; align-items: center; gap: 4px;">
          ${icon('wrench', '', 11)} Verwendung
        </span>
        <span style="font-size: 11.5px; line-height: 1.4; color: #94a3b8;">
          ${usage}
        </span>
      </div>

      <!-- Bestand-Info -->
      <div style="display: flex; align-items: center; justify-content: center; gap: 12px; font-size: 12px; color: #64748b;">
        <span>Im Bohrer: <strong style="color: #38bdf8;">${cargoCount}x</strong></span>
        <span>•</span>
        <span>Im Depot: <strong style="color: #a855f7;">${depotCount}x</strong></span>
      </div>

      <!-- Buttons -->
      <div style="display: flex; gap: 8px; width: 100%; justify-content: center; margin-top: 4px;">
        ${isDepotOpen && cargoCount > 0 ? `
          <button id="btn-ore-info-deposit" class="btn-buy" style="height: 38px; flex: 1; max-width: 160px; font-size: 12.5px; font-weight: 800; border-radius: 10px; background: #0284c7;">
            ${icon('arrow-down-to-line', '', 13)} 1x Einlagern
          </button>
        ` : ''}
        <button id="btn-ore-info-ok" class="btn-buy" style="height: 38px; flex: 1; max-width: ${isDepotOpen && cargoCount > 0 ? '130px' : '200px'}; font-size: 13px; font-weight: 800; border-radius: 10px;">
          OK
        </button>
      </div>
    </div>
  `;

  backdropEl.style.display = 'flex';
  refreshIcons(backdropEl);

  // Klick auf Backdrop schließt Modal
  backdropEl.onclick = (e) => {
    if (e.target === backdropEl) {
      closeModal();
    }
  };

  const btnOk = document.getElementById('btn-ore-info-ok');
  if (btnOk) {
    btnOk.onclick = () => {
      soundFx.playClick();
      closeModal();
    };
  }

  const btnX = document.getElementById('btn-ore-info-x');
  if (btnX) {
    btnX.onclick = () => {
      soundFx.playClick();
      closeModal();
    };
  }

  const btnDeposit = document.getElementById('btn-ore-info-deposit');
  if (btnDeposit) {
    btnDeposit.onclick = (e) => {
      e.stopPropagation();
      if (scene.baseSystem && typeof scene.baseSystem.depositOre === 'function') {
        scene.baseSystem.depositOre(oreKey, 1);
        // Nach Einlagern Info aktualisieren
        showOreInfoModal(oreKey, scene);
      }
    };
  }

  // Escape-Taste schließt das Modal
  if (activeKeydownListener) {
    window.removeEventListener('keydown', activeKeydownListener);
  }
  activeKeydownListener = (e) => {
    if (e.key === 'Escape') {
      closeModal();
    }
  };
  window.addEventListener('keydown', activeKeydownListener);
}
