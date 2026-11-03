import { INSTRUMENTS } from '../services/beatItAudioEngine.js';

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

// --- PRESETS DE GÉNERO DE FÁBRICA (FASE 6 & FASE H) ---
export const GENRE_PRESETS = [
  {
    name: 'Funk Bóveda',
    genre: 'Funk / Disco / Soul',
    bpm: 115,
    kit: '80s Funk',
    swing: 58,
    isLoFi: false,
    steps: 16,
    icon: 'fa-guitar',
    color: '#ffaa00',
    tags: [
      'funk', 'disco', 'soul', 'groove', 'r&b', 'silk sonic', '24k magic',
      'off the wall', 'uptown funk', 'motown', 'james brown', 'prince',
      'daft punk', 'chunky', 'treasure', 'finesse', 'retro soul', 'dandies'
    ],
    grid: {
      kick:    [2, 0, 0, 0, 0, 0, 1, 0, 0, 0, 2, 0, 0, 0, 0, 0],
      snare:   [0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0],
      clap:    [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
      hihat:   [2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1],
      openhat: [0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 2, 0],
      sub808:  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      tom:     [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 2, 0, 0],
      crash:   [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    }
  },
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
    tags: [
      'trap', 'drill', '808', 'dark', 'atlanta', 'future', 'metro', 'sub 808',
      'modern rap', 'trippie', 'carti', 'travis', 'astroworld', 'hard trap',
      'bass boost', '808 mafia'
    ],
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
    tags: [
      'boom bap', 'hip hop', 'hip-hop', '90s', 'classic rap', 'west coast',
      'east coast', 'chronic', 'marshall mathers', 'slim shady', 'eminem',
      'dr dre', 'dr. dre', 'kendrick', 'kendrick lamar', 'good kid', 'tpab',
      'to pimp a butterfly', 'damn', '2001', 'compton', 'g-funk', 'golden era',
      '1992', '1994', '1999', '2000', '2001', '2002', 'rap'
    ],
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
    tags: [
      'synthwave', 'synth', '80s', 'eighties', 'retro', 'thriller', 'bad',
      'electro', 'pop 80s', 'blinding lights', 'starboy', 'after hours',
      'dawn fm', 'stranger', 'neon', 'cyberpunk', '1982', '1987', '1984',
      '1985', 'dangerous', 'michael jackson', 'the weeknd', 'retrowave'
    ],
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
    tags: [
      'reggaeton', 'reggaetón', 'dembow', 'urbano', 'latino', 'dancehall',
      'afrobeat', 'perreo', 'caribe', 'bad bunny', 'rosalia', 'karol',
      'j balvin', 'rihanna work', 'pon de replay', 'caribbean'
    ],
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
    tags: [
      'house', 'club', 'dance', 'techno', 'four on the floor', 'edm',
      'electronic', 'chromatica', 'renaissance', 'disco house', 'lady gaga',
      'the fame', 'born this way', 'artpop', 'clubbing', 'rave', 'pop dance'
    ],
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
    tags: [
      'lo-fi', 'lofi', 'chill', 'ambient', 'sadcore', 'indie', 'bedroom pop',
      'billie eilish', 'lana del rey', 'born to die', 'ultraviolence',
      'norman fucking rockwell', 'ocean blvd', 'when we all fall asleep',
      'happier than ever', 'acoustic', 'study', 'melancholy', 'dream pop',
      'trip hop', 'downtempo'
    ],
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

// Normalizador de texto para búsquedas fonéticas o sin tildes
const normalizarTexto = (texto) =>
  String(texto || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

/**
 * Busca un preset de Beat It por nombre exacto o coincidencia parcial.
 */
export const findPresetByName = (name) => {
  if (!name || typeof name !== 'string') return GENRE_PRESETS[0];
  const query = normalizarTexto(name);

  const exact = GENRE_PRESETS.find((p) => normalizarTexto(p.name) === query);
  if (exact) return exact;

  const partial = GENRE_PRESETS.find(
    (p) => normalizarTexto(p.name).includes(query) || query.includes(normalizarTexto(p.name))
  );
  if (partial) return partial;

  // Búsqueda por tag o género
  const byTag = GENRE_PRESETS.find((p) =>
    (p.tags || []).some((tag) => normalizarTexto(tag) === query || query.includes(normalizarTexto(tag)))
  );
  return byTag || GENRE_PRESETS[0];
};

/**
 * Resuelve el preset más afín de Beat It Studio para una Era histórica determinada,
 * analizando el título de la era, el año, la descripción, canciones y géneros del artista.
 */
export const resolvePresetForEra = (era, artistName = '', artistGenres = []) => {
  if (!era) return GENRE_PRESETS[0];

  const eraTitulo = typeof era === 'string' ? era : era.titulo || era.name || '';
  const eraAno = typeof era === 'object' ? String(era.año || era.year || '') : '';
  const eraDesc = typeof era === 'object' ? String(era.descripcion || '') : '';
  const eraCanciones =
    typeof era === 'object' && Array.isArray(era.canciones || era.stems)
      ? (era.canciones || era.stems)
          .map((c) => (typeof c === 'object' ? c.titulo || '' : c))
          .join(' ')
      : '';

  const corpus = normalizarTexto(
    `${eraTitulo} ${eraAno} ${eraDesc} ${eraCanciones} ${artistName} ${(artistGenres || []).join(' ')}`
  );

  let bestMatch = GENRE_PRESETS[0];
  let highestScore = -1;

  for (const preset of GENRE_PRESETS) {
    let score = 0;
    const pName = normalizarTexto(preset.name);
    const pGenre = normalizarTexto(preset.genre);

    if (corpus.includes(pName)) score += 10;
    if (corpus.includes(pGenre)) score += 6;

    for (const tag of preset.tags || []) {
      const cleanTag = normalizarTexto(tag);
      if (cleanTag && corpus.includes(cleanTag)) {
        score += cleanTag.length > 5 ? 4 : 2;
      }
    }

    if (score > highestScore) {
      highestScore = score;
      bestMatch = preset;
    }
  }

  // Fallback por año si la puntuación fue muy baja o nula
  if (highestScore <= 0 && eraAno) {
    const yearNum = parseInt(eraAno, 10);
    if (!isNaN(yearNum)) {
      if (yearNum >= 1978 && yearNum <= 1989) {
        return findPresetByName('Synthwave 80s');
      }
      if (yearNum >= 1990 && yearNum <= 2003) {
        return findPresetByName('Boom Bap 90s');
      }
    }
  }

  return bestMatch;
};
