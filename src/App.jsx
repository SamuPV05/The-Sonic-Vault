import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SpotifyPlayerProvider } from './context/SpotifyPlayerContext';
import Login from './pages/Login';
import Perfil from './pages/Perfil';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Inicio from './pages/Inicio';
import Artistas from './pages/Artistas';
import ArtistaDetalle from './pages/ArtistaDetalle';
import EchoSafe from './pages/EchoSafe';
import BeatIt from './pages/BeatIt';
import SpotifyCallback from './pages/SpotifyCallback';
import NotFound from './pages/NotFound';

// Componente guardián para proteger la bóveda
// Si alguien intenta entrar a /perfil sin llave, lo patea al /login
const RutaProtegida = ({ children }) => {
  const { user, loading, is2FAPassed } = useAuth();
  
  if (loading) return <div style={{ color: 'white', textAlign: 'center', marginTop: '50px' }}>Cargando sistema...</div>;
  if (!user || !is2FAPassed) return <Navigate to="/login" />;
  
  return children;
};

export default function App() {
  return (
    <AuthProvider>
      <SpotifyPlayerProvider>
        <BrowserRouter>
          <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Navbar />

            <div style={{ flex: 1 }}>
              <Routes>
                {/* == RUTA PRIVADA == */}
                <Route 
                  path="/perfil" 
                  element={
                    <RutaProtegida>
                      <Perfil />
                    </RutaProtegida>
                  } 
                />
                
                {/* == RUTAS PÚBLICAS == */}
                <Route path="/login" element={<Login />} />
                <Route path="/callback" element={<SpotifyCallback />} />
                <Route path="/" element={<Inicio />} />
                <Route path="/artistas" element={<Artistas />} />
                
                {/* RUTA DINÁMICA: El :id puede ser cualquier nombre */}
                <Route path="/artistas/:id" element={<ArtistaDetalle />} />
                
                <Route path="/echo-safe" element={<EchoSafe />} />
                <Route path="/beat-it" element={<BeatIt />} />

                {/* == RUTA 404 (FRECUENCIA FUERA DE RANGO) == */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>

            <Footer />
          </div>
        </BrowserRouter>
      </SpotifyPlayerProvider>
    </AuthProvider>
  );
}
