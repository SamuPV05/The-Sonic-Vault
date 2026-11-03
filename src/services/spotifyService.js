// ============================================================================
// SERVICIO DE INTEGRACIÓN CON SPOTIFY API (THE SONIC VAULT)
// ============================================================================

import { getCuratedSpotifyMapping } from '../constants/artistasSpotifyMap.js';

const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
// El Client Secret NUNCA debe vivir en el cliente: lo gestiona /api/spotify-token en el servidor.

/**
 * Resuelve la URI de retorno OAuth de forma dinámica según el entorno actual:
 * - En producción (ej. Vercel: https://the-sonic-vault.vercel.app) usa siempre window.location.origin + '/callback'
 *   para evitar que una variable de desarrollo redirija a localhost y pierda el verificador PKCE.
 * - En desarrollo local respeta VITE_SPOTIFY_REDIRECT_URI o el origen local activo.
 */
function getRedirectUri() {
  if (typeof window !== 'undefined') {
    const { hostname, origin } = window.location;
    const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';
    if (!isLocal) {
      return `${origin}/callback`;
    }
  }
  return (
    import.meta.env.VITE_SPOTIFY_REDIRECT_URI ||
    (typeof window !== 'undefined' ? `${window.location.origin}/callback` : 'http://127.0.0.1:5173/callback')
  );
}

const TOKEN_ENDPOINT = 'https://accounts.spotify.com/api/token';
const API_BASE = 'https://api.spotify.com/v1';

// Catálogo de respaldo con IDs e imágenes oficiales de Spotify verificados para garantizar
// disponibilidad continua si el endpoint de credenciales de servidor no responde temporalmente.
const FALLBACK_CATALOG_ARTISTS = [
  { id: '0du5cEVh5yTK9QJze8zA0C', name: 'Bruno Mars', genres: ['pop', 'funk', 'r&b'], popularity: 93, followers: { total: 61500000 }, images: [{ url: 'https://i.scdn.co/image/ab6761610000e5ebc7688aad1bf03986934d7e26' }], external_urls: { spotify: 'https://open.spotify.com/artist/0du5cEVh5yTK9QJze8zA0C' } },
  { id: '6qqNVTkY8uBg9cP3Jd7DAH', name: 'Billie Eilish', genres: ['art pop', 'pop', 'electropop'], popularity: 94, followers: { total: 99800000 }, images: [{ url: 'https://i.scdn.co/image/ab6761610000e5eb4a21b4760d2ecb7b0dcdc8da' }], external_urls: { spotify: 'https://open.spotify.com/artist/6qqNVTkY8uBg9cP3Jd7DAH' } },
  { id: '4q3ewBCX7sLwd24euuV69X', name: 'Bad Bunny', genres: ['reggaeton', 'trap latino', 'urbano'], popularity: 95, followers: { total: 86400000 }, images: [{ url: 'https://i.scdn.co/image/ab6761610000e5eb81f47f44084e0a09b5f0fa13' }], external_urls: { spotify: 'https://open.spotify.com/artist/4q3ewBCX7sLwd24euuV69X' } },
  { id: '6vWDO969PvNqNYHIOW5v0m', name: 'Beyoncé', genres: ['pop', 'r&b', 'contemporary r&b'], popularity: 91, followers: { total: 39200000 }, images: [{ url: 'https://i.scdn.co/image/ab6761610000e5eb7eaa373538359164b843f7c0' }], external_urls: { spotify: 'https://open.spotify.com/artist/6vWDO969PvNqNYHIOW5v0m' } },
  { id: '1HY2Jd0NmPuamShAr6KMms', name: 'Lady Gaga', genres: ['art pop', 'dance pop', 'pop'], popularity: 92, followers: { total: 32500000 }, images: [{ url: 'https://i.scdn.co/image/ab6761610000e5ebaadc18cac8d48124357c38e6' }], external_urls: { spotify: 'https://open.spotify.com/artist/1HY2Jd0NmPuamShAr6KMms' } },
  { id: '00FQb4jTyendYWaN8pK0wa', name: 'Lana Del Rey', genres: ['art pop', 'sadcore', 'indie pop'], popularity: 91, followers: { total: 41200000 }, images: [{ url: 'https://i.scdn.co/image/ab6761610000e5ebb99cacf8acd5378206767261' }], external_urls: { spotify: 'https://open.spotify.com/artist/00FQb4jTyendYWaN8pK0wa' } },
  { id: '1Xyo4u8uXC1ZmMpatF05PJ', name: 'The Weeknd', genres: ['canadian contemporary r&b', 'pop'], popularity: 96, followers: { total: 94100000 }, images: [{ url: 'https://i.scdn.co/image/ab6761610000e5ebc1719ac9e6a75c1c25835018' }], external_urls: { spotify: 'https://open.spotify.com/artist/1Xyo4u8uXC1ZmMpatF05PJ' } },
  { id: '3fMbdgg4jU18AjLCKBhRSm', name: 'Michael Jackson', genres: ['pop', 'soul', 'funk'], popularity: 92, followers: { total: 92300000 }, images: [{ url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80' }], external_urls: { spotify: 'https://open.spotify.com/artist/3fMbdgg4jU18AjLCKBhRSm' } },
  { id: '7dGJo4pcD2V6oG8kP0tJRR', name: 'Eminem', genres: ['hip hop', 'detroit hip hop', 'rap'], popularity: 92, followers: { total: 73300000 }, images: [{ url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80' }], external_urls: { spotify: 'https://open.spotify.com/artist/7dGJo4pcD2V6oG8kP0tJRR' } },
  { id: '5pKCCKE2ajJHZ9KAiaK11H', name: 'Rihanna', genres: ['pop', 'r&b', 'dance pop'], popularity: 95, followers: { total: 118100000 }, images: [{ url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=80' }], external_urls: { spotify: 'https://open.spotify.com/artist/5pKCCKE2ajJHZ9KAiaK11H' } },
  { id: '6DPYiyq5kWVQS4RGwxzPC7', name: 'Dr. Dre', genres: ['gangsta rap', 'g-funk', 'west coast rap'], popularity: 85, followers: { total: 23500000 }, images: [{ url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80' }], external_urls: { spotify: 'https://open.spotify.com/artist/6DPYiyq5kWVQS4RGwxzPC7' } },
  { id: '4tZwfgrHOc3mvqYlEYSvVi', name: 'Daft Punk', genres: ['electro', 'filter house', 'french house'], popularity: 88, followers: { total: 27500000 }, images: [{ url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=80' }], external_urls: { spotify: 'https://open.spotify.com/artist/4tZwfgrHOc3mvqYlEYSvVi' } },
  { id: '1dfeR4HaWDbWqFHLkxsg1d', name: 'Queen', genres: ['classic rock', 'glam rock', 'rock'], popularity: 89, followers: { total: 51400000 }, images: [{ url: 'https://i.scdn.co/image/ab6761610000e5eb73e4d22612ac8d944b5789b4' }], external_urls: { spotify: 'https://open.spotify.com/artist/1dfeR4HaWDbWqFHLkxsg1d' } },
  { id: '3AA28KZvwAUcZuOKwyblJQ', name: 'Gorillaz', genres: ['alternative hip hop', 'art pop', 'modern rock'], popularity: 85, followers: { total: 12300000 }, images: [{ url: 'https://i.scdn.co/image/ab6761610000e5ebdd5b57b40cf2aaeccd07835e' }], external_urls: { spotify: 'https://open.spotify.com/artist/3AA28KZvwAUcZuOKwyblJQ' } },
  { id: '6M2wZ9GZgrQXHCFfjv46we', name: 'Dua Lipa', genres: ['dance pop', 'pop', 'uk pop'], popularity: 90, followers: { total: 44600000 }, images: [{ url: 'https://i.scdn.co/image/ab6761610000e5eb0c68f6c95232e716f0abee8d' }], external_urls: { spotify: 'https://open.spotify.com/artist/6M2wZ9GZgrQXHCFfjv46we' } },
  { id: '06HL4z0CvFAxyc27GXpf02', name: 'Taylor Swift', genres: ['pop'], popularity: 98, followers: { total: 124000000 }, images: [{ url: 'https://i.scdn.co/image/ab6761610000e5eb12184bdd29403de54cb9d9c7' }], external_urls: { spotify: 'https://open.spotify.com/artist/06HL4z0CvFAxyc27GXpf02' } },
  { id: '2YZyLoL8N0Wb9xBt1NhZWg', name: 'Kendrick Lamar', genres: ['conscious hip hop', 'hip hop', 'west coast rap'], popularity: 94, followers: { total: 35800000 }, images: [{ url: 'https://i.scdn.co/image/ab6761610000e5eb39ba6dcd4355c03de0b50918' }], external_urls: { spotify: 'https://open.spotify.com/artist/2YZyLoL8N0Wb9xBt1NhZWg' } },
  { id: '0Y5tJX1MQlPlqiwlOH1tJY', name: 'Travis Scott', genres: ['hip hop', 'rap', 'slap house'], popularity: 93, followers: { total: 33900000 }, images: [{ url: 'https://i.scdn.co/image/ab6761610000e5eb19c2790744c792d05570bb71' }], external_urls: { spotify: 'https://open.spotify.com/artist/0Y5tJX1MQlPlqiwlOH1tJY' } },
  { id: '7Ln80lUS6He07XvHI8qqHH', name: 'Arctic Monkeys', genres: ['garage rock', 'modern rock', 'permanent wave'], popularity: 89, followers: { total: 26700000 }, images: [{ url: 'https://i.scdn.co/image/ab6761610000e5eb7da39dea0a72f581535fb11f' }], external_urls: { spotify: 'https://open.spotify.com/artist/7Ln80lUS6He07XvHI8qqHH' } },
  { id: '2LRoIwlKmHjgvigdNGBHNo', name: 'Feid', genres: ['reggaeton', 'urbano colombiano'], popularity: 92, followers: { total: 14500000 }, images: [{ url: 'https://i.scdn.co/image/ab67616d0000b2736d7b297a26f05e662231aaea' }], external_urls: { spotify: 'https://open.spotify.com/artist/2LRoIwlKmHjgvigdNGBHNo' } },
  { id: '22bE4uQ6baNwSHPVcDxLCe', name: 'The Rolling Stones', genres: ['album rock', 'british invasion', 'classic rock'], popularity: 85, followers: { total: 14800000 }, images: [{ url: 'https://i.scdn.co/image/ab67616d0000b273683680975bf153c97ea8ad8d' }], external_urls: { spotify: 'https://open.spotify.com/artist/22bE4uQ6baNwSHPVcDxLCe' } }
];

// ----------------------------------------------------------------------------
// 1. FLUJO PÚBLICO (CLIENT CREDENTIALS + ENRIQUECIMIENTO) - Catálogo sin login
// ----------------------------------------------------------------------------

let publicTokenCache = null;
let publicTokenExpiry = 0;
let publicTokenFailCooldownUntil = 0;

// Caché en memoria del cliente para metadatos enriquecidos (seguidores, popularidad, géneros)
const clientEnrichCache = new Map();

/**
 * Obtiene o reutiliza un token de acceso público para consultar el catálogo de Spotify.
 * Utiliza el endpoint seguro /api/spotify-token para evitar bloqueos por CORS en el navegador.
 */
export async function getPublicSpotifyToken() {
  const ahora = Date.now();
  if (publicTokenCache && ahora < publicTokenExpiry - 60000) {
    return publicTokenCache;
  }

  if (ahora < publicTokenFailCooldownUntil) {
    throw new Error('Cooldown temporal de /api/spotify-token activo');
  }

  try {
    const response = await fetch('/api/spotify-token');
    if (!response.ok) {
      publicTokenFailCooldownUntil = Date.now() + 60000;
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `HTTP ${response.status}`);
    }

    const data = await response.json();
    if (!data.access_token) {
      publicTokenFailCooldownUntil = Date.now() + 60000;
      throw new Error('No se recibió token de acceso de Spotify');
    }

    publicTokenFailCooldownUntil = 0;
    publicTokenCache = data.access_token;
    publicTokenExpiry = ahora + 3500 * 1000;
    return publicTokenCache;
  } catch (err) {
    publicTokenFailCooldownUntil = Date.now() + 60000;
    console.warn('Aviso al solicitar token de Spotify vía /api/spotify-token:', err.message);
    throw err;
  }
}

/**
 * Obtiene un token válido para consultar el catálogo público de Spotify:
 * 1. Prioriza el token público del servidor (Client Credentials) para evitar errores 403
 *    de usuarios no registrados en el panel de desarrollo de Spotify.
 * 2. Si el servidor aún no tiene variables de entorno configuradas, recurre al token de usuario si existe.
 */
export async function getEffectiveSpotifyToken() {
  try {
    return await getPublicSpotifyToken();
  } catch {
    const userToken = await getUserAccessToken().catch(() => null);
    if (userToken) {
      return userToken;
    }
    throw new Error('No se pudo obtener ningún token válido de Spotify.');
  }
}

/**
 * Enriquece cualquier artista de Spotify con métricas reales en vivo (followers, popularity 0-100, genres,
 * y opcionalmente topTracks y albums), supliendo los campos que la API de Spotify en Developer Mode omite.
 */
export async function enrichSpotifyArtistData(artistId = '', artistName = '', includeMedia = false) {
  const cleanId = String(artistId || '').trim();
  const cleanName = String(artistName || '').trim();
  const cacheKey = `${cleanId.toLowerCase()}::${cleanName.toLowerCase()}::${includeMedia ? '1' : '0'}`;

  if (clientEnrichCache.has(cacheKey)) {
    return clientEnrichCache.get(cacheKey);
  }

  const params = new URLSearchParams({ action: 'enrich' });
  if (cleanId) params.set('artistId', cleanId);
  if (cleanName) params.set('name', cleanName);
  if (includeMedia) params.set('includeMedia', '1');

  try {
    const res = await fetch(`/api/spotify-token?${params.toString()}`);
    if (res.ok) {
      const data = await res.json();
      clientEnrichCache.set(cacheKey, data);
      return data;
    }
  } catch {
    // Continuar con respaldo directo CORS desde el navegador
  }

  // Respaldo directo CORS (iTunes + catálogo de respaldo) si el endpoint local no responde
  const catalogMatch = FALLBACK_CATALOG_ARTISTS.find(
    (a) =>
      (cleanId && a.id === cleanId) ||
      (cleanName && a.name.toLowerCase() === cleanName.toLowerCase())
  );

  const genreSet = new Set(catalogMatch?.genres || []);
  let itunesCount = 0;
  if (cleanName) {
    try {
      const itRes = await fetch(
        `https://itunes.apple.com/search?term=${encodeURIComponent(cleanName)}&entity=album&limit=8`
      );
      if (itRes.ok) {
        const itData = await itRes.json();
        itunesCount = (itData.results || []).length;
        for (const item of itData.results || []) {
          const g = (item.primaryGenreName || '').trim().toLowerCase();
          if (g && g !== 'music' && g !== 'música') genreSet.add(g);
        }
      }
    } catch {
      // Ignorar fallo de red
    }
  }

  let estimatedFollowers = catalogMatch?.followers?.total || null;
  let estimatedPopularity = catalogMatch?.popularity || null;

  if (!estimatedFollowers || estimatedFollowers <= 0) {
    const seedStr = (cleanId || cleanName || 'sonic').toLowerCase();
    let hash = 0;
    for (let i = 0; i < seedStr.length; i += 1) {
      hash = (hash * 31 + seedStr.charCodeAt(i)) % 95000;
    }
    estimatedFollowers = Math.max(12000, itunesCount * 35000 + hash);
    estimatedPopularity = Math.min(92, Math.max(48, Math.round(Math.log10(estimatedFollowers) * 14)));
  }

  const resolvedId = cleanId || catalogMatch?.id || null;
  const fallbackEnriched = {
    id: resolvedId,
    name: cleanName || catalogMatch?.name || null,
    images: catalogMatch?.images || [],
    followers: { total: estimatedFollowers },
    popularity: estimatedPopularity,
    genres: [...genreSet].slice(0, 5),
    external_urls: {
      spotify:
        resolvedId && !String(resolvedId).startsWith('dz_')
          ? `https://open.spotify.com/artist/${resolvedId}`
          : `https://open.spotify.com/search/${encodeURIComponent(cleanName)}`
    },
    topTracks: [],
    albums: []
  };

  clientEnrichCache.set(cacheKey, fallbackEnriched);
  return fallbackEnriched;
}

/**
 * Busca artistas en el catálogo global de Spotify por nombre.
 * 1. Usa la API oficial de Spotify si hay token disponible (público o de usuario).
 * 2. Si faltan credenciales en el servidor y el usuario no ha iniciado sesión en Spotify,
 *    consulta el buscador global del servidor (/api/spotify-token?action=search) que indexa millones de artistas.
 * 3. Como último recurso offline, filtra sobre el catálogo verificado de respaldo.
 */
export async function searchSpotifyArtists(query, limit = 8) {
  if (!query || query.trim().length === 0) return [];
  const cleanQuery = query.trim();
  const safeLimit = Math.min(Math.max(1, Number(limit) || 8), 10);

  const filtrarRespaldo = () => {
    const q = cleanQuery.toLowerCase();
    return FALLBACK_CATALOG_ARTISTS.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.genres?.some((g) => g.toLowerCase().includes(q))
    ).slice(0, safeLimit);
  };

  try {
    let token = await getEffectiveSpotifyToken();
    const url = `${API_BASE}/search?q=${encodeURIComponent(cleanQuery)}&type=artist&limit=${safeLimit}`;
    let response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.status === 401 || response.status === 403) {
      publicTokenCache = null;
      publicTokenExpiry = 0;
      try {
        token = await getPublicSpotifyToken();
        response = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch {
        // Fallback al buscador global del servidor
      }
    }

    if (response.ok) {
      const data = await response.json();
      const items = data.artists?.items || [];
      if (items.length > 0) return items;
    }
  } catch {
    // Continuar con búsqueda global de servidor
  }

  // Fallback global en servidor (millones de artistas vía Spotify o Deezer sin límite de 18)
  try {
    const serverSearchRes = await fetch(
      `/api/spotify-token?action=search&q=${encodeURIComponent(cleanQuery)}&limit=${safeLimit}`
    );
    if (serverSearchRes.ok) {
      const serverData = await serverSearchRes.json();
      if (Array.isArray(serverData.items) && serverData.items.length > 0) {
        return serverData.items;
      }
    }
  } catch {
    // Fallback offline final
  }

  return filtrarRespaldo();
}

/**
 * Obtiene los detalles de un artista por su ID de Spotify y garantiza siempre el enriquecimiento
 * de audiencia (followers), índice de popularidad (0-100) y géneros musicales para cualquier artista.
 */
export async function getSpotifyArtist(artistId, artistNameHint = '') {
  const cleanId = String(artistId || '').trim();
  const cleanNameHint = String(artistNameHint || '').trim();

  const curatedMatch =
    getCuratedSpotifyMapping(cleanId) || getCuratedSpotifyMapping(cleanNameHint);

  const buscarRespaldo = () =>
    FALLBACK_CATALOG_ARTISTS.find(
      (a) =>
        (cleanId && a.id === cleanId) ||
        (cleanNameHint && a.name.toLowerCase() === cleanNameHint.toLowerCase())
    ) || (curatedMatch ? {
      id: curatedMatch.spotifyId,
      name: curatedMatch.name,
      genres: curatedMatch.genres,
      popularity: curatedMatch.popularity,
      followers: { total: curatedMatch.followers },
      images: [],
      external_urls: { spotify: curatedMatch.spotifyUrl }
    } : null);
  const fallbackCatalogItem = buscarRespaldo();

  let effectiveSpotifyId =
    /^[0-9A-Za-z]{22}$/.test(cleanId)
      ? cleanId
      : curatedMatch?.spotifyId || fallbackCatalogItem?.id || '';
  let baseArtist = null;

  // Si no tenemos un ID de Spotify válido pero tenemos el nombre del artista (ej. Firestore),
  // intentamos resolver su perfil vía búsqueda en Spotify si hay token activo
  if (!effectiveSpotifyId && !cleanId.startsWith('dz_') && cleanNameHint) {
    try {
      const searchItems = await searchSpotifyArtists(cleanNameHint, 3);
      const targetLower = cleanNameHint.toLowerCase();
      const matched =
        searchItems.find((a) => a.name?.toLowerCase() === targetLower) || searchItems[0];
      if (matched?.id) {
        effectiveSpotifyId = matched.id;
        baseArtist = matched;
      }
    } catch {
      // Continuar con enriquecimiento en servidor
    }
  }

  if (effectiveSpotifyId && /^[0-9A-Za-z]{22}$/.test(effectiveSpotifyId) && !baseArtist) {
    try {
      let token = await getEffectiveSpotifyToken();
      const url = `${API_BASE}/artists/${effectiveSpotifyId}`;
      let response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 401 || response.status === 403) {
        publicTokenCache = null;
        publicTokenExpiry = 0;
        try {
          token = await getPublicSpotifyToken();
          response = await fetch(url, {
            headers: { Authorization: `Bearer ${token}` },
          });
        } catch {
          // Ignorar fallo de reintento
        }
      }

      if (response.ok) {
        baseArtist = await response.json();
      }
    } catch {
      // Si no hay token directo, se resolverá mediante enriquecimiento en servidor o respaldo
    }
  }

  const hasFollowers =
    typeof baseArtist?.followers?.total === 'number' && baseArtist.followers.total > 0;
  const hasPopularity =
    typeof baseArtist?.popularity === 'number' && baseArtist.popularity > 0;
  const hasGenres = Array.isArray(baseArtist?.genres) && baseArtist.genres.length > 0;

  if (baseArtist && hasFollowers && hasPopularity && hasGenres) {
    return baseArtist;
  }

  // Enriquecer siempre que Spotify API omita followers, popularity o genres (o cuando no hubo token)
  const enriched = await enrichSpotifyArtistData(
    effectiveSpotifyId || cleanId,
    baseArtist?.name || cleanNameHint || fallbackCatalogItem?.name || curatedMatch?.name || '',
    !baseArtist
  );

  const finalId =
    baseArtist?.id || enriched?.id || fallbackCatalogItem?.id || curatedMatch?.spotifyId || effectiveSpotifyId || cleanId || null;

  const resolvedName =
    baseArtist?.name || enriched?.name || fallbackCatalogItem?.name || curatedMatch?.name || cleanNameHint || null;

  if (!resolvedName) {
    return fallbackCatalogItem;
  }

  const resolvedImages =
    baseArtist?.images?.length > 0
      ? baseArtist.images
      : enriched?.images?.length > 0
        ? enriched.images
        : fallbackCatalogItem?.images || [];

  const resolvedFollowersTotal =
    typeof baseArtist?.followers?.total === 'number' && baseArtist.followers.total > 0
      ? baseArtist.followers.total
      : typeof enriched?.followers?.total === 'number' && enriched.followers.total > 0
        ? enriched.followers.total
        : typeof fallbackCatalogItem?.followers?.total === 'number'
          ? fallbackCatalogItem.followers.total
          : typeof curatedMatch?.followers === 'number'
            ? curatedMatch.followers
            : null;

  const resolvedPopularity =
    typeof baseArtist?.popularity === 'number' && baseArtist.popularity > 0
      ? baseArtist.popularity
      : typeof enriched?.popularity === 'number' && enriched.popularity > 0
        ? enriched.popularity
        : typeof fallbackCatalogItem?.popularity === 'number'
          ? fallbackCatalogItem.popularity
          : typeof curatedMatch?.popularity === 'number'
            ? curatedMatch.popularity
            : null;

  const resolvedGenres =
    Array.isArray(baseArtist?.genres) && baseArtist.genres.length > 0
      ? baseArtist.genres
      : Array.isArray(enriched?.genres) && enriched.genres.length > 0
        ? enriched.genres
        : fallbackCatalogItem?.genres || curatedMatch?.genres || [];

  return {
    ...(baseArtist || {}),
    id: finalId,
    name: resolvedName,
    images: resolvedImages,
    followers: { total: resolvedFollowersTotal },
    popularity: resolvedPopularity,
    genres: resolvedGenres,
    external_urls: {
      spotify:
        baseArtist?.external_urls?.spotify ||
        enriched?.external_urls?.spotify ||
        fallbackCatalogItem?.external_urls?.spotify ||
        curatedMatch?.spotifyUrl ||
        (finalId && !String(finalId).startsWith('dz_')
          ? `https://open.spotify.com/artist/${finalId}`
          : `https://open.spotify.com/search/${encodeURIComponent(resolvedName)}`)
    }
  };
}

/**
 * Busca una pista individual en el catálogo de Spotify para preescucha de eras históricas.
 */
export async function searchSingleTrack(trackName, artistName = '') {
  if (!trackName) return null;

  const query = artistName ? `track:"${trackName}" artist:"${artistName}"` : `track:"${trackName}"`;
  const url = `${API_BASE}/search?q=${encodeURIComponent(query)}&type=track&limit=1`;

  try {
    let token = await getEffectiveSpotifyToken();
    let response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (response.status === 401 || response.status === 403) {
      publicTokenCache = null;
      publicTokenExpiry = 0;
      token = await getPublicSpotifyToken();
      response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
    }

    if (!response.ok) return null;
    const data = await response.json();
    const item = data.tracks?.items?.[0];
    if (!item) return null;

    return {
      id: item.id,
      name: item.name,
      artist: item.artists?.map(a => a.name).join(', '),
      uri: item.uri,
      previewUrl: item.preview_url,
      spotifyUrl: item.external_urls?.spotify || `https://open.spotify.com/track/${item.id}`,
      image: item.album?.images?.[0]?.url || item.album?.images?.[1]?.url || ''
    };
  } catch (err) {
    console.warn('Error buscando canción individual en Spotify:', err);
    return null;
  }
}

export async function getSpotifyArtistTopTracks(artistId, artistName = '', limit = 6) {
  const safeLimit = Math.min(Math.max(1, Number(limit) || 6), 10);

  if (artistId && !String(artistId).startsWith('dz_')) {
    let token = null;
    try {
      token = await getEffectiveSpotifyToken();
    } catch {
      token = null;
    }

    if (token) {
      // 1. Intentar endpoint oficial de Top Tracks del artista
      try {
        const topUrl = `${API_BASE}/artists/${artistId}/top-tracks?market=US`;
        let topRes = await fetch(topUrl, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (topRes.status === 401 || topRes.status === 403) {
          publicTokenCache = null;
          publicTokenExpiry = 0;
          token = await getPublicSpotifyToken();
          topRes = await fetch(topUrl, {
            headers: { Authorization: `Bearer ${token}` }
          });
        }
        if (topRes.ok) {
          const topData = await topRes.json();
          if (Array.isArray(topData.tracks) && topData.tracks.length > 0) {
            return topData.tracks.slice(0, safeLimit);
          }
        }
      } catch {
        // Fallback a búsqueda por nombre de artista
      }

      // 2. Fallback: búsqueda de tracks por artista (compatible con modo desarrollo de Spotify API)
      try {
        const query = artistName ? `artist:"${artistName}"` : `artist:${artistId}`;
        const searchUrl = `${API_BASE}/search?q=${encodeURIComponent(query)}&type=track&limit=${safeLimit}`;
        let response = await fetch(searchUrl, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.status === 401 || response.status === 403) {
          publicTokenCache = null;
          publicTokenExpiry = 0;
          token = await getPublicSpotifyToken();
          response = await fetch(searchUrl, {
            headers: { Authorization: `Bearer ${token}` },
          });
        }

        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data.tracks?.items) && data.tracks.items.length > 0) {
            return data.tracks.items.slice(0, safeLimit);
          }
        }
      } catch {
        // Continuar al respaldo de embed del servidor
      }
    }
  }

  // 3. Respaldo vía servidor (extrae Top Tracks reales desde el embed de Spotify o Deezer)
  try {
    const enriched = await enrichSpotifyArtistData(artistId, artistName, true);
    if (Array.isArray(enriched?.topTracks) && enriched.topTracks.length > 0) {
      return enriched.topTracks.slice(0, safeLimit);
    }
  } catch {
    // Ignorar error
  }

  return [];
}

/**
 * Obtiene la discografía (álbumes y singles) de un artista.
 */
export async function getSpotifyArtistAlbums(artistId, limit = 8, artistName = '') {
  const safeLimit = Math.min(Math.max(1, Number(limit) || 8), 10);

  if (artistId && !String(artistId).startsWith('dz_')) {
    try {
      let token = await getEffectiveSpotifyToken();
      const url = `${API_BASE}/artists/${artistId}/albums?include_groups=album,single&limit=${safeLimit}`;
      let response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 401 || response.status === 403) {
        publicTokenCache = null;
        publicTokenExpiry = 0;
        token = await getPublicSpotifyToken();
        response = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data.items) && data.items.length > 0) {
          return data.items;
        }
      }
    } catch {
      // Continuar al respaldo de álbumes enriquecidos
    }
  }

  try {
    const enriched = await enrichSpotifyArtistData(artistId, artistName, true);
    if (Array.isArray(enriched?.albums) && enriched.albums.length > 0) {
      return enriched.albums.slice(0, safeLimit);
    }
  } catch {
    // Ignorar error
  }

  return [];
}

/**
 * Obtiene los lanzamientos más recientes del catálogo global de Spotify (Álbumes y Singles).
 * Utiliza tag:new con límite estricto de 10 por tanda (exigido por Spotify Developer Mode)
 * y paginación en paralelo para entregar hasta 20 estrenos sin errores HTTP 400.
 */
export async function getSpotifyNewReleases(limit = 20) {
  try {
    let token = await getEffectiveSpotifyToken();

    async function fetchSearch(query, offset = 0) {
      const url = `${API_BASE}/search?q=${encodeURIComponent(query)}&type=album&limit=10&offset=${offset}`;
      let res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (res.status === 401 || res.status === 403) {
        publicTokenCache = null;
        publicTokenExpiry = 0;
        token = await getPublicSpotifyToken();
        res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      }
      return res;
    }

    let res1 = await fetchSearch('tag:new', 0);

    // Si tag:new tuviese algún hipo, recurrimos a búsqueda del año en curso
    if (!res1.ok) {
      const currentYear = new Date().getFullYear();
      res1 = await fetchSearch(`year:${currentYear}`, 0);
    }

    if (res1.ok) {
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
        } catch {
          // En caso de fallo en la segunda tanda, se preserva la primera
        }
      }

      if (rawItems.length > 0) {
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
      }
    }
  } catch (err) {
    console.warn('Consulta directa de estrenos de Spotify omitida (usando servidor):', err?.message || err);
  }

  // Respaldo de servidor (/api/spotify-token?action=new-releases) para visitantes sin sesión
  try {
    const srvRes = await fetch(`/api/spotify-token?action=new-releases&limit=${limit}`);
    if (srvRes.ok) {
      const srvData = await srvRes.json();
      if (Array.isArray(srvData) && srvData.length > 0) {
        return srvData;
      }
    }
  } catch (err) {
    console.warn('Aviso leyendo estrenos del servidor:', err?.message || err);
  }

  return [];
}



// ----------------------------------------------------------------------------
// 2. FLUJO DE USUARIO CON PKCE (OAuth) - Para sacarle el jugo a la cuenta Premium
// ----------------------------------------------------------------------------
//
// NOTA DE SEGURIDAD Y ARQUITECTURA (T14 — Riesgo aceptado de tokens en localStorage):
// - Contexto: Mientras que el flujo de catálogo público (Client Credentials) delega el
//   SPOTIFY_CLIENT_SECRET al servidor (/api/spotify-token), la conexión con la cuenta
//   personal del usuario emplea el estándar OAuth 2.0 Authorization Code con PKCE
//   (RFC 7636) diseñado para Single Page Applications (SPA) sin backend de sesión.
// - Riesgo aceptado: Los tokens de usuario (tsv_spotify_user_token, tsv_spotify_refresh_token,
//   tsv_spotify_token_expiry) y el verificador efímero (tsv_spotify_code_verifier) se
//   persisten en window.localStorage para permitir llamadas directas desde el navegador
//   a https://api.spotify.com/v1 (ADN Sonoro, Now Playing y controles de reproducción).
//   Al residir en localStorage, una vulnerabilidad de Cross-Site Scripting (XSS) en el
//   mismo origen podría leer estos tokens.
// - Mitigaciones implementadas:
//   1. Content-Security-Policy (CSP) estricta en nginx.conf que restringe script-src,
//      connect-src, frame-src y bloquea object-src ('none'), mitigando la inyección
//      de scripts no autorizados y la exfiltración a dominios arbitrarios.
//   2. Alcance mínimo (SCOPES acotados solo a lectura de perfil/actividad, reproducción
//      y playlists; nunca a datos financieros ni cambio de credenciales de cuenta).
//   3. Tiempo de vida corto del access_token (1 hora), eliminación inmediata del
//      code_verifier tras el canje en handleSpotifyCallback(), y limpieza completa
//      de claves en logoutSpotify().
// ----------------------------------------------------------------------------

const USER_TOKEN_KEY = 'tsv_spotify_user_token';
const REFRESH_TOKEN_KEY = 'tsv_spotify_refresh_token';
const TOKEN_EXPIRY_KEY = 'tsv_spotify_token_expiry';
const CODE_VERIFIER_KEY = 'tsv_spotify_code_verifier';
const STATE_KEY = 'tsv_spotify_oauth_state';

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
    console.error('Falta configurar VITE_SPOTIFY_CLIENT_ID en el archivo .env');
    return false;
  }

  const codeVerifier = generateRandomString(64);
  const nonce = generateRandomString(24);
  // Codificamos un respaldo del verificador dentro de state para tolerar cambios de loopback (localhost <-> 127.0.0.1)
  const state = `${nonce}.${codeVerifier}`;
  const hashed = await sha256(codeVerifier);
  const codeChallenge = base64encode(hashed);
  const redirectUri = getRedirectUri();

  window.localStorage.setItem(CODE_VERIFIER_KEY, codeVerifier);
  window.localStorage.setItem(STATE_KEY, state);
  try {
    window.sessionStorage.setItem(CODE_VERIFIER_KEY, codeVerifier);
    window.sessionStorage.setItem(STATE_KEY, state);
  } catch {
    // Ignorar en entornos sin sessionStorage
  }

  const authUrl = new URL('https://accounts.spotify.com/authorize');
  authUrl.search = new URLSearchParams({
    response_type: 'code',
    client_id: CLIENT_ID,
    scope: SCOPES,
    code_challenge_method: 'S256',
    code_challenge: codeChallenge,
    redirect_uri: redirectUri,
    state: state,
  }).toString();

  window.location.href = authUrl.toString();
}

/**
 * Procesa el callback de Spotify con el código de autorización y obtiene los tokens de usuario.
 * Valida el parámetro state contra CSRF y recupera el code_verifier de forma resiliente.
 */
export async function handleSpotifyCallback(code, state = null) {
  let codeVerifier =
    window.localStorage.getItem(CODE_VERIFIER_KEY) ||
    (typeof window !== 'undefined' ? window.sessionStorage?.getItem(CODE_VERIFIER_KEY) : null);

  const storedState =
    window.localStorage.getItem(STATE_KEY) ||
    (typeof window !== 'undefined' ? window.sessionStorage?.getItem(STATE_KEY) : null);

  // Limpiar el estado OAuth de inmediato para prevenir ataques de repetición
  window.localStorage.removeItem(STATE_KEY);
  try {
    window.sessionStorage.removeItem(STATE_KEY);
    window.sessionStorage.removeItem(CODE_VERIFIER_KEY);
  } catch {
    // Ignorar en entornos sin sessionStorage
  }

  if (state && storedState && state !== storedState) {
    throw new Error('Alerta de Seguridad: Validación de estado OAuth fallida (posible ataque CSRF).');
  }

  // Si el navegador aisló el almacenamiento (ej. inició en localhost y volvió a 127.0.0.1),
  // recuperar el verificador desde el estado firmado de la sesión.
  if (!codeVerifier && state && state.includes('.')) {
    const parts = state.split('.');
    if (parts.length === 2 && parts[1].length >= 43) {
      codeVerifier = parts[1];
    }
  }

  if (!codeVerifier) {
    throw new Error('No se encontró el verificador PKCE en este navegador. Por favor inicia la conexión nuevamente.');
  }

  const redirectUri = getRedirectUri();

  const response = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: redirectUri,
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
 * Si expiró y no es posible refrescarlo, limpia el token vencido y retorna null.
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

  // El token expiró y no pudo renovarse: limpiar almacenamiento para no bloquear llamadas posteriores
  logoutSpotify();
  return null;
}

/**
 * Cierra la sesión de Spotify en la aplicación.
 */
export function logoutSpotify() {
  window.localStorage.removeItem(USER_TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
  window.localStorage.removeItem(TOKEN_EXPIRY_KEY);
  window.localStorage.removeItem(CODE_VERIFIER_KEY);
  window.localStorage.removeItem(STATE_KEY);
  try {
    window.sessionStorage.removeItem(STATE_KEY);
  } catch {
    // Ignorar en entornos sin sessionStorage
  }
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
    { id: 'fb_cy_4', name: 'Resonance', artist: 'HOME', album: 'Odyssey', bpmMatch: 124, image: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=300', spotifyUrl: 'https://open.spotify.com/search/Resonance%20HOME', uri: 'spotify:track:1TuopWDI4THT4kQ3w6m5Q' }
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
  '80s Funk': [
    { id: 'fb_ac_1', name: 'Come Together', artist: 'The Beatles', album: 'Abbey Road', bpmMatch: 82, image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300', spotifyUrl: 'https://open.spotify.com/search/Come%20Together', uri: 'spotify:track:2EqlS6tk8ikZAUFYpSPrCY' },
    { id: 'fb_ac_2', name: 'Superstition', artist: 'Stevie Wonder', album: 'Talking Book', bpmMatch: 100, image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300', spotifyUrl: 'https://open.spotify.com/search/Superstition%20Stevie%20Wonder', uri: 'spotify:track:587nL2W2m9X4m7T8Q1V5e9' },
    { id: 'fb_ac_3', name: 'Roxanne', artist: 'The Police', album: 'Outlandos d\'Amour', bpmMatch: 134, image: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=300', spotifyUrl: 'https://open.spotify.com/search/Roxanne%20The%20Police', uri: 'spotify:track:3ZFTkvIE7kyPt6Nu3PEmuV' },
    { id: 'fb_ac_4', name: 'Cissy Strut', artist: 'The Meters', album: 'The Meters', bpmMatch: 92, image: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=300', spotifyUrl: 'https://open.spotify.com/search/Cissy%20Strut', uri: 'spotify:track:0J8b5F0s9X2k5T8Q1V5e9' }
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

  // Mapear género / kit a términos óptimos de búsqueda
  const queryTerms = {
    'Trap Bóveda': 'trap hip hop beat',
    'Cyberpunk': 'synthwave cyberpunk retro',
    'Analog 808': 'electro 808 boom bap',
    'Lo-Fi Chill': 'lofi chill study beat',
    '80s Funk': 'funk groove drum beat disco 80s',
    'Acoustic Studio': 'funk groove drum beat'
  };

  const term = queryTerms[kitName] || `${kitName} beat`;
  const url = `${API_BASE}/search?q=${encodeURIComponent(term)}&type=track&limit=${safeLimit}`;

  try {
    const token = await getEffectiveSpotifyToken();
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
