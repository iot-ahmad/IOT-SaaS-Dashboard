import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Wifi, ShieldCheck, Zap, Cpu, User, Landmark, GraduationCap, Lock, Mail, ArrowRight } from 'lucide-react';
import { IoTDotFieldBackdrop } from './CanvasRevealBackground';

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

export default function AuthPage({ loginWithGoogle, login, error, setError }) {
  const [activePortal, setActivePortal] = useState(null); // null, 'customer', 'student', 'enterprise'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async (portalMode) => {
    setError(null);
    setLoading(true);
    try {
      // Save chosen portal mode to localStorage BEFORE initiating Google authentication
      localStorage.setItem('auth_portal_mode', portalMode);
      await loginWithGoogle();
    } catch (err) {
      console.error("Google Auth error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      // Save enterprise portal mode
      localStorage.setItem('auth_portal_mode', 'enterprise');
      await login(email, password);
    } catch (err) {
      console.error("Email login error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-slate-950 text-white overflow-hidden font-sans select-none">
      {/* Dynamic backdrop grid */}
      <IoTDotFieldBackdrop wrapperClassName="absolute inset-0 z-0" />

      {/* Futuristic top brand bar */}
      <header className="fixed top-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 pl-5 pr-5 py-2.5 rounded-full border border-slate-800 bg-slate-950/70 backdrop-blur-md">
        <img src="/logo_icon.png" className="w-5 h-5 object-contain" alt="IOT365" />
        <span className="text-xs font-bold tracking-wider text-slate-300">IOT<span className="text-blue-400">365</span> SECURE GATEWAY</span>
      </header>

      {/* Gateway Content */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 pt-24 pb-12">
        <div className="w-full max-w-4xl text-center space-y-3 mb-10">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <span className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] font-bold text-blue-400 uppercase tracking-widest">
              بوابة الدخول الموحدة · Gateway Portals
            </span>
            <h1 className="text-3xl sm:text-4xl font-black text-white mt-3">
              اختر بوابة الدخول الذكية
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm font-light max-w-lg mx-auto">
              اضغط على البوابة المخصصة لاستخدام المنصة بناءً على صلاحياتك أو الغرض المطلوب.
            </p>
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

        {/* Portals Selector Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
          
          {/* 1. CUSTOMER PORTAL */}
          <motion.div
            onClick={() => { if (!loading) setActivePortal('customer'); }}
            className={`cursor-pointer rounded-3xl border p-6 flex flex-col justify-between backdrop-blur-xl transition-all duration-300 relative group overflow-hidden ${
              activePortal === 'customer' 
                ? 'bg-blue-950/20 border-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.2)]'
                : 'bg-slate-900/30 border-slate-800 hover:border-slate-700 hover:bg-slate-900/50'
            }`}
            whileHover={{ y: -4 }}
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-colors" />
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <User size={20} />
              </div>
              <div className="text-right">
                <h3 className="text-lg font-bold text-white">واجهة العميل👤</h3>
                <span className="text-[10px] text-blue-400 font-mono">CUSTOMER APP</span>
                <p className="text-slate-400 text-xs font-light leading-relaxed mt-2.5">
                  شاشة خفيفة مخصصة للهواتف لمتابعة حافلات النقل، أرقام الانتظار بالمراكز الصحية، وإرشادات السياحة بالبترا.
                </p>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-slate-800/80">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleGoogleLogin('customer'); }}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2.5 bg-white text-slate-950 font-bold py-2.5 px-4 rounded-xl text-xs hover:bg-slate-100 transition-all disabled:opacity-50"
              >
                {loading && activePortal === 'customer' ? (
                  <Loader2 size={14} className="animate-spin text-slate-950" />
                ) : (
                  <GoogleIcon />
                )}
                <span>دخول سريع بجوجل</span>
              </button>
            </div>
          </motion.div>

          {/* 2. STUDENT PORTAL */}
          <motion.div
            onClick={() => { if (!loading) setActivePortal('student'); }}
            className={`cursor-pointer rounded-3xl border p-6 flex flex-col justify-between backdrop-blur-xl transition-all duration-300 relative group overflow-hidden ${
              activePortal === 'student'
                ? 'bg-purple-950/20 border-purple-500 shadow-[0_0_30px_rgba(168,85,247,0.2)]'
                : 'bg-slate-900/30 border-slate-800 hover:border-slate-700 hover:bg-slate-900/50'
            }`}
            whileHover={{ y: -4 }}
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl group-hover:bg-purple-500/10 transition-colors" />
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <GraduationCap size={20} />
              </div>
              <div className="text-right">
                <h3 className="text-lg font-bold text-white">واجهة الطالب🎓</h3>
                <span className="text-[10px] text-purple-400 font-mono">STUDENT SANDBOX</span>
                <p className="text-slate-400 text-xs font-light leading-relaxed mt-2.5">
                  بيئة التطوير والتعلم المليئة بأدوات محاكاة ESP32، لوحة التحكم القابلة للترتيب، الأكواد البرمجية، ونافذة الأوامر.
                </p>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-slate-800/80">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleGoogleLogin('student'); }}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2.5 bg-white text-slate-950 font-bold py-2.5 px-4 rounded-xl text-xs hover:bg-slate-100 transition-all disabled:opacity-50"
              >
                {loading && activePortal === 'student' ? (
                  <Loader2 size={14} className="animate-spin text-slate-950" />
                ) : (
                  <GoogleIcon />
                )}
                <span>دخول سريع بجوجل</span>
              </button>
            </div>
          </motion.div>

          {/* 3. ENTERPRISE PORTAL */}
          <motion.div
            onClick={() => { if (!loading) setActivePortal('enterprise'); }}
            className={`cursor-pointer rounded-3xl border p-6 flex flex-col justify-between backdrop-blur-xl transition-all duration-300 relative group overflow-hidden md:col-span-1 ${
              activePortal === 'enterprise'
                ? 'bg-slate-900 border-indigo-500 shadow-[0_0_30px_rgba(99,102,241,0.2)]'
                : 'bg-slate-900/30 border-slate-800 hover:border-slate-700 hover:bg-slate-900/50'
            }`}
            whileHover={{ y: -4 }}
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-colors" />
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Landmark size={20} />
              </div>
              <div className="text-right">
                <h3 className="text-lg font-bold text-white">واجهة المؤسسة🏢</h3>
                <span className="text-[10px] text-indigo-400 font-mono">ENTERPRISE CONSOLE</span>
                <p className="text-slate-400 text-xs font-light leading-relaxed mt-2.5">
                  منصة تحكم متكاملة ومحمية لإدارة أساطيل النقل، تبريد اللقاحات الحرج بالمستشفى، والأسوار الافتراضية السياحية.
                </p>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-slate-800/80">
              <button
                type="button"
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white font-bold py-2.5 px-4 rounded-xl text-xs hover:bg-indigo-500 transition-all disabled:opacity-50"
              >
                <span>دخول بإيميل الموظف</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </motion.div>

        </div>

        {/* Enterprise Login Modal / Drawer Overlay */}
        <AnimatePresence>
          {activePortal === 'enterprise' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
              onClick={() => { if (!loading) setActivePortal(null); }}
            >
              <motion.div
                initial={{ scale: 0.95, y: 15 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 15 }}
                className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 relative"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-white">بوابة الموظفين والمؤسسات</h3>
                  <p className="text-slate-400 text-xs mt-1">سجل الدخول بحسابك المغلق المجهز مسبقاً</p>
                </div>

                <form onSubmit={handleEmailLogin} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 text-right">البريد الإلكتروني</label>
                    <div className="relative">
                      <Mail size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="admin@enterprise.com"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 text-right">كلمة المرور</label>
                    <div className="relative">
                      <Lock size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 rounded-xl text-xs transition-colors flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <Loader2 size={14} className="animate-spin text-white" />
                    ) : (
                      <Lock size={13} />
                    )}
                    <span>دخول لوحة القيادة Command Center</span>
                  </button>

                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => setActivePortal(null)}
                    className="w-full bg-slate-800/80 hover:bg-slate-800 text-slate-300 py-2 rounded-xl text-xs font-bold transition-colors block text-center mt-2"
                  >
                    إلغاء
                  </button>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
