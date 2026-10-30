import { KIT_DEFINITIONS, INSTRUMENTS, INSTRUMENT_CONFIG } from '../../services/beatItAudioEngine';
import { GENRE_PRESETS } from '../../constants/beatItPresets';

export default function BeatItTransport({
  user,
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
  masterVolume,
  setMasterVolume,
  grid,
  mutes,
  solos,
  hasAnySolo,
  activeKitColor,
  isTapping,
  handleTapTempo,
  showPresets,
  setShowPresets,
  handleLoadPreset,
  showFxRack,
  setShowFxRack,
  isFxActive,
  setShowSpotifyRadar,
  handleTogglePlay
}) {
  return (
    <>
      {/* Visualizador de Ritmo Reactivo (8 Canales con feedback de Mute/Solo/Acento) */}
      <div
        style={{
          background: isLoFi ? 'rgba(255, 170, 0, 0.08)' : 'rgba(0,0,0,0.65)',
          height: '90px',
          borderRadius: '10px',
          marginBottom: '1.2rem',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-around',
          gap: '8px',
          padding: '12px 20px',
          border: '1px inset rgba(255,255,255,0.08)',
          transition: '0.4s'
        }}
      >
        {INSTRUMENTS.map((inst) => {
          const isMuted = !!mutes[inst];
          const isSoloActive = !!solos[inst];
          const isSilenced = hasAnySolo ? (!isSoloActive || isMuted) : isMuted;

          const stepVal = grid[inst] && grid[inst][currentStep];
          const isFiring = isPlaying && stepVal > 0 && !isSilenced;
          const isAccentHit = isFiring && stepVal === 2;

          const cfg = INSTRUMENT_CONFIG[inst] || { label: inst, color: activeKitColor, short: inst };
          const barColor = isLoFi ? '#ffaa00' : (isAccentHit ? '#ffffff' : (isFiring ? cfg.color : activeKitColor));

          return (
            <div
              key={inst}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '6px',
                flex: 1,
                maxWidth: '50px',
                opacity: isSilenced ? 0.35 : 1,
                transition: '0.2s'
              }}
            >
              <div
                style={{
                  width: '100%',
                  maxWidth: '32px',
                  height: isAccentHit ? '72px' : (isFiring ? '55px' : '10px'),
                  background: isFiring
                    ? barColor
                    : (isSilenced ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.08)'),
                  transition: isFiring ? 'height 0.04s ease-out' : 'height 0.18s ease-in',
                  borderRadius: '3px',
                  boxShadow: isAccentHit
                    ? `0 0 20px #fff, 0 0 10px ${cfg.color}`
                    : (isFiring ? `0 0 14px ${barColor}` : 'none')
                }}
              />
              <span
                style={{
                  fontSize: '0.62rem',
                  color: isSoloActive ? '#ffaa00' : (isMuted ? '#ff4444' : (isFiring ? '#fff' : '#777')),
                  textTransform: 'uppercase',
                  fontWeight: 'bold',
                  letterSpacing: '0.5px'
                }}
              >
                {cfg.short}
              </span>
            </div>
          );
        })}
      </div>

      {/* Panel Superior de Controles Principales */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2 style={{ color: '#fff', margin: 0, letterSpacing: '2px', fontSize: '1.4rem' }}>
              ESTUDIO BEAT IT
            </h2>
            <span
              style={{
                fontSize: '0.65rem',
                background: 'rgba(0,255,204,0.15)',
                color: '#00ffcc',
                padding: '3px 8px',
                borderRadius: '4px',
                border: '1px solid rgba(0,255,204,0.3)',
                fontWeight: 'bold',
                letterSpacing: '1px'
              }}
            >
              PRO ENGINE // 8 TRK
            </span>
          </div>
          <p
            style={{
              color: activeKitColor,
              margin: '4px 0 0 0',
              fontSize: '0.78rem',
              textTransform: 'uppercase',
              transition: '0.3s'
            }}
          >
            {user ? `Estudio de ${user.displayName || 'Usuario'}` : 'Inicia sesión para guardar'} • Kit: {currentKit}
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '0.6rem',
            alignItems: 'center',
            background: 'rgba(0,0,0,0.4)',
            padding: '8px 12px',
            borderRadius: '8px',
            border: '1px solid var(--border-alt)'
          }}
        >
          <select
            value={currentKit}
            onChange={(e) => setCurrentKit(e.target.value)}
            style={{
              background: 'var(--surface-alt)',
              color: '#fff',
              border: `1px solid ${activeKitColor}`,
              padding: '7px 10px',
              borderRadius: '4px',
              outline: 'none',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '0.8rem'
            }}
          >
            {Object.keys(KIT_DEFINITIONS).map((kit) => (
              <option key={kit} value={kit}>
                {kit}
              </option>
            ))}
          </select>

          {/* BPM y Tap Tempo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <input
              type="number"
              value={tempo}
              onChange={(e) => setTempo(Number(e.target.value))}
              min="60"
              max="200"
              title="BPM (Tempo)"
              style={{
                width: '48px',
                background: 'var(--surface-alt)',
                color: '#fff',
                border: '1px solid var(--border-alt)',
                padding: '5px',
                borderRadius: '4px',
                textAlign: 'center',
                fontWeight: 'bold',
                fontSize: '0.8rem'
              }}
            />
            <button
              type="button"
              onClick={handleTapTempo}
              title="Haz clic a ritmo para fijar el tempo automáticamente (Tap Tempo)"
              style={{
                background: isTapping ? activeKitColor : 'rgba(255,255,255,0.08)',
                color: isTapping ? '#000' : '#fff',
                border: isTapping ? `1px solid ${activeKitColor}` : '1px solid rgba(255,255,255,0.15)',
                padding: '5px 8px',
                borderRadius: '4px',
                fontWeight: 'bold',
                fontSize: '0.68rem',
                cursor: 'pointer',
                transform: isTapping ? 'scale(1.12)' : 'scale(1)',
                transition: '0.08s',
                boxShadow: isTapping ? `0 0 10px ${activeKitColor}` : 'none'
              }}
            >
              TAP
            </button>
          </div>

          {/* Swing / Shuffle Control */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              background: 'rgba(255,255,255,0.04)',
              padding: '4px 8px',
              borderRadius: '6px',
              border: '1px solid rgba(255,255,255,0.06)'
            }}
          >
            <span style={{ color: '#888', fontSize: '0.68rem', fontWeight: 'bold' }}>SWING</span>
            <input
              type="range"
              min="50"
              max="75"
              step="1"
              value={swing}
              onChange={(e) => setSwing(Number(e.target.value))}
              title={`Groove Swing: ${swing}% (50% = Plano, 66% = Triplet Funk, 75% = Fuerte)`}
              style={{ width: '40px', accentColor: activeKitColor, cursor: 'pointer' }}
            />
            <span
              style={{
                color: swing > 50 ? activeKitColor : '#aaa',
                fontSize: '0.68rem',
                fontWeight: 'bold',
                minWidth: '26px'
              }}
            >
              {swing}%
            </span>
          </div>

          {/* Master Volume Slider */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              background: 'rgba(255,255,255,0.04)',
              padding: '4px 8px',
              borderRadius: '6px',
              border: '1px solid rgba(255,255,255,0.06)'
            }}
          >
            <i className="fa-solid fa-volume-high" style={{ color: activeKitColor, fontSize: '0.75rem' }} />
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={masterVolume}
              onChange={(e) => setMasterVolume(parseFloat(e.target.value))}
              title={`Master Volume: ${Math.round(masterVolume * 100)}%`}
              style={{ width: '40px', accentColor: activeKitColor, cursor: 'pointer' }}
            />
          </div>

          {/* Botón Presets de Género */}
          <button
            type="button"
            onClick={() => setShowPresets(!showPresets)}
            title="Cargar ritmos clásicos de fábrica (Trap, Boom Bap, House, Dembow...)"
            style={{
              background: showPresets ? 'rgba(153, 69, 255, 0.25)' : 'var(--surface-alt)',
              color: showPresets ? '#b877ff' : '#aaa',
              border: `1px solid ${showPresets ? '#9945ff' : 'var(--border-alt)'}`,
              padding: '6px 10px',
              borderRadius: '6px',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: '0.75rem',
              transition: '0.2s'
            }}
          >
            <i className="fa-solid fa-wand-magic-sparkles" /> PRESETS
          </button>

          {/* Botón Modo DJ / Rack FX */}
          <button
            type="button"
            onClick={() => setShowFxRack(!showFxRack)}
            title="Abrir el Rack de Efectos en Vivo (Filtro DJ, Tape Saturation, Dub Delay)"
            style={{
              background: showFxRack ? 'rgba(0, 255, 204, 0.18)' : 'var(--surface-alt)',
              color: showFxRack ? '#00ffcc' : '#aaa',
              border: `1px solid ${showFxRack ? '#00ffcc' : 'var(--border-alt)'}`,
              padding: '6px 11px',
              borderRadius: '6px',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.75rem',
              boxShadow: showFxRack ? '0 0 12px rgba(0, 255, 204, 0.3)' : 'none',
              transition: '0.2s'
            }}
          >
            <i className="fa-solid fa-sliders" />
            <span>RACK FX</span>
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: isFxActive ? '#00ffcc' : '#555',
                boxShadow: isFxActive ? '0 0 8px #00ffcc' : 'none'
              }}
            />
          </button>

          {/* Botón Radar BPM Spotify */}
          <button
            type="button"
            onClick={() => setShowSpotifyRadar(true)}
            title="Abrir Radar BPM de Spotify para encontrar referencias y generar playlists automáticas"
            style={{
              background: 'var(--surface-alt)',
              color: '#1DB954',
              border: '1px solid rgba(29, 185, 84, 0.4)',
              padding: '6px 11px',
              borderRadius: '6px',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.75rem',
              transition: '0.2s'
            }}
          >
            <i className="fa-brands fa-spotify" style={{ fontSize: '0.85rem' }} />
            <span>RADAR BPM</span>
          </button>

          <button
            type="button"
            onClick={() => setIsLoFi(!isLoFi)}
            style={{
              background: isLoFi ? '#ffaa00' : 'var(--surface-alt)',
              color: isLoFi ? '#000' : '#888',
              border: `1px solid ${isLoFi ? '#ffaa00' : 'var(--border-alt)'}`,
              padding: '6px 10px',
              borderRadius: '6px',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              transition: '0.3s',
              fontSize: '0.75rem'
            }}
          >
            <i
              className="fa-solid fa-record-vinyl"
              style={{ animation: isLoFi ? 'spin 2s linear infinite' : 'none' }}
            />{' '}
            LO-FI
          </button>

          <button
            type="button"
            onClick={handleTogglePlay}
            style={{
              background: isPlaying ? 'var(--accent-secondary, #ff0055)' : activeKitColor,
              color: '#000',
              border: 'none',
              padding: '7px 16px',
              borderRadius: '6px',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: '0.2s',
              boxShadow: isPlaying
                ? '0 0 16px var(--accent-secondary, #ff0055)'
                : `0 0 16px ${activeKitColor}`,
              fontSize: '0.8rem'
            }}
          >
            <i className={`fa-solid ${isPlaying ? 'fa-stop' : 'fa-play'}`} /> {isPlaying ? 'STOP' : 'PLAY'}
          </button>
        </div>
      </div>

      {/* BARRA DESPLEGABLE DE PRESETS DE GÉNERO */}
      {showPresets && (
        <div
          style={{
            background: 'rgba(0,0,0,0.55)',
            border: '1px solid #9945ff55',
            borderRadius: '8px',
            padding: '10px 14px',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flexWrap: 'wrap',
            animation: 'fadeIn 0.25s ease'
          }}
        >
          <span
            style={{
              fontSize: '0.72rem',
              color: '#b877ff',
              fontWeight: 'bold',
              letterSpacing: '0.5px',
              marginRight: '5px'
            }}
          >
            <i className="fa-solid fa-shapes" /> RITMOS DE FÁBRICA:
          </span>
          {GENRE_PRESETS.map((preset) => (
            <button
              key={preset.name}
              type="button"
              onClick={() => handleLoadPreset(preset)}
              style={{
                background: 'rgba(255,255,255,0.06)',
                color: '#fff',
                border: `1px solid ${preset.color}66`,
                padding: '5px 10px',
                borderRadius: '5px',
                fontSize: '0.72rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: '0.15s'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = `${preset.color}33`;
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
              }}
            >
              <i className={`fa-solid ${preset.icon}`} style={{ color: preset.color }} />
              <span>{preset.name}</span>
              <span style={{ fontSize: '0.62rem', color: '#888' }}>({preset.bpm} BPM)</span>
            </button>
          ))}
        </div>
      )}
    </>
  );
}
