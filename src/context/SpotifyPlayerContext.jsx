import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  isSpotifyConnected,
  getCurrentlyPlaying,
  controlPlayback as apiControlPlayback,
  loginWithSpotify,
  logoutSpotify
} from '../services/spotifyService';

const SpotifyPlayerContext = createContext(null);

export function SpotifyPlayerProvider({ children }) {
  const [connected, setConnected] = useState(() => isSpotifyConnected());
  const [nowPlaying, setNowPlaying] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progressMs, setProgressMs] = useState(0);
  const [durationMs, setDurationMs] = useState(0);

  // Escuchar cambios de almacenamiento (login/logout en otra pestaña o en Perfil)
  useEffect(() => {
    const checkConnection = () => {
      setConnected(isSpotifyConnected());
    };
    window.addEventListener('storage', checkConnection);
    const interval = setInterval(checkConnection, 2500);
    return () => {
      window.removeEventListener('storage', checkConnection);
      clearInterval(interval);
    };
  }, []);

  const fetchCurrentPlayback = useCallback(async () => {
    if (!isSpotifyConnected()) {
      setNowPlaying(null);
      setIsPlaying(false);
      return;
    }

    try {
      const data = await getCurrentlyPlaying();
      if (data && data.item) {
        setNowPlaying(data.item);
        setIsPlaying(!!data.is_playing);
        setProgressMs(data.progress_ms || 0);
        setDurationMs(data.item.duration_ms || 0);
      } else {
        setNowPlaying(null);
        setIsPlaying(false);
      }
    } catch (err) {
      console.warn('Error consultando reproducción en vivo de Spotify:', err);
    }
  }, []);

  // Polling suave cada 5 segundos si el documento está visible y hay conexión
  useEffect(() => {
    if (!connected) return;

    fetchCurrentPlayback();

    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchCurrentPlayback();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [connected, fetchCurrentPlayback]);

  // Avance suave del progreso segundo a segundo
  useEffect(() => {
    let tick = null;
    if (isPlaying && durationMs > 0) {
      tick = setInterval(() => {
        setProgressMs(prev => {
          const next = prev + 1000;
          return next <= durationMs ? next : durationMs;
        });
      }, 1000);
    }
    return () => {
      if (tick) clearInterval(tick);
    };
  }, [isPlaying, durationMs]);

  const controlPlayback = async (action) => {
    // Actualización optimista de UI
    if (action === 'play') setIsPlaying(true);
    if (action === 'pause') setIsPlaying(false);

    const success = await apiControlPlayback(action);
    if (success) {
      setTimeout(fetchCurrentPlayback, 600);
    } else {
      fetchCurrentPlayback();
    }
    return success;
  };

  const handleLogout = () => {
    logoutSpotify();
    setConnected(false);
    setNowPlaying(null);
    setIsPlaying(false);
  };

  const handleLogin = () => {
    loginWithSpotify();
  };

  const value = {
    connected,
    nowPlaying,
    isPlaying,
    progressMs,
    durationMs,
    controlPlayback,
    refreshPlayback: fetchCurrentPlayback,
    login: handleLogin,
    logout: handleLogout
  };

  return (
    <SpotifyPlayerContext.Provider value={value}>
      {children}
    </SpotifyPlayerContext.Provider>
  );
}

export function useSpotifyPlayer() {
  const context = useContext(SpotifyPlayerContext);
  if (!context) {
    throw new Error('useSpotifyPlayer debe utilizarse dentro de un SpotifyPlayerProvider');
  }
  return context;
}
