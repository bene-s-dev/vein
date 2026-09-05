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
  refinery: 'factory',
  drone_hangar: 'bot',
  powerplant: 'zap',
  teleporter: 'navigation'
};

/**
 * Individuelle Farbpalette für alle 15 Erze im Spiel
 */
export const ORE_COLORS = {
  coal: '#64748b',         // Kohle (Schiefergrau)
  copper: '#f59e0b',       // Kupfer (Bernstein/Kupfer)
  iron: '#94a3b8',         // Eisen (Stahlgrau)
  tin: '#cbd5e1',          // Zinn (Hellgrau/Silber)
  silver: '#f8fafc',       // Silber (Silberweiß)
  gold: '#fbbf24',         // Gold (Goldgelb)
  emerald: '#10b981',      // Smaragd (Smaragdgrün)
  sapphire: '#3b82f6',     // Saphir (Saphirblau)
  ruby: '#ef4444',         // Rubin (Rubinrot)
  diamond: '#38bdf8',      // Diamant (Cyan/Hellblau)
  titanium: '#818cf8',     // Titan (Indigo)
  platinum: '#e2e8f0',     // Platin (Platinweiß)
  uranium: '#84cc16',      // Uran (Neongrün)
  obsidian_gem: '#c084fc', // Obsidian-Kern (Violett)
  dark_matter: '#a855f7'   // Dunkelmaterie (Purpur)
};

/**
 * Erzeugt das Lucide "stone"-Icon in der individuellen Erzfarbe
 */
export function oreIcon(oreKey, size = 14, extraClass = '') {
  const color = ORE_COLORS[oreKey] || '#94a3b8';
  return `<i data-lucide="stone" class="lucide-icon ore-icon ore-icon-${oreKey} ${extraClass}" style="width: ${size}px; height: ${size}px; display: inline-flex; vertical-align: middle; flex-shrink: 0; color: ${color}; stroke: ${color};"></i>`;
}
