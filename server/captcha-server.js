// Mini servidor HTTP para ejecutar la verificación del Captcha dentro de Docker.
// Reutiliza exactamente la misma lógica que la función serverless de Vercel (api/verify-captcha.js).
// No vive dentro de /api a propósito: Vercel trataría cualquier archivo ahí como una función.
import http from 'node:http';
import { verificarCaptcha } from '../api/verify-captcha.js';

const PORT = process.env.PORT || 3001;

const responder = (res, status, body) => {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
};

const server = http.createServer((req, res) => {
  if (req.url !== '/api/verify-captcha') {
    return responder(res, 404, { success: false, error: 'Ruta no encontrada.' });
  }
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
});

server.listen(PORT, () => console.log(`API del Captcha escuchando en el puerto ${PORT}`));
