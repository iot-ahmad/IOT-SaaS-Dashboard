import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBzWpAA0x0Fc0GI3RXevpWplApZSZ8U5eI",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "iot-0-1c24c.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "iot-0-1c24c",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "iot-0-1c24c.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "18330410203",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:18330410203:web:1b26e89827faa2eb8280fe",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-BSEZJKFXKN"
};

if (!firebaseConfig.apiKey) {
  console.warn(
    "[Warning] Firebase API Key is missing. Make sure to set VITE_FIREBASE_API_KEY in your environment variables (both locally in .env and in your hosting provider's dashboard)."
  );
}

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
