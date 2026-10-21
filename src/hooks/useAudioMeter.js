import { useState, useRef, useCallback, useEffect } from 'react';
import { AUDIO_CONFIG } from '../constants/echoSafeConfig';

const {
  FFT_SIZE,
  SAMPLE_INTERVAL_MS,
  UI_INTERVAL_MS,
  SCAN_DURATION_MS,
  WARMUP_MS,
  FAST_ALPHA,
  CALIBRATION_OFFSET,
  MIN_DB,
  MAX_DB,
  SILENCE_DBFS
} = AUDIO_CONFIG;

const clamp = (value, lo, hi) => Math.min(hi, Math.max(lo, value));

/**
 * Ganancia de potencia de la curva de ponderación A (IEC 61672) para una frecuencia.
 * La ponderación A aproxima la sensibilidad del oído humano (atenúa graves y agudos extremos).
 */
function aWeightingPower(freq) {
  const f2 = freq * freq;
  const ra =
    (12194 ** 2 * f2 * f2) /
    ((f2 + 20.6 ** 2) * Math.sqrt((f2 + 107.7 ** 2) * (f2 + 737.9 ** 2)) * (f2 + 12194 ** 2));
  const aDb = 20 * Math.log10(ra) + 2.0;
  return 10 ** (aDb / 10);
}

/** Precalcula el peso A de cada bin de la FFT para no repetir cálculos en cada muestra. */
function buildAWeights(sampleRate, binCount) {
  const weights = new Float32Array(binCount);
  const hzPerBin = sampleRate / FFT_SIZE;
  for (let k = 1; k < binCount; k += 1) {
    weights[k] = aWeightingPower(k * hzPerBin);
  }
  return weights;
}

/**
 * Sonómetro basado en Web Audio API.
 *
 * - Nivel por RMS real (dBFS) corregido con ponderación A y calibrado a dB estimados.
 * - Ponderación temporal "Fast" para el valor en vivo, Leq energético para el promedio final.
 * - Ciclo de vida blindado: libera micrófono, AudioContext y temporizadores al terminar,
 *   cancelar, perder el foco de la pestaña o desmontar el componente.
 *
 * Nota: es una estimación con micrófonos de consumo, no una medición certificada.
 */
export default function useAudioMeter({ onComplete, onError } = {}) {
  const [isListening, setIsListening] = useState(false);
  const [progress, setProgress] = useState(0);
  const [liveDb, setLiveDb] = useState(0);
  const [analyser, setAnalyser] = useState(null);

  const callbacksRef = useRef({ onComplete, onError });
  const resourcesRef = useRef({ ctx: null, stream: null, source: null, timer: null, onVisibility: null });
  const runningRef = useRef(false);
  const mountedRef = useRef(true);

  // Mantiene los callbacks actualizados sin recrear el hook ni reiniciar mediciones
  useEffect(() => {
    callbacksRef.current = { onComplete, onError };
  });

  const releaseResources = useCallback(() => {
    const r = resourcesRef.current;
    if (r.timer) clearInterval(r.timer);
    if (r.onVisibility) document.removeEventListener('visibilitychange', r.onVisibility);
    try {
      r.source?.disconnect();
    } catch {
      /* el nodo ya estaba desconectado */
    }
    r.stream?.getTracks().forEach((track) => {
      track.onended = null;
      track.stop();
    });
    if (r.ctx && r.ctx.state !== 'closed') {
      r.ctx.close().catch(() => {});
    }
    resourcesRef.current = { ctx: null, stream: null, source: null, timer: null, onVisibility: null };
    runningRef.current = false;
  }, []);

  const resetUi = useCallback(() => {
    if (!mountedRef.current) return;
    setIsListening(false);
    setAnalyser(null);
    setProgress(0);
    setLiveDb(0);
  }, []);

  const abort = useCallback(
    (code) => {
      if (!runningRef.current) return;
      releaseResources();
      resetUi();
      callbacksRef.current.onError?.({ code });
    },
    [releaseResources, resetUi]
  );

  /** Cancela la medición en curso sin notificar error. */
  const cancel = useCallback(() => {
    if (!runningRef.current) return;
    releaseResources();
    resetUi();
  }, [releaseResources, resetUi]);

  const start = useCallback(async () => {
    if (runningRef.current) return;

    if (!navigator.mediaDevices?.getUserMedia) {
      callbacksRef.current.onError?.({ code: 'unsupported' });
      return;
    }

    runningRef.current = true;

    let stream;
    try {
      // Se desactivan los procesados automáticos: distorsionan el nivel real del entorno
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false }
      });
    } catch (error) {
      runningRef.current = false;
      let code = 'unknown';
      if (error?.name === 'NotAllowedError' || error?.name === 'SecurityError') code = 'denied';
      else if (error?.name === 'NotFoundError' || error?.name === 'OverconstrainedError') code = 'no-device';
      callbacksRef.current.onError?.({ code, error });
      return;
    }

    // El componente se desmontó mientras se esperaba el permiso
    if (!mountedRef.current) {
      stream.getTracks().forEach((track) => track.stop());
      runningRef.current = false;
      return;
    }

    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioCtx();
    resourcesRef.current.ctx = ctx;
    resourcesRef.current.stream = stream;

    if (ctx.state === 'suspended') {
      await ctx.resume().catch(() => {});
    }
    // Cancelada o desmontada durante la espera: los recursos ya fueron liberados
    if (!runningRef.current) return;

    const node = ctx.createAnalyser();
    node.fftSize = FFT_SIZE;
    node.smoothingTimeConstant = 0.6;
    node.minDecibels = -95;
    node.maxDecibels = -10;

    const source = ctx.createMediaStreamSource(stream);
    source.connect(node); // Sin conexión a destination: evita feedback de audio
    resourcesRef.current.source = source;

    stream.getAudioTracks().forEach((track) => {
      track.onended = () => abort('interrupted');
    });

    const onVisibility = () => {
      if (document.hidden) abort('interrupted');
    };
    document.addEventListener('visibilitychange', onVisibility);
    resourcesRef.current.onVisibility = onVisibility;

    const timeBuf = new Float32Array(node.fftSize);
    const freqBuf = new Float32Array(node.frequencyBinCount);
    const weights = buildAWeights(ctx.sampleRate, node.frequencyBinCount);

    let smoothedEnergy = null;
    let sumEnergy = 0;
    let count = 0;
    let peak = -Infinity;
    let min = Infinity;
    let peakDbfs = -Infinity;
    let lastUi = 0;
    const startTime = performance.now();

    const finish = () => {
      const heardSomething = peakDbfs >= SILENCE_DBFS;
      const enoughSamples = count >= 10;
      releaseResources();
      resetUi();

      if (!heardSomething) {
        callbacksRef.current.onError?.({ code: 'silent' });
        return;
      }
      if (!enoughSamples) {
        callbacksRef.current.onError?.({ code: 'insufficient' });
        return;
      }

      // Leq: promedio en el dominio de la energía, no aritmético
      const leq = 10 * Math.log10(sumEnergy / count);
      callbacksRef.current.onComplete?.({
        avg: Math.round(leq),
        peak: Math.round(peak),
        min: Math.round(min),
        samples: count
      });
    };

    const tick = () => {
      const now = performance.now();
      const elapsed = now - startTime;

      // 1) Nivel RMS real en dominio temporal (dBFS)
      node.getFloatTimeDomainData(timeBuf);
      let squares = 0;
      for (let i = 0; i < timeBuf.length; i += 1) squares += timeBuf[i] * timeBuf[i];
      const rms = Math.sqrt(squares / timeBuf.length);
      const dbfs = rms > 1e-9 ? 20 * Math.log10(rms) : -120;
      if (dbfs > peakDbfs) peakDbfs = dbfs;

      // 2) Corrección de ponderación A: fracción de energía percibida por el oído humano
      node.getFloatFrequencyData(freqBuf);
      let powerTotal = 0;
      let powerA = 0;
      for (let k = 1; k < freqBuf.length; k += 1) {
        const magnitudeDb = freqBuf[k];
        if (!Number.isFinite(magnitudeDb)) continue;
        const power = 10 ** (magnitudeDb / 10);
        powerTotal += power;
        powerA += power * weights[k];
      }
      const correction = powerTotal > 0 && powerA > 0 ? 10 * Math.log10(powerA / powerTotal) : 0;

      // 3) Calibración a dB estimados y ponderación temporal Fast
      const dba = clamp(dbfs + correction + CALIBRATION_OFFSET, MIN_DB, MAX_DB);
      const energy = 10 ** (dba / 10);
      smoothedEnergy = smoothedEnergy === null ? energy : smoothedEnergy + FAST_ALPHA * (energy - smoothedEnergy);
      const fastDb = 10 * Math.log10(smoothedEnergy);

      // 4) Estadísticas (se descarta el arranque del micrófono)
      if (elapsed >= WARMUP_MS) {
        sumEnergy += energy;
        count += 1;
        if (fastDb > peak) peak = fastDb;
        if (fastDb < min) min = fastDb;
      }

      // 5) Refresco de interfaz limitado para no saturar a React ni al mapa
      if (now - lastUi >= UI_INTERVAL_MS && mountedRef.current) {
        lastUi = now;
        setLiveDb(Math.round(fastDb));
        setProgress(Math.min(100, (elapsed / SCAN_DURATION_MS) * 100));
      }

      if (elapsed >= SCAN_DURATION_MS) finish();
    };

    resourcesRef.current.timer = setInterval(tick, SAMPLE_INTERVAL_MS);
    setLiveDb(0);
    setProgress(0);
    setAnalyser(node);
    setIsListening(true);
  }, [abort, releaseResources, resetUi]);

  // Libera todo si el usuario abandona la pantalla a mitad de una medición
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      releaseResources();
    };
  }, [releaseResources]);

  return { start, cancel, isListening, progress, liveDb, analyser };
}
