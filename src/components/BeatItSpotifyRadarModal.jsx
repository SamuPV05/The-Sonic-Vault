import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  isSpotifyConnected,
  loginWithSpotify,
  getSpotifyUserProfile,
  searchBpmReferenceTracks,
  createBeatItSpotifyPlaylist
} from '../services/spotifyService';

export default function BeatItSpotifyRadarModal({
  isOpen,
  onClose,
  tempo = 120,
  currentKit = 'Cyberpunk',
  beatName = ''
}) {
  const [tracks, setTracks] = useState([]);
  const [selectedUris, setSelectedUris] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creatingPlaylist, setCreatingPlaylist] = useState(false);
  const [createdResult, setCreatedResult] = useState(null);
  const [customName, setCustomName] = useState('');
  const [userProfile, setUserProfile] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const isConnected = isSpotifyConnected();

  // Inicializar nombre y buscar tracks de referencia al abrir
  useEffect(() => {
    if (!isOpen) return;

    const defaultTitle = beatName?.trim()
      ? `The Sonic Vault // ${beatName.trim()} [${tempo} BPM]`
      : `The Sonic Vault // ${currentKit} Groove [${tempo} BPM]`;
    setCustomName(defaultTitle);
    setCreatedResult(null);
    setErrorMsg('');

    // Obtener perfil si está conectado
    if (isConnected) {
      getSpotifyUserProfile().then(p => setUserProfile(p)).catch(() => {});
    }

    // Buscar pistas de referencia para este BPM y Kit
    let cancel = false;
    const fetchReferences = async () => {
      setLoading(true);
      try {
        const results = await searchBpmReferenceTracks(currentKit, tempo, 8);
        if (!cancel) {
          setTracks(results);
          // Seleccionar todas por defecto
          setSelectedUris(results.map(t => t.uri).filter(Boolean));
        }
      } catch (err) {
        console.error('Error en Radar BPM:', err);
      } finally {
        if (!cancel) setLoading(false);
      }
    };

    fetchReferences();

    return () => {
      cancel = true;
    };
  }, [isOpen, tempo, currentKit, beatName, isConnected]);

  if (!isOpen) return null;

  const handleToggleTrack = (uri) => {
    if (!uri) return;
    if (selectedUris.includes(uri)) {
      setSelectedUris(selectedUris.filter(u => u !== uri));
    } else {
      setSelectedUris([...selectedUris, uri]);
    }
  };

  const handleSelectAll = () => {
    if (selectedUris.length === tracks.length) {
      setSelectedUris([]);
    } else {
      setSelectedUris(tracks.map(t => t.uri).filter(Boolean));
    }
  };

  const handleCreatePlaylist = async () => {
    if (!isConnected) {
      loginWithSpotify();
      return;
    }

    if (selectedUris.length === 0) {
      setErrorMsg('Selecciona al menos una pista para incluir en la playlist.');
      return;
    }

    setCreatingPlaylist(true);
    setErrorMsg('');
    try {
      const result = await createBeatItSpotifyPlaylist(
        customName || `${currentKit} ${tempo} BPM`,
        currentKit,
        tempo,
        selectedUris
      );
      setCreatedResult(result);
    } catch (err) {
      console.error('Error creando playlist:', err);
      setErrorMsg(err.message || 'No se pudo generar la playlist en Spotify. Intenta nuevamente.');
    } finally {
      setCreatingPlaylist(false);
    }
  };

  // Tempo armónico (Half-time y Double-time)
  const halfTime = Math.round(tempo / 2);
  const doubleTime = tempo * 2;
  const sweepDuration = Math.max(1.5, Math.min(6, (60 / tempo) * 4));

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(5, 7, 14, 0.88)',
        backdropFilter: 'blur(10px)',
        zIndex: 2000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        animation: 'fadeIn 0.25s ease'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !creatingPlaylist) onClose();
      }}
    >
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(14, 18, 28, 0.96) 0%, rgba(8, 10, 16, 0.98) 100%)',
          border: '1px solid rgba(0, 240, 255, 0.35)',
          borderRadius: '20px',
          width: '100%',
          maxWidth: '780px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8), 0 0 35px rgba(0, 240, 255, 0.25)',
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        {/* CABECERA DEL RADAR */}
        <div style={{
          padding: '1.25rem 1.75rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(0, 0, 0, 0.3)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'rgba(29, 185, 84, 0.15)',
              border: '1px solid #1DB954',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 12px rgba(29, 185, 84, 0.4)'
            }}>
              <i className="fa-brands fa-spotify" style={{ color: '#1DB954', fontSize: '1.2rem' }} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ color: '#fff', margin: 0, fontSize: '1.15rem', letterSpacing: '1px', textTransform: 'uppercase' }}>
                  Radar BPM & Generador de Playlists
                </h3>
                <span style={{
                  fontSize: '0.65rem',
                  fontWeight: 'bold',
                  background: 'rgba(0, 240, 255, 0.15)',
                  color: '#00F0FF',
                  padding: '2px 8px',
                  borderRadius: '10px',
                  border: '1px solid rgba(0, 240, 255, 0.3)'
                }}>
                  FASE 5 PRO
                </span>
              </div>
              <span style={{ fontSize: '0.75rem', color: '#8899a6' }}>
                Sincronía Rítmica • Kit {currentKit} • Referencias de Estudio
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={creatingPlaylist}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#888',
              fontSize: '1.3rem',
              cursor: creatingPlaylist ? 'not-allowed' : 'pointer',
              padding: '4px',
              transition: 'color 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#fff'}
            onMouseLeave={e => e.currentTarget.style.color = '#888'}
          >
            ✕
          </button>
        </div>

        {/* CONTENIDO DESPLAZABLE */}
        <div style={{ padding: '1.5rem 1.75rem', overflowY: 'auto', flex: 1 }}>
          {/* SI LA PLAYLIST FUE CREADA CON ÉXITO */}
          {createdResult ? (
            <div style={{
              background: 'linear-gradient(135deg, rgba(29, 185, 84, 0.15) 0%, rgba(0, 240, 255, 0.15) 100%)',
              border: '1px solid #1DB954',
              borderRadius: '16px',
              padding: '2rem',
              textAlign: 'center',
              animation: 'fadeIn 0.3s ease'
            }}>
              <div style={{
                width: '70px',
                height: '70px',
                borderRadius: '50%',
                background: '#1DB954',
                color: '#000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2rem',
                margin: '0 auto 1.25rem auto',
                boxShadow: '0 0 30px rgba(29, 185, 84, 0.6)'
              }}>
                <i className="fa-solid fa-check" />
              </div>

              <h3 style={{ color: '#fff', fontSize: '1.6rem', margin: '0 0 8px 0', textTransform: 'uppercase' }}>
                ¡Playlist Generada en tu Spotify!
              </h3>
              <p style={{ color: '#ccc', margin: '0 0 1.5rem 0', fontSize: '0.95rem' }}>
                Hemos creado <strong>&ldquo;{createdResult.name}&rdquo;</strong> con las pistas sincronizadas a {tempo} BPM y la hemos añadido directamente a tu cuenta de Spotify.
              </p>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <a
                  href={createdResult.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    background: '#1DB954',
                    color: '#000',
                    textDecoration: 'none',
                    fontWeight: '800',
                    fontSize: '0.9rem',
                    letterSpacing: '1px',
                    padding: '12px 24px',
                    borderRadius: '25px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 6px 20px rgba(29, 185, 84, 0.4)'
                  }}
                >
                  <i className="fa-brands fa-spotify" style={{ fontSize: '1.2rem' }} />
                  Abrir Playlist en Spotify
                </a>

                <button
                  onClick={() => setCreatedResult(null)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    color: '#fff',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    padding: '12px 20px',
                    borderRadius: '25px',
                    cursor: 'pointer',
                    fontSize: '0.85rem'
                  }}
                >
                  Generar Otra
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* PANEL DEL RADAR Y TEMPO */}
              <div style={{
                background: 'rgba(0, 0, 0, 0.45)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '16px',
                padding: '1.25rem',
                marginBottom: '1.5rem',
                display: 'grid',
                gridTemplateColumns: 'auto 1fr',
                gap: '1.5rem',
                alignItems: 'center'
              }}>
                {/* RADAR GRÁFICO DINÁMICO */}
                <div style={{
                  position: 'relative',
                  width: '110px',
                  height: '110px',
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, #08121a 0%, #03080e 100%)',
                  border: '2px solid rgba(0, 240, 255, 0.5)',
                  boxShadow: '0 0 20px rgba(0, 240, 255, 0.25)',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {/* Círculos concéntricos del radar */}
                  <div style={{ position: 'absolute', width: '75px', height: '75px', borderRadius: '50%', border: '1px dashed rgba(0, 240, 255, 0.35)' }} />
                  <div style={{ position: 'absolute', width: '40px', height: '40px', borderRadius: '50%', border: '1px solid rgba(0, 240, 255, 0.25)' }} />

                  {/* Cruz de coordenadas */}
                  <div style={{ position: 'absolute', width: '100%', height: '1px', background: 'rgba(0, 240, 255, 0.2)' }} />
                  <div style={{ position: 'absolute', width: '1px', height: '100%', background: 'rgba(0, 240, 255, 0.2)' }} />

                  {/* Haz giratorio del Radar sincronizado al tempo */}
                  <div style={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    background: 'conic-gradient(from 0deg, rgba(0, 240, 255, 0.4) 0deg, transparent 65deg, transparent 360deg)',
                    animation: `radarSweep ${sweepDuration}s linear infinite`
                  }} />

                  {/* Punto central del radar */}
                  <div style={{
                    position: 'relative',
                    zIndex: 2,
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    background: '#00F0FF',
                    boxShadow: '0 0 10px #00F0FF'
                  }} />
                </div>

                {/* INFO DEL TEMPO Y ARMONÍA */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.7rem', color: '#00F0FF', fontWeight: 'bold', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
                      FRECUENCIA SINCRO // BEAT IT
                    </span>
                    <span style={{ color: '#555' }}>•</span>
                    <span style={{ fontSize: '0.7rem', color: '#1DB954', fontWeight: 'bold' }}>
                      98.4% Sincronía
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '2.2rem', fontWeight: '800', color: '#fff', lineHeight: 1 }}>
                      {tempo}
                    </span>
                    <span style={{ fontSize: '1rem', color: '#00F0FF', fontWeight: 'bold' }}>BPM</span>
                    <span style={{ color: '#8899a6', fontSize: '0.85rem' }}>| Kit: <strong style={{ color: '#fff' }}>{currentKit}</strong></span>
                  </div>

                  {/* ARMÓNICOS HALF-TIME Y DOUBLE-TIME */}
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <div style={{ fontSize: '0.72rem', background: 'rgba(255, 255, 255, 0.05)', padding: '4px 8px', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                      <span style={{ color: '#888' }}>Half-time:</span> <strong style={{ color: '#fff' }}>{halfTime} BPM</strong>
                    </div>
                    <div style={{ fontSize: '0.72rem', background: 'rgba(255, 255, 255, 0.05)', padding: '4px 8px', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                      <span style={{ color: '#888' }}>Double-time:</span> <strong style={{ color: '#fff' }}>{doubleTime} BPM</strong>
                    </div>
                    <div style={{ fontSize: '0.72rem', background: 'rgba(0, 240, 255, 0.08)', color: '#00F0FF', padding: '4px 8px', borderRadius: '6px', border: '1px solid rgba(0, 240, 255, 0.2)' }}>
                      <i className="fa-solid fa-wave-square" style={{ marginRight: '4px' }} />
                      Armonía Calibrada
                    </div>
                  </div>
                </div>
              </div>

              {/* LISTA DE PISTAS DE REFERENCIA */}
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <h4 style={{ color: '#fff', fontSize: '0.9rem', margin: 0, letterSpacing: '1px', textTransform: 'uppercase' }}>
                    <i className="fa-solid fa-satellite-dish" style={{ color: '#00F0FF', marginRight: '6px' }} />
                    Referencias de Estudio Detectadas ({tracks.length})
                  </h4>
                  <button
                    onClick={handleSelectAll}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#00F0FF',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      textDecoration: 'underline'
                    }}
                  >
                    {selectedUris.length === tracks.length ? 'Deseleccionar todas' : 'Seleccionar todas'}
                  </button>
                </div>

                {loading ? (
                  <div style={{ textAlign: 'center', padding: '2.5rem 0', color: '#00F0FF' }}>
                    <i className="fa-solid fa-circle-notch fa-spin" style={{ fontSize: '1.8rem', marginBottom: '8px' }} />
                    <p style={{ margin: 0, fontSize: '0.85rem' }}>Rastreando catálogo de Spotify para {tempo} BPM...</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '250px', overflowY: 'auto', paddingRight: '4px' }}>
                    {tracks.map((track) => {
                      const isSelected = selectedUris.includes(track.uri);
                      return (
                        <div
                          key={track.id}
                          onClick={() => handleToggleTrack(track.uri)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '8px 12px',
                            borderRadius: '10px',
                            background: isSelected ? 'rgba(0, 240, 255, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                            border: `1px solid ${isSelected ? 'rgba(0, 240, 255, 0.3)' : 'rgba(255, 255, 255, 0.05)'}`,
                            cursor: 'pointer',
                            transition: 'all 0.15s'
                          }}
                        >
                          {/* Checkbox */}
                          <div style={{
                            width: '18px',
                            height: '18px',
                            borderRadius: '4px',
                            border: `2px solid ${isSelected ? '#00F0FF' : '#555'}`,
                            background: isSelected ? '#00F0FF' : 'transparent',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}>
                            {isSelected && <i className="fa-solid fa-check" style={{ color: '#000', fontSize: '0.65rem' }} />}
                          </div>

                          {/* Imagen */}
                          <img
                            src={track.image || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100'}
                            alt={track.name}
                            style={{ width: '40px', height: '40px', borderRadius: '6px', objectFit: 'cover' }}
                          />

                          {/* Título & Artista */}
                          <div style={{ flex: 1, overflow: 'hidden' }}>
                            <span style={{ color: '#fff', fontSize: '0.85rem', fontWeight: 'bold', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {track.name}
                            </span>
                            <span style={{ color: '#8899a6', fontSize: '0.75rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>
                              {track.artist}
                            </span>
                          </div>

                          {/* Badge de BPM */}
                          <span style={{
                            fontSize: '0.7rem',
                            color: '#00F0FF',
                            background: 'rgba(0, 240, 255, 0.12)',
                            padding: '3px 8px',
                            borderRadius: '8px',
                            fontWeight: 'bold',
                            whiteSpace: 'nowrap'
                          }}>
                            ~{track.bpmMatch} BPM
                          </span>

                          {/* Abrir en Spotify */}
                          <a
                            href={track.spotifyUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            title="Escuchar en Spotify"
                            style={{ color: '#777', padding: '4px 6px' }}
                            onMouseEnter={e => e.currentTarget.style.color = '#1DB954'}
                            onMouseLeave={e => e.currentTarget.style.color = '#777'}
                          >
                            <i className="fa-brands fa-spotify" style={{ fontSize: '1rem' }} />
                          </a>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* GENERADOR DE PLAYLIST EN SPOTIFY */}
              <div style={{
                background: 'rgba(0, 0, 0, 0.6)',
                border: '1px solid rgba(29, 185, 84, 0.3)',
                borderRadius: '14px',
                padding: '1.25rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                  <label style={{ fontSize: '0.78rem', color: '#1DB954', fontWeight: 'bold', letterSpacing: '1px', textTransform: 'uppercase' }}>
                    <i className="fa-solid fa-list-check" style={{ marginRight: '6px' }} />
                    Nombre de la Playlist a Generar:
                  </label>
                  {isConnected && userProfile && (
                    <span style={{ fontSize: '0.7rem', color: '#aaa' }}>
                      Destino: <strong style={{ color: '#fff' }}>{userProfile.display_name}</strong>
                    </span>
                  )}
                </div>

                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="Nombre de la playlist en tu Spotify..."
                  style={{
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#fff',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    outline: 'none',
                    marginBottom: '1rem'
                  }}
                />

                {errorMsg && (
                  <div style={{ color: '#ff4d4d', fontSize: '0.8rem', marginBottom: '10px' }}>
                    <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: '6px' }} />
                    {errorMsg}
                  </div>
                )}

                <button
                  onClick={handleCreatePlaylist}
                  disabled={creatingPlaylist}
                  style={{
                    width: '100%',
                    background: isConnected
                      ? 'linear-gradient(135deg, #1DB954 0%, #00F0FF 100%)'
                      : '#1DB954',
                    color: '#000',
                    border: 'none',
                    padding: '14px',
                    borderRadius: '30px',
                    fontWeight: '800',
                    fontSize: '0.9rem',
                    letterSpacing: '1px',
                    textTransform: 'uppercase',
                    cursor: creatingPlaylist ? 'wait' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    boxShadow: '0 6px 25px rgba(29, 185, 84, 0.35)',
                    transition: 'transform 0.2s, box-shadow 0.2s'
                  }}
                  onMouseEnter={e => {
                    if (!creatingPlaylist) {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 10px 30px rgba(29, 185, 84, 0.5)';
                    }
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 6px 25px rgba(29, 185, 84, 0.35)';
                  }}
                >
                  <i className={creatingPlaylist ? 'fa-solid fa-spinner fa-spin' : (isConnected ? 'fa-solid fa-wand-magic-sparkles' : 'fa-brands fa-spotify')} style={{ fontSize: '1.1rem' }} />
                  {creatingPlaylist
                    ? 'Creando Playlist en tu cuenta de Spotify...'
                    : (isConnected
                      ? `Exportar Playlist (${selectedUris.length} Pistas) a mi Spotify`
                      : 'Sincronizar Spotify para Crear la Playlist')}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes radarSweep {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

BeatItSpotifyRadarModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  tempo: PropTypes.number,
  currentKit: PropTypes.string,
  beatName: PropTypes.string
};
