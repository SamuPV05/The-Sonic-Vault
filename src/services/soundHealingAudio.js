/**
 * Motor DSP de Sound Healing & Regeneración Auditiva (Web Audio API Nativa).
 * Funciona 100% offline sin depender de Spotify ni muestras externas.
 *
 * Modos de síntesis continua:
 *  1. 'brown-noise'    : Ruido Marrón (integración 1/f²) con filtro paso-bajo Butterworth a 400 Hz y modulación orgánica.
 *  2. 'healing-432'    : Frecuencia Curativa 432 Hz con sub-armónico en 216 Hz, quinta en 648 Hz y paneo estereofónico LFO.
 *  3. 'binaural-theta' : Ondas Binaurales Delta/Theta (216 Hz oído izquierdo / 220 Hz oído derecho -> batimiento de 4 Hz).
 *
 * Incluye además el sintetizador aditivo de Campana Tibetana (playTibetanBellChime) con envolvente ADSR
 * para anunciar suavemente el término de las sesiones de descompresión acústica (00:00).
 */

export const SOUND_HEALING_MODES = [
  {
    id: 'brown-noise',
    name: 'Ruido Marrón Profundo',
    subtitle: 'Filtro Paso-Bajo 400 Hz • Pendiente 1/f²',
    icon: 'fa-water',
    color: '#00F0FF',
    description:
      'Densidad espectral concentrada en sub-graves que enmascara acúfenos (tinnitus) y relaja la membrana timpánica.'
  },
  {
    id: 'healing-432',
    name: 'Frecuencia Curativa 432 Hz',
    subtitle: 'Senoidal Pura + Paneo Estereofónico LFO',
    icon: 'fa-wave-square',
    color: '#10B981',
    description:
      'Afinación armónica natural con modulación espacial suave que reduce la tensión neurosensorial sin fatiga.'
  },
  {
    id: 'binaural-theta',
    name: 'Ondas Delta/Theta Binaurales',
    subtitle: '216 Hz (L) + 220 Hz (R) • Diferencia 4.0 Hz',
    icon: 'fa-brain',
    color: '#A855F7',
    description:
      'Pulso binaural dicótico de 4 Hz que induce sincronización hemisférica profunda y reduce el cortisol.'
  }
];

class SoundHealingSynth {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.activeNodes = [];
    this.isPlaying = false;
    this.currentMode = 'brown-noise';
    this.volume = 0.45;
    this.stopTimeoutId = null;
  }

  _ensureContext() {
    if (!this.ctx || this.ctx.state === 'closed') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  _cleanupActiveNodes() {
    if (this.stopTimeoutId) {
      clearTimeout(this.stopTimeoutId);
      this.stopTimeoutId = null;
    }
    this.activeNodes.forEach((node) => {
      try {
        if (typeof node.stop === 'function') {
          node.stop();
        }
      } catch {
        // Ignorar si el nodo ya estaba detenido
      }
      try {
        node.disconnect();
      } catch {
        // Ignorar si ya estaba desconectado
      }
    });
    this.activeNodes = [];
    if (this.masterGain) {
      try {
        this.masterGain.disconnect();
      } catch {
        // Ignorar
      }
      this.masterGain = null;
    }
  }

  /**
   * Inicia la síntesis continua en el modo indicado con fade-in suave de 0.8s.
   */
  start(mode = this.currentMode, volume = this.volume) {
    const ctx = this._ensureContext();
    this._cleanupActiveNodes();

    this.currentMode = mode;
    this.volume = Math.max(0.01, Math.min(1, volume));
    this.isPlaying = true;

    const now = ctx.currentTime;
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.0001, now);
    masterGain.gain.exponentialRampToValueAtTime(this.volume, now + 0.8);
    masterGain.connect(ctx.destination);
    this.masterGain = masterGain;

    if (mode === 'brown-noise') {
      this._buildBrownNoiseGraph(ctx, masterGain, now);
    } else if (mode === 'healing-432') {
      this._build432HzGraph(ctx, masterGain, now);
    } else if (mode === 'binaural-theta') {
      this._buildBinauralGraph(ctx, masterGain, now);
    } else {
      this._buildBrownNoiseGraph(ctx, masterGain, now);
    }
  }

  /**
   * 1. Ruido Marrón (1/f²) mediante integración estocástica en buffer estéreo + LPF a 400 Hz.
   */
  _buildBrownNoiseGraph(ctx, destination, now) {
    const bufferDuration = 5; // 5 segundos en bucle continuo
    const bufferSize = ctx.sampleRate * bufferDuration;
    const buffer = ctx.createBuffer(2, bufferSize, ctx.sampleRate);

    for (let ch = 0; ch < 2; ch++) {
      const data = buffer.getChannelData(ch);
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        lastOut = (lastOut + 0.02 * white) / 1.02;
        data[i] = lastOut * 3.2; // Compensación de ganancia para ruido marrón
      }
    }

    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = buffer;
    noiseSource.loop = true;

    // Filtro Paso-Bajo Butterworth a 400 Hz
    const lpf = ctx.createBiquadFilter();
    lpf.type = 'lowpass';
    lpf.frequency.setValueAtTime(400, now);
    lpf.Q.setValueAtTime(0.707, now);

    // Modulación lenta tipo oleaje orgánico (0.09 Hz -> +-45 Hz alrededor de 400 Hz)
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.09, now);

    const lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(45, now);

    lfo.connect(lfoGain);
    lfoGain.connect(lpf.frequency);

    noiseSource.connect(lpf);
    lpf.connect(destination);

    noiseSource.start(now);
    lfo.start(now);

    this.activeNodes.push(noiseSource, lfo, lfoGain, lpf);
  }

  /**
   * 2. Frecuencia Curativa 432 Hz con armónicos suaves y paneo estereofónico LFO.
   */
  _build432HzGraph(ctx, destination, now) {
    // Oscilador principal 432 Hz
    const oscFundamental = ctx.createOscillator();
    oscFundamental.type = 'sine';
    oscFundamental.frequency.setValueAtTime(432, now);

    const gainFundamental = ctx.createGain();
    gainFundamental.gain.setValueAtTime(0.55, now);

    // Sub-octava cálida en 216 Hz
    const oscSub = ctx.createOscillator();
    oscSub.type = 'sine';
    oscSub.frequency.setValueAtTime(216, now);

    const gainSub = ctx.createGain();
    gainSub.gain.setValueAtTime(0.25, now);

    // Quinta armónica cristalina en 648 Hz
    const oscFifth = ctx.createOscillator();
    oscFifth.type = 'sine';
    oscFifth.frequency.setValueAtTime(648, now);

    const gainFifth = ctx.createGain();
    gainFifth.gain.setValueAtTime(0.08, now);

    // Nodo de paneo estereofónico con LFO lento (0.12 Hz)
    const panner = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    const panLfo = ctx.createOscillator();
    panLfo.type = 'sine';
    panLfo.frequency.setValueAtTime(0.12, now);

    const panLfoGain = ctx.createGain();
    panLfoGain.gain.setValueAtTime(0.45, now);

    // LFO de respiración de amplitud (0.16 Hz)
    const ampModNode = ctx.createGain();
    ampModNode.gain.setValueAtTime(0.85, now);

    const ampLfo = ctx.createOscillator();
    ampLfo.type = 'sine';
    ampLfo.frequency.setValueAtTime(0.16, now);

    const ampLfoGain = ctx.createGain();
    ampLfoGain.gain.setValueAtTime(0.12, now);

    ampLfo.connect(ampLfoGain);
    ampLfoGain.connect(ampModNode.gain);

    oscFundamental.connect(gainFundamental);
    oscSub.connect(gainSub);
    oscFifth.connect(gainFifth);

    gainFundamental.connect(ampModNode);
    gainSub.connect(ampModNode);
    gainFifth.connect(ampModNode);

    if (panner) {
      panLfo.connect(panLfoGain);
      panLfoGain.connect(panner.pan);
      ampModNode.connect(panner);
      panner.connect(destination);
      this.activeNodes.push(panner, panLfo, panLfoGain);
      panLfo.start(now);
    } else {
      ampModNode.connect(destination);
    }

    oscFundamental.start(now);
    oscSub.start(now);
    oscFifth.start(now);
    ampLfo.start(now);

    this.activeNodes.push(
      oscFundamental,
      oscSub,
      oscFifth,
      gainFundamental,
      gainSub,
      gainFifth,
      ampModNode,
      ampLfo,
      ampLfoGain
    );
  }

  /**
   * 3. Ondas Delta/Theta Binaurales: Portadora 216 Hz (Izquierda) y 220 Hz (Derecha) -> Diferencia 4 Hz.
   */
  _buildBinauralGraph(ctx, destination, now) {
    // Canal Izquierdo: 216 Hz
    const oscLeft = ctx.createOscillator();
    oscLeft.type = 'sine';
    oscLeft.frequency.setValueAtTime(216, now);

    const gainLeft = ctx.createGain();
    gainLeft.gain.setValueAtTime(0.48, now);

    // Canal Derecho: 220 Hz (Diferencia = 4.0 Hz Theta/Delta)
    const oscRight = ctx.createOscillator();
    oscRight.type = 'sine';
    oscRight.frequency.setValueAtTime(220, now);

    const gainRight = ctx.createGain();
    gainRight.gain.setValueAtTime(0.48, now);

    // Colchón sub-grave centrado en 108 Hz para dar cuerpo acústico en altavoces
    const oscPad = ctx.createOscillator();
    oscPad.type = 'sine';
    oscPad.frequency.setValueAtTime(108, now);

    const gainPad = ctx.createGain();
    gainPad.gain.setValueAtTime(0.15, now);

    if (ctx.createStereoPanner) {
      const panLeft = ctx.createStereoPanner();
      panLeft.pan.setValueAtTime(-1.0, now);

      const panRight = ctx.createStereoPanner();
      panRight.pan.setValueAtTime(1.0, now);

      oscLeft.connect(gainLeft);
      gainLeft.connect(panLeft);
      panLeft.connect(destination);

      oscRight.connect(gainRight);
      gainRight.connect(panRight);
      panRight.connect(destination);

      this.activeNodes.push(panLeft, panRight);
    } else {
      oscLeft.connect(gainLeft);
      gainLeft.connect(destination);
      oscRight.connect(gainRight);
      gainRight.connect(destination);
    }

    oscPad.connect(gainPad);
    gainPad.connect(destination);

    oscLeft.start(now);
    oscRight.start(now);
    oscPad.start(now);

    this.activeNodes.push(oscLeft, oscRight, oscPad, gainLeft, gainRight, gainPad);
  }

  /**
   * Ajusta el volumen maestro en tiempo real sin clics acústicos.
   */
  setVolume(newVol) {
    this.volume = Math.max(0.01, Math.min(1, newVol));
    if (this.isPlaying && this.masterGain && this.ctx) {
      const now = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setTargetAtTime(this.volume, now, 0.08);
    }
  }

  /**
   * Detiene el sintetizador con un fade-out suave para evitar transientes en el oído.
   */
  stop(fadeSeconds = 0.45) {
    if (!this.isPlaying || !this.ctx || !this.masterGain) {
      this.isPlaying = false;
      this._cleanupActiveNodes();
      return;
    }

    this.isPlaying = false;
    const now = this.ctx.currentTime;
    try {
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setValueAtTime(Math.max(0.0001, this.masterGain.gain.value), now);
      this.masterGain.gain.exponentialRampToValueAtTime(0.0001, now + fadeSeconds);
    } catch {
      // Fallback directo
    }

    this.stopTimeoutId = setTimeout(() => {
      this._cleanupActiveNodes();
    }, Math.ceil(fadeSeconds * 1000) + 60);
  }

  /**
   * Síntesis Aditiva de Campana / Cuenco Tibetano con envolvente ADSR suave.
   * Se dispara automáticamente cuando el temporizador de reposo llega a 00:00.
   */
  playTibetanBellChime(bellVolume = 0.55) {
    const ctx = this._ensureContext();
    const now = ctx.currentTime;

    const bellMaster = ctx.createGain();
    bellMaster.gain.setValueAtTime(Math.max(0.05, Math.min(1, bellVolume)), now);
    bellMaster.connect(ctx.destination);

    // Parciales inarmónicos modelados a partir de un cuenco cantor tibetano afinado en 432 Hz
    const partials = [
      { freq: 216.0, amp: 0.25, decay: 5.2 }, // Sub-hum cálido
      { freq: 432.0, amp: 0.50, decay: 4.8 }, // Fundamental 432 Hz
      { freq: 433.8, amp: 0.30, decay: 4.5 }, // Batimiento natural (+1.8 Hz shimmer)
      { freq: 1192.3, amp: 0.20, decay: 3.4 }, // Primer sobretono inarmónico (2.76x)
      { freq: 2332.8, amp: 0.08, decay: 2.0 } // Brillo metálico suave (5.40x)
    ];

    partials.forEach(({ freq, amp, decay }) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      const env = ctx.createGain();
      // Envolvente ADSR: Ataque suave de mazo de fieltro (25ms) + Decaimiento exponencial largo
      env.gain.setValueAtTime(0.0001, now);
      env.gain.linearRampToValueAtTime(amp, now + 0.025);
      env.gain.exponentialRampToValueAtTime(0.0001, now + decay);

      osc.connect(env);
      env.connect(bellMaster);

      osc.start(now);
      osc.stop(now + decay + 0.05);

      osc.onended = () => {
        try {
          osc.disconnect();
          env.disconnect();
        } catch {
          // Ignorar
        }
      };
    });

    setTimeout(() => {
      try {
        bellMaster.disconnect();
      } catch {
        // Ignorar
      }
    }, 5500);
  }
}

export const soundHealingSynth = new SoundHealingSynth();

