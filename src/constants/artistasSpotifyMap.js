/**
 * Diccionario canónico de enlace directo entre los expedientes de artistas de The Sonic Vault
 * (Firestore) y sus identificadores oficiales en Spotify Web API.
 *
 * Permite resolución instantánea (0 ms) de telemetría de audiencia, índices de popularidad
 * calibrados y enlaces oficiales para los artistas de culto de la Bóveda.
 */

export const ARTISTAS_SPOTIFY_MAP = {
  // --- 10 ARTISTAS DE CULTO DE FIRESTORE (THE SONIC VAULT) ---
  'michael-jackson': {
    spotifyId: '3fMbdgg4jU18AjLCKBhRSm',
    name: 'Michael Jackson',
    genres: ['pop', 'soul', 'funk', 'dance pop'],
    followers: 92300000,
    popularity: 92,
    spotifyUrl: 'https://open.spotify.com/artist/3fMbdgg4jU18AjLCKBhRSm'
  },
  'bruno-mars': {
    spotifyId: '0du5cEVh5yTK9QJze8zA0C',
    name: 'Bruno Mars',
    genres: ['pop', 'funk', 'r&b'],
    followers: 61500000,
    popularity: 93,
    spotifyUrl: 'https://open.spotify.com/artist/0du5cEVh5yTK9QJze8zA0C'
  },
  'kendrick-lamar': {
    spotifyId: '2YZyLoL8N0Wb9xBt1NhZWg',
    name: 'Kendrick Lamar',
    genres: ['conscious hip hop', 'hip hop', 'west coast rap'],
    followers: 35800000,
    popularity: 94,
    spotifyUrl: 'https://open.spotify.com/artist/2YZyLoL8N0Wb9xBt1NhZWg'
  },
  'billie-eilish': {
    spotifyId: '6qqNVTkY8uBg9cP3Jd7DAH',
    name: 'Billie Eilish',
    genres: ['art pop', 'pop', 'electropop'],
    followers: 99800000,
    popularity: 94,
    spotifyUrl: 'https://open.spotify.com/artist/6qqNVTkY8uBg9cP3Jd7DAH'
  },
  'lana-del-rey': {
    spotifyId: '00FQb4jTyendYWaN8pK0wa',
    name: 'Lana Del Rey',
    genres: ['art pop', 'sadcore', 'indie pop'],
    followers: 41200000,
    popularity: 91,
    spotifyUrl: 'https://open.spotify.com/artist/00FQb4jTyendYWaN8pK0wa'
  },
  'eminem': {
    spotifyId: '7dGJo4pcD2V6oG8kP0tJRR',
    name: 'Eminem',
    genres: ['hip hop', 'detroit hip hop', 'rap'],
    followers: 73300000,
    popularity: 92,
    spotifyUrl: 'https://open.spotify.com/artist/7dGJo4pcD2V6oG8kP0tJRR'
  },
  'rihanna': {
    spotifyId: '5pKCCKE2ajJHZ9KAiaK11H',
    name: 'Rihanna',
    genres: ['pop', 'r&b', 'dance pop', 'urban contemporary'],
    followers: 118100000,
    popularity: 95,
    spotifyUrl: 'https://open.spotify.com/artist/5pKCCKE2ajJHZ9KAiaK11H'
  },
  'dr-dre': {
    spotifyId: '6DPYiyq5kWVQS4RGwxzPC7',
    name: 'Dr. Dre',
    genres: ['gangsta rap', 'g-funk', 'hip hop', 'west coast rap'],
    followers: 23500000,
    popularity: 85,
    spotifyUrl: 'https://open.spotify.com/artist/6DPYiyq5kWVQS4RGwxzPC7'
  },
  'the-weeknd': {
    spotifyId: '1Xyo4u8uXC1ZmMpatF05PJ',
    name: 'The Weeknd',
    genres: ['canadian contemporary r&b', 'pop', 'synth-pop'],
    followers: 94100000,
    popularity: 96,
    spotifyUrl: 'https://open.spotify.com/artist/1Xyo4u8uXC1ZmMpatF05PJ'
  },
  'lady-gaga': {
    spotifyId: '1HY2Jd0NmPuamShAr6KMms',
    name: 'Lady Gaga',
    genres: ['art pop', 'dance pop', 'pop'],
    followers: 32500000,
    popularity: 92,
    spotifyUrl: 'https://open.spotify.com/artist/1HY2Jd0NmPuamShAr6KMms'
  },

  // --- REFERENTES VINCULADOS EN EL ECOSISTEMA SONORO ---
  'daft-punk': {
    spotifyId: '4tZwfgrHOc3mvqYlEYSvVi',
    name: 'Daft Punk',
    genres: ['electro', 'filter house', 'french house'],
    followers: 27500000,
    popularity: 88,
    spotifyUrl: 'https://open.spotify.com/artist/4tZwfgrHOc3mvqYlEYSvVi'
  },
  'queen': {
    spotifyId: '1dfeR4HaWDbWqFHLkxsg1d',
    name: 'Queen',
    genres: ['classic rock', 'glam rock', 'rock'],
    followers: 51400000,
    popularity: 89,
    spotifyUrl: 'https://open.spotify.com/artist/1dfeR4HaWDbWqFHLkxsg1d'
  },
  'gorillaz': {
    spotifyId: '3AA28KZvwAUcZuOKwyblJQ',
    name: 'Gorillaz',
    genres: ['alternative hip hop', 'art pop', 'modern rock'],
    followers: 12300000,
    popularity: 85,
    spotifyUrl: 'https://open.spotify.com/artist/3AA28KZvwAUcZuOKwyblJQ'
  },
  'dua-lipa': {
    spotifyId: '6M2wZ9GZgrQXHCFfjv46we',
    name: 'Dua Lipa',
    genres: ['dance pop', 'pop', 'uk pop'],
    followers: 44600000,
    popularity: 90,
    spotifyUrl: 'https://open.spotify.com/artist/6M2wZ9GZgrQXHCFfjv46we'
  },
  'bad-bunny': {
    spotifyId: '4q3ewBCX7sLwd24euuV69X',
    name: 'Bad Bunny',
    genres: ['reggaeton', 'trap latino', 'urbano'],
    followers: 86400000,
    popularity: 95,
    spotifyUrl: 'https://open.spotify.com/artist/4q3ewBCX7sLwd24euuV69X'
  },
  'beyonce': {
    spotifyId: '6vWDO969PvNqNYHIOW5v0m',
    name: 'Beyoncé',
    genres: ['pop', 'r&b', 'contemporary r&b'],
    followers: 39200000,
    popularity: 91,
    spotifyUrl: 'https://open.spotify.com/artist/6vWDO969PvNqNYHIOW5v0m'
  },
  'taylor-swift': {
    spotifyId: '06HL4z0CvFAxyc27GXpf02',
    name: 'Taylor Swift',
    genres: ['pop'],
    followers: 124000000,
    popularity: 98,
    spotifyUrl: 'https://open.spotify.com/artist/06HL4z0CvFAxyc27GXpf02'
  },
  'travis-scott': {
    spotifyId: '0Y5tJX1MQlPlqiwlOH1tJY',
    name: 'Travis Scott',
    genres: ['hip hop', 'rap', 'slap house'],
    followers: 33900000,
    popularity: 93,
    spotifyUrl: 'https://open.spotify.com/artist/0Y5tJX1MQlPlqiwlOH1tJY'
  },
  'arctic-monkeys': {
    spotifyId: '7Ln80lUS6He07XvHI8qqHH',
    name: 'Arctic Monkeys',
    genres: ['garage rock', 'modern rock', 'indie rock'],
    followers: 26700000,
    popularity: 89,
    spotifyUrl: 'https://open.spotify.com/artist/7Ln80lUS6He07XvHI8qqHH'
  },
  'feid': {
    spotifyId: '2LRoIwlKmHjgvigdNGBHNo',
    name: 'Feid',
    genres: ['reggaeton', 'urbano colombiano'],
    followers: 14500000,
    popularity: 92,
    spotifyUrl: 'https://open.spotify.com/artist/2LRoIwlKmHjgvigdNGBHNo'
  },
  'the-rolling-stones': {
    spotifyId: '22bE4uQ6baNwSHPVcDxLCe',
    name: 'The Rolling Stones',
    genres: ['album rock', 'british invasion', 'classic rock'],
    followers: 14800000,
    popularity: 85,
    spotifyUrl: 'https://open.spotify.com/artist/22bE4uQ6baNwSHPVcDxLCe'
  }
};

/**
 * Normaliza un término para búsqueda insensible a mayúsculas, tildes y caracteres especiales.
 */
function normalizarTermino(texto = '') {
  return String(texto || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

/**
 * Obtiene la configuración canónica de Spotify para un artista a partir de su slug o nombre.
 * @param {string} slugOrName - Identificador del documento en Firestore o nombre del artista.
 * @returns {object|null} Metadatos curados o null si no está mapeado directamente.
 */
export function getCuratedSpotifyMapping(slugOrName = '') {
  if (!slugOrName) return null;
  const rawClean = String(slugOrName).trim().toLowerCase();

  // 1. Coincidencia directa por clave de slug
  if (ARTISTAS_SPOTIFY_MAP[rawClean]) {
    return ARTISTAS_SPOTIFY_MAP[rawClean];
  }

  // 2. Coincidencia por término normalizado
  const normKey = normalizarTermino(slugOrName);
  if (ARTISTAS_SPOTIFY_MAP[normKey]) {
    return ARTISTAS_SPOTIFY_MAP[normKey];
  }

  // 3. Coincidencia por ID de Spotify o nombre oficial
  for (const item of Object.values(ARTISTAS_SPOTIFY_MAP)) {
    if (
      item.spotifyId === slugOrName ||
      item.name.toLowerCase() === rawClean ||
      normalizarTermino(item.name) === normKey
    ) {
      return item;
    }
  }

  return null;
}

/**
 * Obtiene el Spotify ID oficial para un artista curado.
 * @param {string} slugOrName - Slug o nombre del artista.
 * @returns {string|null} ID oficial de 22 caracteres o null.
 */
export function getCuratedSpotifyId(slugOrName = '') {
  const match = getCuratedSpotifyMapping(slugOrName);
  return match?.spotifyId || null;
}

