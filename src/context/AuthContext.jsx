import { createContext, useContext, useEffect, useState } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
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

  // Funciones Mágicas

  // A. Registrar nuevo usuario con Email
  const signup = async (email, password, nombre) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;
    
    // Al registrarse, le creamos un documento en Firestore (La Bóveda)
    await setDoc(doc(db, 'users', firebaseUser.uid), {
      uid: firebaseUser.uid,
      nombre: nombre,
      email: email,
      biografia: "Nuevo explorador sónico...",
      ciudad: "",
      fechaRegistro: new Date().toISOString()
    });
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
        fechaRegistro: new Date().toISOString()
      });
    }
    return firebaseUser;
  };

  // D. Cerrar Sesión
  const logout = () => signOut(auth);

  // Observador: Está vigilando todo el tiempo si alguien entra o sale
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false); // Ya terminó de verificar
    });
    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ signup, login, loginWithGoogle, logout, user, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}