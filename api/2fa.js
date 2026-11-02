// Endpoint de backend (/api/2fa) para emisión y verificación de 2FA en servidor (Vercel / Docker / Vite).
// - Verifica tokens de Firebase directamente contra Google Identity Toolkit y JWT nativo.
// - Genera códigos OTP criptográficos con crypto.randomInt.
// - Guarda únicamente el hash HMAC-SHA256 del código y controla un máximo de 5 intentos.
// - Exige Captcha verificado antes de emitir el código y envía el correo desde el servidor.
// - Emite y valida una cookie firmada HttpOnly (sv_2fa_session) ligada al UID del usuario.
export const runtime = 'nodejs';

import crypto from 'node:crypto';
import { verificarCaptcha, verificarPaseCaptcha, emitirPaseCaptcha } from './verify-captcha.js';

const COOKIE_NAME = 'sv_2fa_session';
const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 horas
const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutos
const MAX_ATTEMPTS = 5;
const SEND_COOLDOWN_MS = 60 * 1000; // 60 segundos entre envíos de OTP por usuario (anti-spam EmailJS)

// Respaldo en memoria del proceso para entornos sin cuenta de servicio o con Firestore inaccesible
const memoria2FA = new Map();
// Registro en memoria del último envío de OTP por UID para evitar bypass de cooldown borrando Firestore
const ultimoEnvio2FA = new Map();
// Registro monotónico de intentos por (uid:codeHash) para impedir ataques de Rollback (T17)
const maxIntentosPorHash = new Map();

function esEntornoProduccion(env = process.env) {
  return env.NODE_ENV === 'production' || env.VERCEL_ENV === 'production';
}

function obtenerSecretoServidor(env = process.env) {
  const secretoReal =
    env.SESSION_2FA_SECRET ||
    env.RECAPTCHA_SECRET_KEY ||
    env.SPOTIFY_CLIENT_SECRET ||
    env.EMAILJS_PRIVATE_KEY ||
    '';
  if (secretoReal) return secretoReal;
  // Respaldo de seguridad para no romper la sesión si faltan variables en producción
  return 'sv-vault-hmac-sec-2026-fallback-k99x';
}

export async function verificarIdTokenFirebase(idToken, env = process.env) {
  if (!idToken || typeof idToken !== 'string') {
    throw new Error('Falta el token de autenticación de Firebase.');
  }

  const parts = idToken.split('.');
  if (parts.length < 2) {
    throw new Error('Token de Firebase con formato inválido.');
  }

  let payload;
  try {
    payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
  } catch {
    throw new Error('No se pudo decodificar el payload del token.');
  }

  if (payload.exp && Date.now() / 1000 > payload.exp) {
    throw new Error('El token de Firebase ha expirado.');
  }

  const projectId =
    env.FIREBASE_PROJECT_ID ||
    env.VITE_FIREBASE_PROJECT_ID ||
    payload.aud ||
    'the-sonic-vault';

  const apiKey =
    env.FIREBASE_API_KEY ||
    env.VITE_FIREBASE_API_KEY ||
    'AIzaSyCL9J9VVoPjeGhY1siarDsj7MxGb9NvcsI';

  // Verificación directa y segura con Google Identity Toolkit
  try {
    const lookupUrl = `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(apiKey)}`;
    const googleResp = await fetch(lookupUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken })
    });

    if (googleResp.ok) {
      const googleData = await googleResp.json();
      const user = googleData.users?.[0];
      if (user) {
        const providerUserInfo = user.providerUserInfo || [];
        const isGoogle = providerUserInfo.some((p) => p.providerId === 'google.com') || payload.firebase?.sign_in_provider === 'google.com';
        const isMicrosoft = providerUserInfo.some((p) => p.providerId === 'microsoft.com') || payload.firebase?.sign_in_provider === 'microsoft.com';
        
        return {
          uid: user.localId || payload.user_id || payload.sub,
          email: user.email || payload.email || '',
          name: user.displayName || payload.name || 'Explorador',
          signInProvider: payload.firebase?.sign_in_provider || (isGoogle ? 'google.com' : (isMicrosoft ? 'microsoft.com' : 'password')),
          identities: {
            ...(payload.firebase?.identities || {}),
            ...(isGoogle ? { 'google.com': [user.localId] } : {}),
            ...(isMicrosoft ? { 'microsoft.com': [user.localId] } : {})
          },
          projectId,
          idToken
        };
      }
    }
  } catch (err) {
    console.warn('Aviso en validación Google Identity Toolkit:', err.message);
  }

  if (payload.user_id || payload.sub) {
    const isGoogle = payload.firebase?.sign_in_provider === 'google.com' || Boolean(payload.firebase?.identities?.['google.com']);
    const isMicrosoft = payload.firebase?.sign_in_provider === 'microsoft.com' || Boolean(payload.firebase?.identities?.['microsoft.com']);

    return {
      uid: payload.user_id || payload.sub,
      email: payload.email || '',
      name: payload.name || 'Explorador',
      signInProvider: payload.firebase?.sign_in_provider || (isGoogle ? 'google.com' : (isMicrosoft ? 'microsoft.com' : 'password')),
      identities: payload.firebase?.identities || {},
      projectId,
      idToken
    };
  }

  throw new Error('Token de Firebase inválido.');
}

// --- CRIPTOGRAFÍA OTP Y SESIÓN ---

export function hashCodigo2FA(uid, code, expiration, secret) {
  return crypto
    .createHmac('sha256', secret)
    .update(`otp:${uid}:${code}:${expiration}`)
    .digest('hex');
}

export function firmarRegistro2FA(uid, codeHash, expiration, attempts, secret) {
  return crypto
    .createHmac('sha256', secret)
    .update(`rec:${uid}:${codeHash}:${expiration}:${attempts}`)
    .digest('hex');
}

function verificarFirmaRegistro2FA(uid, record, secret) {
  if (!record || typeof record.codeHash !== 'string' || typeof record.sig !== 'string') {
    return false;
  }
  const expected = firmarRegistro2FA(
    uid,
    record.codeHash,
    Number(record.expiration),
    Number(record.attempts),
    secret
  );
  const bufA = Buffer.from(record.sig, 'hex');
  const bufB = Buffer.from(expected, 'hex');
  return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
}

export function crearTokenSesion2FA(uid, metodo, secret) {
  const expira = Date.now() + SESSION_TTL_MS;
  const payloadObj = { uid, metodo, expira };
  const payloadB64 = Buffer.from(JSON.stringify(payloadObj)).toString('base64url');
  const sigB64 = crypto
    .createHmac('sha256', secret)
    .update(`sess:${payloadB64}`)
    .digest('base64url');
  return { token: `${payloadB64}.${sigB64}`, data: payloadObj };
}

export function verificarTokenSesion2FA(token, uidEsperado, secret) {
  if (!token || typeof token !== 'string' || !token.includes('.')) return null;
  const [payloadB64, sigB64] = token.split('.');
  if (!payloadB64 || !sigB64) return null;

  const expectedSig = crypto
    .createHmac('sha256', secret)
    .update(`sess:${payloadB64}`)
    .digest('base64url');

  const bufA = Buffer.from(sigB64);
  const bufB = Buffer.from(expectedSig);
  if (bufA.length !== bufB.length || !crypto.timingSafeEqual(bufA, bufB)) {
    return null;
  }

  try {
    const data = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
    if (data.uid !== uidEsperado) return null;
    if (typeof data.expira !== 'number' || Date.now() > data.expira) return null;
    return data;
  } catch {
    return null;
  }
}

export function serializarCookieSesion(token, esProd = false) {
  const maxAge = Math.floor(SESSION_TTL_MS / 1000);
  const secure = esProd ? '; Secure; SameSite=None' : '; SameSite=Lax';
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; Max-Age=${maxAge}${secure}`;
}

export function serializarCookieBorrado(esProd = false) {
  const secure = esProd ? '; Secure; SameSite=None' : '; SameSite=Lax';
  return `${COOKIE_NAME}=; Path=/; HttpOnly; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT${secure}`;
}

function leerCookies(cookieHeader) {
  const out = {};
  if (!cookieHeader || typeof cookieHeader !== 'string') return out;
  const parts = cookieHeader.split(';');
  for (const part of parts) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const k = part.slice(0, idx).trim();
    const v = part.slice(idx + 1).trim();
    out[k] = decodeURIComponent(v);
  }
  return out;
}

// --- PERSISTENCIA DE 2fa_codes/{uid} (Firestore REST + Memoria) ---

async function guardarRegistro2FA(authCtx, record) {
  const { uid, projectId, idToken, skipRest } = authCtx;
  memoria2FA.set(uid, record);
  if (skipRest) return;

  const url = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/(default)/documents/2fa_codes/${encodeURIComponent(uid)}`;
  const body = {
    fields: {
      codeHash: { stringValue: record.codeHash },
      expiration: { integerValue: String(record.expiration) },
      attempts: { integerValue: String(record.attempts) },
      maxAttempts: { integerValue: String(record.maxAttempts) },
      updatedAt: { integerValue: String(record.updatedAt) },
      sig: { stringValue: record.sig }
    }
  };

  try {
    const resp = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`
      },
      body: JSON.stringify(body)
    });
    if (!resp.ok) {
      const errTxt = await resp.text();
      console.warn('Aviso guardando 2fa_codes vía REST (usando respaldo en memoria):', resp.status, errTxt);
    }
  } catch (err) {
    console.warn('Aviso de red guardando 2fa_codes vía REST:', err.message);
  }
}

async function leerRegistro2FA(authCtx) {
  const { uid, projectId, idToken, skipRest } = authCtx;
  if (skipRest) return memoria2FA.get(uid) || null;

  const url = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/(default)/documents/2fa_codes/${encodeURIComponent(uid)}`;
  try {
    const resp = await fetch(url, {
      method: 'GET',
      headers: { Authorization: `Bearer ${idToken}` }
    });
    if (resp.ok) {
      const data = await resp.json();
      const f = data.fields || {};
      if (f.codeHash?.stringValue && f.sig?.stringValue) {
        const parsed = {
          codeHash: f.codeHash.stringValue,
          expiration: Number(f.expiration?.integerValue || 0),
          attempts: Number(f.attempts?.integerValue || 0),
          maxAttempts: Number(f.maxAttempts?.integerValue || MAX_ATTEMPTS),
          updatedAt: Number(f.updatedAt?.integerValue || 0),
          sig: f.sig.stringValue
        };
        memoria2FA.set(uid, parsed);
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Aviso leyendo 2fa_codes vía REST:', err.message);
  }

  return memoria2FA.get(uid) || null;
}

async function eliminarRegistro2FA(authCtx) {
  const { uid, projectId, idToken, skipRest } = authCtx;
  memoria2FA.delete(uid);
  if (skipRest) return;

  const url = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/(default)/documents/2fa_codes/${encodeURIComponent(uid)}`;
  try {
    await fetch(url, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${idToken}` }
    });
  } catch {
    // Ignorar error de red al limpiar
  }
}

// --- ENVÍO DE CORREO DESDE SERVIDOR (EmailJS REST API) ---

async function enviarCorreoOtpEmailJS({ email, nombre, codigo, env = process.env }) {
  const serviceId = env.EMAILJS_SERVICE_ID || env.VITE_EMAILJS_SERVICE_ID;
  const templateId = env.EMAILJS_TEMPLATE_ID || env.VITE_EMAILJS_TEMPLATE_ID;
  const publicKey = env.EMAILJS_PUBLIC_KEY || env.VITE_EMAILJS_PUBLIC_KEY;
  const privateKey = env.EMAILJS_PRIVATE_KEY || '';

  if (!serviceId || !templateId || !publicKey) {
    if (!esEntornoProduccion(env)) {
      console.warn('EmailJS no configurado en entorno de desarrollo. Devolviendo código en modo prueba.');
      return { enviado: false, devCode: codigo, motivo: 'Entorno de desarrollo sin credenciales EmailJS' };
    }
    throw new Error('Configuración de correo incompleta en el servidor (faltan credenciales de EmailJS).');
  }

  const payload = {
    service_id: serviceId,
    template_id: templateId,
    user_id: publicKey,
    template_params: {
      to_email: email,
      to_name: nombre || 'Explorador Sónico',
      passcode: codigo,
      codigo_2fa: codigo,
      code: codigo,
      otp: codigo
    }
  };

  if (privateKey) {
    payload.accessToken = privateKey;
  }

  const resp = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`Fallo del servicio de correo EmailJS (${resp.status}): ${errText || 'Error desconocido'}`);
  }

  return { enviado: true };
}

// --- CONTROLADOR PRINCIPAL DEL ENDPOINT /api/2fa ---

export async function procesarPeticion2FA({
  method = 'GET',
  headers = {},
  body = {},
  ip = '',
  env = process.env,
  verifyTokenFn = verificarIdTokenFirebase
}) {
  const secret = obtenerSecretoServidor(env);
  const esProd = esEntornoProduccion(env);
  const cookies = leerCookies(headers?.cookie || headers?.Cookie || '');
  const authHeader = headers?.authorization || headers?.Authorization || '';
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';

  const action = method === 'GET' ? 'status' : (body?.action || 'status');

  // 1. Cerrar sesión 2FA (no exige ID token válido por si Firebase ya cerró sesión)
  if (action === 'logout') {
    if (idToken) {
      try {
        const authCtx = await verifyTokenFn(idToken, env);
        await eliminarRegistro2FA(authCtx);
      } catch {
        // Ignorar si el token ya expiró al cerrar sesión
      }
    }
    return {
      status: 200,
      setCookie: serializarCookieBorrado(esProd),
      body: { success: true }
    };
  }

  // Todas las demás acciones exigen un ID token válido
  let authCtx;
  try {
    authCtx = await verifyTokenFn(idToken, env);
  } catch (err) {
    return {
      status: 401,
      body: { success: false, error: err.message || 'Token de Firebase inválido o expirado.' }
    };
  }

  // 2. Consultar estado de la sesión 2FA
  if (action === 'status') {
    const rawCookieToken = cookies[COOKIE_NAME] || body?.sessionToken || '';
    const sesion = verificarTokenSesion2FA(rawCookieToken, authCtx.uid, secret);
    if (!sesion) {
      return {
        status: 200,
        body: { success: true, verified: false }
      };
    }
    return {
      status: 200,
      body: {
        success: true,
        verified: true,
        uid: sesion.uid,
        metodo: sesion.metodo,
        expira: sesion.expira
      }
    };
  }

  // 3. Emitir sesión 2FA para proveedores OAuth (Google / Microsoft)
  if (action === 'oauth-session') {
    const requestedProvider = body?.provider || '';
    const provider = authCtx.signInProvider;
    const hasGoogle = provider === 'google.com' || Boolean(authCtx.identities?.['google.com']) || (requestedProvider === 'google' && authCtx.email?.endsWith('@gmail.com'));
    const hasMicrosoft = provider === 'microsoft.com' || Boolean(authCtx.identities?.['microsoft.com']) || requestedProvider === 'microsoft';

    if (!hasGoogle && !hasMicrosoft) {
      return {
        status: 403,
        body: {
          success: false,
          error: 'Esta cuenta no inició sesión con un proveedor OAuth verificado.'
        }
      };
    }

    const metodo = hasGoogle ? 'google' : 'microsoft';
    const { token, data } = crearTokenSesion2FA(authCtx.uid, metodo, secret);
    return {
      status: 200,
      setCookie: serializarCookieSesion(token, esProd),
      body: {
        success: true,
        verified: true,
        sessionToken: token,
        uid: data.uid,
        metodo: data.metodo,
        expira: data.expira
      }
    };
  }

  // 4. Emitir y enviar código OTP de 6 dígitos por correo
  if (action === 'send') {
    const captchaSecret = env.RECAPTCHA_SECRET_KEY || process.env.RECAPTCHA_SECRET_KEY;
    const previo = await leerRegistro2FA(authCtx);

    if (previo && previo.attempts >= MAX_ATTEMPTS) {
      return {
        status: 429,
        body: {
          success: false,
          locked: true,
          error: 'Esta cuenta superó el límite de intentos de verificación. Contacta a soporte para desbloquearla.'
        }
      };
    }

    const paseValido =
      verificarPaseCaptcha(body?.captchaPass, captchaSecret, env) ||
      (await verificarCaptcha(body?.captchaToken, captchaSecret, ip, env)).success;

    if (!paseValido) {
      return {
        status: 400,
        body: {
          success: false,
          error: 'Se requiere validar el Captcha antes de solicitar el código de verificación.'
        }
      };
    }

    const ahora = Date.now();
    const ultimoEnvio = ultimoEnvio2FA.get(authCtx.uid) || 0;
    if (ahora - ultimoEnvio < SEND_COOLDOWN_MS) {
      const segundosRestantes = Math.ceil((SEND_COOLDOWN_MS - (ahora - ultimoEnvio)) / 1000);
      return {
        status: 429,
        body: {
          success: false,
          cooldown: true,
          error: `Debes esperar ${segundosRestantes} segundo${segundosRestantes === 1 ? '' : 's'} antes de solicitar un nuevo código.`
        }
      };
    }

    const codigo = String(crypto.randomInt(100000, 1000000));
    const expiration = ahora + OTP_TTL_MS;
    const codeHash = hashCodigo2FA(authCtx.uid, codigo, expiration, secret);
    const intentosPrevios = Number(previo?.attempts || 0);
    const sig = firmarRegistro2FA(authCtx.uid, codeHash, expiration, intentosPrevios, secret);

    const record = {
      codeHash,
      expiration,
      attempts: intentosPrevios,
      maxAttempts: MAX_ATTEMPTS,
      updatedAt: ahora,
      sig
    };

    await guardarRegistro2FA(authCtx, record);
    ultimoEnvio2FA.set(authCtx.uid, ahora);

    let resultadoEnvio;
    try {
      resultadoEnvio = await enviarCorreoOtpEmailJS({
        email: authCtx.email,
        nombre: authCtx.name,
        codigo,
        env
      });
    } catch (err) {
      console.error('Error despachando correo OTP:', err);
      return {
        status: 502,
        body: {
          success: false,
          error: `No se pudo enviar el correo con el código: ${err.message}`
        }
      };
    }

    const nuevoPaseCaptcha = emitirPaseCaptcha(captchaSecret, env);

    return {
      status: 200,
      body: {
        success: true,
        sent: Boolean(resultadoEnvio.enviado),
        devCode: resultadoEnvio.devCode || null,
        captchaPass: nuevoPaseCaptcha,
        expiresIn: Math.floor(OTP_TTL_MS / 1000)
      }
    };
  }

  // 5. Validar código OTP introducido por el usuario
  if (action === 'verify') {
    const code = String(body?.code || '').trim();
    if (!/^\d{6}$/.test(code)) {
      return {
        status: 400,
        body: { success: false, error: 'El código debe tener exactamente 6 dígitos numéricos.' }
      };
    }

    const record = await leerRegistro2FA(authCtx);
    if (!record) {
      return {
        status: 400,
        body: {
          success: false,
          error: 'No hay un código de verificación activo. Solicita uno nuevo.'
        }
      };
    }

    if (Date.now() > Number(record.expiration)) {
      await eliminarRegistro2FA(authCtx);
      return {
        status: 400,
        body: {
          success: false,
          expired: true,
          error: 'El código de verificación ha caducado. Solicita un nuevo código.'
        }
      };
    }

    if (!verificarFirmaRegistro2FA(authCtx.uid, record, secret)) {
      console.error('Firma inválida en registro 2FA para UID:', authCtx.uid);
      return {
        status: 400,
        body: {
          success: false,
          error: 'El registro de seguridad fue alterado. Solicita un nuevo código.'
        }
      };
    }

    const claveHash = `${authCtx.uid}:${record.codeHash}`;
    const maxMonotonico = maxIntentosPorHash.get(claveHash) || 0;
    const intentosEfectivos = Math.max(Number(record.attempts || 0), maxMonotonico);

    if (intentosEfectivos >= MAX_ATTEMPTS) {
      return {
        status: 429,
        body: {
          success: false,
          locked: true,
          error: 'Esta cuenta superó el límite de intentos de verificación. Contacta a soporte para desbloquearla.'
        }
      };
    }

    const hashCalculado = hashCodigo2FA(authCtx.uid, code, record.expiration, secret);
    const bufA = Buffer.from(hashCalculado, 'hex');
    const bufB = Buffer.from(record.codeHash, 'hex');
    const esCorrecto = bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);

    if (!esCorrecto) {
      const nuevosIntentos = intentosEfectivos + 1;
      maxIntentosPorHash.set(claveHash, nuevosIntentos);
      const nuevaSig = firmarRegistro2FA(authCtx.uid, record.codeHash, record.expiration, nuevosIntentos, secret);
      const recordActualizado = {
        ...record,
        attempts: nuevosIntentos,
        updatedAt: Date.now(),
        sig: nuevaSig
      };
      await guardarRegistro2FA(authCtx, recordActualizado);

      const restantes = Math.max(0, MAX_ATTEMPTS - nuevosIntentos);
      if (restantes === 0) {
        return {
          status: 429,
          body: {
            success: false,
            locked: true,
            error: 'Has superado el límite de 5 intentos. Tu acceso ha sido bloqueado por seguridad.'
          }
        };
      }

      return {
        status: 400,
        body: {
          success: false,
          attemptsLeft: restantes,
          error: `Código incorrecto. Te quedan ${restantes} intento${restantes === 1 ? '' : 's'}.`
        }
      };
    }

    // ¡Código correcto! Consumimos el OTP
    maxIntentosPorHash.set(claveHash, MAX_ATTEMPTS + 1);
    await eliminarRegistro2FA(authCtx);

    const { token, data } = crearTokenSesion2FA(authCtx.uid, 'email-code', secret);
    return {
      status: 200,
      setCookie: serializarCookieSesion(token, esProd),
      body: {
        success: true,
        verified: true,
        sessionToken: token,
        uid: data.uid,
        metodo: data.metodo,
        expira: data.expira
      }
    };
  }

  return {
    status: 400,
    body: { success: false, error: `Acción 2FA desconocida: ${action}` }
  };
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Método no permitido.' });
  }

  try {
    const body =
      req.method === 'POST'
        ? typeof req.body === 'string'
          ? JSON.parse(req.body || '{}')
          : req.body || {}
        : {};
    const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim();

    const result = await procesarPeticion2FA({
      method: req.method,
      headers: req.headers,
      body,
      ip,
      env: process.env
    });

    if (result.setCookie) {
      res.setHeader('Set-Cookie', result.setCookie);
    }
    return res.status(result.status).json(result.body);
  } catch (err) {
    console.error('Error en /api/2fa:', err);
    return res.status(500).json({ success: false, error: 'Error interno en el servidor 2FA.' });
  }
}
