import { useState, useEffect, useRef } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  sendEmailVerification,
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
  const [verificationNotice, setVerificationNotice] = useState(null);
  /** بعد إعادة الإرسال نعرض نصاً مختلفاً في صندوق النجاح */
  const [verificationIsResend, setVerificationIsResend] = useState(false);
  /** إيميل محاولة دخول فاشلة لأن الحساب غير مفعّل — لإظهار زر إعادة الإرسال */
  const [unverifiedLoginEmail, setUnverifiedLoginEmail] = useState(null);
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
              emailVerified: firebaseUser.emailVerified,
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
    setVerificationNotice(null);
    setVerificationIsResend(false);
    setUnverifiedLoginEmail(null);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      if (!cred.user.emailVerified) {
        await signOut(auth);
        setUnverifiedLoginEmail(email);
        setError('يرجى تفعيل حسابك من الإيميل أولاً');
        throw new Error('Email not verified');
      }
    } catch (err) {
      if (err.message !== 'Email not verified') {
        setError(err.message.replace('Firebase: ', ''));
      }
      throw err;
    }
  };

  const signup = async (email, password, displayName) => {
    setError(null);
    setVerificationNotice(null);
    setVerificationIsResend(false);
    setUnverifiedLoginEmail(null);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName });
      await setDoc(doc(db, 'users', cred.user.uid), {
        displayName,
        email,
        plan: 'Free',
        createdAt: new Date().toISOString(),
      });
      await sendEmailVerification(cred.user);
      await signOut(auth);
      setVerificationIsResend(false);
      setVerificationNotice(email);
    } catch (err) {
      try {
        if (auth.currentUser) await signOut(auth);
      } catch {
        /* ignore */
      }
      setError(err.message.replace('Firebase: ', ''));
      throw err;
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  const clearVerificationNotice = () => {
    setVerificationNotice(null);
    setVerificationIsResend(false);
  };

  /** إعادة إرسال رابط التفعيل (يتطلب نفس الإيميل وكلمة المرور المدخلة في النموذج) */
  const resendVerificationEmail = async (email, password) => {
    setError(null);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      if (cred.user.emailVerified) {
        await signOut(auth);
        setUnverifiedLoginEmail(null);
        setError('تم تفعيل البريد مسبقاً. يمكنك تسجيل الدخول الآن.');
        return;
      }
      await sendEmailVerification(cred.user);
      await signOut(auth);
      setUnverifiedLoginEmail(null);
      setError(null);
      setVerificationIsResend(true);
      setVerificationNotice(email);
    } catch (err) {
      try {
        if (auth.currentUser) await signOut(auth);
      } catch {
        /* ignore */
      }
      setError(err.message.replace('Firebase: ', ''));
      throw err;
    }
  };

  return {
    user,
    loading,
    error,
    login,
    signup,
    logout,
    setError,
    verificationNotice,
    verificationIsResend,
    unverifiedLoginEmail,
    clearUnverifiedLoginEmail: () => setUnverifiedLoginEmail(null),
    resendVerificationEmail,
    clearVerificationNotice,
  };
}
