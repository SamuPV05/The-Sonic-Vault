import { Link } from 'react-router-dom';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      style={{
        marginTop: 'auto',
        background: 'rgba(8, 8, 18, 0.94)',
        backdropFilter: 'blur(16px)',
        borderTop: '1px solid var(--border-glow, rgba(0, 240, 255, 0.2))',
        padding: '2.5rem 5% 1.8rem',
        color: '#94a3b8',
        fontSize: '0.85rem',
        width: '100%',
        boxSizing: 'border-box',
        position: 'relative',
        zIndex: 10
      }}
    >
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '2rem',
          paddingBottom: '1.8rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.07)'
        }}
      >
        {/* Columna 1: Identidad & Estado del Motor */}
        <div>
          <Link
            to="/"
            className="logo"
            style={{
              fontSize: '1.25rem',
              textDecoration: 'none',
              letterSpacing: '2px',
              display: 'inline-block',
              marginBottom: '0.6rem'
            }}
          >
            THE SONIC <span className="accent">VAULT</span>
          </Link>
          <p style={{ margin: '0 0 1rem 0', lineHeight: 1.6, color: '#8892b0', fontSize: '0.82rem' }}>
            Archivo interactivo de arqueología musical, síntesis rítmica procedural en tiempo real y cartografía acústica comunitaria.
          </p>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(0, 255, 204, 0.08)',
              border: '1px solid rgba(0, 255, 204, 0.25)',
              borderRadius: '999px',
              padding: '4px 12px',
              fontSize: '0.7rem',
              color: '#00ffcc',
              fontWeight: 700,
              letterSpacing: '1px'
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: '#00ffcc',
                boxShadow: '0 0 8px #00ffcc'
              }}
            />
            WEB AUDIO DSP // 44.1 kHz ONLINE
          </div>
        </div>

        {/* Columna 2: Navegación Rápida */}
        <div>
          <h4
            style={{
              color: '#ffffff',
              fontSize: '0.82rem',
              textTransform: 'uppercase',
              letterSpacing: '2px',
              margin: '0 0 0.9rem 0'
            }}
          >
            Sectores de La Bóveda
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <Link to="/" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.83rem' }}>
              <i className="fa-solid fa-house" style={{ width: '20px', color: 'var(--accent-color)' }}></i> Inicio
            </Link>
            <Link to="/artistas" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.83rem' }}>
              <i className="fa-solid fa-compact-disc" style={{ width: '20px', color: 'var(--accent-color)' }}></i> Catálogo de Artistas
            </Link>
            <Link to="/beat-it" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.83rem' }}>
              <i className="fa-solid fa-drum" style={{ width: '20px', color: '#ff007a' }}></i> Estudio Beat It (8-Track)
            </Link>
            <Link to="/echo-safe" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.83rem' }}>
              <i className="fa-solid fa-satellite-dish" style={{ width: '20px', color: '#00bfff' }}></i> Radar Acústico Echo-Safe
            </Link>
            <Link to="/perfil" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.83rem' }}>
              <i className="fa-solid fa-user-astronaut" style={{ width: '20px', color: '#b877ff' }}></i> Centro de Mando (Perfil)
            </Link>
          </div>
        </div>

        {/* Columna 3: Arquitectura & Tecnologías */}
        <div>
          <h4
            style={{
              color: '#ffffff',
              fontSize: '0.82rem',
              textTransform: 'uppercase',
              letterSpacing: '2px',
              margin: '0 0 0.9rem 0'
            }}
          >
            Núcleo Tecnológico
          </h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '1rem' }}>
            {[
              'Web Audio API',
              'Spotify OAuth PKCE',
              'IEC 61672 Sound Meter',
              'Leaflet Heatmap',
              'Firebase Cloud',
              'React 19 + Vite'
            ].map((tech) => (
              <span
                key={tech}
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '6px',
                  padding: '4px 9px',
                  fontSize: '0.72rem',
                  color: '#cbd5e1'
                }}
              >
                {tech}
              </span>
            ))}
          </div>
          <p style={{ margin: 0, fontSize: '0.76rem', color: '#64748b', lineHeight: 1.5 }}>
            Monitoreo ambiental preventivo bajo estándares de salud auditiva OMS y síntesis digital sin muestras externas.
          </p>
        </div>
      </div>

      {/* Línea inferior de copyright */}
      <div
        style={{
          maxWidth: '1200px',
          margin: '1.2rem auto 0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px',
          fontSize: '0.76rem',
          color: '#64748b'
        }}
      >
        <span>© {currentYear} The Sonic Vault & Radar Echo-Safe. Todos los derechos reservados.</span>
        <span style={{ letterSpacing: '1px', textTransform: 'uppercase', color: '#475569' }}>
          SONIC VAULT OS // BUILD FINAL
        </span>
      </div>
    </footer>
  );
}
