import { useState, useEffect, useRef } from 'react';
import { getSpotifyNewReleases } from '../services/spotifyService';

const FALLBACK_RELEASES = [
  {
    id: '4czdORIRfl2HGviYKAv508',
    name: 'Hackney Diamonds',
    artist: 'The Rolling Stones',
    releaseDate: '2023-10-20',
    totalTracks: 12,
    type: 'album',
    image: 'https://i.scdn.co/image/ab67616d0000b273b400a4fb16efbc9e73f8430b',
    spotifyUrl: 'https://open.spotify.com/album/4czdORIRfl2HGviYKAv508'
  },
  {
    id: '2guirTSE4bF0L8zJVR8G9v',
    name: 'HIT ME HARD AND SOFT',
    artist: 'Billie Eilish',
    releaseDate: '2024-05-17',
    totalTracks: 10,
    type: 'album',
    image: 'https://i.scdn.co/image/ab67616d0000b27371d62ea7ea8a5be92d3c1f62',
    spotifyUrl: 'https://open.spotify.com/album/2guirTSE4bF0L8zJVR8G9v'
  },
  {
    id: '3Uqu1m845ZMsxqrhP9KGj5',
    name: 'Die With A Smile',
    artist: 'Lady Gaga, Bruno Mars',
    releaseDate: '2024-08-16',
    totalTracks: 1,
    type: 'single',
    image: 'https://i.scdn.co/image/ab67616d0000b27382ea2e9e1f582d6e32a4e230',
    spotifyUrl: 'https://open.spotify.com/album/3Uqu1m845ZMsxqrhP9KGj5'
  },
  {
    id: '1NAmidJlEaVgA3MpcZTqui',
    name: 'Dancing in the Flames',
    artist: 'The Weeknd',
    releaseDate: '2024-09-13',
    totalTracks: 1,
    type: 'single',
    image: 'https://i.scdn.co/image/ab67616d0000b273c5649add07ed3720be093046',
    spotifyUrl: 'https://open.spotify.com/album/1NAmidJlEaVgA3MpcZTqui'
  }
];

export default function SpotifyNewReleases() {
  const [releases, setReleases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all' | 'album' | 'single'
  const [activePreview, setActivePreview] = useState(null); // album object
  const scrollRef = useRef(null);

  const fetchReleases = async () => {
    try {
      setLoading(true);
      const data = await getSpotifyNewReleases(20);
      if (data && data.length > 0) {
        setReleases(data);
      } else {
        setReleases(FALLBACK_RELEASES);
      }
    } catch (err) {
      console.error('Error cargando estrenos de Spotify:', err);
      setReleases(FALLBACK_RELEASES);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReleases();
  }, []);


  const handleScroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -380 : 380;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const filteredReleases = releases.filter(item => {
    if (filter === 'album') return item.type === 'album';
    if (filter === 'single') return item.type === 'single';
    return true;
  });

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const parts = dateString.split('-');
      if (parts.length === 3) {
        const d = new Date(parts[0], parts[1] - 1, parts[2]);
        return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
      }
      return dateString;
    } catch {
      return dateString;
    }
  };

  return (
    <section style={{ maxWidth: '1160px', margin: '0 auto 6rem auto', padding: '0 2rem' }}>
      
      {/* Encabezado del Radar de Estrenos */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.8rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '6px', 
              background: 'rgba(29, 185, 84, 0.12)', 
              color: '#1db954', 
              border: '1px solid rgba(29, 185, 84, 0.35)', 
              padding: '3px 9px', 
              borderRadius: '20px', 
              fontSize: '0.68rem', 
              fontWeight: 'bold', 
              letterSpacing: '0.5px' 
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#1db954', boxShadow: '0 0 8px #1db954', animation: 'pulse 1.8s infinite' }} />
              RADAR SPOTIFY EN VIVO
            </span>
            <span style={{ fontSize: '0.72rem', color: '#666' }}>• CATÁLOGO MUNDIAL</span>
          </div>

          <h2 style={{ color: '#fff', fontSize: '2rem', margin: 0, letterSpacing: '1px' }}>
            RECIÉN LLEGADOS A LA <span style={{ color: 'var(--accent-color, #00ffcc)' }}>BÓVEDA</span>
          </h2>
          <p style={{ color: '#888', margin: '6px 0 0 0', fontSize: '0.92rem' }}>
            Explora los discos y sencillos oficiales estrenados esta semana en todo el planeta.
          </p>
        </div>

        {/* Filtros y Flechas de Navegación */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          
          {/* Píldoras de Filtro */}
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', padding: '3px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <button
              type="button"
              onClick={() => setFilter('all')}
              style={{
                background: filter === 'all' ? 'var(--accent-color, #00ffcc)' : 'transparent',
                color: filter === 'all' ? '#000' : '#888',
                border: 'none',
                padding: '5px 12px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: '0.2s'
              }}
            >
              TODOS
            </button>
            <button
              type="button"
              onClick={() => setFilter('album')}
              style={{
                background: filter === 'album' ? '#9945ff' : 'transparent',
                color: filter === 'album' ? '#fff' : '#888',
                border: 'none',
                padding: '5px 12px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: '0.2s'
              }}
            >
              ÁLBUMES
            </button>
            <button
              type="button"
              onClick={() => setFilter('single')}
              style={{
                background: filter === 'single' ? '#00bfff' : 'transparent',
                color: filter === 'single' ? '#000' : '#888',
                border: 'none',
                padding: '5px 12px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: '0.2s'
              }}
            >
              SENCILLOS
            </button>
          </div>

          {/* Flechas de Desplazamiento */}
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              type="button"
              onClick={() => handleScroll('left')}
              title="Desplazar a la izquierda"
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: '0.2s'
              }}
              onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; }}
              onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
            >
              <i className="fa-solid fa-chevron-left" style={{ fontSize: '0.85rem' }}></i>
            </button>

            <button
              type="button"
              onClick={() => handleScroll('right')}
              title="Desplazar a la derecha"
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: '0.2s'
              }}
              onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; }}
              onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
            >
              <i className="fa-solid fa-chevron-right" style={{ fontSize: '0.85rem' }}></i>
            </button>
          </div>

        </div>
      </div>

      {/* Cajón de Reproductor Embebido Interactivo (cuando se selecciona un álbum) */}
      {activePreview && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(20,25,35,0.95) 0%, rgba(10,14,20,0.95) 100%)',
          border: '1px solid #1db954',
          borderRadius: '12px',
          padding: '14px',
          marginBottom: '1.5rem',
          boxShadow: '0 0 25px rgba(29, 185, 84, 0.25)',
          animation: 'fadeIn 0.3s ease'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="fa-brands fa-spotify" style={{ color: '#1db954', fontSize: '1.2rem' }}></i>
              <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '0.85rem' }}>
                PREESCUCHA DE ESTUDIO // {activePreview.name} — <span style={{ color: '#1db954' }}>{activePreview.artist}</span>
              </span>
            </div>
            <button
              type="button"
              onClick={() => setActivePreview(null)}
              style={{ background: 'transparent', border: 'none', color: '#888', fontSize: '0.9rem', cursor: 'pointer', padding: '2px 8px' }}
            >
              ✕ CERRAR
            </button>
          </div>

          <iframe
            src={`https://open.spotify.com/embed/album/${activePreview.id}?utm_source=generator&theme=0`}
            width="100%"
            height="152"
            frameBorder="0"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            style={{ borderRadius: '8px', border: 'none' }}
            title={`Spotify Preview ${activePreview.name}`}
          />
        </div>
      )}

      {/* Carrusel Desplazable de Álbumes */}
      <div 
        ref={scrollRef}
        style={{
          display: 'flex',
          gap: '20px',
          overflowX: 'auto',
          scrollSnapType: 'x mandatory',
          paddingBottom: '16px',
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(0,255,204,0.3) rgba(0,0,0,0.2)'
        }}
      >
        {loading ? (
          // Skeletons de Carga
          Array.from({ length: 6 }).map((_, i) => (
            <div 
              key={i} 
              style={{
                flex: '0 0 230px',
                background: 'rgba(255,255,255,0.03)',
                borderRadius: '12px',
                padding: '14px',
                border: '1px solid rgba(255,255,255,0.05)',
                animation: 'skeletonPulse 1.5s infinite ease-in-out'
              }}
            >
              <div style={{ width: '100%', height: '200px', background: 'rgba(255,255,255,0.06)', borderRadius: '8px', marginBottom: '12px' }} />
              <div style={{ width: '75%', height: '14px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', marginBottom: '8px' }} />
              <div style={{ width: '50%', height: '11px', background: 'rgba(255,255,255,0.04)', borderRadius: '4px' }} />
            </div>
          ))
        ) : filteredReleases.length === 0 ? (
          <div style={{ padding: '3rem 1rem', textAlign: 'center', width: '100%', color: '#666' }}>
            <i className="fa-solid fa-satellite-dish" style={{ fontSize: '2rem', marginBottom: '10px', color: 'var(--accent-color)' }}></i>
            <p style={{ margin: '0 0 12px 0' }}>Sintonizando los servidores de Spotify... Vuelve a intentarlo en un momento.</p>
            <button
              type="button"
              onClick={fetchReleases}
              style={{
                background: 'rgba(0, 255, 204, 0.15)',
                color: 'var(--accent-color, #00ffcc)',
                border: '1px solid var(--accent-color, #00ffcc)',
                padding: '7px 16px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '0.78rem'
              }}
            >
              <i className="fa-solid fa-rotate-right"></i> SINTONIZAR DE NUEVO
            </button>
          </div>
        ) : (
          filteredReleases.map((album) => {
            const isSingle = album.type === 'single';
            const badgeColor = isSingle ? '#00bfff' : '#9945ff';
            const isPlayingThis = activePreview?.id === album.id;

            return (
              <div
                key={album.id}
                style={{
                  flex: '0 0 230px',
                  scrollSnapAlign: 'start',
                  background: isPlayingThis ? 'rgba(29, 185, 84, 0.08)' : 'rgba(10, 14, 20, 0.75)',
                  border: isPlayingThis ? '1px solid #1db954' : '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '12px',
                  padding: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease',
                  backdropFilter: 'blur(10px)',
                  position: 'relative'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-6px)';
                  e.currentTarget.style.borderColor = isPlayingThis ? '#1db954' : 'var(--accent-color, #00ffcc)';
                  e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.6)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = isPlayingThis ? '#1db954' : 'rgba(255,255,255,0.08)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {/* Portada del Disco con Badge */}
                <div style={{ position: 'relative', width: '100%', height: '206px', borderRadius: '8px', overflow: 'hidden', marginBottom: '10px', background: '#050505' }}>
                  {album.image ? (
                    <img 
                      src={album.image} 
                      alt={album.name} 
                      loading="lazy"
                      style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s ease' }} 
                    />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#111' }}>
                      <i className="fa-solid fa-compact-disc" style={{ fontSize: '3rem', color: '#333' }}></i>
                    </div>
                  )}

                  {/* Badge de Tipo */}
                  <span style={{
                    position: 'absolute',
                    top: '8px',
                    left: '8px',
                    background: 'rgba(0,0,0,0.75)',
                    color: badgeColor,
                    border: `1px solid ${badgeColor}66`,
                    borderRadius: '4px',
                    fontSize: '0.62rem',
                    fontWeight: 'bold',
                    padding: '2px 6px',
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase',
                    backdropFilter: 'blur(5px)'
                  }}>
                    {isSingle ? 'Sencillo' : 'Álbum'}
                  </span>

                  {/* Tracks count */}
                  <span style={{
                    position: 'absolute',
                    bottom: '8px',
                    right: '8px',
                    background: 'rgba(0,0,0,0.75)',
                    color: '#fff',
                    borderRadius: '4px',
                    fontSize: '0.62rem',
                    fontWeight: 'bold',
                    padding: '2px 6px',
                    backdropFilter: 'blur(5px)'
                  }}>
                    {album.totalTracks} {album.totalTracks === 1 ? 'Track' : 'Tracks'}
                  </span>
                </div>

                {/* Título y Artista */}
                <div style={{ flex: 1, marginBottom: '12px' }}>
                  <h4 
                    title={album.name}
                    style={{ 
                      color: '#fff', 
                      margin: '0 0 4px 0', 
                      fontSize: '0.9rem', 
                      fontWeight: 'bold',
                      whiteSpace: 'nowrap', 
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis' 
                    }}
                  >
                    {album.name}
                  </h4>
                  
                  <p 
                    title={album.artist}
                    style={{ 
                      color: 'var(--accent-color, #00ffcc)', 
                      margin: '0 0 6px 0', 
                      fontSize: '0.78rem',
                      whiteSpace: 'nowrap', 
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis',
                      fontWeight: '500'
                    }}
                  >
                    {album.artist}
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#666', fontSize: '0.68rem' }}>
                    <i className="fa-regular fa-calendar"></i>
                    <span>{formatDate(album.releaseDate)}</span>
                  </div>
                </div>

                {/* Botones de Acción */}
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => setActivePreview(isPlayingThis ? null : album)}
                    style={{
                      flex: 1,
                      background: isPlayingThis ? '#1db954' : 'rgba(255,255,255,0.06)',
                      color: isPlayingThis ? '#000' : '#fff',
                      border: isPlayingThis ? '1px solid #1db954' : '1px solid rgba(255,255,255,0.1)',
                      padding: '7px 0',
                      borderRadius: '6px',
                      fontSize: '0.72rem',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '5px',
                      transition: '0.2s'
                    }}
                  >
                    <i className={`fa-solid ${isPlayingThis ? 'fa-pause' : 'fa-play'}`}></i>
                    <span>{isPlayingThis ? 'Pausar' : 'Escuchar'}</span>
                  </button>

                  <a
                    href={album.spotifyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Abrir álbum en la app de Spotify"
                    style={{
                      width: '32px',
                      height: '32px',
                      background: 'rgba(29, 185, 84, 0.15)',
                      color: '#1db954',
                      border: '1px solid rgba(29, 185, 84, 0.35)',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textDecoration: 'none',
                      fontSize: '0.9rem',
                      transition: '0.2s'
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.background = '#1db954'; e.currentTarget.style.color = '#000'; }}
                    onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(29, 185, 84, 0.15)'; e.currentTarget.style.color = '#1db954'; }}
                  >
                    <i className="fa-brands fa-spotify"></i>
                  </a>
                </div>

              </div>
            );
          })
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.9); }
        }
        @keyframes skeletonPulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 0.25; }
        }
      `}</style>
    </section>
  );
}
