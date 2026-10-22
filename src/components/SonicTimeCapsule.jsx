import { useState } from 'react';
import PropTypes from 'prop-types';

export default function SonicTimeCapsule({
  activeRange,
  onRangeChange,
  stabilityData,
  topArtists = [],
  topTracks = [],
  isLoading = false
}) {
  const [activeTab, setActiveTab] = useState('both'); // 'both' | 'artists' | 'tracks'

  const timeRanges = [
    {
      id: 'short_term',
      label: 'Último Mes',
      sub: 'Frecuencias Inmediatas',
      icon: 'fa-solid fa-bolt-lightning',
      period: 'Últimas 4 semanas'
    },
    {
      id: 'medium_term',
      label: '6 Meses',
      sub: 'Tendencia Consolidada',
      icon: 'fa-solid fa-chart-line',
      period: 'Último semestre'
    },
    {
      id: 'long_term',
      label: 'Histórico',
      sub: 'ADN Raíz / Fundación',
      icon: 'fa-solid fa-monument',
      period: 'Varios años de escucha'
    }
  ];

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(14, 18, 28, 0.7) 0%, rgba(9, 12, 18, 0.9) 100%)',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      borderRadius: '20px',
      padding: '2rem',
      marginBottom: '2.5rem',
      boxShadow: '0 15px 40px rgba(0, 0, 0, 0.5)'
    }}>
      {/* CABECERA DE LA CÁPSULA */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1.25rem',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        paddingBottom: '1.5rem',
        marginBottom: '2rem'
      }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(0, 240, 255, 0.1)', border: '1px solid rgba(0, 240, 255, 0.3)', padding: '4px 12px', borderRadius: '15px', marginBottom: '8px' }}>
            <i className="fa-solid fa-hourglass-half" style={{ color: '#00F0FF', fontSize: '0.8rem' }} />
            <span style={{ color: '#00F0FF', fontSize: '0.7rem', fontWeight: 'bold', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
              Cápsula Temporal // Evolución de Gustos
            </span>
          </div>
          <h3 style={{ color: '#fff', fontSize: '1.5rem', margin: '0 0 4px 0', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Viaje Temporal de tus Frecuencias
          </h3>
          <p style={{ color: '#8899a6', margin: 0, fontSize: '0.85rem' }}>
            Observa cómo mutan tus obsesiones sonoras desde tus hábitos inmediatos hasta los pilares de toda tu vida.
          </p>
        </div>

        {/* SELECTOR DE ÉPOCAS TEMPORALES */}
        <div style={{
          display: 'flex',
          gap: '8px',
          background: 'rgba(0, 0, 0, 0.5)',
          padding: '5px',
          borderRadius: '30px',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          {timeRanges.map(range => {
            const isSelected = activeRange === range.id;
            return (
              <button
                key={range.id}
                onClick={() => onRangeChange(range.id)}
                style={{
                  background: isSelected ? 'linear-gradient(135deg, #00F0FF 0%, #7928CA 100%)' : 'transparent',
                  color: isSelected ? '#000' : '#8899a6',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '25px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '0.8rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.25s',
                  boxShadow: isSelected ? '0 4px 15px rgba(0, 240, 255, 0.35)' : 'none'
                }}
              >
                <i className={range.icon} style={{ fontSize: '0.85rem' }} />
                <span>{range.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* MEDIDOR DE FIDELIDAD TEMPORAL / ESTABILIDAD DE GUSTOS */}
      {stabilityData && (
        <div style={{
          background: 'rgba(0, 240, 255, 0.03)',
          border: '1px solid rgba(0, 240, 255, 0.15)',
          borderRadius: '16px',
          padding: '1.25rem 1.5rem',
          marginBottom: '2rem',
          display: 'grid',
          gridTemplateColumns: 'auto 1fr',
          gap: '1.5rem',
          alignItems: 'center'
        }}>
          <div style={{
            position: 'relative',
            width: '74px',
            height: '74px',
            borderRadius: '50%',
            background: 'conic-gradient(#00F0FF 0%, #FF007A 70%, rgba(255,255,255,0.1) 70%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '0 0 20px rgba(0, 240, 255, 0.25)'
          }}>
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: '#090d15',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <span style={{ fontSize: '1rem', fontWeight: 'bold', color: '#fff' }}>
                {stabilityData.stabilityPercent}%
              </span>
              <span style={{ fontSize: '0.55rem', color: '#00F0FF', letterSpacing: '0.5px' }}>
                FIDELIDAD
              </span>
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '4px' }}>
              <span style={{ color: '#00F0FF', fontWeight: 'bold', fontSize: '0.95rem' }}>
                {stabilityData.label}
              </span>
              <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem' }}>•</span>
              <span style={{ color: '#aaa', fontSize: '0.8rem' }}>
                {stabilityData.description}
              </span>
            </div>

            {/* ARTISTAS ANCLA & DESCUBRIMIENTOS */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '8px' }}>
              {stabilityData.constants?.length > 0 && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', background: 'rgba(0, 240, 255, 0.08)', padding: '4px 10px', borderRadius: '12px', border: '1px solid rgba(0, 240, 255, 0.2)' }}>
                  <i className="fa-solid fa-anchor" style={{ color: '#00F0FF' }} />
                  <span style={{ color: '#bbb' }}>Pilares Inmutables:</span>
                  <strong style={{ color: '#fff' }}>{stabilityData.constants.slice(0, 2).join(', ')}</strong>
                </div>
              )}

              {stabilityData.discoveries?.length > 0 && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', background: 'rgba(255, 0, 122, 0.08)', padding: '4px 10px', borderRadius: '12px', border: '1px solid rgba(255, 0, 122, 0.2)' }}>
                  <i className="fa-solid fa-meteor" style={{ color: '#FF007A' }} />
                  <span style={{ color: '#bbb' }}>Nuevas Obsesiones:</span>
                  <strong style={{ color: '#fff' }}>{stabilityData.discoveries.slice(0, 2).join(', ')}</strong>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TABS DE VISUALIZACIÓN */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <span style={{ fontSize: '0.85rem', color: '#8899a6', letterSpacing: '1px', textTransform: 'uppercase' }}>
          Visualizando época: <strong style={{ color: '#00F0FF' }}>{timeRanges.find(r => r.id === activeRange)?.period}</strong>
        </span>

        <div style={{ display: 'flex', gap: '6px' }}>
          {[
            { id: 'both', label: 'Todo' },
            { id: 'artists', label: 'Artistas' },
            { id: 'tracks', label: 'Canciones' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: activeTab === tab.id ? 'rgba(255, 255, 255, 0.12)' : 'transparent',
                color: activeTab === tab.id ? '#fff' : '#666',
                border: 'none',
                padding: '4px 12px',
                borderRadius: '12px',
                fontSize: '0.75rem',
                cursor: 'pointer',
                fontWeight: activeTab === tab.id ? 'bold' : 'normal'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ESTADO DE CARGA */}
      {isLoading ? (
        <div style={{ padding: '3rem 0', textAlign: 'center', color: '#00F0FF' }}>
          <i className="fa-solid fa-circle-notch fa-spin" style={{ fontSize: '2rem', marginBottom: '12px' }} />
          <p style={{ margin: 0, fontSize: '0.9rem', letterSpacing: '1px' }}>Sintonizando frecuencias de esta época...</p>
        </div>
      ) : (
        /* GRID DE ARTISTAS Y CANCIONES */
        <div style={{
          display: 'grid',
          gridTemplateColumns: activeTab === 'both' ? 'repeat(auto-fit, minmax(320px, 1fr))' : '1fr',
          gap: '2rem'
        }}>
          {/* COLUMNA: TOP ARTISTAS */}
          {(activeTab === 'both' || activeTab === 'artists') && (
            <div style={{
              background: 'rgba(5, 7, 12, 0.75)',
              borderRadius: '16px',
              padding: '1.5rem',
              border: '1px solid rgba(255, 255, 255, 0.05)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h4 style={{ color: '#00F0FF', textTransform: 'uppercase', letterSpacing: '1.5px', fontSize: '0.85rem', margin: 0 }}>
                  <i className="fa-solid fa-star" style={{ marginRight: '8px' }} />
                  Top Artistas ({topArtists.length})
                </h4>
                <span style={{ fontSize: '0.7rem', color: '#666' }}>ORDENADO POR FRECUENCIA</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {topArtists.map((artista, idx) => (
                  <div
                    key={artista.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '8px 10px',
                      borderRadius: '10px',
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid rgba(255, 255, 255, 0.04)',
                      transition: 'transform 0.2s, background 0.2s'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = 'rgba(0, 240, 255, 0.05)';
                      e.currentTarget.style.transform = 'translateX(4px)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
                      e.currentTarget.style.transform = 'translateX(0)';
                    }}
                  >
                    <span style={{
                      color: idx === 0 ? '#00F0FF' : (idx === 1 ? '#FF007A' : '#777'),
                      fontWeight: 'bold',
                      fontSize: '0.9rem',
                      width: '20px',
                      textAlign: 'center'
                    }}>
                      {idx + 1}
                    </span>

                    <img
                      src={artista.images?.[0]?.url || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100'}
                      alt={artista.name}
                      style={{
                        width: '46px',
                        height: '46px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: idx === 0 ? '2px solid #00F0FF' : '1px solid rgba(255,255,255,0.1)'
                      }}
                    />

                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <a
                        href={artista.external_urls?.spotify}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          color: '#fff',
                          textDecoration: 'none',
                          fontSize: '0.95rem',
                          fontWeight: 'bold',
                          display: 'block',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                      >
                        {artista.name}
                      </a>
                      <span style={{ color: '#8899a6', fontSize: '0.75rem', textTransform: 'capitalize' }}>
                        {artista.genres?.slice(0, 2).join(' • ') || 'Música'}
                      </span>
                    </div>

                    <a
                      href={artista.external_urls?.spotify}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Abrir en Spotify"
                      style={{ color: '#555', padding: '6px', fontSize: '0.85rem' }}
                      onMouseEnter={e => e.currentTarget.style.color = '#1DB954'}
                      onMouseLeave={e => e.currentTarget.style.color = '#555'}
                    >
                      <i className="fa-brands fa-spotify" />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* COLUMNA: TOP CANCIONES */}
          {(activeTab === 'both' || activeTab === 'tracks') && (
            <div style={{
              background: 'rgba(5, 7, 12, 0.75)',
              borderRadius: '16px',
              padding: '1.5rem',
              border: '1px solid rgba(255, 255, 255, 0.05)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h4 style={{ color: '#FF007A', textTransform: 'uppercase', letterSpacing: '1.5px', fontSize: '0.85rem', margin: 0 }}>
                  <i className="fa-solid fa-fire" style={{ marginRight: '8px' }} />
                  Top Canciones ({topTracks.length})
                </h4>
                <span style={{ fontSize: '0.7rem', color: '#666' }}>ORDENADO POR REPRODUCCIÓN</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {topTracks.map((cancion, idx) => (
                  <div
                    key={cancion.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '8px 10px',
                      borderRadius: '10px',
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid rgba(255, 255, 255, 0.04)',
                      transition: 'transform 0.2s, background 0.2s'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = 'rgba(255, 0, 122, 0.05)';
                      e.currentTarget.style.transform = 'translateX(4px)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
                      e.currentTarget.style.transform = 'translateX(0)';
                    }}
                  >
                    <span style={{
                      color: idx === 0 ? '#FF007A' : (idx === 1 ? '#00F0FF' : '#777'),
                      fontWeight: 'bold',
                      fontSize: '0.9rem',
                      width: '20px',
                      textAlign: 'center'
                    }}>
                      {idx + 1}
                    </span>

                    <img
                      src={cancion.album?.images?.[0]?.url || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=100'}
                      alt={cancion.name}
                      style={{
                        width: '46px',
                        height: '46px',
                        borderRadius: '8px',
                        objectFit: 'cover',
                        border: idx === 0 ? '2px solid #FF007A' : '1px solid rgba(255,255,255,0.1)'
                      }}
                    />

                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <a
                        href={cancion.external_urls?.spotify}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          color: '#fff',
                          textDecoration: 'none',
                          fontSize: '0.95rem',
                          fontWeight: 'bold',
                          display: 'block',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                      >
                        {cancion.name}
                      </a>
                      <span style={{ color: '#8899a6', fontSize: '0.75rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>
                        {cancion.artists?.map(a => a.name).join(', ')}
                      </span>
                    </div>

                    <a
                      href={cancion.external_urls?.spotify}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Abrir en Spotify"
                      style={{ color: '#555', padding: '6px', fontSize: '0.85rem' }}
                      onMouseEnter={e => e.currentTarget.style.color = '#1DB954'}
                      onMouseLeave={e => e.currentTarget.style.color = '#555'}
                    >
                      <i className="fa-brands fa-spotify" />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

SonicTimeCapsule.propTypes = {
  activeRange: PropTypes.string.isRequired,
  onRangeChange: PropTypes.func.isRequired,
  stabilityData: PropTypes.shape({
    stabilityPercent: PropTypes.number,
    label: PropTypes.string,
    description: PropTypes.string,
    constants: PropTypes.arrayOf(PropTypes.string),
    discoveries: PropTypes.arrayOf(PropTypes.string)
  }),
  topArtists: PropTypes.arrayOf(PropTypes.object),
  topTracks: PropTypes.arrayOf(PropTypes.object),
  isLoading: PropTypes.bool
};
