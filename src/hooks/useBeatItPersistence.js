import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  doc,
  getDoc,
  setDoc,
  increment
} from 'firebase/firestore';
import { db } from '../firebase/config';

/**
 * Hook que encapsula la persistencia CRUD de Beats en Cloud Firestore,
 * la sincronización atómica de stats/global (increment +1 / -1),
 * la hidratación desde /perfil o ?beatId=... y el intercambio de enlaces públicos.
 */
export function useBeatItPersistence({
  user,
  showToast,
  scheduler,
  applyLoadedBeatToScheduler
}) {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const initialBeatLoadedRef = useRef(false);

  const [beatName, setBeatName] = useState('');
  const [savedBeats, setSavedBeats] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [loadedBeatNotice, setLoadedBeatNotice] = useState(null);
  const [currentBeatId, setCurrentBeatId] = useState(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [beatToDelete, setBeatToDelete] = useState(null);

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
        beatsNube.sort((a, b) => (b.timestamp?.toMillis?.() ?? 0) - (a.timestamp?.toMillis?.() ?? 0));
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
      setCurrentBeatId(beatToLoad.id || null);
      setLoadedBeatNotice({
        id: beatToLoad.id || null,
        name: beatToLoad.name || 'Composición sin título',
        kit: validKit,
        tempo: beatToLoad.tempo || 120,
        userId: beatToLoad.userId || null
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

  // --- COMPARTIR ENLACE DE BEAT PÚBLICO ---
  const handleShareBeat = useCallback(
    (idToShare, nameToShare) => {
      const targetId = idToShare || currentBeatId;
      if (!targetId) {
        showToast?.('info', 'Guarda tu Beat', 'Guarda primero tu beat en la nube para generar su enlace compartible único.');
        return;
      }
      const shareUrl = `${window.location.origin}/beat-it?beatId=${targetId}`;
      if (navigator?.clipboard?.writeText) {
        navigator.clipboard
          .writeText(shareUrl)
          .then(() => {
            showToast?.(
              'success',
              'Enlace Copiado',
              nameToShare
                ? `¡Enlace de "${nameToShare}" copiado al portapapeles! Listo para compartir.`
                : '¡Enlace público copiado al portapapeles! Listo para compartir.'
            );
          })
          .catch(() => {
            showToast?.('info', 'Enlace Compartible', shareUrl);
          });
      } else {
        showToast?.('info', 'Enlace Compartible', shareUrl);
      }
    },
    [currentBeatId, showToast]
  );

  // Determinar si el beat activo pertenece al usuario actual y puede sobrescribirse
  const activeSavedBeat = savedBeats.find((b) => b.id === currentBeatId) || null;
  const canOverwriteCurrentBeat = Boolean(
    user?.uid &&
      currentBeatId &&
      (activeSavedBeat || (loadedBeatNotice?.id === currentBeatId && loadedBeatNotice?.userId === user.uid))
  );

  // --- EJECUTAR GUARDADO EN FIREBASE (NUEVO O SOBRESCRIBIR) SIN BORRAR LA CUADRÍCULA ---
  const executeSaveBeat = useCallback(
    async (mode = 'new') => {
      if (!user) {
        showToast?.('warning', 'Sesión Requerida', '¡Debes iniciar sesión para guardar tus beats en The Sonic Vault!');
        return;
      }
      const trimmedName = beatName.trim();
      if (!trimmedName) {
        showToast?.('warning', 'Nombre Requerido', '¡Ponle un nombre a tu obra maestra antes de guardar!');
        return;
      }

      setIsSaving(true);
      const snapshotGrid = JSON.parse(JSON.stringify(scheduler.grid));

      const beatPayload = {
        userId: user.uid,
        name: trimmedName,
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
        if (mode === 'overwrite' && currentBeatId && canOverwriteCurrentBeat) {
          const beatRef = doc(db, 'beats', currentBeatId);
          await updateDoc(beatRef, beatPayload);

          setSavedBeats((prev) =>
            prev.map((b) => (b.id === currentBeatId ? { id: currentBeatId, ...beatPayload } : b))
          );
          setLoadedBeatNotice({
            id: currentBeatId,
            name: trimmedName,
            kit: scheduler.currentKit,
            tempo: scheduler.tempo,
            userId: user.uid
          });
          setShowSaveModal(false);
          showToast?.('success', 'Cinta Actualizada', `¡"${trimmedName}" se ha sobrescrito con éxito en tu Bóveda!`);
        } else {
          const docRef = await addDoc(collection(db, 'beats'), beatPayload);
          try {
            await setDoc(doc(db, 'stats', 'global'), { beats: increment(1) }, { merge: true });
          } catch (statsErr) {
            console.error('No se pudo actualizar el contador de beats:', statsErr);
          }

          const createdBeat = { id: docRef.id, ...beatPayload };
          setSavedBeats((prev) => [createdBeat, ...prev]);
          setCurrentBeatId(docRef.id);
          setLoadedBeatNotice({
            id: docRef.id,
            name: trimmedName,
            kit: scheduler.currentKit,
            tempo: scheduler.tempo,
            userId: user.uid
          });
          setShowSaveModal(false);
          showToast?.('success', 'Cinta Guardada', `¡"${trimmedName}" ha sido guardada en tu Bóveda sin interrumpir tu sesión!`);
        }
      } catch (error) {
        console.error('Error guardando en la nube: ', error);
        showToast?.('error', 'Fallo al Guardar', 'Hubo un error sincronizando tu cinta en la nube.');
      } finally {
        setIsSaving(false);
      }
    },
    [user, beatName, scheduler, currentBeatId, canOverwriteCurrentBeat, showToast]
  );

  // Disparador principal del botón "GUARDAR EN NUBE"
  const handleSaveBeat = useCallback(() => {
    if (!user) {
      showToast?.('warning', 'Sesión Requerida', '¡Debes iniciar sesión para guardar tus beats en The Sonic Vault!');
      return;
    }
    if (beatName.trim() === '') {
      showToast?.('warning', 'Nombre Requerido', '¡Ponle un nombre a tu obra maestra antes de guardar!');
      return;
    }

    // Si hay un beat propio cargado en sesión, consultar si desea sobrescribirlo o guardar como copia nueva
    if (canOverwriteCurrentBeat) {
      setShowSaveModal(true);
      return;
    }

    executeSaveBeat('new');
  }, [user, beatName, canOverwriteCurrentBeat, executeSaveBeat, showToast]);

  // --- ELIMINAR BEAT DE FIREBASE CON DECREMENTO ATÓMICO ---
  const confirmDeleteBeat = useCallback(async () => {
    if (!user || !beatToDelete?.id) return;

    setIsDeleting(true);
    const targetId = beatToDelete.id;
    const targetName = beatToDelete.name || 'Cinta';

    try {
      await deleteDoc(doc(db, 'beats', targetId));
      try {
        await setDoc(doc(db, 'stats', 'global'), { beats: increment(-1) }, { merge: true });
      } catch (statsErr) {
        console.error('No se pudo descontar el contador global de beats:', statsErr);
      }

      setSavedBeats((prev) => prev.filter((b) => b.id !== targetId));
      if (currentBeatId === targetId) {
        setCurrentBeatId(null);
        setLoadedBeatNotice(null);
      }
      setBeatToDelete(null);
      showToast?.('info', 'Cinta Eliminada', `"${targetName}" fue eliminada permanentemente de tu Bóveda.`);
    } catch (error) {
      console.error('Error eliminando cinta:', error);
      showToast?.('error', 'Error al Eliminar', 'No se pudo eliminar la cinta de la nube.');
    } finally {
      setIsDeleting(false);
    }
  }, [user, beatToDelete, currentBeatId, showToast]);

  return {
    beatName,
    setBeatName,
    savedBeats,
    isSaving,
    isDeleting,
    loadedBeatNotice,
    setLoadedBeatNotice,
    currentBeatId,
    setCurrentBeatId,
    activeSavedBeat,
    canOverwriteCurrentBeat,
    showSaveModal,
    setShowSaveModal,
    beatToDelete,
    setBeatToDelete,
    handleSaveBeat,
    executeSaveBeat,
    confirmDeleteBeat,
    handleShareBeat,
    loadBeat
  };
}
