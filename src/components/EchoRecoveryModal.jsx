import { useState, useEffect, useRef } from 'react';
import { soundHealingSynth, SOUND_HEALING_MODES } from '../services/soundHealingAudio';

// Canales oficiales de Spotify científicamente seleccionados para regeneración auditiva y reducción de fatiga acústica
const RECOVERY_CHANNELS = [
  {
    id: 'brown-noise',
    name: 'Ruido Marrón Profundo',
    tag: 'TINNITUS & DESCANSO',
    icon: 'fa-water',
    color: '#00F0FF',
    synthMode: 'brown-noise',
    frequency: 'Pendiente 1/f² (Filtro LPF 400 Hz)',
    description:
      'Enmascara acúfenos y zumbidos, relaja la tensión del tímpano y reduce la hiperreactividad coclear tras ruidos intensos.',
    spotifyEmbedUrl: 'https://open.spotify.com/embed/playlist/37i9dQZF1DX4PP3DA4J0N8?utm_source=generator&theme=0',
    spotifyOpenUrl: 'https://open.spotify.com/playlist/37i9dQZF1DX4PP3DA4J0N8'
  },
  {
    id: 'binaural-432',
    name: 'Frecuencias Curativas (432 Hz)',
    tag: 'REPARACIÓN CELULAR',
    icon: 'fa-wave-square',
    color: '#10B981',
    synthMode: 'healing-432',
    frequency: 'Armónicos 432 Hz + Paneo LFO Estéreo',
    description:
      'Estimula la relajación neurosensorial mediante ondas senoidales puras en 432 Hz con paneo espacial suave.',
    spotifyEmbedUrl: 'https://open.spotify.com/embed/playlist/37i9dQZF1DWZqd5JICZI0u?utm_source=generator&theme=0',
    spotifyOpenUrl: 'https://open.spotify.com/playlist/37i9dQZF1DWZqd5JICZI0u'
  },
  {
    id: 'binaural-theta',
    name: 'Ondas Delta/Theta Binaurales',
    tag: 'SINCRONIZACIÓN 4 HZ',
    icon: 'fa-brain',
    color: '#A855F7',
    synthMode: 'binaural-theta',
    frequency: 'Portadora 216 Hz (L) / 220 Hz (R) • Δ 4 Hz',
    description:
      'Pulso binaural dicótico de 4 Hz que induce ondas Theta/Delta profundas y reduce el cortisol tras sobreexposición sonora.',
    spotifyEmbedUrl: 'https://open.spotify.com/embed/playlist/37i9dQZF1DX3Ogo9pFvBkY?utm_source=generator&theme=0',
    spotifyOpenUrl: 'https://open.spotify.com/playlist/37i9dQZF1DX3Ogo9pFvBkY'
  },
  {
    id: 'organic-rain',
    name: 'Lluvia y Naturaleza Orgánica',
    tag: 'RUIDO ROSA NATURAL',
    icon: 'fa-cloud-rain',
    color: '#38BDF8',
    synthMode: 'brown-noise',
    frequency: 'Densidad Espectral Suave (<45 dB)',
    description:
      'Sonido aleatorio natural que permite a las células ciliadas del oído interno reposar sin privación sensorial abrupta.',
    spotifyEmbedUrl: 'https://open.spotify.com/embed/playlist/37i9dQZF1DX8Uebhn9wzrS?utm_source=generator&theme=0',
    spotifyOpenUrl: 'https://open.spotify.com/playlist/37i9dQZF1DX8Uebhn9wzrS'
  }
];

export default function EchoRecoveryModal({ onClose, initialDb = null }) {
  const [activeChannel, setActiveChannel] = useState(RECOVERY_CHANNELS[0]);

  // Estado del Sintetizador Nativo Web Audio API (Independiente de Spotify)
  const [activeSynthMode, setActiveSynthMode] = useState(SOUND_HEALING_MODES[0].id);
  const [isSynthPlaying, setIsSynthPlaying] = useState(false);
  const [synthVolume, setSynthVolume] = useState(0.45);
  const [bellRinging, setBellRinging] = useState(false);
  const synthVolumeRef = useRef(0.45);

  // Temporizador de reposo acústico
  const [selectedMinutes, setSelectedMinutes] = useState(5);
  const [timeLeft, setTimeLeft] = useState(5 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerFinished, setTimerFinished] = useState(false);

  // Limpieza estricta de Web Audio API al cerrar el modal
  useEffect(() => {
    return () => {
      soundHealingSynth.stop(0.25);
    };
  }, []);

  // Controlar el sintetizador nativo
  const handleToggleSynth = () => {
    if (isSynthPlaying) {
      soundHealingSynth.stop(0.45);
      setIsSynthPlaying(false);
    } else {
      soundHealingSynth.start(activeSynthMode, synthVolume);
      setIsSynthPlaying(true);
    }
  };

  const handleSelectSynthMode = (modeId) => {
    setActiveSynthMode(modeId);
    if (isSynthPlaying) {
      soundHealingSynth.start(modeId, synthVolume);
    }
  };

  const handleSynthVolumeChange = (e) => {
    const val = parseFloat(e.target.value);
    setSynthVolume(val);
    synthVolumeRef.current = val;
    soundHealingSynth.setVolume(val);
  };

  const handleTriggerBell = () => {
    soundHealingSynth.playTibetanBellChime(Math.max(0.35, synthVolumeRef.current));
    setBellRinging(true);
    setTimeout(() => setBellRinging(false), 2400);
  };

  // Sincronizar duración si el usuario cambia el botón de minutos (o modo demo 15s)
  const handleSelectDuration = (mins, customSeconds = null) => {
    setSelectedMinutes(mins);
    setTimeLeft(customSeconds !== null ? customSeconds : mins * 60);
    setIsTimerRunning(false);
    setTimerFinished(false);
  };

  // Cuenta regresiva y disparo automático de la Campana Tibetana ADSR en 00:00
  useEffect(() => {
    if (!isTimerRunning) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsTimerRunning(false);
          setTimerFinished(true);
          // Detener suavemente el generador continuo y hacer sonar la campana tibetana sintética
          soundHealingSynth.stop(1.2);
          setIsSynthPlaying(false);
          soundHealingSynth.playTibetanBellChime(Math.max(0.45, synthVolumeRef.current));
          setBellRinging(true);
          setTimeout(() => setBellRinging(false), 3000);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const toggleTimer = () => {
    if (timerFinished) {
      setTimeLeft(selectedMinutes === 0 ? 15 : selectedMinutes * 60);
      setTimerFinished(false);
      setIsTimerRunning(true);
    } else {
      setIsTimerRunning((prev) => !prev);
    }
  };

  const resetTimer = () => {
    setIsTimerRunning(false);
    setTimeLeft(selectedMinutes === 0 ? 15 : selectedMinutes * 60);
    setTimerFinished(false);
  };

  // Formato MM:SS
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const currentSynthObj =
    SOUND_HEALING_MODES.find((m) => m.id === activeSynthMode) || SOUND_HEALING_MODES[0];

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(5, 7, 12, 0.88)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        padding: '1rem',
        boxSizing: 'border-box'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          soundHealingSynth.stop(0.25);
          onClose();
        }
      }}
    >
      <div
        style={{
          background: 'linear-gradient(180deg, #0e1322 0%, #080b14 100%)',
          border: '1px solid rgba(16, 185, 129, 0.4)',
          borderRadius: '18px',
          width: '100%',
          maxWidth: '880px',
          maxHeight: '92vh',
          overflowY: 'auto',
          boxShadow: '0 0 40px rgba(16, 185, 129, 0.25), 0 20px 50px rgba(0,0,0,0.8)',
          position: 'relative',
          padding: '24px',
          color: '#ffffff'
        }}
      >
        {/* Botón Cerrar */}
        <button
          type="button"
          onClick={() => {
            soundHealingSynth.stop(0.25);
            onClose();
          }}
          style={{
            position: 'absolute',
            top: '18px',
            right: '18px',
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            color: '#aaa',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1rem',
            transition: '0.2s'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.color = '#fff';
            e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.color = '#aaa';
            e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
          }}
        >
          ✕
        </button>

        {/* Encabezado del Protocolo */}
        <div style={{ marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#10B981',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                padding: '4px 10px',
                borderRadius: '20px',
                fontSize: '0.7rem',
                fontWeight: 'bold',
                letterSpacing: '1px'
              }}
            >
              <i className="fa-solid fa-heart-pulse"></i> PROTOCOLO DE DESCOMPRESIÓN ACÚSTICA
            </span>

            {initialDb !== null && (
              <span
                style={{
                  background: initialDb >= 76 ? 'rgba(255, 0, 122, 0.15)' : 'rgba(0, 240, 255, 0.15)',
                  color: initialDb >= 76 ? '#FF007A' : '#00F0FF',
                  border: `1px solid ${initialDb >= 76 ? '#FF007A55' : '#00F0FF55'}`,
                  padding: '4px 10px',
                  borderRadius: '20px',
                  fontSize: '0.7rem',
                  fontWeight: 'bold'
                }}
              >
                <i className="fa-solid fa-triangle-exclamation"></i> Exposición: {initialDb} dB
              </span>
            )}
          </div>

          <h2 style={{ fontSize: '1.7rem', margin: '0 0 6px 0', letterSpacing: '0.5px' }}>
            Estación de <span style={{ color: '#10B981' }}>Sound Healing</span> & Reposo
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.86rem', margin: 0, lineHeight: '1.5' }}>
            Terapia sónica calibrada mediante síntesis DSP en tiempo real para mitigar la fatiga sensorial, calmar el nervio auditivo y prevenir el daño celular.
          </p>
        </div>

        {/* SINTETIZADOR ACÚSTICO AUTÓNOMO (WEB AUDIO API NATIVO - INDEPENDIENTE DE SPOTIFY) */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(0, 240, 255, 0.06) 100%)',
            border: `1px solid ${isSynthPlaying ? currentSynthObj.color : 'rgba(16, 185, 129, 0.35)'}`,
            borderRadius: '14px',
            padding: '16px 18px',
            marginBottom: '20px',
            boxShadow: isSynthPlaying ? `0 0 25px ${currentSynthObj.color}25` : 'none',
            transition: '0.3s'
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '10px',
              marginBottom: '12px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span
                style={{
                  background: isSynthPlaying ? currentSynthObj.color : 'rgba(255,255,255,0.1)',
                  color: isSynthPlaying ? '#000' : '#00F0FF',
                  fontSize: '0.65rem',
                  fontWeight: 'bold',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  letterSpacing: '0.8px'
                }}
              >
                {isSynthPlaying ? '● DSP EN VIVO' : 'WEB AUDIO SYNTH // OFFLINE'}
              </span>
              <span style={{ fontWeight: 'bold', fontSize: '0.92rem', color: '#fff' }}>
                Generador Acústico Autónomo (Sin dependencias externas)
              </span>
            </div>

            {/* Controles Maestros del Sintetizador: Volumen, Campana Tibetana y Play/Stop */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'rgba(0,0,0,0.45)',
                  padding: '5px 10px',
                  borderRadius: '6px',
                  border: '1px solid rgba(255,255,255,0.08)'
                }}
                title="Volumen del Sintetizador Terapéutico"
              >
                <i className="fa-solid fa-volume-low" style={{ color: currentSynthObj.color, fontSize: '0.8rem' }} />
                <input
                  type="range"
                  min="0.05"
                  max="0.85"
                  step="0.01"
                  value={synthVolume}
                  onChange={handleSynthVolumeChange}
                  style={{ width: '65px', accentColor: currentSynthObj.color, cursor: 'pointer' }}
                />
                <span style={{ fontSize: '0.7rem', color: '#cbd5e1', fontWeight: 'bold', minWidth: '30px' }}>
                  {Math.round(synthVolume * 100)}%
                </span>
              </div>

              <button
                type="button"
                onClick={handleTriggerBell}
                title="Hacer sonar el Cuenco / Campana Tibetana sintética (Síntesis Aditiva ADSR)"
                style={{
                  background: bellRinging ? 'rgba(255, 170, 0, 0.25)' : 'rgba(255,255,255,0.06)',
                  color: bellRinging ? '#ffaa00' : '#e2e8f0',
                  border: `1px solid ${bellRinging ? '#ffaa00' : 'rgba(255,255,255,0.15)'}`,
                  padding: '7px 11px',
                  borderRadius: '6px',
                  fontSize: '0.74rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: bellRinging ? '0 0 15px rgba(255, 170, 0, 0.4)' : 'none',
                  transition: '0.2s'
                }}
              >
                <i className="fa-solid fa-bell" style={{ color: '#ffaa00' }} />
                <span>CUENCO TIBETANO</span>
              </button>

              <button
                type="button"
                onClick={handleToggleSynth}
                style={{
                  background: isSynthPlaying
                    ? 'rgba(239, 68, 68, 0.22)'
                    : `linear-gradient(135deg, ${currentSynthObj.color} 0%, #10B981 100%)`,
                  color: isSynthPlaying ? '#ff6b6b' : '#000',
                  border: isSynthPlaying ? '1px solid #ef4444' : 'none',
                  padding: '7px 14px',
                  borderRadius: '6px',
                  fontSize: '0.78rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: isSynthPlaying ? 'none' : `0 0 14px ${currentSynthObj.color}55`
                }}
              >
                <i className={`fa-solid ${isSynthPlaying ? 'fa-stop' : 'fa-play'}`} />
                <span>{isSynthPlaying ? 'DETENER SINTETIZADOR' : 'ACTIVAR FRECUENCIA'}</span>
              </button>
            </div>
          </div>

          {/* Selector de los 3 Modos Acústicos DSP */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '10px' }}>
            {SOUND_HEALING_MODES.map((mode) => {
              const isSelected = activeSynthMode === mode.id;
              return (
                <div
                  key={mode.id}
                  onClick={() => handleSelectSynthMode(mode.id)}
                  style={{
                    background: isSelected ? 'rgba(0, 0, 0, 0.55)' : 'rgba(0, 0, 0, 0.3)',
                    border: isSelected ? `1px solid ${mode.color}` : '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '10px',
                    padding: '10px 12px',
                    cursor: 'pointer',
                    transition: '0.2s',
                    boxShadow: isSelected ? `0 0 12px ${mode.color}22` : 'none'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                      <i className={`fa-solid ${mode.icon}`} style={{ color: mode.color, fontSize: '0.9rem' }} />
                      <span style={{ fontWeight: 'bold', fontSize: '0.82rem', color: isSelected ? '#fff' : '#cbd5e1' }}>
                        {mode.name}
                      </span>
                    </div>
                    {isSelected && isSynthPlaying && (
                      <span style={{ fontSize: '0.62rem', color: mode.color, fontWeight: 'bold' }}>ACTIVO</span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: mode.color, fontFamily: 'monospace', marginBottom: '4px' }}>
                    {mode.subtitle}
                  </div>
                  <p style={{ fontSize: '0.7rem', color: '#94a3b8', margin: 0, lineHeight: '1.35' }}>
                    {mode.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Distribución Principal: Temporizador y Selector de Canales */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '20px',
            marginBottom: '20px'
          }}
        >
          {/* Columna 1: Temporizador de Reposo Guiado */}
          <div
            style={{
              background: 'rgba(0,0,0,0.4)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '14px',
              padding: '18px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <span
              style={{
                fontSize: '0.72rem',
                color: '#64748b',
                fontWeight: 'bold',
                letterSpacing: '1px',
                textTransform: 'uppercase',
                marginBottom: '12px'
              }}
            >
              TEMPORIZADOR DE REPOSO (CON CAMPANA 00:00)
            </span>

            {/* Selector de Minutos + Demo 15s */}
            <div style={{ display: 'flex', gap: '6px', marginBottom: '18px', flexWrap: 'wrap', justifyContent: 'center' }}>
              {[5, 10, 15].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => handleSelectDuration(mins)}
                  style={{
                    background: selectedMinutes === mins ? '#10B981' : 'rgba(255,255,255,0.06)',
                    color: selectedMinutes === mins ? '#000' : '#aaa',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontWeight: 'bold',
                    fontSize: '0.76rem',
                    cursor: 'pointer',
                    transition: '0.15s'
                  }}
                >
                  {mins} MIN
                </button>
              ))}
              <button
                type="button"
                onClick={() => handleSelectDuration(0, 15)}
                title="Prueba rápida de 15 segundos para escuchar la campana tibetana al llegar a 00:00"
                style={{
                  background: selectedMinutes === 0 ? '#ffaa00' : 'rgba(255, 170, 0, 0.1)',
                  color: selectedMinutes === 0 ? '#000' : '#ffaa00',
                  border: '1px solid rgba(255, 170, 0, 0.35)',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  fontWeight: 'bold',
                  fontSize: '0.72rem',
                  cursor: 'pointer',
                  transition: '0.15s'
                }}
              >
                15s DEMO
              </button>
            </div>

            {/* Reloj Digital con Aro de Neón */}
            <div
              style={{
                width: '140px',
                height: '140px',
                borderRadius: '50%',
                border: `3px solid ${
                  timerFinished ? '#10B981' : isTimerRunning ? '#00F0FF' : '#334155'
                }`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: isTimerRunning
                  ? '0 0 25px rgba(0,240,255,0.3), inset 0 0 15px rgba(0,240,255,0.1)'
                  : timerFinished
                  ? '0 0 25px rgba(16,185,129,0.4)'
                  : 'none',
                marginBottom: '18px',
                transition: '0.3s'
              }}
            >
              <span
                style={{
                  fontSize: '2rem',
                  fontWeight: 'bold',
                  fontFamily: 'monospace',
                  letterSpacing: '1px',
                  color: timerFinished ? '#10B981' : '#fff'
                }}
              >
                {formatTime(timeLeft)}
              </span>
              <span
                style={{
                  fontSize: '0.62rem',
                  color: isTimerRunning ? '#00F0FF' : '#64748b',
                  textTransform: 'uppercase',
                  fontWeight: 'bold',
                  marginTop: '4px'
                }}
              >
                {timerFinished ? '🔔 Cuenco Activado' : isTimerRunning ? 'En Curso' : 'En Pausa'}
              </span>
            </div>

            {/* Botones del Temporizador */}
            <div style={{ display: 'flex', gap: '8px', width: '100%', maxWidth: '220px' }}>
              <button
                type="button"
                onClick={toggleTimer}
                style={{
                  flex: 1,
                  background: isTimerRunning
                    ? 'rgba(239, 68, 68, 0.2)'
                    : 'linear-gradient(135deg, #10B981 0%, #00F0FF 100%)',
                  color: isTimerRunning ? '#ef4444' : '#000',
                  border: isTimerRunning ? '1px solid #ef4444' : 'none',
                  padding: '9px 0',
                  borderRadius: '6px',
                  fontWeight: 'bold',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: '0.2s'
                }}
              >
                <i className={`fa-solid ${isTimerRunning ? 'fa-pause' : 'fa-play'}`}></i>
                <span>{timerFinished ? 'REPETIR' : isTimerRunning ? 'PAUSAR' : 'INICIAR'}</span>
              </button>

              <button
                type="button"
                onClick={resetTimer}
                title="Reiniciar temporizador"
                style={{
                  width: '38px',
                  background: 'rgba(255,255,255,0.06)',
                  color: '#aaa',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <i className="fa-solid fa-rotate-left"></i>
              </button>
            </div>

            {timerFinished && (
              <p
                style={{
                  color: '#10B981',
                  fontSize: '0.75rem',
                  fontWeight: 'bold',
                  margin: '10px 0 0 0',
                  textAlign: 'center'
                }}
              >
                🔔 ¡Sesión completada! La campana tibetana ha anunciado el fin de tu descompresión acústica.
              </p>
            )}
          </div>

          {/* Columna 2: Selector de Canales de Terapia */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <span
              style={{
                fontSize: '0.72rem',
                color: '#64748b',
                fontWeight: 'bold',
                letterSpacing: '1px',
                textTransform: 'uppercase'
              }}
            >
              CANALES Y PLAYLISTS COMPLEMENTARIAS:
            </span>

            {RECOVERY_CHANNELS.map((ch) => {
              const isSelected = activeChannel.id === ch.id;
              return (
                <div
                  key={ch.id}
                  onClick={() => {
                    setActiveChannel(ch);
                    if (ch.synthMode) {
                      handleSelectSynthMode(ch.synthMode);
                    }
                  }}
                  style={{
                    background: isSelected ? 'rgba(16, 185, 129, 0.12)' : 'rgba(0,0,0,0.3)',
                    border: isSelected ? `1px solid ${ch.color}` : '1px solid rgba(255,255,255,0.06)',
                    borderRadius: '10px',
                    padding: '11px 14px',
                    cursor: 'pointer',
                    transition: '0.2s',
                    boxShadow: isSelected ? `0 0 14px ${ch.color}25` : 'none'
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '4px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <i className={`fa-solid ${ch.icon}`} style={{ color: ch.color, fontSize: '1rem' }}></i>
                      <span
                        style={{
                          fontWeight: 'bold',
                          fontSize: '0.86rem',
                          color: isSelected ? '#fff' : '#cbd5e1'
                        }}
                      >
                        {ch.name}
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: '0.62rem',
                        background: 'rgba(255,255,255,0.06)',
                        color: ch.color,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontWeight: 'bold'
                      }}
                    >
                      {ch.tag}
                    </span>
                  </div>
                  <p style={{ color: '#94a3b8', fontSize: '0.73rem', margin: 0, lineHeight: '1.4' }}>
                    {ch.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Reproductor Spotify Interactivo Incrustado */}
        <div
          style={{
            background: 'rgba(0,0,0,0.5)',
            border: `1px solid ${activeChannel.color}55`,
            borderRadius: '12px',
            padding: '14px',
            marginBottom: '18px'
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '10px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="fa-brands fa-spotify" style={{ color: '#1db954', fontSize: '1.2rem' }}></i>
              <span style={{ fontSize: '0.82rem', fontWeight: 'bold', color: '#fff' }}>
                PLAYLIST SPOTIFY: <span style={{ color: activeChannel.color }}>{activeChannel.name}</span>
              </span>
            </div>
            <a
              href={activeChannel.spotifyOpenUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: '#1db954',
                fontSize: '0.72rem',
                textDecoration: 'none',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <span>Abrir en Spotify</span>
              <i className="fa-solid fa-arrow-up-right-from-square"></i>
            </a>
          </div>

          <iframe
            src={activeChannel.spotifyEmbedUrl}
            width="100%"
            height="152"
            frameBorder="0"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            style={{ borderRadius: '8px', border: 'none' }}
            title={`Spotify Recovery ${activeChannel.name}`}
          />
        </div>

        {/* Pautas Clínicas de la Organización Mundial de la Salud (OMS) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '12px',
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '10px',
            padding: '12px 16px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
            <i className="fa-solid fa-volume-low" style={{ color: '#10B981', marginTop: '3px' }}></i>
            <div>
              <span style={{ fontSize: '0.72rem', fontWeight: 'bold', color: '#fff', display: 'block' }}>
                Regla 60/60 (OMS)
              </span>
              <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
                No escuchar a más del 60% del volumen por más de 60 minutos continuos.
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
            <i className="fa-solid fa-ear-listen" style={{ color: '#00F0FF', marginTop: '3px' }}></i>
            <div>
              <span style={{ fontSize: '0.72rem', fontWeight: 'bold', color: '#fff', display: 'block' }}>
                Ventilación Auditiva
              </span>
              <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
                Retira auriculares in-ear durante esta terapia para aliviar la presión de aire.
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
            <i className="fa-solid fa-lungs" style={{ color: '#A855F7', marginTop: '3px' }}></i>
            <div>
              <span style={{ fontSize: '0.72rem', fontWeight: 'bold', color: '#fff', display: 'block' }}>
                Respiración Táctica
              </span>
              <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
                Inhala 4s, sostén 4s y exhala 6s mientras suena la frecuencia.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
