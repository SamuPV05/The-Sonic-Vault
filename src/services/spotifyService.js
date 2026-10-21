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
  const token = await getEffectiveSpotifyToken();

  const url = `${API_BASE}/search?q=${encodeURIComponent(query.trim())}&type=artist&limit=${limit}`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

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

async function userFetch(endpoint, options = {}) {
  const token = await getUserAccessToken();
  if (!token) return null;

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.status === 204) return true; // Respuestas sin contenido (ej: pause/play)
  if (!response.ok) return null;
  return await response.json();
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
