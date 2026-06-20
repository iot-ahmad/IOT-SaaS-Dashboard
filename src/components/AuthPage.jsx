import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GraduationCap, ArrowLeft, Loader2 } from 'lucide-react';
import { SplineScene } from './SplineScene';

/* SplineScene is now in ./SplineScene.jsx */

/* ─── White-toned Google G icon ─────────────────────────────────────── */
const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="rgba(255,255,255,0.9)" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="rgba(255,255,255,0.7)" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="rgba(255,255,255,0.55)" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="white" />
  </svg>
);

/* ─── Main Component ─────────────────────────────────────────────────── */
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
    /* dir="rtl" on root — fixes ALL BiDi issues globally for this page */
    <div
      dir="rtl"
      className="relative flex min-h-screen w-full flex-col bg-black text-white overflow-x-hidden font-sans select-none"
    >

      {/* ── Header — LTR since it's brand name only ── */}
      <header className="fixed top-0 left-0 right-0 z-20 flex items-center justify-center py-5">
        <div dir="ltr" className="flex items-center gap-3 px-5 py-2.5 rounded-full border border-border bg-black/80 backdrop-blur-md">
          <img
            src="/logo_icon.png"
            className="w-5 h-5 object-contain"
            style={{ filter: 'brightness(0) invert(1)' }}
            alt="IOT365"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          <span className="ltr text-xs font-bold tracking-wider text-white/50">
            IOT<span className="text-white">365</span>
            <span className="text-white/25 ml-2">SECURE GATEWAY</span>
          </span>
        </div>
      </header>

      {/* ── Content ── */}
      <div className="relative z-10 flex flex-1 items-center justify-center min-h-screen px-4 sm:px-8">
        <AnimatePresence mode="wait">

          {/* ══════════ LANDING PAGE ══════════ */}
          {!showLogin && (
            <motion.div
              key="landing"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.45 }}
              dir="ltr"
              className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-0 items-center min-h-screen"
            >
              {/* LEFT: Text — RTL inside for Arabic content */}
              <div
                dir="rtl"
                className="flex flex-col items-end text-right space-y-7 px-4 lg:px-12 py-24 order-2 lg:order-1"
              >

                {/* Arabic-only badge — purely RTL */}
                <span className="px-3 py-1 rounded-full border border-border bg-card/[0.03] text-[10px] font-bold text-white/40 uppercase tracking-[0.18em]">
                  منصة إنترنت الأشياء الذكية
                </span>

                {/* Title block — English words, LTR */}
                <div dir="ltr" className="space-y-2 text-left">
                  <h1 className="text-5xl sm:text-6xl font-black text-white leading-[1.05] tracking-tight">
                    Interactive
                  </h1>
                  <h1 className="text-5xl sm:text-6xl font-black text-white/30 leading-[1.05] tracking-tight">
                    IOT365
                  </h1>
                </div>

                {/*
                  Mixed paragraph — use dir="rtl" + unicode-bidi:plaintext
                  so Arabic text flows RTL and inline English words (ESP32, MQTT)
                  are isolated correctly via <bdi> tags
                */}
                <p
                  dir="rtl"
                  className="bidi-auto text-white/40 text-sm sm:text-base font-light leading-relaxed max-w-sm"
                >
                  بيئة سحابية تفاعلية لطلاب ومطوري إنترنت الأشياء. ربط{' '}
                  <bdi><code className="bg-card/5 border border-border text-white/60 px-1.5 py-0.5 rounded font-mono text-xs">ESP32</code></bdi>
                  {' '}لحظياً عبر{' '}
                  <bdi><code className="bg-card/5 border border-border text-white/60 px-1.5 py-0.5 rounded font-mono text-xs">MQTT</code></bdi>
                  {' '}دون تعقيدات.
                </p>

                {/* Feature list — Arabic text, RTL */}
                <div dir="rtl" className="space-y-2.5 text-white/30 text-xs sm:text-sm text-right w-full max-w-sm">
                  {[
                    'لوحات تحكم تفاعلية وقابلة للتخصيص لحظياً.',
                    <>تشخيص ذكي للعتاد والدوائر عبر محرك <bdi>Cosmos3</bdi>.</>,
                    'نظام أتمتة ذكي للسيناريوهات المعقدة.',
                    'تنبيهات ونظام إشعارات فوري للأجهزة.',
                  ].map((feat, idx) => (
                    <div key={idx} className="flex flex-row-reverse gap-3 items-start">
                      <span className="shrink-0 w-1 h-1 rounded-full bg-card/20 mt-1.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>

                {/* CTA button — mixed Arabic + English, use bdi for "Get Started" */}
                <button
                  onClick={() => setShowLogin(true)}
                  className="mt-2 px-8 py-3.5 bg-card text-black font-bold rounded-xl hover:bg-card/90 active:scale-[0.97] transition-all duration-200 cursor-pointer text-sm tracking-wide shadow-[0_0_40px_rgba(255,255,255,0.1)] hover:shadow-[0_0_55px_rgba(255,255,255,0.2)]"
                >
                  <span dir="rtl">ابدأ الآن · <bdi>Get Started</bdi></span>
                </button>
              </div>

              {/* RIGHT: 3D Robot Scene via @splinetool/react-spline */}
              <div className="h-[50vh] lg:h-screen w-full overflow-hidden relative order-1 lg:order-2 bg-black">
                <SplineScene
                  scene="https://prod.spline.design/PyzDhpQ9E5f1E3MT/scene.splinecode"
                  className="w-full h-full"
                />
                {/* Fade left edge toward text column */}
                <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-black to-transparent pointer-events-none" />
                <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black to-transparent pointer-events-none" />
                <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black to-transparent pointer-events-none" />
              </div>
            </motion.div>
          )}

          {/* ══════════ LOGIN PAGE ══════════ */}
          {showLogin && (
            <motion.div
              key="login"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="w-full max-w-sm flex flex-col items-center py-24"
            >
              {error && (
                <div
                  dir="rtl"
                  className="w-full bg-card/[0.03] border border-border text-white/50 text-xs rounded-2xl p-4 mb-4 text-center leading-relaxed"
                >
                  {error}
                </div>
              )}

              {/* Glassmorphic card */}
              <div className="w-full rounded-3xl border border-white/[0.07] bg-card/[0.02] backdrop-blur-2xl p-8 shadow-[0_20px_80px_rgba(0,0,0,0.9)] relative overflow-hidden flex flex-col items-center">

                <div className="absolute -top-20 -right-20 w-48 h-48 bg-card/[0.02] rounded-full blur-3xl pointer-events-none" />

                <div dir="rtl" className="text-center mb-8">
                  <div className="w-12 h-12 rounded-2xl bg-card/[0.04] border border-white/[0.08] flex items-center justify-center mx-auto mb-4 text-white/30">
                    <GraduationCap size={22} />
                  </div>
                  {/* Arabic heading — RTL */}
                  <h2 className="text-2xl font-black text-white mb-1.5 tracking-tight">
                    تسجيل الدخول
                  </h2>
                  {/* Purely English subtitle — LTR isolated */}
                  <p dir="ltr" className="ltr text-[10px] font-mono tracking-[0.2em] text-white/20 uppercase">
                    IOT STUDENT · SANDBOX GATEWAY
                  </p>
                </div>

                {/* Google login button — RTL with bdi around "Google" */}
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  dir="rtl"
                  className="w-full flex items-center justify-center gap-3 bg-card/[0.04] hover:bg-card/[0.09] text-white/70 hover:text-white font-semibold py-4 px-6 rounded-2xl text-sm border border-white/[0.08] hover:border-white/20 transition-all duration-300 backdrop-blur-md disabled:opacity-40 cursor-pointer"
                >
                  {loading ? (
                    <Loader2 size={18} className="animate-spin text-white/30" />
                  ) : (
                    <GoogleIcon />
                  )}
                  <span>دخول سريع بحساب <bdi>Google</bdi></span>
                </button>

                {/* Back button — Arabic RTL */}
                <button
                  onClick={() => { setError(null); setShowLogin(false); }}
                  dir="rtl"
                  className="mt-6 text-[11px] text-white/20 hover:text-white/50 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {/* ArrowLeft flips visually in RTL — use ArrowRight semantics */}
                  <ArrowLeft size={12} className="rotate-180" />
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
