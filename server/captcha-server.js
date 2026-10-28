// Mini servidor HTTP para ejecutar los endpoints de backend (/api/*) dentro de Docker.
// Reutiliza exactamente la misma lógica que las funciones serverless de Vercel (api/verify-captcha.js y api/spotify-token.js).
// No vive dentro de /api a propósito: Vercel trataría cualquier archivo ahí como una función.
import http from 'node:http';
import { verificarCaptcha } from '../api/verify-captcha.js';
import { obtenerTokenSpotify } from '../api/spotify-token.js';

const PORT = process.env.PORT || 3001;

const responder = (res, status, body) => {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
};

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

    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > 1e5) req.destroy(); // Evita cuerpos gigantes
    });
    req.on('end', async () => {
      try {
        const { token } = JSON.parse(raw || '{}');
        const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
        const result = await verificarCaptcha(token, process.env.RECAPTCHA_SECRET_KEY, ip);
        responder(res, result.success ? 200 : 400, result);
      } catch (err) {
        console.error('Error verificando Captcha:', err);
        responder(res, 500, { success: false, error: 'Error interno al verificar el Captcha.' });
      }
    });
    return;
  }

  return responder(res, 404, { success: false, error: 'Ruta no encontrada.' });
});

server.listen(PORT, () => console.log(`API Backend (Captcha + Spotify Token) escuchando en el puerto ${PORT}`));
