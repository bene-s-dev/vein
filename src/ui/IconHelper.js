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
  // Alte Sammler-Bauteile (Forschungskosten im Labor)
  hydraulic_part: 'cog',
  titan_alloy: 'shield-check',
  laser_lens: 'disc',
  quantum_chip: 'atom',
  // Neue Fabrik-Montage-Bauteile (für Hangar-Montage)
  iron_tube: 'pipe',
  bronze_gear: 'settings',
  silver_coil: 'rotate-ccw',
  crystal_lens: 'aperture',
  titan_bolt: 'bolt',
  quantum_core: 'orbit'
};

/**
 * Icon-Zuweisung für Gebäude
 */
export const BUILDING_ICONS = {
  hangar: 'wrench',
  market: 'coins',
  office: 'laptop-minimal',
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
  coal: '#475569',         // Kohle (Dunkles Anthrazit / Kohleschwarz-Kontur)
  copper: '#ea580c',       // Kupfer (Kupferrot / Echtes Kupfer, kein Gelb)
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
 * Harmonische Innenfüllfarben für die Roherz-Steine (Stone-Icon)
 */
export const ORE_FILL_COLORS = {
  coal: '#090d16',         // Kohle (Tiefschwarz / Pechkohle)
  copper: '#7c2d12',       // Kupfer (Tiefes Kupferrotbraun)
  iron: '#475569',         // Eisen (Industrielles Stahlgrau)
  tin: '#64748b',          // Zinn (Hellgraues Zinn)
  silver: '#64748b',       // Silber (Edles Feinsilber)
  gold: '#b45309',         // Gold (Tiefes Goldbraun)
  emerald: '#065f46',      // Smaragd (Dunkles Smaragdgrün)
  sapphire: '#1e40af',     // Saphir (Tiefes Saphirblau)
  ruby: '#991b1b',         // Rubin (Dunkles Rubinrot)
  diamond: '#0369a1',      // Diamant (Funkelndes Tiefcyan)
  titanium: '#3730a3',     // Titan (Tiefes Titan-Indigo)
  platinum: '#475569',     // Platin (Edles Platingrau)
  uranium: '#3f6212',      // Uran (Giftiges Tiefgrün)
  obsidian_gem: '#581c87', // Obsidian (Tiefes Obsidianviolett)
  dark_matter: '#3b0764'   // Dunkelmaterie (Kosmisches Dunkelpurpur)
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
 * Erzeugt das Lucide "stone"-Icon in der individuellen Erzfarbe mit passender Innenfüllung.
 * Das Stone-Icon ist strikt für Roherze reserviert!
 */
export function oreIcon(oreKey, size = 14, extraClass = '') {
  const cleanKey = oreKey.startsWith('bar_') ? oreKey.replace('bar_', '') : oreKey;
  const strokeColor = ORE_COLORS[cleanKey] || '#94a3b8';
  const fillColor = ORE_FILL_COLORS[cleanKey] || 'rgba(148, 163, 184, 0.4)';
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${strokeColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide-icon ore-icon ore-icon-${cleanKey} ${extraClass}" style="width: ${size}px; height: ${size}px; display: inline-flex; vertical-align: middle; flex-shrink: 0;">
      <path d="M11.264 2.205A4 4 0 0 0 6.42 4.211l-4 8a4 4 0 0 0 1.359 5.117l6 4a4 4 0 0 0 4.438 0l6-4a4 4 0 0 0 1.576-4.592l-2-6a4 4 0 0 0-2.53-2.53z" fill="${fillColor}" />
      <path d="M11.99 22 14 12l7.822 3.184" fill="none" />
      <path d="M14 12 8.47 2.302" fill="none" />
    </svg>
  `.trim();
}

/**
 * Spezielles 3D-Metallbarren Vektor-Icon für alle geschmolzenen Barren (Kupfer-Barren, Eisen-Barren etc.)
 * 1:1 an den isometrischen Stil und die visuelle Identität der Stone-Icons angepasst (ohne Lücken).
 */
export function ingotIcon(strokeColor = '#f59e0b', size = 14, extraClass = '', fillColor = null) {
  const actualFill = fillColor || (strokeColor.startsWith('#') ? strokeColor + '40' : strokeColor);
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${strokeColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide-icon ingot-icon ${extraClass}" style="width: ${size}px; height: ${size}px; display: inline-flex; vertical-align: middle; flex-shrink: 0;">
      <!-- Barren-Hauptkörper (geschlossene Geometrie im 3D-Winkel des Stone-Icons) -->
      <path d="M9.5 4.5 L18 8 L21 13.5 L13 19.5 L3 14.5 L5.5 9 Z" fill="${actualFill}" />
      <!-- Oberseite mit dezentem metallischem Glanz -->
      <path d="M9.5 4.5 L18 8 L13 12 L5.5 9 Z" fill="#ffffff" fill-opacity="0.16" />
      <!-- Innere Facettenlinien -->
      <path d="M5.5 9 L13 12 L18 8" fill="none" />
      <path d="M13 12 L13 19.5" fill="none" />
    </svg>
  `.trim();
}

/**
 * Erzeugt das Icon für veredelte Erze (Barren, Brikett, Edelstein)
 */
export function refinedItemIcon(key, size = 14, extraClass = '') {
  const rawKey = key.startsWith('bar_') ? key.replace('bar_', '') : key;
  const color = ORE_COLORS[rawKey] || '#38bdf8';
  const fillColor = ORE_FILL_COLORS[rawKey] || 'rgba(148, 163, 184, 0.4)';
  const data = REFINED_ORE_DATA[rawKey];
  if (data?.type === 'barren') {
    return ingotIcon(color, size, extraClass, fillColor);
  }
  const iconName = data ? data.iconName : 'layers';
  return `<i data-lucide="${iconName}" class="lucide-icon refined-icon ${extraClass}" style="width: ${size}px; height: ${size}px; display: inline-flex; vertical-align: middle; flex-shrink: 0; color: ${color}; stroke: ${color};"></i>`;
}

export const FACTORY_PRODUCT_ICONS = {
  steel_beam: 'circle-pile',
  bronze_ingot: 'layers',
  circuit_board: 'cpu',
  polished_gem: 'gem',
  titan_plate: 'shield',
  fusion_rod: 'flame'
};

/**
 * Universeller Helfer: erkennt automatisch rohe Erze, veredelte Barren oder Fabrikprodukte.
 * Rohe Steine erhalten immer das gefüllte Lucide "stone"-Icon.
 * Verarbeitete Steine (bar_*) erhalten entsprechende Barren-, Brikett- oder Edelstein-Symbole.
 */
export function itemDisplayIcon(key, size = 14, extraClass = '') {
  if (key.startsWith('bar_')) {
    return refinedItemIcon(key, size, extraClass);
  }
  if (key === 'bronze_ingot') {
    return ingotIcon('#d97706', size, extraClass, '#92400e');
  }
  if (FACTORY_PRODUCT_ICONS[key]) {
    return icon(FACTORY_PRODUCT_ICONS[key], extraClass, size);
  }
  if (ORE_COLORS[key]) {
    return oreIcon(key, size, extraClass);
  }
  return icon('box', extraClass, size);
}

/**
 * Minimalistisches Lucide-Style Vektor-Icon für das Bohrer-Fahrzeug.
 * Einheitlich wie alle Lucide-Icons (24x24 viewBox, stroke="currentColor", stroke-width="2",
 * minimalistische Linienführung mit Kettenlaufwerk, Fahrerkabine und Bohrkegel).
 */
export function drillerVehicleIcon(size = 24, extraClass = '') {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide-icon driller-vehicle-icon ${extraClass}" style="display: inline-flex; vertical-align: middle; flex-shrink: 0;">
      <!-- Kettenlaufwerk unten mit Rollenpunkten -->
      <rect x="2" y="15" width="13" height="5" rx="2.5" />
      <path d="M6 17.5h.01M10 17.5h.01" />
      <!-- Chassis & Fahrerkabine -->
      <path d="M4 15V8.5A1.5 1.5 0 0 1 5.5 7h4l3.5 4.5v3.5" />
      <!-- Cockpit-Sichtfenster -->
      <path d="M7 10h2.5" />
      <!-- Bohrkegel & Schneidwendel -->
      <path d="M14 8.5L21.5 12 14 15.5Z" />
      <path d="M17.5 10.2L18.5 13.8" />
    </svg>
  `;
}

