import { useState } from 'react';
import {
  generateEuclideanPattern,
  EUCLIDEAN_CHANNEL_PRESETS,
  EUCLIDEAN_ENSEMBLE_PRESETS
} from '../../utils/euclideanRhythm';
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
  showEuclidean,
  setShowEuclidean,
  applyEuclideanToChannel,
  applyEuclideanEnsemble,
  showFxRack,
  setShowFxRack,
  isFxActive,
  setShowSpotifyRadar,
  handleTogglePlay
}) {
  const [eucTargetInst, setEucTargetInst] = useState('kick');
  const [eucPulses, setEucPulses] = useState(5);
  const [eucRotation, setEucRotation] = useState(0);
  const [eucAccent, setEucAccent] = useState(true);

  const eucPreview = generateEuclideanPattern(eucPulses, 16, eucRotation, eucAccent);
  const targetCfg = INSTRUMENT_CONFIG[eucTargetInst] || {
    label: eucTargetInst,
    color: activeKitColor,
    short: eucTargetInst
  };

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

          {/* Botón Generador de Ritmos Euclidianos E(k, n) */}
          <button
            type="button"
            onClick={() => setShowEuclidean(!showEuclidean)}
            title="Abrir Generador Matemático de Ritmos Euclidianos (Algoritmo de Bjorklund)"
            style={{
              background: showEuclidean ? 'rgba(255, 170, 0, 0.22)' : 'var(--surface-alt)',
              color: showEuclidean ? '#ffaa00' : '#aaa',
              border: `1px solid ${showEuclidean ? '#ffaa00' : 'var(--border-alt)'}`,
              padding: '6px 10px',
              borderRadius: '6px',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: '0.75rem',
              boxShadow: showEuclidean ? '0 0 12px rgba(255, 170, 0, 0.3)' : 'none',
              transition: '0.2s'
            }}
          >
            <i className="fa-solid fa-atom" /> EUCLIDIANO
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
      {/* PANEL DESPLEGABLE: GENERADOR DE PATRONES EUCLIDIANOS E(k, 16, r) */}
      {showEuclidean && (
        <div
          style={{
            background: 'rgba(10, 12, 20, 0.85)',
            border: '1px solid rgba(255, 170, 0, 0.45)',
            borderRadius: '10px',
            padding: '14px 16px',
            marginBottom: '1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            boxShadow: '0 0 24px rgba(255, 170, 0, 0.12)',
            animation: 'fadeIn 0.25s ease'
          }}
        >
          {/* Cabecera del Laboratorio Euclidiano */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '8px',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
              paddingBottom: '8px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="fa-solid fa-atom" style={{ color: '#ffaa00', fontSize: '1rem' }} />
              <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '0.82rem', letterSpacing: '1px' }}>
                GENERADOR DE PATRONES EUCLIDIANOS // ALGORITMO DE BJORKLUND
              </span>
              <span
                style={{
                  background: 'rgba(255, 170, 0, 0.18)',
                  color: '#ffaa00',
                  border: '1px solid rgba(255, 170, 0, 0.4)',
                  borderRadius: '4px',
                  padding: '2px 7px',
                  fontSize: '0.68rem',
                  fontWeight: 'bold',
                  fontFamily: 'monospace'
                }}
              >
                E({eucPulses}, 16{eucRotation > 0 ? `, +${eucRotation}` : ''})
              </span>
            </div>
            <span style={{ fontSize: '0.7rem', color: '#888' }}>
              Distribuye <strong style={{ color: '#ffaa00' }}>k</strong> pulsos en{' '}
              <strong style={{ color: '#fff' }}>16</strong> pasos con simetría matemática máxima
            </span>
          </div>

          {/* Fila 1: Selección de Canal Destino + Sliders de Pulsos (k) y Rotación (r) + Botón Inyectar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px'
            }}
          >
            {/* Selector de Pista Destino */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.68rem', color: '#999', fontWeight: 'bold', marginRight: '2px' }}>
                CANAL:
              </span>
              {INSTRUMENTS.map((inst) => {
                const cfg = INSTRUMENT_CONFIG[inst] || { label: inst, short: inst, color: activeKitColor };
                const isSelected = eucTargetInst === inst;
                return (
                  <button
                    key={inst}
                    type="button"
                    onClick={() => setEucTargetInst(inst)}
                    style={{
                      background: isSelected ? `${cfg.color}28` : 'rgba(255,255,255,0.04)',
                      color: isSelected ? cfg.color : '#888',
                      border: isSelected ? `1px solid ${cfg.color}` : '1px solid rgba(255,255,255,0.1)',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '0.68rem',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      textTransform: 'uppercase',
                      boxShadow: isSelected ? `0 0 8px ${cfg.color}44` : 'none',
                      transition: '0.15s'
                    }}
                  >
                    {cfg.short}
                  </button>
                );
              })}
            </div>

            {/* Sliders de Densidad k, Rotación r y Acento */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'rgba(255,255,255,0.04)',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: '1px solid rgba(255,255,255,0.08)'
                }}
              >
                <span style={{ fontSize: '0.68rem', color: '#aaa', fontWeight: 'bold' }}>PULSOS (k):</span>
                <input
                  type="range"
                  min="0"
                  max="16"
                  step="1"
                  value={eucPulses}
                  onChange={(e) => setEucPulses(Number(e.target.value))}
                  style={{ width: '75px', accentColor: targetCfg.color, cursor: 'pointer' }}
                />
                <span
                  style={{
                    color: targetCfg.color,
                    fontWeight: 'bold',
                    fontSize: '0.75rem',
                    minWidth: '20px',
                    textAlign: 'right'
                  }}
                >
                  {eucPulses}
                </span>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'rgba(255,255,255,0.04)',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: '1px solid rgba(255,255,255,0.08)'
                }}
              >
                <span style={{ fontSize: '0.68rem', color: '#aaa', fontWeight: 'bold' }}>ROTACIÓN (r):</span>
                <input
                  type="range"
                  min="0"
                  max="15"
                  step="1"
                  value={eucRotation}
                  onChange={(e) => setEucRotation(Number(e.target.value))}
                  style={{ width: '65px', accentColor: '#ffaa00', cursor: 'pointer' }}
                />
                <span
                  style={{
                    color: '#ffaa00',
                    fontWeight: 'bold',
                    fontSize: '0.75rem',
                    minWidth: '24px',
                    textAlign: 'right'
                  }}
                >
                  +{eucRotation}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setEucAccent(!eucAccent)}
                title="Acentuar automáticamente el primer pulso activo del ciclo"
                style={{
                  background: eucAccent ? 'rgba(0, 255, 204, 0.16)' : 'rgba(255,255,255,0.04)',
                  color: eucAccent ? '#00ffcc' : '#777',
                  border: `1px solid ${eucAccent ? '#00ffcc' : 'rgba(255,255,255,0.1)'}`,
                  padding: '5px 9px',
                  borderRadius: '5px',
                  fontSize: '0.68rem',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                ACENTO 1º: {eucAccent ? 'ON' : 'OFF'}
              </button>

              <button
                type="button"
                onClick={() => applyEuclideanToChannel(eucTargetInst, eucPulses, eucRotation, eucAccent)}
                style={{
                  background: targetCfg.color,
                  color: '#000',
                  border: 'none',
                  padding: '6px 14px',
                  borderRadius: '6px',
                  fontSize: '0.74rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: `0 0 12px ${targetCfg.color}66`
                }}
              >
                <i className="fa-solid fa-bolt" /> APLICAR A {targetCfg.short.toUpperCase()}
              </button>
            </div>
          </div>

          {/* Vista previa visual de los 16 pasos Euclidianos */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.65rem', color: '#777', fontWeight: 'bold', minWidth: '65px' }}>
              PREVISUALIZAR:
            </span>
            <div style={{ display: 'flex', flex: 1, gap: '4px' }}>
              {eucPreview.map((val, idx) => (
                <div
                  key={idx}
                  style={{
                    flex: 1,
                    height: '14px',
                    borderRadius: '3px',
                    background:
                      val === 2
                        ? '#ffffff'
                        : val === 1
                        ? targetCfg.color
                        : idx % 4 === 0
                        ? 'rgba(255,255,255,0.1)'
                        : 'rgba(255,255,255,0.03)',
                    border:
                      val > 0
                        ? `1px solid ${targetCfg.color}`
                        : '1px solid rgba(255,255,255,0.07)',
                    boxShadow: val > 0 ? `0 0 6px ${targetCfg.color}66` : 'none'
                  }}
                  title={`Paso ${idx + 1}: ${val === 2 ? 'Acento' : val === 1 ? 'Pulso' : 'Silencio'}`}
                />
              ))}
            </div>
          </div>

          {/* Fila 2: Presets Algorítmicos de Canal (1 clic puebla los 16 pasos del canal activo) */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              flexWrap: 'wrap',
              borderTop: '1px dashed rgba(255,255,255,0.08)',
              paddingTop: '8px'
            }}
          >
            <span style={{ fontSize: '0.68rem', color: '#ffaa00', fontWeight: 'bold', marginRight: '4px' }}>
              <i className="fa-solid fa-compass-drafting" /> PATRONES POR CANAL ({targetCfg.short.toUpperCase()}):
            </span>
            {EUCLIDEAN_CHANNEL_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                title={`${preset.description} (Aplica ${preset.formula} al canal seleccionado)`}
                onClick={() => {
                  setEucPulses(preset.pulses);
                  setEucRotation(preset.rotation);
                  applyEuclideanToChannel(eucTargetInst, preset.pulses, preset.rotation, eucAccent);
                }}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  color: '#e2e8f0',
                  border: '1px solid rgba(255, 170, 0, 0.3)',
                  padding: '4px 9px',
                  borderRadius: '5px',
                  fontSize: '0.68rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  transition: '0.15s'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 170, 0, 0.18)';
                  e.currentTarget.style.borderColor = '#ffaa00';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                  e.currentTarget.style.borderColor = 'rgba(255, 170, 0, 0.3)';
                }}
              >
                <span>{preset.name}</span>
                <span style={{ color: '#ffaa00', fontFamily: 'monospace', fontSize: '0.62rem' }}>
                  {preset.formula}
                </span>
              </button>
            ))}
          </div>

          {/* Fila 3: Ensambles Polirrítmicos Multi-Canal */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              flexWrap: 'wrap',
              borderTop: '1px dashed rgba(255,255,255,0.08)',
              paddingTop: '8px'
            }}
          >
            <span style={{ fontSize: '0.68rem', color: '#00ffcc', fontWeight: 'bold', marginRight: '4px' }}>
              <i className="fa-solid fa-layer-group" /> POLIRRITMIAS MULTI-PISTA:
            </span>
            {EUCLIDEAN_ENSEMBLE_PRESETS.map((ens) => (
              <button
                key={ens.id}
                type="button"
                onClick={() => applyEuclideanEnsemble(ens)}
                title={`Generar polirritmia completa: ${ens.badge}`}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  color: '#fff',
                  border: `1px solid ${ens.color}66`,
                  padding: '4px 10px',
                  borderRadius: '5px',
                  fontSize: '0.68rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: '0.15s'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = `${ens.color}28`;
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                }}
              >
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: ens.color,
                    boxShadow: `0 0 6px ${ens.color}`
                  }}
                />
                <span>{ens.name}</span>
                <span style={{ fontSize: '0.6rem', color: '#999', fontFamily: 'monospace' }}>
                  [{ens.badge}]
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
