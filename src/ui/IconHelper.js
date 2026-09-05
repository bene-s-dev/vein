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
  teleporter: 'navigation',
  depot: 'warehouse'
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
 * Spezifische Bezeichnungen und Icons für veredelte Erze (Schmelzofen / Raffinerie)
 */
export const REFINED_ORE_DATA = {
  coal: {
    key: 'bar_coal',
    rawKey: 'coal',
    name: 'Kohle-Brikett',
    type: 'brikett',
    iconName: 'box',
    desc: 'Hochenergetisches Brikett aus komprimierter Tiefenkohle.'
  },
  copper: {
    key: 'bar_copper',
    rawKey: 'copper',
    name: 'Kupfer-Barren',
    type: 'barren',
    iconName: 'layers',
    desc: 'Geschmolzener Feinkupfer-Barren für Elektronik.'
  },
  iron: {
    key: 'bar_iron',
    rawKey: 'iron',
    name: 'Eisen-Barren',
    type: 'barren',
    iconName: 'layers',
    desc: 'Hochfester Roheisen-Barren für Stahl und Maschinen.'
  },
  tin: {
    key: 'bar_tin',
    rawKey: 'tin',
    name: 'Zinn-Barren',
    type: 'barren',
    iconName: 'layers',
    desc: 'Reines Weichmetall für Bronze- und Lötlegierungen.'
  },
  silver: {
    key: 'bar_silver',
    rawKey: 'silver',
    name: 'Silber-Barren',
    type: 'barren',
    iconName: 'layers',
    desc: 'Feinsilber-Barren mit höchster elektrischer Leitfähigkeit.'
  },
  gold: {
    key: 'bar_gold',
    rawKey: 'gold',
    name: 'Gold-Barren',
    type: 'barren',
    iconName: 'layers',
    desc: 'Gegossener Feingold-Barren (99.9%) mit hohem Börsenwert.'
  },
  emerald: {
    key: 'bar_emerald',
    rawKey: 'emerald',
    name: 'Geschliffener Smaragd',
    type: 'gem',
    iconName: 'gem',
    desc: 'Präzise facettierter Edelstein von tiefer grüner Farbe.'
  },
  sapphire: {
    key: 'bar_sapphire',
    rawKey: 'sapphire',
    name: 'Geschliffener Saphir',
    type: 'gem',
    iconName: 'gem',
    desc: 'Hochreiner Saphir-Kristall für optische Scanner.'
  },
  ruby: {
    key: 'bar_ruby',
    rawKey: 'ruby',
    name: 'Geschliffener Rubin',
    type: 'gem',
    iconName: 'gem',
    desc: 'Laser-fokussierter Rubinkristall mit enormer Härte.'
  },
  diamond: {
    key: 'bar_diamond',
    rawKey: 'diamond',
    name: 'Brillant-Diamant',
    type: 'gem',
    iconName: 'sparkles',
    desc: 'Perfekt geschliffener Diamant mit maximaler Brillanz.'
  },
  titanium: {
    key: 'bar_titanium',
    rawKey: 'titanium',
    name: 'Titan-Barren',
    type: 'barren',
    iconName: 'layers',
    desc: 'Leichter, extrem zugfester Titanbarren für Panzerungen.'
  },
  platinum: {
    key: 'bar_platinum',
    rawKey: 'platinum',
    name: 'Platin-Barren',
    type: 'barren',
    iconName: 'layers',
    desc: 'Korrosionsfreies Edelmetall für Quanten-Komponenten.'
  },
  uranium: {
    key: 'bar_uranium',
    rawKey: 'uranium',
    name: 'Uran-Brennstab',
    type: 'fuel_rod',
    iconName: 'zap',
    desc: 'Angereicherter Nuklearbrennstab für Kraftwerke.'
  },
  obsidian_gem: {
    key: 'bar_obsidian_gem',
    rawKey: 'obsidian_gem',
    name: 'Obsidian-Kristall',
    type: 'crystal',
    iconName: 'disc',
    desc: 'Gehärtetes vulkanisches Tiefenglas von enormer Dichte.'
  },
  dark_matter: {
    key: 'bar_dark_matter',
    rawKey: 'dark_matter',
    name: 'Dunkelmaterie-Matrix',
    type: 'matrix',
    iconName: 'atom',
    desc: 'Stabilisierte Nullpunkt-Energie aus der tiefsten Schicht.'
  }
};

export function getRefinedOreName(oreKey) {
  const cleanKey = oreKey.startsWith('bar_') ? oreKey.replace('bar_', '') : oreKey;
  return REFINED_ORE_DATA[cleanKey]?.name || `${cleanKey}-Barren`;
}

/**
 * Erzeugt das Lucide "stone"-Icon in der individuellen Erzfarbe
 */
export function oreIcon(oreKey, size = 14, extraClass = '') {
  const cleanKey = oreKey.startsWith('bar_') ? oreKey.replace('bar_', '') : oreKey;
  const color = ORE_COLORS[cleanKey] || '#94a3b8';
  return `<i data-lucide="stone" class="lucide-icon ore-icon ore-icon-${cleanKey} ${extraClass}" style="width: ${size}px; height: ${size}px; display: inline-flex; vertical-align: middle; flex-shrink: 0; color: ${color}; stroke: ${color};"></i>`;
}

/**
 * Erzeugt das Icon für veredelte Erze (Barren, Brikett, Edelstein)
 */
export function refinedItemIcon(key, size = 14, extraClass = '') {
  const rawKey = key.startsWith('bar_') ? key.replace('bar_', '') : key;
  const color = ORE_COLORS[rawKey] || '#38bdf8';
  const data = REFINED_ORE_DATA[rawKey];
  const iconName = data ? data.iconName : 'layers';
  return `<i data-lucide="${iconName}" class="lucide-icon refined-icon ${extraClass}" style="width: ${size}px; height: ${size}px; display: inline-flex; vertical-align: middle; flex-shrink: 0; color: ${color}; stroke: ${color};"></i>`;
}

/**
 * Universeller Helfer: erkennt automatisch rohe Erze, veredelte Barren oder Fabrikprodukte
 */
export function itemDisplayIcon(key, size = 14, extraClass = '') {
  if (key.startsWith('bar_') || REFINED_ORE_DATA[key]) {
    return refinedItemIcon(key, size, extraClass);
  }
  if (ORE_COLORS[key]) {
    return oreIcon(key, size, extraClass);
  }
  return icon('box', extraClass, size);
}

