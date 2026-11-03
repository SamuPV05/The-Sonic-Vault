// Mini servidor HTTP para ejecutar los endpoints de backend (/api/*) dentro de Docker.
// Reutiliza exactamente la misma lógica que las funciones serverless de Vercel (api/verify-captcha.js, api/spotify-token.js y api/2fa.js).
// No vive dentro de /api a propósito: Vercel trataría cualquier archivo ahí como una función.
import http from 'node:http';
import { verificarCaptcha } from '../api/verify-captcha.js';
import { procesarPeticionSpotifyToken } from '../api/spotify-token.js';
import { procesarPeticion2FA } from '../api/2fa.js';

const PORT = process.env.PORT || 3001;

const responder = (res, status, body, extraHeaders = {}) => {
  res.writeHead(status, { 'Content-Type': 'application/json', ...extraHeaders });
  res.end(JSON.stringify(body));
};

const MAX_BODY_BYTES = 1e5; // 100 KB

const leerBodyJson = (req) =>
  new Promise((resolve, reject) => {
    if (req.method === 'GET') return resolve({});
    let raw = '';
    let abortado = false;

    req.on('data', (chunk) => {
      if (abortado) return;
      raw += chunk;
      if (raw.length > MAX_BODY_BYTES) {
        abortado = true;
        const err = new Error('Payload demasiado grande (máximo 100 KB).');
        err.statusCode = 413;
        req.destroy();
        reject(err);
      }
    });

    req.on('end', () => {
      if (abortado) return;
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch (err) {
        err.statusCode = 400;
        err.message = 'JSON malformado en el cuerpo de la petición.';
        reject(err);
      }
    });

    req.on('error', (err) => {
      if (!abortado) reject(err);
    });
  });

const server = http.createServer(async (req, res) => {
  const pathname = new URL(req.url || '/', 'http://localhost').pathname;

  // 1. Endpoint de token público y enriquecimiento de Spotify
  if (pathname === '/api/spotify-token') {
    try {
      const result = await procesarPeticionSpotifyToken({
        method: req.method,
        url: req.url || '/',
        env: process.env
      });
      return responder(res, result.status, result.body);
    } catch (err) {
      console.error('Error en /api/spotify-token:', err);
      return responder(res, 500, { error: err.message || 'Error interno al procesar petición de Spotify.' });
    }
  }

  // 2. Endpoint de verificación de Google reCAPTCHA v2
  if (pathname === '/api/verify-captcha') {
    if (req.method !== 'POST') {
      return responder(res, 405, { success: false, error: 'Método no permitido.' });
    }

    try {
      const { token } = await leerBodyJson(req);
      const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
      const result = await verificarCaptcha(token, process.env.RECAPTCHA_SECRET_KEY, ip);
      return responder(res, result.success ? 200 : 400, result);
    } catch (err) {
      if (err.statusCode) {
        return responder(res, err.statusCode, { success: false, error: err.message });
      }
      console.error('Error verificando Captcha:', err);
      return responder(res, 500, { success: false, error: 'Error interno al verificar el Captcha.' });
    }
  }

  // 3. Endpoint de emisión, verificación y sesión de 2FA en servidor
  if (pathname === '/api/2fa') {
    if (req.method !== 'GET' && req.method !== 'POST') {
      return responder(res, 405, { success: false, error: 'Método no permitido.' });
    }

    try {
      const body = await leerBodyJson(req);
      const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
      const result = await procesarPeticion2FA({
        method: req.method,
        headers: req.headers,
        body,
        ip,
        env: process.env
      });
      const extraHeaders = result.setCookie ? { 'Set-Cookie': result.setCookie } : {};
      return responder(res, result.status, result.body, extraHeaders);
    } catch (err) {
      if (err.statusCode) {
        return responder(res, err.statusCode, { success: false, error: err.message });
      }
      console.error('Error en /api/2fa:', err);
      return responder(res, 500, { success: false, error: 'Error interno en el servidor 2FA.' });
    }
  }

  return responder(res, 404, { success: false, error: 'Ruta no encontrada.' });
});

server.listen(PORT, () => console.log(`API Backend (Captcha + Spotify Token + 2FA) escuchando en el puerto ${PORT}`));
