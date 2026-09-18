import { icon, refreshIcons } from './IconHelper.js';
import { soundFx } from '../core/SoundEffects.js';

export const TUTORIAL_STORAGE_KEY = 'vein_tutorial_completed';

export class TutorialModal {
  constructor(scene) {
    this.scene = scene;
    this.currentStep = 0;
    this.container = null;
    this._rafId = null;
    this._stepTimeout = null;
    this.isPanning = false;

    this.steps = [
      {
        id: 'hangar',
        type: 'world',
        wx: 480, // Hangar gx: 15 * 32
        wy: -32,
        icon: 'fuel',
        color: '#38bdf8',
        badge: 'TANKSTELLE',
        title: 'Hangar',
        text: 'Kehre hierher an die Oberfläche zurück, um deinen Tank <strong>aufzufüllen</strong> und das Fahrzeug aufzurüsten.'
      },
      {
        id: 'shaft',
        type: 'world',
        wx: 640, // Schacht-Eingang gx: 20 * 32
        wy: -24,
        icon: 'compass',
        color: '#38bdf8',
        badge: 'SCHACHTBAU',
        title: 'Schacht',
        text: 'Fahre hier hinein. Steuere per Touch gegen Gestein, um zu bohren. Halte nach oben, um mit dem Triebwerk aufzusteigen.'
      },
      {
        id: 'factory',
        type: 'world',
        wx: 832, // Fabrik gx: 26 * 32
        wy: -36,
        icon: 'factory',
        color: '#38bdf8',
        badge: 'PRODUKTION',
        title: 'Fabrik',
        text: 'Schmelze geförderte Erze zu Barren ein und fertige wertvolle <strong>Industrieprodukte</strong> (wie Kabel, Stahlträger & Platinen) zum lukrativen Verkauf an.'
      },
      {
        id: 'depot',
        type: 'world',
        wx: 288, // Depot gx: 9 * 32
        wy: -35,
        icon: 'warehouse',
        color: '#38bdf8',
        badge: 'ROHSTOFFLAGER',
        title: 'Depot',
        text: 'Lagere abgebaute Erze und Waren sicher an der Oberfläche ein, um den Laderaum deines Fahrzeugs für neue Expeditionen freizumachen.'
      },
      {
        id: 'market',
        type: 'world',
        wx: 96, // Erzbörse gx: 3 * 32
        wy: -34,
        icon: 'coins',
        color: '#38bdf8',
        badge: 'HANDEL',
        title: 'Erzbörse',
        text: 'Verkaufe deine Erze gegen Bargeld. Nutze <strong>Börsen-Booms</strong>, um für bestimmte Erze den doppelten Verkaufspreis zu erzielen.'
      },
      {
        id: 'office',
        type: 'world',
        wx: -96, // Büro gx: -3 * 32
        wy: -35,
        icon: 'laptop-minimal',
        color: '#38bdf8',
        badge: 'EXPEDITIONEN',
        title: 'Büro',
        text: 'Nimm lohnende <strong>Aufträge</strong> an, schalte neue Bergmann-Ränge frei und gib Proben beim Geologen ab.'
      },
      {
        id: 'lab',
        type: 'world',
        wx: -288, // Labor gx: -9 * 32
        wy: -36,
        icon: 'microscope',
        color: '#38bdf8',
        badge: 'FORSCHUNG',
        title: 'Labor',
        text: 'Erforsche neue Technologien, um Upgrades an deinem Fahrzeug zu installieren'
      },
      {
        id: 'gauges',
        type: 'dom',
        selector: '#hud-fuel-cluster',
        fallbackSelector: '#card-gauges',
        icon: 'alert-triangle',
        color: '#38bdf8',
        badge: 'TANK-LIMIT',
        title: 'Treibstoff-Warnung',
        text: 'Achte auf den Tankpegel: Die rote Markierung zeigt dir, wann du <strong>sofort umkehren</strong> musst, um sicher hochzukommen!'
      },
      {
        id: 'pause_menu',
        type: 'dom',
        selector: '#btn-pause',
        fallbackSelector: '#hud-right',
        icon: 'book-open',
        color: '#38bdf8',
        badge: 'SPIELMENÜ',
        title: 'Menü & Bergmannsbuch',
        text: 'Im Menü findest du das <strong>Bergmannsbuch</strong> mit allen wichtigen Infos, Anleitungen und Statistiken zum Nachschlagen.'
      }
    ];

    this._onResize = () => {
      if (this.container) {
        this.renderStep();
      }
    };

    this._onKeyDown = (e) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (this.isPanning) return;
        const btnNext = document.getElementById('btn-tut-next');
        if (btnNext) btnNext.click();
      }
    };
  }

  static shouldShow() {
    try {
      return localStorage.getItem(TUTORIAL_STORAGE_KEY) !== 'true';
    } catch {
      return false;
    }
  }

  static markCompleted() {
    try {
      localStorage.setItem(TUTORIAL_STORAGE_KEY, 'true');
    } catch (_) { }
  }

  show() {
    if (typeof document === 'undefined') return;
    soundFx.stopAllLoops?.();
    this.close();

    // Verhindert Steuerung des Spielers über tutorial-open, OHNE das Menü-Modal zu erzwingen!
    document.body.classList.add('tutorial-open');

    // Sicherstellen, dass das Spielfeld gerendert wird
    if (this.scene && this.scene.gridSystem && this.scene.cameras?.main) {
      this.scene.gridSystem.fogDirty = true;
      this.scene.gridSystem.updateViewport(this.scene.cameras.main, this.scene.player);
    }

    this.container = document.createElement('div');
    this.container.id = 'minimal-tutorial-overlay';
    this.container.style.cssText = `
      position: fixed;
      inset: 0;
      width: 100vw;
      height: 100vh;
      background: transparent !important;
      backdrop-filter: none !important;
      -webkit-backdrop-filter: none !important;
      z-index: 550;
      pointer-events: none;
      overflow: hidden;
      opacity: 0;
      transition: opacity 0.2s ease;
    `;

    document.body.appendChild(this.container);
    window.addEventListener('resize', this._onResize);
    window.addEventListener('keydown', this._onKeyDown);

    // Klick auf den Pause-Button im HUD schließt das Tutorial ebenfalls sauber ab
    const pauseBtn = document.getElementById('btn-pause');
    if (pauseBtn) {
      this._pauseBtnHandler = (e) => {
        e.stopPropagation();
        this.finish();
      };
      pauseBtn.addEventListener('click', this._pauseBtnHandler, true);
    }

    // Animation Loop für weiche Mitführung von Marker & Sprechblase bei Kamerabewegungen
    this._updateLoop = () => {
      if (this.container) {
        this.updateElementsPosition();
        this._rafId = requestAnimationFrame(this._updateLoop);
      }
    };
    this._rafId = requestAnimationFrame(this._updateLoop);

    requestAnimationFrame(() => {
      if (this.container) {
        this.container.style.opacity = '1';
        this.renderStep();
      }
    });
  }

  renderStep() {
    if (!this.container) return;

    if (this._stepTimeout) {
      clearTimeout(this._stepTimeout);
      this._stepTimeout = null;
    }

    const step = this.steps[this.currentStep];
    if (!step) return;

    // 1. Bisheriges Fenster sofort unsichtbar schalten & leeren -> verhindert jedes Aufblitzen!
    this.container.style.opacity = '0';
    this.container.innerHTML = '';
    this.isPanning = true;

    // 2. Kamera ZUERST sanft zum Gebäude (oder Rover) schwenken
    const isInitial = this.currentStep === 0;
    const panDuration = isInitial ? 100 : 380;

    if (this.scene && this.scene.cameras?.main) {
      const cam = this.scene.cameras.main;
      cam.stopFollow();

      if (step.type === 'world') {
        cam.pan(step.wx, step.wy, panDuration, 'Cubic.easeOut');
      } else if (this.scene.player?.sprite) {
        cam.pan(this.scene.player.sprite.x, this.scene.player.sprite.y, panDuration, 'Cubic.easeOut');
      }
    }

    // 3. ERST NACH DEM Kameraschwenk das Fenster exakt positioniert einblenden!
    this._stepTimeout = setTimeout(() => {
      this._stepTimeout = null;
      this.isPanning = false;

      if (!this.container) return;

      const isLastStep = this.currentStep === this.steps.length - 1;
      const btnText = isLastStep ? "Alles klar, los geht's! ✓" : `Weiter (${this.currentStep + 1}/${this.steps.length}) →`;
      const cardBorderColor = '#0369a1';
      const cardWidth = (step.id === 'gauges' || step.id === 'pause_menu') ? Math.min(285, window.innerWidth - 24) : Math.min(270, window.innerWidth - 24);
      const pingColor = '#1d4ed8'; // Dunkelblau für den blinkenden Ziel-Marker

      this.container.innerHTML = `
        <!-- Pulsierender Ping-Marker auf dem Ziel (Dunkelblau) -->
        <div id="tutorial-ping-marker" style="position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); pointer-events: none; z-index: 1;">
          <div style="width: 16px; height: 16px; border-radius: 50%; background: ${pingColor}; border: 1.5px solid #1e3a8a; box-shadow: 0 0 16px rgba(29, 78, 216, 0.85); position: relative;">
            <div style="position: absolute; inset: -10px; border-radius: 50%; border: 3px solid ${pingColor}; box-shadow: 0 0 10px rgba(29, 78, 216, 0.6); animation: tutPing 1.6s infinite ease-out;"></div>
          </div>
        </div>

        <!-- Minimalistische Callout-Sprechblase (Dunkelblauer Rand, 100% Game-Style) -->
        <div id="tutorial-callout-card" style="position: absolute; left: 12px; top: 12px; width: ${cardWidth}px; max-height: calc(100vh - 16px); background: linear-gradient(135deg, rgba(15, 23, 42, 0.98) 0%, rgba(17, 24, 39, 0.96) 100%); border: 1.5px solid ${cardBorderColor}; border-radius: 12px; padding: 10px 14px; box-shadow: 0 14px 40px rgba(0,0,0,0.88), 0 0 20px rgba(3, 105, 161, 0.4); box-sizing: border-box; display: flex; flex-direction: column; gap: 7px; z-index: 2; pointer-events: auto !important; animation: tutPop 0.22s cubic-bezier(0.16, 1, 0.3, 1); overflow-y: auto;">
          <div id="tutorial-arrow" style="position: absolute; pointer-events: none;"></div>
          
          <!-- Header mit Badge & kompakter Schrittanzeige -->
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div style="display: flex; align-items: center; gap: 5px;">
              <span style="color: ${step.color}; display: flex; align-items: center;">
                ${icon(step.icon, '', 13)}
              </span>
              <span style="font-size: 9.5px; font-weight: 900; letter-spacing: 0.8px; color: ${step.color}; text-transform: uppercase;">
                ${step.badge}
              </span>
            </div>
            <span style="font-size: 11px; font-weight: 800; color: #94a3b8; letter-spacing: 0;">
              ${this.currentStep + 1}/${this.steps.length}
            </span>
          </div>

          <!-- Titel & Kurzer Erklärungstext (nutzt die volle Kartenbreite) -->
          <div style="display: flex; flex-direction: column; gap: 3px; width: 100%;">
            <div style="font-size: 12.5px; font-weight: 800; color: #f8fafc; letter-spacing: 0.2px; line-height: 1.2;">
              ${step.title}
            </div>
            <div style="font-size: 11.5px; color: #cbd5e1; line-height: 1.4; width: 100%;">
              ${step.text}
            </div>
          </div>

          <!-- Navigation: Reiner Spiel-Button (volle Breite auf letztem Schritt) -->
          <div style="display: flex; justify-content: flex-end; align-items: center; margin-top: 3px; width: 100%;">
            <button id="btn-tut-next" class="btn-buy" style="${isLastStep ? 'width: 100%;' : ''} height: 29px; padding: 0 16px; border-radius: 7px; font-size: 11.5px; font-weight: 800; pointer-events: auto !important;">
              ${btnText}
            </button>
          </div>
        </div>

        <style>
          @keyframes tutPing {
            0% { transform: scale(0.6); opacity: 1; }
            100% { transform: scale(2.6); opacity: 0; }
          }
          @keyframes tutPop {
            0% { transform: scale(0.92); opacity: 0; }
            100% { transform: scale(1); opacity: 1; }
          }
        </style>
      `;

      refreshIcons(this.container);

      const handleAdvance = (e) => {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
        if (this.isPanning) return;
        try {
          if (this.currentStep < this.steps.length - 1) {
            try { soundFx.playClick?.(); } catch (_) { }
            this.currentStep++;
            this.renderStep();
          } else {
            this.finish();
          }
        } catch (err) {
          console.warn('Tutorial advance error:', err);
          this.finish();
        }
      };

      const btnNext = document.getElementById('btn-tut-next');
      if (btnNext) {
        btnNext.onclick = handleAdvance;
        btnNext.ontouchend = handleAdvance;
      }

      this.updateElementsPosition();
      this.container.style.opacity = '1';
    }, panDuration + 20);
  }

  updateElementsPosition() {
    if (!this.container || this.isPanning) return;

    const step = this.steps[this.currentStep];
    if (!step) return;

    const pingMarker = document.getElementById('tutorial-ping-marker');
    const card = document.getElementById('tutorial-callout-card');
    const arrow = document.getElementById('tutorial-arrow');
    if (!pingMarker || !card) return;

    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;

    if (step.type === 'dom') {
      const el = document.querySelector(step.selector) || document.querySelector(step.fallbackSelector);
      if (el) {
        const rect = el.getBoundingClientRect();
        targetX = rect.left + rect.width / 2;
        targetY = rect.bottom;
      } else {
        targetX = step.id === 'pause_menu' ? window.innerWidth - 30 : 130;
        targetY = 50;
      }
    } else if (step.type === 'world' && this.scene && this.scene.cameras?.main) {
      const cam = this.scene.cameras.main;
      targetX = (step.wx - cam.worldView.x) * cam.zoom;
      targetY = (step.wy - cam.worldView.y) * cam.zoom;
    }

    targetX = Math.max(20, Math.min(window.innerWidth - 20, targetX));
    targetY = Math.max(20, Math.min(window.innerHeight - 20, targetY));

    pingMarker.style.left = `${targetX}px`;
    pingMarker.style.top = `${targetY}px`;

    const cardWidth = card.offsetWidth || Math.min(270, window.innerWidth - 24);
    const cardHeight = card.offsetHeight || 130;
    const isLandscape = window.innerWidth >= window.innerHeight && window.innerWidth >= 600;
    const cardBorderColor = '#0369a1';

    let cardLeft = 12;
    let cardTop = 12;

    if (step.id === 'gauges') {
      cardLeft = Math.max(65, Math.min(window.innerWidth - cardWidth - 12, targetX - 35));
      cardTop = Math.min(window.innerHeight - cardHeight - 10, targetY + 16);
      const arrowLeft = Math.max(20, Math.min(cardWidth - 30, targetX - cardLeft));
      if (arrow) {
        arrow.style.cssText = `position: absolute; top: -8px; left: ${arrowLeft}px; width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-bottom: 8px solid ${cardBorderColor}; pointer-events: none;`;
      }
    } else if (step.id === 'pause_menu') {
      cardLeft = Math.max(12, Math.min(window.innerWidth - cardWidth - 12, targetX - cardWidth + 36));
      cardTop = Math.min(window.innerHeight - cardHeight - 10, targetY + 16);
      const arrowLeft = Math.max(20, Math.min(cardWidth - 25, targetX - cardLeft));
      if (arrow) {
        arrow.style.cssText = `position: absolute; top: -8px; left: ${arrowLeft}px; width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-bottom: 8px solid ${cardBorderColor}; pointer-events: none;`;
      }
    } else if (isLandscape) {
      if (targetX > window.innerWidth / 2) {
        // Gebäude ist in rechter Hälfte -> Karte links daneben platzieren
        cardLeft = targetX - cardWidth - 46;
        if (cardLeft < 10) cardLeft = 10;
        cardTop = Math.max(10, Math.min(window.innerHeight - cardHeight - 10, targetY - cardHeight / 2));
        if (arrow) {
          arrow.style.cssText = `position: absolute; right: -8px; top: 50%; transform: translateY(-50%); width: 0; height: 0; border-top: 6px solid transparent; border-bottom: 6px solid transparent; border-left: 8px solid ${cardBorderColor}; pointer-events: none;`;
        }
      } else {
        // Gebäude ist in linker Hälfte -> Karte rechts daneben platzieren
        cardLeft = targetX + 46;
        if (cardLeft > window.innerWidth - cardWidth - 10) cardLeft = window.innerWidth - cardWidth - 10;
        cardTop = Math.max(10, Math.min(window.innerHeight - cardHeight - 10, targetY - cardHeight / 2));
        if (arrow) {
          arrow.style.cssText = `position: absolute; left: -8px; top: 50%; transform: translateY(-50%); width: 0; height: 0; border-top: 6px solid transparent; border-bottom: 6px solid transparent; border-right: 8px solid ${cardBorderColor}; pointer-events: none;`;
        }
      }
    } else {
      // Im Hochformat: Karte im freien Himmel über dem Gebäude
      cardLeft = Math.max(10, Math.min(window.innerWidth - cardWidth - 10, targetX - cardWidth / 2));
      cardTop = Math.max(10, targetY - cardHeight - 28);
      const arrowLeft = Math.max(20, Math.min(cardWidth - 25, targetX - cardLeft));
      if (arrow) {
        arrow.style.cssText = `position: absolute; bottom: -8px; left: ${arrowLeft}px; width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 8px solid ${cardBorderColor}; pointer-events: none;`;
      }
    }

    card.style.left = `${cardLeft}px`;
    card.style.top = `${cardTop}px`;
  }

  finish() {
    try { soundFx.playClick?.(); } catch (_) { }
    TutorialModal.markCompleted();
    this.close();
  }

  close() {
    if (this._stepTimeout) {
      clearTimeout(this._stepTimeout);
      this._stepTimeout = null;
    }
    this.isPanning = false;

    if (this._rafId) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }

    window.removeEventListener('resize', this._onResize);
    window.removeEventListener('keydown', this._onKeyDown);

    const pauseBtn = document.getElementById('btn-pause');
    if (pauseBtn && this._pauseBtnHandler) {
      pauseBtn.removeEventListener('click', this._pauseBtnHandler, true);
      this._pauseBtnHandler = null;
    }

    // Kamera wieder sanft auf den Spieler zentrieren und Follow reaktivieren
    if (this.scene && this.scene.cameras?.main && this.scene.player?.sprite) {
      const cam = this.scene.cameras.main;
      cam.pan(this.scene.player.sprite.x, this.scene.player.sprite.y, 400, 'Cubic.easeOut', true, (camera, progress) => {
        if (progress === 1) {
          cam.startFollow(this.scene.player.sprite, false, 1, 1);
        }
      });
      setTimeout(() => {
        if (this.scene?.cameras?.main && this.scene.player?.sprite) {
          this.scene.cameras.main.startFollow(this.scene.player.sprite, false, 1, 1);
        }
      }, 420);
    }

    if (this.container) {
      this.container.style.opacity = '0';
      const el = this.container;
      setTimeout(() => {
        if (el && el.parentNode) {
          el.parentNode.removeChild(el);
        }
      }, 200);
      this.container = null;
    }

    document.body.classList.remove('tutorial-open');
  }
}
