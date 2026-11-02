import { triggerSound } from '../../services/beatItAudioEngine';

export default function BeatItMixer({
  inst,
  keyIndex,
  cfg,
  currentKit,
  isLoFi,
  isMuted,
  isSoloActive,
  isSilenced,
  currentTrackVol,
  handleToggleMute,
  handleToggleSolo,
  handleVolumeChange
}) {
  return (
    <div
      style={{
        width: '185px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '4px 8px',
        background: isSilenced ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.35)',
        border: isSoloActive
          ? `1px solid ${cfg.color}`
          : isMuted
          ? '1px solid rgba(255,68,68,0.4)'
          : '1px solid rgba(255,255,255,0.06)',
        borderRadius: '6px',
        opacity: isSilenced ? 0.5 : 1,
        transition: '0.2s',
        boxShadow: isSoloActive ? `0 0 10px ${cfg.color}33` : 'none'
      }}
    >
      {/* Audition Pad / Label */}
      <div
        onClick={() => triggerSound(inst, currentKit, isLoFi, null, currentTrackVol, false)}
        title={`Click para escuchar ${cfg.label} (${Math.round(currentTrackVol * 100)}%)`}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          cursor: 'pointer',
          flex: 1,
          minWidth: '60px',
          userSelect: 'none'
        }}
      >
        <span
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: isSilenced ? '#555' : cfg.color,
            boxShadow: isSilenced ? 'none' : `0 0 6px ${cfg.color}`
          }}
        />
        <span
          style={{
            color: isSilenced ? '#777' : '#fff',
            fontSize: '0.72rem',
            fontWeight: 'bold',
            letterSpacing: '0.3px'
          }}
        >
          {cfg.label}
        </span>
        {keyIndex !== undefined && (
          <span
            style={{
              fontSize: '0.6rem',
              color: '#888',
              background: 'rgba(255,255,255,0.08)',
              padding: '1px 4px',
              borderRadius: '3px',
              marginLeft: 'auto',
              fontFamily: 'monospace',
              border: '1px solid rgba(255,255,255,0.1)'
            }}
            title={`Atajo de teclado: Tecla ${keyIndex + 1} o fila QWERTY`}
          >
            {keyIndex + 1}
          </span>
        )}
      </div>

      {/* Mixer Buttons & Fader Container */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
        <button
          type="button"
          title={isMuted ? `Desmutear ${cfg.label}` : `Mutear ${cfg.label}`}
          onClick={() => handleToggleMute(inst)}
          style={{
            width: '20px',
            height: '20px',
            borderRadius: '3px',
            border: 'none',
            cursor: 'pointer',
            fontSize: '0.6rem',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: isMuted ? '#ff4444' : 'rgba(255,255,255,0.08)',
            color: isMuted ? '#fff' : '#666',
            boxShadow: isMuted ? '0 0 8px rgba(255,68,68,0.6)' : 'none',
            transition: '0.15s'
          }}
        >
          M
        </button>

        <button
          type="button"
          title={isSoloActive ? `Quitar Solo de ${cfg.label}` : `Solo ${cfg.label}`}
          onClick={() => handleToggleSolo(inst)}
          style={{
            width: '20px',
            height: '20px',
            borderRadius: '3px',
            border: 'none',
            cursor: 'pointer',
            fontSize: '0.6rem',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: isSoloActive ? '#ffaa00' : 'rgba(255,255,255,0.08)',
            color: isSoloActive ? '#000' : '#666',
            boxShadow: isSoloActive ? '0 0 8px rgba(255,170,0,0.6)' : 'none',
            transition: '0.15s'
          }}
        >
          S
        </button>

        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={currentTrackVol}
          onChange={(e) => handleVolumeChange(inst, e.target.value)}
          title={`Volumen ${cfg.label}: ${Math.round(currentTrackVol * 100)}%`}
          style={{
            width: '42px',
            cursor: 'pointer',
            accentColor: cfg.color
          }}
        />
      </div>
    </div>
  );
}
