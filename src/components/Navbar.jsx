import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; 

export default function Navbar() {
  const { user, logout } = useAuth();
  const esMovil = window.innerWidth < 500;

  return (
    <header style={{ 
      display: 'flex', 
      flexDirection: esMovil ? 'column' : 'row', 
      justifyContent: 'space-between', 
      alignItems: 'center',
      
      // --- AUMENTAMOS EL PADDING LATERAL PARA EMPUJARLO A LA IZQUIERDA ---
      // '20px 40px' significa: 20px arriba/abajo, y 40px a los lados. 
      // Esos 40px empujan el botón rojo lejos del borde de tu pantalla.
      padding: esMovil ? '10px 15px' : '20px 40px', 
      
      gap: esMovil ? '10px' : '0',
      boxShadow: esMovil ? 'none' : '0 2px 10px rgba(0,0,0,0.3)',
      width: '100%',
      
      // --- LA MAGIA ESTÁ AQUÍ ---
      // Esto evita que el padding haga que la barra sea más ancha que la pantalla
      boxSizing: 'border-box', 
      
      background: '#000',
      position: 'relative',
      zIndex: 1000 
    }}>
        {/* Tu logo */}
        <Link to="/" className="logo" style={{ 
          fontSize: esMovil ? '1.2rem' : '1.5rem',
          textDecoration: 'none' 
        }}>
          THE SONIC <span className="accent">VAULT</span>
        </Link>
        
        {/* NAV PRINCIPAL */}
        <nav style={{ 
          display: 'flex', 
          flexDirection: esMovil ? 'column' : 'row',
          alignItems: 'center', 
          gap: esMovil ? '8px' : '15px', 
          width: esMovil ? '100%' : 'auto',
          justifyContent: 'center'
        }}>
            <Link to="/" style={{ fontSize: esMovil ? '0.9rem' : '1rem', textDecoration: 'none' }}>Inicio</Link>
            <Link to="/artistas" style={{ fontSize: esMovil ? '0.9rem' : '1rem', textDecoration: 'none' }}>Artistas</Link>
            <Link to="/beat-it" style={{ fontSize: esMovil ? '0.9rem' : '1rem', textDecoration: 'none' }}>Beat It</Link>
            <Link to="/echo-safe" style={{ fontSize: esMovil ? '0.9rem' : '1rem', textDecoration: 'none' }}>Echo Safe</Link>

            {/* --- ZONA DE SEGURIDAD FIREBASE --- */}
            <div style={{ 
              marginLeft: '0', 
              paddingLeft: '0', 
              paddingTop: esMovil ? '8px' : '0',
              borderLeft: esMovil ? 'none' : '1px solid #333', 
              borderTop: esMovil ? '1px solid #333' : 'none',
              width: esMovil ? '100%' : 'auto',
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              gap: '10px' 
            }}>
              {user ? (
                <>
                  <Link to="/perfil" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }} title="Ir al Centro de Mando">
                    {user.photoURL ? (
                      <img 
                        src={user.photoURL} 
                        alt="Perfil" 
                        style={{ width: esMovil ? '28px' : '32px', height: esMovil ? '28px' : '32px', borderRadius: '50%', border: '2px solid var(--accent-color)', objectFit: 'cover' }} 
                      />
                    ) : (
                      <div style={{ width: esMovil ? '28px' : '32px', height: esMovil ? '28px' : '32px', borderRadius: '50%', background: '#222', display: 'flex', justifyContent: 'center', alignItems: 'center', border: '2px solid var(--accent-color)' }}>
                        <i className="fa-solid fa-user-astronaut" style={{ color: 'var(--accent-color)', fontSize: esMovil ? '0.8rem' : '1rem' }}></i>
                      </div>
                    )}
                    <span style={{ fontSize: esMovil ? '0.8rem' : '0.85rem', fontWeight: 'bold', color: '#fff' }}>
                      {user.displayName ? user.displayName.split(' ')[0] : 'Explorador'}
                    </span>
                  </Link>

                  <button 
                    onClick={logout}
                    style={{ background: 'transparent', color: '#ff0055', border: '1px solid #ff0055', padding: '4px 10px', borderRadius: '5px', cursor: 'pointer', fontSize: esMovil ? '0.75rem' : '0.8rem' }}
                  >
                    Salir
                  </button>
                </>
              ) : (
                <Link 
                  to="/login"
                  style={{ background: 'var(--accent-color)', color: '#000', textDecoration: 'none', padding: esMovil ? '4px 10px' : '8px 16px', borderRadius: '5px', fontWeight: 'bold', fontSize: esMovil ? '0.8rem' : '0.85rem', display: 'flex', alignItems: 'center' }}
                >
                  <i className="fa-solid fa-user-lock" style={{ marginRight: esMovil ? '3px' : '5px', fontSize: esMovil ? '0.8rem' : '1rem' }}></i> Entrar
                </Link>
              )}
            </div>
        </nav>
    </header>
  );
}