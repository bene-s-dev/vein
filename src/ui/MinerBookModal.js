import { ORE_DATA } from '../core/GridSystem.js';
import { soundFx } from '../core/SoundEffects.js';
import { icon, refreshIcons, oreIcon, itemDisplayIcon } from './IconHelper.js';
import { closeActiveModal } from '../core/BaseSystem.js';
import { SPECIAL_TILE_DATA, showGoodsInfoModal } from './OreInfoModal.js';

export const ORE_DESCRIPTIONS = {
  coal: 'Fossiler Kohlenstoff aus den oberen Schichten. Solide Einnahmequelle für den Einstieg und elementarer Brennstoff für Schmelzöfen.',
  copper: 'Weiches, rötliches Leitmetall. Leicht abzubauen und ideal für die ersten Basis-Upgrades und Bronze-Legierungen.',
  iron: 'Essentielles Baumetall aus der Schieferschicht. Hohe Festigkeit und unverzichtbar für Werkstatt-Umbauten und Stahlträger.',
  tin: 'Silbrig glänzendes Metall. Zusammen mit Kupfer der Grundstein zur Schmelze hochwertiger Bronze-Barren.',
  silver: 'Edles Glanzmetall mit exzellenter Leitfähigkeit. Tief im dichten Granitgestein für Präzisionselektronik verborgen.',
  gold: 'Schweres, hochkarätiges Edelmetall. Äußerst wertvoll an der Börse und für High-Tech Leiterplatinen.',
  emerald: 'Leuchtend grüner Beryllkristall. Entsteht unter gewaltigem Druck in der vulkanischen Obsidian-Zone.',
  sapphire: 'Tiefblauer Korund-Kristall mit enormer Härte. Sehr begehrt bei Forschern und Sammlern.',
  ruby: 'Feuerroter Chrom-Kristall mit starker Lichtbrechung. Erzielt absolute Spitzenpreise auf dem Markt.',
  diamond: 'Härtester natürlicher Kohlenstoffkristall. Unverzichtbar für Schmuckdiamanten und schwerste Bohrspitzen.',
  titanium: 'Ultraleichtes und extrem zähes Raumfahrt-Metall. Widersteht dem extremen Druck tiefster Schachtkerne.',
  platinum: 'Sehr dichtes, korrosionsbeständiges Edelmetall mit unvergleichlich hohem Marktwert.',
  uranium: 'Schweres radioaktives Isotop mit energetischem Glimmen. Treibt künftige Fusions-Generatoren an.',
  obsidian_gem: 'Vulkanisches Glas mit kosmischem Kern. Bildet sich erst nahe dem geschmolzenen Planetenkern.',
  dark_matter: 'Rätselhafte Energiepartikel aus den tiefsten Schichten der Erde. Höchster Marktwert im gesamten Minensektor.'
};

export const GEOLOGICAL_LAYERS = [
  {
    id: 'humus',
    name: 'Humus',
    depthRange: '0 – 50 m',
    minDepth: 0,
    baseHardness: '48 HP',
    hardnessMultiplier: '1.0x (Basis)',
    color: '#d97706',
    ores: ['coal', 'copper', 'iron'],
    report: 'Die oberste Erdschicht aus weichem Humus und Lehm. Jeder Einsteigerbohrer dringt hier mühelos vor. Ausgezeichnete Fundstelle für Kohle, frühe Kupferadern und ab 18m Tiefe die ersten Eisenerzvorkommen.'
  },
  {
    id: 'schist',
    name: 'Schiefer',
    depthRange: '50 – 180 m',
    minDepth: 50,
    baseHardness: '160 HP',
    hardnessMultiplier: '3.3x zäher',
    color: '#64748b',
    ores: ['iron', 'tin', 'silver'],
    report: 'Dicht gelagertes Schiefergestein unter spürbarem Gebirgsdruck. Die Bohrkopf-Reibung steigt markant an. Liefert fundamentale Eisen- und Zinnerze (ab 65m) sowie im unteren Bereich erste Silberadern (ab 130m).'
  },
  {
    id: 'granite',
    name: 'Granit',
    depthRange: '180 – 480 m',
    minDepth: 180,
    baseHardness: '320 HP',
    hardnessMultiplier: '6.7x zäher',
    color: '#38bdf8',
    ores: ['silver', 'gold', 'emerald'],
    report: 'Massives magmatisches Tiefengestein. Einfache Bohrer blockieren hier regelmäßig. Verlangt aufgerüstete Triebwerke und gehärtete Spitzen. Belohnt Expeditionen mit Silber, reinem Gold (ab 220m) und seltenen Smaragden (ab 340m).'
  },
  {
    id: 'obsidian',
    name: 'Obsidian',
    depthRange: '480 – 950 m',
    minDepth: 480,
    baseHardness: '600 HP',
    hardnessMultiplier: '12.5x zäher',
    color: '#a855f7',
    ores: ['sapphire', 'ruby', 'diamond'],
    report: 'Vulkanisches Glas und ultra-dichter Basalt unter titanischen Drücken. Hier entstehen die edelsten kristallinen Schätze der Erde: Tiefblaue Saphire (ab 480m), Rubine (ab 650m) und kostbare Diamanten (ab 850m).'
  },
  {
    id: 'core',
    name: 'Urgestein',
    depthRange: '> 950 m',
    minDepth: 950,
    baseHardness: '1100 – 1800 HP',
    hardnessMultiplier: '23x – 37x zäher',
    color: '#ef4444',
    ores: ['titanium', 'platinum', 'uranium', 'obsidian_gem', 'dark_matter'],
    report: 'Die geologische Kernzone des Planeten. Glühende Hitze, tektonische Strahlung und unbegreifliche Gesteinsdichte. Beherbergt Titan (ab 1050m), Platin (ab 1250m), Uran (ab 1400m), Obsidian-Kerne (ab 1550m) und exotische Dunkelmaterie (ab 1700m).'
  }
];

export const BOOK_PRODUCTS = [
  // ── 1. Schmelz-Barren (Schmelzofen in der Basis) ──
  {
    id: 'bar_coal',
    name: 'Kohle-Brikett',
    category: 'bar',
    categoryLabel: 'Schmelzofen',
    value: 29,
    req: '1x Kohle (im Schmelzofen)',
    desc: 'Gepresster, hochreiner Kohlenstoff mit maximaler Brenndauer für Prozesshitze.'
  },
  {
    id: 'bar_copper',
    name: 'Kupfer-Barren',
    category: 'bar',
    categoryLabel: 'Schmelzofen',
    value: 53,
    req: '1x Kupfer (im Schmelzofen)',
    desc: 'Feingegossenes Elektrokupfer für Schaltkreise, Spulen und Legierungen.'
  },
  {
    id: 'bar_iron',
    name: 'Eisen-Barren',
    category: 'bar',
    categoryLabel: 'Schmelzofen',
    value: 88,
    req: '1x Eisen (im Schmelzofen)',
    desc: 'Veredeltes Schmiedeeisen für Gerüste, Werkstatt-Umbauten und Träger.'
  },
  {
    id: 'bar_tin',
    name: 'Zinn-Barren',
    category: 'bar',
    categoryLabel: 'Schmelzofen',
    value: 122,
    req: '1x Zinn (im Schmelzofen)',
    desc: 'Weiches Glanzmetall zur Veredelung robuster Bronze-Legierungen.'
  },
  {
    id: 'bar_silver',
    name: 'Silber-Barren',
    category: 'bar',
    categoryLabel: 'Schmelzofen',
    value: 200,
    req: '1x Silber (im Schmelzofen)',
    desc: 'Sterlingsilber für Sensorik und hochleitende Induktionsspulen.'
  },
  {
    id: 'bar_gold',
    name: 'Gold-Barren',
    category: 'bar',
    categoryLabel: 'Schmelzofen',
    value: 345,
    req: '1x Gold (im Schmelzofen)',
    desc: '999er Feingoldbarren. Höchst geschätzt an der Erzbörse und für Kontakte.'
  },
  {
    id: 'bar_titanium',
    name: 'Titan-Barren',
    category: 'bar',
    categoryLabel: 'Schmelzofen',
    value: 3200,
    req: '1x Titan (im Schmelzofen)',
    desc: 'Raumfahrt-zertifizierter Titanblock für schwerste Tiefenrümpfe.'
  },
  {
    id: 'bar_platinum',
    name: 'Platin-Barren',
    category: 'bar',
    categoryLabel: 'Schmelzofen',
    value: 5100,
    req: '1x Platin (im Schmelzofen)',
    desc: 'Das edelste aller Metalle. Korrosionsfrei und extrem wertvoll an der Börse.'
  },

  // ── 2. Industrielle Handelsgüter (Fabrik: hoher Börsenverkauf) ──
  {
    id: 'steel_beam',
    name: 'Stahlträger',
    category: 'goods',
    categoryLabel: 'Fabrik · Handelsgut',
    value: 280,
    req: '2x Eisen + 2x Kohle (Fabrik)',
    desc: 'Schwerer Industriestahl für Schachtgerüste und Maschinensockel.'
  },
  {
    id: 'bronze_ingot',
    name: 'Bronze-Barren',
    category: 'goods',
    categoryLabel: 'Fabrik · Handelsgut',
    value: 360,
    req: '2x Kupfer + 1x Zinn (Fabrik)',
    desc: 'Korrosionsfreie Legierung für Antriebszahnräder und Motoren.'
  },
  {
    id: 'circuit_board',
    name: 'Elektronik-Platine',
    category: 'goods',
    categoryLabel: 'Fabrik · Handelsgut',
    value: 1150,
    req: '2x Kupfer + 1x Zinn + 1x Gold (Fabrik)',
    desc: 'Präzisions-Leiterplatte mit Zinn-Lötbahnen und Gold-Kontakten.'
  },
  {
    id: 'sapphire_glass',
    name: 'Saphir-Panzerglas',
    category: 'goods',
    categoryLabel: 'Fabrik · Handelsgut',
    value: 2300,
    req: '2x Saphir + 1x Silber (Fabrik)',
    desc: 'Kratzfestes und hochdruckstabiles Panzerglas aus Saphirkristallen.'
  },
  {
    id: 'polished_gem',
    name: 'Schmuck-Diamant',
    category: 'goods',
    categoryLabel: 'Fabrik · Handelsgut',
    value: 4400,
    req: '1x Smaragd + 1x Rubin + 1x Diamant (Fabrik)',
    desc: 'Präzisionsgeschliffener Dreifach-Edelstein für Luxus und Hochleistungs-Laser.'
  },
  {
    id: 'titan_plate',
    name: 'Titan-Panzerung',
    category: 'goods',
    categoryLabel: 'Fabrik · Handelsgut',
    value: 9800,
    req: '2x Titan + 1x Diamant (Fabrik)',
    desc: 'Verbundpanzerung für den Vorstoß in tiefste Basaltzonen.'
  },
  {
    id: 'obsidian_matrix',
    name: 'Obsidian-Superleiter',
    category: 'goods',
    categoryLabel: 'Fabrik · Handelsgut',
    value: 19500,
    req: '1x Obsidian-Kern + 2x Platin (Fabrik)',
    desc: 'Hochdichte vulkanische Kristallmatrix für extremste Energiedichten.'
  },
  {
    id: 'fusion_rod',
    name: 'Quanten-Brennstab',
    category: 'goods',
    categoryLabel: 'Fabrik · Handelsgut',
    value: 32000,
    req: '2x Uran + 1x Dunkelmaterie (Fabrik)',
    desc: 'Ultimative Fusions-Energiequelle mit astronomischem Erlös an der Börse.'
  },

  // ── 3. Fabrik-Montagebauteile (Für Fahrzeug- & Bohrer-Upgrades) ──
  {
    id: 'iron_tube',
    name: 'Stahl-Rohr',
    category: 'component',
    categoryLabel: 'Fabrik · Bauteil',
    value: 0,
    usage: 'Tier-2-Fahrzeugmodule (Hangar)',
    req: '2x Eisen + 1x Kupfer (Fabrik)',
    desc: 'Nahtlos gezogenes Hochdruckrohr für Tank- und Triebwerksleitungen.'
  },
  {
    id: 'bronze_gear',
    name: 'Bronze-Getriebe',
    category: 'component',
    categoryLabel: 'Fabrik · Bauteil',
    value: 0,
    usage: 'Tier-3-Fahrzeugmodule (Hangar)',
    req: '2x Zinn + 1x Eisen (Fabrik)',
    desc: 'Präzisionszahnrad für Schaltung und Antriebsübersetzung.'
  },
  {
    id: 'silver_coil',
    name: 'Silber-Spule',
    category: 'component',
    categoryLabel: 'Fabrik · Bauteil',
    value: 0,
    usage: 'Tier-4-5-Fahrzeugmodule (Hangar)',
    req: '2x Silber + 1x Gold (Fabrik)',
    desc: 'Induktionsspule mit hoher Leitfähigkeit für Scanner und Bordcomputer.'
  },
  {
    id: 'crystal_lens',
    name: 'Kristall-Linse',
    category: 'component',
    categoryLabel: 'Fabrik · Bauteil',
    value: 0,
    usage: 'Tier-6-7-Fahrzeugmodule (Hangar)',
    req: '1x Saphir + 1x Smaragd (Fabrik)',
    desc: 'Prismatisch geschliffene Linse für Tiefenscanner und Laseroptik.'
  },
  {
    id: 'titan_bolt',
    name: 'Titan-Bolzen',
    category: 'component',
    categoryLabel: 'Fabrik · Bauteil',
    value: 0,
    usage: 'Tier-8-9-Fahrzeugmodule (Hangar)',
    req: '2x Titan + 1x Platin (Fabrik)',
    desc: 'Zugfeste Schwerlast-Gewindebolzen für gigantische Druckrümpfe.'
  },
  {
    id: 'quantum_core',
    name: 'Quanten-Kern',
    category: 'component',
    categoryLabel: 'Fabrik · Bauteil',
    value: 0,
    usage: 'Tier-10-Fahrzeugmodule (Hangar)',
    req: '1x Uran + 1x Obsidian-Kern (Fabrik)',
    desc: 'Subatomarer Magnetfeld-Kern für ultimative Tiefseebohrungen.'
  },

  // ── 4. Geologen-Spezialelektronik (Aufträge beim Geologen) ──
  {
    id: 'microprocessor',
    name: 'Mikroprozessor',
    category: 'research',
    categoryLabel: 'Geologe · Elektronik',
    value: 0,
    usage: 'Tier-2-Fahrzeugmodule (Hangar)',
    req: 'Geologen-Auftrag: 3x Kohle + 2x Eisen',
    desc: 'Hochintegrierter Silizium-Rechenchip für verbesserte Motor- und Tanksteuerung.'
  },
  {
    id: 'capacitor',
    name: 'Druck-Kondensator',
    category: 'research',
    categoryLabel: 'Geologe · Elektronik',
    value: 0,
    usage: 'Tier-3-Fahrzeugmodule (Hangar)',
    req: 'Geologen-Auftrag: 3x Kupfer + 3x Zinn',
    desc: 'Kompakter Puffer-Energiespeicher für Spitzenlasten der Schubeinheit.'
  },
  {
    id: 'spectrometer',
    name: 'Sensor-Spektrometer',
    category: 'research',
    categoryLabel: 'Geologe · Elektronik',
    value: 0,
    usage: 'Tier-4-5-Fahrzeugmodule (Hangar)',
    req: 'Geologen-Auftrag: 3x Silber + 2x Gold',
    desc: 'Präzisions-Sensoreinheit zur Echtzeit-Analyse von Erzadern und Gestein.'
  },
  {
    id: 'plasma_regulator',
    name: 'Plasma-Injektor',
    category: 'research',
    categoryLabel: 'Geologe · Elektronik',
    value: 0,
    usage: 'Tier-6-7-Fahrzeugmodule (Hangar)',
    req: 'Geologen-Auftrag: 2x Smaragd + 2x Saphir',
    desc: 'Thermodynamischer Injektor zur Erhitzung von Tiefen-Schneidköpfen.'
  },
  {
    id: 'graviton_core',
    name: 'Gravitations-Modulator',
    category: 'research',
    categoryLabel: 'Geologe · Elektronik',
    value: 0,
    usage: 'Tier-8-9-Fahrzeugmodule (Hangar)',
    req: 'Geologen-Auftrag: 2x Titan + 1x Diamant',
    desc: 'Feldmodulator zur Reduktion des Eigengewichts bei massiven Bohrerpanzern.'
  },
  {
    id: 'quantum_processor',
    name: 'Quanten-Prozessor',
    category: 'research',
    categoryLabel: 'Geologe · Elektronik',
    value: 0,
    usage: 'Tier-10-Fahrzeugmodule (Hangar)',
    req: 'Geologen-Auftrag: 2x Uran + 1x Platin',
    desc: 'Subatomarer Quanten-Rechner zur Koordination der Kernantriebs-Systeme.'
  }
];

export class MinerBookModal {
  constructor(scene, player) {
    this.scene = scene;
    this.player = player;
    this.activeTab = 'ores';
    this.productsSubFilter = 'all';
    this.layerSubTab = 'zones';
  }

  open(tab = 'ores') {
    this.activeTab = tab;
    soundFx.stopAllLoops?.();
    if (this.scene) this.scene.isPaused = true;
    soundFx.playClick();
    this.render();
  }

  close() {
    closeActiveModal(this.scene);
  }

  getDiscoveryStats() {
    const allOres = Object.keys(ORE_DATA);
    const discoveredOresCount = allOres.filter(k => this.player.isOreDiscovered(k)).length;

    const highestDepth = this.player.highestDepthReached || 0;
    const unlockedLayersCount = GEOLOGICAL_LAYERS.filter(l => highestDepth >= l.minDepth).length;

    const discoveredProductsCount = BOOK_PRODUCTS.filter(p => this.player.isProductDiscovered(p.id)).length;

    const totalDiscoverables = allOres.length + GEOLOGICAL_LAYERS.length + BOOK_PRODUCTS.length;
    const totalDiscovered = discoveredOresCount + unlockedLayersCount + discoveredProductsCount;
    const progressPercent = Math.min(100, Math.round((totalDiscovered / totalDiscoverables) * 100));

    return {
      allOresCount: allOres.length,
      discoveredOresCount,
      totalLayersCount: GEOLOGICAL_LAYERS.length,
      unlockedLayersCount,
      totalProductsCount: BOOK_PRODUCTS.length,
      discoveredProductsCount,
      totalDiscoverables,
      totalDiscovered,
      progressPercent
    };
  }

  render() {
    const modalEl = document.getElementById('building-modal');
    const titleEl = document.getElementById('modal-title');
    const bodyEl = document.getElementById('modal-body');
    if (!modalEl || !titleEl || !bodyEl) return;

    const stats = this.getDiscoveryStats();

    // Titel mit Logbuch-Icon
    titleEl.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px; color: #fbbf24;">
        ${icon('book-open', '', 18)}
        <span style="font-weight: 800; letter-spacing: 0.5px;">BERGMANN-BUCH</span>
      </div>
    `;

    // Tabs (ohne (Y/X)-Zähler in den Reitern, um Überlappungen zu verhindern)
    const tabs = [
      { id: 'ores', label: 'Erze', icon: 'gem' },
      { id: 'layers', label: 'Schichten', icon: 'mountain' },
      { id: 'products', label: 'Waren', icon: 'factory' },
      { id: 'codex', label: 'Infos', icon: 'info' }
    ];

    const tabButtonsHtml = tabs.map(t => {
      const isActive = this.activeTab === t.id;
      return `
        <button class="register-tab book-tab-btn ${isActive ? 'active' : ''}" data-tab="${t.id}">
          ${icon(t.icon, '', 13)}
          <span>${t.label}</span>
        </button>
      `;
    }).join('');

    let contentHtml = '';
    if (this.activeTab === 'ores') {
      contentHtml = this.renderOresTab();
    } else if (this.activeTab === 'layers') {
      contentHtml = this.renderLayersTab();
    } else if (this.activeTab === 'products') {
      contentHtml = this.renderProductsTab();
    } else if (this.activeTab === 'codex') {
      contentHtml = this.renderCodexTab();
    }

    bodyEl.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 12px; max-width: 650px; margin: 0 auto; width: 100%; box-sizing: border-box; padding: 0 4px 36px 4px;">
        <!-- Zurück & Fortschritts-Kopf -->
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
          <button id="btn-book-back" class="btn-action" style="height: 32px; padding: 0 14px; font-size: 11.5px; display: inline-flex; align-items: center; gap: 6px; border: none; border-radius: 8px;">
            ${icon('arrow-left', '', 14)}
            <span>Zurück zum Spielmenü</span>
          </button>

          <!-- Gesamt-Fortschrittsbalken -->
          <div style="display: flex; align-items: center; gap: 8px; font-size: 11.5px; font-weight: 700; color: #94a3b8;">
            <span>Entdeckt: <strong style="color: #fbbf24;">${stats.totalDiscovered} / ${stats.totalDiscoverables}</strong> (${stats.progressPercent}%)</span>
            <div style="width: 80px; height: 6px; background: rgba(0,0,0,0.6); border-radius: 99px; overflow: hidden;">
              <div style="width: ${stats.progressPercent}%; height: 100%; background: linear-gradient(90deg, #f59e0b, #10b981); border-radius: 99px; transition: width 0.3s ease;"></div>
            </div>
          </div>
        </div>

        <!-- Kapitel-Tabs & Inhalt -->
        <div class="register-tab-container" style="display: flex; flex-direction: column; width: 100%; gap: 0 !important; row-gap: 0 !important;">
          <div class="register-tab-bar" style="width: 100%;">
            ${tabButtonsHtml}
          </div>
          <div class="register-tab-panel">
            ${contentHtml}
          </div>
        </div>
      </div>
    `;

    modalEl.style.display = 'flex';
    refreshIcons(modalEl);

    // Spezialformationen & Gefahren Canvases zeichnen
    if (this.activeTab === 'layers' && this.layerSubTab === 'hazards') {
      Object.entries(SPECIAL_TILE_DATA).forEach(([key, data]) => {
        const can = document.getElementById(`canvas-spec-${key}`);
        if (can && this.scene && this.scene.textures && this.scene.textures.exists(data.sprite)) {
          const img = this.scene.textures.get(data.sprite).getSourceImage();
          if (img) {
            const ctx = can.getContext('2d');
            ctx.clearRect(0, 0, 32, 32);
            ctx.drawImage(img, 0, 0, 32, 32);
          }
        }
      });
    }

    // Tab-Klicks binden
    modalEl.querySelectorAll('.book-tab-btn').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const tab = btn.getAttribute('data-tab');
        if (tab && tab !== this.activeTab) {
          this.activeTab = tab;
          soundFx.playClick();
          this.render();
        }
      };
    });

    // Sub-Filter Klicks im Schichten-Tab binden (Tiefenschichten vs Gesteine & Gefahren)
    modalEl.querySelectorAll('.layer-subfilter-btn').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const filter = btn.getAttribute('data-layer-tab');
        if (filter && filter !== this.layerSubTab) {
          this.layerSubTab = filter;
          soundFx.playClick();
          this.render();
        }
      };
    });

    // Sub-Filter Klicks im Waren-Tab binden
    modalEl.querySelectorAll('.product-subfilter-btn').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const filter = btn.getAttribute('data-filter');
        if (filter && filter !== this.productsSubFilter) {
          this.productsSubFilter = filter;
          soundFx.playClick();
          this.render();
        }
      };
    });

    // Klick auf entdeckte Waren öffnet das minimalistische Info-Modal
    modalEl.querySelectorAll('.book-product-card').forEach(card => {
      card.onclick = (e) => {
        e.stopPropagation();
        const key = card.getAttribute('data-key');
        if (key) {
          showGoodsInfoModal(key, this.scene);
        }
      };
    });

    // Zurück zum Spielmenü
    const btnBack = document.getElementById('btn-book-back');
    if (btnBack) {
      btnBack.onclick = (e) => {
        e.stopPropagation();
        soundFx.playClick();
        if (this.scene && this.scene.hud) {
          this.scene.hud.openPauseMenu();
        } else {
          this.close();
        }
      };
    }
  }

  renderOresTab() {
    const ores = Object.entries(ORE_DATA);
    let html = '';

    for (const [key, data] of ores) {
      const isDiscovered = this.player.isOreDiscovered(key);
      const desc = ORE_DESCRIPTIONS[key] || 'Ein wertvolles Mineral aus den Tiefen des Schachts.';

      if (isDiscovered) {
        html += `
          <div style="background: rgba(30, 41, 59, 0.85); border: 1px solid rgba(255, 255, 255, 0.14); border-radius: 12px; padding: 14px 16px; display: flex; flex-direction: column; gap: 6px; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 6px;">
              <div style="display: flex; align-items: center; gap: 8px;">
                ${oreIcon(key, 22)}
                <strong style="color: #ffffff; font-size: 14px; font-weight: 800; letter-spacing: 0.3px;">${data.name.toUpperCase()}</strong>
              </div>
              <div style="display: flex; gap: 6px; font-size: 11px;">
                <span style="background: rgba(251, 191, 36, 0.16); border: 1px solid rgba(251, 191, 36, 0.35); color: #fbbf24; font-weight: 800; padding: 2px 8px; border-radius: 6px;">+€${data.value}</span>
                <span style="background: rgba(56, 189, 248, 0.16); border: 1px solid rgba(56, 189, 248, 0.35); color: #38bdf8; font-weight: 800; padding: 2px 8px; border-radius: 6px;">ab ${data.minDepth}m</span>
                <span style="background: rgba(255, 255, 255, 0.10); border: 1px solid rgba(255, 255, 255, 0.16); color: #f8fafc; font-weight: 700; padding: 2px 8px; border-radius: 6px;">${data.hardness}x Härte</span>
              </div>
            </div>
            <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #e2e8f0;">
              ${desc}
            </p>
          </div>
        `;
      } else {
        html += `
          <div style="background: rgba(15, 23, 42, 0.35); border-radius: 10px; padding: 10px 14px; display: flex; align-items: center; gap: 8px; opacity: 0.6;">
            <span style="display: inline-flex; align-items: center; justify-content: center; color: #64748b;">
              ${icon('lock', '', 15)}
            </span>
            <span style="color: #64748b; font-size: 13px; font-weight: 700;">?</span>
          </div>
        `;
      }
    }

    return html;
  }

  renderLayersTab() {
    const highestDepth = this.player.highestDepthReached || 0;
    const currentSub = this.layerSubTab || 'zones';

    const subFilterHtml = `
      <div style="display: flex; gap: 6px; width: 100%; overflow-x: auto; padding-bottom: 4px; margin-bottom: 6px;">
        <button class="layer-subfilter-btn ${currentSub === 'zones' ? 'active' : ''}" data-layer-tab="zones" style="
          padding: 4px 12px;
          font-size: 11px;
          font-weight: 700;
          border-radius: 6px;
          border: 1px solid ${currentSub === 'zones' ? '#38bdf8' : 'rgba(255,255,255,0.08)'};
          background: ${currentSub === 'zones' ? 'rgba(56, 189, 248, 0.18)' : 'rgba(15, 23, 42, 0.5)'};
          color: ${currentSub === 'zones' ? '#38bdf8' : '#94a3b8'};
          cursor: pointer;
          white-space: nowrap;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        ">
          ${icon('mountain', '', 12)}
          <span>Tiefenschichten</span>
        </button>
        <button class="layer-subfilter-btn ${currentSub === 'hazards' ? 'active' : ''}" data-layer-tab="hazards" style="
          padding: 4px 12px;
          font-size: 11px;
          font-weight: 700;
          border-radius: 6px;
          border: 1px solid ${currentSub === 'hazards' ? '#f59e0b' : 'rgba(255,255,255,0.08)'};
          background: ${currentSub === 'hazards' ? 'rgba(245, 158, 11, 0.18)' : 'rgba(15, 23, 42, 0.5)'};
          color: ${currentSub === 'hazards' ? '#f59e0b' : '#94a3b8'};
          cursor: pointer;
          white-space: nowrap;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        ">
          ${icon('shield-alert', '', 12)}
          <span>Gesteine & Gefahren</span>
        </button>
      </div>
    `;

    if (currentSub === 'hazards') {
      const specials = Object.entries(SPECIAL_TILE_DATA);
      const cardsHtml = specials.map(([key, data]) => {
        return `
          <div style="background: rgba(30, 41, 59, 0.85); border: 1px solid rgba(255, 255, 255, 0.14); border-radius: 12px; padding: 14px 16px; display: flex; flex-direction: column; gap: 8px; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
              <div style="display: flex; align-items: center; gap: 10px;">
                <div style="width: 40px; height: 40px; background: rgba(15, 23, 42, 0.7); border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: 0 2px 8px rgba(0,0,0,0.35);">
                  <canvas id="canvas-spec-${key}" width="32" height="32" style="width: 32px; height: 32px; image-rendering: pixelated;"></canvas>
                </div>
                <div>
                  <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                    <strong style="color: #ffffff; font-size: 14px; font-weight: 800; letter-spacing: 0.3px;">${data.name.toUpperCase()}</strong>
                    <span style="background: ${data.badgeColor}22; color: ${data.badgeColor}; font-size: 10px; font-weight: 800; padding: 2px 7px; border-radius: 5px; border: 1px solid ${data.badgeColor}44;">${data.badge}</span>
                  </div>
                  <div style="font-size: 11px; color: #94a3b8; margin-top: 2px;">Fundort: ${data.depth || 'Unter Tage'}</div>
                </div>
              </div>
              <div style="display: flex; gap: 6px; font-size: 11px; flex-wrap: wrap;">
                ${data.stats.map(s => `
                  <span style="background: rgba(255, 255, 255, 0.08); border: 1px solid rgba(255, 255, 255, 0.1); color: ${s.color}; font-weight: 800; padding: 2px 8px; border-radius: 6px;">
                    ${s.label}: ${s.val}
                  </span>
                `).join('')}
              </div>
            </div>
            <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #e2e8f0;">
              ${data.desc}
            </p>
            <div style="font-size: 11.5px; color: #fef08a; background: rgba(251, 191, 36, 0.1); border: 1px solid rgba(251, 191, 36, 0.25); padding: 8px 12px; border-radius: 8px; line-height: 1.45;">
              ${data.hint}
            </div>
          </div>
        `;
      }).join('');

      return `
        <div style="display: flex; flex-direction: column; gap: 8px;">
          ${subFilterHtml}
          ${cardsHtml}
        </div>
      `;
    }

    let layersHtml = '';
    for (const layer of GEOLOGICAL_LAYERS) {
      const isUnlocked = highestDepth >= layer.minDepth;

      if (isUnlocked) {
        const oresDiscoveredInLayer = layer.ores.filter(o => this.player.isOreDiscovered(o));
        const orePills = layer.ores.map(o => {
          const found = this.player.isOreDiscovered(o);
          const name = ORE_DATA[o]?.name || o;
          return `
            <span style="background: ${found ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.35)'}; color: ${found ? '#ffffff' : '#94a3b8'}; padding: 3px 8px; border-radius: 6px; font-size: 11.5px; border: 1px solid ${found ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)'}; display: inline-flex; align-items: center; gap: 5px;">
              ${found ? oreIcon(o, 13) : icon('lock', '', 11)}
              <span>${found ? name : '?'}</span>
            </span>
          `;
        }).join(' ');

        layersHtml += `
          <div style="background: rgba(30, 41, 59, 0.85); border: 1px solid rgba(255, 255, 255, 0.14); border-radius: 12px; padding: 14px 16px; display: flex; flex-direction: column; gap: 8px; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 6px;">
              <strong style="color: #ffffff; font-size: 14px; font-weight: 800; display: inline-flex; align-items: center; gap: 8px; letter-spacing: 0.4px;">
                ${icon('layers', '', 16)}
                <span>${layer.name.toUpperCase()}</span>
              </strong>
              <div style="display: flex; gap: 6px; font-size: 11px;">
                <span style="background: rgba(56, 189, 248, 0.16); border: 1px solid rgba(56, 189, 248, 0.35); color: #38bdf8; font-weight: 800; padding: 2px 9px; border-radius: 6px;">${layer.depthRange}</span>
                <span style="background: rgba(255, 255, 255, 0.10); border: 1px solid rgba(255, 255, 255, 0.16); color: #f8fafc; font-weight: 700; padding: 2px 9px; border-radius: 6px;">${layer.hardnessMultiplier}</span>
              </div>
            </div>
            <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #e2e8f0;">
              ${layer.report}
            </p>
            <div style="display: flex; align-items: center; gap: 6px; margin-top: 2px; flex-wrap: wrap;">
              <span style="font-size: 11px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px;">Erze der Schicht:</span>
              ${orePills}
            </div>
          </div>
        `;
      } else {
        layersHtml += `
          <div style="background: rgba(30, 41, 59, 0.45); border: 1px dashed rgba(255, 255, 255, 0.12); border-radius: 12px; padding: 12px 16px; display: flex; align-items: center; gap: 10px;">
            <span style="display: inline-flex; align-items: center; justify-content: center; color: #64748b;">
              ${icon('lock', '', 15)}
            </span>
            <span style="color: #64748b; font-size: 12.5px; font-weight: 700; letter-spacing: 0.5px;">Unentdeckte Schicht (Tiefe erreichen)</span>
          </div>
        `;
      }
    }

    return `
      <div style="display: flex; flex-direction: column; gap: 8px;">
        ${subFilterHtml}
        ${layersHtml}
      </div>
    `;
  }

  renderProductsTab() {
    const categories = [
      {
        id: 'furnace',
        label: 'Schmelzofen',
        icon: 'flame',
        color: '#f59e0b',
        filter: p => p.category === 'bar'
      },
      {
        id: 'factory',
        label: 'Fabrik',
        icon: 'factory',
        color: '#38bdf8',
        filter: p => p.category === 'goods' || p.category === 'component'
      },
      {
        id: 'research',
        label: 'Geologe',
        icon: 'atom',
        color: '#c084fc',
        filter: p => p.category === 'research'
      }
    ];

    const filterCounts = {};
    categories.forEach(cat => {
      const items = BOOK_PRODUCTS.filter(cat.filter);
      const discovered = items.filter(p => this.player.isProductDiscovered(p.id)).length;
      filterCounts[cat.id] = { discovered, total: items.length };
    });

    const allDiscovered = BOOK_PRODUCTS.filter(p => this.player.isProductDiscovered(p.id)).length;
    const allTotal = BOOK_PRODUCTS.length;

    // Subfilter-Navigation oben im Tab
    const currentSub = this.productsSubFilter || 'all';
    let subFilterHtml = `
      <div style="display: flex; gap: 6px; width: 100%; overflow-x: auto; padding-bottom: 4px; margin-bottom: 6px;">
        <button class="product-subfilter-btn ${currentSub === 'all' ? 'active' : ''}" data-filter="all" style="
          padding: 4px 10px;
          font-size: 11px;
          font-weight: 700;
          border-radius: 6px;
          border: 1px solid ${currentSub === 'all' ? '#fbbf24' : 'rgba(255,255,255,0.08)'};
          background: ${currentSub === 'all' ? 'rgba(251, 191, 36, 0.18)' : 'rgba(15, 23, 42, 0.5)'};
          color: ${currentSub === 'all' ? '#fbbf24' : '#94a3b8'};
          cursor: pointer;
          white-space: nowrap;
        ">
          Alle (${allDiscovered}/${allTotal})
        </button>
        ${categories.map(cat => {
          const c = filterCounts[cat.id];
          const active = currentSub === cat.id;
          return `
            <button class="product-subfilter-btn ${active ? 'active' : ''}" data-filter="${cat.id}" style="
              padding: 4px 10px;
              font-size: 11px;
              font-weight: 700;
              border-radius: 6px;
              border: 1px solid ${active ? cat.color : 'rgba(255,255,255,0.08)'};
              background: ${active ? `${cat.color}22` : 'rgba(15, 23, 42, 0.5)'};
              color: ${active ? cat.color : '#94a3b8'};
              cursor: pointer;
              white-space: nowrap;
              display: inline-flex;
              align-items: center;
              gap: 4px;
            ">
              ${icon(cat.icon, '', 12)}
              <span>${cat.label} (${c.discovered}/${c.total})</span>
            </button>
          `;
        }).join('')}
      </div>
    `;

    // Sektionen rendern
    const categoriesToRender = currentSub === 'all'
      ? categories
      : categories.filter(c => c.id === currentSub);

    let sectionsHtml = '';

    for (const cat of categoriesToRender) {
      const items = BOOK_PRODUCTS.filter(cat.filter);
      const discoveredItems = items.filter(p => this.player.isProductDiscovered(p.id));
      const lockedItems = items.filter(p => !this.player.isProductDiscovered(p.id));

      let itemsHtml = '';

      // Zuerst ALLE entdeckten Produkte detailliert rendern!
      for (const prod of discoveredItems) {
        const valueBadge = prod.value > 0
          ? `<span style="background: rgba(251, 191, 36, 0.16); border: 1px solid rgba(251, 191, 36, 0.35); color: #fbbf24; font-weight: 800; padding: 2px 8px; border-radius: 6px; font-variant-numeric: tabular-nums;">€${prod.value.toLocaleString('de-DE')}</span>`
          : `<span style="background: rgba(168, 85, 247, 0.16); border: 1px solid rgba(168, 85, 247, 0.35); color: #c084fc; font-weight: 800; padding: 2px 8px; border-radius: 6px;">${prod.usage || 'Bauteil'}</span>`;

        const categoryBadge = prod.categoryLabel
          ? `<span style="background: rgba(56, 189, 248, 0.14); border: 1px solid rgba(56, 189, 248, 0.28); color: #38bdf8; font-weight: 700; padding: 2px 8px; border-radius: 6px;">${prod.categoryLabel}</span>`
          : '';

        itemsHtml += `
          <div class="book-product-card" data-key="${prod.id}" style="background: rgba(30, 41, 59, 0.85); border: 1px solid rgba(255, 255, 255, 0.14); border-radius: 12px; padding: 14px 16px; display: flex; flex-direction: column; gap: 8px; cursor: pointer; transition: transform 0.1s, border-color 0.15s; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);" title="${prod.name} anklicken für Detail-Ansicht">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 6px;">
              <div style="display: flex; align-items: center; gap: 8px;">
                ${itemDisplayIcon(prod.id, 20)}
                <strong style="color: #ffffff; font-size: 14px; font-weight: 800; letter-spacing: 0.3px;">${prod.name}</strong>
              </div>
              <div style="display: flex; gap: 6px; font-size: 11px; flex-wrap: wrap;">
                ${categoryBadge}
                ${valueBadge}
              </div>
            </div>
            <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #e2e8f0;">
              ${prod.desc}
            </p>
          </div>
        `;
      }

      // Anschließend kompakte gesperrte Kacheln
      if (lockedItems.length > 0) {
        itemsHtml += `
          <div style="display: flex; flex-direction: column; gap: 4px; margin-top: 4px;">
            <div style="font-size: 10.5px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; display: flex; align-items: center; gap: 5px;">
              ${icon('lock', '', 11)} Noch unentdeckte Rezepte (${lockedItems.length})
            </div>
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(56px, 1fr)); gap: 6px;">
              ${lockedItems.map(() => `
                <div style="background: rgba(30, 41, 59, 0.45); border: 1px dashed rgba(255,255,255,0.12); border-radius: 8px; padding: 6px; display: flex; align-items: center; justify-content: center; gap: 4px; color: #64748b; font-size: 11px;">
                  <span style="font-weight: 700;">?</span>
                </div>
              `).join('')}
            </div>
          </div>
        `;
      }

      sectionsHtml += `
        <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 12px;">
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 4px 2px;">
            <span style="font-size: 12px; font-weight: 800; color: ${cat.color}; display: inline-flex; align-items: center; gap: 6px; text-transform: uppercase; letter-spacing: 0.5px;">
              ${icon(cat.icon, '', 13)}
              ${cat.label}
            </span>
            <span style="font-size: 11px; font-weight: 700; color: #94a3b8;">
              ${discoveredItems.length} / ${items.length} freigeschaltet
            </span>
          </div>
          ${itemsHtml}
        </div>
      `;
    }

    return `
      <div style="display: flex; flex-direction: column; gap: 6px;">
        ${subFilterHtml}
        ${sectionsHtml}
      </div>
    `;
  }

  renderCodexTab() {
    return `
      <div style="display: flex; flex-direction: column; gap: 8px;">
        <div style="background: rgba(15, 23, 42, 0.75); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 10px; padding: 12px 14px; display: flex; flex-direction: column; gap: 6px;">
          <div style="font-size: 12px; font-weight: 800; color: #f59e0b; display: flex; align-items: center; gap: 6px;">
            ${icon('fuel', '', 14)}
            <span>§ 1 TREIBSTOFF & RÜCKKEHR-RESERVE</span>
          </div>
          <div style="font-size: 11px; color: #cbd5e1; line-height: 1.5;">
            Sowohl Fahren als auch Bohren und der Steigflug verbrauchen Treibstoff. Der <strong>rote Balken in deiner Tankanzeige</strong> markiert deinen dynamischen Rückkehr-Bedarf inklusive Sicherheitsreserve: Fällt dein Kerosinstand in diesen roten Bereich, solltest du sofort umkehren, um noch aus eigener Kraft die Erdoberfläche zu erreichen!
          </div>
        </div>

        <div style="background: rgba(15, 23, 42, 0.75); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 10px; padding: 12px 14px; display: flex; flex-direction: column; gap: 6px;">
          <div style="font-size: 12px; font-weight: 800; color: #38bdf8; display: flex; align-items: center; gap: 6px;">
            ${icon('rocket', '', 14)}
            <span>§ 2 STEIGFLUG & SCHUBDÜSEN</span>
          </div>
          <div style="font-size: 11px; color: #cbd5e1; line-height: 1.5;">
            Halte <strong>W</strong> oder <strong>↑</strong> (bzw. auf Mobilgeräten den Joystick nach oben) gedrückt, um mit dem Triebwerk aufzusteigen.
            <strong>Tipp:</strong> Fliege immer durch bereits freigebohrte Schächte zurück, anstatt neues Gestein im Steigflug zu zerkleinern – das spart enormes Kerosin.
          </div>
        </div>

        <div style="background: rgba(15, 23, 42, 0.75); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 10px; padding: 12px 14px; display: flex; flex-direction: column; gap: 6px;">
          <div style="font-size: 12px; font-weight: 800; color: #10b981; display: flex; align-items: center; gap: 6px;">
            ${icon('wrench', '', 14)}
            <span>§ 3 HÜLLE & PANZERUNG</span>
          </div>
          <div style="font-size: 11px; color: #cbd5e1; line-height: 1.5;">
            Stürze aus großer Höhe, herabstürzende <strong>Felsbrocken</strong> und der Kontakt mit glühenden <strong>Lava-Adern</strong> beschädigen die Panzerung deines Fahrzeugs. Parke an der Oberfläche am <strong>Hangar</strong>, um dein Fahrzeug automatisch reparieren und vollbetanken zu lassen. Unter Tage kannst du Reparatur-Kits aus deinem Inventar einsetzen.
          </div>
        </div>

        <div style="background: rgba(15, 23, 42, 0.75); border: 1px solid rgba(239, 68, 68, 0.2); border-radius: 10px; padding: 12px 14px; display: flex; flex-direction: column; gap: 6px;">
          <div style="font-size: 12px; font-weight: 800; color: #f87171; display: flex; align-items: center; gap: 6px;">
            ${icon('shield-alert', '', 14)}
            <span>§ 4 BERGUNG & VERSICHERUNG</span>
          </div>
          <div style="font-size: 11px; color: #cbd5e1; line-height: 1.5;">
            Sollte dein Tank unter Tage komplett leerlaufen, erscheint automatisch ein Notfall-Rettungsbutton:<br>
            • Deine <strong>erste Bergung ist kostenlos</strong> und bringt dich sicher an die Oberfläche zurück.<br>
            • Für jede weitere Rettung musst du an der Oberfläche im <strong>Büro</strong> (Reiter <em>Versicherung</em>) einen <strong>Bergungsschutz</strong> für deine Zielschicht abschließen.<br>
            • Läuft dein Tank ohne aktive Versicherung leer, gilt das Fahrzeug als verschollen – <strong>Game Over</strong>!
          </div>
        </div>

        <div style="background: rgba(15, 23, 42, 0.75); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 10px; padding: 12px 14px; display: flex; flex-direction: column; gap: 6px;">
          <div style="font-size: 12px; font-weight: 800; color: #c084fc; display: flex; align-items: center; gap: 6px;">
            ${icon('building-2', '', 14)}
            <span>§ 5 OBERFLÄCHEN-STATIONEN</span>
          </div>
          <div style="font-size: 11px; color: #cbd5e1; line-height: 1.5;">
            • <strong>Hangar:</strong> Montiere erforschte Upgrades und rüste die Hangar-Infrastruktur auf, um Betankungs- und Reparaturzeiten zu verkürzen.<br>
            • <strong>Erzbörse:</strong> Verkaufe Roherze und Barren zu aktuellen Tageskursen. Halte nach gewinnbringenden <em>Börsen-Booms</em> Ausschau!<br>
            • <strong>Depot:</strong> Sichere Lagerstätte für Erze, Barren & Bauteile. Schützt deine Schätze vor Verlust.<br>
            • <strong>Büro:</strong> Nimm lukrative Schacht-Aufträge an, steige in Bergbau-Rängen auf, reiche Gesteinsproben beim <strong>Geologen</strong> ein und schließe <strong>Bergungs-Versicherungen</strong> ab.<br>
            • <strong>Fabrik:</strong> Schmelze Roherze in der Raffinerie zu wertvollen Barren (+50% Börsenwert) und fertige Industrieprodukte.<br>
            • <strong>Labor:</strong> High-Tech-Forschung für neue Fahrzeugstufen, TNT-Sprengstoff, Radar-Sensoren und unterirdische Versorgungsstationen.
          </div>
        </div>

        <div style="background: rgba(15, 23, 42, 0.75); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 10px; padding: 12px 14px; display: flex; flex-direction: column; gap: 6px;">
          <div style="font-size: 12px; font-weight: 800; color: #f59e0b; display: flex; align-items: center; gap: 6px;">
            ${icon('mountain', '', 14)}
            <span>§ 6 GESTEINE, SCHÄTZE & GEFAHREN</span>
          </div>
          <div style="font-size: 11px; color: #cbd5e1; line-height: 1.5;">
            • <strong>Felsbrocken:</strong> Fallen ungebremst nach unten, wenn sie untergraben werden. Baue sie von oben oder seitlich ab oder sprenge sie mit Dynamit (+€25, +8 XP).<br>
            • <strong>Bergungskapseln:</strong> Alte verschollene Expeditionskapseln belohnen dich beim Anbohren mit Notfall-Bargeld und nützlichen Gadgets (Dynamit, Kerosinkanister, Reparatur-Kits).<br>
            • <strong>Lava-Adern:</strong> Glühendes Magma in tiefen Schichten verursacht plötzlichen Hitzeschaden – umgehe Lava weiträumig oder rüste stärkere Panzerungen aus!
          </div>
        </div>
      </div>
    `;
  }
}
