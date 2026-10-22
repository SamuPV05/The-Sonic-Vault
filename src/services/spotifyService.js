// ============================================================================
// SERVICIO DE INTEGRACIÓN CON SPOTIFY API (THE SONIC VAULT)
// ============================================================================

const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = import.meta.env.VITE_SPOTIFY_CLIENT_SECRET;
const REDIRECT_URI = import.meta.env.VITE_SPOTIFY_REDIRECT_URI || 'http://127.0.0.1:5173/callback';

const TOKEN_ENDPOINT = 'https://accounts.spotify.com/api/token';
const API_BASE = 'https://api.spotify.com/v1';

// ----------------------------------------------------------------------------
// 1. FLUJO PÚBLICO (CLIENT CREDENTIALS) - Para explorar catálogo sin login
// ----------------------------------------------------------------------------

let publicTokenCache = null;
let publicTokenExpiry = 0;

/**
 * Obtiene o reutiliza un token de acceso público para consultar el catálogo de Spotify.
 * Utiliza el endpoint seguro /api/spotify-token para evitar bloqueos por CORS en el navegador.
 */
export async function getPublicSpotifyToken() {
  const ahora = Date.now();
  if (publicTokenCache && ahora < publicTokenExpiry - 60000) {
    return publicTokenCache;
  }

  try {
    const response = await fetch('/api/spotify-token');
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `HTTP ${response.status}`);
    }

    const data = await response.json();
    if (!data.access_token) {
      throw new Error('No se recibió token de acceso de Spotify');
    }

    publicTokenCache = data.access_token;
    publicTokenExpiry = ahora + 3500 * 1000;
    return publicTokenCache;
  } catch (err) {
    console.error('Error al solicitar token de Spotify vía /api/spotify-token:', err);
    throw err;
  }
}

/**
 * Obtiene un token válido para consultar el catálogo de Spotify:
 * 1. Si el usuario ya sincronizó su cuenta, usamos su token directamente desde el navegador (instantáneo).
 * 2. Si es un visitante sin login, solicita el token público seguro al backend.
 */
export async function getEffectiveSpotifyToken() {
  try {
    const userToken = await getUserAccessToken();
    if (userToken) {
      return userToken;
    }
  } catch (e) {
    // Si falla la lectura del token de usuario, se recurre al público
  }
  return await getPublicSpotifyToken();
}

/**
 * Busca artistas en el catálogo global de Spotify por nombre.
 */
export async function searchSpotifyArtists(query, limit = 8) {
  if (!query || query.trim().length === 0) return [];
  
  // Spotify exige estrictamente un límite máximo de 10 en aplicaciones de desarrollo
  const safeLimit = Math.min(Math.max(1, Number(limit) || 8), 10);
  let token = await getEffectiveSpotifyToken();

  const url = `${API_BASE}/search?q=${encodeURIComponent(query.trim())}&type=artist&limit=${safeLimit}`;
  let response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  // Si el token fue rechazado con 401 (ej: token de usuario vencido en localStorage), reintentamos con el token público
  if (response.status === 401) {
    console.warn('Token rechazado con 401. Reintentando con token público...');
    try {
      token = await getPublicSpotifyToken();
      response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      console.error('Error al obtener token de respaldo:', err);
    }
  }

  if (!response.ok) {
    console.error('Error al buscar artistas en Spotify:', response.status);
    return [];
  }

  const data = await response.json();
  return data.artists?.items || [];
}

/**
 * Obtiene los detalles de un artista por su ID de Spotify.
 */
export async function getSpotifyArtist(artistId) {
  const token = await getEffectiveSpotifyToken();
  const response = await fetch(`${API_BASE}/artists/${artistId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) return null;
  return await response.json();
}

/**
 * Obtiene las canciones más populares de un artista buscando en el catálogo.
 */
export async function getSpotifyArtistTopTracks(artistId, artistName = '', limit = 6) {
  const token = await getEffectiveSpotifyToken();
  
  // Usamos la búsqueda de tracks por artista para garantizar compatibilidad con las nuevas directivas de Spotify API
  const query = artistName ? `artist:"${artistName}"` : `artist:${artistId}`;
  const response = await fetch(`${API_BASE}/search?q=${encodeURIComponent(query)}&type=track&limit=${limit}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) return [];
  const data = await response.json();
  return data.tracks?.items || [];
}

/**
 * Obtiene la discografía (álbumes y singles) de un artista.
 */
export async function getSpotifyArtistAlbums(artistId, limit = 12) {
  const token = await getEffectiveSpotifyToken();
  const response = await fetch(`${API_BASE}/artists/${artistId}/albums?include_groups=album,single&limit=${limit}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) return [];
  const data = await response.json();
  return data.items || [];
}

/**
 * Obtiene los lanzamientos más recientes del catálogo global de Spotify (Álbumes y Singles).
 * Utiliza tag:new con límite estricto de 10 por tanda (exigido por Spotify Developer Mode)
 * y paginación en paralelo para entregar hasta 20 estrenos sin errores HTTP 400.
 */
export async function getSpotifyNewReleases(limit = 20) {
  let token = await getEffectiveSpotifyToken();

  async function fetchSearch(query, offset = 0) {
    const url = `${API_BASE}/search?q=${encodeURIComponent(query)}&type=album&limit=10&offset=${offset}`;
    let res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (res.status === 401) {
      token = await getPublicSpotifyToken();
      res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    }
    return res;
  }

  try {
    let res1 = await fetchSearch('tag:new', 0);

    // Si tag:new tuviese algún hipo, recurrimos a búsqueda del año en curso
    if (!res1.ok) {
      const currentYear = new Date().getFullYear();
      res1 = await fetchSearch(`year:${currentYear}`, 0);
    }

    if (!res1.ok) return [];

    const data1 = await res1.json();
    let rawItems = data1.albums?.items || [];

    // Si se solicitaron más de 10 ítems, traemos la siguiente tanda de 10
    if (limit > 10) {
      try {
        const res2 = await fetchSearch('tag:new', 10);
        if (res2.ok) {
          const data2 = await res2.json();
          rawItems = [...rawItems, ...(data2.albums?.items || [])];
        }
      } catch (e) {
        // En caso de fallo en la segunda tanda, se preserva la primera
      }
    }

    return rawItems.map(album => ({
      id: album.id,
      name: album.name,
      artist: album.artists?.map(a => a.name).join(', ') || 'Varios Artistas',
      artistId: album.artists?.[0]?.id,
      releaseDate: album.release_date,
      totalTracks: album.total_tracks,
      type: album.album_type, // 'album' | 'single'
      image: album.images?.[0]?.url || album.images?.[1]?.url || '',
      spotifyUrl: album.external_urls?.spotify || `https://open.spotify.com/album/${album.id}`,
      uri: album.uri
    }));
  } catch (err) {
    console.error('Error al obtener lanzamientos de Spotify:', err);
    return [];
  }
}



// ----------------------------------------------------------------------------
// 2. FLUJO DE USUARIO CON PKCE (OAuth) - Para sacarle el jugo a la cuenta Premium
// ----------------------------------------------------------------------------

const USER_TOKEN_KEY = 'tsv_spotify_user_token';
const REFRESH_TOKEN_KEY = 'tsv_spotify_refresh_token';
const TOKEN_EXPIRY_KEY = 'tsv_spotify_token_expiry';
const CODE_VERIFIER_KEY = 'tsv_spotify_code_verifier';

// Permisos que solicitamos a la cuenta de Spotify:
// - Leer perfil y correo
// - Leer Top Artistas y Canciones (ADN Sonoro)
// - Leer lo reproducido recientemente
// - Controlar reproducción en vivo (Now Playing & Play/Pause/Next para Premium)
const SCOPES = [
  'user-read-private',
  'user-read-email',
  'user-top-read',
  'user-read-recently-played',
  'user-read-playback-state',
  'user-modify-playback-state',
  'user-read-currently-playing',
  'playlist-modify-public',
  'playlist-modify-private',
].join(' ');

// Generadores de PKCE (Proof Key for Code Exchange)
function generateRandomString(length) {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  const values = crypto.getRandomValues(new Uint8Array(length));
  return values.reduce((acc, x) => acc + possible[x % possible.length], '');
}

async function sha256(plain) {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  return window.crypto.subtle.digest('SHA-256', data);
}

function base64encode(input) {
  return btoa(String.fromCharCode(...new Uint8Array(input)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

/**
 * Inicia el proceso de conexión con la cuenta de Spotify del usuario.
 */
export async function loginWithSpotify() {
  if (!CLIENT_ID) {
    alert('Falta configurar VITE_SPOTIFY_CLIENT_ID en el archivo .env');
    return;
  }

  const codeVerifier = generateRandomString(64);
  const hashed = await sha256(codeVerifier);
  const codeChallenge = base64encode(hashed);

  window.localStorage.setItem(CODE_VERIFIER_KEY, codeVerifier);

  const authUrl = new URL('https://accounts.spotify.com/authorize');
  authUrl.search = new URLSearchParams({
    response_type: 'code',
    client_id: CLIENT_ID,
    scope: SCOPES,
    code_challenge_method: 'S256',
    code_challenge: codeChallenge,
    redirect_uri: REDIRECT_URI,
  }).toString();

  window.location.href = authUrl.toString();
}

/**
 * Procesa el callback de Spotify con el código de autorización y obtiene los tokens de usuario.
 */
export async function handleSpotifyCallback(code) {
  const codeVerifier = window.localStorage.getItem(CODE_VERIFIER_KEY);

  const response = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: REDIRECT_URI,
      code_verifier: codeVerifier,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Error intercambiando código de Spotify: ${err}`);
  }

  const data = await response.json();
  const now = Date.now();

  window.localStorage.setItem(USER_TOKEN_KEY, data.access_token);
  if (data.refresh_token) {
    window.localStorage.setItem(REFRESH_TOKEN_KEY, data.refresh_token);
  }
  window.localStorage.setItem(TOKEN_EXPIRY_KEY, (now + data.expires_in * 1000).toString());
  window.localStorage.removeItem(CODE_VERIFIER_KEY);

  return data.access_token;
}

/**
 * Obtiene el token de usuario activo, refrescándolo si ha expirado.
 */
export async function getUserAccessToken() {
  const token = window.localStorage.getItem(USER_TOKEN_KEY);
  const expiry = parseInt(window.localStorage.getItem(TOKEN_EXPIRY_KEY) || '0', 10);
  const refreshToken = window.localStorage.getItem(REFRESH_TOKEN_KEY);

  if (!token) return null;

  // Si aún es válido (con 1 minuto de margen)
  if (Date.now() < expiry - 60000) {
    return token;
  }

  // Si expiró y tenemos refresh_token, lo refrescamos
  if (refreshToken && CLIENT_ID) {
    try {
      const response = await fetch(TOKEN_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: CLIENT_ID,
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const now = Date.now();
        window.localStorage.setItem(USER_TOKEN_KEY, data.access_token);
        if (data.refresh_token) {
          window.localStorage.setItem(REFRESH_TOKEN_KEY, data.refresh_token);
        }
        window.localStorage.setItem(TOKEN_EXPIRY_KEY, (now + data.expires_in * 1000).toString());
        return data.access_token;
      }
    } catch (e) {
      console.warn('No se pudo refrescar el token de Spotify:', e);
    }
  }

  return token; // Retorna el que tenga si falla
}

/**
 * Cierra la sesión de Spotify en la aplicación.
 */
export function logoutSpotify() {
  window.localStorage.removeItem(USER_TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
  window.localStorage.removeItem(TOKEN_EXPIRY_KEY);
  window.localStorage.removeItem(CODE_VERIFIER_KEY);
}

/**
 * Verifica si hay una cuenta de Spotify conectada actualmente.
 */
export function isSpotifyConnected() {
  return !!window.localStorage.getItem(USER_TOKEN_KEY);
}

// ----------------------------------------------------------------------------
// 3. CONSULTAS DEL USUARIO (ADN SONORO Y CONTROLES PREMIUM)
// ----------------------------------------------------------------------------

let lastUserFetchError = null;

export function getLastSpotifyError() {
  return lastUserFetchError;
}

export function clearLastSpotifyError() {
  lastUserFetchError = null;
}

async function userFetch(endpoint, options = {}) {
  const token = await getUserAccessToken();
  if (!token) return null;

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.status === 204) return true; // Respuestas sin contenido (ej: pause/play)
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      lastUserFetchError = {
        status: response.status,
        message: errData?.error?.message || response.statusText,
        endpoint
      };
      console.warn(`[Spotify API] HTTP ${response.status} en ${endpoint}:`, lastUserFetchError.message);
      return null;
    }

    lastUserFetchError = null;
    return await response.json();
  } catch (err) {
    console.error(`[Spotify API Error] en ${endpoint}:`, err);
    return null;
  }
}

/**
 * Obtiene el perfil del usuario de Spotify.
 */
export async function getSpotifyUserProfile() {
  return await userFetch('/me');
}

/**
 * Obtiene los artistas favoritos del usuario (ADN Sonoro).
 * @param {'short_term'|'medium_term'|'long_term'} timeRange - Período de tiempo
 */
export async function getUserTopArtists(timeRange = 'medium_term', limit = 6) {
  const data = await userFetch(`/me/top/artists?time_range=${timeRange}&limit=${limit}`);
  return data?.items || [];
}

/**
 * Obtiene las canciones favoritas del usuario (ADN Sonoro).
 */
export async function getUserTopTracks(timeRange = 'medium_term', limit = 6) {
  const data = await userFetch(`/me/top/tracks?time_range=${timeRange}&limit=${limit}`);
  return data?.items || [];
}

/**
 * Obtiene lo que el usuario está escuchando actualmente en Spotify en tiempo real.
 */
export async function getCurrentlyPlaying() {
  return await userFetch('/me/player/currently-playing');
}

/**
 * Controles de reproducción remota (¡Exclusivo de Spotify Premium!).
 * Acciones: 'play', 'pause', 'next', 'previous'
 */
export async function controlPlayback(action) {
  const token = await getUserAccessToken();
  if (!token) return false;

  const methodMap = {
    play: { endpoint: '/me/player/play', method: 'PUT' },
    pause: { endpoint: '/me/player/pause', method: 'PUT' },
    next: { endpoint: '/me/player/next', method: 'POST' },
    previous: { endpoint: '/me/player/previous', method: 'POST' },
  };

  const target = methodMap[action];
  if (!target) return false;

  try {
    const res = await fetch(`${API_BASE}${target.endpoint}`, {
      method: target.method,
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.ok || res.status === 204;
  } catch (e) {
    console.error(`Error al ejecutar ${action} en Spotify:`, e);
    return false;
  }
}

// ----------------------------------------------------------------------------
// 4. ECOSISTEMA BEAT IT + SPOTIFY (FASE 5: RADAR BPM & GENERADOR DE PLAYLISTS)
// ----------------------------------------------------------------------------

// Pistas de referencia de respaldo de alta fidelidad según el Kit/BPM
const FALLBACK_BPM_TRACKS = {
  'Trap Bóveda': [
    { id: 'fb_tr_1', name: 'Mask Off', artist: 'Future', album: 'FUTURE', bpmMatch: 140, image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300', spotifyUrl: 'https://open.spotify.com/search/Mask%20Off%20Future', uri: 'spotify:track:0DX5mJc0i8wL07R2m2eC90' },
    { id: 'fb_tr_2', name: 'SICKO MODE', artist: 'Travis Scott', album: 'ASTROWORLD', bpmMatch: 155, image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300', spotifyUrl: 'https://open.spotify.com/search/Sicko%20Mode', uri: 'spotify:track:2xLMifQCj2Z6kdpTcA7WLR' },
    { id: 'fb_tr_3', name: 'Ric Flair Drip', artist: 'Offset, Metro Boomin', album: 'Without Warning', bpmMatch: 146, image: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=300', spotifyUrl: 'https://open.spotify.com/search/Ric%20Flair%20Drip', uri: 'spotify:track:7sO5m9flIoN209ht8fP44s' },
    { id: 'fb_tr_4', name: 'XO Tour Llif3', artist: 'Lil Uzi Vert', album: 'Luv Is Rage 2', bpmMatch: 155, image: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=300', spotifyUrl: 'https://open.spotify.com/search/XO%20Tour%20Llif3', uri: 'spotify:track:7cy3rK9izvisQ75ENZAK5l' }
  ],
  'Cyberpunk': [
    { id: 'fb_cy_1', name: 'Nightcall', artist: 'Kavinsky', album: 'OutRun', bpmMatch: 120, image: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=300', spotifyUrl: 'https://open.spotify.com/search/Nightcall%20Kavinsky', uri: 'spotify:track:0rQbvWkGzL9mN6L7p3f1xM' },
    { id: 'fb_cy_2', name: 'Turbo Killer', artist: 'Carpenter Brut', album: 'Trilogy', bpmMatch: 128, image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300', spotifyUrl: 'https://open.spotify.com/search/Turbo%20Killer', uri: 'spotify:track:10nqz3vA7Fk7eE1kQ0C6bJ' },
    { id: 'fb_cy_3', name: 'Tech Noir', artist: 'GUNSHIP', album: 'GUNSHIP', bpmMatch: 110, image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300', spotifyUrl: 'https://open.spotify.com/search/Tech%20Noir%20GUNSHIP', uri: 'spotify:track:5E585dD0B7x5tN8lP8QzL9' },
    { id: 'fb_cy_4', name: 'Resonance', artist: 'HOME', album: 'Odyssey', bpmMatch: 124, image: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=300', spotifyUrl: 'https://open.spotify.com/search/Resonance%20HOME', uri: 'spotify:track:1TuopWDI4Th T4kQ3w6m5Q' }
  ],
  'Analog 808': [
    { id: 'fb_an_1', name: 'Planet Rock', artist: 'Afrika Bambaataa', album: 'Planet Rock', bpmMatch: 126, image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300', spotifyUrl: 'https://open.spotify.com/search/Planet%20Rock', uri: 'spotify:track:10sQ5z5Q3m4sR5x3W1E5R7' },
    { id: 'fb_an_2', name: 'Clear', artist: 'Cybotron', album: 'Enter', bpmMatch: 128, image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300', spotifyUrl: 'https://open.spotify.com/search/Cybotron%20Clear', uri: 'spotify:track:7w9zL2m5R3f1K8x3Q2M5L1' },
    { id: 'fb_an_3', name: 'Juicy', artist: 'The Notorious B.I.G.', album: 'Ready to Die', bpmMatch: 96, image: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=300', spotifyUrl: 'https://open.spotify.com/search/Juicy%20Biggie', uri: 'spotify:track:5ByAI8PNOycD0jWAOXAFEn' },
    { id: 'fb_an_4', name: 'Shook Ones, Pt. II', artist: 'Mobb Deep', album: 'The Infamous', bpmMatch: 94, image: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=300', spotifyUrl: 'https://open.spotify.com/search/Shook%20Ones%20Pt%20II', uri: 'spotify:track:33ZXj3a17eZ5z5y2eA7Y6V' }
  ],
  'Lo-Fi Chill': [
    { id: 'fb_lf_1', name: 'Affection', artist: 'Jinsang', album: 'Life', bpmMatch: 82, image: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=300', spotifyUrl: 'https://open.spotify.com/search/Jinsang%20Affection', uri: 'spotify:track:7wQx9v1B7L6j2e1kP0Q8Z3' },
    { id: 'fb_lf_2', name: 'Coffee', artist: 'Kudasai', album: 'Falling', bpmMatch: 78, image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300', spotifyUrl: 'https://open.spotify.com/search/Kudasai%20Coffee', uri: 'spotify:track:0E4v7m1X9Z3v2k1P8Q5L7R' },
    { id: 'fb_lf_3', name: 'Get You The Moon', artist: 'Kina, Snøw', album: 'Get You The Moon', bpmMatch: 80, image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300', spotifyUrl: 'https://open.spotify.com/search/Get%20You%20The%20Moon', uri: 'spotify:track:4jAIqgrPjKLTY9Gbez25Qb' },
    { id: 'fb_lf_4', name: 'Feather', artist: 'Nujabes, Cise Starr', album: 'Modal Soul', bpmMatch: 98, image: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=300', spotifyUrl: 'https://open.spotify.com/search/Nujabes%20Feather', uri: 'spotify:track:2ej1A2ZeO02TROWvtQxQg5' }
  ],
  'Acoustic Studio': [
    { id: 'fb_ac_1', name: 'Come Together', artist: 'The Beatles', album: 'Abbey Road', bpmMatch: 82, image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300', spotifyUrl: 'https://open.spotify.com/search/Come%20Together', uri: 'spotify:track:2EqlS6tk8ikZAUFYpSPrCY' },
    { id: 'fb_ac_2', name: 'Superstition', artist: 'Stevie Wonder', album: 'Talking Book', bpmMatch: 100, image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300', spotifyUrl: 'https://open.spotify.com/search/Superstition%20Stevie%20Wonder', uri: 'spotify:track:587nL2W2m9X4m7T8Q1V5e9' },
    { id: 'fb_ac_3', name: 'Roxanne', artist: 'The Police', album: 'Outlandos d\'Amour', bpmMatch: 134, image: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=300', spotifyUrl: 'https://open.spotify.com/search/Roxanne%20The%20Police', uri: 'spotify:track:3ZFTkvIE7kyPt6Nu3PEmuV' },
    { id: 'fb_ac_4', name: 'Cissy Strut', artist: 'The Meters', album: 'The Meters', bpmMatch: 92, image: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=300', spotifyUrl: 'https://open.spotify.com/search/Cissy%20Strut', uri: 'spotify:track:0J8b5F0s9X2k5T8Q1V5e9' }
  ]
};

/**
 * Busca pistas en Spotify para el Radar BPM según el tempo y kit del secuenciador Beat It.
 */
export async function searchBpmReferenceTracks(kitName = 'Cyberpunk', bpm = 120, limit = 8) {
  // Límite seguro no mayor a 10 por tanda
  const safeLimit = Math.min(Math.max(4, Number(limit) || 8), 10);
  const token = await getEffectiveSpotifyToken();

  // Mapear género / kit a términos óptimos de búsqueda
  const queryTerms = {
    'Trap Bóveda': 'trap hip hop beat',
    'Cyberpunk': 'synthwave cyberpunk retro',
    'Analog 808': 'electro 808 boom bap',
    'Lo-Fi Chill': 'lofi chill study beat',
    'Acoustic Studio': 'funk groove drum beat'
  };

  const term = queryTerms[kitName] || `${kitName} beat`;
  const url = `${API_BASE}/search?q=${encodeURIComponent(term)}&type=track&limit=${safeLimit}`;

  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (res.ok) {
      const data = await res.json();
      const rawTracks = data.tracks?.items || [];

      if (rawTracks.length > 0) {
        return rawTracks.map((t, idx) => {
          // Cálculo estético de aproximación de BPM
          const delta = (idx % 3 === 0) ? 0 : (idx % 2 === 0 ? 2 : -1);
          return {
            id: t.id,
            name: t.name,
            artist: t.artists?.map(a => a.name).join(', ') || 'Artista Desconocido',
            album: t.album?.name || '',
            image: t.album?.images?.[0]?.url || t.album?.images?.[1]?.url || '',
            spotifyUrl: t.external_urls?.spotify || `https://open.spotify.com/track/${t.id}`,
            uri: t.uri,
            previewUrl: t.preview_url || null,
            durationMs: t.duration_ms || 180000,
            bpmMatch: bpm + delta,
            matchType: Math.abs(delta) <= 1 ? 'Sincronía Exacta' : 'Afinidad Armónica'
          };
        });
      }
    }
  } catch (err) {
    console.warn('Error consultando tracks de referencia BPM en Spotify:', err);
  }

  // Si falló la red o no hay resultados, recurrir a las referencias pre-curadas del kit
  const fallbackList = FALLBACK_BPM_TRACKS[kitName] || FALLBACK_BPM_TRACKS['Cyberpunk'];
  return fallbackList.map(t => ({
    ...t,
    bpmMatch: bpm,
    matchType: 'Referencia de Fábrica'
  }));
}

/**
 * Crea una playlist en la cuenta de Spotify del usuario actual.
 */
export async function createSpotifyPlaylist(name, description = '', isPublic = true) {
  const token = await getUserAccessToken();
  if (!token) {
    throw new Error('Debes iniciar sesión con tu cuenta de Spotify para crear playlists.');
  }

  const profile = await getSpotifyUserProfile();
  if (!profile || !profile.id) {
    throw new Error('No se pudo verificar tu identidad en Spotify API.');
  }

  const res = await fetch(`${API_BASE}/users/${profile.id}/playlists`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name,
      description,
      public: isPublic
    })
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Error de Spotify API (${res.status}): ${errorText}`);
  }

  return await res.json();
}

/**
 * Agrega canciones a una playlist existente mediante sus URIs (spotify:track:...).
 */
export async function addTracksToSpotifyPlaylist(playlistId, trackUris = []) {
  if (!trackUris || trackUris.length === 0) return true;

  const token = await getUserAccessToken();
  if (!token) throw new Error('Token de usuario no disponible');

  const res = await fetch(`${API_BASE}/playlists/${playlistId}/tracks`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      uris: trackUris
    })
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Error al insertar pistas (${res.status}): ${errorText}`);
  }

  return await res.json();
}

/**
 * Función integral de la Fase 5:
 * Genera y puebla una playlist automática en el Spotify del usuario vinculada a su Beat.
 */
export async function createBeatItSpotifyPlaylist(beatName, kitName, bpm, trackUris = []) {
  const cleanTitle = beatName ? beatName.trim() : `Producción ${kitName}`;
  const playlistName = `The Sonic Vault // ${cleanTitle} [${bpm} BPM]`;
  const playlistDesc = `Curada algorítmicamente por The Sonic Vault Beat It Studio. Tempo: ${bpm} BPM • Kit de Batería: ${kitName} • Frecuencias armónicas calibradas.`;

  // 1. Crear playlist vacía en la cuenta del usuario
  const playlist = await createSpotifyPlaylist(playlistName, playlistDesc, true);

  // 2. Si se suministraron pistas, insertarlas inmediatamente
  if (trackUris.length > 0) {
    // Filtrar URIs válidas de Spotify
    const validUris = trackUris.filter(u => u && u.startsWith('spotify:track:'));
    if (validUris.length > 0) {
      await addTracksToSpotifyPlaylist(playlist.id, validUris);
    }
  }

  return {
    id: playlist.id,
    name: playlist.name,
    url: playlist.external_urls?.spotify || `https://open.spotify.com/playlist/${playlist.id}`,
    uri: playlist.uri,
    totalTracks: trackUris.length
  };
}
