import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SpotifyPlayerProvider } from './context/SpotifyPlayerContext';
import Login from './pages/Login';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Inicio from './pages/Inicio';
import SpotifyCallback from './pages/SpotifyCallback';
import NotFound from './pages/NotFound';

const Perfil = lazy(() => import('./pages/Perfil'));
const Artistas = lazy(() => import('./pages/Artistas'));
const ArtistaDetalle = lazy(() => import('./pages/ArtistaDetalle'));
const EchoSafe = lazy(() => import('./pages/EchoSafe'));
const BeatIt = lazy(() => import('./pages/BeatIt'));

// Componente guardián para proteger la bóveda privada
const RutaProtegida = ({ children }) => {
  const { user, loading, is2FAPassed } = useAuth();
  
  if (loading) return <div style={{ color: 'white', textAlign: 'center', marginTop: '50px' }}>Cargando sistema...</div>;
  if (!user || !is2FAPassed) return <Navigate to="/login" replace />;
  
  return children;
};

// Guardián de Cuarentena 2FA:
// Si el usuario tiene una sesión pendiente de segundo factor, no puede salir de /login
// hasta que apruebe el código de verificación o cancele la sesión.
const Cuarentena2FA = ({ children }) => {
  const { is2FAPending, loading } = useAuth();
  const location = useLocation();

  if (loading) return null;
  if (is2FAPending && location.pathname !== '/login') {
    return <Navigate to="/login" replace />;
  }

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
              <Suspense fallback={<div style={{ color: 'white', textAlign: 'center', marginTop: '50px' }}>Cargando módulo...</div>}>
                <Cuarentena2FA>
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
                    
                    {/* == RUTAS DE ACCESO == */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/callback" element={<SpotifyCallback />} />
                    <Route path="/" element={<Inicio />} />
                    <Route path="/artistas" element={<Artistas />} />
                    
                    {/* RUTA DINÁMICA: Expediente de artista */}
                    <Route path="/artistas/:id" element={<ArtistaDetalle />} />
                    
                    <Route path="/echo-safe" element={<EchoSafe />} />
                    <Route path="/beat-it" element={<BeatIt />} />

                    {/* == RUTA 404 == */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Cuarentena2FA>
              </Suspense>
            </div>

            <Footer />
          </div>
        </BrowserRouter>
      </SpotifyPlayerProvider>
    </AuthProvider>
  );
}
