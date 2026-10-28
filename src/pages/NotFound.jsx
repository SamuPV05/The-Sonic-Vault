import { Link, useLocation } from 'react-router-dom';

export default function NotFound() {
  const location = useLocation();

  return (
    <main
      style={{
        minHeight: '78vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2.5rem 1.5rem',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Resplandor ambiental de fondo */}
      <div
        style={{
          position: 'absolute',
          width: '420px',
          height: '420px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,0,122,0.14) 0%, rgba(0,240,255,0.06) 45%, transparent 70%)',
          filter: 'blur(40px)',
          pointerEvents: 'none',
          zIndex: 0
        }}
      />

      <div
        style={{
          position: 'relative',
          zIndex: 1,
          background: 'rgba(13, 14, 24, 0.85)',
          backdropFilter: 'blur(16px)',
          border: '1px solid var(--border-glow)',
          borderRadius: '20px',
          padding: '3rem 2.5rem',
          maxWidth: '620px',
          width: '100%',
          boxShadow: '0 20px 50px rgba(0,0,0,0.7), 0 0 30px rgba(0, 240, 255, 0.12)',
          boxSizing: 'border-box'
        }}
      >
        {/* Etiqueta superior de telemetría */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(255, 0, 122, 0.12)',
            border: '1px solid rgba(255, 0, 122, 0.4)',
            color: '#ff007a',
            padding: '5px 14px',
            borderRadius: '999px',
            fontSize: '0.72rem',
            fontWeight: 700,
            letterSpacing: '2px',
            textTransform: 'uppercase',
            marginBottom: '1.2rem'
          }}
        >
          <span
            style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              background: '#ff007a',
              boxShadow: '0 0 8px #ff007a'
            }}
          />
          SEÑAL PERDIDA // FRECUENCIA 0.00 Hz
        </div>

        {/* Código 404 Neón */}
        <h1
          style={{
            fontSize: 'clamp(4rem, 12vw, 6.5rem)',
            fontWeight: 800,
            margin: '0',
            lineHeight: 1,
            letterSpacing: '6px',
            background: 'linear-gradient(135deg, #00f0ff 0%, #ff007a 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: '0 0 35px rgba(0, 240, 255, 0.25)'
          }}
        >
          404
        </h1>

        <h2
          style={{
            color: '#ffffff',
            fontSize: '1.35rem',
            letterSpacing: '3px',
            textTransform: 'uppercase',
            margin: '0.8rem 0 1rem 0'
          }}
        >
          Frecuencia Fuera de Rango
        </h2>

        {/* Osciloscopio SVG animado */}
        <div
          style={{
            background: 'rgba(0, 0, 0, 0.55)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '10px',
            padding: '14px 18px',
            margin: '1.2rem 0',
             overflow: 'hidden'
          }}
        >
          <svg
            viewBox="0 0 400 50"
            style={{ width: '100%', height: '42px', display: 'block' }}
          >
            <defs>
              <linearGradient id="waveGrad404" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#00f0ff" />
                <stop offset="50%" stopColor="#ff007a" />
                <stop offset="100%" stopColor="#00f0ff" />
              </linearGradient>
            </defs>
            <path
              d="M 0 25 L 70 25 L 85 8 L 100 42 L 115 14 L 130 36 L 145 25 L 255 25 L 270 10 L 285 40 L 300 20 L 315 25 L 400 25"
              fill="none"
              stroke="url(#waveGrad404)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <div
            style={{
              fontFamily: 'monospace',
              fontSize: '0.75rem',
              color: '#8892b0',
              marginTop: '6px',
              wordBreak: 'break-all'
            }}
          >
            SECTOR NO ENCONTRADO: <span style={{ color: '#00f0ff' }}>{location.pathname}</span>
          </div>
        </div>

        <p
          style={{
            color: 'var(--text-muted, #94a3b8)',
            fontSize: '0.95rem',
            lineHeight: 1.6,
            margin: '0 0 2rem 0'
          }}
        >
          La coordenada acústica que intentas sintonizar no existe o ha sido desclasificada de{' '}
          <strong style={{ color: '#fff' }}>The Sonic Vault</strong>. Regresa al núcleo para continuar la exploración.
        </p>

        {/* Botones de rescate */}
        <div
          style={{
            display: 'flex',
            gap: '14px',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}
        >
          <Link
            to="/"
            style={{
              background: 'var(--accent-color, #00f0ff)',
              color: '#000',
              textDecoration: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '0.88rem',
              letterSpacing: '1px',
              textTransform: 'uppercase',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 0 20px rgba(0, 240, 255, 0.35)',
              transition: '0.2s'
            }}
          >
            <i className="fa-solid fa-compass"></i> Volver a La Bóveda
          </Link>

          <Link
            to="/beat-it"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              color: '#fff',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              textDecoration: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '0.88rem',
              letterSpacing: '1px',
              textTransform: 'uppercase',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              transition: '0.2s'
            }}
          >
            <i className="fa-solid fa-drum" style={{ color: '#ff007a' }}></i> Ir al Estudio Beat It
          </Link>
        </div>
      </div>
    </main>
  );
}
