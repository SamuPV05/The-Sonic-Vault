// Función serverless (Vercel): verifica con Google que el token del Captcha es real.
// La llave secreta vive SOLO aquí (variable de entorno), nunca en el navegador.

// Llave secreta de PRUEBA oficial de Google. Se usa solo en desarrollo si aún no configuraste la real.
const TEST_SECRET = '6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe';

export async function verificarCaptcha(token, secret, ip) {
  if (!token) return { success: false, error: 'Falta el token del Captcha.' };

  const esProduccion = process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production';
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
    ? { success: true }
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
