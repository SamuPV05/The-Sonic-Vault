import { useState, useEffect, useRef } from 'react';
import { db, auth } from '../firebase/config';
import { collection, addDoc, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// --- ICONOS LIMPIOS ---
const userIcon = L.divIcon({
  className: 'custom-icon',
  html: `<i class="fa-solid fa-street-view" style="color: #00aaff; font-size: 32px; filter: drop-shadow(0px 0px 8px rgba(0,170,255,0.8));"></i>`,
  iconSize: [32, 32], iconAnchor: [16, 32]
});

const safeIcon = L.divIcon({
  className: 'custom-icon',
  html: `<i class="fa-solid fa-circle" style="color: #00ffcc; font-size: 14px; box-shadow: 0 0 10px #00ffcc; border-radius: 50%;"></i>`,
  iconSize: [14, 14], iconAnchor: [7, 7]
});

const noisyIcon = L.divIcon({
  className: 'custom-icon',
  html: `<i class="fa-solid fa-circle" style="color: #f43f5e; font-size: 14px; box-shadow: 0 0 10px #f43f5e; border-radius: 50%;"></i>`,
  iconSize: [14, 14], iconAnchor: [7, 7]
});

function MapFlyTo({ coords, isTracking }) {
  const map = useMap();
  useEffect(() => {
    if (isTracking && coords) {
      map.flyTo(coords, 16, { duration: 2 });
    }
  }, [coords, isTracking, map]);
  return null;
}

export default function EchoSafe() {
  const [user, setUser] = useState(null);
  const [reportes, setReportes] = useState([]);
  
  const [userLocation, setUserLocation] = useState([6.2442, -75.5812]);
  const [isTracking, setIsTracking] = useState(false);
  const [locationStatus, setLocationStatus] = useState("Esperando conexión GPS...");
  
  const [dbLevel, setDbLevel] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [listeningProgress, setListeningProgress] = useState(0);
  const [finalAverage, setFinalAverage] = useState(null);
  const [descripcion, setDescripcion] = useState('');

  const streamRef = useRef(null);
  const animationFrameRef = useRef(null);
  const samplesRef = useRef([]);

  useEffect(() => {
    onAuthStateChanged(auth, setUser);
    const unsubscribe = onSnapshot(collection(db, "echo_reports"), (s) => {
      const data = [];
      s.forEach(d => data.push({ id: d.id, ...d.data() }));
      setReportes(data);
    });
    return () => unsubscribe();
  }, []);

  const iniciarRastreo = () => {
    setLocationStatus("Buscando señal...");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation([pos.coords.latitude, pos.coords.longitude]);
        setIsTracking(true);
        setLocationStatus("Ubicación fijada con precisión.");
      },
      () => setLocationStatus("No se pudo acceder al GPS."),
      { enableHighAccuracy: true }
    );
  };

  const startListening = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      ctx.createMediaStreamSource(stream).connect(analyser);

      const data = new Uint8Array(analyser.frequencyBinCount);
      samplesRef.current = [];
      setFinalAverage(null);
      setIsListening(true);
      setListeningProgress(0);

      const update = () => {
        analyser.getByteFrequencyData(data);
        const avg = data.reduce((a, b) => a + b) / data.length;
        const db = Math.min(120, Math.round(avg * 1.5 + 30));
        setDbLevel(db);
        samplesRef.current.push(db);
        animationFrameRef.current = requestAnimationFrame(update);
      };
      update();

      const duration = 8000;
      const start = Date.now();
      const timer = setInterval(() => {
        const elapsed = Date.now() - start;
        setListeningProgress(Math.min(100, (elapsed / duration) * 100));
        if (elapsed >= duration) {
          clearInterval(timer);
          finalize();
        }
      }, 50);
    } catch (e) { alert("Permiso de micrófono denegado."); }
  };

  const finalize = () => {
    cancelAnimationFrame(animationFrameRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    const avg = Math.round(samplesRef.current.reduce((a, b) => a + b) / samplesRef.current.length);
    setFinalAverage(avg);
    setDbLevel(avg);
    setIsListening(false);
  };

  const handleGuardarReporte = async () => {
    if (!user || !isTracking || finalAverage === null) return;
    try {
      await addDoc(collection(db, "echo_reports"), {
        userId: user.uid,
        userName: user.displayName || "Usuario Anónimo",
        lat: userLocation[0],
        lng: userLocation[1],
        db: finalAverage,
        tipo: finalAverage > 75 ? 'ruido' : 'seguro',
        descripcion: descripcion || "Sin observaciones.",
        fecha: new Date().toLocaleString()
      });
      setFinalAverage(null);
      setIsTracking(false);
      setDescripcion('');
      alert("¡Aporte guardado en el mapa!");
    } catch (e) { console.error(e); }
  };

  const ringColor = dbLevel > 75 ? '#f43f5e' : (dbLevel > 0 ? 'var(--accent-color, #00ffcc)' : '#333');

  return (
    <main style={{ padding: '3rem 5%', maxWidth: '1400px', margin: '0 auto', minHeight: '85vh', fontFamily: 'system-ui, sans-serif' }}>
      
      {/* CABECERA ELEGANTE */}
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 style={{ color: '#00aaff', margin: '0 0 10px 0', fontSize: '3rem', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: '900' }}>
          Echo Safe
        </h1>
        <p style={{ color: '#888', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
          El termómetro acústico de tu ciudad. Comparte y descubre el mapa de ruido en tiempo real.
        </p>
      </div>

      {/* CONTENEDOR PRINCIPAL - 2 COLUMNAS BIEN PROPORCIONADAS */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', alignItems: 'stretch' }}>
        
        {/* PANEL IZQUIERDO: MEDIDOR */}
        <div style={{ flex: '1', minWidth: '320px', maxWidth: '450px', background: '#0a0a0a', padding: '2.5rem', borderRadius: '16px', border: '1px solid #1a1a1a', display: 'flex', flexDirection: 'column', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
          
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <span style={{ display: 'inline-block', background: '#111', color: isTracking ? '#00ffcc' : '#fbbf24', padding: '8px 16px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold', border: '1px solid #222' }}>
              <i className="fa-solid fa-satellite-dish" style={{ marginRight: '8px' }}></i>
              {locationStatus}
            </span>
          </div>

          {/* EL ARO DEL MEDIDOR */}
          <div style={{ 
            width: '240px', height: '240px', margin: '0 auto 2rem auto', borderRadius: '50%',
            border: `6px solid ${ringColor}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 0 40px ${ringColor}30, inset 0 0 20px rgba(0,0,0,0.5)`,
            transition: 'border-color 0.2s ease', position: 'relative'
          }}>
            <span style={{ fontSize: '5rem', fontWeight: '900', color: '#fff', lineHeight: '1', textShadow: `0 0 15px ${ringColor}50` }}>
              {dbLevel}
            </span>
            <span style={{ fontSize: '1.2rem', color: '#888', fontWeight: 'bold' }}>dB</span>
            
            {/* Barra de progreso sutil circular simulada abajo */}
            {isListening && (
              <div style={{ position: 'absolute', bottom: '-20px', width: '80%', height: '4px', background: '#222', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ width: `${listeningProgress}%`, height: '100%', background: ringColor, transition: 'width 0.1s linear' }}></div>
              </div>
            )}
          </div>

          {/* BOTONERA Y CONTROLES */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: 'auto' }}>
            {!isTracking ? (
              <button onClick={iniciarRastreo} style={{ width: '100%', background: '#00aaff', color: '#000', border: 'none', padding: '16px', borderRadius: '12px', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer', transition: 'transform 0.2s' }} onMouseOver={e => e.target.style.transform='scale(1.02)'} onMouseOut={e => e.target.style.transform='scale(1)'}>
                UBICAR EN EL MAPA
              </button>
            ) : !isListening && finalAverage === null ? (
              <button onClick={startListening} style={{ width: '100%', background: 'var(--accent-color, #00ffcc)', color: '#000', border: 'none', padding: '16px', borderRadius: '12px', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer', transition: 'transform 0.2s' }} onMouseOver={e => e.target.style.transform='scale(1.02)'} onMouseOut={e => e.target.style.transform='scale(1)'}>
                INICIAR ESCANEO (8s)
              </button>
            ) : isListening ? (
              <div style={{ textAlign: 'center', color: ringColor, padding: '16px', fontWeight: 'bold', animation: 'pulse 1.5s infinite' }}>
                Midiendo entorno...
              </div>
            ) : (
              <div style={{ animation: 'fadeIn 0.3s ease' }}>
                <textarea 
                  value={descripcion} 
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Añade un comentario sobre este lugar..."
                  style={{ width: '100%', background: '#111', color: '#fff', border: '1px solid #333', padding: '12px', borderRadius: '8px', minHeight: '80px', marginBottom: '15px', resize: 'none', outline: 'none' }}
                />
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => setFinalAverage(null)} style={{ flex: '1', background: 'transparent', color: '#888', border: '1px solid #444', padding: '12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                    REPETIR
                  </button>
                  <button onClick={handleGuardarReporte} disabled={!user} style={{ flex: '2', background: '#fff', color: '#000', border: 'none', padding: '12px', borderRadius: '8px', cursor: user ? 'pointer' : 'not-allowed', fontWeight: 'bold', opacity: user ? 1 : 0.5 }}>
                    TRANSMITIR
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* PANEL DERECHO: MAPA DE CALOR */}
        <div style={{ flex: '2', minWidth: '350px', background: '#0a0a0a', padding: '10px', borderRadius: '16px', border: '1px solid #1a1a1a', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column' }}>
          
          <div style={{ height: '600px', width: '100%', borderRadius: '10px', overflow: 'hidden', position: 'relative' }}>
            <MapContainer center={userLocation} zoom={13} style={{ height: '100%', width: '100%', background: '#050505' }}>
              <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
              <MapFlyTo coords={isTracking ? userLocation : null} isTracking={isTracking} />

              {/* RENDERIZADO DEL MAPA TÉRMICO */}
              {reportes.map((rep) => {
                const heatColor = rep.db > 75 ? '#f43f5e' : '#00ffcc';
                return (
                  <div key={rep.id}>
                    <Circle center={[rep.lat, rep.lng]} radius={25} pathOptions={{ color: 'transparent', fillColor: heatColor, fillOpacity: 0.6 }} />
                    <Circle center={[rep.lat, rep.lng]} radius={60} pathOptions={{ color: 'transparent', fillColor: heatColor, fillOpacity: 0.2 }} />
                    <Circle center={[rep.lat, rep.lng]} radius={120} pathOptions={{ color: 'transparent', fillColor: heatColor, fillOpacity: 0.05 }} />
                    <Marker position={[rep.lat, rep.lng]} icon={rep.db > 75 ? noisyIcon : safeIcon}>
                      <Popup>
                        <div style={{ textAlign: 'center', color: '#000' }}>
                          <h3 style={{ margin: 0, color: heatColor, fontSize: '1.2rem' }}>{rep.db} dB</h3>
                          <p style={{ margin: '5px 0', fontSize: '0.9rem' }}>{rep.descripcion}</p>
                          <small style={{ color: '#888' }}>{rep.userName}</small>
                        </div>
                      </Popup>
                    </Marker>
                  </div>
                );
              })}

              {isTracking && <Marker position={userLocation} icon={userIcon} />}
            </MapContainer>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse { 0% { opacity: 0.6; transform: scale(0.98); } 50% { opacity: 1; transform: scale(1); } 100% { opacity: 0.6; transform: scale(0.98); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </main>
  );
}