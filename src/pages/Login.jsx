import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ReCAPTCHA from 'react-google-recaptcha';
import { db } from '../firebase/config';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import emailjs from '@emailjs/browser';

export default function Login() {
  const { login, signup, loginWithGoogle, loginWithMicrosoft, cancelarRegistroPendiente, user, is2FAPassed, verify2FA } = useAuth();
  const navigate = useNavigate();

  // Estados del formulario
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState(''); // Solo se usa al registrarse
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [captchaValido, setCaptchaValido] = useState(false);
  const [verificandoCaptcha, setVerificandoCaptcha] = useState(false);
  const recaptchaRef = useRef(null);

  // Llave pública del Captcha. Si no está en .env, usa la de prueba de Google.
  const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY || '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI';

  // Estados del 2FA
  const [codigo2FA, setCodigo2FA] = useState('');
  const [codigoEnviado, setCodigoEnviado] = useState(false);

  // Lógica de Envío 2FA Automático
  useEffect(() => {
    if (user && is2FAPassed) {
      navigate('/perfil');
    } else if (user && !is2FAPassed && !codigoEnviado) {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiration = Date.now() + 5 * 60 * 1000;

      setDoc(doc(db, '2fa_codes', user.uid), { code, expiration })
        .then(() => {
          // --- CONFIGURACIÓN DE EMAILJS ---
          const serviceId = 'service_646g536';
          const templateId = 'template_v1y1eqv';
          const publicKey = 'lKQxjVBugaWWx4W6Z';

          if (serviceId === 'YOUR_SERVICE_ID') {
            console.log(`[MODO PRUEBA] Código 2FA generado: ${code}`);
            alert(`[MODO PRUEBA SIMULADO]\n\nSe acaba de enviar este código a tu correo: ${code}`);
            setCodigoEnviado(true);
            return;
          }

          emailjs.send(serviceId, templateId, {
            codigo: code,
            passcode: code,
            time: '5 minutos',
            to_email: user.email,
            email: user.email,
            user_email: user.email,
            reply_to: user.email,
            to_name: user.displayName || 'Explorador'
          }, publicKey).then(() => {
            setCodigoEnviado(true);
          }).catch(err => {
            console.error('Error EmailJS:', err);
            setError('Error al intentar enviar el correo con el código.');
          });
        });
    }
  }, [user, is2FAPassed, codigoEnviado, navigate]);

  const handleVerificar2FA = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const docSnap = await getDoc(doc(db, '2fa_codes', user.uid));
      if (docSnap.exists()) {
        const { code, expiration } = docSnap.data();
        if (Date.now() > expiration) {
          setError('El código expiró (pasaron 5 minutos). Pulsa "Reenviar código" para recibir uno nuevo.');
        } else if (code === codigo2FA) {
          await verify2FA(); // ¡Pasa el 2FA!
        } else {
          setError('Código incorrecto.');
        }
      } else {
        setError('No hay códigos registrados.');
      }
    } catch (err) {
      setError('Error al verificar en la base de datos.');
    }
    setIsLoading(false);
  };

  const handleReenviarCodigo = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiration = Date.now() + 5 * 60 * 1000;

      try {
        await setDoc(doc(db, '2fa_codes', user.uid), { code, expiration });
      } catch (err) {
        console.error('Error Firestore:', err);
        setError(`Error de base de datos (Firestore): ${err.code || err.message}`);
        return;
      }

      try {
        await emailjs.send('service_646g536', 'template_v1y1eqv', {
          codigo: code,
          passcode: code,
          time: '5 minutos',
          to_email: user.email,
          email: user.email,
          user_email: user.email,
          reply_to: user.email,
          to_name: user.displayName || 'Explorador'
        }, 'lKQxjVBugaWWx4W6Z');
      } catch (err) {
        console.error('Error EmailJS:', err);
        setError(`Error de EmailJS (${err.status || '?'}): ${err.text || err.message}`);
        return;
      }

      alert('¡Se ha enviado un nuevo código a tu correo!');
    } catch (err) {
      console.error('Error al reenviar código:', err);
      setError(`No se pudo reenviar el código: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelar2FA = async () => {
    setCodigoEnviado(false);
    setCodigo2FA('');
    setError(null);
    // Si era un registro sin verificar, la cuenta se elimina; si no, solo cierra sesión
    await cancelarRegistroPendiente();
  };

  // Cuando el usuario resuelve el Captcha, el servidor lo confirma con Google usando la llave secreta
  const handleCaptchaChange = async (token) => {
    setCaptchaValido(false);
    if (!token) return; // Expiró o se reinició

    setVerificandoCaptcha(true);
    setError(null);
    try {
      const resp = await fetch('/api/verify-captcha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });
      const data = await resp.json();
      if (data.success) {
        setCaptchaValido(true);
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
    recaptchaRef.current?.reset();
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
      // No hacemos navigate() aquí. El useEffect detectará al 'user' y activará el 2FA.
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
      // No hacemos navigate(). El useEffect tomará el control.
    } catch (err) {
      console.error("Error Google Auth:", err.code, err.message);
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Cerraste la ventana antes de completar el acceso.');
      } else {
        setError('Error al conectar con los servidores de Google.');
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
      // No hacemos navigate(). El useEffect tomará el control del 2FA.
    } catch (err) {
      console.error("Error Microsoft Auth:", err.code, err.message);
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Cerraste la ventana antes de completar el acceso con Microsoft.');
      } else {
        setError(getFirebaseErrorMessage(err.code) || 'Error al conectar con los servidores de Microsoft.');
      }
      reiniciarCaptcha();
    } finally {
      setIsLoading(false);
    }
  };

  if (user && !is2FAPassed) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '2rem' }}>
        <div style={{ background: 'var(--surface-bg)', backdropFilter: 'blur(20px)', padding: '3rem', borderRadius: '16px', border: '1px solid var(--accent-color)', width: '100%', maxWidth: '450px', textAlign: 'center', boxShadow: '0 0 20px rgba(0,240,255,0.2)' }}>
          <i className="fa-solid fa-shield-halved" style={{ fontSize: '3.5rem', color: 'var(--accent-color)', marginBottom: '1rem', textShadow: '0 0 15px var(--accent-color)' }}></i>
          <h2 style={{ color: '#fff', letterSpacing: '2px', marginBottom: '1rem' }}>VERIFICACIÓN EN DOS PASOS</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Hemos enviado un código numérico a <b>{user.email}</b>. Caducará en 5 minutos.</p>

          {error && <div style={{ color: '#ff4444', marginBottom: '1rem' }}><i className="fa-solid fa-triangle-exclamation"></i> {error}</div>}

          <input
            type="text"
            placeholder="0 0 0 0 0 0"
            value={codigo2FA}
            onChange={(e) => setCodigo2FA(e.target.value.replace(/\D/g, ''))}
            maxLength={6}
            style={{ ...inputStyle, textAlign: 'center', letterSpacing: '8px', fontSize: '1.5rem', fontWeight: 'bold' }}
          />

          <button onClick={handleVerificar2FA} disabled={isLoading || codigo2FA.length < 6} style={{ ...submitBtnStyle, marginTop: '1.5rem', opacity: isLoading || codigo2FA.length < 6 ? 0.5 : 1 }}>
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

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '10px 0', gap: '8px' }}>
            <ReCAPTCHA
              ref={recaptchaRef}
              sitekey={RECAPTCHA_SITE_KEY}
              onChange={handleCaptchaChange}
              onExpired={() => setCaptchaValido(false)}
              theme="dark"
            />
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
        </p>

      </div>
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