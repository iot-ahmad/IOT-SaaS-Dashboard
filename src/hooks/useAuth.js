import { useState, useEffect, useRef } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  sendEmailVerification,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';


const googleProvider = new GoogleAuthProvider();

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
  /** رسالة نجاح التسجيل (بريد التحقق) — نص إنجليزي ثابت كما طُلب */
  const [registrationSuccessMessage, setRegistrationSuccessMessage] = useState(null);
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

      if (firebaseUser) {
        const isGoogleUser = firebaseUser.providerData?.some(p => p.providerId === 'google.com');
        
        // 1. Set preliminary user data immediately to unblock the UI (Fast Load)
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          emailVerified: firebaseUser.emailVerified || isGoogleUser,
          displayName: firebaseUser.displayName || 'User',
          photoURL: firebaseUser.photoURL || null,
        });
        setLoading(false);

        // 2. Fetch extra profile details in the background
        fetchUserProfile(firebaseUser.uid).then((userData) => {
          if (Object.keys(userData).length > 0) {
            setUser(prev => prev ? {
              ...prev,
              ...userData,
              displayName: firebaseUser.displayName || userData.displayName || prev.displayName,
              photoURL: firebaseUser.photoURL || userData.photoURL || prev.photoURL,
            } : null);
          }
        }).catch(() => {});

      } else {
        setUser(null);
        setLoading(false);
      }
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
    setRegistrationSuccessMessage(null);
    setUnverifiedLoginEmail(null);



    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      if (err.message !== 'Email not verified') {
        setError(err.message.replace('Firebase: ', ''));
      }
      throw err;
    }
  };

  const signup = async (email, password, displayName) => {
    setError(null);
    setRegistrationSuccessMessage(null);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName });
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        displayName,
        plan: 'Free',
        createdAt: new Date().toISOString(),
      });
      // Send verification
      await sendEmailVerification(userCredential.user);
      
      setRegistrationSuccessMessage(
        'Verification link sent! Please check your email and click the link to activate your account.',
      );
    } catch (err) {
      setError(err.message.replace('Firebase: ', ''));
      throw err;
    }
  };

  useEffect(() => {
    // Process redirect result if coming back from Google redirect login
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          const gUser = result.user;
          setDoc(
            doc(db, 'users', gUser.uid),
            {
              displayName: gUser.displayName || 'User',
              photoURL: gUser.photoURL || null,
              plan: 'Free',
              createdAt: new Date().toISOString(),
            },
            { merge: true },
          ).catch(() => {});
        }
      })
      .catch((err) => {
        if (err.code !== 'auth/popup-closed-by-user') {
          setError(err.message.replace('Firebase: ', ''));
        }
      });
  }, []);

  const loginWithGoogle = async () => {
    setError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const { user: gUser } = result;
      // Upsert Firestore profile so the user doc always exists
      await setDoc(
        doc(db, 'users', gUser.uid),
        {
          displayName: gUser.displayName || 'User',
          photoURL: gUser.photoURL || null,
          plan: 'Free',
          createdAt: new Date().toISOString(),
        },
        { merge: true },
      );
    } catch (err) {
      // If popup fails, is blocked, or returns invalid action, fallback to redirect mode
      if (
        err.code === 'auth/popup-blocked' ||
        err.code === 'auth/cancelled-popup-request' ||
        err.code === 'auth/internal-error' ||
        err.message?.includes('invalid') ||
        err.message?.includes('action')
      ) {
        console.warn('Google Auth popup failed, falling back to redirect flow...', err);
        await signInWithRedirect(auth, googleProvider);
        return;
      }
      if (err.code !== 'auth/popup-closed-by-user') {
        setError(err.message.replace('Firebase: ', ''));
      }
      throw err;
    }
  };

  const logout = async () => {
    if (user?.uid?.startsWith('mock-enterprise-')) {
      setUser(null);
      return;
    }
    await signOut(auth);
  };

  const clearVerificationNotice = () => {
    setVerificationNotice(null);
    setVerificationIsResend(false);
  };

  const clearRegistrationSuccess = () => setRegistrationSuccessMessage(null);

  /** إعادة إرسال رابط التفعيل (يتطلب نفس الإيميل وكلمة المرور المدخلة في النموذج) */
  const resendVerificationEmail = async (email, password) => {
    setError(null);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      if (userCredential.user.emailVerified) {
        await signOut(auth);
        setUnverifiedLoginEmail(null);
        setError('تم تفعيل البريد مسبقاً. يمكنك تسجيل الدخول الآن.');
        return;
      }
      await sendEmailVerification(userCredential.user);
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
    loginWithGoogle,
    logout,
    setError,
    registrationSuccessMessage,
    verificationNotice,
    verificationIsResend,
    unverifiedLoginEmail,
    clearUnverifiedLoginEmail: () => setUnverifiedLoginEmail(null),
    resendVerificationEmail,
    clearVerificationNotice,
    clearRegistrationSuccess,
  };
}
