import { useState, useEffect } from 'react';
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

export default function SpotifyProfileWidget() {
  const [conectado, setConectado] = useState(isSpotifyConnected());
  const [cargando, setCargando] = useState(false);
  const [perfilSpotify, setPerfilSpotify] = useState(null);
  const [topArtists, setTopArtists] = useState([]);
  const [topTracks, setTopTracks] = useState([]);
  const [nowPlaying, setNowPlaying] = useState(null);
  const [reproduciendo, setReproduciendo] = useState(false);
  const [rangoTiempo, setRangoTiempo] = useState('medium_term'); // 'short_term', 'medium_term', 'long_term'

  // Cargar datos al estar conectado
  useEffect(() => {
    if (!conectado) return;

    let cancelado = false;
    const cargarDatos = async () => {
      setCargando(true);
      try {
        const [perfil, artistas, canciones, actual] = await Promise.all([
          getSpotifyUserProfile(),
          getUserTopArtists(rangoTiempo, 5),
          getUserTopTracks(rangoTiempo, 5),
          getCurrentlyPlaying()
        ]);

        if (!cancelado) {
          setPerfilSpotify(perfil);
          setTopArtists(artistas);
          setTopTracks(canciones);
          if (actual && actual.item) {
            setNowPlaying(actual);
            setReproduciendo(actual.is_playing);
          }
        }
      } catch (e) {
        console.error('Error cargando datos de Spotify:', e);
      } finally {
        if (!cancelado) setCargando(false);
      }
    };

    cargarDatos();

    // Polling ligero para el reproductor en vivo cada 6 segundos
    const intervalo = setInterval(async () => {
      try {
        const actual = await getCurrentlyPlaying();
        if (!cancelado) {
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
    }, 6000);

    return () => {
      cancelado = true;
      clearInterval(intervalo);
    };
  }, [conectado, rangoTiempo]);

  const handleDesconectar = () => {
    logoutSpotify();
    setConectado(false);
    setPerfilSpotify(null);
    setTopArtists([]);
    setTopTracks([]);
    setNowPlaying(null);
  };

  const handleControl = async (accion) => {
    const ok = await controlPlayback(accion);
    if (ok) {
      if (accion === 'play') setReproduciendo(true);
      if (accion === 'pause') setReproduciendo(false);
      // Actualizar estado en vivo tras 500ms
      setTimeout(async () => {
        const actual = await getCurrentlyPlaying();
        if (actual && actual.item) {
          setNowPlaying(actual);
          setReproduciendo(actual.is_playing);
        }
      }, 500);
    }
  };

  // ESTADO: NO CONECTADO
  if (!conectado) {
    return (
      <section style={{
        background: 'linear-gradient(135deg, rgba(15, 25, 20, 0.7) 0%, rgba(10, 15, 12, 0.95) 100%)',
        border: '1px solid rgba(29, 185, 84, 0.3)',
        borderRadius: '16px',
        padding: '2.5rem',
        marginBottom: '2.5rem',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: '-50px',
          right: '-50px',
          width: '200px',
          height: '200px',
          background: 'radial-gradient(circle, rgba(29, 185, 84, 0.15) 0%, transparent 70%)',
          borderRadius: '50%',
          filter: 'blur(30px)',
          pointerEvents: 'none'
        }} />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.5rem', position: 'relative', zIndex: 1 }}>
          <div style={{ maxWidth: '650px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(29, 185, 84, 0.12)', border: '1px solid rgba(29, 185, 84, 0.4)', padding: '5px 12px', borderRadius: '20px', marginBottom: '12px' }}>
              <i className="fa-brands fa-spotify" style={{ color: '#1DB954', fontSize: '0.9rem' }} />
              <span style={{ color: '#1DB954', fontSize: '0.75rem', fontWeight: 'bold', letterSpacing: '2px', textTransform: 'uppercase' }}>
                Enlace Neural // Spotify API
              </span>
            </div>
            <h2 style={{ color: '#fff', fontSize: '1.8rem', margin: '0 0 10px 0', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Conecta tu ADN Sonoro de Spotify
            </h2>
            <p style={{ color: '#aaa', lineHeight: '1.6', margin: 0, fontSize: '0.95rem' }}>
              Sincroniza tu cuenta (especialmente con Spotify Premium) para desbloquear tus Top Artistas y Canciones en la Bóveda y controlar tu música en vivo desde este panel.
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
      </section>
    );
  }

  // ESTADO: CONECTADO
  return (
    <section style={{
      background: 'linear-gradient(135deg, rgba(12, 18, 15, 0.85) 0%, rgba(8, 10, 12, 0.95) 100%)',
      border: '1px solid rgba(29, 185, 84, 0.3)',
      borderRadius: '16px',
      padding: '2.5rem',
      marginBottom: '2.5rem',
      boxShadow: '0 15px 40px rgba(0, 0, 0, 0.6)',
      position: 'relative'
    }}>
      {/* CABECERA DE LA CONEXIÓN */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          {perfilSpotify?.images?.[0]?.url ? (
            <img
              src={perfilSpotify.images[0].url}
              alt={perfilSpotify.display_name}
              style={{ width: '55px', height: '55px', borderRadius: '50%', border: '2px solid #1DB954', objectFit: 'cover' }}
            />
          ) : (
            <div style={{ width: '55px', height: '55px', borderRadius: '50%', background: '#1DB954', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="fa-brands fa-spotify" style={{ color: '#000', fontSize: '1.8rem' }} />
            </div>
          )}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ color: '#fff', margin: 0, fontSize: '1.25rem' }}>{perfilSpotify?.display_name || 'Agente de Spotify'}</h3>
              {perfilSpotify?.product === 'premium' && (
                <span style={{ background: 'linear-gradient(90deg, #ffb300, #ff8000)', color: '#000', fontWeight: 'bold', fontSize: '0.65rem', padding: '2px 8px', borderRadius: '10px', letterSpacing: '1px' }}>
                  PREMIUM
                </span>
              )}
            </div>
            <span style={{ fontSize: '0.8rem', color: '#1DB954', letterSpacing: '1px', textTransform: 'uppercase' }}>
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

      {/* REPRODUCTOR EN VIVO (NOW PLAYING - EXCLUSIVO PREMIUM) */}
      <div style={{
        background: 'rgba(0, 0, 0, 0.5)',
        border: '1px solid rgba(29, 185, 84, 0.2)',
        borderRadius: '14px',
        padding: '1.5rem',
        marginBottom: '2.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1.5rem'
      }}>
        {nowPlaying?.item ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: '260px' }}>
              <img
                src={nowPlaying.item.album?.images?.[0]?.url}
                alt={nowPlaying.item.name}
                style={{
                  width: '65px',
                  height: '65px',
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
                <h4 style={{ color: '#fff', margin: '4px 0 2px 0', fontSize: '1.05rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '300px' }}>
                  {nowPlaying.item.name}
                </h4>
                <p style={{ color: '#888', margin: 0, fontSize: '0.85rem' }}>
                  {nowPlaying.item.artists?.map(a => a.name).join(', ')}
                </p>
              </div>
            </div>

            {/* CONTROLES DE REPRODUCCIÓN (PREMIUM) */}
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
                style={{ background: '#1DB954', border: 'none', color: '#000', width: '46px', height: '46px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', color: '#777', width: '100%', padding: '0.5rem 0' }}>
            <i className="fa-solid fa-headphones" style={{ fontSize: '1.6rem', color: '#444' }} />
            <div>
              <p style={{ margin: 0, color: '#aaa', fontSize: '0.95rem' }}>
                No hay reproducción activa detectada en tu Spotify ahora mismo.
              </p>
              <span style={{ fontSize: '0.75rem', color: '#555' }}>
                Dale play a una canción en cualquier dispositivo (celular o PC) y aparecerá aquí en tiempo real.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* SELECTOR DE PERÍODO TEMPORAL PARA ADN SONORO */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <h3 style={{ color: '#fff', fontSize: '1.2rem', margin: 0, letterSpacing: '1px', textTransform: 'uppercase' }}>
          <i className="fa-solid fa-dna" style={{ color: '#1DB954', marginRight: '8px' }} />
          ADN Sonoro // Tus Frecuencias Más Escuchadas
        </h3>
        <div style={{ display: 'flex', gap: '8px' }}>
          {[
            { id: 'short_term', label: 'Último Mes' },
            { id: 'medium_term', label: '6 Meses' },
            { id: 'long_term', label: 'Histórico' }
          ].map(r => (
            <button
              key={r.id}
              onClick={() => setRangoTiempo(r.id)}
              style={{
                background: rangoTiempo === r.id ? '#1DB954' : 'rgba(255,255,255,0.05)',
                color: rangoTiempo === r.id ? '#000' : '#888',
                border: 'none',
                padding: '6px 14px',
                borderRadius: '15px',
                fontSize: '0.75rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: '0.2s'
              }}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* GRID DE TOP ARTISTAS Y CANCIONES */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
        {/* TOP ARTISTAS */}
        <div style={{ background: '#0a0d10', borderRadius: '12px', padding: '1.5rem', border: '1px solid rgba(255,255,255,0.05)' }}>
          <h4 style={{ color: '#1DB954', textTransform: 'uppercase', letterSpacing: '1.5px', fontSize: '0.85rem', margin: '0 0 1rem 0' }}>
            <i className="fa-solid fa-star" style={{ marginRight: '6px' }} /> Top 5 Artistas
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {topArtists.map((artista, idx) => (
              <div key={artista.id} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ color: '#555', fontWeight: 'bold', fontSize: '0.85rem', width: '18px' }}>{idx + 1}</span>
                <img
                  src={artista.images?.[0]?.url}
                  alt={artista.name}
                  style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover' }}
                />
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <a
                    href={artista.external_urls?.spotify}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#fff', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 'bold', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                  >
                    {artista.name}
                  </a>
                  <span style={{ color: '#666', fontSize: '0.75rem', textTransform: 'capitalize' }}>
                    {artista.genres?.slice(0, 2).join(' • ') || 'Música'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* TOP CANCIONES */}
        <div style={{ background: '#0a0d10', borderRadius: '12px', padding: '1.5rem', border: '1px solid rgba(255,255,255,0.05)' }}>
          <h4 style={{ color: '#1DB954', textTransform: 'uppercase', letterSpacing: '1.5px', fontSize: '0.85rem', margin: '0 0 1rem 0' }}>
            <i className="fa-solid fa-fire" style={{ marginRight: '6px' }} /> Top 5 Canciones
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {topTracks.map((cancion, idx) => (
              <div key={cancion.id} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ color: '#555', fontWeight: 'bold', fontSize: '0.85rem', width: '18px' }}>{idx + 1}</span>
                <img
                  src={cancion.album?.images?.[0]?.url}
                  alt={cancion.name}
                  style={{ width: '42px', height: '42px', borderRadius: '6px', objectFit: 'cover' }}
                />
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <a
                    href={cancion.external_urls?.spotify}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#fff', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 'bold', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                  >
                    {cancion.name}
                  </a>
                  <span style={{ color: '#666', fontSize: '0.75rem' }}>
                    {cancion.artists?.map(a => a.name).join(', ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
