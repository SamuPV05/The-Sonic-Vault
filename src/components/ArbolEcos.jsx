import { Link } from 'react-router-dom';
import { DATA_ARTISTAS } from '../datos';

export default function ArbolEcos({ ecos }) {
    if (!ecos || ecos.length === 0) return null;

    return (
        <section className="catalog-section" style={{ borderTop: '1px solid #1a1a1a', paddingTop: '4rem', marginTop: '4rem' }}>
            <div className="section-header" style={{ justifyContent: 'center', textAlign: 'center', border: 'none' }}>
                <h2>Árbol de <span className="accent">Ecos</span></h2>
                <p style={{ color: '#888', marginTop: '10px' }}>Descubre las conexiones sónicas e influencias de este artista.</p>
            </div>

            <div className="ecos-container">
                {ecos.map((eco, index) => {
                    // Buscamos la info del artista conectado en nuestra base de datos
                    const artistaRelacionado = DATA_ARTISTAS[eco.id];
                    
                    // Si por alguna razón el artista no existe en la BD, lo saltamos
                    if (!artistaRelacionado) return null;

                    return (
                        <Link to={`/artistas/${eco.id}`} key={index} className="eco-node">
                            <div className="eco-avatar">
                                <img src={artistaRelacionado.imagen} alt={artistaRelacionado.nombre} />
                            </div>
                            <div className="eco-info">
                                <span className="eco-tipo">{eco.tipo}</span>
                                <span className="eco-nombre">{artistaRelacionado.nombre}</span>
                                <p style={{ fontSize: '0.7rem', color: '#888', marginTop: '5px' }}>{eco.relacion}</p>
                            </div>
                        </Link>
                    );
                })}
            </div>
        </section>
    );
}