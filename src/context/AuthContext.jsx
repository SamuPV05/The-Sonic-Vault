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
import { doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';
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
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [is2FAPassed, setIs2FAPassed] = useState(() => sessionStorage.getItem('2fa_passed') === 'true');

  const verify2FA = async () => {
    sessionStorage.setItem('2fa_passed', 'true');
    setIs2FAPassed(true);

    // Si era un registro pendiente, el primer código correcto demuestra que el correo existe y es suyo
    if (auth.currentUser) {
      try {
        await setDoc(doc(db, 'users', auth.currentUser.uid), { verificado: true }, { merge: true });
      } catch (err) {
        console.error('No se pudo marcar la cuenta como verificada:', err);
      }
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
        await deleteUser(currentUser); // También cierra la sesión
        sessionStorage.removeItem('2fa_passed');
        setIs2FAPassed(false);
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
      ciudad: "",
      verificado: false, // Pasa a true cuando confirma el primer código del correo
      fechaRegistro: new Date().toISOString()
    });

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
  const loginWithGoogle = async () => {
    const googleProvider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, googleProvider);
    const firebaseUser = userCredential.user;

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
        ciudad: "",
        foto: firebaseUser.photoURL,
        verificado: true, // Google ya garantiza que el correo es real
        fechaRegistro: new Date().toISOString()
      });
    }
    return firebaseUser;
  };

  // C2. Iniciar Sesión con MICROSOFT
  const loginWithMicrosoft = async () => {
    const microsoftProvider = new OAuthProvider('microsoft.com');
    microsoftProvider.setCustomParameters({
      prompt: 'select_account'
    });
    const userCredential = await signInWithPopup(auth, microsoftProvider);
    const firebaseUser = userCredential.user;

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
        ciudad: "",
        foto: firebaseUser.photoURL || null,
        verificado: true, // Microsoft ya garantiza que el correo es real
        fechaRegistro: new Date().toISOString()
      });
    }
    return firebaseUser;
  };

  // D. Cerrar Sesión
  const logout = () => {
    sessionStorage.removeItem('2fa_passed');
    setIs2FAPassed(false);
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
      setLoading(false); // Ya terminó de verificar
    });
    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ signup, login, loginWithGoogle, loginWithMicrosoft, logout, updateUserPhoto, user, loading, is2FAPassed, verify2FA, cancelarRegistroPendiente }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}