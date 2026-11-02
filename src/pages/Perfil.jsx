import { useState, useEffect } from 'react';
import { auth, db } from '../firebase/config';
import { updateProfile } from 'firebase/auth';
import { useAuth } from '../context/AuthContext';
import { collection, getDocs, query, where, doc, getDoc, setDoc, deleteDoc, increment, onSnapshot } from 'firebase/firestore';
import { Link, useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
  const { user, updateUserPhoto } = useAuth();
  const { toasts, showToast, dismissToast } = useToast();
  const [misBeats, setMisBeats] = useState([]);
  const [misReportes, setMisReportes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [artistasDB, setArtistasDB] = useState({});

  // PerfilData: bio y vibes (solo guardamos artistId y eraIndex)
  const [perfilData, setPerfilData] = useState({ bio: '', biografia: '', ciudad: '', nombre: '', vibes: [null, null, null] });
  const [tempNombre, setTempNombre] = useState('');
  const [tempCiudad, setTempCiudad] = useState('');
  
  const [editandoBio, setEditandoBio] = useState(false);
  const [tempBio, setTempBio] = useState('');

  const [editandoVibes, setEditandoVibes] = useState(false);
  const [tempVibes, setTempVibes] = useState([null, null, null]);

  // Estado para el modal de cambio de foto
  const [editandoFoto, setEditandoFoto] = useState(false);
  const [tempFotoURL, setTempFotoURL] = useState('');
  const [guardandoFoto, setGuardandoFoto] = useState(false);
  const [errorFoto, setErrorFoto] = useState('');
  const [beatAEliminar, setBeatAEliminar] = useState(null);
  const [eliminandoBeat, setEliminandoBeat] = useState(false);

  // Carga inicial (Auth, Beats y Perfil)
  useEffect(() => {
    const cargarPerfil = async () => {
      if (!user?.uid) {
        setCargando(false);
        return;
      }
      try {
        // 1. Cargar Beats desde la nube
        const qBeats = query(collection(db, "beats"), where("userId", "==", user.uid));
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
        const userDocRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userDocRef);
        
        if (userSnap.exists()) {
          const data = userSnap.data();
          const vibesData = data.vibes || [null, null, null];
          const biografiaTexto = data.biografia ?? data.bio ?? '';
          const nombreGuardado = data.nombre || user.displayName || '';
          const ciudadGuardada = data.ciudad || '';
          setPerfilData({
            bio: biografiaTexto,
            biografia: biografiaTexto,
            nombre: nombreGuardado,
            ciudad: ciudadGuardada,
            vibes: vibesData
          });
          setTempNombre(nombreGuardado);
          setTempCiudad(ciudadGuardada);
          setTempBio(biografiaTexto);
          setTempVibes(vibesData);
        } else {
          setTempNombre(user.displayName || '');
        }
      } catch (error) {
        console.error("Error al cargar datos del perfil:", error);
      } finally {
        setCargando(false);
      }
    };
    cargarPerfil();
  }, [user?.uid, user?.displayName]);

  // Escuchador en tiempo real para Echo-Safe
  useEffect(() => {
    if (!user?.uid) return; 

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
  }, [user?.uid]);

  // --- FUNCIÓN ÚNICA DE GUARDADO (A prueba de balas) ---
    const handleGuardarCambios = async () => {
    try {
      const userDocRef = doc(db, "users", user.uid);
      const nombreLimpio = tempNombre.trim() || user.displayName || 'Explorador Sónico';
      const ciudadLimpia = tempCiudad.trim();

      const nuevosDatos = {
        ...perfilData,
        nombre: nombreLimpio,
        ciudad: ciudadLimpia,
        biografia: tempBio,
        bio: tempBio,
        vibes: tempVibes
      };
      
      await setDoc(userDocRef, nuevosDatos, { merge: true });

      // Actualizar el displayName en Firebase Auth si cambió
      if (nombreLimpio && nombreLimpio !== user.displayName && auth.currentUser) {
        await updateProfile(auth.currentUser, { displayName: nombreLimpio });
        await auth.currentUser.reload();
      }
      
      setPerfilData(nuevosDatos);
      setEditandoBio(false);
      setEditandoVibes(false);
      
      showToast('success', 'Bóveda Actualizada', '¡Tus datos, biografía y vitrina han sido sincronizados en la nube!');
      
    } catch (error) {
      console.error("Error al guardar en Firestore:", error);
      showToast('error', 'Fallo al Guardar', error.message || 'No se pudo actualizar la información en la nube.');
    }
  };

  // --- ELIMINAR BEAT DESDE EL PERFIL CON DECREMENTO ATÓMICO ---
  const handleConfirmarEliminarBeat = async () => {
    if (!user?.uid || !beatAEliminar?.id) return;
    setEliminandoBeat(true);
    const targetId = beatAEliminar.id;
    const targetName = beatAEliminar.name || 'Cinta';
    try {
      await deleteDoc(doc(db, 'beats', targetId));
      try {
        await setDoc(doc(db, 'stats', 'global'), { beats: increment(-1) }, { merge: true });
      } catch (statsErr) {
        console.error('No se pudo descontar el contador global de beats:', statsErr);
      }
      setMisBeats((prev) => prev.filter((b) => b.id !== targetId));
      setBeatAEliminar(null);
      showToast('info', 'Cinta Eliminada', `"${targetName}" fue eliminada permanentemente de tu Bóveda.`);
    } catch (error) {
      console.error('Error al eliminar beat desde perfil:', error);
      showToast('error', 'Fallo al Eliminar', 'No se pudo eliminar la cinta de la nube.');
    } finally {
      setEliminandoBeat(false);
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
    const esAvatarPredefinido = AVATARES_PREDEFINIDOS.some((a) => a.url === url);
    const esHttpsValida = /^https:\/\/[^\s<>"'`]+$/i.test(url) && url.length <= 512;

    if (!esAvatarPredefinido && !esHttpsValida) {
      setErrorFoto('Ingresa una URL segura (https://) de hasta 512 caracteres o elige un avatar predefinido.');
      return;
    }

    setGuardandoFoto(true);
    setErrorFoto('');
    try {
      await updateUserPhoto(url);
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h1 style={{ margin: '0 0 5px 0', fontSize: '2.5rem', textTransform: 'uppercase', color: '#fff' }}>
                {perfilData.nombre || user?.displayName || 'Explorador Sónico'}
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap', margin: '0 0 15px 0' }}>
                <p style={{ color: '#888', margin: 0, fontSize: '0.88rem' }}>
                  <i className="fa-solid fa-envelope" style={{ marginRight: '6px' }} />
                  {user?.email}
                </p>
                <p style={{ color: 'var(--accent-color)', margin: 0, fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <i className="fa-solid fa-location-dot" />
                  <span>{perfilData.ciudad || 'Base no especificada'}</span>
                </p>
              </div>
            </div>

            {!editandoBio && (
              <button
                type="button"
                onClick={() => {
                  setTempNombre(perfilData.nombre || user?.displayName || '');
                  setTempCiudad(perfilData.ciudad || '');
                  setTempBio(perfilData.biografia || perfilData.bio || '');
                  setEditandoBio(true);
                }}
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  color: 'var(--accent-color)',
                  border: '1px solid var(--accent-color)',
                  padding: '7px 14px',
                  borderRadius: '6px',
                  fontSize: '0.78rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: '0.2s'
                }}
              >
                <i className="fa-solid fa-pen-to-square" /> EDITAR PERFIL
              </button>
            )}
          </div>
          
          <div style={{ background: '#0a0a0a', padding: '16px', borderRadius: '10px', border: '1px solid #1a1a1a' }}>
            {editandoBio ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: '180px' }}>
                    <label style={{ display: 'block', fontSize: '0.72rem', color: '#888', fontWeight: 'bold', marginBottom: '4px' }}>
                      NOMBRE PÚBLICO:
                    </label>
                    <input
                      type="text"
                      value={tempNombre}
                      onChange={(e) => setTempNombre(e.target.value)}
                      maxLength={35}
                      placeholder="Tu nombre de explorador..."
                      style={{ width: '100%', background: '#111', color: '#fff', border: '1px solid #333', padding: '8px 12px', borderRadius: '6px', outline: 'none', fontSize: '0.85rem' }}
                    />
                  </div>
                  <div style={{ flex: 1, minWidth: '180px' }}>
                    <label style={{ display: 'block', fontSize: '0.72rem', color: '#888', fontWeight: 'bold', marginBottom: '4px' }}>
                      CIUDAD / BASE OPERATIVA:
                    </label>
                    <input
                      type="text"
                      value={tempCiudad}
                      onChange={(e) => setTempCiudad(e.target.value)}
                      maxLength={40}
                      placeholder="Ej: Medellín, CO"
                      style={{ width: '100%', background: '#111', color: '#fff', border: '1px solid #333', padding: '8px 12px', borderRadius: '6px', outline: 'none', fontSize: '0.85rem' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', color: '#888', fontWeight: 'bold', marginBottom: '4px' }}>
                    BIOGRAFÍA / MANIFIESTO:
                  </label>
                  <textarea
                    value={tempBio}
                    onChange={(e) => setTempBio(e.target.value)}
                    maxLength={280}
                    placeholder="Cuéntale a la Bóveda tu conexión con la música..."
                    style={{ width: '100%', background: '#111', color: '#fff', border: '1px solid #333', padding: '10px', borderRadius: '6px', minHeight: '80px', resize: 'none', outline: 'none', fontSize: '0.85rem' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => setEditandoBio(false)}
                    style={{ background: 'transparent', color: '#888', border: 'none', cursor: 'pointer', fontSize: '0.82rem', padding: '6px 12px' }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleGuardarCambios}
                    style={{ background: 'var(--accent-color)', color: '#000', border: 'none', padding: '6px 18px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.82rem' }}
                  >
                    Guardar Perfil
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <p style={{ color: '#ddd', margin: 0, lineHeight: '1.6', fontSize: '0.92rem' }}>
                  {perfilData.biografia || perfilData.bio || "Sin biografía registrada. Haz clic en 'Editar Perfil' para personalizar tu expediente sónico."}
                </p>
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
              misBeats.map((beat) => (
                <div
                  key={beat.id}
                  style={{
                    background: '#111',
                    padding: '13px 15px',
                    borderRadius: '8px',
                    border: '1px solid #222',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    transition: '0.2s',
                    gap: '10px'
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.borderColor = 'var(--accent-color)')}
                  onMouseOut={(e) => (e.currentTarget.style.borderColor = '#222')}
                >
                  <Link
                    to={`/beat-it?beatId=${encodeURIComponent(beat.id)}`}
                    state={{ beatData: beat }}
                    style={{
                      textDecoration: 'none',
                      flex: 1,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '10px'
                    }}
                  >
                    <div>
                      <h4 style={{ color: '#fff', margin: 0 }}>{beat.name}</h4>
                      <span style={{ fontSize: '0.7rem', color: '#666' }}>
                        {beat.kit} • {beat.tempo} BPM
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          fontSize: '0.68rem',
                          color: 'var(--accent-color)',
                          textTransform: 'uppercase',
                          letterSpacing: '1px',
                          fontWeight: 'bold'
                        }}
                      >
                        Abrir
                      </span>
                      <i className="fa-solid fa-chevron-right" style={{ color: 'var(--accent-color)', fontSize: '0.8rem' }} />
                    </div>
                  </Link>
                  <button
                    type="button"
                    onClick={() => setBeatAEliminar(beat)}
                    title="Eliminar esta cinta de tu Bóveda"
                    style={{
                      background: 'rgba(255, 68, 68, 0.08)',
                      color: '#ff5555',
                      border: '1px solid rgba(255, 68, 68, 0.3)',
                      borderRadius: '6px',
                      padding: '7px 10px',
                      cursor: 'pointer',
                      transition: '0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(255, 68, 68, 0.22)')}
                    onMouseOut={(e) => (e.currentTarget.style.background = 'rgba(255, 68, 68, 0.08)')}
                  >
                    <i className="fa-solid fa-trash-can" style={{ fontSize: '0.82rem' }} />
                  </button>
                </div>
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
                            misReportes.map((rep) => {
                const hasCoords = rep.lat && rep.lng;
                return (
                  <div
                    key={rep.id}
                    onClick={() => {
                      if (hasCoords) {
                        navigate('/echo-safe', {
                          state: {
                            targetCoords: [Number(rep.lat), Number(rep.lng)],
                            reportId: rep.id
                          }
                        });
                      }
                    }}
                    title={hasCoords ? "Clic para volar y enfocar este nodo en el Radar Echo-Safe" : "Reporte registrado"}
                    style={{
                      background: '#111',
                      padding: '13px 16px',
                      borderRadius: '8px',
                      borderLeft: `4px solid ${rep.db > 75 ? '#f43f5e' : '#00ffcc'}`,
                      borderTop: '1px solid #222',
                      borderRight: '1px solid #222',
                      borderBottom: '1px solid #222',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      cursor: hasCoords ? 'pointer' : 'default',
                      transition: '0.2s',
                      gap: '10px'
                    }}
                    onMouseOver={(e) => {
                      if (hasCoords) {
                        e.currentTarget.style.borderColor = rep.db > 75 ? '#f43f5e' : '#00ffcc';
                        e.currentTarget.style.transform = 'translateX(4px)';
                      }
                    }}
                    onMouseOut={(e) => {
                      if (hasCoords) {
                        e.currentTarget.style.borderTopColor = '#222';
                        e.currentTarget.style.borderRightColor = '#222';
                        e.currentTarget.style.borderBottomColor = '#222';
                        e.currentTarget.style.transform = 'translateX(0)';
                      }
                    }}
                  >
                    <div style={{ overflow: 'hidden' }}>
                      <h4 style={{ color: '#fff', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {rep.db} dB 
                        <span style={{ fontSize: '0.7rem', color: '#666', fontWeight: 'normal' }}>
                          {rep.fecha ? rep.fecha.split(',')[0] : 'Reciente'}
                        </span>
                      </h4>
                      <p style={{ margin: 0, fontSize: '0.82rem', color: '#aaa', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '210px' }}>
                        {rep.descripcion || 'Sin observaciones'}
                      </p>
                    </div>
                    {hasCoords ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-color)' }}>
                        <span style={{ fontSize: '0.65rem', fontWeight: 'bold', letterSpacing: '0.5px' }}>VER MAPA</span>
                        <i className="fa-solid fa-arrow-up-right-from-square" style={{ fontSize: '0.75rem' }} />
                      </div>
                    ) : (
                      <i className="fa-solid fa-satellite-dish" style={{ color: rep.db > 75 ? '#f43f5e' : '#00ffcc', opacity: 0.6, fontSize: '1.2rem' }} />
                    )}
                  </div>
                );
              })
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

      {/* MODAL DE CONFIRMACIÓN PARA ELIMINAR CINTA DESDE PERFIL */}
      {beatAEliminar && (
        <div
          onClick={() => !eliminandoBeat && setBeatAEliminar(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#0d0d14',
              border: '1px solid rgba(255, 68, 68, 0.45)',
              borderRadius: '16px',
              padding: '1.8rem',
              width: '100%',
              maxWidth: '420px',
              boxShadow: '0 0 35px rgba(255, 68, 68, 0.25)',
              textAlign: 'center'
            }}
          >
            <div
              style={{
                width: '54px',
                height: '54px',
                borderRadius: '50%',
                background: 'rgba(255, 68, 68, 0.12)',
                border: '1px solid rgba(255, 68, 68, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                color: '#ff5555',
                fontSize: '1.4rem'
              }}
            >
              <i className="fa-solid fa-trash-can" />
            </div>
            <h3 style={{ color: '#fff', margin: '0 0 8px 0', fontSize: '1.15rem' }}>
              ¿Eliminar cinta de tu Bóveda?
            </h3>
            <p style={{ color: '#aaa', fontSize: '0.85rem', margin: '0 0 20px 0', lineHeight: '1.5' }}>
              Se eliminará permanentemente <strong style={{ color: '#fff' }}>"{beatAEliminar.name}"</strong> de Cloud Firestore. Esta acción no se puede deshacer.
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                type="button"
                disabled={eliminandoBeat}
                onClick={() => setBeatAEliminar(null)}
                style={{
                  flex: 1,
                  background: 'rgba(255,255,255,0.06)',
                  color: '#ccc',
                  border: '1px solid rgba(255,255,255,0.12)',
                  padding: '10px',
                  borderRadius: '6px',
                  fontWeight: 'bold',
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                CANCELAR
              </button>
              <button
                type="button"
                disabled={eliminandoBeat}
                onClick={handleConfirmarEliminarBeat}
                style={{
                  flex: 1,
                  background: 'linear-gradient(135deg, #ff4444 0%, #cc0033 100%)',
                  color: '#fff',
                  border: 'none',
                  padding: '10px',
                  borderRadius: '6px',
                  fontWeight: 'bold',
                  fontSize: '0.85rem',
                  cursor: eliminandoBeat ? 'wait' : 'pointer',
                  boxShadow: '0 0 12px rgba(255, 68, 68, 0.4)'
                }}
              >
                {eliminandoBeat ? 'ELIMINANDO...' : 'ELIMINAR'}
              </button>
            </div>
          </div>
        </div>
      )}

      <EchoToast toasts={toasts} onDismiss={dismissToast} />
    </main>
  );
}