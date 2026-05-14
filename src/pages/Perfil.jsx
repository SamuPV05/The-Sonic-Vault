import { useState, useEffect } from 'react';
import { db, auth } from '../firebase/config';
import { DATA_ARTISTAS } from '../datos'; 
import { collection, getDocs, query, where, doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { Link } from 'react-router-dom';

export default function Perfil() {
  const [user, setUser] = useState(null);
  const [misBeats, setMisBeats] = useState([]);
  const [misReportes, setMisReportes] = useState([]);
  const [cargando, setCargando] = useState(true);

  // PerfilData: bio y vibes (solo guardamos artistId y eraIndex)
  const [perfilData, setPerfilData] = useState({ bio: '', vibes: [null, null, null] });
  
  const [editandoBio, setEditandoBio] = useState(false);
  const [tempBio, setTempBio] = useState('');

  const [editandoVibes, setEditandoVibes] = useState(false);
  const [tempVibes, setTempVibes] = useState([null, null, null]);

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
          beatsDescargados.sort((a, b) => b.timestamp - a.timestamp);
          setMisBeats(beatsDescargados);

          // 2. Cargar Datos del Perfil (Bio y Vitrina)
          const userDocRef = doc(db, "users", currentUser.uid);
          const userSnap = await getDoc(userDocRef);
          
          if (userSnap.exists()) {
            const data = userSnap.data();
            const vibesData = data.vibes || [null, null, null];
            setPerfilData({ bio: data.bio || '', vibes: vibesData });
            setTempBio(data.bio || '');
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
      reportesData.sort((a, b) => b.timestamp - a.timestamp);
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
        bio: tempBio || "",
        vibes: vibesLimpios
      };

      // Intentamos inyectar el documento
      await setDoc(userDocRef, nuevosDatos, { merge: true });
      
      // Si pasa, actualizamos la pantalla
      setPerfilData(nuevosDatos);
      setEditandoBio(false);
      setEditandoVibes(false);
      
      alert("¡Bóveda personal actualizada con éxito!");
      
    } catch (error) {
      console.error("Error al guardar en Firestore:", error);
      alert("Houston, tenemos un problema: " + error.message);
    }
  };

  const handleSelectVibe = (slotIndex, artistId, eraIndex) => {
    const nuevasVibes = [...tempVibes];
    nuevasVibes[slotIndex] = artistId ? { artistId, eraIndex: parseInt(eraIndex) } : null;
    setTempVibes(nuevasVibes);
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
        <div style={{ width: '120px', height: '120px', borderRadius: '50%', overflow: 'hidden', border: '3px solid var(--accent-color)', flexShrink: 0 }}>
          <img src={user?.photoURL || "https://i.pravatar.cc/150?img=11"} alt="Perfil" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
                <p style={{ color: '#ddd', margin: 0, lineHeight: '1.5' }}>{perfilData.bio || "Agregue su biografía..."}</p>
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
            const artista = vibe && vibe.artistId ? DATA_ARTISTAS[vibe.artistId] : null;
            const era = artista && vibe.eraIndex !== undefined ? artista.eras[vibe.eraIndex] : null;

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
                      {Object.keys(DATA_ARTISTAS).map(id => <option key={id} value={id}>{DATA_ARTISTAS[id].nombre}</option>)}
                    </select>
                    {vibe?.artistId && (
                      <select value={vibe?.eraIndex || 0} onChange={(e) => handleSelectVibe(i, vibe.artistId, e.target.value)} style={{ background: '#111', color: 'var(--accent-color)', border: '1px solid #333', padding: '8px', borderRadius: '4px' }}>
                        {DATA_ARTISTAS[vibe.artistId].eras.map((e, idx) => <option key={idx} value={idx}>{e.titulo} ({e.año})</option>)}
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
                <Link to="/beat-it" key={beat.id} style={{ textDecoration: 'none', background: '#111', padding: '15px', borderRadius: '8px', border: '1px solid #222', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: '0.2s' }} onMouseOver={e => e.currentTarget.style.borderColor = 'var(--accent-color)'} onMouseOut={e => e.currentTarget.style.borderColor = '#222'}>
                  <div>
                    <h4 style={{ color: '#fff', margin: 0 }}>{beat.name}</h4>
                    <span style={{ fontSize: '0.7rem', color: '#666' }}>{beat.kit} • {beat.tempo} BPM</span>
                  </div>
                  <i className="fa-solid fa-chevron-right" style={{ color: '#333' }}></i>
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
    </main>
  );
}