import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { searchSpotifyArtists } from '../services/spotifyService';
import { getCuratedVaultMatch } from '../constants/artistasSpotifyMap.js';
import './Artistas.css';

// Frecuencias globales sugeridas para sintonización rápida en el Radar Spotify
const SPOTIFY_RADAR_FREQUENCIES = [
    { name: 'Queen', tag: 'Rock Clásico' },
    { name: 'Dua Lipa', tag: 'Dance Pop' },
    { name: 'Gorillaz', tag: 'Art Pop' },
    { name: 'Bad Bunny', tag: 'Trap Latino' },
    { name: 'Beyoncé', tag: 'R&B Contemporáneo' },
    { name: 'Daft Punk', tag: 'French House' }
];

export default function Artistas() {
    const [artistas, setArtistas] = useState([]);
    const [cargando, setCargando] = useState(true);
    
    // Pestaña activa del catálogo: 'boveda' (Expedientes Curados) o 'radar' (Spotify API Global)
    const [pestañaColeccion, setPestañaColeccion] = useState('boveda');

    // Búsqueda en el archivo global de Spotify
    const [terminoBusqueda, setTerminoBusqueda] = useState('');
    const [resultadosSpotify, setResultadosSpotify] = useState([]);
    const [buscandoSpotify, setBuscandoSpotify] = useState(false);

    // Modo de visualización para la Bóveda: 'horizontal' (por defecto) o 'grid' (cuadrícula clásica)
    const [modoVista, setModoVista] = useState('horizontal');
    const [indiceActivo, setIndiceActivo] = useState(0);
    const [progresoScroll, setProgresoScroll] = useState(0);

    const trackRef = useRef(null);

    // Cargar artistas desde Firestore
    useEffect(() => {
        const obtenerArtistas = async () => {
            try {
                const artistasCol = collection(db, 'artistas');
                const artistasSnapshot = await getDocs(artistasCol);
                const listaArtistas = artistasSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setArtistas(listaArtistas);
            } catch (error) {
                console.error("Error obteniendo artistas:", error);
            } finally {
                setCargando(false);
            }
        };

        obtenerArtistas();
    }, []);

    // Búsqueda en tiempo real con debounce en el archivo de Spotify
    useEffect(() => {
        if (!terminoBusqueda.trim()) {
            setResultadosSpotify([]);
            setBuscandoSpotify(false);
            return;
        }

        // Si el usuario escribe en el buscador, conmutamos automáticamente al radar de Spotify
        setPestañaColeccion('radar');
        setBuscandoSpotify(true);

        const timer = setTimeout(async () => {
            try {
                const resultados = await searchSpotifyArtists(terminoBusqueda, 12);
                setResultadosSpotify(resultados);
            } catch (err) {
                console.error("Error buscando en Spotify:", err);
                setResultadosSpotify([]);
            } finally {
                setBuscandoSpotify(false);
            }
        }, 350);

        return () => clearTimeout(timer);
    }, [terminoBusqueda]);

    // Actualizar progreso y tarjeta activa durante el scroll en modo horizontal
    const handleScroll = useCallback(() => {
        const el = trackRef.current;
        if (!el || artistas.length === 0) return;

        const { scrollLeft, scrollWidth, clientWidth } = el;
        const maxScroll = scrollWidth - clientWidth;
        
        if (maxScroll > 0) {
            const porcentaje = Math.min(100, Math.max(0, (scrollLeft / maxScroll) * 100));
            setProgresoScroll(porcentaje);
        }

        // Calcular tarjeta más cercana al centro del contenedor
        const cards = el.querySelectorAll('.artistas-card-horizontal');
        const centroContenedor = scrollLeft + clientWidth / 2;
        let indiceMasCercano = 0;
        let menorDistancia = Infinity;

        cards.forEach((card, idx) => {
            const cardCenter = card.offsetLeft + card.offsetWidth / 2;
            const distancia = Math.abs(centroContenedor - cardCenter);
            if (distancia < menorDistancia) {
                menorDistancia = distancia;
                indiceMasCercano = idx;
            }
        });

        setIndiceActivo(indiceMasCercano);
    }, [artistas.length]);

    // Listener de scroll de rueda para navegar horizontalmente de forma natural
    useEffect(() => {
        const el = trackRef.current;
        if (!el || modoVista !== 'horizontal' || pestañaColeccion !== 'boveda') return;

        const onWheel = (e) => {
            if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
                e.preventDefault();
                el.scrollBy({
                    left: e.deltaY * 1.8,
                    behavior: 'auto'
                });
            }
        };

        el.addEventListener('wheel', onWheel, { passive: false });
        return () => el.removeEventListener('wheel', onWheel);
    }, [modoVista, pestañaColeccion]);

    // Navegar a la tarjeta anterior
    const navegarAnterior = () => {
        const el = trackRef.current;
        if (!el) return;
        const cardWidth = el.querySelector('.artistas-card-horizontal')?.offsetWidth || 340;
        el.scrollBy({ left: -(cardWidth + 30), behavior: 'smooth' });
    };

    // Navegar a la tarjeta siguiente
    const navegarSiguiente = () => {
        const el = trackRef.current;
        if (!el) return;
        const cardWidth = el.querySelector('.artistas-card-horizontal')?.offsetWidth || 340;
        el.scrollBy({ left: cardWidth + 30, behavior: 'smooth' });
    };

    // Saltar directamente a una tarjeta específica
    const irACard = (index) => {
        const el = trackRef.current;
        if (!el) return;
        const cards = el.querySelectorAll('.artistas-card-horizontal');
        if (cards[index]) {
            cards[index].scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        }
    };

    // Navegación accesible con teclado (Flechas Izquierda / Derecha)
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (modoVista !== 'horizontal' || pestañaColeccion !== 'boveda') return;
            if (e.key === 'ArrowRight') {
                navegarSiguiente();
            } else if (e.key === 'ArrowLeft') {
                navegarAnterior();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [modoVista, pestañaColeccion]);

    return (
        <main className="artistas-page">
            {/* Resplandor ambiental de fondo */}
            <div className="artistas-ambient-glow" />

            {/* Encabezado con selector de vista y controles */}
            <header className="artistas-header-container">
                <div className="artistas-titles">
                    <div className="artistas-badge-top">
                        <span className="pulse-dot" />
                        <span>The Sonic Vault // Catálogo Oficial</span>
                    </div>
                    <h1>Salón de <span className="accent">Artistas</span></h1>
                    <p>Explora el archivo histórico curado de la plataforma o sintoniza el universo global en vivo.</p>
                </div>

                {/* Banner Informativo de Arquitectura (Nivel 1 vs Nivel 2) */}
                <div className="artistas-architecture-legend" role="region" aria-label="Arquitectura del catálogo">
                    <div 
                        className={`legend-card legend-boveda ${pestañaColeccion === 'boveda' ? 'is-current' : ''}`}
                        onClick={() => setPestañaColeccion('boveda')}
                        role="button"
                        tabIndex={0}
                        title="Ver expedientes curados de la Bóveda"
                    >
                        <div className="legend-card-header">
                            <span className="legend-badge boveda-badge">
                                <i className="fa-solid fa-crown" /> NIVEL 1 // BÓVEDA
                            </span>
                            <span className="legend-count">{artistas.length || 10} MAESTROS</span>
                        </div>
                        <h4>Expedientes de Culto Curados</h4>
                        <p>Análisis documental de Eras Sonoras, Árbol de Influencias en Constelación y Discografía oficial sincronizada.</p>
                    </div>

                    <div 
                        className={`legend-card legend-radar ${pestañaColeccion === 'radar' ? 'is-current' : ''}`}
                        onClick={() => setPestañaColeccion('radar')}
                        role="button"
                        tabIndex={0}
                        title="Ver radar satelital de Spotify"
                    >
                        <div className="legend-card-header">
                            <span className="legend-badge radar-badge">
                                <i className="fa-brands fa-spotify" /> NIVEL 2 // RADAR GLOBAL
                            </span>
                            <span className="legend-count">SPOTIFY API</span>
                        </div>
                        <h4>Transmisión Abierta Universal</h4>
                        <p>Conexión satelital en vivo con más de 100M de artistas para rastrear métricas, Top Tracks y catálogo discográfico.</p>
                    </div>
                </div>

                {/* Buscador Universal con Spotify API */}
                <div className="artistas-search-bar-wrap">
                    <div className="artistas-search-field">
                        <i className={`fa-solid ${buscandoSpotify ? 'fa-circle-notch fa-spin' : 'fa-satellite-dish'}`} style={{ color: 'var(--accent-color)' }} />
                        <input
                            type="text"
                            placeholder="Rastrear cualquier artista en Spotify (ej: Gorillaz, Dua Lipa, Queen, Bad Bunny)..."
                            value={terminoBusqueda}
                            onChange={(e) => setTerminoBusqueda(e.target.value)}
                            onFocus={() => setPestañaColeccion('radar')}
                            className="artistas-search-input"
                        />
                        {terminoBusqueda && (
                            <button
                                type="button"
                                className="artistas-search-clear"
                                onClick={() => setTerminoBusqueda('')}
                                title="Limpiar búsqueda"
                            >
                                <i className="fa-solid fa-xmark" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Barra de Pestañas Conceptuales y Controles de Navegación */}
                <div className="artistas-nav-master-row">
                    {/* Selector de Pestañas Conceptuales */}
                    <nav className="artistas-collection-tabs" aria-label="Nivel de catálogo">
                        <button
                            type="button"
                            className={`collection-tab-btn ${pestañaColeccion === 'boveda' ? 'active' : ''}`}
                            onClick={() => {
                                setPestañaColeccion('boveda');
                                setTerminoBusqueda('');
                            }}
                        >
                            <i className="fa-solid fa-crown" />
                            <span>Bóveda Clasificada</span>
                            <span className="tab-pill-counter">{artistas.length || 10}</span>
                        </button>

                        <button
                            type="button"
                            className={`collection-tab-btn radar-btn ${pestañaColeccion === 'radar' ? 'active' : ''}`}
                            onClick={() => setPestañaColeccion('radar')}
                        >
                            <i className="fa-brands fa-spotify" />
                            <span>Radar Global Spotify</span>
                            <span className="tab-pill-live">LIVE</span>
                        </button>
                    </nav>

                    {/* Controles para la Bóveda (solo si está activa y no hay búsqueda) */}
                    {pestañaColeccion === 'boveda' && !terminoBusqueda.trim() && (
                        <div className="artistas-controls-bar">
                            <div className="artistas-view-switcher" role="group" aria-label="Modo de vista">
                                <button
                                    type="button"
                                    className={`view-btn ${modoVista === 'horizontal' ? 'active' : ''}`}
                                    onClick={() => setModoVista('horizontal')}
                                    title="Modo Desfile Horizontal"
                                >
                                    <i className="fa-solid fa-arrows-left-right" /> Horizontal
                                </button>
                                <button
                                    type="button"
                                    className={`view-btn ${modoVista === 'grid' ? 'active' : ''}`}
                                    onClick={() => setModoVista('grid')}
                                    title="Modo Cuadrícula Vertical Clásica"
                                >
                                    <i className="fa-solid fa-table-cells" /> Cuadrícula
                                </button>
                            </div>

                            {modoVista === 'horizontal' && artistas.length > 0 && (
                                <div className="artistas-nav-arrows">
                                    <button
                                        type="button"
                                        className="nav-arrow-btn"
                                        onClick={navegarAnterior}
                                        disabled={indiceActivo === 0}
                                        title="Artista anterior"
                                        aria-label="Artista anterior"
                                    >
                                        <i className="fa-solid fa-chevron-left" />
                                    </button>
                                    <button
                                        type="button"
                                        className="nav-arrow-btn"
                                        onClick={navegarSiguiente}
                                        disabled={indiceActivo === artistas.length - 1}
                                        title="Artista siguiente"
                                        aria-label="Artista siguiente"
                                    >
                                        <i className="fa-solid fa-chevron-right" />
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </header>

            {/* ==============================================================
                PESTAÑA 2: RADAR GLOBAL SPOTIFY (BÚSQUEDA Y SUGERENCIAS)
               ============================================================== */}
            {pestañaColeccion === 'radar' ? (
                <section className="spotify-search-results-section" aria-label="Radar global de Spotify">
                    <div className="spotify-results-header">
                        <h2>
                            <i className="fa-brands fa-spotify" style={{ color: '#1DB954', marginRight: '10px' }} />
                            {terminoBusqueda.trim()
                                ? `Radar Spotify // Frecuencias detectadas (${resultadosSpotify.length})`
                                : 'Radar Spotify // Frecuencias Globales en Tiempo Real'}
                        </h2>
                        <button
                            type="button"
                            className="view-btn back-to-vault-btn"
                            onClick={() => {
                                setPestañaColeccion('boveda');
                                setTerminoBusqueda('');
                            }}
                        >
                            <i className="fa-solid fa-crown" style={{ color: '#ffd700', marginRight: '6px' }} /> 
                            Regresar a Bóveda Curada
                        </button>
                    </div>

                    {/* Chips de frecuencias rápidas sugeridas */}
                    <div className="spotify-quick-frequencies">
                        <span className="quick-freq-label">
                            <i className="fa-solid fa-tower-broadcast" /> Sintonización rápida:
                        </span>
                        <div className="quick-freq-tags">
                            {SPOTIFY_RADAR_FREQUENCIES.map((freq) => (
                                <button
                                    key={freq.name}
                                    type="button"
                                    className={`freq-chip ${terminoBusqueda.toLowerCase() === freq.name.toLowerCase() ? 'active' : ''}`}
                                    onClick={() => setTerminoBusqueda(freq.name)}
                                >
                                    <span className="freq-chip-name">{freq.name}</span>
                                    <span className="freq-chip-tag">{freq.tag}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {buscandoSpotify ? (
                        <div className="artistas-loading-state" style={{ minHeight: '300px' }}>
                            <div className="artistas-loading-spinner" />
                            <h3 style={{ letterSpacing: '2px', textTransform: 'uppercase' }}>
                                Escaneando Frecuencias Globales en Spotify...
                            </h3>
                        </div>
                    ) : terminoBusqueda.trim() && resultadosSpotify.length === 0 ? (
                        <div className="artistas-empty-state" style={{ minHeight: '300px' }}>
                            <i className="fa-solid fa-satellite" style={{ fontSize: '3rem', color: '#555', marginBottom: '1.5rem' }} />
                            <h3>No se detectaron frecuencias para "{terminoBusqueda}"</h3>
                            <p style={{ color: '#888' }}>Verifica el nombre o prueba con otro artista de la escena global.</p>
                        </div>
                    ) : !terminoBusqueda.trim() ? (
                        <div className="radar-welcome-banner">
                            <div className="radar-welcome-icon">
                                <i className="fa-solid fa-satellite-dish" />
                            </div>
                            <h3>Receptor Satelital Activo</h3>
                            <p>Escribe el nombre de cualquier artista en la barra de búsqueda o haz clic en las sugerencias de arriba para rastrear su telemetría oficial en Spotify.</p>
                        </div>
                    ) : (
                        <div className="spotify-results-grid">
                            {resultadosSpotify.map((artist) => {
                                const imagenUrl = artist.images?.[0]?.url || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80';
                                const curatedMatch = getCuratedVaultMatch(artist);

                                // Si el artista tiene un Expediente Maestro en la Bóveda de Firestore
                                if (curatedMatch) {
                                    return (
                                        <article
                                            key={artist.id}
                                            className="spotify-artist-card is-curated-match"
                                        >
                                            {/* Listón de Certificación Bóveda */}
                                            <div className="curated-match-banner">
                                                <i className="fa-solid fa-crown" /> EXPEDIENTE MAESTRO EN BÓVEDA
                                            </div>

                                            <div className="spotify-card-img-wrap">
                                                <img src={imagenUrl} alt={artist.name} loading="lazy" />
                                                <div className="spotify-card-badge vault-badge-match">
                                                    <i className="fa-solid fa-shield-halved" /> ARCHIVO COMPLETO
                                                </div>
                                            </div>

                                            <div className="spotify-card-info">
                                                <h3 className="spotify-card-name">{artist.name}</h3>
                                                <p className="curated-match-note">
                                                    Posee investigación cronológica de <strong>Eras Sonoras</strong>, <strong>Árbol de Influencias</strong> y <strong>Discografía Sincronizada</strong>.
                                                </p>

                                                <div className="curated-match-actions">
                                                    <Link
                                                        to={`/artistas/${curatedMatch.slug}`}
                                                        className="btn-open-curated"
                                                    >
                                                        <i className="fa-solid fa-crown" /> Abrir Expediente Maestro
                                                    </Link>
                                                    <Link
                                                        to={`/artistas/sp_${artist.id}`}
                                                        className="btn-open-raw-spotify"
                                                        title="Ver solo perfil básico de Spotify"
                                                    >
                                                        Ver streaming básico →
                                                    </Link>
                                                </div>
                                            </div>
                                        </article>
                                    );
                                }

                                // Artista estándar del catálogo abierto de Spotify
                                return (
                                    <Link
                                        to={`/artistas/sp_${artist.id}`}
                                        key={artist.id}
                                        className="spotify-artist-card"
                                    >
                                        <div className="spotify-card-img-wrap">
                                            <img src={imagenUrl} alt={artist.name} loading="lazy" />
                                            <div className="spotify-card-badge">
                                                <i className="fa-brands fa-spotify" style={{ color: '#1DB954' }} />
                                                <span>SPOTIFY LIVE API</span>
                                            </div>
                                        </div>
                                        <div className="spotify-card-info">
                                            <h3 className="spotify-card-name">{artist.name}</h3>
                                            <p className="spotify-card-type">
                                                CATÁLOGO GLOBAL // STREAMING DINÁMICO
                                            </p>
                                            <span className="spotify-card-action">
                                                <span>Explorar Transmisión</span>
                                                <i className="fa-solid fa-arrow-right" />
                                            </span>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </section>
            ) : cargando ? (
                /* ==============================================================
                    ESTADO DE CARGA DE LA BÓVEDA
                   ============================================================== */
                <div className="artistas-loading-state">
                    <div className="artistas-loading-spinner" />
                    <h3 style={{ letterSpacing: '2px', textTransform: 'uppercase' }}>
                        Desencriptando Archivos en la Nube...
                    </h3>
                </div>
            ) : artistas.length === 0 ? (
                /* ==============================================================
                    ESTADO VACÍO DE LA BÓVEDA
                   ============================================================== */
                <div className="artistas-empty-state">
                    <i className="fa-solid fa-database" style={{ fontSize: '3rem', color: '#444', marginBottom: '1.5rem' }} />
                    <h3>No se encontraron expedientes en la bóveda</h3>
                    <p style={{ color: '#888' }}>Revisa la conexión a la base de datos o crea nuevos artistas.</p>
                </div>
            ) : modoVista === 'horizontal' ? (
                /* ==============================================================
                    PESTAÑA 1: BÓVEDA CLASIFICADA — VISTA HORIZONTAL RUNWAY
                   ============================================================== */
                <section className="artistas-horizontal-wrapper" aria-label="Desfile horizontal de artistas de culto">
                    <div className="artistas-fade-left" />
                    <div className="artistas-fade-right" />

                    <div
                        className="artistas-horizontal-track"
                        ref={trackRef}
                        onScroll={handleScroll}
                    >
                        {artistas.map((artista, index) => {
                            const esActivo = index === indiceActivo;
                            const numeroExpediente = String(index + 1).padStart(2, '0');

                            return (
                                <Link
                                    key={artista.id}
                                    to={`/artistas/${artista.id}`}
                                    className={`artistas-card-horizontal ${esActivo ? 'is-active-card' : ''}`}
                                    title={`Explorar archivo maestro de ${artista.nombre}`}
                                >
                                    <div className="artistas-card-img-wrap">
                                        <img src={artista.imagen} alt={artista.nombre} loading="lazy" />
                                    </div>

                                    {/* HUD Superior: Número de expediente + Badge Maestro */}
                                    <div className="artistas-card-hud">
                                        <span className="card-hud-badge">
                                            #{numeroExpediente} // VAULT
                                        </span>
                                        <span className="vault-master-pill">
                                            <i className="fa-solid fa-crown" /> EXPEDIENTE MAESTRO
                                        </span>
                                        <div className="card-hud-equalizer" title="Frecuencia activa">
                                            <span className="eq-bar" />
                                            <span className="eq-bar" />
                                            <span className="eq-bar" />
                                            <span className="eq-bar" />
                                        </div>
                                    </div>

                                    {/* Contenido Inferior con Especificaciones de la Bóveda */}
                                    <div className="artistas-card-content">
                                        {artista.subtitulo && (
                                            <p className="card-artist-subtitulo">{artista.subtitulo}</p>
                                        )}
                                        <h3 className="card-artist-nombre">{artista.nombre}</h3>
                                        
                                        {/* Chips de Especificaciones del Expediente Curado */}
                                        <div className="card-specs-row">
                                            <span className="card-spec-chip">
                                                <i className="fa-solid fa-clock-rotate-left" /> Eras
                                            </span>
                                            <span className="card-spec-chip">
                                                <i className="fa-solid fa-diagram-project" /> Genealogía
                                            </span>
                                            <span className="card-spec-chip">
                                                <i className="fa-brands fa-spotify" /> Discografía
                                            </span>
                                        </div>

                                        <span className="card-artist-action">
                                            Abrir Expediente Maestro <i className="fa-solid fa-arrow-right" />
                                        </span>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>

                    {/* HUD Inferior: Barra de progreso, contador y puntos de navegación */}
                    <footer className="artistas-bottom-hud">
                        <div className="artistas-progress-container">
                            <span className="artistas-counter">
                                EXPEDIENTE MAESTRO <span className="current-num">{String(indiceActivo + 1).padStart(2, '0')}</span> / {String(artistas.length).padStart(2, '0')}
                            </span>
                            <div className="artistas-progress-rail">
                                <div
                                    className="artistas-progress-fill"
                                    style={{ width: `${Math.max(12, progresoScroll)}%` }}
                                />
                            </div>
                        </div>

                        <div className="artistas-dots-nav">
                            {artistas.map((artista, idx) => (
                                <button
                                    key={artista.id}
                                    type="button"
                                    className={`artist-dot-btn ${idx === indiceActivo ? 'active' : ''}`}
                                    onClick={() => irACard(idx)}
                                    title={`Ir a ${artista.nombre}`}
                                    aria-label={`Ver ${artista.nombre}`}
                                />
                            ))}
                        </div>

                        <p className="artistas-hint-scroll">
                            <i className="fa-solid fa-arrows-left-right" style={{ marginRight: '6px' }} />
                            Desplaza horizontalmente con rueda del ratón, flechas [← / →] o arrastre
                        </p>
                    </footer>
                </section>
            ) : (
                /* ==============================================================
                    PESTAÑA 1: BÓVEDA CLASIFICADA — VISTA CUADRÍCULA VERTICAL
                   ============================================================== */
                <section className="artistas-grid-container" aria-label="Cuadrícula de expedientes de culto">
                    <div className="artist-grid">
                        {artistas.map((artista) => (
                            <Link key={artista.id} to={`/artistas/${artista.id}`} className="artist-card is-vault-card">
                                <div className="grid-card-badge-top">
                                    <span className="vault-master-pill">
                                        <i className="fa-solid fa-crown" /> MAESTRO
                                    </span>
                                </div>
                                <img src={artista.imagen} alt={artista.nombre} loading="lazy" />
                                <div className="artist-info">
                                    <h3>{artista.nombre}</h3>
                                    <p>{artista.subtitulo}</p>
                                    <div className="card-specs-row mini">
                                        <span className="card-spec-chip"><i className="fa-solid fa-clock-rotate-left" /> Eras</span>
                                        <span className="card-spec-chip"><i className="fa-solid fa-diagram-project" /> Ecos</span>
                                        <span className="card-spec-chip"><i className="fa-brands fa-spotify" /> Spotify</span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>
            )}
        </main>
    );
}
