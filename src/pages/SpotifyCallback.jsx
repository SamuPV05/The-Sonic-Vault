import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { handleSpotifyCallback } from '../services/spotifyService';

export default function SpotifyCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const err = params.get('error');

    if (err) {
      console.error('Spotify Auth error:', err);
      setError('Acceso denegado o cancelado en Spotify.');
      setTimeout(() => navigate('/perfil'), 3000);
      return;
    }

    if (code) {
      handleSpotifyCallback(code)
        .then(() => {
          navigate('/perfil?spotify=connected');
        })
        .catch((e) => {
          console.error('Error al procesar callback de Spotify:', e);
          setError('Error sincronizando con la API de Spotify.');
          setTimeout(() => navigate('/perfil'), 3500);
        });
    } else {
      navigate('/perfil');
    }
  }, [navigate]);

  return (
    <div style={{
      minHeight: '80vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      padding: '2rem'
    }}>
      <div style={{
        width: '60px',
        height: '60px',
        borderRadius: '50%',
        border: '3px solid rgba(29, 185, 84, 0.2)',
        borderTop: '3px solid #1DB954',
        animation: 'spin 1s linear infinite',
        marginBottom: '1.5rem'
      }}></div>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      <h2 style={{ color: '#fff', fontSize: '1.4rem', letterSpacing: '2px', textTransform: 'uppercase' }}>
        {error ? 'Fallo en la Sincronización' : 'Estableciendo Enlace Neural con Spotify...'}
      </h2>
      <p style={{ color: error ? '#ff5555' : '#888', marginTop: '10px' }}>
        {error || 'Desencriptando credenciales e indexando tu ADN sonoro...'}
      </p>
    </div>
  );
}
