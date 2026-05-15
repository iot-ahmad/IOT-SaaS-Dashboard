import { useState } from 'react';
import { motion } from 'framer-motion';
import { Leaf, Loader2, Wifi, ShieldCheck, Zap } from 'lucide-react';
import { Button } from '@/components/ui/neon-button';
import { IoTDotFieldBackdrop } from './CanvasRevealBackground';

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

const Feature = ({ icon: Icon, label }) => (
  <div className="flex items-center gap-2.5 bg-white/[0.04] border border-white/10 rounded-full px-3 py-2.5 sm:rounded-xl sm:px-4 sm:py-3">
    <div className="w-7 h-7 rounded-full sm:rounded-lg bg-primary/15 border border-primary/25 flex items-center justify-center shrink-0">
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
        <Leaf className="text-primary w-4 h-4" aria-hidden />
      </header>

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 pt-24 pb-12">
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
        >
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-[72px] h-[72px] rounded-[22px] bg-white/5 border border-white/10 mb-5 shadow-[0_0_40px_rgba(16,185,129,0.15)]">
              <Leaf className="text-primary" size={34} />
            </div>
            <h1 className="text-[2.25rem] sm:text-[2.5rem] font-bold leading-[1.1] tracking-tight text-white">
              IoT Dashboard
            </h1>
            <p className="text-base sm:text-lg text-white/55 font-light mt-2">Smart Farm Management Platform</p>
          </div>

          <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-7 sm:p-8 backdrop-blur-[12px] shadow-[0_24px_80px_rgba(0,0,0,0.55)]">
            <div className="text-center mb-7">
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">Welcome</h2>
              <p className="text-white/45 text-sm leading-relaxed">
                Sign in with your Google account to access
                <br />
                your IoT control dashboard.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-7">
              <Feature icon={Wifi} label="Real-time MQTT" />
              <Feature icon={ShieldCheck} label="Secure Auth" />
              <Feature icon={Zap} label="Instant Access" />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/25 text-red-200 text-sm rounded-2xl p-4 mb-5 text-center leading-relaxed">
                {error}
              </div>
            )}

            <Button
              id="btn-google-signin"
              type="button"
              onClick={handleGoogle}
              disabled={loading}
              variant="ghost"
              className="w-full mx-0 flex items-center justify-center gap-3 py-3.5 px-4 font-medium text-sm text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 size={20} className="animate-spin text-white/70" />
              ) : (
                <GoogleIcon />
              )}
              {loading ? 'Connecting…' : 'Continue with Google'}
            </Button>

            <div className="flex items-center gap-4 my-6">
              <div className="h-px bg-white/10 flex-1" />
              <span className="text-white/35 text-xs whitespace-nowrap">secure · encrypted</span>
              <div className="h-px bg-white/10 flex-1" />
            </div>

            <p className="text-white/30 text-xs text-center leading-relaxed">
              By continuing you agree to our Terms of Service.
              <br />
              We never post to Google on your behalf.
            </p>
          </div>

          <p className="text-center text-white/25 text-xs mt-8">
            IoT Dashboard © 2026. Built for ESP32 Integration.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
