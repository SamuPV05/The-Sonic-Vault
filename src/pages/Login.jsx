import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import ReCAPTCHA from 'react-google-recaptcha';

const CAPTCHA_PASS_KEY = 'sv_captcha_pass';

const guardarPaseCaptcha = (pase) => {
  try {
    if (pase) sessionStorage.setItem(CAPTCHA_PASS_KEY, pase);
    else sessionStorage.removeItem(CAPTCHA_PASS_KEY);
  } catch {
    // Ignorar errores de sessionStorage
  }
};

const leerPaseCaptcha = () => {
  try {
    return sessionStorage.getItem(CAPTCHA_PASS_KEY);
  } catch {
    return null;
  }
};

export default function Login() {
  const {
    login,
    signup,
    loginWithGoogle,
    loginWithMicrosoft,
    cancelarRegistroPendiente,
    user,
    pending2FAUser,
    is2FAPassed,
    is2FAPending,
    oauthEnCurso,
    send2FACode,
    verify2FA
  } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectNotice = location.state?.notice || null;

  // Estados del formulario
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState(''); // Solo se usa al registrarse
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [captchaValido, setCaptchaValido] = useState(false);
  const [captchaPass, setCaptchaPass] = useState(() => leerPaseCaptcha());
  const [verificandoCaptcha, setVerificandoCaptcha] = useState(false);
  const recaptchaRef = useRef(null);

  // Estados para Recuperación de Contraseña
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [resetError, setResetError] = useState(null);
  const [resetSuccess, setResetSuccess] = useState(null);

  // Llave pública del Captcha. La clave de prueba de Google solo se permite en desarrollo.
  const TEST_RECAPTCHA_SITE_KEY = '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI';
  const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY || (import.meta.env.DEV ? TEST_RECAPTCHA_SITE_KEY : '');

  // Estados del 2FA (generado y verificado exclusivamente en el servidor /api/2fa)
  const [codigo2FA, setCodigo2FA] = useState('');
  const [codigoEnviado, setCodigoEnviado] = useState(false);
  const [codigoPrueba, setCodigoPrueba] = useState(null); // Solo en desarrollo si el servidor está en modo prueba
  const [bloqueado2FA, setBloqueado2FA] = useState(false);
  const [aviso2FA, setAviso2FA] = useState(null);
  const envioEnCursoRef = useRef(false);

  // Lógica de Envío 2FA Automático desde servidor (solo para correo/contraseña; OAuth ya viene verificado)
  useEffect(() => {
    if (user && is2FAPassed) {
      guardarPaseCaptcha(null);
      navigate('/perfil');
      return;
    }
    const targetUser = pending2FAUser || (is2FAPending ? auth.currentUser : null);
    if (!targetUser || is2FAPassed || oauthEnCurso || codigoEnviado || envioEnCursoRef.current) return;

    const paseActivo = captchaPass || leerPaseCaptcha();
    envioEnCursoRef.current = true;
    send2FACode({ captchaPass: paseActivo, resend: false })
      .then((res) => {
        if (res.captchaPass) {
          setCaptchaPass(res.captchaPass);
          guardarPaseCaptcha(res.captchaPass);
        }
        setCodigoPrueba(res.devCode || null);
        setBloqueado2FA(false);
        setCodigoEnviado(true);
      })
      .catch((err) => {
        console.error('Error enviando código 2FA:', err);
        setError(err?.message || 'Error al intentar enviar el correo con el código desde el servidor.');
      })
      .finally(() => {
        envioEnCursoRef.current = false;
      });
  }, [user, pending2FAUser, is2FAPending, is2FAPassed, oauthEnCurso, codigoEnviado, captchaPass, send2FACode, navigate]);

  const handleVerificar2FA = async () => {
    setIsLoading(true);
    setError(null);
    setAviso2FA(null);
    try {
      await verify2FA(codigo2FA);
      guardarPaseCaptcha(null);
    } catch (err) {
      console.error('Error verificando código 2FA:', err);
      if (err?.locked) {
        setBloqueado2FA(true);
      }
      setError(err?.message || 'Error al verificar el código con el servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReenviarCodigo = async () => {
    setIsLoading(true);
    setError(null);
    setAviso2FA(null);
    try {
      const paseActivo = captchaPass || leerPaseCaptcha();
      const res = await send2FACode({ captchaPass: paseActivo, resend: true });
      if (res.captchaPass) {
        setCaptchaPass(res.captchaPass);
        guardarPaseCaptcha(res.captchaPass);
      }
      setCodigoPrueba(res.devCode || null);
      setBloqueado2FA(false);
      setCodigoEnviado(true);
      setCodigo2FA('');
      setAviso2FA(res.devCode ? 'Nuevo código de prueba generado en el servidor.' : '¡Se ha enviado un nuevo código a tu correo!');
    } catch (err) {
      console.error('Error al reenviar código:', err);
      setError(err?.message || 'No se pudo reenviar el código.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelar2FA = async () => {
    setCodigoEnviado(false);
    setCodigoPrueba(null);
    setBloqueado2FA(false);
    setAviso2FA(null);
    setCodigo2FA('');
    setError(null);
    setCaptchaValido(false);
    setCaptchaPass(null);
    guardarPaseCaptcha(null);
    // Si era un registro sin verificar, la cuenta se elimina; si no, solo cierra sesión
    await cancelarRegistroPendiente();
  };

  // Cuando el usuario resuelve el Captcha, el servidor lo confirma con Google y emite un pase firmado
  const handleCaptchaChange = async (token) => {
    setCaptchaValido(false);
    setCaptchaPass(null);
    guardarPaseCaptcha(null);
    if (!token) return; // Expiró o se reinició

    setVerificandoCaptcha(true);
    setError(null);
    try {
      const resp = await fetch('/api/verify-captcha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });
      const rawText = await resp.text();
      let data;
      try {
        data = JSON.parse(rawText);
      } catch {
        data = { success: false, error: 'El servidor de verificación no respondió adecuadamente.' };
      }
      if (data.success) {
        setCaptchaValido(true);
        if (data.captchaPass) {
          setCaptchaPass(data.captchaPass);
          guardarPaseCaptcha(data.captchaPass);
        }
      } else {
        console.error('Captcha rechazado:', data);
        setError('El servidor rechazó el Captcha. Inténtalo de nuevo.');
        recaptchaRef.current?.reset();
      }
    } catch (err) {
      console.error('Error verificando Captcha:', err);
      setError('No se pudo verificar el Captcha con el servidor.');
      recaptchaRef.current?.reset();
    } finally {
      setVerificandoCaptcha(false);
    }
  };

  // Tras un intento fallido se exige un Captcha nuevo (frena ataques de fuerza bruta)
  const reiniciarCaptcha = () => {
    setCaptchaValido(false);
    setCaptchaPass(null);
    guardarPaseCaptcha(null);
    recaptchaRef.current?.reset();
  };

  // Manejo de Recuperación de Contraseña
  const handleSendPasswordReset = async (e) => {
    e?.preventDefault();
    if (!resetEmail || !resetEmail.trim()) {
      setResetError('Por favor ingresa tu correo electrónico registrado.');
      return;
    }
    setIsResetting(true);
    setResetError(null);
    setResetSuccess(null);
    try {
      await sendPasswordResetEmail(auth, resetEmail.trim());
      setResetSuccess(`Se ha enviado un enlace de recuperación a ${resetEmail.trim()}. Revisa tu bandeja de entrada o la carpeta de spam.`);
    } catch (err) {
      console.error('Error al enviar correo de recuperación:', err);
      if (err.code === 'auth/user-not-found') {
        setResetError('No existe ninguna cuenta registrada con este correo.');
      } else if (err.code === 'auth/invalid-email') {
        setResetError('El formato del correo no es válido.');
      } else if (err.code === 'auth/too-many-requests') {
        setResetError('Demasiados intentos. Por favor espera unos minutos antes de reintentar.');
      } else {
        setResetError(getFirebaseErrorMessage(err.code) || err.message || 'Error al enviar el enlace de recuperación.');
      }
    } finally {
      setIsResetting(false);
    }
  };

  // Traducción de errores de Firebase a mensajes amigables
  const getFirebaseErrorMessage = (errorCode) => {
    const errorMessages = {
      'auth/invalid-credential': 'Credenciales incorrectas. Verifica tu correo y contraseña.',
      'auth/email-already-in-use': 'Este correo ya está registrado. Intenta iniciar sesión.',
      'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres.',
      'auth/invalid-email': 'El formato del correo electrónico no es válido.',
      'auth/user-not-found': 'No existe una cuenta con este correo.',
      'auth/wrong-password': 'Contraseña incorrecta.',
      'auth/too-many-requests': 'Demasiados intentos fallidos. Espera un momento e intenta de nuevo.',
      'auth/network-request-failed': 'Error de conexión. Revisa tu internet.',
      'auth/popup-closed-by-user': 'Cerraste la ventana de Google antes de completar el acceso.',
      'auth/operation-not-allowed': 'Este método de autenticación no está habilitado. Contacta al administrador.',
    };
    return errorMessages[errorCode] || `Error inesperado (${errorCode}). Intenta de nuevo.`;
  };

  // Función para manejar el formulario manual (Correo/Contraseña)
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!captchaValido) {
      setError("Alerta de Seguridad: Demuestra que eres humano resolviendo el Captcha.");
      return;
    }

    setError(null);
    setIsLoading(true);
    try {
      if (isRegistering) {
        if (password.length < 6) {
          setError('La contraseña debe tener al menos 6 caracteres.');
          setIsLoading(false);
          return;
        }
        await signup(email, password, nombre || 'Explorador Anónimo');
      } else {
        await login(email, password);
      }
      // No hacemos navigate() aquí. El useEffect detectará al 'user' y solicitará el 2FA al servidor.
    } catch (err) {
      console.error("Error de autenticación:", err.code, err.message);
      setError(getFirebaseErrorMessage(err.code));
      reiniciarCaptcha();
    } finally {
      setIsLoading(false);
    }
  };

  // Función para el botón de Google
  const handleGoogleLogin = async () => {
    if (!captchaValido) {
      setError("Alerta de Seguridad: Resuelve el Captcha para acceder con Google.");
      return;
    }

    setError(null);
    setIsLoading(true);
    try {
      await loginWithGoogle();
      // Google ya verifica la identidad: el servidor emite la cookie firmada y el useEffect redirige a /perfil.
    } catch (err) {
      console.error("Error Google Auth:", err.code, err.message);
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Cerraste la ventana antes de completar el acceso.');
      } else {
        setError(err.message || 'Error al conectar con los servidores de Google.');
      }
      reiniciarCaptcha();
    } finally {
      setIsLoading(false);
    }
  };

  // Función para el botón de Microsoft
  const handleMicrosoftLogin = async () => {
    if (!captchaValido) {
      setError("Alerta de Seguridad: Resuelve el Captcha para acceder con Microsoft.");
      return;
    }

    setError(null);
    setIsLoading(true);
    try {
      await loginWithMicrosoft();
      // Microsoft ya verifica la identidad: el servidor emite la cookie firmada y el useEffect redirige a /perfil.
    } catch (err) {
      console.error("Error Microsoft Auth:", err.code, err.message);
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Cerraste la ventana antes de completar el acceso con Microsoft.');
      } else {
        setError(getFirebaseErrorMessage(err.code) || err.message || 'Error al conectar con los servidores de Microsoft.');
      }
      reiniciarCaptcha();
    } finally {
      setIsLoading(false);
    }
  };

  const target2FAUser = pending2FAUser || (is2FAPending ? auth.currentUser : null);
  if (target2FAUser && !is2FAPassed && !oauthEnCurso) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '2rem' }}>
        <div style={{ background: 'var(--surface-bg)', backdropFilter: 'blur(20px)', padding: '3rem', borderRadius: '16px', border: '1px solid var(--accent-color)', width: '100%', maxWidth: '450px', textAlign: 'center', boxShadow: '0 0 20px rgba(0,240,255,0.2)' }}>
          <i className="fa-solid fa-shield-halved" style={{ fontSize: '3.5rem', color: 'var(--accent-color)', marginBottom: '1rem', textShadow: '0 0 15px var(--accent-color)' }}></i>
          <h2 style={{ color: '#fff', letterSpacing: '2px', marginBottom: '1rem' }}>VERIFICACIÓN EN DOS PASOS</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
            {codigoEnviado
              ? <>Hemos enviado un código numérico a <b>{target2FAUser.email}</b>. Caducará en 5 minutos (máximo 5 intentos).</>
              : <>Solicitando al servidor un código de verificación para <b>{target2FAUser.email}</b>...</>}
          </p>

          {codigoPrueba && (
            <div style={{ background: 'rgba(255, 170, 0, 0.1)', border: '1px dashed #ffaa00', color: '#ffcc66', borderRadius: '8px', padding: '10px', marginBottom: '1rem', fontSize: '0.85rem' }}>
              <i className="fa-solid fa-flask" style={{ marginRight: '6px' }}></i>
              MODO PRUEBA (Servidor local): tu código es <b style={{ letterSpacing: '3px', color: '#fff' }}>{codigoPrueba}</b>
            </div>
          )}

          {aviso2FA && !error && <div style={{ color: '#00ffcc', marginBottom: '1rem', fontSize: '0.9rem' }}><i className="fa-solid fa-circle-check"></i> {aviso2FA}</div>}

          {error && <div style={{ color: '#ff4444', marginBottom: '1rem' }}><i className="fa-solid fa-triangle-exclamation"></i> {error}</div>}

          <input
            type="text"
            placeholder="0 0 0 0 0 0"
            value={codigo2FA}
            disabled={bloqueado2FA}
            onChange={(e) => setCodigo2FA(e.target.value.replace(/\D/g, ''))}
            maxLength={6}
            style={{ ...inputStyle, textAlign: 'center', letterSpacing: '8px', fontSize: '1.5rem', fontWeight: 'bold', opacity: bloqueado2FA ? 0.5 : 1 }}
          />

          <button onClick={handleVerificar2FA} disabled={isLoading || bloqueado2FA || codigo2FA.length < 6} style={{ ...submitBtnStyle, marginTop: '1.5rem', opacity: isLoading || bloqueado2FA || codigo2FA.length < 6 ? 0.5 : 1 }}>
            {isLoading ? <><i className="fa-solid fa-spinner fa-spin" style={{ marginRight: '8px' }}></i>VERIFICANDO...</> : 'CONFIRMAR CÓDIGO'}
          </button>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem', fontSize: '0.85rem' }}>
            <span
              onClick={isLoading ? null : handleReenviarCodigo}
              style={{ color: 'var(--accent-color)', cursor: isLoading ? 'not-allowed' : 'pointer', textDecoration: 'underline' }}>
              <i className="fa-solid fa-rotate-right" style={{ marginRight: '5px' }}></i> Reenviar código
            </span>
            <span
              onClick={handleCancelar2FA}
              style={{ color: 'var(--text-muted)', cursor: 'pointer', textDecoration: 'underline' }}>
              Cancelar / Cambiar cuenta
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '80vh', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '2rem' }}>

      <div style={{
        background: 'var(--surface-bg)',
        backdropFilter: 'blur(20px)',
        padding: '3rem',
        borderRadius: '16px',
        border: '1px solid var(--border-glow)',
        width: '100%',
        maxWidth: '450px',
        textAlign: 'center',
        boxShadow: 'var(--shadow-hover)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Línea de neón superior */}
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '3px', background: 'linear-gradient(90deg, var(--accent-color), var(--accent-secondary))' }}></div>

        <i className="fa-solid fa-lock" style={{ fontSize: '3rem', color: 'var(--accent-color)', marginBottom: '1.5rem', filter: 'drop-shadow(0 0 15px var(--accent-color))' }}></i>
        <h2 style={{ color: '#fff', marginBottom: '2rem', letterSpacing: '2px', textShadow: '0 0 10px var(--accent-color)' }}>
          {isRegistering ? 'NUEVO EXPLORADOR' : 'ACCESO RESTRINGIDO'}
        </h2>

        {/* Aviso informativo (ej. redirección al intentar conectar Spotify sin sesión) */}
        {!error && redirectNotice && (
          <div style={{
            background: 'rgba(29, 185, 84, 0.12)',
            border: '1px solid rgba(29, 185, 84, 0.5)',
            color: '#1db954',
            padding: '12px 15px',
            borderRadius: '8px',
            marginBottom: '1.5rem',
            fontSize: '0.85rem',
            textAlign: 'left',
            boxShadow: '0 0 15px rgba(29, 185, 84, 0.15)'
          }}>
            <i className="fa-brands fa-spotify" style={{ marginRight: '8px' }}></i>
            {redirectNotice}
          </div>
        )}

        {/* Mensaje de Error */}
        {error && (
          <div style={{
            background: 'rgba(255, 0, 122, 0.1)',
            border: '1px solid var(--accent-secondary)',
            color: 'var(--accent-secondary)',
            padding: '12px 15px',
            borderRadius: '8px',
            marginBottom: '1.5rem',
            fontSize: '0.85rem',
            textAlign: 'left',
            boxShadow: '0 0 15px rgba(255, 0, 122, 0.15)'
          }}>
            <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: '8px' }}></i>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>

          {isRegistering && (
            <input
              type="text"
              placeholder="Tu Nombre o Alias (Ej. DaftPunk99)"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              style={inputStyle}
            />
          )}

          <input
            type="email"
            placeholder="Correo Electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={inputStyle}
          />

          <input
            type="password"
            placeholder="Contraseña (mínimo 6 caracteres)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={inputStyle}
          />

          {!isRegistering && (
            <div style={{ textAlign: 'right', marginTop: '-4px' }}>
              <button
                type="button"
                onClick={() => {
                  setResetEmail(email || '');
                  setResetError(null);
                  setResetSuccess(null);
                  setShowResetModal(true);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--accent-color)',
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  fontFamily: 'inherit',
                  padding: '2px 0'
                }}
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '10px 0', gap: '8px' }}>
            {RECAPTCHA_SITE_KEY ? (
              <ReCAPTCHA
                ref={recaptchaRef}
                sitekey={RECAPTCHA_SITE_KEY}
                onChange={handleCaptchaChange}
                onExpired={() => {
                  setCaptchaValido(false);
                  setCaptchaPass(null);
                  guardarPaseCaptcha(null);
                }}
                theme="dark"
              />
            ) : (
              <span style={{ color: '#ff4444', fontSize: '0.82rem', textAlign: 'center' }}>
                <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: '6px' }}></i>
                reCAPTCHA no configurado en este entorno (falta VITE_RECAPTCHA_SITE_KEY).
              </span>
            )}
            {verificandoCaptcha && (
              <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: '6px' }}></i>Verificando con el servidor...
              </span>
            )}
            {captchaValido && !verificandoCaptcha && (
              <span style={{ color: 'var(--accent-color)', fontSize: '0.8rem' }}>
                <i className="fa-solid fa-circle-check" style={{ marginRight: '6px' }}></i>Captcha verificado
              </span>
            )}
          </div>

          <button type="submit" disabled={isLoading || !captchaValido} style={{
            ...submitBtnStyle,
            opacity: isLoading ? 0.7 : 1,
            cursor: isLoading ? 'wait' : 'pointer'
          }}>
            {isLoading
              ? <><i className="fa-solid fa-spinner fa-spin" style={{ marginRight: '8px' }}></i>PROCESANDO...</>
              : (isRegistering ? 'CREAR IDENTIDAD' : 'INICIAR SECUENCIA')
            }
          </button>

        </form>

        <div style={{ margin: '2rem 0', position: 'relative' }}>
          <div style={{ position: 'absolute', top: '50%', left: '0', right: '0', borderTop: '1px solid var(--border-alt)' }}></div>
          <span style={{ position: 'relative', background: 'rgba(20, 20, 40, 0.9)', padding: '0 15px', color: 'var(--text-muted)', fontSize: '0.8rem', letterSpacing: '2px' }}>O AUTORIZAR CON</span>
        </div>

        {/* BOTONES SSO: GOOGLE Y MICROSOFT */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button onClick={handleGoogleLogin} disabled={isLoading || !captchaValido} style={{
            ...googleBtnStyle,
            opacity: isLoading || !captchaValido ? 0.5 : 1,
            cursor: isLoading ? 'wait' : (!captchaValido ? 'not-allowed' : 'pointer')
          }}>
            <i className="fa-brands fa-google" style={{ fontSize: '1.2rem', color: '#EA4335' }}></i>
            Continuar con Google
          </button>

          <button onClick={handleMicrosoftLogin} disabled={isLoading || !captchaValido} style={{
            ...microsoftBtnStyle,
            opacity: isLoading || !captchaValido ? 0.5 : 1,
            cursor: isLoading ? 'wait' : (!captchaValido ? 'not-allowed' : 'pointer')
          }}>
            <i className="fa-brands fa-microsoft" style={{ fontSize: '1.2rem', color: '#00A4EF' }}></i>
            Continuar con Microsoft
          </button>
        </div>

        {/* Toggle para cambiar entre Login y Registro */}
        <p style={{ color: 'var(--text-muted)', marginTop: '2rem', fontSize: '0.9rem' }}>
          {isRegistering ? '¿Ya tienes tus llaves?' : '¿No estás en el sistema?'} <br />
          <span
            onClick={() => { setIsRegistering(!isRegistering); setError(null); }}
            style={{ color: 'var(--accent-color)', cursor: 'pointer', fontWeight: 'bold', textDecoration: 'underline', textShadow: '0 0 8px var(--accent-color)' }}>
            {isRegistering ? 'Entra a la Bóveda' : 'Solicita Acceso Oficial'}
          </span>
        </p>      </div>

      {/* MODAL RECUPERACIÓN DE CONTRASEÑA CYBERPUNK */}
      {showResetModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(5, 5, 15, 0.85)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          padding: '1.5rem'
        }}>
          <div style={{
            background: 'var(--surface-bg)',
            border: '1px solid var(--accent-color)',
            borderRadius: '16px',
            padding: '2.5rem',
            maxWidth: '440px',
            width: '100%',
            boxShadow: '0 0 35px rgba(0, 240, 255, 0.3)',
            position: 'relative'
          }}>
            {/* Línea de neón superior */}
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '3px', background: 'linear-gradient(90deg, var(--accent-color), var(--accent-secondary))' }}></div>
            
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <i className="fa-solid fa-key" style={{ fontSize: '2.5rem', color: 'var(--accent-color)', marginBottom: '0.8rem', filter: 'drop-shadow(0 0 10px var(--accent-color))' }}></i>
              <h3 style={{ color: '#fff', letterSpacing: '2px', margin: '0 0 0.5rem 0' }}>RECUPERAR ACCESO</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0, lineHeight: 1.5 }}>
                Ingresa el correo electrónico asociado a tu cuenta para recibir las instrucciones de restablecimiento de contraseña.
              </p>
            </div>

            {resetError && (
              <div style={{
                background: 'rgba(255, 0, 122, 0.1)',
                border: '1px solid var(--accent-secondary)',
                color: 'var(--accent-secondary)',
                padding: '10px 14px',
                borderRadius: '8px',
                marginBottom: '1.2rem',
                fontSize: '0.85rem',
                textAlign: 'left'
              }}>
                <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: '8px' }}></i>
                {resetError}
              </div>
            )}

            {resetSuccess && (
              <div style={{
                background: 'rgba(0, 255, 204, 0.1)',
                border: '1px solid #00ffcc',
                color: '#00ffcc',
                padding: '12px 14px',
                borderRadius: '8px',
                marginBottom: '1.2rem',
                fontSize: '0.85rem',
                lineHeight: 1.4,
                textAlign: 'left'
              }}>
                <i className="fa-solid fa-circle-check" style={{ marginRight: '8px' }}></i>
                {resetSuccess}
              </div>
            )}

            {!resetSuccess ? (
              <form onSubmit={handleSendPasswordReset} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <input
                  type="email"
                  placeholder="ejemplo@correo.com"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  required
                  autoFocus
                  style={inputStyle}
                />
                <div style={{ display: 'flex', gap: '10px', marginTop: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => setShowResetModal(false)}
                    disabled={isResetting}
                    style={{
                      flex: 1,
                      padding: '12px',
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '8px',
                      color: '#fff',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      fontFamily: 'inherit'
                    }}
                  >
                    CANCELAR
                  </button>
                  <button
                    type="submit"
                    disabled={isResetting || !resetEmail.trim()}
                    style={{
                      flex: 1.4,
                      padding: '12px',
                      background: 'linear-gradient(45deg, var(--accent-color), var(--accent-tertiary, #9D00FF))',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#fff',
                      fontWeight: 'bold',
                      cursor: isResetting ? 'wait' : 'pointer',
                      opacity: isResetting || !resetEmail.trim() ? 0.6 : 1,
                      fontFamily: 'inherit',
                      letterSpacing: '1px',
                      boxShadow: '0 0 15px rgba(0, 240, 255, 0.3)'
                    }}
                  >
                    {isResetting ? (
                      <><i className="fa-solid fa-spinner fa-spin" style={{ marginRight: '6px' }}></i>ENVIANDO...</>
                    ) : (
                      'ENVIAR ENLACE'
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'var(--accent-color)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#000',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  letterSpacing: '1px'
                }}
              >
                CERRAR Y REGRESAR
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Estilos reutilizables para mantener el JSX limpio
const inputStyle = {
  width: '100%',
  padding: '15px',
  background: 'rgba(0, 0, 0, 0.5)',
  border: '1px solid var(--border-alt)',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '1rem',
  outline: 'none',
  fontFamily: 'inherit',
  transition: 'border-color 0.3s, box-shadow 0.3s',
  boxSizing: 'border-box'
};

const submitBtnStyle = {
  width: '100%',
  padding: '16px',
  background: 'linear-gradient(45deg, var(--accent-color), var(--accent-tertiary, #9D00FF))',
  border: 'none',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '1rem',
  fontWeight: 'bold',
  cursor: 'pointer',
  letterSpacing: '2px',
  textTransform: 'uppercase',
  transition: '0.3s',
  fontFamily: 'inherit',
  boxShadow: '0 0 20px rgba(0, 240, 255, 0.3)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center'
};

const googleBtnStyle = {
  width: '100%',
  padding: '15px',
  background: 'rgba(255, 255, 255, 0.08)',
  border: '1px solid rgba(255, 255, 255, 0.15)',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '1rem',
  fontWeight: 'bold',
  cursor: 'pointer',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  gap: '10px',
  transition: '0.3s',
  fontFamily: 'inherit',
  backdropFilter: 'blur(5px)'
};

const microsoftBtnStyle = {
  width: '100%',
  padding: '15px',
  background: 'rgba(0, 164, 239, 0.08)',
  border: '1px solid rgba(0, 164, 239, 0.25)',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '1rem',
  fontWeight: 'bold',
  cursor: 'pointer',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  gap: '10px',
  transition: '0.3s',
  fontFamily: 'inherit',
  backdropFilter: 'blur(5px)',
  boxShadow: '0 0 10px rgba(0, 164, 239, 0.08)'
};
