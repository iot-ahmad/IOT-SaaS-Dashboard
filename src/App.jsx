import { useState } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import AuthPage from './components/AuthPage';
import { FarmView, HomeView, OfficeView } from './components/Views';
import UniversalController from './components/UniversalController';
import { DevicesView, AutomationsToolView, AlertsView, SettingsView, LiveTerminal } from './components/ToolViews';
import { useMqtt } from './hooks/useMqtt';
import { useAuth } from './hooks/useAuth';
import { Loader2, Mail } from 'lucide-react';

function App() {
  const {
    user,
    loading: authLoading,
    error: authError,
    login,
    signup,
    loginWithGoogle,
    logout,
    setError,
    registrationSuccessMessage,
    verificationNotice,
    verificationIsResend,
    unverifiedLoginEmail,
    clearUnverifiedLoginEmail,
    resendVerificationEmail,
    clearVerificationNotice,
    clearRegistrationSuccess,
  } = useAuth();

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0F1115] flex items-center justify-center">
        <Loader2 className="text-primary animate-spin" size={40} />
      </div>
    );
  }

  if (!user) {
    return (
      <AuthPage
        login={login}
        signup={signup}
        loginWithGoogle={loginWithGoogle}
        error={authError}
        setError={setError}
        registrationSuccessMessage={registrationSuccessMessage}
        verificationNotice={verificationNotice}
        verificationIsResend={verificationIsResend}
        unverifiedLoginEmail={unverifiedLoginEmail}
        clearUnverifiedLoginEmail={clearUnverifiedLoginEmail}
        resendVerificationEmail={resendVerificationEmail}
        clearVerificationNotice={clearVerificationNotice}
        clearRegistrationSuccess={clearRegistrationSuccess}
      />
    );
  }

  if (!user.emailVerified) {
    return (
      <div className="min-h-screen bg-[#0F1115] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-full max-w-md bg-white/[0.03] border border-white/10 rounded-3xl p-8 backdrop-blur-md">
          <div className="w-16 h-16 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Mail className="text-primary" size={32} />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Verify Your Email</h2>
          <p className="text-white/60 mb-8 leading-relaxed">
            We've sent a verification link to <span className="text-white font-medium">{user.email}</span>. 
            Please check your inbox and verify your account to access the dashboard.
          </p>
          
          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-primary hover:bg-primary/90 text-black font-bold py-3 rounded-xl transition-all"
            >
              I've Verified My Email
            </button>
            <button
              onClick={() => void logout()}
              className="w-full bg-white/5 hover:bg-white/10 text-white/60 py-3 rounded-xl transition-all border border-white/10"
            >
              Sign out
            </button>
          </div>
          
          <p className="mt-6 text-xs text-white/20">
            Can't find the email? Check your Spam folder or try signing in again to resend.
          </p>
        </div>
      </div>
    );
  }

  return <Dashboard user={user} logout={logout} />;
}

function Dashboard({ user, logout }) {
  const [activeWorkspace, setActiveWorkspace] = useState('controller');
  const [activeTool, setActiveTool] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Use Firebase UID as the MQTT topic prefix - unique per user
  const { isConnected, messages, deviceStates, lastSeen, publish, userUID } = useMqtt(user.uid);

  const handleSetWorkspace = (workspaceId) => {
    setActiveWorkspace(workspaceId);
    setActiveTool(null);
  };

  const handleSetTool = (toolId) => {
    setActiveTool(toolId);
    setActiveWorkspace(null);
  };

  const renderContent = () => {
    if (activeTool) {
      switch (activeTool) {
        case 'devices': return <DevicesView userUID={userUID} lastSeen={lastSeen} />;
        case 'automations': return <AutomationsToolView publish={publish} userUID={userUID} />;
        case 'alerts': return <AlertsView />;
        case 'settings': return <SettingsView userUID={userUID} user={user} logout={logout} />;
        default: return <DevicesView userUID={userUID} lastSeen={lastSeen} />;
      }
    }

    switch (activeWorkspace) {
      case 'home': return <HomeView />;
      case 'farm': return <FarmView deviceStates={deviceStates} publish={publish} />;
      case 'office': return <OfficeView />;
      case 'controller': return <UniversalController deviceStates={deviceStates} publish={publish} storageScopeId={user.uid} />;
      default: return <UniversalController deviceStates={deviceStates} publish={publish} storageScopeId={user.uid} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#0F1115] text-white flex selection:bg-primary/30">
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-20 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
      
      <div className={`fixed inset-y-0 left-0 z-30 transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:block ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar 
          activeWorkspace={activeWorkspace} 
          setActiveWorkspace={handleSetWorkspace}
          activeTool={activeTool}
          setActiveTool={handleSetTool}
          user={user}
          logout={logout}
        />
      </div>

      <main className="flex-1 flex flex-col min-w-0 md:pl-64">
        <Header 
          activeWorkspace={activeWorkspace}
          activeTool={activeTool}
          isConnected={isConnected}
          toggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
        />
        
        <div className="flex-1 p-6 md:p-8 pb-40 overflow-y-auto">
          <div className="max-w-7xl mx-auto space-y-6">
            {renderContent()}
          </div>
        </div>

        <LiveTerminal messages={messages} isConnected={isConnected} />
      </main>
    </div>
  );
}

export default App;
