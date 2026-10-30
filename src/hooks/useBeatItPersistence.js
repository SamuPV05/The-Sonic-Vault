import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { collection, addDoc, getDocs, query, where, doc, getDoc, setDoc, increment } from 'firebase/firestore';
import { db } from '../firebase/config';

/**
 * Hook que encapsula la persistencia de Beats en Cloud Firestore,
 * el incremento atómico de stats/global y la hidratación desde /perfil o ?beatId=...
 */
export function useBeatItPersistence({
  user,
  showToast,
  scheduler,
  applyLoadedBeatToScheduler,
  stopPlayback,
  resetGrid
}) {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const initialBeatLoadedRef = useRef(false);

  const [beatName, setBeatName] = useState('');
  const [savedBeats, setSavedBeats] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [loadedBeatNotice, setLoadedBeatNotice] = useState(null);

  // --- DETECTAR USUARIO LOGUEADO Y TRAER SUS BEATS ---
  useEffect(() => {
    const cargarBeatsUsuario = async () => {
      if (!user?.uid) {
        setSavedBeats([]);
        return;
      }
      try {
        const q = query(collection(db, 'beats'), where('userId', '==', user.uid));
        const querySnapshot = await getDocs(q);
        const beatsNube = [];
        querySnapshot.forEach((docSnap) => {
          beatsNube.push({ id: docSnap.id, ...docSnap.data() });
        });
        setSavedBeats(beatsNube);
      } catch (error) {
        console.error('Error trayendo las cintas de la nube: ', error);
      }
    };

    cargarBeatsUsuario();
  }, [user?.uid]);

  // Cargar un beat completo en el estudio
  const loadBeat = useCallback(
    (beatToLoad) => {
      const validKit = applyLoadedBeatToScheduler(beatToLoad);
      setBeatName(beatToLoad.name || '');
      setLoadedBeatNotice({
        name: beatToLoad.name || 'Composición sin título',
        kit: validKit,
        tempo: beatToLoad.tempo || 120
      });
    },
    [applyLoadedBeatToScheduler]
  );

  // Hidratación automática cuando se navega desde /perfil o enlace compartido (?beatId=...)
  useEffect(() => {
    if (initialBeatLoadedRef.current) return;

    const stateBeat = location.state?.beatData;
    const queryBeatId = searchParams.get('beatId');

    if (stateBeat) {
      initialBeatLoadedRef.current = true;
      loadBeat(stateBeat);
      return;
    }

    if (queryBeatId) {
      const fromSaved = savedBeats.find((b) => b.id === queryBeatId);
      if (fromSaved) {
        initialBeatLoadedRef.current = true;
        loadBeat(fromSaved);
        return;
      }

      getDoc(doc(db, 'beats', queryBeatId))
        .then((snap) => {
          if (snap.exists() && !initialBeatLoadedRef.current) {
            initialBeatLoadedRef.current = true;
            loadBeat({ id: snap.id, ...snap.data() });
          }
        })
        .catch((err) => {
          console.error('Error cargando beat por ID:', err);
        });
    }
  }, [location.state, searchParams, savedBeats, loadBeat]);

  // --- GUARDAR EL BEAT EN FIREBASE ---
  const handleSaveBeat = useCallback(async () => {
    if (!user) {
      showToast?.('warning', 'Sesión Requerida', '¡Debes iniciar sesión para guardar tus beats en The Sonic Vault!');
      return;
    }
    if (beatName.trim() === '') {
      showToast?.('warning', 'Nombre Requerido', '¡Ponle un nombre a tu obra maestra antes de guardar!');
      return;
    }

    setIsSaving(true);
    const snapshotGrid = JSON.parse(JSON.stringify(scheduler.grid));

    const newBeat = {
      userId: user.uid,
      name: beatName,
      tempo: scheduler.tempo,
      kit: scheduler.currentKit,
      isLoFi: scheduler.isLoFi,
      gridData: snapshotGrid,
      trackVolumes: scheduler.trackVolumes,
      mutes: scheduler.mutes,
      solos: scheduler.solos,
      masterVolume: scheduler.masterVolume,
      swing: scheduler.swing,
      totalSteps: scheduler.totalSteps,
      fxSettings: scheduler.fxSettings,
      date: new Date().toLocaleDateString(),
      timestamp: new Date()
    };

    try {
      const docRef = await addDoc(collection(db, 'beats'), newBeat);
      try {
        await setDoc(doc(db, 'stats', 'global'), { beats: increment(1) }, { merge: true });
      } catch (statsErr) {
        console.error('No se pudo actualizar el contador de beats:', statsErr);
      }
      setSavedBeats((prev) => [...prev, { id: docRef.id, ...newBeat }]);
      setBeatName('');
      resetGrid();
      if (scheduler.isPlaying) {
        stopPlayback();
      }

      showToast?.('success', 'Cinta Guardada', `¡"${newBeat.name}" ha sido guardada con éxito en tu Bóveda!`);
    } catch (error) {
      console.error('Error guardando en la nube: ', error);
      showToast?.('error', 'Fallo al Guardar', 'Hubo un error guardando tu cinta en la nube.');
    } finally {
      setIsSaving(false);
    }
  }, [user, beatName, scheduler, resetGrid, stopPlayback, showToast]);

  return {
    beatName,
    setBeatName,
    savedBeats,
    isSaving,
    loadedBeatNotice,
    setLoadedBeatNotice,
    handleSaveBeat,
    loadBeat
  };
}
