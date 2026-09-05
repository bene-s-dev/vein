/**
 * SoundEffects.js
 * Modernes, sattes Sci-Fi & Bergbau Sound-Design mit der Web Audio API.
 *
 * Sounds:
 * - Jetpack: Dauerhafter Triebwerks-Schub mit Ramp-Up/Down (startJetpack / stopJetpack)
 * - Bohren: Kontinuierliches Schleifen/Mahlen (kein Hämmern) mit Steinrauschen
 * - Fahren: Leises mechanisches Rollen (playDrive, stopDrive)
 * - Blockzerstörung: Satter Felsbruch
 * - Erz sammeln: Harmonischer Kristallklang
 * - Kauf/Upgrade, Schmelzen, Ofen
 */

class SoundManager {
  constructor() {
    this.ctx = null;
    this.initialized = false;
    this.muted = false;

    // Jetpack continuous nodes
    this._jetpackGain = null;
    this._jetpackNoise = null;
    this._jetpackHum = null;
    this._jetpackRunning = false;

    // Drill continuous nodes
    this._drillGain = null;
    this._drillNoise = null;
    this._drillOsc = null;
    this._drillRunning = false;
    this._drillCrunchTimer = null;

    // Drive continuous nodes
    this._driveGain = null;
    this._driveNoise = null;
    this._driveOsc = null;
    this._driveRunning = false;
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.muted) {
      if (this._jetpackGain) this._jetpackGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
      if (this._drillGain) this._drillGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
      if (this._driveGain) this._driveGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
    } else {
      // Restore active sounds
      if (this._jetpackRunning && this._jetpackGain) {
        this._jetpackGain.gain.setTargetAtTime(0.22, this.ctx.currentTime, 0.08);
      }
      if (this._drillRunning && this._drillGain) {
        this._drillGain.gain.setTargetAtTime(0.15, this.ctx.currentTime, 0.08);
      }
      if (this._driveRunning && this._driveGain) {
        this._driveGain.gain.setTargetAtTime(0.06, this.ctx.currentTime, 0.08);
      }
    }
    return this.muted;
  }

  init() {
    if (this.initialized) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.initialized = true;
      }
    } catch (e) {
      console.warn('AudioContext nicht verfügbar:', e);
    }
  }

  ensureContext() {
    if (!this.initialized) this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Erzeugt tiefes, weiches Rumpel-Rauschen (Brownian Noise, absolut kein scharfes Zischen)
  createNoiseBuffer(duration = 0.2) {
    if (!this.ctx) return null;
    const bufferSize = Math.floor(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      // Starke Tiefpass-Glättung: 95% Tiefenanteil schneidet jedes Rauschen/Zischen weg
      lastOut = (lastOut * 0.95) + (white * 0.05);
      data[i] = lastOut * 3.5;
    }
    return buffer;
  }

  // Looping noise source (returns node) mit starker Tiefpassfilterung
  _createLoopingNoise(filterType, freqVal, Q = 1.0) {
    if (!this.ctx) return null;
    const buf = this.createNoiseBuffer(0.4);
    if (!buf) return null;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;

    const flt = this.ctx.createBiquadFilter();
    flt.type = filterType;
    flt.frequency.value = Math.min(freqVal, 220); // Niemals scharfe Höhen durchlassen
    flt.Q.value = Q;

    src.connect(flt);
    return { src, flt };
  }

  // -----------------------------------------------------------------------
  // JETPACK — warmer, tiefer Triebwerksschub (saubere Synthese, kein Rauschen)
  // -----------------------------------------------------------------------
  startJetpack() {
    this.ensureContext();
    if (!this.ctx || this._jetpackRunning) return;
    this._jetpackRunning = true;

    const now = this.ctx.currentTime;
    const masterGain = this.ctx.createGain();
    masterGain.gain.setValueAtTime(0.001, now);
    masterGain.gain.linearRampToValueAtTime(this.muted ? 0.001 : 0.035, now + 0.2);
    masterGain.connect(this.ctx.destination);
    this._jetpackGain = masterGain;

    // 1. Sanfter Turbinen-Grundton (reine Sinuswelle)
    const hum = this.ctx.createOscillator();
    hum.type = 'sine';
    hum.frequency.setValueAtTime(64, now);
    hum.frequency.linearRampToValueAtTime(82, now + 0.25);

    // 2. Harmonischer Obertongenerator
    const hum2 = this.ctx.createOscillator();
    hum2.type = 'triangle';
    hum2.frequency.setValueAtTime(128, now);
    hum2.frequency.linearRampToValueAtTime(164, now + 0.25);

    const flt = this.ctx.createBiquadFilter();
    flt.type = 'lowpass';
    flt.frequency.value = 220; // Glättet alle Obertöne für samtweichen Klang

    const oscGain = this.ctx.createGain();
    oscGain.gain.value = 0.5;

    hum.connect(flt);
    hum2.connect(flt);
    flt.connect(oscGain);
    oscGain.connect(masterGain);

    hum.start(now);
    hum2.start(now);
    this._jetpackHum = hum;
    this._jetpackHum2 = hum2;
  }

  stopJetpack() {
    if (!this._jetpackRunning || !this.ctx) return;
    this._jetpackRunning = false;
    const now = this.ctx.currentTime;
    const fadeOut = 0.2;

    if (this._jetpackGain) {
      this._jetpackGain.gain.setTargetAtTime(0.001, now, fadeOut / 3);
    }

    const nodes = [this._jetpackHum, this._jetpackHum2];
    nodes.forEach(n => {
      if (!n) return;
      try { n.stop(now + fadeOut + 0.05); } catch(_) {}
    });

    setTimeout(() => {
      try { if (this._jetpackGain) this._jetpackGain.disconnect(); } catch(_) {}
      this._jetpackGain = null;
      this._jetpackHum = null;
      this._jetpackHum2 = null;
    }, (fadeOut + 0.1) * 1000);
  }

  // Legacy wrapper for compatibility
  playJetpack() {
    if (!this._jetpackRunning) this.startJetpack();
  }

  // -----------------------------------------------------------------------
  // BOHREN — Mechanischer Fräsmotor (reine Oszillatoren, null Hiss)
  // -----------------------------------------------------------------------
  startDrilling() {
    this.ensureContext();
    if (!this.ctx || this._drillRunning) return;
    this._drillRunning = true;

    const now = this.ctx.currentTime;
    const masterGain = this.ctx.createGain();
    masterGain.gain.setValueAtTime(0.001, now);
    masterGain.gain.linearRampToValueAtTime(this.muted ? 0.001 : 0.04, now + 0.1);
    masterGain.connect(this.ctx.destination);
    this._drillGain = masterGain;

    // 1. Tiefes Bohrer-Surren (Sinuswelle bei 48 Hz)
    const motorOsc = this.ctx.createOscillator();
    motorOsc.type = 'sine';
    motorOsc.frequency.value = 48;

    // 2. Mechanische Zahnrad-Vibration (Moduliertes Dreieck bei 96 Hz)
    const gearOsc = this.ctx.createOscillator();
    gearOsc.type = 'triangle';
    gearOsc.frequency.value = 96;

    // LFO für die typische Bohrkopf-Rotation (14 Hz Pulsieren)
    const lfo = this.ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 14;
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 12;
    lfo.connect(gearOsc.frequency);
    lfo.start(now);
    this._drillLfo = lfo;

    const flt = this.ctx.createBiquadFilter();
    flt.type = 'lowpass';
    flt.frequency.value = 260; // Kein scharfes Zischen, nur warmes mechanisches Mahlen

    motorOsc.connect(flt);
    gearOsc.connect(flt);
    flt.connect(masterGain);

    motorOsc.start(now);
    gearOsc.start(now);
    this._drillOsc = motorOsc;
    this._drillGear = gearOsc;
  }

  stopDrill() {
    this.stopDrilling();
  }

  stopDrilling() {
    if (!this._drillRunning || !this.ctx) return;
    this._drillRunning = false;
    clearTimeout(this._drillCrunchTimer);
    const now = this.ctx.currentTime;

    if (this._drillGain) {
      this._drillGain.gain.setTargetAtTime(0.001, now, 0.05);
    }
    const nodes = [this._drillOsc, this._drillGear, this._drillLfo];
    nodes.forEach(n => {
      if (!n) return;
      try { n.stop(now + 0.1); } catch(_) {}
    });

    setTimeout(() => {
      try { if (this._drillGain) this._drillGain.disconnect(); } catch(_) {}
      this._drillGain = null;
      this._drillOsc = null;
      this._drillGear = null;
      this._drillLfo = null;
    }, 150);
  }

  // Legacy wrapper — called per-frame, manages start/stop state
  playDrillTick() {
    if (this.muted) return;
    if (!this._drillRunning) this.startDrilling();
  }

  // -----------------------------------------------------------------------
  // FAHREN — sonorer Kettenantrieb (sauberes Motorengeräusch, absolut kein Rauschen)
  // -----------------------------------------------------------------------
  startDrive() {
    this.ensureContext();
    if (!this.ctx || this._driveRunning) return;
    this._driveRunning = true;

    const now = this.ctx.currentTime;
    const masterGain = this.ctx.createGain();
    masterGain.gain.setValueAtTime(0.001, now);
    masterGain.gain.linearRampToValueAtTime(this.muted ? 0.001 : 0.035, now + 0.06);
    masterGain.connect(this.ctx.destination);
    this._driveGain = masterGain;

    // Tiefer Elektromotor / Raupenantrieb (reine Sinuswelle mit sanfter LFO-Modulation)
    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = 44;

    const lfo = this.ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 9; // Kettentakt 9 Hz
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 5;
    lfo.connect(osc.frequency);
    lfo.start(now);
    this._driveLfo = lfo;

    const flt = this.ctx.createBiquadFilter();
    flt.type = 'lowpass';
    flt.frequency.value = 160; // Sehr tiefer, warmer Klang ohne Rauschen

    osc.connect(flt);
    flt.connect(masterGain);
    osc.start(now);
    this._driveOsc = osc;
  }

  stopDrive() {
    if (!this._driveRunning || !this.ctx) return;
    this._driveRunning = false;
    const now = this.ctx.currentTime;

    if (this._driveGain) {
      this._driveGain.gain.setTargetAtTime(0.001, now, 0.05);
    }
    [this._driveOsc, this._driveLfo].forEach(n => {
      if (!n) return;
      try { n.stop(now + 0.1); } catch(_) {}
    });

    setTimeout(() => {
      try { if (this._driveGain) this._driveGain.disconnect(); } catch(_) {}
      this._driveGain = null;
      this._driveOsc = null;
      this._driveLfo = null;
    }, 150);
  }

  // -----------------------------------------------------------------------
  // Satter Felsbruch beim Zerstören eines Blocks
  // -----------------------------------------------------------------------
  playTileDestroy() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    const boom = this.ctx.createOscillator();
    const boomGain = this.ctx.createGain();
    boom.type = 'triangle';
    boom.frequency.setValueAtTime(95, now);
    boom.frequency.exponentialRampToValueAtTime(28, now + 0.22);
    boomGain.gain.setValueAtTime(0.22, now);
    boomGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    boom.connect(boomGain);
    boomGain.connect(this.ctx.destination);
    boom.start(now);
    boom.stop(now + 0.22);

    const noiseBuffer = this.createNoiseBuffer(0.24);
    if (noiseBuffer) {
      const noise = this.ctx.createBufferSource();
      noise.buffer = noiseBuffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(280, now);
      filter.frequency.exponentialRampToValueAtTime(60, now + 0.24);
      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.11, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);
      noise.start(now);
    }
  }

  // -----------------------------------------------------------------------
  // Erz sammeln (Kristallklang)
  // -----------------------------------------------------------------------
  playOreCollect(rarity = 1) {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const chord = [587.33, 739.99, 880.00, 1174.66];
    const baseFreq = chord[Math.min(chord.length - 1, rarity - 1)] || 587.33;

    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(baseFreq, now);
    gain1.gain.setValueAtTime(0.12, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
    osc1.connect(gain1); gain1.connect(this.ctx.destination);
    osc1.start(now); osc1.stop(now + 0.28);

    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(baseFreq * 2, now);
    gain2.gain.setValueAtTime(0.06, now);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    osc2.connect(gain2); gain2.connect(this.ctx.destination);
    osc2.start(now); osc2.stop(now + 0.18);
  }

  // Alias used in some Player.js calls
  playGemCollect(rarity = 1) { this.playOreCollect(rarity); }

  // -----------------------------------------------------------------------
  // UI Klick-Sound
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
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.04);

      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.04);
    } catch (e) {
      // Ignore audio failure
    }
  }

  // -----------------------------------------------------------------------
  // Kauf- & Upgrade-Akkord
  // -----------------------------------------------------------------------
  playPurchase() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50];

    notes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.05);
      gain.gain.setValueAtTime(0.08, now + i * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.05 + 0.2);
      osc.connect(gain); gain.connect(this.ctx.destination);
      osc.start(now + i * 0.05); osc.stop(now + i * 0.05 + 0.2);
    });
  }

  playUpgrade() {
    this.playPurchase();
  }

  // -----------------------------------------------------------------------
  // Schmelz-Klang (Raffinerie)
  // -----------------------------------------------------------------------
  playSmelt() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const noiseBuffer = this.createNoiseBuffer(0.16);
    if (noiseBuffer) {
      const noise = this.ctx.createBufferSource();
      noise.buffer = noiseBuffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(1400, now);
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
      noise.connect(filter); filter.connect(gain); gain.connect(this.ctx.destination);
      noise.start(now);
    }

    const bell = this.ctx.createOscillator();
    const bellGain = this.ctx.createGain();
    bell.type = 'sine';
    bell.frequency.setValueAtTime(880, now + 0.05);
    bellGain.gain.setValueAtTime(0.07, now + 0.05);
    bellGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    bell.connect(bellGain); bellGain.connect(this.ctx.destination);
    bell.start(now + 0.05); bell.stop(now + 0.35);
  }

  // -----------------------------------------------------------------------
  // Ofen-Zischen
  // -----------------------------------------------------------------------
  playFurnace() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const noiseBuffer = this.createNoiseBuffer(0.2);
    if (noiseBuffer) {
      const noise = this.ctx.createBufferSource();
      noise.buffer = noiseBuffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(450, now);
      filter.frequency.linearRampToValueAtTime(700, now + 0.2);
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      noise.connect(filter); filter.connect(gain); gain.connect(this.ctx.destination);
      noise.start(now);
    }
  }

  // -----------------------------------------------------------------------
  // Fehler / Warn-Sound
  // -----------------------------------------------------------------------
  playError() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.12);
    gain.gain.setValueAtTime(0.07, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc.connect(gain); gain.connect(this.ctx.destination);
    osc.start(now); osc.stop(now + 0.12);
  }

  // -----------------------------------------------------------------------
  // Schaden-Sound
  // -----------------------------------------------------------------------
  playDamage() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const noiseBuffer = this.createNoiseBuffer(0.14);
    if (noiseBuffer) {
      const noise = this.ctx.createBufferSource();
      noise.buffer = noiseBuffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 500;
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
      noise.connect(filter); filter.connect(gain); gain.connect(this.ctx.destination);
      noise.start(now);
    }
  }
}

export const soundFx = new SoundManager();
