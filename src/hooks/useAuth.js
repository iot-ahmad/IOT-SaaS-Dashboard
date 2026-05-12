import { useState, useEffect, useRef } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

async function fetchUserProfile(uid) {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    return userDoc.exists() ? userDoc.data() : {};
  } catch {
    // Rules, offline, or blocked third-party storage — do not block the whole app
    return {};
  }
}

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const authListenerFired = useRef(false);

  useEffect(() => {
    const watchdog = setTimeout(() => {
      if (!authListenerFired.current) {
        setLoading(false);
      }
    }, 15000);

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      authListenerFired.current = true;
      clearTimeout(watchdog);

      void (async () => {
        try {
          if (firebaseUser) {
            const userData = await fetchUserProfile(firebaseUser.uid);
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName || userData.displayName || 'User',
              ...userData,
            });
          } else {
            setUser(null);
          }
        } finally {
          setLoading(false);
        }
      })();
    });

    return () => {
      clearTimeout(watchdog);
      unsubscribe();
    };
  }, []);

  const login = async (email, password) => {
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setError(err.message.replace('Firebase: ', ''));
      throw err;
    }
  };

  const signup = async (email, password, displayName) => {
    setError(null);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName });
      // Store extra user info in Firestore
      await setDoc(doc(db, 'users', cred.user.uid), {
        displayName,
        email,
        plan: 'Free',
        createdAt: new Date().toISOString(),
      });
    } catch (err) {
      setError(err.message.replace('Firebase: ', ''));
      throw err;
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  return { user, loading, error, login, signup, logout, setError };
}
