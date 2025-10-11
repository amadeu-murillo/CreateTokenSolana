import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Configuração do seu aplicativo da web do Firebase
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_API_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_API_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_API_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_API_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_API_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_API_MEASUREMENT_ID
};

// Inicializa o Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

export { db };
