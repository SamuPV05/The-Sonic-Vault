import { useState } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; 
import NavbarSpotifyPlayer from './NavbarSpotifyPlayer';
import { useWindowSize } from '../hooks/useWindowSize';

export default function Navbar() {
  const { user, is2FAPending, logout, cancelarRegistroPendiente } = useAuth();
  const { isMobile } = useWindowSize();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const location = useLocation();

  // Sincronizar estado con cambio de ruta
  const [prevPathname, setPrevPathname] = useState(location.pathname);
  if (location.pathname !== prevPathname) {
    setPrevPathname(location.pathname);
    setMenuAbierto(false);
  }

  const getNavLinkStyle = ({ isActive }) => ({
    fontSize: isMobile ? '0.95rem' : '1rem',
    textDecoration: 'none',
    color: isActive ? 'var(--accent-color)' : '#fff',
    fontWeight: isActive ? '700' : '500',
    textShadow: isActive ? '0 0 10px rgba(0, 240, 255, 0.65)' : 'none',
    borderBottom: isActive ? '2px solid var(--accent-color)' : '2px solid transparent',
    paddingBottom: '2px',
    transition: 'all 0.2s ease',
    display: 'inline-flex',
    alignItems: 'center',
    opacity: is2FAPending ? 0.45 : 1,
    cursor: is2FAPending ? 'not-allowed' : 'pointer'
  });

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
        <Link 
          to="/" 
          className="logo" 
          onClick={(e) => { if (is2FAPending) e.preventDefault(); }}
          style={{ 
            fontSize: isMobile ? '1.25rem' : '1.5rem',
            textDecoration: 'none',
            letterSpacing: '2px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: isMobile ? '10px' : '12px',
            opacity: is2FAPending ? 0.6 : 1,
            cursor: is2FAPending ? 'not-allowed' : 'pointer'
          }}
        >
          <img
            src="/sonic-vault-logo.png"
            alt="The Sonic Vault Logo"
            style={{
              width: isMobile ? '34px' : '40px',
              height: isMobile ? '34px' : '40px',
              borderRadius: '8px',
              objectFit: 'contain',
              filter: 'drop-shadow(0 0 8px rgba(0, 240, 255, 0.35))',
              flexShrink: 0
            }}
          />
          <span>THE SONIC <span className="accent">VAULT</span></span>
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
          <NavLink 
            to="/" 
            end 
            style={getNavLinkStyle}
            onClick={(e) => { if (is2FAPending) e.preventDefault(); }}
          >
            Inicio
          </NavLink>
          <NavLink 
            to="/artistas" 
            style={getNavLinkStyle}
            onClick={(e) => { if (is2FAPending) e.preventDefault(); }}
          >
            Artistas
          </NavLink>
          <NavLink 
            to="/beat-it" 
            style={getNavLinkStyle}
            onClick={(e) => { if (is2FAPending) e.preventDefault(); }}
          >
            Beat It
          </NavLink>
          <NavLink 
            to="/echo-safe" 
            style={getNavLinkStyle}
            onClick={(e) => { if (is2FAPending) e.preventDefault(); }}
          >
            Echo Safe
          </NavLink>

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
            {is2FAPending ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'rgba(255, 170, 0, 0.15)',
                    color: '#ffaa00',
                    border: '1px solid rgba(255, 170, 0, 0.4)',
                    padding: '4px 10px',
                    borderRadius: '15px',
                    fontSize: isMobile ? '0.72rem' : '0.78rem',
                    fontWeight: 'bold',
                    letterSpacing: '0.5px'
                  }}
                  title="Segundo factor requerido para acceder"
                >
                  <i className="fa-solid fa-shield-halved" /> 2FA PENDIENTE
                </span>
                <button
                  type="button"
                  onClick={cancelarRegistroPendiente}
                  className="btn-logout"
                  style={{ fontSize: isMobile ? '0.72rem' : '0.78rem', padding: '4px 8px' }}
                  title="Cancelar y salir"
                >
                  Cancelar
                </button>
              </div>
            ) : user ? (
              <>
                <NavLink 
                  to="/perfil" 
                  style={({ isActive }) => ({ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px', 
                    textDecoration: 'none',
                    padding: '4px 10px',
                    borderRadius: '20px',
                    background: isActive ? 'rgba(0, 240, 255, 0.12)' : 'transparent',
                    border: isActive ? '1px solid var(--accent-color)' : '1px solid transparent',
                    boxShadow: isActive ? '0 0 12px rgba(0, 240, 255, 0.25)' : 'none',
                    transition: 'all 0.2s ease'
                  })} 
                  title="Ir al Centro de Mando"
                >
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
                </NavLink>

                <button 
                  onClick={logout}
                  className="btn-logout"
                  style={{ fontSize: isMobile ? '0.78rem' : '0.85rem' }}
                >
                  Salir
                </button>
              </>
            ) : (
              <NavLink 
                to="/login"
                style={({ isActive }) => ({
                  background: isActive ? 'linear-gradient(45deg, var(--accent-color), var(--accent-secondary))' : 'var(--accent-color)', 
                  color: '#000', 
                  textDecoration: 'none', 
                  padding: isMobile ? '6px 14px' : '8px 16px', 
                  borderRadius: '5px', 
                  fontWeight: 'bold', 
                  fontSize: isMobile ? '0.82rem' : '0.85rem', 
                  display: 'flex', 
                  alignItems: 'center',
                  boxShadow: isActive ? '0 0 15px rgba(0, 240, 255, 0.5)' : 'none',
                  transition: 'all 0.2s ease'
                })}
              >
                <i className="fa-solid fa-user-lock" style={{ marginRight: '6px', fontSize: '0.9rem' }}></i> Entrar
              </NavLink>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
