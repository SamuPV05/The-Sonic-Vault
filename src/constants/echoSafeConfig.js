// ============================================================================
// CONFIGURACIÓN Y TAXONOMÍA ACÚSTICA - ECHO-SAFE
// ============================================================================

// Niveles de decibelios basados en normativas de la OMS y confort acústico
export const ACOUSTIC_LEVELS = [
  {
    id: 'calm',
    min: 0,
    max: 50,
    label: 'Calma / Seguro',
    tagline: 'Ideal para descanso y concentración',
    color: '#00F0FF', // Cyan Neon
    textColor: '#000000',
    icon: 'fa-shield-heart',
    healthEffect: 'Entorno acústico óptimo. Sin riesgos para la salud auditiva.'
  },
  {
    id: 'moderate',
    min: 51,
    max: 65,
    label: 'Moderado',
    tagline: 'Conversación o actividad habitual',
    color: '#10B981', // Verde esmeralda
    textColor: '#000000',
    icon: 'fa-headphones',
    healthEffect: 'Aceptable de día; puede causar molestias leves durante el sueño.'
  },
  {
    id: 'elevated',
    min: 66,
    max: 75,
    label: 'Elevado',
    tagline: 'Tráfico denso o bullicio constante',
    color: '#FBBF24', // Ámbar neón
    textColor: '#000000',
    icon: 'fa-triangle-exclamation',
    healthEffect: 'Agotamiento mental e interferencia en la comunicación oral.'
  },
  {
    id: 'noisy',
    min: 76,
    max: 85,
    label: 'Ruidoso',
    tagline: 'Contaminación sonora evidente',
    color: '#F97316', // Naranja intenso
    textColor: '#ffffff',
    icon: 'fa-volume-xmark',
    healthEffect: 'Riesgo de estrés crónico y fatiga auditiva con exposición prolongada.'
  },
  {
    id: 'critical',
    min: 86,
    max: 140,
    label: 'Peligro Auditivo',
    tagline: 'Nivel crítico de exposición sonora',
    color: '#FF007A', // Magenta neón
    textColor: '#ffffff',
    icon: 'fa-biohazard',
    healthEffect: 'Riesgo de daño auditivo permanente tras exposiciones cortas.'
  }
];

// Categorías temáticas de fuentes de sonido comunitarias
export const SOUND_CATEGORIES = [
  {
    id: 'traffic',
    label: 'Tráfico / Transporte',
    icon: 'fa-car-side',
    description: 'Vehículos, bocinas, transporte público o motocicletas'
  },
  {
    id: 'nightlife',
    label: 'Bares y Ocio',
    icon: 'fa-champagne-glasses',
    description: 'Música alta, terrazas, conciertos o vida nocturna'
  },
  {
    id: 'construction',
    label: 'Obras y Trabajo',
    icon: 'fa-hammer',
    description: 'Maquinaria pesada, taladros o construcción activa'
  },
  {
    id: 'community',
    label: 'Vecindario / Calle',
    icon: 'fa-people-group',
    description: 'Aglomeraciones de personas, bullicio o actividad comercial'
  },
  {
    id: 'nature',
    label: 'Parque / Calma',
    icon: 'fa-tree',
    description: 'Zonas verdes, refugios de silencio y naturaleza'
  },
  {
    id: 'other',
    label: 'Otra Fuente',
    icon: 'fa-wave-square',
    description: 'Sonido no catalogado en las opciones anteriores'
  }
];

// Parámetros del motor de medición acústica (Web Audio API)
export const AUDIO_CONFIG = {
  FFT_SIZE: 2048,            // Ventana de análisis (~46 ms a 44.1 kHz)
  SAMPLE_INTERVAL_MS: 50,    // Frecuencia de muestreo de métricas (20 Hz)
  UI_INTERVAL_MS: 100,       // Frecuencia de refresco de la interfaz (10 Hz)
  SCAN_DURATION_MS: 8000,    // Duración total del escaneo
  WARMUP_MS: 400,            // Muestras iniciales descartadas (estabilización del micrófono)
  FAST_ALPHA: 0.35,          // Suavizado equivalente a ponderación temporal "Fast" (125 ms)
  CALIBRATION_OFFSET: 90,    // Conversión dBFS -> dB SPL estimado (micrófonos de consumo)
  MIN_DB: 25,                // Piso de ruido típico de un micrófono de consumo
  MAX_DB: 120,               // Techo de medición
  SILENCE_DBFS: -85          // Por debajo de este pico se asume micrófono mudo/sin señal
};

// Parámetros de la capa térmica del mapa (Canvas)
export const HEAT_CONFIG = {
  DB_FLOOR: 30,              // dB que equivalen a intensidad mínima
  DB_CEIL: 100,              // dB que equivalen a intensidad máxima
  RADIUS_METERS: 90,         // Radio de influencia real de cada reporte
  MIN_RADIUS_PX: 14,         // Radio mínimo en pantalla (zoom alejado)
  MAX_RADIUS_PX: 70,         // Radio máximo en pantalla (zoom cercano)
  MARKERS_MIN_ZOOM: 14,      // Zoom a partir del cual se muestran los nodos individuales
  // Paradas del gradiente alineadas con los umbrales OMS (50/65/75/85 dB sobre 30-100 dB)
  GRADIENT: {
    0: '#00F0FF',
    0.29: '#00F0FF',
    0.5: '#10B981',
    0.64: '#FBBF24',
    0.79: '#F97316',
    1: '#FF007A'
  }
};

/**
 * Obtiene la clasificación acústica según los decibelios medidos.
 * @param {number} db - Nivel medido en dB
 * @returns {object} Configuración del nivel acústico correspondiente
 */
export function getAcousticClassification(db) {
  const numericDb = Number(db) || 0;
  for (const level of ACOUSTIC_LEVELS) {
    if (numericDb <= level.max) {
      return level;
    }
  }
  return ACOUSTIC_LEVELS[ACOUSTIC_LEVELS.length - 1];
}

/**
 * Obtiene la información de una categoría por su ID.
 * @param {string} categoryId 
 * @returns {object} Información de la categoría
 */
export function getCategoryInfo(categoryId) {
  const found = SOUND_CATEGORIES.find((c) => c.id === categoryId);
  return found || { id: 'other', label: 'General / Otra', icon: 'fa-wave-square' };
}

/**
 * Formatea una fecha o Timestamp de Firestore en tiempo relativo legible (ej. "Hace 5 min").
 * @param {any} dateOrTimestamp 
 * @returns {string} Tiempo relativo formateado
 */
export function formatRelativeTime(dateOrTimestamp) {
  if (!dateOrTimestamp) return 'Reciente';

  let date;
  if (dateOrTimestamp?.toDate && typeof dateOrTimestamp.toDate === 'function') {
    date = dateOrTimestamp.toDate();
  } else if (dateOrTimestamp instanceof Date) {
    date = dateOrTimestamp;
  } else if (typeof dateOrTimestamp === 'string') {
    const parsed = new Date(dateOrTimestamp);
    if (!isNaN(parsed.getTime())) {
      date = parsed;
    } else {
      return dateOrTimestamp;
    }
  } else {
    return 'Reciente';
  }

  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 0 || diffInSeconds < 60) return 'Justo ahora';
  if (diffInSeconds < 3600) {
    const mins = Math.floor(diffInSeconds / 60);
    return `Hace ${mins} min${mins > 1 ? 's' : ''}`;
  }
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `Hace ${hours} h${hours > 1 ? 's' : ''}`;
  }
  if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `Hace ${days} día${days > 1 ? 's' : ''}`;
  }

  return date.toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
}

