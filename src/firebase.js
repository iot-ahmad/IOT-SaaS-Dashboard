import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyBzWpAA0x0Fc0GI3RXevpWplApZSZ8U5eI",
  authDomain: "iot-0-1c24c.firebaseapp.com",
  projectId: "iot-0-1c24c",
  storageBucket: "iot-0-1c24c.firebasestorage.app",
  messagingSenderId: "18330410203",
  appId: "1:18330410203:web:1b26e89827faa2eb8280fe",
  measurementId: "G-BSEZJKFXKN"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const rtdb = getDatabase(app);
export default app;
