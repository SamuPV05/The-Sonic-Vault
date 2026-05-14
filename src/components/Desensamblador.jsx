import { useState, useRef, useEffect } from 'react';

export default function Desensamblador({ rutaStems, titulo }) {
  const audioVoz = useRef(null);
  const audioBateria = useRef(null);
  const audioBajo = useRef(null);
  const audioOtros = useRef(null);

  const audioCtxRef = useRef(null);
  const gainNodesRef = useRef({});
  const inicializado = useRef(false);

  const [isPlaying, setIsPlaying] = useState(false);
  const [volumes, setVolumes] = useState({ voz: 1, bateria: 1, bajo: 1, otros: 1 });

  // Detectamos si es móvil para ajustar el tamaño
  const esMovil = window.innerWidth < 768;

  const inicializarAudioAPI = () => {
    if (inicializado.current) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    audioCtxRef.current = new AudioContext();

    const configuraciones = [
      { id: 'voz', ref: audioVoz },
      { id: 'bateria', ref: audioBateria },
      { id: 'bajo', ref: audioBajo },
      { id: 'otros', ref: audioOtros }
    ];

    configuraciones.forEach(({ id, ref }) => {
      const track = audioCtxRef.current.createMediaElementSource(ref.current);
      const gainNode = audioCtxRef.current.createGain();
      gainNode.gain.value = volumes[id]; 
      track.connect(gainNode);
      gainNode.connect(audioCtxRef.current.destination);
      gainNodesRef.current[id] = gainNode;
    });

    inicializado.current = true;
  };

  const togglePlay = () => {
    if (!inicializado.current) inicializarAudioAPI();
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }

    if (isPlaying) {
      audioVoz.current.pause();
      audioBateria.current.pause();
      audioBajo.current.pause();
      audioOtros.current.pause();
    } else {
      const tiempoMaestro = audioBateria.current.currentTime || 0;
      audioVoz.current.currentTime = tiempoMaestro;
      audioBajo.current.currentTime = tiempoMaestro;
      audioOtros.current.currentTime = tiempoMaestro;

      audioVoz.current.play().catch(e => console.error(e));
      audioBateria.current.play().catch(e => console.error(e));
      audioBajo.current.play().catch(e => console.error(e));
      audioOtros.current.play().catch(e => console.error(e));
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (!isPlaying) return;
    const tiempoMaestro = audioBateria.current.currentTime;
    const tolerancia = 0.2;

    const audios = [audioVoz.current, audioBajo.current, audioOtros.current];
    audios.forEach(audio => {
      if (Math.abs(audio.currentTime - tiempoMaestro) > tolerancia) {
        audio.currentTime = tiempoMaestro;
      }
    });
  };

  const handleVolume = (track, value) => {
    const newVol = parseFloat(value);
    setVolumes({ ...volumes, [track]: newVol });
    if (gainNodesRef.current[track]) {
      gainNodesRef.current[track].gain.setTargetAtTime(newVol, audioCtxRef.current.currentTime, 0.05);
    }
  };

  useEffect(() => {
    return () => {
      if (audioCtxRef.current) audioCtxRef.current.close();
    };
  }, []);

  return (
    // CORRECCIÓN: Padding dinámico (menos padding en móvil para que respire)
    <div style={{ background: '#111', padding: esMovil ? '1.5rem 1rem' : '2rem', borderRadius: '16px', border: '1px solid #333', marginTop: '1rem', width: '100%', boxSizing: 'border-box' }}>
      
      <audio ref={audioBateria} src={`${rutaStems}/drums.mp3`} onTimeUpdate={handleTimeUpdate} crossOrigin="anonymous" preload="auto" />
      <audio ref={audioVoz} src={`${rutaStems}/vocals.mp3`} crossOrigin="anonymous" preload="auto" />
      <audio ref={audioBajo} src={`${rutaStems}/bass.mp3`} crossOrigin="anonymous" preload="auto" />
      <audio ref={audioOtros} src={`${rutaStems}/other.mp3`} crossOrigin="anonymous" preload="auto" />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: esMovil ? '1.5rem' : '2rem' }}>
        <div>
          <h3 style={{ color: '#fff', margin: 0, letterSpacing: '1px', fontSize: esMovil ? '1.1rem' : '1.3rem' }}>CONSOLA DE MEZCLA</h3>
          <p style={{ color: 'var(--accent-color, #00ffcc)', margin: '5px 0 0 0', fontSize: '0.8rem' }}>{titulo}</p>
        </div>
        <button 
          onClick={togglePlay}
          style={{ background: isPlaying ? '#ff4444' : 'var(--accent-color, #00ffcc)', color: '#000', border: 'none', borderRadius: '50%', cursor: 'pointer', width: esMovil ? '45px' : '50px', height: esMovil ? '45px' : '50px', fontSize: '1.1rem', transition: '0.2s', flexShrink: 0 }}
        >
          <i className={`fa-solid ${isPlaying ? 'fa-pause' : 'fa-play'}`}></i>
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: esMovil ? '1rem' : '1.5rem' }}>
        <MixerTrack name="VOZ" track="voz" value={volumes.voz} onChange={handleVolume} color="#ff00ff" icon="fa-microphone" esMovil={esMovil} />
        <MixerTrack name="BATERÍA" track="bateria" value={volumes.bateria} onChange={handleVolume} color="#00ffcc" icon="fa-drum" esMovil={esMovil} />
        <MixerTrack name="BAJO" track="bajo" value={volumes.bajo} onChange={handleVolume} color="#ffaa00" icon="fa-guitar" esMovil={esMovil} />
        <MixerTrack name="OTROS" track="otros" value={volumes.otros} onChange={handleVolume} color="#00aaff" icon="fa-compact-disc" esMovil={esMovil} />
      </div>
    </div>
  );
}

// CORRECCIÓN MAGNA DE ESTILOS PARA EL SLIDER
const MixerTrack = ({ name, track, value, onChange, color, icon, esMovil }) => (
  <div style={{ 
    background: '#0a0a0a', 
    padding: esMovil ? '10px' : '10px 15px', 
    borderRadius: '8px', 
    border: '1px solid #222', 
    display: 'flex', 
    alignItems: 'center', 
    gap: esMovil ? '8px' : '15px', 
    width: '100%', 
    boxSizing: 'border-box' 
  }}>
    <div style={{ width: '25px', textAlign: 'center', flexShrink: 0 }}>
      <i className={`fa-solid ${icon}`} style={{ color: value > 0 ? color : '#444', fontSize: esMovil ? '0.9rem' : '1rem' }}></i>
    </div>
    <div style={{ width: esMovil ? '60px' : '70px', flexShrink: 0 }}>
      <span style={{ color: value > 0 ? '#fff' : '#666', fontSize: esMovil ? '0.75rem' : '0.8rem', fontWeight: 'bold' }}>{name}</span>
    </div>
    <input 
      type="range" min="0" max="1" step="0.01" value={value} 
      onChange={(e) => onChange(track, e.target.value)}
      style={{ 
        flex: 1, 
        accentColor: color, 
        minWidth: '0',    // ¡LA CLAVE! Evita que el input rompa la caja
        width: '100%', 
        margin: '0' 
      }}
    />
  </div>
);