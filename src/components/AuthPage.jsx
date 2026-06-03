import { useState, Suspense, lazy } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, GraduationCap, ArrowLeft } from 'lucide-react';
import { IoTDotFieldBackdrop } from './CanvasRevealBackground';

const Spline = lazy(() => import('@splinetool/react-spline'));

function SplineScene({ scene, className }) {
  return (
    <Suspense 
      fallback={
        <div className="w-full h-full flex items-center justify-center bg-black/10">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="animate-spin text-blue-500 w-8 h-8" />
            <span className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">Loading 3D Scene...</span>
          </div>
        </div>
      }
    >
      <Spline
        scene={scene}
        className={className}
      />
    </Suspense>
  );
}

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

const PORTAL_META = {
  student: {
    roleLabel: 'طالب IoT',
    title: 'طالب IoT',
    subtitle: 'IOT STUDENT · SANDBOX',
    badge: 'بوابة طلاب إنترنت الأشياء',
    color: 'purple',
    icon: GraduationCap,
    description: 'بيئة تعلم وتطوير: محاكاة ESP32، لوحة تحكم قابلة للترتيب، أكواد جاهزة، ونافذة أوامر MQTT.',
    google: true,
  },
};

export default function AuthPage({ loginWithGoogle, error, setError }) {
  const [loading, setLoading] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  const loginPortal = 'student';
  const loginMeta = PORTAL_META[loginPortal];

  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      localStorage.setItem('auth_portal_mode', loginPortal);
      await loginWithGoogle();
    } catch (err) {
      console.error('Google Auth error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-slate-950 text-white overflow-x-hidden font-sans select-none">
      <IoTDotFieldBackdrop wrapperClassName="absolute inset-0 z-0 opacity-30 pointer-events-none" />

      {/* Header */}
      <header className="fixed top-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 pl-5 pr-5 py-2.5 rounded-full border border-slate-800 bg-slate-950/70 backdrop-blur-md">
        <img src="/logo_icon.png" className="w-5 h-5 object-contain" alt="IOT365" />
        <span className="text-xs font-bold tracking-wider text-slate-300">
          IOT<span className="text-blue-400">365</span> SECURE GATEWAY
        </span>
      </header>

      {/* Main Content Area */}
      <div className="relative z-10 flex flex-1 items-center justify-center px-4 sm:px-8 py-20">
        <AnimatePresence mode="wait">
          {!showLogin ? (
            // LANDING SCREEN (3D Scene + Project Description)
            <motion.div
              key="landing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pt-8"
            >
              {/* Left Column: Text description */}
              <div className="lg:col-span-5 text-right flex flex-col items-end space-y-6 Order-2 lg:order-1">
                <span className="px-3.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] font-bold text-blue-400 uppercase tracking-wider">
                  منصة إنترنت الأشياء الذكية
                </span>
                
                <h1 className="text-4xl sm:text-5xl font-black text-white leading-tight tracking-tight">
                  تحكم، راقب وابتكر مع <span className="bg-gradient-to-r from-blue-400 to-violet-500 bg-clip-text text-transparent">IOT365</span>
                </h1>
                
                <p className="text-slate-400 text-sm sm:text-base font-light leading-relaxed max-w-md">
                  بيئة سحابية تفاعلية مصممة لطلاب ومطوري إنترنت الأشياء لربط لوحات <code className="bg-slate-900 border border-slate-800 text-blue-400 px-1.5 py-0.5 rounded font-mono text-xs">ESP32</code> لحظياً عبر بروتوكول <code className="bg-slate-900 border border-slate-800 text-violet-400 px-1.5 py-0.5 rounded font-mono text-xs">MQTT</code> دون تعقيدات قواعد البيانات.
                </p>

                <div className="w-full space-y-3 pt-2 text-slate-300 text-xs sm:text-sm font-medium">
                  {[
                    '📊 لوحات تحكم (Dashboards) تفاعلية وقابلة للتخصيص لحظياً.',
                    '🤖 تشخيص ذكي مدمج للعتاد والدوائر الكهربائية عبر محرك Cosmos3.',
                    '⚡ نظام أتمتة ذكي (Automations) لإدارة السيناريوهات المعقدة.',
                    '🔔 تنبيهات مخصصة ونظام إشعارات فوري للأجهزة المتصلة.'
                  ].map((feat, idx) => (
                    <div key={idx} className="flex gap-2 justify-end items-center">
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-4">
                  <button
                    onClick={() => setShowLogin(true)}
                    className="px-8 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.35)] hover:shadow-[0_0_30px_rgba(37,99,235,0.55)] transition-all duration-300 cursor-pointer text-sm"
                  >
                    ابدأ الآن · Get Started
                  </button>
                </div>
              </div>

              {/* Right Column: 3D Spline Scene */}
              <div className="lg:col-span-7 h-[45vh] lg:h-[600px] w-full rounded-3xl border border-slate-900 bg-black/30 backdrop-blur-sm overflow-hidden relative shadow-[0_0_50px_rgba(0,0,0,0.5)] order-1 lg:order-2">
                <SplineScene
                  scene="https://prod.spline.design/kZiKo5OwZgZrtuZh/scene.splinecode"
                  className="w-full h-full"
                />
              </div>
            </motion.div>
          ) : (
            // LOGIN SCREEN (Google Glassmorphic Button Only)
            <motion.div
              key="login"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4 }}
              className="w-full max-w-md flex flex-col items-center"
            >
              {error && (
                <div className="w-full bg-red-500/10 border border-red-500/20 text-red-200 text-xs rounded-2xl p-4 mb-4 text-center leading-relaxed backdrop-blur-md">
                  {error}
                </div>
              )}

              {/* Glassmorphic Login Container */}
              <div className="w-full rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-8 shadow-[0_15px_50px_rgba(0,0,0,0.4)] relative overflow-hidden flex flex-col items-center">
                {/* Background glow decoration */}
                <div className="absolute -top-12 -right-12 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

                <div className="text-center mb-8">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-3 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.1)]">
                    <GraduationCap size={24} />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-1">تسجيل الدخول</h2>
                  <p className="text-[10px] font-mono tracking-widest text-slate-400 uppercase">
                    IOT STUDENT · SANDBOX GATEWAY
                  </p>
                </div>

                {/* Google Glassmorphic Button */}
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 bg-white/5 hover:bg-white/10 text-white font-bold py-4 px-6 rounded-2xl text-sm border border-white/10 hover:border-white/20 transition-all duration-300 backdrop-blur-md hover:shadow-[0_0_30px_rgba(255,255,255,0.07)] disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <Loader2 size={18} className="animate-spin text-white" />
                  ) : (
                    <GoogleIcon />
                  )}
                  <span>دخول سريع بحساب Google</span>
                </button>

                {/* Back Link */}
                <button
                  onClick={() => { setError(null); setShowLogin(false); }}
                  className="mt-6 text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ArrowLeft size={14} />
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

