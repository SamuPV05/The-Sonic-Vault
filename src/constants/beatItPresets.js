import { INSTRUMENTS } from '../services/beatItAudioEngine';

export const TOTAL_MAX_STEPS = 32;

export const DEFAULT_FX_SETTINGS = {
  enabled: true,
  djFilter: 0, // -100 (LP) a +100 (HP), 0 = Neutral
  drive: 0, // 0 a 100% Tape Saturation
  delayWet: 0, // 0 a 100% Mix
  delayFeedback: 35, // 0 a 80% Feedback
  delaySync: '1/8d' // '1/16', '1/8', '1/8d', '1/4'
};

export const createEmptyGrid = () => {
  const initialGrid = {};
  INSTRUMENTS.forEach((inst) => {
    initialGrid[inst] = Array(TOTAL_MAX_STEPS).fill(0);
  });
  return initialGrid;
};

export const createInitialTrackMap = (defaultValue) => {
  const initial = {};
  INSTRUMENTS.forEach((inst) => {
    initial[inst] = defaultValue;
  });
  return initial;
};

// Cálculo de segundos de retardo sincronizado al tempo
export const getDelaySeconds = (sync, bpm) => {
  const quarter = 60.0 / Math.max(40, bpm);
  switch (sync) {
    case '1/16':
      return quarter * 0.25;
    case '1/8':
      return quarter * 0.5;
    case '1/8d':
      return quarter * 0.75;
    case '1/4':
      return quarter * 1.0;
    default:
      return quarter * 0.75;
  }
};

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
      kick:    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
      snare:   [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      clap:    [0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0],
      hihat:   [1, 1, 2, 1, 1, 1, 2, 1, 1, 2, 1, 2, 1, 1, 2, 2],
      openhat: [0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0],
      sub808:  [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 2, 0, 0, 0],
      tom:     [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      crash:   [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
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
      kick:    [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 1, 0, 0],
      snare:   [0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0],
      clap:    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      hihat:   [2, 1, 1, 1, 2, 1, 1, 1, 2, 1, 1, 1, 2, 1, 1, 1],
      openhat: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0],
      sub808:  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      tom:     [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 2, 0],
      crash:   [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
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
      kick:    [2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0],
      snare:   [0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0],
      clap:    [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
      hihat:   [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      openhat: [0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0],
      sub808:  [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
      tom:     [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 2, 2, 0],
      crash:   [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
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
      kick:    [2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0],
      snare:   [0, 0, 0, 2, 0, 0, 2, 0, 0, 0, 0, 2, 0, 0, 2, 0],
      clap:    [0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 1, 0],
      hihat:   [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
      openhat: [0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1],
      sub808:  [2, 0, 0, 0, 1, 0, 0, 0, 2, 0, 0, 0, 1, 0, 0, 0],
      tom:     [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
      crash:   [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
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
      kick:    [2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0],
      snare:   [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      clap:    [0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0],
      hihat:   [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
      openhat: [0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0],
      sub808:  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      tom:     [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 2, 0],
      crash:   [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
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
      kick:    [2, 0, 0, 0, 0, 0, 1, 0, 0, 0, 2, 0, 0, 0, 0, 0],
      snare:   [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
      clap:    [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
      hihat:   [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      openhat: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
      sub808:  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      tom:     [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
      crash:   [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    }
  }
];
