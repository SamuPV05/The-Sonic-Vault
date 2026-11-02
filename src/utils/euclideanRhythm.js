/**
 * Algoritmo de Bjorklund para la generación matemática de Ritmos Euclidianos E(k, n, r).
 * Basado en el tratado de Godfried Toussaint (2005):
 * "The Euclidean Algorithm Generates Traditional Musical Rhythms".
 *
 * Distribuye k pulsos activos dentro de n pasos totales de la forma más equidistante posible,
 * permitiendo rotación de fase (offset circular) y acentuación dinámica.
 */

/**
 * Genera un patrón rítmico euclidiano E(k, n) con rotación opcional.
 *
 * @param {number} pulses - Número de golpes activos (k), entre 0 y steps.
 * @param {number} steps - Número total de pasos del ciclo (n), por defecto 16.
 * @param {number} rotation - Desplazamiento circular de fase (0 a steps - 1).
 * @param {boolean} accentFirst - Si es true, el primer pulso activo recibe velocidad de acento (2).
 * @returns {number[]} Array de longitud `steps` con valores 0 (silencio), 1 (normal) o 2 (acento).
 */
export function generateEuclideanPattern(
  pulses,
  steps = 16,
  rotation = 0,
  accentFirst = false
) {
  const n = Math.max(1, Math.floor(steps));
  const k = Math.max(0, Math.min(n, Math.floor(pulses)));
  const r = ((Math.floor(rotation) % n) + n) % n;

  if (k === 0) {
    return Array(n).fill(0);
  }

  let basePattern;
  if (k >= n) {
    basePattern = Array(n).fill(1);
  } else {
    // Construcción canónica de Bjorklund (isomorfa al algoritmo de Euclides)
    let groups = Array.from({ length: k }, () => [1]);
    let remainders = Array.from({ length: n - k }, () => [0]);

    while (remainders.length > 1) {
      const count = Math.min(groups.length, remainders.length);
      const nextGroups = [];

      for (let i = 0; i < count; i++) {
        nextGroups.push([...groups[i], ...remainders[i]]);
      }

      if (groups.length > remainders.length) {
        remainders = groups.slice(count);
      } else {
        remainders = remainders.slice(count);
      }

      groups = nextGroups;
    }

    basePattern = [...groups.flat(), ...remainders.flat()];
  }

  // Aplicar rotación de fase circular r
  const rotated = Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    rotated[(i + r) % n] = basePattern[i];
  }

  // Aplicar acento (velocidad = 2) al primer golpe activo o downbeat si se solicita
  if (accentFirst) {
    const firstActiveIdx = rotated.findIndex((val) => val > 0);
    if (firstActiveIdx !== -1) {
      rotated[firstActiveIdx] = 2;
    }
  }

  return rotated;
}

/**
 * Presets Euclidianos clásicos aplicables a un canal individual (16 pasos).
 */
export const EUCLIDEAN_CHANNEL_PRESETS = [
  {
    id: 'tresillo_16',
    name: 'Tresillo Afro-Cubano',
    formula: 'E(6, 16)',
    pulses: 6,
    steps: 16,
    rotation: 0,
    recommendedInst: 'kick',
    description: 'Doble tresillo E(3,8) expandido a 16 pasos: base del Dembow, Reggaetón y Dancehall.'
  },
  {
    id: 'techno_4x4',
    name: 'Cuatro por Cuatro Techno',
    formula: 'E(4, 16)',
    pulses: 4,
    steps: 16,
    rotation: 0,
    recommendedInst: 'kick',
    description: 'Pulso isócrono cuatro en el piso para Techno, House y Synthwave.'
  },
  {
    id: 'clave_son',
    name: 'Clave 3:2 / Bossa',
    formula: 'E(5, 16)',
    pulses: 5,
    steps: 16,
    rotation: 0,
    recommendedInst: 'clap',
    description: 'Cinco pulsos distribuidos asimétricamente: firma rítmica del Son y Bossa Nova.'
  },
  {
    id: 'cinquillo',
    name: 'Cinquillo Sincopado',
    formula: 'E(10, 16)',
    pulses: 10,
    steps: 16,
    rotation: 0,
    recommendedInst: 'hihat',
    description: 'Patrón E(5,8) duplicado con alta energía sincopada caribeña y electro.'
  },
  {
    id: 'samba_7_16',
    name: 'Samba Polirrítmica',
    formula: 'E(7, 16)',
    pulses: 7,
    steps: 16,
    rotation: 0,
    recommendedInst: 'openhat',
    description: 'Siete pulsos en dieciséis semicorcheas para percusiones ágiles y groove orgánico.'
  },
  {
    id: 'trap_rolling_hats',
    name: 'Trap Rolling Hi-Hats',
    formula: 'E(11, 16)',
    pulses: 11,
    steps: 16,
    rotation: 0,
    recommendedInst: 'hihat',
    description: 'Densidad elevada con micro-espacios ideales para hi-hats de Trap y Drill.'
  },
  {
    id: 'aksak_9_16',
    name: 'Groove Aksak 9:16',
    formula: 'E(9, 16)',
    pulses: 9,
    steps: 16,
    rotation: 2,
    recommendedInst: 'tom',
    description: 'Métrica coja balcánica/anatolia rotada 2 pasos para bajos y toms hipnóticos.'
  },
  {
    id: 'backbeat_2_4',
    name: 'Backbeat Clásico (2 & 4)',
    formula: 'E(2, 16, +4)',
    pulses: 2,
    steps: 16,
    rotation: 4,
    recommendedInst: 'snare',
    description: 'Golpe firme de caja en los tiempos 2 y 4 (pasos 5 y 13).'
  }
];

/**
 * Ensambles Polirrítmicos Euclidianos Multi-Canal:
 * Combinan varias ecuaciones E(k, 16, r) simultáneamente sobre distintas pistas.
 */
export const EUCLIDEAN_ENSEMBLE_PRESETS = [
  {
    id: 'afro_cyber_poly',
    name: 'Polirritmia Afro-Cyber',
    badge: 'E(4,16) + E(6,16) + E(7,16)',
    color: '#00ffcc',
    layers: [
      { inst: 'kick', pulses: 4, rotation: 0, accentFirst: true },
      { inst: 'snare', pulses: 2, rotation: 4, accentFirst: true },
      { inst: 'clap', pulses: 6, rotation: 0, accentFirst: false },
      { inst: 'hihat', pulses: 7, rotation: 1, accentFirst: false },
      { inst: 'tom', pulses: 5, rotation: 2, accentFirst: true }
    ]
  },
  {
    id: 'hypnotic_minimal',
    name: 'Techno Hipnótico Berlín',
    badge: 'E(4,16) + E(5,16) + E(11,16)',
    color: '#ff0077',
    layers: [
      { inst: 'kick', pulses: 4, rotation: 0, accentFirst: true },
      { inst: 'sub808', pulses: 5, rotation: 2, accentFirst: false },
      { inst: 'clap', pulses: 2, rotation: 4, accentFirst: true },
      { inst: 'hihat', pulses: 11, rotation: 0, accentFirst: false },
      { inst: 'openhat', pulses: 4, rotation: 2, accentFirst: false }
    ]
  },
  {
    id: 'euclidean_trap_matrix',
    name: 'Matriz Trap Euclidiana',
    badge: 'E(3,16) + E(13,16) + E(5,16)',
    color: '#b877ff',
    layers: [
      { inst: 'kick', pulses: 3, rotation: 0, accentFirst: true },
      { inst: 'sub808', pulses: 5, rotation: 0, accentFirst: true },
      { inst: 'snare', pulses: 2, rotation: 4, accentFirst: true },
      { inst: 'clap', pulses: 3, rotation: 4, accentFirst: false },
      { inst: 'hihat', pulses: 13, rotation: 0, accentFirst: true },
      { inst: 'openhat', pulses: 3, rotation: 2, accentFirst: false }
    ]
  },
  {
    id: 'idm_fractals',
    name: 'Fractal IDM / Braindance',
    badge: 'E(5,16) + E(7,16) + E(9,16)',
    color: '#ffaa00',
    layers: [
      { inst: 'kick', pulses: 5, rotation: 0, accentFirst: true },
      { inst: 'snare', pulses: 3, rotation: 2, accentFirst: true },
      { inst: 'hihat', pulses: 9, rotation: 1, accentFirst: false },
      { inst: 'tom', pulses: 7, rotation: 3, accentFirst: false },
      { inst: 'sub808', pulses: 4, rotation: 1, accentFirst: true }
    ]
  }
];

