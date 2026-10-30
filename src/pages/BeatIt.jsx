import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useBeatItScheduler } from '../hooks/useBeatItScheduler';
import { useBeatItPersistence } from '../hooks/useBeatItPersistence';
import BeatItTransport from '../components/beatit/BeatItTransport';
import BeatItFXRack from '../components/beatit/BeatItFXRack';
import BeatItGrid from '../components/beatit/BeatItGrid';
import BeatItSpotifyRadarModal from '../components/BeatItSpotifyRadarModal';
import EchoToast from '../components/EchoToast';
import { useToast } from '../hooks/useToast';

export default function BeatIt() {
  const { user } = useAuth();
  const { toasts, showToast, dismissToast } = useToast();
  const [showSpotifyRadar, setShowSpotifyRadar] = useState(false);

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
    getFilterReadout,
    stopPlayback,
    resetGrid,
    handleToggleMute,
    handleToggleSolo,
    handleVolumeChange,
    handleTogglePlay,
    handleTapTempo,
    toggleStep,
    handleDuplicateBar1ToBar2,
    handleClearGrid,
    applyPresetToScheduler,
    applyLoadedBeatToScheduler,
    handleExportWav: exportWavWithScheduler
  } = scheduler;

  const {
    beatName,
    setBeatName,
    savedBeats,
    isSaving,
    loadedBeatNotice,
    setLoadedBeatNotice,
    handleSaveBeat,
    loadBeat
  } = useBeatItPersistence({
    user,
    showToast,
    scheduler,
    applyLoadedBeatToScheduler,
    stopPlayback,
    resetGrid
  });

  const handleLoadPreset = (preset) => {
    applyPresetToScheduler(preset);
    setBeatName(`${preset.name}`);
  };

  const handleExportWav = (type = 'master') => exportWavWithScheduler(type, beatName);

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
          handleClearGrid={handleClearGrid}
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
              <i className="fa-solid fa-cloud-arrow-up" /> {isSaving ? 'GUARDANDO...' : 'GUARDAR EN NUBE'}
            </button>
          </div>
        </div>
        {!user && (
          <p style={{ color: '#ff4444', textAlign: 'right', fontSize: '0.75rem', marginTop: '8px' }}>
            Inicia sesión para guardar en la nube.
          </p>
        )}
      </div>

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
            {savedBeats.map((beat) => (
              <div
                key={beat.id}
                style={{
                  background: 'rgba(0,0,0,0.4)',
                  border: '1px solid var(--border-alt)',
                  borderRadius: '8px',
                  padding: '15px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '1.1rem' }}>{beat.name}</span>
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

                <button
                  onClick={() => loadBeat(beat)}
                  style={{
                    background: 'var(--surface-alt)',
                    color: '#fff',
                    border: '1px solid var(--border-alt)',
                    padding: '8px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    width: '100%',
                    marginTop: '5px',
                    transition: '0.2s'
                  }}
                  onMouseOver={(e) => (e.target.style.background = 'var(--accent-color)')}
                  onMouseOut={(e) => (e.target.style.background = 'var(--surface-alt)')}
                >
                  <i className="fa-solid fa-download" /> CARGAR AL ESTUDIO
                </button>
              </div>
            ))}
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
