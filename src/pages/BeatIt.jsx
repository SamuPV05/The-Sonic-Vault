import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useBeatItScheduler } from '../hooks/useBeatItScheduler';
import { useBeatItPersistence } from '../hooks/useBeatItPersistence';
import BeatItTransport from '../components/beatit/BeatItTransport';
import BeatItFXRack from '../components/beatit/BeatItFXRack';
import BeatItGrid from '../components/beatit/BeatItGrid';
import BeatItSpotifyRadarModal from '../components/BeatItSpotifyRadarModal';
import EchoToast from '../components/EchoToast';
import { useToast } from '../hooks/useToast';
import { triggerSound } from '../services/beatItAudioEngine';
import { findPresetByName } from '../constants/beatItPresets';

export default function BeatIt() {
  const { user } = useAuth();
  const { toasts, showToast, dismissToast } = useToast();
  const [showSpotifyRadar, setShowSpotifyRadar] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);

  const scheduler = useBeatItScheduler({ showToast });
  const {
    isPlaying,
    tempo,
    setTempo,
    currentStep,
    currentKit,
    setCurrentKit,
    isLoFi,
    setIsLoFi,
    swing,
    setSwing,
    totalSteps,
    setTotalSteps,
    activeBar,
    setActiveBar,
    grid,
    trackVolumes,
    mutes,
    solos,
    masterVolume,
    setMasterVolume,
    showFxRack,
    setShowFxRack,
    fxSettings,
    setFxSettings,
    showPresets,
    setShowPresets,
    showEuclidean,
    setShowEuclidean,
    isTapping,
    showExportModal,
    setShowExportModal,
    isExporting,
    exportLoops,
    setExportLoops,
    exportStatusText,
    activeKitColor,
    hasAnySolo,
    isFxActive,
    getFilterReadout,    resetGrid,
    handleToggleMute,
    handleToggleSolo,
    handleVolumeChange,
    handleTogglePlay,
    handleTapTempo,
    toggleStep,
    handleDuplicateBar1ToBar2,
    applyEuclideanToChannel,
    applyEuclideanEnsemble,
    applyPresetToScheduler,
    applyLoadedBeatToScheduler,
    handleExportWav: exportWavWithScheduler
  } = scheduler;

    const {
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
  } = useBeatItPersistence({
    user,
    showToast,
    scheduler,
    applyLoadedBeatToScheduler
  });

  const [searchParams] = useSearchParams();
  const initialPresetHandledRef = useRef(false);

  const handleLoadPreset = useCallback(
    (preset) => {
      applyPresetToScheduler(preset);
      setBeatName(`${preset.name}`);
    },
    [applyPresetToScheduler, setBeatName]
  );

  // --- HIDRATACIÓN AUTOMÁTICA DESDE EL PUENTE SÓNICO DE ERAS (?preset=...) ---
  useEffect(() => {
    const presetQuery = searchParams.get('preset');
    if (!presetQuery || initialPresetHandledRef.current) return;

    // Si la URL incluye beatId, la persistencia en Firestore toma prioridad
    if (searchParams.get('beatId')) return;

    const matchedPreset = findPresetByName(presetQuery);
    if (matchedPreset) {
      initialPresetHandledRef.current = true;
      handleLoadPreset(matchedPreset);

      const eraQuery = searchParams.get('era');
      const fromQuery = searchParams.get('from');

      const customBeatName = fromQuery
        ? `${fromQuery} - ${eraQuery || matchedPreset.name}`
        : `${matchedPreset.name} Studio`;

      setBeatName(customBeatName);

      setLoadedBeatNotice({
        id: null,
        name: customBeatName,
        kit: matchedPreset.kit,
        tempo: matchedPreset.bpm,
        userId: null
      });

      const detailMsg =
        eraQuery && fromQuery
          ? `Inspirado en la era "${eraQuery}" de ${fromQuery} (${matchedPreset.bpm} BPM).`
          : `Secuenciador calibrado con el patrón rítmico de ${matchedPreset.name} (${matchedPreset.bpm} BPM).`;

      showToast?.('success', `Ritmo de la Era: ${matchedPreset.name}`, detailMsg);
    }
  }, [searchParams, handleLoadPreset, setBeatName, setLoadedBeatNotice, showToast]);

  const handleExportWav = (type = 'master') => exportWavWithScheduler(type, beatName);
  // --- ATAJOS DE TECLADO EN VIVO (PERFORMANCE MODE) ---
  useEffect(() => {
    const KEY_INSTRUMENT_MAP = {
      '1': 'kick',
      '2': 'snare',
      '3': 'clap',
      '4': 'hihat',
      '5': 'openhat',
      '6': 'sub808',
      '7': 'tom',
      '8': 'crash',
      q: 'kick',
      w: 'snare',
      e: 'clap',
      r: 'hihat',
      t: 'openhat',
      y: 'sub808',
      u: 'tom',
      i: 'crash'
    };

    const handleKeyDown = (e) => {
      // Ignorar atajos si el usuario escribe en un campo de texto
      const tag = e.target?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select' || e.target?.isContentEditable) {
        return;
      }

      // Ignorar si hay un modal bloqueante abierto
      if (showClearModal || showExportModal || showSpotifyRadar || showSaveModal || Boolean(beatToDelete)) {
        return;
      }

      // Barra Espaciadora: Play / Stop
      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault();
        handleTogglePlay();
        return;
      }

      // Teclas 1-8 o Q-I: Disparar samples de percusión en vivo
      const keyLower = e.key.toLowerCase();
      const instrument = KEY_INSTRUMENT_MAP[keyLower];
      if (instrument) {
        e.preventDefault();
        const vol = trackVolumes[instrument] !== undefined ? trackVolumes[instrument] : 0.85;
        triggerSound(instrument, currentKit, isLoFi, null, vol, false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    handleTogglePlay,
    currentKit,
    isLoFi,
    trackVolumes,
    showClearModal,
    showExportModal,
    showSpotifyRadar,
    showSaveModal,
    beatToDelete
  ]);


  return (
    <div
      style={{
        minHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '1.5rem',
        background: 'transparent'
      }}
    >
      <div
        style={{
          background: 'var(--surface-bg)',
          padding: '1.5rem 2rem',
          borderRadius: '16px',
          border: `1px solid ${isPlaying ? activeKitColor : 'var(--border-glow)'}`,
          width: '100%',
          maxWidth: '1020px',
          boxShadow: isLoFi
            ? '0 0 30px rgba(255, 170, 0, 0.2)'
            : isPlaying
            ? `0 0 25px ${activeKitColor}33`
            : 'var(--shadow-soft)',
          transition: '0.5s',
          marginBottom: '2rem',
          backdropFilter: 'blur(15px)'
        }}
      >
        {loadedBeatNotice && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'rgba(0, 255, 204, 0.1)',
              border: '1px solid rgba(0, 255, 204, 0.35)',
              borderRadius: '8px',
              padding: '10px 14px',
              marginBottom: '1rem',
              gap: '10px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.82rem', color: '#e2f8f5' }}>
              <i className="fa-solid fa-compact-disc" style={{ color: '#00ffcc' }} />
              <span>
                Cinta cargada en el secuenciador:{' '}
                <strong style={{ color: '#00ffcc' }}>{loadedBeatNotice.name}</strong> ({loadedBeatNotice.kit} •{' '}
                {loadedBeatNotice.tempo} BPM)
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {loadedBeatNotice.id && (
                <button
                  type="button"
                  onClick={() => handleShareBeat(loadedBeatNotice.id, loadedBeatNotice.name)}
                  title="Copiar enlace compartible directo a este beat"
                  style={{
                    background: 'rgba(0, 255, 204, 0.15)',
                    color: '#00ffcc',
                    border: '1px solid rgba(0, 255, 204, 0.35)',
                    borderRadius: '4px',
                    padding: '4px 10px',
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                >
                  <i className="fa-solid fa-share-nodes" /> COMPARTIR
                </button>
              )}
              <button
                type="button"
                onClick={() => setLoadedBeatNotice(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#888',
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                  padding: '2px 6px'
                }}
                title="Ocultar aviso"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* 1. Barra de Transporte, visualizador, BPM, Kit, Presets y Controles Principales */}
        <BeatItTransport
          user={user}
          isPlaying={isPlaying}
          tempo={tempo}
          setTempo={setTempo}
          currentStep={currentStep}
          currentKit={currentKit}
          setCurrentKit={setCurrentKit}
          isLoFi={isLoFi}
          setIsLoFi={setIsLoFi}
          swing={swing}
          setSwing={setSwing}
          masterVolume={masterVolume}
          setMasterVolume={setMasterVolume}
          grid={grid}
          mutes={mutes}
          solos={solos}
          hasAnySolo={hasAnySolo}
          activeKitColor={activeKitColor}
          isTapping={isTapping}
          handleTapTempo={handleTapTempo}
          showPresets={showPresets}
          setShowPresets={setShowPresets}
          handleLoadPreset={handleLoadPreset}
          showEuclidean={showEuclidean}
          setShowEuclidean={setShowEuclidean}
          applyEuclideanToChannel={applyEuclideanToChannel}
          applyEuclideanEnsemble={applyEuclideanEnsemble}
          showFxRack={showFxRack}
          setShowFxRack={setShowFxRack}
          isFxActive={isFxActive}
          showSpotifyRadar={showSpotifyRadar}
          setShowSpotifyRadar={setShowSpotifyRadar}
          handleTogglePlay={handleTogglePlay}
        />

        {/* 2. Rack de Efectos Maestros en Vivo (Modo DJ) */}
        <BeatItFXRack
          showFxRack={showFxRack}
          fxSettings={fxSettings}
          setFxSettings={setFxSettings}
          tempo={tempo}
          getFilterReadout={getFilterReadout}
        />

        {/* 3. Cuadrícula de Secuenciación y Consola de Mezcla */}
        <BeatItGrid
          totalSteps={totalSteps}
          setTotalSteps={setTotalSteps}
          activeBar={activeBar}
          setActiveBar={setActiveBar}
          isPlaying={isPlaying}
          currentStep={currentStep}
          activeKitColor={activeKitColor}
          isLoFi={isLoFi}
          grid={grid}
          mutes={mutes}
          solos={solos}
          hasAnySolo={hasAnySolo}
          trackVolumes={trackVolumes}
          currentKit={currentKit}
          handleDuplicateBar1ToBar2={handleDuplicateBar1ToBar2}
          handleClearGrid={() => setShowClearModal(true)}
          handleToggleMute={handleToggleMute}
          handleToggleSolo={handleToggleSolo}
          handleVolumeChange={handleVolumeChange}
          toggleStep={toggleStep}
        />

        {/* 4. Barra de Acciones Inferior (Exportar WAV, Playlist Spotify, Guardar en Nube) */}
        <div
          style={{
            borderTop: '1px dashed var(--border-alt)',
            paddingTop: '18px',
            display: 'flex',
            gap: '10px',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap'
          }}
        >
          {/* Botones de Exportación WAV y Playlist Spotify */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setShowExportModal(true)}
              style={{
                background: 'linear-gradient(135deg, #00ffcc 0%, #00bfff 100%)',
                color: '#000',
                border: 'none',
                padding: '9px 18px',
                borderRadius: '6px',
                fontWeight: 'bold',
                fontSize: '0.82rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 0 14px rgba(0, 255, 204, 0.4)',
                transition: '0.2s'
              }}
            >
              <i className="fa-solid fa-file-audio" /> EXPORTAR WAV
            </button>

            <button
              type="button"
              onClick={() => setShowSpotifyRadar(true)}
              title="Crear Playlist automática en tu cuenta de Spotify sincronizada con este Beat"
              style={{
                background: 'linear-gradient(135deg, #1DB954 0%, #00F0FF 100%)',
                color: '#000',
                border: 'none',
                padding: '9px 18px',
                borderRadius: '6px',
                fontWeight: 'bold',
                fontSize: '0.82rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 0 14px rgba(29, 185, 84, 0.4)',
                transition: '0.2s'
              }}
            >
              <i className="fa-brands fa-spotify" style={{ fontSize: '0.95rem' }} /> PLAYLIST SPOTIFY
            </button>

            <button
              type="button"
              onClick={() => handleShareBeat()}
              title="Copiar enlace público de este Beat para compartirlo con otros productores"
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                color: '#fff',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                padding: '9px 16px',
                borderRadius: '6px',
                fontWeight: 'bold',
                fontSize: '0.82rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: '0.2s'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = '#00ffcc';
                e.currentTarget.style.color = '#00ffcc';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                e.currentTarget.style.color = '#fff';
              }}
            >
              <i className="fa-solid fa-share-nodes" /> COMPARTIR
            </button>
          </div>

          {/* Formulario Guardar en Firebase */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Nombre de tu Beat..."
              value={beatName}
              onChange={(e) => setBeatName(e.target.value)}
              maxLength="25"
              disabled={!user || isSaving}
              style={{
                background: 'rgba(0,0,0,0.5)',
                color: '#fff',
                border: '1px solid var(--border-alt)',
                padding: '9px 14px',
                borderRadius: '6px',
                width: '220px',
                outline: 'none',
                opacity: !user ? 0.5 : 1,
                fontSize: '0.82rem'
              }}
            />
            <button
              onClick={handleSaveBeat}
              disabled={!user || isSaving}
              style={{
                background: '#fff',
                color: '#000',
                border: 'none',
                padding: '9px 18px',
                borderRadius: '6px',
                fontWeight: 'bold',
                cursor: !user || isSaving ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                opacity: !user || isSaving ? 0.5 : 1,
                fontSize: '0.82rem'
              }}
            >
              <i className="fa-solid fa-cloud-arrow-up" /> {isSaving ? 'GUARDANDO...' : canOverwriteCurrentBeat ? 'GUARDAR / ACTUALIZAR' : 'GUARDAR EN NUBE'}
            </button>
          </div>
        </div>
        {!user && (
          <p style={{ color: '#ff4444', textAlign: 'right', fontSize: '0.75rem', marginTop: '8px' }}>
            Inicia sesión para guardar en la nube.
          </p>
        )}
      </div>

            {/* MODAL TEMÁTICO DE CONFIRMACIÓN DE LIMPIEZA */}
      {showClearModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(8px)'
          }}
        >
          <div
            style={{
              background: '#121620',
              border: '1px solid rgba(255, 68, 68, 0.4)',
              borderRadius: '14px',
              padding: '24px',
              width: '90%',
              maxWidth: '420px',
              boxShadow: '0 0 30px rgba(255, 68, 68, 0.25)',
              textAlign: 'center'
            }}
          >
            <div
              style={{
                width: '54px',
                height: '54px',
                borderRadius: '50%',
                background: 'rgba(255, 68, 68, 0.12)',
                border: '1px solid rgba(255, 68, 68, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                color: '#ff5555',
                fontSize: '1.5rem'
              }}
            >
              <i className="fa-solid fa-triangle-exclamation" />
            </div>
            <h3 style={{ color: '#fff', margin: '0 0 8px 0', fontSize: '1.15rem' }}>
              ¿Limpiar secuenciador?
            </h3>
            <p style={{ color: '#aaa', fontSize: '0.85rem', margin: '0 0 20px 0', lineHeight: '1.4' }}>
              Se vaciarán todas las pistas y compases activos en la cuadrícula. Esta acción no se puede deshacer.
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => setShowClearModal(false)}
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
                onClick={() => {
                  resetGrid();
                  setCurrentBeatId(null);
                  setLoadedBeatNotice(null);
                  setShowClearModal(false);
                  showToast?.('info', 'Secuenciador Limpio', 'El patrón ha sido reiniciado.');
                }}
                style={{
                  flex: 1,
                  background: 'linear-gradient(135deg, #ff4444 0%, #cc0033 100%)',
                  color: '#fff',
                  border: 'none',
                  padding: '10px',
                  borderRadius: '6px',
                  fontWeight: 'bold',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  boxShadow: '0 0 12px rgba(255, 68, 68, 0.4)'
                }}
              >
                LIMPIAR TODO
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL TEMÁTICO: SOBRESCRIBIR CINTA ACTUAL VS GUARDAR COMO NUEVA */}
      {showSaveModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0,0,0,0.82)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(8px)'
          }}
        >
          <div
            style={{
              background: '#121620',
              border: '1px solid rgba(0, 255, 204, 0.45)',
              borderRadius: '14px',
              padding: '24px',
              width: '90%',
              maxWidth: '460px',
              boxShadow: '0 0 30px rgba(0, 255, 204, 0.2)',
              textAlign: 'center'
            }}
          >
            <div
              style={{
                width: '54px',
                height: '54px',
                borderRadius: '50%',
                background: 'rgba(0, 255, 204, 0.12)',
                border: '1px solid rgba(0, 255, 204, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                color: '#00ffcc',
                fontSize: '1.4rem'
              }}
            >
              <i className="fa-solid fa-cloud-arrow-up" />
            </div>
            <h3 style={{ color: '#fff', margin: '0 0 8px 0', fontSize: '1.15rem' }}>
              Sincronización de Cinta en la Bóveda
            </h3>
            <p style={{ color: '#aaa', fontSize: '0.85rem', margin: '0 0 20px 0', lineHeight: '1.5' }}>
              Tienes cargada la cinta{' '}
              <strong style={{ color: '#00ffcc' }}>
                "{activeSavedBeat?.name || loadedBeatNotice?.name || beatName}"
              </strong>
              . ¿Deseas sobrescribir esa cinta existente o guardar{' '}
              <strong style={{ color: '#fff' }}>"{beatName.trim()}"</strong> como una copia nueva?
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                type="button"
                disabled={isSaving}
                onClick={() => executeSaveBeat('overwrite')}
                style={{
                  width: '100%',
                  background: 'linear-gradient(135deg, #00ffcc 0%, #00bfff 100%)',
                  color: '#000',
                  border: 'none',
                  padding: '11px',
                  borderRadius: '6px',
                  fontWeight: 'bold',
                  fontSize: '0.84rem',
                  cursor: isSaving ? 'wait' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 0 14px rgba(0, 255, 204, 0.35)'
                }}
              >
                <i className="fa-solid fa-arrows-rotate" /> SOBRESCRIBIR CINTA ACTUAL
              </button>
              <button
                type="button"
                disabled={isSaving}
                onClick={() => executeSaveBeat('new')}
                style={{
                  width: '100%',
                  background: 'rgba(255, 255, 255, 0.08)',
                  color: '#fff',
                  border: '1px solid rgba(0, 255, 204, 0.4)',
                  padding: '11px',
                  borderRadius: '6px',
                  fontWeight: 'bold',
                  fontSize: '0.84rem',
                  cursor: isSaving ? 'wait' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <i className="fa-solid fa-plus" /> GUARDAR COMO COPIA NUEVA
              </button>
              <button
                type="button"
                disabled={isSaving}
                onClick={() => setShowSaveModal(false)}
                style={{
                  width: '100%',
                  background: 'transparent',
                  color: '#888',
                  border: '1px solid rgba(255,255,255,0.1)',
                  padding: '9px',
                  borderRadius: '6px',
                  fontWeight: 'bold',
                  fontSize: '0.8rem',
                  cursor: 'pointer'
                }}
              >
                CANCELAR
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL TEMÁTICO DE CONFIRMACIÓN PARA ELIMINAR CINTA */}
      {beatToDelete && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0,0,0,0.82)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(8px)'
          }}
        >
          <div
            style={{
              background: '#121620',
              border: '1px solid rgba(255, 68, 68, 0.45)',
              borderRadius: '14px',
              padding: '24px',
              width: '90%',
              maxWidth: '420px',
              boxShadow: '0 0 30px rgba(255, 68, 68, 0.25)',
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
              ¿Eliminar cinta de la Bóveda?
            </h3>
            <p style={{ color: '#aaa', fontSize: '0.85rem', margin: '0 0 20px 0', lineHeight: '1.4' }}>
              Estás a punto de eliminar permanentemente{' '}
              <strong style={{ color: '#fff' }}>"{beatToDelete.name}"</strong> de la nube. Esta acción no se puede deshacer.
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setBeatToDelete(null)}
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
                disabled={isDeleting}
                onClick={confirmDeleteBeat}
                style={{
                  flex: 1,
                  background: 'linear-gradient(135deg, #ff4444 0%, #cc0033 100%)',
                  color: '#fff',
                  border: 'none',
                  padding: '10px',
                  borderRadius: '6px',
                  fontWeight: 'bold',
                  fontSize: '0.85rem',
                  cursor: isDeleting ? 'wait' : 'pointer',
                  boxShadow: '0 0 12px rgba(255, 68, 68, 0.4)'
                }}
              >
                {isDeleting ? 'ELIMINANDO...' : 'ELIMINAR'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE EXPORTACIÓN DE AUDIO WAV (FASE 7) */}
      {showExportModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(8px)'
          }}
        >
          <div
            style={{
              background: '#121620',
              border: '1px solid var(--border-glow)',
              borderRadius: '14px',
              padding: '24px',
              width: '90%',
              maxWidth: '480px',
              boxShadow: '0 0 30px rgba(0,255,204,0.2)'
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px'
              }}
            >
              <h3
                style={{
                  color: '#fff',
                  margin: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '1.2rem'
                }}
              >
                <i className="fa-solid fa-file-waveform" style={{ color: '#00ffcc' }} /> EXPORTAR AUDIO ESTUDIO
              </h3>
              <button
                type="button"
                onClick={() => !isExporting && setShowExportModal(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#888',
                  fontSize: '1.2rem',
                  cursor: isExporting ? 'not-allowed' : 'pointer'
                }}
              >
                ✕
              </button>
            </div>

            <p style={{ color: '#aaa', fontSize: '0.82rem', margin: '0 0 16px 0', lineHeight: '1.4' }}>
              Renderiza tu producción con calidad digital de estudio (16-bit PCM WAV, 44.1 kHz sin compresión),
              incluyendo efectos DJ, acentos de velocidad y calidez analógica.
            </p>

            <div style={{ marginBottom: '16px' }}>
              <label
                style={{
                  display: 'block',
                  color: '#888',
                  fontSize: '0.75rem',
                  fontWeight: 'bold',
                  marginBottom: '6px'
                }}
              >
                DURACIÓN DEL BUCLE:
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {[1, 2, 4].map((loops) => (
                  <button
                    key={loops}
                    type="button"
                    onClick={() => setExportLoops(loops)}
                    disabled={isExporting}
                    style={{
                      flex: 1,
                      background: exportLoops === loops ? '#00ffcc' : 'rgba(255,255,255,0.06)',
                      color: exportLoops === loops ? '#000' : '#fff',
                      border: 'none',
                      padding: '8px',
                      borderRadius: '6px',
                      fontWeight: 'bold',
                      fontSize: '0.8rem',
                      cursor: 'pointer'
                    }}
                  >
                    {loops} {loops === 1 ? 'Compás' : 'Compases'}
                  </button>
                ))}
              </div>
            </div>

            {isExporting ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <i
                  className="fa-solid fa-spinner fa-spin"
                  style={{ color: '#00ffcc', fontSize: '2rem', marginBottom: '10px' }}
                />
                <p style={{ color: '#fff', fontSize: '0.85rem', fontWeight: 'bold', margin: 0 }}>
                  {exportStatusText || 'Renderizando audio...'}
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => handleExportWav('master')}
                  style={{
                    background: 'var(--surface-alt)',
                    color: '#fff',
                    border: '1px solid #00ffcc',
                    padding: '12px',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: '0.2s'
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.background = '#00ffcc22')}
                  onMouseOut={(e) => (e.currentTarget.style.background = 'var(--surface-alt)')}
                >
                  <i className="fa-solid fa-music" style={{ color: '#00ffcc' }} /> DESCARGAR MASTER WAV (MIX
                  COMPLETO)
                </button>

                <button
                  type="button"
                  onClick={() => handleExportWav('stems')}
                  style={{
                    background: 'var(--surface-alt)',
                    color: '#fff',
                    border: '1px solid var(--border-alt)',
                    padding: '12px',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: '0.2s'
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
                  onMouseOut={(e) => (e.currentTarget.style.background = 'var(--surface-alt)')}
                >
                  <i className="fa-solid fa-layer-group" style={{ color: '#b877ff' }} /> DESCARGAR STEMS
                  MULTITRACK (PISTAS SEPARADAS)
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Lista de Cintas Guardadas en Firebase */}
      {user && savedBeats.length > 0 && (
        <div
          style={{
            background: 'var(--surface-bg)',
            padding: '2rem',
            borderRadius: '16px',
            border: '1px solid var(--border-glow)',
            width: '100%',
            maxWidth: '900px',
            animation: 'fadeIn 0.5s ease',
            boxShadow: 'var(--shadow-soft)',
            backdropFilter: 'blur(15px)'
          }}
        >
          <h3
            style={{
              color: '#fff',
              marginTop: 0,
              marginBottom: '20px',
              letterSpacing: '1px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}
          >
            <i className="fa-solid fa-cloud" style={{ color: 'var(--accent-color)' }} /> CINTAS EN LA BÓVEDA
          </h3>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
              gap: '15px'
            }}
          >
            {savedBeats.map((beat) => {
              const isCurrent = beat.id === currentBeatId;
              return (
                <div
                  key={beat.id}
                  style={{
                    background: isCurrent ? 'rgba(0, 255, 204, 0.06)' : 'rgba(0,0,0,0.4)',
                    border: isCurrent ? '1px solid #00ffcc' : '1px solid var(--border-alt)',
                    borderRadius: '8px',
                    padding: '15px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    boxShadow: isCurrent ? '0 0 15px rgba(0, 255, 204, 0.15)' : 'none',
                    transition: '0.2s'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '6px' }}>
                    <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '1.05rem', wordBreak: 'break-word' }}>
                      {beat.name}
                    </span>
                    <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                      {isCurrent && (
                        <span
                          style={{
                            background: 'rgba(0, 255, 204, 0.2)',
                            color: '#00ffcc',
                            border: '1px solid #00ffcc',
                            fontSize: '0.58rem',
                            padding: '2px 6px',
                            borderRadius: '10px',
                            fontWeight: 'bold'
                          }}
                        >
                          ACTIVA
                        </span>
                      )}
                      {beat.isLoFi && (
                        <span
                          style={{
                            background: '#ffaa00',
                            color: '#000',
                            fontSize: '0.6rem',
                            padding: '2px 6px',
                            borderRadius: '10px',
                            fontWeight: 'bold'
                          }}
                        >
                          LO-FI
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', fontSize: '0.8rem', color: '#888' }}>
                    <span>
                      <i className="fa-solid fa-drum" /> {beat.kit}
                    </span>
                    <span>
                      <i className="fa-solid fa-stopwatch" /> {beat.tempo} BPM
                    </span>
                    {beat.swing && beat.swing > 50 && (
                      <span>
                        <i className="fa-solid fa-shuffle" /> {beat.swing}%
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '8px', marginTop: '5px' }}>
                    <button
                      type="button"
                      onClick={() => loadBeat(beat)}
                      style={{
                        flex: 1,
                        background: isCurrent ? 'rgba(0, 255, 204, 0.2)' : 'var(--surface-alt)',
                        color: isCurrent ? '#00ffcc' : '#fff',
                        border: isCurrent ? '1px solid rgba(0, 255, 204, 0.4)' : '1px solid var(--border-alt)',
                        padding: '8px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        transition: '0.2s',
                        fontWeight: 'bold',
                        fontSize: '0.8rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.background = 'var(--accent-color)';
                        e.currentTarget.style.color = '#000';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = isCurrent ? 'rgba(0, 255, 204, 0.2)' : 'var(--surface-alt)';
                        e.currentTarget.style.color = isCurrent ? '#00ffcc' : '#fff';
                      }}
                    >
                      <i className="fa-solid fa-download" /> {isCurrent ? 'RECARGAR' : 'CARGAR'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleShareBeat(beat.id, beat.name)}
                      title="Copiar enlace público para compartir este beat"
                      style={{
                        background: 'rgba(255, 255, 255, 0.06)',
                        color: '#00ffcc',
                        border: '1px solid rgba(0, 255, 204, 0.3)',
                        padding: '8px 11px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        transition: '0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(0, 255, 204, 0.15)')}
                      onMouseOut={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)')}
                    >
                      <i className="fa-solid fa-share-nodes" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setBeatToDelete(beat)}
                      title="Eliminar esta cinta de la Bóveda"
                      style={{
                        background: 'rgba(255, 68, 68, 0.08)',
                        color: '#ff5555',
                        border: '1px solid rgba(255, 68, 68, 0.3)',
                        padding: '8px 11px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        transition: '0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(255, 68, 68, 0.22)')}
                      onMouseOut={(e) => (e.currentTarget.style.background = 'rgba(255, 68, 68, 0.08)')}
                    >
                      <i className="fa-solid fa-trash-can" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>

      {/* MODAL RADAR BPM & GENERADOR DE PLAYLIST SPOTIFY */}
      <BeatItSpotifyRadarModal
        isOpen={showSpotifyRadar}
        onClose={() => setShowSpotifyRadar(false)}
        tempo={tempo}
        currentKit={currentKit}
        beatName={beatName}
      />

      <EchoToast toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
