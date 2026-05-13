import { useState } from 'react';
import { Leaf, Loader2, Wifi, ShieldCheck, Zap } from 'lucide-react';

/* ── Google "G" colour-ring SVG ───────────────────────────────────────── */
const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
);

/* ── Feature pill ─────────────────────────────────────────────────────── */
const Feature = ({ icon: Icon, label }) => (
  <div className="flex items-center gap-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3">
    <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
      <Icon size={14} className="text-primary" />
    </div>
    <span className="text-slate-700 dark:text-white/60 text-xs font-medium">{label}</span>
  </div>
);

export default function AuthPage({ loginWithGoogle, error, setError }) {
  const [loading, setLoading] = useState(false);

  const handleGoogle = async () => {
    setError(null);
    setLoading(true);
    try {
      await loginWithGoogle();
    } catch {
      /* error already set inside hook */
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black flex items-center justify-center p-6 relative overflow-hidden">

      {/* ── Ambient glow blobs ─────────────────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-primary/[0.06] rounded-full blur-[120px]" />
        <div className="absolute -bottom-32 -right-32 w-[500px] h-[500px] bg-blue-500/[0.06] rounded-full blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-indigo-500/[0.03] rounded-full blur-[100px]" />
      </div>

      {/* ── Grid texture overlay ───────────────────────────────────────── */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.025]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.5) 1px,transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="w-full max-w-md relative z-10">

        {/* ── Logo ──────────────────────────────────────────────────────── */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-[72px] h-[72px] rounded-[22px] bg-primary/10 border border-primary/20 mb-5 shadow-[0_0_40px_rgba(74,222,128,0.12)]">
            <Leaf className="text-primary" size={34} />
          </div>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight">IoT Dashboard</h1>
          <p className="text-white/35 text-sm mt-2 tracking-wide">Smart Farm Management Platform</p>
        </div>

        {/* ── Card ──────────────────────────────────────────────────────── */}
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-3xl p-8 backdrop-blur-xl shadow-[0_24px_80px_rgba(0,0,0,0.5)]">

          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Welcome</h2>
            <p className="text-slate-600 dark:text-white/40 text-sm leading-relaxed">
              Sign in with your Google account to access<br />your IoT control dashboard.
            </p>
          </div>

          {/* ── Feature pills ─────────────────────────────────────────── */}
          <div className="grid grid-cols-3 gap-2 mb-8">
            <Feature icon={Wifi}        label="Real-time MQTT"   />
            <Feature icon={ShieldCheck} label="Secure Auth"      />
            <Feature icon={Zap}         label="Instant Access"   />
          </div>

          {/* ── Error banner ──────────────────────────────────────────── */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-300 text-sm rounded-2xl p-4 mb-5 text-center leading-relaxed">
              {error}
            </div>
          )}

          {/* ── Google button ─────────────────────────────────────────── */}
          <button
            id="btn-google-signin"
            onClick={handleGoogle}
            disabled={loading}
            className="
              w-full flex items-center justify-center gap-3
              bg-white hover:bg-white/90 active:scale-[0.98]
              text-gray-800 font-semibold text-sm
              py-3.5 rounded-2xl
              transition-all duration-200
              disabled:opacity-60 disabled:cursor-not-allowed
              shadow-[0_4px_24px_rgba(255,255,255,0.12)]
            "
          >
            {loading ? (
              <Loader2 size={20} className="animate-spin text-gray-500" />
            ) : (
              <GoogleIcon />
            )}
            {loading ? 'Connecting…' : 'Continue with Google'}
          </button>

          {/* ── Divider ───────────────────────────────────────────────── */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-white/[0.06]" />
            <span className="text-slate-400 dark:text-white/20 text-xs">secure · encrypted</span>
            <div className="flex-1 h-px bg-white/[0.06]" />
          </div>

          <p className="text-slate-500 dark:text-white/25 text-xs text-center leading-relaxed">
            By continuing you agree to our Terms of Service.<br />
            We never post to Google on your behalf.
          </p>
        </div>

        <p className="text-center text-white/15 text-xs mt-6">
          IoT SaaS Dashboard © 2026. Built for ESP32 Integration.
        </p>
      </div>
    </div>
  );
}
