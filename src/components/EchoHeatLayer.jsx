import { useEffect, useMemo, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { HEAT_CONFIG } from '../constants/echoSafeConfig';

const { DB_FLOOR, DB_CEIL, RADIUS_METERS, MIN_RADIUS_PX, MAX_RADIUS_PX, GRADIENT } = HEAT_CONFIG;

const clamp = (value, lo, hi) => Math.min(hi, Math.max(lo, value));

/** Paleta de 256 colores (RGBA) generada una sola vez a partir del gradiente OMS. */
function buildPalette() {
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createLinearGradient(0, 0, 0, 256);
  Object.entries(GRADIENT).forEach(([stop, color]) => gradient.addColorStop(Number(stop), color));
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1, 256);
  return ctx.getImageData(0, 0, 1, 256).data;
}

/**
 * Capa de calor sobre un único <canvas>, sin dependencias externas.
 *
 * Técnica: cada reporte se pinta como un "pincel" radial en escala de alfa (más ruidoso = más opaco);
 * las superposiciones se acumulan y al final se colorea cada píxel buscando su alfa en la paleta.
 * Un solo elemento DOM sustituye a los 3 círculos vectoriales por reporte que había antes.
 */
const HeatCanvasLayer = L.Layer.extend({
  initialize(points) {
    this._points = points || [];
    this._palette = buildPalette();
    this._brush = null;
    this._brushRadius = 0;
  },

  setPoints(points) {
    this._points = points || [];
    if (this._map) this._redraw();
  },

  onAdd(map) {
    this._map = map;
    const animated = map.options.zoomAnimation && L.Browser.any3d;

    if (!this._canvas) {
      this._canvas = L.DomUtil.create('canvas', 'echosafe-heat-canvas leaflet-layer');
      L.DomUtil.addClass(this._canvas, animated ? 'leaflet-zoom-animated' : 'leaflet-zoom-hide');
    }

    map.getPanes().overlayPane.appendChild(this._canvas);
    map.on('moveend', this._reset, this);
    if (animated) map.on('zoomanim', this._animateZoom, this);
    this._reset();
  },

  onRemove(map) {
    map.off('moveend', this._reset, this);
    map.off('zoomanim', this._animateZoom, this);
    this._canvas?.remove();
    this._map = null;
  },

  _reset() {
    if (!this._map || !this._canvas) return;
    const size = this._map.getSize();
    L.DomUtil.setPosition(this._canvas, this._map.containerPointToLayerPoint([0, 0]));
    this._canvas.width = size.x;
    this._canvas.height = size.y;
    this._redraw();
  },

  // Escala el lienzo durante la animación de zoom para que no "salte" al terminar
  _animateZoom(event) {
    const scale = this._map.getZoomScale(event.zoom);
    const offset = this._map._latLngToNewLayerPoint(this._map.getBounds().getNorthWest(), event.zoom, event.center);
    L.DomUtil.setTransform(this._canvas, offset, scale);
  },

  _getBrush(radius) {
    const rounded = Math.round(radius);
    if (this._brush && this._brushRadius === rounded) return this._brush;

    const brush = document.createElement('canvas');
    brush.width = rounded * 2;
    brush.height = rounded * 2;
    const ctx = brush.getContext('2d');
    const gradient = ctx.createRadialGradient(rounded, rounded, 0, rounded, rounded, rounded);
    gradient.addColorStop(0, 'rgba(0, 0, 0, 1)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, brush.width, brush.height);

    this._brush = brush;
    this._brushRadius = rounded;
    return brush;
  },

  _redraw() {
    const map = this._map;
    const canvas = this._canvas;
    if (!map || !canvas) return;

    const { x: width, y: height } = map.getSize();
    if (width <= 0 || height <= 0) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.clearRect(0, 0, width, height);
    if (!this._points.length) return;

    // Radio en píxeles a partir del radio real en metros para la latitud y zoom actuales
    const metersPerPixel =
      (40075016.686 * Math.cos((map.getCenter().lat * Math.PI) / 180)) / (256 * 2 ** map.getZoom());
    const radius = clamp(RADIUS_METERS / metersPerPixel, MIN_RADIUS_PX, MAX_RADIUS_PX);
    const brush = this._getBrush(radius);
    const visibleBounds = map.getBounds().pad(0.3);

    for (const point of this._points) {
      if (!visibleBounds.contains([point.lat, point.lng])) continue;
      const intensity = clamp((point.db - DB_FLOOR) / (DB_CEIL - DB_FLOOR), 0.05, 1);
      const pixel = map.latLngToContainerPoint([point.lat, point.lng]);
      ctx.globalAlpha = intensity;
      ctx.drawImage(brush, pixel.x - this._brushRadius, pixel.y - this._brushRadius);
    }
    ctx.globalAlpha = 1;

    // Colorización: el alfa acumulado de cada píxel indexa la paleta
    const image = ctx.getImageData(0, 0, width, height);
    const data = image.data;
    const palette = this._palette;
    for (let i = 3; i < data.length; i += 4) {
      const alpha = data[i];
      if (alpha === 0) continue;
      const p = alpha * 4;
      data[i - 3] = palette[p];
      data[i - 2] = palette[p + 1];
      data[i - 1] = palette[p + 2];
      // Borde suave: transparente en la periferia y opaco (con tope) en el núcleo
      data[i] = alpha < 4 ? alpha * 10 : Math.min(235, 40 + alpha * 1.4);
    }
    ctx.putImageData(image, 0, 0);
  }
});

/** Capa de calor para react-leaflet. Recibe reportes con { lat, lng, db }. */
export default function EchoHeatLayer({ reports }) {
  const map = useMap();
  const layerRef = useRef(null);

  const points = useMemo(
    () =>
      reports
        .map((r) => ({ lat: Number(r.lat), lng: Number(r.lng), db: Number(r.db) || 0 }))
        .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng)),
    [reports]
  );

  useEffect(() => {
    const layer = new HeatCanvasLayer();
    layer.addTo(map);
    layerRef.current = layer;
    return () => {
      map.removeLayer(layer);
      layerRef.current = null;
    };
  }, [map]);

  useEffect(() => {
    layerRef.current?.setPoints(points);
  }, [points]);

  return null;
}
