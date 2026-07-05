import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GraduationCap, ArrowLeft, Loader2, LayoutDashboard, Cpu, Zap, BellRing } from 'lucide-react';
import { WaveBackground } from './ui/WaveBackground';

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

  const handleNavToFeatures = (e) => {
    e.preventDefault();
    if (showLogin) {
      setError(null);
      setShowLogin(false);
      setTimeout(() => {
        const el = document.getElementById('features');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 400);
    } else {
      const el = document.getElementById('features');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const featuresList = [
    {
      title: 'لوحات تحكم تفاعلية',
      desc: 'قم بتصميم وتخصيص لوحات تحكم لحظية لعرض بيانات المستشعرات والتحكم بالأجهزة بنقرة واحدة.',
      icon: <LayoutDashboard size={20} />
    },
    {
      title: 'اتصال لحظي MQTT',
      desc: 'ربط مباشر فوري للأجهزة والعتاد مثل ESP32 باستخدام بروتوكول MQTT الآمن وبزمن استجابة فائق السرعة.',
      icon: <Cpu size={20} />
    },
    {
      title: 'أتمتة ذكية وسيناريوهات',
      desc: 'صياغة قواعد وسيناريوهات برمجية للتحكم التلقائي بأجهزتك بناءً على قراءات الحساسات المختلفة.',
      icon: <Zap size={20} />
    },
    {
      title: 'تنبيهات فورية وذكية',
      desc: 'نظام إشعارات وتنبيهات ذكي يرسل تحديثات حالة الأجهزة فورياً لمنع المشاكل قبل حدوثها.',
      icon: <BellRing size={20} />
    }
  ];

  return (
    /* dir="rtl" on root — fixes ALL BiDi issues globally for this page */
    <div
      dir="rtl"
      className="relative flex min-h-screen w-full flex-col bg-[#080808] text-white overflow-y-auto overflow-x-hidden scroll-smooth font-sans select-none"
    >
      {/* Dynamic Wave & Grain Background */}
      <WaveBackground />

      {/* ── Header ── */}
      <header className="fixed top-0 left-0 right-0 z-20 w-full px-6 py-6 md:px-12 flex items-center justify-between">
        {/* Left: Brand */}
        <div dir="ltr" className="flex items-center gap-2 select-none">
          <span className="text-white text-xl font-bold tracking-wider">
            IOT365<span className="text-cyan-400">.</span>
          </span>
        </div>

        {/* Middle: Links */}
        <div dir="rtl" className="hidden md:flex items-center gap-8 text-[11px] font-bold tracking-widest text-white/40">
          <a href="#features" onClick={handleNavToFeatures} className="hover:text-white transition-colors">المميزات</a>
          <a href="#docs" className="hover:text-white transition-colors">التوثيق</a>
          <a href="#support" className="hover:text-white transition-colors">الدعم الفني</a>
        </div>

        {/* Right: Toggle Button */}
        <div dir="ltr">
          <button
            onClick={() => { setError(null); setShowLogin(!showLogin); }}
            className="border border-white/20 hover:border-white/50 px-5 py-2 rounded-sm text-[10px] font-black tracking-widest text-white hover:bg-white/10 transition-all duration-300 cursor-pointer uppercase"
          >
            {showLogin ? 'HOME' : 'GATEWAY'}
          </button>
        </div>
      </header>

      {/* ── Content ── */}
      <div className="relative z-10 flex flex-1 items-center justify-center w-full px-4">
        <AnimatePresence mode="wait">

          {/* ══════════ LANDING PAGE ══════════ */}
          {!showLogin && (
            <motion.div
              key="landing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="w-full flex flex-col items-center"
            >
              {/* Hero Section */}
              <div className="w-full min-h-screen flex flex-col items-center justify-center text-center px-4 pt-20">
                {/* Cyan Subtitle Badge */}
                <span className="text-cyan-400 text-xs font-extrabold tracking-[0.25em] uppercase mb-4 opacity-80">
                  منصة إنترنت الأشياء الذكية · SMART IOT PLATFORM
                </span>

                {/* Large Outline/Solid Typography Title */}
                <div className="flex flex-col items-center mb-8">
                  <h1 className="text-6xl sm:text-8xl md:text-9xl font-black tracking-tighter text-white leading-none uppercase">
                    IOT365
                  </h1>
                  <h1 
                    className="text-6xl sm:text-8xl md:text-9xl font-black tracking-tighter leading-none mt-2 select-none uppercase"
                    style={{ 
                      WebkitTextStroke: '1px rgba(255, 255, 255, 0.35)', 
                      color: 'transparent' 
                    }}
                  >
                    GATEWAY
                  </h1>
                </div>

                {/* Website Description */}
                <p
                  dir="rtl"
                  className="bidi-auto text-white/50 text-sm sm:text-base font-light leading-relaxed max-w-xl mb-10 text-center"
                >
                  بيئة سحابية تفاعلية لربط ومراقبة أجهزة إنترنت الأشياء لحظياً. تواصل مباشر وتحكم ذكي بالعتاد والـ{' '}
                  <bdi><code className="bg-white/5 border border-white/10 text-white/80 px-1.5 py-0.5 rounded font-mono text-xs">ESP32</code></bdi>
                  {' '}عبر الـ{' '}
                  <bdi><code className="bg-white/5 border border-white/10 text-white/80 px-1.5 py-0.5 rounded font-mono text-xs">MQTT</code></bdi>
                  {' '}بكل سهولة وبدون تعقيدات.
                </p>

                {/* Glowing Pill Button */}
                <button
                  onClick={() => setShowLogin(true)}
                  className="px-10 py-4 bg-white text-black font-extrabold rounded-full hover:bg-neutral-100 hover:scale-105 hover:shadow-[0_0_35px_rgba(255,255,255,0.55)] active:scale-95 transition-all duration-300 cursor-pointer text-xs sm:text-sm tracking-widest uppercase"
                >
                  ابدأ الآن · GET STARTED
                </button>
              </div>

              {/* Features Section */}
              <section
                id="features"
                className="w-full max-w-5xl py-24 px-6 flex flex-col items-center justify-center text-center mt-12 scroll-mt-24"
              >
                <span className="text-cyan-400 text-[10px] font-extrabold tracking-[0.2em] uppercase mb-3">
                  مواصفات ومميزات المشروع
                </span>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-16 tracking-tight">
                  بيئة متكاملة لإدارة أجهزة الـ IOT
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full text-right">
                  {featuresList.map((feat, idx) => (
                    <div 
                      key={idx} 
                      className="p-8 rounded-3xl border border-white/[0.05] bg-white/[0.01] hover:bg-white/[0.03] hover:border-white/10 hover:-translate-y-1 transition-all duration-300 backdrop-blur-md flex flex-col justify-between"
                    >
                      <div className="flex flex-row-reverse items-center justify-between mb-6">
                        <div className="w-10 h-10 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center text-cyan-400">
                          {feat.icon}
                        </div>
                        <span className="text-white/20 text-xs font-mono">0{idx + 1}</span>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white mb-2">{feat.title}</h3>
                        <p className="text-sm text-white/45 leading-relaxed">{feat.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </motion.div>
          )}

          {/* ══════════ LOGIN PAGE ══════════ */}
          {showLogin && (
            <motion.div
              key="login"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.5, cubicBezier: [0.16, 1, 0.3, 1] }}
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
                <div className="absolute -top-20 -right-20 w-48 h-48 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

                <div dir="rtl" className="text-center mb-8">
                  <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center mx-auto mb-4 text-white/30">
                    <GraduationCap size={22} />
                  </div>
                  <h2 className="text-2xl font-black text-white mb-1.5 tracking-tight">
                    تسجيل الدخول
                  </h2>
                  <p dir="ltr" className="ltr text-[10px] font-mono tracking-[0.2em] text-white/20 uppercase">
                    IOT STUDENT · SANDBOX GATEWAY
                  </p>
                </div>

                {/* Google login button */}
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  dir="rtl"
                  className="w-full flex items-center justify-center gap-3 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white font-semibold py-4 px-6 rounded-2xl text-sm border border-white/10 hover:border-white/20 transition-all duration-300 backdrop-blur-md disabled:opacity-40 cursor-pointer"
                >
                  {loading ? (
                    <Loader2 size={18} className="animate-spin text-white/30" />
                  ) : (
                    <GoogleIcon />
                  )}
                  <span>دخول سريع بحساب <bdi>Google</bdi></span>
                </button>

                {/* Back button */}
                <button
                  onClick={() => { setError(null); setShowLogin(false); }}
                  dir="rtl"
                  className="mt-6 text-[11px] text-white/20 hover:text-white/50 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ArrowLeft size={12} className="rotate-180" />
                  <span>العودة للرئيسية</span>
                </button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* ── Footer ── */}
      <footer className="absolute bottom-8 left-6 right-6 md:left-12 md:right-12 z-20 flex flex-col md:flex-row gap-4 items-center justify-between pointer-events-none">
        {/* Left: AB Badge */}
        <div className="flex items-center gap-2.5 pointer-events-auto select-none">
          <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-[10px] font-black text-white/80">
            AB
          </div>
          <div className="flex flex-col text-left">
            <span className="font-extrabold text-white/80 text-[11px] leading-none">Ahmad Batayneh</span>
            <span className="text-[9px] text-white/40 leading-none mt-0.5 font-mono">@iot-ahmad</span>
          </div>
        </div>

        {/* Right: Info */}
        <div className="text-[9px] tracking-[0.2em] text-white/30 uppercase font-mono text-center md:text-right">
          BASED ON MQTT & ESP32 · SECURE PORTAL
        </div>
      </footer>
    </div>
  );
}
