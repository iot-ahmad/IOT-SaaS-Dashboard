import { useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, GraduationCap } from 'lucide-react';
import { IoTDotFieldBackdrop } from './CanvasRevealBackground';
import { getPortalPath } from '../config/portals';

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

const colorClasses = {
  purple: {
    active: 'bg-purple-950/20 border-purple-500 shadow-[0_0_30px_rgba(168,85,247,0.2)]',
    idle: 'bg-slate-900/30 border-slate-800 hover:border-slate-700 hover:bg-slate-900/50',
    icon: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
    label: 'text-purple-400',
    btn: 'bg-purple-600 hover:bg-purple-500',
    glow: 'bg-purple-500/5 group-hover:bg-purple-500/10',
  },
};

export default function AuthPage({ loginWithGoogle, error, setError }) {
  const [loading, setLoading] = useState(false);

  const loginPortal = 'student';
  const loginMeta = PORTAL_META[loginPortal];
  const LoginIcon = loginMeta.icon;

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
    <div className="relative flex min-h-screen w-full flex-col bg-slate-950 text-white overflow-hidden font-sans select-none">
      <IoTDotFieldBackdrop wrapperClassName="absolute inset-0 z-0" />

      <header className="fixed top-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 pl-5 pr-5 py-2.5 rounded-full border border-slate-800 bg-slate-950/70 backdrop-blur-md">
        <img src="/logo_icon.png" className="w-5 h-5 object-contain" alt="IOT365" />
        <span className="text-xs font-bold tracking-wider text-slate-300">
          IOT<span className="text-blue-400">365</span> SECURE GATEWAY
        </span>
      </header>

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 pt-24 pb-12">
        <div className="w-full max-w-4xl text-center space-y-3 mb-10">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <span className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] font-bold text-blue-400 uppercase tracking-widest">
              {loginMeta.badge}
            </span>
            <h1 className="text-3xl sm:text-4xl font-black text-white mt-3">
              {`تسجيل الدخول · ${loginMeta.roleLabel}`}
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm font-light max-w-lg mx-auto">
              {loginMeta.description}
            </p>
            <p className="text-[10px] text-slate-500 font-mono mt-2">{getPortalPath(loginPortal)}</p>
          </motion.div>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md bg-red-500/10 border border-red-500/20 text-red-200 text-xs rounded-2xl p-4 mb-6 text-center leading-relaxed"
          >
            {error}
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl p-6 shadow-2xl">
            <div className="text-center mb-6">
              <div
                className={`w-12 h-12 rounded-2xl border flex items-center justify-center mx-auto mb-3 ${colorClasses[loginMeta.color].icon}`}
              >
                <LoginIcon size={22} />
              </div>
              <h3 className="text-xl font-bold text-white">{loginMeta.title}</h3>
              <span className={`text-[10px] font-mono ${colorClasses[loginMeta.color].label}`}>
                {loginMeta.subtitle}
              </span>
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2.5 bg-white text-slate-950 font-bold py-3 px-4 rounded-xl text-sm hover:bg-slate-100 transition-all disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin text-slate-950" />
              ) : (
                <GoogleIcon />
              )}
              <span>دخول سريع بحساب Google</span>
            </button>

            <p className="text-center text-[10px] text-purple-400/80 mt-4 font-medium">
              مخصص لطلاب IoT والمطورين — ESP32 · MQTT · لوحة تحكم حية
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

