import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';

export default function Artistas() {
    const [artistas, setArtistas] = useState([]);
    const [cargando, setCargando] = useState(true);

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

    return (
        <main>
            <section className="catalog-section">
                <div className="section-header">
                    <h2>Salón de <span className="accent">Artistas</span></h2>
                </div>
                
                {cargando ? (
                    <div style={{ textAlign: 'center', color: '#fff', marginTop: '50px' }}>
                        <h3 style={{ animation: 'pulseText 1.5s infinite' }}>Cargando desde la Nube...</h3>
                        <style>{`
                          @keyframes pulseText { 0%, 100% { opacity: 0.8; } 50% { opacity: 0.3; } }
                        `}</style>
                    </div>
                ) : (
                    <div className="artist-grid">
                        {artistas.map((artista) => (
                            <Link key={artista.id} to={`/artistas/${artista.id}`} className="artist-card">
                                <img src={artista.imagen} alt={artista.nombre} />
                                <div className="artist-info">
                                    <h3>{artista.nombre}</h3>
                                    <p>{artista.subtitulo}</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </section>
        </main>
    );
}