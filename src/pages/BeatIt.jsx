import { useState, useEffect, useRef } from 'react';
// IMPORTAMOS FIREBASE (Ajusta la ruta '../firebase' según donde tengas tu archivo)
import { db, auth } from '../firebase/config'; 
import { collection, addDoc, getDocs, query, where, orderBy } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

// --- CONFIGURACIÓN DE LOS KITS ---
const SOUND_KITS = {
  "80s Pop": {
    kick: 'https://s3.amazonaws.com/freecodecamp/drums/RP4_KICK_1.mp3',
    snare: 'https://s3.amazonaws.com/freecodecamp/drums/Brk_Snr.mp3',
    hihat: 'https://s3.amazonaws.com/freecodecamp/drums/Cev_H2.mp3',
    clap: 'https://s3.amazonaws.com/freecodecamp/drums/Heater-6.mp3'
  },
  "Funk & Silk": {
    kick: 'https://s3.amazonaws.com/freecodecamp/drums/punchy_kick_1.mp3',
    snare: 'https://s3.amazonaws.com/freecodecamp/drums/side_stick_1.mp3',
    hihat: 'https://s3.amazonaws.com/freecodecamp/drums/Bld_H1.mp3',
    clap: 'https://s3.amazonaws.com/freecodecamp/drums/Give_us_a_light.mp3'
  }
};

const INSTRUMENTS = ['kick', 'snare', 'hihat', 'clap'];
const STEPS = 16; 

export default function BeatIt() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [tempo, setTempo] = useState(120); 
  const [currentStep, setCurrentStep] = useState(0);
  const [currentKit, setCurrentKit] = useState("80s Pop");
  const [isLoFi, setIsLoFi] = useState(false);
  
  const vinylAudio = useRef(null);

  const [grid, setGrid] = useState(() => {
    const initialGrid = {};
    INSTRUMENTS.forEach(inst => {
      initialGrid[inst] = Array(STEPS).fill(false);
    });
    return initialGrid;
  });

  // --- ESTADOS PARA FIREBASE ---
  const [beatName, setBeatName] = useState('');
  const [savedBeats, setSavedBeats] = useState([]); 
  const [user, setUser] = useState(null); // Guardamos quién está logueado
  const [isSaving, setIsSaving] = useState(false); // Para mostrar un "Guardando..."

  // --- DETECTAR USUARIO LOGUEADO Y TRAER SUS BEATS ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Si hay usuario, vamos a Firestore por sus cintas
        try {
          const q = query(
            collection(db, "beats"), 
            where("userId", "==", currentUser.uid)
          );
          const querySnapshot = await getDocs(q);
          const beatsNube = [];
          querySnapshot.forEach((doc) => {
            beatsNube.push({ id: doc.id, ...doc.data() });
          });
          setSavedBeats(beatsNube);
        } catch (error) {
          console.error("Error trayendo las cintas de la nube: ", error);
        }
      } else {
        setSavedBeats([]); // Si no hay nadie, limpiamos la discoteca
      }
    });

    return () => unsubscribe();
  }, []);

  const playSound = (instrument) => {
    const audioUrl = SOUND_KITS[currentKit][instrument];
    const audio = new Audio(audioUrl);
    audio.currentTime = 0; 
    
    if (isLoFi) {
      audio.volume = 0.3; 
      audio.playbackRate = 0.85; 
    } else {
      audio.volume = 1;
      audio.playbackRate = 1;
    }
    
    audio.play().catch(e => console.log("Cargando audio..."));
  };

  useEffect(() => {
    let interval;
    if (isPlaying) {
      const stepDuration = (60000 / tempo) / 4; 
      interval = setInterval(() => {
        setCurrentStep((prevStep) => (prevStep + 1) % STEPS);
      }, stepDuration);
    } else {
      setCurrentStep(0); 
    }
    return () => clearInterval(interval);
  }, [isPlaying, tempo]);

  useEffect(() => {
    if (isPlaying) {
      INSTRUMENTS.forEach(inst => {
        if (grid[inst][currentStep]) {
          playSound(inst);
        }
      });
    }
  }, [currentStep, isPlaying]);

  useEffect(() => {
    if (isLoFi) {
      vinylAudio.current.volume = 1.0; 
      vinylAudio.current.play().catch(e => console.log("Esperando vinilo..."));
    } else {
      vinylAudio.current.pause();
    }
  }, [isLoFi]);

  const toggleStep = (instrument, stepIndex) => {
    const newGrid = { ...grid };
    newGrid[instrument] = [...grid[instrument]]; 
    newGrid[instrument][stepIndex] = !newGrid[instrument][stepIndex];
    setGrid(newGrid);
    if (newGrid[instrument][stepIndex]) playSound(instrument);
  };

  // --- GUARDAR EL BEAT EN FIREBASE ---
  const handleSaveBeat = async () => {
    if (!user) {
      alert("¡Debes iniciar sesión para guardar tus beats en The Sonic Vault!");
      return;
    }
    if (beatName.trim() === '') {
      alert("¡Ponle un nombre a tu obra maestra!");
      return;
    }

    setIsSaving(true);
    const snapshotGrid = JSON.parse(JSON.stringify(grid));

    const newBeat = {
      userId: user.uid, // ¡Atado a la cuenta del usuario!
      name: beatName,
      tempo: tempo,
      kit: currentKit,
      isLoFi: isLoFi,
      gridData: snapshotGrid, 
      date: new Date().toLocaleDateString(),
      timestamp: new Date()
    };

    try {
      // Disparamos a la colección "beats" en Firestore
      const docRef = await addDoc(collection(db, "beats"), newBeat);
      
      // Actualizamos el estado local para verlo de inmediato sin recargar
      setSavedBeats([...savedBeats, { id: docRef.id, ...newBeat }]);
      setBeatName(''); 
      
      const emptyGrid = {};
      INSTRUMENTS.forEach(inst => emptyGrid[inst] = Array(STEPS).fill(false));
      setGrid(emptyGrid);
      setIsPlaying(false);
      
    } catch (error) {
      console.error("Error guardando en la nube: ", error);
      alert("Hubo un error guardando tu cinta.");
    } finally {
      setIsSaving(false);
    }
  };

  const loadBeat = (beatToLoad) => {
    setIsPlaying(false); 
    setGrid(beatToLoad.gridData);
    setTempo(beatToLoad.tempo);
    setCurrentKit(beatToLoad.kit);
    setIsLoFi(beatToLoad.isLoFi);
    setCurrentStep(0);
  };

  return (
    <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2rem', background: '#050505' }}>
      
      <audio ref={vinylAudio} src="https://ia800806.us.archive.org/15/items/VinylScratchAndCrackle/vinyl-scratch-and-crackle.mp3" loop />

      <div style={{ background: '#111', padding: '2rem', borderRadius: '16px', border: '1px solid #333', width: '100%', maxWidth: '900px', boxShadow: isLoFi ? '0 10px 50px rgba(255, 170, 0, 0.1)' : '0 10px 50px rgba(0,0,0,0.8)', transition: '0.5s', marginBottom: '2rem' }}>
        
        <div style={{ background: isLoFi ? '#1a1300' : '#0a0a0a', height: '100px', borderRadius: '8px', marginBottom: '2rem', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: '30px', padding: '15px', border: '1px inset #222', transition: '0.5s' }}>
          {INSTRUMENTS.map((inst, idx) => {
            const isFiring = isPlaying && grid[inst][currentStep];
            return (
               <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                 <div style={{ width: '40px', height: isFiring ? '70px' : '15px', background: isFiring ? (isLoFi ? '#ffaa00' : 'var(--accent-color, #00ffcc)') : '#222', transition: isFiring ? 'height 0.05s ease-out' : 'height 0.2s ease-in', borderRadius: '4px', boxShadow: isFiring ? `0 0 20px ${isLoFi ? '#ffaa00' : 'var(--accent-color, #00ffcc)'}` : 'none' }} />
                 <span style={{ fontSize: '0.65rem', color: '#666', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '1px' }}>{inst}</span>
               </div>
            )
          })}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ color: '#fff', margin: '0 0 5px 0', letterSpacing: '2px' }}>ESTUDIO BEAT IT</h2>
            <p style={{ color: 'var(--accent-color, #00ffcc)', margin: 0, fontSize: '0.8rem', textTransform: 'uppercase' }}>
              {user ? `Estudio de ${user.displayName || 'Usuario'}` : 'Inicia sesión para guardar'}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', background: '#0a0a0a', padding: '10px 20px', borderRadius: '8px', border: '1px solid #222' }}>
            <select value={currentKit} onChange={(e) => setCurrentKit(e.target.value)} style={{ background: '#1a1a1a', color: '#fff', border: '1px solid #444', padding: '8px', borderRadius: '4px', outline: 'none', cursor: 'pointer' }}>
              {Object.keys(SOUND_KITS).map(kit => <option key={kit} value={kit}>{kit}</option>)}
            </select>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ color: '#888', fontSize: '0.8rem' }}>BPM</span>
              <input type="number" value={tempo} onChange={(e) => setTempo(Number(e.target.value))} min="60" max="200" style={{ width: '60px', background: '#1a1a1a', color: '#fff', border: '1px solid #444', padding: '5px', borderRadius: '4px', textAlign: 'center' }} />
            </div>

            <button onClick={() => setIsLoFi(!isLoFi)} style={{ background: isLoFi ? '#ffaa00' : '#1a1a1a', color: isLoFi ? '#000' : '#888', border: `1px solid ${isLoFi ? '#ffaa00' : '#444'}`, padding: '8px 15px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: '0.3s' }}>
              <i className="fa-solid fa-record-vinyl" style={{ animation: isLoFi ? 'spin 2s linear infinite' : 'none' }}></i> LO-FI
            </button>

            <button onClick={() => setIsPlaying(!isPlaying)} style={{ background: isPlaying ? '#ff4444' : 'var(--accent-color, #00ffcc)', color: '#000', border: 'none', padding: '10px 20px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: '0.2s' }}>
              <i className={`fa-solid ${isPlaying ? 'fa-stop' : 'fa-play'}`}></i> {isPlaying ? 'DETENER' : 'REPRODUCIR'}
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '2rem' }}>
          {INSTRUMENTS.map((inst) => (
            <div key={inst} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '80px', color: '#aaa', textTransform: 'uppercase', fontSize: '0.8rem', fontWeight: 'bold', letterSpacing: '1px' }}>{inst}</div>
              <div style={{ display: 'flex', flex: 1, gap: '6px' }}>
                {grid[inst].map((isActive, index) => {
                  const isCurrentStep = isPlaying && currentStep === index;
                  const activeColor = isLoFi ? '#ffaa00' : 'var(--accent-color, #00ffcc)';
                  return (
                    <div 
                      key={index} onClick={() => toggleStep(inst, index)}
                      style={{ flex: 1, height: '40px', borderRadius: '4px', cursor: 'pointer', transition: '0.1s', background: isActive ? activeColor : (index % 4 === 0 ? '#222' : '#151515'), border: isCurrentStep ? '2px solid #fff' : '1px solid #333', opacity: isActive ? 1 : 0.6 }}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div style={{ borderTop: '1px dashed #333', paddingTop: '20px', display: 'flex', gap: '10px', alignItems: 'center', justifyContent: 'flex-end' }}>
          <input 
            type="text" 
            placeholder="Nombre de tu Beat..." 
            value={beatName}
            onChange={(e) => setBeatName(e.target.value)}
            maxLength="25"
            disabled={!user || isSaving}
            style={{ background: '#1a1a1a', color: '#fff', border: '1px solid #444', padding: '10px 15px', borderRadius: '6px', width: '250px', outline: 'none', opacity: !user ? 0.5 : 1 }}
          />
          <button 
            onClick={handleSaveBeat}
            disabled={!user || isSaving}
            style={{ background: '#fff', color: '#000', border: 'none', padding: '10px 20px', borderRadius: '6px', fontWeight: 'bold', cursor: (!user || isSaving) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px', opacity: (!user || isSaving) ? 0.5 : 1 }}
          >
            <i className="fa-solid fa-cloud-arrow-up"></i> {isSaving ? 'GUARDANDO...' : 'GUARDAR EN NUBE'}
          </button>
        </div>
        {!user && <p style={{ color: '#ff4444', textAlign: 'right', fontSize: '0.8rem', marginTop: '10px' }}>Inicia sesión para guardar en la nube.</p>}
      </div>

      {user && savedBeats.length > 0 && (
        <div style={{ background: '#111', padding: '2rem', borderRadius: '16px', border: '1px solid #333', width: '100%', maxWidth: '900px', animation: 'fadeIn 0.5s ease' }}>
          <h3 style={{ color: '#fff', marginTop: 0, marginBottom: '20px', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <i className="fa-solid fa-cloud" style={{ color: 'var(--accent-color)' }}></i> CINTAS EN LA BÓVEDA
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '15px' }}>
            {savedBeats.map((beat) => (
              <div key={beat.id} style={{ background: '#0a0a0a', border: '1px solid #222', borderRadius: '8px', padding: '15px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '1.1rem' }}>{beat.name}</span>
                  {beat.isLoFi && <span style={{ background: '#ffaa00', color: '#000', fontSize: '0.6rem', padding: '2px 6px', borderRadius: '10px', fontWeight: 'bold' }}>LO-FI</span>}
                </div>
                
                <div style={{ display: 'flex', gap: '10px', fontSize: '0.8rem', color: '#888' }}>
                  <span><i className="fa-solid fa-drum"></i> {beat.kit}</span>
                  <span><i className="fa-solid fa-stopwatch"></i> {beat.tempo} BPM</span>
                </div>
                
                <button 
                  onClick={() => loadBeat(beat)}
                  style={{ background: '#222', color: '#fff', border: '1px solid #444', padding: '8px', borderRadius: '4px', cursor: 'pointer', width: '100%', marginTop: '5px', transition: '0.2s' }}
                  onMouseOver={(e) => e.target.style.background = 'var(--accent-color)'}
                  onMouseOut={(e) => e.target.style.background = '#222'}
                >
                  <i className="fa-solid fa-download"></i> CARGAR AL ESTUDIO
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );
}