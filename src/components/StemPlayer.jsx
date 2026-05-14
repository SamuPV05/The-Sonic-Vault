import { useState } from 'react';

// Ahora recibimos 'tracks' (un arreglo/lista) en vez de un solo 'songTitle'
export default function StemPlayer({ tracks }) {
    // ESTADO: ¿Está sonando la música?
    const [isPlaying, setIsPlaying] = useState(false);
    
    // ESTADO: ¿Está desplegado el acordeón?
    const [isExpanded, setIsExpanded] = useState(false);
    
    // ESTADO: Canción seleccionada (por defecto la primera de la lista)
    const [currentTrack, setCurrentTrack] = useState(tracks[0]);
    
    // ESTADO: Canales activos
    const [stems, setStems] = useState({
        voz: true, bateria: true, bajo: true, sintes: true
    });

    const toggleStem = (stemName) => {
        setStems(prev => ({
            ...prev,
            [stemName]: !prev[stemName]
        }));
    };

    return (
        <div className={`stem-player-container ${isPlaying ? 'playing' : ''}`} style={{ transition: 'all 0.3s ease' }}>
            
            {/* CABECERA */}
            <div 
                className="stem-header" 
                onClick={() => setIsExpanded(!isExpanded)}
                style={{ cursor: 'pointer', marginBottom: isExpanded ? '20px' : '0', borderBottom: isExpanded ? '1px solid #1a1a1a' : 'none', paddingBottom: isExpanded ? '10px' : '0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
                <div className="stem-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <i className="fa-solid fa-sliders"></i>
                    <span>Desensamblador: <span style={{color: 'white', fontWeight: 'bold'}}>{currentTrack}</span></span>
                </div>
                
                <div style={{ color: 'var(--accent-color)', fontSize: '1.2rem', transition: 'transform 0.3s' }}>
                    <i className={`fa-solid fa-chevron-${isExpanded ? 'up' : 'down'}`}></i>
                </div>
            </div>

            {/* CONTENIDO DESPLEGABLE */}
            {isExpanded && (
                <div className="stem-content" style={{ animation: 'fadeIn 0.4s ease-in-out' }}>
                    
                    {/* SELECTOR DE CANCIONES Y BOTÓN PLAY */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
                        
                        {/* Selector (Solo se muestra si hay más de 1 canción) */}
                        {tracks.length > 1 && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <label style={{ fontSize: '0.8rem', color: '#888', textTransform: 'uppercase', letterSpacing: '1px' }}>Pista:</label>
                                <select 
                                    value={currentTrack}
                                    onChange={(e) => {
                                        setCurrentTrack(e.target.value);
                                        setIsPlaying(false); // Pausamos la música al cambiar de canción
                                    }}
                                    style={{ background: '#0a0a0a', color: 'var(--accent-color)', border: '1px solid #1a1a1a', padding: '8px 12px', borderRadius: '5px', fontFamily: 'inherit', outline: 'none', cursor: 'pointer' }}
                                >
                                    {tracks.map((track, index) => (
                                        <option key={index} value={track}>{track}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <button 
                            className={`btn-play ${isPlaying ? 'playing' : ''}`} 
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsPlaying(!isPlaying);
                            }}
                            style={{ margin: tracks.length > 1 ? '0' : '0 auto' }} // Centra el botón si no hay selector
                        >
                            <i className={`fa-solid ${isPlaying ? 'fa-pause' : 'fa-play'}`}></i>
                        </button>
                    </div>

                    {/* PISTAS (ECUALIZADORES) */}
                    <div className="stems-grid">
                        <div className={`stem-track ${stems.voz ? 'active' : 'muted'}`} onClick={() => toggleStem('voz')}>
                            <span className="stem-name">Voz (Mic)</span>
                            <div className="visualizer"><div className="bar"></div><div className="bar"></div><div className="bar"></div><div className="bar"></div></div>
                        </div>
                        <div className={`stem-track ${stems.bateria ? 'active' : 'muted'}`} onClick={() => toggleStem('bateria')}>
                            <span className="stem-name">Batería (Drums)</span>
                            <div className="visualizer"><div className="bar"></div><div className="bar"></div><div className="bar"></div><div className="bar"></div></div>
                        </div>
                        <div className={`stem-track ${stems.bajo ? 'active' : 'muted'}`} onClick={() => toggleStem('bajo')}>
                            <span className="stem-name">Bajo (Bass)</span>
                            <div className="visualizer"><div className="bar"></div><div className="bar"></div><div className="bar"></div><div className="bar"></div></div>
                        </div>
                        <div className={`stem-track ${stems.sintes ? 'active' : 'muted'}`} onClick={() => toggleStem('sintes')}>
                            <span className="stem-name">Sintes (Keys)</span>
                            <div className="visualizer"><div className="bar"></div><div className="bar"></div><div className="bar"></div><div className="bar"></div></div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}