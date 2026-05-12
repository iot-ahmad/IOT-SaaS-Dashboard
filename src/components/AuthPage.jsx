import { useState } from 'react';
import { Leaf, Mail, Lock, User, Eye, EyeOff, Loader2, Inbox, Send, Hash, CheckCircle2 } from 'lucide-react';

export default function AuthPage({
  login,
  signup,
  error,
  setError,
  registrationSuccessMessage,
  verificationNotice,
  verificationIsResend,
  unverifiedLoginEmail,
  clearUnverifiedLoginEmail,
  resendVerificationEmail,
  clearVerificationNotice,
  clearRegistrationSuccess,
}) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Email/Basic, 2: Verification/Completion

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        if (step === 1) {
          // In a real OTP system, we would send the code here.
          // For Firebase, we'll proceed to show the code field and basic info.
          setStep(2);
          setLoading(false);
          return;
        }
        await signup(email, password, name);
        // After signup, the user is logged in (unverified), useAuth handles the redirect.
      }
    } catch {
      // error is set by the hook
    }
    setLoading(false);
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    setStep(1);
    setError(null);
    clearRegistrationSuccess?.();
    clearVerificationNotice?.();
    clearUnverifiedLoginEmail?.();
  };

  return (
    <div className="min-h-screen bg-[#0F1115] flex items-center justify-center p-6">
      {/* Background glow effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 mb-4">
            <Leaf className="text-primary" size={32} />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">IoT Dashboard</h1>
          <p className="text-white/40 text-sm mt-2">Smart Farm Management Platform</p>
        </div>

        {/* Auth Card */}
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-8 backdrop-blur-md">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-white mb-1">
                {isLogin ? 'Welcome Back' : step === 1 ? 'Create Account' : 'Verify & Complete'}
              </h2>
              <p className="text-white/40 text-sm">
                {isLogin ? 'Sign in to your dashboard' : step === 1 ? 'Step 1: Basic Information' : 'Step 2: Account Verification'}
              </p>
            </div>
            {!isLogin && (
              <div className="flex gap-1">
                <div className={`w-2 h-2 rounded-full ${step === 1 ? 'bg-primary' : 'bg-primary/20'}`}></div>
                <div className={`w-2 h-2 rounded-full ${step === 2 ? 'bg-primary' : 'bg-primary/20'}`}></div>
              </div>
            )}
          </div>

          {registrationSuccessMessage && (
            <div className="bg-emerald-500/10 border border-emerald-500/25 text-emerald-100 text-sm rounded-xl p-4 mb-6 flex gap-3">
              <CheckCircle2 className="shrink-0 mt-0.5 text-emerald-400" size={20} />
              <p className="leading-relaxed">{registrationSuccessMessage}</p>
            </div>
          )}

          {error && (step === 2 || isLogin) && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-300 text-sm rounded-xl p-3 mb-4 text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isLogin || step === 1 ? (
              <>
                {!isLogin && (
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Full Name"
                      required={!isLogin}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50 transition-colors"
                    />
                  </div>
                )}
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email Address"
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50 transition-colors"
                  />
                </div>
                {isLogin && (
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Password"
                      required
                      minLength={6}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-12 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50 transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="space-y-4 animate-fadeIn">
                <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 mb-2">
                  <p className="text-xs text-primary/80 mb-1 font-medium uppercase tracking-wider">Verifying Email</p>
                  <p className="text-sm text-white/70">{email}</p>
                </div>

                <div className="relative">
                  <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                  <input
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    placeholder="Verification Code (Link in email)"
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50 transition-colors font-mono tracking-widest"
                  />
                </div>

                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Set Account Password"
                    required
                    minLength={6}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-12 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50 transition-colors"
                  />
                </div>
                
                <p className="text-[10px] text-white/30 text-center px-4">
                  Firebase uses verification links. Click the link in your email, then click "Complete Registration" below.
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90 text-black font-bold py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : null}
              {isLogin ? 'Sign In' : step === 1 ? 'Next Step' : 'Complete Registration'}
            </button>
            
            {!isLogin && step === 2 && (
              <button 
                type="button" 
                onClick={() => setStep(1)}
                className="w-full text-white/40 text-xs hover:text-white/60 transition-colors py-2"
              >
                Go Back to Step 1
              </button>
            )}
          </form>

          <div className="mt-6 text-center">
            <p className="text-white/40 text-sm">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button onClick={switchMode} className="text-primary hover:text-primary/80 font-medium transition-colors">
                {isLogin ? 'Sign Up' : 'Sign In'}
              </button>
            </p>
          </div>
        </div>

        <p className="text-center text-white/20 text-xs mt-6">
          IoT SaaS Dashboard © 2026. Built for ESP32 Integration.
        </p>
      </div>
    </div>
  );
}

