import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { getSpotifyArtist, getSpotifyArtistTopTracks, getSpotifyArtistAlbums } from '../services/spotifyService';
import ArbolEcos from '../components/ArbolEcos';

export default function ArtistaDetalle() {
  const { id } = useParams();
  const [artista, setArtista] = useState(null);
  const [esSpotify, setEsSpotify] = useState(false);
  const [spotifyAlbums, setSpotifyAlbums] = useState([]);
  const [spotifyTracks, setSpotifyTracks] = useState([]);
  const [cargando, setCargando] = useState(true);
  
  useEffect(() => {
    const obtenerArtista = async () => {
      setCargando(true);
      try {
        if (id && id.startsWith('sp_')) {
          // --- ARTISTA DINÁMICO DE SPOTIFY ---
          const spotifyId = id.replace('sp_', '');
          setEsSpotify(true);

          const artistData = await getSpotifyArtist(spotifyId);
          if (artistData) {
            setArtista({
              nombre: artistData.name,
              imagen: artistData.images?.[0]?.url || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80',
              subtitulo: 'EXPEDIENTE GLOBAL SPOTIFY // ARCHIVO ABIERTO',
              bio: `Artista indexado en tiempo real desde el catálogo global de Spotify. Conecta tus sentidos a su discografía oficial y reproducción directa en The Sonic Vault.`,
              spotifyUrl: artistData.external_urls?.spotify,
              spotifyId: spotifyId,
            });

            // Cargar álbumes y top tracks
            const [albums, tracks] = await Promise.all([
              getSpotifyArtistAlbums(spotifyId, 8),
              getSpotifyArtistTopTracks(spotifyId, artistData.name, 6)
            ]);
            setSpotifyAlbums(albums);
            setSpotifyTracks(tracks);
          } else {
            setArtista(null);
          }
        } else {
          // --- ARTISTA CLÁSICO DE FIRESTORE ---
          setEsSpotify(false);
          const docRef = doc(db, 'artistas', id);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setArtista(docSnap.data());
          } else {
            setArtista(null);
          }
        }
      } catch (error) {
        console.error("Error al obtener artista:", error);
      } finally {
        setCargando(false);
      }
    };
    obtenerArtista();
  }, [id]);

  const [erasExpandidas, setErasExpandidas] = useState({});

  // ESTILOS RESPONSIVOS DE EMERGENCIA
  const esMovil = window.innerWidth < 768; // Usamos 768px para abarcar celulares grandes y tablets

  if (cargando) return (
    <div style={{ textAlign: 'center', marginTop: '120px', minHeight: '60vh' }}>
      <div style={{ width: '50px', height: '50px', border: '3px solid rgba(0, 240, 255, 0.2)', borderTop: '3px solid var(--accent-color)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 20px auto' }}></div>
      <h2 className="accent" style={{ letterSpacing: '3px', textTransform: 'uppercase', fontSize: '1.2rem' }}>Desencriptando Archivo...</h2>
    </div>
  );
  if (!artista) return <h2 className="accent" style={{textAlign: 'center', marginTop: '100px'}}>Archivo Clasificado No Encontrado</h2>;

  const toggleEra = (index) => {
    setErasExpandidas(prev => ({
      ...prev,
      [index]: !prev[index] 
    }));
  };

  return (
    <main style={{ width: '100%', overflowX: 'hidden' }}> {/* ESCUDO GLOBAL: Nada sale de la pantalla */}

      {/* BOTÓN VOLVER */}
      <div style={{ maxWidth: '1200px', margin: '2rem auto 0 auto', padding: '0 5%' }}>
        <Link to="/artistas" className="view-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', textDecoration: 'none', color: '#fff', background: 'rgba(255,255,255,0.05)', padding: '10px 18px', borderRadius: '25px', border: '1px solid rgba(0, 240, 255, 0.2)' }}>
          <i className="fa-solid fa-arrow-left" /> Volver al Salón de Artistas
        </Link>
      </div>

      {/* 1. EL HERO */}
      <section className="artist-hero">
        <div className="artist-hero-img">
          <img src={artista.imagen} alt={artista.nombre} />
        </div>
        <div className="artist-bio">
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            {esSpotify && (
              <span style={{ background: 'rgba(29, 185, 84, 0.15)', color: '#1DB954', border: '1px solid rgba(29, 185, 84, 0.4)', padding: '4px 12px', borderRadius: '15px', fontSize: '0.75rem', fontWeight: 'bold', letterSpacing: '1px' }}>
                <i className="fa-brands fa-spotify" style={{ marginRight: '6px' }}></i> SPOTIFY OFICIAL
              </span>
            )}
          </div>
          <h1>{artista.nombre}</h1>
          <h2 style={{ textTransform: 'uppercase', letterSpacing: '2px', color: '#888', fontSize: '1rem' }}>{artista.subtitulo}</h2>
          <p style={{ marginTop: '20px', fontSize: '1.1rem', lineHeight: '1.8' }}>{artista.bio}</p>

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

      {/* 2. SI ES UN ARTISTA DE SPOTIFY: REPRODUCTOR Y DISCOGRAFÍA */}
      {esSpotify ? (
        <section className="catalog-section" style={{ borderTop: '1px solid #1a1a1a', paddingTop: '3.5rem', maxWidth: '1200px', margin: '0 auto', padding: '3.5rem 5% 5rem 5%', boxSizing: 'border-box' }}>
          
          {/* REPRODUCTOR EMBEBIDO OFICIAL DE SPOTIFY */}
          <div style={{ marginBottom: '4rem' }}>
            <div className="section-header" style={{ justifyContent: 'center', textAlign: 'center', border: 'none', marginBottom: '2rem' }}>
              <h2>Transmisión <span className="accent">Oficial</span></h2>
              <p style={{ color: '#888', marginTop: '8px' }}>Escucha sus temas esenciales en vivo a través de la terminal de Spotify.</p>
            </div>

            <div style={{ maxWidth: '850px', margin: '0 auto', background: '#08080c', borderRadius: '18px', padding: '10px', border: '1px solid rgba(29, 185, 84, 0.25)', boxShadow: '0 10px 40px rgba(0, 0, 0, 0.6)' }}>
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

          {/* DISCOGRAFÍA OFICIAL */}
          {spotifyAlbums && spotifyAlbums.length > 0 && (
            <div>
              <div className="section-header" style={{ justifyContent: 'center', textAlign: 'center', border: 'none', marginBottom: '2.5rem' }}>
                <h2>Discografía <span className="accent">Indexada</span></h2>
                <p style={{ color: '#888', marginTop: '8px' }}>Álbumes y lanzamientos oficiales registrados en la Bóveda.</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '2rem' }}>
                {spotifyAlbums.map((album) => {
                  const cover = album.images?.[0]?.url || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=500&q=80';
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
                        transition: 'transform 0.3s ease, border-color 0.3s ease',
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
                        <span style={{ fontSize: '0.75rem', color: '#1DB954', fontWeight: 'bold', letterSpacing: '1px', textTransform: 'uppercase' }}>
                          {album.album_type || 'ÁLBUM'} • {releaseYear}
                        </span>
                        <h4 style={{ margin: '6px 0 10px 0', fontSize: '0.95rem', color: '#fff', lineHeight: '1.4' }}>
                          {album.name}
                        </h4>
                        <span style={{ marginTop: 'auto', fontSize: '0.8rem', color: '#888', display: 'flex', alignItems: 'center', gap: '6px' }}>
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
      ) : (
        /* 2. SI ES UN ARTISTA CLÁSICO DE FIRESTORE: ERAS HISTÓRICAS */
        <>
          <section className="catalog-section" style={{ borderTop: '1px solid #1a1a1a', paddingTop: '4rem', boxSizing: 'border-box' }}>
            <div className="section-header" style={{ justifyContent: 'center', textAlign: 'center', border: 'none' }}>
                <h2>Archivo <span className="accent">Sonoro</span></h2>
                <p style={{ color: '#888', marginTop: '10px' }}>Explora la evolución y los secretos detrás de la obra.</p>
            </div>

            {/* CONTENEDOR DE LA LÍNEA DE TIEMPO */}
            <div className="timeline-container" style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '3rem', 
                padding: esMovil ? '2rem 15px' : '2rem 5%', 
                maxWidth: '1000px', 
                margin: '0 auto',
                boxSizing: 'border-box',
                width: '100%'
            }}>
                {artista.eras && artista.eras.map((era, index) => (
                    <div key={index} className="era-panel" style={{ 
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
                    }}>
                        
                        {/* Imagen de la Era */}
                        <div style={{ 
                            flex: '1', 
                            width: esMovil ? '100%' : 'auto',
                            minWidth: esMovil ? '100%' : '300px', 
                            borderRight: esMovil ? 'none' : '1px solid #1a1a1a',
                            borderBottom: esMovil ? '1px solid #1a1a1a' : 'none'
                        }}>
                            <img src={era.img} alt={era.titulo} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', minHeight: esMovil ? '250px' : '300px' }} />
                        </div>
                        
                        {/* Información de la Era */}
                        <div style={{ 
                            flex: '1.5', 
                            width: '100%',
                            minWidth: '0', 
                            padding: esMovil ? '2rem 1.5rem' : '3rem 2.5rem', 
                            boxSizing: 'border-box',
                            display: 'flex', 
                            flexDirection: 'column', 
                            justifyContent: 'center' 
                        }}>
                            <span className="accent" style={{ fontSize: '1.2rem', fontWeight: 'bold', letterSpacing: '3px' }}>{era.año}</span>
                            <h3 style={{ fontSize: esMovil ? '1.5rem' : '2rem', margin: '10px 0 15px 0', textTransform: 'uppercase' }}>{era.titulo}</h3>
                            <p style={{ color: '#aaa', lineHeight: '1.7', fontSize: '1rem', wordBreak: 'break-word' }}>{era.descripcion}</p>
                            
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
                                <h4 style={{ color: 'var(--accent-color)', textTransform: 'uppercase', letterSpacing: '2px', fontSize: esMovil ? '0.75rem' : '0.85rem', margin: 0 }}>
                                    <i className="fa-solid fa-compact-disc" style={{ marginRight: '8px' }}></i>
                                    Explorar Canciones ({era.stems ? era.stems.length : 0})
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

                            {/* --- LISTA DE CANCIONES --- */}
                            {erasExpandidas[index] && era.stems && era.stems.length > 0 && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '15px', animation: 'fadeIn 0.3s ease', width: '100%', boxSizing: 'border-box' }}>
                                    {era.stems.map((cancion, idx) => {
                                        const esObjeto = typeof cancion === 'object';
                                        const titulo = esObjeto ? cancion.titulo : cancion;
                                        
                                        return (
                                            <div key={idx} style={{ background: '#111', padding: '12px 16px', borderRadius: '6px', border: '1px solid #222', width: '100%', boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                                                    <i className="fa-solid fa-music" style={{ color: 'var(--accent-color)', fontSize: '0.85rem' }}></i>
                                                    <span style={{ fontSize: '0.9rem', color: '#eee', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{titulo}</span>
                                                </div>
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
          <ArbolEcos ecos={artista.ecos} />
        </>
      )}
    </main>
  );
}