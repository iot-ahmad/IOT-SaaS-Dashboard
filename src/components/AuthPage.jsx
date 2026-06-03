import { useState, Suspense, lazy } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, GraduationCap, ArrowLeft } from 'lucide-react';

const Spline = lazy(() => import('@splinetool/react-spline'));

function SplineScene({ scene, className }) {
  return (
    <Suspense
      fallback={
        <div className="w-full h-full flex items-center justify-center bg-black">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="animate-spin text-white/40 w-8 h-8" />
            <span className="text-[10px] text-white/20 font-mono tracking-widest uppercase">
              Loading 3D Scene...
            </span>
          </div>
        </div>
      }
    >
      <Spline scene={scene} className={className} />
    </Suspense>
  );
}

/* White-tinted Google G icon */
const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="rgba(255,255,255,0.9)" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="rgba(255,255,255,0.7)" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="rgba(255,255,255,0.55)" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="rgba(255,255,255,1)" />
  </svg>
);

export default function AuthPage({ loginWithGoogle, error, setError }) {
  const [loading, setLoading] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      localStorage.setItem('auth_portal_mode', 'student');
      await loginWithGoogle();
    } catch (err) {
      console.error('Google Auth error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-black text-white overflow-x-hidden font-sans select-none">

      {/* Header pill */}
      <header className="fixed top-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 px-5 py-2.5 rounded-full border border-white/10 bg-black/80 backdrop-blur-md">
        <img
          src="/logo_icon.png"
          className="w-5 h-5 object-contain"
          style={{ filter: 'brightness(0) invert(1)' }}
          alt="IOT365"
        />
        <span className="text-xs font-bold tracking-wider text-white/50">
          IOT<span className="text-white">365</span> SECURE GATEWAY
        </span>
      </header>

      {/* Content */}
      <div className="relative z-10 flex flex-1 items-center justify-center px-4 sm:px-8 py-20 min-h-screen">
        <AnimatePresence mode="wait">

          {/* ─── LANDING PAGE ─────────────────────────────────────────── */}
          {!showLogin && (
            <motion.div
              key="landing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.5 }}
              className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-0 items-center"
            >
              {/* Left: text */}
              <div className="lg:col-span-5 flex flex-col items-end text-right space-y-6 order-2 lg:order-1 px-4 lg:px-0 pb-10 lg:pb-0">

                <span className="px-3 py-1 rounded-full border border-white/[0.08] bg-white/[0.03] text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">
                  منصة إنترنت الأشياء الذكية
                </span>

                <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-black text-white leading-[1.1] tracking-tight">
                  تحكم، راقب<br />
                  <span className="text-white/35">وابتكر مع</span>{' '}
                  IOT365
                </h1>

                <p className="text-white/35 text-sm leading-relaxed max-w-md">
                  بيئة سحابية تفاعلية مصممة لطلاب ومطوري إنترنت الأشياء لربط
                  لوحات{' '}
                  <code className="bg-white/5 border border-white/10 text-white/60 px-1.5 py-0.5 rounded font-mono text-xs">ESP32</code>
                  {' '}لحظياً عبر بروتوكول{' '}
                  <code className="bg-white/5 border border-white/10 text-white/60 px-1.5 py-0.5 rounded font-mono text-xs">MQTT</code>
                  {' '}دون تعقيدات قواعد البيانات.
                </p>

                <div className="w-full space-y-2.5 text-white/35 text-xs sm:text-sm">
                  {[
                    'لوحات تحكم تفاعلية وقابلة للتخصيص لحظياً.',
                    'تشخيص ذكي للعتاد والدوائر الكهربائية عبر محرك Cosmos3.',
                    'نظام أتمتة ذكي لإدارة السيناريوهات المعقدة.',
                    'تنبيهات مخصصة ونظام إشعارات فوري للأجهزة المتصلة.',
                  ].map((feat, idx) => (
                    <div key={idx} className="flex gap-3 justify-end items-start">
                      <span>{feat}</span>
                      <span className="shrink-0 w-1 h-1 rounded-full bg-white/20 mt-1.5" />
                    </div>
                  ))}
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => setShowLogin(true)}
                    className="px-8 py-3.5 bg-white text-black font-bold rounded-xl hover:bg-white/90 active:scale-[0.98] transition-all duration-200 cursor-pointer text-sm tracking-wide shadow-[0_0_40px_rgba(255,255,255,0.12)] hover:shadow-[0_0_50px_rgba(255,255,255,0.22)]"
                  >
                    ابدأ الآن · Get Started
                  </button>
                </div>
              </div>

              {/* Right: 3D Spline */}
              <div className="lg:col-span-7 h-[50vh] lg:h-screen w-full overflow-hidden relative order-1 lg:order-2">
                <SplineScene
                  scene="https://prod.spline.design/kZiKo5OwZgZrtuZh/scene.splinecode"
                  className="w-full h-full"
                />
                {/* Edge fades for seamless blend with black bg */}
                <div className="absolute inset-y-0 left-0 w-40 bg-gradient-to-r from-black via-black/60 to-transparent pointer-events-none" />
                <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black to-transparent pointer-events-none" />
                <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black to-transparent pointer-events-none" />
              </div>
            </motion.div>
          )}

          {/* ─── LOGIN PAGE ───────────────────────────────────────────── */}
          {showLogin && (
            <motion.div
              key="login"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="w-full max-w-sm flex flex-col items-center"
            >
              {error && (
                <div className="w-full bg-white/5 border border-white/10 text-white/50 text-xs rounded-2xl p-4 mb-4 text-center leading-relaxed">
                  {error}
                </div>
              )}

              {/* Glassmorphic card */}
              <div className="w-full rounded-3xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-2xl p-8 shadow-[0_20px_80px_rgba(0,0,0,0.9)] relative overflow-hidden flex flex-col items-center">

                {/* Top-right soft glow */}
                <div className="absolute -top-20 -right-20 w-48 h-48 bg-white/[0.03] rounded-full blur-3xl pointer-events-none" />

                {/* Icon + title */}
                <div className="text-center mb-8">
                  <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mx-auto mb-4 text-white/30">
                    <GraduationCap size={22} />
                  </div>
                  <h2 className="text-2xl font-black text-white mb-1.5 tracking-tight">
                    تسجيل الدخول
                  </h2>
                  <p className="text-[10px] font-mono tracking-[0.2em] text-white/20 uppercase">
                    IOT STUDENT · SANDBOX GATEWAY
                  </p>
                </div>

                {/* Google button — transparent glass */}
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 bg-white/[0.04] hover:bg-white/[0.08] text-white/70 hover:text-white font-semibold py-4 px-6 rounded-2xl text-sm border border-white/[0.08] hover:border-white/20 transition-all duration-300 backdrop-blur-md disabled:opacity-40 cursor-pointer"
                >
                  {loading ? (
                    <Loader2 size={18} className="animate-spin text-white/40" />
                  ) : (
                    <GoogleIcon />
                  )}
                  <span>دخول سريع بحساب Google</span>
                </button>

                {/* Back */}
                <button
                  onClick={() => { setError(null); setShowLogin(false); }}
                  className="mt-6 text-[11px] text-white/20 hover:text-white/50 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ArrowLeft size={12} />
                  <span>العودة للرئيسية</span>
                </button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
