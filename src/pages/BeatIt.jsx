import { useState, useEffect, useRef } from 'react';
// IMPORTAMOS FIREBASE
import { db, auth } from '../firebase/config'; 
import { collection, addDoc, getDocs, query, where, orderBy } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

import { 
  BeatItScheduler, 
  triggerSound, 
  KIT_DEFINITIONS, 
  INSTRUMENTS, 
  INSTRUMENT_CONFIG,
  exportPatternToWav 
} from '../services/beatItAudioEngine';
import BeatItSpotifyRadarModal from '../components/BeatItSpotifyRadarModal';

const TOTAL_MAX_STEPS = 32;

// --- PRESETS DE GÉNERO DE FÁBRICA (FASE 6) ---
export const GENRE_PRESETS = [
  {
    name: 'Trap Bóveda',
    genre: 'Trap / Drill',
    bpm: 140,
    kit: 'Trap Bóveda',
    swing: 50,
    isLoFi: false,
    steps: 16,
    icon: 'fa-skull',
    color: '#9945ff',
    grid: {
      kick:   [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
      snare:  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      clap:   [0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0],
      hihat:  [1, 1, 2, 1, 1, 1, 2, 1, 1, 2, 1, 2, 1, 1, 2, 2],
      openhat:[0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0],
      sub808: [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 2, 0, 0, 0],
      tom:    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      crash:  [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    }
  },
  {
    name: 'Boom Bap 90s',
    genre: 'Classic Hip-Hop',
    bpm: 92,
    kit: 'Analog 808',
    swing: 62,
    isLoFi: true,
    steps: 16,
    icon: 'fa-compact-disc',
    color: '#00ffcc',
    grid: {
      kick:   [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 1, 0, 0],
      snare:  [0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0],
      clap:   [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      hihat:  [2, 1, 1, 1, 2, 1, 1, 1, 2, 1, 1, 1, 2, 1, 1, 1],
      openhat:[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0],
      sub808: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      tom:    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 2, 0],
      crash:  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    }
  },
  {
    name: 'Synthwave 80s',
    genre: 'Retro Electro',
    bpm: 122,
    kit: 'Cyberpunk',
    swing: 50,
    isLoFi: false,
    steps: 16,
    icon: 'fa-bolt',
    color: '#ff0077',
    grid: {
      kick:   [2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0],
      snare:  [0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0],
      clap:   [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
      hihat:  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      openhat:[0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0],
      sub808: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
      tom:    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 2, 2, 0],
      crash:  [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    }
  },
  {
    name: 'Reggaetón Dembow',
    genre: 'Urbano Latino',
    bpm: 96,
    kit: 'Trap Bóveda',
    swing: 50,
    isLoFi: false,
    steps: 16,
    icon: 'fa-fire',
    color: '#ffaa00',
    grid: {
      kick:   [2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0],
      snare:  [0, 0, 0, 2, 0, 0, 2, 0, 0, 0, 0, 2, 0, 0, 2, 0],
      clap:   [0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 1, 0],
      hihat:  [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
      openhat:[0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1],
      sub808: [2, 0, 0, 0, 1, 0, 0, 0, 2, 0, 0, 0, 1, 0, 0, 0],
      tom:    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
      crash:  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    }
  },
  {
    name: 'Classic House',
    genre: 'House / Club',
    bpm: 126,
    kit: 'Analog 808',
    swing: 54,
    isLoFi: false,
    steps: 16,
    icon: 'fa-record-vinyl',
    color: '#00bfff',
    grid: {
      kick:   [2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0],
      snare:  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      clap:   [0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0],
      hihat:  [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
      openhat:[0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0],
      sub808: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      tom:    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 2, 0],
      crash:  [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    }
  },
  {
    name: 'Lo-Fi Chill Hop',
    genre: 'Chill / Study',
    bpm: 80,
    kit: 'Lo-Fi Chill',
    swing: 65,
    isLoFi: true,
    steps: 16,
    icon: 'fa-mug-hot',
    color: '#e6c387',
    grid: {
      kick:   [2, 0, 0, 0, 0, 0, 1, 0, 0, 0, 2, 0, 0, 0, 0, 0],
      snare:  [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
      clap:   [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
      hihat:  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      openhat:[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
      sub808: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      tom:    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
      crash:  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    }
  }
];

export default function BeatIt() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [tempo, setTempo] = useState(120); 
  const [currentStep, setCurrentStep] = useState(0);
  const [currentKit, setCurrentKit] = useState("Analog 808");
  const [isLoFi, setIsLoFi] = useState(false);
  
  // --- GROOVE, SWING Y COMPASES ---
  const [swing, setSwing] = useState(50); // 50% = Straight, 75% = Heavy Swing
  const [totalSteps, setTotalSteps] = useState(16); // 16 o 32 pasos
  const [activeBar, setActiveBar] = useState(0); // 0 = Bar 1 (0-15), 1 = Bar 2 (16-31)
  
  // --- FASE 5: RACK DE EFECTOS MAESTROS (MODO DJ) ---
  const [showFxRack, setShowFxRack] = useState(false);
  const [fxSettings, setFxSettings] = useState({
    enabled: true,
    djFilter: 0, // -100 (LP) a +100 (HP), 0 = Neutral
    drive: 0, // 0 a 100% Tape Saturation
    delayWet: 0, // 0 a 100% Mix
    delayFeedback: 35, // 0 a 80% Feedback
    delaySync: '1/8d' // '1/16', '1/8', '1/8d', '1/4'
  });

  // --- FASE 6: PRESETS Y TAP TEMPO ---
  const [showPresets, setShowPresets] = useState(false);
  const tapTimesRef = useRef([]);
  const [isTapping, setIsTapping] = useState(false);

  // --- FASE 7: EXPORTADOR DE AUDIO WAV ---
  const [showExportModal, setShowExportModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportLoops, setExportLoops] = useState(2);
  const [exportStatusText, setExportStatusText] = useState('');

  // --- FASE 5 SPOTIFY: RADAR BPM & GENERADOR DE PLAYLISTS ---
  const [showSpotifyRadar, setShowSpotifyRadar] = useState(false);

  const vinylAudio = useRef(null);
  const schedulerRef = useRef(null);

  const [grid, setGrid] = useState(() => {
    const initialGrid = {};
    INSTRUMENTS.forEach(inst => {
      initialGrid[inst] = Array(TOTAL_MAX_STEPS).fill(0);
    });
    return initialGrid;
  });

  // --- ESTADOS DE LA CONSOLA DE MEZCLA ---
  const [trackVolumes, setTrackVolumes] = useState(() => {
    const initial = {};
    INSTRUMENTS.forEach(inst => initial[inst] = 0.85);
    return initial;
  });

  const [mutes, setMutes] = useState(() => {
    const initial = {};
    INSTRUMENTS.forEach(inst => initial[inst] = false);
    return initial;
  });

  const [solos, setSolos] = useState(() => {
    const initial = {};
    INSTRUMENTS.forEach(inst => initial[inst] = false);
    return initial;
  });

  const [masterVolume, setMasterVolume] = useState(0.85);

  // --- ESTADOS PARA FIREBASE ---
  const [beatName, setBeatName] = useState('');
  const [savedBeats, setSavedBeats] = useState([]); 
  const [user, setUser] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Cálculo de segundos de retardo sincronizado al tempo
  const getDelaySeconds = (sync, bpm) => {
    const quarter = 60.0 / Math.max(40, bpm);
    switch (sync) {
      case '1/16': return quarter * 0.25;
      case '1/8': return quarter * 0.5;
      case '1/8d': return quarter * 0.75;
      case '1/4': return quarter * 1.0;
      default: return quarter * 0.75;
    }
  };

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
        schedulerRef.current.stop();
      }
    };
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

  const handleToggleMute = (inst) => {
    setMutes(prev => ({ ...prev, [inst]: !prev[inst] }));
  };

  const handleToggleSolo = (inst) => {
    setSolos(prev => ({ ...prev, [inst]: !prev[inst] }));
  };

  const handleVolumeChange = (inst, value) => {
    const vol = parseFloat(value);
    setTrackVolumes(prev => ({ ...prev, [inst]: vol }));
  };

  // Manejo de reproducción sin latencia ni jitter
  const handleTogglePlay = () => {
    if (isPlaying) {
      schedulerRef.current?.stop();
      setIsPlaying(false);
    } else {
      schedulerRef.current?.start();
      setIsPlaying(true);
    }
  };

  // --- LÓGICA DE TAP TEMPO EN VIVO (FASE 6) ---
  const handleTapTempo = () => {
    const now = performance.now();
    const times = tapTimesRef.current;
    
    // Si pasaron más de 2 segundos desde el último toque, reiniciar
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
  };

  // Cargar Preset de Género
  const handleLoadPreset = (preset) => {
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
    INSTRUMENTS.forEach(inst => {
      const row = Array(TOTAL_MAX_STEPS).fill(0);
      const src = preset.grid[inst] || [];
      for (let i = 0; i < 16; i++) {
        row[i] = src[i] || 0;
        row[i + 16] = src[i] || 0; // Duplicar automáticamente al compás 2
      }
      newGrid[inst] = row;
    });
    setGrid(newGrid);
    setBeatName(`${preset.name}`);
    setShowPresets(false);
  };

  // --- EXPORTAR AUDIO WAV OFFLINE (FASE 7) ---
  const handleExportWav = async (type = 'master') => {
    try {
      setIsExporting(true);
      setExportStatusText(type === 'master' ? 'Renderizando Master WAV a 44.1kHz...' : 'Renderizando Stems separados...');

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
        // Renderizar stems individuales
        for (const inst of INSTRUMENTS) {
          const hasNotes = grid[inst] && grid[inst].some(v => v > 0);
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
          await new Promise(r => setTimeout(r, 200));
        }
      }
    } catch (err) {
      console.error("Error exportando audio WAV:", err);
      alert("Hubo un error al exportar el archivo WAV.");
    } finally {
      setIsExporting(false);
      setExportStatusText('');
      setShowExportModal(false);
    }
  };

  // --- DETECTAR USUARIO LOGUEADO Y TRAER SUS BEATS ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const q = query(
            collection(db, "beats"), 
            where("userId", "==", currentUser.uid)
          );
          const querySnapshot = await getDocs(q);
          const beatsNube = [];
          querySnapshot.forEach((doc) => {
            beatsNube.push({ id: doc.id, ...doc.data() });
          });
          setSavedBeats(beatsNube);
        } catch (error) {
          console.error("Error trayendo las cintas de la nube: ", error);
        }
      } else {
        setSavedBeats([]);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (isLoFi) {
      if (vinylAudio.current) {
        vinylAudio.current.volume = 0.8;
        vinylAudio.current.play().catch(e => console.log("Esperando vinilo..."));
      }
    } else {
      if (vinylAudio.current) {
        vinylAudio.current.pause();
      }
    }
  }, [isLoFi]);

  // Ciclo de 3 estados de velocidad: 0 (Off) -> 1 (Normal) -> 2 (Acento) -> 0
  const toggleStep = (instrument, stepIndex) => {
    const currentVal = grid[instrument][stepIndex];
    let nextVal = 0;
    if (!currentVal || currentVal === 0) {
      nextVal = 1; // Normal
    } else if (currentVal === 1 || currentVal === true) {
      nextVal = 2; // Acento / Punch
    } else {
      nextVal = 0; // Off
    }

    const newGrid = { ...grid };
    newGrid[instrument] = [...grid[instrument]]; 
    newGrid[instrument][stepIndex] = nextVal;
    setGrid(newGrid);

    if (nextVal > 0) {
      const isAccent = nextVal === 2;
      triggerSound(instrument, currentKit, isLoFi, null, trackVolumes[instrument], isAccent);
    }
  };

  // Duplicar Compás 1 en Compás 2
  const handleDuplicateBar1ToBar2 = () => {
    const newGrid = { ...grid };
    INSTRUMENTS.forEach(inst => {
      const row = [...newGrid[inst]];
      for (let i = 0; i < 16; i++) {
        row[i + 16] = row[i];
      }
      newGrid[inst] = row;
    });
    setGrid(newGrid);
    setActiveBar(1);
  };

  // Limpiar cuadrícula
  const handleClearGrid = () => {
    if (window.confirm("¿Limpiar el patrón del secuenciador?")) {
      const emptyGrid = {};
      INSTRUMENTS.forEach(inst => emptyGrid[inst] = Array(TOTAL_MAX_STEPS).fill(0));
      setGrid(emptyGrid);
    }
  };

  // --- GUARDAR EL BEAT EN FIREBASE ---
  const handleSaveBeat = async () => {
    if (!user) {
      alert("¡Debes iniciar sesión para guardar tus beats en The Sonic Vault!");
      return;
    }
    if (beatName.trim() === '') {
      alert("¡Ponle un nombre a tu obra maestra!");
      return;
    }

    setIsSaving(true);
    const snapshotGrid = JSON.parse(JSON.stringify(grid));

    const newBeat = {
      userId: user.uid,
      name: beatName,
      tempo: tempo,
      kit: currentKit,
      isLoFi: isLoFi,
      gridData: snapshotGrid,
      trackVolumes: trackVolumes,
      mutes: mutes,
      solos: solos,
      masterVolume: masterVolume,
      swing: swing,
      totalSteps: totalSteps,
      fxSettings: fxSettings,
      date: new Date().toLocaleDateString(),
      timestamp: new Date()
    };

    try {
      const docRef = await addDoc(collection(db, "beats"), newBeat);
      setSavedBeats([...savedBeats, { id: docRef.id, ...newBeat }]);
      setBeatName(''); 
      
      const emptyGrid = {};
      INSTRUMENTS.forEach(inst => emptyGrid[inst] = Array(TOTAL_MAX_STEPS).fill(0));
      setGrid(emptyGrid);
      if (isPlaying) {
        schedulerRef.current?.stop();
        setIsPlaying(false);
      }
      
    } catch (error) {
      console.error("Error guardando en la nube: ", error);
      alert("Hubo un error guardando tu cinta.");
    } finally {
      setIsSaving(false);
    }
  };

  const loadBeat = (beatToLoad) => {
    if (isPlaying) {
      schedulerRef.current?.stop();
      setIsPlaying(false);
    }
    const normalizedGrid = {};
    INSTRUMENTS.forEach(inst => {
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
    const validKit = KIT_DEFINITIONS[beatToLoad.kit] ? beatToLoad.kit : "Analog 808";
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
        delayFeedback: beatToLoad.fxSettings.delayFeedback !== undefined ? beatToLoad.fxSettings.delayFeedback : 35,
        delaySync: beatToLoad.fxSettings.delaySync || '1/8d'
      });
    }
    setActiveBar(0);
    setCurrentStep(0);
  };

  const activeKitColor = KIT_DEFINITIONS[currentKit]?.color || 'var(--accent-color, #00ffcc)';
  const hasAnySolo = Object.values(solos).some(Boolean);
  const isFxActive = fxSettings.enabled && (fxSettings.djFilter !== 0 || fxSettings.drive > 0 || fxSettings.delayWet > 0);

  // Formateo de texto dinámico para el DJ Filter
  const getFilterReadout = () => {
    const val = Number(fxSettings.djFilter) || 0;
    if (val < 0) return `PASABAJOS (${val}%) • SUB-BASS`;
    if (val > 0) return `PASAALTOS (+${val}%) • DROP FX`;
    return 'FLAT (BYPASS)';
  };

  return (
    <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1.5rem', background: 'transparent' }}>
      
      <audio ref={vinylAudio} src="https://ia800806.us.archive.org/15/items/VinylScratchAndCrackle/vinyl-scratch-and-crackle.mp3" loop />

      <div style={{ background: 'var(--surface-bg)', padding: '1.5rem 2rem', borderRadius: '16px', border: `1px solid ${isPlaying ? activeKitColor : 'var(--border-glow)'}`, width: '100%', maxWidth: '1020px', boxShadow: isLoFi ? '0 0 30px rgba(255, 170, 0, 0.2)' : (isPlaying ? `0 0 25px ${activeKitColor}33` : 'var(--shadow-soft)'), transition: '0.5s', marginBottom: '2rem', backdropFilter: 'blur(15px)' }}>
        
        {/* Visualizador de Ritmo Reactivo (8 Canales con feedback de Mute/Solo/Acento) */}
        <div style={{ background: isLoFi ? 'rgba(255, 170, 0, 0.08)' : 'rgba(0,0,0,0.65)', height: '90px', borderRadius: '10px', marginBottom: '1.2rem', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', gap: '8px', padding: '12px 20px', border: '1px inset rgba(255,255,255,0.08)', transition: '0.4s' }}>
          {INSTRUMENTS.map((inst) => {
            const isMuted = !!mutes[inst];
            const isSoloActive = !!solos[inst];
            const isSilenced = hasAnySolo ? (!isSoloActive || isMuted) : isMuted;

            const stepVal = grid[inst] && grid[inst][currentStep];
            const isFiring = isPlaying && stepVal > 0 && !isSilenced;
            const isAccentHit = isFiring && stepVal === 2;

            const cfg = INSTRUMENT_CONFIG[inst] || { label: inst, color: activeKitColor, short: inst };
            const barColor = isLoFi ? '#ffaa00' : (isAccentHit ? '#ffffff' : (isFiring ? cfg.color : activeKitColor));
            
            return (
               <div key={inst} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', flex: 1, maxWidth: '50px', opacity: isSilenced ? 0.35 : 1, transition: '0.2s' }}>
                 <div style={{ 
                   width: '100%', 
                   maxWidth: '32px', 
                   height: isAccentHit ? '72px' : (isFiring ? '55px' : '10px'), 
                   background: isFiring ? barColor : (isSilenced ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.08)'), 
                   transition: isFiring ? 'height 0.04s ease-out' : 'height 0.18s ease-in', 
                   borderRadius: '3px', 
                   boxShadow: isAccentHit ? `0 0 20px #fff, 0 0 10px ${cfg.color}` : (isFiring ? `0 0 14px ${barColor}` : 'none') 
                 }} />
                 <span style={{ fontSize: '0.62rem', color: isSoloActive ? '#ffaa00' : (isMuted ? '#ff4444' : (isFiring ? '#fff' : '#777')), textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '0.5px' }}>
                   {cfg.short}
                 </span>
               </div>
            );
          })}
        </div>

        {/* Panel Superior de Controles Principales */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h2 style={{ color: '#fff', margin: 0, letterSpacing: '2px', fontSize: '1.4rem' }}>ESTUDIO BEAT IT</h2>
              <span style={{ fontSize: '0.65rem', background: 'rgba(0,255,204,0.15)', color: '#00ffcc', padding: '3px 8px', borderRadius: '4px', border: '1px solid rgba(0,255,204,0.3)', fontWeight: 'bold', letterSpacing: '1px' }}>
                PRO ENGINE // 8 TRK
              </span>
            </div>
            <p style={{ color: activeKitColor, margin: '4px 0 0 0', fontSize: '0.78rem', textTransform: 'uppercase', transition: '0.3s' }}>
              {user ? `Estudio de ${user.displayName || 'Usuario'}` : 'Inicia sesión para guardar'} • Kit: {currentKit}
            </p>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0.6rem', alignItems: 'center', background: 'rgba(0,0,0,0.4)', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-alt)' }}>
            <select 
              value={currentKit} 
              onChange={(e) => setCurrentKit(e.target.value)} 
              style={{ background: 'var(--surface-alt)', color: '#fff', border: `1px solid ${activeKitColor}`, padding: '7px 10px', borderRadius: '4px', outline: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem' }}
            >
              {Object.keys(KIT_DEFINITIONS).map(kit => (
                <option key={kit} value={kit}>{kit}</option>
              ))}
            </select>

            {/* BPM y Tap Tempo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <input 
                type="number" 
                value={tempo} 
                onChange={(e) => setTempo(Number(e.target.value))} 
                min="60" 
                max="200" 
                title="BPM (Tempo)"
                style={{ width: '48px', background: 'var(--surface-alt)', color: '#fff', border: '1px solid var(--border-alt)', padding: '5px', borderRadius: '4px', textAlign: 'center', fontWeight: 'bold', fontSize: '0.8rem' }} 
              />
              <button
                type="button"
                onClick={handleTapTempo}
                title="Haz clic a ritmo para fijar el tempo automáticamente (Tap Tempo)"
                style={{
                  background: isTapping ? activeKitColor : 'rgba(255,255,255,0.08)',
                  color: isTapping ? '#000' : '#fff',
                  border: isTapping ? `1px solid ${activeKitColor}` : '1px solid rgba(255,255,255,0.15)',
                  padding: '5px 8px',
                  borderRadius: '4px',
                  fontWeight: 'bold',
                  fontSize: '0.68rem',
                  cursor: 'pointer',
                  transform: isTapping ? 'scale(1.12)' : 'scale(1)',
                  transition: '0.08s',
                  boxShadow: isTapping ? `0 0 10px ${activeKitColor}` : 'none'
                }}
              >
                TAP
              </button>
            </div>

            {/* Swing / Shuffle Control */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'rgba(255,255,255,0.04)', padding: '4px 8px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ color: '#888', fontSize: '0.68rem', fontWeight: 'bold' }}>SWING</span>
              <input 
                type="range" 
                min="50" 
                max="75" 
                step="1" 
                value={swing} 
                onChange={(e) => setSwing(Number(e.target.value))} 
                title={`Groove Swing: ${swing}% (50% = Plano, 66% = Triplet Funk, 75% = Fuerte)`}
                style={{ width: '40px', accentColor: activeKitColor, cursor: 'pointer' }} 
              />
              <span style={{ color: swing > 50 ? activeKitColor : '#aaa', fontSize: '0.68rem', fontWeight: 'bold', minWidth: '26px' }}>
                {swing}%
              </span>
            </div>

            {/* Master Volume Slider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'rgba(255,255,255,0.04)', padding: '4px 8px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <i className="fa-solid fa-volume-high" style={{ color: activeKitColor, fontSize: '0.75rem' }}></i>
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.05" 
                value={masterVolume} 
                onChange={(e) => setMasterVolume(parseFloat(e.target.value))} 
                title={`Master Volume: ${Math.round(masterVolume * 100)}%`}
                style={{ width: '40px', accentColor: activeKitColor, cursor: 'pointer' }} 
              />
            </div>

            {/* Botón Presets de Género */}
            <button
              type="button"
              onClick={() => setShowPresets(!showPresets)}
              title="Cargar ritmos clásicos de fábrica (Trap, Boom Bap, House, Dembow...)"
              style={{
                background: showPresets ? 'rgba(153, 69, 255, 0.25)' : 'var(--surface-alt)',
                color: showPresets ? '#b877ff' : '#aaa',
                border: `1px solid ${showPresets ? '#9945ff' : 'var(--border-alt)'}`,
                padding: '6px 10px',
                borderRadius: '6px',
                fontWeight: 'bold',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '0.75rem',
                transition: '0.2s'
              }}
            >
              <i className="fa-solid fa-wand-magic-sparkles"></i> PRESETS
            </button>

            {/* Botón Modo DJ / Rack FX */}
            <button
              type="button"
              onClick={() => setShowFxRack(!showFxRack)}
              title="Abrir el Rack de Efectos en Vivo (Filtro DJ, Tape Saturation, Dub Delay)"
              style={{
                background: showFxRack ? 'rgba(0, 255, 204, 0.18)' : 'var(--surface-alt)',
                color: showFxRack ? '#00ffcc' : '#aaa',
                border: `1px solid ${showFxRack ? '#00ffcc' : 'var(--border-alt)'}`,
                padding: '6px 11px',
                borderRadius: '6px',
                fontWeight: 'bold',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.75rem',
                boxShadow: showFxRack ? '0 0 12px rgba(0, 255, 204, 0.3)' : 'none',
                transition: '0.2s'
              }}
            >
              <i className="fa-solid fa-sliders"></i>
              <span>RACK FX</span>
              <span style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: isFxActive ? '#00ffcc' : '#555',
                boxShadow: isFxActive ? '0 0 8px #00ffcc' : 'none'
              }} />
            </button>

            {/* Botón Radar BPM Spotify (Fase 5) */}
            <button
              type="button"
              onClick={() => setShowSpotifyRadar(true)}
              title="Abrir Radar BPM de Spotify para encontrar referencias y generar playlists automáticas"
              style={{
                background: showSpotifyRadar ? 'rgba(29, 185, 84, 0.25)' : 'var(--surface-alt)',
                color: '#1DB954',
                border: `1px solid ${showSpotifyRadar ? '#1DB954' : 'rgba(29, 185, 84, 0.4)'}`,
                padding: '6px 11px',
                borderRadius: '6px',
                fontWeight: 'bold',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.75rem',
                boxShadow: showSpotifyRadar ? '0 0 12px rgba(29, 185, 84, 0.4)' : 'none',
                transition: '0.2s'
              }}
            >
              <i className="fa-brands fa-spotify" style={{ fontSize: '0.85rem' }}></i>
              <span>RADAR BPM</span>
            </button>

            <button 
              onClick={() => setIsLoFi(!isLoFi)} 
              style={{ background: isLoFi ? '#ffaa00' : 'var(--surface-alt)', color: isLoFi ? '#000' : '#888', border: `1px solid ${isLoFi ? '#ffaa00' : 'var(--border-alt)'}`, padding: '6px 10px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', transition: '0.3s', fontSize: '0.75rem' }}
            >
              <i className="fa-solid fa-record-vinyl" style={{ animation: isLoFi ? 'spin 2s linear infinite' : 'none' }}></i> LO-FI
            </button>

            <button 
              onClick={handleTogglePlay} 
              style={{ background: isPlaying ? 'var(--accent-secondary, #ff0055)' : activeKitColor, color: '#000', border: 'none', padding: '7px 16px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', transition: '0.2s', boxShadow: isPlaying ? '0 0 16px var(--accent-secondary, #ff0055)' : `0 0 16px ${activeKitColor}`, fontSize: '0.8rem' }}
            >
              <i className={`fa-solid ${isPlaying ? 'fa-stop' : 'fa-play'}`}></i> {isPlaying ? 'STOP' : 'PLAY'}
            </button>
          </div>
        </div>

        {/* BARRA DESPLEGABLE DE PRESETS DE GÉNERO (FASE 6) */}
        {showPresets && (
          <div style={{ background: 'rgba(0,0,0,0.55)', border: '1px solid #9945ff55', borderRadius: '8px', padding: '10px 14px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', animation: 'fadeIn 0.25s ease' }}>
            <span style={{ fontSize: '0.72rem', color: '#b877ff', fontWeight: 'bold', letterSpacing: '0.5px', marginRight: '5px' }}>
              <i className="fa-solid fa-shapes"></i> RITMOS DE FÁBRICA:
            </span>
            {GENRE_PRESETS.map((preset) => (
              <button
                key={preset.name}
                type="button"
                onClick={() => handleLoadPreset(preset)}
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  color: '#fff',
                  border: `1px solid ${preset.color}66`,
                  padding: '5px 10px',
                  borderRadius: '5px',
                  fontSize: '0.72rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: '0.15s'
                }}
                onMouseOver={(e) => { e.currentTarget.style.background = `${preset.color}33`; }}
                onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
              >
                <i className={`fa-solid ${preset.icon}`} style={{ color: preset.color }}></i>
                <span>{preset.name}</span>
                <span style={{ fontSize: '0.62rem', color: '#888' }}>({preset.bpm} BPM)</span>
              </button>
            ))}
          </div>
        )}

        {/* FASE 5: RACK DE EFECTOS MAESTROS EN VIVO (MODO DJ) */}
        {showFxRack && (
          <div style={{
            background: 'linear-gradient(180deg, rgba(20,25,35,0.95) 0%, rgba(10,14,20,0.95) 100%)',
            border: '1px solid rgba(0,255,204,0.3)',
            borderRadius: '10px',
            padding: '14px 18px',
            marginBottom: '1.2rem',
            boxShadow: 'inset 0 0 25px rgba(0,0,0,0.8), 0 0 20px rgba(0,255,204,0.15)',
            animation: 'fadeIn 0.3s ease'
          }}>
            {/* Cabecera del Rack de Efectos */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="fa-solid fa-compact-disc" style={{ color: '#00ffcc', fontSize: '0.9rem' }}></i>
                <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '0.85rem', letterSpacing: '1px' }}>
                  RACK DE EFECTOS MAESTROS // LIVE DJ MODE
                </span>
                <span style={{ fontSize: '0.65rem', background: fxSettings.enabled ? 'rgba(0,255,204,0.2)' : 'rgba(255,68,68,0.2)', color: fxSettings.enabled ? '#00ffcc' : '#ff6666', padding: '2px 6px', borderRadius: '3px', fontWeight: 'bold' }}>
                  {fxSettings.enabled ? 'PROCESADOR ON AIR' : 'BYPASS TOTAL'}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setFxSettings(prev => ({ ...prev, enabled: !prev.enabled }))}
                  style={{
                    background: fxSettings.enabled ? 'rgba(0,255,204,0.2)' : 'rgba(255,255,255,0.08)',
                    color: fxSettings.enabled ? '#00ffcc' : '#888',
                    border: `1px solid ${fxSettings.enabled ? '#00ffcc' : 'rgba(255,255,255,0.1)'}`,
                    padding: '3px 8px',
                    borderRadius: '4px',
                    fontSize: '0.68rem',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  <i className="fa-solid fa-power-off"></i> {fxSettings.enabled ? 'FX ACTIVO' : 'BYPASS'}
                </button>

                <button
                  type="button"
                  onClick={() => setFxSettings(prev => ({ ...prev, djFilter: 0, drive: 0, delayWet: 0 }))}
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    color: '#aaa',
                    border: '1px solid rgba(255,255,255,0.1)',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    fontSize: '0.68rem',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                  title="Restablecer filtros, drive y eco al valor cero"
                >
                  <i className="fa-solid fa-rotate-left"></i> REINICIAR FX
                </button>
              </div>
            </div>

            {/* Los 3 Módulos de Efectos */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
              
              {/* Módulo 1: DJ Filter Sweep */}
              <div style={{ background: 'rgba(0,0,0,0.4)', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#00bfff', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <i className="fa-solid fa-water"></i> FILTRO DJ (BI-DIRECCIONAL)
                  </span>
                  <button
                    type="button"
                    onClick={() => setFxSettings(prev => ({ ...prev, djFilter: 0 }))}
                    style={{ background: 'transparent', color: '#777', border: '1px solid rgba(255,255,255,0.1)', padding: '1px 5px', borderRadius: '3px', fontSize: '0.62rem', cursor: 'pointer' }}
                    title="Volver al centro exacto (0)"
                  >
                    SNAP 0
                  </button>
                </div>

                <input
                  type="range"
                  min="-100"
                  max="100"
                  step="1"
                  value={fxSettings.djFilter}
                  onChange={(e) => setFxSettings(prev => ({ ...prev, djFilter: Number(e.target.value) }))}
                  style={{
                    width: '100%',
                    cursor: 'pointer',
                    accentColor: fxSettings.djFilter < 0 ? '#00bfff' : (fxSettings.djFilter > 0 ? '#ff8800' : '#00ffcc')
                  }}
                />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                  <span style={{ fontSize: '0.62rem', color: '#00bfff', fontWeight: 'bold' }}>◄ LOW PASS</span>
                  <span style={{ fontSize: '0.68rem', fontWeight: 'bold', color: fxSettings.djFilter === 0 ? '#888' : (fxSettings.djFilter < 0 ? '#00bfff' : '#ff8800') }}>
                    {getFilterReadout()}
                  </span>
                  <span style={{ fontSize: '0.62rem', color: '#ff8800', fontWeight: 'bold' }}>HIGH PASS ►</span>
                </div>
              </div>

              {/* Módulo 2: Tape Drive / Saturation */}
              <div style={{ background: 'rgba(0,0,0,0.4)', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#ff5533', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <i className="fa-solid fa-fire"></i> TAPE DRIVE & CALIDEZ
                  </span>
                  <span style={{ fontSize: '0.7rem', color: fxSettings.drive > 0 ? '#ffaa00' : '#777', fontWeight: 'bold' }}>
                    {fxSettings.drive}%
                  </span>
                </div>

                <input
                  type="range"
                  min="0"
                  max="100"
                  step="2"
                  value={fxSettings.drive}
                  onChange={(e) => setFxSettings(prev => ({ ...prev, drive: Number(e.target.value) }))}
                  style={{ width: '100%', cursor: 'pointer', accentColor: '#ff5533' }}
                />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', fontSize: '0.62rem', color: '#777' }}>
                  <span>Puro & Limpio</span>
                  <span style={{ color: fxSettings.drive > 40 ? '#ffaa00' : '#666' }}>
                    {fxSettings.drive > 60 ? 'SATURACIÓN ANALÓGICA FUERTE' : (fxSettings.drive > 0 ? 'CALIDEZ DE CINTA' : 'BYPASS')}
                  </span>
                  <span>Extremo</span>
                </div>
              </div>

              {/* Módulo 3: Dub Delay & Echo Loop */}
              <div style={{ background: 'rgba(0,0,0,0.4)', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#00ffcc', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <i className="fa-solid fa-wave-square"></i> DUB DELAY & ECO
                  </span>
                  <span style={{ fontSize: '0.65rem', color: '#888' }}>
                    {Math.round(getDelaySeconds(fxSettings.delaySync, tempo) * 1000)} ms
                  </span>
                </div>

                {/* Botones de Sincronía Musical */}
                <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
                  {['1/16', '1/8', '1/8d', '1/4'].map((sync) => (
                    <button
                      key={sync}
                      type="button"
                      onClick={() => setFxSettings(prev => ({ ...prev, delaySync: sync }))}
                      style={{
                        flex: 1,
                        background: fxSettings.delaySync === sync ? '#00ffcc' : 'rgba(255,255,255,0.08)',
                        color: fxSettings.delaySync === sync ? '#000' : '#888',
                        border: 'none',
                        padding: '3px 0',
                        borderRadius: '3px',
                        fontSize: '0.65rem',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                      }}
                    >
                      {sync}
                    </button>
                  ))}
                </div>

                {/* Sliders de Mix y Feedback */}
                <div style={{ display: 'flex', gap: '10px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.62rem', color: '#888', marginBottom: '3px' }}>
                      <span>MIX (WET)</span>
                      <span style={{ color: fxSettings.delayWet > 0 ? '#00ffcc' : '#666', fontWeight: 'bold' }}>{fxSettings.delayWet}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="2"
                      value={fxSettings.delayWet}
                      onChange={(e) => setFxSettings(prev => ({ ...prev, delayWet: Number(e.target.value) }))}
                      style={{ width: '100%', cursor: 'pointer', accentColor: '#00ffcc' }}
                    />
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.62rem', color: '#888', marginBottom: '3px' }}>
                      <span>REPETICIONES</span>
                      <span style={{ color: '#aaa', fontWeight: 'bold' }}>{fxSettings.delayFeedback}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="80"
                      step="2"
                      value={fxSettings.delayFeedback}
                      onChange={(e) => setFxSettings(prev => ({ ...prev, delayFeedback: Number(e.target.value) }))}
                      style={{ width: '100%', cursor: 'pointer', accentColor: '#00ffcc' }}
                    />
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Barra de Navegación de Compases y Herramientas (16 vs 32 Pasos) */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', background: 'rgba(0,0,0,0.3)', padding: '6px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Selector de Longitud */}
            <div style={{ display: 'flex', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--border-alt)' }}>
              <button
                type="button"
                onClick={() => { setTotalSteps(16); setActiveBar(0); }}
                style={{
                  background: totalSteps === 16 ? activeKitColor : 'var(--surface-alt)',
                  color: totalSteps === 16 ? '#000' : '#888',
                  border: 'none',
                  padding: '5px 10px',
                  fontSize: '0.72rem',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                16 PASOS
              </button>
              <button
                type="button"
                onClick={() => setTotalSteps(32)}
                style={{
                  background: totalSteps === 32 ? activeKitColor : 'var(--surface-alt)',
                  color: totalSteps === 32 ? '#000' : '#888',
                  border: 'none',
                  padding: '5px 10px',
                  fontSize: '0.72rem',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                32 PASOS (2 BARS)
              </button>
            </div>

            {/* Pestañas de Compás (cuando 32 pasos está activo) */}
            {totalSteps === 32 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  type="button"
                  onClick={() => setActiveBar(0)}
                  style={{
                    background: activeBar === 0 ? 'rgba(255,255,255,0.15)' : 'transparent',
                    color: activeBar === 0 ? '#fff' : '#666',
                    border: activeBar === 0 ? `1px solid ${activeKitColor}` : '1px solid transparent',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '0.7rem',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  COMPÁS 1 (1-16)
                  {isPlaying && currentStep < 16 && (
                    <span style={{ display: 'inline-block', width: '5px', height: '5px', borderRadius: '50%', background: activeKitColor, marginLeft: '5px' }} />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveBar(1)}
                  style={{
                    background: activeBar === 1 ? 'rgba(255,255,255,0.15)' : 'transparent',
                    color: activeBar === 1 ? '#fff' : '#666',
                    border: activeBar === 1 ? `1px solid ${activeKitColor}` : '1px solid transparent',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '0.7rem',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  COMPÁS 2 (17-32)
                  {isPlaying && currentStep >= 16 && (
                    <span style={{ display: 'inline-block', width: '5px', height: '5px', borderRadius: '50%', background: activeKitColor, marginLeft: '5px' }} />
                  )}
                </button>

                <button
                  type="button"
                  title="Copiar patrón del Compás 1 al Compás 2"
                  onClick={handleDuplicateBar1ToBar2}
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    color: '#aaa',
                    border: '1px solid rgba(255,255,255,0.1)',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '0.68rem',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  <i className="fa-solid fa-copy"></i> DUPLICAR 1 → 2
                </button>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '0.68rem', color: '#666' }}>
              <i className="fa-solid fa-circle-info" style={{ color: activeKitColor }}></i> Clic: Normal • 2º: Acento • 3º: Apagar
            </span>
            <button
              type="button"
              onClick={handleClearGrid}
              title="Limpiar todo el ritmo"
              style={{
                background: 'rgba(255,68,68,0.1)',
                color: '#ff6666',
                border: '1px solid rgba(255,68,68,0.2)',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '0.68rem',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              <i className="fa-solid fa-trash-can"></i> LIMPIAR
            </button>
          </div>
        </div>

        {/* Canales del Secuenciador (8 Pistas con Consola y Matriz de Acentos) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', marginBottom: '1.5rem' }}>
          {INSTRUMENTS.map((inst) => {
            const cfg = INSTRUMENT_CONFIG[inst] || { label: inst, color: activeKitColor, tag: 'TRK' };
            const isMuted = !!mutes[inst];
            const isSoloActive = !!solos[inst];
            const isSilenced = hasAnySolo ? (!isSoloActive || isMuted) : isMuted;
            const currentTrackVol = trackVolumes[inst] !== undefined ? trackVolumes[inst] : 0.85;

            return (
              <div key={inst} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {/* Channel Strip Controller (Audition + Mute + Solo + Volume) */}
                <div 
                  style={{ 
                    width: '185px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    padding: '4px 8px',
                    background: isSilenced ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.35)',
                    border: isSoloActive ? `1px solid ${cfg.color}` : (isMuted ? '1px solid rgba(255,68,68,0.4)' : '1px solid rgba(255,255,255,0.06)'),
                    borderRadius: '6px',
                    opacity: isSilenced ? 0.5 : 1,
                    transition: '0.2s',
                    boxShadow: isSoloActive ? `0 0 10px ${cfg.color}33` : 'none'
                  }}
                >
                  {/* Audition Pad / Label */}
                  <div 
                    onClick={() => triggerSound(inst, currentKit, isLoFi, null, currentTrackVol, false)}
                    title={`Click para escuchar ${cfg.label} (${Math.round(currentTrackVol * 100)}%)`}
                    style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', flex: 1, minWidth: '60px', userSelect: 'none' }}
                  >
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: isSilenced ? '#555' : cfg.color, boxShadow: isSilenced ? 'none' : `0 0 6px ${cfg.color}` }} />
                    <span style={{ color: isSilenced ? '#777' : '#fff', fontSize: '0.72rem', fontWeight: 'bold', letterSpacing: '0.3px' }}>{cfg.label}</span>
                  </div>

                  {/* Mixer Buttons & Fader Container */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <button
                      type="button"
                      title={isMuted ? `Desmutear ${cfg.label}` : `Mutear ${cfg.label}`}
                      onClick={() => handleToggleMute(inst)}
                      style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '3px',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '0.6rem',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: isMuted ? '#ff4444' : 'rgba(255,255,255,0.08)',
                        color: isMuted ? '#fff' : '#666',
                        boxShadow: isMuted ? '0 0 8px rgba(255,68,68,0.6)' : 'none',
                        transition: '0.15s'
                      }}
                    >
                      M
                    </button>

                    <button
                      type="button"
                      title={isSoloActive ? `Quitar Solo de ${cfg.label}` : `Solo ${cfg.label}`}
                      onClick={() => handleToggleSolo(inst)}
                      style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '3px',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '0.6rem',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: isSoloActive ? '#ffaa00' : 'rgba(255,255,255,0.08)',
                        color: isSoloActive ? '#000' : '#666',
                        boxShadow: isSoloActive ? '0 0 8px rgba(255,170,0,0.6)' : 'none',
                        transition: '0.15s'
                      }}
                    >
                      S
                    </button>

                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={currentTrackVol}
                      onChange={(e) => handleVolumeChange(inst, e.target.value)}
                      title={`Volumen ${cfg.label}: ${Math.round(currentTrackVol * 100)}%`}
                      style={{
                        width: '42px',
                        cursor: 'pointer',
                        accentColor: cfg.color
                      }}
                    />
                  </div>
                </div>

                {/* 16 Steps Visible Grid (Páginas de Compás) */}
                <div style={{ display: 'flex', flex: 1, gap: '5px' }}>
                  {Array.from({ length: 16 }).map((_, stepInBar) => {
                    const globalStepIdx = activeBar * 16 + stepInBar;
                    const stepVal = grid[inst] ? grid[inst][globalStepIdx] : 0;
                    const isActive = stepVal > 0 || stepVal === true;
                    const isAccent = stepVal === 2;
                    const isCurrentStep = isPlaying && currentStep === globalStepIdx;
                    const activeColor = isLoFi ? '#ffaa00' : cfg.color;
                    const isDownbeat = stepInBar % 4 === 0;

                    return (
                      <div 
                        key={stepInBar} 
                        onClick={() => toggleStep(inst, globalStepIdx)}
                        title={`Paso ${globalStepIdx + 1} (${isAccent ? 'Acento Fuerte' : (isActive ? 'Golpe Normal' : 'Vacío')})`}
                        style={{ 
                          flex: 1, 
                          height: '34px', 
                          borderRadius: '4px', 
                          cursor: 'pointer', 
                          transition: '0.08s', 
                          position: 'relative',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: isAccent 
                            ? `linear-gradient(135deg, ${activeColor}, #ffffff)` 
                            : (isActive ? activeColor : (isDownbeat ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)')), 
                          border: isCurrentStep 
                            ? '2px solid #fff' 
                            : (isAccent ? '2px solid #fff' : (isActive ? `1px solid ${activeColor}` : (isDownbeat ? '1px solid rgba(255,255,255,0.15)' : '1px solid var(--border-alt)'))), 
                          opacity: isSilenced ? 0.35 : (isActive ? 1 : 0.65),
                          boxShadow: (isAccent && !isSilenced) 
                            ? `0 0 14px ${activeColor}, 0 0 6px #fff` 
                            : ((isActive && !isSilenced) ? `0 0 8px ${activeColor}88` : 'none'),
                          transform: isCurrentStep ? 'scale(1.08)' : 'scale(1)'
                        }}
                      >
                        {isAccent && (
                          <span style={{ 
                            width: '5px', 
                            height: '5px', 
                            borderRadius: '50%', 
                            background: '#000', 
                            boxShadow: '0 0 4px #000' 
                          }} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Barra de Acciones Inferior (Guardar en Nube + Exportador WAV de Estudio) */}
        <div style={{ borderTop: '1px dashed var(--border-alt)', paddingTop: '18px', display: 'flex', gap: '10px', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
          
          {/* Botones de Exportación WAV y Playlist Spotify */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setShowExportModal(true)}
              style={{
                background: 'linear-gradient(135deg, #00ffcc 0%, #00bfff 100%)',
                color: '#000',
                border: 'none',
                padding: '9px 18px',
                borderRadius: '6px',
                fontWeight: 'bold',
                fontSize: '0.82rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 0 14px rgba(0, 255, 204, 0.4)',
                transition: '0.2s'
              }}
            >
              <i className="fa-solid fa-file-audio"></i> EXPORTAR WAV
            </button>

            <button
              type="button"
              onClick={() => setShowSpotifyRadar(true)}
              title="Crear Playlist automática en tu cuenta de Spotify sincronizada con este Beat"
              style={{
                background: 'linear-gradient(135deg, #1DB954 0%, #00F0FF 100%)',
                color: '#000',
                border: 'none',
                padding: '9px 18px',
                borderRadius: '6px',
                fontWeight: 'bold',
                fontSize: '0.82rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 0 14px rgba(29, 185, 84, 0.4)',
                transition: '0.2s'
              }}
            >
              <i className="fa-brands fa-spotify" style={{ fontSize: '0.95rem' }}></i> PLAYLIST SPOTIFY
            </button>
          </div>

          {/* Formulario Guardar en Firebase */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <input 
              type="text" 
              placeholder="Nombre de tu Beat..." 
              value={beatName}
              onChange={(e) => setBeatName(e.target.value)}
              maxLength="25"
              disabled={!user || isSaving}
              style={{ background: 'rgba(0,0,0,0.5)', color: '#fff', border: '1px solid var(--border-alt)', padding: '9px 14px', borderRadius: '6px', width: '220px', outline: 'none', opacity: !user ? 0.5 : 1, fontSize: '0.82rem' }}
            />
            <button 
              onClick={handleSaveBeat}
              disabled={!user || isSaving}
              style={{ background: '#fff', color: '#000', border: 'none', padding: '9px 18px', borderRadius: '6px', fontWeight: 'bold', cursor: (!user || isSaving) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px', opacity: (!user || isSaving) ? 0.5 : 1, fontSize: '0.82rem' }}
            >
              <i className="fa-solid fa-cloud-arrow-up"></i> {isSaving ? 'GUARDANDO...' : 'GUARDAR EN NUBE'}
            </button>
          </div>
        </div>
        {!user && <p style={{ color: '#ff4444', textAlign: 'right', fontSize: '0.75rem', marginTop: '8px' }}>Inicia sesión para guardar en la nube.</p>}
      </div>

      {/* MODAL DE EXPORTACIÓN DE AUDIO WAV (FASE 7) */}
      {showExportModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(8px)' }}>
          <div style={{ background: '#121620', border: '1px solid var(--border-glow)', borderRadius: '14px', padding: '24px', width: '90%', maxWidth: '480px', boxShadow: '0 0 30px rgba(0,255,204,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.2rem' }}>
                <i className="fa-solid fa-file-waveform" style={{ color: '#00ffcc' }}></i> EXPORTAR AUDIO ESTUDIO
              </h3>
              <button
                type="button"
                onClick={() => !isExporting && setShowExportModal(false)}
                style={{ background: 'transparent', border: 'none', color: '#888', fontSize: '1.2rem', cursor: isExporting ? 'not-allowed' : 'pointer' }}
              >
                ✕
              </button>
            </div>

            <p style={{ color: '#aaa', fontSize: '0.82rem', margin: '0 0 16px 0', lineHeight: '1.4' }}>
              Renderiza tu producción con calidad digital de estudio (16-bit PCM WAV, 44.1 kHz sin compresión), incluyendo efectos DJ, acentos de velocidad y calidez analógica.
            </p>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', color: '#888', fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '6px' }}>
                DURACIÓN DEL BUCLE:
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {[1, 2, 4].map(loops => (
                  <button
                    key={loops}
                    type="button"
                    onClick={() => setExportLoops(loops)}
                    disabled={isExporting}
                    style={{
                      flex: 1,
                      background: exportLoops === loops ? '#00ffcc' : 'rgba(255,255,255,0.06)',
                      color: exportLoops === loops ? '#000' : '#fff',
                      border: 'none',
                      padding: '8px',
                      borderRadius: '6px',
                      fontWeight: 'bold',
                      fontSize: '0.8rem',
                      cursor: 'pointer'
                    }}
                  >
                    {loops} {loops === 1 ? 'Compás' : 'Compases'}
                  </button>
                ))}
              </div>
            </div>

            {isExporting ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <i className="fa-solid fa-spinner fa-spin" style={{ color: '#00ffcc', fontSize: '2rem', marginBottom: '10px' }}></i>
                <p style={{ color: '#fff', fontSize: '0.85rem', fontWeight: 'bold', margin: 0 }}>
                  {exportStatusText || 'Renderizando audio...'}
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => handleExportWav('master')}
                  style={{
                    background: 'var(--surface-alt)',
                    color: '#fff',
                    border: '1px solid #00ffcc',
                    padding: '12px',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: '0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = '#00ffcc22'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'var(--surface-alt)'}
                >
                  <i className="fa-solid fa-music" style={{ color: '#00ffcc' }}></i> DESCARGAR MASTER WAV (MIX COMPLETO)
                </button>

                <button
                  type="button"
                  onClick={() => handleExportWav('stems')}
                  style={{
                    background: 'var(--surface-alt)',
                    color: '#fff',
                    border: '1px solid var(--border-alt)',
                    padding: '12px',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: '0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'var(--surface-alt)'}
                >
                  <i className="fa-solid fa-layer-group" style={{ color: '#b877ff' }}></i> DESCARGAR STEMS MULTITRACK (PISTAS SEPARADAS)
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Lista de Cintas Guardadas en Firebase */}
      {user && savedBeats.length > 0 && (
        <div style={{ background: 'var(--surface-bg)', padding: '2rem', borderRadius: '16px', border: '1px solid var(--border-glow)', width: '100%', maxWidth: '900px', animation: 'fadeIn 0.5s ease', boxShadow: 'var(--shadow-soft)', backdropFilter: 'blur(15px)' }}>
          <h3 style={{ color: '#fff', marginTop: 0, marginBottom: '20px', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <i className="fa-solid fa-cloud" style={{ color: 'var(--accent-color)' }}></i> CINTAS EN LA BÓVEDA
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '15px' }}>
            {savedBeats.map((beat) => (
              <div key={beat.id} style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-alt)', borderRadius: '8px', padding: '15px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '1.1rem' }}>{beat.name}</span>
                  {beat.isLoFi && <span style={{ background: '#ffaa00', color: '#000', fontSize: '0.6rem', padding: '2px 6px', borderRadius: '10px', fontWeight: 'bold' }}>LO-FI</span>}
                </div>
                
                <div style={{ display: 'flex', gap: '10px', fontSize: '0.8rem', color: '#888' }}>
                  <span><i className="fa-solid fa-drum"></i> {beat.kit}</span>
                  <span><i className="fa-solid fa-stopwatch"></i> {beat.tempo} BPM</span>
                  {beat.swing && beat.swing > 50 && <span><i className="fa-solid fa-shuffle"></i> {beat.swing}%</span>}
                </div>
                
                <button 
                  onClick={() => loadBeat(beat)}
                  style={{ background: 'var(--surface-alt)', color: '#fff', border: '1px solid var(--border-alt)', padding: '8px', borderRadius: '4px', cursor: 'pointer', width: '100%', marginTop: '5px', transition: '0.2s' }}
                  onMouseOver={(e) => e.target.style.background = 'var(--accent-color)'}
                  onMouseOut={(e) => e.target.style.background = 'var(--surface-alt)'}
                >
                  <i className="fa-solid fa-download"></i> CARGAR AL ESTUDIO
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>

      {/* MODAL RADAR BPM & GENERADOR DE PLAYLIST SPOTIFY (FASE 5) */}
      <BeatItSpotifyRadarModal
        isOpen={showSpotifyRadar}
        onClose={() => setShowSpotifyRadar(false)}
        tempo={tempo}
        currentKit={currentKit}
        beatName={beatName}
      />
    </div>
  );
}