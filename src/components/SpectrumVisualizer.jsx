import { useEffect, useRef } from 'react';

const BAR_COUNT = 44;
const MIN_FREQ = 80;
const MAX_FREQ = 12000;

function toRgba(hex, alpha) {
  const clean = String(hex).replace('#', '');
  if (clean.length !== 6) return hex;
  const n = parseInt(clean, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

/**
 * Analizador de espectro en Canvas con escala logarítmica de frecuencias (80 Hz - 12 kHz).
 * Lee directamente del AnalyserNode con su propio bucle de animación, sin pasar por el estado de React.
 * Sin analizador activo muestra una línea base en reposo.
 */
export default function SpectrumVisualizer({ analyser = null, color = '#00F0FF' }) {
  const canvasRef = useRef(null);
  const colorRef = useRef(color);

  useEffect(() => {
    colorRef.current = color;
  }, [color]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const levels = new Float32Array(BAR_COUNT);
    const peaks = new Float32Array(BAR_COUNT);
    let width = 0;
    let height = 0;
    let rafId = 0;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resize) : null;
    observer?.observe(canvas);

    // Agrupa los bins de la FFT en barras repartidas logarítmicamente
    let data = null;
    let ranges = null;
    if (analyser) {
      data = new Uint8Array(analyser.frequencyBinCount);
      const hzPerBin = analyser.context.sampleRate / 2 / analyser.frequencyBinCount;
      ranges = Array.from({ length: BAR_COUNT }, (_, i) => {
        const f0 = MIN_FREQ * (MAX_FREQ / MIN_FREQ) ** (i / BAR_COUNT);
        const f1 = MIN_FREQ * (MAX_FREQ / MIN_FREQ) ** ((i + 1) / BAR_COUNT);
        const start = Math.max(1, Math.floor(f0 / hzPerBin));
        const end = Math.min(data.length, Math.max(start + 1, Math.ceil(f1 / hzPerBin)));
        return [start, end];
      });
    }

    const draw = (time) => {
      ctx.clearRect(0, 0, width, height);
      const accent = colorRef.current;
      const gap = 3;
      const barWidth = Math.max(1, (width - gap * (BAR_COUNT - 1)) / BAR_COUNT);
      const usable = Math.max(1, height - 6);

      if (analyser && data) analyser.getByteFrequencyData(data);

      const gradient = ctx.createLinearGradient(0, height, 0, 0);
      gradient.addColorStop(0, toRgba(accent, 0.25));
      gradient.addColorStop(1, toRgba(accent, 1));

      for (let i = 0; i < BAR_COUNT; i += 1) {
        let target;
        if (data && ranges) {
          const [start, end] = ranges[i];
          let sum = 0;
          for (let k = start; k < end; k += 1) sum += data[k];
          target = (sum / (end - start) / 255) ** 1.3;
        } else {
          target = reduceMotion ? 0.05 : 0.05 + 0.035 * ((Math.sin(time / 700 + i * 0.45) + 1) / 2);
        }

        // Ataque rápido, caída suave
        levels[i] += (target - levels[i]) * (target > levels[i] ? 0.5 : 0.15);
        peaks[i] = Math.max(levels[i], peaks[i] - 0.008);

        const barHeight = Math.max(3, levels[i] * usable);
        const x = i * (barWidth + gap);
        const y = height - barHeight;

        ctx.fillStyle = gradient;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(x, y, barWidth, barHeight, 2);
        else ctx.rect(x, y, barWidth, barHeight);
        ctx.fill();

        // Marcador de pico retenido
        if (data) {
          const capY = height - peaks[i] * usable - 4;
          ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
          ctx.fillRect(x, Math.max(0, capY), barWidth, 2);
        }
      }

      rafId = requestAnimationFrame(draw);
    };

    rafId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafId);
      observer?.disconnect();
    };
  }, [analyser]);

  return (
    <div className="echosafe-spectrum-wrap">
      <div className="echosafe-spectrum-head">
        <span>
          <i className="fa-solid fa-wave-square" style={{ marginRight: '6px', color }}></i>
          Espectro en vivo
        </span>
        <span className={`echosafe-spectrum-status ${analyser ? 'active' : ''}`}>
          {analyser ? 'CAPTANDO' : 'EN ESPERA'}
        </span>
      </div>
      <canvas ref={canvasRef} className="echosafe-spectrum-canvas" aria-hidden="true" />
      <div className="echosafe-spectrum-axis">
        <span>80 Hz</span>
        <span>1 kHz</span>
        <span>12 kHz</span>
      </div>
    </div>
  );
}
