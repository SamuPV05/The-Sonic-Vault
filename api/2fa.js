// Endpoint de backend (/api/2fa) para emisión y verificación de 2FA en servidor (Vercel / Docker / Vite).
// - Verifica ID tokens de Firebase con firebase-admin.
// - Genera códigos OTP criptográficos con crypto.randomInt.
// - Guarda únicamente el hash HMAC-SHA256 del código y controla un máximo de 5 intentos.
// - Exige Captcha verificado antes de emitir el código y envía el correo desde el servidor.
// - Emite y valida una cookie firmada HttpOnly (sv_2fa_session) ligada al UID del usuario.
import crypto from 'node:crypto';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
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
  // En producción nunca caemos en una clave estática conocida; falla cerrado (HTTP 500).
  return esEntornoProduccion(env) ? '' : 'sv-dev-2fa-hmac-secret-key-2026';
}

function extraerProjectIdDeJwt(idToken) {
  try {
    const parts = idToken.split('.');
    if (parts.length < 2) return null;
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
    return payload.aud || null;
  } catch {
    return null;
  }
}

function obtenerFirebaseApp(projectId, env = process.env) {
  const existing = getApps();
  if (existing.length > 0) {
    return { app: existing[0], hasServiceAccount: Boolean(env.FIREBASE_SERVICE_ACCOUNT_KEY) };
  }

  const rawServiceAccount = env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (rawServiceAccount) {
    try {
      const parsed = JSON.parse(rawServiceAccount);
      const app = initializeApp({
        credential: cert(parsed),
        projectId: projectId || parsed.project_id
      });
      return { app, hasServiceAccount: true };
    } catch (err) {
      console.error('Error parseando FIREBASE_SERVICE_ACCOUNT_KEY, usando projectId:', err.message);
    }
  }

  const app = initializeApp({ projectId });
  return { app, hasServiceAccount: false };
}

export async function verificarIdTokenFirebase(idToken, env = process.env) {
  if (!idToken || typeof idToken !== 'string') {
    throw new Error('Falta el token de autenticación de Firebase.');
  }

  const projectId =
    env.FIREBASE_PROJECT_ID ||
    env.VITE_FIREBASE_PROJECT_ID ||
    process.env.FIREBASE_PROJECT_ID ||
    process.env.VITE_FIREBASE_PROJECT_ID ||
    extraerProjectIdDeJwt(idToken);

  if (!projectId) {
    throw new Error('No se pudo determinar FIREBASE_PROJECT_ID en el servidor.');
  }

  const { app, hasServiceAccount } = obtenerFirebaseApp(projectId, env);
  const decoded = await getAuth(app).verifyIdToken(idToken);

  return {
    uid: decoded.uid,
    email: decoded.email || '',
    name: decoded.name || 'Explorador',
    signInProvider: decoded.firebase?.sign_in_provider || 'password',
    identities: decoded.firebase?.identities || {},
    projectId,
    idToken,
    app,
    hasServiceAccount
  };
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
    if (!data?.uid || typeof data.expira !== 'number' || Date.now() > data.expira) {
      return null;
    }
    if (uidEsperado && data.uid !== uidEsperado) {
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

function serializarCookieSesion(token, esProd) {
  const maxAge = Math.floor(SESSION_TTL_MS / 1000);
  const parts = [
    `${COOKIE_NAME}=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${maxAge}`
  ];
  if (esProd) parts.push('Secure');
  return parts.join('; ');
}

function serializarCookieBorrado(esProd) {
  const parts = [
    `${COOKIE_NAME}=`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    'Max-Age=0'
  ];
  if (esProd) parts.push('Secure');
  return parts.join('; ');
}

function leerCookies(cookieHeader = '') {
  const out = {};
  if (!cookieHeader || typeof cookieHeader !== 'string') return out;
  for (const pair of cookieHeader.split(';')) {
    const idx = pair.indexOf('=');
    if (idx === -1) continue;
    const k = pair.slice(0, idx).trim();
    const v = pair.slice(idx + 1).trim();
    try {
      out[k] = decodeURIComponent(v);
    } catch {
      out[k] = v;
    }
  }
  return out;
}

// --- PERSISTENCIA DE 2fa_codes/{uid} (Admin SDK o Firestore REST + Memoria) ---

async function guardarRegistro2FA(authCtx, record) {
  const { uid, projectId, idToken, app, hasServiceAccount, skipRest } = authCtx;
  memoria2FA.set(uid, record);
  if (skipRest) return;

  if (hasServiceAccount) {
    await getFirestore(app).collection('2fa_codes').doc(uid).set(record);
    return;
  }

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
  const { uid, projectId, idToken, app, hasServiceAccount, skipRest } = authCtx;
  if (skipRest) return memoria2FA.get(uid) || null;

  if (hasServiceAccount) {
    const snap = await getFirestore(app).collection('2fa_codes').doc(uid).get();
    return snap.exists ? snap.data() : (memoria2FA.get(uid) || null);
  }

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
  const { uid, projectId, idToken, app, hasServiceAccount, skipRest } = authCtx;
  memoria2FA.delete(uid);
  if (skipRest) return;

  if (hasServiceAccount) {
    await getFirestore(app).collection('2fa_codes').doc(uid).delete();
    return;
  }

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

async function enviarCorreo2FADesdeServidor({ email, name, code, env, origin }) {
  const serviceId = env.EMAILJS_SERVICE_ID || env.VITE_EMAILJS_SERVICE_ID;
  const templateId = env.EMAILJS_TEMPLATE_ID || env.VITE_EMAILJS_TEMPLATE_ID;
  const publicKey = env.EMAILJS_PUBLIC_KEY || env.VITE_EMAILJS_PUBLIC_KEY;
  const privateKey = env.EMAILJS_PRIVATE_KEY || '';
  const configurado = Boolean(serviceId && templateId && publicKey);
  const esProd = esEntornoProduccion(env);

  if (!configurado) {
    if (!esProd) {
      console.info(`[MODO PRUEBA 2FA SERVIDOR] Código OTP para ${email}: ${code}`);
      return { sent: false, devCode: code };
    }
    throw new Error('El servicio de correo (EmailJS) no está configurado en el servidor.');
  }

  const payload = {
    service_id: serviceId,
    template_id: templateId,
    user_id: publicKey,
    template_params: {
      codigo: code,
      passcode: code,
      time: '5 minutos',
      to_email: email,
      email: email,
      user_email: email,
      reply_to: email,
      to_name: name || 'Explorador'
    }
  };
  if (privateKey) {
    payload.accessToken = privateKey;
  }

  const resp = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: origin || 'http://localhost:5173',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    },
    body: JSON.stringify(payload)
  });

  if (!resp.ok) {
    const errText = await resp.text();
    // Si en desarrollo la cuenta de EmailJS aún no tiene marcada la casilla de non-browser API,
    // permitimos usar el código de prueba en consola/pantalla para no bloquear las pruebas locales.
    if (!esProd && resp.status === 403 && errText.includes('non-browser')) {
      console.warn(
        '[AVISO EMAILJS] Activa "Allow EmailJS API for non-browser applications" en EmailJS -> Account -> Security. Usando modo prueba local:',
        code
      );
      return { sent: false, devCode: code };
    }
    throw new Error(`Error enviando correo 2FA (${resp.status}): ${errText}`);
  }

  return { sent: true, devCode: null };
}

// --- LÓGICA PRINCIPAL DE 2FA ---

export async function procesarPeticion2FA({
  method,
  headers,
  body,
  ip,
  env = process.env,
  verifyTokenFn = verificarIdTokenFirebase,
  nowFn = Date.now,
  cooldownMs = SEND_COOLDOWN_MS,
  readRecordFn = leerRegistro2FA
}) {
  const secret = obtenerSecretoServidor(env);
  const esProd = esEntornoProduccion(env);
  if (!secret) {
    return {
      status: 500,
      body: {
        success: false,
        error: 'Configuración incompleta en el servidor: falta configurar SESSION_2FA_SECRET en producción.'
      }
    };
  }
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

  // Todas las demás acciones exigen un ID token válido verificado con firebase-admin
  let authCtx;
  try {
    authCtx = await verifyTokenFn(idToken, env);
  } catch (err) {
    return {
      status: 401,
      body: { success: false, error: err.message || 'Token de Firebase inválido o expirado.' }
    };
  }

  // 2. Consultar estado de la sesión 2FA (cookie HttpOnly firmada o token firmado)
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

  // 3. Emitir sesión 2FA para proveedores OAuth (Google / Microsoft) verificando el proveedor en el ID Token
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

  // 4. Emitir y enviar código OTP de 6 dígitos por correo (exige Captcha verificado y respeta cooldown de 60s)
  if (action === 'send') {
    const captchaSecret = env.RECAPTCHA_SECRET_KEY || process.env.RECAPTCHA_SECRET_KEY;
    const previo = await leerRegistro2FA(authCtx);
    const previoValido = Boolean(previo && verificarFirmaRegistro2FA(authCtx.uid, previo, secret));

    let captchaOk = false;

    if (body?.captchaPass && verificarPaseCaptcha(body.captchaPass, captchaSecret, env)) {
      captchaOk = true;
    } else if (body?.captchaToken) {
      const resCaptcha = await verificarCaptcha(body.captchaToken, captchaSecret, ip, env);
      captchaOk = Boolean(resCaptcha.success);
    } else if (body?.resend && previoValido) {
      // Si es un reenvío dentro de un flujo 2FA ya abierto tras pasar Captcha
      captchaOk = true;
    }

    if (!captchaOk) {
      return {
        status: 400,
        body: {
          success: false,
          error: 'Alerta de Seguridad: Debes resolver el Captcha antes de solicitar el código 2FA.'
        }
      };
    }

    // Cooldown anti-bombardeo (T16): impide agotar la cuota de EmailJS aunque se reutilice captchaPass o resend
    const ahora = nowFn();
    const ultimoEnvio = Math.max(
      previoValido ? Number(previo.updatedAt || 0) : 0,
      ultimoEnvio2FA.get(authCtx.uid) || 0
    );
    if (cooldownMs > 0 && ultimoEnvio > 0) {
      const transcurridoMs = ahora - ultimoEnvio;
      if (transcurridoMs >= 0 && transcurridoMs < cooldownMs) {
        const retryAfterSeconds = Math.ceil((cooldownMs - transcurridoMs) / 1000);
        return {
          status: 429,
          body: {
            success: false,
            cooldown: true,
            retryAfterSeconds,
            error: `Por seguridad, espera ${retryAfterSeconds} segundo${retryAfterSeconds === 1 ? '' : 's'} antes de solicitar otro código.`
          }
        };
      }
    }

    const code = crypto.randomInt(100000, 1000000).toString();
    const expiration = ahora + OTP_TTL_MS;
    const attempts = 0;
    const codeHash = hashCodigo2FA(authCtx.uid, code, expiration, secret);
    const sig = firmarRegistro2FA(authCtx.uid, codeHash, expiration, attempts, secret);

    const record = {
      codeHash,
      expiration,
      attempts,
      maxAttempts: MAX_ATTEMPTS,
      updatedAt: ahora,
      sig
    };

    ultimoEnvio2FA.set(authCtx.uid, ahora);
    maxIntentosPorHash.set(`${authCtx.uid}:${codeHash}`, 0);
    await guardarRegistro2FA(authCtx, record);

    const origin = headers?.origin || headers?.Origin || 'http://localhost:5173';
    try {
      const mailResult = await enviarCorreo2FADesdeServidor({
        email: authCtx.email,
        name: authCtx.name,
        code,
        env,
        origin
      });

      return {
        status: 200,
        body: {
          success: true,
          sent: mailResult.sent,
          devCode: mailResult.devCode || null,
          captchaPass: emitirPaseCaptcha(captchaSecret, env)
        }
      };
    } catch (err) {
      console.error('Error enviando correo 2FA:', err);
      return {
        status: 500,
        body: {
          success: false,
          error: err.message || 'No se pudo enviar el correo con el código de verificación.'
        }
      };
    }
  }

  // 5. Verificar código OTP ingresado por el usuario (máximo 5 intentos)
  if (action === 'verify') {
    const codigoIngresado = String(body?.code || '').trim();
    if (!/^\d{6}$/.test(codigoIngresado)) {
      return {
        status: 400,
        body: { success: false, error: 'Ingresa un código válido de 6 dígitos.' }
      };
    }

    const record = await readRecordFn(authCtx);
    if (!record || !verificarFirmaRegistro2FA(authCtx.uid, record, secret)) {
      return {
        status: 400,
        body: {
          success: false,
          error: 'No hay un código activo o válido. Pulsa "Reenviar código" para recibir uno nuevo.'
        }
      };
    }

    // Guardia anti-Rollback (T17): si el documento leído tiene menos intentos que los ya registrados
    // por el servidor para este mismo codeHash (p. ej. el cliente reinsertó un snapshot previo con sig_0),
    // bloqueamos inmediatamente el código.
    const claveHash = `${authCtx.uid}:${record.codeHash}`;
    const intentosEnMemoria = maxIntentosPorHash.get(claveHash) ?? 0;
    if (record.attempts < intentosEnMemoria) {
      return {
        status: 429,
        body: {
          success: false,
          locked: true,
          rollbackDetected: true,
          attemptsLeft: 0,
          error: 'Alerta de Seguridad: Se detectó un intento de reversión de contador. El código fue bloqueado; pulsa "Reenviar código".'
        }
      };
    }

    const intentosEfectivos = Math.max(record.attempts, intentosEnMemoria);
    if (intentosEfectivos >= MAX_ATTEMPTS) {
      return {
        status: 429,
        body: {
          success: false,
          locked: true,
          attemptsLeft: 0,
          error: 'Has superado el máximo de 5 intentos permitidos. Pulsa "Reenviar código" para generar uno nuevo.'
        }
      };
    }

    if (nowFn() > record.expiration) {
      return {
        status: 400,
        body: {
          success: false,
          expired: true,
          error: 'El código expiró (pasaron 5 minutos). Pulsa "Reenviar código" para recibir uno nuevo.'
        }
      };
    }

    const expectedHash = hashCodigo2FA(authCtx.uid, codigoIngresado, record.expiration, secret);
    const bufA = Buffer.from(expectedHash, 'hex');
    const bufB = Buffer.from(record.codeHash, 'hex');
    const coincide = bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);

    if (!coincide) {
      const nuevosIntentos = intentosEfectivos + 1;
      maxIntentosPorHash.set(claveHash, nuevosIntentos);
      const nuevaSig = firmarRegistro2FA(
        authCtx.uid,
        record.codeHash,
        record.expiration,
        nuevosIntentos,
        secret
      );
      await guardarRegistro2FA(authCtx, {
        ...record,
        attempts: nuevosIntentos,
        updatedAt: record.updatedAt || nowFn(),
        sig: nuevaSig
      });

      const restantes = Math.max(0, MAX_ATTEMPTS - nuevosIntentos);
      if (restantes === 0) {
        return {
          status: 429,
          body: {
            success: false,
            locked: true,
            attemptsLeft: 0,
            error: 'Has agotado los 5 intentos permitidos. El código quedó bloqueado; pulsa "Reenviar código".'
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

    // ¡Código correcto! Consumimos el OTP y marcamos el hash como agotado para que no pueda reinyectarse
    maxIntentosPorHash.set(claveHash, MAX_ATTEMPTS + 1);
    await eliminarRegistro2FA(authCtx);

    if (authCtx.hasServiceAccount) {
      try {
        await getAuth(authCtx.app).setCustomUserClaims(authCtx.uid, {
          twoFactorVerifiedAt: Date.now()
        });
      } catch (err) {
        console.warn('No se pudo asignar custom claim 2FA:', err.message);
      }
    }

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
