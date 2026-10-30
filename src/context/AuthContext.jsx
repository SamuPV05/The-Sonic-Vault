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

// 1. Creamos el contexto
const AuthContext = createContext();

// 2. Un Hook personalizado para usar este contexto fácilmente
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth debe usarse dentro de un AuthProvider");
  return context;
};

// 3. El Proveedor que envuelve toda la app
// --- SESIÓN 2FA VERIFICADA EN SERVIDOR (Cookie firmada HttpOnly + /api/2fa) ---
// Ya no se confía en valores planos de sessionStorage. La sesión 2FA se valida contra el
// servidor (/api/2fa) usando el ID token de Firebase y la cookie firmada HttpOnly sv_2fa_session.

const limpiarStorageLegado = () => {
  try {
    sessionStorage.removeItem('sv_2fa_session');
    sessionStorage.removeItem('2fa_passed');
  } catch {
    // Ignorar en entornos sin sessionStorage
  }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sesion2FA, setSesion2FA] = useState(null);
  const sesion2FARef = useRef(null);
  // Mientras un popup OAuth está en curso, evitamos que Login dispare el envío del código por correo
  const [oauthEnCurso, setOauthEnCurso] = useState(false);

  const actualizarSesion2FA = (data) => {
    sesion2FARef.current = data;
    setSesion2FA(data);
  };

  // La sesión solo cuenta como verificada si el servidor la emitió para el UID autenticado y no ha expirado
  const is2FAPassed = !!(user && sesion2FA && sesion2FA.uid === user.uid && Date.now() <= sesion2FA.expira);

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

    const data = await resp.json();
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

    const data = await resp.json();
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

  // Cancela el 2FA. Si la cuenta nunca fue verificada (registro con correo falso o ajeno), se borra por completo.
  const cancelarRegistroPendiente = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    let pendiente = false;
    try {
      const snap = await getDoc(doc(db, 'users', currentUser.uid));
      // Cuentas antiguas sin el campo se consideran verificadas
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
        await deleteUser(currentUser); // También cierra la sesión
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
      body: JSON.stringify({ action: 'oauth-session' })
    });
    const data = await resp.json();
    if (!resp.ok || !data.success) {
      throw new Error(data.error || 'No se pudo establecer la sesión verificada en el servidor.');
    }
    actualizarSesion2FA({
      uid: data.uid || firebaseUser.uid,
      metodo: data.metodo || metodoFallback,
      expira: data.expira
    });
  };

  // Funciones Mágicas

  // A. Registrar nuevo usuario con Email
  const signup = async (email, password, nombre) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;
    
    // Actualizamos el perfil de Firebase Auth con el nombre del usuario
    // Esto hace que user.displayName funcione en toda la app
    await updateProfile(firebaseUser, {
      displayName: nombre
    });
    
    // Al registrarse, le creamos un documento en Firestore (La Bóveda)
    await setDoc(doc(db, 'users', firebaseUser.uid), {
      uid: firebaseUser.uid,
      nombre: nombre,
      email: email,
      biografia: "Nuevo explorador sónico...",
      bio: "Nuevo explorador sónico...",
      ciudad: "",
      verificado: false, // Pasa a true cuando confirma el primer código del correo
      fechaRegistro: new Date().toISOString()
    });
    try {
      await setDoc(doc(db, 'stats', 'global'), { users: increment(1) }, { merge: true });
    } catch (statsErr) {
      console.error('No se pudo actualizar el contador de usuarios:', statsErr);
    }

    // Forzamos que onAuthStateChanged recoja el displayName actualizado
    await auth.currentUser.reload();
    setUser(auth.currentUser);

    return firebaseUser;
  };

  // B. Iniciar Sesión normal
  const login = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  // C. Iniciar Sesión con GOOGLE
  // Google ya verifica la identidad y el correo; el servidor valida el proveedor en el ID token y emite la cookie firmada.
  const loginWithGoogle = async () => {
    setOauthEnCurso(true);
    try {
      const googleProvider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, googleProvider);
      const firebaseUser = userCredential.user;
      await registrarSesionOAuthEnServidor(firebaseUser, 'google');

      // Revisamos si es la primera vez que entra con Google
      const docRef = doc(db, 'users', firebaseUser.uid);
      const docSnap = await getDoc(docRef);

      // Si no existe en nuestra base de datos, lo creamos
      if (!docSnap.exists()) {
        await setDoc(docRef, {
          uid: firebaseUser.uid,
          nombre: firebaseUser.displayName,
          email: firebaseUser.email,
          biografia: "Explorador sónico verificado por Google",
          bio: "Explorador sónico verificado por Google",
          ciudad: "",
          foto: firebaseUser.photoURL,
          verificado: true, // Google ya garantiza que el correo es real
          fechaRegistro: new Date().toISOString()
        });
        try {
          await setDoc(doc(db, 'stats', 'global'), { users: increment(1) }, { merge: true });
        } catch (statsErr) {
          console.error('No se pudo actualizar el contador de usuarios:', statsErr);
        }
      }
      return firebaseUser;
    } finally {
      setOauthEnCurso(false);
    }
  };

  // C2. Iniciar Sesión con MICROSOFT
  // Igual que Google: el proveedor ya verificó la cuenta y el servidor emite la cookie firmada tras validar el token.
  const loginWithMicrosoft = async () => {
    setOauthEnCurso(true);
    try {
      const microsoftProvider = new OAuthProvider('microsoft.com');
      microsoftProvider.setCustomParameters({
        prompt: 'select_account'
      });
      const userCredential = await signInWithPopup(auth, microsoftProvider);
      const firebaseUser = userCredential.user;
      await registrarSesionOAuthEnServidor(firebaseUser, 'microsoft');

      // Revisamos si es la primera vez que entra con Microsoft
      const docRef = doc(db, 'users', firebaseUser.uid);
      const docSnap = await getDoc(docRef);

      // Si no existe en nuestra base de datos, lo creamos
      if (!docSnap.exists()) {
        await setDoc(docRef, {
          uid: firebaseUser.uid,
          nombre: firebaseUser.displayName || 'Explorador Microsoft',
          email: firebaseUser.email,
          biografia: "Explorador sónico verificado por Microsoft",
          bio: "Explorador sónico verificado por Microsoft",
          ciudad: "",
          foto: firebaseUser.photoURL || null,
          verificado: true, // Microsoft ya garantiza que el correo es real
          fechaRegistro: new Date().toISOString()
        });
        try {
          await setDoc(doc(db, 'stats', 'global'), { users: increment(1) }, { merge: true });
        } catch (statsErr) {
          console.error('No se pudo actualizar el contador de usuarios:', statsErr);
        }
      }
      return firebaseUser;
    } finally {
      setOauthEnCurso(false);
    }
  };

  // D. Cerrar Sesión
  const logout = async () => {
    await limpiarSesion2FA(auth.currentUser);
    return signOut(auth);
  };

  // E. Actualizar foto de perfil
  const updateUserPhoto = async (photoURL) => {
    if (!auth.currentUser) return;
    
    // Actualizar en Firebase Auth
    await updateProfile(auth.currentUser, { photoURL });
    
    // Actualizar en Firestore
    const userDocRef = doc(db, 'users', auth.currentUser.uid);
    await setDoc(userDocRef, { foto: photoURL }, { merge: true });
    
    // Refrescar el usuario en el estado
    await auth.currentUser.reload();
    setUser({ ...auth.currentUser });
  };

  // Observador: verifica el usuario en Firebase y valida la cookie de sesión 2FA contra el servidor
  useEffect(() => {
    limpiarStorageLegado();
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        setUser(null);
        actualizarSesion2FA(null);
        setLoading(false);
        return;
      }

      setUser(currentUser);

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
        const data = await resp.json();
        if (resp.ok && data.verified && data.uid === currentUser.uid) {
          actualizarSesion2FA({
            uid: data.uid,
            metodo: data.metodo,
            expira: data.expira
          });
        } else {
          actualizarSesion2FA(null);
        }
      } catch (err) {
        console.error('Error verificando sesión 2FA con el servidor:', err);
        actualizarSesion2FA(null);
      } finally {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ signup, login, loginWithGoogle, loginWithMicrosoft, logout, updateUserPhoto, user, loading, is2FAPassed, oauthEnCurso, send2FACode, verify2FA, cancelarRegistroPendiente }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
