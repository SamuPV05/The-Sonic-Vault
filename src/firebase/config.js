// Importamos las herramientas principales de Firebase
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Tus llaves maestras (sacadas de tu consola)
const firebaseConfig = {
  apiKey: "AIzaSyCL9J9VVoPjeGhY1siarDsj7MxGb9NvcsI",
  authDomain: "the-sonic-vault.firebaseapp.com",
  projectId: "the-sonic-vault",
  storageBucket: "the-sonic-vault.firebasestorage.app",
  messagingSenderId: "360741332062",
  appId: "1:360741332062:web:a83935fd7f697bdf15c0cf"
};

// Inicializamos la aplicación con tus llaves
const app = initializeApp(firebaseConfig);

// Preparamos y exportamos la Autenticación y la Base de Datos para usarlas en React
export const auth = getAuth(app);
export const db = getFirestore(app);