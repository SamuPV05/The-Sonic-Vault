import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithPopup,
  updateProfile,
  deleteUser
} from 'firebase/auth';
import { doc, setDoc, getDoc, deleteDoc, increment } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { logoutSpotify } from '../services/spotifyService';

// 1. Creamos el contexto
const AuthContext = createContext();

// 2. Hook personalizado para usar este contexto fácilmente
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth debe usarse dentro de un AuthProvider");
  return context;
};

// 3. Limpieza de almacenamiento legado
const limpiarStorageLegado = () => {
  try {
    sessionStorage.removeItem('sv_2fa_session');
    sessionStorage.removeItem('2fa_passed');
  } catch {
    // Ignorar en entornos sin sessionStorage
  }
};

// Función auxiliar para parsear respuestas de API evitando SyntaxError si el servidor devuelve HTML o texto
const parseJsonSeguro = async (resp, fallbackError = 'Respuesta inesperada del servidor.') => {
  try {
    const text = await resp.text();
    try {
      return JSON.parse(text);
    } catch {
      return { success: false, error: resp.status >= 500 ? 'El servidor experimentó un error temporal. Por favor intenta de nuevo.' : fallbackError };
    }
  } catch {
    return { success: false, error: fallbackError };
  }
};
export function AuthProvider({ children }) {
  // rawUser es el usuario directo devuelto por Firebase Auth tras el primer factor (contraseña o popup)
  const [rawUser, setRawUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sesion2FA, setSesion2FA] = useState(null);
  const sesion2FARef = useRef(null);

  // Bandera para evitar que onAuthStateChanged colisione con el registro de sesión OAuth
  const [oauthEnCurso, setOauthEnCurso] = useState(false);
  const oauthEnCursoRef = useRef(false);

  const actualizarSesion2FA = (data) => {
    sesion2FARef.current = data;
    setSesion2FA(data);
  };

  // La sesión solo cuenta como verificada si el servidor la emitió para el UID autenticado y no ha expirado
  const is2FAPassed = Boolean(
    rawUser && 
    sesion2FA && 
    sesion2FA.uid === rawUser.uid && 
    Date.now() <= sesion2FA.expira
  );

  // Usuario en cuarentena de segundo factor: autenticó el primer factor pero aún no ha validado 2FA
  const is2FAPending = Boolean(rawUser && !is2FAPassed);

  // CERROJO DE SEGURIDAD ESTRICTO:
  // Para el resto de la aplicación (Navbar, BeatIt, EchoSafe, Perfil), el usuario NO existe
  // a menos que haya superado exitosamente el 2FA. Si está en cuarentena, 'user' es estrictamente null.
  const user = is2FAPassed ? rawUser : null;

  // pending2FAUser se exporta EXCLUSIVAMENTE para que la vista de Login pueda mostrar el correo y validar el código
  const pending2FAUser = is2FAPending ? rawUser : null;

  const limpiarSesion2FA = async (currentUser = auth.currentUser) => {
    limpiarStorageLegado();
    actualizarSesion2FA(null);
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (currentUser) {
        const idToken = await currentUser.getIdToken().catch(() => null);
        if (idToken) headers.Authorization = `Bearer ${idToken}`;
      }
      await fetch('/api/2fa', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({ action: 'logout' })
      });
    } catch {
      // Ignorar errores de red al limpiar la cookie de sesión
    }
  };

  // Solicita al servidor (/api/2fa) generar y enviar el código OTP por correo (exige Captcha válido)
  const send2FACode = async ({ captchaPass, captchaToken, resend = false } = {}) => {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('No hay una sesión activa para enviar el código 2FA.');

    const idToken = await currentUser.getIdToken();
    const resp = await fetch('/api/2fa', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`
      },
      credentials: 'include',
      body: JSON.stringify({
        action: 'send',
        captchaPass,
        captchaToken,
        resend
      })
    });

    const data = await parseJsonSeguro(resp, 'Error al solicitar el código 2FA al servidor.');
    if (!resp.ok || !data.success) {
      throw new Error(data.error || 'Error al solicitar el código 2FA al servidor.');
    }
    return data;
  };

  // Verifica el código OTP de 6 dígitos en el servidor (/api/2fa, máximo 5 intentos)
  const verify2FA = async (code) => {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('No hay una sesión activa.');

    const idToken = await currentUser.getIdToken();
    const resp = await fetch('/api/2fa', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`
      },
      credentials: 'include',
      body: JSON.stringify({
        action: 'verify',
        code
      })
    });

    const data = await parseJsonSeguro(resp, 'Error al verificar el código 2FA con el servidor.');
    if (!resp.ok || !data.success) {
      const err = new Error(data.error || 'Código 2FA inválido.');
      err.locked = Boolean(data.locked);
      err.expired = Boolean(data.expired);
      err.attemptsLeft = data.attemptsLeft;
      throw err;
    }

    actualizarSesion2FA({
      uid: data.uid,
      metodo: data.metodo || 'email-code',
      expira: data.expira
    });

    // Si era un registro pendiente, el primer código correcto demuestra que el correo existe y es suyo
    try {
      await setDoc(doc(db, 'users', currentUser.uid), { verificado: true }, { merge: true });
    } catch (err) {
      console.error('No se pudo marcar la cuenta como verificada:', err);
    }

    return data;
  };

  // Cancela el 2FA. Si la cuenta nunca fue verificada (registro pendiente), se borra por completo.
  const cancelarRegistroPendiente = async () => {
    logoutSpotify();
    const currentUser = auth.currentUser;
    if (!currentUser) {
      setRawUser(null);
      actualizarSesion2FA(null);
      return;
    }

    let pendiente = false;
    try {
      const snap = await getDoc(doc(db, 'users', currentUser.uid));
      pendiente = snap.exists() && snap.data().verificado === false;
    } catch (err) {
      console.error('No se pudo leer el estado de la cuenta:', err);
    }

    if (pendiente) {
      try {
        await limpiarSesion2FA(currentUser);
        await deleteDoc(doc(db, '2fa_codes', currentUser.uid)).catch(() => {});
        await deleteDoc(doc(db, 'users', currentUser.uid));
        try {
          await setDoc(doc(db, 'stats', 'global'), { users: increment(-1) }, { merge: true });
        } catch (statsErr) {
          console.error('No se pudo descontar el contador de usuarios:', statsErr);
        }
        await deleteUser(currentUser);
        setRawUser(null);
        return;
      } catch (err) {
        console.error('No se pudo eliminar la cuenta pendiente:', err);
      }
    }

    await logout();
  };

  // Registra en el servidor la sesión verificada tras autenticar con Google o Microsoft
  const registrarSesionOAuthEnServidor = async (firebaseUser, metodoFallback) => {
    const idToken = await firebaseUser.getIdToken();
    const resp = await fetch('/api/2fa', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`
      },
      credentials: 'include',
      body: JSON.stringify({ action: 'oauth-session', provider: metodoFallback })
    });
    const data = await parseJsonSeguro(resp, 'No se pudo establecer la sesión verificada en el servidor.');
    if (!resp.ok || !data.success) {
      throw new Error(data.error || 'No se pudo establecer la sesión verificada en el servidor.');
    }
    actualizarSesion2FA({
      uid: data.uid || firebaseUser.uid,
      metodo: data.metodo || metodoFallback,
      expira: data.expira
    });
  };

  // A. Registrar nuevo usuario con Email
  const signup = async (email, password, nombre) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;
    
    await updateProfile(firebaseUser, {
      displayName: nombre
    });
    
    await setDoc(doc(db, 'users', firebaseUser.uid), {
      uid: firebaseUser.uid,
      nombre: nombre,
      email: email,
      biografia: "Nuevo explorador sónico...",
      bio: "Nuevo explorador sónico...",
      ciudad: "",
      verificado: false,
      fechaRegistro: new Date().toISOString()
    });
    try {
      await setDoc(doc(db, 'stats', 'global'), { users: increment(1) }, { merge: true });
    } catch (statsErr) {
      console.error('No se pudo actualizar el contador de usuarios:', statsErr);
    }

    await auth.currentUser.reload();
    setRawUser(auth.currentUser);
    return firebaseUser;
  };

  // B. Iniciar Sesión normal con Email/Contraseña
  const login = async (email, password) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    setRawUser(userCredential.user);
    return userCredential.user;
  };

  // C. Iniciar Sesión con GOOGLE
  const loginWithGoogle = async () => {
    setOauthEnCurso(true);
    oauthEnCursoRef.current = true;
    try {
      const googleProvider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, googleProvider);
      const firebaseUser = userCredential.user;
      setRawUser(firebaseUser);
      await registrarSesionOAuthEnServidor(firebaseUser, 'google');

      const docRef = doc(db, 'users', firebaseUser.uid);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        await setDoc(docRef, {
          uid: firebaseUser.uid,
          nombre: firebaseUser.displayName,
          email: firebaseUser.email,
          biografia: "Explorador sónico verificado por Google",
          bio: "Explorador sónico verificado por Google",
          ciudad: "",
          foto: firebaseUser.photoURL,
          verificado: true,
          fechaRegistro: new Date().toISOString()
        });
        try {
          await setDoc(doc(db, 'stats', 'global'), { users: increment(1) }, { merge: true });
        } catch (statsErr) {
          console.error('No se pudo actualizar el contador de usuarios:', statsErr);
        }
      }
      return firebaseUser;
    } catch (err) {
      console.error('Error Google Auth:', err);
      // Si la verificación de sesión en servidor falla, cerramos sesión de Firebase para no dejar estado inconsistente
      await signOut(auth).catch(() => {});
      setRawUser(null);
      actualizarSesion2FA(null);
      throw err;
    } finally {
      setOauthEnCurso(false);
      oauthEnCursoRef.current = false;
    }
  };

  // C2. Iniciar Sesión con MICROSOFT
  const loginWithMicrosoft = async () => {
    setOauthEnCurso(true);
    oauthEnCursoRef.current = true;
    try {
      const microsoftProvider = new OAuthProvider('microsoft.com');
      microsoftProvider.setCustomParameters({
        prompt: 'select_account'
      });
      const userCredential = await signInWithPopup(auth, microsoftProvider);
      const firebaseUser = userCredential.user;
      setRawUser(firebaseUser);
      await registrarSesionOAuthEnServidor(firebaseUser, 'microsoft');

      const docRef = doc(db, 'users', firebaseUser.uid);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        await setDoc(docRef, {
          uid: firebaseUser.uid,
          nombre: firebaseUser.displayName || 'Explorador Microsoft',
          email: firebaseUser.email,
          biografia: "Explorador sónico verificado por Microsoft",
          bio: "Explorador sónico verificado por Microsoft",
          ciudad: "",
          foto: firebaseUser.photoURL || null,
          verificado: true,
          fechaRegistro: new Date().toISOString()
        });
        try {
          await setDoc(doc(db, 'stats', 'global'), { users: increment(1) }, { merge: true });
        } catch (statsErr) {
          console.error('No se pudo actualizar el contador de usuarios:', statsErr);
        }
      }
      return firebaseUser;
    } catch (err) {
      console.error('Error Microsoft Auth:', err);
      await signOut(auth).catch(() => {});
      setRawUser(null);
      actualizarSesion2FA(null);
      throw err;
    } finally {
      setOauthEnCurso(false);
      oauthEnCursoRef.current = false;
    }
  };

  // D. Cerrar Sesión
  const logout = async () => {
    logoutSpotify();
    await limpiarSesion2FA(auth.currentUser);
    setRawUser(null);
    return signOut(auth);
  };

  // E. Actualizar foto de perfil
  const updateUserPhoto = async (photoURL) => {
    if (!auth.currentUser) return;
    
    await updateProfile(auth.currentUser, { photoURL });
    const userDocRef = doc(db, 'users', auth.currentUser.uid);
    await setDoc(userDocRef, { foto: photoURL }, { merge: true });
    
    await auth.currentUser.reload();
    setRawUser({ ...auth.currentUser });
  };

  // Observador: sincroniza usuario de Firebase y valida cookie de sesión 2FA
  useEffect(() => {
    limpiarStorageLegado();
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        setRawUser(null);
        actualizarSesion2FA(null);
        logoutSpotify();
        setLoading(false);
        return;
      }

      setRawUser(currentUser);

      // Si hay un flujo OAuth activo en este momento, no competimos con registrarSesionOAuthEnServidor
      if (oauthEnCursoRef.current) {
        setLoading(false);
        return;
      }

      // Si ya tenemos en memoria una sesión 2FA válida para este mismo UID, no repetimos la consulta
      const actual = sesion2FARef.current;
      if (actual && actual.uid === currentUser.uid && Date.now() <= actual.expira) {
        setLoading(false);
        return;
      }

      try {
        const idToken = await currentUser.getIdToken();
        const resp = await fetch('/api/2fa', {
          method: 'GET',
          headers: { Authorization: `Bearer ${idToken}` },
          credentials: 'include'
        });
        const data = await parseJsonSeguro(resp);
        if (resp.ok && data.verified && data.uid === currentUser.uid) {
          actualizarSesion2FA({
            uid: data.uid,
            metodo: data.metodo,
            expira: data.expira
          });
        } else {
          // Solo limpiar si en el intermedio no se fijó una sesión válida
          const vigente = sesion2FARef.current;
          if (!vigente || vigente.uid !== currentUser.uid || Date.now() > vigente.expira) {
            actualizarSesion2FA(null);
          }
        }
      } catch (err) {
        console.error('Error verificando sesión 2FA con el servidor:', err);
        const vigente = sesion2FARef.current;
        if (!vigente || vigente.uid !== currentUser.uid || Date.now() > vigente.expira) {
          actualizarSesion2FA(null);
        }
      } finally {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ 
      signup, 
      login, 
      loginWithGoogle, 
      loginWithMicrosoft, 
      logout, 
      updateUserPhoto, 
      user, 
      pending2FAUser,
      loading, 
      is2FAPassed, 
      is2FAPending,
      oauthEnCurso, 
      send2FACode, 
      verify2FA, 
      cancelarRegistroPendiente 
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
