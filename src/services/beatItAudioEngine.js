/**
 * BeatIt Web Audio API Engine
 * Professional 8-Track zero-latency drum synthesis & lookahead scheduler.
 * Kits: Analog 808, Cyberpunk, 80s Funk, Lo-Fi Chill, Trap Bóveda.
 */

// Shared audio context singleton
let audioCtx = null;

function getAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// Generate a buffer of white noise
let cachedNoiseBuffer = null;
function getWhiteNoiseBuffer(ctx) {
  if (cachedNoiseBuffer && cachedNoiseBuffer.sampleRate === ctx.sampleRate) {
    return cachedNoiseBuffer;
  }
  const bufferSize = ctx.sampleRate * 2; // 2 seconds of noise
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  cachedNoiseBuffer = buffer;
  return buffer;
}

// Soft distortion curve for 808 bass saturation
function makeDistortionCurve(amount = 20) {
  const n_samples = 44100;
  const curve = new Float32Array(n_samples);
  const deg = Math.PI / 180;
  for (let i = 0; i < n_samples; ++i) {
    const x = (i * 2) / n_samples - 1;
    curve[i] = ((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x));
  }
  return curve;
}

export const INSTRUMENT_CONFIG = {
  kick: { label: 'Kick', short: 'BD', tag: 'SUB', color: '#ff3366' },
  snare: { label: 'Snare', short: 'SD', tag: 'SNAP', color: '#ff8800' },
  clap: { label: 'Clap', short: 'CP', tag: 'ROOM', color: '#ffcc00' },
  hihat: { label: 'Hi-Hat', short: 'CH', tag: 'TOP', color: '#00ffcc' },
  openhat: { label: 'Open Hat', short: 'OH', tag: 'AIR', color: '#00bfff' },
  sub808: { label: 'Sub 808', short: '808', tag: 'BASS', color: '#9945ff' },
  tom: { label: 'Tom', short: 'TM', tag: 'PERC', color: '#ff00aa' },
  crash: { label: 'Crash', short: 'CR', tag: 'FX', color: '#e0e0e0' }
};

export const INSTRUMENTS = ['kick', 'snare', 'clap', 'hihat', 'openhat', 'sub808', 'tom', 'crash'];

/**
 * 5 Sound kits with comprehensive 8-instrument parameters
 */
export const KIT_DEFINITIONS = {
  "Analog 808": {
    name: "Analog 808",
    description: "Auténtico sonido analógico TR-808 con sub-bajos retumbantes, toms melódicos y brillo clásico.",
    color: "#00ffcc",
    kick: { startFreq: 160, endFreq: 40, sweepTime: 0.08, decay: 0.45, clickFreq: 320, clickVol: 0.6 },
    snare: { toneFreq: 180, toneDecay: 0.09, noiseFilter: 1500, noiseDecay: 0.22, toneVol: 0.5, noiseVol: 0.8 },
    clap: { filterFreq: 1100, decay: 0.22, vol: 0.85 },
    hihat: { filterFreq: 7500, decay: 0.05, vol: 0.7 },
    openhat: { filterFreq: 7000, decay: 0.35, vol: 0.75 },
    sub808: { pitch: 46, sweepTime: 0.04, decay: 0.75, drive: 12, vol: 0.95 },
    tom: { startFreq: 140, endFreq: 75, decay: 0.28, vol: 0.8 },
    crash: { filterFreq: 4500, decay: 0.9, vol: 0.7 }
  },
  "Cyberpunk": {
    name: "Cyberpunk",
    description: "Sonido industrial y agresivo con distorsión saturada, claps metálicos y bajo demoledor.",
    color: "#ff0077",
    kick: { startFreq: 220, endFreq: 45, sweepTime: 0.05, decay: 0.35, clickFreq: 450, clickVol: 0.9 },
    snare: { toneFreq: 240, toneDecay: 0.08, noiseFilter: 2800, noiseDecay: 0.28, toneVol: 0.7, noiseVol: 0.95 },
    clap: { filterFreq: 1800, decay: 0.26, vol: 0.9 },
    hihat: { filterFreq: 9500, decay: 0.04, vol: 0.8 },
    openhat: { filterFreq: 8800, decay: 0.30, vol: 0.85 },
    sub808: { pitch: 50, sweepTime: 0.03, decay: 0.70, drive: 28, vol: 1.0 },
    tom: { startFreq: 170, endFreq: 85, decay: 0.24, vol: 0.85 },
    crash: { filterFreq: 6000, decay: 1.1, vol: 0.85 }
  },
  "Trap Bóveda": {
    name: "Trap Bóveda",
    description: "Sonido moderno de estudio urbano: 808s prolongados, hi-hats cortantes y palmadas secas.",
    color: "#9945ff",
    kick: { startFreq: 190, endFreq: 48, sweepTime: 0.06, decay: 0.38, clickFreq: 380, clickVol: 0.85 },
    snare: { toneFreq: 210, toneDecay: 0.07, noiseFilter: 3200, noiseDecay: 0.18, toneVol: 0.6, noiseVol: 0.9 },
    clap: { filterFreq: 1400, decay: 0.18, vol: 0.9 },
    hihat: { filterFreq: 9000, decay: 0.035, vol: 0.75 },
    openhat: { filterFreq: 8000, decay: 0.40, vol: 0.8 },
    sub808: { pitch: 42, sweepTime: 0.05, decay: 0.95, drive: 22, vol: 1.0 },
    tom: { startFreq: 130, endFreq: 65, decay: 0.32, vol: 0.75 },
    crash: { filterFreq: 5000, decay: 0.8, vol: 0.75 }
  },
  "80s Funk": {
    name: "80s Funk",
    description: "El clásico pulso de estudio pop/disco, toms definidos, palmada con aire y pegada bailable.",
    color: "#ffaa00",
    kick: { startFreq: 140, endFreq: 52, sweepTime: 0.06, decay: 0.30, clickFreq: 280, clickVol: 0.5 },
    snare: { toneFreq: 195, toneDecay: 0.12, noiseFilter: 2200, noiseDecay: 0.18, toneVol: 0.6, noiseVol: 0.7 },
    clap: { filterFreq: 1300, decay: 0.20, vol: 0.8 },
    hihat: { filterFreq: 6800, decay: 0.06, vol: 0.65 },
    openhat: { filterFreq: 6500, decay: 0.38, vol: 0.7 },
    sub808: { pitch: 55, sweepTime: 0.03, decay: 0.50, drive: 8, vol: 0.85 },
    tom: { startFreq: 160, endFreq: 90, decay: 0.25, vol: 0.85 },
    crash: { filterFreq: 4200, decay: 1.0, vol: 0.75 }
  },
  "Lo-Fi Chill": {
    name: "Lo-Fi Chill",
    description: "Pegada cálida, frecuencias redondeadas, toms de madera y textura acústica nostálgica.",
    color: "#e6c387",
    kick: { startFreq: 110, endFreq: 38, sweepTime: 0.09, decay: 0.40, clickFreq: 180, clickVol: 0.3 },
    snare: { toneFreq: 150, toneDecay: 0.10, noiseFilter: 900, noiseDecay: 0.16, toneVol: 0.4, noiseVol: 0.5 },
    clap: { filterFreq: 800, decay: 0.18, vol: 0.6 },
    hihat: { filterFreq: 4500, decay: 0.07, vol: 0.5 },
    openhat: { filterFreq: 4000, decay: 0.32, vol: 0.55 },
    sub808: { pitch: 40, sweepTime: 0.06, decay: 0.60, drive: 5, vol: 0.8 },
    tom: { startFreq: 120, endFreq: 60, decay: 0.30, vol: 0.65 },
    crash: { filterFreq: 3000, decay: 0.7, vol: 0.6 }
  }
};

/**
 * Procedural Drum Synthesizers (Web Audio API)
 */
function playKick(ctx, destination, time, kitConfig, isLoFi, velocity = 1.0) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const cfg = kitConfig.kick;

  const startPitch = isLoFi ? cfg.startFreq * 0.85 : cfg.startFreq;
  const endPitch = isLoFi ? cfg.endFreq * 0.85 : cfg.endFreq;
  const decayTime = isLoFi ? cfg.decay * 1.2 : cfg.decay;

  osc.type = 'sine';
  osc.frequency.setValueAtTime(startPitch, time);
  osc.frequency.exponentialRampToValueAtTime(endPitch, time + cfg.sweepTime);

  gain.gain.setValueAtTime(1.0 * velocity, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + decayTime);

  // Transient attack click
  const clickOsc = ctx.createOscillator();
  const clickGain = ctx.createGain();
  clickOsc.type = 'triangle';
  clickOsc.frequency.setValueAtTime(cfg.clickFreq, time);
  clickGain.gain.setValueAtTime(cfg.clickVol * Math.min(1.2, velocity), time);
  clickGain.gain.exponentialRampToValueAtTime(0.001, time + 0.012);

  clickOsc.connect(clickGain);
  clickGain.connect(destination);

  osc.connect(gain);
  gain.connect(destination);

  clickOsc.start(time);
  clickOsc.stop(time + 0.015);
  osc.start(time);
  osc.stop(time + decayTime + 0.02);
}

function playSnare(ctx, destination, time, kitConfig, isLoFi, velocity = 1.0) {
  const cfg = kitConfig.snare;
  const noiseBuffer = getWhiteNoiseBuffer(ctx);
  const noiseSource = ctx.createBufferSource();
  noiseSource.buffer = noiseBuffer;

  const noiseFilter = ctx.createBiquadFilter();
  noiseFilter.type = isLoFi ? 'lowpass' : 'bandpass';
  noiseFilter.frequency.setValueAtTime(isLoFi ? cfg.noiseFilter * 0.7 : cfg.noiseFilter, time);
  noiseFilter.Q.setValueAtTime(isLoFi ? 1.0 : 1.5, time);

  const noiseGain = ctx.createGain();
  const noiseDecay = isLoFi ? cfg.noiseDecay * 1.15 : cfg.noiseDecay;
  noiseGain.gain.setValueAtTime(cfg.noiseVol * velocity, time);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, time + noiseDecay);

  noiseSource.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(destination);

  const toneOsc = ctx.createOscillator();
  const toneGain = ctx.createGain();
  toneOsc.type = 'triangle';
  toneOsc.frequency.setValueAtTime(isLoFi ? cfg.toneFreq * 0.85 : cfg.toneFreq, time);
  toneOsc.frequency.exponentialRampToValueAtTime(isLoFi ? 60 : 70, time + cfg.toneDecay);

  toneGain.gain.setValueAtTime(cfg.toneVol * velocity, time);
  toneGain.gain.exponentialRampToValueAtTime(0.001, time + cfg.toneDecay);

  toneOsc.connect(toneGain);
  toneGain.connect(destination);

  noiseSource.start(time);
  noiseSource.stop(time + noiseDecay + 0.02);
  toneOsc.start(time);
  toneOsc.stop(time + cfg.toneDecay + 0.02);
}

function playClap(ctx, destination, time, kitConfig, isLoFi, velocity = 1.0) {
  const cfg = kitConfig.clap;
  const noiseBuffer = getWhiteNoiseBuffer(ctx);

  const filter = ctx.createBiquadFilter();
  filter.type = isLoFi ? 'lowpass' : 'bandpass';
  filter.frequency.setValueAtTime(isLoFi ? 900 : cfg.filterFreq, time);
  filter.Q.setValueAtTime(isLoFi ? 1.0 : 1.2, time);

  const gain = ctx.createGain();
  const decayTime = isLoFi ? cfg.decay * 1.25 : cfg.decay;
  const vol = cfg.vol * velocity;

  gain.gain.setValueAtTime(0, time);
  gain.gain.setValueAtTime(vol * 0.7, time);
  gain.gain.exponentialRampToValueAtTime(0.05, time + 0.008);
  gain.gain.setValueAtTime(vol * 0.85, time + 0.011);
  gain.gain.exponentialRampToValueAtTime(0.05, time + 0.019);
  gain.gain.setValueAtTime(vol, time + 0.022);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.022 + decayTime);

  const noiseSource = ctx.createBufferSource();
  noiseSource.buffer = noiseBuffer;
  noiseSource.connect(filter);
  filter.connect(gain);
  gain.connect(destination);

  noiseSource.start(time);
  noiseSource.stop(time + 0.025 + decayTime + 0.02);
}

function playHiHat(ctx, destination, time, kitConfig, isLoFi, velocity = 1.0) {
  const cfg = kitConfig.hihat;
  const noiseBuffer = getWhiteNoiseBuffer(ctx);
  const noiseSource = ctx.createBufferSource();
  noiseSource.buffer = noiseBuffer;

  const filter = ctx.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.setValueAtTime(isLoFi ? 3500 : cfg.filterFreq, time);

  const gain = ctx.createGain();
  const decayTime = isLoFi ? cfg.decay * 1.3 : cfg.decay;
  gain.gain.setValueAtTime(cfg.vol * velocity, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + decayTime);

  noiseSource.connect(filter);
  filter.connect(gain);
  gain.connect(destination);

  noiseSource.start(time);
  noiseSource.stop(time + decayTime + 0.02);
}

function playOpenHat(ctx, destination, time, kitConfig, isLoFi, velocity = 1.0) {
  const cfg = kitConfig.openhat;
  const noiseBuffer = getWhiteNoiseBuffer(ctx);
  const noiseSource = ctx.createBufferSource();
  noiseSource.buffer = noiseBuffer;

  const filter = ctx.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.setValueAtTime(isLoFi ? 3000 : cfg.filterFreq, time);

  const gain = ctx.createGain();
  const decayTime = isLoFi ? cfg.decay * 1.2 : cfg.decay;
  gain.gain.setValueAtTime(cfg.vol * velocity, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + decayTime);

  noiseSource.connect(filter);
  filter.connect(gain);
  gain.connect(destination);

  noiseSource.start(time);
  noiseSource.stop(time + decayTime + 0.02);
}

function playSub808(ctx, destination, time, kitConfig, isLoFi, velocity = 1.0) {
  const cfg = kitConfig.sub808;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const shaper = ctx.createWaveShaper();

  shaper.curve = makeDistortionCurve(isLoFi ? cfg.drive * 0.5 : cfg.drive);
  shaper.oversample = '2x';

  const basePitch = isLoFi ? cfg.pitch * 0.9 : cfg.pitch;
  osc.type = 'sine';
  osc.frequency.setValueAtTime(basePitch * 1.8, time);
  osc.frequency.exponentialRampToValueAtTime(basePitch, time + cfg.sweepTime);

  const decayTime = isLoFi ? cfg.decay * 1.2 : cfg.decay;
  gain.gain.setValueAtTime(cfg.vol * velocity, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + decayTime);

  osc.connect(gain);
  gain.connect(shaper);
  shaper.connect(destination);

  osc.start(time);
  osc.stop(time + decayTime + 0.05);
}

function playTom(ctx, destination, time, kitConfig, isLoFi, velocity = 1.0) {
  const cfg = kitConfig.tom;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  const startF = isLoFi ? cfg.startFreq * 0.85 : cfg.startFreq;
  const endF = isLoFi ? cfg.endFreq * 0.85 : cfg.endFreq;
  osc.type = 'sine';
  osc.frequency.setValueAtTime(startF, time);
  osc.frequency.exponentialRampToValueAtTime(endF, time + 0.08);

  const decayTime = isLoFi ? cfg.decay * 1.2 : cfg.decay;
  gain.gain.setValueAtTime(cfg.vol * velocity, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + decayTime);

  osc.connect(gain);
  gain.connect(destination);

  osc.start(time);
  osc.stop(time + decayTime + 0.02);
}

function playCrash(ctx, destination, time, kitConfig, isLoFi, velocity = 1.0) {
  const cfg = kitConfig.crash;
  const noiseBuffer = getWhiteNoiseBuffer(ctx);
  const noiseSource = ctx.createBufferSource();
  noiseSource.buffer = noiseBuffer;

  const filter = ctx.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.setValueAtTime(isLoFi ? 2500 : cfg.filterFreq, time);

  const gain = ctx.createGain();
  const decayTime = isLoFi ? cfg.decay * 1.2 : cfg.decay;
  gain.gain.setValueAtTime(cfg.vol * velocity, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + decayTime);

  noiseSource.connect(filter);
  filter.connect(gain);
  gain.connect(destination);

  noiseSource.start(time);
  noiseSource.stop(time + decayTime + 0.05);
}

/**
 * Dispatch an individual instrument hit (live pad audition or step playback)
 */
export function triggerSound(instrument, kitName = "Analog 808", isLoFi = false, customTime = null, volume = 0.85, isAccent = false) {
  const ctx = getAudioContext();
  const time = customTime !== null ? customTime : ctx.currentTime;
  const kitConfig = KIT_DEFINITIONS[kitName] || KIT_DEFINITIONS["Analog 808"];
  const velocity = isAccent ? 1.3 : 1.0;

  const previewGain = ctx.createGain();
  previewGain.gain.setValueAtTime(volume, time);
  previewGain.connect(ctx.destination);

  switch (instrument) {
    case 'kick':
      playKick(ctx, previewGain, time, kitConfig, isLoFi, velocity);
      break;
    case 'snare':
      playSnare(ctx, previewGain, time, kitConfig, isLoFi, velocity);
      break;
    case 'clap':
      playClap(ctx, previewGain, time, kitConfig, isLoFi, velocity);
      break;
    case 'hihat':
      playHiHat(ctx, previewGain, time, kitConfig, isLoFi, velocity);
      break;
    case 'openhat':
      playOpenHat(ctx, previewGain, time, kitConfig, isLoFi, velocity);
      break;
    case 'sub808':
      playSub808(ctx, previewGain, time, kitConfig, isLoFi, velocity);
      break;
    case 'tom':
      playTom(ctx, previewGain, time, kitConfig, isLoFi, velocity);
      break;
    case 'crash':
      playCrash(ctx, previewGain, time, kitConfig, isLoFi, velocity);
      break;
    default:
      break;
  }
}

/**
 * High-Precision Web Audio API Lookahead Scheduler with Groove & Dynamics
 */
export class BeatItScheduler {
  constructor(options = {}) {
    this.tempo = options.tempo || 120;
    this.steps = options.steps || 16;
    this.kit = options.kit || "Analog 808";
    this.isLoFi = options.isLoFi || false;
    this.grid = options.grid || {};
    this.swing = options.swing !== undefined ? options.swing : 50; // 50% = straight, 75% = heavy groove
    this.onStepChange = options.onStepChange || (() => {});
    
    // Mixing console parameters
    this.trackVolumes = options.trackVolumes || {};
    this.mutes = options.mutes || {};
    this.solos = options.solos || {};
    this.masterVolume = options.masterVolume !== undefined ? options.masterVolume : 0.85;

    // Master FX Rack parameters
    this.fx = {
      enabled: options.fx?.enabled !== undefined ? options.fx.enabled : true,
      djFilter: options.fx?.djFilter !== undefined ? options.fx.djFilter : 0, // -100 (LP) a +100 (HP)
      drive: options.fx?.drive !== undefined ? options.fx.drive : 0, // 0 a 100%
      delayWet: options.fx?.delayWet !== undefined ? options.fx.delayWet : 0, // 0 a 100%
      delayFeedback: options.fx?.delayFeedback !== undefined ? options.fx.delayFeedback : 35, // 0 a 80%
      delayTime: options.fx?.delayTime !== undefined ? options.fx.delayTime : 0.375 // segundos
    };

    this.isPlaying = false;
    this.currentStep = 0;
    this.nextNoteTime = 0.0;
    this.timerId = null;
    this.animFrameId = null;

    this.lookahead = 25.0; // ms between schedule checks
    this.scheduleAheadTime = 0.1; // seconds ahead to schedule audio buffers

    this.notesInQueue = [];

    // Audio Graph Nodes
    this.masterGain = null;
    this.compressor = null;
    this.channelGains = {};

    // FX Nodes
    this.preFXGain = null;
    this.driveNode = null;
    this.filterNode = null;
    this.delayNode = null;
    this.delayFeedbackGain = null;
    this.delayFilterNode = null;
    this.delayWetGain = null;
  }

  setupMasterChain() {
    const ctx = getAudioContext();
    if (!this.masterGain) {
      this.masterGain = ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.masterVolume, ctx.currentTime);

      this.compressor = ctx.createDynamicsCompressor();
      this.compressor.threshold.setValueAtTime(-14, ctx.currentTime);
      this.compressor.knee.setValueAtTime(25, ctx.currentTime);
      this.compressor.ratio.setValueAtTime(10, ctx.currentTime);
      this.compressor.attack.setValueAtTime(0.003, ctx.currentTime);
      this.compressor.release.setValueAtTime(0.25, ctx.currentTime);

      // 1. Bus de Suma Pre-FX
      this.preFXGain = ctx.createGain();

      // 2. Drive / Saturation (WaveShaper)
      this.driveNode = ctx.createWaveShaper();
      this.driveNode.oversample = '2x';

      // 3. DJ Biquad Filter (Lowpass / Highpass)
      this.filterNode = ctx.createBiquadFilter();
      this.filterNode.type = 'lowpass';
      this.filterNode.frequency.setValueAtTime(20000, ctx.currentTime);
      this.filterNode.Q.setValueAtTime(0.7, ctx.currentTime);

      // Conexión del camino directo FX: preFX -> drive -> filter -> masterGain
      this.preFXGain.connect(this.driveNode);
      this.driveNode.connect(this.filterNode);
      this.filterNode.connect(this.masterGain);

      // 4. Bucle Dub Delay / Echo
      this.delayNode = ctx.createDelay(2.0);
      this.delayFeedbackGain = ctx.createGain();
      this.delayFilterNode = ctx.createBiquadFilter();
      this.delayFilterNode.type = 'lowpass';
      this.delayFilterNode.frequency.setValueAtTime(3200, ctx.currentTime); // Tono cálido analógico
      this.delayWetGain = ctx.createGain();

      // preFX -> delayNode -> delayFilter -> delayFeedback -> delayNode (feedback loop)
      this.preFXGain.connect(this.delayNode);
      this.delayNode.connect(this.delayFilterNode);
      this.delayFilterNode.connect(this.delayFeedbackGain);
      this.delayFeedbackGain.connect(this.delayNode);

      // Retorno de eco al Master
      this.delayFilterNode.connect(this.delayWetGain);
      this.delayWetGain.connect(this.masterGain);

      // Salida al Compresor y Destino Final
      this.masterGain.connect(this.compressor);
      this.compressor.connect(ctx.destination);

      // Canales individuales se conectan al bus Pre-FX
      INSTRUMENTS.forEach(inst => {
        const chGain = ctx.createGain();
        chGain.connect(this.preFXGain);
        this.channelGains[inst] = chGain;
      });

      this.applyMixerSettings();
      this.applyFXSettings();
    }
  }

  applyMixerSettings() {
    const ctx = getAudioContext();
    const hasAnySolo = Object.values(this.solos).some(Boolean);

    INSTRUMENTS.forEach(inst => {
      const chGain = this.channelGains[inst];
      if (!chGain) return;

      const isMuted = !!this.mutes[inst];
      const isSolo = !!this.solos[inst];
      const userVol = this.trackVolumes[inst] !== undefined ? this.trackVolumes[inst] : 0.85;

      let targetGain = 0;
      if (hasAnySolo) {
        targetGain = (isSolo && !isMuted) ? userVol : 0;
      } else {
        targetGain = !isMuted ? userVol : 0;
      }

      // De-clicking suave de 15ms
      chGain.gain.setTargetAtTime(targetGain, ctx.currentTime, 0.015);
    });

    if (this.masterGain) {
      this.masterGain.gain.setTargetAtTime(this.masterVolume, ctx.currentTime, 0.015);
    }
  }

  applyFXSettings() {
    const ctx = getAudioContext();
    if (!this.filterNode) return;

    const enabled = !!this.fx.enabled;

    if (!enabled) {
      // Bypass total: sonido directo puro sin procesar
      this.driveNode.curve = null;
      this.filterNode.type = 'lowpass';
      this.filterNode.frequency.setTargetAtTime(20000, ctx.currentTime, 0.015);
      this.filterNode.Q.setTargetAtTime(0.7, ctx.currentTime, 0.015);
      this.delayWetGain.gain.setTargetAtTime(0, ctx.currentTime, 0.015);
      return;
    }

    // 1. DJ Filter Sweep (-100 a +100)
    const djVal = Number(this.fx.djFilter) || 0;
    if (djVal < 0) {
      // Low-Pass Sweep: 20000 Hz hacia 160 Hz (muffle)
      const ratio = Math.abs(djVal) / 100.0;
      const freq = 20000 * Math.pow(160 / 20000, ratio);
      this.filterNode.type = 'lowpass';
      this.filterNode.frequency.setTargetAtTime(freq, ctx.currentTime, 0.015);
      this.filterNode.Q.setTargetAtTime(0.7 + ratio * 3.5, ctx.currentTime, 0.015);
    } else if (djVal > 0) {
      // High-Pass Sweep: 20 Hz hacia 3800 Hz (corte de graves)
      const ratio = djVal / 100.0;
      const freq = 20 * Math.pow(3800 / 20, ratio);
      this.filterNode.type = 'highpass';
      this.filterNode.frequency.setTargetAtTime(freq, ctx.currentTime, 0.015);
      this.filterNode.Q.setTargetAtTime(0.7 + ratio * 2.5, ctx.currentTime, 0.015);
    } else {
      // Neutral
      this.filterNode.type = 'lowpass';
      this.filterNode.frequency.setTargetAtTime(20000, ctx.currentTime, 0.015);
      this.filterNode.Q.setTargetAtTime(0.7, ctx.currentTime, 0.015);
    }

    // 2. Drive / Tape Saturation
    const driveVal = Number(this.fx.drive) || 0;
    if (driveVal > 0) {
      this.driveNode.curve = makeDistortionCurve(driveVal * 0.45);
    } else {
      this.driveNode.curve = null;
    }

    // 3. Dub Delay Loop
    const wetVal = Math.min(1.0, Math.max(0, (Number(this.fx.delayWet) || 0) / 100.0));
    const fbVal = Math.min(0.85, Math.max(0, (Number(this.fx.delayFeedback) || 35) / 100.0));
    const delayTime = Math.max(0.05, Math.min(1.5, Number(this.fx.delayTime) || 0.375));

    this.delayNode.delayTime.setTargetAtTime(delayTime, ctx.currentTime, 0.02);
    this.delayFeedbackGain.gain.setTargetAtTime(fbVal, ctx.currentTime, 0.02);
    this.delayWetGain.gain.setTargetAtTime(wetVal * 0.75, ctx.currentTime, 0.02);
  }

  updateFX(fx) {
    if (fx) {
      this.fx = { ...this.fx, ...fx };
      this.applyFXSettings();
    }
  }

  updateMixer({ trackVolumes, mutes, solos, masterVolume }) {
    if (trackVolumes) this.trackVolumes = { ...trackVolumes };
    if (mutes) this.mutes = { ...mutes };
    if (solos) this.solos = { ...solos };
    if (masterVolume !== undefined) this.masterVolume = masterVolume;
    this.applyMixerSettings();
  }

  updateSwing(swing) {
    this.swing = Number(swing) || 50;
  }

  updateSteps(steps) {
    this.steps = Number(steps) || 16;
    if (this.currentStep >= this.steps) {
      this.currentStep = 0;
    }
  }

  start() {
    if (this.isPlaying) return;
    const ctx = getAudioContext();
    this.setupMasterChain();

    this.isPlaying = true;
    this.currentStep = 0;
    this.nextNoteTime = ctx.currentTime + 0.05;
    this.notesInQueue = [];

    this.scheduler();
    this.startVisualSync();
  }

  stop() {
    this.isPlaying = false;
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    this.currentStep = 0;
    this.notesInQueue = [];
    this.onStepChange(0);
  }

  nextStep() {
    const secondsPerBeat = 60.0 / this.tempo;
    const sixteenth = 0.25 * secondsPerBeat;
    const swingRatio = (this.swing || 50) / 100.0;

    // Even 16th steps (0, 2, 4...) get lengthened, odd steps (1, 3, 5...) get shortened
    const isEvenStep = (this.currentStep % 2) === 0;
    const stepDuration = isEvenStep 
      ? (2 * sixteenth * swingRatio)
      : (2 * sixteenth * (1 - swingRatio));

    this.nextNoteTime += stepDuration;
    this.currentStep = (this.currentStep + 1) % this.steps;
  }

  scheduleStep(stepIndex, time) {
    const ctx = getAudioContext();
    const kitConfig = KIT_DEFINITIONS[this.kit] || KIT_DEFINITIONS["Analog 808"];

    this.notesInQueue.push({ step: stepIndex, time: time });

    INSTRUMENTS.forEach((inst) => {
      const stepVal = this.grid[inst] ? this.grid[inst][stepIndex] : 0;
      if (stepVal) {
        // stepVal: 1 (or true) = normal (velocity 0.9), 2 = accent (velocity 1.3)
        const isAccent = stepVal === 2 || stepVal === 'accent';
        const velocity = isAccent ? 1.3 : 0.9;
        const dest = this.channelGains[inst] || this.masterGain || ctx.destination;

        switch (inst) {
          case 'kick':
            playKick(ctx, dest, time, kitConfig, this.isLoFi, velocity);
            break;
          case 'snare':
            playSnare(ctx, dest, time, kitConfig, this.isLoFi, velocity);
            break;
          case 'clap':
            playClap(ctx, dest, time, kitConfig, this.isLoFi, velocity);
            break;
          case 'hihat':
            playHiHat(ctx, dest, time, kitConfig, this.isLoFi, velocity);
            break;
          case 'openhat':
            playOpenHat(ctx, dest, time, kitConfig, this.isLoFi, velocity);
            break;
          case 'sub808':
            playSub808(ctx, dest, time, kitConfig, this.isLoFi, velocity);
            break;
          case 'tom':
            playTom(ctx, dest, time, kitConfig, this.isLoFi, velocity);
            break;
          case 'crash':
            playCrash(ctx, dest, time, kitConfig, this.isLoFi, velocity);
            break;
        }
      }
    });
  }

  scheduler() {
    if (!this.isPlaying) return;
    const ctx = getAudioContext();

    while (this.nextNoteTime < ctx.currentTime + this.scheduleAheadTime) {
      this.scheduleStep(this.currentStep, this.nextNoteTime);
      this.nextStep();
    }

    this.timerId = setTimeout(() => this.scheduler(), this.lookahead);
  }

  startVisualSync() {
    const syncLoop = () => {
      if (!this.isPlaying) return;
      const ctx = getAudioContext();
      const currentTime = ctx.currentTime;

      while (this.notesInQueue.length && this.notesInQueue[0].time <= currentTime) {
        const currentVisualStep = this.notesInQueue[0].step;
        this.onStepChange(currentVisualStep);
        this.notesInQueue.shift();
      }

      this.animFrameId = requestAnimationFrame(syncLoop);
    };

    this.animFrameId = requestAnimationFrame(syncLoop);
  }

  updateTempo(tempo) {
    this.tempo = Number(tempo) || 120;
  }

  updateGrid(grid) {
    this.grid = grid;
  }

  updateKit(kit) {
    this.kit = kit;
  }

  updateLoFi(isLoFi) {
    this.isLoFi = isLoFi;
  }
}

/**
 * 16-bit Stereo PCM WAV Encoder
 * Encodes an AudioBuffer into a downloadable audio/wav Blob
 */
function audioBufferToWavBlob(buffer) {
  const numOfChan = buffer.numberOfChannels;
  const length = buffer.length * numOfChan * 2 + 44;
  const out = new DataView(new ArrayBuffer(length));
  const channels = [];
  let sample = 0;
  let offset = 0;
  let pos = 0;

  function setUint16(data) {
    out.setUint16(pos, data, true);
    pos += 2;
  }
  function setUint32(data) {
    out.setUint32(pos, data, true);
    pos += 4;
  }

  // RIFF header
  setUint32(0x46464952); // "RIFF"
  setUint32(length - 8);
  setUint32(0x45564157); // "WAVE"
  setUint32(0x20746d66); // "fmt "
  setUint32(16);          // SubChunk1Size (16 for PCM)
  setUint16(1);           // AudioFormat (1 for PCM)
  setUint16(numOfChan);
  setUint32(buffer.sampleRate);
  setUint32(buffer.sampleRate * 2 * numOfChan); // ByteRate
  setUint16(numOfChan * 2);                    // BlockAlign
  setUint16(16);                               // BitsPerSample
  setUint32(0x61746164); // "data"
  setUint32(length - pos - 4);

  for (let i = 0; i < buffer.numberOfChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }

  while (offset < buffer.length) {
    for (let i = 0; i < numOfChan; i++) {
      sample = Math.max(-1, Math.min(1, channels[i][offset]));
      sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
      out.setInt16(pos, sample, true);
      pos += 2;
    }
    offset++;
  }

  return new Blob([out], { type: 'audio/wav' });
}

/**
 * Fast Offline Render of the pattern to WAV Blob
 * Renders master mix or isolated stems with all sound designs, velocities, swing, and FX
 */
export async function exportPatternToWav({
  grid,
  kit = "Analog 808",
  isLoFi = false,
  tempo = 120,
  swing = 50,
  steps = 16,
  loops = 2,
  trackVolumes = {},
  mutes = {},
  solos = {},
  masterVolume = 0.85,
  fx = {},
  onlyInstrument = null
}) {
  const sampleRate = 44100;
  const secondsPerBeat = 60.0 / Math.max(40, tempo);
  const sixteenth = 0.25 * secondsPerBeat;
  const swingRatio = (swing || 50) / 100.0;

  // Calculate loop length
  let singleLoopDuration = 0;
  for (let s = 0; s < steps; s++) {
    const isEven = (s % 2) === 0;
    singleLoopDuration += isEven ? (2 * sixteenth * swingRatio) : (2 * sixteenth * (1 - swingRatio));
  }
  const totalDuration = (singleLoopDuration * loops) + 1.8; // tail for reverb/delay/crash
  const totalFrames = Math.ceil(sampleRate * totalDuration);

  const OfflineCtxClass = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  const ctx = new OfflineCtxClass(2, totalFrames, sampleRate);

  // Master Gain & Compressor
  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(masterVolume, 0);

  const compressor = ctx.createDynamicsCompressor();
  compressor.threshold.setValueAtTime(-14, 0);
  compressor.knee.setValueAtTime(25, 0);
  compressor.ratio.setValueAtTime(10, 0);
  compressor.attack.setValueAtTime(0.003, 0);
  compressor.release.setValueAtTime(0.25, 0);

  // FX Bus
  const preFXGain = ctx.createGain();
  const driveNode = ctx.createWaveShaper();
  driveNode.oversample = '2x';
  const filterNode = ctx.createBiquadFilter();

  preFXGain.connect(driveNode);
  driveNode.connect(filterNode);
  filterNode.connect(masterGain);

  const delayNode = ctx.createDelay(2.0);
  const delayFeedbackGain = ctx.createGain();
  const delayFilterNode = ctx.createBiquadFilter();
  delayFilterNode.type = 'lowpass';
  delayFilterNode.frequency.setValueAtTime(3200, 0);
  const delayWetGain = ctx.createGain();

  preFXGain.connect(delayNode);
  delayNode.connect(delayFilterNode);
  delayFilterNode.connect(delayFeedbackGain);
  delayFeedbackGain.connect(delayNode);
  delayFilterNode.connect(delayWetGain);
  delayWetGain.connect(masterGain);

  masterGain.connect(compressor);
  compressor.connect(ctx.destination);

  // FX state
  const fxEnabled = !!fx.enabled;
  if (!fxEnabled) {
    driveNode.curve = null;
    filterNode.type = 'lowpass';
    filterNode.frequency.setValueAtTime(20000, 0);
    delayWetGain.gain.setValueAtTime(0, 0);
  } else {
    const djVal = Number(fx.djFilter) || 0;
    if (djVal < 0) {
      const ratio = Math.abs(djVal) / 100.0;
      const freq = 20000 * Math.pow(160 / 20000, ratio);
      filterNode.type = 'lowpass';
      filterNode.frequency.setValueAtTime(freq, 0);
      filterNode.Q.setValueAtTime(0.7 + ratio * 3.5, 0);
    } else if (djVal > 0) {
      const ratio = djVal / 100.0;
      const freq = 20 * Math.pow(3800 / 20, ratio);
      filterNode.type = 'highpass';
      filterNode.frequency.setValueAtTime(freq, 0);
      filterNode.Q.setValueAtTime(0.7 + ratio * 2.5, 0);
    } else {
      filterNode.type = 'lowpass';
      filterNode.frequency.setValueAtTime(20000, 0);
      filterNode.Q.setValueAtTime(0.7, 0);
    }

    const driveVal = Number(fx.drive) || 0;
    if (driveVal > 0) {
      driveNode.curve = makeDistortionCurve(driveVal * 0.45);
    }

    const wetVal = Math.min(1.0, Math.max(0, (Number(fx.delayWet) || 0) / 100.0));
    const fbVal = Math.min(0.85, Math.max(0, (Number(fx.delayFeedback) || 35) / 100.0));
    const delayTime = Math.max(0.05, Math.min(1.5, Number(fx.delayTime) || 0.375));
    delayNode.delayTime.setValueAtTime(delayTime, 0);
    delayFeedbackGain.gain.setValueAtTime(fbVal, 0);
    delayWetGain.gain.setValueAtTime(wetVal * 0.75, 0);
  }

  // Channel Gains & Mixer Routing
  const channelGains = {};
  const hasAnySolo = Object.values(solos).some(Boolean);

  INSTRUMENTS.forEach(inst => {
    const chGain = ctx.createGain();
    chGain.connect(preFXGain);
    channelGains[inst] = chGain;

    if (onlyInstrument && inst !== onlyInstrument) {
      chGain.gain.setValueAtTime(0, 0);
      return;
    }

    const isMuted = !!mutes[inst];
    const isSolo = !!solos[inst];
    const userVol = trackVolumes[inst] !== undefined ? trackVolumes[inst] : 0.85;

    let targetGain = 0;
    if (hasAnySolo) {
      targetGain = (isSolo && !isMuted) ? userVol : 0;
    } else {
      targetGain = !isMuted ? userVol : 0;
    }
    chGain.gain.setValueAtTime(targetGain, 0);
  });

  const kitConfig = KIT_DEFINITIONS[kit] || KIT_DEFINITIONS["Analog 808"];
  let noteTime = 0.05;

  for (let loop = 0; loop < loops; loop++) {
    for (let s = 0; s < steps; s++) {
      INSTRUMENTS.forEach(inst => {
        if (onlyInstrument && inst !== onlyInstrument) return;
        const stepVal = grid[inst] ? grid[inst][s] : 0;
        if (stepVal) {
          const isAccent = stepVal === 2 || stepVal === 'accent';
          const velocity = isAccent ? 1.3 : 0.9;
          const dest = channelGains[inst] || preFXGain;

          switch (inst) {
            case 'kick': playKick(ctx, dest, noteTime, kitConfig, isLoFi, velocity); break;
            case 'snare': playSnare(ctx, dest, noteTime, kitConfig, isLoFi, velocity); break;
            case 'clap': playClap(ctx, dest, noteTime, kitConfig, isLoFi, velocity); break;
            case 'hihat': playHiHat(ctx, dest, noteTime, kitConfig, isLoFi, velocity); break;
            case 'openhat': playOpenHat(ctx, dest, noteTime, kitConfig, isLoFi, velocity); break;
            case 'sub808': playSub808(ctx, dest, noteTime, kitConfig, isLoFi, velocity); break;
            case 'tom': playTom(ctx, dest, noteTime, kitConfig, isLoFi, velocity); break;
            case 'crash': playCrash(ctx, dest, noteTime, kitConfig, isLoFi, velocity); break;
          }
        }
      });

      const isEven = (s % 2) === 0;
      noteTime += isEven ? (2 * sixteenth * swingRatio) : (2 * sixteenth * (1 - swingRatio));
    }
  }

  const renderedBuffer = await ctx.startRendering();
  return audioBufferToWavBlob(renderedBuffer);
}



