import { INSTRUMENTS, INSTRUMENT_CONFIG } from '../../services/beatItAudioEngine';
import BeatItMixer from './BeatItMixer';

export default function BeatItGrid({
  totalSteps,
  setTotalSteps,
  activeBar,
  setActiveBar,
  isPlaying,
  currentStep,
  activeKitColor,
  isLoFi,
  grid,
  mutes,
  solos,
  hasAnySolo,
  trackVolumes,
  currentKit,
  handleDuplicateBar1ToBar2,
  handleClearGrid,
  handleToggleMute,
  handleToggleSolo,
  handleVolumeChange,
  toggleStep
}) {
  return (
    <>
      {/* Barra de Navegación de Compases y Herramientas (16 vs 32 Pasos) */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem',
          background: 'rgba(0,0,0,0.3)',
          padding: '6px 14px',
          borderRadius: '8px',
          border: '1px solid rgba(255,255,255,0.06)',
          flexWrap: 'wrap',
          gap: '8px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Selector de Longitud */}
          <div
            style={{
              display: 'flex',
              borderRadius: '4px',
              overflow: 'hidden',
              border: '1px solid var(--border-alt)'
            }}
          >
            <button
              type="button"
              onClick={() => {
                setTotalSteps(16);
                setActiveBar(0);
              }}
              style={{
                background: totalSteps === 16 ? activeKitColor : 'var(--surface-alt)',
                color: totalSteps === 16 ? '#000' : '#888',
                border: 'none',
                padding: '5px 10px',
                fontSize: '0.72rem',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              16 PASOS
            </button>
            <button
              type="button"
              onClick={() => setTotalSteps(32)}
              style={{
                background: totalSteps === 32 ? activeKitColor : 'var(--surface-alt)',
                color: totalSteps === 32 ? '#000' : '#888',
                border: 'none',
                padding: '5px 10px',
                fontSize: '0.72rem',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              32 PASOS (2 BARS)
            </button>
          </div>

          {/* Pestañas de Compás (cuando 32 pasos está activo) */}
          {totalSteps === 32 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                type="button"
                onClick={() => setActiveBar(0)}
                style={{
                  background: activeBar === 0 ? 'rgba(255,255,255,0.15)' : 'transparent',
                  color: activeBar === 0 ? '#fff' : '#666',
                  border: activeBar === 0 ? `1px solid ${activeKitColor}` : '1px solid transparent',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '0.7rem',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                COMPÁS 1 (1-16)
                {isPlaying && currentStep < 16 && (
                  <span
                    style={{
                      display: 'inline-block',
                      width: '5px',
                      height: '5px',
                      borderRadius: '50%',
                      background: activeKitColor,
                      marginLeft: '5px'
                    }}
                  />
                )}
              </button>
              <button
                type="button"
                onClick={() => setActiveBar(1)}
                style={{
                  background: activeBar === 1 ? 'rgba(255,255,255,0.15)' : 'transparent',
                  color: activeBar === 1 ? '#fff' : '#666',
                  border: activeBar === 1 ? `1px solid ${activeKitColor}` : '1px solid transparent',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '0.7rem',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                COMPÁS 2 (17-32)
                {isPlaying && currentStep >= 16 && (
                  <span
                    style={{
                      display: 'inline-block',
                      width: '5px',
                      height: '5px',
                      borderRadius: '50%',
                      background: activeKitColor,
                      marginLeft: '5px'
                    }}
                  />
                )}
              </button>

              <button
                type="button"
                title="Copiar patrón del Compás 1 al Compás 2"
                onClick={handleDuplicateBar1ToBar2}
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  color: '#aaa',
                  border: '1px solid rgba(255,255,255,0.1)',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '0.68rem',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                <i className="fa-solid fa-copy" /> DUPLICAR 1 → 2
              </button>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span
            style={{
              fontSize: '0.68rem',
              color: '#bbb',
              background: 'rgba(255,255,255,0.05)',
              padding: '3px 8px',
              borderRadius: '4px',
              border: '1px solid rgba(255,255,255,0.1)',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
            title="Atajos en vivo: Espacio (Play/Stop), Teclas 1-8 o Q-I (Disparar Pads)"
          >
            <i className="fa-solid fa-keyboard" style={{ color: activeKitColor }} />
            <span>[Espacio] Play • [1-8] Pads</span>
          </span>

          <span style={{ fontSize: '0.68rem', color: '#666' }}>
            <i className="fa-solid fa-circle-info" style={{ color: activeKitColor }} /> Clic: Normal • 2º: Acento • 3º: Apagar
          </span>
          <button
            type="button"
            onClick={handleClearGrid}
            title="Limpiar todo el ritmo"
            style={{
              background: 'rgba(255,68,68,0.1)',
              color: '#ff6666',
              border: '1px solid rgba(255,68,68,0.2)',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '0.68rem',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            <i className="fa-solid fa-trash-can" /> LIMPIAR
          </button>
        </div>
      </div>

      {/* Canales del Secuenciador (8 Pistas con Consola y Matriz de Acentos) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', marginBottom: '1.5rem' }}>
        {INSTRUMENTS.map((inst, instIdx) => {
          const cfg = INSTRUMENT_CONFIG[inst] || { label: inst, color: activeKitColor, tag: 'TRK' };
          const isMuted = !!mutes[inst];
          const isSoloActive = !!solos[inst];
          const isSilenced = hasAnySolo ? (!isSoloActive || isMuted) : isMuted;
          const currentTrackVol = trackVolumes[inst] !== undefined ? trackVolumes[inst] : 0.85;

          return (
            <div key={inst} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BeatItMixer
                inst={inst}
                keyIndex={instIdx}
                cfg={cfg}
                currentKit={currentKit}
                isLoFi={isLoFi}
                isMuted={isMuted}
                isSoloActive={isSoloActive}
                isSilenced={isSilenced}
                currentTrackVol={currentTrackVol}
                handleToggleMute={handleToggleMute}
                handleToggleSolo={handleToggleSolo}
                handleVolumeChange={handleVolumeChange}
              />

              {/* 16 Steps Visible Grid (Páginas de Compás) */}
              <div style={{ display: 'flex', flex: 1, gap: '5px' }}>
                {Array.from({ length: 16 }).map((_, stepInBar) => {
                  const globalStepIdx = activeBar * 16 + stepInBar;
                  const stepVal = grid[inst] ? grid[inst][globalStepIdx] : 0;
                  const isActive = stepVal > 0 || stepVal === true;
                  const isAccent = stepVal === 2;
                  const isCurrentStep = isPlaying && currentStep === globalStepIdx;
                  const activeColor = isLoFi ? '#ffaa00' : cfg.color;
                  const isDownbeat = stepInBar % 4 === 0;

                  return (
                    <div
                      key={stepInBar}
                      onClick={() => toggleStep(inst, globalStepIdx)}
                      title={`Paso ${globalStepIdx + 1} (${isAccent ? 'Acento Fuerte' : (isActive ? 'Golpe Normal' : 'Vacío')})`}
                      style={{
                        flex: 1,
                        height: '34px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        transition: '0.08s',
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: isAccent
                          ? `linear-gradient(135deg, ${activeColor}, #ffffff)`
                          : (isActive ? activeColor : (isDownbeat ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)')),
                        border: isCurrentStep
                          ? '2px solid #fff'
                          : (isAccent ? '2px solid #fff' : (isActive ? `1px solid ${activeColor}` : (isDownbeat ? '1px solid rgba(255,255,255,0.15)' : '1px solid var(--border-alt)'))),
                        opacity: isSilenced ? 0.35 : (isActive ? 1 : 0.65),
                        boxShadow: (isAccent && !isSilenced)
                          ? `0 0 14px ${activeColor}, 0 0 6px #fff`
                          : ((isActive && !isSilenced) ? `0 0 8px ${activeColor}88` : 'none'),
                        transform: isCurrentStep ? 'scale(1.08)' : 'scale(1)'
                      }}
                    >
                      {isAccent && (
                        <span
                          style={{
                            width: '5px',
                            height: '5px',
                            borderRadius: '50%',
                            background: '#000',
                            boxShadow: '0 0 4px #000'
                          }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
