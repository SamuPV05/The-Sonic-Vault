import { useState, useRef, useEffect } from 'react';
import { useSpotifyPlayer } from '../context/SpotifyPlayerContext';

export default function NavbarSpotifyPlayer() {
  const {
    connected,
    nowPlaying,
    isPlaying,
    progressMs,
    durationMs,
    controlPlayback,
    login
  } = useSpotifyPlayer();

  const [showPopover, setShowPopover] = useState(false);
  const popoverRef = useRef(null);

  // Cerrar popover al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(e) {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setShowPopover(false);
      }
    }
    if (showPopover) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPopover]);

  const formatMs = (ms) => {
    if (!ms || isNaN(ms)) return '0:00';
    const totalSecs = Math.floor(ms / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPct = durationMs > 0 ? Math.min(100, (progressMs / durationMs) * 100) : 0;

  // CASO 1: No conectado a Spotify
  if (!connected) {
    return (
      <button
        type="button"
        onClick={login}
        title="Conectar tu cuenta de Spotify para activar el reproductor en vivo"
        style={{
          background: 'rgba(29, 185, 84, 0.1)',
          color: '#1db954',
          border: '1px solid rgba(29, 185, 84, 0.3)',
          padding: '5px 10px',
          borderRadius: '20px',
          fontSize: '0.72rem',
          fontWeight: 'bold',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          transition: '0.2s'
        }}
        onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(29, 185, 84, 0.2)'; }}
        onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(29, 185, 84, 0.1)'; }}
      >
        <i className="fa-brands fa-spotify" style={{ fontSize: '0.85rem' }}></i>
        <span>CONECTAR SPOTIFY</span>
      </button>
    );
  }

  // CASO 2: Conectado pero en reposo (sin canción activa en este momento)
  if (!nowPlaying) {
    return (
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '7px',
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          padding: '4px 10px',
          borderRadius: '20px',
          fontSize: '0.72rem',
          color: '#888'
        }}
        title="Spotify conectado. Reproduce una canción en tu móvil o PC para verla aquí en vivo."
      >
        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#1db954', boxShadow: '0 0 6px #1db954' }} />
        <i className="fa-brands fa-spotify" style={{ color: '#1db954' }}></i>
        <span style={{ fontSize: '0.7rem' }}>Spotify en reposo</span>
      </div>
    );
  }

  // CASO 3: Canción activa en reproducción o pausada
  const albumImage = nowPlaying.album?.images?.[0]?.url || nowPlaying.album?.images?.[1]?.url || '';
  const trackName = nowPlaying.name || 'Sin título';
  const artistName = nowPlaying.artists?.map(a => a.name).join(', ') || 'Artista';
  const spotifyUrl = nowPlaying.external_urls?.spotify || 'https://open.spotify.com';

  return (
    <div ref={popoverRef} style={{ position: 'relative' }}>
      
      {/* Widget Miniatura Principal de la Navbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '9px',
          background: isPlaying ? 'rgba(20, 30, 25, 0.85)' : 'rgba(15, 18, 24, 0.85)',
          border: isPlaying ? '1px solid rgba(29, 185, 84, 0.5)' : '1px solid rgba(255,255,255,0.1)',
          borderRadius: '25px',
          padding: '4px 12px 4px 5px',
          boxShadow: isPlaying ? '0 0 16px rgba(29, 185, 84, 0.25)' : 'none',
          position: 'relative',
          overflow: 'hidden',
          transition: 'all 0.3s ease'
        }}
      >
        {/* Micro-barra de progreso inferior */}
        <div 
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            height: '2px',
            width: `${progressPct}%`,
            background: 'linear-gradient(90deg, #1db954 0%, #00ffcc 100%)',
            boxShadow: '0 0 6px #1db954',
            transition: 'width 1s linear'
          }} 
        />

        {/* El Vinilo Cibernético Giratorio */}
        <div 
          onClick={() => setShowPopover(!showPopover)}
          title="Ver detalles de la pista"
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, #222 30%, #050505 70%, #000 100%)',
            border: '1px solid rgba(255,255,255,0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            position: 'relative',
            animation: isPlaying ? 'vinylSpin 3s linear infinite' : 'none',
            boxShadow: isPlaying ? '0 0 10px rgba(29, 185, 84, 0.4)' : 'none',
            flexShrink: 0
          }}
        >
          {/* Carátula en el centro del vinilo */}
          {albumImage ? (
            <img 
              src={albumImage} 
              alt="Álbum" 
              style={{ width: '18px', height: '18px', borderRadius: '50%', objectFit: 'cover' }} 
            />
          ) : (
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#1db954' }} />
          )}
          {/* Eje central */}
          <span style={{ position: 'absolute', width: '4px', height: '4px', borderRadius: '50%', background: '#fff' }} />
        </div>

        {/* Información del Tema */}
        <div 
          onClick={() => setShowPopover(!showPopover)}
          style={{ cursor: 'pointer', maxWidth: '135px', overflow: 'hidden', userSelect: 'none' }}
          title={`${trackName} — ${artistName}`}
        >
          <div style={{
            color: '#fff',
            fontSize: '0.75rem',
            fontWeight: 'bold',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            lineHeight: 1.2
          }}>
            {trackName}
          </div>
          <div style={{
            color: '#1db954',
            fontSize: '0.65rem',
            fontWeight: '600',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            lineHeight: 1.2
          }}>
            {artistName}
          </div>
        </div>

        {/* Mini Controles Rápidos */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '2px' }}>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); controlPlayback(isPlaying ? 'pause' : 'play'); }}
            title={isPlaying ? 'Pausar Spotify' : 'Reanudar Spotify'}
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              background: isPlaying ? '#1db954' : 'rgba(255,255,255,0.1)',
              color: isPlaying ? '#000' : '#fff',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.65rem',
              transition: '0.15s'
            }}
          >
            <i className={`fa-solid ${isPlaying ? 'fa-pause' : 'fa-play'}`}></i>
          </button>

          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); controlPlayback('next'); }}
            title="Siguiente pista"
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              background: 'transparent',
              color: '#888',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.68rem',
              transition: '0.15s'
            }}
            onMouseOver={(e) => { e.currentTarget.style.color = '#fff'; }}
            onMouseOut={(e) => { e.currentTarget.style.color = '#888'; }}
          >
            <i className="fa-solid fa-forward-step"></i>
          </button>
        </div>

      </div>

      {/* Popover Desplegable con Controles Expandidos */}
      {showPopover && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 12px)',
            right: 0,
            width: '270px',
            background: 'linear-gradient(180deg, #121824 0%, #0a0d14 100%)',
            border: '1px solid rgba(29, 185, 84, 0.4)',
            borderRadius: '14px',
            padding: '16px',
            boxShadow: '0 12px 35px rgba(0,0,0,0.8), 0 0 20px rgba(29,185,84,0.2)',
            zIndex: 2000,
            animation: 'fadeIn 0.2s ease',
            color: '#fff'
          }}
        >
          {/* Cabecera del Popover */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.65rem', color: '#1db954', fontWeight: 'bold', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <i className="fa-brands fa-spotify"></i> NOW PLAYING
            </span>
            <span style={{ fontSize: '0.65rem', color: isPlaying ? '#1db954' : '#888', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px' }}>
              {isPlaying ? 'EN VIVO' : 'PAUSADO'}
            </span>
          </div>

          {/* Portada e Info */}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '12px' }}>
            {albumImage && (
              <img
                src={albumImage}
                alt={trackName}
                style={{ width: '56px', height: '56px', borderRadius: '8px', objectFit: 'cover', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}
              />
            )}
            <div style={{ overflow: 'hidden' }}>
              <h4 style={{ margin: '0 0 2px 0', fontSize: '0.88rem', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {trackName}
              </h4>
              <p style={{ margin: '0 0 2px 0', fontSize: '0.75rem', color: '#1db954', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {artistName}
              </p>
              <span style={{ fontSize: '0.65rem', color: '#64748b', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {nowPlaying.album?.name || ''}
              </span>
            </div>
          </div>

          {/* Barra de Tiempo */}
          <div style={{ marginBottom: '14px' }}>
            <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden', marginBottom: '6px' }}>
              <div style={{ width: `${progressPct}%`, height: '100%', background: 'linear-gradient(90deg, #1db954, #00ffcc)', transition: 'width 1s linear' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: '#64748b' }}>
              <span>{formatMs(progressMs)}</span>
              <span>{formatMs(durationMs)}</span>
            </div>
          </div>

          {/* Botonera de Control Expandida */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '14px', marginBottom: '12px' }}>
            <button
              type="button"
              onClick={() => controlPlayback('previous')}
              title="Pista anterior"
              style={{ background: 'transparent', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: '0.9rem' }}
            >
              <i className="fa-solid fa-backward-step"></i>
            </button>

            <button
              type="button"
              onClick={() => controlPlayback(isPlaying ? 'pause' : 'play')}
              title={isPlaying ? 'Pausar' : 'Reproducir'}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: '#1db954',
                color: '#000',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.9rem',
                boxShadow: '0 0 14px rgba(29,185,84,0.5)'
              }}
            >
              <i className={`fa-solid ${isPlaying ? 'fa-pause' : 'fa-play'}`}></i>
            </button>

            <button
              type="button"
              onClick={() => controlPlayback('next')}
              title="Siguiente pista"
              style={{ background: 'transparent', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: '0.9rem' }}
            >
              <i className="fa-solid fa-forward-step"></i>
            </button>
          </div>

          {/* Enlace a Spotify Oficial */}
          <a
            href={spotifyUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              background: 'rgba(29, 185, 84, 0.15)',
              color: '#1db954',
              border: '1px solid rgba(29, 185, 84, 0.35)',
              padding: '7px 0',
              borderRadius: '6px',
              textDecoration: 'none',
              fontSize: '0.72rem',
              fontWeight: 'bold',
              transition: '0.2s'
            }}
          >
            <i className="fa-brands fa-spotify"></i>
            <span>ABRIR EN SPOTIFY</span>
          </a>
        </div>
      )}

      <style>{`
        @keyframes vinylSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
