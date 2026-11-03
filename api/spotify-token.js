export const runtime = 'nodejs';

// Función serverless (Vercel), middleware local (Vite) y servidor Docker:
// 1. Obtiene el token público de Spotify (Client Credentials) en el servidor evitando CORS.
// 2. Enriquecimiento universal (?action=enrich): recupera audiencia real (followers),
//    índice de popularidad (0-100), géneros musicales, álbumes y top tracks para
//    cualquier artista de Spotify (supliendo los campos recortados por Spotify API en Developer Mode).
// 3. Búsqueda global (?action=search) y estrenos (?action=new-releases) con respaldo
//    automático si faltan variables de entorno en el servidor.

let cachedToken = null;
let tokenExpiry = 0;

// Caché en memoria de enriquecimiento por artista (TTL: 30 minutos)
const enrichCache = new Map();
const ENRICH_TTL_MS = 30 * 60 * 1000;

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)';
const MB_USER_AGENT = 'TheSonicVault/1.0 (https://the-sonic-vault.vercel.app)';

// Tags no musicales que MusicBrainz a veces incluye (nacionalidades o metadatos) y debemos filtrar
const IGNORED_MB_TAGS = new Set([
  'seen live',
  'favorites',
  'favourite',
  'american',
  'british',
  'english',
  'uk',
  'usa',
  'canadian',
  'spanish',
  'colombian',
  'puerto rican',
  'french',
  'german',
  'japanese',
  'korean',
  'male vocalists',
  'female vocalists',
  'singer-songwriter',
  'vocalist',
  'musician',
  'band',
  'solo',
  'duo',
  'grammy winner',
  'parlophone',
  'interscope',
  'columbia',
  'atlantic',
  'republic',
  'sony',
  'universal',
  'warner',
  'britannique'
]);

export function calcularPopularidadDesdeAudiencia(audiencia) {
  const num = Number(audiencia);
  if (!Number.isFinite(num) || num <= 0) return null;
  // Escala logarítmica calibrada con el índice 0-100 de Spotify:
  // ~100M -> 96-98 | ~50M -> 92 | ~20M -> 88 | ~5M -> 80 | ~1M -> 72 | ~100k -> 60 | ~10k -> 48
  return Math.min(99, Math.max(15, Math.round(12 * Math.log10(num))));
}

export async function obtenerTokenSpotify(clientId, clientSecret, env = process.env) {
  const ahora = Date.now();
  if (cachedToken && ahora < tokenExpiry - 60000) {
    return { access_token: cachedToken };
  }

  const id = (
    clientId ||
    env.SPOTIFY_CLIENT_ID ||
    env.VITE_SPOTIFY_CLIENT_ID ||
    process.env.SPOTIFY_CLIENT_ID ||
    process.env.VITE_SPOTIFY_CLIENT_ID ||
    ''
  ).trim();

  const secret = (
    clientSecret ||
    env.SPOTIFY_CLIENT_SECRET ||
    env.VITE_SPOTIFY_CLIENT_SECRET ||
    process.env.SPOTIFY_CLIENT_SECRET ||
    process.env.VITE_SPOTIFY_CLIENT_SECRET ||
    ''
  ).trim();

  if (!id || !secret) {
    throw new Error('Faltan las credenciales de Spotify en las variables de entorno.');
  }

  const basicAuth = Buffer.from(`${id}:${secret}`).toString('base64');
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basicAuth}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials'
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Error de Spotify API: ${errorText}`);
  }

  const data = await response.json();
  cachedToken = data.access_token;
  tokenExpiry = ahora + (Number(data.expires_in) || 3600) * 1000;

  return { access_token: cachedToken };
}

/**
 * Extrae datos públicos oficiales desde la página web pública de Spotify y su embed
 * sin requerir Client Secret (nombre, imagen oficial, oyentes mensuales y top tracks).
 */
async function extraerMetadatosWebSpotify(spotifyId, includeMedia = false) {
  if (!spotifyId || spotifyId.startsWith('dz_')) return null;

  const resultado = {
    name: null,
    image: null,
    listeners: null,
    topTracks: []
  };

  const tareas = [
    fetch(`https://open.spotify.com/artist/${encodeURIComponent(spotifyId)}`, {
      headers: { 'User-Agent': USER_AGENT }
    }).then(async (r) => {
      if (!r.ok) return;
      const html = await r.text();
      const titleMatch = html.match(/<meta property="og:title" content="([^"]+)"/i);
      const imageMatch = html.match(/<meta property="og:image" content="([^"]+)"/i);
      const descMatch =
        html.match(/<meta property="og:description" content="([^"]+)"/i) ||
        html.match(/<meta name="description" content="([^"]+)"/i);

      if (titleMatch?.[1]) resultado.name = titleMatch[1].trim();
      if (imageMatch?.[1]) resultado.image = imageMatch[1].trim();

      if (descMatch?.[1]) {
        const m = descMatch[1].match(/([\d.,]+)\s*([KMB])?\s*(?:monthly listeners|oyentes mensuales|followers|seguidores)/i);
        if (m) {
          let num = parseFloat(m[1].replace(/,/g, ''));
          const unit = (m[2] || '').toUpperCase();
          if (unit === 'K') num *= 1e3;
          else if (unit === 'M') num *= 1e6;
          else if (unit === 'B') num *= 1e9;
          if (Number.isFinite(num) && num > 0) {
            resultado.listeners = Math.round(num);
          }
        }
      }
    })
  ];

  if (includeMedia) {
    tareas.push(
      fetch(`https://open.spotify.com/embed/artist/${encodeURIComponent(spotifyId)}`, {
        headers: { 'User-Agent': USER_AGENT }
      }).then(async (r) => {
        if (!r.ok) return;
        const html = await r.text();
        const nextMatch = html.match(
          /<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/
        );
        if (!nextMatch?.[1]) return;
        const nextData = JSON.parse(nextMatch[1]);
        const entity = nextData?.props?.pageProps?.state?.data?.entity;
        if (!resultado.name && entity?.name) resultado.name = entity.name;
        const visualImg = entity?.visualIdentity?.image?.[0]?.url;
        if (!resultado.image && visualImg) resultado.image = visualImg;

        if (Array.isArray(entity?.trackList)) {
          resultado.topTracks = entity.trackList.slice(0, 8).map((t) => {
            const trackId = (t.uri || '').split(':').pop() || t.uid;
            return {
              id: trackId,
              name: t.title || 'Track',
              uri: t.uri || `spotify:track:${trackId}`,
              duration_ms: t.duration || 0,
              preview_url: t.audioPreview?.url || null,
              artists: [{ name: t.subtitle || resultado.name || 'Artista' }],
              album: {
                name: 'Top Track',
                images: resultado.image ? [{ url: resultado.image }] : []
              },
              external_urls: {
                spotify: `https://open.spotify.com/track/${trackId}`
              }
            };
          });
        }
      })
    );
  }

  await Promise.allSettled(tareas);
  return resultado;
}

/**
 * Enriquece cualquier artista de Spotify o Deezer con:
 * - Seguidores / Audiencia real (Spotify Monthly Listeners o Deezer Fans)
 * - Índice de Popularidad (0-100)
 * - Géneros musicales reales (iTunes + MusicBrainz)
 * - Álbumes y Top Tracks de respaldo si se solicitan
 */
export async function enriquecerArtistaSpotify({
  artistId = '',
  name = '',
  includeMedia = false
} = {}) {
  const cleanId = String(artistId || '').trim();
  const cleanName = String(name || '').trim();
  const cacheKey = `${cleanId.toLowerCase()}::${cleanName.toLowerCase()}::${includeMedia ? '1' : '0'}`;

  const ahora = Date.now();
  const cached = enrichCache.get(cacheKey);
  if (cached && ahora < cached.expiry) {
    return cached.data;
  }

  let resolvedName = cleanName;
  let resolvedImage = null;
  let followersTotal = null;
  let topTracks = [];
  let albums = [];
  const genreSet = new Set();

  // 1. Si tenemos un ID de Spotify (o dz_), extraer metadatos primarios
  if (cleanId && !cleanId.startsWith('dz_')) {
    const spMeta = await extraerMetadatosWebSpotify(cleanId, includeMedia).catch(() => null);
    if (spMeta) {
      if (!resolvedName && spMeta.name) resolvedName = spMeta.name;
      if (spMeta.image) resolvedImage = spMeta.image;
      if (typeof spMeta.listeners === 'number') followersTotal = spMeta.listeners;
      if (spMeta.topTracks?.length > 0) topTracks = spMeta.topTracks;
    }
  } else if (cleanId.startsWith('dz_')) {
    const dzId = cleanId.replace('dz_', '');
    try {
      const dzRes = await fetch(`https://api.deezer.com/artist/${encodeURIComponent(dzId)}`);
      if (dzRes.ok) {
        const dzArtist = await dzRes.json();
        if (!resolvedName && dzArtist.name) resolvedName = dzArtist.name;
        if (dzArtist.picture_xl || dzArtist.picture_big) {
          resolvedImage = dzArtist.picture_xl || dzArtist.picture_big;
        }
        if (typeof dzArtist.nb_fan === 'number') followersTotal = dzArtist.nb_fan;
      }
      if (includeMedia) {
        const topRes = await fetch(`https://api.deezer.com/artist/${encodeURIComponent(dzId)}/top?limit=6`);
        if (topRes.ok) {
          const topData = await topRes.json();
          topTracks = (topData.data || []).map((t) => ({
            id: `dz_track_${t.id}`,
            name: t.title,
            duration_ms: (t.duration || 0) * 1000,
            preview_url: t.preview || null,
            artists: [{ name: t.artist?.name || resolvedName }],
            album: {
              name: t.album?.title || 'Single',
              images: [{ url: t.album?.cover_big || t.album?.cover_medium || resolvedImage || '' }]
            },
            external_urls: {
              spotify: `https://open.spotify.com/search/${encodeURIComponent(`${t.title} ${resolvedName}`)}`
            }
          }));
        }
      }
    } catch {
      // Continuar con otras fuentes
    }
  }

  // 2. Consultas paralelas por nombre del artista: iTunes (géneros + álbumes), MusicBrainz (tags) y Deezer (audiencia de respaldo)
  if (resolvedName) {
    const [itunesResult, mbResult, dzSearchResult] = await Promise.allSettled([
      fetch(
        `https://itunes.apple.com/search?term=${encodeURIComponent(resolvedName)}&entity=album&limit=10`
      ).then((r) => (r.ok ? r.json() : null)),
      fetch(
        `https://musicbrainz.org/ws/2/artist/?query=artist:${encodeURIComponent(`"${resolvedName}"`)}&fmt=json&limit=1`,
        { headers: { 'User-Agent': MB_USER_AGENT } }
      ).then((r) => (r.ok ? r.json() : null)),
      followersTotal === null || !resolvedImage
        ? fetch(
            `https://api.deezer.com/search/artist?q=${encodeURIComponent(resolvedName)}&limit=3`
          ).then((r) => (r.ok ? r.json() : null))
        : Promise.resolve(null)
    ]);

    if (itunesResult.status === 'fulfilled' && itunesResult.value?.results) {
      const targetLower = resolvedName.toLowerCase();
      const matchingAlbums = itunesResult.value.results.filter(
        (item) =>
          item.artistName &&
          (item.artistName.toLowerCase() === targetLower ||
            item.artistName.toLowerCase().includes(targetLower) ||
            targetLower.includes(item.artistName.toLowerCase()))
      );
      const sourceAlbums = matchingAlbums.length > 0 ? matchingAlbums : itunesResult.value.results;

      for (const item of sourceAlbums) {
        const g = (item.primaryGenreName || '').trim().toLowerCase();
        if (g && g !== 'music' && g !== 'música') {
          genreSet.add(g);
        }
      }

      if (includeMedia) {
        albums = sourceAlbums.slice(0, 8).map((a) => ({
          id: `it_${a.collectionId}`,
          name: a.collectionName,
          album_type: (a.trackCount || 0) <= 3 ? 'single' : 'album',
          release_date: a.releaseDate ? a.releaseDate.slice(0, 10) : '',
          total_tracks: a.trackCount || 1,
          images: [
            {
              url: a.artworkUrl100
                ? a.artworkUrl100.replace('100x100bb', '600x600bb')
                : resolvedImage || ''
            }
          ],
          external_urls: {
            spotify: `https://open.spotify.com/search/${encodeURIComponent(`${a.collectionName} ${resolvedName}`)}`
          }
        }));
      }
    }

    if (mbResult.status === 'fulfilled' && mbResult.value?.artists?.[0]) {
      const mbArtist = mbResult.value.artists[0];
      const validTags = (mbArtist.tags || [])
        .filter((t) => {
          const tagName = (t.name || '').trim().toLowerCase();
          return (
            tagName.length >= 2 &&
            tagName.length <= 24 &&
            (t.count ?? 0) >= 1 &&
            !IGNORED_MB_TAGS.has(tagName)
          );
        })
        .sort((a, b) => (b.count || 0) - (a.count || 0))
        .slice(0, 4);

      for (const t of validTags) {
        genreSet.add(t.name.trim().toLowerCase());
      }
    }

    if (dzSearchResult.status === 'fulfilled' && dzSearchResult.value?.data?.length > 0) {
      const targetLower = resolvedName.toLowerCase();
      const exactMatch =
        dzSearchResult.value.data.find((d) => d.name?.toLowerCase() === targetLower) ||
        dzSearchResult.value.data[0];

      if (exactMatch) {
        if (followersTotal === null && typeof exactMatch.nb_fan === 'number') {
          followersTotal = exactMatch.nb_fan;
        }
        if (!resolvedImage && (exactMatch.picture_xl || exactMatch.picture_big)) {
          resolvedImage = exactMatch.picture_xl || exactMatch.picture_big;
        }
      }
    }
  }

  const genres = [...genreSet].slice(0, 5);
  const popularity = calcularPopularidadDesdeAudiencia(followersTotal);

  const payload = {
    id: cleanId || null,
    name: resolvedName || null,
    images: resolvedImage ? [{ url: resolvedImage }] : [],
    followers: { total: followersTotal },
    popularity,
    genres,
    external_urls: {
      spotify:
        cleanId && !cleanId.startsWith('dz_')
          ? `https://open.spotify.com/artist/${cleanId}`
          : `https://open.spotify.com/search/${encodeURIComponent(resolvedName || '')}`
    },
    ...(includeMedia ? { topTracks, albums } : {})
  };

  enrichCache.set(cacheKey, {
    expiry: ahora + ENRICH_TTL_MS,
    data: payload
  });

  return payload;
}

/**
 * Búsqueda universal de artistas en servidor (usa Spotify API si hay credenciales;
 * si no, consulta el catálogo mundial abierto de Deezer para encontrar cualquier artista).
 */
export async function buscarArtistasGlobalServidor(query, limit = 8, env = process.env) {
  const cleanQuery = String(query || '').trim();
  if (!cleanQuery) return { items: [] };
  const safeLimit = Math.min(Math.max(1, Number(limit) || 8), 10);

  // 1. Intentar con token oficial de Spotify
  try {
    const { access_token } = await obtenerTokenSpotify(undefined, undefined, env);
    const spRes = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(cleanQuery)}&type=artist&limit=${safeLimit}`,
      { headers: { Authorization: `Bearer ${access_token}` } }
    );
    if (spRes.ok) {
      const spData = await spRes.json();
      if (Array.isArray(spData.artists?.items) && spData.artists.items.length > 0) {
        return { items: spData.artists.items };
      }
    }
  } catch {
    // Continuar con catálogo global abierto de Deezer
  }

  // 2. Respaldo global ilimitado vía Deezer API (millones de artistas sin requerir llaves)
  const dzRes = await fetch(
    `https://api.deezer.com/search/artist?q=${encodeURIComponent(cleanQuery)}&limit=${safeLimit}`
  );
  if (!dzRes.ok) return { items: [] };
  const dzData = await dzRes.json();
  const items = (dzData.data || []).map((a) => ({
    id: `dz_${a.id}`,
    name: a.name,
    images: [{ url: a.picture_xl || a.picture_big || a.picture_medium || '' }],
    followers: { total: typeof a.nb_fan === 'number' ? a.nb_fan : null },
    popularity: calcularPopularidadDesdeAudiencia(a.nb_fan),
    genres: [],
    external_urls: {
      spotify: `https://open.spotify.com/search/${encodeURIComponent(a.name)}`
    }
  }));

  return { items };
}

/**
 * Obtiene los estrenos más recientes del catálogo mundial (noviembre 2026):
 * 1. Intenta consultar Spotify Web API tag:new si hay credenciales.
 * 2. Si no hay credenciales en el servidor, consulta el chart de álbumes de Deezer (abierto y en vivo).
 */
export async function obtenerEstrenosGlobalServidor(limit = 12, env = process.env) {
  const safeLimit = Math.min(Math.max(1, Number(limit) || 12), 20);

  // 1. Intentar con token oficial de Spotify
  try {
    const { access_token } = await obtenerTokenSpotify(undefined, undefined, env);
    const spRes = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent('tag:new')}&type=album&limit=${safeLimit}`,
      { headers: { Authorization: `Bearer ${access_token}` } }
    );
    if (spRes.ok) {
      const spData = await spRes.json();
      const raw = spData.albums?.items || [];
      if (raw.length > 0) {
        return raw.map((a) => ({
          id: a.id,
          name: a.name,
          artist: a.artists?.map((art) => art.name).join(', ') || 'Varios Artistas',
          artistId: a.artists?.[0]?.id,
          releaseDate: a.release_date,
          totalTracks: a.total_tracks,
          type: a.album_type,
          image: a.images?.[0]?.url || a.images?.[1]?.url || '',
          spotifyUrl: a.external_urls?.spotify || `https://open.spotify.com/album/${a.id}`,
          uri: a.uri
        }));
      }
    }
  } catch {
    // Continuar al respaldo mundial abierto
  }

  // 2. Respaldo mundial abierto vía Deezer Chart Albums (en vivo sin claves)
  try {
    const dzRes = await fetch(`https://api.deezer.com/chart/0/albums?limit=${safeLimit}`);
    if (dzRes.ok) {
      const dzData = await dzRes.json();
      const raw = dzData.data || [];
      if (raw.length > 0) {
        return raw.map((a) => ({
          id: `dz_${a.id}`,
          name: a.title,
          artist: a.artist?.name || 'Varios Artistas',
          artistId: a.artist?.id ? `dz_${a.artist.id}` : undefined,
          releaseDate: new Date().toISOString().slice(0, 10),
          totalTracks: 10,
          type: a.record_type || 'album',
          image: a.cover_xl || a.cover_big || a.cover_medium || '',
          spotifyUrl: `https://open.spotify.com/search/${encodeURIComponent(`${a.title} ${a.artist?.name || ''}`)}`,
          uri: undefined
        }));
      }
    }
  } catch {
    // Fallback final
  }

  return [];
}

/**
 * Procesador unificado de peticiones para /api/spotify-token (Vercel, Vite y Docker).
 */
export async function procesarPeticionSpotifyToken({ method = 'GET', url = '/', env = process.env } = {}) {
  if (method !== 'GET') {
    return { status: 405, body: { error: 'Método no permitido.' } };
  }

  const parsedUrl = new URL(url, 'http://localhost');
  const action = parsedUrl.searchParams.get('action') || 'token';

  try {
    if (action === 'enrich') {
      const artistId = parsedUrl.searchParams.get('artistId') || '';
      const name = parsedUrl.searchParams.get('name') || '';
      const includeMedia = parsedUrl.searchParams.get('includeMedia') === '1';
      if (!artistId && !name) {
        return { status: 400, body: { error: 'Se requiere artistId o name para enriquecer.' } };
      }
      const data = await enriquecerArtistaSpotify({ artistId, name, includeMedia });
      return { status: 200, body: data };
    }

    if (action === 'search') {
      const q = parsedUrl.searchParams.get('q') || '';
      const limit = Number(parsedUrl.searchParams.get('limit') || 8);
      const data = await buscarArtistasGlobalServidor(q, limit, env);
      return { status: 200, body: data };
    }

    if (action === 'new-releases') {
      const limit = Number(parsedUrl.searchParams.get('limit') || 12);
      const data = await obtenerEstrenosGlobalServidor(limit, env);
      return { status: 200, body: data };
    }

    const data = await obtenerTokenSpotify(undefined, undefined, env);
    return { status: 200, body: data };
  } catch (err) {
    console.error(`Error en /api/spotify-token (action=${action}):`, err.message);
    return { status: 500, body: { error: err.message } };
  }
}

export default async function handler(req, res) {
  const result = await procesarPeticionSpotifyToken({
    method: req.method,
    url: req.url || '/',
    env: process.env
  });
  return res.status(result.status).json(result.body);
}
