// Mini servidor HTTP para ejecutar los endpoints de backend (/api/*) dentro de Docker.
// Reutiliza exactamente la misma lógica que las funciones serverless de Vercel (api/verify-captcha.js, api/spotify-token.js y api/2fa.js).
// No vive dentro de /api a propósito: Vercel trataría cualquier archivo ahí como una función.
import http from 'node:http';
import { verificarCaptcha } from '../api/verify-captcha.js';
import { obtenerTokenSpotify } from '../api/spotify-token.js';
import { procesarPeticion2FA } from '../api/2fa.js';

const PORT = process.env.PORT || 3001;

const responder = (res, status, body, extraHeaders = {}) => {
  res.writeHead(status, { 'Content-Type': 'application/json', ...extraHeaders });
  res.end(JSON.stringify(body));
};

const leerBodyJson = (req) =>
  new Promise((resolve, reject) => {
    if (req.method === 'GET') return resolve({});
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > 1e5) req.destroy(); // Evita cuerpos gigantes
    });
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });

const server = http.createServer(async (req, res) => {
  const pathname = new URL(req.url || '/', 'http://localhost').pathname;

  // 1. Endpoint de token público de Spotify (Client Credentials seguro en servidor)
  if (pathname === '/api/spotify-token') {
    if (req.method !== 'GET') {
      return responder(res, 405, { error: 'Método no permitido.' });
    }
    try {
      const data = await obtenerTokenSpotify();
      return responder(res, 200, data);
    } catch (err) {
      console.error('Error obteniendo token de Spotify:', err);
      return responder(res, 500, { error: err.message || 'Error interno al obtener token de Spotify.' });
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
      console.error('Error en /api/2fa:', err);
      return responder(res, 500, { success: false, error: 'Error interno en el servidor 2FA.' });
    }
  }

  return responder(res, 404, { success: false, error: 'Ruta no encontrada.' });
});

server.listen(PORT, () => console.log(`API Backend (Captcha + Spotify Token + 2FA) escuchando en el puerto ${PORT}`));
