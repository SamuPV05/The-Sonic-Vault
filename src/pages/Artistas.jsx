import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { searchSpotifyArtists } from '../services/spotifyService';
import './Artistas.css';

export default function Artistas() {
    const [artistas, setArtistas] = useState([]);
    const [cargando, setCargando] = useState(true);
    
    // Búsqueda en el archivo global de Spotify
    const [terminoBusqueda, setTerminoBusqueda] = useState('');
    const [resultadosSpotify, setResultadosSpotify] = useState([]);
    const [buscandoSpotify, setBuscandoSpotify] = useState(false);

    // Modo de visualización: 'horizontal' (por defecto) o 'grid' (cuadrícula clásica)
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

    // Actualizar progreso y tarjeta activa durante el scroll
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
        if (!el || modoVista !== 'horizontal') return;

        const onWheel = (e) => {
            // Si el scroll es principalmente vertical, lo convertimos en desplazamiento horizontal fluido
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
    }, [modoVista]);

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
            if (modoVista !== 'horizontal') return;
            if (e.key === 'ArrowRight') {
                navegarSiguiente();
            } else if (e.key === 'ArrowLeft') {
                navegarAnterior();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [modoVista]);

    return (
        <main className="artistas-page">
            {/* Resplandor ambiental de fondo */}
            <div className="artistas-ambient-glow" />

            {/* Encabezado con selector de vista y controles */}
            <header className="artistas-header-container">
                <div className="artistas-titles">
                    <div className="artistas-badge-top">
                        <span className="pulse-dot" />
                        <span>Bóveda Sonora // Registros Clasificados</span>
                    </div>
                    <h1>Salón de <span className="accent">Artistas</span></h1>
                    <p>Explora el universo y la cronología sonora de las mayores leyendas de culto.</p>
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

                {/* Controles: Cambiar de vista y flechas de navegación horizontal */}
                {!terminoBusqueda.trim() && (
                    <div className="artistas-controls-bar">
                        {/* Selector de Modo: Horizontal vs Cuadrícula */}
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

                        {/* Botones de Flecha (solo en vista horizontal) */}
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
            </header>

            {/* Si el usuario está buscando un artista en Spotify */}
            {terminoBusqueda.trim() ? (
                <section className="spotify-search-results-section">
                    <div className="spotify-results-header">
                        <h2>
                            <i className="fa-brands fa-spotify" style={{ color: '#1DB954', marginRight: '10px' }} />
                            Radar Spotify // Frecuencias detectadas ({resultadosSpotify.length})
                        </h2>
                        <button
                            type="button"
                            className="view-btn"
                            onClick={() => setTerminoBusqueda('')}
                        >
                            <i className="fa-solid fa-arrow-left" style={{ marginRight: '6px' }} /> Volver a Expedientes Clasificados
                        </button>
                    </div>

                    {buscandoSpotify ? (
                        <div className="artistas-loading-state" style={{ minHeight: '300px' }}>
                            <div className="artistas-loading-spinner" />
                            <h3 style={{ letterSpacing: '2px', textTransform: 'uppercase' }}>
                                Escaneando Frecuencias Globales en Spotify...
                            </h3>
                        </div>
                    ) : resultadosSpotify.length === 0 ? (
                        <div className="artistas-empty-state" style={{ minHeight: '300px' }}>
                            <i className="fa-solid fa-satellite" style={{ fontSize: '3rem', color: '#555', marginBottom: '1.5rem' }} />
                            <h3>No se detectaron frecuencias para "{terminoBusqueda}"</h3>
                            <p style={{ color: '#888' }}>Verifica el nombre o prueba con otro artista de la escena global.</p>
                        </div>
                    ) : (
                        <div className="spotify-results-grid">
                            {resultadosSpotify.map((artist) => {
                                const imagenUrl = artist.images?.[0]?.url || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80';
                                const linkDetalle = `/artistas/sp_${artist.id}`;

                                return (
                                    <Link
                                        to={linkDetalle}
                                        key={artist.id}
                                        className="spotify-artist-card"
                                    >
                                        <div className="spotify-card-img-wrap">
                                            <img src={imagenUrl} alt={artist.name} loading="lazy" />
                                            <div className="spotify-card-badge">
                                                <i className="fa-brands fa-spotify" style={{ color: '#1DB954' }} />
                                                <span>SPOTIFY API</span>
                                            </div>
                                        </div>
                                        <div className="spotify-card-info">
                                            <h3 className="spotify-card-name">{artist.name}</h3>
                                            <p className="spotify-card-type">
                                                EXPEDIENTE GLOBAL // ARCHIVO ABIERTO
                                            </p>
                                            <span className="spotify-card-action">
                                                <span>Acceder al Registro</span>
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
                <div className="artistas-loading-state">
                    <div className="artistas-loading-spinner" />
                    <h3 style={{ letterSpacing: '2px', textTransform: 'uppercase' }}>
                        Desencriptando Archivos en la Nube...
                    </h3>
                </div>
            ) : artistas.length === 0 ? (
                <div className="artistas-empty-state">
                    <i className="fa-solid fa-database" style={{ fontSize: '3rem', color: '#444', marginBottom: '1.5rem' }} />
                    <h3>No se encontraron expedientes en la bóveda</h3>
                    <p style={{ color: '#888' }}>Revisa la conexión a la base de datos o crea nuevos artistas.</p>
                </div>
            ) : modoVista === 'horizontal' ? (
                /* ==========================================================
                   VISTA 1: DESFILE / RUNWAY HORIZONTAL 
                   ========================================================== */
                <section className="artistas-horizontal-wrapper" aria-label="Desfile horizontal de artistas">
                    <div className="artistas-fade-left" />
                    <div className="artistas-fade-right" />

                    {/* Pista de Desplazamiento Horizontal */}
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
                                    title={`Explorar archivo de ${artista.nombre}`}
                                >
                                    {/* Imagen de fondo con viñeta cinematográfica */}
                                    <div className="artistas-card-img-wrap">
                                        <img src={artista.imagen} alt={artista.nombre} loading="lazy" />
                                    </div>

                                    {/* HUD Superior: Número de expediente + Ecualizador activo */}
                                    <div className="artistas-card-hud">
                                        <span className="card-hud-badge">
                                            #{numeroExpediente} // VAULT
                                        </span>
                                        <div className="card-hud-equalizer" title="Frecuencia activa">
                                            <span className="eq-bar" />
                                            <span className="eq-bar" />
                                            <span className="eq-bar" />
                                            <span className="eq-bar" />
                                        </div>
                                    </div>

                                    {/* Contenido Inferior: Subtítulo, Nombre y Acción */}
                                    <div className="artistas-card-content">
                                        {artista.subtitulo && (
                                            <p className="card-artist-subtitulo">{artista.subtitulo}</p>
                                        )}
                                        <h3 className="card-artist-nombre">{artista.nombre}</h3>
                                        <span className="card-artist-action">
                                            Explorar Expediente <i className="fa-solid fa-arrow-right" />
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
                                EXPEDIENTE <span className="current-num">{String(indiceActivo + 1).padStart(2, '0')}</span> / {String(artistas.length).padStart(2, '0')}
                            </span>
                            <div className="artistas-progress-rail">
                                <div
                                    className="artistas-progress-fill"
                                    style={{ width: `${Math.max(12, progresoScroll)}%` }}
                                />
                            </div>
                        </div>

                        {/* Indicadores de salto rápido (Dots) */}
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
                            Usa la rueda del ratón, las flechas [← / →] o arrastra para deslizar
                        </p>
                    </footer>
                </section>
            ) : (
                /* ==========================================================
                   VISTA 2: CUADRÍCULA VERTICAL CLÁSICA (Para comparar)
                   ========================================================== */
                <section className="artistas-grid-container" aria-label="Cuadrícula clásica de artistas">
                    <div className="artist-grid">
                        {artistas.map((artista) => (
                            <Link key={artista.id} to={`/artistas/${artista.id}`} className="artist-card">
                                <img src={artista.imagen} alt={artista.nombre} loading="lazy" />
                                <div className="artist-info">
                                    <h3>{artista.nombre}</h3>
                                    <p>{artista.subtitulo}</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>
            )}
        </main>
    );
}