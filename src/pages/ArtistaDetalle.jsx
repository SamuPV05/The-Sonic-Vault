import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { DATA_ARTISTAS } from '../datos';
import Desensamblador from '../components/Desensamblador';
import ArbolEcos from '../components/ArbolEcos';

export default function ArtistaDetalle() {
  const { id } = useParams();
  const artista = DATA_ARTISTAS[id];
  
  const [cancionAMezclar, setCancionAMezclar] = useState(null);
  const [erasExpandidas, setErasExpandidas] = useState({});

  // ESTILOS RESPONSIVOS DE EMERGENCIA
  const esMovil = window.innerWidth < 768; // Usamos 768px para abarcar celulares grandes y tablets

  if (!artista) return <h2 className="accent" style={{textAlign: 'center', marginTop: '100px'}}>Archivo Clasificado No Encontrado</h2>;

  const toggleEra = (index) => {
    setErasExpandidas(prev => ({
      ...prev,
      [index]: !prev[index] 
    }));
  };

  return (
    <main style={{ width: '100%', overflowX: 'hidden' }}> {/* ESCUDO GLOBAL: Nada sale de la pantalla */}
      {/* 1. EL HERO */}
      <section className="artist-hero">
        <div className="artist-hero-img">
          <img src={artista.imagen} alt={artista.nombre} />
        </div>
        <div className="artist-bio">
          <h1>{artista.nombre}</h1>
          <h2 style={{ textTransform: 'uppercase', letterSpacing: '2px', color: '#888', fontSize: '1rem' }}>{artista.subtitulo}</h2>
          <p style={{ marginTop: '20px', fontSize: '1.1rem', lineHeight: '1.8' }}>{artista.bio}</p>
        </div>
      </section>

      {/* 2. LA LÍNEA DE TIEMPO NARRATIVA */}
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
            // CORRECCIÓN: Menos padding en móvil para que quepa todo
            padding: esMovil ? '2rem 15px' : '2rem 5%', 
            maxWidth: '1000px', 
            margin: '0 auto',
            boxSizing: 'border-box',
            width: '100%'
        }}>
            {artista.eras && artista.eras.map((era, index) => (
                <div key={index} className="era-panel" style={{ 
                    display: 'flex', 
                    // CORRECCIÓN: En móvil se apila arriba/abajo, en PC lado a lado
                    flexDirection: esMovil ? 'column' : 'row',
                    flexWrap: 'nowrap', // Forzamos a no envolver porque usamos column en móvil
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
                        // CORRECCIÓN: 100% de ancho en móvil
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
                        // CORRECCIÓN MAGNA: Ancho forzado, padding reducido y boxSizing
                        width: '100%',
                        minWidth: '0', // Evita que Flexbox estire el contenedor más de la cuenta
                        padding: esMovil ? '2rem 1.5rem' : '3rem 2.5rem', 
                        boxSizing: 'border-box',
                        display: 'flex', 
                        flexDirection: 'column', 
                        justifyContent: 'center' 
                    }}>
                        <span className="accent" style={{ fontSize: '1.2rem', fontWeight: 'bold', letterSpacing: '3px' }}>{era.año}</span>
                        <h3 style={{ fontSize: esMovil ? '1.5rem' : '2rem', margin: '10px 0 15px 0', textTransform: 'uppercase' }}>{era.titulo}</h3>
                        {/* CORRECCIÓN: wordBreak para evitar que palabras largas rompan el texto */}
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
                                Explorar ({era.stems ? era.stems.length : 0})
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
                                    const esVIP = esObjeto ? cancion.tieneDesensamblador : false;
                                    
                                    return (
                                        <div key={idx} style={{ background: '#111', padding: '10px 15px', borderRadius: '6px', border: '1px solid #222', width: '100%', boxSizing: 'border-box' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                                                <span style={{ fontSize: '0.9rem', color: '#ddd', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{titulo}</span>
                                                
                                                {esVIP && (
                                                    <button 
                                                        onClick={(e) => {
                                                            e.stopPropagation(); 
                                                            setCancionAMezclar(cancionAMezclar === titulo ? null : titulo);
                                                        }}
                                                        style={{ 
                                                            background: cancionAMezclar === titulo ? '#ff4444' : 'var(--accent-color)', 
                                                            color: '#000', 
                                                            border: 'none', 
                                                            padding: '6px 12px', 
                                                            borderRadius: '4px', 
                                                            cursor: 'pointer', 
                                                            fontWeight: 'bold',
                                                            fontSize: '0.75rem',
                                                            transition: '0.2s',
                                                            whiteSpace: 'nowrap'
                                                        }}
                                                    >
                                                        <i className={`fa-solid ${cancionAMezclar === titulo ? 'fa-xmark' : 'fa-sliders'}`}></i> 
                                                        {cancionAMezclar === titulo ? ' CERRAR' : ' MEZCLAR'}
                                                    </button>
                                                )}
                                            </div>

                                            {/* ZONA DE CONTENCIÓN PARA LA CONSOLA */}
                                            {esVIP && cancionAMezclar === titulo && (
                                                <div style={{ 
                                                    marginTop: '15px', 
                                                    animation: 'fadeIn 0.3s ease',
                                                    width: '100%', 
                                                    boxSizing: 'border-box',
                                                    // ESTA ES LA PROTECCIÓN: Si la consola es gigante, crea un scroll interno
                                                    overflowX: 'auto',
                                                    paddingBottom: '10px' // Espacio para la barrita de scroll
                                                }}>
                                                    <Desensamblador rutaStems={cancion.rutaStems} titulo={titulo} />
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
      <ArbolEcos ecos={artista.ecos} />
    </main>
  );
}