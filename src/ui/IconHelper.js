import { createIcons, icons } from 'lucide';

/**
 * IconHelper.js
 * Zentraler Helfer für Lucide-Icons im gesamten Spiel.
 * Ersetzt alle Emojis durch gestochen scharfe, moderne SVG-Vektoricons.
 */

export function refreshIcons(root = document) {
  if (typeof document === 'undefined') return;
  try {
    createIcons({
      icons,
      nameAttr: 'data-lucide',
      attrs: {
        'stroke-width': '2.2',
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round'
      }
    });
  } catch (err) {
    console.warn('Lucide icon refresh warning:', err);
  }
}

/**
 * Gibt ein Icon-Tag zurück, das beim Rendern via refreshIcons() automatisch in SVG konvertiert wird.
 */
export function icon(name, extraClass = '', size = 15) {
  return `<i data-lucide="${name}" class="lucide-icon ${extraClass}" style="width: ${size}px; height: ${size}px; display: inline-flex; vertical-align: middle; flex-shrink: 0;"></i>`;
}

/**
 * Icon-Zuweisung für Bauteile
 */
export const COMPONENT_ICONS = {
  hydraulic_part: 'cog',
  titan_alloy: 'shield-check',
  laser_lens: 'disc',
  quantum_chip: 'atom'
};

/**
 * Icon-Zuweisung für Gebäude
 */
export const BUILDING_ICONS = {
  hangar: 'wrench',
  market: 'coins',
  geologist: 'microscope',
  lab: 'cpu',
  refinery: 'flame',
  drone_hangar: 'bot',
  powerplant: 'zap',
  teleporter: 'navigation'
};
