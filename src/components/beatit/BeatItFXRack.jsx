import { getDelaySeconds } from '../../constants/beatItPresets';

export default function BeatItFXRack({
  showFxRack,
  fxSettings,
  setFxSettings,
  tempo,
  getFilterReadout
}) {
  if (!showFxRack) return null;

  return (
    <div
      style={{
        background: 'linear-gradient(180deg, rgba(20,25,35,0.95) 0%, rgba(10,14,20,0.95) 100%)',
        border: '1px solid rgba(0,255,204,0.3)',
        borderRadius: '10px',
        padding: '14px 18px',
        marginBottom: '1.2rem',
        boxShadow: 'inset 0 0 25px rgba(0,0,0,0.8), 0 0 20px rgba(0,255,204,0.15)',
        animation: 'fadeIn 0.3s ease'
      }}
    >
      {/* Cabecera del Rack de Efectos */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '14px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          paddingBottom: '8px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <i className="fa-solid fa-compact-disc" style={{ color: '#00ffcc', fontSize: '0.9rem' }} />
          <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '0.85rem', letterSpacing: '1px' }}>
            RACK DE EFECTOS MAESTROS // LIVE DJ MODE
          </span>
          <span
            style={{
              fontSize: '0.65rem',
              background: fxSettings.enabled ? 'rgba(0,255,204,0.2)' : 'rgba(255,68,68,0.2)',
              color: fxSettings.enabled ? '#00ffcc' : '#ff6666',
              padding: '2px 6px',
              borderRadius: '3px',
              fontWeight: 'bold'
            }}
          >
            {fxSettings.enabled ? 'PROCESADOR ON AIR' : 'BYPASS TOTAL'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={() => setFxSettings((prev) => ({ ...prev, enabled: !prev.enabled }))}
            style={{
              background: fxSettings.enabled ? 'rgba(0,255,204,0.2)' : 'rgba(255,255,255,0.08)',
              color: fxSettings.enabled ? '#00ffcc' : '#888',
              border: `1px solid ${fxSettings.enabled ? '#00ffcc' : 'rgba(255,255,255,0.1)'}`,
              padding: '3px 8px',
              borderRadius: '4px',
              fontSize: '0.68rem',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            <i className="fa-solid fa-power-off" /> {fxSettings.enabled ? 'FX ACTIVO' : 'BYPASS'}
          </button>

          <button
            type="button"
            onClick={() => setFxSettings((prev) => ({ ...prev, djFilter: 0, drive: 0, delayWet: 0 }))}
            style={{
              background: 'rgba(255,255,255,0.05)',
              color: '#aaa',
              border: '1px solid rgba(255,255,255,0.1)',
              padding: '3px 8px',
              borderRadius: '4px',
              fontSize: '0.68rem',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
            title="Restablecer filtros, drive y eco al valor cero"
          >
            <i className="fa-solid fa-rotate-left" /> REINICIAR FX
          </button>
        </div>
      </div>

      {/* Los 3 Módulos de Efectos */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
        {/* Módulo 1: DJ Filter Sweep */}
        <div
          style={{
            background: 'rgba(0,0,0,0.4)',
            padding: '10px 12px',
            borderRadius: '8px',
            border: '1px solid rgba(255,255,255,0.06)'
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '8px'
            }}
          >
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 'bold',
                color: '#00bfff',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <i className="fa-solid fa-water" /> FILTRO DJ (BI-DIRECCIONAL)
            </span>
            <button
              type="button"
              onClick={() => setFxSettings((prev) => ({ ...prev, djFilter: 0 }))}
              style={{
                background: 'transparent',
                color: '#777',
                border: '1px solid rgba(255,255,255,0.1)',
                padding: '1px 5px',
                borderRadius: '3px',
                fontSize: '0.62rem',
                cursor: 'pointer'
              }}
              title="Volver al centro exacto (0)"
            >
              SNAP 0
            </button>
          </div>

          <input
            type="range"
            min="-100"
            max="100"
            step="1"
            value={fxSettings.djFilter}
            onChange={(e) => setFxSettings((prev) => ({ ...prev, djFilter: Number(e.target.value) }))}
            style={{
              width: '100%',
              cursor: 'pointer',
              accentColor:
                fxSettings.djFilter < 0 ? '#00bfff' : fxSettings.djFilter > 0 ? '#ff8800' : '#00ffcc'
            }}
          />

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '6px'
            }}
          >
            <span style={{ fontSize: '0.62rem', color: '#00bfff', fontWeight: 'bold' }}>◄ LOW PASS</span>
            <span
              style={{
                fontSize: '0.68rem',
                fontWeight: 'bold',
                color:
                  fxSettings.djFilter === 0
                    ? '#888'
                    : fxSettings.djFilter < 0
                    ? '#00bfff'
                    : '#ff8800'
              }}
            >
              {getFilterReadout()}
            </span>
            <span style={{ fontSize: '0.62rem', color: '#ff8800', fontWeight: 'bold' }}>HIGH PASS ►</span>
          </div>
        </div>

        {/* Módulo 2: Tape Drive / Saturation */}
        <div
          style={{
            background: 'rgba(0,0,0,0.4)',
            padding: '10px 12px',
            borderRadius: '8px',
            border: '1px solid rgba(255,255,255,0.06)'
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '8px'
            }}
          >
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 'bold',
                color: '#ff5533',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <i className="fa-solid fa-fire" /> TAPE DRIVE & CALIDEZ
            </span>
            <span
              style={{
                fontSize: '0.7rem',
                color: fxSettings.drive > 0 ? '#ffaa00' : '#777',
                fontWeight: 'bold'
              }}
            >
              {fxSettings.drive}%
            </span>
          </div>

          <input
            type="range"
            min="0"
            max="100"
            step="2"
            value={fxSettings.drive}
            onChange={(e) => setFxSettings((prev) => ({ ...prev, drive: Number(e.target.value) }))}
            style={{ width: '100%', cursor: 'pointer', accentColor: '#ff5533' }}
          />

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '6px',
              fontSize: '0.62rem',
              color: '#777'
            }}
          >
            <span>Puro & Limpio</span>
            <span style={{ color: fxSettings.drive > 40 ? '#ffaa00' : '#666' }}>
              {fxSettings.drive > 60
                ? 'SATURACIÓN ANALÓGICA FUERTE'
                : fxSettings.drive > 0
                ? 'CALIDEZ DE CINTA'
                : 'BYPASS'}
            </span>
            <span>Extremo</span>
          </div>
        </div>

        {/* Módulo 3: Dub Delay & Echo Loop */}
        <div
          style={{
            background: 'rgba(0,0,0,0.4)',
            padding: '10px 12px',
            borderRadius: '8px',
            border: '1px solid rgba(255,255,255,0.06)'
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '8px'
            }}
          >
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 'bold',
                color: '#00ffcc',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <i className="fa-solid fa-wave-square" /> DUB DELAY & ECO
            </span>
            <span style={{ fontSize: '0.65rem', color: '#888' }}>
              {Math.round(getDelaySeconds(fxSettings.delaySync, tempo) * 1000)} ms
            </span>
          </div>

          {/* Botones de Sincronía Musical */}
          <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
            {['1/16', '1/8', '1/8d', '1/4'].map((sync) => (
              <button
                key={sync}
                type="button"
                onClick={() => setFxSettings((prev) => ({ ...prev, delaySync: sync }))}
                style={{
                  flex: 1,
                  background: fxSettings.delaySync === sync ? '#00ffcc' : 'rgba(255,255,255,0.08)',
                  color: fxSettings.delaySync === sync ? '#000' : '#888',
                  border: 'none',
                  padding: '3px 0',
                  borderRadius: '3px',
                  fontSize: '0.65rem',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                {sync}
              </button>
            ))}
          </div>

          {/* Sliders de Mix y Feedback */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '0.62rem',
                  color: '#888',
                  marginBottom: '3px'
                }}
              >
                <span>MIX (WET)</span>
                <span
                  style={{
                    color: fxSettings.delayWet > 0 ? '#00ffcc' : '#666',
                    fontWeight: 'bold'
                  }}
                >
                  {fxSettings.delayWet}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="2"
                value={fxSettings.delayWet}
                onChange={(e) => setFxSettings((prev) => ({ ...prev, delayWet: Number(e.target.value) }))}
                style={{ width: '100%', cursor: 'pointer', accentColor: '#00ffcc' }}
              />
            </div>

            <div style={{ flex: 1 }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '0.62rem',
                  color: '#888',
                  marginBottom: '3px'
                }}
              >
                <span>REPETICIONES</span>
                <span style={{ color: '#aaa', fontWeight: 'bold' }}>{fxSettings.delayFeedback}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="80"
                step="2"
                value={fxSettings.delayFeedback}
                onChange={(e) =>
                  setFxSettings((prev) => ({ ...prev, delayFeedback: Number(e.target.value) }))
                }
                style={{ width: '100%', cursor: 'pointer', accentColor: '#00ffcc' }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
