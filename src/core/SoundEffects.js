/**
 * SoundEffects.js
 * Professionelles, bugfreies Sound-Design mit der Web Audio API.
 *
 * Highlights:
 * - Master-Bus mit DynamicsCompressor (verhindert Übersteuern & Audio-Clipping)
 * - Auto-Resume bei Benutzerinteraktion (verhindert stummen AudioContext)
 * - Generierte Loop-Buffer (Rosa, Braun & Weiss) für Zero-Allocation-Performance
 * - Generations-basiertes State-Tracking für Fahren, Jetpack & Bohren:
 *   Kein Verschlucken, Knacken, Hängenbleiben oder Ghost-Oscillator-Leaks mehr!
 * - Audiophiler Klang: Satter Felsbruch, kristallklare Erz-Chimes, kerniger Bohrer,
 *   weicher Kettenantrieb und kraftvoller Jetpack-Schub.
 */

class SoundManager {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.sfxGain = null;
    this.musicMasterGain = null;
    this.compressor = null;
    this.initialized = false;
    this.soundMuted = false;
    this.musicMuted = false;

    // Gespeicherte Audio-Einstellungen laden
    try {
      if (typeof localStorage !== 'undefined') {
        this.soundMuted = localStorage.getItem('vein_sound_muted') === '1';
        this.musicMuted = localStorage.getItem('vein_music_muted') === '1';
      }
    } catch (_) {}

    // Buffer-Cache
    this._noiseBuffers = {
      brown: null,
      pink: null,
      white: null
    };

    // Generations-Zähler & Zustände für kontinuierliche Sounds
    this._jetpackGen = 0;
    this._jetpackActive = false;
    this._jetpackNodes = null;

    this._drillGen = 0;
    this._drillActive = false;
    this._drillNodes = null;

    this._driveGen = 0;
    this._driveActive = false;
    this._driveNodes = null;

    this._refuelGen = 0;
    this._refuelActive = false;
    this._refuelNodes = null;

    // Subterranean Strings & Ambient Soundscape
    this._soundtrackInitialized = false;
    this._soundtrackDepth = 0;
    this._ambientGain = null;
    this._rumbleTimer = null;
    this._voices = [];
    this._lastDepth = 0;
    this._lastClickMs = 0;

    // Auto-Unlock Listener & Globale Sound-Bindungen
    this._setupAutoUnlock();
    this._setupMenuWatchers();
    this._setupGlobalButtonSounds();
  }

  // Kompatibilitäts-Getter für Player.js
  get _refuelRunning() {
    return this._refuelActive;
  }
  set _refuelRunning(val) {
    this._refuelActive = !!val;
  }

  get _jetpackRunning() {
    return this._jetpackActive;
  }
  set _jetpackRunning(val) {
    this._jetpackActive = !!val;
  }

  get _drillRunning() {
    return this._drillActive;
  }
  set _drillRunning(val) {
    this._drillActive = !!val;
  }

  get _driveRunning() {
    return this._driveActive;
  }
  set _driveRunning(val) {
    this._driveActive = !!val;
  }

  /**
   * Prüft zuverlässig, ob sich das Spiel in einem Menü, Dialog, Tutorial
   * oder Pause-Zustand befindet.
   */
  isMenuOpen() {
    if (typeof document === 'undefined') return false;
    if (document.body) {
      const cls = document.body.classList;
      if (
        cls.contains('modal-open') ||
        cls.contains('tutorial-open') ||
        cls.contains('discovery-modal-open') ||
        cls.contains('menu-open') ||
        cls.contains('in-menu')
      ) {
        return true;
      }
    }
    const bModal = document.getElementById('building-modal');
    if (bModal && bModal.style && bModal.style.display && bModal.style.display !== 'none') {
      return true;
    }
    const oreBackdrop = document.getElementById('ore-info-backdrop');
    if (oreBackdrop && oreBackdrop.style && oreBackdrop.style.display && oreBackdrop.style.display !== 'none') {
      return true;
    }
    const startScreen = document.getElementById('start-screen');
    if (startScreen && startScreen.style && startScreen.style.display !== 'none' && !startScreen.classList.contains('hidden')) {
      return true;
    }
    if (typeof window !== 'undefined' && window.__game && window.__game.scene) {
      try {
        const scene = window.__game.scene.getScene('MiningScene');
        if (scene && (scene.isPaused || scene.inStartScreen)) {
          return true;
        }
      } catch (_) {}
    }
    return false;
  }

  /**
   * Stoppt alle kontinuierlichen Soundeffekte (Fahren, Fliegen, Bohren, Betanken)
   * sofort und ohne Knacken.
   */
  stopAllLoops() {
    this.stopDrive();
    this.stopJetpack();
    this.stopDrill();
    this.stopRefuel();
  }

  _setupMenuWatchers() {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    const checkAndStop = () => {
      if (this.isMenuOpen()) {
        this.stopAllLoops();
      }
    };

    const attach = () => {
      if (!document.body) return;
      try {
        const observer = new MutationObserver(() => {
          checkAndStop();
        });
        observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });

        const bModal = document.getElementById('building-modal');
        if (bModal) {
          observer.observe(bModal, { attributes: true, attributeFilter: ['style', 'class'] });
        }
        const oreBackdrop = document.getElementById('ore-info-backdrop');
        if (oreBackdrop) {
          observer.observe(oreBackdrop, { attributes: true, attributeFilter: ['style', 'class'] });
        }
      } catch (_) {}

      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          this.stopAllLoops();
        }
      });
      window.addEventListener('blur', () => {
        this.stopAllLoops();
      });
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', attach);
    } else {
      attach();
    }
  }

  _setupAutoUnlock() {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    const unlock = () => {
      this.ensureContext();
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      if (!this.musicMuted) {
        this.startSoundtrack();
      }
      const events = ['pointerdown', 'keydown', 'touchstart', 'click'];
      events.forEach((evt) => {
        document.removeEventListener(evt, unlock, true);
        window.removeEventListener(evt, unlock, true);
      });
    };

    const events = ['pointerdown', 'keydown', 'touchstart', 'click'];
    events.forEach((evt) => {
      document.addEventListener(evt, unlock, { capture: true, passive: true });
      window.addEventListener(evt, unlock, { capture: true, passive: true });
    });
  }

  _setupGlobalButtonSounds() {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    // Fängt verlässlich alle interaktiven UI-Buttons im gesamten Spiel ab (Modals, Tabs, Menüs, HUD)
    const CLICKABLE_SELECTOR = 'button, [role="button"], .btn-action, .btn-secondary, .btn-primary, .btn-danger, .btn-close, .btn-buy, .btn-slot-load, .register-tab, .tab-btn, .modal-close-btn, .clickable, .dialog-btn, .start-slot-item, .hud-btn, .action-btn';

    const handleInteraction = (e) => {
      if (!e.target) return;
      const btn = e.target.closest(CLICKABLE_SELECTOR);
      if (!btn) return;
      if (btn.disabled || btn.classList.contains('disabled') || btn.getAttribute('aria-disabled') === 'true') {
        return;
      }
      const now = performance.now();
      if (btn._lastSoundMs && (now - btn._lastSoundMs) < 280) return;
      btn._lastSoundMs = now;
      this.playClick();
    };

    document.addEventListener('pointerdown', handleInteraction, { capture: true, passive: true });
  }

  init() {
    if (this.initialized) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;

      this.ctx = new AudioCtx();

      // Master Compressor gegen Clipping
      this.compressor = this.ctx.createDynamicsCompressor();
      this.compressor.threshold.setValueAtTime(-6, this.ctx.currentTime);
      this.compressor.knee.setValueAtTime(8, this.ctx.currentTime);
      this.compressor.ratio.setValueAtTime(6, this.ctx.currentTime);
      this.compressor.attack.setValueAtTime(0.003, this.ctx.currentTime);
      this.compressor.release.setValueAtTime(0.12, this.ctx.currentTime);
      this.compressor.connect(this.ctx.destination);

      // Master Gain für Gesamtlautstärke
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.9, this.ctx.currentTime);
      this.masterGain.connect(this.compressor);

      // SFX Gain Bus (Soundeffekte: Bohren, Triebwerk, UI, Abbau)
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(this.soundMuted ? 0.0001 : 1.0, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      // Music Master Gain Bus (Streicher-Soundtrack & Höhlengrollen)
      this.musicMasterGain = this.ctx.createGain();
      this.musicMasterGain.gain.setValueAtTime(this.musicMuted ? 0.0001 : 1.0, this.ctx.currentTime);
      this.musicMasterGain.connect(this.masterGain);

      // Statische Noise-Buffer vorbereiten (2 Sekunden)
      this._generateNoiseBuffers();

      this.initialized = true;
    } catch (e) {
      console.warn('AudioContext Initialisierung fehlgeschlagen:', e);
    }
  }

  ensureContext() {
    if (!this.initialized) this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  _generateNoiseBuffers() {
    if (!this.ctx) return;
    const sampleRate = this.ctx.sampleRate;
    const length = sampleRate * 2; // 2 Sekunden Loop

    // 1. Brown Noise (sehr tief, warmes Rumpeln)
    const brownBuf = this.ctx.createBuffer(1, length, sampleRate);
    const brownData = brownBuf.getChannelData(0);
    let lastOut = 0.0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      lastOut = (lastOut + 0.02 * white) / 1.02;
      brownData[i] = lastOut * 3.5;
    }
    this._noiseBuffers.brown = brownBuf;

    // 2. Pink Noise (angenehmes 1/f Rauschen)
    const pinkBuf = this.ctx.createBuffer(1, length, sampleRate);
    const pinkData = pinkBuf.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      pinkData[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }
    this._noiseBuffers.pink = pinkBuf;

    // 3. White Noise
    const whiteBuf = this.ctx.createBuffer(1, length, sampleRate);
    const whiteData = whiteBuf.getChannelData(0);
    for (let i = 0; i < length; i++) {
      whiteData[i] = (Math.random() * 2 - 1) * 0.25;
    }
    this._noiseBuffers.white = whiteBuf;
  }

  createNoiseBufferSource(type = 'brown') {
    if (!this.ctx) return null;
    const buf = this._noiseBuffers[type] || this._noiseBuffers.brown;
    if (!buf) return null;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    return src;
  }

  get muted() {
    return this.soundMuted;
  }

  set muted(val) {
    this.soundMuted = !!val;
  }

  toggleSoundMute() {
    this.soundMuted = !this.soundMuted;
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('vein_sound_muted', this.soundMuted ? '1' : '0');
      }
    } catch (_) {}
    if (this.sfxGain && this.ctx) {
      const now = this.ctx.currentTime;
      this.sfxGain.gain.cancelScheduledValues(now);
      this.sfxGain.gain.setTargetAtTime(this.soundMuted ? 0.0001 : 1.0, now, 0.04);
    }
    return this.soundMuted;
  }

  toggleMusicMute() {
    this.musicMuted = !this.musicMuted;
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('vein_music_muted', this.musicMuted ? '1' : '0');
      }
    } catch (_) {}
    if (this.musicMasterGain && this.ctx) {
      const now = this.ctx.currentTime;
      this.musicMasterGain.gain.cancelScheduledValues(now);
      this.musicMasterGain.gain.setTargetAtTime(this.musicMuted ? 0.0001 : 1.0, now, 0.1);
    }
    if (!this.musicMuted) {
      this.startSoundtrack();
    }
    return this.musicMuted;
  }

  toggleMute() {
    return this.toggleSoundMute();
  }

  // -----------------------------------------------------------------------
  // 1. FAHREN (Ruhiges, sattes Raupenfahrwerk mit Motor- & Schotter-Gleiten)
  // -----------------------------------------------------------------------
  startDrive() {
    if (this.isMenuOpen()) return;
    this.ensureContext();
    if (!this.ctx) return;

    if (this._driveActive && this._driveNodes) {
      // Läuft bereits kontinuierlich: Lautstärke sanft auffrischen
      const now = this.ctx.currentTime;
      this._driveNodes.gain.gain.cancelScheduledValues(now);
      this._driveNodes.gain.gain.setTargetAtTime(0.065, now, 0.05);
      return;
    }

    this._driveActive = true;
    const gen = ++this._driveGen;
    const now = this.ctx.currentTime;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.setTargetAtTime(0.065, now, 0.06);
    gain.connect(this.sfxGain);

    // 1. Sehr tiefer, dumpfer Diesel-Kolben Grundton (38 Hz, tiefpassgefiltert bei 85 Hz - kein UFO-Surren!)
    const osc1 = this.ctx.createOscillator();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(38, now);

    const osc1Flt = this.ctx.createBiquadFilter();
    osc1Flt.type = 'lowpass';
    osc1Flt.frequency.setValueAtTime(85, now);

    const osc1Gain = this.ctx.createGain();
    osc1Gain.gain.setValueAtTime(0.35, now);

    osc1.connect(osc1Flt);
    osc1Flt.connect(osc1Gain);
    osc1Gain.connect(gain);
    osc1.start(now);

    // 2. Echtes metallisches Kettenabroll- und Schotterknirschen (Brown + Pink Noise)
    const brownNoise = this.createNoiseBufferSource('brown');
    if (brownNoise) {
      const brownFlt = this.ctx.createBiquadFilter();
      brownFlt.type = 'bandpass';
      brownFlt.frequency.setValueAtTime(180, now);
      brownFlt.Q.setValueAtTime(0.8, now);

      const brownGain = this.ctx.createGain();
      brownGain.gain.setValueAtTime(0.45, now);

      brownNoise.connect(brownFlt);
      brownFlt.connect(brownGain);
      brownGain.connect(gain);
      brownNoise.start(now);
    }

    const pinkNoise = this.createNoiseBufferSource('pink');
    if (pinkNoise) {
      const pinkFlt = this.ctx.createBiquadFilter();
      pinkFlt.type = 'lowpass';
      pinkFlt.frequency.setValueAtTime(450, now);

      const pinkGain = this.ctx.createGain();
      pinkGain.gain.setValueAtTime(0.2, now);

      pinkNoise.connect(pinkFlt);
      pinkFlt.connect(pinkGain);
      pinkGain.connect(gain);
      pinkNoise.start(now);
    }

    this._driveNodes = { gain, osc1, brownNoise, pinkNoise };
  }

  stopDrive() {
    if (!this._driveActive && !this._driveNodes) return;
    this._driveActive = false;
    const currentGen = this._driveGen;
    const nodes = this._driveNodes;
    if (!nodes || !this.ctx) return;

    const now = this.ctx.currentTime;
    nodes.gain.gain.cancelScheduledValues(now);
    nodes.gain.gain.setTargetAtTime(0.0001, now, 0.03);

    setTimeout(() => {
      if (this._driveGen === currentGen) {
        try {
          if (nodes.osc1) nodes.osc1.stop();
          if (nodes.osc2) nodes.osc2.stop();
          if (nodes.brownNoise) nodes.brownNoise.stop();
          if (nodes.pinkNoise) nodes.pinkNoise.stop();
          nodes.gain.disconnect();
        } catch (_) {}
        this._driveNodes = null;
      }
    }, 100);
  }

  // -----------------------------------------------------------------------
  // 2. JETPACK (Triebwerks-Schubdüsen)
  // -----------------------------------------------------------------------
  startJetpack() {
    if (this.isMenuOpen()) return;
    this.ensureContext();
    if (!this.ctx) return;

    if (this._jetpackActive && this._jetpackNodes) {
      const now = this.ctx.currentTime;
      this._jetpackNodes.gain.gain.cancelScheduledValues(now);
      this._jetpackNodes.gain.gain.setTargetAtTime(0.085, now, 0.04);
      return;
    }

    this._jetpackActive = true;
    const gen = ++this._jetpackGen;
    const now = this.ctx.currentTime;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.setTargetAtTime(0.085, now, 0.05);
    gain.connect(this.sfxGain);

    // Reines, sattes Jetpack-Schubrauschen (OHNE Oszillator-Surrtöne)
    // 1. Aerodynamisches Haupt-Rauschen (Pink Noise sanft bandbegrenzt)
    const noise = this.createNoiseBufferSource('pink');
    const noiseFlt = this.ctx.createBiquadFilter();
    noiseFlt.type = 'lowpass';
    noiseFlt.frequency.setValueAtTime(540, now);
    noiseFlt.Q.setValueAtTime(0.7, now);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.42, now);

    if (noise) {
      noise.connect(noiseFlt);
      noiseFlt.connect(noiseGain);
      noiseGain.connect(gain);
      noise.start(now);
    }

    // 2. Tiefes Wummern / Schubdruck (Brown Noise)
    const brownNoise = this.createNoiseBufferSource('brown');
    const brownFlt = this.ctx.createBiquadFilter();
    brownFlt.type = 'lowpass';
    brownFlt.frequency.setValueAtTime(220, now);

    const brownGain = this.ctx.createGain();
    brownGain.gain.setValueAtTime(0.35, now);

    if (brownNoise) {
      brownNoise.connect(brownFlt);
      brownFlt.connect(brownGain);
      brownGain.connect(gain);
      brownNoise.start(now);
    }

    this._jetpackNodes = { gain, noise, brownNoise };
  }

  stopJetpack() {
    if (!this._jetpackActive && !this._jetpackNodes) return;
    this._jetpackActive = false;
    const currentGen = this._jetpackGen;
    const nodes = this._jetpackNodes;
    if (!nodes || !this.ctx) return;

    const now = this.ctx.currentTime;
    nodes.gain.gain.cancelScheduledValues(now);
    nodes.gain.gain.setTargetAtTime(0.0001, now, 0.03);

    setTimeout(() => {
      if (this._jetpackGen === currentGen) {
        try {
          if (nodes.noise) nodes.noise.stop();
          if (nodes.brownNoise) nodes.brownNoise.stop();
          nodes.gain.disconnect();
        } catch (_) {}
        this._jetpackNodes = null;
      }
    }, 100);
  }

  playJetpack() {
    if (!this._jetpackActive) this.startJetpack();
  }

  // -----------------------------------------------------------------------
  // 3. BOHREN (Gesteinsfräse / Diamantkopf)
  // -----------------------------------------------------------------------
  startDrilling() {
    if (this.isMenuOpen()) return;
    this.ensureContext();
    if (!this.ctx) return;

    if (this._drillActive && this._drillNodes) {
      const now = this.ctx.currentTime;
      this._drillNodes.gain.gain.cancelScheduledValues(now);
      this._drillNodes.gain.gain.setTargetAtTime(0.08, now, 0.03);
      return;
    }

    this._drillActive = true;
    const gen = ++this._drillGen;
    const now = this.ctx.currentTime;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.setTargetAtTime(0.08, now, 0.04);
    gain.connect(this.sfxGain);

    // 1. Tiefer Fräskopf-Motor (Dreieckswelle)
    const motor = this.ctx.createOscillator();
    motor.type = 'triangle';
    motor.frequency.setValueAtTime(68, now);

    // 2. Zahnrad-Vibration
    const gear = this.ctx.createOscillator();
    gear.type = 'sawtooth';
    gear.frequency.setValueAtTime(136, now);
    const gearGain = this.ctx.createGain();
    gearGain.gain.setValueAtTime(0.18, now);

    // LFO für rotierenden Bohrschlag (12 Hz)
    const lfo = this.ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(12, now);
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(15, now);
    lfo.connect(motor.frequency);
    lfo.connect(gear.frequency);

    // 3. Authentisches Stein-Schleifen (Brown Noise durch Bandpass)
    const stoneNoise = this.createNoiseBufferSource('brown');
    const stoneFlt = this.ctx.createBiquadFilter();
    stoneFlt.type = 'bandpass';
    stoneFlt.frequency.setValueAtTime(480, now);
    stoneFlt.Q.setValueAtTime(2.0, now);
    const stoneGain = this.ctx.createGain();
    stoneGain.gain.setValueAtTime(0.45, now);

    if (stoneNoise) {
      stoneNoise.connect(stoneFlt);
      stoneFlt.connect(stoneGain);
      stoneGain.connect(gain);
      stoneNoise.start(now);
    }

    const motorFlt = this.ctx.createBiquadFilter();
    motorFlt.type = 'lowpass';
    motorFlt.frequency.setValueAtTime(320, now);

    motor.connect(motorFlt);
    gear.connect(gearGain);
    gearGain.connect(motorFlt);
    motorFlt.connect(gain);

    motor.start(now);
    gear.start(now);
    lfo.start(now);

    this._drillNodes = { gain, motor, gear, lfo, stoneNoise };
  }

  stopDrilling() {
    if (!this._drillActive && !this._drillNodes) return;
    this._drillActive = false;
    const currentGen = this._drillGen;
    const nodes = this._drillNodes;
    if (!nodes || !this.ctx) return;

    const now = this.ctx.currentTime;
    nodes.gain.gain.cancelScheduledValues(now);
    nodes.gain.gain.setTargetAtTime(0.0001, now, 0.03);

    setTimeout(() => {
      if (this._drillGen === currentGen) {
        try {
          if (nodes.motor) nodes.motor.stop();
          if (nodes.gear) nodes.gear.stop();
          if (nodes.lfo) nodes.lfo.stop();
          if (nodes.stoneNoise) nodes.stoneNoise.stop();
          nodes.gain.disconnect();
        } catch (_) {}
        this._drillNodes = null;
      }
    }, 100);
  }

  stopDrill() {
    this.stopDrilling();
  }

  playDrillTick() {
    if (!this._drillActive) this.startDrilling();
  }

  // -----------------------------------------------------------------------
  // 4. BLOCKZERSTÖRUNG (Satter Felsbruch & Schuttkollaps)
  // -----------------------------------------------------------------------
  playTileDestroy() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    // A) Bässe & Wucht (Thump)
    const boom = this.ctx.createOscillator();
    const boomGain = this.ctx.createGain();
    boom.type = 'triangle';
    boom.frequency.setValueAtTime(120, now);
    boom.frequency.exponentialRampToValueAtTime(32, now + 0.18);

    boomGain.gain.setValueAtTime(0.32, now);
    boomGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);

    boom.connect(boomGain);
    boomGain.connect(this.sfxGain);
    boom.start(now);
    boom.stop(now + 0.2);

    // B) Schutt & Bruch-Splitter (Brown/Pink Noise Burst)
    const noise = this.createNoiseBufferSource('brown');
    if (noise) {
      const flt = this.ctx.createBiquadFilter();
      flt.type = 'lowpass';
      flt.frequency.setValueAtTime(550, now);
      flt.frequency.exponentialRampToValueAtTime(80, now + 0.22);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.25, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);

      noise.connect(flt);
      flt.connect(noiseGain);
      noiseGain.connect(this.sfxGain);
      noise.start(now);
      noise.stop(now + 0.23);
    }
  }

  // -----------------------------------------------------------------------
  // 5. ERZ / KRISTALL AUFSAMMELN (Harmonische Mineral-Chimes)
  // -----------------------------------------------------------------------
  playOreCollect(rarity = 1) {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    // Harmonische Tonleiter (C-Dur Pentatonik)
    const scale = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98];
    const baseIndex = Math.min(scale.length - 2, Math.max(0, (rarity || 1) - 1));
    const f1 = scale[baseIndex];
    const f2 = scale[baseIndex + 1];

    // Primärton (klarer Sinus)
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(f1, now);
    gain1.gain.setValueAtTime(0.14, now);
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.24);

    osc1.connect(gain1);
    gain1.connect(this.sfxGain);
    osc1.start(now);
    osc1.stop(now + 0.24);

    // Sekundärton (zarte Glocken-Oberwelle 30ms verzögert)
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(f2, now + 0.03);
    gain2.gain.setValueAtTime(0.09, now + 0.03);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);

    osc2.connect(gain2);
    gain2.connect(this.sfxGain);
    osc2.start(now + 0.03);
    osc2.stop(now + 0.28);
  }

  playGemCollect(rarity = 1) {
    this.playOreCollect(Math.max(2, rarity));
  }

  // -----------------------------------------------------------------------
  // 6. UI KLICK (Taktil, diskret & einheitlich im ganzen Spiel)
  // -----------------------------------------------------------------------
  playClick() {
    if (this.muted) return;
    const nowMs = performance.now();
    // 160ms Debounce verhindert doppeltes oder dreifaches Klicken bei manuellem Aufruf + globalem Listener + Touch-Events
    if (this._lastClickMs && (nowMs - this._lastClickMs) < 160) return;
    this._lastClickMs = nowMs;

    this.ensureContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;

      // Hochwertiger, harmonischer taktiler UI-Klick
      // 1. Zarter Mikroklick / Transiente (kurzer Nadelimpuls)
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(1400, now);
      osc1.frequency.exponentialRampToValueAtTime(360, now + 0.026);

      gain1.gain.setValueAtTime(0.085, now);
      gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.026);

      osc1.connect(gain1);
      gain1.connect(this.sfxGain);

      osc1.start(now);
      osc1.stop(now + 0.028);

      // 2. Subtiler warmer Körper (Haptik-Pop)
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(520, now);
      osc2.frequency.exponentialRampToValueAtTime(180, now + 0.024);

      gain2.gain.setValueAtTime(0.05, now);
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.024);

      osc2.connect(gain2);
      gain2.connect(this.sfxGain);

      osc2.start(now);
      osc2.stop(now + 0.026);
    } catch (_) {}
  }

  // -----------------------------------------------------------------------
  // 7. KAUF / DEPOT-EINLAGERUNG (Zweiklang "Ka-Ching" Tech)
  // -----------------------------------------------------------------------
  playPurchase() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = [659.25, 880.00, 1174.66]; // E5 -> A5 -> D6

    notes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const startTime = now + i * 0.045;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(0.09, startTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.22);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(startTime);
      osc.stop(startTime + 0.22);
    });
  }

  // -----------------------------------------------------------------------
  // 8. MODUL-UPGRADE / FORSCHUNG (Triumphaler Level-Up Akkord)
  // -----------------------------------------------------------------------
  playUpgrade() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    // Aufsteigender Dur-7 Akkord (C5 - E5 - G5 - C6)
    const chord = [523.25, 659.25, 783.99, 1046.50];

    chord.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const startTime = now + i * 0.055;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(0.12, startTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.38);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(startTime);
      osc.stop(startTime + 0.38);
    });
  }

  // -----------------------------------------------------------------------
  // 9. SCHMELZOFEN & FERTIGUNG (Harmonischer Amboss-Chime / Fertig-Klang)
  // -----------------------------------------------------------------------
  playSmelt() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    // 1. Feiner Amboss-Anschlag (kurzer Klopfton)
    const tap = this.ctx.createOscillator();
    const tapGain = this.ctx.createGain();
    tap.type = 'triangle';
    tap.frequency.setValueAtTime(520, now);
    tap.frequency.exponentialRampToValueAtTime(240, now + 0.04);
    tapGain.gain.setValueAtTime(0.08, now);
    tapGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.045);
    tap.connect(tapGain);
    tapGain.connect(this.sfxGain);
    tap.start(now);
    tap.stop(now + 0.05);

    // 2. Warmer, harmonischer Metall-Zweiklang (A5 -> E6) mit kristallklarem Ausklingen
    const tones = [
      { freq: 880.00, delay: 0, gain: 0.07, decay: 0.28 },      // Vorstufe A5
      { freq: 1318.51, delay: 0.05, gain: 0.11, decay: 0.50 },  // Glanzton E6 (Quinte)
      { freq: 2637.02, delay: 0.05, gain: 0.035, decay: 0.32 }  // Kristalliner Oberton E7 (Oktave)
    ];

    tones.forEach(({ freq, delay, gain, decay }) => {
      const startTime = now + delay;
      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      oscGain.gain.setValueAtTime(gain, startTime);
      oscGain.gain.exponentialRampToValueAtTime(0.0001, startTime + decay);

      osc.connect(oscGain);
      oscGain.connect(this.sfxGain);
      osc.start(startTime);
      osc.stop(startTime + decay + 0.02);
    });
  }

  // -----------------------------------------------------------------------
  // 10. OFEN / BRENNKAMMER (Feuerstoss)
  // -----------------------------------------------------------------------
  playFurnace() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const fire = this.createNoiseBufferSource('brown');
    if (fire) {
      const flt = this.ctx.createBiquadFilter();
      flt.type = 'bandpass';
      flt.frequency.setValueAtTime(320, now);
      flt.frequency.linearRampToValueAtTime(580, now + 0.25);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);

      fire.connect(flt);
      flt.connect(gain);
      gain.connect(this.sfxGain);
      fire.start(now);
      fire.stop(now + 0.26);
    }
  }

  // -----------------------------------------------------------------------
  // 11. FEHLER / WARNUNG (Sanfter Tech-Doppelton)
  // -----------------------------------------------------------------------
  playError() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.setValueAtTime(160, now + 0.08);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.16);
  }

  // -----------------------------------------------------------------------
  // 12. SCHADEN (Karosserie-Aufprall / Kratzen)
  // -----------------------------------------------------------------------
  playDamage() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    const clank = this.ctx.createOscillator();
    const clankGain = this.ctx.createGain();
    clank.type = 'sawtooth';
    clank.frequency.setValueAtTime(140, now);
    clank.frequency.exponentialRampToValueAtTime(40, now + 0.14);

    clankGain.gain.setValueAtTime(0.16, now);
    clankGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);

    clank.connect(clankGain);
    clankGain.connect(this.sfxGain);
    clank.start(now);
    clank.stop(now + 0.14);
  }

  // -----------------------------------------------------------------------
  // 13. COCKPIT TANKALARM / RÜCKKEHR-WARNUNG (Harmonischer Sci-Fi Bordcomputer Chime)
  // -----------------------------------------------------------------------
  playCockpitAlarm() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    // Zwei edle, melodische Chime-Impulse (E5 -> B5, Quinte aufsteigend)
    // Klingt wie ein moderner Raumschiff-Bordcomputer: klar verständlich, elegant & wohlklingend
    const pulses = [
      { freq: 659.25, timeOffset: 0.0 },  // E5
      { freq: 987.77, timeOffset: 0.16 }  // B5
    ];

    pulses.forEach(({ freq, timeOffset }) => {
      const t = now + timeOffset;
      const duration = 0.28;

      // 1. Warmer Grundton (Kombination aus Sine und weichem Triangle)
      const osc = this.ctx.createOscillator();
      const oscHarmonic = this.ctx.createOscillator();
      const subTone = this.ctx.createOscillator();
      const noteGain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);

      // Zweiter Oszillator für sanften Glocken-Oberton (Oktave + dezente Schwebung)
      oscHarmonic.type = 'triangle';
      oscHarmonic.frequency.setValueAtTime(freq * 2, t);

      // Sub-Ton für akustische Fülle im Cockpit (eine Oktave tiefer)
      subTone.type = 'sine';
      subTone.frequency.setValueAtTime(freq * 0.5, t);

      // Warmer Tiefpassfilter, nimmt jegliche scharfe Härte
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2600, t);
      filter.frequency.exponentialRampToValueAtTime(1400, t + duration);
      filter.Q.setValueAtTime(1.5, t);

      // Glockenartige Hüllkurve: Knackfreier 5ms Attack, langes warmes Ausklingen
      noteGain.gain.setValueAtTime(0.0001, t);
      noteGain.gain.linearRampToValueAtTime(0.18, t + 0.006);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

      osc.connect(filter);
      oscHarmonic.connect(filter);
      subTone.connect(filter);
      filter.connect(noteGain);
      noteGain.connect(this.sfxGain);

      osc.start(t);
      oscHarmonic.start(t);
      subTone.start(t);

      const stopT = t + duration + 0.02;
      osc.stop(stopT);
      oscHarmonic.stop(stopT);
      subTone.stop(stopT);
    });
  }

  // -----------------------------------------------------------------------
  // 14. SCHWEISSEN (Lichtbogen-Zischen & Knistern)
  // -----------------------------------------------------------------------
  playWeldSparks() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const noise = this.createNoiseBufferSource('pink');
    if (noise) {
      const flt = this.ctx.createBiquadFilter();
      flt.type = 'bandpass';
      flt.frequency.setValueAtTime(2200 + (Math.random() - 0.5) * 800, now);
      flt.Q.setValueAtTime(3.5, now);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.045, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);

      noise.connect(flt);
      flt.connect(gain);
      gain.connect(this.sfxGain);
      noise.start(now);
      noise.stop(now + 0.09);
    }
  }

  // -----------------------------------------------------------------------
  // 15. BETANKUNG (Pumpe & Treibstoff-Durchfluss)
  // -----------------------------------------------------------------------
  startRefuel() {
    if (this.isMenuOpen()) return;
    this.ensureContext();
    if (!this.ctx) return;

    if (this._refuelActive && this._refuelNodes) {
      const now = this.ctx.currentTime;
      this._refuelNodes.gain.gain.cancelScheduledValues(now);
      this._refuelNodes.gain.gain.setTargetAtTime(0.065, now, 0.04);
      return;
    }

    this._refuelActive = true;
    const gen = ++this._refuelGen;
    const now = this.ctx.currentTime;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.setTargetAtTime(0.065, now, 0.06);
    gain.connect(this.sfxGain);

    // 1. Sanfter Niederfrequenz-Pumpen-Puls (48 Hz Dreieckswelle mit sanfter Amplitudenmodulation)
    const pumpOsc = this.ctx.createOscillator();
    pumpOsc.type = 'triangle';
    pumpOsc.frequency.setValueAtTime(48, now);

    const pumpFlt = this.ctx.createBiquadFilter();
    pumpFlt.type = 'lowpass';
    pumpFlt.frequency.setValueAtTime(95, now);

    const pumpGain = this.ctx.createGain();
    pumpGain.gain.setValueAtTime(0.35, now);

    const lfo = this.ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(4.5, now);
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(0.08, now);
    lfo.connect(pumpGain.gain);

    pumpOsc.connect(pumpFlt);
    pumpFlt.connect(pumpGain);
    pumpGain.connect(gain);
    pumpOsc.start(now);
    lfo.start(now);

    // 2. Flüssigkeits-Durchfluss im Schlauch (Rosa Rauschen durch resonanten Bandpass bei 440 Hz)
    const flowNoise = this.createNoiseBufferSource('pink');
    if (flowNoise) {
      const flowFlt = this.ctx.createBiquadFilter();
      flowFlt.type = 'bandpass';
      flowFlt.frequency.setValueAtTime(440, now);
      flowFlt.Q.setValueAtTime(1.8, now);

      const flowGain = this.ctx.createGain();
      flowGain.gain.setValueAtTime(0.24, now);

      flowNoise.connect(flowFlt);
      flowFlt.connect(flowGain);
      flowGain.connect(gain);
      flowNoise.start(now);
    }

    // 3. Dezenter Lade-Summton (elektrisches Feld der Tanksäule, 176 Hz)
    const humOsc = this.ctx.createOscillator();
    humOsc.type = 'sine';
    humOsc.frequency.setValueAtTime(176, now);
    const humGain = this.ctx.createGain();
    humGain.gain.setValueAtTime(0.08, now);
    humOsc.connect(humGain);
    humGain.connect(gain);
    humOsc.start(now);

    this._refuelNodes = { gain, pumpOsc, lfo, flowNoise, humOsc };
  }

  stopRefuel() {
    if (!this._refuelActive && !this._refuelNodes) return;
    this._refuelActive = false;
    const currentGen = this._refuelGen;
    const nodes = this._refuelNodes;
    if (!nodes || !this.ctx) return;

    const now = this.ctx.currentTime;
    nodes.gain.gain.cancelScheduledValues(now);
    nodes.gain.gain.setTargetAtTime(0.0001, now, 0.03);

    setTimeout(() => {
      if (this._refuelGen === currentGen) {
        try {
          if (nodes.pumpOsc) nodes.pumpOsc.stop();
          if (nodes.lfo) nodes.lfo.stop();
          if (nodes.flowNoise) nodes.flowNoise.stop();
          if (nodes.humOsc) nodes.humOsc.stop();
          nodes.gain.disconnect();
        } catch (_) {}
        this._refuelNodes = null;
      }
    }, 100);
  }

  playRefuelComplete() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    // Harmonischer Aufwärts-Doppelakkord (C6 1046.5 Hz -> E6 1318.5 Hz) als klares "Voll!"-Signal
    const tones = [
      { freq: 1046.50, delay: 0.0, gain: 0.09, decay: 0.22 },
      { freq: 1318.51, delay: 0.08, gain: 0.12, decay: 0.35 }
    ];

    tones.forEach(({ freq, delay, gain: vol, decay }) => {
      const startTime = now + delay;
      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      oscGain.gain.setValueAtTime(vol, startTime);
      oscGain.gain.exponentialRampToValueAtTime(0.0001, startTime + decay);

      osc.connect(oscGain);
      oscGain.connect(this.sfxGain);
      osc.start(startTime);
      osc.stop(startTime + decay + 0.02);
    });
  }

  playExplosion() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    // Tiefer Sinus-Sub-Drop
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(25, now + 0.5);

    oscGain.gain.setValueAtTime(0.35, now);
    oscGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);

    osc.connect(oscGain);
    oscGain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.65);

    // Weißes/Braunes Rauschen für Detonationsschock
    const src = this.createNoiseBufferSource('brown') || this.createNoiseBufferSource('white');
    if (src) {
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, now);
      filter.frequency.linearRampToValueAtTime(120, now + 0.6);

      const nGain = this.ctx.createGain();
      nGain.gain.setValueAtTime(0.4, now);
      nGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);

      src.connect(filter);
      filter.connect(nGain);
      nGain.connect(this.sfxGain);
      src.start(now);
      src.stop(now + 0.65);
    }
  }

  _getNoiseBuffer(type = 'brown') {
    return this._noiseBuffers[type] || this._noiseBuffers.brown || null;
  }

  playItemUse() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(640, now + 0.18);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.22);
  }

  playArtifactFind() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    // Mystischer, erhabener Akkord (C5, G5, C6)
    const freqs = [523.25, 783.99, 1046.50];
    freqs.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      gain.gain.setValueAtTime(0.16, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 0.6);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.65);
    });
  }

  playPneumaticDeposit() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    // 1. Zischender Druckluft-Saugsound (Bandpass-Rauschen swept nach oben)
    const noise = this.createNoiseBufferSource('pink') || this.createNoiseBufferSource('white');
    if (noise) {
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(350, now);
      filter.frequency.exponentialRampToValueAtTime(2400, now + 0.35);
      filter.Q.value = 3.5;

      const nGain = this.ctx.createGain();
      nGain.gain.setValueAtTime(0.35, now);
      nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      noise.connect(filter);
      filter.connect(nGain);
      nGain.connect(this.sfxGain);
      noise.start(now);
      noise.stop(now + 0.5);
    }

    // 2. Befriedigender pneumatischer "Plop/Ding"-Bestätigungston (Aufsteigende Quinte)
    [587.33, 880].forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + 0.15 + i * 0.1);

      gain.gain.setValueAtTime(0.2, now + 0.15 + i * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15 + i * 0.1 + 0.3);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now + 0.15 + i * 0.1);
      osc.stop(now + 0.15 + i * 0.1 + 0.35);
    });
  }

  playGeothermalRefuel() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    // Warmer harmonischer Erdwärme-Ladeton (Sinus 160Hz mit Phasing)
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.linearRampToValueAtTime(220, now + 0.4);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.48);
  }
  // -----------------------------------------------------------------------
  // UNTERTAGE SOUNDTRACK: Echte musikalische Streicher (Celli, Bratschen, Bässe) & Melodielinien
  // -----------------------------------------------------------------------
  _initSoundtrack() {
    if (this._soundtrackInitialized || !this.ctx || !this.masterGain) return;
    this._soundtrackInitialized = true;

    try {
      // Übergeordneter Musik-Bus mit Fader
      this._ambientGain = this.ctx.createGain();
      this._ambientGain.gain.setValueAtTime(0.0001, this.ctx.currentTime);

      // Warmer Streicher-Master-Filter mit leichter Resonanz (verhindert scharfe Höhen, simuliert Holzresonanzkörper)
      const celloBodyFilter = this.ctx.createBiquadFilter();
      celloBodyFilter.type = 'lowpass';
      celloBodyFilter.frequency.setValueAtTime(1400, this.ctx.currentTime);
      celloBodyFilter.Q.setValueAtTime(1.8, this.ctx.currentTime);

      // Reverb-artiger sanfter Raumklang (Feedback Delay für weite Kathedralen-/Höhlen-Akustik)
      const delayNode = this.ctx.createDelay(1.2);
      delayNode.delayTime.setValueAtTime(0.48, this.ctx.currentTime);
      const feedbackGain = this.ctx.createGain();
      feedbackGain.gain.setValueAtTime(0.38, this.ctx.currentTime);
      const delayFilter = this.ctx.createBiquadFilter();
      delayFilter.type = 'lowpass';
      delayFilter.frequency.setValueAtTime(800, this.ctx.currentTime);

      delayNode.connect(delayFilter);
      delayFilter.connect(feedbackGain);
      feedbackGain.connect(delayNode);
      delayFilter.connect(this._ambientGain);

      this._ambientGain.connect(celloBodyFilter);
      celloBodyFilter.connect(this.musicMasterGain);

      this._musicDelayNode = delayNode;

      // Startet die musikalische Partitur-Schleife (Orchestrierte Akkordfolgen & sanfte Cello-Soli)
      this._startMusicSequencer();

      // Kontinuierliches, unregelmäßiges Fels- und Höhlengrollen
      this._scheduleNextRumble();
    } catch (err) {
      console.warn('Soundtrack-Initialisierung fehlgeschlagen:', err);
    }
  }

  /**
   * Erzeugt einen warmen, akustisch reichen Streicherklang (Bogenstrich-Attack, Vibrato, Holzresonanz).
   */
  _playStringNote(freq, startTime, duration, velocity = 0.5, isLead = false) {
    if (!this.ctx || !this._ambientGain) return;
    const now = startTime;

    // 2 gegeneinander verstimmte Sägezahn- und Dreiecks-Oszillatoren (simuliert Ensemble & Bogenreibung)
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const osc3 = this.ctx.createOscillator();

    osc1.type = isLead ? 'sawtooth' : 'sawtooth';
    osc2.type = 'sawtooth';
    osc3.type = 'triangle'; // Warmer Bauch / Grundton

    osc1.frequency.setValueAtTime(freq, now);
    osc2.frequency.setValueAtTime(freq, now);
    osc3.frequency.setValueAtTime(freq, now);

    // Warmes Bogen-Chorus Detuning (Schwebung)
    osc1.detune.setValueAtTime(-5, now);
    osc2.detune.setValueAtTime(5, now);
    osc3.detune.setValueAtTime(0, now);

    // Bogenstrich-Formant-Filter (simuliert den hölzernen Korpus eines Cellos/Kontrabasses)
    const formantFilter = this.ctx.createBiquadFilter();
    formantFilter.type = 'lowpass';
    const baseCutoff = isLead ? 950 : 650;
    formantFilter.frequency.setValueAtTime(baseCutoff * 0.6, now);
    // Bogenansatz: Filter öffnet sich mit dem Strich und schließt sanft
    formantFilter.frequency.linearRampToValueAtTime(baseCutoff * 1.3, now + duration * 0.35);
    formantFilter.frequency.linearRampToValueAtTime(baseCutoff * 0.7, now + duration);
    formantFilter.Q.setValueAtTime(isLead ? 2.5 : 1.6, now);

    // Vibrato-LFO (setzt nach 0.8s sanft ein, wie bei einem echten Cellisten)
    const vibrato = this.ctx.createOscillator();
    const vibratoGain = this.ctx.createGain();
    vibrato.frequency.setValueAtTime(4.6, now); // 4.6 Hz natürliches Vibrato
    vibratoGain.gain.setValueAtTime(0.0001, now);
    vibratoGain.gain.setValueAtTime(0.0001, now + 0.6);
    vibratoGain.gain.linearRampToValueAtTime(isLead ? 6.5 : 3.2, now + 1.6); // Detune-Stärke in Cents

    vibrato.connect(vibratoGain);
    vibratoGain.connect(osc1.detune);
    vibratoGain.connect(osc2.detune);

    // Musikalische Hüllkurve: Sanfter Bogenansatz (Attack), langes warmes Halten (Sustain) und weiches Ausklingen (Release)
    const noteGain = this.ctx.createGain();
    const attack = isLead ? 0.7 : 1.2;
    const release = isLead ? 1.4 : 2.2;
    const peakGain = velocity * (isLead ? 0.14 : 0.09);

    noteGain.gain.setValueAtTime(0.0001, now);
    noteGain.gain.linearRampToValueAtTime(peakGain, now + attack);
    noteGain.gain.setValueAtTime(peakGain * 0.85, now + duration - release);
    noteGain.gain.linearRampToValueAtTime(0.0001, now + duration);

    // Signalfluss
    osc1.connect(formantFilter);
    osc2.connect(formantFilter);
    osc3.connect(formantFilter);
    formantFilter.connect(noteGain);

    // Trockenes Signal zum Hauptbus
    noteGain.connect(this._ambientGain);

    // Feuchtes Signal in den Höhlen-Reverb
    if (this._musicDelayNode) {
      const sendGain = this.ctx.createGain();
      sendGain.gain.setValueAtTime(0.4, now);
      noteGain.connect(sendGain);
      sendGain.connect(this._musicDelayNode);
    }

    const stopTime = now + duration + 0.1;
    osc1.start(now);
    osc2.start(now);
    osc3.start(now);
    vibrato.start(now);

    osc1.stop(stopTime);
    osc2.stop(stopTime);
    osc3.stop(stopTime);
    vibrato.stop(stopTime);
  }

  /**
   * Endlos spielender, ruhiger Soundtrack-Sequenzer.
   * Läuft vorausschauend (Web Audio scheduling) und spielt melancholische,
   * wunderschöne Moll-Akkorde und langsame Cello-Melodien.
   */
  _startMusicSequencer() {
    // Akkordprogression (Kammermusik für Höhlenforscher in D-Moll):
    // 1. Dm9  (D - F - A - C - E)      - Ruhig, tief, geheimnisvoll
    // 2. Bbmaj7 (Bb - D - F - A)       - Wehmütig, erhaben, warm
    // 3. Gm9  (G - Bb - D - F - A)     - Gemütlich, getragen
    // 4. Asus4 -> A7 (A - D - E -> C#) - Epische Höhlenmelancholie
    // 5. Fmaj7 (F - A - C - E)         - Aufblühendes Licht im Fels
    // 6. C/E -> Dm (C - E - G -> D - F)- Zurückkehrende Geborgenheit
    const chords = [
      {
        bass: 73.42,  // D2 (Cello Bass)
        sub: 36.71,   // D1 (Kontrabass)
        pads: [110.0, 146.83, 174.61, 220.0], // A2, D3, F3, A3
        leadMelody: [
          { note: 220.0, offset: 0.5, dur: 3.5 },  // A3
          { note: 261.63, offset: 4.0, dur: 3.0 }, // C4
          { note: 246.94, offset: 7.2, dur: 2.8 }  // B3
        ],
        duration: 11
      },
      {
        bass: 58.27,  // Bb1
        sub: 29.14,   // Bb0
        pads: [116.54, 146.83, 174.61, 220.0], // Bb2, D3, F3, A3
        leadMelody: [
          { note: 220.0, offset: 0.6, dur: 4.0 },  // A3
          { note: 174.61, offset: 4.5, dur: 3.2 }, // F3
          { note: 146.83, offset: 7.8, dur: 3.0 }  // D3
        ],
        duration: 11
      },
      {
        bass: 98.00,  // G2
        sub: 49.00,   // G1
        pads: [116.54, 146.83, 174.61, 220.0], // Bb2, D3, F3, A3
        leadMelody: [
          { note: 196.0, offset: 0.4, dur: 3.2 },  // G3
          { note: 220.0, offset: 3.8, dur: 2.8 },  // A3
          { note: 261.63, offset: 6.8, dur: 4.0 }  // C4
        ],
        duration: 11
      },
      {
        bass: 55.00,  // A1
        sub: 27.50,   // A0
        pads: [110.0, 146.83, 164.81, 220.0], // A2, D3, E3, A3
        leadMelody: [
          { note: 293.66, offset: 0.5, dur: 3.8 }, // D4
          { note: 277.18, offset: 4.5, dur: 3.5 }, // C#4
          { note: 220.0, offset: 8.0, dur: 2.8 }   // A3
        ],
        duration: 11
      },
      {
        bass: 87.31,  // F2
        sub: 43.65,   // F1
        pads: [130.81, 164.81, 174.61, 220.0], // C3, E3, F3, A3
        leadMelody: [
          { note: 261.63, offset: 0.5, dur: 3.5 }, // C4
          { note: 329.63, offset: 4.2, dur: 3.2 }, // E4
          { note: 293.66, offset: 7.5, dur: 3.2 }  // D4
        ],
        duration: 11
      },
      {
        bass: 73.42,  // D2
        sub: 36.71,   // D1
        pads: [110.0, 130.81, 146.83, 174.61], // A2, C3, D3, F3
        leadMelody: [
          { note: 220.0, offset: 0.5, dur: 4.0 },  // A3
          { note: 174.61, offset: 4.8, dur: 3.5 }, // F3
          { note: 146.83, offset: 8.2, dur: 3.5 }  // D3
        ],
        duration: 12
      }
    ];

    let chordIndex = 0;
    let nextChordTime = this.ctx.currentTime + 0.1;

    const scheduleLoop = () => {
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      if (nextChordTime < now) {
        nextChordTime = now + 0.1;
      }

      // Solange vorausschauend für die nächsten 14 Sekunden vorplanen
      while (nextChordTime < now + 14) {
        const chord = chords[chordIndex % chords.length];
        const t = nextChordTime;
        const dur = chord.duration;

        // 1. Tiefes Kontrabass-Fundament (Sub)
        this._playStringNote(chord.sub, t, dur + 1.2, 0.45, false);

        // 2. Cello-Grundton
        this._playStringNote(chord.bass, t + 0.1, dur + 1.0, 0.55, false);

        // 3. Schwebende Streicher-Harmonie (Bratschen & Celli)
        chord.pads.forEach((padFreq, idx) => {
          this._playStringNote(padFreq, t + 0.2 + idx * 0.15, dur + 0.8, 0.38, false);
        });

        // 4. Sanftes Cello-Melodiespiel im Vordergrund
        if (chord.leadMelody) {
          chord.leadMelody.forEach(m => {
            this._playStringNote(m.note, t + m.offset, m.dur, 0.65, true);
          });
        }

        nextChordTime += dur;
        chordIndex++;
      }

      // Regelmäßige Prüfung alle 4 Sekunden
      this._sequencerTimer = setTimeout(scheduleLoop, 4000);
    };

    scheduleLoop();
  }

  // Zufälliges tiefes, gruseliges Untertage-Grollen (Rumble)
  _scheduleNextRumble() {
    if (this._rumbleTimeout) clearTimeout(this._rumbleTimeout);
    // Zufälliges Intervall zwischen 18 und 36 Sekunden
    const delay = 18000 + Math.random() * 18000;
    this._rumbleTimeout = setTimeout(() => {
      this._playSubterraneanRumble();
      this._scheduleNextRumble();
    }, delay);
  }

  _playSubterraneanRumble() {
    if (this.muted || this.musicMuted || !this.ctx || !this._ambientGain || (this._lastDepth || 0) < 3) return;
    try {
      const now = this.ctx.currentTime;
      const duration = 5.0 + Math.random() * 3.5;

      // 1. Tiefes tektonisches Reiben (akustisches Grollen)
      const noise = this.createNoiseBufferSource('brown');
      if (noise) {
        const noiseFilter = this.ctx.createBiquadFilter();
        noiseFilter.type = 'lowpass';
        const startFreq = 40 + Math.random() * 25;
        noiseFilter.frequency.setValueAtTime(startFreq, now);
        noiseFilter.frequency.exponentialRampToValueAtTime(startFreq + 40, now + duration * 0.4);
        noiseFilter.frequency.exponentialRampToValueAtTime(28, now + duration);
        noiseFilter.Q.setValueAtTime(3.8, now);

        const noiseGain = this.ctx.createGain();
        const maxGain = (0.12 + Math.random() * 0.08) * Math.min(1.0, this._soundtrackDepth);
        noiseGain.gain.setValueAtTime(0.0001, now);
        noiseGain.gain.linearRampToValueAtTime(maxGain, now + duration * 0.35);
        noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(this.musicMasterGain);

        noise.start(now);
        noise.stop(now + duration);
      }

      // 2. Gruseliger Erdschwingungs-Bauch (26Hz bis 50Hz)
      const subOsc = this.ctx.createOscillator();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(28, now);
      subOsc.frequency.exponentialRampToValueAtTime(48, now + duration * 0.38);
      subOsc.frequency.exponentialRampToValueAtTime(22, now + duration);

      const subGain = this.ctx.createGain();
      const maxSubGain = (0.15 + Math.random() * 0.08) * Math.min(1.0, this._soundtrackDepth);
      subGain.gain.setValueAtTime(0.0001, now);
      subGain.gain.linearRampToValueAtTime(maxSubGain, now + duration * 0.3);
      subGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      subOsc.connect(subGain);
      subGain.connect(this.musicMasterGain);

      subOsc.start(now);
      subOsc.stop(now + duration);
    } catch (e) {
      console.warn('Rumble-Fehler:', e);
    }
  }

  /**
   * Startet den Soundtrack verlässlich (z. B. nach Spielstart oder Entmutung).
   */
  startSoundtrack() {
    if (this.musicMuted) return;
    this.ensureContext();
    if (!this._soundtrackInitialized) {
      this._initSoundtrack();
    }
    this.updateSoundtrack(this._lastDepth || 0);
  }

  /**
   * Wird im Spielzyklus aufgerufen.
   * Regelt den Übergang zwischen Oberfläche (ruhige, wohlklingende Atmosphäre) und Untertage (anschwellend & tief).
   * @param {number} depthMeters - Aktuelle Tiefe in Metern
   */
  updateSoundtrack(depthMeters = 0) {
    this._lastDepth = depthMeters;
    if (this.musicMuted) {
      if (this._ambientGain && this.ctx) {
        this._ambientGain.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.4);
      }
      return;
    }
    if (!this.initialized) return;
    if (!this._soundtrackInitialized) {
      this._initSoundtrack();
    }
    if (!this._ambientGain || !this.ctx) return;

    // Tiefe normalisieren:
    // An der Oberfläche (0m) ein sanfter, atmosphärischer Streicher-Grundteppich (0.35).
    // Mit zunehmender Tiefe steigt die Intensität kontinuierlich bis auf 1.0 (ab ca. 25m Tiefe).
    const targetIntensity = Math.min(1.0, 0.35 + (Math.max(0, depthMeters) / 25) * 0.65);
    this._soundtrackDepth = targetIntensity;

    // Angenehme, wohlklingende Lautstärke für Hintergrundmusik
    const targetGain = 0.22 + targetIntensity * 0.22;
    const now = this.ctx.currentTime;

    this._ambientGain.gain.setTargetAtTime(targetGain, now, 1.8);
  }
}

export const soundFx = new SoundManager();
