import { ORE_DATA, ARTIFACT_CATALOG } from '../core/GridSystem.js';
import { soundFx } from '../core/SoundEffects.js';
import { icon, refreshIcons, oreIcon, itemDisplayIcon } from './IconHelper.js';
import { closeActiveModal } from '../core/BaseSystem.js';

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
    name: 'Humusschicht & Oberboden',
    depthRange: '0 – 50 m',
    minDepth: 0,
    baseHardness: '48 HP',
    hardnessMultiplier: '1.0x (Basis)',
    color: '#d97706',
    ores: ['coal', 'copper'],
    report: 'Die oberste Sedimentschicht aus weicher Erde, Lehm und Humus. Jeder Einsteigerbohrer dringt hier mühelos vor. Ausgezeichnete Fundstelle für Kohleflöze und frühe Kupferadern.'
  },
  {
    id: 'schist',
    name: 'Schiefer & Felsgestein',
    depthRange: '50 – 180 m',
    minDepth: 50,
    baseHardness: '160 HP',
    hardnessMultiplier: '3.3x zäher',
    color: '#64748b',
    ores: ['iron', 'tin'],
    report: 'Dicht gelagertes Schiefergestein unter spürbarem Gebirgsdruck. Die Bohrkopf-Reibung steigt markant an. Liefert das für die industrielle Produktion fundamentale Eisen- und Zinnerz.'
  },
  {
    id: 'granite',
    name: 'Granit-Formation',
    depthRange: '180 – 480 m',
    minDepth: 180,
    baseHardness: '320 HP',
    hardnessMultiplier: '6.7x zäher',
    color: '#38bdf8',
    ores: ['silver', 'gold'],
    report: 'Massives magmatisches Tiefengestein. Einfache Bohrer blockieren hier regelmäßig. Verlangt aufgerüstete Triebwerke und gehärtete Spitzen. Belohnt Expeditionen mit Silber und reinem Gold.'
  },
  {
    id: 'obsidian',
    name: 'Obsidian- & Basaltzone',
    depthRange: '480 – 950 m',
    minDepth: 480,
    baseHardness: '600 HP',
    hardnessMultiplier: '12.5x zäher',
    color: '#a855f7',
    ores: ['emerald', 'sapphire', 'ruby', 'diamond'],
    report: 'Vulkanisches Glas und ultra-dichter Basalt unter titanischen Drücken. Hier entstehen die edelsten kristallinen Schätze der Erde: Smaragde, Saphire, Rubine und Diamanten.'
  },
  {
    id: 'core',
    name: 'Urgestein & Der Tiefenkern',
    depthRange: '> 950 m',
    minDepth: 950,
    baseHardness: '1100 – 1800 HP',
    hardnessMultiplier: '23x – 37x zäher',
    color: '#ef4444',
    ores: ['titanium', 'platinum', 'uranium', 'obsidian_gem', 'dark_matter'],
    report: 'Die geologische Kernzone des Planeten. Glühende Hitze, tektonische Strahlung und unbegreifliche Gesteinsdichte. Beherbergt Titan, Platin, Uran und exotische Dunkelmaterie.'
  }
];

export const BOOK_PRODUCTS = [
  // Schmelz-Barren
  { id: 'bar_coal', name: 'Kohle-Brikett', value: 29, req: '1x Kohle (im Schmelzofen)', desc: 'Gepresster, hochreiner Kohlenstoff mit maximaler Brenndauer.' },
  { id: 'bar_copper', name: 'Kupfer-Barren', value: 53, req: '1x Kupfer (im Schmelzofen)', desc: 'Feingegossenes Elektrokupfer für Schaltkreise und Spulen.' },
  { id: 'bar_iron', name: 'Eisen-Barren', value: 88, req: '1x Eisen (im Schmelzofen)', desc: 'Veredeltes Schmiedeeisen für Gerüste und Fahrwerks-Umbauten.' },
  { id: 'bar_tin', name: 'Zinn-Barren', value: 122, req: '1x Zinn (im Schmelzofen)', desc: 'Weiches Glanzmetall zur Veredelung robuster Legierungen.' },
  { id: 'bar_silver', name: 'Silber-Barren', value: 200, req: '1x Silber (im Schmelzofen)', desc: 'Sterlingsilber für Sensorik und hochleitende Kontakte.' },
  { id: 'bar_gold', name: 'Gold-Barren', value: 345, req: '1x Gold (im Schmelzofen)', desc: '999er Feingoldbarren. Höchst geschätzt an der Erzbörse.' },
  { id: 'bar_titanium', name: 'Titan-Barren', value: 3200, req: '1x Titan (im Schmelzofen)', desc: 'Raumfahrt-zertifizierter Titanblock für schwerste Tiefenrümpfe.' },
  { id: 'bar_platinum', name: 'Platin-Barren', value: 5100, req: '1x Platin (im Schmelzofen)', desc: 'Das edelste aller Metalle. Korrosionsfrei und extrem wertvoll.' },
  // Fabrik-Erzeugnisse
  { id: 'steel_beam', name: 'Stahlträger', value: 280, req: '2x Eisen + 2x Kohle (Fabrik)', desc: 'Schwerer Industriestahl für Schachtgerüste und Maschinensockel.' },
  { id: 'bronze_ingot', name: 'Bronze-Barren', value: 360, req: '2x Kupfer + 1x Zinn (Fabrik)', desc: 'Korrosionsfreie Legierung für Antriebszahnräder und Motoren.' },
  { id: 'circuit_board', name: 'Elektronik-Platine', value: 1150, req: '2x Kupfer + 1x Zinn + 1x Gold (Fabrik)', desc: 'Präzisions-Leiterplatte mit Zinn-Lötbahnen und Gold-Kontakten.' },
  { id: 'sapphire_glass', name: 'Saphir-Panzerglas', value: 2300, req: '2x Saphir + 1x Silber (Fabrik)', desc: 'Kratzfestes und hochdruckstabiles Panzerglas aus Saphirkristallen.' },
  { id: 'polished_gem', name: 'Schmuck-Diamant', value: 4400, req: '1x Smaragd + 1x Rubin + 1x Diamant (Fabrik)', desc: 'Präzisionsgeschliffener Dreifach-Edelstein für Luxus und Hochleistungs-Laser.' },
  { id: 'titan_plate', name: 'Titan-Panzerung', value: 9800, req: '2x Titan + 1x Diamant (Fabrik)', desc: 'Verbundpanzerung für den Vorstoß in tiefste Basaltzonen.' },
  { id: 'obsidian_matrix', name: 'Obsidian-Superleiter', value: 19500, req: '1x Obsidian-Kern + 2x Platin (Fabrik)', desc: 'Hochdichte vulkanische Kristallmatrix für extremste Energiedichten.' },
  { id: 'fusion_rod', name: 'Quanten-Brennstab', value: 32000, req: '2x Uran + 1x Dunkelmaterie (Fabrik)', desc: 'Ultimative Fusions-Energiequelle mit astronomischem Erlös.' }
];

export class MinerBookModal {
  constructor(scene, player) {
    this.scene = scene;
    this.player = player;
    this.activeTab = 'ores';
  }

  open(tab = 'ores') {
    this.activeTab = tab;
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

    const allArtifacts = Object.keys(ARTIFACT_CATALOG);
    const discoveredArtifactsCount = (this.player.discoveredArtifacts || []).length;

    const totalDiscoverables = allOres.length + GEOLOGICAL_LAYERS.length + BOOK_PRODUCTS.length + allArtifacts.length;
    const totalDiscovered = discoveredOresCount + unlockedLayersCount + discoveredProductsCount + discoveredArtifactsCount;
    const progressPercent = Math.min(100, Math.round((totalDiscovered / totalDiscoverables) * 100));

    return {
      allOresCount: allOres.length,
      discoveredOresCount,
      allArtifactsCount: allArtifacts.length,
      discoveredArtifactsCount,
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

    // Tabs
    const tabs = [
      { id: 'ores', label: `Erze (${stats.discoveredOresCount}/${stats.allOresCount})`, icon: 'gem' },
      { id: 'relics', label: `Relikte (${stats.discoveredArtifactsCount}/${stats.allArtifactsCount})`, icon: 'award' },
      { id: 'layers', label: `Schichten (${stats.unlockedLayersCount}/${stats.totalLayersCount})`, icon: 'mountain' },
      { id: 'products', label: `Waren (${stats.discoveredProductsCount}/${stats.totalProductsCount})`, icon: 'factory' },
      { id: 'codex', label: 'Kodex', icon: 'shield-check' }
    ];

    const tabButtonsHtml = tabs.map(t => `
      <button class="book-tab-btn ${this.activeTab === t.id ? 'active' : ''}" data-tab="${t.id}" style="
        flex: 1;
        height: 32px;
        font-size: 11px;
        font-weight: 700;
        border-radius: 8px;
        border: none;
        background: ${this.activeTab === t.id ? 'linear-gradient(180deg, #d97706 0%, #b45309 100%)' : 'rgba(30, 41, 59, 0.5)'};
        color: ${this.activeTab === t.id ? '#ffffff' : '#94a3b8'};
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 5px;
        white-space: nowrap;
        transition: all 0.15s ease;
      ">
        ${icon(t.icon, '', 13)}
        <span>${t.label}</span>
      </button>
    `).join('');

    let contentHtml = '';
    if (this.activeTab === 'ores') {
      contentHtml = this.renderOresTab();
    } else if (this.activeTab === 'relics') {
      contentHtml = this.renderRelicsTab();
    } else if (this.activeTab === 'layers') {
      contentHtml = this.renderLayersTab();
    } else if (this.activeTab === 'products') {
      contentHtml = this.renderProductsTab();
    } else if (this.activeTab === 'codex') {
      contentHtml = this.renderCodexTab();
    }

    bodyEl.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 12px; max-width: 620px; margin: 0 auto; width: 100%;">
        <!-- Zurück & Fortschritts-Kopf -->
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
          <button id="btn-book-back" class="btn-action" style="height: 32px; padding: 0 14px; font-size: 11.5px; display: inline-flex; align-items: center; gap: 6px; border: none; border-radius: 8px;">
            ${icon('arrow-left', '', 14)}
            <span>Zurück zum Spielmenü</span>
          </button>

          <!-- Gesamt-Fortschrittsbalken -->
          <div style="display: flex; align-items: center; gap: 8px; font-size: 11.5px; font-weight: 700; color: #94a3b8;">
            <span>Kartiert: <strong style="color: #fbbf24;">${stats.totalDiscovered} / ${stats.totalDiscoverables}</strong> (${stats.progressPercent}%)</span>
            <div style="width: 80px; height: 6px; background: rgba(0,0,0,0.6); border-radius: 99px; overflow: hidden;">
              <div style="width: ${stats.progressPercent}%; height: 100%; background: linear-gradient(90deg, #f59e0b, #10b981); border-radius: 99px; transition: width 0.3s ease;"></div>
            </div>
          </div>
        </div>

        <!-- Kapitel-Tabs -->
        <div style="display: flex; gap: 6px; width: 100%; overflow-x: auto; padding-bottom: 2px;">
          ${tabButtonsHtml}
        </div>

        <!-- Inhalt -->
        <div style="display: flex; flex-direction: column; gap: 8px; max-height: 58vh; overflow-y: auto; padding-right: 4px;">
          ${contentHtml}
        </div>
      </div>
    `;

    modalEl.style.display = 'flex';
    refreshIcons(modalEl);

    // Relikte Canvases zeichnen
    if (this.activeTab === 'relics') {
      const list = Object.values(ARTIFACT_CATALOG);
      const known = this.player.discoveredArtifacts || [];
      list.forEach(art => {
        if (known.includes(art.id)) {
          const can = document.getElementById(`canvas-${art.id}`);
          if (can && this.scene && this.scene.textures && this.scene.textures.exists(art.sprite)) {
            const img = this.scene.textures.get(art.sprite).getSourceImage();
            if (img) {
              const ctx = can.getContext('2d');
              ctx.clearRect(0, 0, 32, 32);
              ctx.drawImage(img, 0, 0, 32, 32);
            }
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
          <div style="background: rgba(15, 23, 42, 0.75); border: none; border-radius: 10px; padding: 12px 14px; display: flex; flex-direction: column; gap: 6px;">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 6px;">
              <div style="display: flex; align-items: center; gap: 8px;">
                ${oreIcon(key, 22)}
                <strong style="color: #f8fafc; font-size: 13.5px; letter-spacing: 0.3px;">${data.name.toUpperCase()}</strong>
              </div>
              <div style="display: flex; gap: 6px; font-size: 11px;">
                <span style="background: rgba(251, 191, 36, 0.12); color: #fbbf24; font-weight: 800; padding: 2px 8px; border-radius: 6px;">+€${data.value}</span>
                <span style="background: rgba(56, 189, 248, 0.12); color: #38bdf8; font-weight: 700; padding: 2px 8px; border-radius: 6px;">ab ${data.minDepth}m</span>
                <span style="background: rgba(148, 163, 184, 0.12); color: #cbd5e1; font-weight: 700; padding: 2px 8px; border-radius: 6px;">${data.hardness}x Härte</span>
              </div>
            </div>
            <p style="margin: 0; font-size: 11.5px; line-height: 1.45; color: #94a3b8;">
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
    let html = '';

    for (const layer of GEOLOGICAL_LAYERS) {
      const isUnlocked = highestDepth >= layer.minDepth;

      if (isUnlocked) {
        const oresDiscoveredInLayer = layer.ores.filter(o => this.player.isOreDiscovered(o));
        const orePills = layer.ores.map(o => {
          const found = this.player.isOreDiscovered(o);
          const name = ORE_DATA[o]?.name || o;
          return `
            <span style="background: ${found ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.25)'}; color: ${found ? '#f8fafc' : '#64748b'}; padding: 2px 7px; border-radius: 5px; font-size: 11px; display: inline-flex; align-items: center; gap: 4px;">
              ${found ? oreIcon(o, 13) : icon('lock', '', 11)}
              <span>${found ? name : '?'}</span>
            </span>
          `;
        }).join(' ');

        html += `
          <div style="background: rgba(15, 23, 42, 0.75); border: none; border-left: 4px solid ${layer.color}; border-radius: 10px; padding: 12px 14px; display: flex; flex-direction: column; gap: 6px;">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 6px;">
              <strong style="color: #f8fafc; font-size: 13.5px; display: inline-flex; align-items: center; gap: 6px;">
                ${icon('layers', '', 15)}
                <span>${layer.name.toUpperCase()}</span>
              </strong>
              <div style="display: flex; gap: 6px; font-size: 11px;">
                <span style="background: rgba(56, 189, 248, 0.12); color: #38bdf8; font-weight: 700; padding: 2px 8px; border-radius: 6px;">${layer.depthRange}</span>
                <span style="background: rgba(148, 163, 184, 0.12); color: #cbd5e1; font-weight: 700; padding: 2px 8px; border-radius: 6px;">${layer.hardnessMultiplier}</span>
              </div>
            </div>
            <p style="margin: 0; font-size: 11.5px; line-height: 1.45; color: #94a3b8;">
              ${layer.report}
            </p>
            <div style="display: flex; align-items: center; gap: 6px; margin-top: 2px; flex-wrap: wrap;">
              <span style="font-size: 10.5px; font-weight: 700; color: #64748b; text-transform: uppercase;">Erze der Schicht:</span>
              ${orePills}
            </div>
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

  renderProductsTab() {
    let html = '';

    for (const prod of BOOK_PRODUCTS) {
      const isDiscovered = this.player.isProductDiscovered(prod.id);

      if (isDiscovered) {
        html += `
          <div style="background: rgba(15, 23, 42, 0.75); border: none; border-radius: 10px; padding: 12px 14px; display: flex; flex-direction: column; gap: 6px;">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 6px;">
              <div style="display: flex; align-items: center; gap: 8px;">
                ${itemDisplayIcon(prod.id, 20)}
                <strong style="color: #f8fafc; font-size: 13px;">${prod.name}</strong>
              </div>
              <div style="display: flex; gap: 6px; font-size: 11px;">
                <span style="background: rgba(251, 191, 36, 0.12); color: #fbbf24; font-weight: 800; padding: 2px 8px; border-radius: 6px;">Wert: +€${prod.value.toLocaleString()}</span>
              </div>
            </div>
            <div style="font-size: 11px; color: #38bdf8;">
              <strong>Rezept:</strong> ${prod.req}
            </div>
            <p style="margin: 0; font-size: 11.5px; line-height: 1.45; color: #94a3b8;">
              ${prod.desc}
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

  renderCodexTab() {
    return `
      <div style="display: flex; flex-direction: column; gap: 8px;">
        <div style="background: rgba(15, 23, 42, 0.75); border: none; border-radius: 10px; padding: 12px 14px; display: flex; flex-direction: column; gap: 6px;">
          <div style="font-size: 12px; font-weight: 800; color: #f59e0b; display: flex; align-items: center; gap: 6px;">
            ${icon('fuel', '', 14)}
            <span>§ 1 TREIBSTOFF & BOHRVERBRAUCH</span>
          </div>
          <div style="font-size: 11px; color: #94a3b8; line-height: 1.5;">
            Sowohl Fahren als auch das kontinuierliche <strong>Bohren durch festes Gestein verbraucht Treibstoff (1.5 L/s)</strong>.
            Beobachte stets die dynamische schwarze Markierung auf deinem Tankbalken: Fällt dein Tank unter diese Linie, reicht das Kerosin nicht mehr für den freien Steigflug zur Erdoberfläche!
          </div>
        </div>

        <div style="background: rgba(15, 23, 42, 0.75); border: none; border-radius: 10px; padding: 12px 14px; display: flex; flex-direction: column; gap: 6px;">
          <div style="font-size: 12px; font-weight: 800; color: #38bdf8; display: flex; align-items: center; gap: 6px;">
            ${icon('rocket', '', 14)}
            <span>§ 2 STEIGFLUG & SCHUBDÜSEN</span>
          </div>
          <div style="font-size: 11px; color: #94a3b8; line-height: 1.5;">
            Halte <strong>W</strong> oder <strong>↑</strong> (oder auf Mobile den Joystick nach oben) gedrückt, um mit dem Triebwerk aufzusteigen.
            <strong>Tipp:</strong> Fliege immer durch bereits freigebohrte Schächte zurück, anstatt neues Gestein zu zerkleinern – das spart enormes Kerosin.
          </div>
        </div>

        <div style="background: rgba(15, 23, 42, 0.75); border: none; border-radius: 10px; padding: 12px 14px; display: flex; flex-direction: column; gap: 6px;">
          <div style="font-size: 12px; font-weight: 800; color: #10b981; display: flex; align-items: center; gap: 6px;">
            ${icon('wrench', '', 14)}
            <span>§ 3 HÜLLE & SCHACHT-INTEGRITÄT</span>
          </div>
          <div style="font-size: 11px; color: #94a3b8; line-height: 1.5;">
            Starke Reibung an harten Gesteinsschichten nagt an der Karosserie. Parke am Hangar an der Oberfläche, um die Hülle reparieren zu lassen und das Tankkabel automatisch anzudocken.
          </div>
        </div>

        <div style="background: rgba(15, 23, 42, 0.75); border: none; border-radius: 10px; padding: 12px 14px; display: flex; flex-direction: column; gap: 6px;">
          <div style="font-size: 12px; font-weight: 800; color: #f87171; display: flex; align-items: center; gap: 6px;">
            ${icon('shield-alert', '', 14)}
            <span>§ 4 NOTFALL-RETTUNG</span>
          </div>
          <div style="font-size: 11px; color: #94a3b8; line-height: 1.5;">
            Solltest du tief unten festsitzen oder der Tank komplett leerlaufen: Öffne das Spielmenü und starte die Notfall-Rettung. Die ersten <strong>3 Bergungen sind absolut kostenlos</strong> und laden deinen Tank auf 15 Liter auf!
          </div>
        </div>

        <div style="background: rgba(15, 23, 42, 0.75); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 10px; padding: 12px 14px; display: flex; flex-direction: column; gap: 6px;">
          <div style="font-size: 12px; font-weight: 800; color: #c084fc; display: flex; align-items: center; gap: 6px;">
            ${icon('building-2', '', 14)}
            <span>§ 5 OBERFLÄCHEN-STATIONEN</span>
          </div>
          <div style="font-size: 11px; color: #94a3b8; line-height: 1.45;">
            • <strong>Büro:</strong> Schacht-Aufträge für dicke Barprämien und Rang-Aufstiege.<br>
            • <strong>Erzbörse:</strong> Verkaufe Roherze oder nutze den Sofort-Verkauf.<br>
            • <strong>Hangar:</strong> Montiere erforschte Bohrköpfe, größere Tanks und Motoren.<br>
            • <strong>Fabrik & Raffinerie:</strong> Schmelze Barren (+50% Erlös) und fertige Produkte.<br>
            • <strong>Labor:</strong> High-Tech-Forschung für neue Stufen und Radar-Sensoren.
          </div>
        </div>
      </div>
    `;
  }

  renderRelicsTab() {
    const list = Object.values(ARTIFACT_CATALOG);
    const known = this.player.discoveredArtifacts || [];

    const cardsHtml = list.map(art => {
      const isFound = known.includes(art.id);
      if (isFound) {
        return `
          <div style="background: rgba(15,23,42,0.7); border: 1.5px solid rgba(56,189,248,0.3); border-radius: 12px; padding: 12px 14px; display: flex; align-items: center; justify-content: space-between; gap: 12px;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <div style="width: 44px; height: 44px; background: rgba(30,41,59,0.8); border: 1px solid rgba(56,189,248,0.4); border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: 0 0 12px rgba(56,189,248,0.15);">
                <canvas id="canvas-${art.id}" width="32" height="32" style="width: 32px; height: 32px; image-rendering: pixelated;"></canvas>
              </div>
              <div>
                <div style="display: flex; align-items: center; gap: 6px;">
                  <strong style="color: #f8fafc; font-size: 13.5px;">${art.name}</strong>
                  <span style="background: rgba(16,185,129,0.15); color: #10b981; font-size: 10px; font-weight: 800; padding: 2px 6px; border-radius: 4px; border: 1px solid rgba(16,185,129,0.3);">MUSEUM</span>
                </div>
                <div style="font-size: 11px; color: #94a3b8; margin-top: 2px;">${art.description}</div>
                <div style="font-size: 11.5px; color: #38bdf8; font-weight: 700; margin-top: 4px; display: inline-flex; align-items: center; gap: 4px;">
                  ${icon('zap', '', 12)} <span>Aktiv: ${art.perk}</span>
                </div>
              </div>
            </div>
            <div style="text-align: right; flex-shrink: 0;">
              <span style="color: #64748b; font-size: 10.5px;">Ab ${art.minDepth}m</span>
            </div>
          </div>
        `;
      } else {
        return `
          <div style="background: rgba(15,23,42,0.4); border: 1px dashed rgba(148,163,184,0.2); border-radius: 12px; padding: 12px 14px; display: flex; align-items: center; justify-content: space-between; gap: 12px; opacity: 0.65;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <div style="width: 44px; height: 44px; background: rgba(15,23,42,0.6); border: 1px solid rgba(148,163,184,0.2); border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                <span style="font-size: 20px; color: #64748b;">❓</span>
              </div>
              <div>
                <strong style="color: #94a3b8; font-size: 13px;">Unentdecktes Relikt</strong>
                <div style="font-size: 11px; color: #64748b; margin-top: 2px;">Grabe in Schichten ab ${art.minDepth}m Tiefe, um dieses Fossil zu bergen.</div>
                <div style="font-size: 11px; color: #f59e0b; font-weight: 600; margin-top: 4px;">Perk: ${art.perk}</div>
              </div>
            </div>
            <div style="text-align: right; flex-shrink: 0;">
              <span style="background: rgba(100,116,139,0.15); color: #94a3b8; font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px;">UNBEKANNT</span>
            </div>
          </div>
        `;
      }
    }).join('');

    return `
      <div style="display: flex; flex-direction: column; gap: 8px;">
        <div style="background: rgba(30,41,59,0.5); padding: 8px 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.06); margin-bottom: 4px;">
          <span style="font-size: 11.5px; color: #94a3b8; display: inline-flex; align-items: center; gap: 6px;">
            ${icon('info', '', 14)}
            <span><strong>Fossilien & Relikte:</strong> Schalte permanente passive Boni frei, indem du vergrabene Fossil-Gesteine im Erdreich abbaust.</span>
          </span>
        </div>
        ${cardsHtml}
      </div>
    `;
  }
}
