import { useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, User, Landmark, GraduationCap, Lock, Mail, ArrowRight, ArrowLeft } from 'lucide-react';
import { IoTDotFieldBackdrop } from './CanvasRevealBackground';
import { navigateToPortal, navigateToGateway, getPortalPath } from '../config/portals';

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

const PORTAL_META = {
  customer: {
    roleLabel: 'عميل',
    title: 'واجهة العميل',
    subtitle: 'CUSTOMER APP',
    badge: 'بوابة العملاء',
    color: 'blue',
    icon: User,
    description: 'شاشة خفيفة لمتابعة حافلات النقل، أرقام الانتظار بالمراكز الصحية، وإرشادات السياحة.',
    google: true,
  },
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
  enterprise: {
    roleLabel: 'موظف',
    title: 'واجهة الموظف والمؤسسة',
    subtitle: 'ENTERPRISE CONSOLE',
    badge: 'بوابة الموظفين',
    color: 'indigo',
    icon: Landmark,
    description: 'منصة تحكم لإدارة أساطيل النقل، تبريد اللقاحات، والأسوار الافتراضية السياحية.',
    google: false,
  },
};

const colorClasses = {
  blue: {
    active: 'bg-blue-950/20 border-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.2)]',
    idle: 'bg-slate-900/30 border-slate-800 hover:border-slate-700 hover:bg-slate-900/50',
    icon: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
    label: 'text-blue-400',
    btn: 'bg-blue-600 hover:bg-blue-500',
    glow: 'bg-blue-500/5 group-hover:bg-blue-500/10',
  },
  purple: {
    active: 'bg-purple-950/20 border-purple-500 shadow-[0_0_30px_rgba(168,85,247,0.2)]',
    idle: 'bg-slate-900/30 border-slate-800 hover:border-slate-700 hover:bg-slate-900/50',
    icon: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
    label: 'text-purple-400',
    btn: 'bg-purple-600 hover:bg-purple-500',
    glow: 'bg-purple-500/5 group-hover:bg-purple-500/10',
  },
  indigo: {
    active: 'bg-slate-900 border-indigo-500 shadow-[0_0_30px_rgba(99,102,241,0.2)]',
    idle: 'bg-slate-900/30 border-slate-800 hover:border-slate-700 hover:bg-slate-900/50',
    icon: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400',
    label: 'text-indigo-400',
    btn: 'bg-indigo-600 hover:bg-indigo-500',
    glow: 'bg-indigo-500/5 group-hover:bg-indigo-500/10',
  },
};

function GatewayChoiceCard({ portalId, isActive, onSelect, onContinue }) {
  const meta = PORTAL_META[portalId];
  const colors = colorClasses[meta.color];
  const Icon = meta.icon;

  return (
    <motion.div
      onClick={() => onSelect(portalId)}
      className={`cursor-pointer rounded-3xl border p-6 flex flex-col justify-between backdrop-blur-xl transition-all duration-300 relative group overflow-hidden ${
        isActive ? colors.active : colors.idle
      }`}
      whileHover={{ y: -4 }}
    >
      <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl transition-colors ${colors.glow}`} />
      <div className="space-y-4">
        <div className={`w-10 h-10 rounded-2xl border flex items-center justify-center ${colors.icon}`}>
          <Icon size={20} />
        </div>
        <div className="text-right">
          <span className={`text-[10px] font-black uppercase tracking-wider ${colors.label}`}>{meta.roleLabel}</span>
          <h3 className="text-lg font-bold text-white mt-1">{meta.title}</h3>
          <p className="text-slate-400 text-xs font-light leading-relaxed mt-2">{meta.description}</p>
        </div>
      </div>
      <div className="mt-8 pt-4 border-t border-slate-800/80">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onContinue(portalId);
          }}
          className={`w-full flex items-center justify-center gap-2 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-all ${colors.btn}`}
        >
          <span>متابعة إلى تسجيل الدخول</span>
          <ArrowRight size={13} />
        </button>
      </div>
    </motion.div>
  );
}

export default function AuthPage({ pathPortal = null, loginWithGoogle, login, error, setError }) {
  const [gatewaySelection, setGatewaySelection] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const isGateway = pathPortal === null;
  const loginPortal = pathPortal;
  const loginMeta = loginPortal ? PORTAL_META[loginPortal] : null;
  const LoginIcon = loginMeta?.icon;

  const handleContinueToLogin = (portalId) => {
    setGatewaySelection(portalId);
    navigateToPortal(portalId);
  };

  const handleGoogleLogin = async () => {
    if (!loginPortal) return;
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

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      localStorage.setItem('auth_portal_mode', 'enterprise');
      await login(email, password);
    } catch (err) {
      console.error('Email login error:', err);
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
              {isGateway ? 'الخطوة 1 · من أنت؟' : loginMeta.badge}
            </span>
            <h1 className="text-3xl sm:text-4xl font-black text-white mt-3">
              {isGateway ? 'اختر نوع حسابك' : `تسجيل الدخول · ${loginMeta.roleLabel}`}
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm font-light max-w-lg mx-auto">
              {isGateway
                ? 'حدّد إن كنت عميلاً، طالب IoT، أو موظفاً — ثم ستظهر صفحة الدخول المناسبة.'
                : loginMeta.description}
            </p>
            {!isGateway && (
              <p className="text-[10px] text-slate-500 font-mono mt-2">{getPortalPath(loginPortal)}</p>
            )}
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

        {isGateway ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
            {(['customer', 'student', 'enterprise']).map((id) => (
              <GatewayChoiceCard
                key={id}
                portalId={id}
                isActive={gatewaySelection === id}
                onSelect={setGatewaySelection}
                onContinue={handleContinueToLogin}
              />
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md"
          >
            <button
              type="button"
              onClick={() => navigateToGateway()}
              className="flex items-center gap-1.5 text-[11px] text-slate-500 hover:text-blue-400 mb-4 transition-colors cursor-pointer"
            >
              <ArrowLeft size={12} />
              <span>العودة لاختيار نوع الحساب</span>
            </button>

            <div className="rounded-3xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl p-6 shadow-2xl">
              <div className="text-center mb-6">
                <div
                  className={`w-12 h-12 rounded-2xl border flex items-center justify-center mx-auto mb-3 ${colorClasses[loginMeta.color].icon}`}
                >
                  {LoginIcon && <LoginIcon size={22} />}
                </div>
                <h3 className="text-xl font-bold text-white">{loginMeta.title}</h3>
                <span className={`text-[10px] font-mono ${colorClasses[loginMeta.color].label}`}>
                  {loginMeta.subtitle}
                </span>
              </div>

              {loginPortal === 'enterprise' ? (
                <form onSubmit={handleEmailLogin} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 text-right">
                      البريد الإلكتروني
                    </label>
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
                    <p className="text-[9px] text-slate-500 mt-2 text-right leading-relaxed">
                      حسابات تجريبية (كلمة المرور: admin123):
                      <br />
                      admin@enterprise.com · transport@iot365.gov · health@iot365.gov · tourism@iot365.gov · safety@iot365.gov
                    </p>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 text-right">
                      كلمة المرور
                    </label>
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
                    {loading ? <Loader2 size={14} className="animate-spin" /> : <Lock size={13} />}
                    <span>دخول لوحة القيادة</span>
                  </button>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2.5 bg-white text-slate-950 font-bold py-3 px-4 rounded-xl text-sm hover:bg-slate-100 transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 size={16} className="animate-spin text-slate-950" />
                  ) : (
                    <GoogleIcon />
                  )}
                  <span>دخول سريع بحساب Google</span>
                </button>
              )}

              {loginPortal === 'student' && (
                <p className="text-center text-[10px] text-purple-400/80 mt-4 font-medium">
                  مخصص لطلاب IoT والمطورين — ESP32 · MQTT · لوحة تحكم حية
                </p>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
