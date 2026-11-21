import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { GraduationCap, ArrowLeft, Loader2, LayoutDashboard, Cpu, Zap, BellRing } from 'lucide-react';
import { WaveBackground } from './ui/WaveBackground';
import SupportModal from './SupportModal';

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
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showSupport, setShowSupport] = useState(false);

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
      title: 'Interactive Dashboards',
      desc: 'Design and customize real-time dashboards to visualize sensor telemetry and control hardware with a single click.',
      icon: <LayoutDashboard size={22} className="text-primary" />
    },
    {
      title: 'Real-Time MQTT Connectivity',
      desc: 'Instant, secure connection for ESP32 and IoT hardware over TLS-encrypted MQTT with ultra-low latency.',
      icon: <Cpu size={22} className="text-primary" />
    },
    {
      title: 'Smart Automations & Rules',
      desc: 'Build automated rules and scenarios to trigger your actuators automatically based on live sensor thresholds.',
      icon: <Zap size={22} className="text-primary" />
    },
    {
      title: 'Instant Alerts & Diagnostics',
      desc: 'Smart notification and physical AI diagnostic engine that monitors device health and prevents failures early.',
      icon: <BellRing size={22} className="text-primary" />
    }
  ];

  return (
    <div
      dir="ltr"
      className="relative flex min-h-screen w-full flex-col bg-background text-foreground overflow-y-auto overflow-x-hidden scroll-smooth font-sans select-none"
    >
      {/* Dynamic Wave & Grain Background */}
      <WaveBackground />

      {/* ── Header ── */}
      <header className="fixed top-0 left-0 right-0 z-20 w-full px-6 py-6 md:px-12 flex items-center justify-between">
        {/* Left: Brand */}
        <div className="flex items-center select-none">
          <img src="/logo_horizontal.svg" alt="IOT365" className="w-24 h-6 object-contain" />
        </div>

        {/* Middle: Links */}
        <div className="hidden md:flex items-center gap-8 text-[11px] font-bold tracking-widest text-muted-foreground uppercase">
          <a href="#features" onClick={handleNavToFeatures} className="hover:text-foreground transition-colors">Features</a>
          <a href="#features" onClick={handleNavToFeatures} className="hover:text-foreground transition-colors">Documentation</a>
          <button onClick={() => setShowSupport(true)} className="hover:text-foreground transition-colors cursor-pointer bg-transparent border-0 p-0 text-[11px] font-bold tracking-widest uppercase">Support</button>
        </div>

        {/* Right: Toggle Button */}
        <div>
          <button
            onClick={() => { setError(null); setShowLogin(!showLogin); }}
            className="border border-border hover:border-primary/50 px-5 py-2 rounded-sm text-[10px] font-black tracking-widest text-foreground hover:bg-muted transition-all duration-300 cursor-pointer uppercase"
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
                {/* Lime Subtitle Badge */}
                <span className="text-primary text-xs font-extrabold tracking-[0.25em] uppercase mb-4 opacity-90">
                  SMART IOT CLOUD PLATFORM
                </span>

                {/* Large Outline/Solid Typography Title */}
                <div className="flex flex-col items-center mb-8">
                  <img 
                    src="/logo_horizontal.svg" 
                    alt="IOT365 Logo" 
                    className="w-64 sm:w-80 md:w-[400px] h-auto object-contain select-none mb-3" 
                  />
                  <h1 
                    className="text-6xl sm:text-8xl md:text-9xl font-black tracking-tighter leading-none select-none uppercase"
                    style={{ 
                      WebkitTextStroke: '1px rgba(240, 240, 232, 0.35)', 
                      color: 'transparent' 
                    }}
                  >
                    GATEWAY
                  </h1>
                </div>

                {/* Website Description */}
                <p
                  className="text-muted-foreground text-sm sm:text-base font-light leading-relaxed max-w-xl mb-10 text-center"
                >
                  Interactive cloud platform to connect, simulate, and monitor IoT devices in real time. Direct hardware control for{' '}
                  <code className="bg-muted border border-border text-primary px-1.5 py-0.5 rounded font-mono text-xs">ESP32</code>
                  {' '}over isolated{' '}
                  <code className="bg-muted border border-border text-primary px-1.5 py-0.5 rounded font-mono text-xs">MQTT</code>
                  {' '}with zero infrastructure hassle.
                </p>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center justify-center gap-4">
                  <button
                    onClick={() => setShowLogin(true)}
                    className="px-8 py-3.5 bg-primary text-primary-foreground font-extrabold rounded-full hover:bg-primary/90 hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer text-xs sm:text-sm tracking-widest uppercase"
                  >
                    GET STARTED
                  </button>
                  <button
                    onClick={() => navigate('/hub')}
                    className="px-8 py-3.5 bg-transparent text-foreground border border-border font-extrabold rounded-full hover:bg-muted hover:border-primary/40 hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer text-xs sm:text-sm tracking-widest uppercase"
                  >
                    BROWSE PROJECTS
                  </button>
                </div>
              </div>

              {/* Features Section */}
              <section
                id="features"
                className="w-full max-w-5xl py-24 px-6 flex flex-col items-center justify-center text-center mt-12 scroll-mt-24"
              >
                <span className="text-primary text-[10px] font-extrabold tracking-[0.2em] uppercase mb-3">
                  PLATFORM CAPABILITIES
                </span>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground mb-16 tracking-tight">
                  Complete Ecosystem for IoT Hardware
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full text-left">
                  {featuresList.map((feat, idx) => (
                    <div 
                      key={idx} 
                      className="p-8 rounded-3xl border border-border bg-card hover:border-primary/40 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between mb-6">
                        {feat.icon}
                        <span className="text-primary text-xs font-mono font-bold">0{idx + 1}</span>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-foreground mb-2">{feat.title}</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">{feat.desc}</p>
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
                  className="w-full bg-card border border-border text-muted-foreground text-xs rounded-2xl p-4 mb-4 text-center leading-relaxed"
                >
                  {error}
                </div>
              )}

              {/* Card */}
              <div className="w-full rounded-3xl border border-border bg-card p-8 shadow-2xl relative overflow-hidden flex flex-col items-center">
                <div className="text-center mb-8">
                  <div className="flex items-center justify-center mx-auto mb-4 text-primary">
                    <GraduationCap size={26} className="text-primary" />
                  </div>
                  <h2 className="text-2xl font-black text-foreground mb-1.5 tracking-tight">
                    Sign In
                  </h2>
                  <p className="text-[10px] font-mono tracking-[0.2em] text-muted-foreground uppercase">
                    IOT STUDENT · SANDBOX GATEWAY
                  </p>
                </div>

                {/* Google login button */}
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 bg-muted hover:bg-secondary text-foreground font-semibold py-4 px-6 rounded-2xl text-sm border border-border hover:border-primary/40 transition-all duration-300 disabled:opacity-40 cursor-pointer"
                >
                  {loading ? (
                    <Loader2 size={18} className="animate-spin text-primary" />
                  ) : (
                    <GoogleIcon />
                  )}
                  <span>Continue with Google</span>
                </button>

                {/* Back button */}
                <button
                  onClick={() => { setError(null); setShowLogin(false); }}
                  className="mt-6 text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ArrowLeft size={12} className="text-primary" />
                  <span>Back to Home</span>
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
          <div className="w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center text-[10px] font-black text-primary">
            AB
          </div>
          <div className="flex flex-col text-left">
            <span className="font-extrabold text-foreground text-[11px] leading-none">Ahmad Batayneh</span>
            <span className="text-[9px] text-muted-foreground leading-none mt-0.5 font-mono">@iot-ahmad</span>
          </div>
        </div>

        {/* Right: Info */}
        <div className="text-[9px] tracking-[0.2em] text-muted-foreground uppercase font-mono text-center md:text-right">
          BASED ON MQTT &amp; ESP32 · SECURE PORTAL
        </div>
      </footer>
      <SupportModal isOpen={showSupport} onClose={() => setShowSupport(false)} />
    </div>
  );
}
