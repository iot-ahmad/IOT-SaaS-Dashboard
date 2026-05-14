import { useState } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import AuthPage from './components/AuthPage';
import { FarmView, HomeView, OfficeView } from './components/Views';
import UniversalController from './components/UniversalController';
import { DevicesView, AutomationsToolView, AlertsView, SettingsView, LiveTerminal } from './components/ToolViews';
import DeveloperGuide from './components/DeveloperGuide';
import { useMqtt } from './hooks/useMqtt';
import { useAuth } from './hooks/useAuth';
import { Loader2 } from 'lucide-react';
import { WORKSPACES } from './data/mockData';

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
      <div className="min-h-screen bg-slate-50 dark:bg-black flex items-center justify-center">
        <Loader2 className="text-primary animate-spin" size={40} />
      </div>
    );
  }

  if (!user) {
    return (
      <AuthPage
        loginWithGoogle={loginWithGoogle}
        error={authError}
        setError={setError}
      />
    );
  }

  return <Dashboard user={user} logout={logout} />;
}

function Dashboard({ user, logout }) {
  const [activeWorkspace, setActiveWorkspace] = useState('home');
  const [activeTool, setActiveTool] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Dynamic Workspaces State
  const [customWorkspaces, setCustomWorkspaces] = useState(() => {
    const saved = localStorage.getItem(`workspaces_${user.uid}`);
    return saved ? JSON.parse(saved) : WORKSPACES;
  });

  const handleAddWorkspace = (name, esp32Prefix) => {
    const newWs = {
      id: `custom_${Date.now()}`,
      name,
      icon: 'Gamepad2',
      isCustom: true,
      esp32Prefix: esp32Prefix || ''
    };
    const updated = [...customWorkspaces, newWs];
    setCustomWorkspaces(updated);
    localStorage.setItem(`workspaces_${user.uid}`, JSON.stringify(updated));
    setActiveWorkspace(newWs.id);
  };

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
        case 'developer': return <DeveloperGuide userUID={user.uid} />;
        default: return <DevicesView userUID={userUID} lastSeen={lastSeen} />;
      }
    }

    const currentWorkspace = customWorkspaces.find(ws => ws.id === activeWorkspace);

    if (currentWorkspace && currentWorkspace.id === 'home') return <HomeView />;
    if (currentWorkspace && currentWorkspace.id === 'controller') return <UniversalController deviceStates={deviceStates} publish={publish} storageScopeId={user.uid} />;
    
    // For custom added dashboards
    if (currentWorkspace && currentWorkspace.isCustom) {
      return (
        <UniversalController 
          deviceStates={deviceStates} 
          publish={publish} 
          storageScopeId={`${user.uid}_${currentWorkspace.id}`} 
          customTitle={currentWorkspace.name}
          esp32Prefix={currentWorkspace.esp32Prefix}
        />
      );
    }

    return <HomeView />;
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black text-slate-900 dark:text-white flex selection:bg-primary/30">
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm z-20 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
      
      <div className={`fixed inset-y-0 left-0 z-30 transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:block ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar 
          workspaces={customWorkspaces}
          activeWorkspace={activeWorkspace} 
          setActiveWorkspace={handleSetWorkspace}
          activeTool={activeTool}
          setActiveTool={handleSetTool}
          user={user}
          logout={logout}
          onAddWorkspace={handleAddWorkspace}
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
