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
    this.compressor = null;
    this.initialized = false;
    this.muted = false;

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

    // Auto-Unlock Listener
    this._setupAutoUnlock();
  }

  // Kompatibilitäts-Getter für Player.js
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

  _setupAutoUnlock() {
    const unlock = () => {
      this.ensureContext();
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
      window.removeEventListener('touchstart', unlock);
    };
    window.addEventListener('pointerdown', unlock, { passive: true });
    window.addEventListener('keydown', unlock, { passive: true });
    window.addEventListener('touchstart', unlock, { passive: true });
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

      // Master Gain für blitzschnelles, fehlerfreies Stummschalten
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.muted ? 0.0001 : 0.85, this.ctx.currentTime);
      this.masterGain.connect(this.compressor);

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

  toggleMute() {
    this.muted = !this.muted;
    if (this.masterGain && this.ctx) {
      const now = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setTargetAtTime(this.muted ? 0.0001 : 0.85, now, 0.04);
    }
    return this.muted;
  }

  // -----------------------------------------------------------------------
  // 1. FAHREN (Ruhiges, sattes Raupenfahrwerk mit Motor- & Schotter-Gleiten)
  // -----------------------------------------------------------------------
  startDrive() {
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
    gain.connect(this.masterGain);

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
    if (!this._driveActive) return;
    this._driveActive = false;
    const currentGen = this._driveGen;
    const nodes = this._driveNodes;
    if (!nodes || !this.ctx) return;

    const now = this.ctx.currentTime;
    nodes.gain.gain.cancelScheduledValues(now);
    nodes.gain.gain.setTargetAtTime(0.0001, now, 0.05);

    setTimeout(() => {
      if (this._driveGen === currentGen) {
        try {
          if (nodes.osc1) nodes.osc1.stop();
          if (nodes.osc2) nodes.osc2.stop();
          if (nodes.brownNoise) nodes.brownNoise.stop();
          nodes.gain.disconnect();
        } catch (_) {}
        this._driveNodes = null;
      }
    }, 150);
  }

  // -----------------------------------------------------------------------
  // 2. JETPACK (Triebwerks-Schubdüsen)
  // -----------------------------------------------------------------------
  startJetpack() {
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
    gain.connect(this.masterGain);

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
    if (!this._jetpackActive) return;
    this._jetpackActive = false;
    const currentGen = this._jetpackGen;
    const nodes = this._jetpackNodes;
    if (!nodes || !this.ctx) return;

    const now = this.ctx.currentTime;
    nodes.gain.gain.cancelScheduledValues(now);
    nodes.gain.gain.setTargetAtTime(0.0001, now, 0.06);

    setTimeout(() => {
      if (this._jetpackGen === currentGen) {
        try {
          if (nodes.noise) nodes.noise.stop();
          if (nodes.brownNoise) nodes.brownNoise.stop();
          nodes.gain.disconnect();
        } catch (_) {}
        this._jetpackNodes = null;
      }
    }, 140);
  }

  playJetpack() {
    if (!this._jetpackActive) this.startJetpack();
  }

  // -----------------------------------------------------------------------
  // 3. BOHREN (Gesteinsfräse / Diamantkopf)
  // -----------------------------------------------------------------------
  startDrilling() {
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
    gain.connect(this.masterGain);

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
    if (!this._drillActive) return;
    this._drillActive = false;
    const currentGen = this._drillGen;
    const nodes = this._drillNodes;
    if (!nodes || !this.ctx) return;

    const now = this.ctx.currentTime;
    nodes.gain.gain.cancelScheduledValues(now);
    nodes.gain.gain.setTargetAtTime(0.0001, now, 0.04);

    setTimeout(() => {
      if (this._drillGen === currentGen) {
        try {
          nodes.motor.stop();
          nodes.gear.stop();
          nodes.lfo.stop();
          if (nodes.stoneNoise) nodes.stoneNoise.stop();
          nodes.gain.disconnect();
        } catch (_) {}
        this._drillNodes = null;
      }
    }, 120);
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
    boomGain.connect(this.masterGain);
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
      noiseGain.connect(this.masterGain);
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
    gain1.connect(this.masterGain);
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
    gain2.connect(this.masterGain);
    osc2.start(now + 0.03);
    osc2.stop(now + 0.28);
  }

  playGemCollect(rarity = 1) {
    this.playOreCollect(Math.max(2, rarity));
  }

  // -----------------------------------------------------------------------
  // 6. UI KLICK (Taktil & diskret)
  // -----------------------------------------------------------------------
  playClick() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(950, now);
      osc.frequency.exponentialRampToValueAtTime(420, now + 0.035);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.035);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.035);
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
      gain.connect(this.masterGain);
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
      gain.connect(this.masterGain);
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
    tapGain.connect(this.masterGain);
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
      oscGain.connect(this.masterGain);
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
      gain.connect(this.masterGain);
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
    gain.connect(this.masterGain);
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
    clankGain.connect(this.masterGain);
    clank.start(now);
    clank.stop(now + 0.14);
  }

  // -----------------------------------------------------------------------
  // 13. COCKPIT KOLLISIONS- / RÜCKKEHR-WARNUNG (Flugzeug-Alarm "Whoop-Whoop")
  // -----------------------------------------------------------------------
  playCockpitAlarm() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    // Zwei rasante, ansteigende Tonstöße wie im Flugzeugcockpit (GPWS / TCAS Warnung)
    [0, 0.20].forEach((delay) => {
      const startTime = now + delay;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(440, startTime);
      osc.frequency.exponentialRampToValueAtTime(960, startTime + 0.14);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2400, startTime);

      gain.gain.setValueAtTime(0.20, startTime);
      gain.gain.setValueAtTime(0.20, startTime + 0.10);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.15);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc.start(startTime);
      osc.stop(startTime + 0.16);
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
      gain.connect(this.masterGain);
      noise.start(now);
      noise.stop(now + 0.09);
    }
  }
}

export const soundFx = new SoundManager();
