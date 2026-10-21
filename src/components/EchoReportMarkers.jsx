import { memo } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { getAcousticClassification, getCategoryInfo, formatRelativeTime } from '../constants/echoSafeConfig';

// Un icono por color, reutilizado entre reportes (evita crear un divIcon por marcador)
const iconCache = new Map();
function getReportIcon(color) {
  if (!iconCache.has(color)) {
    iconCache.set(
      color,
      L.divIcon({
        className: 'custom-icon',
        html: `<span class="echosafe-marker-dot" style="--dot-color:${color}"></span>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
        popupAnchor: [0, -10]
      })
    );
  }
  return iconCache.get(color);
}

/**
 * Nodos individuales con ficha emergente. Memoizado: solo se vuelve a renderizar cuando
 * cambia la lista de reportes, no con cada actualización del sonómetro en vivo.
 */
function EchoReportMarkers({ reports }) {
  return reports.map((rep) => {
    const lat = Number(rep.lat);
    const lng = Number(rep.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

    const level = getAcousticClassification(rep.db);
    const category = getCategoryInfo(rep.categoria);

    return (
      <Marker key={rep.id} position={[lat, lng]} icon={getReportIcon(level.color)}>
        <Popup>
          <div className="echosafe-popup">
            <div className="echosafe-popup-tags">
              <span className="echosafe-popup-tag">
                <i className={`fa-solid ${category.icon}`} style={{ color: '#00F0FF' }}></i>
                {category.label}
              </span>
              <span
                className="echosafe-popup-tag echosafe-popup-tag-level"
                style={{ background: `${level.color}20`, border: `1px solid ${level.color}60`, color: level.color }}
              >
                <i className={`fa-solid ${level.icon}`}></i>
                {level.label}
              </span>
            </div>

            <h3 className="echosafe-popup-db">
              {rep.db} <small>dB</small>
            </h3>

            {rep.picoDb && (
              <div className="echosafe-popup-extremes">
                Pico: <strong style={{ color: '#FF007A' }}>{rep.picoDb} dB</strong> · Mín:{' '}
                <strong style={{ color: '#10B981' }}>{rep.minDb || rep.db} dB</strong>
              </div>
            )}

            <p className="echosafe-popup-desc">{rep.descripcion}</p>

            <div className="echosafe-popup-footer">
              <span>
                <i className="fa-solid fa-user-astronaut" style={{ marginRight: '4px', color: '#00F0FF' }}></i>
                {rep.userName}
              </span>
              <span>
                <i className="fa-regular fa-clock" style={{ marginRight: '4px' }}></i>
                {formatRelativeTime(rep.createdAt || rep.fecha)}
              </span>
            </div>
          </div>
        </Popup>
      </Marker>
    );
  });
}

export default memo(EchoReportMarkers);
