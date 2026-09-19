import { ORE_DATA, TILE_SIZE, TILE_TYPES } from '../core/GridSystem.js';
import { soundFx } from '../core/SoundEffects.js';
import { icon, refreshIcons, oreIcon, itemDisplayIcon, getRefinedOreName } from './IconHelper.js';
import { ORE_DESCRIPTIONS, GEOLOGICAL_LAYERS, BOOK_PRODUCTS } from './MinerBookModal.js';
import { isModalActive, notifyModalClosed, FACTORY_PRODUCTS, COMPONENT_DATA, EXPEDITION_ITEMS } from '../core/BaseSystem.js';
import { launchConfetti } from './HUD.js';

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

export const SPECIAL_TILE_DATA = {
  tile_boulder: {
    id: 'tile_boulder',
    name: 'Felsbrocken & Geröll',
    badge: 'GEFAHR & BEUTE',
    badgeColor: '#f59e0b',
    depth: 'Ab 12m Tiefe',
    icon: 'mountain',
    sprite: 'tile_boulder',
    stats: [
      { label: 'Eigenschaft', val: 'Instabil (stürzt)', color: '#ef4444' },
      { label: 'Gesteinshärte', val: '110 HP', color: '#38bdf8' },
      { label: 'Ertrag', val: '+€25 & +8 XP', color: '#10b981' }
    ],
    desc: 'Ein massiver, schwerer Felsbrocken im Schacht. Wenn du den Boden direkt unter ihm wegbohrst, stürzt er ungebremst herab und zerschmettert alles darunter! Kann mit starkem Bohrkopf abgebaut oder mit Dynamit gesprengt werden.',
    hint: '💡 Tipp: Stehe niemals unter einem untergrabenen Felsbrocken! Nutze Dynamit, um Schächte schnell freizusprengen.'
  },
  tile_cache: {
    id: 'tile_cache',
    name: 'Expeditions-Kapsel',
    badge: 'WERTVOLLER FUND',
    badgeColor: '#10b981',
    icon: 'package',
    sprite: 'tile_cache',
    stats: [
      { label: 'Inhalt', val: 'Bargeld & Gadgets', color: '#10b981' },
      { label: 'Hülle', val: '45 HP', color: '#38bdf8' },
      { label: 'Bonus', val: 'Dynamit / Treibstoff', color: '#a855f7' }
    ],
    desc: 'Eine verschollene Bergungskapsel früherer Minen-Expeditionen. Beim Anbohren bergen deine Scanner wertvolle Notfall-Gelder sowie nützliche Gadgets wie Dynamit, Treibstoffkanister oder Reparatur-Kits.',
    hint: '💡 Tipp: Jede Kapsel füllt dein Konto auf und stockt deine Gadgets auf – halte nach diesen Kisten Ausschau!'
  },
  tile_lava: {
    id: 'tile_lava',
    name: 'Glühende Lava-Ader',
    badge: 'EXTREME HITZE',
    badgeColor: '#ef4444',
    icon: 'flame',
    sprite: 'tile_lava',
    stats: [
      { label: 'Gefahr', val: 'Hitzeschaden (-16 HP)', color: '#ef4444' },
      { label: 'Zone', val: 'Tiefengestein (> 160m)', color: '#fbbf24' },
      { label: 'Schutz', val: 'Panzerungs-Upgrades', color: '#38bdf8' }
    ],
    desc: 'Unterirdische Adern aus flüssigem Magma unter gewaltigem Druck. Das Anbohren von Lava führt zu plötzlichen Hitzewallungen und beschädigt die Panzerung deines Bohrers!',
    hint: '💡 Tipp: Umgehe Lava-Adern großräumig oder rüste hitzeresistente Panzerungs-Upgrades aus.'
  }
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

// Verhindert Klick-Durchgriff auf den Phaser-Canvas
function shieldBackdrop(el) {
  if (!el || el.__shielded) return;
  el.__shielded = true;
  const events = ['pointerdown', 'pointerup', 'pointermove', 'mousedown', 'mouseup', 'click', 'touchstart', 'touchend'];
  events.forEach((eventType) => {
    el.addEventListener(eventType, (e) => {
      // Wenn das Event auf dem Schließen-Button oder innerhalb des Dialogs liegt, normales Verhalten erlauben
      e.stopPropagation();
    }, { passive: false });
  });
}

/**
 * Zeigt das detailreiche Erz-Informations-Popup an (unter Tage, im Depot oder im Bohrermenü).
 */
export function showOreInfoModal(oreKey, scene) {
  if (!oreKey || !scene) return;
  const oreData = ORE_DATA[oreKey];
  if (!oreData) {
    // Falls es kein Roherz ist, als Ware / Produkt / Bauteil anzeigen
    return showGoodsInfoModal(oreKey, scene);
  }

  const desc = ORE_DESCRIPTIONS[oreKey] || 'Ein seltenes Mineral aus den Tiefen des Schachts.';
  const usage = ORE_USAGE_INFO[oreKey] || 'Verkauf an der Erzbörse und Weiterverarbeitung in der Basis.';
  const layer = getLayerForOre(oreKey, oreData);

  // Sound abspielen
  soundFx.playClick();
  soundFx.stopAllLoops?.();

  // Spiel pausieren, falls es lief (unter Tage)
  const wasAlreadyPaused = Boolean(scene.isPaused);
  if (!wasAlreadyPaused) {
    scene.isPaused = true;
  }

  // Aktuellen Besitz ermitteln
  const player = scene.player;
  const cargoCount = player?.cargo ? player.cargo.filter(k => k === oreKey).length : 0;
  const depotCount = scene.baseSystem?.depot?.ores?.[oreKey] || 0;

  // Prüfen, ob das Depot-Modal gerade geöffnet ist
  const buildingModal = document.getElementById('building-modal');
  const modalTitle = document.getElementById('modal-title');
  const isDepotOpen = buildingModal && buildingModal.style.display !== 'none' && modalTitle && modalTitle.innerText.includes('DEPOT');

  try {
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
    shieldBackdrop(backdropEl);

    const closeModal = () => {
      backdropEl.style.display = 'none';
      if (activeKeydownListener) {
        window.removeEventListener('keydown', activeKeydownListener);
        activeKeydownListener = null;
      }

      if (!wasAlreadyPaused) {
        scene.isPaused = false;
      }
      notifyModalClosed();
    };

    backdropEl.innerHTML = `
    <div class="ore-info-window" style="
      width: 95%;
      max-width: 520px;
      background: rgba(15, 23, 42, 0.96);
      backdrop-filter: blur(24px) saturate(180%);
      -webkit-backdrop-filter: blur(24px) saturate(180%);
      border-radius: 18px;
      border: 1px solid rgba(255, 255, 255, 0.12);
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.85), 0 0 30px ${layer.color}20;
      padding: 18px 22px;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      gap: 14px;
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
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #94a3b8;
        cursor: pointer;
        touch-action: manipulation;
        transition: all 0.15s;
        z-index: 5;
      ">
        ${icon('x', '', 16)}
      </button>

      <!-- Obere Zeile: Icon + Name + Schicht-Badge + Badges horizontal -->
      <div style="display: flex; align-items: center; gap: 16px;">
        <div style="width: 56px; height: 56px; border-radius: 14px; background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.1); display: flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: 0 4px 14px rgba(0,0,0,0.4);">
          ${oreIcon(oreKey, 38)}
        </div>

        <div style="display: flex; flex-direction: column; gap: 5px; flex: 1; min-width: 0;">
          <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
            <h2 style="margin: 0; font-size: 20px; font-weight: 800; color: #f8fafc; letter-spacing: 0.5px;">
              ${oreData.name.toUpperCase()}
            </h2>
            <span style="font-size: 10px; font-weight: 800; letter-spacing: 0.6px; text-transform: uppercase; color: ${layer.color}; background: ${layer.color}18; padding: 2px 9px; border-radius: 9999px; border: 1px solid ${layer.color}35; display: inline-flex; align-items: center; gap: 4px;">
              ${icon('layers', '', 11)} ${layer.name} (${layer.depthRange})
            </span>
          </div>

          <!-- Wichtige Kennzahlen Badges horizontal -->
          <div style="display: flex; gap: 6px; flex-wrap: wrap;">
            <span style="background: rgba(251, 191, 36, 0.14); border: 1px solid rgba(251, 191, 36, 0.3); color: #fbbf24; font-weight: 800; font-size: 11.5px; padding: 2px 9px; border-radius: 6px; font-variant-numeric: tabular-nums;">
              €${oreData.value}
            </span>
            <span style="background: rgba(56, 189, 248, 0.12); border: 1px solid rgba(56, 189, 248, 0.25); color: #38bdf8; font-weight: 700; font-size: 11.5px; padding: 2px 9px; border-radius: 6px;">
              ab ${oreData.minDepth}m
            </span>
            <span style="background: rgba(148, 163, 184, 0.12); border: 1px solid rgba(148, 163, 184, 0.25); color: #cbd5e1; font-weight: 700; font-size: 11.5px; padding: 2px 9px; border-radius: 6px;">
              Härte ${oreData.hardness}x
            </span>
          </div>
        </div>
      </div>

      <!-- Mittlerer Bereich: Minimalistische Beschreibung & Bestand -->
      <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.07); border-radius: 10px; padding: 10px 14px; display: flex; justify-content: space-between; align-items: center; gap: 14px;">
        <div style="font-size: 12px; line-height: 1.45; color: #94a3b8; flex: 1;">
          ${desc}
        </div>
        <div style="display: flex; flex-direction: column; gap: 3px; align-items: flex-end; flex-shrink: 0; border-left: 1px solid rgba(255,255,255,0.08); padding-left: 14px; font-size: 11.5px;">
          <span style="color: #cbd5e1;">Laderaum: <strong style="color: #38bdf8;">${cargoCount}x</strong></span>
          <span style="color: #cbd5e1;">Depot: <strong style="color: #a855f7;">${depotCount}x</strong></span>
        </div>
      </div>

      <!-- Fußleiste / Aktionen -->
      <div style="display: flex; gap: 8px; justify-content: flex-end; align-items: center;">
        ${isDepotOpen && cargoCount > 0 ? `
          <button id="btn-ore-info-deposit" class="btn-buy" style="height: 34px; padding: 0 14px; font-size: 12px; font-weight: 800; border-radius: 8px; background: #0284c7;">
            ${icon('arrow-down-to-line', '', 13)} 1x Einlagern
          </button>
        ` : ''}
        <button id="btn-ore-info-ok" class="btn-buy" style="height: 34px; padding: 0 20px; font-size: 12px; font-weight: 800; border-radius: 8px;">
          OK
        </button>
      </div>
    </div>
  `;

  backdropEl.style.display = 'flex';
  refreshIcons(backdropEl);

  // Klick auf Backdrop schließt Modal
  backdropEl.onclick = (e) => {
    e.stopPropagation();
    if (e.target === backdropEl) {
      closeModal();
    }
  };

  const btnOk = document.getElementById('btn-ore-info-ok');
  if (btnOk) {
    btnOk.onclick = (e) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      soundFx.playClick();
      closeModal();
    };
  }

  const btnX = document.getElementById('btn-ore-info-x');
  if (btnX) {
    btnX.onclick = (e) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
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
  } catch (err) {
    console.error('Error in showOreInfoModal:', err);
    if (!wasAlreadyPaused && scene) {
      scene.isPaused = false;
    }
    const backdropEl = document.getElementById('ore-info-backdrop');
    if (backdropEl) backdropEl.style.display = 'none';
  }
}

/**
 * Zeigt das minimalistische Informations-Popup für Waren, Fabrikprodukte, Barren und Bauteile an.
 */
export function showGoodsInfoModal(itemKey, scene) {
  if (!itemKey || !scene) return;

  const bookItem = BOOK_PRODUCTS?.find(p => p.id === itemKey);
  const factoryItem = FACTORY_PRODUCTS?.[itemKey];
  const compItem = COMPONENT_DATA?.[itemKey];
  const expItem = EXPEDITION_ITEMS?.find(i => i.key === itemKey);
  const isBar = typeof itemKey === 'string' && itemKey.startsWith('bar_');
  const rawKey = isBar ? itemKey.replace('bar_', '') : null;

  // Name
  const name = bookItem?.name || factoryItem?.name || compItem?.name || expItem?.name || (isBar ? getRefinedOreName(itemKey) : itemKey);

  // Kategorie
  let categoryLabel = 'WARE · ERZEUGNIS';
  let categoryIcon = 'layers';
  let categoryColor = '#38bdf8';

  if (isBar) {
    categoryLabel = 'SCHMELZOFEN · BARREN';
    categoryIcon = 'flame';
    categoryColor = '#f59e0b';
  } else if (bookItem?.category === 'goods' || (factoryItem && !factoryItem.isComponent)) {
    categoryLabel = 'FABRIK · HANDELSGUT';
    categoryIcon = 'factory';
    categoryColor = '#10b981';
  } else if (bookItem?.category === 'component' || factoryItem?.isComponent || compItem) {
    categoryLabel = bookItem?.category === 'research' ? 'GEOLOGE · ELEKTRONIK' : 'FABRIK · BAUTEIL';
    categoryIcon = bookItem?.category === 'research' ? 'cpu' : 'wrench';
    categoryColor = bookItem?.category === 'research' ? '#60a5fa' : '#a855f7';
  } else if (expItem) {
    categoryLabel = 'EXPEDITIONSAUSRÜSTUNG';
    categoryIcon = 'package';
    categoryColor = '#ef4444';
  }

  // Wert
  let value = 0;
  if (typeof bookItem?.value === 'number') value = bookItem.value;
  else if (typeof factoryItem?.value === 'number') value = factoryItem.value;
  else if (typeof expItem?.price === 'number') value = expItem.price;
  else if (isBar && rawKey && ORE_DATA[rawKey]) value = Math.round(ORE_DATA[rawKey].value * 1.5);

  // Rezeptur
  let recipeText = bookItem?.req || '';
  if (!recipeText && factoryItem?.recipe) {
    const parts = Object.entries(factoryItem.recipe).map(([k, count]) => {
      const oreN = ORE_DATA[k]?.name || k;
      return `${count}x ${oreN}`;
    });
    recipeText = parts.join(' + ') + ' (Fabrik)';
  } else if (!recipeText && isBar && rawKey) {
    const rawN = ORE_DATA[rawKey]?.name || rawKey;
    recipeText = `1x ${rawN} (im Schmelzofen)`;
  } else if (!recipeText && expItem) {
    recipeText = 'Im Depot-Shop erhältlich';
  }

  // Zweck / Verwendung
  let usageText = bookItem?.usage || '';
  if (!usageText) {
    if (isBar) usageText = 'Börsen-Verkauf (+50% Erlös) & Legierungen';
    else if (factoryItem && !factoryItem.isComponent) usageText = 'Börsen-Verkauf (Spitzenpreis)';
    else if (compItem || factoryItem?.isComponent) usageText = 'Werkstatt & Hangar-Upgrades';
    else if (expItem) usageText = 'Expeditionen & Schacht-Einsatz';
    else usageText = 'Weiterverarbeitung & Handel';
  }

  // Beschreibung
  const desc = bookItem?.desc || factoryItem?.desc || expItem?.desc || 'Ein wertvolles veredeltes Erzeugnis aus der industriellen Fertigung der Basis.';

  // Sound abspielen
  soundFx.playClick();
  soundFx.stopAllLoops?.();

  // Spiel pausieren falls nötig
  const wasAlreadyPaused = Boolean(scene.isPaused);
  if (!wasAlreadyPaused) {
    scene.isPaused = true;
  }

  // Bestände ermitteln
  const player = scene.player;
  const cargoCount = player?.cargo ? player.cargo.filter(k => k === itemKey).length : 0;
  const depotCount = (scene.baseSystem?.depot?.products?.[itemKey] || 0) + (isBar && scene.baseSystem?.depot?.ores?.[itemKey] ? scene.baseSystem.depot.ores[itemKey] : 0);
  const inventoryCount = (player?.components?.[itemKey] || 0) + (player?.gadgets?.[itemKey] || 0);

  // Prüfen, ob das Depot-Modal gerade geöffnet ist
  const buildingModal = document.getElementById('building-modal');
  const modalTitle = document.getElementById('modal-title');
  const isDepotOpen = buildingModal && buildingModal.style.display !== 'none' && modalTitle && modalTitle.innerText.includes('DEPOT');

  try {
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
    shieldBackdrop(backdropEl);

    const closeModal = () => {
      backdropEl.style.display = 'none';
      if (activeKeydownListener) {
        window.removeEventListener('keydown', activeKeydownListener);
        activeKeydownListener = null;
      }
      if (!wasAlreadyPaused) {
        scene.isPaused = false;
      }
      notifyModalClosed();
    };

    backdropEl.innerHTML = `
    <div class="ore-info-window" style="
      width: 95%;
      max-width: 520px;
      background: rgba(15, 23, 42, 0.96);
      backdrop-filter: blur(24px) saturate(180%);
      -webkit-backdrop-filter: blur(24px) saturate(180%);
      border-radius: 18px;
      border: 1px solid rgba(255, 255, 255, 0.12);
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.85), 0 0 30px ${categoryColor}20;
      padding: 18px 22px;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      gap: 14px;
      position: relative;
      animation: oreInfoPopIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    ">
      <!-- Schließen X-Button oben rechts -->
      <button id="btn-goods-info-x" style="
        position: absolute;
        top: 12px;
        right: 12px;
        background: rgba(255, 255, 255, 0.08);
        border: none;
        border-radius: 99px;
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #94a3b8;
        cursor: pointer;
        touch-action: manipulation;
        transition: all 0.15s;
        z-index: 5;
      ">
        ${icon('x', '', 16)}
      </button>

      <!-- Obere Zeile: Icon + Name + Kategorie-Badge + Badges horizontal -->
      <div style="display: flex; align-items: center; gap: 16px;">
        <div style="width: 56px; height: 56px; border-radius: 14px; background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.1); display: flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: 0 4px 14px rgba(0,0,0,0.4); color: ${categoryColor};">
          ${itemDisplayIcon(itemKey, 38)}
        </div>

        <div style="display: flex; flex-direction: column; gap: 5px; flex: 1; min-width: 0;">
          <h2 style="margin: 0; font-size: 20px; font-weight: 800; color: #f8fafc; letter-spacing: 0.5px;">
            ${name.toUpperCase()}
          </h2>

          <!-- Nur Verkaufspreis Badge oben -->
          ${value > 0 ? `
            <div>
              <span style="background: rgba(251, 191, 36, 0.14); border: 1px solid rgba(251, 191, 36, 0.3); color: #fbbf24; font-weight: 800; font-size: 11.5px; padding: 2px 9px; border-radius: 6px; font-variant-numeric: tabular-nums; display: inline-block;">
                €${value.toLocaleString('de-DE')}
              </span>
            </div>
          ` : ''}
        </div>
      </div>

      <!-- Mittlerer Bereich: Minimalistische Beschreibung & Bestand -->
      <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.07); border-radius: 10px; padding: 10px 14px; display: flex; justify-content: space-between; align-items: center; gap: 14px;">
        <div style="font-size: 12px; line-height: 1.45; color: #94a3b8; flex: 1;">
          ${desc}
        </div>
        <div style="display: flex; flex-direction: column; gap: 3px; align-items: flex-end; flex-shrink: 0; border-left: 1px solid rgba(255,255,255,0.08); padding-left: 14px; font-size: 11.5px;">
          <span style="color: #cbd5e1;">Laderaum: <strong style="color: #38bdf8;">${cargoCount}x</strong></span>
          <span style="color: #cbd5e1;">Depot: <strong style="color: #a855f7;">${depotCount}x</strong></span>
          ${inventoryCount > 0 ? `<span style="color: #cbd5e1;">Inventar: <strong style="color: #34d399;">${inventoryCount}x</strong></span>` : ''}
        </div>
      </div>

      <!-- Fußleiste / Aktionen -->
      <div style="display: flex; gap: 8px; justify-content: flex-end; align-items: center;">
        ${isDepotOpen && cargoCount > 0 ? `
          <button id="btn-goods-info-deposit" class="btn-buy" style="height: 34px; padding: 0 14px; font-size: 12px; font-weight: 800; border-radius: 8px; background: #0284c7; display: inline-flex; align-items: center; gap: 5px;">
            ${icon('arrow-down-to-line', '', 13)} 1x Einlagern
          </button>
        ` : ''}
        <button id="btn-goods-info-ok" class="btn-buy" style="height: 34px; padding: 0 20px; font-size: 12px; font-weight: 800; border-radius: 8px;">
          OK
        </button>
      </div>
    </div>
    `;

    backdropEl.style.display = 'flex';
    refreshIcons(backdropEl);

    backdropEl.onclick = (e) => {
      e.stopPropagation();
      if (e.target === backdropEl) {
        closeModal();
      }
    };

    const btnOk = document.getElementById('btn-goods-info-ok');
    if (btnOk) {
      btnOk.onclick = (e) => {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
        soundFx.playClick();
        closeModal();
      };
    }

    const btnX = document.getElementById('btn-goods-info-x');
    if (btnX) {
      btnX.onclick = (e) => {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
        soundFx.playClick();
        closeModal();
      };
    }

    const btnDeposit = document.getElementById('btn-goods-info-deposit');
    if (btnDeposit) {
      btnDeposit.onclick = (e) => {
        e.stopPropagation();
        if (scene.baseSystem) {
          if (isBar && typeof scene.baseSystem.depositOre === 'function') {
            scene.baseSystem.depositOre(itemKey, 1);
          } else {
            const idx = player.cargo.indexOf(itemKey);
            if (idx >= 0) {
              player.cargo.splice(idx, 1);
              scene.baseSystem.depot.products = scene.baseSystem.depot.products || {};
              scene.baseSystem.depot.products[itemKey] = (scene.baseSystem.depot.products[itemKey] || 0) + 1;
              scene.events?.emit('player_updated');
              soundFx.playPurchase();
            }
          }
          if (scene.baseSystem.renderDepotModal) {
            scene.baseSystem.renderDepotModal();
          }
          showGoodsInfoModal(itemKey, scene);
        }
      };
    }


    if (activeKeydownListener) {
      window.removeEventListener('keydown', activeKeydownListener);
    }
    activeKeydownListener = (e) => {
      if (e.key === 'Escape') {
        closeModal();
      }
    };
    window.addEventListener('keydown', activeKeydownListener);
  } catch (err) {
    console.error('Error in showGoodsInfoModal:', err);
    if (!wasAlreadyPaused && scene) {
      scene.isPaused = false;
    }
    const backdropEl = document.getElementById('ore-info-backdrop');
    if (backdropEl) backdropEl.style.display = 'none';
  }
}

/**
 * Zeigt das Informations-Popup für Spezialfelder (Felsbrocken, Kapseln, Lava).
 */
export function showSpecialTileInfoModal(tileType, scene, isDiscovery = false) {
  if (!tileType || !scene) return;
  const tileInfo = SPECIAL_TILE_DATA[tileType];
  if (!tileInfo) return;

  if (isDiscovery) {
    soundFx.playPurchase();
    try {
      launchConfetti();
    } catch (e) {}
  } else {
    soundFx.playClick();
  }

  soundFx.stopAllLoops?.();

  // Spiel pausieren, falls es lief (unter Tage)
  const wasAlreadyPaused = Boolean(scene.isPaused);
  if (!wasAlreadyPaused) {
    scene.isPaused = true;
  }

  try {
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
    shieldBackdrop(backdropEl);

    const closeModal = () => {
      backdropEl.style.display = 'none';
      if (activeKeydownListener) {
        window.removeEventListener('keydown', activeKeydownListener);
        activeKeydownListener = null;
      }

      if (!wasAlreadyPaused) {
        scene.isPaused = false;
      }
      notifyModalClosed();
    };

  // Textur-DataURL für kristallklares Pixelart im Popup
  let textureImgHtml = '';
  try {
    if (scene.textures && scene.textures.exists(tileInfo.sprite)) {
      const srcCanvas = scene.textures.get(tileInfo.sprite).getSourceImage();
      if (srcCanvas && srcCanvas.toDataURL) {
        const dataUrl = srcCanvas.toDataURL();
        textureImgHtml = `<img src="${dataUrl}" style="width: 44px; height: 44px; image-rendering: pixelated; border-radius: 8px; box-shadow: 0 4px 16px rgba(0,0,0,0.6);" alt="${tileInfo.name}" />`;
      }
    }
  } catch (e) {}

  if (!textureImgHtml) {
    textureImgHtml = `<div style="color: ${tileInfo.badgeColor};">${icon(tileInfo.icon, '', 36)}</div>`;
  }

  const statsPills = tileInfo.stats.map(s => `
    <span style="background: ${s.color}15; border: 1px solid ${s.color}35; color: ${s.color}; font-weight: 700; padding: 4px 10px; border-radius: 8px; font-size: 11.5px;">
      <strong>${s.label}:</strong> ${s.val}
    </span>
  `).join('');

  backdropEl.innerHTML = `
    <div class="ore-info-window" style="
      width: 95%;
      max-width: 520px;
      background: rgba(15, 23, 42, 0.96);
      backdrop-filter: blur(24px) saturate(180%);
      -webkit-backdrop-filter: blur(24px) saturate(180%);
      border-radius: 18px;
      border: 1px solid rgba(255, 255, 255, 0.12);
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.85), 0 0 30px ${tileInfo.badgeColor}20;
      padding: 18px 22px;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      gap: 14px;
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
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #94a3b8;
        cursor: pointer;
        touch-action: manipulation;
        transition: all 0.15s;
        z-index: 5;
      ">
        ${icon('x', '', 16)}
      </button>

      <!-- Obere Zeile: Icon + Name + Badges -->
      <div style="display: flex; align-items: center; gap: 16px;">
        <div style="width: 56px; height: 56px; border-radius: 14px; background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.1); display: flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: 0 4px 14px rgba(0,0,0,0.4);">
          ${textureImgHtml}
        </div>

        <div style="display: flex; flex-direction: column; gap: 5px; flex: 1; min-width: 0;">
          <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
            <h2 style="margin: 0; font-size: 19px; font-weight: 800; color: #f8fafc; letter-spacing: 0.5px;">
              ${tileInfo.name.toUpperCase()}
            </h2>
            <span style="font-size: 10px; font-weight: 800; letter-spacing: 0.6px; text-transform: uppercase; color: ${tileInfo.badgeColor}; background: ${tileInfo.badgeColor}18; padding: 2px 9px; border-radius: 9999px; border: 1px solid ${tileInfo.badgeColor}35; display: inline-flex; align-items: center; gap: 4px;">
              ${icon(isDiscovery ? 'sparkles' : tileInfo.icon, '', 11)} ${isDiscovery ? 'Neu · ' : ''}${tileInfo.badge}
            </span>
          </div>

          <!-- Stat Pills -->
          <div style="display: flex; gap: 6px; flex-wrap: wrap;">
            ${statsPills}
          </div>
        </div>
      </div>

      <!-- Beschreibung -->
      <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.07); border-radius: 10px; padding: 10px 14px; font-size: 12px; line-height: 1.45; color: #94a3b8;">
        ${tileInfo.desc}
      </div>

      <!-- Fußleiste -->
      <div style="display: flex; justify-content: flex-end;">
        <button id="btn-ore-info-ok" class="btn-buy" style="height: 34px; padding: 0 20px; font-size: 12px; font-weight: 800; border-radius: 8px;">
          OK
        </button>
      </div>
    </div>
  `;

  backdropEl.style.display = 'flex';
  refreshIcons(backdropEl);

  backdropEl.onclick = (e) => {
    e.stopPropagation();
    if (e.target === backdropEl) {
      closeModal();
    }
  };

  const btnOk = document.getElementById('btn-ore-info-ok');
  if (btnOk) {
    btnOk.onclick = (e) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      soundFx.playClick();
      closeModal();
    };
  }

  const btnX = document.getElementById('btn-ore-info-x');
  if (btnX) {
    btnX.onclick = (e) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      soundFx.playClick();
      closeModal();
    };
  }

    if (activeKeydownListener) {
      window.removeEventListener('keydown', activeKeydownListener);
    }
    activeKeydownListener = (e) => {
      if (e.key === 'Escape') {
        closeModal();
      }
    };
    window.addEventListener('keydown', activeKeydownListener);
  } catch (err) {
    console.error('Error in showSpecialTileInfoModal:', err);
    if (!wasAlreadyPaused && scene) {
      scene.isPaused = false;
    }
    const backdropEl = document.getElementById('ore-info-backdrop');
    if (backdropEl) backdropEl.style.display = 'none';
  }
}
