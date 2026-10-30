// Función serverless (Vercel / Docker / Vite): verifica con Google que el token del Captcha es real.
// La llave secreta vive SOLO aquí (variable de entorno), nunca en el navegador.
import crypto from 'node:crypto';

// Llave secreta de PRUEBA oficial de Google. Se usa solo en desarrollo si aún no configuraste la real.
const TEST_SECRET = '6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe';
const CAPTCHA_PASS_TTL_MS = 10 * 60 * 1000; // 10 minutos para completar login y envío de 2FA

function esEntornoProduccion(env = process.env) {
  return env.NODE_ENV === 'production' || env.VERCEL_ENV === 'production';
}

function obtenerClaveHmac(secret, env = process.env) {
  const claveReal =
    secret ||
    env.RECAPTCHA_SECRET_KEY ||
    env.SESSION_2FA_SECRET ||
    env.SPOTIFY_CLIENT_SECRET ||
    '';
  if (claveReal) return claveReal;
  // En producción jamás se usa una clave de respaldo pública; falla cerrado.
  return esEntornoProduccion(env) ? '' : TEST_SECRET;
}

export function emitirPaseCaptcha(secret, env = process.env) {
  const claveHmac = obtenerClaveHmac(secret, env);
  if (!claveHmac) return null;

  const payload = Buffer.from(
    JSON.stringify({
      exp: Date.now() + CAPTCHA_PASS_TTL_MS,
      nonce: crypto.randomBytes(8).toString('hex')
    })
  ).toString('base64url');

  const sig = crypto
    .createHmac('sha256', claveHmac)
    .update(payload)
    .digest('base64url');

  return `${payload}.${sig}`;
}

export function verificarPaseCaptcha(pase, secret, env = process.env) {
  if (!pase || typeof pase !== 'string' || !pase.includes('.')) return false;
  const claveHmac = obtenerClaveHmac(secret, env);
  if (!claveHmac) return false;

  const [payload, sig] = pase.split('.');
  if (!payload || !sig) return false;

  const expectedSig = crypto
    .createHmac('sha256', claveHmac)
    .update(payload)
    .digest('base64url');

  const bufA = Buffer.from(sig);
  const bufB = Buffer.from(expectedSig);
  if (bufA.length !== bufB.length || !crypto.timingSafeEqual(bufA, bufB)) {
    return false;
  }

  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return typeof data.exp === 'number' && Date.now() <= data.exp;
  } catch {
    return false;
  }
}

export async function verificarCaptcha(token, secret, ip, env = process.env) {
  if (!token) return { success: false, error: 'Falta el token del Captcha.' };

  const esProduccion = esEntornoProduccion(env);
  const claveSecreta = secret || (!esProduccion ? TEST_SECRET : '');
  if (!claveSecreta) {
    return { success: false, error: 'Configuración incompleta: falta RECAPTCHA_SECRET_KEY en el servidor.' };
  }

  const params = new URLSearchParams({ secret: claveSecreta, response: token });
  if (ip) params.append('remoteip', ip);

  const resp = await fetch('https://www.google.com/recaptcha/api/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString()
  });
  const data = await resp.json();

  return data.success
    ? { success: true, captchaPass: emitirPaseCaptcha(claveSecreta, env) }
    : { success: false, error: 'Google rechazó el Captcha.', codes: data['error-codes'] || [] };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Método no permitido.' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim();
    const result = await verificarCaptcha(body.token, process.env.RECAPTCHA_SECRET_KEY, ip);
    return res.status(result.success ? 200 : 400).json(result);
  } catch (err) {
    console.error('Error verificando Captcha:', err);
    return res.status(500).json({ success: false, error: 'Error interno al verificar el Captcha.' });
  }
}
