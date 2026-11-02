import { useState, useEffect, useRef, useCallback } from 'react';
import {
  BeatItScheduler,
  triggerSound,
  KIT_DEFINITIONS,
  INSTRUMENTS,
  exportPatternToWav
} from '../services/beatItAudioEngine';
import { generateEuclideanPattern } from '../utils/euclideanRhythm';
import {
  TOTAL_MAX_STEPS,
  DEFAULT_FX_SETTINGS,
  createEmptyGrid,
  createInitialTrackMap,
  getDelaySeconds
} from '../constants/beatItPresets';

/**
 * Hook que encapsula el motor Web Audio API (BeatItScheduler),
 * estado del secuenciador, consola de mezcla, Rack FX, Tap Tempo y exportación WAV.
 */
export function useBeatItScheduler({ showToast }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [tempo, setTempo] = useState(120);
  const [currentStep, setCurrentStep] = useState(0);
  const [currentKit, setCurrentKit] = useState('Analog 808');
  const [isLoFi, setIsLoFi] = useState(false);

  // --- GROOVE, SWING Y COMPASES ---
  const [swing, setSwing] = useState(50);
  const [totalSteps, setTotalSteps] = useState(16);
  const [activeBar, setActiveBar] = useState(0);

  // --- RACK DE EFECTOS MAESTROS (MODO DJ) ---
  const [showFxRack, setShowFxRack] = useState(false);
  const [fxSettings, setFxSettings] = useState(DEFAULT_FX_SETTINGS);

  // --- PRESETS Y TAP TEMPO ---
  const [showPresets, setShowPresets] = useState(false);
  const [showEuclidean, setShowEuclidean] = useState(false);
  const tapTimesRef = useRef([]);
  const [isTapping, setIsTapping] = useState(false);

  // --- EXPORTADOR DE AUDIO WAV ---
  const [showExportModal, setShowExportModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportLoops, setExportLoops] = useState(2);
  const [exportStatusText, setExportStatusText] = useState('');

  const schedulerRef = useRef(null);

  const [grid, setGrid] = useState(() => createEmptyGrid());
  const [trackVolumes, setTrackVolumes] = useState(() => createInitialTrackMap(0.85));
  const [mutes, setMutes] = useState(() => createInitialTrackMap(false));
  const [solos, setSolos] = useState(() => createInitialTrackMap(false));
  const [masterVolume, setMasterVolume] = useState(0.85);

  // --- INICIALIZACIÓN DEL MOTOR WEB AUDIO API ---
  useEffect(() => {
    schedulerRef.current = new BeatItScheduler({
      tempo,
      steps: totalSteps,
      kit: currentKit,
      isLoFi,
      grid,
      swing,
      trackVolumes,
      mutes,
      solos,
      masterVolume,
      fx: {
        enabled: fxSettings.enabled,
        djFilter: fxSettings.djFilter,
        drive: fxSettings.drive,
        delayWet: fxSettings.delayWet,
        delayFeedback: fxSettings.delayFeedback,
        delayTime: getDelaySeconds(fxSettings.delaySync, tempo)
      },
      onStepChange: (step) => setCurrentStep(step)
    });

    return () => {
      if (schedulerRef.current) {
        schedulerRef.current.stop(true);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sincronizar cambios de compás, kits, swing y totalSteps
  useEffect(() => {
    if (schedulerRef.current) {
      schedulerRef.current.updateTempo(tempo);
      schedulerRef.current.updateGrid(grid);
      schedulerRef.current.updateKit(currentKit);
      schedulerRef.current.updateLoFi(isLoFi);
      schedulerRef.current.updateSwing(swing);
      schedulerRef.current.updateSteps(totalSteps);
    }
  }, [tempo, grid, currentKit, isLoFi, swing, totalSteps]);

  // Sincronizar consola de mezcla en tiempo real
  useEffect(() => {
    if (schedulerRef.current) {
      schedulerRef.current.updateMixer({
        trackVolumes,
        mutes,
        solos,
        masterVolume
      });
    }
  }, [trackVolumes, mutes, solos, masterVolume]);

  // Sincronizar Rack de Efectos Maestros en tiempo real
  useEffect(() => {
    if (schedulerRef.current) {
      schedulerRef.current.updateFX({
        enabled: fxSettings.enabled,
        djFilter: fxSettings.djFilter,
        drive: fxSettings.drive,
        delayWet: fxSettings.delayWet,
        delayFeedback: fxSettings.delayFeedback,
        delayTime: getDelaySeconds(fxSettings.delaySync, tempo)
      });
    }
  }, [fxSettings, tempo]);

  const stopPlayback = useCallback(() => {
    schedulerRef.current?.stop();
    setIsPlaying(false);
  }, []);

  const resetGrid = useCallback(() => {
    setGrid(createEmptyGrid());
  }, []);

  const handleToggleMute = useCallback((inst) => {
    setMutes((prev) => ({ ...prev, [inst]: !prev[inst] }));
  }, []);

  const handleToggleSolo = useCallback((inst) => {
    setSolos((prev) => ({ ...prev, [inst]: !prev[inst] }));
  }, []);

  const handleVolumeChange = useCallback((inst, value) => {
    const vol = parseFloat(value);
    setTrackVolumes((prev) => ({ ...prev, [inst]: vol }));
  }, []);

  const handleTogglePlay = useCallback(() => {
    if (isPlaying) {
      schedulerRef.current?.stop();
      setIsPlaying(false);
    } else {
      schedulerRef.current?.start();
      setIsPlaying(true);
    }
  }, [isPlaying]);

  const handleTapTempo = useCallback(() => {
    const now = performance.now();
    const times = tapTimesRef.current;

    if (times.length > 0 && now - times[times.length - 1] > 2000) {
      tapTimesRef.current = [];
    }

    tapTimesRef.current.push(now);
    if (tapTimesRef.current.length > 4) {
      tapTimesRef.current.shift();
    }

    setIsTapping(true);
    setTimeout(() => setIsTapping(false), 120);

    if (tapTimesRef.current.length >= 2) {
      const intervals = [];
      for (let i = 1; i < tapTimesRef.current.length; i++) {
        intervals.push(tapTimesRef.current[i] - tapTimesRef.current[i - 1]);
      }
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const calculatedBpm = Math.round(60000 / avgInterval);
      const clampedBpm = Math.max(60, Math.min(200, calculatedBpm));
      setTempo(clampedBpm);
    }
  }, []);

  // Ciclo de 3 estados de velocidad: 0 (Off) -> 1 (Normal) -> 2 (Acento) -> 0
  const toggleStep = useCallback(
    (instrument, stepIndex) => {
      const currentVal = grid[instrument][stepIndex];
      let nextVal = 0;
      if (!currentVal || currentVal === 0) {
        nextVal = 1;
      } else if (currentVal === 1 || currentVal === true) {
        nextVal = 2;
      } else {
        nextVal = 0;
      }

      const newGrid = { ...grid };
      newGrid[instrument] = [...grid[instrument]];
      newGrid[instrument][stepIndex] = nextVal;
      setGrid(newGrid);

      if (nextVal > 0) {
        const isAccent = nextVal === 2;
        triggerSound(instrument, currentKit, isLoFi, null, trackVolumes[instrument], isAccent);
      }
    },
    [grid, currentKit, isLoFi, trackVolumes]
  );

  const handleDuplicateBar1ToBar2 = useCallback(() => {
    const newGrid = { ...grid };
    INSTRUMENTS.forEach((inst) => {
      const row = [...newGrid[inst]];
      for (let i = 0; i < 16; i++) {
        row[i + 16] = row[i];
      }
      newGrid[inst] = row;
    });
    setGrid(newGrid);
    setActiveBar(1);
  }, [grid]);

  const handleClearGrid = useCallback(() => {
    setGrid(createEmptyGrid());
  }, []);

  // --- GENERADOR DE PATRONES EUCLIDIANOS E(k, 16, r) (ALGORITMO DE BJORKLUND) ---
  const applyEuclideanToChannel = useCallback(
    (instrument, pulses, rotation = 0, accentFirst = true) => {
      if (!INSTRUMENTS.includes(instrument)) return;

      const pattern16 = generateEuclideanPattern(pulses, 16, rotation, accentFirst);
      setGrid((prevGrid) => {
        const newGrid = { ...prevGrid };
        const row = [...(newGrid[instrument] || Array(TOTAL_MAX_STEPS).fill(0))];

        if (totalSteps === 32) {
          const offset = activeBar * 16;
          for (let i = 0; i < 16; i++) {
            row[offset + i] = pattern16[i];
          }
        } else {
          for (let i = 0; i < 16; i++) {
            row[i] = pattern16[i];
            row[i + 16] = pattern16[i];
          }
        }

        newGrid[instrument] = row;
        return newGrid;
      });

      if (pulses > 0) {
        triggerSound(
          instrument,
          currentKit,
          isLoFi,
          null,
          trackVolumes[instrument] !== undefined ? trackVolumes[instrument] : 0.85,
          accentFirst
        );
      }
    },
    [totalSteps, activeBar, currentKit, isLoFi, trackVolumes]
  );

  const applyEuclideanEnsemble = useCallback(
    (ensemble) => {
      if (!ensemble?.layers) return;

      const newGrid = createEmptyGrid();
      ensemble.layers.forEach(({ inst, pulses, rotation = 0, accentFirst = false }) => {
        if (!INSTRUMENTS.includes(inst)) return;
        const pattern16 = generateEuclideanPattern(pulses, 16, rotation, accentFirst);
        const row = Array(TOTAL_MAX_STEPS).fill(0);
        for (let i = 0; i < 16; i++) {
          row[i] = pattern16[i];
          row[i + 16] = pattern16[i];
        }
        newGrid[inst] = row;
      });

      setGrid(newGrid);
      showToast?.(
        'success',
        'Polirritmia Euclidiana',
        `"${ensemble.name}" (${ensemble.badge}) generada con el algoritmo de Bjorklund.`
      );
    },
    [showToast]
  );

  const applyPresetToScheduler = useCallback(
    (preset) => {
      if (isPlaying) {
        schedulerRef.current?.stop();
        setIsPlaying(false);
      }

      setTempo(preset.bpm);
      setCurrentKit(preset.kit);
      setSwing(preset.swing);
      setIsLoFi(preset.isLoFi);
      setTotalSteps(preset.steps || 16);
      setActiveBar(0);
      setCurrentStep(0);

      const newGrid = {};
      INSTRUMENTS.forEach((inst) => {
        const row = Array(TOTAL_MAX_STEPS).fill(0);
        const src = preset.grid[inst] || [];
        for (let i = 0; i < 16; i++) {
          row[i] = src[i] || 0;
          row[i + 16] = src[i] || 0;
        }
        newGrid[inst] = row;
      });
      setGrid(newGrid);
      setShowPresets(false);
    },
    [isPlaying]
  );

  const applyLoadedBeatToScheduler = useCallback(
    (beatToLoad) => {
      if (isPlaying) {
        schedulerRef.current?.stop();
        setIsPlaying(false);
      }

      const normalizedGrid = {};
      INSTRUMENTS.forEach((inst) => {
        const rawRow = (beatToLoad.gridData && beatToLoad.gridData[inst]) || [];
        const row = Array(TOTAL_MAX_STEPS).fill(0);
        for (let i = 0; i < TOTAL_MAX_STEPS; i++) {
          if (rawRow[i] !== undefined) {
            row[i] = rawRow[i] === true ? 1 : rawRow[i];
          }
        }
        normalizedGrid[inst] = row;
      });
      setGrid(normalizedGrid);
      setTempo(beatToLoad.tempo || 120);
      const validKit = KIT_DEFINITIONS[beatToLoad.kit] ? beatToLoad.kit : 'Analog 808';
      setCurrentKit(validKit);
      setIsLoFi(!!beatToLoad.isLoFi);
      if (beatToLoad.trackVolumes) setTrackVolumes(beatToLoad.trackVolumes);
      if (beatToLoad.mutes) setMutes(beatToLoad.mutes);
      if (beatToLoad.solos) setSolos(beatToLoad.solos);
      if (beatToLoad.masterVolume !== undefined) setMasterVolume(beatToLoad.masterVolume);
      setSwing(beatToLoad.swing !== undefined ? beatToLoad.swing : 50);
      setTotalSteps(beatToLoad.totalSteps || 16);
      if (beatToLoad.fxSettings) {
        setFxSettings({
          enabled: beatToLoad.fxSettings.enabled !== undefined ? beatToLoad.fxSettings.enabled : true,
          djFilter: beatToLoad.fxSettings.djFilter !== undefined ? beatToLoad.fxSettings.djFilter : 0,
          drive: beatToLoad.fxSettings.drive !== undefined ? beatToLoad.fxSettings.drive : 0,
          delayWet: beatToLoad.fxSettings.delayWet !== undefined ? beatToLoad.fxSettings.delayWet : 0,
          delayFeedback:
            beatToLoad.fxSettings.delayFeedback !== undefined ? beatToLoad.fxSettings.delayFeedback : 35,
          delaySync: beatToLoad.fxSettings.delaySync || '1/8d'
        });
      }
      setActiveBar(0);
      setCurrentStep(0);
      return validKit;
    },
    [isPlaying]
  );

  const handleExportWav = useCallback(
    async (type = 'master', beatName = '') => {
      try {
        setIsExporting(true);
        setExportStatusText(
          type === 'master' ? 'Renderizando Master WAV a 44.1kHz...' : 'Renderizando Stems separados...'
        );

        const delaySec = getDelaySeconds(fxSettings.delaySync, tempo);
        const fxPayload = { ...fxSettings, delayTime: delaySec };
        const safeName = (beatName.trim() || 'TheSonicVault_Beat').replace(/[^a-zA-Z0-9_-]/g, '_');

        if (type === 'master') {
          const wavBlob = await exportPatternToWav({
            grid,
            kit: currentKit,
            isLoFi,
            tempo,
            swing,
            steps: totalSteps,
            loops: exportLoops,
            trackVolumes,
            mutes,
            solos,
            masterVolume,
            fx: fxPayload
          });

          const url = URL.createObjectURL(wavBlob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${safeName}_${currentKit.replace(/\s+/g, '')}_${tempo}BPM_Master.wav`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        } else if (type === 'stems') {
          for (const inst of INSTRUMENTS) {
            const hasNotes = grid[inst] && grid[inst].some((v) => v > 0);
            if (!hasNotes) continue;

            setExportStatusText(`Renderizando pista: ${inst.toUpperCase()}...`);

            const wavBlob = await exportPatternToWav({
              grid,
              kit: currentKit,
              isLoFi,
              tempo,
              swing,
              steps: totalSteps,
              loops: exportLoops,
              trackVolumes,
              mutes: {},
              solos: {},
              masterVolume,
              fx: fxPayload,
              onlyInstrument: inst
            });

            const url = URL.createObjectURL(wavBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${safeName}_STEM_${inst.toUpperCase()}_${tempo}BPM.wav`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            await new Promise((r) => setTimeout(r, 200));
          }
        }
      } catch (err) {
        console.error('Error exportando audio WAV:', err);
        showToast?.('error', 'Error al Exportar', 'Hubo un error al renderizar el archivo WAV digital.');
      } finally {
        setIsExporting(false);
        setExportStatusText('');
        setShowExportModal(false);
      }
    },
    [fxSettings, tempo, grid, currentKit, isLoFi, swing, totalSteps, exportLoops, trackVolumes, mutes, solos, masterVolume, showToast]
  );

  const activeKitColor = KIT_DEFINITIONS[currentKit]?.color || 'var(--accent-color, #00ffcc)';
  const hasAnySolo = Object.values(solos).some(Boolean);
  const isFxActive =
    fxSettings.enabled && (fxSettings.djFilter !== 0 || fxSettings.drive > 0 || fxSettings.delayWet > 0);

  const getFilterReadout = useCallback(() => {
    const val = Number(fxSettings.djFilter) || 0;
    if (val < 0) return `PASABAJOS (${val}%) • SUB-BASS`;
    if (val > 0) return `PASAALTOS (+${val}%) • DROP FX`;
    return 'FLAT (BYPASS)';
  }, [fxSettings.djFilter]);

  return {
    // Estados del secuenciador y transporte
    isPlaying,
    tempo,
    setTempo,
    currentStep,
    currentKit,
    setCurrentKit,
    isLoFi,
    setIsLoFi,
    swing,
    setSwing,
    totalSteps,
    setTotalSteps,
    activeBar,
    setActiveBar,
    grid,
    // Estados de mezcla
    trackVolumes,
    mutes,
    solos,
    masterVolume,
    setMasterVolume,
    // Estados de Rack FX
    showFxRack,
    setShowFxRack,
    fxSettings,
    setFxSettings,
    // Estados de Presets y Tap Tempo
    showPresets,
    setShowPresets,
    showEuclidean,
    setShowEuclidean,
    isTapping,
    // Estados de Exportación WAV
    showExportModal,
    setShowExportModal,
    isExporting,
    exportLoops,
    setExportLoops,
    exportStatusText,
    // Valores derivados
    activeKitColor,
    hasAnySolo,
    isFxActive,
    getFilterReadout,
    // Acciones
    stopPlayback,
    resetGrid,
    handleToggleMute,
    handleToggleSolo,
    handleVolumeChange,
    handleTogglePlay,
    handleTapTempo,
    toggleStep,
    handleDuplicateBar1ToBar2,
    handleClearGrid,
    applyEuclideanToChannel,
    applyEuclideanEnsemble,
    applyPresetToScheduler,
    applyLoadedBeatToScheduler,
    handleExportWav
  };
}
