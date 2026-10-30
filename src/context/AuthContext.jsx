import { createContext, useContext, useEffect, useState } from 'react';
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

// --- SESIÓN 2FA LIGADA AL USUARIO ---
// En lugar de un booleano plano ('true'), guardamos a QUÉ usuario se le verificó la sesión,
// con qué método y cuándo caduca. Así, si cambia la cuenta activa en la pestaña, la verificación
// anterior deja de ser válida automáticamente.
const SESSION_2FA_KEY = 'sv_2fa_session';
const SESSION_2FA_TTL_MS = 12 * 60 * 60 * 1000; // 12 horas

const leerSesion2FA = () => {
  try {
    const raw = sessionStorage.getItem(SESSION_2FA_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data?.uid || typeof data.expira !== 'number' || Date.now() > data.expira) {
      sessionStorage.removeItem(SESSION_2FA_KEY);
      return null;
    }
    return data;
  } catch {
    sessionStorage.removeItem(SESSION_2FA_KEY);
    return null;
  }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sesion2FA, setSesion2FA] = useState(() => leerSesion2FA());
  // Mientras un popup OAuth está en curso, evitamos que Login dispare el envío del código por correo
  const [oauthEnCurso, setOauthEnCurso] = useState(false);

  // La sesión solo cuenta como verificada si pertenece al usuario actualmente autenticado
  const is2FAPassed = !!(user && sesion2FA && sesion2FA.uid === user.uid && Date.now() <= sesion2FA.expira);

  const marcarSesionVerificada = (uid, metodo) => {
    const data = { uid, metodo, expira: Date.now() + SESSION_2FA_TTL_MS };
    sessionStorage.setItem(SESSION_2FA_KEY, JSON.stringify(data));
    sessionStorage.removeItem('2fa_passed'); // Limpieza del formato antiguo
    setSesion2FA(data);
  };

  const limpiarSesion2FA = () => {
    sessionStorage.removeItem(SESSION_2FA_KEY);
    sessionStorage.removeItem('2fa_passed');
    setSesion2FA(null);
  };

  const verify2FA = async () => {
    if (!auth.currentUser) return;
    marcarSesionVerificada(auth.currentUser.uid, 'email-code');

    // Si era un registro pendiente, el primer código correcto demuestra que el correo existe y es suyo
    try {
      await setDoc(doc(db, 'users', auth.currentUser.uid), { verificado: true }, { merge: true });
    } catch (err) {
      console.error('No se pudo marcar la cuenta como verificada:', err);
    }
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
        await deleteDoc(doc(db, '2fa_codes', currentUser.uid));
        await deleteDoc(doc(db, 'users', currentUser.uid));
        try {
          await setDoc(doc(db, 'stats', 'global'), { users: increment(-1) }, { merge: true });
        } catch (statsErr) {
          console.error('No se pudo descontar el contador de usuarios:', statsErr);
        }
        await deleteUser(currentUser); // También cierra la sesión
        limpiarSesion2FA();
        return;
      } catch (err) {
        console.error('No se pudo eliminar la cuenta pendiente:', err);
      }
    }

    await logout();
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
  // Google ya verifica la identidad y el correo, así que no se exige un segundo código por EmailJS.
  const loginWithGoogle = async () => {
    setOauthEnCurso(true);
    try {
      const googleProvider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, googleProvider);
      const firebaseUser = userCredential.user;
      marcarSesionVerificada(firebaseUser.uid, 'google');

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
  // Igual que Google: el proveedor ya verificó la cuenta, se omite el código por correo.
  const loginWithMicrosoft = async () => {
    setOauthEnCurso(true);
    try {
      const microsoftProvider = new OAuthProvider('microsoft.com');
      microsoftProvider.setCustomParameters({
        prompt: 'select_account'
      });
      const userCredential = await signInWithPopup(auth, microsoftProvider);
      const firebaseUser = userCredential.user;
      marcarSesionVerificada(firebaseUser.uid, 'microsoft');

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
  const logout = () => {
    limpiarSesion2FA();
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

  // Observador: Está vigilando todo el tiempo si alguien entra o sale
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      // Si no hay sesión, o la verificación guardada pertenece a otra cuenta, se invalida
      const guardada = leerSesion2FA();
      if (!currentUser || (guardada && guardada.uid !== currentUser.uid)) {
        sessionStorage.removeItem(SESSION_2FA_KEY);
        sessionStorage.removeItem('2fa_passed');
        setSesion2FA(null);
      }
      setLoading(false); // Ya terminó de verificar
    });
    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ signup, login, loginWithGoogle, loginWithMicrosoft, logout, updateUserPhoto, user, loading, is2FAPassed, oauthEnCurso, verify2FA, cancelarRegistroPendiente }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}