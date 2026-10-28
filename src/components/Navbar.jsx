import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; 
import NavbarSpotifyPlayer from './NavbarSpotifyPlayer';
import { useWindowSize } from '../hooks/useWindowSize';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { isMobile } = useWindowSize();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const location = useLocation();

  // Patrón estándar de React para sincronizar estado con cambio de ruta sin cascading renders en useEffect
  const [prevPathname, setPrevPathname] = useState(location.pathname);
  if (location.pathname !== prevPathname) {
    setPrevPathname(location.pathname);
    setMenuAbierto(false);
  }

  return (
    <header style={{ 
      display: 'flex', 
      flexDirection: isMobile ? 'column' : 'row', 
      justifyContent: 'space-between', 
      alignItems: isMobile ? 'stretch' : 'center',
      padding: isMobile ? '12px 18px' : '18px 40px', 
      gap: isMobile ? '12px' : '0',
      boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
      width: '100%',
      boxSizing: 'border-box', 
      background: 'rgba(10, 10, 25, 0.92)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--border-glow)',
      position: 'relative',
      zIndex: 1000 
    }}>
      {/* Barra superior (Logo + Botón menú en móvil) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: isMobile ? '100%' : 'auto' }}>
        <Link to="/" className="logo" style={{ 
          fontSize: isMobile ? '1.25rem' : '1.5rem',
          textDecoration: 'none',
          letterSpacing: '2px'
        }}>
          THE SONIC <span className="accent">VAULT</span>
        </Link>

        {isMobile && (
          <button
            type="button"
            onClick={() => setMenuAbierto(!menuAbierto)}
            aria-label={menuAbierto ? 'Cerrar menú' : 'Abrir menú'}
            style={{
              background: 'transparent',
              border: '1px solid var(--border-glow)',
              color: 'var(--accent-color)',
              borderRadius: '6px',
              padding: '6px 12px',
              fontSize: '1.1rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <i className={`fa-solid ${menuAbierto ? 'fa-xmark' : 'fa-bars'}`}></i>
          </button>
        )}
      </div>
      
      {/* NAV PRINCIPAL (Visible siempre en desktop, colapsable en móvil) */}
      {(!isMobile || menuAbierto) && (
        <nav style={{ 
          display: 'flex', 
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: 'center', 
          gap: isMobile ? '12px' : '18px', 
          width: isMobile ? '100%' : 'auto',
          justifyContent: 'center',
          paddingTop: isMobile ? '10px' : '0',
          borderTop: isMobile ? '1px solid rgba(255,255,255,0.08)' : 'none',
          animation: isMobile ? 'fadeIn 0.25s ease' : 'none'
        }}>
          <Link to="/" style={{ fontSize: isMobile ? '0.95rem' : '1rem', textDecoration: 'none' }}>Inicio</Link>
          <Link to="/artistas" style={{ fontSize: isMobile ? '0.95rem' : '1rem', textDecoration: 'none' }}>Artistas</Link>
          <Link to="/beat-it" style={{ fontSize: isMobile ? '0.95rem' : '1rem', textDecoration: 'none' }}>Beat It</Link>
          <Link to="/echo-safe" style={{ fontSize: isMobile ? '0.95rem' : '1rem', textDecoration: 'none' }}>Echo Safe</Link>

          {/* MINI REPRODUCTOR NOW PLAYING SPOTIFY (FASE 3) */}
          <NavbarSpotifyPlayer />

          {/* --- ZONA DE SEGURIDAD FIREBASE --- */}
          <div style={{ 
            marginLeft: '0', 
            paddingLeft: isMobile ? '0' : '12px', 
            paddingTop: isMobile ? '10px' : '0',
            borderLeft: isMobile ? 'none' : '1px solid #333', 
            borderTop: isMobile ? '1px solid rgba(255,255,255,0.08)' : 'none',
            width: isMobile ? '100%' : 'auto',
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            gap: '12px' 
          }}>
            {user ? (
              <>
                <Link to="/perfil" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }} title="Ir al Centro de Mando">
                  {user.photoURL ? (
                    <img 
                      src={user.photoURL} 
                      alt="Perfil" 
                      style={{ width: isMobile ? '28px' : '32px', height: isMobile ? '28px' : '32px', borderRadius: '50%', border: '2px solid var(--accent-color)', objectFit: 'cover' }} 
                    />
                  ) : (
                    <div style={{ width: isMobile ? '28px' : '32px', height: isMobile ? '28px' : '32px', borderRadius: '50%', background: '#222', display: 'flex', justifyContent: 'center', alignItems: 'center', border: '2px solid var(--accent-color)' }}>
                      <i className="fa-solid fa-user-astronaut" style={{ color: 'var(--accent-color)', fontSize: isMobile ? '0.8rem' : '1rem' }}></i>
                    </div>
                  )}
                  <span style={{ fontSize: isMobile ? '0.82rem' : '0.85rem', fontWeight: 'bold', color: '#fff' }}>
                    {user.displayName ? user.displayName.split(' ')[0] : 'Explorador'}
                  </span>
                </Link>

                <button 
                  onClick={logout}
                  className="btn-logout"
                  style={{ fontSize: isMobile ? '0.78rem' : '0.85rem' }}
                >
                  Salir
                </button>
              </>
            ) : (
              <Link 
                to="/login"
                style={{ background: 'var(--accent-color)', color: '#000', textDecoration: 'none', padding: isMobile ? '6px 14px' : '8px 16px', borderRadius: '5px', fontWeight: 'bold', fontSize: isMobile ? '0.82rem' : '0.85rem', display: 'flex', alignItems: 'center' }}
              >
                <i className="fa-solid fa-user-lock" style={{ marginRight: '6px', fontSize: '0.9rem' }}></i> Entrar
              </Link>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
