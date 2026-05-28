import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import AuthPage from './components/AuthPage';
import { IoTDotFieldBackdrop } from './components/CanvasRevealBackground';
import { FarmView, HomeView, OfficeView } from './components/Views';
import UniversalController from './components/UniversalController';
import { DevicesView, AutomationsToolView, AlertsView, SettingsView, LiveTerminal } from './components/ToolViews';
import NewDevicesView from './components/DevicesView';
import DeveloperGuide from './components/DeveloperGuide';
import { useMqtt } from './hooks/useMqtt';
import { useAuth } from './hooks/useAuth';
import { Loader2 } from 'lucide-react';
import { WORKSPACES } from './data/mockData';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

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
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Dynamic Workspaces State
  const [customWorkspaces, setCustomWorkspaces] = useState(WORKSPACES);

  useEffect(() => {
    const fetchWorkspaces = async () => {
      try {
        const docRef = doc(db, 'users', user.uid, 'settings', 'workspaces');
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          setCustomWorkspaces(snap.data().list || WORKSPACES);
        } else {
          // If no workspaces in firestore, try loading from legacy local storage
          const saved = localStorage.getItem(`workspaces_${user.uid}`);
          if (saved) {
            const parsed = JSON.parse(saved);
            setCustomWorkspaces(parsed);
            await setDoc(docRef, { list: parsed });
          }
        }
      } catch (err) {
        console.error("Failed to load workspaces from Firestore", err);
      }
    };
    fetchWorkspaces();
  }, [user.uid]);

  const saveWorkspaces = async (list) => {
    setCustomWorkspaces(list);
    try {
      const docRef = doc(db, 'users', user.uid, 'settings', 'workspaces');
      await setDoc(docRef, { list });
    } catch (err) {
      console.error("Failed to save workspaces to Firestore", err);
    }
  };

  const handleAddWorkspace = async (name, esp32Prefix) => {
    const newWs = {
      id: `custom_${Date.now()}`,
      name,
      icon: 'Gamepad2',
      isCustom: true,
      esp32Prefix: esp32Prefix || ''
    };
    const updated = [...customWorkspaces, newWs];
    saveWorkspaces(updated);
    setActiveWorkspace(newWs.id);
  };

  const handleRenameWorkspace = (id, newName) => {
    const updated = customWorkspaces.map(ws => ws.id === id ? { ...ws, name: newName } : ws);
    saveWorkspaces(updated);
  };

  const handleDeleteWorkspace = (id) => {
    const updated = customWorkspaces.filter(ws => ws.id !== id);
    saveWorkspaces(updated);
    if (activeWorkspace === id) setActiveWorkspace('home');
  };

  // Use Firebase UID as the MQTT topic prefix - unique per user
  const { isConnected, messages, deviceStates, lastSeen, publish, userUID } = useMqtt(user.uid);

  const handleSetWorkspace = (workspaceId) => {
    setActiveWorkspace(workspaceId);
    setActiveTool(null);
    setIsMobileMenuOpen(false);
  };

  const handleSetTool = (toolId) => {
    setActiveTool(toolId);
    setActiveWorkspace(null);
    setIsMobileMenuOpen(false);
  };

  const renderContent = () => {
    if (activeTool) {
      switch (activeTool) {
        case 'devices': return <NewDevicesView userUID={userUID} lastSeen={lastSeen} deviceStates={deviceStates} />;
        case 'automations': return <AutomationsToolView publish={publish} userUID={userUID} />;
        case 'alerts': return <AlertsView userUID={userUID} />;
        case 'settings': return <SettingsView userUID={userUID} user={user} logout={logout} />;
        case 'developer': return <DeveloperGuide userUID={user.uid} />;
        default: return <DevicesView userUID={userUID} lastSeen={lastSeen} />;
      }
    }

    const currentWorkspace = customWorkspaces.find(ws => ws.id === activeWorkspace);

    if (currentWorkspace && currentWorkspace.id === 'home') {
      return (
        <HomeView 
          workspaces={customWorkspaces} 
          onAddWorkspace={handleAddWorkspace} 
          setActiveWorkspace={handleSetWorkspace} 
        />
      );
    }
    if (currentWorkspace && currentWorkspace.id === 'controller') return <UniversalController deviceStates={deviceStates} publish={publish} storageScopeId={user.uid} userUID={user.uid} />;
    
    // For custom added dashboards
    if (currentWorkspace && currentWorkspace.isCustom) {
      return (
        <UniversalController 
          deviceStates={deviceStates} 
          publish={publish} 
          storageScopeId={`${user.uid}_${currentWorkspace.id}`} 
          customTitle={currentWorkspace.name}
          esp32Prefix={currentWorkspace.esp32Prefix}
          userUID={user.uid}
        />
      );
    }

    return (
      <HomeView 
        workspaces={customWorkspaces} 
        onAddWorkspace={handleAddWorkspace} 
        setActiveWorkspace={setActiveWorkspace} 
      />
    );
  };

  const sidebarW = isSidebarCollapsed ? 'w-16' : 'w-64';
  const mainPl = isSidebarCollapsed ? 'md:pl-16' : 'md:pl-64';

  return (
     <div className="relative min-h-screen bg-slate-50 dark:bg-black text-slate-900 dark:text-white flex selection:bg-primary/30">
      <IoTDotFieldBackdrop wrapperClassName="fixed inset-0 z-0 hidden dark:block" />

      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm z-20 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
      
      <div className={`fixed inset-y-0 left-0 z-30 ${sidebarW} transform transition-all duration-300 ease-in-out md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar 
          workspaces={customWorkspaces}
          activeWorkspace={activeWorkspace} 
          setActiveWorkspace={handleSetWorkspace}
          activeTool={activeTool}
          setActiveTool={handleSetTool}
          user={user}
          logout={logout}
          onAddWorkspace={handleAddWorkspace}
          onRenameWorkspace={handleRenameWorkspace}
          onDeleteWorkspace={handleDeleteWorkspace}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(v => !v)}
        />
      </div>

      <main className={`relative z-10 flex-1 flex flex-col min-w-0 transition-all duration-300 ${mainPl}`}>
        <Header 
          activeWorkspace={activeWorkspace}
          activeTool={activeTool}
          isConnected={isConnected}
          toggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          customWorkspaces={customWorkspaces}
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleSidebar={() => setIsSidebarCollapsed(v => !v)}
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
