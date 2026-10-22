import { useState, useEffect, useMemo, useRef } from 'react';
import { db } from '../firebase/config';
import { collection, addDoc, onSnapshot, query, limit, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { MapContainer, TileLayer, Marker, Circle, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import EchoToast from '../components/EchoToast';
import SpectrumVisualizer from '../components/SpectrumVisualizer';
import useAudioMeter from '../hooks/useAudioMeter';
import EchoHeatLayer from '../components/EchoHeatLayer';
import EchoReportMarkers from '../components/EchoReportMarkers';
import { ACOUSTIC_LEVELS, HEAT_CONFIG, SOUND_CATEGORIES, getAcousticClassification } from '../constants/echoSafeConfig';
import EchoRecoveryModal from '../components/EchoRecoveryModal';
import './EchoSafe.css';


// --- ICONOS LIMPIOS Y MARCADORES TÁCTICOS ---
const userIcon = L.divIcon({
  className: 'custom-icon',
  html: `<i class="fa-solid fa-street-view" style="color: #00F0FF; font-size: 32px; filter: drop-shadow(0px 0px 10px rgba(0,240,255,0.9));"></i>`,
  iconSize: [32, 32], iconAnchor: [16, 32]
});

// Vuela hacia un destino explícito (solo al fijar el GPS, no al arrastrar el pin)
function MapFlyTo({ target }) {
  const map = useMap();
  useEffect(() => {
    if (target) map.flyTo(target.coords, 16, { duration: 2 });
  }, [target, map]);
  return null;
}

// Eventos del mapa: nivel de zoom actual y selección manual de ubicación por clic
function MapEvents({ onZoomChange, pickMode, onPick }) {
  useMapEvents({
    zoomend: (e) => onZoomChange(e.target.getZoom()),
    click: (e) => {
      if (pickMode) onPick([e.latlng.lat, e.latlng.lng]);
    }
  });
  return null;
}

// Encuadra el mapa una sola vez sobre los reportes existentes, en lugar de un centro fijo
function FitToReports({ reports, enabled }) {
  const map = useMap();
  const fittedRef = useRef(false);
  useEffect(() => {
    if (fittedRef.current || !enabled) return;
    const points = reports
      .map((r) => [Number(r.lat), Number(r.lng)])
      .filter(([lat, lng]) => Number.isFinite(lat) && Number.isFinite(lng));
    if (points.length === 0) return;
    fittedRef.current = true;
    map.fitBounds(L.latLngBounds(points), { padding: [40, 40], maxZoom: 15 });
  }, [reports, enabled, map]);
  return null;
}

export default function EchoSafe() {
  const { user } = useAuth();
  const [reportes, setReportes] = useState([]);
  const [toasts, setToasts] = useState([]);
  
  const [userLocation, setUserLocation] = useState([6.2442, -75.5812]);
  const [isTracking, setIsTracking] = useState(false);
  const [locationStatus, setLocationStatus] = useState("Esperando enlace satelital...");
  const [locationSource, setLocationSource] = useState(null); // 'gps' | 'manual'
  const [gpsAccuracy, setGpsAccuracy] = useState(null);
  const [pickMode, setPickMode] = useState(false);
  const [flyTarget, setFlyTarget] = useState(null);
  const [mapZoom, setMapZoom] = useState(13);
  const [viewMode, setViewMode] = useState('heat'); // 'heat' | 'points'
  
  const [finalAverage, setFinalAverage] = useState(null);
  const [scanSummary, setScanSummary] = useState(null);
  const [categoria, setCategoria] = useState(SOUND_CATEGORIES[0].id);
  const [descripcion, setDescripcion] = useState('');

  // Estados de filtros para el mapa y las consultas
  const [filtroCategoria, setFiltroCategoria] = useState('all');
  const [filtroNivel, setFiltroNivel] = useState('all');

  // Estado del Protocolo de Descompresión Auditiva (Fase 2)
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [recoveryInitialDb, setRecoveryInitialDb] = useState(null);


  const showToast = (type, title, message, duration = 4000) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, type, title, message }]);
    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  };

  const dismissToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Consulta optimizada acotada a los 150 registros más recientes
  useEffect(() => {
    const q = query(collection(db, "echo_reports"), limit(150));
    const unsubscribe = onSnapshot(q, (s) => {
      const data = [];
      s.forEach((d) => data.push({ id: d.id, ...d.data() }));

      // Ordenar cronológicamente (más recientes primero) combinando serverTimestamp y strings
      data.sort((a, b) => {
        const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : (a.fecha ? new Date(a.fecha).getTime() || 0 : 0);
        const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : (b.fecha ? new Date(b.fecha).getTime() || 0 : 0);
        return timeB - timeA;
      });

      setReportes(data);
    }, (error) => {
      console.error("Error al sincronizar reportes de Firestore:", error);
      showToast('error', 'Error de enlace', 'No se pudieron sincronizar los datos de la red sonora.');
    });

    return () => unsubscribe();
  }, []);

  const iniciarRastreo = () => {
    setPickMode(false);
    if (!navigator.geolocation) {
      setLocationStatus("GPS no disponible");
      showToast('warning', 'GPS no disponible', 'Tu navegador no soporta geolocalización. Elige el punto manualmente sobre el mapa.', 6000);
      return;
    }
    setLocationStatus("Localizando terminal GPS...");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = [pos.coords.latitude, pos.coords.longitude];
        const accuracy = Math.round(pos.coords.accuracy || 0);
        setUserLocation(coords);
        setGpsAccuracy(accuracy);
        setLocationSource('gps');
        setIsTracking(true);
        setFlyTarget({ coords });
        setLocationStatus(accuracy ? `Posición GPS fijada (±${accuracy} m)` : "Posición GPS fijada");
        showToast('info', 'GPS Enlazado', 'Coordenadas capturadas. Puedes arrastrar el pin para ajustarlas.');
      },
      () => {
        setLocationStatus("Fallo de acceso GPS");
        showToast('warning', 'Señal GPS no disponible', 'No se pudo obtener tu ubicación. Puedes elegir el punto manualmente sobre el mapa.', 6000);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  // Alternativa sin GPS: el usuario toca el mapa para fijar el punto del reporte
  const alternarSeleccionManual = () => {
    if (pickMode) {
      setPickMode(false);
      setLocationStatus("Esperando enlace satelital...");
      return;
    }
    setPickMode(true);
    setLocationStatus("Toca el mapa para fijar tu punto");
    showToast('info', 'Modo manual', 'Haz clic en el mapa donde quieres reportar. Después podrás arrastrar el pin para ajustarlo.');
  };

  const fijarUbicacionManual = (coords) => {
    setUserLocation(coords);
    setGpsAccuracy(null);
    setLocationSource('manual');
    setIsTracking(true);
    setPickMode(false);
    setLocationStatus("Punto manual fijado");
  };

  // Handlers estables para el pin arrastrable (evita re-registrarlos en cada render)
  const markerHandlers = useMemo(
    () => ({
      dragend: (e) => {
        const { lat, lng } = e.target.getLatLng();
        setUserLocation([lat, lng]);
        setGpsAccuracy(null);
        setLocationSource('manual');
        setLocationStatus("Punto manual ajustado");
      }
    }),
    []
  );

  // --- MOTOR DE AUDIO (Web Audio API): RMS real, ponderación A y Leq energético ---
  const handleScanComplete = (result) => {
    setFinalAverage(result.avg);
    setScanSummary({ avg: result.avg, peak: result.peak, min: result.min });
    if (result.avg >= 76) {
      showToast('warning', 'Alerta de Fatiga Auditiva', `Exposición elevada (${result.avg} dB). Te sugerimos iniciar el Protocolo de Descompresión para proteger tu audición.`, 7000);
    }
  };


  const handleScanError = ({ code }) => {
    const messages = {
      denied: { type: 'error', title: 'Acceso al micrófono denegado', message: 'Por favor habilita los permisos de audio en tu navegador para realizar la medición acústica.' },
      'no-device': { type: 'error', title: 'Micrófono no encontrado', message: 'No se detectó ningún dispositivo de entrada de audio. Conecta un micrófono e inténtalo de nuevo.' },
      unsupported: { type: 'error', title: 'Navegador no compatible', message: 'Tu navegador no permite acceder al micrófono. Prueba con una versión reciente de Chrome, Edge o Safari.' },
      silent: { type: 'warning', title: 'Sin señal de audio', message: 'El micrófono parece silenciado o no captó señal. Revisa que no esté en mute y repite el escaneo.' },
      interrupted: { type: 'warning', title: 'Medición interrumpida', message: 'La pestaña perdió el foco o el micrófono se desconectó. Repite el escaneo.' },
      insufficient: { type: 'warning', title: 'Muestra insuficiente', message: 'No se reunieron suficientes datos para una medición fiable. Inténtalo de nuevo.' },
      unknown: { type: 'error', title: 'Error de medición', message: 'Ocurrió un problema al iniciar el sonómetro. Inténtalo de nuevo.' }
    };
    const info = messages[code] || messages.unknown;
    showToast(info.type, info.title, info.message, 5500);
  };

  const {
    start: iniciarMedicion,
    isListening,
    progress: listeningProgress,
    liveDb,
    analyser: audioAnalyser
  } = useAudioMeter({ onComplete: handleScanComplete, onError: handleScanError });

  const iniciarEscaneo = () => {
    setFinalAverage(null);
    setScanSummary(null);
    iniciarMedicion();
  };

  const handleGuardarReporte = async () => {
    if (!user) {
      showToast('warning', 'Sesión requerida', 'Debes iniciar sesión para registrar tu medición en la red comunitaria.');
      return;
    }
    if (!isTracking) {
      showToast('warning', 'Ubicación requerida', 'Por favor ubica primero tus coordenadas en el mapa antes de transmitir.');
      return;
    }
    if (finalAverage === null) {
      showToast('warning', 'Medición requerida', 'Completa el escaneo de decibelios antes de transmitir.');
      return;
    }

    try {
      const acousticClassification = getAcousticClassification(finalAverage);
      await addDoc(collection(db, "echo_reports"), {
        userId: user.uid,
        userName: user.displayName || "Usuario Anónimo",
        lat: userLocation[0],
        lng: userLocation[1],
        db: finalAverage,
        picoDb: scanSummary?.peak || finalAverage,
        minDb: scanSummary?.min || finalAverage,
        tipo: finalAverage > 75 ? 'ruido' : 'seguro',
        categoria: categoria,
        clasificacion: acousticClassification.id,
        descripcion: descripcion.trim() || "Sin observaciones.",
        createdAt: serverTimestamp(),
        fecha: new Date().toLocaleString()
      });
      setFinalAverage(null);
      setScanSummary(null);
      setIsTracking(false);
      setLocationSource(null);
      setGpsAccuracy(null);
      setLocationStatus("Esperando enlace satelital...");
      setDescripcion('');
      showToast('success', 'Telemetría enviada', '¡Tu aporte acústico ha sido integrado con éxito al mapa sonoro!');
    } catch (e) {
      console.error(e);
      showToast('error', 'Fallo al transmitir', 'No se pudo guardar el reporte en la red. Por favor intenta de nuevo.');
    }
  };

  // --- CÁLCULO DE MÉTRICAS GLOBALES (KPIS) ---
  const totalReportes = reportes.length;
  const promedioCiudad = totalReportes
    ? Math.round(reportes.reduce((sum, r) => sum + (Number(r.db) || 0), 0) / totalReportes)
    : 0;
  const maxReporte = totalReportes
    ? Math.max(...reportes.map((r) => Number(r.db) || 0))
    : 0;
  const minReporte = totalReportes
    ? Math.min(...reportes.map((r) => Number(r.db) || 0))
    : 0;

  const kpiPromedioAcoustic = getAcousticClassification(promedioCiudad);
  const kpiMaxAcoustic = getAcousticClassification(maxReporte);

  // Durante el escaneo se muestra el nivel en vivo; después, el promedio (Leq) final
  const dbLevel = isListening ? liveDb : (finalAverage ?? 0);
  const acousticInfo = getAcousticClassification(dbLevel);
  const ringColor = dbLevel > 0 ? acousticInfo.color : '#232738';

  // --- FILTRADO INTERACTIVO DE REPORTES PARA EL MAPA ---
  // Memoizado: la capa térmica y los marcadores solo se recalculan si cambian los datos o los filtros,
  // no con cada actualización del sonómetro en vivo.
  const reportesFiltrados = useMemo(
    () =>
      reportes.filter((rep) => {
        const matchCat = filtroCategoria === 'all' || rep.categoria === filtroCategoria;
        const repDb = Number(rep.db) || 0;
        let matchNivel = true;
        if (filtroNivel === 'calm') matchNivel = repDb <= 50;
        else if (filtroNivel === 'moderate') matchNivel = repDb > 50 && repDb <= 65;
        else if (filtroNivel === 'noisy') matchNivel = repDb > 65 && repDb <= 80;
        else if (filtroNivel === 'critical') matchNivel = repDb > 80;
        return matchCat && matchNivel;
      }),
    [reportes, filtroCategoria, filtroNivel]
  );

  return (
    <main className="echosafe-wrapper">
      
      {/* CABECERA FUTURISTA Y BADGE EN VIVO */}
      <section className="echosafe-hero">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '1.2rem' }}>
          <div className="echosafe-badge-pill" style={{ margin: 0 }}>
            <span className="echosafe-beacon-dot"></span>
            Red de Telemetría Acústica Urbana // Nodo Activo
          </div>
          <button
            type="button"
            onClick={() => { setRecoveryInitialDb(dbLevel > 0 ? dbLevel : null); setShowRecoveryModal(true); }}
            className="echosafe-recovery-hero-btn"
            title="Iniciar sesión de recuperación acústica con frecuencias curativas y ruido marrón"
          >
            <i className="fa-solid fa-heart-pulse"></i>
            <span>DESCOMPRESIÓN AUDITIVA</span>
            <span className="echosafe-recovery-tag">SPOTIFY</span>
          </button>
        </div>
        <h1 className="echosafe-title">

          Echo <span className="accent">Safe</span>
        </h1>
        <p className="echosafe-subtitle">
          El termómetro sonoro comunitario. Monitorea la polución acústica en tiempo real, cartografía tu entorno y descubre los oasis de tranquilidad urbana.
        </p>
      </section>

      {/* TARJETAS KPI DE RED (MÉTRICAS RÁPIDAS) */}
      <section className="echosafe-kpi-grid">
        <div className="echosafe-kpi-card" style={{ '--card-accent': kpiPromedioAcoustic.color }}>
          <div className="echosafe-kpi-icon" style={{ color: kpiPromedioAcoustic.color }}>
            <i className="fa-solid fa-chart-simple"></i>
          </div>
          <div className="echosafe-kpi-info">
            <span className="echosafe-kpi-label">Nivel Medio Urbano</span>
            <div className="echosafe-kpi-value-row">
              <span className="echosafe-kpi-value">{promedioCiudad > 0 ? promedioCiudad : '--'}</span>
              <span className="echosafe-kpi-unit">dB</span>
            </div>
            <span className="echosafe-kpi-subtext" style={{ color: kpiPromedioAcoustic.color }}>
              {promedioCiudad > 0 ? kpiPromedioAcoustic.label : 'En espera de datos'}
            </span>
          </div>
        </div>

        <div className="echosafe-kpi-card" style={{ '--card-accent': '#FF007A' }}>
          <div className="echosafe-kpi-icon" style={{ color: '#FF007A' }}>
            <i className="fa-solid fa-fire-flame-curved"></i>
          </div>
          <div className="echosafe-kpi-info">
            <span className="echosafe-kpi-label">Pico Máximo Registrado</span>
            <div className="echosafe-kpi-value-row">
              <span className="echosafe-kpi-value">{maxReporte > 0 ? maxReporte : '--'}</span>
              <span className="echosafe-kpi-unit">dB</span>
            </div>
            <span className="echosafe-kpi-subtext" style={{ color: maxReporte > 75 ? '#FF007A' : '#FBBF24' }}>
              {maxReporte > 0 ? kpiMaxAcoustic.label : 'Sin picos críticos'}
            </span>
          </div>
        </div>

        <div className="echosafe-kpi-card" style={{ '--card-accent': '#10B981' }}>
          <div className="echosafe-kpi-icon" style={{ color: '#10B981' }}>
            <i className="fa-solid fa-shield-heart"></i>
          </div>
          <div className="echosafe-kpi-info">
            <span className="echosafe-kpi-label">Refugio de Calma</span>
            <div className="echosafe-kpi-value-row">
              <span className="echosafe-kpi-value">{minReporte > 0 ? minReporte : '--'}</span>
              <span className="echosafe-kpi-unit">dB</span>
            </div>
            <span className="echosafe-kpi-subtext" style={{ color: '#10B981' }}>
              {minReporte > 0 ? 'Punto más silencioso' : 'Explora la ciudad'}
            </span>
          </div>
        </div>

        <div className="echosafe-kpi-card" style={{ '--card-accent': '#00F0FF' }}>
          <div className="echosafe-kpi-icon" style={{ color: '#00F0FF' }}>
            <i className="fa-solid fa-satellite-dish"></i>
          </div>
          <div className="echosafe-kpi-info">
            <span className="echosafe-kpi-label">Nodos Mapeados</span>
            <div className="echosafe-kpi-value-row">
              <span className="echosafe-kpi-value">{totalReportes}</span>
              <span className="echosafe-kpi-unit">registros</span>
            </div>
            <span className="echosafe-kpi-subtext" style={{ color: '#00F0FF' }}>
              Comunidad The Sonic Vault
            </span>
          </div>
        </div>
      </section>

      {/* DISPOSICIÓN PRINCIPAL: CONSOLA DE MONITOREO Y MAPA TÁCTICO */}
      <div className="echosafe-main-grid">
        
        {/* PANEL IZQUIERDO: TERMINAL DE CONTROL Y SONÓMETRO */}
        <section className="echosafe-control-panel">
          
          <div className="echosafe-panel-header">
            <div className="echosafe-gps-pill" style={{ borderColor: isTracking ? 'rgba(0, 240, 255, 0.4)' : '#262b3d' }}>
              <i className="fa-solid fa-satellite-dish" style={{ color: isTracking ? '#00F0FF' : '#FBBF24' }}></i>
              <span style={{ color: isTracking ? '#00F0FF' : '#a0aec0' }}>{locationStatus}</span>
            </div>
            {isTracking && (
              <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>
                {userLocation[0].toFixed(3)}, {userLocation[1].toFixed(3)}{locationSource ? ` · ${locationSource === 'gps' ? 'GPS' : 'MANUAL'}` : ''}
              </span>
            )}
          </div>

          {/* EL ARO DEL MEDIDOR */}
          <div className="echosafe-gauge-container">
            <div 
              className="echosafe-gauge-ring"
              style={{
                borderColor: ringColor,
                boxShadow: dbLevel > 0 ? `0 0 45px ${ringColor}35, inset 0 0 25px ${ringColor}20` : '0 0 20px rgba(0,0,0,0.5)'
              }}
            >
              <span className="echosafe-gauge-number" style={{ textShadow: dbLevel > 0 ? `0 0 25px ${ringColor}60` : 'none' }}>
                {dbLevel}
              </span>
              <span className="echosafe-gauge-unit">dB</span>

              {/* Insignia de clasificación en vivo */}
              {dbLevel > 0 && (
                <div 
                  className="echosafe-classification-badge"
                  style={{
                    background: `${acousticInfo.color}20`,
                    border: `1px solid ${acousticInfo.color}50`,
                    color: acousticInfo.color
                  }}
                >
                  <i className={`fa-solid ${acousticInfo.icon}`}></i>
                  <span>{acousticInfo.label}</span>
                </div>
              )}
            </div>

            {/* Barra de progreso de escaneo */}
            {isListening && (
              <div className="echosafe-progress-bar-wrap">
                <div 
                  className="echosafe-progress-bar-fill" 
                  style={{ width: `${listeningProgress}%`, background: ringColor, color: ringColor }}
                ></div>
              </div>
            )}
          </div>

          {/* ANALIZADOR DE ESPECTRO EN VIVO */}
          <SpectrumVisualizer analyser={audioAnalyser} color={ringColor} />

          {/* BOTONERA Y CONTROLES TÁCTICOS */}
          <div className="echosafe-actions-block">
            {!isTracking ? (
              <>
              <button 
                onClick={iniciarRastreo} 
                className="echosafe-btn-primary echosafe-btn-locate"
              >
                <i className="fa-solid fa-location-crosshairs"></i>
                UBICAR CON GPS
              </button>
            <button
                type="button"
                onClick={alternarSeleccionManual}
                className={`echosafe-btn-secondary ${pickMode ? 'active' : ''}`}
              >
                <i className={`fa-solid ${pickMode ? 'fa-xmark' : 'fa-hand-pointer'}`}></i>
                {pickMode ? 'CANCELAR SELECCIÓN' : 'ELEGIR PUNTO MANUALMENTE'}
              </button>
              </>
            ) : !isListening && finalAverage === null ? (
              <button 
                onClick={iniciarEscaneo} 
                className="echosafe-btn-primary echosafe-btn-scan"
              >
                <i className="fa-solid fa-microphone-lines"></i>
                INICIAR ESCANEO (8s)
              </button>
            ) : isListening ? (
              <div className="echosafe-measuring-state">
                <div className="echosafe-soundwaves-icon">
                  <span style={{ background: ringColor }}></span>
                  <span style={{ background: ringColor }}></span>
                  <span style={{ background: ringColor }}></span>
                  <span style={{ background: ringColor }}></span>
                  <span style={{ background: ringColor }}></span>
                </div>
                <div style={{ color: ringColor, fontWeight: 700, fontSize: '0.88rem', letterSpacing: '0.5px' }}>
                  Analizando espectro acústico ({Math.round(listeningProgress)}%)
                </div>
              </div>
            ) : (
              <div className="echosafe-form-container">
                {/* Resumen técnico del escaneo (Leq, Pico, Mínimo) */}
                {scanSummary && (
                  <div className="echosafe-scan-summary">
                    <div className="echosafe-scan-metric">
                      <span className="echosafe-scan-metric-label">Promedio (Leq)</span>
                      <span className="echosafe-scan-metric-value" style={{ color: ringColor }}>{scanSummary.avg} dB</span>
                    </div>
                    <div className="echosafe-scan-metric">
                      <span className="echosafe-scan-metric-label">Pico Máx</span>
                      <span className="echosafe-scan-metric-value" style={{ color: '#FF007A' }}>{scanSummary.peak} dB</span>
                    </div>
                    <div className="echosafe-scan-metric">
                      <span className="echosafe-scan-metric-label">Mínimo</span>
                      <span className="echosafe-scan-metric-value" style={{ color: '#10B981' }}>{scanSummary.min} dB</span>
                    </div>
                  </div>
                )}

                {/* Alerta de Fatiga Auditiva y Recomendación de Descompresión Sónica */}
                {scanSummary && scanSummary.avg >= 76 && (
                  <div className="echosafe-recovery-recommendation-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <i className="fa-solid fa-heart-pulse" style={{ color: '#FF007A', fontSize: '1.4rem' }}></i>
                      <div>
                        <span style={{ fontWeight: 700, color: '#fff', fontSize: '0.84rem' }}>Fatiga Auditiva Inminente ({scanSummary.avg} dB)</span>
                        <p style={{ margin: '2px 0 0 0', color: '#94a3b8', fontSize: '0.75rem' }}>
                          Nivel de riesgo acústico. La OMS sugiere una sesión de reposo para recuperar los receptores auditivos.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setRecoveryInitialDb(scanSummary.avg); setShowRecoveryModal(true); }}
                      className="echosafe-btn-recovery-launch"
                    >
                      <i className="fa-solid fa-spa"></i> TERAPIA SÓNICA
                    </button>
                  </div>
                )}

                {/* Selector de Categoría de Fuente Sonora */}
                <div>
                  <label className="echosafe-form-label">
                    FUENTE DEL SONIDO:
                  </label>
                  <div className="echosafe-categories-grid">
                    {SOUND_CATEGORIES.map((cat) => {
                      const isSelected = categoria === cat.id;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setCategoria(cat.id)}
                          className={`echosafe-cat-btn ${isSelected ? 'active' : ''}`}
                          style={isSelected ? { borderColor: ringColor, color: '#ffffff' } : {}}
                        >
                          <i className={`fa-solid ${cat.icon}`} style={{ color: isSelected ? ringColor : '#64748b' }}></i>
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cat.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label className="echosafe-form-label">
                      OBSERVACIONES:
                    </label>
                    <span className="echosafe-char-count">{descripcion.length} / 180</span>
                  </div>
                  <textarea 
                    value={descripcion} 
                    onChange={(e) => setDescripcion(e.target.value.slice(0, 180))}
                    placeholder="Ej. Tráfico pesado en hora pico, música de terraza, zona tranquila de parque..."
                    className="echosafe-textarea"
                    maxLength={180}
                  />
                </div>

                <div className="echosafe-form-btn-row">
                  <button 
                    onClick={() => { setFinalAverage(null); setScanSummary(null); }} 
                    className="echosafe-btn-repeat"
                  >
                    REPETIR
                  </button>
                  <button 
                    onClick={handleGuardarReporte} 
                    disabled={!user} 
                    className="echosafe-btn-transmit"
                  >
                    <i className="fa-solid fa-satellite"></i>
                    TRANSMITIR
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* PANEL DERECHO: VISUALIZADOR CARTOGRÁFICO INMERSIVO */}
        <section className="echosafe-map-panel">
          
          <div className="echosafe-map-hud-header">
            <div className="echosafe-map-title">
              <i className="fa-solid fa-earth-americas"></i>
              <span>Mapa Térmico Acústico</span>
            </div>
            <div className="echosafe-view-toggle" role="group" aria-label="Tipo de vista del mapa">
              <button
                type="button"
                className={`echosafe-view-btn ${viewMode === 'heat' ? 'active' : ''}`}
                onClick={() => setViewMode('heat')}
              >
                <i className="fa-solid fa-fire"></i> Calor
              </button>
              <button
                type="button"
                className={`echosafe-view-btn ${viewMode === 'points' ? 'active' : ''}`}
                onClick={() => setViewMode('points')}
              >
                <i className="fa-solid fa-location-dot"></i> Puntos
              </button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981', display: 'inline-block' }}></span>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600, letterSpacing: '0.5px' }}>
                {totalReportes} NODOS REGISTRADOS
              </span>
            </div>
          </div>

          {/* BARRA DE FILTROS TÁCTICOS */}
          <div className="echosafe-filter-toolbar">
            <div className="echosafe-filter-group">
              <span className="echosafe-filter-label">
                <i className="fa-solid fa-filter" style={{ marginRight: '4px', color: '#00F0FF' }}></i>
                Filtrar:
              </span>
              <select 
                value={filtroCategoria} 
                onChange={(e) => setFiltroCategoria(e.target.value)}
                className="echosafe-filter-select"
              >
                <option value="all">Todas las fuentes</option>
                {SOUND_CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.label}</option>
                ))}
              </select>

              <select 
                value={filtroNivel} 
                onChange={(e) => setFiltroNivel(e.target.value)}
                className="echosafe-filter-select"
              >
                <option value="all">Todos los niveles</option>
                <option value="calm">Calma (≤ 50 dB)</option>
                <option value="moderate">Moderado (51 - 65 dB)</option>
                <option value="noisy">Ruidoso (66 - 80 dB)</option>
                <option value="critical">Peligro auditivo (&gt; 80 dB)</option>
              </select>
            </div>

            <div className="echosafe-filter-badge">
              {reportesFiltrados.length} de {totalReportes} puntos visibles
            </div>
          </div>

          <div className={`echosafe-map-viewport-wrap ${pickMode ? 'picking' : ''}`}>
            {pickMode && (
              <div className="echosafe-pick-banner">
                <i className="fa-solid fa-hand-pointer"></i>
                Toca el mapa para fijar tu punto
              </div>
            )}
            {viewMode === 'heat' && mapZoom < HEAT_CONFIG.MARKERS_MIN_ZOOM && reportesFiltrados.length > 0 && (
              <div className="echosafe-zoom-hint">
                <i className="fa-solid fa-magnifying-glass-plus" style={{ marginRight: '6px' }}></i>
                Acércate para ver cada nodo
              </div>
            )}
            <MapContainer center={userLocation} zoom={13} style={{ height: '100%', width: '100%', background: '#07080d' }}>
              <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
              <MapFlyTo target={flyTarget} />

              <MapEvents onZoomChange={setMapZoom} pickMode={pickMode} onPick={fijarUbicacionManual} />
              <FitToReports reports={reportes} enabled={!isTracking} />

              {/* CAPA TÉRMICA: un único canvas en lugar de 3 círculos vectoriales por reporte */}
              {viewMode === 'heat' && <EchoHeatLayer reports={reportesFiltrados} />}

              {/* NODOS INDIVIDUALES: siempre en vista de puntos; en vista térmica, solo al acercarse */}
              {(viewMode === 'points' || mapZoom >= HEAT_CONFIG.MARKERS_MIN_ZOOM) && (
                <EchoReportMarkers reports={reportesFiltrados} />
              )}

              {/* Radio de precisión del GPS */}
              {isTracking && locationSource === 'gps' && gpsAccuracy > 0 && (
                <Circle
                  center={userLocation}
                  radius={gpsAccuracy}
                  pathOptions={{ color: '#00F0FF', weight: 1, fillColor: '#00F0FF', fillOpacity: 0.08 }}
                />
              )}

              {/* Pin del usuario: arrastrable para afinar la ubicación */}
              {isTracking && (
                <Marker position={userLocation} icon={userIcon} draggable eventHandlers={markerHandlers} />
              )}
            </MapContainer>
          </div>

          {/* LEYENDA TÁCTICA DE NIVELES ACÚSTICOS (OMS) */}
          <div className="echosafe-map-legend">
            <span className="echosafe-legend-title">
              <i className="fa-solid fa-scale-balanced" style={{ marginRight: '6px', color: '#00F0FF' }}></i>
              Escala OMS:
            </span>
            <div className="echosafe-legend-items">
              {ACOUSTIC_LEVELS.map((lvl) => (
                <div key={lvl.id} className="echosafe-legend-item">
                  <span className="echosafe-legend-color-dot" style={{ background: lvl.color, color: lvl.color }}></span>
                  <span>{lvl.label} ({lvl.min}-{lvl.max > 120 ? '120+' : lvl.max} dB)</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* SISTEMA DE NOTIFICACIONES TOAST CYBERPUNK */}
      <EchoToast toasts={toasts} onDismiss={dismissToast} />

      {/* MODAL PROTOCOLO DE DESCOMPRESIÓN AUDITIVA & SOUND HEALING (FASE 2) */}
      {showRecoveryModal && (
        <EchoRecoveryModal 
          onClose={() => setShowRecoveryModal(false)} 
          initialDb={recoveryInitialDb} 
        />
      )}
    </main>
  );
}
