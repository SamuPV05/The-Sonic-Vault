import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import {
  isSpotifyConnected,
  loginWithSpotify,
  logoutSpotify,
  getSpotifyUserProfile,
  getUserTopArtists,
  getUserTopTracks,
  getCurrentlyPlaying,
  controlPlayback
} from '../services/spotifyService';
import HolographicPassport from './HolographicPassport';
import SonicTimeCapsule from './SonicTimeCapsule';
import {
  calculateSoundArchetype,
  getDemoArchetype,
  calculateTasteStability
} from '../utils/archetypeCalculator';

export default function SpotifyProfileWidget({ userAuthName = '' }) {
  const [conectado, setConectado] = useState(isSpotifyConnected());
  const [cargando, setCargando] = useState(false);
  const [perfilSpotify, setPerfilSpotify] = useState(null);
  const [rangoTiempo, setRangoTiempo] = useState('medium_term'); // 'short_term', 'medium_term', 'long_term'
  const [nowPlaying, setNowPlaying] = useState(null);
  const [reproduciendo, setReproduciendo] = useState(false);

  // Caché de artistas y tracks por rango temporal
  const [artistsByRange, setArtistsByRange] = useState({
    short_term: [],
    medium_term: [],
    long_term: []
  });
  const [tracksByRange, setTracksByRange] = useState({
    short_term: [],
    medium_term: [],
    long_term: []
  });

  const [stabilityData, setStabilityData] = useState(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Carga inicial y por cambio de rango temporal
  useEffect(() => {
    if (!conectado) return;

    let cancelado = false;
    const cargarDatos = async () => {
      setCargando(true);
      try {
        // Si no tenemos el perfil, lo pedimos
        let perfil = perfilSpotify;
        if (!perfil) {
          perfil = await getSpotifyUserProfile();
          if (!cancelado && perfil) {
            setPerfilSpotify(perfil);
          }
        }

        // Consultar artistas y canciones para el rango activo si no están en caché
        let artistas = artistsByRange[rangoTiempo];
        let canciones = tracksByRange[rangoTiempo];

        if (!artistas || artistas.length === 0) {
          artistas = await getUserTopArtists(rangoTiempo, 10);
        }
        if (!canciones || canciones.length === 0) {
          canciones = await getUserTopTracks(rangoTiempo, 10);
        }

        const actual = await getCurrentlyPlaying();

        if (!cancelado) {
          setArtistsByRange(prev => ({ ...prev, [rangoTiempo]: artistas }));
          setTracksByRange(prev => ({ ...prev, [rangoTiempo]: canciones }));

          if (actual && actual.item) {
            setNowPlaying(actual);
            setReproduciendo(actual.is_playing);
          }

          // Si falta cargar los otros rangos para la estabilidad, cargarlos en segundo plano
          setTimeout(async () => {
            if (cancelado) return;
            try {
              const [shortA, longA] = await Promise.all([
                artistsByRange.short_term.length ? artistsByRange.short_term : getUserTopArtists('short_term', 10),
                artistsByRange.long_term.length ? artistsByRange.long_term : getUserTopArtists('long_term', 10)
              ]);

              if (!cancelado) {
                setArtistsByRange(prev => ({
                  ...prev,
                  short_term: shortA,
                  long_term: longA
                }));

                const stab = calculateTasteStability(shortA, artistas, longA);
                setStabilityData(stab);
              }
            } catch (err) {
              console.warn('Error calculando estabilidad temporal:', err);
            }
          }, 400);
        }
      } catch (e) {
        console.error('Error cargando datos de Spotify:', e);
      } finally {
        if (!cancelado) setCargando(false);
      }
    };

    cargarDatos();

    // Polling ligero para el reproductor en vivo cada 5 segundos
    const intervalo = setInterval(async () => {
      try {
        const actual = await getCurrentlyPlaying();
        if (!cancelado && isMounted.current) {
          if (actual && actual.item) {
            setNowPlaying(actual);
            setReproduciendo(actual.is_playing);
          } else {
            setNowPlaying(null);
          }
        }
      } catch (e) {
        // Silencioso
      }
    }, 5000);

    return () => {
      cancelado = true;
      clearInterval(intervalo);
    };
  }, [conectado, rangoTiempo]);

  const handleDesconectar = () => {
    logoutSpotify();
    setConectado(false);
    setPerfilSpotify(null);
    setArtistsByRange({ short_term: [], medium_term: [], long_term: [] });
    setTracksByRange({ short_term: [], medium_term: [], long_term: [] });
    setNowPlaying(null);
    setStabilityData(null);
  };

  const handleControl = async (accion) => {
    const ok = await controlPlayback(accion);
    if (ok) {
      if (accion === 'play') setReproduciendo(true);
      if (accion === 'pause') setReproduciendo(false);
      setTimeout(async () => {
        const actual = await getCurrentlyPlaying();
        if (actual && actual.item && isMounted.current) {
          setNowPlaying(actual);
          setReproduciendo(actual.is_playing);
        }
      }, 500);
    }
  };

  // Artistas y canciones actuales
  const currentArtists = artistsByRange[rangoTiempo] || [];
  const currentTracks = tracksByRange[rangoTiempo] || [];

  // ==========================================================================
  // ESTADO: NO CONECTADO (MODO PREVIEW HOLOGRÁFICO)
  // ==========================================================================
  if (!conectado) {
    const demoData = getDemoArchetype(userAuthName || 'Agente de Bóveda');

    return (
      <section style={{ marginBottom: '3.5rem' }}>
        {/* PASAPORTE HOLOGRÁFICO EN MODO PROTOTIPO INTERACTIVO */}
        <HolographicPassport
          passportData={demoData}
          onConnectSpotify={loginWithSpotify}
        />

        {/* BANNER DE INVITACIÓN AL ENLACE NEURAL */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(15, 25, 20, 0.75) 0%, rgba(10, 15, 12, 0.95) 100%)',
          border: '1px solid rgba(29, 185, 84, 0.35)',
          borderRadius: '18px',
          padding: '2.5rem',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            top: '-50px',
            right: '-50px',
            width: '220px',
            height: '220px',
            background: 'radial-gradient(circle, rgba(29, 185, 84, 0.2) 0%, transparent 70%)',
            borderRadius: '50%',
            filter: 'blur(35px)',
            pointerEvents: 'none'
          }} />

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.5rem', position: 'relative', zIndex: 1 }}>
            <div style={{ maxWidth: '680px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(29, 185, 84, 0.12)', border: '1px solid rgba(29, 185, 84, 0.4)', padding: '5px 12px', borderRadius: '20px', marginBottom: '12px' }}>
                <i className="fa-brands fa-spotify" style={{ color: '#1DB954', fontSize: '0.9rem' }} />
                <span style={{ color: '#1DB954', fontSize: '0.75rem', fontWeight: 'bold', letterSpacing: '2px', textTransform: 'uppercase' }}>
                  Enlace Neural // Spotify API Oficial
                </span>
              </div>
              <h2 style={{ color: '#fff', fontSize: '1.8rem', margin: '0 0 10px 0', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Desbloquea tu Pasaporte Real con Spotify
              </h2>
              <p style={{ color: '#aaa', lineHeight: '1.6', margin: 0, fontSize: '0.95rem' }}>
                Calcula tu <strong>Arquetipo Sonoro</strong> personalizado según tus hábitos reales de escucha, explora tu <strong>Cápsula del Tiempo</strong> (Último mes vs Histórico) y descarga tu Pasaporte Holográfico en HD.
              </p>
            </div>

            <button
              onClick={loginWithSpotify}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '12px',
                background: '#1DB954',
                color: '#000',
                border: 'none',
                padding: '14px 28px',
                borderRadius: '35px',
                fontWeight: 'bold',
                fontSize: '0.95rem',
                letterSpacing: '1px',
                textTransform: 'uppercase',
                cursor: 'pointer',
                boxShadow: '0 6px 25px rgba(29, 185, 84, 0.35)',
                transition: 'transform 0.2s, box-shadow 0.2s'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = '0 10px 30px rgba(29, 185, 84, 0.5)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 6px 25px rgba(29, 185, 84, 0.35)';
              }}
            >
              <i className="fa-brands fa-spotify" style={{ fontSize: '1.4rem' }} />
              Sincronizar Spotify
            </button>
          </div>
        </div>
      </section>
    );
  }

  // ==========================================================================
  // ESTADO: CONECTADO (PASAPORTE REAL + NOW PLAYING + CÁPSULA DEL TIEMPO)
  // ==========================================================================
  const passportData = calculateSoundArchetype(currentArtists, currentTracks, perfilSpotify);

  return (
    <section style={{ marginBottom: '3.5rem' }}>
      {/* 1. PASAPORTE HOLOGRÁFICO 3D EN LA CIMA */}
      <HolographicPassport passportData={passportData} />

      {/* 2. BARRA DE CONTROL DE CONEXIÓN SPOTIFY */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(12, 18, 15, 0.85) 0%, rgba(8, 10, 12, 0.95) 100%)',
        border: '1px solid rgba(29, 185, 84, 0.3)',
        borderRadius: '16px',
        padding: '1.5rem 2rem',
        marginBottom: '2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          {perfilSpotify?.images?.[0]?.url ? (
            <img
              src={perfilSpotify.images[0].url}
              alt={perfilSpotify.display_name}
              style={{ width: '50px', height: '50px', borderRadius: '50%', border: '2px solid #1DB954', objectFit: 'cover' }}
            />
          ) : (
            <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: '#1DB954', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="fa-brands fa-spotify" style={{ color: '#000', fontSize: '1.6rem' }} />
            </div>
          )}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ color: '#fff', margin: 0, fontSize: '1.15rem' }}>{perfilSpotify?.display_name || 'Agente de Spotify'}</h3>
              {perfilSpotify?.product === 'premium' && (
                <span style={{ background: 'linear-gradient(90deg, #ffb300, #ff8000)', color: '#000', fontWeight: 'bold', fontSize: '0.65rem', padding: '2px 8px', borderRadius: '10px', letterSpacing: '1px' }}>
                  PREMIUM
                </span>
              )}
            </div>
            <span style={{ fontSize: '0.75rem', color: '#1DB954', letterSpacing: '1px', textTransform: 'uppercase' }}>
              Enlace Neural Activo // Transmisión Sincronizada
            </span>
          </div>
        </div>

        <button
          onClick={handleDesconectar}
          style={{
            background: 'transparent',
            border: '1px solid rgba(255, 77, 77, 0.4)',
            color: '#ff4d4d',
            padding: '8px 16px',
            borderRadius: '20px',
            cursor: 'pointer',
            fontSize: '0.8rem',
            letterSpacing: '1px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.2s'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(255, 77, 77, 0.1)';
            e.currentTarget.style.borderColor = '#ff4d4d';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.borderColor = 'rgba(255, 77, 77, 0.4)';
          }}
        >
          <i className="fa-solid fa-power-off" /> Desvincular
        </button>
      </div>

      {/* 3. REPRODUCTOR EN VIVO (NOW PLAYING - EXCLUSIVO PREMIUM) */}
      <div style={{
        background: 'rgba(0, 0, 0, 0.5)',
        border: '1px solid rgba(29, 185, 84, 0.2)',
        borderRadius: '16px',
        padding: '1.25rem 1.5rem',
        marginBottom: '2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1.25rem'
      }}>
        {nowPlaying?.item ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: '260px' }}>
              <img
                src={nowPlaying.item.album?.images?.[0]?.url}
                alt={nowPlaying.item.name}
                style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '8px',
                  boxShadow: '0 4px 15px rgba(0, 0, 0, 0.5)',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}
              />
              <div>
                <span style={{ fontSize: '0.7rem', color: '#1DB954', letterSpacing: '1.5px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#1DB954', display: 'inline-block', animation: 'pulse 1.5s infinite' }} />
                  Reproduciendo Ahora en tu Spotify
                </span>
                <h4 style={{ color: '#fff', margin: '4px 0 2px 0', fontSize: '1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '300px' }}>
                  {nowPlaying.item.name}
                </h4>
                <p style={{ color: '#888', margin: 0, fontSize: '0.8rem' }}>
                  {nowPlaying.item.artists?.map(a => a.name).join(', ')}
                </p>
              </div>
            </div>

            {/* CONTROLES REMOTOS PREMIUM */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button
                onClick={() => handleControl('previous')}
                title="Pista Anterior"
                style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: '#fff', width: '38px', height: '38px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <i className="fa-solid fa-backward-step" />
              </button>
              <button
                onClick={() => handleControl(reproduciendo ? 'pause' : 'play')}
                title={reproduciendo ? 'Pausar' : 'Reproducir'}
                style={{ background: '#1DB954', border: 'none', color: '#000', width: '44px', height: '44px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.05rem' }}
              >
                <i className={`fa-solid ${reproduciendo ? 'fa-pause' : 'fa-play'}`} />
              </button>
              <button
                onClick={() => handleControl('next')}
                title="Siguiente Pista"
                style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: '#fff', width: '38px', height: '38px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <i className="fa-solid fa-forward-step" />
              </button>
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', color: '#777', width: '100%', padding: '0.25rem 0' }}>
            <i className="fa-solid fa-headphones" style={{ fontSize: '1.4rem', color: '#444' }} />
            <div>
              <p style={{ margin: 0, color: '#aaa', fontSize: '0.9rem' }}>
                No hay reproducción activa detectada en tu Spotify ahora mismo.
              </p>
              <span style={{ fontSize: '0.75rem', color: '#555' }}>
                Dale play a una canción en cualquier dispositivo (celular o PC) y aparecerá sincronizada aquí en tiempo real.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 4. CÁPSULA DEL TIEMPO (EVOLUCIÓN TEMPORAL, ESTABILIDAD Y EXPLORADOR) */}
      <SonicTimeCapsule
        activeRange={rangoTiempo}
        onRangeChange={setRangoTiempo}
        stabilityData={stabilityData}
        topArtists={currentArtists}
        topTracks={currentTracks}
        isLoading={cargando}
      />
    </section>
  );
}

SpotifyProfileWidget.propTypes = {
  userAuthName: PropTypes.string
};
