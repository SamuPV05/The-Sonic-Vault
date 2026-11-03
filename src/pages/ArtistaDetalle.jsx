import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import {
  getSpotifyArtist,
  getSpotifyArtistAlbums,
  getSpotifyArtistTopTracks,
  searchSingleTrack
} from '../services/spotifyService';
import ArbolEcos from '../components/ArbolEcos';
import { useWindowSize } from '../hooks/useWindowSize';
import { getCuratedSpotifyMapping } from '../constants/artistasSpotifyMap';

// Formateador de duración en milisegundos a mm:ss
const formatDurationMs = (ms) => {
  if (!ms || typeof ms !== 'number') return '--:--';
  const totalSeconds = Math.floor(ms / 1000);
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// Extrae y normaliza géneros desde campos curados de Firestore (genero, generos, genres)
const extraerGenerosCurados = (data) => {
  if (!data) return [];
  const raw = [];
  if (Array.isArray(data.genres)) raw.push(...data.genres);
  if (Array.isArray(data.generos)) raw.push(...data.generos);
  if (typeof data.genero === 'string') {
    raw.push(...data.genero.split(/[,/•|]+/));
  }
  const seen = new Set();
  const clean = [];
  for (const item of raw) {
    const g = String(item || '').trim().toLowerCase();
    if (g && g.length >= 2 && !seen.has(g)) {
      seen.add(g);
      clean.push(g);
    }
  }
  return clean;
};

export default function ArtistaDetalle() {
  const { id } = useParams();
  const [artista, setArtista] = useState(null);
  const [esSpotify, setEsSpotify] = useState(false);
  const [sincronizandoTelemetria, setSincronizandoTelemetria] = useState(false);
  const [spotifyAlbums, setSpotifyAlbums] = useState([]);
  const [spotifyTopTracks, setSpotifyTopTracks] = useState([]);
  const [activeTopTrackId, setActiveTopTrackId] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let cancelado = false;

    const obtenerArtista = async () => {
      setCargando(true);
      setSincronizandoTelemetria(false);
      setActiveTopTrackId(null);
      setActiveSongTrack(null);
      setErasExpandidas({});
      try {
        if (id && id.startsWith('sp_')) {
          // --- ARTISTA DINÁMICO DE SPOTIFY ---
          const spotifyId = id.replace('sp_', '');
          setEsSpotify(true);

          const artistData = await getSpotifyArtist(spotifyId);
          if (cancelado) return;

          if (artistData) {
            const genresList = Array.isArray(artistData.genres) ? artistData.genres : [];
            const followersCount =
              typeof artistData.followers?.total === 'number' && artistData.followers.total > 0
                ? artistData.followers.total
                : null;
            const popularityScore =
              typeof artistData.popularity === 'number' && artistData.popularity > 0
                ? artistData.popularity
                : null;
            const genresSummary =
              genresList.length > 0
                ? `Referente sonoro en ${genresList.slice(0, 4).join(', ')}. `
                : '';

            setArtista({
              nombre: artistData.name,
              imagen:
                artistData.images?.[0]?.url ||
                'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80',
              subtitulo: 'EXPEDIENTE GLOBAL SPOTIFY // ARCHIVO ABIERTO',
              bio: `${genresSummary}Artista indexado en tiempo real desde el catálogo global de Spotify. Conecta tus sentidos a sus métricas de impacto, temas esenciales y discografía oficial en The Sonic Vault.`,
              spotifyUrl: artistData.external_urls?.spotify,
              spotifyId: artistData.id || spotifyId,
              genres: genresList,
              followers: followersCount,
              popularity: popularityScore
            });

            // Cargar álbumes oficiales y Top Tracks en paralelo
            const [albums, topTracks] = await Promise.all([
              getSpotifyArtistAlbums(artistData.id || spotifyId, 8, artistData.name),
              getSpotifyArtistTopTracks(artistData.id || spotifyId, artistData.name, 6)
            ]);
            if (!cancelado) {
              setSpotifyAlbums(albums || []);
              setSpotifyTopTracks(topTracks || []);
            }
          } else {
            setArtista(null);
          }
        } else {
          // --- ARTISTA CLÁSICO DE FIRESTORE (HIBRIDADO EN PARALELO CON SPOTIFY) ---
          setEsSpotify(false);
          setSpotifyAlbums([]);
          setSpotifyTopTracks([]);
          const docRef = doc(db, 'artistas', id);
          const docSnap = await getDoc(docRef);
          if (cancelado) return;

          if (docSnap.exists()) {
            const firestoreData = docSnap.data();
            const mappedSpotify =
              getCuratedSpotifyMapping(id) ||
              getCuratedSpotifyMapping(firestoreData.nombre);

            const generosCurados = [
              ...new Set([
                ...extraerGenerosCurados(firestoreData),
                ...(mappedSpotify?.genres || [])
              ])
            ].slice(0, 6);

            const effectiveSpotifyId =
              firestoreData.spotifyId || mappedSpotify?.spotifyId || null;
            const fallbackSpotifySearchUrl = `https://open.spotify.com/search/${encodeURIComponent(
              firestoreData.nombre || id
            )}`;

            const baseArtista = {
              ...firestoreData,
              genres: generosCurados,
              followers:
                typeof firestoreData.followers === 'number'
                  ? firestoreData.followers
                  : mappedSpotify?.followers || null,
              popularity:
                typeof firestoreData.popularity === 'number'
                  ? firestoreData.popularity
                  : mappedSpotify?.popularity || null,
              spotifyUrl:
                firestoreData.spotifyUrl ||
                mappedSpotify?.spotifyUrl ||
                fallbackSpotifySearchUrl,
              spotifyId: effectiveSpotifyId
            };

            setArtista(baseArtista);
            setCargando(false);
            setSincronizandoTelemetria(!baseArtista.followers);

            try {
              const targetName = firestoreData.nombre || id;
              let spData = null;
              let albums = [];
              let topTracks = [];

              if (effectiveSpotifyId) {
                [spData, albums, topTracks] = await Promise.all([
                  getSpotifyArtist(effectiveSpotifyId, targetName),
                  getSpotifyArtistAlbums(effectiveSpotifyId, 8, targetName),
                  getSpotifyArtistTopTracks(effectiveSpotifyId, targetName, 6)
                ]);
              } else {
                spData = await getSpotifyArtist('', targetName);
                const resolvedId = spData?.id || '';
                [albums, topTracks] = await Promise.all([
                  getSpotifyArtistAlbums(resolvedId, 8, targetName),
                  getSpotifyArtistTopTracks(resolvedId, targetName, 6)
                ]);
              }

              if (!cancelado) {
                if (spData) {
                  const spGenres = Array.isArray(spData.genres) ? spData.genres : [];
                  const mergedGenres = [
                    ...new Set([...spGenres, ...generosCurados])
                  ].slice(0, 6);

                  setArtista((prev) =>
                    prev
                      ? {
                          ...prev,
                          spotifyId: spData.id || prev.spotifyId,
                          spotifyUrl: spData.external_urls?.spotify || prev.spotifyUrl,
                          followers:
                            typeof spData.followers?.total === 'number' &&
                            spData.followers.total > 0
                              ? spData.followers.total
                              : prev.followers,
                          popularity:
                            typeof spData.popularity === 'number' &&
                            spData.popularity > 0
                              ? spData.popularity
                              : prev.popularity,
                          genres: mergedGenres.length > 0 ? mergedGenres : prev.genres
                        }
                      : prev
                  );
                }

                setSpotifyAlbums(albums || []);
                setSpotifyTopTracks(topTracks || []);
              }
            } catch (spErr) {
              console.warn('Aviso al sincronizar telemetría Spotify para artista curado:', spErr);
            } finally {
              if (!cancelado) {
                setSincronizandoTelemetria(false);
              }
            }
          } else {
            setArtista(null);
          }
        }
      } catch (error) {
        console.error('Error al obtener artista:', error);
      } finally {
        if (!cancelado) {
          setCargando(false);
        }
      }
    };
    obtenerArtista();

    return () => {
      cancelado = true;
    };
  }, [id]);

  const [erasExpandidas, setErasExpandidas] = useState({});
  const [activeSongTrack, setActiveSongTrack] = useState(null);
  const [loadingTrackTitle, setLoadingTrackTitle] = useState(null);

  const handlePlaySong = async (songTitle) => {
    if (activeSongTrack && activeSongTrack.titulo === songTitle) {
      setActiveSongTrack(null);
      return;
    }

    setActiveTopTrackId(null);
    setLoadingTrackTitle(songTitle);
    try {
      const result = await searchSingleTrack(songTitle, artista?.nombre || '');
      if (result) {
        setActiveSongTrack({
          titulo: songTitle,
          trackId: result.id,
          spotifyUrl: result.spotifyUrl,
          image: result.image
        });
      } else {
        const searchUrl = `https://open.spotify.com/search/${encodeURIComponent(
          songTitle + ' ' + (artista?.nombre || '')
        )}`;
        window.open(searchUrl, '_blank', 'noopener,noreferrer');
      }
    } catch {
      const searchUrl = `https://open.spotify.com/search/${encodeURIComponent(
        songTitle + ' ' + (artista?.nombre || '')
      )}`;
      window.open(searchUrl, '_blank', 'noopener,noreferrer');
    } finally {
      setLoadingTrackTitle(null);
    }
  };

  // ESTILOS RESPONSIVOS EN TIEMPO REAL
  const { isMobile: esMovil } = useWindowSize();

  if (cargando)
    return (
      <div style={{ textAlign: 'center', marginTop: '120px', minHeight: '60vh' }}>
        <div
          style={{
            width: '50px',
            height: '50px',
            border: '3px solid rgba(0, 240, 255, 0.2)',
            borderTop: '3px solid var(--accent-color)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px auto'
          }}
        ></div>
        <h2
          className="accent"
          style={{ letterSpacing: '3px', textTransform: 'uppercase', fontSize: '1.2rem' }}
        >
          Desencriptando Archivo...
        </h2>
      </div>
    );
  if (!artista)
    return (
      <h2 className="accent" style={{ textAlign: 'center', marginTop: '100px' }}>
        Archivo Clasificado No Encontrado
      </h2>
    );

  const toggleEra = (index) => {
    setErasExpandidas((prev) => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  return (
    <main style={{ width: '100%', overflowX: 'hidden' }}>
      {/* BOTÓN VOLVER */}
      <div style={{ maxWidth: '1200px', margin: '2rem auto 0 auto', padding: '0 5%' }}>
        <Link
          to="/artistas"
          className="view-btn"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            textDecoration: 'none',
            color: '#fff',
            background: 'rgba(255,255,255,0.05)',
            padding: '10px 18px',
            borderRadius: '25px',
            border: '1px solid rgba(0, 240, 255, 0.2)'
          }}
        >
          <i className="fa-solid fa-arrow-left" /> Volver al Salón de Artistas
        </Link>
      </div>

      {/* 1. EL HERO */}
      <section className="artist-hero">
        <div className="artist-hero-img">
          <img src={artista.imagen} alt={artista.nombre} />
        </div>
        <div className="artist-bio">
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
            {!esSpotify && (
              <span
                style={{
                  background: 'rgba(0, 240, 255, 0.12)',
                  color: 'var(--accent-color)',
                  border: '1px solid rgba(0, 240, 255, 0.35)',
                  padding: '4px 12px',
                  borderRadius: '15px',
                  fontSize: '0.75rem',
                  fontWeight: 'bold',
                  letterSpacing: '1px'
                }}
              >
                <i className="fa-solid fa-compact-disc" style={{ marginRight: '6px' }}></i> ARCHIVO DE CULTO // BÓVEDA
              </span>
            )}
            <span
              style={{
                background: 'rgba(29, 185, 84, 0.15)',
                color: '#1DB954',
                border: '1px solid rgba(29, 185, 84, 0.4)',
                padding: '4px 12px',
                borderRadius: '15px',
                fontSize: '0.75rem',
                fontWeight: 'bold',
                letterSpacing: '1px'
              }}
            >
              <i className="fa-brands fa-spotify" style={{ marginRight: '6px' }}></i> SPOTIFY OFICIAL
            </span>
          </div>
          <h1>{artista.nombre}</h1>
          <h2 style={{ textTransform: 'uppercase', letterSpacing: '2px', color: '#888', fontSize: '1rem' }}>
            {artista.subtitulo}
          </h2>
          <p style={{ marginTop: '20px', fontSize: '1.1rem', lineHeight: '1.8' }}>{artista.bio}</p>

          {/* TELEMETRÍA ENRIQUECIDA UNIFICADA (FIRESTORE + SPOTIFY): GÉNEROS, SEGUIDORES Y BARRA DE POPULARIDAD */}
          <div
            style={{
              marginTop: '22px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              background: 'rgba(10, 14, 24, 0.75)',
              border: '1px solid rgba(0, 240, 255, 0.2)',
              borderRadius: '14px',
              padding: '16px 18px'
            }}
          >
            {/* Fila de Seguidores y Barra de Popularidad */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
                gap: '16px',
                alignItems: 'center'
              }}
            >
              {/* Seguidores Formateados */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '10px',
                    background: 'rgba(29, 185, 84, 0.14)',
                    border: '1px solid rgba(29, 185, 84, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#1DB954',
                    fontSize: '1.1rem',
                    flexShrink: 0
                  }}
                >
                  <i className="fa-solid fa-users" />
                </div>
                <div>
                  <span
                    style={{
                      display: 'block',
                      fontSize: '0.68rem',
                      color: '#888',
                      textTransform: 'uppercase',
                      letterSpacing: '1px',
                      fontWeight: 'bold'
                    }}
                  >
                    Audiencia Global
                  </span>
                  <span style={{ fontSize: '1.15rem', fontWeight: 'bold', color: '#fff' }}>
                    {typeof artista.followers === 'number' && artista.followers > 0 ? (
                      `${artista.followers.toLocaleString('es-ES')} seguidores`
                    ) : sincronizandoTelemetria ? (
                      <span style={{ color: '#00F0FF', fontSize: '0.92rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <i className="fa-solid fa-spinner fa-spin" /> Sincronizando audiencia...
                      </span>
                    ) : (
                      <span style={{ color: '#00F0FF', fontSize: '1rem', letterSpacing: '0.5px' }}>
                        +25.000 seguidores en radar
                      </span>
                    )}
                  </span>
                </div>
              </div>

              {/* Barra de Índice de Popularidad (0 - 100) */}
              {typeof artista.popularity === 'number' && artista.popularity > 0 ? (
                <div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '6px'
                    }}
                  >
                    <span
                      style={{
                        fontSize: '0.68rem',
                        color: '#888',
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                        fontWeight: 'bold'
                      }}
                    >
                      <i className="fa-solid fa-fire-flame-curved" style={{ color: '#00F0FF', marginRight: '5px' }} />
                      Índice de Popularidad
                    </span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#00F0FF' }}>
                      {Math.round(artista.popularity)} / 100
                    </span>
                  </div>
                  <div
                    style={{
                      width: '100%',
                      height: '8px',
                      background: 'rgba(255,255,255,0.08)',
                      borderRadius: '999px',
                      overflow: 'hidden',
                      border: '1px solid rgba(255,255,255,0.1)'
                    }}
                  >
                    <div
                      style={{
                        width: `${Math.max(4, Math.min(100, Math.round(artista.popularity)))}%`,
                        height: '100%',
                        background: 'linear-gradient(90deg, #1DB954 0%, #00F0FF 100%)',
                        boxShadow: '0 0 12px rgba(0, 240, 255, 0.6)',
                        borderRadius: '999px',
                        transition: 'width 0.6s ease'
                      }}
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '6px'
                    }}
                  >
                    <span
                      style={{
                        fontSize: '0.68rem',
                        color: '#888',
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                        fontWeight: 'bold'
                      }}
                    >
                      <i className="fa-solid fa-fire-flame-curved" style={{ color: '#00F0FF', marginRight: '5px' }} />
                      Índice de Popularidad
                    </span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#00F0FF' }}>
                      {sincronizandoTelemetria ? 'Calibrando...' : '72 / 100'}
                    </span>
                  </div>
                  <div
                    style={{
                      width: '100%',
                      height: '8px',
                      background: 'rgba(255,255,255,0.08)',
                      borderRadius: '999px',
                      overflow: 'hidden',
                      border: '1px solid rgba(255,255,255,0.1)'
                    }}
                  >
                    <div
                      style={{
                        width: sincronizandoTelemetria ? '60%' : '72%',
                        height: '100%',
                        background: 'linear-gradient(90deg, #1DB954 0%, #00F0FF 100%)',
                        boxShadow: '0 0 12px rgba(0, 240, 255, 0.4)',
                        borderRadius: '999px',
                        transition: 'width 0.6s ease'
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Píldoras de Géneros Musicales */}
            <div>
              <span
                style={{
                  display: 'block',
                  fontSize: '0.68rem',
                  color: '#888',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  fontWeight: 'bold',
                  marginBottom: '8px'
                }}
              >
                ADN de Géneros Registrados:
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {artista.genres && artista.genres.length > 0 ? (
                  artista.genres.map((genre) => (
                    <span
                      key={genre}
                      style={{
                        background: 'rgba(0, 240, 255, 0.1)',
                        color: '#00F0FF',
                        border: '1px solid rgba(0, 240, 255, 0.35)',
                        padding: '4px 11px',
                        borderRadius: '20px',
                        fontSize: '0.73rem',
                        fontWeight: 'bold',
                        textTransform: 'uppercase',
                        letterSpacing: '0.6px'
                      }}
                    >
                      # {genre}
                    </span>
                  ))
                ) : sincronizandoTelemetria ? (
                  <span style={{ color: '#00F0FF', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <i className="fa-solid fa-spinner fa-spin" /> Analizando espectro sonoro...
                  </span>
                ) : (
                  ['SONIDO GLOBAL', 'CATÁLOGO OFICIAL'].map((tag) => (
                    <span
                      key={tag}
                      style={{
                        background: 'rgba(0, 240, 255, 0.08)',
                        color: '#00F0FF',
                        border: '1px solid rgba(0, 240, 255, 0.25)',
                        padding: '4px 11px',
                        borderRadius: '20px',
                        fontSize: '0.73rem',
                        fontWeight: 'bold',
                        letterSpacing: '0.6px'
                      }}
                    >
                      # {tag}
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>

          {artista.spotifyUrl && (
            <div style={{ marginTop: '25px' }}>
              <a
                href={artista.spotifyUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '10px',
                  background: '#1DB954',
                  color: '#000',
                  fontWeight: 'bold',
                  padding: '12px 24px',
                  borderRadius: '30px',
                  textDecoration: 'none',
                  fontSize: '0.9rem',
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                  boxShadow: '0 4px 20px rgba(29, 185, 84, 0.4)',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                }}
              >
                <i className="fa-brands fa-spotify" style={{ fontSize: '1.2rem' }}></i>
                Abrir en Spotify
              </a>
            </div>
          )}
        </div>
      </section>

      {/* 2. NIVEL EXCLUSIVO BÓVEDA (SOLO ARTISTAS DE CULTO EN FIRESTORE): ERAS HISTÓRICAS Y ÁRBOL DE ECOS */}
      {!esSpotify && (
        <>
          <section
            className="catalog-section"
            style={{ borderTop: '1px solid #1a1a1a', paddingTop: '4rem', boxSizing: 'border-box' }}
          >
            <div className="section-header" style={{ justifyContent: 'center', textAlign: 'center', border: 'none' }}>
              <h2>
                Archivo <span className="accent">Sonoro</span>
              </h2>
              <p style={{ color: '#888', marginTop: '10px' }}>
                Explora la evolución y los secretos detrás de la obra.
              </p>
            </div>

            {/* CONTENEDOR DE LA LÍNEA DE TIEMPO */}
            <div
              className="timeline-container"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '3rem',
                padding: esMovil ? '2rem 15px' : '2rem 5%',
                maxWidth: '1000px',
                margin: '0 auto',
                boxSizing: 'border-box',
                width: '100%'
              }}
            >
              {artista.eras &&
                artista.eras.map((era, index) => (
                  <div
                    key={index}
                    className="era-panel"
                    style={{
                      display: 'flex',
                      flexDirection: esMovil ? 'column' : 'row',
                      flexWrap: 'nowrap',
                      gap: '0',
                      background: '#0a0a0a',
                      border: '1px solid #1a1a1a',
                      borderRadius: '15px',
                      overflow: 'hidden',
                      boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                      width: '100%',
                      boxSizing: 'border-box'
                    }}
                  >
                    {/* Imagen de la Era */}
                    <div
                      style={{
                        flex: '1',
                        width: esMovil ? '100%' : 'auto',
                        minWidth: esMovil ? '100%' : '300px',
                        borderRight: esMovil ? 'none' : '1px solid #1a1a1a',
                        borderBottom: esMovil ? '1px solid #1a1a1a' : 'none'
                      }}
                    >
                      <img
                        src={era.img}
                        alt={era.titulo}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          display: 'block',
                          minHeight: esMovil ? '250px' : '300px'
                        }}
                      />
                    </div>

                    {/* Información de la Era */}
                    <div
                      style={{
                        flex: '1.5',
                        width: '100%',
                        minWidth: '0',
                        padding: esMovil ? '2rem 1.5rem' : '3rem 2.5rem',
                        boxSizing: 'border-box',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center'
                      }}
                    >
                      <span
                        className="accent"
                        style={{ fontSize: '1.2rem', fontWeight: 'bold', letterSpacing: '3px' }}
                      >
                        {era.año}
                      </span>
                      <h3
                        style={{
                          fontSize: esMovil ? '1.5rem' : '2rem',
                          margin: '10px 0 15px 0',
                          textTransform: 'uppercase'
                        }}
                      >
                        {era.titulo}
                      </h3>
                      <p style={{ color: '#aaa', lineHeight: '1.7', fontSize: '1rem', wordBreak: 'break-word' }}>
                        {era.descripcion}
                      </p>

                      {/* --- BOTÓN DESPLEGABLE (ACORDEÓN) --- */}
                      <div
                        onClick={() => toggleEra(index)}
                        style={{
                          marginTop: '20px',
                          padding: '15px 20px',
                          border: '1px dashed var(--accent-color)',
                          background: 'rgba(0, 242, 255, 0.05)',
                          cursor: 'pointer',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          borderRadius: '8px',
                          transition: '0.2s',
                          boxSizing: 'border-box'
                        }}
                      >
                        <h4
                          style={{
                            color: 'var(--accent-color)',
                            textTransform: 'uppercase',
                            letterSpacing: '2px',
                            fontSize: esMovil ? '0.75rem' : '0.85rem',
                            margin: 0
                          }}
                        >
                          <i className="fa-solid fa-compact-disc" style={{ marginRight: '8px' }}></i>
                          Repertorio Destacado ({(era.canciones || era.stems || []).length})
                        </h4>
                        <i
                          className="fa-solid fa-chevron-down"
                          style={{
                            color: 'var(--accent-color)',
                            transition: 'transform 0.3s ease',
                            transform: erasExpandidas[index] ? 'rotate(180deg)' : 'rotate(0deg)'
                          }}
                        ></i>
                      </div>

                      {/* --- LISTA DE CANCIONES CON PREESCUCHA SPOTIFY --- */}
                      {erasExpandidas[index] &&
                        (era.canciones || era.stems) &&
                        (era.canciones || era.stems).length > 0 && (
                          <div
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '10px',
                              marginTop: '15px',
                              animation: 'fadeIn 0.3s ease',
                              width: '100%',
                              boxSizing: 'border-box'
                            }}
                          >
                            {(era.canciones || era.stems).map((cancion, idx) => {
                              const esObjeto = typeof cancion === 'object';
                              const titulo = esObjeto ? cancion.titulo : cancion;
                              const isThisActive = activeSongTrack && activeSongTrack.titulo === titulo;
                              const isLoadingThis = loadingTrackTitle === titulo;

                              return (
                                <div
                                  key={idx}
                                  style={{
                                    background: isThisActive ? 'rgba(0, 240, 255, 0.08)' : '#111',
                                    padding: '10px 14px',
                                    borderRadius: '8px',
                                    border: isThisActive ? '1px solid var(--accent-color)' : '1px solid #222',
                                    width: '100%',
                                    boxSizing: 'border-box',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '8px',
                                    transition: '0.2s'
                                  }}
                                >
                                  <div
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'space-between',
                                      gap: '10px',
                                      flexWrap: 'wrap'
                                    }}
                                  >
                                    <div
                                      style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                        overflow: 'hidden',
                                        flex: 1,
                                        minWidth: '150px'
                                      }}
                                    >
                                      <i
                                        className="fa-solid fa-music"
                                        style={{
                                          color: isThisActive ? 'var(--accent-color)' : '#666',
                                          fontSize: '0.85rem'
                                        }}
                                      />
                                      <span
                                        style={{
                                          fontSize: '0.9rem',
                                          color: '#eee',
                                          whiteSpace: 'nowrap',
                                          overflow: 'hidden',
                                          textOverflow: 'ellipsis',
                                          fontWeight: isThisActive ? 'bold' : 'normal'
                                        }}
                                      >
                                        {titulo}
                                      </span>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                      <button
                                        type="button"
                                        onClick={() => handlePlaySong(titulo)}
                                        disabled={isLoadingThis}
                                        title={
                                          isThisActive
                                            ? 'Cerrar reproductor'
                                            : `Reproducir preescucha de "${titulo}"`
                                        }
                                        style={{
                                          background: isThisActive
                                            ? 'var(--accent-color)'
                                            : 'rgba(255,255,255,0.06)',
                                          color: isThisActive ? '#000' : '#fff',
                                          border: isThisActive ? 'none' : '1px solid rgba(255,255,255,0.15)',
                                          padding: '5px 12px',
                                          borderRadius: '5px',
                                          fontSize: '0.72rem',
                                          fontWeight: 'bold',
                                          cursor: isLoadingThis ? 'wait' : 'pointer',
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: '5px',
                                          transition: '0.2s'
                                        }}
                                      >
                                        {isLoadingThis ? (
                                          <i className="fa-solid fa-spinner fa-spin" />
                                        ) : (
                                          <i className={`fa-solid ${isThisActive ? 'fa-pause' : 'fa-play'}`} />
                                        )}
                                        <span>{isThisActive ? 'PAUSAR' : 'ESCUCHAR'}</span>
                                      </button>

                                      <a
                                        href={`https://open.spotify.com/search/${encodeURIComponent(
                                          titulo + ' ' + (artista?.nombre || '')
                                        )}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        title={`Abrir "${titulo}" en Spotify`}
                                        style={{
                                          background: 'rgba(29, 185, 84, 0.15)',
                                          color: '#1db954',
                                          border: '1px solid rgba(29, 185, 84, 0.35)',
                                          padding: '5px 8px',
                                          borderRadius: '5px',
                                          fontSize: '0.75rem',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          textDecoration: 'none',
                                          transition: '0.2s'
                                        }}
                                        onMouseOver={(e) => {
                                          e.currentTarget.style.background = '#1db954';
                                          e.currentTarget.style.color = '#000';
                                        }}
                                        onMouseOut={(e) => {
                                          e.currentTarget.style.background = 'rgba(29, 185, 84, 0.15)';
                                          e.currentTarget.style.color = '#1db954';
                                        }}
                                      >
                                        <i className="fa-brands fa-spotify" />
                                      </a>
                                    </div>
                                  </div>

                                  {/* Reproductor Spotify incrustado cuando la canción está activa */}
                                  {isThisActive && activeSongTrack.trackId && (
                                    <div
                                      style={{
                                        marginTop: '6px',
                                        borderRadius: '8px',
                                        overflow: 'hidden',
                                        animation: 'fadeIn 0.3s ease'
                                      }}
                                    >
                                      <iframe
                                        src={`https://open.spotify.com/embed/track/${activeSongTrack.trackId}?utm_source=generator&theme=0`}
                                        width="100%"
                                        height="80"
                                        frameBorder="0"
                                        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                                        loading="lazy"
                                        style={{ borderRadius: '6px', border: 'none' }}
                                        title={`Spotify Player ${titulo}`}
                                      />
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                    </div>
                  </div>
                ))}
            </div>
          </section>
          <ArbolEcos ecos={artista.ecos} artistaActual={artista.nombre} />
        </>
      )}

      {/* 3. CATÁLOGO OFICIAL Y TRANSMISIÓN EN VIVO DE SPOTIFY (UNIFICADO PARA PERFILES CURADOS Y DINÁMICOS) */}
      {((spotifyTopTracks && spotifyTopTracks.length > 0) ||
        (spotifyAlbums && spotifyAlbums.length > 0) ||
        (artista.spotifyId && !String(artista.spotifyId).startsWith('dz_'))) && (
        <section
          className="catalog-section"
          style={{
            borderTop: '1px solid #1a1a1a',
            paddingTop: '3.5rem',
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '3.5rem 5% 5rem 5%',
            boxSizing: 'border-box'
          }}
        >
          {/* TOP TRACKS INTERACTIVOS DE SPOTIFY */}
          {spotifyTopTracks && spotifyTopTracks.length > 0 && (
            <div style={{ marginBottom: '4.5rem' }}>
              <div
                className="section-header"
                style={{ justifyContent: 'center', textAlign: 'center', border: 'none', marginBottom: '2rem' }}
              >
                <h2>
                  Top Tracks <span className="accent">Esenciales</span>
                </h2>
                <p style={{ color: '#888', marginTop: '8px' }}>
                  Las piezas de mayor rotación del artista con preescucha directa integrada en la Bóveda.
                </p>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: esMovil ? '1fr' : 'repeat(auto-fit, minmax(420px, 1fr))',
                  gap: '14px',
                  maxWidth: '1040px',
                  margin: '0 auto'
                }}
              >
                {spotifyTopTracks.map((track, idx) => {
                  const isTrackActive = activeTopTrackId === track.id;
                  const albumCover =
                    track.album?.images?.[1]?.url ||
                    track.album?.images?.[0]?.url ||
                    artista.imagen;
                  const trackSpotifyUrl =
                    track.external_urls?.spotify || `https://open.spotify.com/track/${track.id}`;

                  return (
                    <div
                      key={track.id || idx}
                      style={{
                        background: isTrackActive ? 'rgba(0, 240, 255, 0.08)' : '#0c0e14',
                        border: isTrackActive
                          ? '1px solid var(--accent-color)'
                          : '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '12px',
                        padding: '12px 14px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                        transition: '0.2s',
                        boxShadow: isTrackActive ? '0 0 20px rgba(0, 240, 255, 0.15)' : 'none'
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '12px'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1 }}>
                          <span
                            style={{
                              fontFamily: 'monospace',
                              fontSize: '0.82rem',
                              fontWeight: 'bold',
                              color: isTrackActive ? 'var(--accent-color)' : '#555',
                              minWidth: '22px'
                            }}
                          >
                            {(idx + 1).toString().padStart(2, '0')}
                          </span>
                          <img
                            src={albumCover}
                            alt={track.name}
                            style={{
                              width: '46px',
                              height: '46px',
                              borderRadius: '8px',
                              objectFit: 'cover',
                              flexShrink: 0,
                              border: '1px solid rgba(255,255,255,0.1)'
                            }}
                          />
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <h4
                              style={{
                                margin: '0 0 3px 0',
                                fontSize: '0.92rem',
                                color: '#fff',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                              }}
                            >
                              {track.name}
                            </h4>
                            <span
                              style={{
                                fontSize: '0.74rem',
                                color: '#888',
                                display: 'block',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                              }}
                            >
                              {track.album?.name || artista.nombre} • {formatDurationMs(track.duration_ms)}
                            </span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveSongTrack(null);
                              setActiveTopTrackId(isTrackActive ? null : track.id);
                            }}
                            style={{
                              background: isTrackActive ? 'var(--accent-color)' : 'rgba(29, 185, 84, 0.16)',
                              color: isTrackActive ? '#000' : '#1DB954',
                              border: isTrackActive ? 'none' : '1px solid rgba(29, 185, 84, 0.4)',
                              padding: '6px 12px',
                              borderRadius: '20px',
                              fontSize: '0.73rem',
                              fontWeight: 'bold',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              transition: '0.2s'
                            }}
                          >
                            <i className={`fa-solid ${isTrackActive ? 'fa-Stop' : 'fa-play'}`.toLowerCase()} />
                            <span>{isTrackActive ? 'CERRAR' : 'ESCUCHAR'}</span>
                          </button>

                          <a
                            href={trackSpotifyUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Abrir canción en Spotify"
                            style={{
                              color: '#888',
                              fontSize: '0.9rem',
                              padding: '4px 6px',
                              textDecoration: 'none'
                            }}
                          >
                            <i className="fa-solid fa-arrow-up-right-from-square" />
                          </a>
                        </div>
                      </div>

                      {isTrackActive && (
                        <div style={{ marginTop: '4px', borderRadius: '8px', overflow: 'hidden' }}>
                          <iframe
                            src={`https://open.spotify.com/embed/track/${track.id}?utm_source=generator&theme=0`}
                            width="100%"
                            height="80"
                            frameBorder="0"
                            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                            loading="lazy"
                            style={{ borderRadius: '8px', border: 'none', display: 'block' }}
                            title={`Reproductor Top Track ${track.name}`}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* REPRODUCTOR EMBEBIDO OFICIAL DE SPOTIFY */}
          {artista.spotifyId && !String(artista.spotifyId).startsWith('dz_') && (
            <div style={{ marginBottom: '4rem' }}>
              <div
                className="section-header"
                style={{ justifyContent: 'center', textAlign: 'center', border: 'none', marginBottom: '2rem' }}
              >
                <h2>
                  Transmisión <span className="accent">Oficial</span>
                </h2>
                <p style={{ color: '#888', marginTop: '8px' }}>
                  Escucha su catálogo completo en vivo a través de la terminal de Spotify.
                </p>
              </div>

              <div
                style={{
                  maxWidth: '850px',
                  margin: '0 auto',
                  background: '#08080c',
                  borderRadius: '18px',
                  padding: '10px',
                  border: '1px solid rgba(29, 185, 84, 0.25)',
                  boxShadow: '0 10px 40px rgba(0, 0, 0, 0.6)'
                }}
              >
                <iframe
                  src={`https://open.spotify.com/embed/artist/${artista.spotifyId}?utm_source=generator&theme=0`}
                  width="100%"
                  height="380"
                  frameBorder="0"
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                  loading="lazy"
                  title={`Reproductor Spotify de ${artista.nombre}`}
                  style={{ borderRadius: '14px', display: 'block' }}
                />
              </div>
            </div>
          )}

          {/* DISCOGRAFÍA OFICIAL */}
          {spotifyAlbums && spotifyAlbums.length > 0 && (
            <div>
              <div
                className="section-header"
                style={{ justifyContent: 'center', textAlign: 'center', border: 'none', marginBottom: '2.5rem' }}
              >
                <h2>
                  Discografía <span className="accent">Indexada</span>
                </h2>
                <p style={{ color: '#888', marginTop: '8px' }}>
                  Álbumes y lanzamientos oficiales registrados en la Bóveda.
                </p>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                  gap: '2rem'
                }}
              >
                {spotifyAlbums.map((album) => {
                  const cover =
                    album.images?.[0]?.url ||
                    'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=500&q=80';
                  const releaseYear = album.release_date ? album.release_date.split('-')[0] : 'N/A';
                  const linkAlbum = album.external_urls?.spotify;

                  return (
                    <a
                      key={album.id}
                      href={linkAlbum}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        background: '#0c0e12',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '14px',
                        overflow: 'hidden',
                        textDecoration: 'none',
                        color: 'inherit',
                        display: 'flex',
                        flexDirection: 'column',
                        transition: 'transform 0.3s ease, border-color 0.3s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-6px)';
                        e.currentTarget.style.borderColor = '#1DB954';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                      }}
                    >
                      <div style={{ width: '100%', aspectRatio: '1/1', overflow: 'hidden' }}>
                        <img
                          src={cover}
                          alt={album.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          loading="lazy"
                        />
                      </div>
                      <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            color: '#1DB954',
                            fontWeight: 'bold',
                            letterSpacing: '1px',
                            textTransform: 'uppercase'
                          }}
                        >
                          {album.album_type || 'ÁLBUM'} • {releaseYear}
                        </span>
                        <h4
                          style={{
                            margin: '6px 0 10px 0',
                            fontSize: '0.95rem',
                            color: '#fff',
                            lineHeight: '1.4'
                          }}
                        >
                          {album.name}
                        </h4>
                        <span
                          style={{
                            marginTop: 'auto',
                            fontSize: '0.8rem',
                            color: '#888',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          <i className="fa-brands fa-spotify" style={{ color: '#1DB954' }}></i>
                          Escuchar en Spotify
                        </span>
                      </div>
                    </a>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      )}
    </main>
  );
}
