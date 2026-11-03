import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { getCuratedSpotifyMapping } from '../constants/artistasSpotifyMap';
import { useWindowSize } from '../hooks/useWindowSize';

/**
 * Resuelve la configuración semántica, iconográfica y de color
 * según la naturaleza de la conexión genealógica en la Bóveda.
 */
const resolveVinculoConfig = (tipoRaw) => {
  const clean = String(tipoRaw || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

  // 1. Raíz de Inspiración / Predecesor
  if (
    clean.includes('influ') ||
    clean.includes('raiz') ||
    clean.includes('maestro') ||
    clean.includes('predecesor') ||
    clean.includes('ancestro')
  ) {
    return {
      badge: 'Influenciado por',
      flowLabel: 'RAÍZ DE INSPIRACIÓN',
      icon: 'fa-dna',
      directionIcon: 'fa-arrow-down-long',
      color: '#00F0FF', // Cian Neón
      glow: 'rgba(0, 240, 255, 0.45)',
      bg: 'rgba(0, 240, 255, 0.1)',
      border: 'rgba(0, 240, 255, 0.4)'
    };
  }

  // 2. Heredero Sónico / Descendiente
  if (
    clean.includes('inspiro') ||
    clean.includes('hered') ||
    clean.includes('descend') ||
    clean.includes('sucesor') ||
    clean.includes('nueva ola')
  ) {
    return {
      badge: 'Inspiró a',
      flowLabel: 'HEREDERO SÓNICO',
      icon: 'fa-bolt',
      directionIcon: 'fa-arrow-up-long',
      color: '#FF0077', // Magenta Neón
      glow: 'rgba(255, 0, 119, 0.45)',
      bg: 'rgba(255, 0, 119, 0.1)',
      border: 'rgba(255, 0, 119, 0.4)'
    };
  }

  // 3. Colaboración en Estudio / Alianza Sónica
  if (
    clean.includes('colabor') ||
    clean.includes('feat') ||
    clean.includes('duo') ||
    clean.includes('alianza') ||
    clean.includes('junto') ||
    clean.includes('sinergia')
  ) {
    return {
      badge: 'Colaboración Histórica',
      flowLabel: 'SINERGIA EN ESTUDIO',
      icon: 'fa-handshake',
      directionIcon: 'fa-arrow-right-arrow-left',
      color: '#FFAA00', // Ámbar Neón
      glow: 'rgba(255, 170, 0, 0.45)',
      bg: 'rgba(255, 170, 0, 0.1)',
      border: 'rgba(255, 170, 0, 0.4)'
    };
  }

  // 4. Legado Compartido / Maestro Histórico
  if (
    clean.includes('legado') ||
    clean.includes('icono') ||
    clean.includes('tributo') ||
    clean.includes('clasic') ||
    clean.includes('maestria')
  ) {
    return {
      badge: 'Legado Compartido',
      flowLabel: 'LINAJE HISTÓRICO',
      icon: 'fa-crown',
      directionIcon: 'fa-star',
      color: '#9945FF', // Púrpura Bóveda
      glow: 'rgba(153, 69, 255, 0.45)',
      bg: 'rgba(153, 69, 255, 0.1)',
      border: 'rgba(153, 69, 255, 0.4)'
    };
  }

  // 5. Default: Conexión Sónica Universal
  return {
    badge: tipoRaw || 'Conexión Sónica',
    flowLabel: 'VÍNCULO ARMÓNICO',
    icon: 'fa-circle-nodes',
    directionIcon: 'fa-arrows-split-up-and-left',
    color: '#00F0FF',
    glow: 'rgba(0, 240, 255, 0.45)',
    bg: 'rgba(0, 240, 255, 0.1)',
    border: 'rgba(0, 240, 255, 0.4)'
  };
};

export default function ArbolEcos({ ecos, artistaActual = '' }) {
  const [artistasRelacionados, setArtistasRelacionados] = useState({});
  const { isMobile: esMovil } = useWindowSize();

  useEffect(() => {
    if (!ecos || ecos.length === 0) return;

    let cancelado = false;

    const fetchEcos = async () => {
      const data = {};
      await Promise.all(
        ecos.map(async (eco) => {
          if (!eco?.id) return;
          try {
            const docRef = doc(db, 'artistas', eco.id);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
              data[eco.id] = docSnap.data();
            } else {
              // Respaldo instantáneo con el mapa canónico de The Sonic Vault
              const mapped = getCuratedSpotifyMapping(eco.id);
              data[eco.id] = {
                nombre:
                  mapped?.name ||
                  eco.id.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
                imagen:
                  'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=400&q=80',
                generos: mapped?.genres || []
              };
            }
          } catch (error) {
            console.warn('Aviso obteniendo eco de artista:', error);
            const mapped = getCuratedSpotifyMapping(eco.id);
            data[eco.id] = {
              nombre:
                mapped?.name ||
                eco.id.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
              imagen:
                'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=400&q=80'
            };
          }
        })
      );
      if (!cancelado) {
        setArtistasRelacionados(data);
      }
    };

    fetchEcos();

    return () => {
      cancelado = true;
    };
  }, [ecos]);

  if (!ecos || ecos.length === 0) return null;

  return (
    <section className="catalog-section ecos-constellation-section">
      {/* ENCABEZADO DE LA CONSTELACIÓN GENEALÓGICA */}
      <div
        className="section-header"
        style={{
          justifyContent: 'center',
          textAlign: 'center',
          border: 'none',
          marginBottom: '2.5rem'
        }}
      >
        <div className="ecos-constellation-badge">
          <i className="fa-solid fa-circle-nodes" />
          <span>
            {artistaActual
              ? `Constelación Genealógica // ${artistaActual}`
              : 'Constelación de Influencias // Bóveda Sónica'}
          </span>
        </div>

        <h2>
          Árbol de <span className="accent">Ecos</span>
        </h2>
        <p style={{ color: '#888', marginTop: '10px', maxWidth: '640px', margin: '10px auto 0 auto' }}>
          Explora la red de frecuencias, herencias creativas y ramificaciones sonoras que unen a este artista
          con el cosmos musical.
        </p>
      </div>

      {/* CUADRÍCULA DE NODOS INTERACTIVOS (CONSTELACIÓN) */}
      <div className="ecos-constellation-grid">
        {ecos.map((eco, index) => {
          const infoArtista = artistasRelacionados[eco.id];
          const nombreResolvido =
            infoArtista?.nombre ||
            eco.id.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
          const imagenResolvida =
            infoArtista?.imagen ||
            'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=400&q=80';
          const cfg = resolveVinculoConfig(eco.tipo);

          return (
            <Link
              to={`/artistas/${eco.id}`}
              key={eco.id || index}
              className="eco-constellation-card"
              style={{
                borderTop: `2px solid ${cfg.color}`,
                boxShadow: `0 10px 30px rgba(0, 0, 0, 0.6)`
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = cfg.color;
                e.currentTarget.style.boxShadow = `0 14px 45px ${cfg.glow}`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                e.currentTarget.style.borderTopColor = cfg.color;
                e.currentTarget.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.6)';
              }}
            >
              {/* CABECERA DE LA TARJETA: BADGE DIRECCIONAL DE VÍNCULO */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px',
                  marginBottom: '1rem'
                }}
              >
                <span
                  className="eco-flow-badge"
                  style={{
                    color: cfg.color,
                    background: cfg.bg,
                    border: `1px solid ${cfg.border}`
                  }}
                >
                  <i className={`fa-solid ${cfg.icon}`} />
                  <span>{cfg.flowLabel}</span>
                </span>

                <span
                  title={cfg.badge}
                  style={{
                    color: cfg.color,
                    fontSize: '0.85rem',
                    opacity: 0.85,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <i className={`fa-solid ${cfg.directionIcon}`} />
                </span>
              </div>

              {/* ANILLO ORBITAL Y AVATAR NEÓN */}
              <div className="eco-node-orbit">
                <div
                  className="eco-node-orbit-ring"
                  style={{
                    borderColor: `${cfg.color}55`
                  }}
                />
                <div
                  className="eco-node-avatar"
                  style={{
                    border: `2px solid ${cfg.color}`,
                    boxShadow: `0 0 18px ${cfg.glow}`
                  }}
                >
                  <img src={imagenResolvida} alt={nombreResolvido} loading="lazy" />
                </div>
              </div>

              {/* IDENTIDAD Y RELACIÓN GENEALÓGICA */}
              <div style={{ textAlign: 'center', marginTop: '0.4rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <span
                  style={{
                    fontSize: '0.74rem',
                    color: cfg.color,
                    textTransform: 'uppercase',
                    letterSpacing: '1.5px',
                    fontWeight: 'bold',
                    display: 'block',
                    marginBottom: '4px'
                  }}
                >
                  {eco.tipo || cfg.badge}
                </span>

                <h3
                  style={{
                    margin: '0 0 8px 0',
                    fontSize: esMovil ? '1.15rem' : '1.25rem',
                    color: '#fff',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    lineHeight: '1.3'
                  }}
                >
                  {nombreResolvido}
                </h3>

                {eco.relacion && (
                  <p
                    style={{
                      fontSize: '0.82rem',
                      color: '#b0b8c4',
                      lineHeight: '1.6',
                      margin: '0 0 1.2rem 0',
                      wordBreak: 'break-word',
                      background: 'rgba(255, 255, 255, 0.02)',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid rgba(255, 255, 255, 0.05)'
                    }}
                  >
                    {eco.relacion}
                  </p>
                )}

                {/* ACCIÓN DE ACCESO AL EXPEDIENTE */}
                <div
                  style={{
                    marginTop: 'auto',
                    paddingTop: '0.8rem',
                    borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    fontSize: '0.78rem',
                    color: '#888',
                    fontWeight: 'bold',
                    letterSpacing: '1px',
                    textTransform: 'uppercase',
                    transition: 'color 0.2s'
                  }}
                >
                  <span>Explorar Expediente</span>
                  <i className="fa-solid fa-arrow-right" style={{ fontSize: '0.75rem', color: cfg.color }} />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
