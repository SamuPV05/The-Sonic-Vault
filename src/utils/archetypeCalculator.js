// ============================================================================
// MOTOR DE ARQUETIPOS SONOROS & CÁPSULA DEL TIEMPO (THE SONIC VAULT)
// ============================================================================

export const ARCHETYPES = {
  SYNTHWAVE_GUARDIAN: {
    id: 'SYNTHWAVE_GUARDIAN',
    name: 'Guardián del Synthwave',
    subtitle: 'Arquitecto de Neón y Retrofuturismo',
    icon: 'fa-solid fa-bolt',
    primaryColor: '#00F0FF',
    secondaryColor: '#FF007A',
    gradient: 'linear-gradient(135deg, #00F0FF 0%, #7928CA 50%, #FF007A 100%)',
    glowColor: 'rgba(0, 240, 255, 0.45)',
    foilFilter: 'hue-rotate(290deg) contrast(1.2)',
    element: 'Frecuencias Sintéticas & Sidechain Analógico',
    trait: 'Atracción fatal por arpegiadores Roland Juno, reverberaciones infinitas y ritmos a 124 BPM.',
    lore: 'Custodio de las memorias sonoras del año 2084. Percibe el espacio a través de osciladores y filtros en escalera.',
    bpmEstimate: '120 - 130 BPM',
    codePrefix: 'ARC-SYNT',
  },
  HIPHOP_ALCHEMIST: {
    id: 'HIPHOP_ALCHEMIST',
    name: 'Alquimista del Hip-Hop',
    subtitle: 'Maestro de Subbajos y Métrica Urbana',
    icon: 'fa-solid fa-compact-disc',
    primaryColor: '#FFD700',
    secondaryColor: '#FF6B00',
    gradient: 'linear-gradient(135deg, #FFD700 0%, #FF6B00 50%, #8000FF 100%)',
    glowColor: 'rgba(255, 215, 0, 0.45)',
    foilFilter: 'hue-rotate(45deg) contrast(1.25)',
    element: 'Bajos Subarmónicos 808 & Transitorios Boom-Bap',
    trait: 'Oído calibrado para el corte de vinilo, samples con saturación de cinta y cadencias líricas complejas.',
    lore: 'Transmuta fragmentos de vinilo de los 70 en frecuencias de alta densidad que hacen vibrar el plexo solar.',
    bpmEstimate: '85 - 95 / 140 BPM',
    codePrefix: 'ARC-BOOM',
  },
  ROCK_CENTINEL: {
    id: 'ROCK_CENTINEL',
    name: 'Centinela del Rock & Metal',
    subtitle: 'Guardián de la Distorsión Valvular',
    icon: 'fa-solid fa-guitar',
    primaryColor: '#FF2A5F',
    secondaryColor: '#FF8800',
    gradient: 'linear-gradient(135deg, #FF2A5F 0%, #FF5E00 50%, #7000FF 100%)',
    glowColor: 'rgba(255, 42, 95, 0.45)',
    foilFilter: 'hue-rotate(340deg) contrast(1.3)',
    element: 'Overdrive Orgánico & Baterías Acústicas Raw',
    trait: 'Devoción por amplificadores a bulbos saturados, transitorios acústicos sin cuantizar y guitarras enérgicas.',
    lore: 'Resiste a la compresión digital estricta protegiendo la dinámica viva de los instrumentos de cuerda eléctrica.',
    bpmEstimate: '110 - 150 BPM',
    codePrefix: 'ARC-ROCK',
  },
  URBAN_SHAMAN: {
    id: 'URBAN_SHAMAN',
    name: 'Chamán Rítmico Urbano',
    subtitle: 'Canalizador del Dembow y Pulso Corporal',
    icon: 'fa-solid fa-fire-flame-curved',
    primaryColor: '#FF416C',
    secondaryColor: '#FF4B2B',
    gradient: 'linear-gradient(135deg, #FF416C 0%, #FF4B2B 50%, #FFB300 100%)',
    glowColor: 'rgba(255, 65, 108, 0.45)',
    foilFilter: 'hue-rotate(15deg) contrast(1.3)',
    element: 'Síncopa de Caja & Presión Acústica Bailable',
    trait: 'Instinto cinético inmediato. Conexión biológica con patrones sincopados y bajos envolventes de club.',
    lore: 'Canaliza la vibración colectiva de las noches urbanas transformando el ruido de la ciudad en fuego acústico.',
    bpmEstimate: '92 - 105 BPM',
    codePrefix: 'ARC-URBN',
  },
  COSMIC_VOYAGER: {
    id: 'COSMIC_VOYAGER',
    name: 'Viajero Cósmico & Ambient',
    subtitle: 'Navegante de Texturas Etéreas',
    icon: 'fa-solid fa-moon',
    primaryColor: '#9D00FF',
    secondaryColor: '#00FFCC',
    gradient: 'linear-gradient(135deg, #9D00FF 0%, #00F0FF 50%, #00FFCC 100%)',
    glowColor: 'rgba(157, 0, 255, 0.45)',
    foilFilter: 'hue-rotate(220deg) contrast(1.15)',
    element: 'Ondas Theta & Espacios Reverberantes Estéreo',
    trait: 'Sensibilidad a timbres sutiles, grabaciones de campo orgánicas y acordes suspendidos de baja densidad.',
    lore: 'Explora los límites de la percepción auditiva, donde la música se confunde con la respiración del universo.',
    bpmEstimate: '65 - 85 BPM (o Flotante)',
    codePrefix: 'ARC-COSM',
  },
  POP_ARCHITECT: {
    id: 'POP_ARCHITECT',
    name: 'Arquitecto del Pop & Groove',
    subtitle: 'Ingeniero de Ganchos Melódicos',
    icon: 'fa-solid fa-wand-magic-sparkles',
    primaryColor: '#FF00A0',
    secondaryColor: '#00F0FF',
    gradient: 'linear-gradient(135deg, #FF00A0 0%, #7928CA 50%, #00F0FF 100%)',
    glowColor: 'rgba(255, 0, 160, 0.45)',
    foilFilter: 'hue-rotate(300deg) contrast(1.2)',
    element: 'Brillo Vocal Lustroso & Compresión Armónica',
    trait: 'Apreciación por la producción milimétrica, estribillos imbatibles y dinámica eufórica de estudio.',
    lore: 'Decodifica la psicología de la melodía para crear piezas que se instalan permanentemente en la memoria auditiva.',
    bpmEstimate: '115 - 128 BPM',
    codePrefix: 'ARC-POPG',
  },
  SOUL_MAESTRO: {
    id: 'SOUL_MAESTRO',
    name: 'Maestro del Soul, Funk & Jazz',
    subtitle: 'Intérprete del Swing Humano',
    icon: 'fa-solid fa-record-vinyl',
    primaryColor: '#F6D365',
    secondaryColor: '#FDA085',
    gradient: 'linear-gradient(135deg, #F6D365 0%, #FDA085 50%, #9B51E0 100%)',
    glowColor: 'rgba(246, 211, 101, 0.45)',
    foilFilter: 'hue-rotate(70deg) contrast(1.2)',
    element: 'Armonías Modales & Micro-tiempos Sin Cuantizar',
    trait: 'Fascinación por el groove elástico, acordes de novena con tensión armónica y voces con calidez analógica.',
    lore: 'Comprende que la verdadera magia de la música reside en las imperfecciones humanas del tempo en vivo.',
    bpmEstimate: '90 - 118 BPM',
    codePrefix: 'ARC-SOUL',
  },
  ECLECTIC_EXPLORER: {
    id: 'ECLECTIC_EXPLORER',
    name: 'Explorador Multiversal',
    subtitle: 'Curador Sin Fronteras Sonoras',
    icon: 'fa-solid fa-infinity',
    primaryColor: '#00F5D4',
    secondaryColor: '#7B2CBF',
    gradient: 'linear-gradient(135deg, #00F5D4 0%, #7B2CBF 50%, #F72585 100%)',
    glowColor: 'rgba(0, 245, 212, 0.45)',
    foilFilter: 'hue-rotate(180deg) contrast(1.2)',
    element: 'Espectro Completo de Frecuencias (20Hz - 20kHz)',
    trait: 'Paladar auditivo omnívoro capaz de transitar del ambient contemplativo al rap abrasivo en un solo salto.',
    lore: 'No reconoce barreras de género ni épocas. Su cerebro auditivo procesa la música como energía pura multidimensional.',
    bpmEstimate: 'Omnidireccional',
    codePrefix: 'ARC-UNIV',
  }
};

const GENRE_RULES = [
  {
    archetypeId: 'SYNTHWAVE_GUARDIAN',
    keywords: ['synthwave', 'retrowave', 'cyberpunk', 'darksynth', 'vaporwave', 'outrun', 'synthpop', 'electronic', 'electro', 'idm', 'techno', 'trance', 'edm', 'house']
  },
  {
    archetypeId: 'HIPHOP_ALCHEMIST',
    keywords: ['hip hop', 'hip-hop', 'rap', 'trap', 'boom bap', 'drill', 'underground rap', 'conscious hip hop', 'gangsta rap', 'southern hip hop']
  },
  {
    archetypeId: 'ROCK_CENTINEL',
    keywords: ['rock', 'metal', 'punk', 'grunge', 'hard rock', 'alternative rock', 'indie rock', 'post-punk', 'classic rock', 'heavy metal', 'stoner rock', 'emo']
  },
  {
    archetypeId: 'URBAN_SHAMAN',
    keywords: ['reggaeton', 'urbano', 'latin urbano', 'latin pop', 'trap latino', 'dembow', 'cumbia', 'perreo', 'afrobeat', 'dancehall', 'latin']
  },
  {
    archetypeId: 'COSMIC_VOYAGER',
    keywords: ['ambient', 'lo-fi', 'lofi', 'chillhop', 'downtempo', 'drone', 'soundscape', 'post-rock', 'meditation', 'sleep', 'acoustic', 'chill']
  },
  {
    archetypeId: 'POP_ARCHITECT',
    keywords: ['pop', 'dance pop', 'electropop', 'indie pop', 'disco', 'europop', 'hyperpop', 'post-teen pop', 'pop rap', 'viral pop']
  },
  {
    archetypeId: 'SOUL_MAESTRO',
    keywords: ['soul', 'jazz', 'funk', 'neo soul', 'r&b', 'motown', 'blues', 'disco funk', 'contemporary r&b', 'quiet storm']
  }
];

/**
 * Calcula el arquetipo sonoro a partir de los artistas y canciones favoritas del usuario.
 */
export function calculateSoundArchetype(topArtists = [], topTracks = [], profile = {}, isConnected = false, userAuthName = '') {
  // Si no hay artistas disponibles pero el usuario sí está conectado (cuenta nueva sin historial o sincronizando)
  if (!topArtists || topArtists.length === 0) {
    if (isConnected) {
      return getNewUserArchetype(profile, userAuthName);
    }
    return getDemoArchetype(userAuthName || profile?.display_name || 'Agente de Bóveda');
  }

  // 1. Ponderar géneros de los artistas
  const genreScores = {};
  const archetypeScores = {
    SYNTHWAVE_GUARDIAN: 0,
    HIPHOP_ALCHEMIST: 0,
    ROCK_CENTINEL: 0,
    URBAN_SHAMAN: 0,
    COSMIC_VOYAGER: 0,
    POP_ARCHITECT: 0,
    SOUL_MAESTRO: 0,
    ECLECTIC_EXPLORER: 1 // Base point
  };

  topArtists.forEach((artist, index) => {
    // El artista #1 pesa más que el #5
    const rankWeight = Math.max(1, 6 - index);
    const genres = artist.genres || [];

    genres.forEach(genre => {
      const gLower = genre.toLowerCase();
      genreScores[gLower] = (genreScores[gLower] || 0) + rankWeight;

      // Evaluar contra reglas de arquetipos
      let matched = false;
      for (const rule of GENRE_RULES) {
        if (rule.keywords.some(kw => gLower.includes(kw))) {
          archetypeScores[rule.archetypeId] += rankWeight * 2;
          matched = true;
        }
      }

      if (!matched) {
        archetypeScores.ECLECTIC_EXPLORER += rankWeight;
      }
    });
  });

  // 2. Determinar arquetipo ganador
  let bestArchetypeId = 'ECLECTIC_EXPLORER';
  let highestScore = 0;
  let totalScore = 0;

  for (const [id, score] of Object.entries(archetypeScores)) {
    totalScore += score;
    if (score > highestScore) {
      highestScore = score;
      bestArchetypeId = id;
    }
  }

  // Si no hay un claro dominante o todos los géneros son muy dispersos, se declara Eclectic
  const dominanceRatio = totalScore > 0 ? highestScore / totalScore : 0;
  if (dominanceRatio < 0.28 && topArtists.length >= 4) {
    bestArchetypeId = 'ECLECTIC_EXPLORER';
  }

  const archetypeConfig = ARCHETYPES[bestArchetypeId] || ARCHETYPES.ECLECTIC_EXPLORER;

  // 3. Extraer Top Géneros para el espectro de frecuencias
  const sortedGenres = Object.entries(genreScores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  const topGenreTotal = sortedGenres.reduce((acc, curr) => acc + curr[1], 0) || 1;
  const topGenres = sortedGenres.map(([name, weight]) => ({
    name: name.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
    percent: Math.min(99, Math.max(15, Math.round((weight / topGenreTotal) * 100)))
  }));

  // Si no hay suficientes géneros, rellenamos con valores de estilo
  if (topGenres.length === 0) {
    topGenres.push(
      { name: 'Frecuencias Sintéticas', percent: 85 },
      { name: 'Ondas Analógicas', percent: 65 },
      { name: 'Bajos Profundos', percent: 50 }
    );
  }

  // 4. Calcular puntaje de Afinidad Armónica (88% a 99%)
  const rawAffinity = Math.round(88 + (dominanceRatio * 11));
  const affinityScore = Math.min(99, Math.max(88, rawAffinity));

  // 5. Generar código de pasaporte único
  const holderName = profile?.display_name || 'Agente de Bóveda';
  const nameHash = Math.abs(holderName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 7794)) % 9000 + 1000;
  const serialNumber = `${archetypeConfig.codePrefix}-${nameHash}-${new Date().getFullYear()}`;

  // 6. Información del Artista y Canción #1
  const topArtist = topArtists[0] || null;
  const topTrack = topTracks[0] || null;

  return {
    archetype: archetypeConfig,
    topGenres,
    affinityScore,
    serialNumber,
    issueDate: new Date().toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }).toUpperCase(),
    holderName,
    holderPhoto: profile?.images?.[0]?.url || null,
    accountType: profile?.product === 'premium' ? 'PREMIUM SONIC VIP' : 'STANDARD VAULT PASS',
    isPremium: profile?.product === 'premium',
    topArtistName: topArtist?.name || 'Varios Artistas',
    topArtistImage: topArtist?.images?.[0]?.url || null,
    topArtistGenres: topArtist?.genres?.slice(0, 2).join(' • ') || '',
    topTrackName: topTrack?.name || '',
    topTrackArtist: topTrack?.artists?.map(a => a.name).join(', ') || '',
    isDemo: false
  };
}

/**
 * Retorna un arquetipo en fase de calibración para usuarios conectados cuya cuenta de Spotify
 * es reciente o aún no cuenta con historial de reproducción suficiente para calcular afinidad.
 */
export function getNewUserArchetype(profile = {}, userAuthName = '') {
  const archetypeConfig = ARCHETYPES.ECLECTIC_EXPLORER;
  const holderName = profile?.display_name || userAuthName || 'Agente de Bóveda';
  const nameHash = Math.abs(holderName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 7794)) % 9000 + 1000;

  return {
    archetype: archetypeConfig,
    topGenres: [
      { name: 'Calibrando Frecuencias...', percent: 75 },
      { name: 'Sintonizando Hábitos...', percent: 55 },
      { name: 'Primeras Escuchas...', percent: 40 }
    ],
    affinityScore: 92,
    serialNumber: `ARC-INIT-${nameHash}-${new Date().getFullYear()}`,
    issueDate: new Date().toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }).toUpperCase(),
    holderName,
    holderPhoto: profile?.images?.[0]?.url || null,
    accountType: profile?.product === 'premium' ? 'PREMIUM SONIC VIP' : 'STANDARD VAULT PASS',
    isPremium: profile?.product === 'premium',
    topArtistName: 'Sintonizando Frecuencia...',
    topArtistImage: null,
    topArtistGenres: 'Reproduce canciones en Spotify para calibrar tu ADN',
    topTrackName: 'Frecuencia Inicial en Espera',
    topTrackArtist: 'The Sonic Vault Neural Link',
    isDemo: false,
    isCalibrating: true
  };
}

/**
 * Retorna un arquetipo prototipo estilizado cuando Spotify aún no está conectado.
 */
export function getDemoArchetype(holderName = 'Agente Sonoro') {
  const archetypeConfig = ARCHETYPES.SYNTHWAVE_GUARDIAN;
  return {
    archetype: archetypeConfig,
    topGenres: [
      { name: 'Synthwave & Darksynth', percent: 92 },
      { name: 'Retrofuturismo Analógico', percent: 78 },
      { name: 'Bajos Subarmónicos', percent: 64 },
      { name: 'Cyberpunk Electro', percent: 48 }
    ],
    affinityScore: 96,
    serialNumber: `ARC-DEMO-7794-${new Date().getFullYear()}`,
    issueDate: 'EDICIÓN ESPECIAL',
    holderName,
    holderPhoto: null,
    accountType: 'PROTOTIPO NO VINCULADO',
    isPremium: false,
    topArtistName: 'Sincroniza para Desbloquear',
    topArtistImage: null,
    topArtistGenres: 'Retrowave • Cyberpunk',
    topTrackName: 'Conecta tu cuenta de Spotify',
    topTrackArtist: 'The Sonic Vault Neural Link',
    isDemo: true
  };
}

/**
 * Compara artistas entre épocas para calcular el índice de consistencia temporal de gustos.
 */
export function calculateTasteStability(shortTerm = [], mediumTerm = [], longTerm = []) {
  if (!shortTerm.length || !longTerm.length) {
    return {
      stabilityPercent: 82,
      label: 'Consistencia Equilibrada',
      description: 'Mantienes un balance fluido entre clásicos personales y nuevos descubrimientos musicales.',
      constants: [],
      discoveries: []
    };
  }

  const shortNames = new Set(shortTerm.map(a => a.name.toLowerCase()));
  const longNames = new Set(longTerm.map(a => a.name.toLowerCase()));

  // Artistas presentes tanto en corto como en largo plazo
  const constants = [];
  shortTerm.forEach(artist => {
    if (longNames.has(artist.name.toLowerCase())) {
      constants.push(artist.name);
    }
  });

  // Artistas nuevos del último mes que no estaban en el histórico
  const discoveries = [];
  shortTerm.forEach(artist => {
    if (!longNames.has(artist.name.toLowerCase())) {
      discoveries.push(artist.name);
    }
  });

  const overlapRatio = constants.length / Math.max(1, shortTerm.length);
  const stabilityPercent = Math.min(98, Math.max(35, Math.round(overlapRatio * 100)));

  let label = 'Consistencia Equilibrada';
  let description = 'Tus gustos presentan una sana alternancia entre tus artistas de siempre y nuevas obsesiones.';

  if (stabilityPercent >= 75) {
    label = 'Fidelidad de ADN Inquebrantable';
    description = 'Tus artistas de cabecera son los pilares de tu identidad sonora a través de los años.';
  } else if (stabilityPercent <= 40) {
    label = 'Mutación Sonora Continua';
    description = 'Tu paladar musical está en perpetua evolución; siempre en la frontera de lo desconocido.';
  }

  return {
    stabilityPercent,
    label,
    description,
    constants,
    discoveries
  };
}
