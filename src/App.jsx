import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext'; // <-- Añadido useAuth
import Login from './pages/Login';
import Perfil from './pages/Perfil';
import Navbar from './components/Navbar';
import Inicio from './pages/Inicio';
import Artistas from './pages/Artistas';
import ArtistaDetalle from './pages/ArtistaDetalle';
import EchoSafe from './pages/EchoSafe';
import BeatIt from './pages/BeatIt';

// Componente guardián para proteger la bóveda
// Si alguien intenta entrar a /perfil sin llave, lo patea al /login
const RutaProtegida = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <div style={{ color: 'white', textAlign: 'center', marginTop: '50px' }}>Cargando sistema...</div>;
  if (!user) return <Navigate to="/login" />;
  
  return children;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
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
          <Route path="/" element={<Inicio />} />
          <Route path="/artistas" element={<Artistas />} />
          
          {/* RUTA DINÁMICA: El :id puede ser cualquier nombre */}
          <Route path="/artistas/:id" element={<ArtistaDetalle />} />
          
          <Route path="/echo-safe" element={<EchoSafe />} />
          <Route path="/beat-it" element={<BeatIt />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}