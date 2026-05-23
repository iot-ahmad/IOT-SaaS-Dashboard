import { useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Wifi, ShieldCheck, Zap, Cpu } from 'lucide-react';
import { IoTDotFieldBackdrop } from './CanvasRevealBackground';

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

const Feature = ({ icon: Icon, label }) => (
  <div className="flex items-center gap-2.5 bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2.5 sm:px-4 sm:py-3">
    <div className="w-7 h-7 rounded-lg bg-primary/15 border border-primary/25 flex items-center justify-center shrink-0">
      <Icon size={14} className="text-primary" />
    </div>
    <span className="text-white/55 text-[11px] sm:text-xs font-medium leading-tight">{label}</span>
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
    <div className="relative flex min-h-screen w-full flex-col bg-black text-white overflow-hidden">
      <IoTDotFieldBackdrop wrapperClassName="absolute inset-0 z-0" />

      {/* Top pill badge */}
      <header
        className="fixed top-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2.5 pl-4 pr-4 py-2
                   rounded-full border border-[#333] bg-[#1f1f1f57] backdrop-blur-sm pointer-events-none"
        aria-hidden
      >
        <div className="relative w-5 h-5 flex items-center justify-center opacity-90">
          <span className="absolute w-1.5 h-1.5 rounded-full bg-gray-200 top-0 left-1/2 -translate-x-1/2" />
          <span className="absolute w-1.5 h-1.5 rounded-full bg-gray-200 left-0 top-1/2 -translate-y-1/2" />
          <span className="absolute w-1.5 h-1.5 rounded-full bg-gray-200 right-0 top-1/2 -translate-y-1/2" />
          <span className="absolute w-1.5 h-1.5 rounded-full bg-gray-200 bottom-0 left-1/2 -translate-x-1/2" />
        </div>
        <img src="/logo.png" className="w-4 h-4 object-contain" alt="" />
      </header>

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 pt-24 pb-12">
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
        >
          {/* Brand */}
          <div className="text-center mb-8 flex flex-col items-center">
            <div className="inline-flex items-center justify-center w-[120px] h-[120px] rounded-[22px] bg-white/5 border border-white/10 mb-5 shadow-[0_0_40px_rgba(59,130,246,0.15)] p-3">
              <img src="/logo.png" alt="IOT365 Logo" className="w-full h-full object-contain" />
            </div>
            <h1 className="text-[2.5rem] sm:text-[2.75rem] font-extrabold leading-[1.1] tracking-tight text-white">
              IOT<span className="text-primary">365</span>
            </h1>
            <p className="text-sm sm:text-base text-white/45 font-light mt-2">
              Smart IoT Dashboard Platform for ESP32
            </p>
          </div>

          {/* Card */}
          <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-7 sm:p-8 backdrop-blur-[12px] shadow-[0_24px_80px_rgba(0,0,0,0.55)]">
            <div className="text-center mb-7">
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">Welcome</h2>
              <p className="text-white/45 text-sm leading-relaxed">
                منصة متكاملة للتحكم بأجهزة ESP32 عبر MQTT
                <br />
                <span className="text-white/30 text-xs">Connect · Monitor · Automate</span>
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-7">
              <Feature icon={Wifi} label="Real-time MQTT" />
              <Feature icon={ShieldCheck} label="Secure Auth" />
              <Feature icon={Zap} label="Instant Access" />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/25 text-red-200 text-sm rounded-2xl p-4 mb-5 text-center leading-relaxed">
                {error}
              </div>
            )}

            {/* Google button — transparent/ghost style */}
            <button
              id="btn-google-signin"
              type="button"
              onClick={handleGoogle}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 border border-white/20 bg-white/[0.04] hover:bg-white/[0.09] hover:border-white/30 backdrop-blur-sm text-white font-semibold py-3 px-5 rounded-2xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {loading ? (
                <Loader2 size={20} className="animate-spin text-white/70" />
              ) : (
                <GoogleIcon />
              )}
              {loading ? 'Connecting…' : 'Continue with Google'}
            </button>

            <div className="flex items-center gap-4 my-6">
              <div className="h-px bg-white/10 flex-1" />
              <span className="text-white/35 text-xs whitespace-nowrap">secure · encrypted</span>
              <div className="h-px bg-white/10 flex-1" />
            </div>

            <p className="text-white/25 text-xs text-center leading-relaxed">
              By continuing you agree to our Terms of Service.
              <br />
              We never post to Google on your behalf.
            </p>
          </div>

          {/* Footer credits */}
          <div className="text-center mt-8 space-y-1">
            <p className="text-white/20 text-xs">
              IOT365 Platform © 2026
            </p>
            <p className="text-white/30 text-xs font-medium">
              Built &amp; Developed by{' '}
              <span className="text-primary/70">Ahmad Al-Batayneh</span>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
