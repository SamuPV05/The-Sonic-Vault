import { useState, useEffect } from 'react';
import { db, auth } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import { collection, getDocs, query, where, doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { Link } from 'react-router-dom';
import SpotifyProfileWidget from '../components/SpotifyProfileWidget';
import EchoToast from '../components/EchoToast';
import { useToast } from '../hooks/useToast';

// Avatares temáticos ligeros (SVG en data URI, sin dependencias externas y lo bastante cortos para Firebase Auth)
const crearAvatarSvg = (c1, c2, forma) => {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='${c1}'/><stop offset='1' stop-color='${c2}'/></linearGradient></defs><rect width='64' height='64' fill='#0a0a14'/>${forma.replace(/G/g, 'url(#g)')}</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
};

const AVATARES_PREDEFINIDOS = [
  { nombre: 'Vinilo Neón', url: crearAvatarSvg('#00ffcc', '#00bfff', "<circle cx='32' cy='32' r='24' fill='G'/><circle cx='32' cy='32' r='8' fill='#0a0a14'/>") },
  { nombre: 'Onda Synth', url: crearAvatarSvg('#ff0077', '#ffaa00', "<path d='M6 32q8-24 13 0t13 0 13 0 13 0' stroke='G' stroke-width='5' fill='none' stroke-linecap='round'/>") },
  { nombre: 'Ecualizador', url: crearAvatarSvg('#9945ff', '#00ffcc', "<rect x='10' y='34' width='8' height='20' rx='3' fill='G'/><rect x='22' y='18' width='8' height='36' rx='3' fill='G'/><rect x='34' y='26' width='8' height='28' rx='3' fill='G'/><rect x='46' y='12' width='8' height='42' rx='3' fill='G'/>") },
  { nombre: 'Pulso', url: crearAvatarSvg('#ff4444', '#ff0077', "<path d='M4 34h14l6-18 10 32 8-24 4 10h14' stroke='G' stroke-width='4' fill='none' stroke-linecap='round' stroke-linejoin='round'/>") },
  { nombre: 'Diamante', url: crearAvatarSvg('#00bfff', '#9945ff', "<path d='M32 8l22 24-22 24L10 32z' fill='G'/>") },
  { nombre: 'Rayo', url: crearAvatarSvg('#ffaa00', '#ff4444', "<path d='M36 6L16 36h14l-4 22 22-32H34z' fill='G'/>") }
];

export default function Perfil() {
  const { updateUserPhoto } = useAuth();
  const { toasts, showToast, dismissToast } = useToast();
  const [user, setUser] = useState(null);
  const [misBeats, setMisBeats] = useState([]);
  const [misReportes, setMisReportes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [artistasDB, setArtistasDB] = useState({});

  // PerfilData: bio y vibes (solo guardamos artistId y eraIndex)
  const [perfilData, setPerfilData] = useState({ bio: '', biografia: '', vibes: [null, null, null] });
  
  const [editandoBio, setEditandoBio] = useState(false);
  const [tempBio, setTempBio] = useState('');

  const [editandoVibes, setEditandoVibes] = useState(false);
  const [tempVibes, setTempVibes] = useState([null, null, null]);

  // Estado para el modal de cambio de foto
  const [editandoFoto, setEditandoFoto] = useState(false);
  const [tempFotoURL, setTempFotoURL] = useState('');
  const [guardandoFoto, setGuardandoFoto] = useState(false);
  const [errorFoto, setErrorFoto] = useState('');

  // Carga inicial (Auth, Beats y Perfil)
  useEffect(() => { 
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          // 1. Cargar Beats desde la nube
          const qBeats = query(collection(db, "beats"), where("userId", "==", currentUser.uid));
          const querySnapshot = await getDocs(qBeats);
          const beatsDescargados = [];
          querySnapshot.forEach((doc) => {
            beatsDescargados.push({ id: doc.id, ...doc.data() });
          });
          beatsDescargados.sort((a, b) => (b.timestamp?.toMillis?.() ?? 0) - (a.timestamp?.toMillis?.() ?? 0));
          setMisBeats(beatsDescargados);

          // 1.5 Cargar Artistas de Firestore
          const artistasCol = collection(db, "artistas");
          const artistasSnap = await getDocs(artistasCol);
          const dictArtistas = {};
          artistasSnap.forEach(d => { dictArtistas[d.id] = d.data(); });
          setArtistasDB(dictArtistas);

          // 2. Cargar Datos del Perfil (Bio y Vitrina)
          const userDocRef = doc(db, "users", currentUser.uid);
          const userSnap = await getDoc(userDocRef);
          
          if (userSnap.exists()) {
            const data = userSnap.data();
            const vibesData = data.vibes || [null, null, null];
            const biografiaTexto = data.biografia ?? data.bio ?? '';
            setPerfilData({ bio: biografiaTexto, biografia: biografiaTexto, vibes: vibesData });
            setTempBio(biografiaTexto);
            setTempVibes(vibesData);
          }
        } catch (error) {
          console.error("Error al cargar datos del perfil:", error);
        } finally {
          setCargando(false);
        }
      } else {
        setCargando(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // Escuchador en tiempo real para Echo-Safe
  useEffect(() => {
    if (!user) return; 

    // Buscamos en echo_reports DONDE el userId sea igual al del usuario actual
    const q = query(
      collection(db, "echo_reports"), 
      where("userId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const reportesData = [];
      snapshot.forEach((doc) => {
        reportesData.push({ id: doc.id, ...doc.data() });
      });
      // Ordenamos para que los más recientes salgan arriba
      reportesData.sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));
      setMisReportes(reportesData);
    });

    return () => unsubscribe();
  }, [user]);

  // --- FUNCIÓN ÚNICA DE GUARDADO (A prueba de balas) ---
  const handleGuardarCambios = async () => {
    if (!user) return;
    
    try {
      const userDocRef = doc(db, "users", user.uid);
      
      // Firebase ODIA los valores "undefined", así que nos aseguramos de limpiarlos
      const vibesLimpios = tempVibes.map(vibe => {
        if (!vibe) return null;
        return {
          artistId: vibe.artistId || "",
          eraIndex: vibe.eraIndex !== undefined ? vibe.eraIndex : 0
        };
      });

      const nuevosDatos = {
        biografia: tempBio || "",
        bio: tempBio || "",
        vibes: vibesLimpios
      };

      // Intentamos inyectar el documento
      await setDoc(userDocRef, nuevosDatos, { merge: true });
      
      // Si pasa, actualizamos la pantalla
      setPerfilData(nuevosDatos);
      setEditandoBio(false);
      setEditandoVibes(false);
      
      showToast('success', 'Bóveda Actualizada', '¡Tus preferencias y biografía han sido sincronizadas en la nube!');
      
    } catch (error) {
      console.error("Error al guardar en Firestore:", error);
      showToast('error', 'Fallo al Guardar', error.message || 'No se pudo actualizar la información en la nube.');
    }
  };

  const handleSelectVibe = (slotIndex, artistId, eraIndex) => {
    const nuevasVibes = [...tempVibes];
    nuevasVibes[slotIndex] = artistId ? { artistId, eraIndex: parseInt(eraIndex) } : null;
    setTempVibes(nuevasVibes);
  };

  // --- MODAL DE FOTO DE PERFIL ---
  const abrirModalFoto = () => {
    setTempFotoURL(user?.photoURL || '');
    setErrorFoto('');
    setEditandoFoto(true);
  };

  const cerrarModalFoto = () => {
    if (guardandoFoto) return;
    setEditandoFoto(false);
    setErrorFoto('');
  };

  const handleGuardarFoto = async () => {
    const url = tempFotoURL.trim();
    const esUrlValida = /^https?:\/\/.+/i.test(url) || url.startsWith('data:image/svg+xml');
    if (!esUrlValida) {
      setErrorFoto('Ingresa una URL válida que comience con http:// o https://, o elige un avatar.');
      return;
    }

    setGuardandoFoto(true);
    setErrorFoto('');
    try {
      await updateUserPhoto(url);
      setUser(auth.currentUser ? { ...auth.currentUser } : null);
      setEditandoFoto(false);
    } catch (error) {
      console.error('Error al actualizar la foto de perfil:', error);
      setErrorFoto('No se pudo guardar la foto: ' + (error.message || 'error desconocido'));
    } finally {
      setGuardandoFoto(false);
    }
  };

  if (cargando) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#050505' }}>
        {/* El Vinilo Neón Giratorio */}
        <div style={{
          position: 'relative', width: '80px', height: '80px', borderRadius: '50%',
          background: 'linear-gradient(45deg, #111 25%, #1a1a1a 50%, #111 75%)',
          border: '2px solid #333', animation: 'spinVinyl 1s linear infinite',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 30px rgba(0, 255, 204, 0.15)', marginBottom: '25px'
        }}>
          <div style={{ position: 'absolute', width: '60px', height: '60px', borderRadius: '50%', border: '1px solid #222' }}></div>
          <div style={{ position: 'absolute', width: '40px', height: '40px', borderRadius: '50%', border: '1px solid #222' }}></div>
          <div style={{ width: '25px', height: '25px', borderRadius: '50%', background: 'var(--accent-color, #00ffcc)', boxShadow: '0 0 15px var(--accent-color, #00ffcc)' }}>
            <div style={{ width: '6px', height: '6px', background: '#050505', borderRadius: '50%', margin: '9.5px auto' }}></div>
          </div>
        </div>
        {/* Texto con efecto de pulso */}
        <h2 style={{ color: 'var(--accent-color, #00ffcc)', letterSpacing: '3px', textTransform: 'uppercase', fontSize: '1.2rem', animation: 'pulseText 1.5s ease-in-out infinite' }}>
          Abriendo Bóveda...
        </h2>
        <style>{`
          @keyframes spinVinyl { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          @keyframes pulseText { 0%, 100% { opacity: 0.8; text-shadow: 0 0 10px var(--accent-color, #00ffcc); } 50% { opacity: 0.3; text-shadow: none; } }
        `}</style>
      </div>
    );
  }

  return (
    <main style={{ padding: '3rem 5%', maxWidth: '1200px', margin: '0 auto', background: '#050505', minHeight: '80vh' }}>
      
      {/* CABECERA Y BIO */}
      <section style={{ display: 'flex', alignItems: 'flex-start', gap: '30px', background: '#111', padding: '2rem', borderRadius: '15px', border: '1px solid #222', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <div
          onClick={abrirModalFoto}
          title="Cambiar foto de perfil"
          style={{ position: 'relative', width: '120px', height: '120px', borderRadius: '50%', overflow: 'hidden', border: '3px solid var(--accent-color)', flexShrink: 0, cursor: 'pointer' }}
          onMouseOver={e => { const o = e.currentTarget.querySelector('.avatar-overlay'); if (o) o.style.opacity = 1; }}
          onMouseOut={e => { const o = e.currentTarget.querySelector('.avatar-overlay'); if (o) o.style.opacity = 0; }}
        >
          <img src={user?.photoURL || "https://i.pravatar.cc/150?img=11"} alt="Perfil" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <div className="avatar-overlay" style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px', opacity: 0, transition: 'opacity 0.2s', color: 'var(--accent-color)' }}>
            <i className="fa-solid fa-camera" style={{ fontSize: '1.4rem' }}></i>
            <span style={{ fontSize: '0.6rem', fontWeight: 'bold', letterSpacing: '1px', textTransform: 'uppercase' }}>Cambiar</span>
          </div>
        </div>
        
        <div style={{ flex: 1, minWidth: '300px' }}>
          <h1 style={{ margin: '0 0 5px 0', fontSize: '2.5rem', textTransform: 'uppercase' }}>{user?.displayName}</h1>
          <p style={{ color: '#888', margin: '0 0 15px 0', fontSize: '0.9rem' }}><i className="fa-solid fa-envelope" style={{ marginRight: '8px' }}></i>{user?.email}</p>
          
          <div style={{ background: '#0a0a0a', padding: '15px', borderRadius: '8px', border: '1px solid #1a1a1a' }}>
            {editandoBio ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <textarea value={tempBio} onChange={(e) => setTempBio(e.target.value)} style={{ width: '100%', background: '#111', color: '#fff', border: '1px solid #333', padding: '10px', borderRadius: '4px', minHeight: '80px', resize: 'none', outline: 'none' }} />
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <button onClick={() => setEditandoBio(false)} style={{ background: 'transparent', color: '#888', border: 'none', cursor: 'pointer' }}>Cancelar</button>
                  <button onClick={handleGuardarCambios} style={{ background: 'var(--accent-color)', color: '#000', border: 'none', padding: '5px 15px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>Guardar Bio</button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <p style={{ color: '#ddd', margin: 0, lineHeight: '1.5' }}>{perfilData.biografia || perfilData.bio || "Agregue su biografía..."}</p>
                <button onClick={() => setEditandoBio(true)} style={{ background: 'transparent', color: 'var(--accent-color)', border: 'none', cursor: 'pointer' }}><i className="fa-solid fa-pen"></i></button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* VITRINA DE VIBRA ACTUAL */}
      <section style={{ background: '#111', padding: '2rem', borderRadius: '15px', border: '1px solid #222', marginBottom: '3rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
          <h2 style={{ color: '#fff', margin: 0, fontSize: '1.5rem' }}><i className="fa-solid fa-fire" style={{ color: '#ff4444', marginRight: '10px' }}></i> Vitrina de Vibra Actual</h2>
          <button onClick={() => setEditandoVibes(!editandoVibes)} style={{ background: editandoVibes ? '#ff4444' : '#222', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: '6px', cursor: 'pointer' }}>
            {editandoVibes ? 'Cerrar Edición' : 'Configurar Vitrina'}
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          {[0, 1, 2].map((i) => {
            const vibe = editandoVibes ? tempVibes[i] : perfilData.vibes[i];
            const artista = vibe && vibe.artistId ? artistasDB[vibe.artistId] : null;
            const era = artista && vibe.eraIndex !== undefined && artista.eras ? artista.eras[vibe.eraIndex] : null;

            return (
              <div key={i} style={{ background: '#0a0a0a', borderRadius: '12px', border: '1px solid #222', overflow: 'hidden' }}>
                <div style={{ height: '220px', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                  {era ? (
                    <>
                      <img src={era.img} alt={era.titulo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '15px', background: 'linear-gradient(transparent, rgba(0,0,0,0.9))' }}>
                        <span style={{ fontSize: '0.7rem', color: 'var(--accent-color)', textTransform: 'uppercase' }}>{artista.nombre}</span>
                        <h4 style={{ margin: '0', fontSize: '1rem', color: '#fff' }}>{era.titulo}</h4>
                      </div>
                    </>
                  ) : (
                    <i className="fa-solid fa-compact-disc" style={{ fontSize: '3rem', color: '#1a1a1a' }}></i>
                  )}
                </div>

                {editandoVibes && (
                  <div style={{ padding: '15px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <select value={vibe?.artistId || ''} onChange={(e) => handleSelectVibe(i, e.target.value, 0)} style={{ background: '#111', color: '#fff', border: '1px solid #333', padding: '8px', borderRadius: '4px' }}>
                      <option value="">Seleccionar Artista...</option>
                      {Object.keys(artistasDB).map(id => <option key={id} value={id}>{artistasDB[id].nombre}</option>)}
                    </select>
                    {vibe?.artistId && artistasDB[vibe.artistId]?.eras && (
                      <select value={vibe?.eraIndex || 0} onChange={(e) => handleSelectVibe(i, vibe.artistId, e.target.value)} style={{ background: '#111', color: 'var(--accent-color)', border: '1px solid #333', padding: '8px', borderRadius: '4px' }}>
                        {artistasDB[vibe.artistId].eras.map((e, idx) => <option key={idx} value={idx}>{e.titulo} ({e.año})</option>)}
                      </select>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {editandoVibes && (
          <button onClick={handleGuardarCambios} style={{ marginTop: '20px', width: '100%', background: 'var(--accent-color)', color: '#000', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
            GUARDAR VITRINA EN LA NUBE
          </button>
        )}
      </section>

      {/* ENLACE NEURAL SPOTIFY // ADN SONORO & REPRODUCTOR */}
      <SpotifyProfileWidget userAuthName={user?.displayName} />

      {/* MIS CINTAS Y ECHO-SAFE */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
        
        {/* SECCIÓN BEAT IT */}
        <section style={{ background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: '15px', padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #222', paddingBottom: '15px', marginBottom: '20px' }}>
            <h2 style={{ color: 'var(--accent-color)', margin: 0, fontSize: '1.5rem' }}><i className="fa-solid fa-compact-disc" style={{ marginRight: '10px' }}></i> Mis Cintas</h2>
            <Link to="/beat-it" style={{ color: '#000', background: 'var(--accent-color)', padding: '6px 15px', borderRadius: '4px', textDecoration: 'none', fontWeight: 'bold', fontSize: '0.8rem' }}>+ NUEVO BEAT</Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '350px', overflowY: 'auto' }}>
            {misBeats.length === 0 ? (
              <p style={{ color: '#444', textAlign: 'center' }}>Aún no has guardado beats.</p>
            ) : (
              misBeats.map(beat => (
                <Link
                  to={`/beat-it?beatId=${encodeURIComponent(beat.id)}`}
                  state={{ beatData: beat }}
                  key={beat.id}
                  style={{ textDecoration: 'none', background: '#111', padding: '15px', borderRadius: '8px', border: '1px solid #222', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: '0.2s' }}
                  onMouseOver={e => e.currentTarget.style.borderColor = 'var(--accent-color)'}
                  onMouseOut={e => e.currentTarget.style.borderColor = '#222'}
                >
                  <div>
                    <h4 style={{ color: '#fff', margin: 0 }}>{beat.name}</h4>
                    <span style={{ fontSize: '0.7rem', color: '#666' }}>{beat.kit} • {beat.tempo} BPM</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.68rem', color: 'var(--accent-color)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>Abrir</span>
                    <i className="fa-solid fa-chevron-right" style={{ color: 'var(--accent-color)', fontSize: '0.8rem' }}></i>
                  </div>
                </Link>
              ))
            )}
          </div>
        </section>

        {/* SECCIÓN ECHO-SAFE */}
        <section style={{ background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: '15px', padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #222', paddingBottom: '15px', marginBottom: '20px' }}>
            <h2 style={{ color: '#00aaff', margin: 0, fontSize: '1.5rem' }}><i className="fa-solid fa-map-location-dot" style={{ marginRight: '10px' }}></i> Echo-Safe</h2>
            <Link to="/echo-safe" style={{ color: '#000', background: '#00aaff', padding: '6px 15px', borderRadius: '4px', textDecoration: 'none', fontWeight: 'bold', fontSize: '0.8rem' }}>+ NUEVO MAPEO</Link>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '350px', overflowY: 'auto', paddingRight: '5px' }}>
            {misReportes.length === 0 ? (
              <p style={{ color: '#444', textAlign: 'center', marginTop: '20px' }}>Aún no has mapeado ninguna zona.</p>
            ) : (
              misReportes.map(rep => (
                <div key={rep.id} style={{ background: '#111', padding: '15px', borderRadius: '8px', borderLeft: `4px solid ${rep.db > 75 ? '#f43f5e' : '#00ffcc'}`, borderTop: '1px solid #222', borderRight: '1px solid #222', borderBottom: '1px solid #222', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ overflow: 'hidden' }}>
                    <h4 style={{ color: '#fff', margin: '0 0 5px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {rep.db} dB 
                      <span style={{ fontSize: '0.7rem', color: '#666', fontWeight: 'normal' }}>
                        {rep.fecha ? rep.fecha.split(',')[0] : 'Reciente'}
                      </span>
                    </h4>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#aaa', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '220px' }}>
                      {rep.descripcion}
                    </p>
                  </div>
                  <i className="fa-solid fa-satellite-dish" style={{ color: rep.db > 75 ? '#f43f5e' : '#00ffcc', opacity: 0.6, fontSize: '1.2rem' }}></i>
                </div>
              ))
            )}
          </div>
        </section>

      </div>

      {/* MODAL DE CAMBIO DE FOTO DE PERFIL */}
      {editandoFoto && (
        <div
          onClick={cerrarModalFoto}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: '#0d0d14', border: '1px solid var(--accent-color)', borderRadius: '16px', padding: '1.8rem', width: '100%', maxWidth: '480px', boxShadow: '0 0 40px rgba(0,255,204,0.15)', maxHeight: '90vh', overflowY: 'auto' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
              <h3 style={{ margin: 0, color: '#fff', fontSize: '1.15rem', letterSpacing: '1px', textTransform: 'uppercase' }}>
                <i className="fa-solid fa-camera" style={{ color: 'var(--accent-color)', marginRight: '10px' }}></i>
                Foto de Perfil
              </h3>
              <button onClick={cerrarModalFoto} disabled={guardandoFoto} style={{ background: 'transparent', border: 'none', color: '#888', fontSize: '1.2rem', cursor: guardandoFoto ? 'not-allowed' : 'pointer' }}>✕</button>
            </div>

            {/* Vista previa */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.2rem' }}>
              <div style={{ width: '110px', height: '110px', borderRadius: '50%', overflow: 'hidden', border: `3px solid ${errorFoto ? '#ff4444' : 'var(--accent-color)'}`, background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {tempFotoURL.trim() && !errorFoto ? (
                  <img
                    src={tempFotoURL.trim()}
                    alt="Vista previa"
                    onError={() => setErrorFoto('No se pudo cargar la imagen. Revisa que la URL sea pública y directa.')}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <i className="fa-solid fa-user" style={{ fontSize: '2.5rem', color: '#333' }}></i>
                )}
              </div>
            </div>

            {/* Avatares predefinidos */}
            <p style={{ color: '#888', fontSize: '0.72rem', fontWeight: 'bold', letterSpacing: '1px', textTransform: 'uppercase', margin: '0 0 8px 0' }}>Avatares de la Bóveda</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '8px', marginBottom: '1.2rem' }}>
              {AVATARES_PREDEFINIDOS.map((av) => (
                <button
                  key={av.nombre}
                  type="button"
                  title={av.nombre}
                  onClick={() => { setTempFotoURL(av.url); setErrorFoto(''); }}
                  disabled={guardandoFoto}
                  style={{ padding: 0, aspectRatio: '1', borderRadius: '50%', overflow: 'hidden', cursor: 'pointer', background: 'none', border: tempFotoURL === av.url ? '2px solid var(--accent-color)' : '2px solid #222', boxShadow: tempFotoURL === av.url ? '0 0 10px var(--accent-color)' : 'none' }}
                >
                  <img src={av.url} alt={av.nombre} style={{ width: '100%', height: '100%', display: 'block' }} />
                </button>
              ))}
            </div>

            {/* URL personalizada */}
            <p style={{ color: '#888', fontSize: '0.72rem', fontWeight: 'bold', letterSpacing: '1px', textTransform: 'uppercase', margin: '0 0 8px 0' }}>O pega la URL de una imagen</p>
            <input
              type="url"
              placeholder="https://ejemplo.com/mi-foto.jpg"
              value={tempFotoURL.startsWith('data:') ? '' : tempFotoURL}
              onChange={(e) => { setTempFotoURL(e.target.value); setErrorFoto(''); }}
              disabled={guardandoFoto}
              style={{ width: '100%', boxSizing: 'border-box', background: '#111', color: '#fff', border: '1px solid #333', padding: '10px 12px', borderRadius: '6px', outline: 'none', fontSize: '0.85rem' }}
            />

            {errorFoto && <p style={{ color: '#ff4444', fontSize: '0.78rem', margin: '10px 0 0 0' }}>{errorFoto}</p>}

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '1.4rem' }}>
              <button onClick={cerrarModalFoto} disabled={guardandoFoto} style={{ background: 'transparent', color: '#888', border: '1px solid #333', padding: '9px 18px', borderRadius: '6px', cursor: guardandoFoto ? 'not-allowed' : 'pointer' }}>Cancelar</button>
              <button
                onClick={handleGuardarFoto}
                disabled={guardandoFoto || !tempFotoURL.trim()}
                style={{ background: 'var(--accent-color)', color: '#000', border: 'none', padding: '9px 20px', borderRadius: '6px', fontWeight: 'bold', cursor: (guardandoFoto || !tempFotoURL.trim()) ? 'not-allowed' : 'pointer', opacity: (guardandoFoto || !tempFotoURL.trim()) ? 0.5 : 1 }}
              >
                {guardandoFoto ? 'GUARDANDO...' : 'GUARDAR FOTO'}
              </button>
            </div>
          </div>
        </div>
      )}

      <EchoToast toasts={toasts} onDismiss={dismissToast} />
    </main>
  );
}