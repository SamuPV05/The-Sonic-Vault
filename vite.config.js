import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { verificarCaptcha } from './api/verify-captcha.js'

// En local (npm run dev) Vite no ejecuta la carpeta /api como hace Vercel.
// Este plugin sirve /api/verify-captcha en desarrollo usando la misma lógica.
function captchaDevApi() {
  return {
    name: 'captcha-dev-api',
    configureServer(server) {
      server.middlewares.use('/api/verify-captcha', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: false, error: 'Método no permitido' }));
          return;
        }
        let raw = '';
        req.on('data', (chunk) => { raw += chunk; });
        req.on('end', async () => {
          res.setHeader('Content-Type', 'application/json');
          try {
            const { token } = JSON.parse(raw || '{}');
            const env = loadEnv('development', process.cwd(), '');
            const secret = env.RECAPTCHA_SECRET_KEY || process.env.RECAPTCHA_SECRET_KEY;
            const result = await verificarCaptcha(token, secret, req.socket.remoteAddress);
            res.statusCode = result.success ? 200 : 400;
            res.end(JSON.stringify(result));
          } catch (err) {
            res.statusCode = 500;
            res.end(JSON.stringify({ success: false, error: err.message }));
          }
        });
      });
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), captchaDevApi()],
})
